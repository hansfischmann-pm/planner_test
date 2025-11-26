import React, { useState } from 'react';
import { MediaPlan, Placement } from '../types';
import { BarChart3, LayoutList, Rows, ArrowUp, ArrowDown, ArrowUpDown, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { PlacementDetailPanel } from './PlacementDetailPanel';
import { PlanMetricsSummary } from './PlanMetricsSummary';

interface PlanVisualizerProps {
    mediaPlan: MediaPlan | null;
    onGroupingChange?: (mode: 'DETAILED' | 'CHANNEL_SUMMARY') => void;
    onDeletePlacement?: (placementId: string) => void;
}

export const PlanVisualizer: React.FC<PlanVisualizerProps> = ({ mediaPlan, onGroupingChange, onDeletePlacement }) => {
    const [viewMode, setViewMode] = useState<'PLANNING' | 'PERFORMANCE'>('PLANNING');
    const [expandedChannels, setExpandedChannels] = useState<Set<string>>(new Set());
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
    const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);

    const handlePlacementUpdate = (updatedPlacement: Placement) => {
        if (!mediaPlan) return;
        const updatedPlacements = mediaPlan.campaign.placements?.map(p =>
            p.id === updatedPlacement.id ? updatedPlacement : p
        );
        if (updatedPlacements) {
            mediaPlan.campaign.placements = updatedPlacements;
        }
        if (onGroupingChange) onGroupingChange(mediaPlan.groupingMode || 'DETAILED');
    };

    const handleDeletePlacement = (placementId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!mediaPlan || !mediaPlan.campaign.placements) return;
        mediaPlan.campaign.placements = mediaPlan.campaign.placements.filter(p => p.id !== placementId);
        if (selectedPlacementId === placementId) setSelectedPlacementId(null);
        if (onGroupingChange) onGroupingChange(mediaPlan.groupingMode || 'DETAILED');
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

    const { campaign, groupingMode } = mediaPlan;

    const toggleExpand = (channel: string) => {
        const newExpanded = new Set(expandedChannels);
        if (newExpanded.has(channel)) {
            newExpanded.delete(channel);
        } else {
            newExpanded.add(channel);
        }
        setExpandedChannels(newExpanded);
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

    const renderTableContent = () => {
        if (!campaign.placements || campaign.placements.length === 0) {
            return null;
        }

        // Channel Summary View
        if (groupingMode === 'CHANNEL_SUMMARY') {
            const channelGroups = campaign.placements.reduce((acc, p) => {
                if (!acc[p.channel]) {
                    acc[p.channel] = {
                        channel: p.channel,
                        count: 0,
                        totalCost: 0,
                        impressions: 0,
                        conversions: 0,
                        clicks: 0,
                        placements: []
                    };
                }
                acc[p.channel].count++;
                acc[p.channel].totalCost += p.totalCost;
                acc[p.channel].impressions += p.performance?.impressions || 0;
                acc[p.channel].conversions += p.performance?.conversions || 0;
                acc[p.channel].clicks += p.performance?.clicks || 0;
                acc[p.channel].placements.push(p);
                return acc;
            }, {} as Record<string, any>);

            const groups = Object.values(channelGroups).map((g: any) => ({
                ...g,
                cpa: g.conversions > 0 ? g.totalCost / g.conversions : 0,
                roas: g.totalCost > 0 ? (g.conversions * 50) / g.totalCost : 0,
            }));

            const sortedGroups = getSortedData(groups);

            return sortedGroups.flatMap((group: any, index: number) => {
                const isExpanded = expandedChannels.has(group.channel);

                const groupRow = (
                    <tr
                        key={group.channel}
                        onClick={() => toggleExpand(group.channel)}
                        className="hover:bg-gray-50 transition-colors font-medium cursor-pointer"
                    >
                        <td className="py-3 px-6 text-sm text-gray-400 font-mono flex items-center gap-2">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            {index + 1}
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-900">
                            <span className={clsx(
                                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                                group.channel === 'Search' && "bg-blue-100 text-blue-800",
                                group.channel === 'Social' && "bg-pink-100 text-pink-800",
                                group.channel === 'Display' && "bg-purple-100 text-purple-800",
                                ['TV', 'Radio', 'OOH', 'Print'].includes(group.channel) && "bg-orange-100 text-orange-800"
                            )}>
                                {group.channel}
                            </span>
                        </td>
                        <td className="py-3 px-6 text-sm text-gray-600">{group.count} Placements</td>
                        <td className="py-3 px-6 text-sm text-gray-500">-</td>
                        {viewMode === 'PLANNING' ? (
                            <>
                                <td className="py-3 px-6 text-sm text-gray-500 tabular-nums">-</td>
                                <td className="py-3 px-6 text-sm text-gray-600 text-right tabular-nums">-</td>
                                <td className="py-3 px-6 text-sm text-gray-600 text-right tabular-nums">-</td>
                                <td className="py-3 px-6 text-sm font-bold text-gray-900 text-right tabular-nums">${group.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </>
                        ) : (
                            <>
                                <td className="py-3 px-6 text-sm text-gray-600 text-right tabular-nums">{group.impressions.toLocaleString()}</td>
                                <td className="py-3 px-6 text-sm text-gray-600 text-right tabular-nums">-</td>
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

        // Detailed View (Flat)
        const sortedPlacements = getSortedData(campaign.placements);
        return sortedPlacements.map((p: any, index: number) => renderPlacementRow(p, false, index));
    };

    const renderPlacementRow = (placement: any, isChild: boolean, index?: number) => (
        <tr
            key={placement.id}
            onClick={() => setSelectedPlacementId(placement.id)}
            className={clsx(
                "hover:bg-gray-50 transition-colors group cursor-pointer",
                isChild && "bg-gray-50/50",
                selectedPlacementId === placement.id && "bg-blue-50 hover:bg-blue-50",
                placement.performance?.status === 'PAUSED' && "opacity-50"
            )}
        >
            <td className="py-3 px-6 text-sm text-gray-400 font-mono">
                {isChild ? <span className="text-gray-300 ml-4 mr-2">↳</span> : (index !== undefined ? index + 1 : '')}
            </td>
            <td className="py-3 px-6 text-sm font-medium text-gray-900">
                <div className="flex items-center gap-2">
                    {!isChild && (
                        <span className={clsx(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                            placement.channel === 'Search' && "bg-blue-100 text-blue-800",
                            placement.channel === 'Social' && "bg-pink-100 text-pink-800",
                            placement.channel === 'Display' && "bg-purple-100 text-purple-800",
                            ['TV', 'Radio', 'OOH', 'Print'].includes(placement.channel) && "bg-orange-100 text-orange-800"
                        )}>
                            {placement.channel}
                        </span>
                    )}
                    {placement.performance?.status === 'PAUSED' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
                            <span className="text-gray-400">■</span> Paused
                        </span>
                    )}
                </div>
            </td>
            <td className="py-3 px-6 text-sm text-gray-600">
                <div>{placement.vendor}</div>
                <div className="text-xs text-gray-400">{placement.segment || 'General'}</div>
            </td>
            <td className="py-3 px-6 text-sm text-gray-500">{placement.adUnit}</td>

            {viewMode === 'PLANNING' ? (
                <>
                    <td className="py-3 px-6 text-sm text-gray-500 tabular-nums">{placement.startDate} — {placement.endDate}</td>
                    <td className="py-3 px-6 text-sm text-gray-600 text-right tabular-nums">
                        ${placement.rate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs text-gray-400">/{placement.costMethod}</span>
                    </td>
                    <td className="py-3 px-6 text-sm text-gray-600 text-right tabular-nums">{placement.quantity.toLocaleString()}</td>
                    <td className="py-3 px-6 text-sm font-medium text-gray-900 text-right tabular-nums">${placement.totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </>
            ) : (
                <>
                    <td className="py-3 px-6 text-sm text-gray-600 text-right tabular-nums">{placement.performance?.impressions.toLocaleString() || '-'}</td>
                    <td className="py-3 px-6 text-sm text-gray-600 text-right tabular-nums">{((placement.performance?.ctr || 0) * 100).toFixed(2)}%</td>
                    <td className="py-3 px-6 text-sm text-gray-600 text-right tabular-nums">${placement.performance?.cpa.toFixed(2) || '-'}</td>
                    <td className={clsx("py-3 px-6 text-sm font-medium text-right tabular-nums",
                        (placement.performance?.roas || 0) > 2 ? "text-green-600" : "text-red-500"
                    )}>
                        {placement.performance?.roas.toFixed(1) || '-'}x
                    </td>
                    <td className="py-3 px-6 text-center">
                        <span className={clsx(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium uppercase tracking-wide",
                            placement.performance?.status === 'ACTIVE' ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                        )}>
                            {placement.performance?.status || 'PENDING'}
                        </span>
                    </td>
                </>
            )}
            <td className="py-3 px-6 text-center">
                <button
                    onClick={(e) => handleDeletePlacement(placement.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-600"
                    title="Delete placement"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </td>
        </tr>
    );

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
                    {/* Campaign Header */}
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
                            <p className="text-sm text-gray-500 mt-1">Client: {campaign.advertiser}</p>
                        </div>
                    </div>

                    {/* Plan Metrics Summary */}
                    {mediaPlan.metrics && <PlanMetricsSummary metrics={mediaPlan.metrics} />}

                    {/* Controls */}
                    <div className="flex justify-between items-center mt-4">
                        <div className="flex gap-4 items-center">
                            {/* Grouping Toggle */}
                            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => onGroupingChange?.('DETAILED')}
                                    className={clsx(
                                        "px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                                        groupingMode === 'DETAILED' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    <LayoutList className="w-4 h-4" />
                                    <span className="hidden sm:inline">Line Items</span>
                                </button>
                                <button
                                    onClick={() => onGroupingChange?.('CHANNEL_SUMMARY')}
                                    className={clsx(
                                        "px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2",
                                        groupingMode === 'CHANNEL_SUMMARY' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    <Rows className="w-4 h-4" />
                                    <span className="hidden sm:inline">Summary</span>
                                </button>
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
                        </div>
                    </div>
                </div>

                {/* Scrollable Table Area */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0 z-10">
                            <tr>
                                <HeaderCell label="#" />
                                <HeaderCell label="Channel" sortKey="channel" />
                                <HeaderCell label="Vendor/Segment" sortKey="vendor" />
                                <HeaderCell label="Ad Unit" />
                                {viewMode === 'PLANNING' ? (
                                    <>
                                        <HeaderCell label="Flight Dates" />
                                        <HeaderCell label="Rate" align="right" />
                                        <HeaderCell label="Quantity" align="right" />
                                        <HeaderCell label="Total Cost" sortKey="totalCost" align="right" />
                                    </>
                                ) : (
                                    <>
                                        <HeaderCell label="Impressions" sortKey="performance.impressions" align="right" />
                                        <HeaderCell label="CTR" sortKey="performance.ctr" align="right" />
                                        <HeaderCell label="CPA" sortKey="performance.cpa" align="right" />
                                        <HeaderCell label="ROAS" sortKey="performance.roas" align="right" />
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
                />
            )}
        </div>
    );
};
