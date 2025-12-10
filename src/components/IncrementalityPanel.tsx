import React, { useState } from 'react';
import { IncrementalityTest, ChannelType } from '../types';
import { calculateIncrementality, formatLift, getRecommendationMessage } from '../utils/incrementalityCalculator';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Info, HelpCircle, X } from 'lucide-react';

interface IncrementalityPanelProps {
    tests?: IncrementalityTest[];
    onAddTest?: (
        channel: string,
        channelType: ChannelType,
        startDate: string,
        endDate: string,
        controlGroup: { spend: number; conversions: number; revenue: number },
        testGroup: { spend: number; conversions: number; revenue: number }
    ) => void;
}

export const IncrementalityPanel: React.FC<IncrementalityPanelProps> = ({ tests = [], onAddTest }) => {
    const [showTestForm, setShowTestForm] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    // Form State
    const [channel, setChannel] = useState<string>('Search');
    const [channelType, setChannelType] = useState<ChannelType>('SEARCH');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [controlSpend, setControlSpend] = useState('');
    const [controlConversions, setControlConversions] = useState('');
    const [controlRevenue, setControlRevenue] = useState('');

    const [testSpend, setTestSpend] = useState('');
    const [testConversions, setTestConversions] = useState('');
    const [testRevenue, setTestRevenue] = useState('');

    // Calculate incrementality results for each test
    // Note: If tests come with results pre-calculated (which they do now from parent), this is redundant but harmless re-calculation for legacy support
    const testsWithResults = tests.map(test => ({
        ...test,
        results: calculateIncrementality(test)
    }));

    const handleCreateTest = () => {
        if (!onAddTest) return;

        onAddTest(
            channel,
            channelType,
            startDate,
            endDate,
            {
                spend: Number(controlSpend),
                conversions: Number(controlConversions),
                revenue: Number(controlRevenue)
            },
            {
                spend: Number(testSpend),
                conversions: Number(testConversions),
                revenue: Number(testRevenue)
            }
        );

        // Reset and close
        setShowTestForm(false);
        setControlSpend('');
        setControlConversions('');
        setControlRevenue('');
        setTestSpend('');
        setTestConversions('');
        setTestRevenue('');
    };

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
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Incrementality Testing</h2>
                            <button
                                onClick={() => setShowHelp(true)}
                                className="text-gray-400 hover:text-purple-600 transition-colors"
                                title="How to use Incrementality Testing"
                            >
                                <HelpCircle className="w-4 h-4" />
                            </button>
                        </div>
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

            {/* Help Modal */}
            {showHelp && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Info className="w-5 h-5 text-purple-600" />
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Understanding Incrementality</h3>
                            </div>
                            <button
                                onClick={() => setShowHelp(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <section>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">What is Incrementality?</h4>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                    Incrementality measures the <strong>true causal impact</strong> of your advertising.
                                    Unlike standard attribution which just counts conversions, incrementality asks:
                                    <em>"Would these conversions have happened anyway without the ad?"</em>
                                </p>
                            </section>

                            <section className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                                <h4 className="text-base font-semibold text-purple-900 dark:text-purple-100 mb-2">How to Run a Test</h4>
                                <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300">
                                    <li><strong>Select Channel:</strong> Choose the specific channel you want to test (e.g., Social).</li>
                                    <li><strong>Define Period:</strong> Set the start and end dates for your test.</li>
                                    <li><strong>Control Group (Holdout):</strong> Enter data for the group that <u>did not</u> see ads. Ideally, spend here is $0.</li>
                                    <li><strong>Test Group:</strong> Enter data for the group that <u>did</u> see ads.</li>
                                </ol>
                            </section>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                                    <h5 className="font-semibold text-gray-900 dark:text-white mb-1">Lift %</h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        The percentage increase in conversions caused specifically by the ad exposure.
                                    </p>
                                </div>
                                <div className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
                                    <h5 className="font-semibold text-gray-900 dark:text-white mb-1">Confidence</h5>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        The statistical probability that the results are real and not just random chance. Target &gt;90%.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 text-right">
                            <button
                                onClick={() => setShowHelp(false)}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Test Creation Form */}
            {showTestForm && (
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:border-gray-700/50">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Create Incrementality Test</h3>

                    {/* Top Row: Channel and Dates */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Channel
                            </label>
                            <select
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                value={channelType}
                                onChange={(e) => {
                                    setChannelType(e.target.value as ChannelType);
                                    setChannel(e.target.options[e.target.selectedIndex].text);
                                }}
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
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Control Group */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                                Control Group (Holdout)
                            </h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        Spend (Should be $0)
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-400">$</span>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="w-full pl-6 pr-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                            value={controlSpend}
                                            onChange={(e) => setControlSpend(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        Conversions
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                        value={controlConversions}
                                        onChange={(e) => setControlConversions(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        Revenue
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-400">$</span>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="w-full pl-6 pr-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                            value={controlRevenue}
                                            onChange={(e) => setControlRevenue(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Test Group */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-purple-200 dark:border-purple-900/50 ring-1 ring-purple-100 dark:ring-purple-900/30">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                Test Group (Exposed)
                            </h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        Spend
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-400">$</span>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="w-full pl-6 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                            value={testSpend}
                                            onChange={(e) => setTestSpend(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        Conversions
                                    </label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                        value={testConversions}
                                        onChange={(e) => setTestConversions(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                        Revenue
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-gray-400">$</span>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="w-full pl-6 pr-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                                            value={testRevenue}
                                            onChange={(e) => setTestRevenue(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-3 mt-6 justify-end">
                        <button
                            onClick={() => setShowTestForm(false)}
                            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreateTest}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors shadow-sm"
                        >
                            Create Test
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
                    {testsWithResults.map((test, _index) => (
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
