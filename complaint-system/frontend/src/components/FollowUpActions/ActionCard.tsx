import React, { useState, useRef } from 'react';
import { FollowUpAction, FollowUpActionUpdate, ResponsiblePerson, ActionStatus, ActionPriority } from '../../types';

interface ActionCardProps {
  action: FollowUpAction;
  isEditable: boolean;
  isDragging: boolean;
  responsiblePersons: ResponsiblePerson[];
  onUpdate: (updates: FollowUpActionUpdate) => Promise<void>;
  onDelete: () => Promise<void>;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  action,
  isEditable,
  isDragging,
  responsiblePersons,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);
  
  // Form data for editing (mirrors AddActionForm structure)
  const [formData, setFormData] = useState({
    action_text: action.action_text,
    responsible_person: action.responsible_person,
    priority: action.priority,
    due_date: action.due_date || '',
    notes: action.notes || '',
    status: action.status,
    completion_percentage: action.completion_percentage
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Validation rules (exact copy from AddActionForm)
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'action_text':
        if (!value || value.trim().length < 5) {
          return 'Le texte de l\'action doit contenir au moins 5 caractères';
        }
        if (value.length > 500) {
          return 'Le texte ne peut pas dépasser 500 caractères';
        }
        return '';
      case 'responsible_person':
        if (!value || value.trim() === '') {
          return 'Un responsable doit être assigné';
        }
        return '';
      case 'due_date':
        if (value && new Date(value) < new Date(new Date().toDateString())) {
          return 'La date d\'échéance ne peut pas être dans le passé';
        }
        return '';
      case 'notes':
        if (value && value.length > 1000) {
          return 'Les notes ne peuvent pas dépasser 1000 caractères';
        }
        return '';
      default:
        return '';
    }
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field as keyof typeof formData]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle field change
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    
    // Clear error for this field if it becomes valid
    if (touchedFields[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  // Handle field blur
  const handleFieldBlur = (field: string) => {
    setTouchedFields(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof typeof formData]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Get field error display
  const getFieldError = (field: string): string => {
    return touchedFields[field] ? errors[field] || '' : '';
  };

  // Check if field has error
  const hasFieldError = (field: string): boolean => {
    return touchedFields[field] && !!errors[field];
  };

  // Handle card click to enter edit mode
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditable || isEditing) return;
    
    // Reset form data and validation state
    setFormData({
      action_text: action.action_text,
      responsible_person: action.responsible_person,
      priority: action.priority,
      due_date: action.due_date || '',
      notes: action.notes || '',
      status: action.status,
      completion_percentage: action.completion_percentage
    });
    setErrors({});
    setTouchedFields({});
    setIsEditing(true);
  };

  // Handle save changes
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const updates: FollowUpActionUpdate = {
        action_text: formData.action_text,
        responsible_person: formData.responsible_person,
        priority: formData.priority,
        due_date: formData.due_date || undefined,
        notes: formData.notes || undefined,
        status: formData.status,
        completion_percentage: formData.completion_percentage
      };
      
      await onUpdate(updates);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update action:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel editing
  const handleCancel = () => {
    setIsEditing(false);
    setErrors({});
    setTouchedFields({});
  };

  // Handle delete
  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete();
      setShowConfirmDelete(false);
    } catch (error) {
      console.error('Failed to delete action:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle overflow menu actions
  const handleMenuAction = (actionType: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    
    switch (actionType) {
      case 'edit':
        handleCardClick(e);
        break;
      case 'duplicate':
        // TODO: Implement duplicate functionality
        alert('Fonctionnalité de duplication à venir');
        break;
      case 'delete':
        setShowConfirmDelete(true);
        break;
    }
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Non définie';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Check if overdue
  const isOverdue = action.is_overdue && action.status !== 'closed';

  // Handle drag operations
  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    onDragStart();
  };

  // Handle checkbox status toggle
  const handleStatusToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isEditable) return;
    
    setIsLoading(true);
    try {
      const newStatus: ActionStatus = action.status === 'closed' ? 'open' : 'closed';
      const updates: FollowUpActionUpdate = { 
        status: newStatus,
        completion_percentage: newStatus === 'closed' ? 100 : 0
      };
      
      await onUpdate(updates);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isEditing) {
    // INLINE EDITING MODE - Mirrors exact AddActionForm layout and styling
    return (
      <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
        {/* Header - matches AddActionForm header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Modifier l'Action #{action.action_number}
            </h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Action #{action.action_number} pour la réclamation #{action.complaint_id}
          </p>
        </div>

        {/* Form - exact copy of AddActionForm structure */}
        <div className="px-6 py-4">
          <div className="space-y-6">
            {/* Action Text - exact match */}
            <div>
              <label htmlFor="action_text" className="block text-sm font-medium text-gray-700 mb-2">
                Description de l'Action *
              </label>
              <textarea
                id="action_text"
                value={formData.action_text}
                onChange={(e) => handleFieldChange('action_text', e.target.value)}
                onBlur={() => handleFieldBlur('action_text')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  hasFieldError('action_text') ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={4}
                placeholder="Décrire précisément l'action à réaliser (ex: Réviser le processus de contrôle qualité pour éviter les défauts similaires)"
                disabled={isLoading}
              />
              {getFieldError('action_text') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('action_text')}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.action_text.length}/500 caractères
              </p>
            </div>

            {/* Responsible Person - exact match */}
            <div>
              <label htmlFor="responsible_person" className="block text-sm font-medium text-gray-700 mb-2">
                Responsable *
              </label>
              <select
                id="responsible_person"
                value={formData.responsible_person}
                onChange={(e) => handleFieldChange('responsible_person', e.target.value)}
                onBlur={() => handleFieldBlur('responsible_person')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  hasFieldError('responsible_person') ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={isLoading}
              >
                <option value="">Sélectionner un responsable</option>
                {responsiblePersons.map(person => (
                  <option key={person.id} value={person.name}>
                    {person.name} {person.department && `(${person.department})`}
                  </option>
                ))}
              </select>
              {getFieldError('responsible_person') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('responsible_person')}</p>
              )}
            </div>

            {/* Due Date and Priority Row - exact match */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Due Date */}
              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Date d'Échéance
                </label>
                <input
                  type="date"
                  id="due_date"
                  value={formData.due_date}
                  onChange={(e) => handleFieldChange('due_date', e.target.value)}
                  onBlur={() => handleFieldBlur('due_date')}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    hasFieldError('due_date') ? 'border-red-500' : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                />
                {getFieldError('due_date') && (
                  <p className="mt-1 text-sm text-red-600">{getFieldError('due_date')}</p>
                )}
              </div>

              {/* Priority */}
              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                  Priorité
                </label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => handleFieldChange('priority', e.target.value as ActionPriority)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                >
                  <option value="low">🟢 Basse</option>
                  <option value="medium">🟡 Moyenne</option>
                  <option value="high">🟠 Haute</option>
                  <option value="critical">🔴 Critique</option>
                </select>
              </div>
            </div>

            {/* Status and Completion Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleFieldChange('status', e.target.value as ActionStatus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                >
                  <option value="open">Ouvert</option>
                  <option value="pending">En attente</option>
                  <option value="in_progress">En cours</option>
                  <option value="blocked">Bloqué</option>
                  <option value="escalated">Escaladé</option>
                  <option value="closed">Fermé</option>
                </select>
              </div>

              {/* Completion Percentage */}
              <div>
                <label htmlFor="completion" className="block text-sm font-medium text-gray-700 mb-2">
                  Avancement ({formData.completion_percentage}%)
                </label>
                <input
                  type="range"
                  id="completion"
                  min="0"
                  max="100"
                  step="5"
                  value={formData.completion_percentage}
                  onChange={(e) => handleFieldChange('completion_percentage', parseInt(e.target.value))}
                  className="w-full"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Notes - exact match */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                Notes (Optionnel)
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                onBlur={() => handleFieldBlur('notes')}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  hasFieldError('notes') ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={3}
                placeholder="Contexte supplémentaire, dépendances, ou informations importantes..."
                disabled={isLoading}
              />
              {getFieldError('notes') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('notes')}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {(formData.notes || '').length}/1000 caractères
              </p>
            </div>

            {/* Form Guidelines - exact match */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                💡 Conseils pour une action efficace
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Utilisez des verbes d'action clairs (réviser, implémenter, vérifier, etc.)</li>
                <li>• Définissez des objectifs mesurables et réalisables</li>
                <li>• Indiquez les délais et responsabilités clairement</li>
                <li>• Mentionnez les ressources nécessaires si applicable</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer - matches AddActionForm footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            disabled={isLoading}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading || Object.values(errors).some(error => !!error)}
          >
            {isLoading ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Sauvegarde en cours...
              </>
            ) : (
              `Sauvegarder l'Action #${action.action_number}`
            )}
          </button>
        </div>
      </div>
    );
  }

  // DISPLAY MODE - Horizontal row layout
  return (
    <div
      ref={dragRef}
      draggable={isEditable && !isEditing}
      onDragStart={handleDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`
        relative flex items-center p-4 bg-white border border-gray-200 rounded-lg shadow-sm
        ${isDragging ? 'opacity-50' : ''}
        ${isOverdue ? 'border-red-300 bg-red-50' : ''}
        ${isEditable ? 'hover:bg-gray-50 cursor-pointer' : ''}
        ${isLoading ? 'opacity-50' : ''}
        transition-all duration-200
      `}
      onClick={handleCardClick}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
          <div className="h-6 w-6 bg-gray-400 rounded-full animate-pulse"></div>
        </div>
      )}

      {/* Status Checkbox */}
      <div className="flex-shrink-0 mr-4">
        <button
          onClick={handleStatusToggle}
          className={`w-5 h-5 rounded border-2 transition-colors ${
            action.status === 'closed'
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          disabled={!isEditable || isLoading}
        >
          {action.status === 'closed' && (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      {/* Action Number */}
      <div className="flex-shrink-0 mr-4">
        <span className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-semibold">
          {action.action_number}
        </span>
      </div>

      {/* Action Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {action.action_text}
            </h3>
            {action.notes && (
              <p className="text-xs text-gray-500 mt-1 truncate">
                {action.notes}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Due Date Badge */}
      <div className="flex-shrink-0 mx-4">
        <span className={`px-2 py-1 text-xs font-medium rounded ${
          isOverdue 
            ? 'bg-red-100 text-red-800 border border-red-200'
            : 'bg-gray-100 text-gray-600 border border-gray-200'
        }`}>
          {formatDate(action.due_date)}
        </span>
      </div>

      {/* Status Dot */}
      <div className="flex-shrink-0 mr-4">
        <div className={`w-3 h-3 rounded-full ${
          action.status === 'closed' ? 'bg-green-500' :
          action.status === 'in_progress' ? 'bg-blue-500' :
          action.status === 'blocked' ? 'bg-red-500' :
          action.status === 'escalated' ? 'bg-orange-500' :
          'bg-gray-400'
        }`}></div>
      </div>

      {/* Overflow Menu */}
      {isEditable && (
        <div className="flex-shrink-0 relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-20">
              <button
                onClick={(e) => handleMenuAction('edit', e)}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Modifier
              </button>
              <button
                onClick={(e) => handleMenuAction('duplicate', e)}
                className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
              >
                Dupliquer
              </button>
              <button
                onClick={(e) => handleMenuAction('delete', e)}
                className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
              >
                Supprimer
              </button>
            </div>
          )}
        </div>
      )}

      {/* Click outside handler for menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Confirmer la suppression
            </h3>
            <p className="text-gray-600 mb-4">
              Êtes-vous sûr de vouloir supprimer cette action ? Cette opération ne peut pas être annulée.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 