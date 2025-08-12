import React, { useState } from 'react';
import { FollowUpActionCreate, ResponsiblePerson, ActionPriority, ActionStatus } from '../../types';

interface AddActionFormProps {
  complaintId: number;
  actionNumber: number;
  responsiblePersons: ResponsiblePerson[];
  onSubmit: (actionData: FollowUpActionCreate) => Promise<void>;
  onCancel: () => void;
  isCreating: boolean;
}

export const AddActionForm: React.FC<AddActionFormProps> = ({
  complaintId,
  actionNumber,
  responsiblePersons,
  onSubmit,
  onCancel,
  isCreating
}) => {
  // i18n hook not used here; left out to avoid TS6133
  const [formData, setFormData] = useState<FollowUpActionCreate>({
    action_text: '',
    responsible_person: '',
    priority: 'medium',
    due_date: '',
    notes: ''
  });
  const [status, setStatus] = useState<ActionStatus>('open');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // No default due date; optional per request

  // Validation rules
  const validateField = (field: string, value: any): string => {
    switch (field) {
      case 'action_text':
        if (!value || value.trim().length < 5) {
          return 'Le texte de l\'action doit contenir au moins 5 caractères';
        }
        if (value.length > 500) {
          return 'Le texte de l\'action ne peut pas dépasser 500 caractères';
        }
        return '';

      case 'responsible_person':
        if (!value || value.trim() === '') {
          return 'Un responsable doit être sélectionné';
        }
        const personExists = responsiblePersons.some(p => p.name === value);
        if (!personExists) {
          return 'Le responsable sélectionné n\'est pas valide';
        }
        return '';

      case 'due_date':
        // Optional date
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

  // Validate all fields
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    Object.keys(formData).forEach(field => {
      const error = validateField(field, formData[field as keyof FollowUpActionCreate]);
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
    const error = validateField(field, formData[field as keyof FollowUpActionCreate]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit({ ...formData, status: status as any } as any);
    } catch (error) {
      console.error('Error creating action:', error);
      // Error handling is managed by the parent component
    }
  };

  // Get field error display
  const getFieldError = (field: string): string => {
    return touchedFields[field] ? errors[field] || '' : '';
  };

  // Check if field has error
  const hasFieldError = (field: string): boolean => {
    return touchedFields[field] && !!errors[field];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Créer une Nouvelle Action
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isCreating}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Action #{actionNumber} pour la réclamation #{complaintId}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="space-y-6">
            {/* Action Text */}
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
                disabled={isCreating}
              />
              {getFieldError('action_text') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('action_text')}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.action_text.length}/500 caractères
              </p>
            </div>

            {/* Responsible Person */}
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
                disabled={isCreating}
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

            {/* Due Date and Priority Row */}
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
                  disabled={isCreating}
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
                  disabled={isCreating}
                >
                  <option value="low">🟢 Basse</option>
                  <option value="medium">🟡 Moyenne</option>
                  <option value="high">🟠 Haute</option>
                  <option value="critical">🔴 Critique</option>
                </select>
              </div>
            {/* Status selection */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ActionStatus)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isCreating}
              >
                <option value="open">À venir</option>
                <option value="in_progress">En cours</option>
                <option value="closed">Fermé</option>
              </select>
            </div>
            </div>

            {/* Notes */}
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
                disabled={isCreating}
              />
              {getFieldError('notes') && (
                <p className="mt-1 text-sm text-red-600">{getFieldError('notes')}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {(formData.notes || '').length}/1000 caractères
              </p>
            </div>

            {/* Form Guidelines */}
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
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            disabled={isCreating}
          >
            Annuler
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isCreating || Object.values(errors).some(error => !!error)}
          >
            {isCreating ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Création en cours...
              </>
            ) : (
              `Créer l'Action #${actionNumber}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}; 