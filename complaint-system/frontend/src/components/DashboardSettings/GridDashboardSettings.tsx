import { useEffect, useMemo, useRef, useState } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { useLanguage } from '../../contexts/LanguageContext';
import { get } from '../../services/api';
import type { DashboardCard } from './SimpleDashboardSettings';
import { TrendingUp, AlertTriangle, Clock, BarChart3, Users, Package, Plus } from 'lucide-react';

const ResponsiveGridLayout = WidthProvider(Responsive);

type Size = 'sm' | 'md' | 'lg' | 'xl';

const widthBySize: Record<Size, number> = {
  sm: 1,
  md: 2,
  lg: 3,
  xl: 6,
};

const heightBySize: Record<Size, number> = {
  sm: 2,
  md: 2,
  lg: 4,
  xl: 4,
};

// Minimum sizes based on card type
const getMinimumSize = (cardType: string): { w: number; h: number } => {
  if (cardType.startsWith('kpi_')) {
    return { w: 1, h: 2 }; // KPIs: minimum 1 column, 2 rows
  }
  if (cardType === 'rar_metric') {
    return { w: 2, h: 2 }; // RAR metrics: minimum 2x2 (can resize larger)
  }
  if (cardType.startsWith('graph_')) {
    return { w: 2, h: 4 }; // Graphs: minimum 2 columns, 4 rows
  }
  return { w: 1, h: 2 }; // Default
};

const cardTemplates = [
  { type: 'kpi_status', title: 'Status Overview', icon: TrendingUp, category: 'KPI', defaultSize: 'md' as const },
  { type: 'kpi_mttr', title: 'Mean Time To Resolution', icon: Clock, category: 'KPI', defaultSize: 'sm' as const },
  { type: 'kpi_overdue_actions', title: 'Overdue Actions', icon: AlertTriangle, category: 'KPI', defaultSize: 'sm' as const },
  { type: 'kpi_actions_per_complaint', title: 'Actions per Complaint', icon: BarChart3, category: 'KPI', defaultSize: 'sm' as const },
  { type: 'graph_trends', title: 'Weekly Trends', icon: TrendingUp, category: 'Chart', defaultSize: 'xl' as const },
  { type: 'graph_failures', title: 'Failure Modes', icon: AlertTriangle, category: 'Chart', defaultSize: 'lg' as const },
  { type: 'graph_stacked', title: 'Stacked Analysis', icon: BarChart3, category: 'Chart', defaultSize: 'xl' as const },
  { type: 'graph_top_companies', title: 'Top Companies', icon: Users, category: 'Chart', defaultSize: 'lg' as const },
  { type: 'graph_top_parts', title: 'Top Parts', icon: Package, category: 'Chart', defaultSize: 'lg' as const },
  { type: 'rar_metric', title: 'RAR Metrics', icon: TrendingUp, category: 'Metric', defaultSize: 'lg' as const },
];

interface Props {
  onSave?: (cards: DashboardCard[], globalConfig: any) => Promise<void>;
}

