import React, { useState, useMemo } from 'react';
import { Brand } from '../types';
import { Building2, TrendingUp, Wallet, ArrowRight, Link2, Search, Users, Activity } from 'lucide-react';

interface ClientSelectionDashboardProps {
    brands: Brand[];
    onSelectBrand: (brand: Brand) => void;
    onUpdateBrand: (brand: Brand) => void;
    onViewAnalytics: () => void;
    onViewIntegrations: () => void;
}

export const ClientSelectionDashboard: React.FC<ClientSelectionDashboardProps> = ({ brands, onSelectBrand, onUpdateBrand, onViewAnalytics, onViewIntegrations }) => {
    // Filter & Sort State
    const [searchQuery, setSearchQuery] = useState('');
    const [industryFilter, setIndustryFilter] = useState<string>('ALL');
    const [tierFilter, setTierFilter] = useState<string>('ALL');
    const [statusFilter, setStatusFilter] = useState<'Active' | 'Inactive' | 'ALL'>('Active');
    const [sortBy, setSortBy] = useState<'name' | 'revenue' | 'activity' | 'campaigns'>('activity');

    // Derived lists for filter dropdowns
    const industries = useMemo(() => {
        const unique = new Set(brands.map(b => b.industry).filter(Boolean));
        return Array.from(unique).sort();
    }, [brands]);

    const filteredClients = useMemo(() => {
        return brands
            .filter(brand => {
                const matchesSearch = brand.name.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesIndustry = industryFilter === 'ALL' || brand.industry === industryFilter;
                const matchesTier = tierFilter === 'ALL' || brand.tier === tierFilter;
                const matchesStatus = statusFilter === 'ALL' || brand.status === statusFilter;

                return matchesSearch && matchesIndustry && matchesTier && matchesStatus;
            })
            .sort((a, b) => {
                if (sortBy === 'name') {
                    return a.name.localeCompare(b.name);
                } else if (sortBy === 'revenue') {
                    return (b.monthlySpend || 0) - (a.monthlySpend || 0);
                } else if (sortBy === 'activity') {
                    return new Date(b.lastActivity || 0).getTime() - new Date(a.lastActivity || 0).getTime();
                } else if (sortBy === 'campaigns') {
                    return (b.campaignCount || 0) - (a.campaignCount || 0);
                }
                return 0;
            });
    }, [brands, searchQuery, industryFilter, tierFilter, statusFilter, sortBy]);

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-600 p-2 rounded-lg">
                            <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">Agency Workspace</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onViewIntegrations}
                            className="text-sm font-medium text-gray-600 hover:text-blue-600 flex items-center gap-2"
                        >
                            <Link2 className="h-4 w-4" />
                            Integrations
                        </button>
                        <button
                            onClick={onViewAnalytics}
                            className="text-sm font-medium text-gray-600 hover:text-purple-600 flex items-center gap-2"
                        >
                            <TrendingUp className="h-4 w-4" />
                            Agency Analytics
                        </button>
                        <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
                            A
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Select a Client</h2>
                    <p className="mt-1 text-sm text-gray-500">Manage campaigns and media plans for your portfolio</p>
                </div>

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search clients..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                            <select
                                value={industryFilter}
                                onChange={(e) => setIndustryFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="ALL">All Industries</option>
                                {industries.map(ind => (
                                    <option key={ind} value={ind}>{ind}</option>
                                ))}
                            </select>

                            <select
                                value={tierFilter}
                                onChange={(e) => setTierFilter(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="ALL">All Tiers</option>
                                <option value="Enterprise">Enterprise</option>
                                <option value="Mid-Market">Mid-Market</option>
                                <option value="SMB">SMB</option>
                            </select>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="activity">Recent Activity</option>
                                <option value="name">Name (A-Z)</option>
                                <option value="revenue">Monthly Spend</option>
                                <option value="campaigns">Campaign Count</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status:</span>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            {(['Active', 'Inactive', 'ALL'] as const).map(status => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${statusFilter === status
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {status === 'ALL' ? 'All Statuses' : status}
                                </button>
                            ))}
                        </div>
                        <div className="ml-auto text-xs text-gray-500">
                            Showing {filteredClients.length} of {brands.length} clients
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredClients.map((brand) => (
                        <div
                            key={brand.id}
                            onClick={() => onSelectBrand(brand)}
                            className="bg-white overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-100 group hover:border-purple-200"
                        >
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center p-2">
                                            <img src={brand.logoUrl} alt={brand.name} className="max-h-full max-w-full object-contain" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                                                {brand.name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        const newStatus = brand.status === 'Active' ? 'Inactive' : 'Active';
                                                        onUpdateBrand({ ...brand, status: newStatus as any });
                                                    }}
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium hover:opacity-80 transition-opacity ${brand.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                                        }`}
                                                    title="Click to toggle status"
                                                >
                                                    {brand.status || 'Active'}
                                                </button>
                                                {brand.tier && (
                                                    <span className="text-xs text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
                                                        {brand.tier}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-purple-500 transition-colors" />
                                </div>

                                <div className="space-y-3">
                                    {brand.industry && (
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-gray-400" />
                                            {brand.industry}
                                        </p>
                                    )}
                                    {brand.accountManager && (
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <Users className="h-4 w-4 text-gray-400" />
                                            {brand.accountManager}
                                        </p>
                                    )}
                                    {brand.lastActivity && (
                                        <p className="text-xs text-gray-500 flex items-center gap-2">
                                            <Activity className="h-3 w-3 text-gray-400" />
                                            Last active: {new Date(brand.lastActivity).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-4 mt-4 border-t border-gray-50">
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                            <TrendingUp className="h-3 w-3" />
                                            Campaigns
                                        </p>
                                        <p className="mt-1 text-lg font-semibold text-gray-900">{brand.campaignCount || brand.activeCampaigns || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 flex items-center gap-1">
                                            <Wallet className="h-3 w-3" />
                                            Monthly Spend
                                        </p>
                                        <p className="mt-1 text-lg font-semibold text-gray-900">
                                            ${(brand.monthlySpend || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {filteredClients.length === 0 && (
                    <div className="text-center py-12">
                        <div className="bg-gray-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
                            <Search className="h-6 w-6 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No clients found</h3>
                        <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setIndustryFilter('ALL');
                                setTierFilter('ALL');
                                setStatusFilter('ALL');
                            }}
                            className="mt-4 text-purple-600 font-medium hover:text-purple-700"
                        >
                            Clear all filters
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
};
