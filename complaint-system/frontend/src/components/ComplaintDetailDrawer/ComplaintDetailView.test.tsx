import { render, screen } from '../../test/test-utils';
import { describe, it, expect } from 'vitest';
import ComplaintDetailView from './ComplaintDetailView';
import { Complaint } from '../../types';

describe('ComplaintDetailView', () => {
    const mockComplaint: Complaint = {
        id: 1,
        issue_type: 'wrong_part',
        details: 'Received the wrong part.',
        date_received: '2022-01-01',
        complaint_kind: 'notification',
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
    };

    it('should render all complaint details', () => {
        render(<ComplaintDetailView complaint={mockComplaint} />);

        expect(screen.getByText('1')).toBeInTheDocument(); // ID
        expect(screen.getByText('Test Company')).toBeInTheDocument();
        expect(screen.getByText('TP-123')).toBeInTheDocument();
        expect(screen.getByText('Wrong Part')).toBeInTheDocument();
        expect(screen.getByText('Received the wrong part.')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('9')).toBeInTheDocument();
        expect(screen.getByText('open')).toBeInTheDocument(); // Status is lowercase
        expect(screen.getByText('WO-123')).toBeInTheDocument();
        expect(screen.getByText('2022-01-01')).toBeInTheDocument(); // Occurrence date format
    });

    it('should display status correctly', () => {
      render(<ComplaintDetailView complaint={mockComplaint} />);
      expect(screen.getByText('open')).toBeInTheDocument();
    });
  
    it('should display human factor as Yes/No', () => {
      render(<ComplaintDetailView complaint={mockComplaint} />);
      expect(screen.getByText('No')).toBeInTheDocument();
      
      const complaintWithHumanFactor = { ...mockComplaint, human_factor: true };
      render(<ComplaintDetailView complaint={complaintWithHumanFactor} />);
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });
});