import React from 'react';
import { Placement, Creative } from '../types';
import { Trophy, TrendingUp, MousePointer, Image as ImageIcon, Film, Trash2 } from 'lucide-react';

interface CreativePerformanceCardProps {
    placement: Placement;
    onDelete?: (creativeId: string) => void;
}

export const CreativePerformanceCard: React.FC<CreativePerformanceCardProps> = ({ placement, onDelete }) => {
    const creatives = placement.creatives || [];
    const [previewCreative, setPreviewCreative] = React.useState<Creative | null>(null);

    if (creatives.length === 0) {
        return (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center text-gray-500 text-sm">
                No creatives assigned to this placement.
            </div>
        );
    }

    // Find best performer based on CTR
    const bestPerformer = [...creatives].sort((a, b) => (b.metrics?.ctr || 0) - (a.metrics?.ctr || 0))[0];
    const maxCtr = Math.max(...creatives.map(c => c.metrics?.ctr || 0));

    return (
        <>
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <TrendingUp size={16} className="text-blue-600" />
                        Creative Performance
                    </h3>
                    <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                        {placement.rotationMode || 'OPTIMIZED'} Rotation
                    </span>
                </div>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {creatives.map(creative => {
                        const isWinner = creative.id === bestPerformer.id;
                        const ctr = creative.metrics?.ctr || 0;
                        const ctrPercent = (ctr * 100).toFixed(2);
                        const relativePerformance = maxCtr > 0 ? (ctr / maxCtr) * 100 : 0;

                        return (
                            <div key={creative.id} className={`relative p-3 rounded-lg border ${isWinner ? 'border-yellow-200 bg-yellow-50/50' : 'border-gray-100 hover:border-gray-200'} group`}>
                                <div className="flex gap-3">
                                    {/* Thumbnail */}
                                    <div
                                        className="w-16 h-12 bg-gray-100 rounded overflow-hidden shrink-0 relative cursor-pointer hover:opacity-90 transition-opacity"
                                        onClick={() => setPreviewCreative(creative)}
                                    >
                                        {creative.type === 'VIDEO' ? (
                                            <video src={creative.url} className="w-full h-full object-cover" />
                                        ) : (
                                            <img src={creative.url} alt={creative.name} className="w-full h-full object-cover" />
                                        )}
                                        {isWinner && (
                                            <div className="absolute top-0 right-0 bg-yellow-400 text-white p-0.5 rounded-bl shadow-sm">
                                                <Trophy size={10} fill="currentColor" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
                                            <ImageIcon size={16} className="text-white opacity-0 group-hover:opacity-100 drop-shadow-md" />
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                {creative.type === 'VIDEO' ? <Film size={12} className="text-gray-400" /> : <ImageIcon size={12} className="text-gray-400" />}
                                                <span
                                                    className="text-sm font-medium text-gray-900 truncate cursor-pointer hover:text-blue-600 hover:underline"
                                                    title={creative.name}
                                                    onClick={() => setPreviewCreative(creative)}
                                                >
                                                    {creative.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs">
                                                <span className="flex items-center gap-1 text-gray-600" title="Click Through Rate">
                                                    <MousePointer size={10} />
                                                    {ctrPercent}%
                                                </span>
                                                <span className="font-medium text-gray-900">
                                                    {creative.metrics?.conversions || 0} Conv
                                                </span>
                                            </div>
                                        </div>

                                        {/* Performance Bar */}
                                        <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${isWinner ? 'bg-yellow-400' : 'bg-blue-500'}`}
                                                style={{ width: `${relativePerformance}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Delete Button */}
                                    {onDelete && (
                                        <button
                                            onClick={() => onDelete(creative.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                            title="Remove creative"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Preview Modal */}
            {previewCreative && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setPreviewCreative(null)}>
                    <div className="relative max-w-4xl w-full max-h-[90vh] bg-transparent flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        {previewCreative.type === 'VIDEO' ? (
                            <video src={previewCreative.url} controls autoPlay className="max-w-full max-h-[80vh] rounded-lg shadow-2xl" />
                        ) : (
                            <img src={previewCreative.url} alt={previewCreative.name} className="max-w-full max-h-[80vh] rounded-lg shadow-2xl object-contain" />
                        )}
                        <div className="mt-4 text-white text-center">
                            <h3 className="text-lg font-medium">{previewCreative.name}</h3>
                            <p className="text-sm text-gray-300 uppercase tracking-wider">{previewCreative.type} • {previewCreative.dimensions || 'Unknown Size'}</p>
                        </div>
                        <button
                            onClick={() => setPreviewCreative(null)}
                            className="absolute -top-12 right-0 text-white/70 hover:text-white p-2"
                        >
                            <span className="sr-only">Close</span>
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};
