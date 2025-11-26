import React, { useState, useRef, useEffect } from 'react';
import { Brand } from '../types';
import { ChevronDown, Search, Check } from 'lucide-react';

interface ClientSwitcherProps {
    currentBrand: Brand;
    allBrands: Brand[];
    onSwitchBrand: (brand: Brand) => void;
}

export const ClientSwitcher: React.FC<ClientSwitcherProps> = ({ currentBrand, allBrands, onSwitchBrand }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredBrands = allBrands.filter(brand =>
        brand.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
            >
                <div className="h-6 w-6 rounded bg-gray-100 flex items-center justify-center overflow-hidden">
                    <img src={currentBrand.logoUrl} alt={currentBrand.name} className="h-full w-full object-contain" />
                </div>
                <span className="font-semibold text-gray-900 text-sm">{currentBrand.name}</span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    <div className="px-3 pb-2 border-b border-gray-50">
                        <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Switch client..."
                                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto py-1">
                        {filteredBrands.length > 0 ? (
                            filteredBrands.map(brand => (
                                <button
                                    key={brand.id}
                                    onClick={() => {
                                        onSwitchBrand(brand);
                                        setIsOpen(false);
                                        setSearchTerm('');
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center justify-between group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded bg-white border border-gray-100 flex items-center justify-center p-1">
                                            <img src={brand.logoUrl} alt={brand.name} className="max-h-full max-w-full object-contain" />
                                        </div>
                                        <span className={`text-sm ${brand.id === currentBrand.id ? 'font-semibold text-purple-700' : 'text-gray-700'}`}>
                                            {brand.name}
                                        </span>
                                    </div>
                                    {brand.id === currentBrand.id && (
                                        <Check className="h-4 w-4 text-purple-600" />
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="px-4 py-3 text-sm text-gray-500 text-center">
                                No clients found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
