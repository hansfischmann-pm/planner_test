import React, { useState, useMemo } from 'react';
import { Campaign, CampaignTemplate } from '../types';
import { Calendar, DollarSign, ArrowRight, Plus, MessageSquare, Send, Sparkles } from 'lucide-react';
import { TemplateLibrary } from './TemplateLibrary';
import { TemplateWizard } from './TemplateWizard';

interface CampaignListProps {
    campaigns: Campaign[];
    onSelectCampaign: (campaign: Campaign) => void;
    onCreateCampaign?: (name: string, budget?: number, startDate?: string, endDate?: string, goals?: string[]) => void;
    onCreateFromTemplate?: (campaign: Campaign) => void;
    brandId?: string;
    brandName?: string;
}

export const CampaignList: React.FC<CampaignListProps> = ({ campaigns, onSelectCampaign, onCreateCampaign, onCreateFromTemplate, brandId, brandName }) => {
    const [showNewCampaign, setShowNewCampaign] = useState(false);
    const [campaignName, setCampaignName] = useState('');
    const [campaignBudget, setCampaignBudget] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Template state
    const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<CampaignTemplate | null>(null);

    const handleCreate = () => {
        if (campaignName.trim() && onCreateCampaign) {
            onCreateCampaign(
                campaignName.trim(),
                campaignBudget ? parseFloat(campaignBudget) : undefined,
                startDate || undefined,
                endDate || undefined
            );
            setCampaignName('');
            setCampaignBudget('');
            setStartDate('');
            setEndDate('');
            setShowNewCampaign(false);
        }
    };

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'DRAFT' | 'COMPLETED' | 'ARCHIVED'>('ALL');
    const [sortBy, setSortBy] = useState<'status' | 'name' | 'startDate' | 'endDate' | 'budget'>('status');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [visibleCount, setVisibleCount] = useState(20);

    // Filter and sort campaigns
    const filteredCampaigns = useMemo(() => {
        // First filter
        const filtered = campaigns.filter(c => {
            const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

            if (statusFilter === 'ALL') return matchesSearch && c.status !== 'ARCHIVED';
            if (statusFilter === 'ARCHIVED') return matchesSearch && c.status === 'ARCHIVED';
            return matchesSearch && c.status === statusFilter;
        });

        // Then sort
        return filtered.sort((a, b) => {
            let comparison = 0;

            if (sortBy === 'status') {
                const statusOrder: Record<string, number> = {
                    ACTIVE: 1,
                    PAUSED: 2,
                    DRAFT: 3,
                    COMPLETED: 4,
                    ARCHIVED: 5
                };
                comparison = (statusOrder[a.status] || 999) - (statusOrder[b.status] || 999);
            } else if (sortBy === 'name') {
                comparison = a.name.localeCompare(b.name);
            } else if (sortBy === 'startDate') {
                comparison = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
            } else if (sortBy === 'endDate') {
                comparison = new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
            } else if (sortBy === 'budget') {
                comparison = a.budget - b.budget;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [campaigns, searchQuery, statusFilter, sortBy, sortDirection]);

    const visibleCampaigns = filteredCampaigns.slice(0, visibleCount);
    const hasMore = visibleCount < filteredCampaigns.length;

    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 20);
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowTemplateLibrary(true)}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center gap-2 shadow-sm"
                        >
                            <Sparkles className="h-4 w-4" />
                            Use Template
                        </button>
                        <button
                            onClick={() => setShowNewCampaign(!showNewCampaign)}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            New Campaign
                        </button>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            placeholder="Search campaigns by name or tag..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <div className="absolute left-3 top-2.5 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                        </div>
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {(['ALL', 'ACTIVE', 'PAUSED', 'DRAFT', 'COMPLETED', 'ARCHIVED'] as const).map(status => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${statusFilter === status
                                    ? 'bg-white text-purple-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {status.charAt(0) + status.slice(1).toLowerCase()}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                            className="px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="status">Sort by Status</option>
                            <option value="name">Sort by Name</option>
                            <option value="startDate">Sort by Start Date</option>
                            <option value="endDate">Sort by End Date</option>
                            <option value="budget">Sort by Budget</option>
                        </select>
                        <button
                            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                            className="p-1.5 text-gray-500 hover:text-gray-700 rounded-md transition-colors"
                        >
                            {sortDirection === 'asc' ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Campaign Creation Input */}
            {showNewCampaign && (
                <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm">
                    {/* ... existing creation form ... */}
                    <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                        <h3 className="text-sm font-medium text-gray-900">Create New Campaign</h3>
                    </div>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Campaign Name</label>
                            <input
                                type="text"
                                value={campaignName}
                                onChange={(e) => setCampaignName(e.target.value)}
                                placeholder="e.g., 'Q2 2025 Campaign' or 'Holiday 2025'"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Budget</label>
                            <input
                                type="number"
                                value={campaignBudget}
                                onChange={(e) => setCampaignBudget(e.target.value)}
                                placeholder="e.g., 100000 (defaults to $100k if not specified)"
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
                                onClick={handleCreate}
                                disabled={!campaignName.trim()}
                                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Send className="h-4 w-4" />
                                Create Campaign
                            </button>
                            <button
                                onClick={() => {
                                    setCampaignName('');
                                    setCampaignBudget('');
                                    setStartDate('');
                                    setEndDate('');
                                    setShowNewCampaign(false);
                                }}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">
                            Tip: Dates default to today and +90 days if not specified
                        </p>
                    </div>
                </div>
            )}

            <div className="grid gap-4">
                {visibleCampaigns.map((campaign) => (
                    <div
                        key={campaign.id}
                        onClick={() => onSelectCampaign(campaign)}
                        className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-purple-200 transition-all cursor-pointer group"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                                    {campaign.name}
                                </h3>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-4 w-4" />
                                        <span>{campaign.startDate} - {campaign.endDate}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <DollarSign className="h-4 w-4" />
                                        <span>${campaign.budget.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                        campaign.status === 'DRAFT' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                        {campaign.status}
                                    </span>
                                    <div className="mt-1 text-xs text-gray-500">
                                        {campaign.flights.length} Flights
                                    </div>
                                </div>
                                <ArrowRight className="h-5 w-5 text-gray-300 group-hover:text-purple-500 transition-colors" />
                            </div>
                        </div>

                        {/* Progress bars */}
                        <div className="mt-4 space-y-2">
                            {/* Campaign Timeline */}
                            <div>
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>Campaign Timeline</span>
                                    <span>
                                        {(() => {
                                            const end = new Date(campaign.endDate);
                                            const now = new Date();
                                            const remaining = end.getTime() - now.getTime();
                                            const daysRemaining = Math.ceil(remaining / (1000 * 60 * 60 * 24));
                                            return daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Completed';
                                        })()}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full transition-all ${campaign.status === 'COMPLETED' ? 'bg-gray-600' : 'bg-purple-600'
                                            }`}
                                        style={{
                                            width: `${(() => {
                                                const start = new Date(campaign.startDate);
                                                const end = new Date(campaign.endDate);
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
                                        ${(campaign.delivery?.actualSpend || 0).toLocaleString()} / ${campaign.budget.toLocaleString()}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div
                                        className="h-1.5 rounded-full bg-green-500 transition-all"
                                        style={{ width: `${Math.min(100, ((campaign.delivery?.actualSpend || 0) / campaign.budget) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Forecast to Actuals */}
                            <div>
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>Forecast to Actuals</span>
                                    <span>
                                        {((campaign.delivery?.actualImpressions || 0) / 1000000).toFixed(1)}M / {((campaign.forecast?.impressions || 0) / 1000000).toFixed(1)}M
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5">
                                    <div
                                        className={`h-1.5 rounded-full transition-all ${campaign.delivery?.status === 'UNDER_PACING' ? 'bg-red-500' :
                                            campaign.delivery?.status === 'OVER_PACING' ? 'bg-yellow-500' : 'bg-blue-500'
                                            }`}
                                        style={{ width: `${Math.min(100, ((campaign.delivery?.actualImpressions || 0) / Math.max(1, campaign.forecast?.impressions || 1)) * 100)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
                <div className="flex justify-center pt-4">
                    <button
                        onClick={handleLoadMore}
                        className="px-6 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-purple-600 transition-colors shadow-sm"
                    >
                        Load More ({filteredCampaigns.length - visibleCount} remaining)
                    </button>
                </div>
            )}

            {/* Template Library Modal */}
            {showTemplateLibrary && (
                <TemplateLibrary
                    onSelectTemplate={(template) => {
                        setSelectedTemplate(template);
                        setShowTemplateLibrary(false);
                    }}
                    onClose={() => setShowTemplateLibrary(false)}
                />
            )}

            {/* Template Wizard Modal */}
            {selectedTemplate && (
                <TemplateWizard
                    template={selectedTemplate}
                    brandId={brandId || 'default-brand'}
                    brandName={brandName || 'Brand'}
                    onComplete={(campaign) => {
                        if (onCreateFromTemplate) {
                            onCreateFromTemplate(campaign);
                        }
                        setSelectedTemplate(null);
                    }}
                    onCancel={() => setSelectedTemplate(null)}
                />
            )}
        </div>
    );
};
