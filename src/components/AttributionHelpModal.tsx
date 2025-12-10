import React from 'react';
import { Info, X, Clock, Layers, TrendingUp, BarChart3, LayoutDashboard } from 'lucide-react';

type AttributionView = 'OVERVIEW' | 'INCREMENTALITY' | 'TIME' | 'FREQUENCY' | 'ROI';

interface AttributionHelpModalProps {
    view: AttributionView;
    onClose: () => void;
}

export const AttributionHelpModal: React.FC<AttributionHelpModalProps> = ({ view, onClose }) => {
    const getContent = () => {
        switch (view) {
            case 'OVERVIEW':
                return {
                    title: 'Attribution Overview',
                    icon: LayoutDashboard,
                    content: (
                        <div className="space-y-4">
                            <p>
                                The Overview provides a summary of your campaign's performance based on the selected attribution model.
                            </p>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <strong className="block mb-1">Sankey Diagram:</strong>
                                    Visualizes the flow of users through different channels before converting. Thicker lines indicate higher volume.
                                </div>
                                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <strong className="block mb-1">Totals:</strong>
                                    Aggregated Conversions, Revenue, and ROAS based on the currently selected model (Linear, First Touch, etc).
                                </div>
                            </div>
                        </div>
                    )
                };
            case 'TIME':
                return {
                    title: 'Time to Conversion Analysis',
                    icon: Clock,
                    content: (
                        <div className="space-y-4">
                            <p>
                                This analysis helps you understand the <strong>velocity</strong> of your conversions.
                            </p>
                            <ul className="list-disc list-inside space-y-2">
                                <li><strong>Short Time ({"<"} 1 day):</strong> Indicates impulse purchases or highly effective retargeting.</li>
                                <li><strong>Long Time (30+ days):</strong> Indicates a complex decision journey (e.g., luxury goods, B2B).</li>
                            </ul>
                            <p className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded text-sm">
                                <strong>Tip:</strong> If most users convert quickly, consider tightening your retargeting windows to save budget.
                            </p>
                        </div>
                    )
                };
            case 'FREQUENCY':
                return {
                    title: 'Touchpoint Frequency Analysis',
                    icon: Layers,
                    content: (
                        <div className="space-y-4">
                            <p>
                                This chart shows <strong>how many interactions</strong> it takes for a user to convert.
                            </p>
                            <ul className="list-disc list-inside space-y-2">
                                <li><strong>Low (1-2 touches):</strong> Users convert almost immediately after seeing an ad.</li>
                                <li><strong>High (10+ touches):</strong> Users need significant nurturing across multiple channels.</li>
                            </ul>
                            <p className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300 rounded text-sm">
                                <strong>Tip:</strong> If 10+ touches is common, ensure your attribution model (like Linear or Time Decay) gives credit to those middle assisting touches.
                            </p>
                        </div>
                    )
                };
            case 'ROI':
                return {
                    title: 'Model ROI Comparison',
                    icon: BarChart3,
                    content: (
                        <div className="space-y-4">
                            <p>
                                This table compares Return on Ad Spend (ROAS) across <strong>First Touch</strong>, <strong>Last Touch</strong>, and <strong>Linear</strong> models to identify channel roles.
                            </p>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="p-3 border border-blue-200 dark:border-blue-800 rounded bg-blue-50 dark:bg-blue-900/20">
                                    <strong className="text-blue-800 dark:text-blue-300 block mb-1">Opener (Awareness)</strong>
                                    Channels that perform better in <em>First Touch</em>. They introduce new users but may not get credit in Last Click.
                                </div>
                                <div className="p-3 border-green-200 dark:border-green-800 rounded bg-green-50 dark:bg-green-900/20">
                                    <strong className="text-green-800 dark:text-green-300 block mb-1">Closer (Conversion)</strong>
                                    Channels that perform better in <em>Last Touch</em>. They capture existing demand.
                                </div>
                            </div>
                        </div>
                    )
                };
            case 'INCREMENTALITY':
                return {
                    title: 'Incrementality Testing',
                    icon: TrendingUp,
                    content: (
                        <div className="space-y-4">
                            <p>
                                Incrementality measures the <strong>true causal lift</strong> of your ads by comparing a test group (saw ads) against a control group (did not see ads).
                            </p>
                            <p>
                                Use this panel to record your lift tests and validat whether high-performing channels are actually driving <em>new</em> revenue or just cannibalizing organic traffic.
                            </p>
                        </div>
                    )
                };
            default:
                return { title: 'Attribution', icon: Info, content: null };
        }
    };

    const data = getContent();
    const Icon = data.icon;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
                        <Icon className="w-5 h-5" />
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{data.title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6 text-gray-600 dark:text-gray-300">
                    {data.content}
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                    >
                        Got it
                    </button>
                </div>
            </div>
        </div>
    );
};
