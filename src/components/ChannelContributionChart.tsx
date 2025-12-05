import React, { useMemo } from 'react';
import { AttributionModel, AttributionResult } from '../types';
import { BarChart3 } from 'lucide-react';

interface ChannelContributionChartProps {
    results: Map<AttributionModel, AttributionResult[]>;
}

export const ChannelContributionChart: React.FC<ChannelContributionChartProps> = ({ results }) => {
    // Get all unique channels across models
    const allChannels = useMemo(() => {
        const channelSet = new Set<string>();
        results.forEach(modelResults => {
            modelResults.forEach(result => channelSet.add(result.channel));
        });
        return Array.from(channelSet);
    }, [results]);

    // Model labels
    const modelLabels: Record<AttributionModel, string> = {
        'FIRST_TOUCH': 'First Touch',
        'LAST_TOUCH': 'Last Touch',
        'LINEAR': 'Linear',
        'TIME_DECAY': 'Time Decay',
        'POSITION_BASED': 'Position-Based'
    };

    // Colors for models
    const modelColors: Record<AttributionModel, string> = {
        'FIRST_TOUCH': 'bg-blue-500',
        'LAST_TOUCH': 'bg-green-500',
        'LINEAR': 'bg-purple-500',
        'TIME_DECAY': 'bg-orange-500',
        'POSITION_BASED': 'bg-pink-500'
    };

    // Get credit for a specific channel in a specific model
    const getCredit = (model: AttributionModel, channel: string): number => {
        const modelResults = results.get(model) || [];
        const channelResult = modelResults.find(r => r.channel === channel);
        return channelResult ? channelResult.credit * 100 : 0;
    };

    if (results.size === 0 || allChannels.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No attribution data to compare</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Model Comparison</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Attribution credit across all models
                </p>
            </div>

            <div className="p-6">
                {/* Legend */}
                <div className="flex flex-wrap gap-4 mb-6">
                    {Array.from(results.keys()).map(model => (
                        <div key={model} className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded ${modelColors[model]}`}></div>
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                {modelLabels[model]}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Stacked Bar Chart */}
                <div className="space-y-4">
                    {allChannels.map(channel => {
                        // Calculate total height (sum of all credits for this channel)
                        const totalCredit = Array.from(results.keys()).reduce((sum, model) => {
                            return sum + getCredit(model, channel);
                        }, 0);

                        return (
                            <div key={channel}>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-32 text-sm font-medium text-gray-900 dark:text-white truncate" title={channel}>
                                        {channel}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex h-8 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                                            {Array.from(results.keys()).map(model => {
                                                const credit = getCredit(model, channel);
                                                const percentage = totalCredit > 0 ? (credit / totalCredit) * 100 : 0;

                                                if (credit === 0) return null;

                                                return (
                                                    <div
                                                        key={model}
                                                        className={`${modelColors[model]} flex items-center justify-center group relative`}
                                                        style={{ width: `${percentage}%` }}
                                                        title={`${modelLabels[model]}: ${credit.toFixed(1)}%`}
                                                    >
                                                        {credit >= 5 && (
                                                            <span className="text-xs font-medium text-white">
                                                                {credit.toFixed(0)}%
                                                            </span>
                                                        )}

                                                        {/* Tooltip */}
                                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                                            {modelLabels[model]}: {credit.toFixed(1)}%
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                    <div className="w-16 text-right text-sm text-gray-600 dark:text-gray-400">
                                        {(totalCredit / results.size).toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Summary Table */}
                <div className="mt-8 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Channel
                                </th>
                                {Array.from(results.keys()).map(model => (
                                    <th key={model} className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        {modelLabels[model]}
                                    </th>
                                ))}
                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                    Avg
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {allChannels.map(channel => {
                                const credits = Array.from(results.keys()).map(model => getCredit(model, channel));
                                const avg = credits.reduce((sum, c) => sum + c, 0) / credits.length;

                                return (
                                    <tr key={channel} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">
                                            {channel}
                                        </td>
                                        {credits.map((credit, index) => (
                                            <td key={index} className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">
                                                {credit.toFixed(1)}%
                                            </td>
                                        ))}
                                        <td className="px-4 py-2 text-right font-medium text-gray-900 dark:text-white">
                                            {avg.toFixed(1)}%
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
