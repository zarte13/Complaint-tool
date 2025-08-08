import { useState, useEffect, useRef } from 'react';
import { X, Edit3, Save, AlertCircle, Download, FileText, ChevronDown, Loader2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../../contexts/LanguageContext';
import { Complaint, Attachment, ComplaintStatus } from '../../types';
import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import ImageGallery from './ImageGallery';
import { FollowUpActionsPanel } from '../FollowUpActions/FollowUpActionsPanel';
import { get as apiGet, put as apiPut, del as apiDel } from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { complaintsStore } from '../../stores/complaintsStore';

interface EnhancedComplaintDetailDrawerProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedData: Partial<Complaint>) => void;
  onDeleted?: (id: number) => void;
}

export default function EnhancedComplaintDetailDrawer({
  complaint,
  isOpen,
  onClose,
  onUpdate,
  onDeleted,
}: EnhancedComplaintDetailDrawerProps) {
  const { language, t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<Complaint>>({});
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  // Local UI status state normalized to canonical values
  const [uiStatus, setUiStatus] = useState<ComplaintStatus | null>(null);
  const tilesContainerRef = useRef<HTMLDivElement>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isAdmin = useAuthStore((s) => s.isAdmin());

  const dateLocale = language === 'fr' ? fr : enUS;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'PPpp', { locale: dateLocale });
  };

  // Removed unused formatRelativeDate

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
    if (!isAuthenticated) return; // read-only when not logged in
    
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
    if (!isAuthenticated) return;

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
      const updatedData = {
        ...editData,
        last_edit: new Date().toISOString(),
      };
      await onUpdate(updatedData);
      // IMPORTANT: do not overwrite status coming from server optimistically here.
      // Only update fields from editData to avoid resetting status UI.
      complaintsStore.updateComplaintInCache({ ...complaint, ...updatedData });
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

  const handleStatusChange = async (newStatus: ComplaintStatus, isRetry: boolean = false) => {
    if (!complaint || complaint.status === newStatus) return;
    if (!isAuthenticated) return;

    // Optimistically reflect the new status in the dropdown immediately
    setUiStatus(newStatus);

    if (!isRetry) {
      setRetryCount(0);
      setStatusError(null);
    }

    setIsUpdatingStatus(true);
    setError(null);
    setStatusError(null);

    try {
      const { data: updatedComplaint } = await apiPut<Complaint>(`/api/complaints/${complaint.id}` as any, { status: newStatus });

      // Use server-confirmed status
      const canonical = updatedComplaint.status as ComplaintStatus;

      // Push the confirmed status to the parent and cache
      const updatedData = { status: canonical as ComplaintStatus };
      onUpdate(updatedData);
      complaintsStore.updateComplaintInCache({ ...complaint, ...updatedData });

      // Ensure local UI matches server-confirmed value (prevents flicker back to previous)
      setUiStatus(canonical);
    } catch (err) {
      // Rollback optimistic selection on failure
      setUiStatus(complaint.status as ComplaintStatus);

      if (retryCount === 0 && !isRetry) {
        setRetryCount(1);
        setTimeout(() => {
          handleStatusChange(newStatus, true);
        }, 100);
        return;
      }

      setStatusError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleFirstActionCreated = async () => {
    // Automatically transition from "open" to "in_progress" when first action is added
    if (complaint && complaint.status === 'open') {
      try {
        await onUpdate({ status: 'in_progress' });
      } catch (err) {
        console.error('Failed to auto-update status to in_progress:', err);
        // Don't show user-facing error for this automatic transition
      }
    }
  };

  const fetchAttachments = async () => {
    if (!complaint?.id) return;
    
    setIsLoadingAttachments(true);
    try {
      const { data } = await apiGet(`/api/complaints/${complaint.id}/attachments` as any);
      setAttachments(data as any);
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

  const handleDeleteAttachment = async (attachment: Attachment) => {
    if (!isAuthenticated) return;
    try {
      // Confirm with i18n
      const message = t('confirmDeleteAttachment') || 'Delete this attachment?';
      if (!window.confirm(message)) return;

      const res = await apiDel(`/api/complaints/attachments/${attachment.id}` as any);
      if (res.status >= 400) {
        throw new Error(`Failed to delete attachment: ${res.statusText}`);
      }

      // Remove from local list
      setAttachments(prev => prev.filter(a => a.id !== attachment.id));
      // If none left, update complaint store so UI reacts
      if (attachments.length - 1 <= 0 && complaint) {
        complaintsStore.updateComplaintInCache({ ...complaint, has_attachments: false });
        onUpdate({ has_attachments: false as any });
      }
    } catch (err) {
      console.error('Failed to delete attachment:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete attachment');
    }
  };

  useEffect(() => {
    if (complaint?.has_attachments) {
      fetchAttachments();
    }
  }, [complaint?.id, complaint?.has_attachments]);

  // Keep local UI status in sync with complaint prop (normalize any 'closed' -> 'resolved')
  useEffect(() => {
    if (complaint?.status) {
      const incoming = complaint.status as ComplaintStatus;
      setUiStatus(incoming);
    } else {
      setUiStatus(null);
    }
  }, [complaint?.status]);

  // Optional: listen to SW messages about sync status/conflicts
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const data: any = (event as any).data;
      if (!data) return;
      if (data.type === 'sync-conflict') {
        // In a full implementation, we could surface a toast/badge
        // console.warn('Offline sync conflict for', data.url);
      }
    };
    if (typeof window !== 'undefined' && (navigator as any).serviceWorker) {
      (navigator as any).serviceWorker.addEventListener('message', handler as any);
    }
    return () => {
      if (typeof window !== 'undefined' && (navigator as any).serviceWorker) {
        (navigator as any).serviceWorker.removeEventListener('message', handler as any);
      }
    };
  }, []);

  // Animation control:
  // - First ever open per complaint in a session: run animations
  // - Subsequent opens: no animation (instant), but still visible
  // This avoids blank-on-first-open while restoring animations only for the very first open.
  useEffect(() => {
    if (!isOpen || !complaint) return;

    const sessionKey = `complaint-${complaint.id}-animated`;
    const hasAnimatedInSession = sessionStorage.getItem(sessionKey);

    if (hasAnimatedInSession) {
      // Already animated once this session for this complaint -> skip animation
      return;
    }

    // Mark as animated for the rest of the session to avoid re-animations
    const timeout = requestAnimationFrame(() => {
      sessionStorage.setItem(sessionKey, 'true');
    });

    return () => {
      cancelAnimationFrame(timeout);
    };
  }, [isOpen, complaint]);

  const handleFieldChange = (field: keyof Complaint, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
    const error = validateField(field, value);
    setValidationErrors(prev => ({ ...prev, [field]: error || '' }));
  };

  const getIssueTypeDisplay = (issueType: string, category?: string, subtypes?: string[]) => {
    if (category) {
      const prettyCategory: Record<string, string> = {
        dimensional: 'Dimensional',
        visual: 'Visual',
        packaging: 'Packaging',
        other: 'Other',
      };
      const cat = prettyCategory[category] || category;
      if (subtypes && subtypes.length > 0) {
        return `${cat} — ${subtypes.join(', ')}`;
      }
      return cat;
    }
    const issueTypes: Record<string, string> = {
      wrong_quantity: 'Wrong Quantity',
      wrong_part: 'Wrong Part',
      damaged: 'Damaged',
      other: 'Other',
    };
    return issueTypes[issueType] || issueType;
  };

  // Accept string to avoid TS literal mismatch when server might surface "closed"
  const getStatusDisplay = (status: string) => {
    const normalized = (status === 'closed' ? 'resolved' : status) as ComplaintStatus;
    switch (normalized) {
      case 'open':
        return { label: 'Open', color: 'text-blue-800', bgColor: 'bg-blue-100', icon: '⚪' };
      case 'in_progress':
        return { label: 'In Progress', color: 'text-yellow-800', bgColor: 'bg-yellow-100', icon: '🟡' };
      case 'resolved':
        return { label: 'Resolved', color: 'text-green-800', bgColor: 'bg-green-100', icon: '✅' };
      default:
        return { label: normalized, color: 'text-gray-800', bgColor: 'bg-gray-100', icon: '⚪' };
    }
  };

  const renderStatusDropdown = () => {
    if (!complaint) return null;

    // If a status update is in-flight, lock the dropdown to uiStatus (optimistic),
    // else use latest from props with normalization.
    const raw = (uiStatus ?? complaint.status) as any;
    const normalizedDisplay = (raw === 'closed' ? 'resolved' : raw) as ComplaintStatus;

    const currentStatus = getStatusDisplay(normalizedDisplay);
    const statusOptions: ComplaintStatus[] = ['open', 'in_progress', 'resolved'];
    
    return (
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Status</label>
        <div className="relative">
          <select
            value={normalizedDisplay}
            onChange={(e) => {
              e.preventDefault();
              const next = e.target.value as ComplaintStatus;
              // Optimistically update and prevent immediate prop overwrite flicker
              setUiStatus(next);
              // Make the network call; the success handler will persist the same value
              handleStatusChange(next);
            }}
            disabled={isUpdatingStatus || !isAuthenticated}
            className={`
              w-full px-3 py-2 pr-8 text-sm border border-gray-300 rounded-md 
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
              appearance-none cursor-pointer bg-white transition-opacity duration-200
              ${(isUpdatingStatus || !isAuthenticated) ? 'cursor-not-allowed opacity-70' : ''}
            `}
          >
            {statusOptions.map((status) => {
              const statusInfo = getStatusDisplay(status);
              return (
                <option key={status} value={status}>
                  {statusInfo.icon} {statusInfo.label}
                </option>
              );
            })}
            {/* Also handle potential outward "closed" status from API by mapping in UI */}
            <option value="resolved" hidden>Resolved</option>
          </select>
          
          {/* Animated caret/spinner */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <AnimatePresence mode="wait">
              {isUpdatingStatus ? (
                <motion.div
                  key="spinner"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ 
                    duration: 0.25,
                    ease: "easeOut"
                  }}
                >
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                </motion.div>
              ) : (
                <motion.div
                  key="caret"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ 
                    duration: 0.2,
                    ease: "easeOut"
                  }}
                >
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Animated status text with cross-fade */}
          <div className="mt-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={normalizedDisplay}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ 
                  duration: 0.2,
                  ease: "easeOut"
                }}
                className="flex items-center justify-between"
              >
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${currentStatus.bgColor} ${currentStatus.color}`}>
                  <span className="mr-1">{currentStatus.icon}</span>
                  {currentStatus.label}
                </span>
                
                {/* Inline error display */}
                {statusError && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs text-red-500 flex items-center gap-1"
                  >
                    <AlertCircle className="w-3 h-3" />
                    {statusError}
                  </motion.span>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    );
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
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="overlay"
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={onClose}
            data-testid="drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* Sliding Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key={`drawer-${complaint.id}`}
            className="fixed right-0 top-0 h-full w-full max-w-7xl bg-gray-50 shadow-xl z-50 flex flex-col will-change-transform"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}  /* easeOutQuint-like */
            onAnimationComplete={() => {
              // no-op placeholder to ensure timing consistency
            }}
          >
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {`Complaint #${complaint.id}`}
                  </h2>
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
                    <>
                      {isAuthenticated && (
                        <button
                          onClick={handleEdit}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <Edit3 className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={async () => {
                            if (!complaint) return;
                            const ok = window.confirm('Delete this complaint? This cannot be undone.');
                            if (!ok) return;
                            try {
                              const res = await apiDel(`/api/complaints/${complaint.id}` as any);
                              if (res.status >= 400) throw new Error(res.statusText as any);
                              // Soft delete: backend hides it; remove from client cache immediately
                              complaintsStore.removeComplaintFromCache(complaint.id);
                              if (onDeleted) onDeleted(complaint.id);
                              onClose();
                            } catch (err) {
                              setError(err instanceof Error ? err.message : 'Failed to delete complaint');
                            }
                          }}
                          className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      )}
                    </>
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

                {/* Two-Column Responsive Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" data-testid="responsive-grid" ref={tilesContainerRef}>
                  {/* Left Column - Information Sections */}
                  <div className="lg:col-span-1 space-y-6">
                    {/* Image Gallery */}
                    <motion.div
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 24 }}
                      transition={{ duration: 0.25, ease: 'easeOut', delay: 0.0 }}
                    >
                      <ImageGallery
                        complaintId={complaint.id}
                        attachments={attachments}
                        isLoading={isLoadingAttachments}
                      />
                    </motion.div>

                    {/* Basic Information */}
                    <motion.div
                      className="bg-white border border-gray-200 rounded-lg p-4"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 24 }}
                      transition={{ duration: 0.25, ease: 'easeOut', delay: 0.08 }}
                    >
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-1 h-4 bg-blue-600 rounded-full" />
                        {t('basicInformation')}
                      </h3>
                      <div className="space-y-4">
                        {renderField(t('customerCompany') || 'Customer Company', complaint.company.name)}
                        {renderField(t('partNumber') || 'Part Number', complaint.part.part_number)}
                        {renderField(
                          t('issueType') || 'Issue Type',
                          getIssueTypeDisplay(complaint.issue_type as any, complaint.issue_category as any, complaint.issue_subtypes as any)
                        )}
                        {renderStatusDropdown()}
                      </div>
                    </motion.div>

                    {/* Order Details */}
                    <motion.div
                      className="bg-white border border-gray-200 rounded-lg p-4"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 24 }}
                      transition={{ duration: 0.25, ease: 'easeOut', delay: 0.12 }}
                    >
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-1 h-4 bg-green-600 rounded-full" />
                        {t('orderDetails')}
                      </h3>
                      <div className="space-y-4">
                        {renderField(t('workOrderNumber') || 'Work Order Number', complaint.work_order_number, 'work_order_number')}
                        {(complaint.issue_category === 'packaging' && (complaint.issue_subtypes?.includes('wrong_quantity') || complaint.issue_subtypes?.includes('wrong_part'))) && (
                          <>
                            {renderField(t('quantityOrdered') || 'Quantity Ordered', complaint.quantity_ordered, 'quantity_ordered', 'number')}
                            {renderField(t('quantityReceived') || 'Quantity Received', complaint.quantity_received, 'quantity_received', 'number')}
                          </>
                        )}
                        {renderField(t('partReceived') || 'Part Received', complaint.part_received, 'part_received')}
                      </div>
                    </motion.div>

                    {/* Issue Details */}
                    <motion.div
                      className="bg-white border border-gray-200 rounded-lg p-4"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 24 }}
                      transition={{ duration: 0.25, ease: 'easeOut', delay: 0.18 }}
                    >
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-1 h-4 bg-amber-600 rounded-full" />
                        {t('issueDetails')}
                      </h3>
                      <div className="space-y-4">
                        {renderField(t('occurrence') || 'Occurrence', complaint.occurrence, 'occurrence')}
                        {renderField(t('humanFactor') || 'Human Factor', complaint.human_factor, 'human_factor', 'toggle')}
                        {renderField(t('details') || 'Details', complaint.details, 'details', 'textarea')}
                      </div>
                    </motion.div>

                    {/* System Information */}
                    <motion.div
                      className="bg-white border border-gray-200 rounded-lg p-4"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 24 }}
                      transition={{ duration: 0.25, ease: 'easeOut', delay: 0.24 }}
                    >
                      <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-1 h-4 bg-gray-600 rounded-full" />
                        {t('systemInformation')}
                      </h3>
                      <div className="space-y-4">
                        {renderField(t('createdAt') || 'Created At', formatDate(complaint.created_at))}
                        {renderField(t('updatedAt') || 'Updated At', formatDate(complaint.updated_at))}
                      </div>
                    </motion.div>
                  </div>

                  {/* Right Column - Actions & Attachments (Spans 2 columns) */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Follow-up Actions Panel - Full width for better usability */}
                    <motion.div
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 24 }}
                      transition={{ duration: 0.25, ease: 'easeOut', delay: 0.36 }}
                    >
                       <FollowUpActionsPanel
                        complaintId={complaint.id}
                         isEditable={isAuthenticated && !isEditing}
                        className="bg-white border border-gray-200 rounded-lg"
                        onFirstActionCreated={handleFirstActionCreated}
                      />
                    </motion.div>

                    {/* Attached Files */}
                    {complaint.has_attachments && (
                      <motion.div
                        className="bg-white border border-gray-200 rounded-lg p-4"
                        initial={{ opacity: 0, x: 24 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 24 }}
                        transition={{ duration: 0.25, ease: 'easeOut', delay: 0.36 }}
                      >
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-1 h-4 bg-purple-600 rounded-full" />
                          {t('attachedFiles')}
                        </h3>
                        <div className="space-y-3">
                          {isLoadingAttachments ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                              <span className="ml-2 text-sm text-gray-600">{t('loadingFiles') || 'Loading files...'}</span>
                            </div>
                          ) : attachments.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {attachments.map((attachment) => (
                                <div
                                  key={attachment.id}
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                                >
                                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                                    <FileText className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {attachment.original_filename}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        {Math.round(attachment.file_size / 1024)} KB • {attachment.mime_type}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                      onClick={() => handleDownloadFile(attachment)}
                                      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-purple-600 bg-purple-50 rounded-md hover:bg-purple-100 transition-colors"
                                      title={t('downloadAttachment') || `Download ${attachment.original_filename}`}
                                    >
                                      <Download className="h-3 w-3 mr-1" />
                                      {t('download') || 'Download'}
                                    </button>
                                    {isAuthenticated && (
                                      <button
                                        onClick={() => handleDeleteAttachment(attachment)}
                                        className="inline-flex items-center px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                                        title={t('deleteAttachment') || 'Delete attachment'}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500 text-center py-4">
                              {t('noFilesAttached') || 'No files attached'}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}