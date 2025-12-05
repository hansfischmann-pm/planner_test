import React, { useState, useMemo } from 'react';
import { PlanMetrics, Line } from '../types';
import { TrendingUp, Users, Repeat, DollarSign, Target, Wallet, Filter } from 'lucide-react';

type StatusFilter = 'all' | 'active' | 'paused' | 'draft' | 'active+draft';
type ViewMode = 'PLANNING' | 'PERFORMANCE';

interface PlanMetricsSummaryProps {
    metrics: PlanMetrics;
    budget?: number; // Flight budget
    totalSpend?: number; // Actual spend
    goals?: {
        impressions?: number;
        reach?: number;
        conversions?: number;
    };
    lines?: Line[]; // For status filtering
    onFilterChange?: (filter: StatusFilter) => void;
    viewMode?: ViewMode; // Whether to show forecast (PLANNING) or delivered (PERFORMANCE) data
}

// Calculate forecast metrics for a subset of lines based on status filter
function calculateFilteredMetrics(lines: Line[], filter: StatusFilter): PlanMetrics {
    const filteredLines = lines.filter(line => {
        const status = line.status || 'ACTIVE';
        switch (filter) {
            case 'active': return status === 'ACTIVE';
            case 'paused': return status === 'PAUSED';
            case 'draft': return status === 'DRAFT' || status === 'PLANNING';
            case 'active+draft': return status === 'ACTIVE' || status === 'DRAFT' || status === 'PLANNING';
            default: return true; // 'all'
        }
    });

    const impressions = filteredLines.reduce((sum, line) => sum + (line.forecast?.impressions || 0), 0);
    const totalCost = filteredLines.reduce((sum, line) => sum + line.totalCost, 0);

    // Calculate data costs
    const totalDataCost = filteredLines.reduce((sum, line) => {
        const lineImpressions = line.forecast?.impressions || 0;
        const segmentUplift = (line.segments || []).reduce((s, seg) => s + seg.cpmUplift, 0);
        return sum + (segmentUplift * lineImpressions / 1000);
    }, 0);

    const inventoryCost = totalCost - totalDataCost;
    const reach = Math.floor(impressions * 0.4);
    const frequency = reach > 0 ? impressions / reach : 0;
    const eCpm = impressions > 0 ? (totalCost / impressions) * 1000 : 0;
    const cpm = impressions > 0 ? (inventoryCost / impressions) * 1000 : 0;
    const dataCpm = impressions > 0 ? (totalDataCost / impressions) * 1000 : 0;

    return { impressions, reach, frequency, cpm, eCpm, dataCpm };
}

// Calculate delivered/performance metrics from all lines (includes paused since they accumulated impressions)
function calculateDeliveredMetrics(lines: Line[]): PlanMetrics {
    const impressions = lines.reduce((sum, line) => sum + (line.delivery?.actualImpressions || line.performance?.impressions || 0), 0);
    const totalCost = lines.reduce((sum, line) => sum + (line.delivery?.actualSpend || 0), 0);

    // Calculate data costs based on actual impressions
    const totalDataCost = lines.reduce((sum, line) => {
        const lineImpressions = line.delivery?.actualImpressions || line.performance?.impressions || 0;
        const segmentUplift = (line.segments || []).reduce((s, seg) => s + seg.cpmUplift, 0);
        return sum + (segmentUplift * lineImpressions / 1000);
    }, 0);

    const inventoryCost = Math.max(0, totalCost - totalDataCost);
    const reach = Math.floor(impressions * 0.4);
    const frequency = reach > 0 ? impressions / reach : 0;
    const eCpm = impressions > 0 ? (totalCost / impressions) * 1000 : 0;
    const cpm = impressions > 0 ? (inventoryCost / impressions) * 1000 : 0;
    const dataCpm = impressions > 0 ? (totalDataCost / impressions) * 1000 : 0;

    return { impressions, reach, frequency, cpm, eCpm, dataCpm };
}

