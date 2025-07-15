import React, { useState, useEffect } from 'react';
import { AlertCircle, Calendar, User, Package, Paperclip } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Complaint } from '../../types';
import api from '../../services/api';
import FileUpload from '../FileUpload/FileUpload';

interface ComplaintListProps {
  refreshTrigger?: number;
}

export default function ComplaintList({ refreshTrigger = 0 }: ComplaintListProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedComplaint, setSelectedComplaint] = useState<number | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    fetchComplaints();
  }, [refreshTrigger]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await api.get('/complaints');
      setComplaints(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load complaints');
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

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="flex items-center text-red-600">
          <AlertCircle className="h-5 w-5 mr-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{t('noComplaints')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">{t('recentComplaints')}</h2>
      
      <div className="space-y-4">
        {complaints.map((complaint) => (
          <div key={complaint.id} className="bg-white border rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-start space-x-2 mb-2">
                  <span className="text-sm font-medium text-gray-500 whitespace-nowrap">{t('id')}: {complaint.id}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 break-words leading-tight">{complaint.details.substring(0, 50)}{complaint.details.length > 50 ? '...' : ''}</h3>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ml-auto ${getIssueTypeColor(complaint.issue_type)}`}>
                    {getIssueTypeDisplay(complaint.issue_type)}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{complaint.details}</p>
                
                {complaint.quantity_ordered !== undefined && complaint.quantity_received !== undefined && (
                  <div className="text-sm text-gray-600 mb-2">
                    {t('ordered')}: {complaint.quantity_ordered}, {t('received')}: {complaint.quantity_received}
                  </div>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(complaint.created_at)}
                  </div>
                  
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {complaint.company.name}
                  </div>
                  
                  <div className="flex items-center">
                    <Package className="h-4 w-4 mr-1" />
                    {complaint.part.part_number}
                  </div>
                  
                  {complaint.has_attachments && (
                    <div className="flex items-center">
                      <Paperclip className="h-4 w-4 mr-1" />
                      {t('hasAttachments')}
                    </div>
                  )}
                </div>
              </div>
              
              <button
                type="button"
                onClick={() => setSelectedComplaint(
                  selectedComplaint === complaint.id ? null : complaint.id
                )}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {selectedComplaint === complaint.id ? t('hide') : t('attachFilesButton')}
              </button>
            </div>
            
            {selectedComplaint === complaint.id && (
              <div className="mt-4 pt-4 border-t">
                <FileUpload
                  complaintId={complaint.id}
                  onUploadComplete={fetchComplaints}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}