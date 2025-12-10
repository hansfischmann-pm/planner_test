import React, { useState } from 'react';
import { AttributionModel, AttributionResult, ConversionPath } from '../types';
import { Target, DollarSign, TrendingUp, BarChart3, ArrowUpRight, ArrowDownRight, Table, GitBranch, PieChart } from 'lucide-react';
import { ConversionPathVisualizer } from './ConversionPathVisualizer';
import { ConversionPathSankey } from './ConversionPathSankey';
import { ChannelContributionChart } from './ChannelContributionChart';

type OverviewTab = 'table' | 'chart' | 'sankey' | 'paths';

interface AttributionOverviewProps {
    summary: {
        totalConversions: number;
        totalRevenue: number;
        avgTouchpoints: number;
        avgTimeToConversion: number;
    };
    selectedModel: AttributionModel;
    sortedResults: AttributionResult[];
    conversionPaths: ConversionPath[];
    modelComparison: Map<AttributionModel, AttributionResult[]>;
}

export const AttributionOverview: React.FC<AttributionOverviewProps> = ({
    summary,
    selectedModel,
    sortedResults,
    conversionPaths,
    modelComparison
}) => {
    const [activeTab, setActiveTab] = useState<OverviewTab>('table');

    const tabs: { id: OverviewTab; label: string; icon: React.ElementType }[] = [
        { id: 'table', label: 'Channel Table', icon: Table },
        { id: 'chart', label: 'Model Comparison', icon: PieChart },
        { id: 'sankey', label: 'Flow Diagram', icon: GitBranch },
        { id: 'paths', label: 'Conversion Paths', icon: TrendingUp },
    ];

    const modelLabels: Record<AttributionModel, string> = {
        'FIRST_TOUCH': 'First Touch',
        'LAST_TOUCH': 'Last Touch',
        'LINEAR': 'Linear',
        'TIME_DECAY': 'Time Decay',
        'POSITION_BASED': 'Position-Based (U-Shaped)'
    };

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Conversions</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {summary.totalConversions.toLocaleString()}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                            <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                ${summary.totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Touchpoints</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {summary.avgTouchpoints.toFixed(1)}
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Time to Convert</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                                {summary.avgTimeToConversion.toFixed(1)}d
                            </p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                            <BarChart3 className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="flex -mb-px">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                                        isActive
                                            ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                                    }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                    {/* Channel Table */}
                    {activeTab === 'table' && (
                        <div>
                            <div className="mb-4">
                                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Channel Attribution Breakdown</h2>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    Credit distribution using the {modelLabels[selectedModel]} model
                                </p>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Channel
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Type
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Credit
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Conversions
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Revenue
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                Cost
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                ROAS
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                        {sortedResults.map((result, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {result.channel}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                        {result.channelType}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                                                    {(result.credit * 100).toFixed(1)}%
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                                                    {result.conversions.toFixed(1)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                                                    ${result.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900 dark:text-white">
                                                    ${result.cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {result.roas >= 2.0 ? (
                                                            <ArrowUpRight className="w-4 h-4 text-green-600" />
                                                        ) : result.roas < 1.0 ? (
                                                            <ArrowDownRight className="w-4 h-4 text-red-600" />
                                                        ) : null}
                                                        <span className={`text-sm font-medium ${result.roas >= 2.0 ? 'text-green-600 dark:text-green-400' :
                                                            result.roas < 1.0 ? 'text-red-600 dark:text-red-400' :
                                                                'text-gray-900 dark:text-white'
                                                            }`}>
                                                            {result.roas.toFixed(2)}x
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Model Comparison Chart */}
                    {activeTab === 'chart' && (
                        <ChannelContributionChart results={modelComparison} />
                    )}

                    {/* Sankey Diagram */}
                    {activeTab === 'sankey' && (
                        <ConversionPathSankey paths={conversionPaths} />
                    )}

                    {/* Conversion Path Visualizer */}
                    {activeTab === 'paths' && (
                        <ConversionPathVisualizer paths={conversionPaths} maxPathsToShow={10} />
                    )}
                </div>
            </div>
        </div>
    );
};
