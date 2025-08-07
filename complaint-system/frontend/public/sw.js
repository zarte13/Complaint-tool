/*
  Service Worker for Offline Mode (DA-005)
  - Caches navigation shell and GET requests (static/assets and API GET)
  - Queues mutating requests (POST/PUT/DELETE) in IndexedDB
  - Uses Background Sync to flush queue when back online
  - Emits client messages for conflicts and status updates
*/

const APP_CACHE = 'app-cache-v1';
const API_GET_CACHE = 'api-get-cache-v1';
const OFFLINE_DB_NAME = 'offline-db';
const REQUESTS_STORE = 'requests';
const CONFLICTS_STORE = 'conflicts';
const SYNC_TAG = 'sync-offline-requests';

// Precache minimal shell
const SHELL_FILES = [
  '/',
  '/index.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => cache.addAll(SHELL_FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clean old caches
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![APP_CACHE, API_GET_CACHE].includes(k))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

// IndexedDB helpers
function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(OFFLINE_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(REQUESTS_STORE)) {
        db.createObjectStore(REQUESTS_STORE, { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(CONFLICTS_STORE)) {
        db.createObjectStore(CONFLICTS_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAll(storeName) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

async function removeById(storeName, id) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(id).onsuccess = () => resolve(true);
    tx.onerror = () => reject(tx.error);
  });
}

async function addToStore(storeName, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).add(value);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function isApiGet(request) {
  try {
    const url = new URL(request.url);
    return request.method === 'GET' && url.pathname.startsWith('/api/');
  } catch (_) {
    return false;
  }
}

function isNavigationRequest(event) {
  return event.request.mode === 'navigate';
}

// Fetch strategy
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Handle navigation: SPA shell
  if (isNavigationRequest(event)) {
    event.respondWith(
      (async () => {
        try {
          const networkResp = await fetch(req);
          const cache = await caches.open(APP_CACHE);
          cache.put('/index.html', networkResp.clone());
          return networkResp;
        } catch (_) {
          const cache = await caches.open(APP_CACHE);
          const cached = await cache.match('/index.html');
          return cached || new Response('<h1>Offline</h1>', { headers: { 'Content-Type': 'text/html' } });
        }
      })()
    );
    return;
  }

  // Cache GET API and static assets with a network-first strategy
  if (isApiGet(req)) {
    event.respondWith(
      (async () => {
        try {
          const networkResp = await fetch(req);
          const cache = await caches.open(API_GET_CACHE);
          cache.put(req, networkResp.clone());
          return networkResp;
        } catch (_) {
          const cache = await caches.open(API_GET_CACHE);
          const cached = await cache.match(req);
          if (cached) return cached;
          return new Response(JSON.stringify({ error: 'offline' }), { status: 503, headers: { 'Content-Type': 'application/json' } });
        }
      })()
    );
    return;
  }

  // Default: try network, fall back to cache for static files
  event.respondWith(
    (async () => {
      try {
        return await fetch(req);
      } catch (_) {
        const cache = await caches.open(APP_CACHE);
        const cached = await cache.match(req);
        if (cached) return cached;
        throw _;
      }
    })()
  );
});

// Background Sync to flush queued mutations
self.addEventListener('sync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(flushQueue());
  }
});

async function flushQueue() {
  const requests = await getAll(REQUESTS_STORE);
  for (const entry of requests) {
    try {
      const { id, url, method, headers, body } = entry;
      const init = { method, headers: headers || {} };
      if (body != null) {
        init.body = typeof body === 'string' ? body : JSON.stringify(body);
      }
      const resp = await fetch(url, init);
      if (!resp.ok) {
        if (resp.status === 409 || resp.status === 412) {
          // Conflict: move to conflicts store and notify clients
          await addToStore(CONFLICTS_STORE, { url, method, headers, body, status: resp.status, timestamp: Date.now() });
          await removeById(REQUESTS_STORE, id);
          notifyClients({ type: 'sync-conflict', url, method, status: resp.status });
          continue;
        }
        // Keep in queue for retry on other errors
        continue;
      }
      await removeById(REQUESTS_STORE, id);
      notifyClients({ type: 'sync-success', url, method });
    } catch (err) {
      // Network or other errors: keep request in queue
      // Will retry on next sync/online
    }
  }
}

function notifyClients(message) {
  self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => client.postMessage(message));
  });
}

// Listen for messages from the app to trigger manual flush
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'flush-queue') {
    event.waitUntil(flushQueue());
  }
});


