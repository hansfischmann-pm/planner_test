import React, { useState } from 'react';
import { Placement } from '../types';
import { X, Image as ImageIcon, Film, Upload } from 'lucide-react';
import { clsx } from 'clsx';

interface PlacementDetailPanelProps {
    placement: Placement | null;
    onClose: () => void;
    onUpdate: (updatedPlacement: Placement) => void;
}

export const PlacementDetailPanel: React.FC<PlacementDetailPanelProps> = ({ placement, onClose, onUpdate }) => {
    const [isUploading, setIsUploading] = useState(false);

    if (!placement) return null;

    const handleBuyingTypeChange = (type: 'Auction' | 'PMP' | 'Direct') => {
        const updated = { ...placement, buyingType: type };
        // Reset fields if switching types
        if (type === 'Auction') {
            updated.dealId = undefined;
            updated.ioNumber = undefined;
        } else if (type === 'PMP') {
            updated.ioNumber = undefined;
            if (!updated.dealId) updated.dealId = '';
        } else if (type === 'Direct') {
            updated.dealId = undefined;
            if (!updated.ioNumber) updated.ioNumber = '';
        }
        onUpdate(updated);
    };

    const handleFieldChange = (field: keyof Placement, value: string) => {
        onUpdate({ ...placement, [field]: value });
    };

    const handleSimulateUpload = () => {
        setIsUploading(true);
        setTimeout(() => {
            const newCreative = {
                id: Math.random().toString(36).substr(2, 9),
                name: `Uploaded Asset ${Math.floor(Math.random() * 100)}.jpg`,
                type: 'image' as const,
                url: `https://picsum.photos/seed/${Math.random()}/400/300`
            };
            onUpdate({ ...placement, creative: newCreative });
            setIsUploading(false);
        }, 1500);
    };

    return (
        <div className="fixed inset-y-0 right-0 w-[480px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50 flex flex-col border-l border-gray-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{placement.vendor}</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <span className={clsx(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                            placement.channel === 'Search' && "bg-blue-100 text-blue-800",
                            placement.channel === 'Social' && "bg-pink-100 text-pink-800",
                            placement.channel === 'Display' && "bg-purple-100 text-purple-800",
                            ['TV', 'Radio', 'OOH', 'Print'].includes(placement.channel) && "bg-orange-100 text-orange-800"
                        )}>
                            {placement.channel}
                        </span>
                        <span className="text-gray-400 text-sm">•</span>
                        <span className="text-gray-500 text-sm">{placement.adUnit}</span>
                    </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">

                {/* Buying Section */}
                <section>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Buying Configuration</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Buying Type</label>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                {(['Auction', 'PMP', 'Direct'] as const).map((type) => (
                                    <button
                                        key={type}
                                        onClick={() => handleBuyingTypeChange(type)}
                                        className={clsx(
                                            "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                                            placement.buyingType === type ? "bg-white text-blue-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                        )}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {placement.buyingType === 'PMP' && (
                            <div className="animate-fade-in">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deal ID</label>
                                <input
                                    type="text"
                                    value={placement.dealId || ''}
                                    onChange={(e) => handleFieldChange('dealId', e.target.value)}
                                    placeholder="e.g. PMP-123456"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        )}

                        {placement.buyingType === 'Direct' && (
                            <div className="animate-fade-in">
                                <label className="block text-sm font-medium text-gray-700 mb-1">IO Number</label>
                                <input
                                    type="text"
                                    value={placement.ioNumber || ''}
                                    onChange={(e) => handleFieldChange('ioNumber', e.target.value)}
                                    placeholder="e.g. IO-2024-001"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                />
                            </div>
                        )}
                    </div>
                </section>

                <hr className="border-gray-100" />

                {/* Creative Section */}
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Creative Asset</h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {placement.channel === 'TV' || placement.channel === 'Social' ? 'Video Required' : 'Image Required'}
                        </span>
                    </div>

                    <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 p-6 text-center group hover:border-blue-300 transition-colors relative overflow-hidden">
                        {placement.creative ? (
                            <div className="relative">
                                {placement.creative.type === 'video' ? (
                                    <div className="aspect-video bg-black rounded-lg flex items-center justify-center relative overflow-hidden">
                                        <video src={placement.creative.url} controls className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <img
                                        src={placement.creative.url}
                                        alt={placement.creative.name}
                                        className="w-full h-48 object-cover rounded-lg shadow-sm"
                                    />
                                )}
                                <div className="mt-3 flex items-center justify-between text-left">
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">{placement.creative.name}</p>
                                        <p className="text-xs text-gray-500 uppercase">{placement.creative.type}</p>
                                    </div>
                                    <button
                                        onClick={() => onUpdate({ ...placement, creative: undefined })}
                                        className="text-red-500 text-xs hover:underline"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="py-8">
                                <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                                    {placement.channel === 'TV' ? <Film className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                                </div>
                                <p className="text-sm text-gray-600 mb-4">No creative selected</p>
                                <button
                                    onClick={handleSimulateUpload}
                                    disabled={isUploading}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    {isUploading ? (
                                        <>Uploading...</>
                                    ) : (
                                        <>
                                            <Upload className="w-4 h-4" />
                                            Upload Asset
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </section>

                <hr className="border-gray-100" />

                {/* Forecasting & Delivery Section */}
                <section>
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Forecasting & Delivery</h3>
                    <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Source</span>
                            <span className="text-sm font-medium text-gray-900 bg-white px-2 py-1 rounded border border-gray-200 shadow-sm">
                                {placement.forecast?.source || 'Internal'}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Forecast Impr.</label>
                                <p className="text-sm text-gray-900 font-mono">{(placement.forecast?.impressions || 0).toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Actual Impr.</label>
                                <p className="text-sm text-gray-900 font-mono">{(placement.delivery?.actualImpressions || 0).toLocaleString()}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Pacing</label>
                                <div className="flex items-center gap-2">
                                    <span className={clsx("text-sm font-bold",
                                        placement.delivery?.status === 'UNDER_PACING' ? "text-red-600" :
                                            placement.delivery?.status === 'OVER_PACING' ? "text-yellow-600" : "text-green-600"
                                    )}>
                                        {placement.delivery?.pacing || 0}%
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        ({placement.delivery?.status?.replace('_', ' ') || 'ON TRACK'})
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Reach / Freq</label>
                                <p className="text-sm text-gray-900 font-mono">
                                    {(placement.forecast?.reach || 0).toLocaleString()} / {(placement.forecast?.frequency || 0).toFixed(1)}x
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <hr className="border-gray-100" />

                {/* Read Only Details */}
                <section className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Start Date</label>
                        <p className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded-lg">{placement.startDate}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">End Date</label>
                        <p className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded-lg">{placement.endDate}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Rate</label>
                        <p className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded-lg">${placement.rate.toLocaleString()}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Total Cost</label>
                        <p className="text-sm text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded-lg">${placement.totalCost.toLocaleString()}</p>
                    </div>
                </section>

            </div>
        </div >
    );
};
