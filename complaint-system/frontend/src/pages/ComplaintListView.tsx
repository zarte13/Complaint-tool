import { useLanguage } from '../contexts/LanguageContext';
import { useComplaints } from '../hooks/useComplaints';
import { Calendar, User, Package, Paperclip } from 'lucide-react';
import { ComplaintStatus, IssueCategory } from '../types';
import StatusFilter from '../components/StatusFilter/StatusFilter';

export default function ComplaintListView() {
  const { t } = useLanguage();
  const {
    complaints,
    loading,
    error,
    search,
    filters,
    setSearch,
    setFilters,
    exportData,
  } = useComplaints();

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      await exportData(format);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // Status color and display utilities
  const getStatusColors = (status: ComplaintStatus) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: ComplaintStatus) => {
    switch (status) {
      case 'open':
        return '⚪';
      case 'in_progress':
        return '🟡';
      case 'resolved':
        return '✅';
      default:
        return '⚪';
    }
  };

  const getStatusDisplay = (status: ComplaintStatus) => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      default:
        return status;
    }
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'dimensional':
        return 'bg-blue-100 text-blue-800';
      case 'visual':
        return 'bg-amber-100 text-amber-800';
      case 'packaging':
        return 'bg-purple-100 text-purple-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryDisplay = (category?: string) => {
    switch (category) {
      case 'dimensional':
        return (t('categoryDimensional') || 'Dimensional').toUpperCase();
      case 'visual':
        return (t('categoryVisual') || 'Visual').toUpperCase();
      case 'packaging':
        return (t('categoryPackaging') || 'Packaging').toUpperCase();
      case 'other':
        return (t('other') || 'Other').toUpperCase();
      default:
        return (t('other') || 'Other').toUpperCase();
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-center py-8">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex gap-2">
              <StatusFilter
                selectedStatuses={filters.status || []}
                onStatusChange={(statuses) => setFilters({ ...filters, status: statuses.length > 0 ? statuses : undefined })}
                className="min-w-[180px]"
              />

              <select
                value={(filters as any).issue_category || ''}
                onChange={(e) => setFilters({ ...filters, ...(e.target.value ? { issue_category: e.target.value as IssueCategory } : { issue_category: undefined }) })}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">{t('allIssueTypes')}</option>
                <option value="dimensional">{t('categoryDimensional') || 'Dimensional'}</option>
                <option value="visual">{t('categoryVisual') || 'Visual'}</option>
                <option value="packaging">{t('categoryPackaging') || 'Packaging'}</option>
                <option value="other">{t('other') || 'Other'}</option>
              </select>

              <button
                onClick={() => handleExport('csv')}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* Complaints List */}
          <div className="space-y-4">
            {complaints.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">{t('noComplaints')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {complaints.map((complaint) => (
                  <div key={complaint.id} className="bg-white border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start space-x-2 mb-2">
                          <span className="text-sm font-medium text-gray-500 whitespace-nowrap">
                            {t('id')}: {complaint.id}
                          </span>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 break-words leading-tight">
                              {complaint.details.substring(0, 50)}
                              {complaint.details.length > 50 ? '...' : ''}
                            </h3>
                          </div>
                          <div className="flex gap-2 ml-auto">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColors(
                                complaint.status
                              )}`}
                            >
                              {getStatusIcon(complaint.status)} {getStatusDisplay(complaint.status)}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getCategoryColor(
                                complaint.issue_category as any
                              )}`}
                            >
                              {getCategoryDisplay(complaint.issue_category as any)}
                            </span>
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-3">{complaint.details}</p>

                        {complaint.work_order_number && (
                          <div className="text-sm text-gray-600 mb-1">
                            Work Order: {complaint.work_order_number}
                          </div>
                        )}

                        {complaint.occurrence && (
                          <div className="text-sm text-gray-600 mb-1">
                            Occurrence: {complaint.occurrence}
                          </div>
                        )}

                        {complaint.quantity_ordered !== undefined &&
                          complaint.quantity_received !== undefined && (
                            <div className="text-sm text-gray-600 mb-2">
                              {t('ordered')}: {complaint.quantity_ordered}, {t('received')}:{' '}
                              {complaint.quantity_received}
                            </div>
                          )}

                        {complaint.part_received && (
                          <div className="text-sm text-gray-600 mb-2">
                            Part Received: {complaint.part_received}
                          </div>
                        )}

                        {complaint.human_factor && (
                          <div className="text-sm text-gray-600 mb-2">
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                              Human Factor
                            </span>
                          </div>
                        )}

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            {/* icons */}
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
// Helper functions (unused helpers commented cleanly to avoid TS errors)
// const getIssueTypeColor = (issueType: string) => {
//   switch (issueType) {
//     case 'wrong_quantity':
//       return 'bg-blue-100 text-blue-800';
//     case 'wrong_part':
//       return 'bg-purple-100 text-purple-800';
//     case 'damaged':
//       return 'bg-red-100 text-red-800';
//     case 'other':
//       return 'bg-gray-100 text-gray-800';
//     default:
//       return 'bg-gray-100 text-gray-800';
//   }
// };

// const getIssueTypeDisplay = (issueType: string) => {
//   const issueTypeMap: Record<string, string> = {
//     wrong_quantity: 'wrongQuantity',
//     wrong_part: 'wrongPart',
//     damaged: 'damaged',
//     other: 'other',
//   };
//   const key = issueTypeMap[issueType] || 'other';
//   return key.toUpperCase();
// };

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Import necessary icons