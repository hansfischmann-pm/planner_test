import React, { useMemo } from 'react';
import { ConversionPath, Touchpoint } from '../types';
import { ArrowRight, DollarSign, Clock, MousePointerClick } from 'lucide-react';

interface ConversionPathVisualizerProps {
    paths: ConversionPath[];
    maxPathsToShow?: number;
}

export const ConversionPathVisualizer: React.FC<ConversionPathVisualizerProps> = ({
    paths,
    maxPathsToShow = 10
}) => {
    // Sort paths by conversion value (highest first)
    const sortedPaths = useMemo(() => {
        return [...paths].sort((a, b) => b.conversionValue - a.conversionValue).slice(0, maxPathsToShow);
    }, [paths, maxPathsToShow]);

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        return `${month}/${day} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const formatHours = (hours: number) => {
        if (hours < 24) {
            return `${hours.toFixed(1)}h`;
        }
        const days = Math.floor(hours / 24);
        const remainingHours = Math.floor(hours % 24);
        return `${days}d ${remainingHours}h`;
    };

    const getChannelColor = (channelType: string) => {
        const colors: Record<string, string> = {
            'SEARCH': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            'SOCIAL': 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
            'DISPLAY': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
            'VIDEO': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
            'AUDIO': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
            'EMAIL': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
            'OOH': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
        };
        return colors[channelType] || 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300';
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Conversion Paths</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Customer journeys from first touchpoint to conversion (showing top {maxPathsToShow})
                </p>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedPaths.map((path, pathIndex) => (
                    <div key={path.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        {/* Path Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Path #{pathIndex + 1}
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                    {path.touchpoints.length} touchpoints
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                    <Clock className="w-4 h-4" />
                                    <span>{formatHours(path.timeToConversion)}</span>
                                </div>
                                <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                    <DollarSign className="w-4 h-4" />
                                    <span>${path.conversionValue.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Touchpoint Timeline */}
                        <div className="relative">
                            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                                {path.touchpoints.map((touchpoint, tIndex) => (
                                    <React.Fragment key={touchpoint.id}>
                                        {/* Touchpoint Card */}
                                        <div className="flex-shrink-0 w-48">
                                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                                                <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium mb-2 ${getChannelColor(touchpoint.channelType)}`}>
                                                    {touchpoint.channelType}
                                                </div>
                                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate" title={touchpoint.channel}>
                                                    {touchpoint.channel}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {formatTimestamp(touchpoint.timestamp)}
                                                </div>
                                                <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                                                    Cost: ${touchpoint.cost.toFixed(2)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Arrow between touchpoints */}
                                        {tIndex < path.touchpoints.length - 1 && (
                                            <div className="flex-shrink-0">
                                                <ArrowRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}

                                {/* Conversion Indicator */}
                                <div className="flex-shrink-0">
                                    <ArrowRight className="w-5 h-5 text-green-500" />
                                </div>
                                <div className="flex-shrink-0 w-32">
                                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border-2 border-green-500 dark:border-green-600">
                                        <div className="flex items-center gap-1 text-green-700 dark:text-green-400 text-sm font-medium">
                                            <MousePointerClick className="w-4 h-4" />
                                            <span>Conversion</span>
                                        </div>
                                        <div className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                                            ${path.conversionValue.toFixed(0)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {sortedPaths.length === 0 && (
                    <div className="p-12 text-center">
                        <MousePointerClick className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-600 dark:text-gray-400">No conversion paths available</p>
                        <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                            Conversion paths will appear here when data is available
                        </p>
                    </div>
                )}
            </div>

            {paths.length > maxPathsToShow && (
                <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {maxPathsToShow} of {paths.length} conversion paths
                    </p>
                </div>
            )}
        </div>
    );
};
