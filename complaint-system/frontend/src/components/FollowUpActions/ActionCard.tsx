import React, { useState, useRef } from 'react';
import { FollowUpAction, FollowUpActionUpdate, ResponsiblePerson, ActionStatus, ActionPriority } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

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
  const { t } = useLanguage();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editData, setEditData] = useState<FollowUpActionUpdate>({});
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  // Get status styling
  const getStatusStyle = (status: ActionStatus) => {
    switch (status) {
      case 'open': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'pending': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'blocked': return 'bg-red-100 text-red-800 border-red-300';
      case 'escalated': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'closed': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  // Get priority styling
  const getPriorityStyle = (priority: ActionPriority) => {
    switch (priority) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  // Get status icon
  const getStatusIcon = (status: ActionStatus) => {
    switch (status) {
      case 'open': return '⚪';
      case 'pending': return '⏳';
      case 'in_progress': return '🟡';
      case 'blocked': return '⏸️';
      case 'escalated': return '🔥';
      case 'closed': return '✅';
      default: return '⚪';
    }
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent) => {
    if (!isEditable) return;
    e.dataTransfer.effectAllowed = 'move';
    onDragStart();
  };

  // Handle edit mode
  const startEditing = () => {
    setIsEditing(true);
    setEditData({
      action_text: action.action_text,
      responsible_person: action.responsible_person,
      due_date: action.due_date?.split('T')[0], // Convert to YYYY-MM-DD
      status: action.status,
      priority: action.priority,
      notes: action.notes,
      completion_percentage: action.completion_percentage
    });
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditData({});
  };

  const saveChanges = async () => {
    if (!editData) return;
    
    setIsLoading(true);
    try {
      await onUpdate(editData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update action:', error);
    } finally {
      setIsLoading(false);
    }
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

  // Quick status change
  const quickStatusChange = async (newStatus: ActionStatus) => {
    if (!isEditable) return;
    
    setIsLoading(true);
    try {
      const updates: FollowUpActionUpdate = { status: newStatus };
      
      // Auto-update completion percentage based on status
      if (newStatus === 'closed') {
        updates.completion_percentage = 100;
      } else if (newStatus === 'in_progress' && action.completion_percentage === 0) {
        updates.completion_percentage = 25;
      }
      
      await onUpdate(updates);
    } catch (error) {
      console.error('Failed to update status:', error);
    } finally {
      setIsLoading(false);
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

  return (
    <div
      ref={dragRef}
      draggable={isEditable && !isEditing}
      onDragStart={handleDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`
        action-card relative border rounded-lg bg-white shadow-sm transition-all duration-200
        ${isDragging ? 'action-card-dragging' : ''}
        ${isOverdue ? 'overdue-indicator border-red-300 bg-red-50' : 'border-gray-200'}
        ${isEditable && !isEditing ? 'hover:shadow-md cursor-move' : ''}
        ${isLoading ? 'opacity-50' : ''}
      `}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Header */}
      <div className="action-header">
        <div className="flex items-center space-x-3">
          {/* Action Number */}
          <span className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-semibold">
            {action.action_number}
          </span>
          
          {/* Status Badge */}
          <span className={`status-badge ${getStatusStyle(action.status)}`}>
            <span className="mr-1">{getStatusIcon(action.status)}</span>
            {action.status.replace('_', ' ').toUpperCase()}
          </span>
          
          {/* Priority */}
          <span className={`text-sm font-medium ${getPriorityStyle(action.priority)}`}>
            {action.priority.toUpperCase()}
          </span>
          
          {/* Overdue warning */}
          {isOverdue && (
            <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
              ⚠️ En retard
            </span>
          )}
        </div>

        {/* Actions */}
        {isEditable && (
          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <>
                <button
                  onClick={startEditing}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Modifier"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowConfirmDelete(true)}
                  className="text-gray-400 hover:text-red-600 transition-colors"
                  title="Supprimer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={saveChanges}
                  className="text-green-600 hover:text-green-700 transition-colors"
                  title="Sauvegarder"
                  disabled={isLoading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </button>
                <button
                  onClick={cancelEditing}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Annuler"
                  disabled={isLoading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="action-content">
        {isEditing ? (
          /* Edit Form */
          <div className="space-y-4">
            {/* Action Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Action
              </label>
              <textarea
                value={editData.action_text || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, action_text: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Décrire l'action à réaliser..."
              />
            </div>

            {/* Responsible Person */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Responsable
              </label>
              <select
                value={editData.responsible_person || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, responsible_person: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sélectionner un responsable</option>
                {responsiblePersons.map(person => (
                  <option key={person.id} value={person.name}>
                    {person.name} {person.department && `(${person.department})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date, Status, Priority Row */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Échéance
                </label>
                <input
                  type="date"
                  value={editData.due_date || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, due_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select
                  value={editData.status || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value as ActionStatus }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="open">Ouvert</option>
                  <option value="pending">En attente</option>
                  <option value="in_progress">En cours</option>
                  <option value="blocked">Bloqué</option>
                  <option value="escalated">Escaladé</option>
                  <option value="closed">Fermé</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Priorité
                </label>
                <select
                  value={editData.priority || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, priority: e.target.value as ActionPriority }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                  <option value="critical">Critique</option>
                </select>
              </div>
            </div>

            {/* Completion Percentage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Avancement ({editData.completion_percentage || 0}%)
              </label>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={editData.completion_percentage || 0}
                onChange={(e) => setEditData(prev => ({ ...prev, completion_percentage: parseInt(e.target.value) }))}
                className="w-full"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={editData.notes || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
                placeholder="Notes additionnelles..."
              />
            </div>
          </div>
        ) : (
          /* Display Mode */
          <div className="space-y-3">
            {/* Action Text */}
            <div>
              <p className="text-gray-900 font-medium">{action.action_text}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${action.completion_percentage}%` }}
              ></div>
            </div>

            {/* Notes */}
            {action.notes && (
              <div className="bg-gray-50 p-3 rounded border-l-4 border-blue-500">
                <p className="text-sm text-gray-700">{action.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="action-footer">
        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <span>
            <strong>Responsable:</strong> {action.responsible_person}
          </span>
          <span>
            <strong>Échéance:</strong> {formatDate(action.due_date)}
          </span>
          <span>
            <strong>Avancement:</strong> {action.completion_percentage}%
          </span>
        </div>

        {/* Quick Action Buttons */}
        {isEditable && !isEditing && (
          <div className="flex items-center space-x-2">
            {action.status === 'open' && (
              <button
                onClick={() => quickStatusChange('in_progress')}
                className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded hover:bg-yellow-200 transition-colors"
                disabled={isLoading}
              >
                🚀 Démarrer
              </button>
            )}
            {action.status === 'in_progress' && (
              <button
                onClick={() => quickStatusChange('closed')}
                className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200 transition-colors"
                disabled={isLoading}
              >
                ✅ Terminer
              </button>
            )}
            {action.status !== 'blocked' && action.status !== 'closed' && (
              <button
                onClick={() => quickStatusChange('blocked')}
                className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded hover:bg-red-200 transition-colors"
                disabled={isLoading}
              >
                ⏸️ Bloquer
              </button>
            )}
          </div>
        )}
      </div>

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
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
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