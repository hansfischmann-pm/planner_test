import React from 'react';
import { PlanMetrics } from '../types';
import { TrendingUp, Users, Repeat, DollarSign, Target, Wallet } from 'lucide-react';

interface PlanMetricsSummaryProps {
    metrics: PlanMetrics;
    budget?: number; // Flight budget
    totalSpend?: number; // Actual spend
    goals?: {
        impressions?: number;
        reach?: number;
        conversions?: number;
    };
}

export const PlanMetricsSummary: React.FC<PlanMetricsSummaryProps> = ({ metrics, budget, totalSpend, goals }) => {
    const formatNumber = (num: number): string => {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toLocaleString();
    };

    const budgetUtilization = budget && totalSpend ? (totalSpend / budget) * 100 : 0;
    const impressionProgress = goals?.impressions ? (metrics.impressions / goals.impressions) * 100 : 0;

    return (
        <div className="grid grid-cols-6 gap-4 mb-6">
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
                        {formatNumber(metrics.impressions)}
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                            className={`h-2 rounded-full transition-all ${impressionProgress >= 100 ? 'bg-green-500' : impressionProgress >= 75 ? 'bg-indigo-500' : 'bg-yellow-500'}`}
                            style={{ width: `${Math.min(100, impressionProgress)}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-indigo-600 mt-2">
                        {impressionProgress >= 100
                            ? '🎯 Achieved!'
                            : `${formatNumber(goals.impressions - metrics.impressions)} to go`}
                    </p>
                </div>
            )}

            {/* Impressions */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Impressions</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(metrics.impressions)}</p>
                <p className="text-xs text-blue-600 mt-1">Total views across all channels</p>
            </div>

            {/* Reach */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center gap-2 text-purple-700 mb-2">
                    <Users className="w-5 h-5" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Reach</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(metrics.reach)}</p>
                <p className="text-xs text-purple-600 mt-1">Unique users reached</p>
            </div>

            {/* Frequency */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                    <Repeat className="w-5 h-5" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Frequency</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{metrics.frequency.toFixed(1)}x</p>
                <p className="text-xs text-green-600 mt-1">Average exposures per user</p>
            </div>

            {/* CPM */}
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
                <div className="flex items-center gap-2 text-orange-700 mb-2">
                    <DollarSign className="w-5 h-5" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Avg CPM</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">${metrics.cpm.toFixed(2)}</p>
                <p className="text-xs text-orange-600 mt-1">Cost per thousand impressions</p>
            </div>
        </div>
    );
};
