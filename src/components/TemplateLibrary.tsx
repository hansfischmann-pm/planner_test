import React, { useState } from 'react';
import { CampaignTemplate, TemplateCategory } from '../types';
import { CAMPAIGN_TEMPLATES } from '../logic/campaignTemplates';
import { X, Search, TrendingUp, ShoppingCart, Briefcase, Rocket, Store } from 'lucide-react';

interface TemplateLibraryProps {
    onSelectTemplate: (template: CampaignTemplate) => void;
    onClose: () => void;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ onSelectTemplate, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');

    // Filter templates
    const filteredTemplates = CAMPAIGN_TEMPLATES.filter(template => {
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    const getComplexityColor = (complexity: string) => {
        switch (complexity) {
            case 'simple': return 'bg-green-100 text-green-700';
            case 'moderate': return 'bg-yellow-100 text-yellow-700';
            case 'complex': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getCategoryIcon = (category: TemplateCategory) => {
        switch (category) {
            case 'retail': return ShoppingCart;
            case 'b2b': return Briefcase;
            case 'brand': return Rocket;
            case 'performance': return TrendingUp;
            default: return Store;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Campaign Templates</h2>
                        <p className="text-sm text-gray-500 mt-1">Choose a pre-configured template to get started quickly</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Search and Filters */}
                <div className="p-6 border-b border-gray-200 space-y-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search templates..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* Category Filters */}
                    <div className="flex gap-2 flex-wrap">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${selectedCategory === 'all'
                                    ? 'bg-purple-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                        >
                            All Templates
                        </button>
                        {(['retail', 'b2b', 'brand', 'performance', 'seasonal'] as TemplateCategory[]).map((category) => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${selectedCategory === category
                                        ? 'bg-purple-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Template Grid */}
                <div className="flex-1 overflow-y-auto p-6">
                    {filteredTemplates.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-500">No templates found matching your criteria</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTemplates.map((template) => {
                                const CategoryIcon = getCategoryIcon(template.category);

                                return (
                                    <div
                                        key={template.id}
                                        className="bg-white border border-gray-200 rounded-lg p-6 hover:border-purple-400 hover:shadow-lg transition-all cursor-pointer group"
                                        onClick={() => onSelectTemplate(template)}
                                    >
                                        {/* Icon and Complexity Badge */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="text-4xl">{template.icon}</div>
                                                <CategoryIcon className="text-gray-400" size={20} />
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(template.complexity)}`}>
                                                {template.complexity}
                                            </span>
                                        </div>

                                        {/* Name and Description */}
                                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                                            {template.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{template.description}</p>

                                        {/* Budget Range */}
                                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                                            <p className="text-xs text-gray-500 mb-1">Recommended Budget</p>
                                            <p className="text-sm font-semibold text-gray-900">
                                                ${(template.recommendedBudget.min / 1000).toFixed(0)}k - ${(template.recommendedBudget.max / 1000).toFixed(0)}k
                                                <span className="text-gray-500 font-normal ml-2">
                                                    (Optimal: ${(template.recommendedBudget.optimal / 1000).toFixed(0)}k)
                                                </span>
                                            </p>
                                        </div>

                                        {/* Channel Mix Preview */}
                                        <div className="mb-4">
                                            <p className="text-xs text-gray-500 mb-2">Channel Mix</p>
                                            <div className="flex h-2 rounded-full overflow-hidden">
                                                {template.channelMix.map((mix, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="relative group/bar"
                                                        style={{
                                                            width: `${mix.percentage}%`,
                                                            backgroundColor: [
                                                                '#8b5cf6', // purple
                                                                '#3b82f6', // blue
                                                                '#10b981', // green
                                                                '#f59e0b', // amber
                                                                '#ef4444', // red
                                                                '#ec4899', // pink
                                                                '#6366f1'  // indigo
                                                            ][idx % 7]
                                                        }}
                                                        title={`${mix.channel}: ${mix.percentage}%`}
                                                    />
                                                ))}
                                            </div>
                                            <div className="mt-2 text-xs text-gray-600">
                                                {template.channelMix.slice(0, 3).map(mix => mix.channel).join(', ')}
                                                {template.channelMix.length > 3 && ` +${template.channelMix.length - 3}`}
                                            </div>
                                        </div>

                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-1 mb-4">
                                            {template.tags.slice(0, 3).map((tag, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-full"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Action Button */}
                                        <button
                                            className="w-full py-2 px-4 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors group-hover:bg-purple-700"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onSelectTemplate(template);
                                            }}
                                        >
                                            Use Template
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
