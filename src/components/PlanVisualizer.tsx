import React, { useState, useMemo } from 'react';
import { SegmentBrowser } from './SegmentBrowser';
import { SegmentPill } from './SegmentPill';
import { AudienceInsightsPanel } from './AudienceInsightsPanel';
import { MediaPlan, Placement, Segment } from '../types';
import { BarChart3, LayoutList, Rows, ArrowUp, ArrowDown, ArrowUpDown, ChevronDown, ChevronRight, Trash2, Download, Presentation, Layers, Filter, Plus, Users, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { PlacementDetailPanel } from './PlacementDetailPanel';
import { PlanMetricsSummary } from './PlanMetricsSummary';
import { generateMediaPlanPDF } from '../utils/pdfGenerator';
import { generateMediaPlanPPT } from '../utils/pptGenerator';
import { ExportSelector } from './ExportSelector';
import { ExportType, ExportFormat, SectionConfig, ExportContext } from '../config/exportConfig';

type GroupingMode = 'DETAILED' | 'CHANNEL_SUMMARY' | 'VENDOR' | 'SEGMENT' | 'STATUS' | 'FLIGHT' | 'OBJECTIVE' | 'DEVICE' | 'GEO';

interface PlanVisualizerProps {
    mediaPlan: MediaPlan | null;
    onGroupingChange?: (mode: GroupingMode) => void;
    onUpdatePlacement?: (placement: Placement) => void;
    onDeletePlacement?: (placementId: string) => void;
    onAddPlacement?: () => void;
    onOpenAudienceInsights?: () => void; // Opens audience insights in separate window
}

interface EditableCellProps {
    value: string | number;
    onSave: (value: string) => void;
    type?: 'text' | 'number' | 'currency';
    align?: 'left' | 'right' | 'center';
}

const EditableCell: React.FC<EditableCellProps> = ({ value, onSave, type = 'text', align = 'left' }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value.toString());

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            onSave(tempValue);
            setIsEditing(false);
        } else if (e.key === 'Escape') {
            setTempValue(value.toString());
            setIsEditing(false);
        }
    };

    const handleBlur = () => {
        onSave(tempValue);
        setIsEditing(false);
    };

    const inputRef = React.useRef<HTMLInputElement>(null);

    React.useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.select();
        }
    }, [isEditing]);

    if (isEditing) {
        return (
            <input
                ref={inputRef}
                autoFocus
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleBlur}
                onClick={(e) => e.stopPropagation()}
                className={clsx(
                    "w-full bg-white border border-blue-500 rounded px-1 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500",
                    align === 'right' && "text-right",
                    align === 'center' && "text-center"
                )}
            />
        );
    }

    const displayValue = () => {
        if (type === 'currency') {
            return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        if (type === 'number') {
            return Number(value).toLocaleString();
        }
        return value;
    };

    return (
        <div
            onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
                // For currency/number types, strip formatting for editing
                setTempValue(type === 'currency' ? String(Number(value)) : value.toString().replace(/,/g, ''));
            }}
            className={clsx(
                "cursor-text hover:bg-gray-100 rounded px-1 -mx-1 border border-transparent hover:border-gray-200 transition-colors",
                align === 'right' && "text-right",
                align === 'center' && "text-center"
            )}
            title="Click to edit"
        >
            {displayValue()}
        </div>
    );
};

// Status filter type for plan view
type PlanStatusFilter = 'ALL' | 'ACTIVE' | 'PAUSED' | 'DRAFT';

