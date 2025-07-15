import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Complaint, ComplaintStatus, IssueType } from '../types';
import api from '../services/api';

interface ComplaintFilters {
  status?: ComplaintStatus;
  issue_type?: IssueType;
  company_id?: number;
  dateRange?: { from: string; to: string };
}

interface SortConfig {
  column: string;
  direction: 'asc' | 'desc';
}

interface UseComplaintsReturn {
  // Data
  complaints: Complaint[];
  loading: boolean;
  error: string | null;
  
  // Pagination
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
  
  // Filters & Search
  search: string;
  filters: ComplaintFilters;
  sort: SortConfig;
  
  // Actions
  setPage: (page: number) => void;
  setSize: (size: number) => void;
  setSearch: (search: string) => void;
  setFilters: (filters: ComplaintFilters) => void;
  setSort: (sort: SortConfig) => void;
  exportData: (format: 'csv' | 'xlsx') => void;
  refresh: () => void;
}

const DEBOUNCE_DELAY = 200; // 200ms for search debounce
const FILTER_DELAY = 50; // 50ms for filter updates

export function useComplaints(): UseComplaintsReturn {
  const [searchParams, setSearchParams] = useSearchParams();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(() => {
    const pageParam = searchParams.get('page');
    return pageParam ? parseInt(pageParam, 10) : 1;
  });
  
  const [size, setSize] = useState(() => {
    const sizeParam = searchParams.get('size');
    return sizeParam ? parseInt(sizeParam, 10) : 10;
  });
  
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // Search and filter state
  const [search, setSearch] = useState(() => searchParams.get('search') || '');
  const [filters, setFilters] = useState<ComplaintFilters>(() => ({
    status: (searchParams.get('status') as ComplaintStatus) || undefined,
    issue_type: (searchParams.get('issue_type') as IssueType) || undefined,
    company_id: searchParams.get('company_id') ? parseInt(searchParams.get('company_id')!, 10) : undefined,
    dateRange: searchParams.get('date_from') && searchParams.get('date_to') 
      ? { from: searchParams.get('date_from')!, to: searchParams.get('date_to')! }
      : undefined,
  }));
  
  const [sort, setSort] = useState<SortConfig>(() => ({
    column: searchParams.get('sort_by') || 'created_at',
    direction: (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc',
  }));
  
  // Debounce refs
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  const filterDebounceRef = useRef<ReturnType<typeof setTimeout>>();
  
  // Fetch complaints
  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      
      // Pagination
      params.append('page', page.toString());
      params.append('size', size.toString());
      
      // Search
      if (search) params.append('search', search);
      
      // Filters
      if (filters.status) params.append('status', filters.status);
      if (filters.issue_type) params.append('issue_type', filters.issue_type);
      if (filters.company_id) params.append('company_id', filters.company_id.toString());
      if (filters.dateRange) {
        params.append('date_from', filters.dateRange.from);
        params.append('date_to', filters.dateRange.to);
      }
      
      // Sorting
      params.append('sort_by', sort.column);
      params.append('sort_order', sort.direction);
      
      const response = await api.get(`/complaints?${params.toString()}`);
      
      setComplaints(response.data.items);
      setTotal(response.data.pagination.total);
      setTotalPages(response.data.pagination.total_pages);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load complaints');
    } finally {
      setLoading(false);
    }
  }, [page, size, search, filters, sort]);
  
  // Update URL state
  const updateSearchParams = useCallback(() => {
    const newParams = new URLSearchParams();
    
    if (page > 1) newParams.set('page', page.toString());
    if (size !== 10) newParams.set('size', size.toString());
    if (search) newParams.set('search', search);
    if (filters.status) newParams.set('status', filters.status);
    if (filters.issue_type) newParams.set('issue_type', filters.issue_type);
    if (filters.company_id) newParams.set('company_id', filters.company_id.toString());
    if (filters.dateRange) {
      newParams.set('date_from', filters.dateRange.from);
      newParams.set('date_to', filters.dateRange.to);
    }
    if (sort.column !== 'created_at') newParams.set('sort_by', sort.column);
    if (sort.direction !== 'desc') newParams.set('sort_order', sort.direction);
    
    setSearchParams(newParams, { replace: true });
  }, [page, size, search, filters, sort, setSearchParams]);
  
  // Debounced search
  const debouncedSetSearch = useCallback((newSearch: string) => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    searchDebounceRef.current = setTimeout(() => {
      setSearch(newSearch);
      setPage(1); // Reset to first page on new search
    }, DEBOUNCE_DELAY);
  }, []);
  
  // Debounced filters
  const debouncedSetFilters = useCallback((newFilters: ComplaintFilters) => {
    if (filterDebounceRef.current) {
      clearTimeout(filterDebounceRef.current);
    }
    
    filterDebounceRef.current = setTimeout(() => {
      setFilters(newFilters);
      setPage(1); // Reset to first page on new filters
    }, FILTER_DELAY);
  }, []);
  
  // Effects
  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);
  
  useEffect(() => {
    updateSearchParams();
  }, [updateSearchParams]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
    };
  }, []);
  
  // Export functionality
  const exportData = useCallback(async (format: 'csv' | 'xlsx') => {
    const params = new URLSearchParams();
    
    // Apply all current filters for export
    if (search) params.append('search', search);
    if (filters.status) params.append('status', filters.status);
    if (filters.issue_type) params.append('issue_type', filters.issue_type);
    if (filters.company_id) params.append('company_id', filters.company_id.toString());
    if (filters.dateRange) {
      params.append('date_from', filters.dateRange.from);
      params.append('date_to', filters.dateRange.to);
    }
    
    try {
      const response = await api.get(`/complaints/export/${format}?${params.toString()}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `complaints.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err: any) {
      console.error('Export failed:', err);
    }
  }, [search, filters]);
  
  return {
    complaints,
    loading,
    error,
    pagination: {
      page,
      size,
      total,
      totalPages,
    },
    search,
    filters,
    sort,
    setPage,
    setSize,
    setSearch: debouncedSetSearch,
    setFilters: debouncedSetFilters,
    setSort,
    exportData,
    refresh: fetchComplaints,
  };
}