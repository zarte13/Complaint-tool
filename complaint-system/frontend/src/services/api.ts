/**
 * API service helpers + lightweight API clients
 * - ensureTrailingSlash: Normalizes collection endpoints to include trailing slash to avoid 307 redirects
 * - companiesApi / partsApi: Minimal service objects expected by useCompanies/useParts hooks
 * - Enhanced axios instance with retry logic and rate limiting
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { useAuthStore } from '../stores/authStore';

// Create enhanced axios instance with timeout
const apiClient: AxiosInstance = axios.create({
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

// Enhanced API methods with retry logic
async function get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return retryRequest(() => apiClient.get<T>(url, config));
}

async function post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return retryRequest(() => apiClient.post<T>(url, data, config));
}

async function put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return retryRequest(() => apiClient.put<T>(url, data, config));
}

async function del<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  return retryRequest(() => apiClient.delete<T>(url, config));
}

export function ensureTrailingSlash(path: string): string {
  if (!path) return path;
  // Preserve query/hash by splitting first
  const match = path.match(/^([^?#]+)([?#].*)?$/);
  if (!match) return path;
  const base = match[1];
  const rest = match[2] ?? "";

  // If base already ends with slash, simply recombine parts to avoid double slashes
  if (base.endsWith("/")) return `${base}${rest}`;

  // Heuristic: if base appears to target a resource item like "/api/complaints/123",
  // do not append a slash; only append for collection roots without trailing slash.
  // We treat last segment with only digits as an item; adjust if IDs are non-numeric.
  const segments = base.split("/").filter(Boolean);
  const last = segments[segments.length - 1] ?? "";
  const isLikelyItem = /^\d+$/.test(last);

  if (isLikelyItem) return `${base}${rest}`;

  return `${base}/${rest}`;
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

// Export the enhanced API client for direct usage
export { apiClient, get, post, put, del };