
import { useLanguage } from '../../contexts/LanguageContext';
import { Settings, Trash2, Move, Palette } from 'lucide-react';
import type { DashboardCard } from './DashboardPreview';

interface CardConfiguratorProps {
  card: DashboardCard | null;
  onUpdateCard: (card: DashboardCard) => void;
  onDeleteCard: (cardId: string) => void;
  onMoveCard: (cardId: string, direction: 'up' | 'down') => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export default function CardConfigurator({
  card,
  onUpdateCard,
  onDeleteCard,
  onMoveCard,
  canMoveUp,
  canMoveDown,
}: CardConfiguratorProps) {
  const { t } = useLanguage();

  if (!card) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6 text-center">
        <Settings className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t('cardConfiguration') || 'Card Configuration'}
        </h3>
        <p className="text-sm text-gray-500">
          {t('selectCardToConfig') || 'Select a card from the preview to configure its settings'}
        </p>
      </div>
    );
  }

  const getCardTypeName = () => {
    switch (card.type) {
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
      default: return card.type;
    }
  };

  const hasTimeWindow = ['kpi_mttr', 'kpi_actions_per_complaint', 'graph_trends', 'graph_failures', 'graph_stacked', 'graph_top_companies', 'graph_top_parts'].includes(card.type);
  const hasLimit = ['graph_top_companies', 'graph_top_parts'].includes(card.type);
  const hasGranularity = ['graph_trends'].includes(card.type);
  const hasLegend = ['graph_failures', 'graph_stacked'].includes(card.type);

  const updateCardConfig = (configUpdate: Partial<NonNullable<DashboardCard['config']>>) => {
    onUpdateCard({
      ...card,
      config: {
        ...card.config,
        ...configUpdate,
      },
    });
  };

  const updateCardProperty = (property: keyof DashboardCard, value: any) => {
    onUpdateCard({
      ...card,
      [property]: value,
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-900">
              {t('configuringCard') || 'Configuring:'} {getCardTypeName()}
            </h3>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => onMoveCard(card.id, 'up')}
              disabled={!canMoveUp}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('moveUp') || 'Move up'}
            >
              <Move className="w-4 h-4 rotate-180" />
            </button>
            <button
              onClick={() => onMoveCard(card.id, 'down')}
              disabled={!canMoveDown}
              className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('moveDown') || 'Move down'}
            >
              <Move className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeleteCard(card.id)}
              className="p-1 text-gray-400 hover:text-red-600"
              title={t('remove') || 'Remove'}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Configuration Panel */}
      <div className="p-4 space-y-4">
        {/* Size Configuration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Palette className="w-4 h-4 inline mr-1" />
            {t('cardSize') || 'Card Size'}
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['sm', 'md', 'lg', 'xl'] as const).map((size) => (
              <button
                key={size}
                onClick={() => updateCardProperty('size', size)}
                className={`p-2 text-xs rounded border-2 transition-colors ${
                  card.size === size
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {size === 'sm' && (t('sizeSmall') || 'Small')}
                {size === 'md' && (t('sizeMedium') || 'Medium')}
                {size === 'lg' && (t('sizeLarge') || 'Large')}
                {size === 'xl' && (t('sizeExtraLarge') || 'X-Large')}
              </button>
            ))}
          </div>
        </div>

        {/* Time Window Configuration */}
        {hasTimeWindow && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('timeWindow') || 'Time Window (weeks)'}
            </label>
            <div className="flex gap-2">
              {[4, 8, 12, 16, 24, 52].map((weeks) => (
                <button
                  key={weeks}
                  onClick={() => updateCardConfig({ timeWindow: weeks })}
                  className={`px-3 py-1 text-xs rounded border transition-colors ${
                    (card.config?.timeWindow || 12) === weeks
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
        {hasLimit && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('topLimit') || 'Top N Items'}
            </label>
            <div className="flex gap-2">
              {card.type === 'graph_top_companies' 
                ? [3, 6, 10, 15].map((limit) => (
                    <button
                      key={limit}
                      onClick={() => updateCardConfig({ limit })}
                      className={`px-3 py-1 text-xs rounded border transition-colors ${
                        (card.config?.limit || 6) === limit
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
                      onClick={() => updateCardConfig({ limit })}
                      className={`px-3 py-1 text-xs rounded border transition-colors ${
                        (card.config?.limit || 20) === limit
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

        {/* Granularity Configuration */}
        {hasGranularity && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('granularity') || 'Time Granularity'}
            </label>
            <div className="flex gap-2">
              {(['weekly', 'monthly'] as const).map((granularity) => (
                <button
                  key={granularity}
                  onClick={() => updateCardConfig({ granularity })}
                  className={`px-3 py-1 text-xs rounded border transition-colors ${
                    (card.config?.granularity || 'weekly') === granularity
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {granularity === 'weekly' ? (t('weekly') || 'Weekly') : (t('monthly') || 'Monthly')}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Legend Configuration */}
        {hasLegend && (
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={card.config?.showLegend ?? true}
                onChange={(e) => updateCardConfig({ showLegend: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {t('showLegend') || 'Show Legend'}
            </label>
          </div>
        )}

        {/* Card Info */}
        <div className="pt-4 border-t border-gray-100">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            {t('cardInfo') || 'Card Information'}
          </h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>{t('type') || 'Type'}:</strong> {card.type}</div>
            <div><strong>{t('size') || 'Size'}:</strong> {card.size}</div>
            {card.config?.timeWindow && (
              <div><strong>{t('timeWindow') || 'Time Window'}:</strong> {card.config.timeWindow} weeks</div>
            )}
            {card.config?.limit && (
              <div><strong>{t('limit') || 'Limit'}:</strong> Top {card.config.limit}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
