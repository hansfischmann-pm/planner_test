import React, { useMemo } from 'react';
import { Segment, Placement } from '../types';
import { X, TrendingUp, Target, Lightbulb, Users, Zap } from 'lucide-react';
import {
    calculateUniqueReach,
    calculateOverlapMatrix,
    aggregateSegmentPerformance,
    findLookalikeSegments,
    generateExpansionRecommendations,
    CampaignGoals
} from '../utils/audienceInsights';
import { findOptimalSegmentsToRemove } from '../utils/segmentOptimization';
import { AudienceOverlapChart } from './AudienceOverlapChart';
import { SegmentPerformanceTable } from './SegmentPerformanceTable';
import { LookalikeRecommendations } from './LookalikeRecommendations';
import { ExpansionRecommendations } from './ExpansionRecommendations';
import { SEGMENT_LIBRARY } from '../data/segmentLibrary';

interface AudienceInsightsPanelProps {
    isOpen: boolean;
    onClose: () => void;
    placements: Placement[];
    currentSegments: Segment[];
    goals?: CampaignGoals;
    onAddSegment: (segment: Segment) => void;
    onRemoveSegment: (segment: Segment) => void;
    embedded?: boolean; // When true, renders as inline content without modal overlay
}

export const AudienceInsightsPanel: React.FC<AudienceInsightsPanelProps> = ({
    isOpen,
    onClose,
    embedded = false,
    placements,
    currentSegments,
    goals,
    onAddSegment,
    onRemoveSegment
}) => {
    // Confirmation modal state
    const [showConfirmModal, setShowConfirmModal] = React.useState(false);
    const [segmentToRemove, setSegmentToRemove] = React.useState<{ segment: Segment, avgOverlap: number } | null>(null);

    // Calculate insights
    const uniqueReach = useMemo(() => calculateUniqueReach(currentSegments), [currentSegments]);
    const totalReach = useMemo(() => currentSegments.reduce((sum, s) => sum + (s.reach || 0), 0), [currentSegments]);
    const overlapMatrix = useMemo(() => calculateOverlapMatrix(currentSegments), [currentSegments]);
    const segmentPerformance = useMemo(() => aggregateSegmentPerformance(placements), [placements]);

    // Find best performing segment for lookalike recommendations
    const bestSegment = useMemo(() => {
        if (segmentPerformance.size === 0) return currentSegments[0];

        let best = currentSegments[0];
        let bestROAS = 0;

        segmentPerformance.forEach((perf, segmentId) => {
            if (perf.roas > bestROAS) {
                bestROAS = perf.roas;
                best = perf.segment;
            }
        });

        return best;
    }, [segmentPerformance, currentSegments]);

    const lookalikeRecs = useMemo(() =>
        bestSegment ? findLookalikeSegments(bestSegment, SEGMENT_LIBRARY as Segment[], currentSegments) : [],
        [bestSegment, currentSegments]
    );

    // Calculate current performance for expansion recommendations
    const currentPerformance = useMemo(() => {
        let totalImpressions = 0;
        let totalClicks = 0;
        let totalConversions = 0;
        let totalSpend = 0;

        placements.forEach(p => {
            if (p.performance) {
                totalImpressions += p.performance.impressions || 0;
                totalClicks += p.performance.clicks || 0;
                totalConversions += p.performance.conversions || 0;
            }
            totalSpend += p.totalCost || 0;
        });

        return {
            impressions: totalImpressions,
            clicks: totalClicks,
            conversions: totalConversions,
            ctr: totalImpressions > 0 ? totalClicks / totalImpressions : 0,
            cvr: totalClicks > 0 ? totalConversions / totalClicks : 0,
            cpc: totalClicks > 0 ? totalSpend / totalClicks : 0,
            cpa: totalConversions > 0 ? totalSpend / totalConversions : 0,
            cpm: totalImpressions > 0 ? (totalSpend / totalImpressions) * 1000 : 0,
            roas: totalSpend > 0 ? (totalConversions * 50) / totalSpend : 0,
            status: 'ACTIVE' as const
        };
    }, [placements]);

    const expansionRecs = useMemo(() =>
        goals ? generateExpansionRecommendations(currentSegments, goals, currentPerformance, SEGMENT_LIBRARY as Segment[]) : [],
        [currentSegments, goals, currentPerformance]
    );

    if (!isOpen) return null;

    const reachEfficiency = totalReach > 0 ? (uniqueReach / totalReach) * 100 : 0;

    // Embedded mode: render as inline content without modal overlay
    if (embedded) {
        return (
            <div className="h-full flex flex-col bg-white">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-6 h-6 text-purple-600" />
                        Audience Insights
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Analyzing {currentSegments.length} segment{currentSegments.length !== 1 ? 's' : ''} across {placements.length} placement{placements.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                            <div className="text-xs text-blue-700 font-semibold uppercase tracking-wider mb-1">Total Reach</div>
                            <div className="text-2xl font-bold text-gray-900">
                                {(totalReach / 1000000).toFixed(1)}M
                            </div>
                            <div className="text-xs text-blue-600">Combined audience</div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                            <div className="text-xs text-purple-700 font-semibold uppercase tracking-wider mb-1">Unique Reach</div>
                            <div className="text-2xl font-bold text-gray-900">
                                {(uniqueReach / 1000000).toFixed(1)}M
                            </div>
                            <div className="text-xs text-purple-600">After deduplication</div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 rounded-lg border border-green-200">
                            <div className="text-xs text-green-700 font-semibold uppercase tracking-wider mb-1">Efficiency</div>
                            <div className="text-2xl font-bold text-gray-900">
                                {reachEfficiency.toFixed(0)}%
                            </div>
                            <div className="text-xs text-green-600">Unique vs total</div>
                        </div>
                    </div>

                    {/* Audience Overlap */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Target className="w-4 h-4 text-purple-600" />
                            Audience Overlap
                        </h3>
                        {currentSegments.length > 0 ? (
                            <AudienceOverlapChart
                                segments={currentSegments}
                                overlapMatrix={overlapMatrix}
                            />
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No segments selected</p>
                        )}
                    </div>

                    {/* Segment Performance */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            Segment Performance
                        </h3>
                        <SegmentPerformanceTable
                            segmentPerformance={segmentPerformance}
                        />
                    </div>

                    {/* Lookalike Recommendations */}
                    {lookalikeRecs.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Lightbulb className="w-4 h-4 text-yellow-600" />
                                Similar Segments
                            </h3>
                            <LookalikeRecommendations
                                recommendations={lookalikeRecs}
                                onAddSegment={onAddSegment}
                            />
                        </div>
                    )}

                    {/* Expansion Recommendations */}
                    {expansionRecs.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                            <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-orange-600" />
                                Expansion Opportunities
                            </h3>
                            <ExpansionRecommendations
                                recommendations={expansionRecs}
                                onAddSegment={onAddSegment}
                            />
                        </div>
                    )}
                </div>

                {/* Confirmation Modal */}
                {showConfirmModal && segmentToRemove && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 z-10 flex items-center justify-center p-4">
                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Remove Segment?</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Remove <span className="font-medium">{segmentToRemove.segment.name}</span> from all placements?
                                This segment has {(segmentToRemove.avgOverlap * 100).toFixed(0)}% average overlap with other segments.
                            </p>
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => {
                                        setShowConfirmModal(false);
                                        setSegmentToRemove(null);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        onRemoveSegment(segmentToRemove.segment);
                                        setShowConfirmModal(false);
                                        setSegmentToRemove(null);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Modal mode: full-screen overlay
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-purple-50 to-blue-50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-7 h-7 text-purple-600" />
                            Audience Insights
                        </h2>
                        <p className="text-gray-600 mt-1">
                            Analyzing {currentSegments.length} segment{currentSegments.length !== 1 ? 's' : ''} across {placements.length} placement{placements.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
                            <div className="text-sm text-blue-700 font-semibold uppercase tracking-wider mb-2">Total Reach</div>
                            <div className="text-3xl font-bold text-gray-900">
                                {(totalReach / 1000000).toFixed(1)}M
                            </div>
                            <div className="text-xs text-blue-600 mt-1">Combined audience size</div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
                            <div className="text-sm text-purple-700 font-semibold uppercase tracking-wider mb-2">Unique Reach</div>
                            <div className="text-3xl font-bold text-gray-900">
                                {(uniqueReach / 1000000).toFixed(1)}M
                            </div>
                            <div className="text-xs text-purple-600 mt-1">After deduplication</div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
                            <div className="text-sm text-green-700 font-semibold uppercase tracking-wider mb-2">Efficiency</div>
                            <div className="text-3xl font-bold text-gray-900">
                                {reachEfficiency.toFixed(0)}%
                            </div>
                            <div className={`text-xs mt-1 font-semibold ${reachEfficiency > 75 ? 'text-green-600' :
                                reachEfficiency > 50 ? 'text-yellow-600' :
                                    'text-orange-600'
                                }`}>
                                {reachEfficiency > 75 ? '✓ Excellent - Low overlap' :
                                    reachEfficiency > 50 ? '○ Good - Moderate overlap' :
                                        '⚠ High duplication'}
                            </div>
                        </div>

                        {/* Optimization Alert */}
                        {reachEfficiency < 50 && currentSegments.length > 1 && (
                            <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-6 shadow-lg">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="p-3 bg-orange-200 rounded-xl flex-shrink-0">
                                        <Target className="w-6 h-6 text-orange-700" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-bold text-orange-900 mb-2 text-lg">
                                            ⚠️ High Audience Overlap Detected
                                        </h4>
                                        <p className="text-sm text-orange-800 mb-4">
                                            Your segments have {(100 - reachEfficiency).toFixed(0)}% overlap.
                                            You're paying multiple CPM uplifts to reach the same users.
                                        </p>
                                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                            <p className="text-xs text-blue-800">
                                                <strong>💡 How it works:</strong> Auto-Optimize runs multiple rounds of analysis to find ALL segments that should be removed to maximize efficiency.
                                            </p>
                                        </div>

                                        {/* Show most overlapping segments */}
                                        <div className="bg-white rounded-lg p-4 mb-4 border border-orange-200">
                                            <p className="text-xs font-semibold text-gray-700 mb-2">Most Overlapping Segments:</p>
                                            <div className="space-y-2">
                                                {currentSegments.slice(0, 3).map((segment, idx) => {
                                                    // Calculate average overlap for this segment
                                                    let avgOverlap = 0;
                                                    currentSegments.forEach((otherSeg, otherIdx) => {
                                                        if (idx !== otherIdx) {
                                                            avgOverlap += overlapMatrix[idx]?.[otherIdx] || 0;
                                                        }
                                                    });
                                                    avgOverlap = avgOverlap / (currentSegments.length - 1);

                                                    return (
                                                        <div key={segment.id} className="flex items-center justify-between text-sm">
                                                            <div className="flex items-center gap-2">
                                                                <div className={`w-2 h-2 rounded-full ${avgOverlap > 0.5 ? 'bg-red-500' :
                                                                    avgOverlap > 0.3 ? 'bg-orange-500' :
                                                                        'bg-yellow-500'
                                                                    }`}></div>
                                                                <span className="font-medium text-gray-900">{segment.name}</span>
                                                            </div>
                                                            <span className="text-xs text-gray-600">
                                                                {(avgOverlap * 100).toFixed(0)}% avg overlap
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => {
                                                    // Run optimization iteratively to find ALL segments to remove
                                                    const allSegmentsToRemove: { segment: Segment, avgOverlap: number, round: number }[] = [];
                                                    let testSegments = [...currentSegments];
                                                    let round = 1;
                                                    const maxRounds = 10; // Safety limit

                                                    // Keep optimizing until no more improvements
                                                    while (round <= maxRounds) {
                                                        const optimalRemovals = findOptimalSegmentsToRemove(testSegments, 5);

                                                        if (optimalRemovals.length === 0) {
                                                            // No more optimizations possible
                                                            break;
                                                        }

                                                        // Calculate overlap for these removals
                                                        optimalRemovals.forEach(segment => {
                                                            const idx = testSegments.findIndex(s => s.id === segment.id);
                                                            if (idx >= 0) {
                                                                const currentMatrix = calculateOverlapMatrix(testSegments);
                                                                let avgOverlap = 0;
                                                                testSegments.forEach((_, otherIdx) => {
                                                                    if (idx !== otherIdx) {
                                                                        avgOverlap += currentMatrix[idx]?.[otherIdx] || 0;
                                                                    }
                                                                });
                                                                avgOverlap = avgOverlap / (testSegments.length - 1);

                                                                allSegmentsToRemove.push({ segment, avgOverlap, round });
                                                                // Remove from test set for next iteration
                                                                testSegments = testSegments.filter(s => s.id !== segment.id);
                                                            }
                                                        });

                                                        round++;
                                                    }

                                                    if (allSegmentsToRemove.length > 0) {
                                                        // Show all segments that should be removed
                                                        const simplified = allSegmentsToRemove.map(item => ({
                                                            segment: item.segment,
                                                            avgOverlap: item.avgOverlap
                                                        }));
                                                        setSegmentToRemove(simplified as any);
                                                        setShowConfirmModal(true);
                                                    } else {
                                                        alert('✓ Your segment mix is already optimized!\n\nNo removals would improve reach efficiency.');
                                                    }
                                                }}
                                                className="w-full px-4 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors text-sm flex items-center justify-center gap-2"
                                            >
                                                <Zap className="w-4 h-4" />
                                                Auto-Optimize: Remove Highest Overlap Segment
                                            </button>

                                            <button
                                                onClick={() => {
                                                    const lookalikeSection = document.querySelector('[data-section="lookalike"]');
                                                    lookalikeSection?.scrollIntoView({ behavior: 'smooth' });
                                                }}
                                                className="w-full px-4 py-3 bg-white border-2 border-orange-600 text-orange-700 font-semibold rounded-lg hover:bg-orange-50 transition-colors text-sm"
                                            >
                                                Browse Alternative Segments →
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Overlap Visualization */}
                    {currentSegments.length >= 2 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Target className="w-5 h-5 text-purple-600" />
                                <h3 className="text-lg font-bold text-gray-900">Audience Overlap</h3>
                            </div>
                            <AudienceOverlapChart
                                segments={currentSegments}
                                overlapMatrix={overlapMatrix}
                                onRemoveSegment={onRemoveSegment}
                            />
                        </section>
                    )}

                    {/* Performance Comparison */}
                    {segmentPerformance.size > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                <h3 className="text-lg font-bold text-gray-900">Segment Performance</h3>
                            </div>
                            <SegmentPerformanceTable
                                segmentPerformance={segmentPerformance}
                            />
                        </section>
                    )}

                    {/* Expansion Recommendations */}
                    {expansionRecs.length > 0 && (
                        <section>
                            <div className="flex items-center gap-2 mb-4">
                                <Lightbulb className="w-5 h-5 text-orange-600" />
                                <h3 className="text-lg font-bold text-gray-900">Expansion Opportunities</h3>
                            </div>
                            <ExpansionRecommendations
                                recommendations={expansionRecs}
                                onAddSegment={onAddSegment}
                            />
                        </section>
                    )}

                    {/* Lookalike Recommendations */}
                    {lookalikeRecs.length > 0 && bestSegment && (
                        <section data-section="lookalike">
                            <div className="flex items-center gap-2 mb-4">
                                <Users className="w-5 h-5 text-green-600" />
                                <h3 className="text-lg font-bold text-gray-900">
                                    Similar to "{bestSegment.name}"
                                </h3>
                            </div>
                            <LookalikeRecommendations
                                recommendations={lookalikeRecs}
                                onAddSegment={onAddSegment}
                            />
                        </section>
                    )}

                    {/* Empty State */}
                    {currentSegments.length === 0 && (
                        <div className="text-center py-12">
                            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Segments Selected</h3>
                            <p className="text-gray-500">Add segments to your placements to view insights and recommendations.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>


            {/* Confirmation Modal */}
            {showConfirmModal && segmentToRemove && (
                <div className="fixed inset-0 bg-black bg-opacity-70 z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 animate-scale-in max-h-[80vh] flex flex-col">
                        <div className="flex items-start gap-4 mb-6">
                            <div className="p-3 bg-orange-100 rounded-xl">
                                <Target className="w-8 h-8 text-orange-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Complete Optimization</h3>
                                <p className="text-sm text-gray-600">
                                    {Array.isArray(segmentToRemove)
                                        ? `Removing these ${segmentToRemove.length} segment${segmentToRemove.length > 1 ? 's' : ''} will fully optimize your reach efficiency:`
                                        : 'Remove this segment to improve reach efficiency:'}
                                </p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto mb-6">
                            {Array.isArray(segmentToRemove) ? (
                                <>
                                    {/* Select All Checkbox */}
                                    <div className="mb-3 pb-3 border-b border-gray-200">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                defaultChecked
                                                className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                                                onChange={(e) => {
                                                    const checkboxes = document.querySelectorAll('input[data-segment-id]');
                                                    checkboxes.forEach((cb: any) => {
                                                        cb.checked = e.target.checked;
                                                    });
                                                }}
                                            />
                                            <span className="font-semibold text-gray-700 text-sm">
                                                Select All ({segmentToRemove.length} segments)
                                            </span>
                                        </label>
                                    </div>

                                    <div className="space-y-2">
                                        {segmentToRemove.map((item: any, idx: number) => (
                                            <label
                                                key={item.segment.id}
                                                className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 cursor-pointer transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    defaultChecked
                                                    className="w-5 h-5 text-orange-600 rounded focus:ring-2 focus:ring-orange-500"
                                                    data-segment-id={item.segment.id}
                                                />
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-semibold text-gray-900">{item.segment.name}</span>
                                                        <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs font-bold rounded-full">
                                                            {(item.avgOverlap * 100).toFixed(0)}% overlap
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="text-gray-600">{item.segment.category}</span>
                                                        <span className="text-gray-500">+${item.segment.cpmUplift.toFixed(2)} CPM</span>
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-semibold text-gray-900">{segmentToRemove.segment.name}</span>
                                        <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs font-bold rounded-full">
                                            {(segmentToRemove.avgOverlap * 100).toFixed(0)}% overlap
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600">{segmentToRemove.segment.category}</p>
                                </div>
                            )}
                        </div>

                        <p className="text-sm text-gray-600 mb-6">
                            Selected segments will be removed from <strong>all placements</strong>. This will improve reach efficiency and reduce costs.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setSegmentToRemove(null);
                                }}
                                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    if (Array.isArray(segmentToRemove)) {
                                        // Get checked segments
                                        const checkboxes = document.querySelectorAll('input[data-segment-id]:checked');
                                        const selectedIds = Array.from(checkboxes).map((cb: any) => cb.dataset.segmentId);

                                        const removedCount = selectedIds.length;

                                        // Remove each selected segment
                                        segmentToRemove.forEach((item: any) => {
                                            if (selectedIds.includes(item.segment.id)) {
                                                onRemoveSegment(item.segment);
                                            }
                                        });

                                        // Close modal but NOT the insights panel initially
                                        setShowConfirmModal(false);
                                        setSegmentToRemove(null);

                                        // Show success notification and close panel
                                        setTimeout(() => {
                                            alert(`✅ Optimization Complete!\n\nRemoved ${removedCount} segment${removedCount > 1 ? 's' : ''} to maximize reach efficiency.\n\nYour plan is now fully optimized.`);
                                            onClose(); // Close panel since optimization is done
                                        }, 100);
                                    } else {
                                        onRemoveSegment(segmentToRemove.segment);
                                        setShowConfirmModal(false);
                                        setSegmentToRemove(null);
                                    }
                                }}
                                className="flex-1 px-4 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Zap className="w-4 h-4" />
                                {Array.isArray(segmentToRemove) ? 'Remove Selected' : 'Optimize Now'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
