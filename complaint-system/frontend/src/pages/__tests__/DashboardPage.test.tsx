import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../../test/test-utils';
import { QueryClient, QueryClientProvider } from 'react-query';
import DashboardPage from '../DashboardPage';
// Use global API mocks provided by test/setup.ts
const { getMock } = (global as any).__API_MOCKS__;

// Mock recharts components (including PieChart for failure modes)
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
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: any) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
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
    getMock.mockImplementation(() => new Promise(() => {}));
    
    renderWithQueryClient(<DashboardPage />);
    
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('renders RAR metrics correctly', async () => {
    getMock.mockImplementation((url: string) => {
      if (url === '/api/settings/app') {
        return Promise.resolve({
          data: {
            dashboard: {
              cards: {
                order: [
                  { id: '1', type: 'rar_metric', size: 'md' }
                ]
              },
              timeWindow: { value: 12 }
            }
          }
        });
      }
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
    getMock.mockImplementation((url: string) => {
      if (url === '/api/settings/app') {
        return Promise.resolve({
          data: {
            dashboard: {
              cards: {
                order: [
                  { id: '1', type: 'graph_failures', size: 'md' }
                ]
              },
              timeWindow: { value: 12 }
            }
          }
        });
      }
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
      expect(screen.getByText('Failure Modes')).toBeInTheDocument();
    });

    expect(screen.getByTestId('evil-pie-chart')).toBeInTheDocument();
  });

  it('renders trends chart correctly', async () => {
    getMock.mockImplementation((url: string) => {
      if (url === '/api/settings/app') {
        return Promise.resolve({
          data: {
            dashboard: {
              cards: {
                order: [
                  { id: '1', type: 'graph_trends', size: 'md' }
                ]
              },
              timeWindow: { value: 12 }
            }
          }
        });
      }
      if (url === '/api/analytics/rar-metrics') {
        return Promise.resolve({ data: { returnRate: 0, authorizationRate: 0, rejectionRate: 0, totalComplaints: 0, period: 'all_time' } });
      }
      if (url === '/api/analytics/failure-modes') {
        return Promise.resolve({ data: [] });
      }
      if (url === '/api/analytics/trends') {
        return Promise.resolve({ data: { labels: [], data: [] } });
      }
      if (url === '/api/analytics/weekly-type-trends') {
        return Promise.resolve({
          data: [
            { week: '2025-W01', wrong_quantity: 1, wrong_part: 2, damaged: 3, other: 4 },
            { week: '2025-W02', wrong_quantity: 0, wrong_part: 1, damaged: 1, other: 0 },
          ],
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    renderWithQueryClient(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByText('Weekly Trends')).toBeInTheDocument();
    });

    expect(screen.getByTestId('evil-stacked-bar')).toBeInTheDocument();
  });
});