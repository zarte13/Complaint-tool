import { useQuery } from 'react-query';
import { get } from '../services/api';
import { motion } from 'framer-motion';
import EvilPieChartCard from '../components/EvilCharts/EvilPieChartCard';
import EvilStackedGlowingBarCard from '../components/EvilCharts/EvilStackedGlowingBarCard';
import EvilBarChartCard from '../components/EvilCharts/EvilBarChartCard';
import { TrendingUp, AlertTriangle, Clock, BarChart3, Package } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// Data interfaces
interface RARMetrics {
  returnRate: number;
  authorizationRate: number;
  rejectionRate: number;
  totalComplaints: number;
  period: string;
}

interface StatusCounts {
  open: number;
  in_progress: number;
  resolved: number;
}

interface FailureMode {
  issueType: string;
  count: number;
}

interface MTTRMetrics {
  mttr_days: number;
  count: number;
}

interface OverdueActionsSummary {
  overdue_actions: number;
}

interface ActionsPerComplaint {
  average: number;
  complaints: number;
  actions: number;
}

type WeeklyTypeRow = {
  week: string;
  wrong_quantity: number;
  wrong_part: number;
  damaged: number;
  other: number;
};

interface DashboardCard {
  id: string;
  type: string;
  size: 'sm' | 'md' | 'lg' | 'xl';
  config?: {
    timeWindow?: number;
    limit?: number;
    showLegend?: boolean;
    granularity?: 'weekly' | 'monthly';
  };
}

// Card size classes mapping
const cardSizeClasses = {
  sm: 'col-span-1 row-span-1',
  md: 'col-span-2 row-span-1', 
  lg: 'col-span-3 row-span-2',
  xl: 'col-span-6 row-span-2'
};

// Individual card components
function StatusOverviewCard({ weeks }: { weeks: number }) {
  const { t } = useLanguage();
  const { data: statusCounts } = useQuery<StatusCounts>(
    ['statusCounts', weeks],
    () => get<StatusCounts>('/api/analytics/status-counts').then(res => res.data),
    { refetchInterval: 30000 }
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('statusOverview') || 'Status Overview'}</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{statusCounts?.open ?? 0}</div>
          <div className="text-sm text-gray-600">{t('statusOpen') || 'Open'}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{statusCounts?.in_progress ?? 0}</div>
          <div className="text-sm text-gray-600">{t('statusInProgress') || 'In Progress'}</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{statusCounts?.resolved ?? 0}</div>
          <div className="text-sm text-gray-600">{t('statusClosed') || 'Resolved'}</div>
        </div>
      </div>
    </div>
  );
}

function MTTRCard({ weeks }: { weeks: number }) {
  const { t } = useLanguage();
  const { data: mttr } = useQuery<MTTRMetrics>(
    ['mttr', weeks],
    () => get<MTTRMetrics>(`/api/analytics/mttr?weeks=${weeks}`).then(res => res.data),
    { refetchInterval: 30000 }
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Clock className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <div className="text-sm text-gray-600">{t('mttrTitle') || 'Mean Time To Resolution'}</div>
          <div className="text-2xl font-bold text-gray-900">{mttr?.mttr_days ?? 0}d</div>
        </div>
      </div>
      <div className="text-xs text-gray-500">{`Last ${weeks} weeks`}</div>
    </div>
  );
}

function OverdueActionsCard({ weeks }: { weeks: number }) {
  const { t } = useLanguage();
  const { data: overdue } = useQuery<OverdueActionsSummary>(
    ['overdueActions', weeks],
    () => get<OverdueActionsSummary>(`/api/analytics/actions/overdue-summary`).then(res => res.data),
    { refetchInterval: 30000 }
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-red-100 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <div className="text-sm text-gray-600">{t('overdueActionsTitle') || 'Overdue Actions'}</div>
          <div className="text-2xl font-bold text-gray-900">{overdue?.overdue_actions ?? 0}</div>
        </div>
      </div>
      <div className="text-xs text-gray-500">Overdue Actions</div>
    </div>
  );
}

function ActionsPerComplaintCard({ weeks }: { weeks: number }) {
  const { t } = useLanguage();
  const { data: apc } = useQuery<ActionsPerComplaint>(
    ['actionsPerComplaint', weeks],
    () => get<ActionsPerComplaint>(`/api/analytics/actions-per-complaint?weeks=${weeks}`).then(res => res.data),
    { refetchInterval: 30000 }
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-green-100 rounded-lg">
          <BarChart3 className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <div className="text-sm text-gray-600">{t('actionsPerComplaintTitle') || 'Actions per Complaint'}</div>
          <div className="text-2xl font-bold text-gray-900">{apc?.average ?? 0}</div>
        </div>
      </div>
      <div className="text-xs text-gray-500">{`Avg from ${apc?.complaints ?? 0} complaints`}</div>
    </div>
  );
}

