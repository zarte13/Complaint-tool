import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, Calendar, Package, ChevronDown, ChevronUp, MoreVertical, FileDown } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Complaint, ActionMetrics } from '../../types';
import FileUpload from '../FileUpload/FileUpload';
import { get as apiGet } from '../../services/api';
import { PieChart, Pie, Cell, Tooltip as ReTooltip, ResponsiveContainer } from 'recharts';
import { exportComplaintToPDF } from '../../utils/pdfExport';

interface ComplaintTileProps {
  complaint: Complaint;
  onClick: (complaint: Complaint) => void;
  onFileUploadComplete: () => void;
  readOnly?: boolean;
}

export default function ComplaintTile({ complaint, onClick, onFileUploadComplete, readOnly = false }: ComplaintTileProps) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const fileUploadRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState<ActionMetrics | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  const handleAttachFiles = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(true);
    // Focus the file upload section after expansion
    setTimeout(() => {
      fileUploadRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
  };

  // Fetch actions metrics for pie chart
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoadingMetrics(true);
        const { data } = await apiGet<ActionMetrics>(`/api/complaints/${complaint.id}/actions/metrics` as any);
        if (!mounted) return;
        setMetrics(data);
        setMetricsError(null);
      } catch (e: any) {
        if (!mounted) return;
        setMetrics(null);
        setMetricsError(e?.message || '');
      } finally {
        if (mounted) setLoadingMetrics(false);
      }
    })();
    return () => { mounted = false; };
  }, [complaint.id]);

  // Build pie chart data
  const pieData = (() => {
    const byStatus = (metrics?.actions_by_status || {}) as Record<string, number>;
    const mapLabel = (key: string) => {
      switch (key) {
        case 'open': return t('statusUpcoming') || 'Upcoming';
        case 'in_progress': return t('statusInProgress') || 'In Progress';
        case 'closed': return t('statusClosed') || 'Closed';
        case 'pending': return t('statusUpcoming') || 'Upcoming';
        case 'blocked': return t('statusInProgress') || 'In Progress';
        case 'escalated': return t('statusInProgress') || 'In Progress';
        default: return key;
      }
    };
    const color = (key: string) => {
      switch (key) {
        case 'open': return '#6b7280'; // gray
        case 'pending': return '#9ca3af'; // light gray
        case 'in_progress': return '#3b82f6'; // blue
        case 'blocked': return '#ef4444'; // red
        case 'escalated': return '#e11d48'; // pink/red
        case 'closed': return '#10b981'; // green
        default: return '#a3a3a3';
      }
    };
    const entries = Object.entries(byStatus).filter(([, v]) => v > 0);
    return entries.map(([k, v]) => ({ key: k, name: mapLabel(k), value: v, fill: color(k) }));
  })();

  const getCategoryLabel = (category?: string, fallbackIssueType?: string) => {
    switch (category) {
      case 'dimensional':
        return t('categoryDimensional') || 'Dimensional';
      case 'visual':
        return t('categoryVisual') || 'Visual';
      case 'packaging':
        return t('categoryPackaging') || 'Packaging';
      case 'other':
        return t('other');
      default:
        // Fallback to legacy issue_type display
        switch (fallbackIssueType) {
          case 'wrong_quantity':
            return t('wrongQuantity');
          case 'wrong_part':
            return t('wrongPart');
          case 'damaged':
            return t('damaged');
          case 'other':
            return t('other');
          default:
            return fallbackIssueType || t('other');
        }
    }
  };

  const getCategoryColor = (category?: string, fallbackIssueType?: string) => {
    switch (category) {
      case 'dimensional':
        return 'bg-blue-100 text-blue-800';
      case 'visual':
        return 'bg-amber-100 text-amber-800';
      case 'packaging':
        return 'bg-purple-100 text-purple-800';
      case 'other':
        return 'bg-gray-100 text-gray-800';
      default:
        // Fallback mapping based on legacy issue types
        switch (fallbackIssueType) {
          case 'wrong_quantity':
            return 'bg-orange-100 text-orange-800';
          case 'wrong_part':
            return 'bg-red-100 text-red-800';
          case 'damaged':
            return 'bg-yellow-100 text-yellow-800';
          default:
            return 'bg-gray-100 text-gray-800';
        }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const hasExtraInfo = false; // Additional information section removed per requirements

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
          <span className="text-gray-600">{complaint.company.name}</span>
          {complaint.ncr_number && (
            <span className="text-gray-600">{t('ncrNumber') || 'NCR'}: {complaint.ncr_number}</span>
          )}
          {complaint.work_order_number && (
            <span className="text-gray-600">{t('workOrderAbbrev') || 'WO'}: {complaint.work_order_number}</span>
          )}
        </div>
        <div className="flex items-center space-x-2 flex-shrink-0">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(complaint.issue_category as any, complaint.issue_type)}`}>
            {getCategoryLabel(complaint.issue_category as any, complaint.issue_type)}
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
          {/* Hover menu trigger */}
          <div className="relative">
            <button
              className="p-1 text-gray-400 hover:text-gray-600"
              onClick={(e) => { e.stopPropagation(); setMenuOpen((v) => !v); }}
              aria-label="Open menu"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-20" onClick={(e) => e.stopPropagation()}>
                <button
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => { setMenuOpen(false); onClick(complaint); }}
                >
                  {t('viewDetails') || 'View details'}
                </button>
                <button
                  className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                  onClick={async () => {
                    setMenuOpen(false);
                    try { await exportComplaintToPDF({ complaint }); } catch {}
                  }}
                >
                  <span className="inline-flex items-center"><FileDown className="h-4 w-4 mr-2" />{t('exportPdf') || 'Export PDF'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Second Row: Follow-up comment instead of description */}
      {complaint.follow_up && (
        <div className="mb-3">
          <p className="text-sm text-gray-700 line-clamp-2">{complaint.follow_up}</p>
        </div>
      )}

      {/* Actions status pie chart */}
      <div className="mb-3">
        {loadingMetrics ? (
          <div className="h-20 flex items-center text-xs text-gray-500">{t('loading') || 'Loading...'}</div>
        ) : metrics && (metrics.total_actions ?? 0) > 0 ? (
          <div className="flex items-center gap-4">
            <div className="w-24 h-24">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={46} innerRadius={24} stroke="#ffffff" strokeWidth={1}>
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ReTooltip formatter={(value: any, name: any) => [value as string, name as string]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
              <div className="text-xs text-gray-600 space-y-1">
              <div><span className="inline-block w-2 h-2 rounded-sm mr-2" style={{ background: '#6b7280' }}></span>{t('statusUpcoming') || 'Upcoming'}: {metrics.actions_by_status.open || 0}</div>
              <div><span className="inline-block w-2 h-2 rounded-sm mr-2" style={{ background: '#3b82f6' }}></span>{t('statusInProgress') || 'In Progress'}: {metrics.actions_by_status.in_progress || 0}</div>
              <div><span className="inline-block w-2 h-2 rounded-sm mr-2" style={{ background: '#10b981' }}></span>{t('statusClosed') || 'Closed'}: {metrics.actions_by_status.closed || 0}</div>
            </div>
          </div>
        ) : metricsError ? (
          <div className="text-xs text-red-600">{metricsError}</div>
        ) : (
          <div className="text-xs text-gray-500">{t('noActionsFound') || 'No actions yet'}</div>
        )}
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
            {formatDate(complaint.date_received)}
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
        
        {!readOnly && (
          <button
            onClick={handleAttachFiles}
            className="flex items-center px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={t('attachFilesButton')}
          >
            <Paperclip className="h-3 w-3 mr-1" />
            {t('attachFilesButton')}
          </button>
        )}
      </div>

      {/* File Upload Section (conditionally rendered) */}
      <AnimatePresence>
        {isExpanded && !readOnly && (
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