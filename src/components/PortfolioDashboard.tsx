import React from 'react';
import { Portfolio } from '../types';
import { DollarSign, TrendingUp, PieChart, ArrowRight, Activity } from 'lucide-react';
import { CampaignComparisonChart } from './CampaignComparisonChart';
import { BudgetOptimizer } from './BudgetOptimizer';
import { UnifiedReportView } from './UnifiedReportView';
import { EmptyState } from './EmptyState';

interface PortfolioDashboardProps {
    portfolio: Portfolio;
    onSelectCampaign: (campaignId: string) => void;
}

export const PortfolioDashboard: React.FC<PortfolioDashboardProps> = ({ portfolio, onSelectCampaign }) => {
    // State for local portfolio updates (simulation)
    const [localPortfolio, setLocalPortfolio] = React.useState(portfolio);
    const [activeTab, setActiveTab] = React.useState<'OVERVIEW' | 'REPORT'>('OVERVIEW');

    const handleBudgetShift = (sourceId: string, targetId: string, amount: number) => {
        const updatedCampaigns = localPortfolio.campaigns.map(c => {
            if (c.id === sourceId) return { ...c, budget: c.budget - amount };
            if (c.id === targetId) return { ...c, budget: c.budget + amount };
            return c;
        });
        setLocalPortfolio({ ...localPortfolio, campaigns: updatedCampaigns });
    };

    const formatCurrency = (value: number) => {
        if (value == null || isNaN(value)) return '$0';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(value);
    };

    const safeRatio = (numerator: number, denominator: number): number => {
        if (!numerator || !denominator || denominator === 0) return 0;
        return (numerator / denominator) * 100;
    };

    // Handle empty portfolio
    if (!localPortfolio.campaigns || localPortfolio.campaigns.length === 0) {
        return (
            <div className="space-y-8 p-6 max-w-7xl mx-auto">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{localPortfolio.name || 'Portfolio'}</h1>
                    <p className="text-gray-500 mt-1">Portfolio Overview</p>
                </div>
                <EmptyState
                    variant="no-campaigns"
                    title="No Campaigns in Portfolio"
                    description="This portfolio doesn't have any campaigns yet. Create your first campaign to get started."
                />
            </div>
        );
    }

    return (
        <div className="space-y-8 p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{localPortfolio.name}</h1>
                    <p className="text-gray-500 mt-1">Portfolio Overview • {localPortfolio.campaigns.length} Active Campaigns</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-gray-100 p-1 rounded-lg flex items-center">
                        <button
                            onClick={() => setActiveTab('OVERVIEW')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'OVERVIEW' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Overview
                        </button>
                        <button
                            onClick={() => setActiveTab('REPORT')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'REPORT' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Detailed Report
                        </button>
                    </div>
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm">
                        + New Campaign
                    </button>
                </div>
            </div>

            {activeTab === 'OVERVIEW' ? (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <DollarSign className="w-6 h-6 text-blue-600" />
                                </div>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spend</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{formatCurrency(localPortfolio.totalSpend)}</div>
                            <div className="mt-2 text-sm text-gray-500">
                                of {formatCurrency(localPortfolio.totalBudget)} budget
                            </div>
                            <div className="mt-3 w-full bg-gray-100 rounded-full h-2">
                                <div
                                    className="bg-blue-600 h-2 rounded-full"
                                    style={{ width: `${Math.min(100, safeRatio(localPortfolio.totalSpend, localPortfolio.totalBudget))}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <TrendingUp className="w-6 h-6 text-green-600" />
                                </div>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{formatCurrency(localPortfolio.totalRevenue)}</div>
                            <div className="mt-2 flex items-center text-sm text-green-600 font-medium">
                                <Activity className="w-4 h-4 mr-1" />
                                +12.5% vs last period
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-purple-100 rounded-lg">
                                    <PieChart className="w-6 h-6 text-purple-600" />
                                </div>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Portfolio ROAS</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{(localPortfolio.roas || 0).toFixed(2)}x</div>
                            <div className="mt-2 text-sm text-gray-500">
                                Target: 2.50x
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 bg-orange-100 rounded-lg">
                                    <Activity className="w-6 h-6 text-orange-600" />
                                </div>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active Channels</span>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">7</div>
                            <div className="mt-2 text-sm text-gray-500">
                                Across {localPortfolio.campaigns.length} campaigns
                            </div>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <CampaignComparisonChart campaigns={localPortfolio.campaigns} />
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">Budget Allocation</h3>
                            <div className="space-y-4">
                                {localPortfolio.campaigns.map(campaign => (
                                    <div key={campaign.id}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-gray-700">{campaign.name}</span>
                                            <span className="text-gray-500">{Math.round((campaign.budget / localPortfolio.totalBudget) * 100)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className="bg-blue-600 h-2 rounded-full"
                                                style={{ width: `${safeRatio(campaign.budget, localPortfolio.totalBudget)}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Budget Optimizer */}
                    <BudgetOptimizer portfolio={localPortfolio} onApplyShift={handleBudgetShift} />
                </>
            ) : (
                <UnifiedReportView campaigns={localPortfolio.campaigns} />
            )}

            {/* Campaign List */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900">Active Campaigns</h2>
                    <button className="text-sm text-blue-600 font-medium hover:text-blue-800">View All</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Spend</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ROAS</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {portfolio.campaigns.map((campaign) => (
                                <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                                                {campaign.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                                                <div className="text-xs text-gray-500">ID: {campaign.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                                campaign.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'}`}>
                                            {campaign.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                        {formatCurrency(campaign.budget)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                                        {formatCurrency(campaign.performance?.spend || 0)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <span className={`${(campaign.performance?.roas || 0) >= 2.0 ? 'text-green-600' : 'text-orange-600'}`}>
                                            {(campaign.performance?.roas || 0).toFixed(2)}x
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => onSelectCampaign(campaign.id)}
                                            className="text-blue-600 hover:text-blue-900 flex items-center justify-end gap-1 ml-auto"
                                        >
                                            Manage <ArrowRight className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
