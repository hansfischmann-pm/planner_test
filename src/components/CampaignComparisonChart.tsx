import React from 'react';
import { Campaign } from '../types';

interface CampaignComparisonChartProps {
    campaigns: Campaign[];
}

export const CampaignComparisonChart: React.FC<CampaignComparisonChartProps> = ({ campaigns }) => {
    // Filter out campaigns with no spend
    const activeCampaigns = campaigns.filter(c => (c.performance?.spend || 0) > 0);

    if (activeCampaigns.length === 0) {
        return (
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                <p className="text-gray-500">No active campaign data to display</p>
            </div>
        );
    }

    // Determine scales
    const maxSpend = Math.max(...activeCampaigns.map(c => c.performance?.spend || 0)) * 1.1;
    const maxRoas = Math.max(...activeCampaigns.map(c => c.performance?.roas || 0)) * 1.1;
    const minRoas = Math.min(0, ...activeCampaigns.map(c => c.performance?.roas || 0)); // Usually 0 base

    const padding = 40;
    const width = 600;
    const height = 300;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    const getX = (spend: number) => padding + (spend / maxSpend) * chartWidth;
    const getY = (roas: number) => height - padding - (roas / maxRoas) * chartHeight;

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Portfolio Efficiency: Spend vs. ROAS</h3>
            <div className="relative w-full overflow-hidden">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                    {/* Grid Lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((tick, i) => (
                        <g key={`y-grid-${i}`}>
                            <line
                                x1={padding}
                                y1={height - padding - tick * chartHeight}
                                x2={width - padding}
                                y2={height - padding - tick * chartHeight}
                                stroke="#e5e7eb"
                                strokeDasharray="4 4"
                            />
                            <text
                                x={padding - 10}
                                y={height - padding - tick * chartHeight + 4}
                                textAnchor="end"
                                className="text-[10px] fill-gray-400"
                            >
                                {(tick * maxRoas).toFixed(1)}x
                            </text>
                        </g>
                    ))}

                    {/* Axes */}
                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#9ca3af" />
                    <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#9ca3af" />

                    {/* X-Axis Labels */}
                    <text x={width / 2} y={height - 5} textAnchor="middle" className="text-xs fill-gray-500 font-medium">Total Spend ($)</text>
                    <text x={10} y={height / 2} transform={`rotate(-90 10 ${height / 2})`} textAnchor="middle" className="text-xs fill-gray-500 font-medium">ROAS (x)</text>

                    {/* Data Points */}
                    {activeCampaigns.map((campaign, i) => {
                        const x = getX(campaign.performance!.spend);
                        const y = getY(campaign.performance!.roas);
                        const radius = 6 + Math.min(10, (campaign.performance!.revenue / 100000)); // Size by revenue

                        return (
                            <g key={campaign.id} className="group cursor-pointer">
                                <circle
                                    cx={x}
                                    cy={y}
                                    r={radius}
                                    fill="rgba(37, 99, 235, 0.6)"
                                    stroke="#2563eb"
                                    strokeWidth="2"
                                    className="transition-all duration-300 group-hover:r-8 group-hover:fill-blue-600"
                                />
                                {/* Tooltip (SVG based for simplicity, though HTML overlay is better for accessibility) */}
                                <g className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <rect x={x + 10} y={y - 30} width="120" height="50" rx="4" fill="rgba(17, 24, 39, 0.9)" />
                                    <text x={x + 20} y={y - 15} className="text-[10px] fill-white font-bold">
                                        {campaign.name.substring(0, 15)}...
                                    </text>
                                    <text x={x + 20} y={y} className="text-[9px] fill-gray-300">
                                        ROAS: {campaign.performance!.roas.toFixed(2)}x
                                    </text>
                                    <text x={x + 20} y={y + 12} className="text-[9px] fill-gray-300">
                                        Spend: ${(campaign.performance!.spend / 1000).toFixed(1)}k
                                    </text>
                                </g>
                            </g>
                        );
                    })}
                </svg>
            </div>
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500 opacity-60"></div>
                    <span>Bubble size = Revenue Volume</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border-2 border-blue-500"></div>
                    <span>Position = Efficiency</span>
                </div>
            </div>
        </div>
    );
};
