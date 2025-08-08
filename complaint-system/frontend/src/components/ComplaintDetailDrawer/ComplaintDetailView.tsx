import { useLanguage } from '../../contexts/LanguageContext';
import { Complaint } from '../../types';

interface ComplaintDetailViewProps {
  complaint: Complaint;
}

export default function ComplaintDetailView({ complaint }: ComplaintDetailViewProps) {
  const { t } = useLanguage();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
    return translated ? translated : issueType;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">{t('basicInformation')}</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('id')}</label>
            <p className="mt-1 text-sm text-gray-900">{complaint.id}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('customerCompany')}</label>
            <p className="mt-1 text-sm text-gray-900">{complaint.company.name}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('partNumber')}</label>
            <p className="mt-1 text-sm text-gray-900">{complaint.part.part_number}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('issueType')}</label>
            <p className="mt-1 text-sm text-gray-900">{getIssueTypeDisplay(complaint.issue_type)}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('status')}</label>
            <p className="mt-1 text-sm text-gray-900">{complaint.status}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('createdAt')}</label>
            <p className="mt-1 text-sm text-gray-900">{formatDate(complaint.created_at)}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('updatedAt')}</label>
            <p className="mt-1 text-sm text-gray-900">{formatDate(complaint.updated_at)}</p>
          </div>
        </div>
      </div>

      {/* Removed Additional Information section as requested */}
      <div className="hidden">
        <h3 className="text-sm font-medium text-gray-900 mb-3">{t('additionalInformation')}</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('workOrderNumber')}</label>
            <p className="mt-1 text-sm text-gray-900">{complaint.work_order_number || 'N/A'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('occurrence')}</label>
            <p className="mt-1 text-sm text-gray-900">{complaint.occurrence || 'N/A'}</p>
          </div>
          
          <div>
            <label className="block text sm font-medium text-gray-700">{t('partReceived')}</label>
            <p className="mt-1 text-sm text-gray-900">{complaint.part_received || 'N/A'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('quantityOrdered')}</label>
            <p className="mt-1 text-sm text-gray-900">{complaint.quantity_ordered || 'N/A'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('quantityReceived')}</label>
            <p className="mt-1 text-sm text-gray-900">{complaint.quantity_received || 'N/A'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('humanFactor')}</label>
            <p className="mt-1 text-sm text-gray-900">{complaint.human_factor ? 'Yes' : 'No'}</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('details')}</label>
            <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{complaint.details}</p>
          </div>
        </div>
      </div>
    </div>
  );
}