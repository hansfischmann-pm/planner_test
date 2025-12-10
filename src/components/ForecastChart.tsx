import React, { useMemo, useState } from 'react';
import { ForecastDataPoint } from '../utils/predictionEngine';
import { TrendingUp, Calendar } from 'lucide-react';

interface ForecastChartProps {
    data: ForecastDataPoint[];
}

export const ForecastChart: React.FC<ForecastChartProps> = ({ data }) => {
    const [hoveredPoint, setHoveredPoint] = useState<ForecastDataPoint | null>(null);

    // Filter valid points
    const actualPoints = useMemo(() => data.filter(d => d.actualRevenue !== null), [data]);
    const predictedPoints = useMemo(() => data.filter(d => d.predictedRevenue !== null), [data]);

    // Connect the last actual point to the first predicted point for continuity
    const connectedPredictedPoints = useMemo(() => {
        const lastActual = actualPoints[actualPoints.length - 1];
        if (lastActual && predictedPoints.length > 0) {
            return [
                { ...lastActual, predictedRevenue: lastActual.actualRevenue, lowerBound: lastActual.actualRevenue, upperBound: lastActual.actualRevenue },
                ...predictedPoints
            ];
        }
        return predictedPoints;
    }, [actualPoints, predictedPoints]);

    // Dimensions
    const width = 800;
    const height = 300;
    const padding = { top: 20, right: 30, bottom: 30, left: 60 };

    // Scales
    const { maxRevenue, xScale, yScale } = useMemo(() => {
        const values = data.map(d => Math.max(d.actualRevenue || 0, d.upperBound || 0));
        const maxRev = Math.max(...values, 1000) * 1.1; // Add 10% headroom

        const xStep = (width - padding.left - padding.right) / (data.length - 1);
        const yRatio = (height - padding.top - padding.bottom) / maxRev;

        return {
            maxRevenue: maxRev,
            xScale: (index: number) => padding.left + index * xStep,
            yScale: (revenue: number) => height - padding.bottom - (revenue * yRatio)
        };
    }, [data]);

    // Path Generators
    const createLinePath = (points: ForecastDataPoint[], valueKey: 'actualRevenue' | 'predictedRevenue') => {
        return points.map((p, i) => {
            // Find global index for correct X position
            const globalIndex = data.findIndex(d => d.date === p.date);
            const x = xScale(globalIndex);
            const y = yScale(p[valueKey] as number);
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
        }).join(' ');
    };

    const createAreaPath = (points: ForecastDataPoint[]) => {
        if (points.length === 0) return '';

        const topPath = points.map(p => {
            const globalIndex = data.findIndex(d => d.date === p.date);
            return `L ${xScale(globalIndex)} ${yScale(p.upperBound as number)}`;
        }).join(' ').replace(/^L/, 'M'); // Start with Move

        const bottomPath = points.slice().reverse().map(p => {
            const globalIndex = data.findIndex(d => d.date === p.date);
            return `L ${xScale(globalIndex)} ${yScale(p.lowerBound as number)}`;
        }).join(' ');

        return `${topPath} ${bottomPath} Z`;
    };

    const actualPath = createLinePath(actualPoints, 'actualRevenue');
    const predictedPath = createLinePath(connectedPredictedPoints, 'predictedRevenue');
    const confidencePath = createAreaPath(connectedPredictedPoints);

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        Revenue Forecast
                    </h3>
                    <p className="text-sm text-gray-500">Historical performance vs. AI projection</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-blue-500"></div>
                        <span className="text-gray-600 dark:text-gray-400">Actual</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-purple-500 border-dashed border-t"></div>
                        <span className="text-gray-600 dark:text-gray-400">Predicted</span>
                    </div>
                </div>
            </div>

            <div className="relative">
                <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map(tick => {
                        const y = padding.top + (height - padding.top - padding.bottom) * tick;
                        const value = maxRevenue * (1 - tick);
                        return (
                            <g key={tick}>
                                <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e5e7eb" strokeDasharray="4 4" />
                                <text x={padding.left - 10} y={y + 4} textAnchor="end" fontSize="10" className="fill-gray-400">
                                    ${(value / 1000).toFixed(0)}k
                                </text>
                            </g>
                        );
                    })}

                    {/* X-Axis Date Labels */}
                    {data.filter((_, i) => i % Math.ceil(data.length / 6) === 0).map((point, i) => {
                        const globalIndex = data.findIndex(d => d.date === point.date);
                        const x = xScale(globalIndex);
                        const isLast = i === Math.floor(data.length / Math.ceil(data.length / 6));

                        return (
                            <g key={point.date}>
                                <text
                                    x={x}
                                    y={height - 10}
                                    textAnchor="middle"
                                    fontSize="10"
                                    className="fill-gray-400"
                                >
                                    {new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </text>
                            </g>
                        );
                    })}

                    {/* Confidence Interval Area */}
                    <path d={confidencePath} fill="rgb(147, 51, 234)" fillOpacity="0.1" />

                    {/* Predicted Line */}
                    <path d={predictedPath} fill="none" stroke="#9333ea" strokeWidth="2" strokeDasharray="5 5" />

                    {/* Actual Line */}
                    <path d={actualPath} fill="none" stroke="#3b82f6" strokeWidth="2" />

                    {/* Hover Overlay */}
                    {data.map((point, i) => {
                        const x = xScale(i);
                        const value = point.actualRevenue ?? point.predictedRevenue ?? 0;
                        const y = yScale(value);

                        return (
                            <rect
                                key={i}
                                x={x - (width / data.length / 2)}
                                y={padding.top}
                                width={width / data.length}
                                height={height - padding.top - padding.bottom}
                                fill="transparent"
                                onMouseEnter={() => setHoveredPoint(point)}
                                onMouseLeave={() => setHoveredPoint(null)}
                                className="cursor-crosshair"
                            />
                        );
                    })}
                </svg>

                {/* Tooltip */}
                {hoveredPoint && (
                    <div className="absolute top-0 right-0 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 text-sm">
                        <div className="flex items-center gap-2 mb-1 text-gray-500">
                            <Calendar className="w-3 h-3" />
                            {new Date(hoveredPoint.date).toLocaleDateString()}
                        </div>
                        {hoveredPoint.actualRevenue !== null ? (
                            <div className="font-semibold text-blue-600">
                                Actual: ${hoveredPoint.actualRevenue.toLocaleString()}
                            </div>
                        ) : (
                            <div className="font-semibold text-purple-600">
                                Predicted: ${Math.round(hoveredPoint.predictedRevenue || 0).toLocaleString()}
                                <div className="text-xs font-normal text-gray-400 mt-1">
                                    Range: ${Math.round(hoveredPoint.lowerBound || 0).toLocaleString()} - ${Math.round(hoveredPoint.upperBound || 0).toLocaleString()}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
