import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ComplaintDetailDrawer from './ComplaintDetailDrawer';
import { Complaint } from '../../types';
import { render } from '../../test/test-utils';

vi.mock('../../hooks/useComplaints', () => ({
    __esModule: true,
    default: () => ({
        updateComplaint: {
            mutateAsync: vi.fn(),
        },
    }),
}));

describe('ComplaintDetailDrawer', () => {
    const mockComplaint: Complaint = {
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
    };

    it('should not render when isOpen is false', () => {
        render(
            <ComplaintDetailDrawer
                isOpen={false}
                onClose={vi.fn()}
                complaint={mockComplaint}
                onUpdate={vi.fn()}
            />
        );
        expect(screen.queryByText('Complaint #1')).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
        render(
            <ComplaintDetailDrawer
                isOpen={true}
                onClose={vi.fn()}
                complaint={mockComplaint}
                onUpdate={vi.fn()}
            />
        );
        expect(screen.getByText('Complaint Details')).toBeInTheDocument();
    });

    it('should switch to edit mode when the edit button is clicked', () => {
        render(
            <ComplaintDetailDrawer
                isOpen={true}
                onClose={vi.fn()}
                complaint={mockComplaint}
                onUpdate={vi.fn()}
            />
        );

        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[0]); // First button is the edit button
        expect(screen.getByLabelText('Work Order Number *')).toBeInTheDocument();
    });

    it('should call onClose when the close button is clicked', () => {
        const onClose = vi.fn();
        render(
            <ComplaintDetailDrawer
                isOpen={true}
                onClose={onClose}
                complaint={mockComplaint}
                onUpdate={vi.fn()}
            />
        );

        const buttons = screen.getAllByRole('button');
        fireEvent.click(buttons[1]); // Second button is the close button
        expect(onClose).toHaveBeenCalled();
    });
});