import React from 'react';
import { useQuery } from 'react-query';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface RARMetrics {
  returnRate: number;
  authorizationRate: number;
  rejectionRate: number;
  totalComplaints: number;
  period: string;
}

interface FailureMode {
  issueType: string;
  count: number;
}

interface Trends {
  labels: string[];
  data: number[];
}

const DashboardPage: React.FC = () => {
  const { data: rarMetrics, isLoading: loadingRAR } = useQuery<RARMetrics>(
    'rarMetrics',
    () => axios.get('/api/analytics/rar-metrics').then(res => res.data),
    { refetchInterval: 30000 } // Refresh every 30 seconds
  );

  const { data: failureModes, isLoading: loadingFailure } = useQuery<FailureMode[]>(
    'failureModes',
    () => axios.get('/api/analytics/failure-modes').then(res => res.data)
  );

  const { data: trends, isLoading: loadingTrends } = useQuery<Trends>(
    'trends',
    () => axios.get('/api/analytics/trends').then(res => res.data)
  );

  if (loadingRAR || loadingFailure || loadingTrends) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const chartData = trends?.labels.map((label, index) => ({
    date: label,
    complaints: trends.data[index]
  })) || [];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Command Center Dashboard</h1>
        
        {/* RAR Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Return Rate</p>
                <p className="text-2xl font-bold text-gray-900">{rarMetrics?.returnRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Authorization Rate</p>
                <p className="text-2xl font-bold text-gray-900">{rarMetrics?.authorizationRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <XCircle className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejection Rate</p>
                <p className="text-2xl font-bold text-gray-900">{rarMetrics?.rejectionRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Complaints</p>
                <p className="text-2xl font-bold text-gray-900">{rarMetrics?.totalComplaints}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Complaint Trends */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Complaint Trends (30 Days)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="complaints" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top Failure Modes */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Top 3 Failure Modes</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={failureModes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="issueType" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;