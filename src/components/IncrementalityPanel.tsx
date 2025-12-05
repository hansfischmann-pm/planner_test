import React, { useState } from 'react';
import { IncrementalityTest, ChannelType } from '../types';
import { calculateIncrementality, formatLift, getRecommendationMessage } from '../utils/incrementalityCalculator';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface IncrementalityPanelProps {
    tests?: IncrementalityTest[];
}

export const IncrementalityPanel: React.FC<IncrementalityPanelProps> = ({ tests = [] }) => {
    const [showTestForm, setShowTestForm] = useState(false);

    // Calculate incrementality results for each test
    const testsWithResults = tests.map(test => ({
        ...test,
        results: calculateIncrementality(test)
    }));

    const getConfidenceColor = (confidence: number) => {
        if (confidence >= 0.95) return 'text-green-600 dark:text-green-400';
        if (confidence >= 0.80) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getRecommendationIcon = (recommendation: string) => {
        switch (recommendation) {
            case 'SCALE_UP':
                return <TrendingUp className="w-5 h-5 text-green-600" />;
            case 'SCALE_DOWN':
                return <TrendingDown className="w-5 h-5 text-red-600" />;
            case 'MAINTAIN':
                return <CheckCircle className="w-5 h-5 text-blue-600" />;
            case 'MORE_DATA_NEEDED':
                return <AlertCircle className="w-5 h-5 text-yellow-600" />;
        }
    };

    const getRecommendationColor = (recommendation: string) => {
        switch (recommendation) {
            case 'SCALE_UP':
                return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-700';
            case 'SCALE_DOWN':
                return 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-700';
            case 'MAINTAIN':
                return 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-700';
            case 'MORE_DATA_NEEDED':
                return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700';
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Incrementality Testing</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Measure true lift and statistical significance
                        </p>
                    </div>
                    <button
                        onClick={() => setShowTestForm(!showTestForm)}
                        className="px-4 py-2 text-sm font-medium text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                    >
                        + New Test
                    </button>
                </div>
            </div>

            {/* Test Creation Form */}
            {showTestForm && (
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:border-gray-700/50">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Create Incrementality Test</h3>
                    <div className="grid grid-cols-2 gap-6">
                        {/* Test Setup */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Channel
                                </label>
                                <select
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="SEARCH">Search</option>
                                    <option value="SOCIAL">Social</option>
                                    <option value="DISPLAY">Display</option>
                                    <option value="VIDEO">Video/TV</option>
                                    <option value="AUDIO">Audio</option>
                                    <option value="EMAIL">Email</option>
                                    <option value="OOH">Out of Home</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Control Group */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Control Group (No Spend)</h4>
                            <div className="grid grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        Spend
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        Conversions
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        Revenue
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Test Group */}
                    <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Test Group (With Spend)</h4>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                    Spend
                                </label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                    Conversions
                                </label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                    Revenue
                                </label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-3 mt-6">
                        <button
                            onClick={() => {
                                // Here you would create the test
                                alert('Test creation would save the data here. Full implementation would add to tests array.');
                                setShowTestForm(false);
                            }}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                        >
                            Create Test
                        </button>
                        <button
                            onClick={() => setShowTestForm(false)}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {tests.length === 0 && !showTestForm ? (
                <div className="p-12 text-center">
                    <Info className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">No incrementality tests available</p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        Run A/B tests to measure channel effectiveness
                    </p>
                </div>
            ) : tests.length > 0 ? (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {testsWithResults.map((test, index) => (
                        <div key={test.id} className="p-6">
                            {/* Test Header */}
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        {test.channel}
                                    </h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(test.testPeriod.start).toLocaleDateString()} - {new Date(test.testPeriod.end).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                    {test.channelType}
                                </span>
                            </div>

                            {/* Comparison Table */}
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                {/* Control Group */}
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Control Group</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Spend</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                ${test.controlGroup.spend.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Conversions</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {test.controlGroup.conversions.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Revenue</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                ${test.controlGroup.revenue.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Test Group */}
                                <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border-2 border-purple-200 dark:border-purple-700">
                                    <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-3">Test Group</h4>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Spend</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                ${test.testGroup.spend.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Conversions</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {test.testGroup.conversions.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600 dark:text-gray-400">Revenue</span>
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                ${test.testGroup.revenue.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Results */}
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Lift</p>
                                    <p className={`text-2xl font-bold ${test.results.lift > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                                        }`}>
                                        {formatLift(test.results.lift)}
                                    </p>
                                </div>
                                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Confidence</p>
                                    <p className={`text-2xl font-bold ${getConfidenceColor(test.results.confidence)}`}>
                                        {(test.results.confidence * 100).toFixed(1)}%
                                    </p>
                                </div>
                                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Significant</p>
                                    <p className={`text-2xl font-bold ${test.results.isSignificant ? 'text-green-600 dark:text-green-400' : 'text-gray-500'
                                        }`}>
                                        {test.results.isSignificant ? 'Yes' : 'No'}
                                    </p>
                                </div>
                            </div>

                            {/* Recommendation */}
                            <div className={`rounded-lg border p-4 ${getRecommendationColor(test.results.recommendation)}`}>
                                <div className="flex items-start gap-3">
                                    {getRecommendationIcon(test.results.recommendation)}
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                                            {test.results.recommendation.replace(/_/g, ' ')}
                                        </h4>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                            {getRecommendationMessage(test.results.recommendation)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    );
};
