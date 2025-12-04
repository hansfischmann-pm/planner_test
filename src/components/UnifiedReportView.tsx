import React, { useState } from 'react';
import { Campaign } from '../types';
import { Download, Filter, ArrowUpDown, ArrowUp, ArrowDown, Search } from 'lucide-react';

interface UnifiedReportViewProps {
    campaigns: Campaign[];
}

type SortField = 'name' | 'status' | 'budget' | 'spend' | 'revenue' | 'roas';
type SortDirection = 'asc' | 'desc';

export const UnifiedReportView: React.FC<UnifiedReportViewProps> = ({ campaigns }) => {
    const [sortField, setSortField] = useState<SortField>('spend');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [filterStatus, setFilterStatus] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
        return sortDirection === 'asc'
            ? <ArrowUp className="w-3 h-3 text-blue-600" />
            : <ArrowDown className="w-3 h-3 text-blue-600" />;
    };

    const filteredCampaigns = campaigns.filter(c => {
        const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
        const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const sortedCampaigns = [...filteredCampaigns].sort((a, b) => {
        let valA: any = a[fieldToProp(sortField)];
        let valB: any = b[fieldToProp(sortField)];

        // Handle nested performance props
        if (['spend', 'revenue', 'roas'].includes(sortField)) {
            valA = a.performance?.[sortField as keyof typeof a.performance] || 0;
            valB = b.performance?.[sortField as keyof typeof b.performance] || 0;
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    function fieldToProp(field: SortField): keyof Campaign {
        if (['spend', 'revenue', 'roas'].includes(field)) return 'performance' as any;
        return field as keyof Campaign;
    }

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);

    const handleExport = () => {
        const headers = ['Campaign Name', 'Status', 'Budget', 'Spend', 'Revenue', 'ROAS'];
        const rows = sortedCampaigns.map(c => [
            c.name,
            c.status,
            c.budget,
            c.performance?.spend || 0,
            c.performance?.revenue || 0,
            (c.performance?.roas || 0).toFixed(2)
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">Unified Campaign Report</h3>
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                        {sortedCampaigns.length} Campaigns
                    </span>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search campaigns..."
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-64"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div className="flex items-center gap-2 border-l border-gray-200 pl-3">
                        <Filter className="w-4 h-4 text-gray-400" />
                        <select
                            className="text-sm border-none focus:ring-0 text-gray-600 font-medium cursor-pointer bg-transparent"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="ACTIVE">Active</option>
                            <option value="PAUSED">Paused</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="DRAFT">Draft</option>
                        </select>
                    </div>

                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Export CSV
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 font-semibold text-gray-900 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                                <div className="flex items-center gap-1">Campaign Name {getSortIcon('name')}</div>
                            </th>
                            <th className="px-6 py-3 font-semibold text-gray-900 cursor-pointer hover:bg-gray-100" onClick={() => handleSort('status')}>
                                <div className="flex items-center gap-1">Status {getSortIcon('status')}</div>
                            </th>
                            <th className="px-6 py-3 font-semibold text-gray-900 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('budget')}>
                                <div className="flex items-center justify-end gap-1">Budget {getSortIcon('budget')}</div>
                            </th>
                            <th className="px-6 py-3 font-semibold text-gray-900 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('spend')}>
                                <div className="flex items-center justify-end gap-1">Spend {getSortIcon('spend')}</div>
                            </th>
                            <th className="px-6 py-3 font-semibold text-gray-900 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('revenue')}>
                                <div className="flex items-center justify-end gap-1">Revenue {getSortIcon('revenue')}</div>
                            </th>
                            <th className="px-6 py-3 font-semibold text-gray-900 text-right cursor-pointer hover:bg-gray-100" onClick={() => handleSort('roas')}>
                                <div className="flex items-center justify-end gap-1">ROAS {getSortIcon('roas')}</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sortedCampaigns.length > 0 ? (
                            sortedCampaigns.map((campaign) => (
                                <tr key={campaign.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900">{campaign.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                            ${campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                                                campaign.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-800' :
                                                    'bg-gray-100 text-gray-800'}`}>
                                            {campaign.status.toLowerCase()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(campaign.budget)}</td>
                                    <td className="px-6 py-4 text-right text-gray-900 font-medium">{formatCurrency(campaign.performance?.spend || 0)}</td>
                                    <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(campaign.performance?.revenue || 0)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={`font-bold ${(campaign.performance?.roas || 0) >= 2.5 ? 'text-green-600' : (campaign.performance?.roas || 0) >= 1.5 ? 'text-yellow-600' : 'text-red-600'}`}>
                                            {(campaign.performance?.roas || 0).toFixed(2)}x
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                    No campaigns found matching your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center text-xs text-gray-500">
                <span>Showing {sortedCampaigns.length} of {campaigns.length} campaigns</span>
                <span>Last updated: Just now</span>
            </div>
        </div>
    );
};
