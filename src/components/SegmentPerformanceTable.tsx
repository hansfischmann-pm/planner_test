import React, { useState } from 'react';
import { SegmentPerformance } from '../utils/audienceInsights';
import { ArrowUpDown } from 'lucide-react';

interface SegmentPerformanceTableProps {
    segmentPerformance: Map<string, SegmentPerformance>;
}

type SortKey = 'name' | 'impressions' | 'ctr' | 'cvr' | 'cpa' | 'roas' | 'spend';

export const SegmentPerformanceTable: React.FC<SegmentPerformanceTableProps> = ({ segmentPerformance }) => {
    const [sortKey, setSortKey] = useState<SortKey>('roas');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const performanceArray = Array.from(segmentPerformance.values());

    const sortedPerformance = [...performanceArray].sort((a, b) => {
        let aVal: number | string = 0;
        let bVal: number | string = 0;

        switch (sortKey) {
            case 'name':
                aVal = a.segment.name;
                bVal = b.segment.name;
                break;
            case 'impressions':
                aVal = a.impressions;
                bVal = b.impressions;
                break;
            case 'ctr':
                aVal = a.ctr;
                bVal = b.ctr;
                break;
            case 'cvr':
                aVal = a.cvr;
                bVal = b.cvr;
                break;
            case 'cpa':
                aVal = a.cpa;
                bVal = b.cpa;
                break;
            case 'roas':
                aVal = a.roas;
                bVal = b.roas;
                break;
            case 'spend':
                aVal = a.spend;
                bVal = b.spend;
                break;
        }

        if (typeof aVal === 'string' && typeof bVal === 'string') {
            return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }

        return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('desc');
        }
    };

    if (performanceArray.length === 0) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
                <p className="text-gray-500">No performance data available yet. Performance metrics will appear once flights are active.</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="text-left p-4 text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>
                                <div className="flex items-center gap-2">
                                    Segment
                                    <ArrowUpDown className="w-4 h-4" />
                                </div>
                            </th>
                            <th className="text-right p-4 text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('impressions')}>
                                <div className="flex items-center justify-end gap-2">
                                    Impressions
                                    <ArrowUpDown className="w-4 h-4" />
                                </div>
                            </th>
                            <th className="text-right p-4 text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('ctr')}>
                                <div className="flex items-center justify-end gap-2">
                                    CTR
                                    <ArrowUpDown className="w-4 h-4" />
                                </div>
                            </th>
                            <th className="text-right p-4 text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('cvr')}>
                                <div className="flex items-center justify-end gap-2">
                                    CVR
                                    <ArrowUpDown className="w-4 h-4" />
                                </div>
                            </th>
                            <th className="text-right p-4 text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('cpa')}>
                                <div className="flex items-center justify-end gap-2">
                                    CPA
                                    <ArrowUpDown className="w-4 h-4" />
                                </div>
                            </th>
                            <th className="text-right p-4 text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('roas')}>
                                <div className="flex items-center justify-end gap-2">
                                    ROAS
                                    <ArrowUpDown className="w-4 h-4" />
                                </div>
                            </th>
                            <th className="text-right p-4 text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-gray-100" onClick={() => handleSort('spend')}>
                                <div className="flex items-center justify-end gap-2">
                                    Spend
                                    <ArrowUpDown className="w-4 h-4" />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sortedPerformance.map((perf, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                <td className="p-4">
                                    <div className="font-semibold text-gray-900">{perf.segment.name}</div>
                                    <div className="text-xs text-gray-500">{perf.segment.category}</div>
                                </td>
                                <td className="p-4 text-right font-mono text-sm text-gray-900">
                                    {perf.impressions.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </td>
                                <td className="p-4 text-right font-mono text-sm text-gray-900">
                                    {(perf.ctr * 100).toFixed(2)}%
                                </td>
                                <td className="p-4 text-right font-mono text-sm text-gray-900">
                                    {(perf.cvr * 100).toFixed(2)}%
                                </td>
                                <td className="p-4 text-right font-mono text-sm text-gray-900">
                                    ${perf.cpa.toFixed(2)}
                                </td>
                                <td className={`p-4 text-right font-mono text-sm font-semibold ${perf.roas > 3 ? 'text-green-600' : perf.roas > 1 ? 'text-blue-600' : 'text-orange-600'
                                    }`}>
                                    {perf.roas.toFixed(2)}x
                                </td>
                                <td className="p-4 text-right font-mono text-sm text-gray-900">
                                    ${perf.spend.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
