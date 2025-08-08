import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import EnhancedComplaintDetailDrawer from './EnhancedComplaintDetailDrawer';
import { Complaint } from '../../types';

// Mock the useLanguage hook
vi.mock('../../contexts/LanguageContext', () => ({
  useLanguage: () => ({
    t: (key: string) => key,
    language: 'en',
  }),
}));

// Mock auth store to simulate authenticated user in tests
vi.mock('../../stores/authStore', () => ({
  useAuthStore: (selector: any) => selector({
    isAuthenticated: true,
    isAdmin: () => false,
  }),
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: (_date: Date, _format: string) => 'formatted-date',
  enUS: {},
  fr: {},
}));

const mockComplaint: Complaint = {
  id: 1,
  company: {
    id: 1,
    name: 'Test Company',
    created_at: '2024-01-01T00:00:00Z'
  },
  part: {
    id: 1,
    part_number: 'PART-001',
    created_at: '2024-01-01T00:00:00Z'
  },
  issue_type: 'wrong_quantity',
  details: 'Test details about the complaint',
  status: 'open',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  last_edit: '2024-01-01T00:00:00Z',
  work_order_number: 'WO-001',
  occurrence: 'First occurrence',
  quantity_ordered: 100,
  quantity_received: 50,
  part_received: 'PART-002',
  human_factor: false,
  has_attachments: false,
};

describe('EnhancedComplaintDetailDrawer', () => {
  const defaultProps = {
    complaint: mockComplaint,
    isOpen: true,
    onClose: vi.fn(),
    onUpdate: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders complaint details correctly', () => {
    render(<EnhancedComplaintDetailDrawer {...defaultProps} />);

    expect(screen.getByText('Complaint #1')).toBeInTheDocument();
    expect(screen.getByText('Test Company')).toBeInTheDocument();
    expect(screen.getByText('PART-001')).toBeInTheDocument();
    expect(screen.getByText('WO-001')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    const { container } = render(
      <EnhancedComplaintDetailDrawer {...defaultProps} isOpen={false} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('does not render when no complaint is provided', () => {
    const { container } = render(
      <EnhancedComplaintDetailDrawer {...defaultProps} complaint={null} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it('enters edit mode when edit button is clicked', () => {
    render(<EnhancedComplaintDetailDrawer {...defaultProps} />);

    const editButton = screen.getByText('Edit');
    fireEvent.click(editButton);

    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('cancels edit mode when cancel button is clicked', () => {
    render(<EnhancedComplaintDetailDrawer {...defaultProps} />);

    fireEvent.click(screen.getByText('Edit'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.queryByText('Save')).not.toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<EnhancedComplaintDetailDrawer {...defaultProps} />);

    fireEvent.click(screen.getByText('Edit'));

    // Clear required field
    const workOrderInput = screen.getByDisplayValue('WO-001');
    fireEvent.change(workOrderInput, { target: { value: '' } });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Work order number is required')).toBeInTheDocument();
    });
  });

  it('validates numeric fields', async () => {
    render(<EnhancedComplaintDetailDrawer {...defaultProps} />);

    fireEvent.click(screen.getByText('Edit'));

    // Enter invalid quantity
    const quantityInput = screen.getByDisplayValue('100');
    fireEvent.change(quantityInput, { target: { value: '0' } });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Must be at least 1')).toBeInTheDocument();
    });
  });

  it('validates text length', async () => {
    render(<EnhancedComplaintDetailDrawer {...defaultProps} />);

    fireEvent.click(screen.getByText('Edit'));

    // Enter short details
    const detailsTextarea = screen.getByDisplayValue('Test details about the complaint');
    fireEvent.change(detailsTextarea, { target: { value: 'short' } });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Minimum 10 characters')).toBeInTheDocument();
    });
  });

  it('calls onUpdate with valid data', async () => {
    const onUpdate = vi.fn();
    render(<EnhancedComplaintDetailDrawer {...defaultProps} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByText('Edit'));

    const workOrderInput = screen.getByDisplayValue('WO-001');
    fireEvent.change(workOrderInput, { target: { value: 'WO-002' } });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          work_order_number: 'WO-002',
          last_edit: expect.any(String),
        })
      );
    });
  });

  it('closes when overlay is clicked', () => {
    render(<EnhancedComplaintDetailDrawer {...defaultProps} />);

    const overlay = screen.getByTestId('drawer-overlay');
    fireEvent.click(overlay);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('closes when close button is clicked', () => {
    render(<EnhancedComplaintDetailDrawer {...defaultProps} />);

    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('displays error message when save fails', async () => {
    const onUpdate = vi.fn().mockRejectedValue(new Error('Save failed'));
    render(<EnhancedComplaintDetailDrawer {...defaultProps} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByText('Edit'));
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Save failed')).toBeInTheDocument();
    });
  });

  it('handles toggle field correctly', () => {
    render(<EnhancedComplaintDetailDrawer {...defaultProps} />);

    fireEvent.click(screen.getByText('Edit'));

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('has responsive layout', () => {
    render(<EnhancedComplaintDetailDrawer {...defaultProps} />);

    const grid = screen.getByTestId('responsive-grid');
    expect(grid).toHaveClass('lg:grid-cols-3');
  });
});