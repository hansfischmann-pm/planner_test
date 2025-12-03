import React from 'react';
import { Segment } from '../types';
import { X } from 'lucide-react';

interface SegmentPillProps {
    segment: Segment;
    onRemove?: () => void;
    className?: string;
}

export const SegmentPill: React.FC<SegmentPillProps> = ({ segment, onRemove, className = '' }) => {
    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs font-medium border border-purple-100 ${className}`}
            title={`${segment.name} (${segment.category}) - Reach: ${segment.reach ? (segment.reach / 1000000).toFixed(1) + 'M' : 'N/A'}`}
        >
            <span className="truncate max-w-[120px]">{segment.name}</span>
            {onRemove && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}
                    className="hover:bg-purple-100 rounded-full p-0.5 transition-colors"
                >
                    <X className="w-3 h-3" />
                </button>
            )}
        </span>
    );
};
