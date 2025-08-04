import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  FollowUpAction, 
  FollowUpActionCreate, 
  FollowUpActionUpdate,
  ResponsiblePerson,
  ActionHistory,
  ActionMetrics,
  ActionStatus,
  BulkActionUpdate,
  BulkActionResponse
} from '../types';

const API_BASE_URL = '/api';

// Follow-up Actions API service
export const followUpActionsApi = {
  // Get all actions for a complaint
  getActions: async (
    complaintId: number, 
    filters?: {
      status?: ActionStatus;
      responsible_person?: string;
      overdue_only?: boolean;
    }
  ): Promise<FollowUpAction[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/complaints/${complaintId}/actions`, {
        params: filters
      });
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // Backend does not implement actions; return empty list to avoid console errors
        return [];
      }
      throw err;
    }
  },

  // Get a specific action
  getAction: async (complaintId: number, actionId: number): Promise<FollowUpAction> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/complaints/${complaintId}/actions/${actionId}`);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // Provide a clear error for consumers if needed
        throw new Error('Follow-up actions API not available on server');
      }
      throw err;
    }
  },

  // Create new action
  createAction: async (
    complaintId: number,
    actionData: FollowUpActionCreate,
    changedBy: string = 'User'
  ): Promise<FollowUpAction> => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/complaints/${complaintId}/actions`,
        actionData,
        { params: { changed_by: changedBy } }
      );
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        throw new Error('Follow-up actions API not available on server');
      }
      throw err;
    }
  },

  // Update action
  updateAction: async (
    complaintId: number,
    actionId: number,
    updates: FollowUpActionUpdate,
    changedBy: string = 'User'
  ): Promise<FollowUpAction> => {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/complaints/${complaintId}/actions/${actionId}`,
        updates,
        { params: { changed_by: changedBy } }
      );
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        throw new Error('Follow-up actions API not available on server');
      }
      throw err;
    }
  },

  // Delete action (soft delete)
  deleteAction: async (
    complaintId: number,
    actionId: number,
    changedBy: string = 'User'
  ): Promise<void> => {
    try {
      await axios.delete(
        `${API_BASE_URL}/complaints/${complaintId}/actions/${actionId}`,
        { params: { changed_by: changedBy } }
      );
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // Treat as success when API is not present
        return;
      }
      throw err;
    }
  },

  // Reorder actions
  reorderActions: async (
    complaintId: number,
    actionId: number,
    newPosition: number,
    changedBy: string = 'User'
  ): Promise<void> => {
    try {
      await axios.post(
        `${API_BASE_URL}/complaints/${complaintId}/actions/${actionId}/reorder`,
        null,
        { params: { new_position: newPosition, changed_by: changedBy } }
      );
    } catch (err: any) {
      if (err?.response?.status === 404) {
        return;
      }
      throw err;
    }
  },

  // Get action history
  getActionHistory: async (complaintId: number, actionId: number): Promise<ActionHistory[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/complaints/${complaintId}/actions/${actionId}/history`);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        return [];
      }
      throw err;
    }
  },

  // Get responsible persons
  getResponsiblePersons: async (complaintId: number, activeOnly: boolean = true): Promise<ResponsiblePerson[]> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/complaints/${complaintId}/actions/responsible-persons`, {
        params: { active_only: activeOnly }
      });
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        return [];
      }
      throw err;
    }
  },

  // Bulk update actions
  bulkUpdateActions: async (
    complaintId: number,
    bulkUpdate: BulkActionUpdate,
    changedBy: string = 'User'
  ): Promise<BulkActionResponse> => {
    try {
      const response = await axios.patch(
        `${API_BASE_URL}/complaints/${complaintId}/actions/bulk-update`,
        bulkUpdate,
        { params: { changed_by: changedBy } }
      );
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // Return a benign response matching BulkActionResponse shape
        return {
          updated_count: 0,
          failed_updates: [],
          errors: []
        } as unknown as BulkActionResponse;
      }
      throw err;
    }
  },

  // Get action metrics
  getActionMetrics: async (complaintId: number): Promise<ActionMetrics> => {
    try {
      const response = await axios.get(`${API_BASE_URL}/complaints/${complaintId}/actions/metrics`);
      return response.data;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // Provide empty metrics matching ActionMetrics shape
        const emptyMetrics = {
          total_actions: 0,
          open_actions: 0,
          in_progress_actions: 0,
          resolved_actions: 0,
          overdue_actions: 0,
          completion_rate: 0
        } as unknown as ActionMetrics;
        return emptyMetrics;
      }
      throw err;
    }
  }
};

