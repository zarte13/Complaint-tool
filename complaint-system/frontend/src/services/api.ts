/**
 * API service helpers + lightweight API clients
 * - ensureTrailingSlash: Normalizes collection endpoints to include trailing slash to avoid 307 redirects
 * - companiesApi / partsApi: Minimal service objects expected by useCompanies/useParts hooks
 * - Enhanced axios instance with retry logic and rate limiting
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { isOnline, requestBackgroundSync } from '../utils';
import { useAuthStore } from '../stores/authStore';

// Create enhanced axios instance with timeout
// Ensure all relative paths (e.g., '/auth/login') target the backend, not the Vite dev server
const apiClient: AxiosInstance = axios.create({
  baseURL: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_BASE_URL) || (window as any).__API_BASE_URL__ || 'http://127.0.0.1:8000',
  timeout: 10000, // 10 second timeout
});

// Attach Authorization header if access token exists
apiClient.interceptors.request.use(
  (config) => {
    try {
      const { accessToken } = useAuthStore.getState();
      if (accessToken) {
        config.headers = config.headers ?? {};
        (config.headers as any).Authorization = `Bearer ${accessToken}`;
      }
    } catch {
      // noop
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto-refresh on 401 using refresh token, then retry original request once
let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

async function handle401Error(error: any) {
  const originalRequest = error.config;
  const store = useAuthStore.getState();

  if (!store.refreshToken) {
    // No refresh token available; logout
    useAuthStore.getState().logout();
    return Promise.reject(error);
  }

  if (isRefreshing) {
    // Queue the request until refresh finishes
    return new Promise((resolve, reject) => {
      pendingQueue.push((newToken) => {
        if (newToken) {
          originalRequest.headers = originalRequest.headers ?? {};
          originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
          resolve(apiClient(originalRequest));
        } else {
          reject(error);
        }
      });
    });
  }

  isRefreshing = true;

  try {
    const refreshResp = await apiClient.post<{ access_token: string; refresh_token: string; expires_in: number }>(
      ensureTrailingSlash('/auth/refresh'),
      { refresh_token: store.refreshToken }
    );

    const newAccess = refreshResp.data.access_token;
    // Update store
    useAuthStore.getState().setAccessToken(newAccess);

    // Retry queued requests
    pendingQueue.forEach((cb) => cb(newAccess));
    pendingQueue = [];

    // Retry original request
    originalRequest.headers = originalRequest.headers ?? {};
    originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
    return apiClient(originalRequest);
  } catch (refreshErr) {
    // Refresh failed; logout and reject all
    useAuthStore.getState().logout();
    pendingQueue.forEach((cb) => cb(null));
    pendingQueue = [];
    return Promise.reject(refreshErr);
  } finally {
    isRefreshing = false;
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401 && !error.config?._retry) {
      error.config._retry = true;
      return handle401Error(error);
    }
    return Promise.reject(error);
  }
);

// Add request interceptor for trailing slash normalization
// IMPORTANT:
// - Only normalize when there is no query string.
// - Do NOT normalize multipart/form-data requests (file uploads), because
//   strict routers that disable redirect_slashes will not redirect and will 404.
//   Also, some proxies may reset connections on POST redirects/rewrites.
apiClient.interceptors.request.use(
  (config) => {
    if (config.url) {
      const hasQuery = config.url.includes('?') || config.url.includes('#');

      // Detect multipart/form-data to skip normalization (uploads)
      const contentType =
        (config.headers && (config.headers as any)['Content-Type']) ||
        (config.headers && (config.headers as any)['content-type']) ||
        '';

      const isMultipart = typeof contentType === 'string' && contentType.toLowerCase().includes('multipart/form-data');

      if (!hasQuery && !isMultipart) {
        config.url = ensureTrailingSlash(config.url);
      }

      // If caller accidentally provided an absolute URL pointing at the frontend dev server,
      // rewrite it to the backend baseURL to avoid 404s on port 3000.
      const base = (apiClient.defaults.baseURL || '').replace(/\/+$/, '');
      if (/^https?:\/\//i.test(config.url)) {
        const u = new URL(config.url);
        if (u.host === 'localhost:3000' || u.host === '127.0.0.1:3000') {
          // Keep the path/query but point to backend base
          const pathAndQuery = u.pathname + (u.search || '') + (u.hash || '');
          config.url = `${base}${ensureLeadingSlash(pathAndQuery)}`;
        }
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Retry configuration
const MAX_RETRIES = 5;
const INITIAL_DELAY = 100; // 100ms
const MAX_DELAY = 30000; // 30 seconds

// Exponential backoff retry function
async function retryRequest<T>(
  requestFn: () => Promise<AxiosResponse<T>>,
  retries: number = 0,
  delay: number = INITIAL_DELAY
): Promise<AxiosResponse<T>> {
  try {
    return await requestFn();
  } catch (error: any) {
    // Log retry attempt
    console.log(`Retry attempt ${retries + 1} at ${new Date().toISOString()}`);
    
    // If we've reached max retries, throw the error
    if (retries >= MAX_RETRIES) {
      throw error;
    }
    
    // If it's a network error or 5xx error, retry with exponential backoff
    if (
      error.code === 'ECONNABORTED' ||
      error.code === 'ECONNREFUSED' ||
      (error.response && error.response.status >= 500)
    ) {
      // Wait for delay period
      await new Promise(resolve => setTimeout(resolve, delay));
      
      // Calculate next delay (exponential backoff with cap)
      const nextDelay = Math.min(delay * 2, MAX_DELAY);
      
      // Retry with incremented retry count
      return retryRequest(requestFn, retries + 1, nextDelay);
    }
    
    // For other errors, don't retry
    throw error;
  }
}

// Normalize URL to ensure it targets backend baseURL
function toBackend(url: string): string {
  // If url is already absolute and not pointing to frontend, return as-is
  if (/^https?:\/\//i.test(url)) {
    const u = new URL(url);
    if (u.host === 'localhost:3000' || u.host === '127.0.0.1:3000') {
      const base = (apiClient.defaults.baseURL || '').replace(/\/+$/, '');
      return `${base}${ensureLeadingSlash(u.pathname + (u.search || '') + (u.hash || ''))}`;
    }
    return url;
  }
  // Relative path -> join with backend baseURL
  const base = (apiClient.defaults.baseURL || '').replace(/\/+$/, '');
  return `${base}${ensureLeadingSlash(url)}`;
}

// Enhanced API methods with retry logic
async function get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return retryRequest(() => apiClient.get<T>(toBackend(url), config));
}

async function post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  const target = toBackend(url);
  if (isOnline()) {
    return retryRequest(() => apiClient.post<T>(target, data, config));
  }
  await queueOfflineRequest({ url: target, method: 'POST', body: data, headers: (config && (config.headers as any)) || undefined });
  await requestBackgroundSync('sync-offline-requests');
  return Promise.resolve({
    data: { offline: true } as any,
    status: 202,
    statusText: 'Accepted (offline queued)',
    headers: {},
    config: config || {},
    request: null,
  } as AxiosResponse<T>);
}

async function put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  const target = toBackend(url);
  if (isOnline()) {
    return retryRequest(() => apiClient.put<T>(target, data, config));
  }
  await queueOfflineRequest({ url: target, method: 'PUT', body: data, headers: (config && (config.headers as any)) || undefined });
  await requestBackgroundSync('sync-offline-requests');
  return Promise.resolve({
    data: { offline: true } as any,
    status: 202,
    statusText: 'Accepted (offline queued)',
    headers: {},
    config: config || {},
    request: null,
  } as AxiosResponse<T>);
}

async function del<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  const target = toBackend(url);
  if (isOnline()) {
    return retryRequest(() => apiClient.delete<T>(target, config));
  }
  await queueOfflineRequest({ url: target, method: 'DELETE', body: undefined, headers: (config && (config.headers as any)) || undefined });
  await requestBackgroundSync('sync-offline-requests');
  return Promise.resolve({
    data: { offline: true } as any,
    status: 202,
    statusText: 'Accepted (offline queued)',
    headers: {},
    config: config || {},
    request: null,
  } as AxiosResponse<T>);
}

export function ensureTrailingSlash(inputUrl: string): string {
  if (!inputUrl) return inputUrl;

  const skipPrefixes = ["/api/analytics", "/auth"]; // do not force trailing slash here

  // Absolute URL handling
  if (/^https?:\/\//i.test(inputUrl)) {
    try {
      const u = new URL(inputUrl);
      const pathname = u.pathname || "/";

      // Skip certain prefixes
      if (skipPrefixes.some((p) => pathname.startsWith(p))) {
        return inputUrl;
      }

      // Already ends with slash
      if (pathname.endsWith("/")) return inputUrl;

      // Do not add slash for likely item paths (numeric last segment)
      const segments = pathname.split("/").filter(Boolean);
      const last = segments[segments.length - 1] ?? "";
      const isLikelyItem = /^\d+$/.test(last);
      if (isLikelyItem) return inputUrl;

      // Add slash to pathname only
      u.pathname = `${pathname}/`;
      return u.toString();
    } catch {
      // Fallback to relative logic if URL parsing fails
    }
  }

  // Relative path logic
  const match = inputUrl.match(/^([^?#]+)([?#].*)?$/);
  if (!match) return inputUrl;
  const base = match[1];
  const rest = match[2] ?? "";

  if (skipPrefixes.some((p) => base.startsWith(p))) {
    return `${base}${rest}`;
  }

  if (base.endsWith("/")) return `${base}${rest}`;

  const segments = base.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "";
  const isLikelyItem = /^\d+$/.test(last);
  if (isLikelyItem) return `${base}${rest}`;

  return `${base}/${rest}`;
}

/** Ensure a leading slash for URL path joining */
function ensureLeadingSlash(p: string): string {
  if (!p) return '/';
  return p.startsWith('/') ? p : `/${p}`;
}

