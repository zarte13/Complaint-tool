
import { useLanguage } from '../../contexts/LanguageContext';
import { TrendingUp, AlertTriangle, Clock, BarChart3, Users, Package, Plus } from 'lucide-react';

export interface CardTemplate {
  type: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  category: 'kpi' | 'chart' | 'metric';
  defaultSize: 'sm' | 'md' | 'lg' | 'xl';
  defaultConfig?: {
    timeWindow?: number;
    limit?: number;
    showLegend?: boolean;
    granularity?: 'weekly' | 'monthly';
  };
}

const cardTemplates: CardTemplate[] = [
  {
    type: 'kpi_status',
    title: 'Status Overview',
    description: 'Current complaint status counts',
    icon: TrendingUp,
    category: 'kpi',
    defaultSize: 'md',
  },
  {
    type: 'kpi_mttr',
    title: 'Mean Time To Resolution',
    description: 'Average resolution time',
    icon: Clock,
    category: 'kpi',
    defaultSize: 'sm',
    defaultConfig: { timeWindow: 12 },
  },
  {
    type: 'kpi_overdue_actions',
    title: 'Overdue Actions',
    description: 'Count of overdue follow-up actions',
    icon: AlertTriangle,
    category: 'kpi',
    defaultSize: 'sm',
  },
  {
    type: 'kpi_actions_per_complaint',
    title: 'Actions per Complaint',
    description: 'Average actions per complaint',
    icon: BarChart3,
    category: 'kpi',
    defaultSize: 'sm',
    defaultConfig: { timeWindow: 12 },
  },
  {
    type: 'graph_trends',
    title: 'Weekly Trends',
    description: 'Complaint trends over time',
    icon: TrendingUp,
    category: 'chart',
    defaultSize: 'xl',
    defaultConfig: { timeWindow: 12, granularity: 'weekly' },
  },
  {
    type: 'graph_failures',
    title: 'Failure Modes',
    description: 'Breakdown by issue type',
    icon: AlertTriangle,
    category: 'chart',
    defaultSize: 'lg',
    defaultConfig: { timeWindow: 12, showLegend: true },
  },
  {
    type: 'graph_stacked',
    title: 'Stacked Analysis',
    description: 'Multi-dimensional breakdown',
    icon: BarChart3,
    category: 'chart',
    defaultSize: 'xl',
    defaultConfig: { timeWindow: 12 },
  },
  {
    type: 'graph_top_companies',
    title: 'Top Companies',
    description: 'Companies with most complaints',
    icon: Users,
    category: 'chart',
    defaultSize: 'lg',
    defaultConfig: { timeWindow: 12, limit: 6 },
  },
  {
    type: 'graph_top_parts',
    title: 'Top Parts',
    description: 'Parts with most complaints',
    icon: Package,
    category: 'chart',
    defaultSize: 'lg',
    defaultConfig: { timeWindow: 12, limit: 20 },
  },
  {
    type: 'rar_metric',
    title: 'RAR Metrics',
    description: 'Return, Authorization, Rejection rates',
    icon: TrendingUp,
    category: 'metric',
    defaultSize: 'lg',
  },
];

interface CardLibraryProps {
  onAddCard: (template: CardTemplate) => void;
}

export default function CardLibrary({ onAddCard }: CardLibraryProps) {
  const { t } = useLanguage();

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

  const getLocalizedDescription = (type: string) => {
    switch (type) {
      case 'kpi_status': return t('statusOverviewDesc') || 'Current complaint status counts';
      case 'kpi_mttr': return t('mttrDesc') || 'Average resolution time';
      case 'kpi_overdue_actions': return t('overdueActionsDesc') || 'Count of overdue follow-up actions';
      case 'kpi_actions_per_complaint': return t('actionsPerComplaintDesc') || 'Average actions per complaint';
      case 'graph_trends': return t('trendsDesc') || 'Complaint trends over time';
      case 'graph_failures': return t('failureModesDesc') || 'Breakdown by issue type';
      case 'graph_stacked': return t('stackedAnalysisDesc') || 'Multi-dimensional breakdown';
      case 'graph_top_companies': return t('topCompaniesDesc') || 'Companies with most complaints';
      case 'graph_top_parts': return t('topPartsDesc') || 'Parts with most complaints';
      case 'rar_metric': return t('rarMetricsDesc') || 'Return, Authorization, Rejection rates';
      default: return '';
    }
  };

  const categoryNames = {
    kpi: t('kpiCards') || 'KPI Cards',
    chart: t('chartCards') || 'Chart Cards',
    metric: t('metricCards') || 'Metric Cards',
  };

  const groupedTemplates = cardTemplates.reduce((acc, template) => {
    if (!acc[template.category]) acc[template.category] = [];
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, CardTemplate[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          {t('cardLibrary') || 'Card Library'}
        </h3>
      </div>

      {Object.entries(groupedTemplates).map(([category, templates]) => (
        <div key={category} className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 uppercase tracking-wide">
            {categoryNames[category as keyof typeof categoryNames]}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {templates.map((template) => {
              const Icon = template.icon;
              return (
                <button
                  key={template.type}
                  onClick={() => onAddCard(template)}
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
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {getLocalizedDescription(template.type)}
                      </p>
                      
                      {/* Configuration preview */}
                      {template.defaultConfig && (
                        <div className="flex gap-1 mt-2">
                          {template.defaultConfig.timeWindow && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {template.defaultConfig.timeWindow}w
                            </span>
                          )}
                          {template.defaultConfig.limit && (
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              Top {template.defaultConfig.limit}
                            </span>
                          )}
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">
                            {template.defaultSize}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
