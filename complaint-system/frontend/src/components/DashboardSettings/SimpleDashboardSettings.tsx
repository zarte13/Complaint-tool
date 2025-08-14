import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Save, RefreshCw, Plus, Trash2, ChevronUp, ChevronDown, TrendingUp, AlertTriangle, Clock, BarChart3, Users, Package } from 'lucide-react';
import { get } from '../../services/api';

export interface DashboardCard {
  id: string;
  type: 'kpi_status' | 'kpi_mttr' | 'kpi_overdue_actions' | 'kpi_actions_per_complaint' | 
        'graph_trends' | 'graph_failures' | 'graph_stacked' | 'graph_top_companies' | 'graph_top_parts' | 'rar_metric';
  size: 'sm' | 'md' | 'lg' | 'xl';
  config?: {
    timeWindow?: number;
    limit?: number;
    showLegend?: boolean;
    granularity?: 'weekly' | 'monthly';
  };
}

const cardTemplates = [
  { type: 'kpi_status', title: 'Status Overview', icon: TrendingUp, category: 'KPI', defaultSize: 'md' as const },
  { type: 'kpi_mttr', title: 'Mean Time To Resolution', icon: Clock, category: 'KPI', defaultSize: 'sm' as const },
  { type: 'kpi_overdue_actions', title: 'Overdue Actions', icon: AlertTriangle, category: 'KPI', defaultSize: 'sm' as const },
  { type: 'kpi_actions_per_complaint', title: 'Actions per Complaint', icon: BarChart3, category: 'KPI', defaultSize: 'sm' as const },
  { type: 'graph_trends', title: 'Weekly Trends', icon: TrendingUp, category: 'Chart', defaultSize: 'xl' as const },
  { type: 'graph_failures', title: 'Failure Modes', icon: AlertTriangle, category: 'Chart', defaultSize: 'lg' as const },
  { type: 'graph_stacked', title: 'Stacked Analysis', icon: BarChart3, category: 'Chart', defaultSize: 'xl' as const },
  { type: 'graph_top_companies', title: 'Top Companies', icon: Users, category: 'Chart', defaultSize: 'lg' as const },
  { type: 'graph_top_parts', title: 'Top Parts', icon: Package, category: 'Chart', defaultSize: 'lg' as const },
  { type: 'rar_metric', title: 'RAR Metrics', icon: TrendingUp, category: 'Metric', defaultSize: 'lg' as const },
];

const sizeClasses = {
  sm: 'col-span-1 row-span-1 h-24',
  md: 'col-span-2 row-span-1 h-24', 
  lg: 'col-span-3 row-span-2 h-48',
  xl: 'col-span-6 row-span-2 h-48'
};

interface SimpleDashboardSettingsProps {
  onSave?: (cards: DashboardCard[], globalConfig: any) => Promise<void>;
}

