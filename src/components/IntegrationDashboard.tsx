import React, { useState, useMemo } from 'react';
import { Integration, IntegrationStatus } from '../types';
import { DATA_PROVIDERS } from '../data/segmentLibrary';
import { Link, RefreshCw, CheckCircle, AlertCircle, Power, ExternalLink, Activity, Search, Filter, Loader2 } from 'lucide-react';

interface IntegrationDashboardProps {
    onBack: () => void;
}

// Helper to generate a consistent ID from a name
const generateId = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '_');

// Transform DATA_PROVIDERS into Integration objects
const REALISTIC_INTEGRATIONS: Integration[] = Object.entries(DATA_PROVIDERS).map(([name, data]) => {
    // AdRoll should be disconnected but available or deactivated based on story?
    // User said "AdRoll DSP and ABM connections... top of list".
    // Let's make them available by default or maybe one active.

    return {
        id: generateId(name),
        name: name,
        provider: name, // Use name as provider for now
        type: data.type.toUpperCase() as any,
        status: (Math.random() > 0.7 ? 'CONNECTED' : 'DISCONNECTED') as IntegrationStatus,
        icon: `https://ui-avatars.com/api/?name=${name}&background=random&color=fff`,
        description: `Connect with ${name} to access ${data.type} data and capabilities.`,
        lastSync: Math.random() > 0.7 ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString() : undefined
    };
}).sort((a, b) => {
    // Prioritize AdRoll
    if (a.name.includes('AdRoll') && !b.name.includes('AdRoll')) return -1;
    if (!a.name.includes('AdRoll') && b.name.includes('AdRoll')) return 1;
    return a.name.localeCompare(b.name);
});

export const IntegrationDashboard: React.FC<IntegrationDashboardProps> = ({ onBack }) => {
    const [integrations, setIntegrations] = useState<Integration[]>(REALISTIC_INTEGRATIONS);
    const [loading, setLoading] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVATED' | 'DEACTIVATED' | 'AVAILABLE'>('ALL');

    const handleConnect = async (id: string) => {
        setLoading(id);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));

        setIntegrations(prev => prev.map(i =>
            i.id === id ? { ...i, status: 'CONNECTED', lastSync: new Date().toISOString() } : i
        ));
        setLoading(null);
    };

    const handleDisconnect = async (id: string) => {
        setLoading(id);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        setIntegrations(prev => prev.map(i =>
            i.id === id ? { ...i, status: 'DISCONNECTED' } : i // Keep lastSync to show it was active
        ));
        setLoading(null);
    };

    const handleSync = async (id: string) => {
        setLoading(id);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        setIntegrations(prev => prev.map(i =>
            i.id === id ? { ...i, lastSync: new Date().toISOString() } : i
        ));
        setLoading(null);
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

    const filteredIntegrations = useMemo(() => {
        return integrations.filter(i => {
            const matchesSearch = i.name.toLowerCase().includes(searchQuery.toLowerCase());

            // Type Filter Logic
            let matchesType = true;
            if (typeFilter === 'Data Provider') {
                matchesType = ['DMP', 'CONTEXTUAL', 'IDENTITY'].includes(i.type);
            } else if (typeFilter !== 'ALL') {
                matchesType = i.type === typeFilter;
            }

            // Status Filter Logic
            let matchesStatus = true;
            if (statusFilter === 'ACTIVATED') {
                matchesStatus = i.status === 'CONNECTED';
            } else if (statusFilter === 'DEACTIVATED') {
                matchesStatus = i.status === 'DISCONNECTED' && !!i.lastSync;
            } else if (statusFilter === 'AVAILABLE') {
                matchesStatus = i.status === 'DISCONNECTED' && !i.lastSync;
            }

            return matchesSearch && matchesType && matchesStatus;
        });
    }, [integrations, searchQuery, typeFilter, statusFilter]);

    // Get unique types for dropdown, plus custom groups
    const integrationTypes = Array.from(new Set(integrations.map(i => i.type)));

    return (
        <div className="px-8 space-y-6 h-full flex flex-col">
            <div className="flex items-center gap-4 mb-2 pt-6">
                <button
                    onClick={onBack}
                    className="text-sm text-gray-500 hover:text-gray-900 flex items-center gap-1 transition-colors"
                >
                    ← Back to Dashboard
                </button>
            </div>

            <div className="flex flex-col gap-4 border-b border-gray-200 pb-6">
                <div className="flex items-end justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Integrations Hub</h2>
                        <p className="text-gray-500 mt-1">Connect your media stack to unlock advanced features.</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search integrations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64"
                            />
                        </div>
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                        >
                            <option value="ALL">All Types</option>
                            <option value="DSP">DSP</option>
                            <option value="Data Provider">Data Provider</option>
                            {integrationTypes.filter(t => t !== 'DSP').map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Status Filter Tabs */}
                <div className="flex gap-2">
                    {(['ALL', 'ACTIVATED', 'DEACTIVATED', 'AVAILABLE'] as const).map(status => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${statusFilter === status
                                ? 'bg-gray-900 text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {status.charAt(0) + status.slice(1).toLowerCase().replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredIntegrations.map((integration) => (
                        <div
                            key={integration.id}
                            className={`bg-white rounded-xl border p-6 transition-all ${integration.status === 'CONNECTED' ? 'border-purple-200 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                                }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-lg bg-gray-50 p-2 border border-gray-100 flex items-center justify-center overflow-hidden">
                                        {integration.icon.startsWith('http') || integration.icon.startsWith('/') ? (
                                            <img src={integration.icon} alt={integration.name} className="w-full h-full object-cover rounded" />
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

                            <p className="text-sm text-gray-600 mb-6 min-h-[40px] line-clamp-2">
                                {integration.description}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                {integration.status === 'CONNECTED' ? (
                                    <>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-400">Last Synced</span>
                                            <span className="text-xs font-medium text-gray-700">
                                                {integration.lastSync ? new Date(integration.lastSync).toLocaleDateString() : 'Never'}
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
                                                <Loader2 className="w-4 h-4 animate-spin" />
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

                {filteredIntegrations.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-gray-500">No integrations found matching your search.</p>
                        <button
                            onClick={() => { setSearchQuery(''); setTypeFilter('ALL'); setStatusFilter('ALL'); }}
                            className="mt-2 text-purple-600 hover:text-purple-700 font-medium text-sm"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