/**
 * Companies API service expected by useCompanies hook
 * - search(query, limit?) => Promise<Company[]>
 * - create(name) => Promise<Company>
 */
export const companiesApi = {
  async search(query: string, limit: number = 10) {
    const params = new URLSearchParams();
    params.append('search', query);
    params.append('limit', String(limit));

    const url = `${ensureTrailingSlash('/api/companies')}?${params.toString()}`;
    const { data } = await get(url);
    return data;
  },

  async create(name: string) {
    const url = ensureTrailingSlash('/api/companies');
    const { data } = await post(url, { name });
    return data;
  },
};

/**
 * Parts API service expected by useParts hook
 * - search(query, limit?) => Promise<Part[]>
 * - create(part_number, description?) => Promise<Part>
 */
export const partsApi = {
  async search(query: string, limit: number = 10) {
    const params = new URLSearchParams();
    params.append('search', query);
    params.append('limit', String(limit));

    const url = `${ensureTrailingSlash('/api/parts')}?${params.toString()}`;
    const { data } = await get(url);
    return data;
  },

  async create(part_number: string, description?: string) {
    const url = ensureTrailingSlash('/api/parts');
    const { data } = await post(url, { part_number, description });
    return data;
  },
};

/**
 * Responsibles API service for responsables directory
 */
