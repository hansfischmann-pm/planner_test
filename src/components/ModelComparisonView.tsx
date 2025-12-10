import React, { useMemo } from 'react';
import { AttributionResult, AttributionModel } from '../types';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ModelComparisonViewProps {
    modelComparison: Map<AttributionModel, AttributionResult[]>;
}

export const ModelComparisonView: React.FC<ModelComparisonViewProps> = ({ modelComparison }) => {
    // ROI Comparison Data logic extracted from AdvancedAnalyticsPanel
    const roiData = useMemo(() => {
        // Get top channels by total revenue (using Linear as baseline)
        const channelRevenue = new Map<string, number>();
        const linearResults = modelComparison.get('LINEAR') || [];

        linearResults.forEach(r => {
            channelRevenue.set(r.channel, r.revenue);
        });

        // Get top 10 channels for this detailed view (was 5 in the summary panel)
        const topChannels = [...channelRevenue.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
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
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Model Comparison & ROI Analysis
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Compare Return on Ad Spend (ROAS) across different attribution models to understand the role of each channel.
            </p>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Channel</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Linear ROAS</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">First Touch</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Touch</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {roiData.map((row) => {
                            const diff = row.lastROAS - row.firstROAS; // Positive = Closer/Last Touch Heavy
                            const percentDiff = (diff / row.linearROAS) * 100;

                            return (
                                <tr key={row.channel} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
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
                                                    <span className="text-green-600 flex items-center text-xs font-medium">
                                                        <ArrowUpRight className="w-3 h-3 mr-1" />
                                                        Closer
                                                    </span>
                                                ) : (
                                                    <span className="text-blue-600 flex items-center text-xs font-medium">
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

            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                    <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center">
                        <ArrowDownRight className="w-4 h-4 mr-2" />
                        Opener Channels
                    </h4>
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                        Channels with higher <strong>First Touch ROAS</strong> are your demand generators. They introduce new users to the brand but might not get credit in last-click models.
                    </p>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                    <h4 className="text-sm font-semibold text-green-900 dark:text-green-300 mb-2 flex items-center">
                        <ArrowUpRight className="w-4 h-4 mr-2" />
                        Closer Channels
                    </h4>
                    <p className="text-sm text-green-800 dark:text-green-400">
                        Channels with higher <strong>Last Touch ROAS</strong> are capture demand. They are efficient at converting users who are already aware of your brand.
                    </p>
                </div>
            </div>
        </div>
    );
};
