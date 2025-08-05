import { useState } from 'react';
import { FollowUpAction, FollowUpActionUpdate } from '../../types';
import { useFollowUpActions } from '../../hooks/useFollowUpActions';
import { ActionCard } from './ActionCard';
import { AddActionForm } from './AddActionForm';
import { ActionFilters } from './ActionFilters';

interface FollowUpActionsPanelProps {
  complaintId: number;
  isEditable?: boolean;
  className?: string;
  onFirstActionCreated?: () => void;
}

export const FollowUpActionsPanel: React.FC<FollowUpActionsPanelProps> = ({
  complaintId,
  isEditable = true,
  className = '',
  onFirstActionCreated
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
    // showOverdueOnly, // not used directly in this component
    filters
  } = useFollowUpActions({ complaintId });

  const [showAddForm, setShowAddForm] = useState(false);
  const [draggedAction, setDraggedAction] = useState<FollowUpAction | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  // const [selectedAction, setSelectedAction] = useState<FollowUpAction | null>(null);

  // No longer needed - ActionCard handles its own menu state

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
      const isFirstAction = actions.length === 0;
      await createAction(actionData);
      setShowAddForm(false);
      
      // If this was the first action created, trigger the callback to update complaint status
      if (isFirstAction && onFirstActionCreated) {
        onFirstActionCreated();
      }
    } catch (err) {
      console.error('Failed to create action:', err);
    }
  };

  // Action handling now done by ActionCard component

  // Toggle action status is handled within ActionCard; legacy helper removed to satisfy TS6133
  // const toggleActionStatus = async (_action: FollowUpAction) => { ... }

  // Local date formatter removed (unused) to satisfy TS6133

  if (loading) {
    return (
      <div className={`follow-up-actions-panel bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-sm font-semibold text-gray-900">
              Actions de Suivi
            </h3>
          </div>
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-gray-200 h-16 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`follow-up-actions-panel bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
        {/* Header */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
        >
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="text-sm font-semibold text-gray-900">
              Actions de Suivi ({actions.length})
            </h3>
          </div>
          {isCollapsed ? (
            <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>

        {/* Content */}
        {!isCollapsed && (
          <div className="p-4">
            {/* Header Row with Add Button and Metrics */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <button
                onClick={() => setShowAddForm(true)}
                className="h-10 px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 shadow-sm"
                style={{ fontSize: '14px', fontWeight: '500', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)' }}
                disabled={actions.length >= 10 || creating || !isEditable}
              >
                {creating ? (
                  <>
                    <span className="inline-block w-4 h-4 bg-gray-400 rounded-full mr-2"></span>
                    Création...
                  </>
                ) : (
                  'Ajouter une action'
                )}
              </button>

              {metrics && (
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>{metrics.open_actions} ouvertes</span>
                  <span>•</span>
                  <span>{metrics.completion_rate}% complétées</span>
                </div>
              )}
            </div>

            {/* Error display */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Filters */}
            <ActionFilters
              filters={filters}
              responsiblePersons={responsiblePersons}
              onStatusFilter={filterByStatus}
              onPersonFilter={filterByPerson}
              // Not used by ActionFilters UI yet; pass a no-op to satisfy prop type or wire later to a checkbox
              onOverdueFilter={() => {}}
              className="mb-4"
            />

            {/* Actions list */}
            <div className="space-y-1">
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
                      className="h-10 px-4 text-sm font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 shadow-sm"
                      style={{ fontSize: '14px', fontWeight: '500', boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)' }}
                      disabled={creating}
                    >
                      Créer la première action
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {actions.map((action) => (
                    <ActionCard
                      key={action.id}
                      action={action}
                      isEditable={isEditable}
                      isDragging={draggedAction?.id === action.id}
                      responsiblePersons={responsiblePersons}
                      onUpdate={async (updates: FollowUpActionUpdate) => { await updateAction(action.id, updates); }}
                      onDelete={async () => { await deleteAction(action.id); }}
                      onDragStart={() => handleDragStart(action)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(action)}
                    />
                  ))}
                </div>
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
          </div>
        )}
      </div>

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
    </>
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