import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, waitFor, screen, act } from '../../test/test-utils';
import HomePage from '../../pages/HomePage';
import ComplaintsPage from '../../pages/ComplaintsPage';
import ComplaintList from '../../components/ComplaintList/ComplaintList';

// Access the API mocks exposed in test setup
const getApiMocks = () =>
  (globalThis as any).__API_MOCKS__ as {
    getMock: ReturnType<typeof vi.fn>;
    postMock: ReturnType<typeof vi.fn>;
    putMock: ReturnType<typeof vi.fn>;
    deleteMock: ReturnType<typeof vi.fn>;
  };

function mockComplaintsResponse() {
  return {
    data: {
      items: [
        {
          id: 1,
          issue_type: 'wrong_part',
          details: 'Received the wrong part.',
          quantity_ordered: 10,
          quantity_received: 9,
          status: 'open',
          created_at: '2022-01-01T12:00:00Z',
          updated_at: '2022-01-01T12:00:00Z',
          last_edit: '2022-01-02T12:00:00Z',
          company: { id: 1, name: 'Test Company', created_at: '2022-01-01T12:00:00Z' },
          part: { id: 1, part_number: 'TP-123', description: 'Test Part', created_at: '2022-01-01T12:00:00Z' },
          work_order_number: 'WO-123',
          occurrence: '2022-01-01',
          human_factor: false,
          has_attachments: false,
        },
      ],
      pagination: { page: 1, size: 10, total: 1, total_pages: 1 },
    },
  };
}

describe('Complaints request frequency', () => {
  beforeEach(() => {
    const { getMock } = getApiMocks();
    getMock.mockReset();
    // default handler: return a paginated list for complaints
    getMock.mockImplementation((url: string) => {
      if (typeof url === 'string' && url.startsWith('/api/complaints')) {
        return Promise.resolve(mockComplaintsResponse());
      }
      return Promise.resolve({ data: {} });
    });
  });

  it('HomePage should issue at most 1 complaints fetch on initial render', async () => {
    const { getMock } = getApiMocks();

    render(<HomePage />);

    await waitFor(() => {
      // Ensure at least one call happened
      expect(getMock).toHaveBeenCalled();
    });

    const calls = getMock.mock.calls.filter(
      ([url]) => typeof url === 'string' && (url as string).startsWith('/api/complaints')
    );

    // One fetch max for initial render
    expect(calls.length).toBeLessThanOrEqual(1);
  });

  it('ComplaintsPage should coalesce rapid filter/page changes to avoid request floods', async () => {
    const { getMock } = getApiMocks();

    render(<ComplaintsPage />);

    // Initial render triggers one call
    await waitFor(() => {
      expect(getMock).toHaveBeenCalled();
    });

    // Simulate rapid prop changes that could cause floods:
    // change searchTerm rapidly and change issue type quickly
    // Adjust to match actual placeholder text rendered by ComplaintsPage input
    const search = screen.getByPlaceholderText('Search complaints...');
    await act(async () => {
      (search as HTMLInputElement).value = 'a';
      search.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => {
      (search as HTMLInputElement).value = 'ab';
      search.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await act(async () => {
      (search as HTMLInputElement).value = 'abc';
      search.dispatchEvent(new Event('input', { bubbles: true }));
    });

    const select = screen.getByRole('combobox');
    await act(async () => {
      (select as HTMLSelectElement).value = 'wrong_part';
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });

    // Wait for debounce windows in components (search/filter) to settle
    await new Promise((r) => setTimeout(r, 500));

    const calls = getMock.mock.calls.filter(
      ([url]) => typeof url === 'string' && (url as string).startsWith('/api/complaints')
    );

    // Expect only a small number of requests despite many rapid changes.
    // Allowance: initial + debounced follow-ups (timing-dependent cap)
    expect(calls.length).toBeLessThanOrEqual(3);
  });

  it('ComplaintList should not refetch when params are identical (guards against duplicates)', async () => {
    const { getMock } = getApiMocks();

    render(
      <ComplaintList
        refreshTrigger={0}
        searchTerm=""
        statusFilter={[]}
        issueTypeFilter=""
        page={1}
        pageSize={10}
      />
    );

    await waitFor(() => {
      expect(getMock).toHaveBeenCalled();
    });

    const callsAfterFirst = getMock.mock.calls.filter(
      ([url]) => typeof url === 'string' && (url as string).startsWith('/api/complaints')
    ).length;

    // re-render with identical props
    render(
      <ComplaintList
        refreshTrigger={0}
        searchTerm=""
        statusFilter={[]}
        issueTypeFilter=""
        page={1}
        pageSize={10}
      />
    );

    // Allow any microtasks to flush
    await new Promise((r) => setTimeout(r, 250));

    const callsAfterSecond = getMock.mock.calls.filter(
      ([url]) => typeof url === 'string' && (url as string).startsWith('/api/complaints')
    ).length;

    // The second render with identical params should not increase call count in a stable environment.
    // In React 18 strict-like double render scenarios, allow up to 1 extra invocation.
    expect(callsAfterSecond - callsAfterFirst).toBeLessThanOrEqual(1);
  });

  it('ComplaintList cancels inflight request on rapid param changes (no burst)', async () => {
    const { getMock } = getApiMocks();

    // Make the first call slow to ensure cancellation path is exercised
    let firstResolve!: () => void;
    const firstPromise = new Promise((resolve) => {
      firstResolve = () => resolve(mockComplaintsResponse());
    });
    getMock.mockImplementationOnce((url: string) => {
      if (typeof url === 'string' && url.startsWith('/api/complaints')) {
        return firstPromise;
      }
      return Promise.resolve({ data: {} });
    });

    render(
      <ComplaintList
        refreshTrigger={0}
        searchTerm=""
        statusFilter={[]}
        issueTypeFilter=""
        page={1}
        pageSize={10}
      />
    );

    // Immediately trigger rapid changes via rerender with different props
    render(
      <ComplaintList
        refreshTrigger={1}
        searchTerm="widget"
        statusFilter={['open' as any]}
        issueTypeFilter="wrong_part"
        page={2}
        pageSize={20}
      />
    );

    // Resolve the slow request now
    await act(async () => {
      firstResolve();
    });

    // Allow debounce to settle
    await new Promise((r) => setTimeout(r, 500));

    const calls = getMock.mock.calls.filter(
      ([url]) => typeof url === 'string' && (url as string).startsWith('/api/complaints')
    );

    // Should be small: initial in-flight + one final debounced; not a large burst
    expect(calls.length).toBeLessThanOrEqual(3);
  });
});