export const PlanMetricsSummary: React.FC<PlanMetricsSummaryProps> = ({ metrics, budget, totalSpend, goals, lines, onFilterChange, viewMode = 'PLANNING' }) => {
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

    // Calculate metrics based on viewMode:
    // PLANNING = forecast metrics with status filter
    // PERFORMANCE = delivered metrics (all lines including paused)
    const displayMetrics = useMemo(() => {
        if (lines && lines.length > 0) {
            if (viewMode === 'PERFORMANCE') {
                return calculateDeliveredMetrics(lines);
            }
            return calculateFilteredMetrics(lines, statusFilter);
        }
        return metrics;
    }, [lines, statusFilter, metrics, viewMode]);

    const handleFilterChange = (filter: StatusFilter) => {
        setStatusFilter(filter);
        onFilterChange?.(filter);
    };
    const formatNumber = (num: number): string => {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toLocaleString();
    };

    const budgetUtilization = budget && totalSpend ? (totalSpend / budget) * 100 : 0;
    const impressionProgress = goals?.impressions ? (displayMetrics.impressions / goals.impressions) * 100 : 0;

    // Status filter button styles
    const filterButtonClass = (filter: StatusFilter) => {
        const isActive = statusFilter === filter;
        return `px-2 py-1 text-xs font-medium rounded transition-colors ${
            isActive
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`;
    };

    return (
        <div className="space-y-4 mb-6">
            {/* Status Filter Toggle - only show in PLANNING mode when lines are provided */}
            {lines && lines.length > 0 && viewMode === 'PLANNING' && (
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-500 font-medium">Show:</span>
                    <div className="flex gap-1">
                        <button onClick={() => handleFilterChange('all')} className={filterButtonClass('all')}>Total</button>
                        <button onClick={() => handleFilterChange('active')} className={filterButtonClass('active')}>Active</button>
                        <button onClick={() => handleFilterChange('paused')} className={filterButtonClass('paused')}>Paused</button>
                        <button onClick={() => handleFilterChange('draft')} className={filterButtonClass('draft')}>Draft</button>
                        <button onClick={() => handleFilterChange('active+draft')} className={filterButtonClass('active+draft')}>Active+Draft</button>
                    </div>
                    {statusFilter !== 'all' && (
                        <span className="text-xs text-blue-600 font-medium ml-2">
                            Showing: {lines.filter(l => {
                                const s = l.status || 'ACTIVE';
                                switch(statusFilter) {
                                    case 'active': return s === 'ACTIVE';
                                    case 'paused': return s === 'PAUSED';
                                    case 'draft': return s === 'DRAFT' || s === 'PLANNING';
                                    case 'active+draft': return s === 'ACTIVE' || s === 'DRAFT' || s === 'PLANNING';
                                    default: return true;
                                }
                            }).length} of {lines.length} lines
                        </span>
                    )}
                </div>
            )}

            <div className="grid grid-cols-6 gap-4">
            {/* Budget Tracking */}
            {budget && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-100 p-4 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-emerald-700">
                            <Wallet className="w-5 h-5" />
                            <span className="text-xs font-semibold uppercase tracking-wider">Budget</span>
                        </div>
                        <span className={`text-xs font-bold ${budgetUtilization > 90 ? 'text-red-600' : budgetUtilization > 70 ? 'text-yellow-600' : 'text-emerald-600'}`}>
                            {budgetUtilization.toFixed(0)}%
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                        ${formatNumber(totalSpend || 0)}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                            className={`h-2 rounded-full transition-all ${budgetUtilization > 90 ? 'bg-red-500' : budgetUtilization > 70 ? 'bg-yellow-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, budgetUtilization)}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-emerald-600 mt-2">
                        {budget - (totalSpend || 0) > 0
                            ? `$${formatNumber(budget - (totalSpend || 0))} left`
                            : 'Exhausted'}
                    </p>
                </div>
            )}

            {/* Goal Tracking */}
            {goals?.impressions && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-100 p-4 rounded-xl border border-indigo-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-indigo-700">
                            <Target className="w-5 h-5" />
                            <span className="text-xs font-semibold uppercase tracking-wider">Goal</span>
                        </div>
                        <span className={`text-xs font-bold ${impressionProgress >= 100 ? 'text-green-600' : impressionProgress >= 75 ? 'text-indigo-600' : 'text-yellow-600'}`}>
                            {impressionProgress.toFixed(0)}%
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                        {formatNumber(displayMetrics.impressions)}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                            className={`h-2 rounded-full transition-all ${impressionProgress >= 100 ? 'bg-green-500' : impressionProgress >= 75 ? 'bg-indigo-500' : 'bg-yellow-500'}`}
                            style={{ width: `${Math.min(100, impressionProgress)}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-indigo-600 mt-2">
                        {impressionProgress >= 100
                            ? 'Achieved!'
                            : `${formatNumber(goals.impressions - displayMetrics.impressions)} to go`}
                    </p>
                </div>
            )}

            {/* Impressions */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Impressions</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(displayMetrics.impressions)}</p>
                <p className="text-xs text-blue-600 mt-1">Total views across all channels</p>
            </div>

            {/* Reach */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center gap-2 text-purple-700 mb-2">
                    <Users className="w-5 h-5" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Reach</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(displayMetrics.reach)}</p>
                <p className="text-xs text-purple-600 mt-1">Unique users reached</p>
            </div>

            {/* Frequency */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                    <Repeat className="w-5 h-5" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Frequency</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{displayMetrics.frequency.toFixed(1)}x</p>
                <p className="text-xs text-green-600 mt-1">Average exposures per user</p>
            </div>

            {/* eCPM (Effective CPM with data costs) */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                <div className="flex items-center gap-2 text-orange-700 mb-2">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-xs font-semibold uppercase tracking-wider">eCPM</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">${(displayMetrics.eCpm || displayMetrics.cpm).toFixed(2)}</p>
                <div className="text-xs text-orange-600 mt-1 space-y-0.5">
                    <div className="flex justify-between">
                        <span>Media:</span>
                        <span>${displayMetrics.cpm.toFixed(2)}</span>
                    </div>
                    {(displayMetrics.dataCpm || 0) > 0 && (
                        <div className="flex justify-between">
                            <span>Data:</span>
                            <span>+${(displayMetrics.dataCpm || 0).toFixed(2)}</span>
                        </div>
                    )}
                </div>
            </div>
            </div>
        </div>
    );
};