export default function GridDashboardSettings({ onSave }: Props) {
  // Add error boundary for useLanguage
  let t: (key: string) => string;
  try {
    const { t: translateFn } = useLanguage();
    t = (key: string) => translateFn(key as any) || key;
  } catch (error) {
    console.error('useLanguage error:', error);
    t = (key: string) => key; // Fallback to returning the key
  }

  const [cards, setCards] = useState<DashboardCard[]>([]);
  const [usedTypes, setUsedTypes] = useState<Set<string>>(new Set());
  const [globalWeeks, setGlobalWeeks] = useState<number>(12);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [layoutLg, setLayoutLg] = useState<Layout[]>([]);

  const getLocalizedTitle = (type: string) => {
    switch (type) {
      case 'kpi_status': return t('statusOverview') || 'Status Overview';
      case 'kpi_mttr': return t('mttrTitle') || 'Mean Time To Resolution';
      case 'kpi_overdue_actions': return t('overdueActionsTitle') || 'Overdue Actions';
      case 'kpi_actions_per_complaint': return t('actionsPerComplaintTitle') || 'Actions per Complaint';
      case 'graph_trends': return t('trendsTitle') || 'Weekly Trends';
      case 'graph_failures': return t('failureModesTitle') || 'Failure Modes';
      case 'graph_stacked': return t('stackedAnalysisTitle') || 'Stacked Analysis';
      case 'graph_top_companies': return t('topCompaniesTitle') || 'Top Companies';
      case 'graph_top_parts': return t('topPartsTitle') || 'Top Parts';
      case 'rar_metric': return t('rarMetricsTitle') || 'RAR Metrics';
      default: return type;
    }
  };

  const iconByType: Record<string, any> = {
    kpi_status: TrendingUp,
    kpi_mttr: Clock,
    kpi_overdue_actions: AlertTriangle,
    kpi_actions_per_complaint: BarChart3,
    graph_trends: TrendingUp,
    graph_failures: AlertTriangle,
    graph_stacked: BarChart3,
    graph_top_companies: Users,
    graph_top_parts: Package,
    rar_metric: TrendingUp,
  };

  // Lightweight dynamic text fit component (no external deps)
  function FitText({ text, max = 16, min = 10, className = '' }: { text: string; max?: number; min?: number; className?: string }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [size, setSize] = useState<number>(max);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const ResizeObs = (window as any).ResizeObserver;
      const ro = ResizeObs ? new ResizeObs((entries: any[]) => {
        for (const entry of entries) {
          const width: number = (entry.contentRect && entry.contentRect.width) ? entry.contentRect.width : (el.clientWidth || 0);
          const len = Math.max(1, text.length);
          const computed = Math.max(min, Math.min(max, (width / len) * 1.8));
          setSize(computed);
        }
      }) : null;
      if (ro) ro.observe(el);
      const width = el.clientWidth || 0;
      const len = Math.max(1, text.length);
      setSize(Math.max(min, Math.min(max, (width / len) * 1.8)));
      return () => { if (ro) ro.disconnect(); };
    }, [text, max, min]);

    return (
      <div ref={containerRef} className={className} style={{ fontSize: `${size}px`, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {text}
      </div>
    );
  }

  useEffect(() => {
    (async () => {
      try {
        const { data } = await get('/api/settings/app');
        const dashboard = (data as any)?.dashboard;
        if (dashboard?.timeWindow?.value) setGlobalWeeks(Number(dashboard.timeWindow.value) || 12);
        const order = dashboard?.cards?.order;
        if (Array.isArray(order) && order.length) {
          setCards(order);
          setUsedTypes(new Set(order.map((c: any) => c.type)));
          // Initialize layout from persisted grid positions if available
          const lg: Layout[] = order.map((c: any, idx: number) => {
            const minSize = getMinimumSize(c.type);
            const grid = c.grid || {};
            const cardSize = (c.size as Size) || 'sm';
            const w = Math.max(grid.w ?? widthBySize[cardSize], minSize.w);
            const h = Math.max(grid.h ?? heightBySize[cardSize], minSize.h);
            const x = grid.x ?? (idx % 6);
            const y = grid.y ?? Math.floor(idx / 6);
            return { i: c.id, x, y, w, h, minW: minSize.w, minH: minSize.h, static: false };
          });
          setLayoutLg(lg);
        }
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  // Initialize or sync layout when card IDs change (preserve existing positions)
  useEffect(() => {
    const existingById: Record<string, Layout> = {};
    layoutLg.forEach(l => { existingById[l.i] = l; });
    const ids = new Set(cards.map(c => c.id));
    const knownIds = new Set(layoutLg.map(l => l.i));
    if (ids.size !== knownIds.size || [...ids].some(id => !knownIds.has(id))) {
      const lg: Layout[] = (cards || []).map((c) => {
        const minSize = getMinimumSize(c.type);
        const prev = existingById[c.id];
        if (prev) {
          return { ...prev, minW: minSize.w, minH: minSize.h, w: Math.max(prev.w, minSize.w), h: Math.max(prev.h, minSize.h), static: false };
        }
        // New card: append to bottom to avoid shifting others
        const defaultW = Math.max(widthBySize[c.size], minSize.w);
        const defaultH = Math.max(heightBySize[c.size], minSize.h);
        return {
          i: c.id,
          x: 0,
          y: Number.POSITIVE_INFINITY, // let RGL place it at the bottom
          w: defaultW,
          h: defaultH,
          minW: minSize.w,
          minH: minSize.h,
          static: false,
        };
      });
      setLayoutLg(lg);
    }
  }, [cards, layoutLg]);

  const layouts = useMemo(() => ({ lg: layoutLg } as any), [layoutLg]);

  const updateOrderFromLayout = (layout: Layout[]) => {
    try {
      const orderMap: Record<string, number> = {};
      layout.forEach((p) => { orderMap[p.i] = p.y * 1000 + p.x; });
      const sorted = [...cards].sort((a, b) => (orderMap[a.id] ?? 0) - (orderMap[b.id] ?? 0));
      setCards(sorted);
    } catch (error) {
      console.error('Error updating order from layout:', error);
    }
  };

  const onDragStop = (layout: Layout[]) => {
    try {
      setLayoutLg(layout);
      updateOrderFromLayout(layout);
      // Persist current grid positions onto cards so they can be saved
      setCards(prev => prev.map(card => {
        const li = layout.find(l => l.i === card.id);
        if (!li) return card;
        return { ...card, grid: { x: li.x, y: li.y, w: li.w, h: li.h } } as any;
      }));
    } catch (error) {
      console.error('Error in onDragStop:', error);
    }
  };

  const onResizeStop = (layout: Layout[], _oldItem: Layout, newItem: Layout) => {
    try {
      setLayoutLg(layout);
      const newSize: Size = newItem.w >= 6 ? 'xl' : newItem.w >= 3 ? 'lg' : newItem.w >= 2 ? 'md' : 'sm';
      setCards(prev => prev.map(c => (
        c.id === newItem.i 
          ? ({ ...c, size: newSize, grid: { x: newItem.x, y: newItem.y, w: newItem.w, h: newItem.h } } as any)
          : c
      )));
    } catch (error) {
      console.error('Error in onResizeStop:', error);
    }
  };

  const selectedCard = cards.find(c => c.id === selectedId) || null;

  const addCard = (templateType: string, atPosition?: { x: number; y: number }) => {
    const template = cardTemplates.find(t => t.type === templateType);
    if (!template) return;

    const newCard: DashboardCard = {
      id: `${template.type}-${Date.now()}`,
      type: template.type as DashboardCard['type'],
      // Start with the smallest size; min constraints will bump width/height as needed
      size: 'sm',
      config: { 
        timeWindow: globalWeeks,
        ...(template.type === 'graph_top_companies' && { limit: 6 }),
        ...(template.type === 'graph_top_parts' && { limit: 20 }),
      },
    };
    
    // Initialize grid for the new card
    const minSize = getMinimumSize(newCard.type);
    const initialGrid = {
      x: atPosition?.x ?? 0,
      y: atPosition?.y ?? Number.POSITIVE_INFINITY,
      w: minSize.w,
      h: minSize.h,
    };
    (newCard as any).grid = initialGrid;

    setCards(prev => [...prev, newCard]);
    setUsedTypes(prev => {
      const next = new Set(prev);
      next.add(newCard.type);
      return next;
    });
    
    // If position provided, update layout immediately
    if (atPosition) {
      setTimeout(() => {
        setLayoutLg(prev => {
          const existing = prev.filter(l => l.i !== newCard.id);
          const minSize = getMinimumSize(newCard.type);
          return [...existing, {
            i: newCard.id,
            x: atPosition.x,
            y: atPosition.y,
            w: minSize.w,
            h: minSize.h,
            minW: minSize.w,
            minH: minSize.h,
            static: false,
          }];
        });
      }, 10);
    } else {
      // No explicit position: append at bottom
      setTimeout(() => {
        setLayoutLg(prev => {
          const existing = prev.filter(l => l.i !== newCard.id);
          const minSize = getMinimumSize(newCard.type);
          return [...existing, {
            i: newCard.id,
            x: 0,
            y: Number.POSITIVE_INFINITY,
            w: minSize.w,
            h: minSize.h,
            minW: minSize.w,
            minH: minSize.h,
            static: false,
          }];
        });
      }, 10);
    }
    
    setSelectedId(newCard.id);
  };

  const deleteCard = (cardId: string) => {
    setCards(prev => prev.filter(c => c.id !== cardId));
    setUsedTypes(prev => {
      const found = cards.find(c => c.id === cardId);
      if (!found) return prev;
      const next = new Set(prev);
      next.delete(found.type);
      return next;
    });
    setLayoutLg(prev => prev.filter(l => l.i !== cardId));
    if (selectedId === cardId) {
      setSelectedId(null);
    }
  };

  const handleCardClick = (e: React.MouseEvent, cardId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(prev => prev === cardId ? null : cardId);
  };

  const handleSave = async () => {
    if (!onSave) return;
    try {
      setSaving(true);
      setError(null);
      await onSave(cards, { timeWindow: { kind: 'weeks', value: globalWeeks } });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e: any) {
      setError(e?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const cols = { lg: 6, md: 6, sm: 6, xs: 6, xxs: 6 };

  // Handle drag from library to grid
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const templateType = e.dataTransfer.getData('text/plain');
    if (!templateType) return;
    
    // Calculate approximate grid position from drop coordinates
    const rect = e.currentTarget.getBoundingClientRect();
    const relativeX = e.clientX - rect.left;
    const relativeY = e.clientY - rect.top;
    
    // Rough conversion to grid coordinates (adjust based on your rowHeight and margins)
    const gridX = Math.floor(relativeX / (rect.width / 6));
    const gridY = Math.floor(relativeY / 50); // approximating rowHeight + margin
    
    addCard(templateType, { x: gridX, y: gridY });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('dashboardCustomization') || 'Dashboard Customization'}
          </h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-700">{t('globalTimeWindow') || 'Global Time Window'}:</label>
            <select
              value={globalWeeks}
              onChange={(e) => setGlobalWeeks(Number(e.target.value))}
              className="px-3 py-1 border rounded text-sm"
            >
              {[4,8,12,16,24,52].map(w => (
                <option key={w} value={w}>{w} {t('weeks') || 'weeks'}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={handleSave} disabled={saving} className={`px-4 py-2 rounded text-white text-sm ${saving? 'bg-blue-400':'bg-blue-600 hover:bg-blue-700'}`}>
            {saving ? (t('savingProgress') || 'Saving...') : (t('save') || 'Save')}
          </button>
          {saved && <span className="text-green-600 text-sm">{t('saved') || 'Saved'}</span>}
          {error && <span className="text-red-600 text-sm">{error}</span>}
        </div>
      </div>

      {/* Grid and Library Layout */}
      <div className="grid grid-cols-4 gap-6">
        {/* Dashboard Grid */}
        <div className="col-span-3">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {t('dashboardPreview') || 'Dashboard Preview'}
            </h3>
            <span className="text-sm text-gray-500">
              ({t('clickToSelect') || 'Click to select, drag to reorder'})
            </span>
          </div>
          
          <div 
            className="bg-white rounded border p-4 min-h-[400px]"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {cards.length === 0 ? (
              <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-300 rounded">
                <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>{t('noDashboardCards') || 'No dashboard cards configured'}</p>
                <p className="text-sm">{t('dragFromLibrary') || 'Drag cards from the library to build your dashboard'}</p>
              </div>
            ) : (
              <ResponsiveGridLayout
                className="layout"
                layouts={layouts}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={cols}
                rowHeight={38}
                margin={[8, 8]}
                containerPadding={[0, 0]}
                isResizable
                isDraggable
                preventCollision={true}
                compactType="vertical"
                allowOverlap={false}
                draggableHandle=".gd-tile-handle"
                draggableCancel=".gd-no-drag"
                onDragStop={onDragStop}
                onResizeStop={onResizeStop}
                onLayoutChange={(newLayout) => {
                  // Only update layout state, don't trigger card reordering during drag
                  setLayoutLg(newLayout);
                }}
              >
                {(cards || []).map(card => {
                  const Icon = iconByType[card.type] || TrendingUp;
                  const title = getLocalizedTitle(card.type);
                  const chipTime = card.config?.timeWindow;
                  const chipLimit = card.config?.limit;
                  const isSelected = selectedId === card.id;
                  const isKpi = card.type.startsWith('kpi_');
                  const isGraph = card.type.startsWith('graph_');
                  
                  // Color scheme based on card type
                  let colorClasses = '';
                  if (isSelected) {
                    colorClasses = 'ring-2 ring-blue-400 bg-blue-50 border-blue-300';
                  } else if (isKpi) {
                    colorClasses = 'border-emerald-200 bg-emerald-50 hover:border-emerald-300 hover:bg-emerald-100';
                  } else if (isGraph) {
                    colorClasses = 'border-purple-200 bg-purple-50 hover:border-purple-300 hover:bg-purple-100';
                  } else {
                    colorClasses = 'border-gray-200 bg-white hover:border-gray-300';
                  }
                  
                  return (
                    <div
                      key={card.id}
                      className={`border rounded p-2 cursor-pointer flex flex-col gap-2 relative group ${colorClasses}`}
                      onClick={(e) => handleCardClick(e, card.id)}
                    >
                      {/* Delete button (large hitbox) */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCard(card.id);
                        }}
                        className="gd-no-drag absolute top-1.5 right-1.5 w-9 h-9 rounded-full bg-red-500/90 text-white opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 shadow"
                        aria-label={t('delete') || 'Delete'}
                        title={t('delete') || 'Delete'}
                      >
                        <span className="text-base leading-none">×</span>
                      </button>
                      
                      {/* Drag handle + title row */}
                      <div className="gd-tile-handle flex items-center gap-2 cursor-move select-none">
                        <Icon className={`w-4 h-4 ${
                          isSelected ? 'text-blue-600' : 
                          isKpi ? 'text-emerald-600' :
                          isGraph ? 'text-purple-600' : 'text-gray-600'
                        }`} />
                        <FitText 
                          text={title} 
                          max={16} 
                          min={10} 
                          className={`font-medium flex-1 ${
                            isSelected ? 'text-blue-900' : 
                            isKpi ? 'text-emerald-900' :
                            isGraph ? 'text-purple-900' : 'text-gray-900'
                          }`} 
                        />
                      </div>
                      
                      {(chipTime || chipLimit) && (
                        <div className="gd-no-drag flex items-center gap-2 text-[10px] text-gray-600">
                          {chipTime ? <span className="px-1.5 py-0.5 bg-gray-100 rounded">{chipTime}w</span> : null}
                          {chipLimit ? <span className="px-1.5 py-0.5 bg-gray-100 rounded">Top {chipLimit}</span> : null}
                        </div>
                      )}
                      
                      <div className={`flex-1 rounded border border-dashed ${
                        isSelected ? 'bg-blue-100 border-blue-300' : 
                        isKpi ? 'bg-emerald-100 border-emerald-300' :
                        isGraph ? 'bg-purple-100 border-purple-300' : 'bg-gray-50 border-gray-200'
                      }`} />
                    </div>
                  );
                })}
              </ResponsiveGridLayout>
            )}
          </div>
        </div>

        {/* Card Library */}
        <div className="col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {t('cardLibrary') || 'Card Library'}
            </h3>
          </div>
          
          <div className="space-y-2">
            {cardTemplates.filter(t => !usedTypes.has(t.type)).map((template) => {
              const Icon = template.icon;
              return (
                <div
                  key={template.type}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('text/plain', template.type);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  className="p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all duration-200 cursor-grab active:cursor-grabbing group"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <Icon className="w-4 h-4 text-gray-600 group-hover:text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm font-medium text-gray-900 group-hover:text-blue-900">
                        {getLocalizedTitle(template.type)}
                      </h5>
                      <p className="text-xs text-gray-500 mt-1">
                        {template.category} • {template.defaultSize.toUpperCase()}
                      </p>
                    </div>
                    
                    <Plus className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Inline card configurator */}
      {selectedCard && (
        <div className="bg-white border rounded p-3 space-y-3">
          <div className="text-sm font-medium text-gray-800">{t('configuringCard') || 'Configuring'}: {selectedCard.type}</div>
          {(['kpi_mttr','kpi_actions_per_complaint','graph_trends','graph_failures','graph_stacked','graph_top_companies','graph_top_parts','rar_metric'].includes(selectedCard.type)) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-600">{t('timeWindow') || 'Time Window'}:</span>
              {[4,8,12,16,24,52].map(w => (
                <button key={w} onClick={() => setCards(prev => prev.map(c => c.id===selectedCard.id ? { ...c, config: { ...c.config, timeWindow: w } } : c))} className={`px-2 py-1 text-xs rounded border ${((selectedCard.config?.timeWindow)||12)===w?'border-blue-500 bg-blue-50':'border-gray-200'}`}>{w}w</button>
              ))}
            </div>
          )}
          {(['graph_top_companies','graph_top_parts'].includes(selectedCard.type)) && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-gray-600">{t('topN') || 'Top N'}:</span>
              {(selectedCard.type==='graph_top_companies' ? [3,6,10,15] : [10,20,30,50]).map(n => (
                <button key={n} onClick={() => setCards(prev => prev.map(c => c.id===selectedCard.id ? { ...c, config: { ...c.config, limit: n } } : c))} className={`px-2 py-1 text-xs rounded border ${((selectedCard.config?.limit) || (selectedCard.type==='graph_top_companies'?6:20))===n?'border-blue-500 bg-blue-50':'border-gray-200'}`}>{n}</button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