function WeeklyTrendsCard({ weeks }: { weeks: number }) {
  const { t } = useLanguage();
  const { data: weeklyTypeTrends } = useQuery<WeeklyTypeRow[]>(
    ['weeklyTypeTrends', weeks],
    () => get<WeeklyTypeRow[]>(`/api/analytics/weekly-type-trends?weeks=${weeks}`).then(res => res.data)
  );

  return (
    <EvilStackedGlowingBarCard
      title={t('trendsTitle') || 'Weekly Trends'}
      data={weeklyTypeTrends || []}
      labels={{
        wrong_quantity: t('wrongQuantity') || 'Wrong Quantity',
        wrong_part: t('wrongPart') || 'Wrong Part',
        damaged: t('damaged') || 'Damaged',
        other: t('other') || 'Other',
      }}
    />
  );
}

function FailureModesCard({ weeks }: { weeks: number }) {
  const { t } = useLanguage();
  const { data: failureModes } = useQuery<FailureMode[]>(
    ['failureModes', weeks],
    () => get<FailureMode[]>(`/api/analytics/failure-modes?weeks=${weeks}`).then(res => res.data)
  );

  // Normalize API keys into our 4 canonical buckets
  const normalize = (s: string) => {
    const key = (s || '').toString().trim().toLowerCase().replace(/\s+/g, '_');
    if (key === 'wrong_quantity' || key === 'wrong_part' || key === 'damaged' || key === 'other') return key;
    return 'other';
  };

  const counts: Record<'wrong_quantity'|'wrong_part'|'damaged'|'other', number> = {
    wrong_quantity: 0,
    wrong_part: 0,
    damaged: 0,
    other: 0,
  };

  (failureModes || []).forEach((f) => {
    const k = normalize(f.issueType);
    counts[k as keyof typeof counts] = (counts[k as keyof typeof counts] || 0) + (f.count || 0);
  });

  const data = [
    { label: t('wrongQuantity') || 'Wrong Quantity', value: counts.wrong_quantity },
    { label: t('wrongPart') || 'Wrong Part', value: counts.wrong_part },
    { label: t('damaged') || 'Damaged', value: counts.damaged },
    { label: t('other') || 'Other', value: counts.other },
  ];

  return (
    <EvilPieChartCard
      title={t('failureModesTitle') || 'Failure Modes'}
      data={data}
    />
  );
}

function StackedAnalysisCard({ weeks }: { weeks: number }) {
  const { t } = useLanguage();
  const { data: weeklyTypeTrends } = useQuery<WeeklyTypeRow[]>(
    ['weeklyTypeTrends', weeks],
    () => get<WeeklyTypeRow[]>(`/api/analytics/weekly-type-trends?weeks=${weeks}`).then(res => res.data)
  );

  return (
    <EvilStackedGlowingBarCard
      title={t('stackedAnalysisTitle') || 'Stacked Analysis'}
      data={weeklyTypeTrends || []}
      labels={{
        wrong_quantity: t('wrongQuantity') || 'Wrong Quantity',
        wrong_part: t('wrongPart') || 'Wrong Part',
        damaged: t('damaged') || 'Damaged',
        other: t('other') || 'Other',
      }}
    />
  );
}

function TopCompaniesCard({ weeks, limit }: { weeks: number; limit?: number }) {
  const { t } = useLanguage();
  const { data } = useQuery<any>(
    ['topCompanies', weeks, limit],
    () => get<any>(`/api/analytics/top/companies?limit=${limit || 6}&weeks=${weeks}`).then(r => r.data)
  );
  const list = (data as Array<{ label: string; value: number }>) || [];
  
  return (
    <EvilBarChartCard 
      title={t('topCompaniesTitle') || 'Top Companies'} 
      data={list} 
    />
  );
}

function TopPartsCard({ weeks, limit }: { weeks: number; limit?: number }) {
  const { t } = useLanguage();
  const { data } = useQuery<any>(
    ['topParts', weeks, limit],
    () => get<any>(`/api/analytics/top/parts?limit=${limit || 20}&weeks=${weeks}`).then(r => r.data)
  );
  const list = (data as Array<{ label: string; value: number }>) || [];
  
  return (
    <EvilBarChartCard 
      title={t('topPartsTitle') || 'Top Parts'} 
      data={list} 
    />
  );
}

