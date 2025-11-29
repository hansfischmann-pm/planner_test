/**
 * Forecast Card Components for Chat Interface
 * 
 * Renders forecast data as styled cards similar to dashboard metrics
 */

import React from 'react';

export interface ForecastCardData {
    type: 'forecast_cards';
    summary: {
        confidence: 'HIGH' | 'MEDIUM' | 'LOW';
        reach: number;
        overlap: number;
    };
    metrics: {
        impressions: { value: number; min: number; max: number };
        clicks: { value: number; min: number; max: number };
        conversions: { value: number; min: number; max: number };
        spend: { value: number; min: number; max: number };
    };
    insights: {
        seasonal: string;
        recommendations: string[];
    };
}

interface ForecastCardsProps {
    data: ForecastCardData;
}

export const ForecastCards: React.FC<ForecastCardsProps> = ({ data }) => {
    const formatNumber = (num: number): string => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
        return num.toLocaleString();
    };

    const confidenceColor = {
        HIGH: 'text-green-600',
        MEDIUM: 'text-yellow-600',
        LOW: 'text-orange-600'
    };

    return (
        <div className="space-y-4 my-4">
            {/* Summary Card */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-800">📊 Forecast Summary</h3>
                    <span className={`text-sm font-medium ${confidenceColor[data.summary.confidence]}`}>
                        {data.summary.confidence} Confidence
                    </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                        <span className="text-gray-600">Unique Reach</span>
                        <p className="text-lg font-bold text-gray-900">{formatNumber(data.summary.reach)}</p>
                    </div>
                    {data.summary.overlap > 0 && (
                        <div>
                            <span className="text-gray-600">Overlap Corrected</span>
                            <p className="text-lg font-bold text-gray-900">{data.summary.overlap.toFixed(0)}%</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
                {/* Impressions */}
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">👁️</span>
                        <span className="text-xs font-medium text-gray-500 uppercase">Impressions</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                        {formatNumber(data.metrics.impressions.value)}
                    </p>
                    <p className="text-xs text-gray-500">
                        {formatNumber(data.metrics.impressions.min)} - {formatNumber(data.metrics.impressions.max)}
                    </p>
                </div>

                {/* Clicks */}
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🖱️</span>
                        <span className="text-xs font-medium text-gray-500 uppercase">Clicks</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                        {formatNumber(data.metrics.clicks.value)}
                    </p>
                    <p className="text-xs text-gray-500">
                        {formatNumber(data.metrics.clicks.min)} - {formatNumber(data.metrics.clicks.max)}
                    </p>
                </div>

                {/* Conversions */}
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">🎯</span>
                        <span className="text-xs font-medium text-gray-500 uppercase">Conversions</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                        {formatNumber(data.metrics.conversions.value)}
                    </p>
                    <p className="text-xs text-gray-500">
                        {formatNumber(data.metrics.conversions.min)} - {formatNumber(data.metrics.conversions.max)}
                    </p>
                </div>

                {/* Spend */}
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">💰</span>
                        <span className="text-xs font-medium text-gray-500 uppercase">Spend</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">
                        ${formatNumber(data.metrics.spend.value)}
                    </p>
                    <p className="text-xs text-gray-500">
                        ${formatNumber(data.metrics.spend.min)} - ${formatNumber(data.metrics.spend.max)}
                    </p>
                </div>
            </div>

            {/* Insights Card */}
            <div className="bg-gradient-to-br from-orange-50 to-yellow-50 rounded-lg p-4 border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">🌡️</span>
                    <h3 className="font-semibold text-gray-800">Seasonal Impact</h3>
                </div>
                <p className="text-sm text-gray-700">{data.insights.seasonal}</p>
            </div>

            {/* Recommendations */}
            {data.insights.recommendations.length > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">💡</span>
                        <h3 className="font-semibold text-gray-800">Recommendations</h3>
                    </div>
                    <ul className="space-y-2">
                        {data.insights.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="text-blue-500 mt-0.5">•</span>
                                <span>{rec}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
