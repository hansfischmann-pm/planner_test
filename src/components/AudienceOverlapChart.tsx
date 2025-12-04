import React from 'react';
import { X } from 'lucide-react';
import { Segment } from '../types';

interface AudienceOverlapChartProps {
    segments: Segment[];
    overlapMatrix: number[][];
    onRemoveSegment?: (segment: Segment) => void;
}

export const AudienceOverlapChart: React.FC<AudienceOverlapChartProps> = ({ segments, overlapMatrix, onRemoveSegment }) => {
    if (segments.length < 2) return null;

    // For 2-3 segments, show a visual representation
    // For 4+ segments, show a heatmap matrix
    const useHeatmap = segments.length > 3;

    if (useHeatmap) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr>
                                <th className="p-2 text-left text-xs font-semibold text-gray-600"></th>
                                {segments.map((seg, idx) => (
                                    <th key={idx} className="p-2 text-center text-xs font-semibold text-gray-600">
                                        <div className="flex flex-col items-center gap-1">
                                            <span>{seg.name.substring(0, 15)}{seg.name.length > 15 ? '...' : ''}</span>
                                            {onRemoveSegment && (
                                                <button
                                                    onClick={() => onRemoveSegment(seg)}
                                                    className="p-1 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded-full transition-colors"
                                                    title={`Remove ${seg.name}`}
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {segments.map((rowSeg, rowIdx) => (
                                <tr key={rowIdx}>
                                    <td className="p-2 text-xs font-semibold text-gray-700">
                                        <div className="flex items-center justify-between gap-2">
                                            <span>{rowSeg.name.substring(0, 15)}{rowSeg.name.length > 15 ? '...' : ''}</span>
                                            {onRemoveSegment && (
                                                <button
                                                    onClick={() => onRemoveSegment(rowSeg)}
                                                    className="p-1 hover:bg-red-100 text-gray-400 hover:text-red-600 rounded-full transition-colors"
                                                    title={`Remove ${rowSeg.name}`}
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    {segments.map((colSeg, colIdx) => {
                                        const overlap = overlapMatrix[rowIdx][colIdx];
                                        const intensity = Math.floor(overlap * 100);
                                        const bgColor = rowIdx === colIdx
                                            ? 'bg-gray-100'
                                            : `bg-purple-${Math.min(900, Math.max(100, Math.floor(intensity / 10) * 100))}`;

                                        return (
                                            <td
                                                key={colIdx}
                                                className={`p-2 text-center text-xs font-semibold border border-gray-200 ${rowIdx === colIdx ? 'bg-gray-100 text-gray-400' : ''
                                                    }`}
                                                style={rowIdx !== colIdx ? {
                                                    backgroundColor: `rgba(147, 51, 234, ${overlap * 0.8})`,
                                                    color: overlap > 0.5 ? 'white' : 'black'
                                                } : undefined}
                                                title={`${Math.round(overlap * 100)}% overlap`}
                                            >
                                                {rowIdx === colIdx ? '—' : `${Math.round(overlap * 100)}%`}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Legend */}
                <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-semibold text-gray-700">Overlap Level:</span>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                                <div className="w-4 h-4 bg-purple-100 border border-gray-300 rounded"></div>
                                <span className="text-xs text-gray-600">Low (0-25%)</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-4 h-4 bg-purple-400 border border-gray-300 rounded"></div>
                                <span className="text-xs text-gray-600">Medium (25-50%)</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-4 h-4 bg-purple-700 border border-gray-300 rounded"></div>
                                <span className="text-xs text-gray-600">High (50-75%)</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-4 h-4 bg-purple-900 border border-gray-300 rounded"></div>
                                <span className="text-xs text-gray-600">Very High (75%+)</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-800">
                        <strong>💡 Insight:</strong> Darker colors indicate higher overlap between segments (more duplication).
                        Lower overlap is generally better for reach efficiency, as you're not paying multiple times to reach the same users.
                    </p>
                </div>
            </div>
        );
    }

    // Simple Venn-style visualization for 2-3 segments
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center justify-center gap-8 py-8">
                {segments.slice(0, 3).map((seg, idx) => {
                    const overlap = idx > 0 ? overlapMatrix[0][idx] : 0;
                    const overlapPct = Math.round(overlap * 100);

                    return (
                        <div key={idx} className="relative">
                            <div
                                className={`w-32 h-32 rounded-full border-4 ${idx === 0 ? 'border-purple-500 bg-purple-100' :
                                    idx === 1 ? 'border-blue-500 bg-blue-100' :
                                        'border-green-500 bg-green-100'
                                    } flex items-center justify-center`}
                                style={{
                                    opacity: 0.7,
                                    marginLeft: idx > 0 ? '-32px' : '0'
                                }}
                            >
                                <div className="text-center px-2">
                                    <div className="text-xs font-semibold text-gray-700 line-clamp-2">
                                        {seg.name}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {((seg.reach || 0) / 1000000).toFixed(1)}M
                                    </div>
                                </div>
                            </div>
                            {idx > 0 && (
                                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-semibold text-purple-600 bg-white px-2 py-1 rounded-full border border-purple-200">
                                    {overlapPct}% overlap
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            <div className="mt-8 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800">
                    <strong>💡 Insight:</strong> Circle overlap shows audience duplication. Lower overlap percentages mean
                    you're reaching more unique users, which is generally more cost-efficient.
                </p>
            </div>
        </div>
    );
};
