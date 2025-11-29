import React, { useState } from 'react';
import { Creative } from '../types';
import { Upload, Image as ImageIcon, Film, MoreHorizontal, Plus } from 'lucide-react';

interface CreativeLibraryProps {
    creatives: Creative[];
    onUpload: (name: string, type: 'IMAGE' | 'VIDEO') => void;
    onSelect?: (creative: Creative) => void;
}

export const CreativeLibrary: React.FC<CreativeLibraryProps> = ({ creatives, onUpload, onSelect }) => {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadName, setUploadName] = useState('');
    const [uploadType, setUploadType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');

    const handleUpload = () => {
        if (uploadName) {
            onUpload(uploadName, uploadType);
            setUploadName('');
            setIsUploading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                    <h3 className="font-semibold text-gray-900">Creative Library</h3>
                    <p className="text-xs text-gray-500">{creatives.length} assets available</p>
                </div>
                <button
                    onClick={() => setIsUploading(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Upload size={16} />
                    Upload
                </button>
            </div>

            {isUploading && (
                <div className="p-4 bg-blue-50 border-b border-blue-100 animate-in slide-in-from-top-2">
                    <div className="flex gap-3 items-end">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Asset Name</label>
                            <input
                                type="text"
                                value={uploadName}
                                onChange={(e) => setUploadName(e.target.value)}
                                placeholder="e.g. Summer Sale Banner"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                            <select
                                value={uploadType}
                                onChange={(e) => setUploadType(e.target.value as any)}
                                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="IMAGE">Image</option>
                                <option value="VIDEO">Video</option>
                            </select>
                        </div>
                        <button
                            onClick={handleUpload}
                            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                        >
                            Add
                        </button>
                        <button
                            onClick={() => setIsUploading(false)}
                            className="px-4 py-2 text-gray-600 text-sm font-medium hover:bg-gray-100 rounded-lg"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="p-4 overflow-y-auto flex-1">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {creatives.map(creative => (
                        <div
                            key={creative.id}
                            className="group relative border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-all cursor-pointer bg-white"
                            onClick={() => onSelect?.(creative)}
                        >
                            <div className="aspect-video bg-gray-100 relative overflow-hidden">
                                {creative.type === 'VIDEO' ? (
                                    <video src={creative.url} className="w-full h-full object-cover" muted loop onMouseOver={e => e.currentTarget.play()} onMouseOut={e => e.currentTarget.pause()} />
                                ) : (
                                    <img src={creative.url} alt={creative.name} className="w-full h-full object-cover" />
                                )}
                                <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                                    {creative.dimensions}
                                </div>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    {onSelect && <div className="bg-white text-gray-900 px-3 py-1 rounded-full text-xs font-medium shadow-sm">Select</div>}
                                </div>
                            </div>
                            <div className="p-3">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        {creative.type === 'VIDEO' ? <Film size={14} className="text-purple-500 shrink-0" /> : <ImageIcon size={14} className="text-blue-500 shrink-0" />}
                                        <h4 className="text-sm font-medium text-gray-900 truncate" title={creative.name}>{creative.name}</h4>
                                    </div>
                                    <button className="text-gray-400 hover:text-gray-600">
                                        <MoreHorizontal size={14} />
                                    </button>
                                </div>
                                {creative.metrics && (
                                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                                        <div>
                                            <span className="font-medium text-gray-900">{(creative.metrics.ctr * 100).toFixed(2)}%</span> CTR
                                        </div>
                                        <div>
                                            <span className="font-medium text-gray-900">{creative.metrics.conversions}</span> Conv
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Empty State / Add New Placeholder */}
                    <button
                        onClick={() => setIsUploading(true)}
                        className="border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition-all aspect-video"
                    >
                        <Plus size={24} />
                        <span className="text-sm font-medium">Add New</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