export const responsiblesApi = {
  async list(params?: { search?: string; active_only?: boolean; limit?: number }) {
    const usp = new URLSearchParams();
    if (params?.search) usp.append('search', params.search);
    if (typeof params?.active_only === 'boolean') usp.append('active_only', String(params.active_only));
    if (typeof params?.limit === 'number') usp.append('limit', String(params.limit));
    const base = ensureTrailingSlash('/api/responsible-persons');
    const url = usp.toString() ? `${base}?${usp.toString()}` : base;
    const { data } = await get(url);
    return data;
  },

  async create(payload: { name: string; email: string; department?: string }) {
    const url = ensureTrailingSlash('/api/responsible-persons');
    const { data } = await post(url, payload);
    return data;
  },

  async update(personId: number, payload: { name?: string; email?: string; department?: string; is_active?: boolean }) {
    const url = `/api/responsible-persons/${personId}`; // item path; no trailing slash normalization
    const { data } = await put(url, payload);
    return data;
  },

  async deactivate(personId: number) {
    const url = `/api/responsible-persons/${personId}`;
    const { data } = await del(url);
    return data;
  },
};

// Export the enhanced API client for direct usage
export { apiClient, get, post, put, del };

// Lightweight IndexedDB queue for offline mutations (kept in this module for simplicity)
type QueuedRequest = { url: string; method: 'POST' | 'PUT' | 'DELETE'; headers?: Record<string, any>; body?: any };

const OFFLINE_DB_NAME = 'offline-db';
const REQUESTS_STORE = 'requests';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(OFFLINE_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(REQUESTS_STORE)) {
        db.createObjectStore(REQUESTS_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function queueOfflineRequest(entry: QueuedRequest): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(REQUESTS_STORE, 'readwrite');
    const req = tx.objectStore(REQUESTS_STORE).add({ ...entry, queuedAt: Date.now() } as any);
    // Resolve on request success to avoid relying on tx.oncomplete in tests/envs
    (req as any).onsuccess = () => resolve();
    (req as any).onerror = () => reject((req as any).error as any);
  });
}