export default function SimpleDashboardSettings({ onSave }: SimpleDashboardSettingsProps) {
  const { t } = useLanguage();
  
  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [globalTimeWindow, setGlobalTimeWindow] = useState(12);
  const [saving, setSaving] = useState(false);
  const [savedFlag, setSavedFlag] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load existing settings
  useEffect(() => {
    loadExistingSettings();
  }, []);

  const loadExistingSettings = async () => {
    try {
      const { data } = await get('/api/settings/app');
      const dashboardConfig = (data as any)?.dashboard;
      
      if (dashboardConfig?.timeWindow?.value) {
        setGlobalTimeWindow(Number(dashboardConfig.timeWindow.value) || 12);
      }
      
      if (dashboardConfig?.cards?.order && Array.isArray(dashboardConfig.cards.order)) {
        setCards(dashboardConfig.cards.order);
      } else {
        // Create default cards from legacy settings
        const defaultCards: DashboardCard[] = [];
        const legacy = dashboardConfig?.cards;
        
        if (legacy?.kpis) {
          defaultCards.push({
            id: 'default-status',
            type: 'kpi_status',
            size: 'md',
            config: { timeWindow: globalTimeWindow },
          });
        }
        
        if (legacy?.trends) {
          defaultCards.push({
            id: 'default-trends',
            type: 'graph_trends',
            size: 'xl',
            config: { timeWindow: globalTimeWindow, granularity: 'weekly' },
          });
        }
        
        setCards(defaultCards);
      }
    } catch (error) {
      console.error('Failed to load dashboard settings:', error);
    }
  };

  const getLocalizedTitle = (type: string) => {
    switch (type) {
      case 'kpi_status': return t('statusOverview') || 'Status Overview';
      case 'kpi_mttr': return t('mttrTitle') || 'Mean Time To Resolution';
      case 'kpi_overdue_actions': return t('overdueActionsTitle') || 'Overdue Actions';
      case 'kpi_actions_per_complaint': return t('actionsPerComplaintTitle') || 'Actions per Complaint';
      case 'graph_trends': return t('trendsTitle') || 'Weekly Trends';
      case 'graph_failures': return t('failureModesTitle') || 'Failure Modes';
      case 'graph_stacked': return t('stackedAnalysisTitle') || 'Stacked Analysis';
      case 'graph_top_companies': return t('topCompaniesTitle') || 'Top Companies';
      case 'graph_top_parts': return t('topPartsTitle') || 'Top Parts';
      case 'rar_metric': return t('rarMetricsTitle') || 'RAR Metrics';
      default: return type;
    }
  };

  const handleAddCard = useCallback((templateType: string) => {
    const template = cardTemplates.find(t => t.type === templateType);
    if (!template) return;

    const newCard: DashboardCard = {
      id: `${template.type}-${Date.now()}`,
      type: template.type as DashboardCard['type'],
      size: template.defaultSize,
      config: { 
        timeWindow: globalTimeWindow,
        ...(template.type === 'graph_top_companies' && { limit: 6 }),
        ...(template.type === 'graph_top_parts' && { limit: 20 }),
      },
    };
    
    setCards(prev => [...prev, newCard]);
    setSelectedCardId(newCard.id);
  }, [globalTimeWindow]);

  const handleUpdateCard = useCallback((cardId: string, updates: Partial<DashboardCard>) => {
    setCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, ...updates } : card
    ));
  }, []);

  const handleDeleteCard = useCallback((cardId: string) => {
    setCards(prev => prev.filter(card => card.id !== cardId));
    if (selectedCardId === cardId) {
      setSelectedCardId(null);
    }
  }, [selectedCardId]);

  const handleMoveCard = useCallback((cardId: string, direction: 'up' | 'down') => {
    setCards(prev => {
      const currentIndex = prev.findIndex(card => card.id === cardId);
      if (currentIndex === -1) return prev;
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newCards = [...prev];
      [newCards[currentIndex], newCards[newIndex]] = [newCards[newIndex], newCards[currentIndex]];
      return newCards;
    });
  }, []);

  const handleGlobalTimeWindowChange = (weeks: number) => {
    setGlobalTimeWindow(weeks);
    setCards(prev => prev.map(card => ({
      ...card,
      config: {
        ...card.config,
        timeWindow: weeks,
      },
    })));
  };

  const handleSave = async (event?: React.MouseEvent) => {
    // Prevent any form submission or default behavior
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    if (!onSave) {
      setSaveError('No save function provided');
      return;
    }
    
    try {
      setSaving(true);
      setSaveError(null);
      
      const globalConfig = {
        timeWindow: { kind: 'weeks', value: globalTimeWindow },
      };
      
      // Ensure we always pass an array, even if empty
      const cardsToSave = Array.isArray(cards) ? cards : [];
      
      await onSave(cardsToSave, globalConfig);
      
      setSavedFlag(true);
      setTimeout(() => setSavedFlag(false), 2500);
    } catch (error: any) {
      console.error('Save error:', error);
      const errorMessage = error?.response?.data?.detail || error?.message || (t('failedToSave') || 'Failed to save');
      setSaveError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const selectedCard = cards.find(card => card.id === selectedCardId) || null;
  const selectedCardIndex = selectedCard ? cards.findIndex(card => card.id === selectedCardId) : -1;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('dashboardCustomization') || 'Dashboard Customization'}
          </h2>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">
              {t('globalTimeWindow') || 'Global Time Window'}:
            </label>
            <select
              value={globalTimeWindow}
              onChange={(e) => handleGlobalTimeWindowChange(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={4}>4 {t('weeks') || 'weeks'}</option>
              <option value={8}>8 {t('weeks') || 'weeks'}</option>
              <option value={12}>12 {t('weeks') || 'weeks'}</option>
              <option value={16}>16 {t('weeks') || 'weeks'}</option>
              <option value={24}>24 {t('weeks') || 'weeks'}</option>
              <option value={52}>52 {t('weeks') || 'weeks'}</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-2 px-4 py-2 text-white text-sm rounded-md transition-colors ${
              saving 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? (t('savingProgress') || 'Saving...') : (t('save') || 'Save')}
          </button>
          
          {savedFlag && (
            <span className="text-sm text-green-600">
              {t('saved') || 'Saved'}
            </span>
          )}
          
          {saveError && !savedFlag && (
            <span className="text-sm text-red-600">
              {saveError}
            </span>
          )}
        </div>
      </div>

      {/* Dashboard Preview */}
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">
            {t('dashboardPreview') || 'Dashboard Preview'}
          </h3>
          <span className="text-sm text-gray-500">
            ({t('clickToSelect') || 'Click cards to configure'})
          </span>
        </div>
        
        {cards.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>{t('noDashboardCards') || 'No dashboard cards configured'}</p>
            <p className="text-sm">{t('addCardsToStart') || 'Add cards below to start building your dashboard'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-4 auto-rows-min">
            {cards.map((card) => {
              const template = cardTemplates.find(t => t.type === card.type);
              const Icon = template?.icon || TrendingUp;
              const isSelected = selectedCardId === card.id;
              
              return (
                <div
                  key={card.id}
                  className={`
                    bg-white border-2 rounded-lg p-4 cursor-pointer transition-all duration-200
                    ${sizeClasses[card.size]}
                    ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                  `}
                  onClick={() => setSelectedCardId(card.id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                    <h3 className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {getLocalizedTitle(card.type)}
                    </h3>
                  </div>
                  
                  {/* Preview content */}
                  <div className="flex-1 flex items-center justify-center">
                    {card.type.startsWith('kpi_') ? (
                      <div className="text-center">
                        <div className={`text-2xl font-bold ${isSelected ? 'text-blue-600' : 'text-gray-800'}`}>
                          {card.type === 'kpi_mttr' ? '2.3d' : 
                           card.type === 'kpi_overdue_actions' ? '7' :
                           card.type === 'kpi_actions_per_complaint' ? '3.2' : '42'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {card.config?.timeWindow ? `Last ${card.config.timeWindow}w` : 'Last 12w'}
                        </div>
                      </div>
                    ) : (
                      <div className={`w-full h-full rounded ${isSelected ? 'bg-blue-100' : 'bg-gray-100'} 
                                     flex items-center justify-center`}>
                        <div className="text-xs text-gray-500 text-center">
                          <Icon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                          Chart Preview
                          {card.config?.limit && <div>Top {card.config.limit}</div>}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Configuration indicator */}
                  {(card.config?.timeWindow || card.config?.limit) && (
                    <div className="mt-2 flex gap-1">
                      {card.config.timeWindow && (
                        <span className="text-xs bg-gray-100 px-1 rounded">{card.config.timeWindow}w</span>
                      )}
                      {card.config.limit && (
                        <span className="text-xs bg-gray-100 px-1 rounded">Top {card.config.limit}</span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Configuration Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card Library */}
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {t('cardLibrary') || 'Card Library'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cardTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <button
                  key={template.type}
                  onClick={() => handleAddCard(template.type)}
                  className="text-left p-4 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all duration-200 group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <Icon className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium text-gray-900 group-hover:text-blue-900">
                        {getLocalizedTitle(template.type)}
                      </h5>
                      <p className="text-xs text-gray-500 mt-1">
                        {template.category} • {template.defaultSize.toUpperCase()}
                      </p>
                    </div>
                    
                    <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card Configurator */}
        <div>
          {selectedCard ? (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900">
                    {t('configuringCard') || 'Configuring:'} {getLocalizedTitle(selectedCard.type)}
                  </h3>
                  
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveCard(selectedCard.id, 'up')}
                      disabled={selectedCardIndex === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveCard(selectedCard.id, 'down')}
                      disabled={selectedCardIndex === cards.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCard(selectedCard.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* Size Configuration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('cardSize') || 'Card Size'}
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
                      <button
                        key={size}
                        onClick={() => handleUpdateCard(selectedCard.id, { size })}
                        className={`p-2 text-xs rounded border-2 transition-colors ${
                          selectedCard.size === size
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {size.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Time Window Configuration */}
                {['kpi_mttr', 'kpi_actions_per_complaint', 'graph_trends', 'graph_failures', 'graph_stacked', 'graph_top_companies', 'graph_top_parts'].includes(selectedCard.type) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('timeWindow') || 'Time Window (weeks)'}
                    </label>
                    <div className="flex gap-2">
                      {[4, 8, 12, 16, 24, 52].map((weeks) => (
                        <button
                          key={weeks}
                          onClick={() => handleUpdateCard(selectedCard.id, {
                            config: { ...selectedCard.config, timeWindow: weeks }
                          })}
                          className={`px-3 py-1 text-xs rounded border transition-colors ${
                            (selectedCard.config?.timeWindow || 12) === weeks
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          {weeks}w
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Limit Configuration */}
                {['graph_top_companies', 'graph_top_parts'].includes(selectedCard.type) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('topLimit') || 'Top N Items'}
                    </label>
                    <div className="flex gap-2">
                      {selectedCard.type === 'graph_top_companies' 
                        ? [3, 6, 10, 15].map((limit) => (
                            <button
                              key={limit}
                              onClick={() => handleUpdateCard(selectedCard.id, {
                                config: { ...selectedCard.config, limit }
                              })}
                              className={`px-3 py-1 text-xs rounded border transition-colors ${
                                (selectedCard.config?.limit || 6) === limit
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {limit}
                            </button>
                          ))
                        : [10, 20, 30, 50].map((limit) => (
                            <button
                              key={limit}
                              onClick={() => handleUpdateCard(selectedCard.id, {
                                config: { ...selectedCard.config, limit }
                              })}
                              className={`px-3 py-1 text-xs rounded border transition-colors ${
                                (selectedCard.config?.limit || 20) === limit
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              {limit}
                            </button>
                          ))
                      }
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t('cardConfiguration') || 'Card Configuration'}
              </h3>
              <p className="text-sm text-gray-500">
                {t('selectCardToConfig') || 'Select a card from the preview to configure its settings'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
