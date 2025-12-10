import React, { useState, useMemo } from 'react';
import { ConversionPath, AttributionModel, AttributionResult } from '../types';
import { Clock, Layers, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react';

interface AdvancedAnalyticsPanelProps {
    paths: ConversionPath[];
    modelComparison: Map<AttributionModel, AttributionResult[]>;
}

type Tab = 'TIME' | 'FREQUENCY' | 'ROI';

export const AdvancedAnalyticsPanel: React.FC<AdvancedAnalyticsPanelProps> = ({ paths, modelComparison }) => {
    const [activeTab, setActiveTab] = useState<Tab>('TIME');

    // 1. Time to Conversion Analysis
    const timeData = useMemo(() => {
        const buckets = {
            '< 1 day': 0,
            '1-3 days': 0,
            '3-7 days': 0,
            '7-14 days': 0,
            '14-30 days': 0,
            '30+ days': 0
        };

        paths.forEach(p => {
            const days = p.timeToConversion / 24;
            if (days < 1) buckets['< 1 day']++;
            else if (days < 3) buckets['1-3 days']++;
            else if (days < 7) buckets['3-7 days']++;
            else if (days < 14) buckets['7-14 days']++;
            else if (days < 30) buckets['14-30 days']++;
            else buckets['30+ days']++;
        });

        const max = Math.max(...Object.values(buckets));
        return { buckets, max };
    }, [paths]);

    // 2. Touchpoint Frequency Analysis
    const frequencyData = useMemo(() => {
        const buckets: Record<string, number> = {
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            '5': 0,
            '6-10': 0,
            '10+': 0
        };

        paths.forEach(p => {
            const count = p.touchpoints.length;
            if (count <= 5) buckets[count.toString()]++;
            else if (count <= 10) buckets['6-10']++;
            else buckets['10+']++;
        });

        const max = Math.max(...Object.values(buckets));
        return { buckets, max };
    }, [paths]);

    // 3. ROI Comparison Data
    const roiData = useMemo(() => {
        // Get top 5 channels by total revenue
        const channelRevenue = new Map<string, number>();
        const linearResults = modelComparison.get('LINEAR') || [];

        linearResults.forEach(r => {
            channelRevenue.set(r.channel, r.revenue);
        });

        const topChannels = [...channelRevenue.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([channel]) => channel);

        return topChannels.map(channel => {
            const linear = modelComparison.get('LINEAR')?.find(r => r.channel === channel);
            const first = modelComparison.get('FIRST_TOUCH')?.find(r => r.channel === channel);
            const last = modelComparison.get('LAST_TOUCH')?.find(r => r.channel === channel);

            return {
                channel,
                linearROAS: linear?.roas || 0,
                firstROAS: first?.roas || 0,
                lastROAS: last?.roas || 0,
                revenue: linear?.revenue || 0
            };
        });
    }, [modelComparison]);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex -mb-px">
                    <button
                        onClick={() => setActiveTab('TIME')}
                        className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2 ${activeTab === 'TIME'
                            ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        <Clock className="w-4 h-4" />
                        Time to Conversion
                    </button>
                    <button
                        onClick={() => setActiveTab('FREQUENCY')}
                        className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2 ${activeTab === 'FREQUENCY'
                            ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        <Layers className="w-4 h-4" />
                        Touchpoint Frequency
                    </button>
                    <button
                        onClick={() => setActiveTab('ROI')}
                        className={`w-1/3 py-4 px-1 text-center border-b-2 font-medium text-sm flex items-center justify-center gap-2 ${activeTab === 'ROI'
                            ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        <TrendingUp className="w-4 h-4" />
                        Model ROI Comparison
                    </button>
                </nav>
            </div>

            <div className="p-6">
                {activeTab === 'TIME' && (
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            How long does it take users to convert?
                        </h3>
                        <div className="h-64 flex items-end gap-4">
                            {Object.entries(timeData.buckets).map(([bucket, count]) => {
                                const height = count > 0 ? (count / timeData.max) * 100 : 0;
                                return (
                                    <div key={bucket} className="flex-1 flex flex-col items-center group">
                                        <div className="relative w-full flex items-end justify-center">
                                            <div
                                                className="w-full bg-blue-100 dark:bg-blue-900/30 rounded-t-sm group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-all duration-500"
                                                style={{ height: `${height}%` }}
                                            >
                                                <div
                                                    className="w-full bg-blue-500 dark:bg-blue-400 rounded-t-sm"
                                                    style={{ height: '4px' }}
                                                />
                                            </div>
                                            <div className="absolute -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                {count} conversions ({((count / paths.length) * 100).toFixed(1)}%)
                                            </div>
                                        </div>
                                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center font-medium">
                                            {bucket}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                            Days from First Touch to Conversion
                        </div>
                    </div>
                )}

                {activeTab === 'FREQUENCY' && (
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            How many interactions before conversion?
                        </h3>
                        <div className="h-64 flex items-end gap-4">
                            {Object.entries(frequencyData.buckets).map(([bucket, count]) => {
                                const height = count > 0 ? (count / frequencyData.max) * 100 : 0;
                                return (
                                    <div key={bucket} className="flex-1 flex flex-col items-center group">
                                        <div className="relative w-full flex items-end justify-center">
                                            <div
                                                className="w-full bg-purple-100 dark:bg-purple-900/30 rounded-t-sm group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-all duration-500"
                                                style={{ height: `${height}%` }}
                                            >
                                                <div
                                                    className="w-full bg-purple-500 dark:bg-purple-400 rounded-t-sm"
                                                    style={{ height: '4px' }}
                                                />
                                            </div>
                                            <div className="absolute -top-8 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                {count} conversions ({((count / paths.length) * 100).toFixed(1)}%)
                                            </div>
                                        </div>
                                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center font-medium">
                                            {bucket}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                            Number of Touchpoints per Journey
                        </div>
                    </div>
                )}

                {activeTab === 'ROI' && (
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            ROAS by Attribution Model (Top 5 Channels)
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Channel</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Linear ROAS</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">First Touch</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Touch</th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Impact</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {roiData.map((row) => {
                                        const diff = row.lastROAS - row.firstROAS; // Positive = Closer/Last Touch Heavy
                                        const percentDiff = (diff / row.linearROAS) * 100;

                                        return (
                                            <tr key={row.channel}>
                                                <td className="px-4 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                                    {row.channel}
                                                </td>
                                                <td className="px-4 py-4 text-sm text-right text-gray-900 dark:text-white font-semibold">
                                                    {row.linearROAS.toFixed(2)}x
                                                </td>
                                                <td className="px-4 py-4 text-sm text-right text-gray-500 dark:text-gray-400">
                                                    {row.firstROAS.toFixed(2)}x
                                                </td>
                                                <td className="px-4 py-4 text-sm text-right text-gray-500 dark:text-gray-400">
                                                    {row.lastROAS.toFixed(2)}x
                                                </td>
                                                <td className="px-4 py-4 text-sm text-right">
                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-center gap-1">
                                                            {diff > 0 ? (
                                                                <span className="text-green-600 flex items-center text-xs">
                                                                    <ArrowUpRight className="w-3 h-3 mr-1" />
                                                                    Closer
                                                                </span>
                                                            ) : (
                                                                <span className="text-blue-600 flex items-center text-xs">
                                                                    <ArrowDownRight className="w-3 h-3 mr-1" />
                                                                    Opener
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-gray-400">
                                                            {Math.abs(percentDiff).toFixed(1)}% shift
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-sm text-purple-800 dark:text-purple-300">
                            <p>
                                <strong>Insight:</strong> Channels identified as "Opener" (Blue) perform better in First Touch models and are key for awareness.
                                "Closer" (Green) channels drive the final conversion and perform better in Last Touch models.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
