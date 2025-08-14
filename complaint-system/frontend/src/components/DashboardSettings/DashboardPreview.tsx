
// import { useDrag, useDrop } from 'react-dnd';
import { useLanguage } from '../../contexts/LanguageContext';
import { TrendingUp, AlertTriangle, Clock, BarChart3, Users, Package, GripVertical } from 'lucide-react';

export interface DashboardCard {
  id: string;
  type: 'kpi_status' | 'kpi_mttr' | 'kpi_overdue_actions' | 'kpi_actions_per_complaint' | 
        'graph_trends' | 'graph_failures' | 'graph_stacked' | 'graph_top_companies' | 'graph_top_parts' | 'rar_metric';
  size: 'sm' | 'md' | 'lg' | 'xl';
  position: { x: number; y: number };
  config?: {
    timeWindow?: number;
    limit?: number;
    showLegend?: boolean;
    granularity?: 'weekly' | 'monthly';
  };
}

interface DashboardPreviewProps {
  cards: DashboardCard[];
  onCardSelect?: (cardId: string) => void;
  selectedCardId?: string | null;
  isEditing?: boolean;
  onReorderCards?: (dragIndex: number, hoverIndex: number) => void;
}

const cardTypeInfo = {
  'kpi_status': { icon: TrendingUp, title: 'Status Overview', gridSize: { sm: 'col-span-1', md: 'col-span-2', lg: 'col-span-2', xl: 'col-span-3' } },
  'kpi_mttr': { icon: Clock, title: 'Mean Time To Resolution', gridSize: { sm: 'col-span-1', md: 'col-span-1', lg: 'col-span-2', xl: 'col-span-2' } },
  'kpi_overdue_actions': { icon: AlertTriangle, title: 'Overdue Actions', gridSize: { sm: 'col-span-1', md: 'col-span-1', lg: 'col-span-1', xl: 'col-span-1' } },
  'kpi_actions_per_complaint': { icon: BarChart3, title: 'Actions per Complaint', gridSize: { sm: 'col-span-1', md: 'col-span-1', lg: 'col-span-1', xl: 'col-span-1' } },
  'graph_trends': { icon: TrendingUp, title: '12-Week Trends', gridSize: { sm: 'col-span-2', md: 'col-span-3', lg: 'col-span-4', xl: 'col-span-6' } },
  'graph_failures': { icon: AlertTriangle, title: 'Failure Modes', gridSize: { sm: 'col-span-2', md: 'col-span-2', lg: 'col-span-3', xl: 'col-span-3' } },
  'graph_stacked': { icon: BarChart3, title: 'Stacked Analysis', gridSize: { sm: 'col-span-2', md: 'col-span-3', lg: 'col-span-4', xl: 'col-span-6' } },
  'graph_top_companies': { icon: Users, title: 'Top Companies', gridSize: { sm: 'col-span-2', md: 'col-span-2', lg: 'col-span-3', xl: 'col-span-3' } },
  'graph_top_parts': { icon: Package, title: 'Top Parts', gridSize: { sm: 'col-span-2', md: 'col-span-2', lg: 'col-span-3', xl: 'col-span-3' } },
  'rar_metric': { icon: TrendingUp, title: 'RAR Metrics', gridSize: { sm: 'col-span-2', md: 'col-span-2', lg: 'col-span-3', xl: 'col-span-3' } },
};

function PreviewCard({ 
  card, 
  isSelected, 
  onClick, 
  isEditing
}: { 
  card: DashboardCard; 
  isSelected: boolean; 
  onClick?: () => void;
  isEditing: boolean;
}) {
  const { t } = useLanguage();
  const info = cardTypeInfo[card.type];
  const Icon = info.icon;

  // Drag and Drop functionality - temporarily disabled
  const isDragging = false;
  const isOver = false;
  // const [{ isDragging }, drag] = useDrag({
  //   type: 'dashboard-card',
  //   item: { index, card },
  //   canDrag: isEditing,
  //   collect: (monitor) => ({
  //     isDragging: monitor.isDragging(),
  //   }),
  // });

  // const [{ isOver }, drop] = useDrop({
  //   accept: 'dashboard-card',
  //   hover: (draggedItem: { index: number }) => {
  //     if (!onReorderCards) return;
  //     if (draggedItem.index !== index) {
  //       onReorderCards(draggedItem.index, index);
  //       draggedItem.index = index;
  //     }
  //   },
  //   collect: (monitor) => ({
  //     isOver: monitor.isOver(),
  //   }),
  // });
  
  // Get localized title
  const getLocalizedTitle = () => {
    switch (card.type) {
      case 'kpi_status': return t('statusOverview') || 'Status Overview';
      case 'kpi_mttr': return t('mttrTitle') || 'Mean Time To Resolution';
      case 'kpi_overdue_actions': return t('overdueActionsTitle') || 'Overdue Actions';
      case 'kpi_actions_per_complaint': return t('actionsPerComplaintTitle') || 'Actions per Complaint';
      case 'graph_trends': return t('trendsTitle') || '12-Week Trends';
      case 'graph_failures': return t('failureModesTitle') || 'Failure Modes';
      case 'graph_stacked': return t('stackedAnalysisTitle') || 'Stacked Analysis';
      case 'graph_top_companies': return t('topCompaniesTitle') || 'Top Companies';
      case 'graph_top_parts': return t('topPartsTitle') || 'Top Parts';
      case 'rar_metric': return t('rarMetricsTitle') || 'RAR Metrics';
      default: return info.title;
    }
  };

  // Determine height based on card type and size
  const getHeight = () => {
    const isKPI = card.type.startsWith('kpi_');
    if (isKPI) return 'h-24';
    
    switch (card.size) {
      case 'sm': return 'h-32';
      case 'md': return 'h-40';
      case 'lg': return 'h-48';
      case 'xl': return 'h-56';
      default: return 'h-40';
    }
  };

  return (
    <div
      // ref={(node) => {
      //   if (isEditing) {
      //     drag(drop(node));
      //   }
      // }}
      className={`
        bg-white border-2 rounded-lg p-4 transition-all duration-200
        ${info.gridSize[card.size]} ${getHeight()}
        ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
        ${isEditing ? 'hover:shadow-md cursor-move' : 'cursor-pointer'}
        ${isDragging ? 'opacity-50' : ''}
        ${isOver ? 'border-blue-400 bg-blue-25' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
        <h3 className={`text-sm font-medium ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
          {getLocalizedTitle()}
        </h3>
        {isEditing && (
          <GripVertical className="w-3 h-3 text-gray-400 ml-auto" />
        )}
      </div>
      
      {/* Preview content based on card type */}
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
              {card.type.includes('graph') ? 'Chart Preview' : 'Data Preview'}
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
}

export default function DashboardPreview({ 
  cards, 
  onCardSelect, 
  selectedCardId, 
  isEditing = false
}: DashboardPreviewProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          {t('dashboardPreview') || 'Dashboard Preview'}
        </h3>
        {isEditing && (
          <span className="text-sm text-gray-500">
            ({t('clickToSelect') || 'Click cards to configure'})
          </span>
        )}
      </div>
      
      {cards.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-30" />
          <p>{t('noDashboardCards') || 'No dashboard cards configured'}</p>
          <p className="text-sm">{t('addCardsToStart') || 'Add cards below to start building your dashboard'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 auto-rows-min">
          {cards.map((card) => (
            <PreviewCard
              key={card.id}
              card={card}
              isSelected={selectedCardId === card.id}
              onClick={() => onCardSelect?.(card.id)}
              isEditing={isEditing}
            />
          ))}
        </div>
      )}
    </div>
  );
}
