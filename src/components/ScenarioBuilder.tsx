import React, { useState, useEffect } from 'react';
import { Campaign, ChannelType } from '../types';
import { Sliders, RefreshCw, DollarSign } from 'lucide-react';

interface ScenarioBuilderProps {
    campaign: Campaign;
    onScenarioChange: (adjustments: Record<string, number>) => void; // channel -> percentage change (e.g. 1.2 for +20%)
}

export const ScenarioBuilder: React.FC<ScenarioBuilderProps> = ({ campaign, onScenarioChange }) => {
    // Extract unique channels from campaign placements
    const channels = React.useMemo(() => {
        const unique = new Set<string>();
        campaign.flights.forEach(f => f.lines.forEach(l => unique.add(l.channel)));
        // Ensure we have at least some channels for mock data if campaign is empty
        if (unique.size === 0) {
            ['Search', 'Social', 'Display', 'TV'].forEach(c => unique.add(c));
        }
        return Array.from(unique);
    }, [campaign]);

    const [adjustments, setAdjustments] = useState<Record<string, number>>({});

    // Initialize adjustments to 1.0 (no change)
    useEffect(() => {
        const initial: Record<string, number> = {};
        channels.forEach(c => initial[c] = 1.0);
        setAdjustments(initial);
    }, [channels]);

    const handleSliderChange = (channel: string, value: number) => {
        const newAdjustments = { ...adjustments, [channel]: value };
        setAdjustments(newAdjustments);
        onScenarioChange(newAdjustments);
    };

    const handleReset = () => {
        const reset: Record<string, number> = {};
        channels.forEach(c => reset[c] = 1.0);
        setAdjustments(reset);
        onScenarioChange(reset);
    };

    // Calculate total layout impact
    const totalBudgetImpact = Object.values(adjustments).reduce((sum, val) => sum + val, 0) / channels.length;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-purple-600" />
                        Scenario Planner
                    </h3>
                    <p className="text-sm text-gray-500">Adjust channel budgets to simulate outcomes</p>
                </div>
                <button
                    onClick={handleReset}
                    className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                    title="Reset Scenarios"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-6 overflow-y-auto pr-2">
                {channels.map(channel => (
                    <div key={channel}>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {channel}
                            </label>
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded ${(adjustments[channel] || 1) > 1 ? 'bg-green-100 text-green-700' :
                                (adjustments[channel] || 1) < 1 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {((adjustments[channel] || 1) * 100 - 100) > 0 ? '+' : ''}
                                {Math.round((adjustments[channel] || 1) * 100 - 100)}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="3.0"
                            step="0.1"
                            value={adjustments[channel] || 1.0}
                            onChange={(e) => handleSliderChange(channel, parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>0%</span>
                            <span>100%</span>
                            <span>300%</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Total Budget Scale
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-gray-400" />
                        {(totalBudgetImpact * 100).toFixed(0)}%
                    </span>
                </div>
            </div>
        </div>
    );
};
