import React, { useState, useRef, useEffect } from 'react';
import { LayoutDashboard, ChevronDown } from 'lucide-react';
import { LayoutPosition } from '../types';
import { clsx } from 'clsx';

interface LayoutControlsProps {
    currentLayout: LayoutPosition;
    onLayoutChange: (layout: LayoutPosition) => void;
}

export const LayoutControls: React.FC<LayoutControlsProps> = ({ currentLayout, onLayoutChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const layouts: { position: LayoutPosition; label: string }[] = [
        { position: 'LEFT', label: 'Left Panel' },
        { position: 'RIGHT', label: 'Right Panel' },
        { position: 'BOTTOM', label: 'Bottom Panel' }
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const handleSelect = (position: LayoutPosition) => {
        onLayoutChange(position);
        setIsOpen(false);
    };

    const currentLabel = layouts.find(l => l.position === currentLayout)?.label || 'Left Panel';

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Change Layout"
            >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden md:inline text-xs">{currentLabel}</span>
                <ChevronDown className={clsx(
                    "h-3 w-3 transition-transform",
                    isOpen && "rotate-180"
                )} />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {layouts.map(({ position, label }) => (
                        <button
                            key={position}
                            onClick={() => handleSelect(position)}
                            className={clsx(
                                "w-full px-4 py-2 text-left text-sm transition-colors flex items-center justify-between",
                                currentLayout === position
                                    ? "bg-purple-50 text-purple-700 font-medium"
                                    : "text-gray-700 hover:bg-gray-50"
                            )}
                        >
                            <span>{label}</span>
                            {currentLayout === position && (
                                <span className="text-purple-600">✓</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
