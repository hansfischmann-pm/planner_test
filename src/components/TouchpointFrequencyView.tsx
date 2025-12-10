import React, { useMemo } from 'react';
import { ConversionPath } from '../types';

interface TouchpointFrequencyViewProps {
    paths: ConversionPath[];
}

export const TouchpointFrequencyView: React.FC<TouchpointFrequencyViewProps> = ({ paths }) => {
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

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Touchpoint Frequency Analysis
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                Breakdown of how many interactions users engaging with before finally converting.
            </p>

            <div className="h-96 flex items-end gap-4 px-4">
                {Object.entries(frequencyData.buckets).map(([bucket, count]) => {
                    const height = count > 0 ? (count / frequencyData.max) * 100 : 0;
                    return (
                        <div key={bucket} className="flex-1 flex flex-col items-center group">
                            <div className="relative w-full flex items-end justify-center">
                                <div
                                    className="w-full bg-purple-100 dark:bg-purple-900/30 rounded-t-sm group-hover:bg-purple-200 dark:group-hover:bg-purple-800/50 transition-all duration-500 relative"
                                    style={{ height: `${height}%` }}
                                >
                                    <div
                                        className="w-full bg-purple-500 dark:bg-purple-400 rounded-t-sm absolute top-0"
                                        style={{ height: '4px' }}
                                    />
                                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                        {count} conversions ({((count / paths.length) * 100).toFixed(1)}%)
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center font-medium">
                                {bucket}
                            </div>
                        </div>
                    );
                })}
            </div>
            <div className="mt-8 text-center bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                <p className="text-sm text-purple-800 dark:text-purple-300">
                    <strong>Insight:</strong>
                    {' '}{((paths.filter(p => p.touchpoints.length >= 3).length / paths.length) * 100).toFixed(0)}% of conversions require 3 or more touchpoints. Multi-touch attribution is essential for valuing your upper-funnel channels correctly.
                </p>
            </div>
        </div>
    );
};
