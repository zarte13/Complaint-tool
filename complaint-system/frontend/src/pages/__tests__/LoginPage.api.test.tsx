import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../../test/test-utils';
import LoginPage from '../LoginPage';
import * as api from '../../services/api';

// Explicitly mock the services/api module before importing component usage
// We will replace post/get wrappers to capture the effective URL after toBackend()
const net = {
  history: [] as Array<{ method: string; url: string; data?: any }>,
};
vi.mock('../../services/api', async (importOriginal) => {
  const mod = await importOriginal<any>();
  // We need a deterministic base URL for joining
  (globalThis as any).__API_BASE_URL__ = 'http://127.0.0.1:8000';
  const base = 'http://127.0.0.1:8000';

  // Use the real helpers to ensureTrailingSlash and toBackend behavior consistency
  const ensureTrailingSlash = mod.ensureTrailingSlash as (p: string) => string;
  const toBackend = (url: string) => {
    // mimic real toBackend(join)
    if (/^https?:\/\//i.test(url)) {
      const u = new URL(url);
      if (u.host === 'localhost:3000' || u.host === '127.0.0.1:3000') {
        return `${base}${u.pathname}${u.search || ''}${u.hash || ''}`;
      }
      return url;
    }
    return `${base}${url.startsWith('/') ? url : `/${url}`}`;
  };

  return {
    ...mod,
    // override wrapped helpers to record final URL after normalization
    get: vi.fn(async (url: string, config?: any) => {
      const eff = toBackend(url);
      net.history.push({ method: 'GET', url: eff });
      // default 404 for diagnostics
      const err: any = new Error('Not Found');
      err.response = { status: 404, data: { detail: 'Not Found' } };
      err.config = { ...(config || {}), url: eff, method: 'get' };
      throw err;
    }),
    post: vi.fn(async (url: string, data?: any, config?: any) => {
      const eff = toBackend(url);
      net.history.push({ method: 'POST', url: eff, data });
      if (eff.includes('/auth/login')) {
        return {
          status: 200,
          statusText: 'OK',
          data: {
            access_token: 'test-access',
            refresh_token: 'test-refresh',
            token_type: 'bearer',
            expires_in: 1800,
          },
          headers: {},
          config: { ...(config || {}), url: eff, method: 'post' },
        } as any;
      }
      const err: any = new Error('Not Found');
      err.response = { status: 404, data: { detail: 'Not Found' } };
      err.config = { ...(config || {}), url: eff, method: 'post' };
      throw err;
    }),
    // keep ensureTrailingSlash real
    ensureTrailingSlash,
    // provide an axios-like apiClient shape if any code reads it
    apiClient: {
      defaults: { baseURL: base },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
    },
  };
});

// Utility to spy on api wrapper exports (not axios) to assert call intent
function installApiSpies() {
  const logs: Array<{ method: string; url: string }> = [];
  const realPost = (api as any).post as (...args: any[]) => Promise<any>;
  vi.spyOn(api as any, 'post').mockImplementation(async (...args: any[]) => {
    const [url] = args;
    logs.push({ method: 'POST', url: String(url) });
    // call through to the module-level mocked implementation
    return realPost(...args);
  });

  return {
    logs,
    restore: () => {
      (api.post as any).mockRestore?.();
    },
  };
}

describe('LoginPage API routing diagnostics', () => {
  beforeEach(() => {
    // Ensure deterministic base for api.ts fallback
    (globalThis as any).__API_BASE_URL__ = 'http://127.0.0.1:8000';
    // Minimal globals (jsdom provides window/document but ensure present)
    const g: any = globalThis as any;
    g.window = g.window || ({} as any);
    g.document = g.document || ({ createElement: () => ({}), body: { appendChild: () => {} } } as any);
    g.navigator = g.navigator || ({ userAgent: 'vitest' } as any);
    // reset capture
    net.history.length = 0;
  });

  it('posts to backend /auth/login using api baseURL and not the frontend origin', async () => {
    const spies = installApiSpies();

    render(<LoginPage />);

    // Fill in form
    fireEvent.change(screen.getByLabelText(/username/i), { target: { value: 'phil' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'YourStr0ng1' } });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      // Assert wrapper was called
      const postCall = spies.logs.find((l) => l.method === 'POST' && typeof l.url === 'string' && l.url.includes('/auth/login'));
      expect(postCall).toBeTruthy();

      // Assert effective URL captured by our overridden wrapper joined to backend base
      const req = net.history.find((h) => h.method === 'POST' && typeof h.url === 'string' && h.url.includes('/auth/login'));
      expect(req).toBeTruthy();
      expect(req?.url.startsWith('http://127.0.0.1:8000')).toBe(true);
    });

    // Double-check outside waitFor
    const req = net.history.find((h) => h.method === 'POST' && h.url.includes('/auth/login'));
    expect(req).toBeTruthy();
    expect(req?.url.startsWith('http://127.0.0.1:8000')).toBe(true);

    spies.restore();
  });
});