import React from 'react';
import { Flight } from '../types';
import { Calendar, DollarSign, ArrowRight, Layers, Pause } from 'lucide-react';

interface FlightListProps {
    flights: Flight[];
    onSelectFlight: (flight: Flight) => void;
    onBack: () => void;
    onPauseFlight?: (flightId: string) => void;
}

export const FlightList: React.FC<FlightListProps> = ({ flights, onSelectFlight, onBack, onPauseFlight }) => {
    const handlePause = (e: React.MouseEvent, flightId: string) => {
        e.stopPropagation(); // Prevent flight selection
        if (onPauseFlight) {
            onPauseFlight(flightId);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
                >
                    ← Back to Campaigns
                </button>
            </div>

            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Campaign Flights</h2>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                    Add Flight
                </button>
            </div>

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
                                    <button
                                        onClick={(e) => handlePause(e, flight.id)}
                                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                        title="Pause flight"
                                    >
                                        <Pause className="h-4 w-4" />
                                    </button>
                                )}
                                <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-purple-500 transition-colors" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
