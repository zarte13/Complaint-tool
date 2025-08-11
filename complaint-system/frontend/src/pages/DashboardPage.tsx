import { useQuery } from 'react-query';
import { get } from '../services/api';
import { motion } from 'framer-motion';
// import EvilLineChartCard from '../components/EvilCharts/EvilLineChartCard';
// import EvilBarChartCard from '../components/EvilCharts/EvilBarChartCard';
import EvilPieChartCard from '../components/EvilCharts/EvilPieChartCard';
import EvilStackedGlowingBarCard from '../components/EvilCharts/EvilStackedGlowingBarCard';
import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
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

const DashboardPage: React.FC = () => {
  const { t } = useLanguage();
  const { data: rarMetrics, isLoading: loadingRAR } = useQuery<RARMetrics>(
    'rarMetrics',
    () => get<RARMetrics>('/api/analytics/rar-metrics').then(res => res.data),
    { refetchInterval: 30000 }
  );

  // New query for complaint status counts
  const { data: statusCounts, isLoading: loadingStatusCounts } = useQuery<StatusCounts>(
    'statusCounts',
    () => get<StatusCounts>('/api/analytics/status-counts').then(res => res.data),
    { refetchInterval: 30000 }
  );

  const { data: failureModes, isLoading: loadingFailure } = useQuery<FailureMode[]>(
    'failureModes',
    () => get<FailureMode[]>('/api/analytics/failure-modes').then(res => res.data)
  );

  const { isLoading: loadingTrends } = useQuery<Trends>(
    'trends',
    () => get<Trends>('/api/analytics/trends').then(res => res.data)
  );

  const { data: weeklyTypeTrends, isLoading: loadingWeeklyTypes } = useQuery<WeeklyTypeRow[]>(
    'weeklyTypeTrends',
    () => get<WeeklyTypeRow[]>('/api/analytics/weekly-type-trends').then(res => res.data)
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
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <motion.div
            className="bg-white rounded-lg shadow p-6"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('kpiOpenCount')}</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts?.open ?? 0}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-lg shadow p-6"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('kpiInProgressCount')}</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts?.in_progress ?? 0}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-lg shadow p-6"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{t('kpiResolvedCount')}</p>
                <p className="text-2xl font-bold text-gray-900">{statusCounts?.resolved ?? 0}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
{/* RAR Metric Card */}
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Complaint Trends (12 weeks stacked per type) */}
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

          {/* Failure Modes (all four main categories) as Pie */}
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
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;