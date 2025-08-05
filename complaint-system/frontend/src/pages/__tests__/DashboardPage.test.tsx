import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../../test/test-utils';
import { QueryClient, QueryClientProvider } from 'react-query';
import DashboardPage from '../DashboardPage';
import axios from 'axios';

// Mock axios completely
vi.mock('axios', () => ({
  default: {
    get: vi.fn()
  }
}));

const mockedAxios = axios as any;

// Mock recharts components
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const renderWithQueryClient = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  it('renders loading state initially', () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {}));
    
    renderWithQueryClient(<DashboardPage />);
    
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('renders RAR metrics correctly', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url === '/api/analytics/rar-metrics') {
        return Promise.resolve({
          data: {
            returnRate: 15.5,
            authorizationRate: 70.2,
            rejectionRate: 14.3,
            totalComplaints: 100,
            period: 'all_time'
          }
        });
      }
      if (url === '/api/analytics/failure-modes') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/api/analytics/trends') {
        return Promise.resolve({ data: { labels: [], data: [] } });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    renderWithQueryClient(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Command Center Dashboard')).toBeInTheDocument();
    });

  });

  it('renders failure modes correctly', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url === '/api/analytics/rar-metrics') {
        return Promise.resolve({ data: { returnRate: 0, authorizationRate: 0, rejectionRate: 0, totalComplaints: 0, period: 'all_time' } });
      }
      if (url === '/api/analytics/failure-modes') {
        return Promise.resolve({
          data: [
            { issueType: 'Wrong Quantity', count: 45 }
          ]
        });
      }
      if (url === '/api/analytics/trends') {
        return Promise.resolve({ data: { labels: [], data: [] } });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    renderWithQueryClient(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Top 3 Failure Modes')).toBeInTheDocument();
    });

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('renders trends chart correctly', async () => {
    mockedAxios.get.mockImplementation((url: string) => {
      if (url === '/api/analytics/rar-metrics') {
        return Promise.resolve({ data: { returnRate: 0, authorizationRate: 0, rejectionRate: 0, totalComplaints: 0, period: 'all_time' } });
      }
      if (url === '/api/analytics/failure-modes') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/api/analytics/trends') {
        return Promise.resolve({
          data: {
            labels: ['2024-01-01'],
            data: [5]
          }
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    renderWithQueryClient(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Complaint Trends (30 Days)')).toBeInTheDocument();
    });

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });
});