import { useState, useMemo } from 'react';
import { Campaign, AttributionModel } from '../types';
import { AttributionEngine } from '../utils/attributionEngine';
import { generateConversionPaths } from '../logic/dummyData';
import { TrendingUp, DollarSign, Target, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ConversionPathVisualizer } from './ConversionPathVisualizer';
import { ConversionPathSankey } from './ConversionPathSankey';
import { IncrementalityPanel } from './IncrementalityPanel';
import { ChannelContributionChart } from './ChannelContributionChart';

interface AttributionDashboardProps {
    campaign: Campaign;
    onBack?: () => void;
}

export const AttributionDashboard: React.FC<AttributionDashboardProps> = ({ campaign, onBack }) => {
    const [selectedModel, setSelectedModel] = useState<AttributionModel>('LINEAR');

    // Generate conversion paths (in a real app, this would come from server)
    const conversionPaths = useMemo(() => {
        return generateConversionPaths(campaign, 60);
    }, [campaign.id]); // Regenerate if campaign changes

    // Calculate attribution using the engine
    const attributionEngine = useMemo(() => new AttributionEngine(), []);

    const attributionResults = useMemo(() => {
        if (conversionPaths.length === 0) return [];
        return attributionEngine.calculateAttribution(conversionPaths, selectedModel);
    }, [conversionPaths, selectedModel, attributionEngine]);

    // Calculate summary stats
    const summary = useMemo(() => {
        const totalConversions = conversionPaths.length;
        const totalRevenue = conversionPaths.reduce((sum, p) => sum + p.conversionValue, 0);
        const avgTouchpoints = conversionPaths.reduce((sum, p) => sum + p.touchpoints.length, 0) / Math.max(1, conversionPaths.length);
        const avgTimeToConversion = conversionPaths.reduce((sum, p) => sum + p.timeToConversion, 0) / Math.max(1, conversionPaths.length);

        return {
            totalConversions,
            totalRevenue,
            avgTouchpoints,
            avgTimeToConversion: avgTimeToConversion / 24 // Convert hours to days
        };
    }, [conversionPaths]);

    // Sort results by revenue
    const sortedResults = useMemo(() => {
        return [...attributionResults].sort((a, b) => b.revenue - a.revenue);
    }, [attributionResults]);

    const modelDescriptions: Record<AttributionModel, string> = {
        'FIRST_TOUCH': '100% credit to the first touchpoint in the conversion journey',
        'LAST_TOUCH': '100% credit to the last touchpoint before conversion',
        'LINEAR': 'Equal credit distributed across all touchpoints',
        'TIME_DECAY': 'More credit to recent touchpoints (7-day half-life)',
        'POSITION_BASED': '40% first, 40% last, 20% divided among middle touchpoints'
    };

    const modelLabels: Record<AttributionModel, string> = {
        'FIRST_TOUCH': 'First Touch',
        'LAST_TOUCH': 'Last Touch',
        'LINEAR': 'Linear',
        'TIME_DECAY': 'Time Decay',
        'POSITION_BASED': 'Position-Based (U-Shaped)'
    };

    return (
        <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-900">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Attribution Analysis</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">{campaign.name}</p>
                    </div>
                    {onBack && (
                        <button
                            onClick={onBack}
                            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                        >
                            Back
                        </button>
                    )}
                </div>

                {/* Model Selector */}
                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Attribution Model:
                    </label>
                    <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value as AttributionModel)}
                        className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                        {Object.entries(modelLabels).map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 ml-2 max-w-md">
                        {modelDescriptions[selectedModel]}
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

                {/* Attribution Results Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
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

                    {sortedResults.length === 0 && (
                        <div className="p-12 text-center">
                            <BarChart3 className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">No attribution data available</p>
                            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                Create some conversions to see attribution analysis
                            </p>
                        </div>
                    )}
                </div>

                {/* Conversion Path Visualizer */}
                <div className="mt-6">
                    <ConversionPathVisualizer paths={conversionPaths} maxPathsToShow={10} />
                </div>

                {/* Sankey Diagram */}
                <div className="mt-6">
                    <ConversionPathSankey paths={conversionPaths} />
                </div>

                {/* Model Comparison Chart */}
                <div className="mt-6">
                    <ChannelContributionChart results={attributionEngine.compareModels(conversionPaths)} />
                </div>

                {/* Incrementality Panel */}
                <div className="mt-6">
                    <IncrementalityPanel tests={[]} />
                </div>
            </div>
        </div>
    );
};
