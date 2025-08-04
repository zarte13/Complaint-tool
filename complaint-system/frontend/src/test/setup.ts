import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock API calls (axios-like) plus named helpers used across app
const getMock = vi.fn();
const postMock = vi.fn();
const putMock = vi.fn();
const deleteMock = vi.fn();

// Provide default no-op implementations for endpoints that some components call during mount,
// so tests won't attempt real network I/O (jsdom XHR) when not explicitly mocked in a test.
// These can be overridden per-test via getMock.mockImplementationOnce(...)
getMock.mockImplementation((url: string) => {
  if (typeof url === 'string') {
    // follow-up actions related endpoints
    if (url.startsWith('/api/complaints/') && url.endsWith('/actions')) {
      return Promise.resolve({ data: [] });
    }
    if (url.startsWith('/api/complaints/') && url.endsWith('/actions/metrics')) {
      return Promise.resolve({ data: { total: 0, overdue: 0 } });
    }
    if (url.startsWith('/api/complaints/') && url.endsWith('/actions/responsible-persons')) {
      return Promise.resolve({ data: [] });
    }
  }
  // default empty shape
  return Promise.resolve({ data: {} });
});

vi.mock('../services/api', async (importOriginal) => {
  const mod = await importOriginal<any>();
  return {
    ...mod,
    // expose the same helper names used by code under test
    get: (...args: any[]) => getMock(...args),
    post: (...args: any[]) => postMock(...args),
    put: (...args: any[]) => putMock(...args),
    del: (...args: any[]) => deleteMock(...args),
    ensureTrailingSlash: mod.ensureTrailingSlash,
    // also export a shape similar to axios instance for any legacy usage
    apiClient: {
      get: getMock,
      post: postMock,
      put: putMock,
      delete: deleteMock,
    },
  };
});

// expose mocks globally for convenience in tests
// @ts-ignore
global.__API_MOCKS__ = { getMock, postMock, putMock, deleteMock };

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  BrowserRouter: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  Routes: ({ children }: { children: React.ReactNode }) => React.createElement('div', {}, children),
  Route: ({ element }: { element: React.ReactNode }) => React.createElement('div', {}, element),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => React.createElement('a', { href: to }, children),
}));