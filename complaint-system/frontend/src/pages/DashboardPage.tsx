import { useQuery } from 'react-query';
import { get } from '../services/api';
import { motion } from 'framer-motion';
// import EvilLineChartCard from '../components/EvilCharts/EvilLineChartCard';
// import EvilBarChartCard from '../components/EvilCharts/EvilBarChartCard';
import EvilPieChartCard from '../components/EvilCharts/EvilPieChartCard';
import EvilStackedGlowingBarCard from '../components/EvilCharts/EvilStackedGlowingBarCard';
import EvilBarChartCard from '../components/EvilCharts/EvilBarChartCard';
import { TrendingUp } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface RARMetrics {
  // Keeping original fields in case other parts still use them
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

interface Trends {
  labels: string[];
  data: number[];
}

type WeeklyTypeRow = {
  week: string;
  wrong_quantity: number;
  wrong_part: number;
  damaged: number;
  other: number;
};

function TopCompaniesCard({ weeks }: { weeks: number }) {
  const { t } = useLanguage();
  const { data } = useQuery<any>(['topCompanies', weeks], () => get<any>(`/api/analytics/top/companies?limit=6&weeks=${weeks}`).then(r => r.data));
  const list = (data as Array<{ label: string; value: number }>) || [];
  return <EvilBarChartCard title={t('topCompaniesTitle') || 'Top Companies (by complaints)'} data={list} />
}

function TopPartsCard({ weeks }: { weeks: number }) {
  const { t } = useLanguage();
  const { data } = useQuery<any>(['topParts', weeks], () => get<any>(`/api/analytics/top/parts?limit=20&weeks=${weeks}`).then(r => r.data));
  const list = (data as Array<{ label: string; value: number }>) || [];
  return <EvilBarChartCard title={t('topPartsTitle') || 'Top Parts (by complaints)'} data={list} />
}

function KpiRow({ weeks }: { weeks: number }) {
  const { t } = useLanguage();
  const { data: mttr } = useQuery<any>(['kpi_mttr', weeks], () => get<any>(`/api/analytics/mttr?weeks=${weeks}`).then(r => r.data));
  const { data: overdue } = useQuery<any>(['kpi_overdue'], () => get<any>(`/api/analytics/actions/overdue-summary`).then(r => r.data));
  const { data: apc } = useQuery<any>(['kpi_actions_per_complaint', weeks], () => get<any>(`/api/analytics/actions-per-complaint?weeks=${weeks}`).then(r => r.data));
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600">{t('mttrTitle') || 'Mean Time To Resolution'}</div>
        <div className="text-2xl font-bold text-gray-900">{mttr?.mttr_days ?? 0}d</div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600">{t('overdueActionsTitle') || 'Overdue Actions'}</div>
        <div className="text-2xl font-bold text-gray-900">{overdue?.overdue_actions ?? 0}</div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-sm text-gray-600">{t('actionsPerComplaintTitle') || 'Actions per Complaint'}</div>
        <div className="text-2xl font-bold text-gray-900">{apc?.average ?? 0}</div>
      </div>
    </motion.div>
  );
}

const DashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const { data: rarMetrics, isLoading: loadingRAR } = useQuery<RARMetrics>(
    'rarMetrics',
    () => get<RARMetrics>('/api/analytics/rar-metrics').then(res => res.data),
    { refetchInterval: 30000 }
  );

  // New query for complaint status counts
  const { isLoading: loadingStatusCounts } = useQuery<StatusCounts>(
    'statusCounts',
    () => get<StatusCounts>('/api/analytics/status-counts').then(res => res.data),
    { refetchInterval: 30000 }
  );

  const { data: failureModes, isLoading: loadingFailure } = useQuery<FailureMode[]>(
    'failureModes',
    () => get<FailureMode[]>('/api/analytics/failure-modes').then(res => res.data)
  );

  // Load app settings to drive dashboard config
  const { data: appSettings } = useQuery<any>('appSettings', () => get<any>('/api/settings/app').then(res => res.data));

  const weeksWindow = Math.max(1, Math.min(52, Number(appSettings?.dashboard?.timeWindow?.value ?? 12)));
  const cards = {
    kpis: appSettings?.dashboard?.cards?.kpis ?? true,
    trends: appSettings?.dashboard?.cards?.trends ?? true,
    failures: appSettings?.dashboard?.cards?.failures ?? true,
    stacked: appSettings?.dashboard?.cards?.stacked ?? false,
    rar: appSettings?.dashboard?.cards?.rar ?? true,
  } as const;

  const orderedCards = (appSettings?.dashboard?.cards?.order || []) as Array<{ id: string; type: string; size: 'sm'|'md'|'lg' }>;
  const defaultOrderedCards: Array<{ id: string; type: string; size: 'sm'|'md'|'lg' }> = [
    { id: 'graph_top_companies-default', type: 'graph_top_companies', size: 'lg' },
    { id: 'graph_top_parts-default', type: 'graph_top_parts', size: 'lg' },
  ];
  const effectiveCards = orderedCards.length > 0 ? orderedCards : defaultOrderedCards;

  const { isLoading: loadingTrends } = useQuery<Trends>(
    ['trends', weeksWindow],
    () => get<Trends>(`/api/analytics/trends`).then(res => res.data)
  );

  const { data: weeklyTypeTrends, isLoading: loadingWeeklyTypes } = useQuery<WeeklyTypeRow[]>(
    ['weeklyTypeTrends', weeksWindow],
    () => get<WeeklyTypeRow[]>(`/api/analytics/weekly-type-trends?weeks=${weeksWindow}`).then(res => res.data)
  );

  if (loadingRAR || loadingFailure || loadingTrends || loadingStatusCounts || loadingWeeklyTypes) {
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
            {t('loadingDashboard')}
          </motion.p>
        </div>
      </motion.div>
    );
  }

  // const chartData = trends?.labels?.map((label, index) => ({
  //   date: label,
  //   complaints: trends?.data?.[index] ?? 0
  // })) || [];

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
          {t('dashboardTitle')}
        </motion.h1>
        
        {/* KPI Cards: Complaint status counts */}
        {cards.kpis && (
          <KpiRow weeks={weeksWindow} />
        )}
{/* RAR Metric Card */}
{cards.rar && (
<motion.div
  className="bg-white rounded-lg shadow p-6"
  whileHover={{ scale: 1.02 }}
  transition={{ type: "spring", stiffness: 300 }}
>
  <div className="flex items-center">
    <div className="p-2 bg-purple-100 rounded-lg">
      <TrendingUp className="h-6 w-6 text-purple-600" />
    </div>
    <div className="ml-4">
      <p className="text-sm font-medium text-gray-600">{'Return Rate'}</p>
      <p className="text-2xl font-bold text-gray-900">{rarMetrics?.returnRate ?? 0}%</p>
    </div>
  </div>
</motion.div>
)}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Render modular cards first if any */}
          {effectiveCards.map((c, idx) => {
            const colSpan = c.size === 'lg' ? 'lg:col-span-2' : 'lg:col-span-1';
            if (c.type === 'graph_top_companies') {
              return (
                <motion.div key={c.id} className={colSpan} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 + idx * 0.05 }}>
                  {/* Fetch and render top companies */}
                  <TopCompaniesCard weeks={weeksWindow} />
                </motion.div>
              );
            }
            if (c.type === 'graph_top_parts') {
              return (
                <motion.div key={c.id} className={colSpan} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 + idx * 0.05 }}>
                  <TopPartsCard weeks={weeksWindow} />
                </motion.div>
              );
            }
            // KPIs would be rendered in the KPI row; keep here for future individual placements
            return null;
          })}
          {/* Complaint Trends (12 weeks stacked per type) */}
          {cards.stacked && effectiveCards.length === 0 && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
            <EvilStackedGlowingBarCard
              title={t('trendsTitle')}
              data={weeklyTypeTrends || []}
              labels={{
                wrong_quantity: t('wrongQuantity'),
                wrong_part: t('wrongPart'),
                damaged: t('damaged'),
                other: t('other'),
              }}
            />
          </motion.div>
          )}

          {/* Failure Modes (all four main categories) as Pie */}
          {cards.failures && effectiveCards.length === 0 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
            {(() => {
              // Normalize API keys into our 4 canonical buckets
              const normalize = (s: string) => {
                const key = (s || '').toString().trim().toLowerCase().replace(/\s+/g, '_');
                if (key === 'wrong_quantity' || key === 'wrong_part' || key === 'damaged' || key === 'other') return key;
                // fallback
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
                { label: t('wrongQuantity'), value: counts.wrong_quantity },
                { label: t('wrongPart'), value: counts.wrong_part },
                { label: t('damaged'), value: counts.damaged },
                { label: t('other'), value: counts.other },
              ];
              return (
                <EvilPieChartCard
                  title={t('failureModesTitle')}
                  data={data}
                />
              );
            })()}
          </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;