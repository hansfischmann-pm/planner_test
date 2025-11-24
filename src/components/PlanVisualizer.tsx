import React from 'react';
import { MediaPlan } from '../types';
import { BarChart3, PieChart, DollarSign, Calendar } from 'lucide-react';

interface PlanVisualizerProps {
    mediaPlan: MediaPlan | null;
}

export const PlanVisualizer: React.FC<PlanVisualizerProps> = ({ mediaPlan }) => {
    if (!mediaPlan) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gray-50 p-8">
                <BarChart3 className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">No Active Plan</p>
                <p className="text-sm">Start a conversation to generate a media plan.</p>
            </div>
        );
    }

    const { campaign, totalSpend, remainingBudget } = mediaPlan;

    return (
        <div className="h-full flex flex-col bg-gray-50 overflow-hidden">
            {/* Header Stats */}
            <div className="bg-white p-6 border-b border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {campaign.startDate} - {campaign.endDate}</span>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">Draft</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Total Budget</p>
                        <p className="text-2xl font-bold text-gray-900">${campaign.budget.toLocaleString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 mb-1 text-blue-600">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase">Planned Spend</span>
                        </div>
                        <p className="text-xl font-bold text-blue-900">${totalSpend.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                        <div className="flex items-center gap-2 mb-1 text-purple-600">
                            <PieChart className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase">Remaining</span>
                        </div>
                        <p className="text-xl font-bold text-purple-900">${remainingBudget.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                        <div className="flex items-center gap-2 mb-1 text-orange-600">
                            <BarChart3 className="w-4 h-4" />
                            <span className="text-xs font-semibold uppercase">Placements</span>
                        </div>
                        <p className="text-xl font-bold text-orange-900">{campaign.placements.length}</p>
                    </div>
                </div>
            </div>

            {/* Placements Table */}
            <div className="flex-1 overflow-auto p-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-gray-700">Channel</th>
                                <th className="px-6 py-3 font-semibold text-gray-700">Vendor / Unit</th>
                                <th className="px-6 py-3 font-semibold text-gray-700">Dates</th>
                                <th className="px-6 py-3 font-semibold text-gray-700 text-right">Rate</th>
                                <th className="px-6 py-3 font-semibold text-gray-700 text-right">Quantity</th>
                                <th className="px-6 py-3 font-semibold text-gray-700 text-right">Total Cost</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {campaign.placements.map((p) => (
                                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${p.channel === 'Search' ? 'bg-blue-100 text-blue-800' :
                                                p.channel === 'Social' ? 'bg-pink-100 text-pink-800' :
                                                    'bg-gray-100 text-gray-800'}`}>
                                            {p.channel}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-gray-900">{p.vendor}</div>
                                        <div className="text-gray-500 text-xs">{p.adUnit}</div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 text-xs">
                                        {p.startDate} <br /> to {p.endDate}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        ${p.rate.toLocaleString()} <span className="text-gray-400 text-xs">/{p.costMethod}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono">
                                        {p.quantity.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-right font-medium text-gray-900">
                                        ${p.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                    </td>
                                </tr>
                            ))}
                            {campaign.placements.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        No placements generated yet. Ask the agent to create some!
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
