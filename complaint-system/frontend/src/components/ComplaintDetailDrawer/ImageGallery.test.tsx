import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import ImageGallery from './ImageGallery';
import { Attachment } from '../../types';
import { LanguageProvider } from '../../contexts/LanguageContext';

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn(() => 'mocked-date'),
  enUS: {},
  fr: {},
}));

// Mock fetch for downloads
(globalThis as any).fetch = vi.fn();

const mockAttachments: Attachment[] = [
  {
    id: 1,
    complaint_id: 1,
    filename: 'uuid-1.jpg',
    original_filename: 'test-image-1.jpg',
    file_size: 102400, // 100KB
    mime_type: 'image/jpeg',
    created_at: '2024-01-01T10:00:00Z',
  },
  {
    id: 2,
    complaint_id: 1,
    filename: 'uuid-2.png',
    original_filename: 'test-image-2.png',
    file_size: 204800, // 200KB
    mime_type: 'image/png',
    created_at: '2024-01-02T10:00:00Z',
  },
  {
    id: 3,
    complaint_id: 1,
    filename: 'uuid-3.pdf',
    original_filename: 'document.pdf',
    file_size: 512000, // 500KB
    mime_type: 'application/pdf',
    created_at: '2024-01-03T10:00:00Z',
  },
];

const defaultProps = {
  complaintId: 1,
  attachments: mockAttachments,
  isLoading: false,
};

const renderWithLanguageProvider = (component: React.ReactElement) => {
  return render(<LanguageProvider>{component}</LanguageProvider>);
};

describe('ImageGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).fetch = vi.fn();
  });

  it('renders image gallery with correct count', () => {
    renderWithLanguageProvider(<ImageGallery {...defaultProps} />);

    // Should show only image files (2 out of 3 attachments)
    expect(screen.getByText(/Image Gallery \(2\)/)).toBeInTheDocument();
  });

  it('filters out non-image attachments', () => {
    renderWithLanguageProvider(<ImageGallery {...defaultProps} />);

    // Should show image files
    expect(screen.getByText('test-image-1.jpg')).toBeInTheDocument();
    expect(screen.getByText('test-image-2.png')).toBeInTheDocument();

    // Should not show PDF file
    expect(screen.queryByText('document.pdf')).not.toBeInTheDocument();
  });

  it('displays loading state', () => {
    renderWithLanguageProvider(<ImageGallery {...defaultProps} isLoading={true} />);

    expect(screen.getByText('Loading images...')).toBeInTheDocument();
  });

  it('can be collapsed and expanded', () => {
    renderWithLanguageProvider(<ImageGallery {...defaultProps} />);

    const headerButton = screen.getByRole('button', { name: /Image Gallery/ });

    // Should be expanded by default
    expect(screen.getByText('test-image-1.jpg')).toBeInTheDocument();

    // Click to collapse
    fireEvent.click(headerButton);

    // Images should be hidden when collapsed
    expect(screen.queryByText('test-image-1.jpg')).not.toBeInTheDocument();

    // Click to expand again
    fireEvent.click(headerButton);

    // Images should be visible again
    expect(screen.getByText('test-image-1.jpg')).toBeInTheDocument();
  });

  it('opens modal when thumbnail is clicked', () => {
    renderWithLanguageProvider(<ImageGallery {...defaultProps} />);

    // Click row containing the specific file name (list item area)
    const row = screen.getByText('test-image-1.jpg').closest('.group');
    fireEvent.click(row!);

    // Modal should open - assert by role/name that uniquely identifies modal header
    const modalHeading = screen.getByRole('heading', { name: 'test-image-1.jpg', level: 3 });
    expect(modalHeading).toBeInTheDocument();
  });

  it('does not render when no image attachments exist', () => {
    const propsWithoutImages = {
      ...defaultProps,
      attachments: [mockAttachments[2]], // Only PDF
    };

    const { container } = renderWithLanguageProvider(<ImageGallery {...propsWithoutImages} />);

    // Should not render anything when no image attachments
    expect(container.firstChild).toBeNull();
  });

  it('sorts images by newest first', () => {
    renderWithLanguageProvider(<ImageGallery {...defaultProps} />);

    const imageNames = screen
      .getAllByText(/test-image-\d\./)
      .map((el) => el.textContent);

    // Should show test-image-2.png first (newer date)
    expect(imageNames[0]).toBe('test-image-2.png');
    expect(imageNames[1]).toBe('test-image-1.jpg');
  });

  it('handles download button click', () => {
    renderWithLanguageProvider(<ImageGallery {...defaultProps} />);

    const downloadButtons = screen.getAllByTitle('Download');
    fireEvent.click(downloadButtons[0]);

    // Should trigger download (would normally call fetch)
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('/api/complaints/attachments/'));
  });
});