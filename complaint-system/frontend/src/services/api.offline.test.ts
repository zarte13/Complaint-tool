import { describe, it, expect, beforeEach, vi } from 'vitest';

// Minimal fake IndexedDB for jsdom (enough for add/getAll used in code)
class FakeRequest<T = any> {
  onsuccess: ((this: IDBRequest<T>, ev: any) => any) | null = null;
  onerror: ((this: IDBRequest<T>, ev: any) => any) | null = null;
  result: any;
  error: any;
}

class FakeStore {
  private data: any[] = [];
  add(value: any) {
    const req: any = new FakeRequest();
    this.data.push({ id: this.data.length + 1, ...value });
    queueMicrotask(() => req.onsuccess && req.onsuccess.call(req, {}));
    return req;
  }
  getAll() {
    const req: any = new FakeRequest();
    queueMicrotask(() => {
      req.result = [...this.data];
      req.onsuccess && req.onsuccess.call(req, {});
    });
    return req;
  }
  delete(id: number) {
    const req: any = new FakeRequest();
    this.data = this.data.filter((x) => x.id !== id);
    queueMicrotask(() => req.onsuccess && req.onsuccess.call(req, {}));
    return req;
  }
}

class FakeTx {
  objectStore() {
    return fakeStore;
  }
  oncomplete: any;
  onerror: any;
}

class FakeDB {
  transaction() {
    return new FakeTx();
  }
  objectStoreNames = { contains: () => true } as any;
}

class FakeOpenReq {
  onsuccess: any;
  onerror: any;
  onupgradeneeded: any;
  result: any;
}

let fakeStore: FakeStore;

describe('offline queue in api.ts', () => {
  beforeEach(() => {
    fakeStore = new FakeStore();
    // @ts-ignore
    global.indexedDB = {
      open: vi.fn(() => {
        const r: any = new FakeOpenReq();
        queueMicrotask(() => {
          r.result = new FakeDB();
          if (r.onupgradeneeded) r.onupgradeneeded({});
          r.onsuccess && r.onsuccess({});
        });
        return r;
      }),
    } as any;

    // offline
    Object.defineProperty(global, 'navigator', {
      value: {
        onLine: false,
        serviceWorker: {
          ready: Promise.resolve({ sync: { register: vi.fn() } }),
          controller: { postMessage: vi.fn() },
        },
      },
      writable: true,
    } as any);
  });

  it('queues POST when offline and returns 202', async () => {
    vi.resetModules();
    vi.doUnmock('./api');
    const { post } = await import('./api');
    const res = await post('/api/complaints', { foo: 'bar' } as any);
    expect(res.status).toBe(202);
    expect(res.data).toEqual({ offline: true });
  });

  it('queues PUT when offline and returns 202', async () => {
    vi.resetModules();
    vi.doUnmock('./api');
    const { put } = await import('./api');
    const res = await put('/api/complaints/1', { status: 'in_progress' } as any);
    expect(res.status).toBe(202);
    expect(res.data).toEqual({ offline: true });
  });

  it('queues DELETE when offline and returns 202', async () => {
    vi.resetModules();
    vi.doUnmock('./api');
    const { del } = await import('./api');
    const res = await del('/api/complaints/attachments/1');
    expect(res.status).toBe(202);
    expect(res.data).toEqual({ offline: true });
  });
});