// Hook interface
interface UseFollowUpActionsParams {
  complaintId: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseFollowUpActionsReturn {
  // Data
  actions: FollowUpAction[];
  responsiblePersons: ResponsiblePerson[];
  metrics: ActionMetrics | null;
  
  // Loading states
  loading: boolean;
  creating: boolean;
  updating: boolean;
  deleting: boolean;
  
  // Error handling
  error: string | null;
  
  // Actions
  createAction: (actionData: FollowUpActionCreate) => Promise<FollowUpAction>;
  updateAction: (actionId: number, updates: FollowUpActionUpdate) => Promise<FollowUpAction>;
  deleteAction: (actionId: number) => Promise<void>;
  reorderActions: (actionId: number, newPosition: number) => Promise<void>;
  bulkUpdateActions: (actionIds: number[], updates: FollowUpActionUpdate) => Promise<BulkActionResponse>;
  
  // Data fetching
  refresh: () => Promise<void>;
  loadActionHistory: (actionId: number) => Promise<ActionHistory[]>;
  
  // Filtering
  filterByStatus: (status?: ActionStatus) => void;
  filterByPerson: (person?: string) => void;
  showOverdueOnly: (overdueOnly: boolean) => void;
  
  // Current filters
  filters: {
    status?: ActionStatus;
    responsible_person?: string;
    overdue_only: boolean;
  };
}

export function useFollowUpActions({ 
  complaintId, 
  autoRefresh = false,
  refreshInterval = 30000 // 30 seconds
}: UseFollowUpActionsParams): UseFollowUpActionsReturn {
  
  // State
  const [actions, setActions] = useState<FollowUpAction[]>([]);
  const [responsiblePersons, setResponsiblePersons] = useState<ResponsiblePerson[]>([]);
  const [metrics, setMetrics] = useState<ActionMetrics | null>(null);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Error handling
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<{
    status?: ActionStatus;
    responsible_person?: string;
    overdue_only: boolean;
  }>({
    overdue_only: false
  });

  // Load actions with current filters
  const loadActions = useCallback(async () => {
    try {
      setError(null);
      const data = await followUpActionsApi.getActions(complaintId, filters);
      setActions(data);
    } catch (err: any) {
      // If API not implemented, silence error and keep empty state
      if (err?.message === 'Follow-up actions API not available on server' || err?.response?.status === 404) {
        setActions([]);
        setError(null);
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load actions');
      console.error('Error loading actions:', err);
    }
  }, [complaintId, filters]);

  // Load responsible persons
  const loadResponsiblePersons = useCallback(async () => {
    try {
      const data = await followUpActionsApi.getResponsiblePersons(complaintId);
      setResponsiblePersons(data);
    } catch (err) {
      console.error('Error loading responsible persons:', err);
    }
  }, [complaintId]);

  // Load metrics
  const loadMetrics = useCallback(async () => {
    try {
      const data = await followUpActionsApi.getActionMetrics(complaintId);
      setMetrics(data);
    } catch (err) {
      console.error('Error loading metrics:', err);
    }
  }, [complaintId]);

  // Refresh all data
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadActions(),
        loadResponsiblePersons(),
        loadMetrics()
      ]);
    } finally {
      setLoading(false);
    }
  }, [loadActions, loadResponsiblePersons, loadMetrics]);

  // Create action
  const createAction = useCallback(async (actionData: FollowUpActionCreate): Promise<FollowUpAction> => {
    setCreating(true);
    setError(null);
    
    try {
      const newAction = await followUpActionsApi.createAction(complaintId, actionData);
      setActions(prev => [...prev, newAction].sort((a, b) => a.action_number - b.action_number));
      await loadMetrics(); // Refresh metrics
      return newAction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create action';
      setError(errorMessage);
      throw err;
    } finally {
      setCreating(false);
    }
  }, [complaintId, loadMetrics]);

  // Update action
  const updateAction = useCallback(async (actionId: number, updates: FollowUpActionUpdate): Promise<FollowUpAction> => {
    setUpdating(true);
    setError(null);
    
    try {
      const updatedAction = await followUpActionsApi.updateAction(complaintId, actionId, updates);
      setActions(prev => prev.map(action => 
        action.id === actionId ? updatedAction : action
      ));
      await loadMetrics(); // Refresh metrics
      return updatedAction;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update action';
      setError(errorMessage);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [complaintId, loadMetrics]);

  // Delete action
  const deleteAction = useCallback(async (actionId: number): Promise<void> => {
    setDeleting(true);
    setError(null);
    
    try {
      await followUpActionsApi.deleteAction(complaintId, actionId);
      setActions(prev => prev.filter(action => action.id !== actionId));
      await loadMetrics(); // Refresh metrics
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete action';
      setError(errorMessage);
      throw err;
    } finally {
      setDeleting(false);
    }
  }, [complaintId, loadMetrics]);

  // Reorder actions
  const reorderActions = useCallback(async (actionId: number, newPosition: number): Promise<void> => {
    setError(null);
    
    try {
      await followUpActionsApi.reorderActions(complaintId, actionId, newPosition);
      await loadActions(); // Refresh to get updated order
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder actions';
      setError(errorMessage);
      throw err;
    }
  }, [complaintId, loadActions]);

  // Bulk update actions
  const bulkUpdateActions = useCallback(async (
    actionIds: number[], 
    updates: FollowUpActionUpdate
  ): Promise<BulkActionResponse> => {
    setUpdating(true);
    setError(null);
    
    try {
      const result = await followUpActionsApi.bulkUpdateActions(complaintId, {
        action_ids: actionIds,
        updates
      });
      await loadActions(); // Refresh actions
      await loadMetrics(); // Refresh metrics
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to bulk update actions';
      setError(errorMessage);
      throw err;
    } finally {
      setUpdating(false);
    }
  }, [complaintId, loadActions, loadMetrics]);

  // Load action history
  const loadActionHistory = useCallback(async (actionId: number): Promise<ActionHistory[]> => {
    try {
      return await followUpActionsApi.getActionHistory(complaintId, actionId);
    } catch (err) {
      console.error('Error loading action history:', err);
      throw err;
    }
  }, [complaintId]);

  // Filter functions
  const filterByStatus = useCallback((status?: ActionStatus) => {
    setFilters(prev => ({ ...prev, status }));
  }, []);

  const filterByPerson = useCallback((person?: string) => {
    setFilters(prev => ({ ...prev, responsible_person: person }));
  }, []);

  const showOverdueOnly = useCallback((overdueOnly: boolean) => {
    setFilters(prev => ({ ...prev, overdue_only: overdueOnly }));
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadActions();
      loadMetrics();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadActions, loadMetrics]);

  // Reload when filters change
  useEffect(() => {
    if (!loading) { // Don't reload during initial load
      loadActions();
    }
  }, [filters, loadActions, loading]);

  return {
    // Data
    actions,
    responsiblePersons,
    metrics,
    
    // Loading states
    loading,
    creating,
    updating,
    deleting,
    
    // Error handling
    error,
    
    // Actions
    createAction,
    updateAction,
    deleteAction,
    reorderActions,
    bulkUpdateActions,
    
    // Data fetching
    refresh,
    loadActionHistory,
    
    // Filtering
    filterByStatus,
    filterByPerson,
    showOverdueOnly,
    
    // Current filters
    filters
  };
} 