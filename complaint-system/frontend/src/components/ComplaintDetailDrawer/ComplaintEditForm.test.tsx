import { render, screen, fireEvent } from '../../test/test-utils';
import { describe, it, expect, vi } from 'vitest';
import ComplaintEditForm from './ComplaintEditForm';
import { Complaint } from '../../types';

describe('ComplaintEditForm', () => {
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

    it('should render the edit form with initial values', () => {
        render(
            <ComplaintEditForm
                complaint={mockComplaint}
                onFieldChange={vi.fn()}
                errors={{}}
                onSave={vi.fn()}
                onCancel={vi.fn()}
                isSaving={false}
            />
        );

        expect(screen.getByLabelText('Work Order Number *')).toHaveValue('WO-123');
        expect(screen.getByLabelText('Occurrence')).toHaveValue('2022-01-01');
    });

    it('should call onFieldChange when a field is updated', () => {
        const onFieldChange = vi.fn();
        render(
            <ComplaintEditForm
                complaint={mockComplaint}
                onFieldChange={onFieldChange}
                errors={{}}
                onSave={vi.fn()}
                onCancel={vi.fn()}
                isSaving={false}
            />
        );

        const workOrderInput = screen.getByLabelText('Work Order Number *');
        fireEvent.change(workOrderInput, { target: { value: 'WO-456' } });

        expect(onFieldChange).toHaveBeenCalledWith('work_order_number', 'WO-456');
    });

    it('should display an error message for an invalid field', () => {
        const errors = { work_order_number: 'Invalid work order number' };
        render(
            <ComplaintEditForm
                complaint={mockComplaint}
                onFieldChange={vi.fn()}
                errors={errors}
                onSave={vi.fn()}
                onCancel={vi.fn()}
                isSaving={false}
            />
        );

        expect(screen.getByText('Invalid work order number')).toBeInTheDocument();
    });
});