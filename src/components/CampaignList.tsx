import React, { useState } from 'react';
import { Campaign } from '../types';
import { Calendar, DollarSign, ArrowRight, Plus, MessageSquare, Send } from 'lucide-react';

interface CampaignListProps {
    campaigns: Campaign[];
    onSelectCampaign: (campaign: Campaign) => void;
    onCreateCampaign?: (name: string) => void;
}

export const CampaignList: React.FC<CampaignListProps> = ({ campaigns, onSelectCampaign, onCreateCampaign }) => {
    const [showNewCampaign, setShowNewCampaign] = useState(false);
    const [campaignName, setCampaignName] = useState('');

    const handleCreate = () => {
        if (campaignName.trim() && onCreateCampaign) {
            onCreateCampaign(campaignName.trim());
            setCampaignName('');
            setShowNewCampaign(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Campaigns</h2>
                <button
                    onClick={() => setShowNewCampaign(!showNewCampaign)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    New Campaign
                </button>
            </div>

            {/* Campaign Creation Input */}
            {showNewCampaign && (
                <div className="bg-white p-4 rounded-xl border border-purple-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                        <h3 className="text-sm font-medium text-gray-900">Create New Campaign</h3>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={campaignName}
                            onChange={(e) => setCampaignName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                            placeholder="Enter campaign name (e.g., 'Q2 2025 Campaign')"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        <button
                            onClick={handleCreate}
                            disabled={!campaignName.trim()}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <Send className="h-4 w-4" />
                            Create
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                        Tip: You can also type naturally like "Create a campaign for Q3 2025"
                    </p>
                </div>
            )}

            <div className="grid gap-4">
                {campaigns.map((campaign) => (
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
                                        campaign.status === 'PLANNING' ? 'bg-blue-100 text-blue-800' :
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

                        {/* Progress bar */}
                        <div className="mt-4">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Progress</span>
                                <span>{campaign.status === 'COMPLETED' ? '100%' : campaign.status === 'ACTIVE' ? '45%' : '10%'}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5">
                                <div
                                    className={`h-1.5 rounded-full ${campaign.status === 'COMPLETED' ? 'bg-gray-600' : 'bg-purple-600'}`}
                                    style={{ width: campaign.status === 'COMPLETED' ? '100%' : campaign.status === 'ACTIVE' ? '45%' : '10%' }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
