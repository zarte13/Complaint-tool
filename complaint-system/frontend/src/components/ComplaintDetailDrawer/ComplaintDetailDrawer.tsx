import React, { useState, useEffect } from 'react';
import { X, Edit3, Save, RotateCcw, RotateCw } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Complaint } from '../../types';
import ComplaintDetailView from './ComplaintDetailView';
import ComplaintEditForm from './ComplaintEditForm';
import useUndoRedo from './useUndoRedo';
import useKeyboardShortcuts from './useKeyboardShortcuts';

interface ComplaintDetailDrawerProps {
  complaint: Complaint | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedData: Partial<Complaint>) => void;
}

export default function ComplaintDetailDrawer({
  complaint,
  isOpen,
  onClose,
  onUpdate,
}: ComplaintDetailDrawerProps) {
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { state, canUndo, canRedo, addState, undo, redo, reset } = useUndoRedo<Partial<Complaint>>({});

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      reset({});
    }
  };

  const handleFieldChange = (field: keyof Complaint, value: any) => {
    const newData = { ...state, [field]: value };
    addState(newData);
  };

  const handleSave = async () => {
    if (!complaint || Object.keys(state).length === 0) return;

    setIsSaving(true);
    setError(null);

    try {
      await onUpdate(state);
      setIsEditing(false);
      reset({});
    } catch (err) {
      setError('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUndo = () => {
    undo();
  };

  const handleRedo = () => {
    redo();
  };

  useEffect(() => {
    if (complaint) {
      reset({});
    }
  }, [complaint, reset]);

  useKeyboardShortcuts({
    onClose: onClose,
    onSave: handleSave,
    onUndo: canUndo ? handleUndo : undefined,
    onRedo: canRedo ? handleRedo : undefined,
  });

  if (!isOpen || !complaint) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full sm:w-96 md:w-[500px] bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="px-4 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('complaintDetails')}
              </h2>
              <div className="flex items-center space-x-2">
                {isEditing && (
                  <>
                    <button
                      onClick={handleUndo}
                      disabled={!canUndo}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      title={t('undo')}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleRedo}
                      disabled={!canRedo}
                      className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      title={t('redo')}
                    >
                      <RotateCw className="h-4 w-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={handleEditToggle}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title={isEditing ? t('cancel') : t('edit')}
                >
                  {isEditing ? <X className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600"
                  title={t('closePanel')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {isEditing ? (
              <ComplaintEditForm
                complaint={complaint}
                onFieldChange={handleFieldChange}
                onSave={handleSave}
                onCancel={handleEditToggle}
                isSaving={isSaving}
              />
            ) : (
              <ComplaintDetailView complaint={complaint} />
            )}
          </div>

          {/* Footer */}
          {isEditing && (
            <div className="px-4 py-4 border-t border-gray-200">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleEditToggle}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || !state || Object.keys(state).length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                      {t('saving')}
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 inline-block mr-2" />
                      {t('save')}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}