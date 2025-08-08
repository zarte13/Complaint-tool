import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Complaint, ComplaintStatus } from '../../types';
import { get, put } from '../../services/api';
import EnhancedComplaintDetailDrawer from '../ComplaintDetailDrawer/EnhancedComplaintDetailDrawer';
import ComplaintTile from './ComplaintTile';
import { useAuthStore } from '../../stores/authStore';
// complaintsStore imported where needed

interface ComplaintListProps {
  refreshTrigger?: number;
  searchTerm?: string;
  statusFilter?: ComplaintStatus[];
  issueTypeFilter?: string;
  page?: number;
  pageSize?: number;
  readOnly?: boolean;
  showPagination?: boolean;
}

export default function ComplaintList({
  refreshTrigger = 0,
  searchTerm = '',
  statusFilter = [],
  issueTypeFilter = '',
  page = 1,
  pageSize = 10,
  readOnly = false,
  showPagination = true,
}: ComplaintListProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(page);
  const [currentSize, setCurrentSize] = useState<number>(pageSize);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>(String(page));
  const [drawerComplaint, setDrawerComplaint] = useState<Complaint | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { t } = useLanguage();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Track last query to avoid duplicate requests with identical params
  const lastParamsRef = useRef<string>('');
  const lastRefreshTriggerRef = useRef<number>(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
 
  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    const effectivePage = currentPage ?? 1;
    const effectiveSize = currentSize ?? 10;
    if (searchTerm) params.append('search', searchTerm);
    if (statusFilter && statusFilter.length > 0) {
      statusFilter.forEach(status => params.append('status', status));
    }
    if (issueTypeFilter) params.append('issue_category', issueTypeFilter as any);
    params.append('page', String(effectivePage));
    params.append('size', String(effectiveSize));
    params.append('sort_by', 'created_at');
    params.append('sort_order', 'desc');
    return params.toString();
  }, [searchTerm, statusFilter, issueTypeFilter, currentPage, currentSize]);
 
  const fetchComplaints = useCallback(async () => {
    const paramString = buildParams();
    // Skip if params identical to last successful fetch, unless refreshTrigger changed
    if (paramString === lastParamsRef.current && lastRefreshTriggerRef.current === refreshTrigger) {
      return;
    }
 
    // Cancel any in-flight request
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;
 
    try {
      setLoading(true);
      // Avoid passing an unsupported signal to our wrapped axios if environment doesn't support it
      const response = await get(`/api/complaints?${paramString}` as any);
      const data = response.data as any;
      if (Array.isArray(data)) {
        setComplaints(showPagination ? data : (data as Complaint[]).slice(0, 5));
        setTotal(data.length);
        setTotalPages(1);
      } else if (data && Array.isArray(data.items)) {
        const items = data.items as Complaint[];
        setComplaints(showPagination ? items : items.slice(0, 5));
        if (data.pagination) {
          setTotal(data.pagination.total ?? 0);
          setTotalPages(data.pagination.total_pages ?? 1);
        } else {
          setTotal(items.length);
          setTotalPages(1);
        }
      } else {
        setComplaints([]);
        setTotal(0);
        setTotalPages(1);
      }
      lastParamsRef.current = paramString;
      lastRefreshTriggerRef.current = refreshTrigger;
    } catch (err: any) {
      // Treat any error as non-fatal for the purpose of request flood tests
      setError(err?.response?.data?.detail || 'Failed to load complaints');
      setComplaints([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [buildParams, refreshTrigger]);
 
  // Debounce prop-driven fetches to coalesce rapid changes and avoid duplicate identical-param refetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const currentParams = buildParams();
      // Always fetch when refreshTrigger changes, even if params are the same
      if (currentParams !== lastParamsRef.current || refreshTrigger !== lastRefreshTriggerRef.current) {
        fetchComplaints();
      }
    }, 150);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [fetchComplaints, buildParams, refreshTrigger, searchTerm, statusFilter, issueTypeFilter, currentPage, currentSize]);

  // Reset to first page on filter/search changes
  useEffect(() => {
    setCurrentPage(1);
    setPageInput('1');
  }, [searchTerm, statusFilter, issueTypeFilter]);

  // Keep input in sync when currentPage changes externally
  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const commitPageInput = useCallback(() => {
    let next = parseInt(pageInput, 10);
    if (isNaN(next)) next = currentPage;
    next = Math.max(1, Math.min(totalPages || 1, next));
    if (next !== currentPage) setCurrentPage(next);
    setPageInput(String(next));
  }, [pageInput, currentPage, totalPages]);




  const handleRowClick = (complaint: Complaint) => {
    setDrawerComplaint(complaint);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setDrawerComplaint(null);
  };

  const handleDeleted = (id: number) => {
    // Optimistically remove from current list without full refresh
    setComplaints(prev => prev.filter(c => c.id !== id));
  };

  const handleComplaintUpdate = async (updatedData: Partial<Complaint>) => {
    if (!drawerComplaint) return;

    try {
      // Item endpoints must not include trailing slash due to redirect_slashes=false
      const url = `/api/complaints/${drawerComplaint.id}`;
      const response = await put(url, updatedData);
      const payload = response.data as Partial<Complaint>;
      
      // Update the local state
      setComplaints(prevComplaints =>
        prevComplaints.map(c =>
          c.id === drawerComplaint.id ? { ...c, ...payload } : c
        )
      );
      
      // Update the drawer complaint
      setDrawerComplaint(prev => (prev ? { ...prev, ...payload } : null));
      
      // Refresh the list
      fetchComplaints();
    } catch (err) {
      console.error('Failed to update complaint:', err);
      throw err;
    }
  };

  return (
    <>
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.h2 
          className="text-lg font-semibold text-gray-900"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {t('recentComplaints')}
        </motion.h2>
        
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              className="flex justify-center py-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" aria-label="loading"></div>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              className="flex items-center justify-center py-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center text-red-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                <p>{error}</p>
              </div>
            </motion.div>
          ) : complaints.length === 0 ? (
            <motion.div
              key="empty"
              className="text-center py-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <p className="text-gray-500">{t('noComplaints')}</p>
            </motion.div>
          ) : (
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              {complaints.map((complaint, index) => (
                <motion.div
                  key={complaint.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <ComplaintTile
                    complaint={complaint}
                    onClick={handleRowClick}
                    onFileUploadComplete={fetchComplaints}
                    readOnly={readOnly || !isAuthenticated}
                  />
                </motion.div>
              ))}
              {showPagination && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-gray-100">
                  <div className="text-sm text-gray-600">
                    {t('show')} {complaints.length} {t('of')} {total} {t('results')}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                    >
                      {t('previous')}
                    </button>
                  <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span>Page</span>
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={pageInput}
                      onChange={(e) => setPageInput(e.target.value)}
                      onBlur={commitPageInput}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          commitPageInput();
                        }
                      }}
                      className="w-16 px-2 py-1 border rounded"
                    />
                    <span>/ {totalPages}</span>
                  </div>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                    >
                      {t('next')}
                    </button>
                    <select
                      value={currentSize}
                      onChange={(e) => { setCurrentSize(Number(e.target.value)); setCurrentPage(1); }}
                      className="ml-2 px-2 py-1 text-sm border rounded"
                    >
                      <option value={10}>{t('show')} 10/{t('perPage')}</option>
                      <option value={20}>{t('show')} 20/{t('perPage')}</option>
                      <option value={50}>{t('show')} 50/{t('perPage')}</option>
                    </select>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      <EnhancedComplaintDetailDrawer
        complaint={drawerComplaint}
        isOpen={isDrawerOpen}
        onClose={handleDrawerClose}
        onUpdate={handleComplaintUpdate}
        onDeleted={handleDeleted}
      />
    </>
  );
}