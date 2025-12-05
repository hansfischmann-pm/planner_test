import React from 'react';
import {
    FolderOpen,
    PlusCircle,
    Search,
    FileQuestion,
    Inbox,
    TrendingUp
} from 'lucide-react';

interface EmptyStateProps {
    variant?: 'no-campaigns' | 'no-placements' | 'no-results' | 'no-data' | 'generic';
    title?: string;
    description?: string;
    actionLabel?: string;
    onAction?: () => void;
    icon?: React.ReactNode;
    className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    variant = 'generic',
    title,
    description,
    actionLabel,
    onAction,
    icon,
    className = '',
}) => {
    // Default configurations for each variant
    const variantConfig = {
        'no-campaigns': {
            icon: <FolderOpen className="w-12 h-12" />,
            title: 'No Campaigns Yet',
            description: 'Get started by creating your first campaign. Use the chat interface to say "create a new campaign" or click the button below.',
            actionLabel: 'Create Campaign',
        },
        'no-placements': {
            icon: <Inbox className="w-12 h-12" />,
            title: 'No Placements',
            description: 'This campaign doesn\'t have any placements yet. Add placements to start planning your media buy.',
            actionLabel: 'Add Placement',
        },
        'no-results': {
            icon: <Search className="w-12 h-12" />,
            title: 'No Results Found',
            description: 'We couldn\'t find anything matching your search. Try different keywords or clear your filters.',
            actionLabel: 'Clear Filters',
        },
        'no-data': {
            icon: <FileQuestion className="w-12 h-12" />,
            title: 'No Data Available',
            description: 'There\'s no data to display at this time. Check back later or try refreshing the page.',
            actionLabel: 'Refresh',
        },
        'generic': {
            icon: <TrendingUp className="w-12 h-12" />,
            title: 'Nothing Here Yet',
            description: 'Start by adding some content.',
            actionLabel: 'Get Started',
        },
    };

    const config = variantConfig[variant];
    const displayTitle = title || config.title;
    const displayDescription = description || config.description;
    const displayActionLabel = actionLabel || config.actionLabel;
    const displayIcon = icon || config.icon;

    return (
        <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
            <div className="p-4 bg-gray-100 rounded-full text-gray-400 mb-4">
                {displayIcon}
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">
                {displayTitle}
            </h3>

            <p className="text-gray-600 max-w-md mb-6">
                {displayDescription}
            </p>

            {onAction && displayActionLabel && (
                <button
                    onClick={onAction}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <PlusCircle className="w-4 h-4" />
                    {displayActionLabel}
                </button>
            )}
        </div>
    );
};
