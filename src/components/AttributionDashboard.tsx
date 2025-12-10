import React, { useState, useMemo } from 'react';
import { Campaign, AttributionModel, IncrementalityTest, ChannelType } from '../types';
import { AttributionEngine } from '../utils/attributionEngine';
import { generateConversionPaths } from '../logic/dummyData';
import { calculateIncrementality } from '../utils/incrementalityCalculator';
import { LayoutDashboard, TrendingUp, Clock, Layers, BarChart3, HelpCircle } from 'lucide-react';
import { IncrementalityPanel } from './IncrementalityPanel';
import { v4 as uuidv4 } from 'uuid';

// Sub-views
import { AttributionOverview } from './AttributionOverview';
import { TimeAnalysisView } from './TimeAnalysisView';
import { TouchpointFrequencyView } from './TouchpointFrequencyView';
import { ModelComparisonView } from './ModelComparisonView';
import { AttributionHelpModal } from './AttributionHelpModal';

interface AttributionDashboardProps {
    campaign: Campaign;
    onBack?: () => void;
}

type AttributionView = 'OVERVIEW' | 'INCREMENTALITY' | 'TIME' | 'FREQUENCY' | 'ROI';

export const AttributionDashboard: React.FC<AttributionDashboardProps> = ({ campaign, onBack }) => {
    const [currentView, setCurrentView] = useState<AttributionView>('OVERVIEW');
    const [selectedModel, setSelectedModel] = useState<AttributionModel>('LINEAR');
    const [showHelp, setShowHelp] = useState(false);
    const [tests, setTests] = useState<IncrementalityTest[]>([]);

    const handleAddTest = (
        channel: string,
        channelType: ChannelType,
        startDate: string,
        endDate: string,
        controlGroup: { spend: number; conversions: number; revenue: number },
        testGroup: { spend: number; conversions: number; revenue: number }
    ) => {
        const baseTest = {
            id: uuidv4(),
            channel,
            channelType,
            testPeriod: { start: startDate, end: endDate },
            controlGroup,
            testGroup,
            lift: 0,
            confidence: 0,
            isSignificant: false,
            pValue: 0
        };

        const results = calculateIncrementality(baseTest);

        const newTest: IncrementalityTest = {
            ...baseTest,
            lift: results.lift,
            confidence: results.confidence,
            isSignificant: results.isSignificant,
            pValue: results.pValue
        };

        setTests(prev => [newTest, ...prev]);
    };

    // Calculations (Shared State)
    const conversionPaths = useMemo(() => {
        return generateConversionPaths(campaign, 60);
    }, [campaign.id]);

    const attributionEngine = useMemo(() => new AttributionEngine(), []);

    const attributionResults = useMemo(() => {
        if (conversionPaths.length === 0) return [];
        return attributionEngine.calculateAttribution(conversionPaths, selectedModel);
    }, [conversionPaths, selectedModel, attributionEngine]);

    const summary = useMemo(() => {
        const totalConversions = conversionPaths.length;
        const totalRevenue = conversionPaths.reduce((sum, p) => sum + p.conversionValue, 0);
        const avgTouchpoints = conversionPaths.reduce((sum, p) => sum + p.touchpoints.length, 0) / Math.max(1, conversionPaths.length);
        const avgTimeToConversion = conversionPaths.reduce((sum, p) => sum + p.timeToConversion, 0) / Math.max(1, conversionPaths.length);

        return {
            totalConversions,
            totalRevenue,
            avgTouchpoints,
            avgTimeToConversion: avgTimeToConversion / 24
        };
    }, [conversionPaths]);

    const sortedResults = useMemo(() => {
        return [...attributionResults].sort((a, b) => b.revenue - a.revenue);
    }, [attributionResults]);

    const modelComparison = useMemo(() => attributionEngine.compareModels(conversionPaths), [attributionEngine, conversionPaths]);

    // Sidebar Navigation Items
    const menuItems = [
        { id: 'OVERVIEW', label: 'Overview', icon: LayoutDashboard },
        { id: 'INCREMENTALITY', label: 'Incrementality Testing', icon: HelpCircle },
        { id: 'TIME', label: 'Time Analysis', icon: Clock },
        { id: 'FREQUENCY', label: 'Touchpoint Frequency', icon: Layers },
        { id: 'ROI', label: 'Model Comparison', icon: BarChart3 },
    ];

    return (
        <div className="h-full flex bg-gray-50 dark:bg-gray-900">
            {/* Help Modal */}
            {showHelp && (
                <AttributionHelpModal view={currentView} onClose={() => setShowHelp(false)} />
            )}

            {/* Sidebar */}
            <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Attribution</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{campaign.name}</p>

                    {onBack && (
                        <button
                            onClick={onBack}
                            className="mt-4 w-full px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            ← Back to Campaign
                        </button>
                    )}
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setCurrentView(item.id as AttributionView)}
                                className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive
                                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'
                                    }`} />
                                {item.label}
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-8">
                    {/* Header for View (Optional, maybe specific controls) */}
                    <div className="mb-6 flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {menuItems.find(i => i.id === currentView)?.label}
                            </h2>
                            <button
                                onClick={() => setShowHelp(true)}
                                className="text-gray-400 hover:text-purple-600 dark:text-gray-500 dark:hover:text-purple-400 transition-colors"
                                aria-label="Show Help"
                            >
                                <HelpCircle className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Global Model Selector (Only show for Overview, NOT for ROI/Comparison) */}
                        {currentView === 'OVERVIEW' && (
                            <div className="flex items-center gap-3">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Model:
                                </label>
                                <select
                                    value={selectedModel}
                                    onChange={(e) => setSelectedModel(e.target.value as AttributionModel)}
                                    className="px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent cursor-pointer"
                                >
                                    <option value="LINEAR">Linear</option>
                                    <option value="FIRST_TOUCH">First Touch</option>
                                    <option value="LAST_TOUCH">Last Touch</option>
                                    <option value="TIME_DECAY">Time Decay</option>
                                    <option value="POSITION_BASED">Position Based</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {/* View Rendering */}
                    {currentView === 'OVERVIEW' && (
                        <AttributionOverview
                            campaign={campaign}
                            summary={summary}
                            selectedModel={selectedModel}
                            sortedResults={sortedResults}
                            conversionPaths={conversionPaths}
                            modelComparison={modelComparison}
                        />
                    )}

                    {currentView === 'INCREMENTALITY' && (
                        <IncrementalityPanel tests={tests} onAddTest={handleAddTest} />
                    )}

                    {currentView === 'TIME' && (
                        <TimeAnalysisView paths={conversionPaths} />
                    )}

                    {currentView === 'FREQUENCY' && (
                        <TouchpointFrequencyView paths={conversionPaths} />
                    )}

                    {currentView === 'ROI' && (
                        <ModelComparisonView modelComparison={modelComparison} />
                    )}
                </div>
            </div>
        </div>
    );
};
