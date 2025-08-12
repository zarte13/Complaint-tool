import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Image as ImageIcon, Download, ZoomIn, ZoomOut, X } from 'lucide-react';
import { Attachment } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { format } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { apiClient } from '../../services/api';

function getBackendBaseUrl(): string {
  try {
    const base = (apiClient as any)?.defaults?.baseURL;
    if (typeof base === 'string' && base.length > 0) return base.replace(/\/+$/, '');
  } catch {}
  try {
    const winBase = (typeof window !== 'undefined' && (window as any).__API_BASE_URL__) || '';
    if (typeof winBase === 'string' && winBase.length > 0) return winBase.replace(/\/+$/, '');
  } catch {}
  return '';
}

interface ImageGalleryProps {
  complaintId: number;
  attachments: Attachment[];
  isLoading: boolean;
}

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: Attachment;
  onDownload: (attachment: Attachment) => void;
}

// Modal component for full-size image viewing with zoom
const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose, attachment, onDownload }) => {
  const [zoom, setZoom] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { language, t } = useLanguage();

  const dateLocale = language === 'fr' ? fr : enUS;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const resetZoom = () => setZoom(1);

  useEffect(() => {
    if (isOpen) {
      setZoom(1);
      setImageLoaded(false);
      setImageError(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-[60] flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-75 p-4 z-10">
        <div className="flex items-center justify-between text-white">
          <div>
            <h3 className="text-lg font-medium">{attachment.original_filename}</h3>
            <p className="text-sm text-gray-300">
              {Math.round(attachment.file_size / 1024)} KB • {format(new Date(attachment.created_at), 'PPp', { locale: dateLocale })}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="p-2 bg-white bg-opacity-20 rounded-md hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('zoomOut')}
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <span className="text-sm px-2">{Math.round(zoom * 100)}%</span>
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="p-2 bg-white bg-opacity-20 rounded-md hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed"
              title={t('zoomIn')}
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            <button
              onClick={resetZoom}
              className="px-3 py-2 bg-white bg-opacity-20 rounded-md hover:bg-opacity-30 text-sm"
              title={t('resetZoom')}
            >
              {t('resetZoom')}
            </button>
            <button
              onClick={() => onDownload(attachment)}
              className="p-2 bg-white bg-opacity-20 rounded-md hover:bg-opacity-30"
              title={t('downloadImage')}
            >
              <Download className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 bg-white bg-opacity-20 rounded-md hover:bg-opacity-30"
              title="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Image Container */}
      <div className="flex-1 flex items-center justify-center p-20">
        {!imageLoaded && !imageError && (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            <span className="ml-3 text-white">{t('loadingImages')}</span>
          </div>
        )}
        
        {imageError && (
          <div className="text-center text-white">
            <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p>{t('failedToLoadImage')}</p>
            <p className="text-sm text-gray-300">{attachment.original_filename}</p>
          </div>
        )}

        <img
          src={`${getBackendBaseUrl()}/uploads/complaints/${attachment.complaint_id}/${attachment.filename}`}
          alt={attachment.original_filename}
          className={`max-w-full max-h-full object-contain transition-transform duration-200 ${
            imageLoaded ? '' : 'hidden'
          }`}
          style={{ transform: `scale(${zoom})` }}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      </div>
    </div>
  );
};

const ImageGallery: React.FC<ImageGalleryProps> = ({ complaintId, attachments, isLoading }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedImage, setSelectedImage] = useState<Attachment | null>(null);
  const [thumbnailErrors, setThumbnailErrors] = useState<Record<number, boolean>>({});
  const { language, t } = useLanguage();

  const dateLocale = language === 'fr' ? fr : enUS;

  // Filter for image attachments only (JPG, PNG, JPEG)
  const imageAttachments = attachments.filter(attachment => {
    const mimeType = attachment.mime_type?.toLowerCase() || '';
    const filename = attachment.original_filename.toLowerCase();
    return mimeType.includes('image') || 
           filename.endsWith('.jpg') || 
           filename.endsWith('.jpeg') || 
           filename.endsWith('.png');
  });

  // Sort by newest first (latest added)
  const sortedImages = [...imageAttachments].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const handleThumbnailClick = (attachment: Attachment) => {
    setSelectedImage(attachment);
  };

  const handleDownload = async (attachment: Attachment) => {
    try {
      const base = getBackendBaseUrl();
      const response = await fetch(`${base}/api/complaints/attachments/${attachment.id}/download`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.original_filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  const handleThumbnailError = (attachmentId: number) => {
    setThumbnailErrors(prev => ({ ...prev, [attachmentId]: true }));
  };

  if (sortedImages.length === 0) return null;

  return (
    <>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-200"
        >
          <div className="flex items-center space-x-2">
            <ImageIcon className="h-5 w-5 text-gray-600" />
            <h3 className="text-sm font-semibold text-gray-900">
              {t('imageGallery')} ({sortedImages.length})
            </h3>
          </div>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-gray-600" />
          ) : (
            <ChevronRight className="h-4 w-4 text-gray-600" />
          )}
        </button>

        {/* Content */}
        {isExpanded && (
          <div className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                <span className="ml-2 text-sm text-gray-600">{t('loadingImages')}</span>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {sortedImages.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => handleThumbnailClick(attachment)}
                  >
                    {/* Thumbnail */}
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                      {thumbnailErrors[attachment.id] ? (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      ) : (
                        <img
                          src={`${getBackendBaseUrl()}/uploads/complaints/${complaintId}/${attachment.filename}`}
                          alt={attachment.original_filename}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={() => handleThumbnailError(attachment.id)}
                        />
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {attachment.original_filename}
                      </p>
                      <p className="text-xs text-gray-500">
                        {Math.round(attachment.file_size / 1024)} KB
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(attachment.created_at), 'PPp', { locale: dateLocale })}
                      </p>
                    </div>

                    {/* Download button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(attachment);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-gray-600 transition-opacity"
                      title={t('downloadImage')}
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full-size image modal */}
      {selectedImage && (
        <ImageModal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          attachment={selectedImage}
          onDownload={handleDownload}
        />
      )}
    </>
  );
};

export default ImageGallery; 