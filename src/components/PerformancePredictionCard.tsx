import React from 'react';
import { PerformancePrediction } from '../utils/predictiveAnalytics';
import { TrendingUp, TrendingDown, Minus, Target } from 'lucide-react';

interface PerformancePredictionProps {
    predictions: PerformancePrediction[];
}

export const PerformancePredictionCard: React.FC<PerformancePredictionProps> = ({
    predictions
}) => {
    if (predictions.length === 0) {
        return null;
    }

    const getTrendIcon = (trend: PerformancePrediction['trend']) => {
        switch (trend) {
            case 'GROWING':
                return <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />;
            case 'DECLINING':
                return <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />;
            case 'STABLE':
                return <Minus className="h-4 w-4 text-gray-600 dark:text-gray-400" />;
        }
    };

    const getTrendColor = (trend: PerformancePrediction['trend']) => {
        switch (trend) {
            case 'GROWING':
                return 'text-green-600 dark:text-green-400';
            case 'DECLINING':
                return 'text-red-600 dark:text-red-400';
            case 'STABLE':
                return 'text-gray-600 dark:text-gray-400';
        }
    };

    const formatValue = (value: number, metric: string) => {
        if (metric === 'revenue') {
            return `$${value.toLocaleString()}`;
        }
        return value.toLocaleString();
    };

    const getMetricLabel = (metric: string) => {
        return metric.charAt(0).toUpperCase() + metric.slice(1);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Performance Projections
                </h3>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                {predictions.map((prediction, idx) => {
                    const progressPercentage = prediction.goalValue
                        ? (prediction.projectedValue / prediction.goalValue) * 100
                        : 100;
                    const isOnTrack = !prediction.goalValue || progressPercentage >= 90;

                    return (
                        <div
                            key={idx}
                            className={`p-4 rounded-lg border ${isOnTrack
                                    ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                    {getMetricLabel(prediction.metric)}
                                </span>
                                <div className="flex items-center gap-1">
                                    {getTrendIcon(prediction.trend)}
                                    <span className={`text-xs font-medium ${getTrendColor(prediction.trend)}`}>
                                        {prediction.trend}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {/* Current Value */}
                                <div className="flex justify-between items-baseline">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Current</span>
                                    <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                        {formatValue(prediction.currentValue, prediction.metric)}
                                    </span>
                                </div>

                                {/* Projected Value */}
                                <div className="flex justify-between items-baseline">
                                    <span className="text-xs text-gray-600 dark:text-gray-400">Projected</span>
                                    <span className={`text-sm font-semibold ${getTrendColor(prediction.trend)}`}>
                                        {formatValue(prediction.projectedValue, prediction.metric)}
                                    </span>
                                </div>

                                {/* Goal (if exists) */}
                                {prediction.goalValue && (
                                    <>
                                        <div className="flex justify-between items-baseline">
                                            <span className="text-xs text-gray-600 dark:text-gray-400">Goal</span>
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {formatValue(prediction.goalValue, prediction.metric)}
                                            </span>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="pt-2">
                                            <div className="flex justify-between text-xs mb-1">
                                                <span className="text-gray-600 dark:text-gray-400">Progress to Goal</span>
                                                <span className={`font-semibold ${isOnTrack ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                                                    {progressPercentage.toFixed(0)}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className={`h-2 rounded-full transition-all ${isOnTrack
                                                            ? 'bg-green-500'
                                                            : progressPercentage >= 70
                                                                ? 'bg-yellow-500'
                                                                : 'bg-red-500'
                                                        }`}
                                                    style={{ width: `${Math.min(100, progressPercentage)}%` }}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Confidence */}
                                <div className="pt-2 flex items-center justify-between text-xs">
                                    <span className="text-gray-500 dark:text-gray-400">Confidence</span>
                                    <div className="flex items-center gap-1">
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map((bar) => (
                                                <div
                                                    key={bar}
                                                    className={`w-1 h-3 rounded-sm ${bar <= prediction.confidence * 5
                                                            ? 'bg-blue-500'
                                                            : 'bg-gray-300 dark:bg-gray-600'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-gray-600 dark:text-gray-400 ml-1">
                                            {(prediction.confidence * 100).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
