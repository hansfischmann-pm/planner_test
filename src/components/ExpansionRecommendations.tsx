import React from 'react';
import { Segment } from '../types';
import { ExpansionRecommendation } from '../utils/audienceInsights';
import { Target, TrendingDown, TrendingUp, Zap, Plus } from 'lucide-react';

interface ExpansionRecommendationsProps {
    recommendations: ExpansionRecommendation[];
    onAddSegment: (segment: Segment) => void;
}

export const ExpansionRecommendations: React.FC<ExpansionRecommendationsProps> = ({ recommendations, onAddSegment }) => {
    if (recommendations.length === 0) return null;

    const getIcon = (goal: ExpansionRecommendation['goal']) => {
        switch (goal) {
            case 'INCREASE_REACH':
                return TrendingUp;
            case 'REDUCE_CPA':
                return TrendingDown;
            case 'IMPROVE_CVR':
                return Target;
            case 'INCREASE_CONVERSIONS':
                return Zap;
        }
    };

    const getColor = (priority: ExpansionRecommendation['priority']) => {
        switch (priority) {
            case 'HIGH':
                return 'orange';
            case 'MEDIUM':
                return 'blue';
            case 'LOW':
                return 'gray';
        }
    };

    return (
        <div className="space-y-4">
            {recommendations.map((rec, idx) => {
                const Icon = getIcon(rec.goal);
                const color = getColor(rec.priority);

                return (
                    <div
                        key={idx}
                        className={`bg-gradient-to-r from-${color}-50 to-${color}-100 border border-${color}-200 rounded-xl p-6`}
                    >
                        <div className="flex items-start gap-4 mb-4">
                            <div className={`p-3 bg-${color}-200 rounded-xl`}>
                                <Icon className={`w-6 h-6 text-${color}-700`} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-bold text-gray-900">{rec.impact}</h4>
                                    <span className={`px-2 py-0.5 bg-${color}-200 text-${color}-800 text-xs font-semibold rounded-full`}>
                                        {rec.priority}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600">{rec.explanation}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {rec.segments.map((segment, segIdx) => (
                                <div
                                    key={segIdx}
                                    className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1 min-w-0">
                                            <h5 className="font-semibold text-sm text-gray-900 truncate">{segment.name}</h5>
                                            <p className="text-xs text-gray-500">{segment.category}</p>
                                        </div>
                                        <button
                                            onClick={() => onAddSegment(segment)}
                                            className={`ml-2 flex-shrink-0 w-7 h-7 flex items-center justify-center bg-${color}-600 text-white rounded-full hover:bg-${color}-700 transition-colors`}
                                            title="Add this segment"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-600">
                                        <span>{((segment.reach || 0) / 1000000).toFixed(1)}M reach</span>
                                        <span>+${segment.cpmUplift.toFixed(2)} CPM</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
