import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, Calendar, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Complaint } from '../../types';
import FileUpload from '../FileUpload/FileUpload';

interface ComplaintTileProps {
  complaint: Complaint;
  onClick: (complaint: Complaint) => void;
  onFileUploadComplete: () => void;
}

export default function ComplaintTile({ complaint, onClick, onFileUploadComplete }: ComplaintTileProps) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const fileUploadRef = useRef<HTMLDivElement>(null);

  const handleAttachFiles = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(true);
    // Focus the file upload section after expansion
    setTimeout(() => {
      fileUploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  const getIssueTypeLabel = (issueType: string) => {
    switch (issueType) {
      case 'wrong_quantity':
        return t('wrongQuantity');
      case 'wrong_part':
        return t('wrongPart');
      case 'damaged':
        return t('damaged');
      case 'other':
        return t('other');
      default:
        return issueType;
    }
  };

  const getIssueTypeColor = (issueType: string) => {
    switch (issueType) {
      case 'wrong_quantity':
        return 'bg-orange-100 text-orange-800';
      case 'wrong_part':
        return 'bg-red-100 text-red-800';
      case 'damaged':
        return 'bg-yellow-100 text-yellow-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const hasExtraInfo = complaint.issue_type === 'wrong_quantity' || complaint.issue_type === 'wrong_part';

  return (
    <motion.div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(complaint)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick(complaint);
        }
      }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {/* First Row: ID, Work Order, Client (left) | Problem-type tag & Human-factor (right) */}
      <div className="flex flex-col sm:flex-row justify-between items-start mb-3 gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="font-semibold text-gray-900">#{complaint.id}</span>
          {complaint.work_order_number && (
            <span className="text-gray-600">{t('workOrderAbbrev') || 'WO'}: {complaint.work_order_number}</span>
          )}
          <span className="text-gray-600">{complaint.company.name}</span>
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getIssueTypeColor(complaint.issue_type)}`}>
            {getIssueTypeLabel(complaint.issue_type)}
          </span>
          {complaint.human_factor && (
            <div className="relative group">
              <span
                className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 cursor-pointer"
                aria-label={t('tooltipHumanFactor')}
              >
                {t('humanFactorIndicator')}
              </span>
              <div className="absolute z-10 w-max max-w-xs p-2 text-xs text-white bg-gray-800 rounded-md shadow-lg
                            opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none
                            -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                {t('tooltipHumanFactor')}
                <div className="absolute w-2 h-2 bg-gray-800 transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Second Row: Description */}
      <div className="mb-3">
        <p className="text-sm text-gray-700 line-clamp-2">{complaint.details}</p>
      </div>

      {/* Third Row: Optional Extra Info (conditionally rendered) */}
      {hasExtraInfo && (
        <div className="mb-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            aria-expanded={isExpanded}
            aria-controls={`extra-info-${complaint.id}`}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
            {t('extraInfo')}
          </button>
          
          <AnimatePresence>
            {isExpanded && (
              <motion.div 
                id={`extra-info-${complaint.id}`}
                className="mt-2 p-3 bg-gray-50 rounded-md"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {complaint.issue_type === 'wrong_quantity' && (
                  <div className="text-sm space-y-1">
                    <div><span className="font-medium">{t('ordered')}:</span> {complaint.quantity_ordered}</div>
                    <div><span className="font-medium">{t('received')}:</span> {complaint.quantity_received}</div>
                  </div>
                )}
                {complaint.issue_type === 'wrong_part' && complaint.part_received && (
                  <div className="text-sm">
                    <span className="font-medium">{t('partReceived')}:</span> {complaint.part_received}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Bottom Row: Creation Date, Item Number, File Attachment, Attach Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-gray-500 gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDate(complaint.created_at)}
          </div>
          <div className="flex items-center">
            <Package className="h-3 w-3 mr-1" />
            {t('itemNumber')}: {complaint.part.part_number}
          </div>
          {complaint.has_attachments && (
            <div className="flex items-center">
              <Paperclip className="h-3 w-3 mr-1" />
              {t('hasAttachments')}
            </div>
          )}
        </div>
        
        <button
          onClick={handleAttachFiles}
          className="flex items-center px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={t('attachFilesButton')}
        >
          <Paperclip className="h-3 w-3 mr-1" />
          {t('attachFilesButton')}
        </button>
      </div>

      {/* File Upload Section (conditionally rendered) */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            ref={fileUploadRef}
            className="mt-4 pt-4 border-t border-gray-200"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <FileUpload
              complaintId={complaint.id}
              onUploadComplete={() => {
                // Bubble completion to parent so ComplaintList does a one-shot refetch
                onFileUploadComplete();
                // Collapse the section after successful upload for clear UX
                setIsExpanded(false);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}