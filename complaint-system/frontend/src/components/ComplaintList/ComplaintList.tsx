import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Complaint, ComplaintStatus } from '../../types';
import api from '../../services/api';
import EnhancedComplaintDetailDrawer from '../ComplaintDetailDrawer/EnhancedComplaintDetailDrawer';
import ComplaintTile from './ComplaintTile';

interface ComplaintListProps {
  refreshTrigger?: number;
  searchTerm?: string;
  statusFilter?: ComplaintStatus[];
  issueTypeFilter?: string;
  page?: number;
  pageSize?: number;
  onComplaintClick?: (complaint: Complaint) => void;
}

export default function ComplaintList({
  refreshTrigger = 0,
  searchTerm = '',
  statusFilter = [],
  issueTypeFilter = '',
  page = 1,
  pageSize = 10,
  onComplaintClick
}: ComplaintListProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drawerComplaint, setDrawerComplaint] = useState<Complaint | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    fetchComplaints();
  }, [refreshTrigger, searchTerm, statusFilter, issueTypeFilter, page, pageSize]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter && statusFilter.length > 0) {
        statusFilter.forEach(status => params.append('status', status));
      }
      if (issueTypeFilter) params.append('issue_type', issueTypeFilter);
      params.append('skip', ((page - 1) * pageSize).toString());
      params.append('limit', pageSize.toString());
      
      const response = await api.get(`/complaints?${params.toString()}`);
      // Handle both direct array response and paginated response formats
      const data = response.data;
      if (Array.isArray(data)) {
        setComplaints(data);
      } else if (data && Array.isArray(data.items)) {
        setComplaints(data.items);
      } else {
        setComplaints([]);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load complaints');
      setComplaints([]);
    } finally {
      setLoading(false);
    }
  };

  const getIssueTypeColor = (issueType: string) => {
    switch (issueType) {
      case 'wrong_quantity':
        return 'bg-blue-100 text-blue-800';
      case 'wrong_part':
        return 'bg-purple-100 text-purple-800';
      case 'damaged':
        return 'bg-red-100 text-red-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getIssueTypeDisplay = (issueType: string) => {
    const issueTypeMap: Record<string, string> = {
      'wrong_quantity': 'wrongQuantity',
      'wrong_part': 'wrongPart',
      'damaged': 'damaged',
      'other': 'other'
    };
    
    const key = issueTypeMap[issueType] || 'other';
    const translated = t(key as any);
    return translated ? translated.toUpperCase() : issueType.toUpperCase();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRowClick = (complaint: Complaint) => {
    setDrawerComplaint(complaint);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setDrawerComplaint(null);
  };

  const handleComplaintUpdate = async (updatedData: Partial<Complaint>) => {
    if (!drawerComplaint) return;

    try {
      const response = await api.put(`/complaints/${drawerComplaint.id}/`, updatedData);
      
      // Update the local state
      setComplaints(prevComplaints =>
        prevComplaints.map(c =>
          c.id === drawerComplaint.id ? { ...c, ...response.data } : c
        )
      );
      
      // Update the drawer complaint
      setDrawerComplaint(prev => prev ? { ...prev, ...response.data } : null);
      
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
      />
    </>
  );
}