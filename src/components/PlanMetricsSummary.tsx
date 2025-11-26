import React from 'react';
import { PlanMetrics } from '../types';
import { TrendingUp, Users, Repeat, DollarSign } from 'lucide-react';

interface PlanMetricsSummaryProps {
    metrics: PlanMetrics;
}

export const PlanMetricsSummary: React.FC<PlanMetricsSummaryProps> = ({ metrics }) => {
    const formatNumber = (num: number): string => {
        if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
        } else if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}K`;
        }
        return num.toLocaleString();
    };

    return (
        <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                    <TrendingUp className="w-5 h-5" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Impressions</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(metrics.impressions)}</p>
                <p className="text-xs text-blue-600 mt-1">Total views across all channels</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                <div className="flex items-center gap-2 text-purple-700 mb-2">
                    <Users className="w-5 h-5" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Reach</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{formatNumber(metrics.reach)}</p>
                <p className="text-xs text-purple-600 mt-1">Unique users reached</p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                <div className="flex items-center gap-2 text-green-700 mb-2">
                    <Repeat className="w-5 h-5" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Frequency</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">{metrics.frequency.toFixed(1)}x</p>
                <p className="text-xs text-green-600 mt-1">Average exposures per user</p>
            </div>

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
