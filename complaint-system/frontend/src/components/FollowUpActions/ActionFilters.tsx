import { ActionStatus, ResponsiblePerson } from '../../types';

interface ActionFiltersProps {
  filters: {
    status?: ActionStatus;
    responsible_person?: string;
    overdue_only: boolean;
  };
  responsiblePersons: ResponsiblePerson[];
  onStatusFilter: (status?: ActionStatus) => void;
  onPersonFilter: (person?: string) => void;
  onOverdueFilter: (overdueOnly: boolean) => void;
  className?: string;
}

export const ActionFilters: React.FC<ActionFiltersProps> = ({
  filters,
  responsiblePersons,
  onStatusFilter,
  onPersonFilter,
  // onOverdueFilter, // currently not used in UI
  className = ''
}) => {
  // i18n hook not used here; left out to avoid TS6133

  // Get status display name and icon
  const getStatusDisplay = (status: ActionStatus) => {
    switch (status) {
      case 'open': return { label: 'Ouvert', icon: '⚪' };
      case 'pending': return { label: 'En attente', icon: '⏳' };
      case 'in_progress': return { label: 'En cours', icon: '🟡' };
      case 'blocked': return { label: 'Bloqué', icon: '⏸️' };
      case 'escalated': return { label: 'Escaladé', icon: '🔥' };
      case 'closed': return { label: 'Fermé', icon: '✅' };
      default: return { label: status, icon: '⚪' };
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    onStatusFilter(undefined);
    onPersonFilter(undefined);
  };

  // Check if any filters are active
  const hasActiveFilters = filters.status || filters.responsible_person;

  return (
    <div className={`action-filters bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0 lg:space-x-4">
        {/* Filter Title */}
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700">Filtres:</span>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-blue-600 hover:text-blue-700 underline"
            >
              Effacer tout
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <label htmlFor="status-filter" className="text-sm text-gray-600 whitespace-nowrap">
              Statut:
            </label>
            <select
              id="status-filter"
              value={filters.status || ''}
              onChange={(e) => onStatusFilter(e.target.value as ActionStatus || undefined)}
              className="text-sm px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Tous les statuts</option>
              <option value="open">{getStatusDisplay('open').icon} {getStatusDisplay('open').label}</option>
              <option value="pending">{getStatusDisplay('pending').icon} {getStatusDisplay('pending').label}</option>
              <option value="in_progress">{getStatusDisplay('in_progress').icon} {getStatusDisplay('in_progress').label}</option>
              <option value="blocked">{getStatusDisplay('blocked').icon} {getStatusDisplay('blocked').label}</option>
              <option value="escalated">{getStatusDisplay('escalated').icon} {getStatusDisplay('escalated').label}</option>
              <option value="closed">{getStatusDisplay('closed').icon} {getStatusDisplay('closed').label}</option>
            </select>
          </div>

          {/* Responsible Person Filter */}
          <div className="flex items-center space-x-2">
            <label htmlFor="person-filter" className="text-sm text-gray-600 whitespace-nowrap">
              Responsable:
            </label>
            <select
              id="person-filter"
              value={filters.responsible_person || ''}
              onChange={(e) => onPersonFilter(e.target.value || undefined)}
              className="text-sm px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Tous les responsables</option>
              {responsiblePersons.map(person => (
                <option key={person.id} value={person.name}>
                  {person.name} {person.department && `(${person.department})`}
                </option>
              ))}
            </select>
          </div>


        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-500">Filtres actifs:</span>
            
            {filters.status && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                Statut: {getStatusDisplay(filters.status).icon} {getStatusDisplay(filters.status).label}
                <button
                  onClick={() => onStatusFilter(undefined)}
                  className="ml-1 text-blue-600 hover:text-blue-700"
                >
                  ×
                </button>
              </span>
            )}
            
            {filters.responsible_person && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                Responsable: {filters.responsible_person}
                <button
                  onClick={() => onPersonFilter(undefined)}
                  className="ml-1 text-green-600 hover:text-green-700"
                >
                  ×
                </button>
              </span>
            )}
            

          </div>
        </div>
      )}

      {/* Quick Filter Buttons */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-gray-500 self-center">Filtres rapides:</span>
          
          <button
            onClick={() => onStatusFilter('open')}
            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
              filters.status === 'open' 
                ? 'bg-gray-100 text-gray-800 border-gray-300' 
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            ⚪ Actions ouvertes
          </button>
          
          <button
            onClick={() => onStatusFilter('in_progress')}
            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
              filters.status === 'in_progress' 
                ? 'bg-yellow-100 text-yellow-800 border-yellow-300' 
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            🟡 En cours
          </button>
          
          <button
            onClick={() => onStatusFilter('closed')}
            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
              filters.status === 'closed' 
                ? 'bg-green-100 text-green-800 border-green-300' 
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            ✅ Terminées
          </button>
          
          <button
            onClick={() => onStatusFilter('blocked')}
            className={`text-xs px-2 py-1 rounded-full border transition-colors ${
              filters.status === 'blocked' 
                ? 'bg-red-100 text-red-800 border-red-300' 
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            ⏸️ Bloquées
          </button>
        </div>
      </div>
    </div>
  );
}; 