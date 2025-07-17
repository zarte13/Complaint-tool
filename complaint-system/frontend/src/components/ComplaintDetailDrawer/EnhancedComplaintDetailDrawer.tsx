import React, { useState, useEffect } from 'react';
import { X, Edit3, Save, AlertCircle, Download, FileText } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Complaint, Attachment } from '../../types';
import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';

interface EnhancedComplaintDetailDrawerProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedData: Partial<Complaint>) => void;
}

export default function EnhancedComplaintDetailDrawer({
  complaint,
  isOpen,
  onClose,
  onUpdate,
}: EnhancedComplaintDetailDrawerProps) {
  const { language, t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Complaint>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);

  const dateLocale = language === 'fr' ? fr : enUS;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPpp', { locale: dateLocale });
  };

  const formatRelativeDate = (dateString?: string) => {
    if (!dateString) return t('neverEdited');
    return format(new Date(dateString), 'PPp', { locale: dateLocale });
  };

  const validateField = (field: keyof Complaint, value: any): string | null => {
    switch (field) {
      case 'work_order_number':
        if (!value || value.trim().length === 0) return 'Work order number is required';
        if (value.length > 100) return 'Maximum 100 characters';
        if (!/^[A-Za-z0-9-]+$/.test(value)) return 'Only letters, numbers, and hyphens';
        return null;
      case 'occurrence':
        if (value && value.length > 100) return 'Maximum 100 characters';
        return null;
      case 'part_received':
        if (value && value.length > 100) return 'Maximum 100 characters';
        return null;
      case 'quantity_ordered':
        if (complaint?.issue_type === 'wrong_quantity' || complaint?.issue_type === 'wrong_part') {
          if (!value || value < 1) return 'Must be at least 1';
          if (value > 1000000) return 'Maximum 1,000,000';
        }
        return null;
      case 'quantity_received':
        if (complaint?.issue_type === 'wrong_quantity' || complaint?.issue_type === 'wrong_part') {
          if (value < 0) return 'Cannot be negative';
          if (value > 1000000) return 'Maximum 1,000,000';
        }
        return null;
      case 'details':
        if (!value || value.trim().length < 10) return 'Minimum 10 characters';
        if (value.length > 5000) return 'Maximum 5000 characters';
        return null;
      default:
        return null;
    }
  };

  const handleEdit = () => {
    if (!complaint) return;
    
    setIsEditing(true);
    setEditData({
      work_order_number: complaint.work_order_number,
      occurrence: complaint.occurrence,
      quantity_ordered: complaint.quantity_ordered,
      quantity_received: complaint.quantity_received,
      part_received: complaint.part_received,
      human_factor: complaint.human_factor,
      details: complaint.details,
    });
    setValidationErrors({});
  };

  const handleSave = async () => {
    if (!complaint) return;

    // Validate all fields
    const errors: Record<string, string> = {};
    Object.keys(editData).forEach(key => {
      const error = validateField(key as keyof Complaint, editData[key as keyof Complaint]);
      if (error) errors[key] = error;
    });

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onUpdate({
        ...editData,
        last_edit: new Date().toISOString(),
      });
      setIsEditing(false);
      setEditData({});
      setValidationErrors({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({});
    setValidationErrors({});
    setError(null);
  };

  const fetchAttachments = async () => {
    if (!complaint?.id) return;
    
    setIsLoadingAttachments(true);
    try {
      const response = await fetch(`/api/complaints/${complaint.id}/attachments`);
      if (response.ok) {
        const data = await response.json();
        setAttachments(data);
      }
    } catch (error) {
      console.error('Failed to fetch attachments:', error);
    } finally {
      setIsLoadingAttachments(false);
    }
  };

  const handleDownloadFile = async (attachment: Attachment) => {
    try {
      const response = await fetch(`/api/complaints/attachments/${attachment.id}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = attachment.original_filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Failed to download file:', error);
    }
  };

  useEffect(() => {
    if (complaint?.has_attachments) {
      fetchAttachments();
    }
  }, [complaint?.id, complaint?.has_attachments]);

  const handleFieldChange = (field: keyof Complaint, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
    const error = validateField(field, value);
    setValidationErrors(prev => ({ ...prev, [field]: error || '' }));
  };

  const getIssueTypeDisplay = (issueType: string) => {
    const issueTypes: Record<string, string> = {
      wrong_quantity: 'Wrong Quantity',
      wrong_part: 'Wrong Part',
      damaged: 'Damaged',
      other: 'Other',
    };
    return issueTypes[issueType] || issueType;
  };

  const renderField = (
    label: string,
    value: any,
    fieldName?: keyof Complaint,
    type: 'text' | 'number' | 'textarea' | 'toggle' = 'text'
  ) => {
    const isEditingField = isEditing && fieldName;
    const currentValue = isEditingField ? editData[fieldName] ?? value : value;
    const hasError = fieldName && validationErrors[fieldName as string];

    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">{label}</label>
        {isEditingField ? (
          <div className="space-y-1">
            {type === 'textarea' ? (
              <textarea
                value={currentValue || ''}
                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  hasError ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={3}
              />
            ) : type === 'toggle' ? (
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentValue || false}
                  onChange={(e) => handleFieldChange(fieldName, e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  {currentValue ? 'Yes' : 'No'}
                </span>
              </label>
            ) : (
              <input
                type={type}
                value={currentValue || ''}
                onChange={(e) => handleFieldChange(fieldName, type === 'number' ? Number(e.target.value) : e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  hasError ? 'border-red-500' : 'border-gray-300'
                }`}
              />
            )}
            {hasError && (
              <p className="text-xs text-red-600">{validationErrors[fieldName as string]}</p>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-900">
            {type === 'toggle' ? (currentValue ? 'Yes' : 'No') : 
             type === 'number' ? (currentValue || 0) : 
             (currentValue || '-')}
          </div>
        )}
      </div>
    );
  };

  if (!isOpen || !complaint) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} data-testid="drawer-overlay" />
      <div className="fixed right-0 top-0 h-full w-full max-w-4xl bg-gray-50 shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Complaint #{complaint.id}
              </h2>
              <p className="text-sm text-gray-500">
                {formatRelativeDate(complaint.last_edit)}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-1" />
                        Save
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleEdit}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Edit
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" data-testid="responsive-grid">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-blue-600 rounded-full" />
                    {t('basicInformation')}
                  </h3>
                  <div className="space-y-4">
                    {renderField('ID', complaint.id)}
                    {renderField('Customer Company', complaint.company.name)}
                    {renderField('Part Number', complaint.part.part_number)}
                    {renderField('Issue Type', getIssueTypeDisplay(complaint.issue_type))}
                    {renderField('Status', complaint.status)}
                  </div>
                </div>

                {/* System Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-gray-600 rounded-full" />
                    {t('systemInformation')}
                  </h3>
                  <div className="space-y-4">
                    {renderField('Created', formatDate(complaint.created_at))}
                    {renderField('Updated', formatDate(complaint.updated_at))}
                    {renderField('Last Edit', formatRelativeDate(complaint.last_edit))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Order Details */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-green-600 rounded-full" />
                    {t('orderDetails')}
                  </h3>
                  <div className="space-y-4">
                    {renderField('Work Order Number', complaint.work_order_number, 'work_order_number')}
                    {(complaint.issue_type === 'wrong_quantity' || complaint.issue_type === 'wrong_part') && (
                      <>
                        {renderField('Quantity Ordered', complaint.quantity_ordered, 'quantity_ordered', 'number')}
                        {renderField('Quantity Received', complaint.quantity_received, 'quantity_received', 'number')}
                      </>
                    )}
                    {renderField('Part Received', complaint.part_received, 'part_received')}
                  </div>
                </div>

                {/* Issue Details */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <div className="w-1 h-4 bg-amber-600 rounded-full" />
                    {t('issueDetails')}
                  </h3>
                  <div className="space-y-4">
                    {renderField('Occurrence', complaint.occurrence, 'occurrence')}
                    {renderField('Human Factor', complaint.human_factor, 'human_factor', 'toggle')}
                    {renderField('Details', complaint.details, 'details', 'textarea')}
                  </div>
                </div>

                {/* Attached Files */}
                {complaint.has_attachments && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-1 h-4 bg-purple-600 rounded-full" />
                      {t('attachedFiles')}
                    </h3>
                    <div className="space-y-3">
                      {isLoadingAttachments ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                          <span className="ml-2 text-sm text-gray-600">Loading files...</span>
                        </div>
                      ) : attachments.length > 0 ? (
                        <div className="space-y-2">
                          {attachments.map((attachment) => (
                            <div
                              key={attachment.id}
                              className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center space-x-3">
                                <FileText className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    {attachment.original_filename}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {Math.round(attachment.file_size / 1024)} KB • {attachment.file_type}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDownloadFile(attachment)}
                                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors"
                                title={`Download ${attachment.original_filename}`}
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No files attached
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}