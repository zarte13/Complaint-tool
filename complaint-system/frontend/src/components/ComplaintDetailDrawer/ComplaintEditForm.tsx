import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Complaint } from '../../types';

interface ComplaintEditFormProps {
  complaint: Complaint;
  onFieldChange: (field: keyof Complaint, value: any) => void;
  onSave: () => void;
  onCancel: () => void;
  isSaving: boolean;
  errors?: Record<string, string>;
}

export default function ComplaintEditForm({
  complaint,
  onFieldChange,
  onSave: _onSave,
  onCancel: _onCancel,
  isSaving: _isSaving,
  errors = {}
}: ComplaintEditFormProps) {
  const { t } = useLanguage();
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  const validateField = (field: string, value: string) => {
    const newErrors = { ...localErrors };
    
    switch (field) {
      case 'work_order_number':
        if (value.length > 100) {
          newErrors[field] = 'Work order number must be 100 characters or less';
        } else if (!/^[A-Za-z0-9-]+$/.test(value)) {
          newErrors[field] = 'Work order number can only contain letters, numbers, and hyphens';
        } else {
          delete newErrors[field];
        }
        break;
      case 'occurrence':
        if (value.length > 100) {
          newErrors[field] = 'Occurrence must be 100 characters or less';
        } else {
          delete newErrors[field];
        }
        break;
      default:
        delete newErrors[field];
    }
    
    setLocalErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFieldChange = (field: keyof Complaint, value: string) => {
    if (validateField(field, value)) {
      onFieldChange(field, value);
    }
  };

  const handleBlur = (field: keyof Complaint, value: string) => {
    if (validateField(field, value)) {
      onFieldChange(field, value);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">{t('editableFields')}</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="work_order_number" className="block text-sm font-medium text-gray-700">
              {t('workOrderNumber')}
            </label>
            <input
              type="text"
              id="work_order_number"
              value={complaint.work_order_number || ''}
              onChange={(e) => handleFieldChange('work_order_number', e.target.value)}
              onBlur={(e) => handleBlur('work_order_number', e.target.value)}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                (errors.work_order_number || localErrors.work_order_number) ? 'border-red-300' : ''
              }`}
              maxLength={100}
            />
            {(errors.work_order_number || localErrors.work_order_number) && (
              <p className="mt-1 text-sm text-red-600">
                {errors.work_order_number || localErrors.work_order_number}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="occurrence" className="block text-sm font-medium text-gray-700">
              {t('occurrence')}
            </label>
            <input
              type="text"
              id="occurrence"
              value={complaint.occurrence || ''}
              onChange={(e) => handleFieldChange('occurrence', e.target.value)}
              onBlur={(e) => handleBlur('occurrence', e.target.value)}
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                (errors.occurrence || localErrors.occurrence) ? 'border-red-300' : ''
              }`}
              maxLength={100}
            />
            {(errors.occurrence || localErrors.occurrence) && (
              <p className="mt-1 text-sm text-red-600">
                {errors.occurrence || localErrors.occurrence}
              </p>
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">{t('readOnlyInformation')}</h3>
        <div className="space-y-3 text-sm text-gray-600">
          <p><strong>{t('customerCompany')}:</strong> {complaint.company.name}</p>
          <p><strong>{t('partNumber')}:</strong> {complaint.part.part_number}</p>
          <p><strong>{t('issueType')}:</strong> {complaint.issue_type}</p>
          <p><strong>{t('details')}:</strong> {complaint.details}</p>
          <p><strong>{t('quantityOrdered')}:</strong> {complaint.quantity_ordered || 'N/A'}</p>
          <p><strong>{t('quantityReceived')}:</strong> {complaint.quantity_received || 'N/A'}</p>
          <p><strong>{t('partReceived')}:</strong> {complaint.part_received || 'N/A'}</p>
          <p><strong>{t('humanFactor')}:</strong> {complaint.human_factor ? 'Yes' : 'No'}</p>
        </div>
      </div>
    </div>
  );
}