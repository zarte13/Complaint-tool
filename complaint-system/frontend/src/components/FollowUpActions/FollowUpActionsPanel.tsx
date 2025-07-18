import React, { useState } from 'react';
import { FollowUpAction, ResponsiblePerson, ActionStatus } from '../../types';
import { useFollowUpActions } from '../../hooks/useFollowUpActions';
import { ActionCard } from './ActionCard';
import { AddActionForm } from './AddActionForm';
import { ActionFilters } from './ActionFilters';

interface FollowUpActionsPanelProps {
  complaintId: number;
  isEditable?: boolean;
  className?: string;
}

export const FollowUpActionsPanel: React.FC<FollowUpActionsPanelProps> = ({
  complaintId,
  isEditable = true,
  className = ''
}) => {
  const {
    actions,
    responsiblePersons,
    metrics,
    loading,
    creating,
    error,
    createAction,
    updateAction,
    deleteAction,
    reorderActions,
    filterByStatus,
    filterByPerson,
    showOverdueOnly,
    filters
  } = useFollowUpActions({ complaintId });

  const [showAddForm, setShowAddForm] = useState(false);
  const [draggedAction, setDraggedAction] = useState<FollowUpAction | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Handle drag and drop
  const handleDragStart = (action: FollowUpAction) => {
    if (!isEditable) return;
    setDraggedAction(action);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (targetAction: FollowUpAction) => {
    if (!draggedAction || !isEditable || draggedAction.id === targetAction.id) {
      setDraggedAction(null);
      return;
    }

    try {
      await reorderActions(draggedAction.id, targetAction.action_number);
    } catch (err) {
      console.error('Failed to reorder actions:', err);
    } finally {
      setDraggedAction(null);
    }
  };

  const handleCreateAction = async (actionData: any) => {
    try {
      await createAction(actionData);
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to create action:', err);
    }
  };

  // Get status icon (French action plan format)
  const getStatusIcon = (status: ActionStatus) => {
    switch (status) {
      case 'closed': return '✅';
      case 'in_progress': return '🟡';
      case 'blocked': return '⏸️';
      case 'escalated': return '🔥';
      case 'pending': return '⏳';
      default: return '⚪';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className={`follow-up-actions-panel ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Actions de Suivi
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-20 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`follow-up-actions-panel ${className}`}>
      {/* Header with metrics */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center space-x-2 text-lg font-semibold text-gray-900 hover:text-gray-700 transition-colors"
          >
            <span className={`transform transition-transform ${isCollapsed ? 'rotate-0' : 'rotate-90'}`}>
              ▶️
            </span>
            <span>Actions de Suivi ({actions.length})</span>
          </button>
          
          {metrics && (
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span>{metrics.open_actions} ouvertes</span>
              </span>
              {metrics.overdue_actions > 0 && (
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                  <span>{metrics.overdue_actions} en retard</span>
                </span>
              )}
              <span className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span>{metrics.completion_rate}% complétées</span>
              </span>
            </div>
          )}
        </div>

        {isEditable && !isCollapsed && (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn-primary text-sm"
            disabled={actions.length >= 10 || creating}
          >
            {creating ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Création...
              </>
            ) : (
              '+ Ajouter une Action'
            )}
          </button>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {!isCollapsed && (
        <>
          {/* Filters */}
          <ActionFilters
            filters={filters}
            responsiblePersons={responsiblePersons}
            onStatusFilter={filterByStatus}
            onPersonFilter={filterByPerson}
            onOverdueFilter={showOverdueOnly}
            className="mb-4"
          />

          {/* Actions list */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {actions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="mb-4">
                  <span className="text-4xl">📋</span>
                </div>
                <p className="text-lg font-medium mb-2">Aucune action de suivi</p>
                <p className="text-sm mb-4">
                  Créez votre première action pour organiser le plan d'action
                </p>
                {isEditable && (
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="btn-primary"
                    disabled={creating}
                  >
                    Créer la première action
                  </button>
                )}
              </div>
            ) : (
              actions.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  isEditable={isEditable}
                  isDragging={draggedAction?.id === action.id}
                  responsiblePersons={responsiblePersons}
                  onUpdate={(updates) => updateAction(action.id, updates)}
                  onDelete={() => deleteAction(action.id)}
                  onDragStart={() => handleDragStart(action)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(action)}
                />
              ))
            )}
          </div>

          {/* Action limit warning */}
          {actions.length >= 8 && actions.length < 10 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                ⚠️ Attention: Vous approchez de la limite de 10 actions par réclamation 
                ({actions.length}/10)
              </p>
            </div>
          )}

          {actions.length >= 10 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">
                🚫 Limite atteinte: Maximum 10 actions par réclamation
              </p>
            </div>
          )}
        </>
      )}

      {/* Add Action Form Modal */}
      {showAddForm && (
        <AddActionForm
          complaintId={complaintId}
          actionNumber={actions.length + 1}
          responsiblePersons={responsiblePersons}
          onSubmit={handleCreateAction}
          onCancel={() => setShowAddForm(false)}
          isCreating={creating}
        />
      )}
    </div>
  );
};

// CSS styles (to be added to global CSS or styled-components)
export const followUpActionsStyles = `
.follow-up-actions-panel {
  @apply bg-white border border-gray-200 rounded-lg p-4;
}

.btn-primary {
  @apply inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed;
}

.btn-secondary {
  @apply inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed;
}

/* Action card drag styles */
.action-card-dragging {
  @apply opacity-50 transform scale-95;
}

.action-card-drag-over {
  @apply border-blue-300 bg-blue-50;
}

/* French action plan styling */
.action-header {
  @apply flex items-center justify-between p-3 border-b border-gray-200;
}

.action-content {
  @apply p-3;
}

.action-footer {
  @apply flex items-center justify-between p-3 pt-0 text-sm text-gray-600;
}

/* Status indicators */
.status-badge {
  @apply inline-flex items-center px-2 py-1 text-xs font-medium rounded-full;
}

.status-open {
  @apply bg-gray-100 text-gray-800;
}

.status-in_progress {
  @apply bg-yellow-100 text-yellow-800;
}

.status-blocked {
  @apply bg-red-100 text-red-800;
}

.status-escalated {
  @apply bg-orange-100 text-orange-800;
}

.status-closed {
  @apply bg-green-100 text-green-800;
}

.status-pending {
  @apply bg-blue-100 text-blue-800;
}

/* Priority indicators */
.priority-low {
  @apply text-green-600;
}

.priority-medium {
  @apply text-yellow-600;
}

.priority-high {
  @apply text-orange-600;
}

.priority-critical {
  @apply text-red-600;
}

/* Overdue indicator */
.overdue-indicator {
  @apply bg-red-50 border-red-300;
}

/* Animation for collapsing */
.collapse-enter {
  max-height: 0;
  overflow: hidden;
}

.collapse-enter-active {
  max-height: 400px;
  transition: max-height 0.3s ease-in;
}

.collapse-exit {
  max-height: 400px;
}

.collapse-exit-active {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
}
`; 