function RARMetricsCard({ weeks }: { weeks: number }) {
  const { t } = useLanguage();
  const { data: rarMetrics } = useQuery<RARMetrics>(
    ['rarMetrics', weeks],
    () => get<RARMetrics>('/api/analytics/rar-metrics').then(res => res.data),
    { refetchInterval: 30000 }
  );

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-100 rounded-lg">
          <TrendingUp className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{t('rarMetricsTitle') || 'RAR Metrics'}</h3>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{rarMetrics?.returnRate ?? 0}%</div>
          <div className="text-sm text-gray-600">Return Rate</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{rarMetrics?.authorizationRate ?? 0}%</div>
          <div className="text-sm text-gray-600">Authorization Rate</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{rarMetrics?.rejectionRate ?? 0}%</div>
          <div className="text-sm text-gray-600">Rejection Rate</div>
        </div>
      </div>
    </div>
  );
}

// Card renderer function
function renderCard(card: DashboardCard, globalWeeks: number, index: number) {
  const weeks = card.config?.timeWindow || globalWeeks;
  const size = cardSizeClasses[card.size];
  
  const cardContent = (() => {
    switch (card.type) {
      case 'kpi_status':
        return <StatusOverviewCard weeks={weeks} />;
      case 'kpi_mttr':
        return <MTTRCard weeks={weeks} />;
      case 'kpi_overdue_actions':
        return <OverdueActionsCard weeks={weeks} />;
      case 'kpi_actions_per_complaint':
        return <ActionsPerComplaintCard weeks={weeks} />;
      case 'graph_trends':
        return <WeeklyTrendsCard weeks={weeks} />;
      case 'graph_failures':
        return <FailureModesCard weeks={weeks} />;
      case 'graph_stacked':
        return <StackedAnalysisCard weeks={weeks} />;
      case 'graph_top_companies':
        return <TopCompaniesCard weeks={weeks} limit={card.config?.limit} />;
      case 'graph_top_parts':
        return <TopPartsCard weeks={weeks} limit={card.config?.limit} />;
      case 'rar_metric':
        return <RARMetricsCard weeks={weeks} />;
      default:
        return null;
    }
  })();

  if (!cardContent) return null;

  return (
    <motion.div
      key={card.id}
      className={size}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      {cardContent}
    </motion.div>
  );
}

const DashboardPage: React.FC = () => {
  const { t } = useLanguage();
  
  // Load app settings to drive dashboard config
  const { data: appSettings, isLoading: loadingSettings } = useQuery<any>(
    'appSettings', 
    () => get<any>('/api/settings/app').then(res => res.data),
    { refetchInterval: 30000 }
  );

  if (loadingSettings) {
    return (
      <motion.div
        className="min-h-screen bg-gray-50 flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center">
          <motion.div
            className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          />
          <motion.p
            className="mt-4 text-gray-600"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            {t('loadingDashboard') || 'Loading dashboard...'}
          </motion.p>
        </div>
      </motion.div>
    );
  }

  const globalWeeks = Math.max(1, Math.min(52, Number(appSettings?.dashboard?.timeWindow?.value ?? 12)));
  const configuredCards = (appSettings?.dashboard?.cards?.order || []) as DashboardCard[];

  // If no cards are configured, show a default layout
  const defaultCards: DashboardCard[] = [
    { id: 'default-status', type: 'kpi_status', size: 'md', config: { timeWindow: globalWeeks } },
    { id: 'default-mttr', type: 'kpi_mttr', size: 'sm', config: { timeWindow: globalWeeks } },
    { id: 'default-overdue', type: 'kpi_overdue_actions', size: 'sm', config: { timeWindow: globalWeeks } },
    { id: 'default-apc', type: 'kpi_actions_per_complaint', size: 'sm', config: { timeWindow: globalWeeks } },
    { id: 'default-trends', type: 'graph_trends', size: 'xl', config: { timeWindow: globalWeeks } },
    { id: 'default-failures', type: 'graph_failures', size: 'lg', config: { timeWindow: globalWeeks } },
    { id: 'default-companies', type: 'graph_top_companies', size: 'lg', config: { timeWindow: globalWeeks, limit: 6 } },
  ];

  const cardsToRender = configuredCards.length > 0 ? configuredCards : defaultCards;

  return (
    <motion.div 
      className="min-h-screen bg-gray-50 p-4 md:p-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto">
        <motion.h1 
          className="text-3xl font-bold text-gray-900 mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {t('dashboardTitle') || 'Dashboard'}
        </motion.h1>
        
        {cardsToRender.length === 0 ? (
        <motion.div
            className="text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">
              {t('noDashboardCards') || 'No dashboard cards configured'}
            </h2>
            <p className="text-gray-500">
              {t('configureDashboard') || 'Go to Settings to configure your dashboard cards'}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-6 gap-6 auto-rows-min">
            {cardsToRender.map((card, index) => renderCard(card, globalWeeks, index))}
              </div>
        )}
      </div>
    </motion.div>
  );
};

export default DashboardPage;