export const PlanVisualizer: React.FC<PlanVisualizerProps> = ({ mediaPlan, onGroupingChange, onUpdatePlacement, onDeletePlacement, onAddPlacement, onOpenAudienceInsights }) => {
    const [viewMode, setViewMode] = useState<'PLANNING' | 'PERFORMANCE'>('PLANNING');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

    // Status filter for plan view
    const [statusFilter, setStatusFilter] = useState<PlanStatusFilter>('ALL');

    // Segment Browser State
    const [isSegmentBrowserOpen, setIsSegmentBrowserOpen] = useState(false);
    const [editingPlacementId, setEditingPlacementId] = useState<string | null>(null);

    // Audience Insights State
    const [isInsightsPanelOpen, setIsInsightsPanelOpen] = useState(false);

    // Export loading states
    const [exportingPDF, setExportingPDF] = useState(false);
    const [exportingPPT, setExportingPPT] = useState(false);
    const [showExportSelector, setShowExportSelector] = useState(false);

    // Export context - determines available export types
    const exportContext: ExportContext = useMemo(() => ({
        source: 'plan',
        stage: 'planning',
        hasPerformanceData: mediaPlan?.campaign.placements?.some(p => p.performance) || false,
        hasAttributionData: false,
        hasForecastData: mediaPlan?.campaign.placements?.some(p => p.forecast) || false,
    }), [mediaPlan]);

    // Handle export from selector
    const handleExport = (exportType: ExportType, format: ExportFormat, sections: SectionConfig[]) => {
        if (!mediaPlan) return;

        // Create custom config with selected sections
        const customConfig = {
            // Could add section overrides here if needed
        };

        if (format === 'PDF') {
            generateMediaPlanPDF(mediaPlan, { exportType, config: customConfig });
        } else if (format === 'PPT') {
            generateMediaPlanPPT(mediaPlan, { exportType, config: customConfig });
        }
        // CSV/XLSX would go here
    };

    const handleSegmentSelection = (segments: Segment[]) => {
        if (editingPlacementId && mediaPlan?.campaign.placements) {
            const placement = mediaPlan.campaign.placements.find(p => p.id === editingPlacementId);
            if (placement) {
                // Calculate base CPM (strip out previous segment uplifts)
                const previousSegmentUplift = (placement.segments || []).reduce((sum, s) => sum + s.cpmUplift, 0);
                const baseCpm = placement.rate - previousSegmentUplift;

                // Calculate new segment uplift
                const newSegmentUplift = segments.reduce((sum, s) => sum + s.cpmUplift, 0);
                const newRate = baseCpm + newSegmentUplift;

                // Recalculate total cost based on new rate
                // totalCost = (rate / 1000) * quantity for CPM
                const newTotalCost = placement.costMethod === 'CPM'
                    ? (newRate / 1000) * placement.quantity
                    : placement.totalCost; // Keep same for other cost methods

                handlePlacementUpdate({
                    ...placement,
                    segments: segments,
                    segment: segments.map(s => s.name).join(', '), // Legacy support
                    rate: newRate,
                    totalCost: newTotalCost
                });
            }
        }
        setIsSegmentBrowserOpen(false);
        setEditingPlacementId(null);
    };

    const handlePlacementUpdate = (updatedPlacement: Placement) => {
        if (!mediaPlan) return;
        if (onUpdatePlacement) {
            onUpdatePlacement(updatedPlacement);
        }
    };

    // Get all unique segments across all placements
    const getAllCurrentSegments = (): Segment[] => {
        if (!mediaPlan?.campaign.placements) return [];

        const segmentMap = new Map<string, Segment>();
        mediaPlan.campaign.placements.forEach(placement => {
            placement.segments?.forEach(segment => {
                if (!segmentMap.has(segment.id)) {
                    segmentMap.set(segment.id, segment);
                }
            });
        });
        return Array.from(segmentMap.values());
    };

    // Handle quick-add segment from insights (adds to all placements)
    const handleQuickAddSegment = (segment: Segment) => {
        if (!mediaPlan?.campaign.placements) return;

        // Add segment to the first placement that doesn't have it
        const targetPlacement = mediaPlan.campaign.placements.find(p =>
            !p.segments?.some(s => s.id === segment.id)
        );

        if (targetPlacement) {
            const updatedSegments = [...(targetPlacement.segments || []), segment];
            handlePlacementUpdate({
                ...targetPlacement,
                segments: updatedSegments,
                segment: updatedSegments.map(s => s.name).join(', ')
            });
        }
    };

    // Handle removing a segment from all placements
    const handleRemoveSegment = (segment: Segment) => {
        if (!mediaPlan?.campaign.placements) return;

        // Remove segment from all placements that have it
        mediaPlan.campaign.placements.forEach(placement => {
            if (placement.segments?.some(s => s.id === segment.id)) {
                const updatedSegments = placement.segments.filter(s => s.id !== segment.id);

                // Recalculate rate and cost after removing segment
                const removedCpmUplift = segment.cpmUplift;
                const newRate = placement.rate - removedCpmUplift;
                const newTotalCost = placement.costMethod === 'CPM'
                    ? (newRate / 1000) * placement.quantity
                    : placement.totalCost;

                handlePlacementUpdate({
                    ...placement,
                    segments: updatedSegments,
                    segment: updatedSegments.map(s => s.name).join(', '),
                    rate: newRate,
                    totalCost: newTotalCost
                });
            }
        });
    };

    // Safety cleanup
    React.useEffect(() => {
        if (!mediaPlan || !mediaPlan.campaign.placements) return;
        const currentIds = new Set(mediaPlan.campaign.placements.map(p => p.id));
        setDeletingIds(prev => {
            const next = new Set(prev);
            let changed = false;
            next.forEach(id => {
                if (!currentIds.has(id)) {
                    next.delete(id);
                    changed = true;
                }
            });
            return changed ? next : prev;
        });
    }, [mediaPlan]);

    const handleDeletePlacement = async (placementId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        if (deletingIds.has(placementId)) return;

        setDeletingIds(prev => new Set(prev).add(placementId));
        setTimeout(() => {
            setDeletingIds(prev => {
                if (prev.has(placementId)) {
                    const next = new Set(prev);
                    next.delete(placementId);
                    return next;
                }
                return prev;
            });
        }, 5000);

        await new Promise(resolve => setTimeout(resolve, 300));

        if (!mediaPlan || !mediaPlan.campaign.placements) return;
        if (selectedPlacementId === placementId) setSelectedPlacementId(null);
        if (onDeletePlacement) onDeletePlacement(placementId);
    };

    if (!mediaPlan) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <BarChart3 className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">No active media plan</p>
                <p className="text-sm">Chat with the agent to generate a new campaign.</p>
            </div>
        );
    }

    const { campaign, groupingMode = 'DETAILED' } = mediaPlan;

    const toggleExpand = (groupKey: string) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(groupKey)) {
            newExpanded.delete(groupKey);
        } else {
            newExpanded.add(groupKey);
        }
        setExpandedGroups(newExpanded);
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortedData = (data: any[]) => {
        if (!sortConfig) return data;

        return [...data].sort((a, b) => {
            const aVal = sortConfig.key.includes('.')
                ? sortConfig.key.split('.').reduce((obj, key) => obj?.[key], a)
                : a[sortConfig.key];
            const bVal = sortConfig.key.includes('.')
                ? sortConfig.key.split('.').reduce((obj, key) => obj?.[key], b)
                : b[sortConfig.key];

            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    };

    // Generic Grouping Logic
    const groupedData = useMemo(() => {
        if (!campaign.placements || groupingMode === 'DETAILED') return null;

        const groups: Record<string, any> = {};

        campaign.placements.forEach(p => {
            let key = 'Other';

            switch (groupingMode) {
                case 'CHANNEL_SUMMARY': key = p.channel; break;
                case 'VENDOR': key = p.vendor || 'Unknown Vendor'; break;
                case 'SEGMENT': key = p.segment || 'General Audience'; break;
                case 'STATUS': key = p.status || 'Unknown'; break;
                case 'DEVICE': key = p.targeting?.devices?.[0] || 'All Devices'; break;
                case 'GEO': key = p.targeting?.geo?.[0] || 'National'; break;
                default: key = 'Other';
            }

            if (!groups[key]) {
                groups[key] = {
                    key,
                    label: key,
                    count: 0,
                    totalCost: 0,
                    impressions: 0,
                    conversions: 0,
                    clicks: 0,
                    placements: []
                };
            }

            groups[key].count++;
            groups[key].totalCost += p.totalCost;
            groups[key].impressions += p.forecast?.impressions || 0; // Use forecast for planning view
            groups[key].conversions += p.performance?.conversions || 0;
            groups[key].clicks += p.performance?.clicks || 0;
            groups[key].placements.push(p);
        });

        return Object.values(groups).map(g => ({
            ...g,
            cpa: g.conversions > 0 ? g.totalCost / g.conversions : 0,
            roas: g.totalCost > 0 ? (g.conversions * 50) / g.totalCost : 0,
        }));
    }, [campaign.placements, groupingMode]);

    // Filter placements by status
    const filteredPlacements = useMemo(() => {
        if (!campaign.placements) return [];
        if (statusFilter === 'ALL') return campaign.placements;
        return campaign.placements.filter(p => {
            const status = p.status || 'ACTIVE';
            return status === statusFilter;
        });
    }, [campaign.placements, statusFilter]);

    // Get status counts for filter dropdown
    const statusCounts = useMemo(() => {
        if (!campaign.placements) return { ALL: 0, ACTIVE: 0, PAUSED: 0, DRAFT: 0 };
        return {
            ALL: campaign.placements.length,
            ACTIVE: campaign.placements.filter(p => (p.status || 'ACTIVE') === 'ACTIVE').length,
            PAUSED: campaign.placements.filter(p => p.status === 'PAUSED').length,
            DRAFT: campaign.placements.filter(p => p.status === 'DRAFT').length,
        };
    }, [campaign.placements]);

    const renderTableContent = () => {
        if (!filteredPlacements || filteredPlacements.length === 0) {
            if (statusFilter !== 'ALL' && campaign.placements && campaign.placements.length > 0) {
                return (
                    <tr>
                        <td colSpan={12} className="py-8 text-center text-gray-500">
                            No {statusFilter.toLowerCase()} placements found
                        </td>
                    </tr>
                );
            }
            return null;
        }

        if (groupingMode !== 'DETAILED' && groupedData) {
            const sortedGroups = getSortedData(groupedData);

            return sortedGroups.flatMap((group: any, index: number) => {
                const isExpanded = expandedGroups.has(group.key);

                const groupRow = (
                    <tr
                        key={group.key}
                        onClick={() => toggleExpand(group.key)}
                        className="hover:bg-gray-50 transition-colors font-medium cursor-pointer bg-gray-50/30"
                    >
                        <td className="py-3 px-6 text-sm text-gray-400 font-mono flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            {index + 1}
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-900 font-semibold">
                            {group.label}
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-600">{group.count} Placements</td>
                        <td className="py-3 px-6 text-sm text-gray-500">-</td>
                        {viewMode === 'PLANNING' ? (
                            <>
                                <td className="py-3 px-6 text-sm text-gray-500 tabular-nums">-</td>
                                <td className="py-3 px-6 text-sm text-gray-600 text-right tabular-nums">{group.impressions.toLocaleString()}</td>
                                <td className="py-3 px-6 text-sm text-gray-600 text-right tabular-nums">-</td>
                                <td className="py-3 px-6 text-sm text-gray-600 text-right tabular-nums">-</td>
                                <td className="py-3 px-6 text-sm font-bold text-gray-900 text-right tabular-nums">${group.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="py-3 px-6 text-sm text-gray-500 text-center">-</td>
                            </>
                        ) : (
                            <>
                                <td className="py-3 px-6 text-sm text-gray-600">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span>{group.impressions.toLocaleString()}</span>
                                            <span className="text-gray-400">/ {group.impressions.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '50%' }} />
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-6 text-sm text-gray-600">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex justify-between text-xs mb-1">
                                            <span>${group.totalCost.toLocaleString()}</span>
                                            <span className="text-gray-400">/ ${group.totalCost.toLocaleString()}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '50%' }} />
                                        </div>
                                    </div>
                                </td>
                                <td className="py-3 px-6 text-sm text-gray-600 text-right tabular-nums">${group.cpa.toFixed(2)}</td>
                                <td className="py-3 px-6 text-sm font-medium text-right tabular-nums">{group.roas.toFixed(1)}x</td>
                                <td className="py-3 px-6 text-center">-</td>
                            </>
                        )}
                        <td className="py-3 px-6 text-center"></td>
                    </tr>
                );

                if (isExpanded) {
                    const sortedChildren = getSortedData(group.placements);
                    const childRows = sortedChildren.map((placement: any) => renderPlacementRow(placement, true));
                    return [groupRow, ...childRows];
                }

                return groupRow;
            });
        }

        // Detailed View (Flat) - use filtered placements
        const sortedPlacements = getSortedData(filteredPlacements);
        return sortedPlacements.map((p: any, index: number) => renderPlacementRow(p, false, index));
    };

    const renderPlacementRow = (placement: any, isChild: boolean, index?: number) => {
        const isDraft = placement.status === 'DRAFT';

        return (
        <tr
            key={placement.id}
            onClick={() => setSelectedPlacementId(placement.id)}
            className={clsx(
                "hover:bg-gray-50 transition-colors group cursor-pointer",
                isChild && "bg-gray-50/50",
                selectedPlacementId === placement.id && "bg-blue-50 hover:bg-blue-50",
                placement.performance?.status === 'PAUSED' && "opacity-50",
                // DRAFT visual treatment: dashed border and subtle background
                isDraft && "bg-amber-50/50 border-l-4 border-l-amber-400"
            )}
        >
            <td className="py-3 px-6 text-sm text-gray-400 font-mono">
                <div className="flex items-center gap-2">
                    {isChild ? <span className="text-gray-300 ml-4 mr-2">↳</span> : (index !== undefined ? index + 1 : '')}
                    {isDraft && <span className="text-[10px] font-medium text-amber-600 uppercase tracking-wide">Draft</span>}
                </div>
            </td>
            <td className="py-3 px-6 text-sm font-medium text-gray-900">
                {!isChild && (
                    <span className={clsx(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap",
                        placement.channel === 'Search' && "bg-blue-100 text-blue-800",
                        placement.channel === 'Social' && "bg-pink-100 text-pink-800",
                        placement.channel === 'Display' && "bg-purple-100 text-purple-800",
                        placement.channel === 'Streaming Audio' && "bg-green-100 text-green-800",
                        placement.channel === 'Podcast' && "bg-teal-100 text-teal-800",
                        placement.channel === 'Place-based Audio' && "bg-amber-100 text-amber-800",
                        ['TV', 'Radio', 'OOH'].includes(placement.channel) && "bg-orange-100 text-orange-800"
                    )}>
                        {placement.channel}
                    </span>
                )}
            </td>
            <td className="py-3 px-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                    <EditableCell
                        value={placement.vendor}
                        onSave={(val) => handlePlacementUpdate({ ...placement, vendor: val })}
                        type="text"
                    />
                    {placement.performance?.status === 'PAUSED' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-500">
                            Paused
                        </span>
                    )}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                    {placement.segments && placement.segments.length > 0 ? (
                        placement.segments.map((seg: Segment, i: number) => (
                            <SegmentPill
                                key={i}
                                segment={seg}
                                onRemove={() => {
                                    const newSegments = placement.segments.filter((_: any, idx: number) => idx !== i);
                                    handlePlacementUpdate({
                                        ...placement,
                                        segments: newSegments,
                                        segment: newSegments.map((s: any) => s.name).join(', ')
                                    });
                                }}
                            />
                        ))
                    ) : (
                        <span className="text-xs text-gray-400">{placement.segment || 'General'}</span>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setEditingPlacementId(placement.id);
                            setIsSegmentBrowserOpen(true);
                        }}
                        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium text-purple-600 hover:bg-purple-50 transition-colors"
                    >
                        <Plus className="w-3 h-3" /> Add
                    </button>
                </div>
            </td>
            <td className="py-3 px-6 text-sm text-gray-500">
                <EditableCell
                    value={placement.adUnit}
                    onSave={(val) => handlePlacementUpdate({ ...placement, adUnit: val })}
                    type="text"
                />
            </td>

            {viewMode === 'PLANNING' ? (
                <>
                    <td className="py-3 px-6 text-sm text-gray-500 tabular-nums">
                        <EditableCell
                            value={`${placement.startDate} — ${placement.endDate}`}
                            onSave={(val) => {
                                const [start, end] = val.split('—').map(s => s.trim());
                                if (start && end) {
                                    handlePlacementUpdate({ ...placement, startDate: start, endDate: end });
                                }
                            }}
                            type="text"
                        />
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-600 text-right tabular-nums">{(placement.forecast?.impressions || 0).toLocaleString()}</td>
                    <td className="py-3 px-6 text-sm text-gray-600 text-right tabular-nums">
                        {(() => {
                            const segmentUplift = (placement.segments || []).reduce((sum: number, s: Segment) => sum + s.cpmUplift, 0);
                            const mediaCpm = placement.rate - segmentUplift;
                            return (
                                <div className="flex items-center justify-end gap-1">
                                    <EditableCell
                                        value={mediaCpm.toFixed(2)}
                                        onSave={(val) => {
                                            const newMediaCpm = parseFloat(val) || 0;
                                            const newRate = newMediaCpm + segmentUplift;
                                            // When CPM changes, recalculate impressions based on budget
                                            // impressions = (budget / CPM) * 1000
                                            const newImpressions = newRate > 0 ? Math.floor((placement.totalCost / newRate) * 1000) : 0;
                                            handlePlacementUpdate({
                                                ...placement,
                                                rate: newRate,
                                                quantity: newImpressions,
                                                forecast: {
                                                    ...placement.forecast,
                                                    impressions: newImpressions,
                                                    spend: placement.totalCost
                                                }
                                            });
                                        }}
                                        type="text"
                                        align="right"
                                    />
                                    <span className="text-xs text-gray-400">/{placement.costMethod}</span>
                                </div>
                            );
                        })()}
                    </td>
                    <td className="py-3 px-6 text-sm text-right tabular-nums">
                        {(() => {
                            const segmentUplift = (placement.segments || []).reduce((sum: number, s: Segment) => sum + s.cpmUplift, 0);
                            return segmentUplift > 0 ? (
                                <span className="text-purple-600">+${segmentUplift.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            ) : (
                                <span className="text-gray-400">—</span>
                            );
                        })()}
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-600 text-right tabular-nums">
                        <EditableCell
                            value={placement.quantity}
                            onSave={(val) => {
                                const newQuantity = Number(val.replace(/,/g, '')) || 0;
                                // When quantity (impressions) changes, recalculate budget
                                // budget = (impressions * CPM) / 1000
                                const newTotalCost = placement.rate > 0 ? (newQuantity * placement.rate) / 1000 : 0;
                                handlePlacementUpdate({
                                    ...placement,
                                    quantity: newQuantity,
                                    totalCost: newTotalCost,
                                    forecast: {
                                        ...placement.forecast,
                                        impressions: newQuantity,
                                        spend: newTotalCost
                                    }
                                });
                            }}
                            type="number"
                            align="right"
                        />
                    </td>
                    <td className="py-3 px-6 text-sm font-medium text-gray-900 text-right tabular-nums">
                        <EditableCell
                            value={placement.totalCost}
                            onSave={(val) => {
                                const newBudget = Number(val) || 0;
                                // When budget changes, recalculate impressions
                                // impressions = (budget / CPM) * 1000
                                const newImpressions = placement.rate > 0 ? Math.floor((newBudget / placement.rate) * 1000) : 0;
                                handlePlacementUpdate({
                                    ...placement,
                                    totalCost: newBudget,
                                    quantity: newImpressions,
                                    forecast: {
                                        ...placement.forecast,
                                        impressions: newImpressions,
                                        spend: newBudget
                                    }
                                });
                            }}
                            type="currency"
                            align="right"
                        />
                    </td>
                    <td className="py-3 px-6 text-center">
                        {/* Once a line has accumulated impressions/spend, it can't go back to DRAFT */}
                        {(() => {
                            const hasBeenActive = (placement.delivery?.actualImpressions || 0) > 0 ||
                                                  (placement.delivery?.actualSpend || 0) > 0 ||
                                                  (placement.performance?.impressions || 0) > 0;
                            return (
                                <select
                                    value={placement.status || 'ACTIVE'}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        const newStatus = e.target.value as 'ACTIVE' | 'PAUSED' | 'DRAFT';
                                        handlePlacementUpdate({
                                            ...placement,
                                            status: newStatus
                                        });
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className={clsx(
                                        "px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide border-0 cursor-pointer appearance-none",
                                        placement.status === 'ACTIVE' && "bg-green-100 text-green-800",
                                        placement.status === 'PAUSED' && "bg-yellow-100 text-yellow-800",
                                        placement.status === 'DRAFT' && "bg-gray-100 text-gray-600",
                                        (!placement.status || placement.status === 'PLANNING') && "bg-blue-100 text-blue-600"
                                    )}
                                >
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="PAUSED">PAUSED</option>
                                    {!hasBeenActive && <option value="DRAFT">DRAFT</option>}
                                </select>
                            );
                        })()}
                    </td>
                </>
            ) : (
                <>
                    <td className="py-3 px-6 text-sm text-gray-600">
                        <div className="flex flex-col gap-1 min-w-[140px]">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium">{(placement.delivery?.actualImpressions || 0).toLocaleString()}</span>
                                <span className="text-gray-400">/ {(placement.forecast?.impressions || 0).toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className={clsx("h-1.5 rounded-full transition-all duration-500",
                                        placement.delivery?.status === 'UNDER_PACING' ? "bg-red-500" :
                                            placement.delivery?.status === 'OVER_PACING' ? "bg-yellow-500" : "bg-blue-500"
                                    )}
                                    style={{ width: `${Math.min(100, ((placement.delivery?.actualImpressions || 0) / Math.max(1, placement.forecast?.impressions || 1)) * 100)}%` }}
                                />
                            </div>
                        </div>
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-600">
                        <div className="flex flex-col gap-1 min-w-[140px]">
                            <div className="flex justify-between text-xs mb-1">
                                <span className="font-medium">${(placement.delivery?.actualSpend || 0).toLocaleString()}</span>
                                <span className="text-gray-400">/ ${placement.totalCost.toLocaleString()}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                <div
                                    className="bg-green-500 h-1.5 rounded-full transition-all duration-500"
                                    style={{ width: `${Math.min(100, ((placement.delivery?.actualSpend || 0) / Math.max(1, placement.totalCost)) * 100)}%` }}
                                />
                            </div>
                        </div>
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-600 text-right tabular-nums">
                        <div className="flex flex-col items-end">
                            <span>{placement.delivery?.pacing || 0}%</span>
                            <span className={clsx("text-[10px] font-medium uppercase",
                                placement.delivery?.status === 'UNDER_PACING' ? "text-red-500" :
                                    placement.delivery?.status === 'OVER_PACING' ? "text-yellow-600" : "text-green-500"
                            )}>
                                {placement.delivery?.status?.replace('_', ' ') || 'ON TRACK'}
                            </span>
                        </div>
                    </td>
                    <td className={clsx("py-3 px-6 text-sm font-medium text-right tabular-nums",
                        (placement.performance?.roas || 0) > 2 ? "text-green-600" : "text-red-500"
                    )}>
                        {placement.performance?.roas.toFixed(1) || '-'}x
                    </td>
                    <td className="py-3 px-6 text-center">
                        {/* In PERFORMANCE view, lines almost always have accumulated data, so DRAFT is rarely available */}
                        {(() => {
                            const hasBeenActive = (placement.delivery?.actualImpressions || 0) > 0 ||
                                                  (placement.delivery?.actualSpend || 0) > 0 ||
                                                  (placement.performance?.impressions || 0) > 0;
                            return (
                                <select
                                    value={placement.status || placement.performance?.status || 'ACTIVE'}
                                    onChange={(e) => {
                                        e.stopPropagation();
                                        const newStatus = e.target.value as 'ACTIVE' | 'PAUSED' | 'DRAFT';
                                        handlePlacementUpdate({
                                            ...placement,
                                            status: newStatus,
                                            performance: placement.performance ? { ...placement.performance, status: newStatus === 'DRAFT' ? 'PAUSED' : newStatus } : undefined
                                        });
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    className={clsx(
                                        "px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide border-0 cursor-pointer appearance-none",
                                        (placement.status || placement.performance?.status) === 'ACTIVE' && "bg-green-100 text-green-800",
                                        (placement.status || placement.performance?.status) === 'PAUSED' && "bg-yellow-100 text-yellow-800",
                                        (placement.status || placement.performance?.status) === 'DRAFT' && "bg-gray-100 text-gray-600",
                                        (!placement.status && !placement.performance?.status) && "bg-gray-100 text-gray-500"
                                    )}
                                >
                                    <option value="ACTIVE">ACTIVE</option>
                                    <option value="PAUSED">PAUSED</option>
                                    {!hasBeenActive && <option value="DRAFT">DRAFT</option>}
                                </select>
                            );
                        })()}
                    </td>
                </>
            )}
            <td className="py-3 px-6 text-center">
                <button
                    onClick={(e) => handleDeletePlacement(placement.id, e)}
                    disabled={deletingIds.has(placement.id)}
                    className={clsx(
                        "p-1.5 rounded-md transition-all",
                        deletingIds.has(placement.id)
                            ? "opacity-100 bg-red-50 text-red-500 cursor-wait"
                            : "opacity-0 group-hover:opacity-100 hover:bg-red-50 text-gray-400 hover:text-red-600"
                    )}
                    title="Delete placement"
                >
                    {deletingIds.has(placement.id) ? (
                        <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Trash2 className="w-4 h-4" />
                    )}
                </button>
            </td>
        </tr>
    );
    };

    const SortIcon = ({ columnKey }: { columnKey: string }) => {
        if (sortConfig?.key !== columnKey) return <div className="w-4 h-4 opacity-0 group-hover:opacity-20 transition-opacity"><ArrowUpDown className="w-3 h-3" /></div>;
        return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600" /> : <ArrowDown className="w-3 h-3 text-blue-600" />;
    };

    const HeaderCell = ({ label, sortKey, align = 'left' }: { label: string, sortKey?: string, align?: 'left' | 'right' | 'center' }) => (
        <th
            className={clsx(
                "py-3 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200 select-none",
                align === 'right' && "text-right",
                align === 'center' && "text-center",
                sortKey && "cursor-pointer hover:bg-gray-50 hover:text-gray-700 transition-colors group"
            )}
            onClick={() => sortKey && handleSort(sortKey)}
        >
            <div className={clsx("flex items-center gap-1", align === 'right' && "justify-end", align === 'center' && "justify-center")}>
                {label}
                {sortKey && <SortIcon columnKey={sortKey} />}
            </div>
        </th>
    );

    return (
        <div className="flex h-full overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-white border-b border-gray-100 px-6 py-4">
                    {/* Campaign Header with Export Buttons */}
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
                            <p className="text-sm text-gray-500 mt-1">Client: {campaign.advertiser}</p>
                        </div>

                        {/* Export Buttons */}
                        <div className="flex items-center gap-3">
                            {/* Quick export buttons */}
                            <button
                                onClick={async () => {
                                    setExportingPDF(true);
                                    await new Promise(r => setTimeout(r, 100));
                                    generateMediaPlanPDF(mediaPlan);
                                    setTimeout(() => setExportingPDF(false), 1000);
                                }}
                                disabled={exportingPDF}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50"
                                title="Quick export to PDF"
                            >
                                {exportingPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                {exportingPDF ? 'Exporting...' : 'PDF'}
                            </button>
                            <button
                                onClick={async () => {
                                    setExportingPPT(true);
                                    await new Promise(r => setTimeout(r, 100));
                                    generateMediaPlanPPT(mediaPlan);
                                    setTimeout(() => setExportingPPT(false), 1000);
                                }}
                                disabled={exportingPPT}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 transition-colors shadow-sm disabled:opacity-50"
                                title="Quick export to PowerPoint"
                            >
                                {exportingPPT ? <Loader2 className="w-4 h-4 animate-spin" /> : <Presentation className="w-4 h-4" />}
                                {exportingPPT ? 'Exporting...' : 'PPT'}
                            </button>
                            {/* Advanced export with type selection */}
                            <button
                                onClick={() => setShowExportSelector(true)}
                                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                                title="Choose export type and customize"
                            >
                                <Layers className="w-4 h-4" />
                                Export...
                            </button>
                            <div className="w-px h-6 bg-gray-300" />
                            <button
                                onClick={() => onOpenAudienceInsights ? onOpenAudienceInsights() : setIsInsightsPanelOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                                title="View Audience Insights"
                            >
                                <Users className="w-4 h-4" />
                                Audience Insights
                            </button>
                        </div>
                    </div>

                    {/* Plan Metrics Summary  */}
                    {mediaPlan.metrics && (
                        <PlanMetricsSummary
                            metrics={mediaPlan.metrics}
                            budget={campaign.budget}
                            totalSpend={mediaPlan.totalSpend}
                            goals={campaign.numericGoals}
                            lines={campaign.placements}
                            viewMode={viewMode}
                        />
                    )}

                    {/* Controls */}
                    <div className="flex justify-between items-center mt-4">
                        <div className="flex gap-4 items-center">
                            {/* Grouping Dropdown */}
                            <div className="relative group">
                                <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                                    <button
                                        onClick={() => onGroupingChange?.('DETAILED')}
                                        className={clsx(
                                            "px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                                            groupingMode === 'DETAILED' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                        )}
                                    >
                                        <LayoutList className="w-4 h-4" />
                                        <span className="hidden sm:inline">Flat</span>
                                    </button>

                                    <div className="relative">
                                        <button
                                            className={clsx(
                                                "px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                                                groupingMode !== 'DETAILED' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                            )}
                                        >
                                            <Layers className="w-4 h-4" />
                                            <span className="hidden sm:inline">
                                                {groupingMode === 'DETAILED' ? 'Group By' :
                                                    groupingMode === 'CHANNEL_SUMMARY' ? 'Channel' :
                                                        groupingMode.charAt(0) + groupingMode.slice(1).toLowerCase()}
                                            </span>
                                            <ChevronDown className="w-3 h-3 ml-1" />
                                        </button>

                                        {/* Dropdown Menu - Simple CSS hover for now */}
                                        <div className="absolute left-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 hidden group-hover:block z-20">
                                            {[
                                                { id: 'CHANNEL_SUMMARY', label: 'Channel' },
                                                { id: 'VENDOR', label: 'Vendor' },
                                                { id: 'SEGMENT', label: 'Segment' },
                                                { id: 'STATUS', label: 'Status' },
                                                { id: 'DEVICE', label: 'Device' },
                                                { id: 'GEO', label: 'Geo' }
                                            ].map(option => (
                                                <button
                                                    key={option.id}
                                                    onClick={() => onGroupingChange?.(option.id as GroupingMode)}
                                                    className={clsx(
                                                        "w-full text-left px-4 py-2 text-sm hover:bg-gray-50",
                                                        groupingMode === option.id ? "text-purple-600 font-medium" : "text-gray-700"
                                                    )}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* View Mode Toggle */}
                            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode('PLANNING')}
                                    className={clsx(
                                        "px-3 py-2 text-sm font-medium rounded-md transition-all",
                                        viewMode === 'PLANNING' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    Planning
                                </button>
                                <button
                                    onClick={() => setViewMode('PERFORMANCE')}
                                    className={clsx(
                                        "px-3 py-2 text-sm font-medium rounded-md transition-all",
                                        viewMode === 'PERFORMANCE' ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    Performance
                                </button>
                            </div>

                            {/* Status Filter */}
                            <div className="flex items-center gap-1.5">
                                <Filter className="w-3.5 h-3.5 text-gray-400" />
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as PlanStatusFilter)}
                                    className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-700 cursor-pointer focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                >
                                    <option value="ALL">All ({statusCounts.ALL})</option>
                                    <option value="ACTIVE">Active ({statusCounts.ACTIVE})</option>
                                    <option value="PAUSED">Paused ({statusCounts.PAUSED})</option>
                                    <option value="DRAFT">Draft ({statusCounts.DRAFT})</option>
                                </select>
                            </div>
                        </div>

                        {/* Add Line Button */}
                        {onAddPlacement && (
                            <button
                                onClick={onAddPlacement}
                                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Add Line
                            </button>
                        )}
                    </div>
                </div>

                {/* Scrollable Table Area */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full min-w-[1000px] lg:min-w-0">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <HeaderCell label="#" />
                                <HeaderCell label={groupingMode === 'DETAILED' ? "Channel" : "Group Name"} sortKey={groupingMode === 'DETAILED' ? "channel" : "label"} />
                                <HeaderCell label={groupingMode === 'DETAILED' ? "Vendor/Segment" : "Count"} sortKey={groupingMode === 'DETAILED' ? "vendor" : "count"} />
                                <HeaderCell label="Ad Unit" />
                                {viewMode === 'PLANNING' ? (
                                    <>
                                        <HeaderCell label="Flight Dates" />
                                        <HeaderCell label="Forecasted Impressions" sortKey={groupingMode === 'DETAILED' ? "forecast.impressions" : "impressions"} align="right" />
                                        <HeaderCell label="Media CPM" align="right" />
                                        <HeaderCell label="Data CPM" align="right" />
                                        <HeaderCell label="Quantity" align="right" />
                                        <HeaderCell label="Total Cost" sortKey="totalCost" align="right" />
                                        <HeaderCell label="Status" align="center" />
                                    </>
                                ) : (
                                    <>
                                        <HeaderCell label="Impressions (Delivered / Forecast)" sortKey={groupingMode === 'DETAILED' ? "delivery.actualImpressions" : "impressions"} />
                                        <HeaderCell label="Spend (Actual / Budget)" sortKey={groupingMode === 'DETAILED' ? "delivery.actualSpend" : "totalCost"} />
                                        <HeaderCell label="Pacing" sortKey="delivery.pacing" align="right" />
                                        <HeaderCell label="ROAS" sortKey={groupingMode === 'DETAILED' ? "performance.roas" : "roas"} align="right" />
                                        <HeaderCell label="Status" align="center" />
                                    </>
                                )}
                                <HeaderCell label="" align="center" />
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {renderTableContent()}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Placement Detail Panel */}
            {selectedPlacementId && campaign.placements && (
                <PlacementDetailPanel
                    placement={campaign.placements.find(p => p.id === selectedPlacementId)!}
                    onClose={() => setSelectedPlacementId(null)}
                    onUpdate={handlePlacementUpdate}
                    onOpenSegmentBrowser={() => {
                        setEditingPlacementId(selectedPlacementId);
                        setIsSegmentBrowserOpen(true);
                    }}
                />
            )}

            {/* Segment Browser Modal */}
            <SegmentBrowser
                isOpen={isSegmentBrowserOpen}
                onClose={() => {
                    setIsSegmentBrowserOpen(false);
                    setEditingPlacementId(null);
                }}
                onSelectSegments={handleSegmentSelection}
                initialSelectedSegments={
                    editingPlacementId && campaign.placements
                        ? campaign.placements.find(p => p.id === editingPlacementId)?.segments || []
                        : []
                }
            />

            {/* Audience Insights Panel - only shown as internal panel if no external handler */}
            {!onOpenAudienceInsights && (
                <AudienceInsightsPanel
                    isOpen={isInsightsPanelOpen}
                    onClose={() => setIsInsightsPanelOpen(false)}
                    placements={campaign.placements || []}
                    currentSegments={getAllCurrentSegments()}
                    goals={campaign.numericGoals}
                    onAddSegment={handleQuickAddSegment}
                    onRemoveSegment={handleRemoveSegment}
                />
            )}

            {/* Export Type Selector Modal */}
            {showExportSelector && (
                <ExportSelector
                    context={exportContext}
                    onExport={handleExport}
                    onClose={() => setShowExportSelector(false)}
                />
            )}
        </div>
    );
};
