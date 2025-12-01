import React, { useState } from 'react';
import { Flight, CampaignTemplate } from '../types';
import { Calendar, DollarSign, ArrowRight, Layers, Pause, Plus, Send, Rocket, Sparkles, ExternalLink } from 'lucide-react';
import { TemplateLibrary } from './TemplateLibrary';
import { TemplateWizard } from './TemplateWizard';

interface FlightListProps {
    flights: Flight[];
    onSelectFlight: (flight: Flight) => void;
    onBack: () => void;
    onPauseFlight?: (flightId: string) => void;
    onActivateFlight?: (flightId: string) => void;
    onCreateFlight?: (name: string, budget?: number, startDate?: string, endDate?: string) => void;
    onAddFlightFromTemplate?: (flight: Flight) => void;
    brandId?: string;
    brandName?: string;
}

export const FlightList: React.FC<FlightListProps> = ({
    flights,
    onSelectFlight,
    onBack,
    onPauseFlight,
    onActivateFlight,
    onCreateFlight,
    onAddFlightFromTemplate,
    brandId = 'brand-123', // Fallback
    brandName = 'Brand' // Fallback
}) => {
    const [showNewFlight, setShowNewFlight] = useState(false);
    const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);

    const [flightName, setFlightName] = useState('');
    const [flightBudget, setFlightBudget] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const handlePause = (e: React.MouseEvent, flightId: string) => {
        e.stopPropagation(); // Prevent flight selection
        if (onPauseFlight) {
            onPauseFlight(flightId);
        }
    };

    if (selectedTemplate) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex items-center gap-2">
                    <button
                        onClick={() => setSelectedTemplate(null)}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ← Back
                    </button>
                    <h2 className="text-lg font-semibold">New Flight from Template</h2>
                </div>
                <TemplateWizard
                    template={selectedTemplate}
                    brandId={brandId}
                    brandName={brandName}
                    mode="FLIGHT"
                    onCompleteFlight={(flight) => {
                        if (onAddFlightFromTemplate) {
                            onAddFlightFromTemplate(flight);
                        }
                        setSelectedTemplate(null);
                        setShowTemplateLibrary(false);
                    }}
                    onCancel={() => setSelectedTemplate(null)}
                />
            </div>
        );
    }

    if (showTemplateLibrary) {
        return (
            <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <button
                        onClick={() => setShowTemplateLibrary(false)}
                        className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
                    >
                        ← Back to Flights
                    </button>
                </div>
                <TemplateLibrary
                    onSelectTemplate={setSelectedTemplate}
                    onClose={() => setShowTemplateLibrary(false)}
                />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                    ← Back to Campaigns
                </button>
                <div className="flex gap-2">
                    {onAddFlightFromTemplate && (
                        <button
                            onClick={() => setShowTemplateLibrary(true)}
                            className="px-4 py-2 bg-white border border-purple-200 text-purple-700 rounded-lg text-sm font-medium hover:bg-purple-50 transition-colors flex items-center gap-2"
                        >
                            <Sparkles className="h-4 w-4" />
                            Use Template
                        </button>
                    )}
                    <button
                        onClick={() => setShowNewFlight(!showNewFlight)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add Flight
                    </button>
                </div>
            </div>

            {/* Flight Creation Input */}
            {showNewFlight && (
                <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Create New Flight</h3>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Flight Name</label>
                            <input
                                type="text"
                                value={flightName}
                                onChange={(e) => setFlightName(e.target.value)}
                                placeholder="e.g., 'Q1 Launch' or 'Holiday Push'"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Budget (Optional)</label>
                            <input
                                type="number"
                                value={flightBudget}
                                onChange={(e) => setFlightBudget(e.target.value)}
                                placeholder="Leave blank for default (25% of campaign budget)"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">End Date</label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    if (flightName.trim() && onCreateFlight) {
                                        onCreateFlight(
                                            flightName.trim(),
                                            flightBudget ? parseFloat(flightBudget) : undefined,
                                            startDate || undefined,
                                            endDate || undefined
                                        );
                                        setFlightName('');
                                        setFlightBudget('');
                                        setStartDate('');
                                        setEndDate('');
                                        setShowNewFlight(false);
                                    }
                                }}
                                disabled={!flightName.trim()}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Send className="h-4 w-4" />
                                Create Flight
                            </button>
                            <button
                                onClick={() => {
                                    setFlightName('');
                                    setFlightBudget('');
                                    setShowNewFlight(false);
                                }}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid gap-4">
                {flights.map((flight) => (
                    <div
                        key={flight.id}
                        onClick={() => onSelectFlight(flight)}
                        className={`bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group ${flight.status === 'DRAFT' ? 'border-gray-300 opacity-60' : 'border-gray-200 hover:border-purple-200'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-start gap-4">
                                <div className={`p-3 rounded-lg transition-colors ${flight.status === 'DRAFT' ? 'bg-gray-100 text-gray-400' : 'bg-purple-50 text-purple-600 group-hover:bg-purple-100'
                                    }`}>
                                    <Layers className="h-6 w-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className={`text-lg font-semibold transition-colors ${flight.status === 'DRAFT' ? 'text-gray-500' : 'text-gray-900 group-hover:text-purple-600'
                                            }`}>
                                            {flight.name}
                                        </h3>
                                        {flight.status === 'DRAFT' && (
                                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                                <Pause className="h-3 w-3" />
                                                Paused
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-4 w-4" />
                                            <span>{flight.startDate} - {flight.endDate}</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <DollarSign className="h-4 w-4" />
                                            <span>${flight.budget.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${flight.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                        flight.status === 'COMPLETED' ? 'bg-gray-100 text-gray-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {flight.status}
                                    </span>
                                    <div className="mt-1 text-xs text-gray-500">
                                        {flight.lines.length} Lines
                                    </div>
                                </div>
                                {flight.status === 'ACTIVE' && onPauseFlight && (
                                    <div className="flex gap-1">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // Simulate push to DSP
                                                alert(`Pushing flight "${flight.name}" to The Trade Desk...`);
                                            }}
                                            className="p-2 rounded-lg hover:bg-blue-100 text-blue-600 hover:text-blue-700 transition-colors"
                                            title="Push to DSP"
                                        >
                                            <ExternalLink className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={(e) => handlePause(e, flight.id)}
                                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                            title="Pause flight"
                                        >
                                            <Pause className="h-4 w-4" />
                                        </button>
                                    </div>
                                )}
                                {flight.status === 'DRAFT' && onActivateFlight && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onActivateFlight(flight.id);
                                        }}
                                        className="p-2 rounded-lg hover:bg-green-100 text-green-600 hover:text-green-700 transition-colors"
                                        title="Launch flight"
                                    >
                                        <Rocket className="h-4 w-4" />
                                    </button>
                                )}
                                <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-purple-500 transition-colors" />
                            </div>
                        </div>

                        {/* Progress bars */}
                        <div className="mt-4 space-y-2">
                            {/* Flight Timeline */}
                            <div>
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>Flight Timeline</span>
                                    <span>
                                        {(() => {
                                            const start = new Date(flight.startDate);
                                            const end = new Date(flight.endDate);
                                            const now = new Date();
                                            const remaining = end.getTime() - now.getTime();
                                            const daysRemaining = Math.ceil(remaining / (1000 * 60 * 60 * 24));
                                            return daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Completed';
                                        })()}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full transition-all ${flight.status === 'COMPLETED' ? 'bg-gray-600' : 'bg-purple-600'
                                            }`}
                                        style={{
                                            width: `${(() => {
                                                const start = new Date(flight.startDate);
                                                const end = new Date(flight.endDate);
                                                const now = new Date();
                                                const total = end.getTime() - start.getTime();
                                                const elapsed = now.getTime() - start.getTime();
                                                return Math.min(100, Math.max(0, (elapsed / total) * 100));
                                            })()}%`
                                        }}
                                    ></div>
                                </div>
                            </div>

                            {/* Spend to Budget */}
                            <div>
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>Spend to Budget</span>
                                    <span>
                                        ${(flight.delivery?.actualSpend || 0).toLocaleString()} / ${flight.budget.toLocaleString()}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div
                                        className="h-1.5 rounded-full bg-green-500 transition-all"
                                        style={{ width: `${Math.min(100, ((flight.delivery?.actualSpend || 0) / flight.budget) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Forecast to Actuals */}
                            <div>
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>Forecast to Actuals</span>
                                    <span>
                                        {((flight.delivery?.actualImpressions || 0) / 1000000).toFixed(1)}M / {((flight.forecast?.impressions || 0) / 1000000).toFixed(1)}M
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full transition-all ${flight.delivery?.status === 'UNDER_PACING' ? 'bg-red-500' :
                                            flight.delivery?.status === 'OVER_PACING' ? 'bg-yellow-500' : 'bg-blue-500'
                                            }`}
                                        style={{ width: `${Math.min(100, ((flight.delivery?.actualImpressions || 0) / Math.max(1, flight.forecast?.impressions || 1)) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
