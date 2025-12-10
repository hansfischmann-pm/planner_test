import React, { useMemo } from 'react';
import { ConversionPath } from '../types';

interface TimeAnalysisViewProps {
    paths: ConversionPath[];
}

export const TimeAnalysisView: React.FC<TimeAnalysisViewProps> = ({ paths }) => {
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

    if (paths.length === 0) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Time to Conversion Analysis
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    No conversion data available. Generate conversion paths to see time analysis.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Time to Conversion Analysis
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                Distribution of time elapsed between a user's first interaction and their conversion.
            </p>

            <div className="h-80 flex items-end gap-4 px-4">
                {Object.entries(timeData.buckets).map(([bucket, count]) => {
                    const heightPercent = timeData.max > 0 ? (count / timeData.max) * 100 : 0;
                    const heightPx = Math.max(4, (heightPercent / 100) * 280); // 280px max height, 4px min
                    return (
                        <div key={bucket} className="flex-1 flex flex-col items-center justify-end group h-full">
                            <div className="relative w-full flex flex-col items-center justify-end h-full">
                                {/* Tooltip */}
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    {count} conversions ({paths.length > 0 ? ((count / paths.length) * 100).toFixed(1) : 0}%)
                                </div>
                                {/* Bar */}
                                <div
                                    className="w-full bg-blue-500 dark:bg-blue-400 rounded-t-md group-hover:bg-blue-600 dark:group-hover:bg-blue-300 transition-all duration-300"
                                    style={{ height: `${heightPx}px` }}
                                />
                            </div>
                            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center font-medium">
                                {bucket}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-8 text-center bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Insight:</strong>
                    {' '}{paths.length > 0 ? ((paths.filter(p => p.timeToConversion < 24 * 3).length / paths.length) * 100).toFixed(0) : 0}% of conversions happen within the first 3 days. Focus on retargeting windows during this critical period.
                </p>
            </div>
        </div>
    );
};
