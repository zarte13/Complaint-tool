import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import DashboardPage from '../DashboardPage';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('DashboardPage', () => {
  it('renders loading state initially', () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {}));
    
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <DashboardPage />
      </Wrapper>
    );
    
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
  });

  it('renders RAR metrics correctly', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        returnRate: 15.5,
        authorizationRate: 70.2,
        rejectionRate: 14.3,
        totalComplaints: 100,
        period: 'all_time'
      }
    });
    
    mockedAxios.get.mockResolvedValueOnce({
      data: [
        { issueType: 'Wrong Quantity', count: 45 },
        { issueType: 'Wrong Part', count: 30 },
        { issueType: 'Damaged', count: 25 }
      ]
    });
    
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        labels: ['2024-01-01', '2024-01-02'],
        data: [5, 8]
      }
    });

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <DashboardPage />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('15.5%')).toBeInTheDocument();
      expect(screen.getByText('70.2%')).toBeInTheDocument();
      expect(screen.getByText('14.3%')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
    });
  });

  it('renders failure modes correctly', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        returnRate: 15.5,
        authorizationRate: 70.2,
        rejectionRate: 14.3,
        totalComplaints: 100,
        period: 'all_time'
      }
    });
    
    mockedAxios.get.mockResolvedValueOnce({
      data: [
        { issueType: 'Wrong Quantity', count: 45 },
        { issueType: 'Wrong Part', count: 30 },
        { issueType: 'Damaged', count: 25 }
      ]
    });
    
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        labels: ['2024-01-01', '2024-01-02'],
        data: [5, 8]
      }
    });

    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <DashboardPage />
      </Wrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Wrong Quantity')).toBeInTheDocument();
      expect(screen.getByText('Wrong Part')).toBeInTheDocument();
      expect(screen.getByText('Damaged')).toBeInTheDocument();
    });
  });
});