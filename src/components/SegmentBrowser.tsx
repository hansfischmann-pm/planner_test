import React, { useState, useMemo } from 'react';
import { Segment } from '../types';
import { SEGMENT_LIBRARY, SegmentCategory, searchSegments, getSegmentsByCategory } from '../data/segmentLibrary';
import { Search, X, Users, DollarSign, Check, Filter } from 'lucide-react';

interface SegmentBrowserProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectSegments: (segments: Segment[]) => void;
    initialSelectedSegments?: Segment[];
}

export const SegmentBrowser: React.FC<SegmentBrowserProps> = ({
    isOpen,
    onClose,
    onSelectSegments,
    initialSelectedSegments = []
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<SegmentCategory | 'ALL'>('ALL');
    const [selectedSegments, setSelectedSegments] = useState<Segment[]>(initialSelectedSegments);

    // Reset state when modal opens
    React.useEffect(() => {
        if (isOpen) {
            setSelectedSegments(initialSelectedSegments);
            setSearchQuery('');
            setSelectedCategory('ALL');
        }
    }, [isOpen, initialSelectedSegments]);

    const categories: (SegmentCategory | 'ALL')[] = [
        'ALL',
        'Demographics',
        'Behavioral',
        'Interest',
        'B2B',
        'Contextual',
        'First-Party',
        'Pixel-Based'
    ];

    const filteredSegments = useMemo(() => {
        let segments = SEGMENT_LIBRARY;

        if (selectedCategory !== 'ALL') {
            segments = getSegmentsByCategory(selectedCategory as SegmentCategory);
        }

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            segments = segments.filter(seg =>
                seg.name.toLowerCase().includes(lowerQuery) ||
                seg.description?.toLowerCase().includes(lowerQuery) ||
                seg.vendor?.toLowerCase().includes(lowerQuery)
            );
        }

        return segments;
    }, [searchQuery, selectedCategory]);

    const toggleSegment = (segment: Omit<Segment, 'id'>) => {
        // We need to handle the fact that library segments don't have IDs until assigned
        // For comparison, we'll use name
        const isSelected = selectedSegments.some(s => s.name === segment.name);

        if (isSelected) {
            setSelectedSegments(prev => prev.filter(s => s.name !== segment.name));
        } else {
            // Assign a temporary ID if needed, or just pass it through
            const newSegment: Segment = {
                ...segment,
                id: `seg_${Math.random().toString(36).substr(2, 9)}`
            };
            setSelectedSegments(prev => [...prev, newSegment]);
        }
    };

    const handleSave = () => {
        onSelectSegments(selectedSegments);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Audience Segments</h2>
                        <p className="text-gray-500 mt-1">Select segments to target in your media plan.</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Controls */}
                <div className="p-6 border-b border-gray-200 bg-gray-50 space-y-4">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search segments by name, description, or vendor..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-500" />
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value as any)}
                                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Selected Summary */}
                    {selectedSegments.length > 0 && (
                        <div className="flex flex-wrap gap-2 items-center">
                            <span className="text-sm font-medium text-gray-700">Selected:</span>
                            {selectedSegments.map(seg => (
                                <span key={seg.name} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                    {seg.name}
                                    <button onClick={() => toggleSegment(seg)} className="hover:text-purple-900">
                                        <X className="w-3 h-3" />
                                    </button>
                                </span>
                            ))}
                            <button
                                onClick={() => setSelectedSegments([])}
                                className="text-xs text-gray-500 hover:text-gray-700 underline ml-2"
                            >
                                Clear all
                            </button>
                        </div>
                    )}
                </div>

                {/* Segment List */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 gap-4">
                        {filteredSegments.map((segment, index) => {
                            const isSelected = selectedSegments.some(s => s.name === segment.name);
                            return (
                                <div
                                    key={index}
                                    onClick={() => toggleSegment(segment)}
                                    className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${isSelected
                                        ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500'
                                        : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-900">{segment.name}</h3>
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                {segment.category}
                                            </span>
                                            {segment.vendor && (
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full border border-blue-100">
                                                    {segment.vendor}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600">{segment.description}</p>
                                    </div>

                                    <div className="flex items-center gap-6 text-sm text-gray-500">
                                        <div className="flex flex-col items-end min-w-[80px]">
                                            <div className="flex items-center gap-1" title="Estimated Reach">
                                                <Users className="w-4 h-4" />
                                                <span className="font-medium text-gray-900">
                                                    {segment.reach ? (segment.reach / 1000000).toFixed(1) + 'M' : 'N/A'}
                                                </span>
                                            </div>
                                            <span className="text-xs">Reach</span>
                                        </div>

                                        <div className="flex flex-col items-end min-w-[80px]">
                                            <div className="flex items-center gap-1" title="CPM Uplift">
                                                <DollarSign className="w-4 h-4" />
                                                <span className="font-medium text-gray-900">
                                                    +{segment.cpmUplift.toFixed(2)}
                                                </span>
                                            </div>
                                            <span className="text-xs">CPM Uplift</span>
                                        </div>

                                        <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300'
                                            }`}>
                                            {isSelected && <Check className="w-4 h-4" />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {filteredSegments.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                No segments found matching your search.
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-6 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm"
                    >
                        Apply {selectedSegments.length > 0 ? `(${selectedSegments.length})` : ''}
                    </button>
                </div>
            </div>
        </div>
    );
};
