import React, { useState, useEffect } from 'react';
import { Integration, IntegrationStatus } from '../types';
import { AVAILABLE_INTEGRATIONS, connectIntegration, disconnectIntegration, syncIntegration } from '../logic/integrationManager';
import { Link, RefreshCw, CheckCircle, AlertCircle, Power, ExternalLink, Activity } from 'lucide-react';

interface IntegrationDashboardProps {
    onBack: () => void;
}

export const IntegrationDashboard: React.FC<IntegrationDashboardProps> = ({ onBack }) => {
    // Initialize with available integrations
    // In a real app, we'd fetch the user's actual connection status
    const [integrations, setIntegrations] = useState<Integration[]>(AVAILABLE_INTEGRATIONS);
    const [loading, setLoading] = useState<string | null>(null); // ID of integration being processed

    const handleConnect = async (id: string) => {
        setLoading(id);
        try {
            const updated = await connectIntegration(id);
            setIntegrations(prev => prev.map(i => i.id === id ? updated : i));
        } catch (error) {
            console.error('Connection failed', error);
        } finally {
            setLoading(null);
        }
    };

    const handleDisconnect = async (id: string) => {
        setLoading(id);
        try {
            const updated = await disconnectIntegration(id);
            setIntegrations(prev => prev.map(i => i.id === id ? updated : i));
        } catch (error) {
            console.error('Disconnect failed', error);
        } finally {
            setLoading(null);
        }
    };

    const handleSync = async (id: string) => {
        setLoading(id);
        try {
            const updated = await syncIntegration(id);
            setIntegrations(prev => prev.map(i => i.id === id ? updated : i));
        } catch (error) {
            console.error('Sync failed', error);
        } finally {
            setLoading(null);
        }
    };

    const getStatusColor = (status: IntegrationStatus) => {
        switch (status) {
            case 'CONNECTED': return 'text-green-600 bg-green-50 border-green-200';
            case 'DISCONNECTED': return 'text-gray-500 bg-gray-50 border-gray-200';
            case 'ERROR': return 'text-red-600 bg-red-50 border-red-200';
            case 'SYNCING': return 'text-blue-600 bg-blue-50 border-blue-200';
            default: return 'text-gray-500';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={onBack}
                    className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1"
                >
                    ← Back to Dashboard
                </button>
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Integrations Hub</h2>
                    <p className="text-gray-500 mt-1">Connect your media stack to unlock advanced features.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrations.map((integration) => (
                    <div
                        key={integration.id}
                        className={`bg-white rounded-xl border p-6 transition-all ${integration.status === 'CONNECTED' ? 'border-purple-200 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                            }`}
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-gray-50 p-2 border border-gray-100 flex items-center justify-center">
                                    {integration.icon.startsWith('http') || integration.icon.startsWith('/') ? (
                                        <img src={integration.icon} alt={integration.name} className="w-8 h-8 object-contain" />
                                    ) : (
                                        <span className="text-2xl">{integration.icon}</span>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{integration.name}</h3>
                                    <span className="text-xs font-medium text-gray-500 px-2 py-0.5 bg-gray-100 rounded-full">
                                        {integration.type}
                                    </span>
                                </div>
                            </div>
                            <div className={`px-2.5 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1.5 ${getStatusColor(integration.status)}`}>
                                {integration.status === 'CONNECTED' && <CheckCircle className="w-3 h-3" />}
                                {integration.status === 'DISCONNECTED' && <Power className="w-3 h-3" />}
                                {integration.status === 'SYNCING' && <RefreshCw className="w-3 h-3 animate-spin" />}
                                {integration.status}
                            </div>
                        </div>

                        <p className="text-sm text-gray-600 mb-6 min-h-[40px]">
                            {integration.description}
                        </p>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            {integration.status === 'CONNECTED' ? (
                                <>
                                    <div className="flex flex-col">
                                        <span className="text-xs text-gray-400">Last Synced</span>
                                        <span className="text-xs font-medium text-gray-700">
                                            {integration.lastSync ? new Date(integration.lastSync).toLocaleTimeString() : 'Never'}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleSync(integration.id)}
                                            disabled={loading === integration.id}
                                            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                            title="Sync Data"
                                        >
                                            <RefreshCw className={`w-4 h-4 ${loading === integration.id ? 'animate-spin' : ''}`} />
                                        </button>
                                        <button
                                            onClick={() => handleDisconnect(integration.id)}
                                            disabled={loading === integration.id}
                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Disconnect"
                                        >
                                            <Power className="w-4 h-4" />
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <button
                                    onClick={() => handleConnect(integration.id)}
                                    disabled={loading === integration.id}
                                    className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading === integration.id ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                            Connecting...
                                        </>
                                    ) : (
                                        <>
                                            <Link className="w-4 h-4" />
                                            Connect
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
