import React from 'react';
import { Brand } from '../types';
import { BarChart3, TrendingUp, DollarSign, Users, ArrowLeft, Download } from 'lucide-react';

interface AgencyAnalyticsDashboardProps {
    brands: Brand[];
    onBack: () => void;
}

export const AgencyAnalyticsDashboard: React.FC<AgencyAnalyticsDashboardProps> = ({ brands, onBack }) => {
    // Calculate aggregated metrics
    const totalSpend = brands.reduce((sum, brand) => sum + (brand.totalSpend || 0), 0);
    const totalBudget = brands.reduce((sum, brand) => sum + (brand.budget || 0), 0);
    const activeCampaigns = brands.reduce((sum, brand) => sum + (brand.activeCampaigns || 0), 0);

    // Calculate real channel distribution
    const channelMap = new Map<string, number>();
    brands.forEach(brand => {
        // We need to access the full campaign/flight/line structure
        // Since the Brand type in the props might be a summary, we'll assume for this mock
        // that it contains the full structure or we'd need to fetch it.
        // Given the App.tsx structure, 'brands' state contains everything.
        if ((brand as any).campaigns) {
            (brand as any).campaigns.forEach((campaign: any) => {
                campaign.flights.forEach((flight: any) => {
                    flight.lines.forEach((line: any) => {
                        const current = channelMap.get(line.channel) || 0;
                        channelMap.set(line.channel, current + line.totalCost);
                    });
                });
            });
        }
    });

    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-red-500', 'bg-yellow-500', 'bg-indigo-500', 'bg-pink-500'];

    const channelSpend = Array.from(channelMap.entries())
        .map(([channel, amount], index) => ({
            channel,
            amount,
            color: colors[index % colors.length]
        }))
        .sort((a, b) => b.amount - a.amount); // Sort by spend descending

    const handleExport = () => {
        // Simulate .xls export
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Client,Campaigns,Total Spend,Budget,Utilization\n"
            + brands.map(b => `${b.name},${b.activeCampaigns},${b.totalSpend},${b.budget},${((b.totalSpend || 0) / (b.budget || 1) * 100).toFixed(1)}%`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "agency_analytics.csv"); // Using CSV as it's easier to generate client-side, but opens in Excel
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">Agency Analytics</h1>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Top Metrics Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <DollarSign className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Total Spend (YTD)</dt>
                                        <dd>
                                            <div className="text-lg font-medium text-gray-900">${(totalSpend / 1000000).toFixed(1)}M</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <BarChart3 className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Total Budget</dt>
                                        <dd>
                                            <div className="text-lg font-medium text-gray-900">${(totalBudget / 1000000).toFixed(1)}M</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <TrendingUp className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Active Campaigns</dt>
                                        <dd>
                                            <div className="text-lg font-medium text-gray-900">{activeCampaigns}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <Users className="h-6 w-6 text-gray-400" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">Active Clients</dt>
                                        <dd>
                                            <div className="text-lg font-medium text-gray-900">{brands.length}</div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Channel Distribution */}
                <div className="bg-white shadow rounded-lg p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Spend by Channel</h3>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                        >
                            <Download className="h-4 w-4" />
                            Export Data
                        </button>
                    </div>

                    <div className="space-y-4">
                        {channelSpend.map((item) => (
                            <div key={item.channel}>
                                <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-700">{item.channel}</span>
                                    <span className="text-gray-900 font-semibold">${(item.amount / 1000000).toFixed(1)}M</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2.5">
                                    <div
                                        className={`h-2.5 rounded-full ${item.color}`}
                                        style={{ width: `${(item.amount / totalSpend) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Client Breakdown Table */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-200">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Client Performance</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spend</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilization</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaigns</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {brands.map((brand) => (
                                    <tr key={brand.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <img className="h-10 w-10 rounded-full object-contain border border-gray-100" src={brand.logoUrl} alt="" />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            ${(brand.totalSpend || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            ${(brand.budget || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${((brand.totalSpend || 0) / (brand.budget || 1)) > 0.9
                                                ? 'bg-red-100 text-red-800'
                                                : 'bg-green-100 text-green-800'
                                                }`}>
                                                {Math.round(((brand.totalSpend || 0) / (brand.budget || 1)) * 100)}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {brand.activeCampaigns}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
};
