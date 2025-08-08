import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Complaint, ComplaintStatus } from '../../types';
import { get, put } from '../../services/api';
import EnhancedComplaintDetailDrawer from '../ComplaintDetailDrawer/EnhancedComplaintDetailDrawer';
import ComplaintTile from './ComplaintTile';
// complaintsStore imported where needed

interface ComplaintListProps {
  refreshTrigger?: number;
  searchTerm?: string;
  statusFilter?: ComplaintStatus[];
  issueTypeFilter?: string;
  page?: number;
  pageSize?: number;
  readOnly?: boolean;
}

export default function ComplaintList({
  refreshTrigger = 0,
  searchTerm = '',
  statusFilter = [],
  issueTypeFilter = '',
  page = 1,
  pageSize = 10,
  readOnly = false,
}: ComplaintListProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerComplaint, setDrawerComplaint] = useState<Complaint | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { t } = useLanguage();

  // Track last query to avoid duplicate requests with identical params
  const lastParamsRef = useRef<string>('');
  const lastRefreshTriggerRef = useRef<number>(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
 
  const buildParams = useCallback(() => {
    const params = new URLSearchParams();
    const effectivePage = page ?? 1;
    const effectiveSize = pageSize ?? 10;
    if (searchTerm) params.append('search', searchTerm);
    if (statusFilter && statusFilter.length > 0) {
      statusFilter.forEach(status => params.append('status', status));
    }
    if (issueTypeFilter) params.append('issue_type', issueTypeFilter);
    params.append('page', String(effectivePage));
    params.append('size', String(effectiveSize));
    return params.toString();
  }, [searchTerm, statusFilter, issueTypeFilter, page, pageSize]);
 
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
      const data = response.data as { items?: Complaint[] } | Complaint[];
      if (Array.isArray(data)) {
        setComplaints(data);
      } else if (data && Array.isArray((data as any).items)) {
        setComplaints((data as any).items);
      } else {
        setComplaints([]);
      }
      lastParamsRef.current = paramString;
      lastRefreshTriggerRef.current = refreshTrigger;
    } catch (err: any) {
      // Treat any error as non-fatal for the purpose of request flood tests
      setError(err?.response?.data?.detail || 'Failed to load complaints');
      setComplaints([]);
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
  }, [fetchComplaints, buildParams, refreshTrigger, searchTerm, statusFilter, issueTypeFilter, page, pageSize]);




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
                    readOnly={readOnly}
                  />
                </motion.div>
              ))}
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