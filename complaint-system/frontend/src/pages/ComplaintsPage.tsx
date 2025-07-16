import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Complaint, ComplaintStatus, IssueType } from '../types';
import api from '../services/api';
import ComplaintList from '../components/ComplaintList/ComplaintList';
import ComplaintDetailDrawer from '../components/ComplaintDetailDrawer/ComplaintDetailDrawer';

export default function ComplaintsPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ComplaintStatus | ''>('');
  const [issueTypeFilter, setIssueTypeFilter] = useState<IssueType | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter) params.append('status', statusFilter);
      if (issueTypeFilter) params.append('issue_type', issueTypeFilter);
      
      const response = await api.get(`/complaints/export/${format}?${params.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `complaints.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleComplaintClick = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setIsDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setIsDrawerOpen(false);
    setSelectedComplaint(null);
  };

  const handleComplaintUpdate = async (updatedData: Partial<Complaint>) => {
    if (!selectedComplaint) return;

    try {
      const response = await api.put(`/complaints/${selectedComplaint.id}/`, updatedData);
      
      // Update the local state
      setSelectedComplaint(response.data);
      
      // Trigger refresh of the complaint list
      setRefreshTrigger(prev => prev + 1);
      
    } catch (error) {
      console.error('Failed to update complaint:', error);
      // You might want to show an error message here
    }
  };


  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('complaintManagement')}</h1>
        <p className="mt-2 text-gray-600">{t('manageAndTrackAllComplaints')}</p>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <input
                type="text"
                placeholder={t('searchComplaints')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ComplaintStatus | '')}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">{t('allStatuses')}</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={issueTypeFilter}
                onChange={(e) => setIssueTypeFilter(e.target.value as IssueType | '')}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">{t('allIssueTypes')}</option>
                <option value="wrong_quantity">Wrong Quantity</option>
                <option value="wrong_part">Wrong Part</option>
                <option value="damaged">Damaged</option>
                <option value="other">Other</option>
              </select>

              <button
                onClick={() => handleExport('csv')}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Export CSV
              </button>
            </div>
          </div>

          <ComplaintList
            refreshTrigger={refreshTrigger}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            issueTypeFilter={issueTypeFilter}
            page={page}
            pageSize={pageSize}
            onComplaintClick={handleComplaintClick}
          />
          
          <ComplaintDetailDrawer
            complaint={selectedComplaint}
            isOpen={isDrawerOpen}
            onClose={handleDrawerClose}
            onUpdate={handleComplaintUpdate}
          />
        </div>
      </div>
    </div>
  );
}