import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import DragDropProvider from './DragDropProvider';
import DashboardPreview, { type DashboardCard } from './DashboardPreview';
import CardLibrary, { type CardTemplate } from './CardLibrary';
import CardConfigurator from './CardConfigurator';
import { Save, RefreshCw, Eye, EyeOff } from 'lucide-react';

interface NewDashboardSettingsProps {
  initialCards?: DashboardCard[];
  onSave?: (cards: DashboardCard[], globalConfig: any) => Promise<void>;
}

export default function NewDashboardSettings({ 
  initialCards = [], 
  onSave 
}: NewDashboardSettingsProps) {
  const { t } = useLanguage();
  
  // State
  const [cards, setCards] = useState<DashboardCard[]>(initialCards);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [globalTimeWindow, setGlobalTimeWindow] = useState(12);
  const [saving, setSaving] = useState(false);
  const [savedFlag, setSavedFlag] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load existing settings
  useEffect(() => {
    if (initialCards.length === 0) {
      loadExistingSettings();
    } else {
      setCards(initialCards);
    }
  }, [initialCards]);

  const loadExistingSettings = async () => {
    try {
      const { get } = await import('../../services/api');
      const { data } = await get('/api/settings/app');
      const dashboardConfig = (data as any)?.dashboard;
      
      if (dashboardConfig?.timeWindow?.value) {
        setGlobalTimeWindow(Number(dashboardConfig.timeWindow.value) || 12);
      }
      
      if (dashboardConfig?.cards?.order && Array.isArray(dashboardConfig.cards.order)) {
        setCards(dashboardConfig.cards.order);
      } else {
        // Create default cards from legacy settings if they exist
        const defaultCards: DashboardCard[] = [];
        const legacy = dashboardConfig?.cards;
        
        if (legacy?.kpis) {
          defaultCards.push({
            id: 'default-status',
            type: 'kpi_status',
            size: 'md',
            position: { x: 0, y: 0 },
            config: { timeWindow: globalTimeWindow },
          });
        }
        
        if (legacy?.trends) {
          defaultCards.push({
            id: 'default-trends',
            type: 'graph_trends',
            size: 'xl',
            position: { x: 0, y: 1 },
            config: { timeWindow: globalTimeWindow, granularity: 'weekly' },
          });
        }
        
        if (legacy?.failures) {
          defaultCards.push({
            id: 'default-failures',
            type: 'graph_failures',
            size: 'lg',
            position: { x: 0, y: 2 },
            config: { timeWindow: globalTimeWindow, showLegend: true },
          });
        }
        
        if (legacy?.rar) {
          defaultCards.push({
            id: 'default-rar',
            type: 'rar_metric',
            size: 'lg',
            position: { x: 1, y: 2 },
          });
        }
        
        setCards(defaultCards);
      }
    } catch (error) {
      console.error('Failed to load dashboard settings:', error);
    }
  };

  // Card management functions
  const handleAddCard = useCallback((template: CardTemplate) => {
    const newCard: DashboardCard = {
      id: `${template.type}-${Date.now()}`,
      type: template.type as DashboardCard['type'],
      size: template.defaultSize,
      position: { x: 0, y: cards.length },
      config: { 
        timeWindow: globalTimeWindow,
        ...template.defaultConfig 
      },
    };
    
    setCards(prev => [...prev, newCard]);
    setSelectedCardId(newCard.id);
  }, [cards.length, globalTimeWindow]);

  const handleUpdateCard = useCallback((updatedCard: DashboardCard) => {
    setCards(prev => prev.map(card => 
      card.id === updatedCard.id ? updatedCard : card
    ));
  }, []);

  const handleDeleteCard = useCallback((cardId: string) => {
    setCards(prev => prev.filter(card => card.id !== cardId));
    if (selectedCardId === cardId) {
      setSelectedCardId(null);
    }
  }, [selectedCardId]);

  // const handleReorderCards = useCallback((dragIndex: number, hoverIndex: number) => {
  //   setCards(prev => {
  //     const dragCard = prev[dragIndex];
  //     const newCards = [...prev];
  //     newCards.splice(dragIndex, 1);
  //     newCards.splice(hoverIndex, 0, dragCard);
  //     return newCards;
  //   });
  // }, []);

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

  // Apply global time window to all relevant cards
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

  // Save function
  const handleSave = async () => {
    if (!onSave) return;
    
    try {
      setSaving(true);
      setSaveError(null);
      
      const globalConfig = {
        timeWindow: { kind: 'weeks', value: globalTimeWindow },
      };
      
      await onSave(cards, globalConfig);
      
      setSavedFlag(true);
      setTimeout(() => setSavedFlag(false), 2500);
    } catch (error: any) {
      setSaveError(error?.message || (t('failedToSave') || 'Failed to save'));
    } finally {
      setSaving(false);
    }
  };

  const selectedCard = cards.find(card => card.id === selectedCardId) || null;
  const selectedCardIndex = selectedCard ? cards.findIndex(card => card.id === selectedCardId) : -1;

  return (
    <DragDropProvider>
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
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors ${
                isPreviewMode 
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
              }`}
            >
              {isPreviewMode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {isPreviewMode ? (t('editMode') || 'Edit Mode') : (t('previewMode') || 'Preview Mode')}
            </button>
            
            <button
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
        <DashboardPreview
          cards={cards}
          selectedCardId={selectedCardId}
          onCardSelect={setSelectedCardId}
          isEditing={!isPreviewMode}
        />

        {/* Configuration Panel */}
        {!isPreviewMode && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card Library */}
            <div className="lg:col-span-2">
              <CardLibrary onAddCard={handleAddCard} />
            </div>

            {/* Card Configurator */}
            <div>
              <CardConfigurator
                card={selectedCard}
                onUpdateCard={handleUpdateCard}
                onDeleteCard={handleDeleteCard}
                onMoveCard={handleMoveCard}
                canMoveUp={selectedCardIndex > 0}
                canMoveDown={selectedCardIndex < cards.length - 1}
              />
            </div>
          </div>
        )}

        {/* Instructions */}
        {!isPreviewMode && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-900 mb-2">
              {t('instructions') || 'Instructions'}
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• {t('instructionAddCards') || 'Click cards in the library to add them to your dashboard'}</li>
              <li>• {t('instructionSelectCards') || 'Click cards in the preview to select and configure them'}</li>
              <li>• {t('instructionDragCards') || 'Drag cards in the preview to reorder them'}</li>
              <li>• {t('instructionPreview') || 'Use Preview Mode to see how your dashboard will look'}</li>
              <li>• {t('instructionGlobalTime') || 'Global time window applies to all time-based cards'}</li>
            </ul>
          </div>
        )}
      </div>
    </DragDropProvider>
  );
}
