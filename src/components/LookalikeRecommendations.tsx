import React from 'react';
import { Segment } from '../types';
import { LookalikeRecommendation } from '../utils/audienceInsights';
import { Plus, TrendingUp } from 'lucide-react';

interface LookalikeRecommendationsProps {
    recommendations: LookalikeRecommendation[];
    onAddSegment: (segment: Segment) => void;
}

export const LookalikeRecommendations: React.FC<LookalikeRecommendationsProps> = ({ recommendations, onAddSegment }) => {
    if (recommendations.length === 0) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((rec, idx) => (
                <div
                    key={idx}
                    className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{rec.segment.name}</h4>
                            <p className="text-xs text-gray-600 mb-2">{rec.reason}</p>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                                    {rec.matchScore}% match
                                </span>
                                <span className="text-gray-500">{rec.segment.category}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-green-200">
                        <div className="text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                <span>{((rec.segment.reach || 0) / 1000000).toFixed(1)}M reach</span>
                            </div>
                            <div className="mt-1">+${rec.segment.cpmUplift.toFixed(2)} CPM</div>
                        </div>
                        <button
                            onClick={() => onAddSegment(rec.segment)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition-colors"
                        >
                            <Plus className="w-3 h-3" />
                            Add
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
