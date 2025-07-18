import { Complaint } from '../types';

interface ComplaintsCache {
  data: Complaint[];
  pagination: {
    page: number;
    size: number;
    total: number;
    total_pages: number;
  };
  query: {
    search?: string;
    status?: string[];
    issue_type?: string;
    company_id?: number;
    part_number?: string;
    date_from?: string;
    date_to?: string;
    sort_by?: string;
    sort_order?: string;
  };
  timestamp: number;
}

interface ComplaintsStore {
  cache: Map<string, ComplaintsCache>;
  isLoading: boolean;
  error: string | null;
  lastRefreshAction: number;
}

// Create a simple store using module scope for now (could be upgraded to Context/Zustand later)
let store: ComplaintsStore = {
  cache: new Map(),
  isLoading: false,
  error: null,
  lastRefreshAction: 0,
};

// Listeners for store updates
type StoreListener = () => void;
const listeners: Set<StoreListener> = new Set();

// Helper to generate cache key from query parameters
function generateCacheKey(query: ComplaintsCache['query'], page: number = 1, size: number = 10): string {
  const normalizedQuery = {
    search: query.search || '',
    status: Array.isArray(query.status) ? query.status.sort().join(',') : (query.status || ''),
    issue_type: query.issue_type || '',
    company_id: query.company_id || '',
    part_number: query.part_number || '',
    date_from: query.date_from || '',
    date_to: query.date_to || '',
    sort_by: query.sort_by || 'created_at',
    sort_order: query.sort_order || 'desc',
    page,
    size,
  };
  
  return JSON.stringify(normalizedQuery);
}

// Check if cache is still valid (5 minutes)
function isCacheValid(cache: ComplaintsCache): boolean {
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  return Date.now() - cache.timestamp < CACHE_DURATION;
}

// Store API
export const complaintsStore = {
  // Get current store state
  getState(): ComplaintsStore {
    return { ...store, cache: new Map(store.cache) };
  },

  // Subscribe to store changes
  subscribe(listener: StoreListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // Notify all listeners of changes
  notify(): void {
    listeners.forEach(listener => listener());
  },

  // Get cached data if available and valid
  getCachedData(query: ComplaintsCache['query'], page: number = 1, size: number = 10): ComplaintsCache | null {
    const key = generateCacheKey(query, page, size);
    const cached = store.cache.get(key);
    
    if (cached && isCacheValid(cached) && store.lastRefreshAction <= cached.timestamp) {
      return cached;
    }
    
    // Remove invalid cache entry
    if (cached) {
      store.cache.delete(key);
    }
    
    return null;
  },

  // Set cached data
  setCachedData(
    query: ComplaintsCache['query'],
    data: Complaint[],
    pagination: ComplaintsCache['pagination']
  ): void {
    const key = generateCacheKey(query, pagination.page, pagination.size);
    
    store.cache.set(key, {
      data,
      pagination,
      query,
      timestamp: Date.now(),
    });
    
    this.notify();
  },

  // Set loading state
  setLoading(loading: boolean): void {
    store.isLoading = loading;
    this.notify();
  },

  // Set error state
  setError(error: string | null): void {
    store.error = error;
    this.notify();
  },

  // Force refresh - invalidates all cache
  refresh(): void {
    store.lastRefreshAction = Date.now();
    store.cache.clear();
    this.notify();
  },

  // Clear specific cache entry
  invalidateQuery(query: ComplaintsCache['query'], page?: number, size?: number): void {
    if (page !== undefined && size !== undefined) {
      const key = generateCacheKey(query, page, size);
      store.cache.delete(key);
    } else {
      // Clear all cache entries that match the query (regardless of pagination)
      const keysToDelete: string[] = [];
      store.cache.forEach((cached, key) => {
        if (JSON.stringify(cached.query) === JSON.stringify(query)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => store.cache.delete(key));
    }
    
    this.notify();
  },

  // Update a single complaint in cache
  updateComplaintInCache(updatedComplaint: Complaint): void {
    store.cache.forEach((cached) => {
      const index = cached.data.findIndex(c => c.id === updatedComplaint.id);
      if (index !== -1) {
        cached.data[index] = { ...cached.data[index], ...updatedComplaint };
      }
    });
    
    this.notify();
  },

  // Add new complaint to relevant caches
  addComplaintToCache(newComplaint: Complaint): void {
    store.cache.forEach((cached) => {
      // Add to first page of caches if it would match the query
      if (cached.pagination.page === 1) {
        cached.data.unshift(newComplaint);
        cached.pagination.total += 1;
        // Keep only the page size limit
        if (cached.data.length > cached.pagination.size) {
          cached.data.pop();
        }
      }
    });
    
    this.notify();
  },

  // Remove complaint from cache
  removeComplaintFromCache(complaintId: number): void {
    store.cache.forEach((cached) => {
      const index = cached.data.findIndex(c => c.id === complaintId);
      if (index !== -1) {
        cached.data.splice(index, 1);
        cached.pagination.total -= 1;
      }
    });
    
    this.notify();
  },

  // Clear all cache
  clearCache(): void {
    store.cache.clear();
    this.notify();
  },
}; 