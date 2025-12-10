import React, { useMemo, useState } from 'react';
import { Campaign } from '../types';
import { TrendingUp, ChevronLeft } from 'lucide-react';
import { generateRevenueForecast, simulateScenario, generateRecommendations, Recommendation } from '../utils/predictionEngine';
import { ForecastChart } from './ForecastChart';
import { ScenarioBuilder } from './ScenarioBuilder';
import { Sparkles, ArrowRight } from 'lucide-react';

interface PredictiveAnalyticsDashboardProps {
    campaigns: Campaign[];
    onBack?: () => void;
}

export const PredictiveAnalyticsDashboard: React.FC<PredictiveAnalyticsDashboardProps> = ({ campaigns, onBack }) => {
    // Default to the first campaign if available
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>(campaigns.length > 0 ? campaigns[0].id : '');
    const [scenarioAdjustments, setScenarioAdjustments] = useState<Record<string, number>>({});
    const [showRecommendations, setShowRecommendations] = useState(false);

    const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

    // Generate forecast data when campaign or scenario changes
    const forecastData = useMemo(() => {
        if (!selectedCampaign) return null;

        const hasAdjustments = Object.values(scenarioAdjustments).some(v => v !== 1);

        if (hasAdjustments) {
            return simulateScenario(selectedCampaign, scenarioAdjustments);
        }
        return generateRevenueForecast(selectedCampaign);
    }, [selectedCampaign, scenarioAdjustments]);

    // Generate recommendations
    const recommendations = useMemo(() => {
        if (!selectedCampaign) return [];
        return generateRecommendations(selectedCampaign);
    }, [selectedCampaign]);

    const handleScenarioChange = (adjustments: Record<string, number>) => {
        setScenarioAdjustments(adjustments);
    };

    const applyRecommendation = (rec: Recommendation) => {
        const newAdjustments = { ...scenarioAdjustments };
        const currentVal = newAdjustments[rec.channel] || 1;
        newAdjustments[rec.channel] = currentVal + rec.percentage;
        setScenarioAdjustments(newAdjustments);
    };

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 p-8 overflow-y-auto">
            {/* Header */}
            <div className="mb-8">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="flex items-center text-sm text-gray-500 hover:text-purple-600 mb-4 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back to Dashboard
                    </button>
                )}

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                            <TrendingUp className="w-8 h-8 text-purple-600" />
                            Predictive Analytics
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">
                            Forecast performance and optimize budget allocation.
                        </p>
                    </div>

                    {/* Campaign Selector */}
                    {campaigns.length > 0 && (
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Select Campaign:
                            </label>
                            <select
                                value={selectedCampaignId}
                                onChange={(e) => {
                                    setSelectedCampaignId(e.target.value);
                                    setScenarioAdjustments({}); // Reset scenario on campaign switch
                                    setShowRecommendations(false);
                                }}
                                className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                            >
                                {campaigns.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {selectedCampaign && forecastData ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Forecast Chart */}
                    <div className="lg:col-span-2 space-y-6">
                        <ForecastChart data={forecastData.forecast} />

                        {/* Forecast Summary Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                <span className="text-sm text-gray-500">Predicted Revenue (Next 3 mo)</span>
                                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                    ${forecastData.totalPredictedRevenue.toLocaleString()}
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                <span className="text-sm text-gray-500">Confidence Score</span>
                                <div className={`text-2xl font-bold mt-1 ${forecastData.confidenceScore > 0.8 ? 'text-green-600' :
                                        forecastData.confidenceScore > 0.6 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                    {(forecastData.confidenceScore * 100).toFixed(0)}%
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                <span className="text-sm text-gray-500">Active Channels</span>
                                <div className="text-2xl font-bold text-purple-600 mt-1">
                                    {/* Display number of channels being scenario adjusted or all */}
                                    {Object.keys(scenarioAdjustments).length > 0 ? Object.keys(scenarioAdjustments).length : 4}
                                </div>
                            </div>
                        </div>

                        {/* AI Recommendations Panel */}
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl border border-purple-100 dark:border-purple-800 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-600" />
                                    AI Optimization Suggestions
                                </h3>
                                <button
                                    onClick={() => setShowRecommendations(!showRecommendations)}
                                    className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                                >
                                    {showRecommendations ? 'Hide Suggestions' : 'Show Suggestions'}
                                </button>
                            </div>

                            {showRecommendations && (
                                <div className="space-y-3">
                                    {recommendations.map(rec => (
                                        <div key={rec.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-purple-100 dark:border-purple-800/50 shadow-sm flex justify-between items-center">
                                            <div>
                                                <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                                                    {rec.channel}
                                                    <span className={`text-xs px-2 py-0.5 rounded ${rec.action === 'INCREASE' ? 'bg-green-100 text-green-700' :
                                                            rec.action === 'DECREASE' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {rec.action} {(rec.percentage * 100).toFixed(0)}%
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {rec.reasoning} <strong className="text-purple-600 ml-1">{rec.impact}</strong>
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => applyRecommendation(rec)}
                                                className="flex items-center gap-1 text-sm bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                Apply <ArrowRight className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                    {recommendations.length === 0 && (
                                        <p className="text-sm text-gray-500 italic">No recommendations available at this time.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Scenario Builder */}
                    <div className="lg:col-span-1">
                        <ScenarioBuilder
                            campaign={selectedCampaign}
                            onScenarioChange={handleScenarioChange}
                        />

                        {/* Current Scenario Summary */}
                        {Object.keys(scenarioAdjustments).length > 0 && (
                            <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-700/50">
                                <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                                    Active Scenario
                                </h4>
                                <ul className="space-y-1">
                                    {Object.entries(scenarioAdjustments).map(([channel, val]) => (
                                        val !== 1 && (
                                            <li key={channel} className="text-xs text-yellow-700 dark:text-yellow-300 flex justify-between">
                                                <span>{channel}</span>
                                                <span className="font-mono">{(val * 100).toFixed(0)}%</span>
                                            </li>
                                        )
                                    ))}
                                </ul>
                                <button
                                    onClick={() => handleScenarioChange({})}
                                    className="w-full mt-3 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 py-1.5 rounded transition-colors"
                                >
                                    Reset Custom Scenario
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center py-12 text-gray-500">
                    No campaigns available.
                </div>
            )}
        </div>
    );
};
