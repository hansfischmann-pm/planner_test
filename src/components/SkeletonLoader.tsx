import React from 'react';

interface SkeletonLoaderProps {
    variant?: 'table' | 'card' | 'text' | 'chart';
    rows?: number;
    className?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
    variant = 'card',
    rows = 3,
    className = ''
}) => {
    if (variant === 'table') {
        return (
            <div className={`animate-pulse space-y-3 ${className}`}>
                {/* Table Header */}
                <div className="flex gap-4 pb-3 border-b border-gray-200">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex-1 h-4 bg-gray-200 rounded"></div>
                    ))}
                </div>

                {/* Table Rows */}
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="flex gap-4 items-center py-3">
                        {[1, 2, 3, 4, 5].map((j) => (
                            <div
                                key={j}
                                className="flex-1 h-4 bg-gray-200 rounded"
                                style={{ opacity: 1 - (i * 0.1) }}
                            ></div>
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'card') {
        return (
            <div className={`animate-pulse ${className}`}>
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 mb-4">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                            <div className="flex-1 space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (variant === 'chart') {
        return (
            <div className={`animate-pulse bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
                <div className="space-y-3 mb-6">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="flex items-end justify-between gap-2 h-64">
                    {[60, 80, 40, 90, 70, 50, 85].map((height, i) => (
                        <div
                            key={i}
                            className="flex-1 bg-gray-200 rounded-t"
                            style={{ height: `${height}%` }}
                        ></div>
                    ))}
                </div>
            </div>
        );
    }

    // text variant
    return (
        <div className={`animate-pulse space-y-3 ${className}`}>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                </div>
            ))}
        </div>
    );
};
