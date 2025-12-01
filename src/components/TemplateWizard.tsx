import React, { useState } from 'react';
import { CampaignTemplate, Campaign, Flight, Placement, PlacementStatus } from '../types';
import { X, ChevronLeft, ChevronRight, Check, MapPin } from 'lucide-react';
import { generateId } from '../logic/dummyData';
import { DMA_DATA } from '../logic/dmaData';

interface TemplateWizardProps {
    template: CampaignTemplate;
    brandId: string;
    brandName: string;
    onComplete?: (campaign: Campaign) => void;
    onCompleteFlight?: (flight: Flight) => void;
    onCancel: () => void;
    mode?: 'CAMPAIGN' | 'FLIGHT';
}

export const TemplateWizard: React.FC<TemplateWizardProps> = ({
    template,
    brandId,
    brandName,
    onComplete,
    onCompleteFlight,
    onCancel,
    mode = 'CAMPAIGN'
}) => {
    const [currentStep, setCurrentStep] = useState(0);

    // Form state
    const [campaignName, setCampaignName] = useState(
        mode === 'CAMPAIGN'
            ? `${brandName} - ${template.name}`
            : template.name
    );
    const [budget, setBudget] = useState(template.recommendedBudget.optimal);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [location, setLocation] = useState('');

    // Channel mix can be adjusted
    const [channelMix, setChannelMix] = useState(template.channelMix);

    // Goals can be edited
    const [goals, setGoals] = useState(template.defaultGoals);

    const steps = [
        { title: 'Basics', description: mode === 'CAMPAIGN' ? 'Campaign name and dates' : 'Flight name and dates' },
        { title: 'Location', description: 'Target market' },
        { title: 'Budget', description: mode === 'CAMPAIGN' ? 'Set your campaign budget' : 'Set flight budget' },
        { title: 'Channel Mix', description: 'Review and adjust channels' },
        { title: 'Goals', description: 'Set performance targets' },
        { title: 'Review', description: 'Confirm and create' }
    ];

    const handleChannelPercentageChange = (index: number, newPercentage: number) => {
        const newMix = [...channelMix];
        newMix[index].percentage = Math.max(0, Math.min(100, newPercentage));

        // Normalize to 100%
        const total = newMix.reduce((sum, m) => sum + m.percentage, 0);
        if (total > 0) {
            newMix.forEach(m => m.percentage = Math.round((m.percentage / total) * 100));
        }

        setChannelMix(newMix);
    };

    const handleComplete = () => {
        // Generate a flight
        const flightId = generateId();

        // Generate placements based on channel mix
        const lines: Placement[] = channelMix
            .filter(mix => mix.percentage > 0)
            .map(mix => {
                const channelBudget = Math.round((budget * mix.percentage) / 100);
                return {
                    id: generateId(),
                    name: `${mix.channel} Allocation`,
                    channel: mix.channel,
                    status: 'PLANNING' as PlacementStatus,
                    startDate: startDate,
                    endDate: endDate,
                    totalCost: channelBudget, // Mapped from budget
                    quantity: Math.round(channelBudget / 15 * 1000), // Mapped from totalUnits
                    rate: 15, // Mapped from costPerUnit
                    costMethod: 'CPM', // Mapped from costModel
                    vendor: 'Programmatic', // Default
                    adUnit: 'Standard', // Default
                    targeting: {
                        geo: location ? [location] : ['National'],
                        demographics: ['A18-49'], // Default
                        devices: ['All']
                    }
                };
            });

        const flight: Flight = {
            id: flightId,
            name: campaignName, // Use the input name (which is flight name in FLIGHT mode)
            campaignId: generateId(), // Temporary, will be overwritten or ignored
            startDate: startDate,
            endDate: endDate,
            budget: budget,
            status: 'DRAFT', // Changed to DRAFT to match Flight status type
            lines: lines
        };

        if (mode === 'FLIGHT' && onCompleteFlight) {
            onCompleteFlight(flight);
            return;
        }

        if (mode === 'CAMPAIGN' && onComplete) {
            const campaign: Campaign = {
                id: generateId(),
                name: campaignName,
                brandId: brandId,
                advertiser: brandName,
                budget: budget,
                startDate: startDate,
                endDate: endDate,
                goals: [template.name], // Use template name as initial goal
                numericGoals: goals,
                flights: [flight],
                status: 'PLANNING',
                templateId: template.id,
                customizations: [] // Track what was changed from template
            };

            onComplete(campaign);
        }
    };

    const canProceed = () => {
        switch (currentStep) {
            case 0:
                return campaignName.length > 0 && startDate && endDate;
            case 1:
                // Location is optional unless it's a local template, but let's make it optional for now to be safe
                // or enforce it if the template name implies local
                if (template.name.toLowerCase().includes('local') || template.name.toLowerCase().includes('store')) {
                    return location.length > 0;
                }
                return true;
            case 2:
                return budget >= template.recommendedBudget.min;
            case 3:
                return channelMix.reduce((sum, m) => sum + m.percentage, 0) === 100;
            case 4:
                return true; // Goals are optional
            case 5:
                return true;
            default:
                return false;
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                // Step 1: Basics
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Campaign Name
                            </label>
                            <input
                                type="text"
                                value={campaignName}
                                onChange={(e) => setCampaignName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                placeholder="Enter campaign name"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-lg">
                            <p className="text-sm text-purple-900">
                                <span className="font-semibold">Template:</span> {template.name}
                            </p>
                            <p className="text-sm text-purple-700 mt-1">{template.description}</p>
                        </div>
                    </div>
                );

            case 1:
                // Step 2: Location
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Target Location (DMA)
                            </label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <select
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white"
                                >
                                    <option value="">Select a market...</option>
                                    <option value="National">National (All Markets)</option>
                                    {Object.values(DMA_DATA).sort((a, b) => a.rank - b.rank).map(dma => (
                                        <option key={dma.name} value={dma.name}>
                                            {dma.name} (Rank {dma.rank})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Select specific market for local campaigns or National for broad reach.
                            </p>
                        </div>
                    </div>
                );

            case 2:
                // Step 3: Budget
                // Calculate max for slider: at least template max, but if user enters more, scale it up
                const sliderMax = Math.max(template.recommendedBudget.max, budget * 1.5);

                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Total Campaign Budget
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    value={budget}
                                    onChange={(e) => setBudget(parseInt(e.target.value) || 0)}
                                    className="w-full pl-8 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    min={template.recommendedBudget.min}
                                />
                            </div>

                            <input
                                type="range"
                                min={template.recommendedBudget.min}
                                max={sliderMax}
                                value={Math.min(budget, sliderMax)}
                                onChange={(e) => setBudget(parseInt(e.target.value))}
                                className="w-full mt-4"
                            />

                            <div className="flex justify-between text-sm text-gray-600 mt-2">
                                <span>${(template.recommendedBudget.min / 1000).toFixed(0)}k</span>
                                <span>${(sliderMax / 1000).toFixed(0)}k+</span>
                            </div>
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                            <p className="text-sm text-yellow-900">
                                <span className="font-semibold">Recommended Budget:</span> ${(template.recommendedBudget.optimal / 1000).toFixed(0)}k
                            </p>
                            <p className="text-sm text-yellow-700 mt-1">
                                This budget range is optimal for the {template.name} strategy based on typical channel costs and reach goals.
                            </p>
                        </div>
                    </div>
                );

            case 3:
                // Step 4: Channel Mix
                return (
                    <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-900">
                                Adjust the budget allocation across channels. The percentages must total 100%.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {channelMix.map((mix, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-gray-900">{mix.channel}</label>
                                        <span className="text-sm font-bold text-purple-600">{mix.percentage}%</span>
                                    </div>

                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={mix.percentage}
                                        onChange={(e) => handleChannelPercentageChange(index, parseInt(e.target.value))}
                                        className="w-full"
                                    />

                                    <p className="text-xs text-gray-600">{mix.rationale}</p>

                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Budget: ${((budget * mix.percentage) / 100).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">Total</span>
                                <span className={`text-lg font-bold ${channelMix.reduce((sum, m) => sum + m.percentage, 0) === 100
                                    ? 'text-green-600'
                                    : 'text-red-600'
                                    }`}>
                                    {channelMix.reduce((sum, m) => sum + m.percentage, 0)}%
                                </span>
                            </div>
                        </div>
                    </div>
                );

            case 4:
                // Step 5: Goals
                return (
                    <div className="space-y-6">
                        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                            <p className="text-sm text-green-900">
                                Set your numeric performance goals. These are pre-filled based on the template but you can adjust them.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Impressions
                                </label>
                                <input
                                    type="number"
                                    value={goals.impressions || ''}
                                    onChange={(e) => setGoals({ ...goals, impressions: parseInt(e.target.value) || undefined })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="e.g., 10000000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Reach
                                </label>
                                <input
                                    type="number"
                                    value={goals.reach || ''}
                                    onChange={(e) => setGoals({ ...goals, reach: parseInt(e.target.value) || undefined })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="e.g., 500000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Conversions
                                </label>
                                <input
                                    type="number"
                                    value={goals.conversions || ''}
                                    onChange={(e) => setGoals({ ...goals, conversions: parseInt(e.target.value) || undefined })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="e.g., 5000"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Clicks
                                </label>
                                <input
                                    type="number"
                                    value={goals.clicks || ''}
                                    onChange={(e) => setGoals({ ...goals, clicks: parseInt(e.target.value) || undefined })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    placeholder="e.g., 100000"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 5:
                // Step 6: Review
                return (
                    <div className="space-y-6">
                        <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 mb-4">Campaign Summary</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Campaign Name</p>
                                    <p className="font-semibold text-gray-900">{campaignName}</p>
                                </div>

                                <div>
                                    <p className="text-gray-500">Budget</p>
                                    <p className="font-semibold text-gray-900">${budget.toLocaleString()}</p>
                                </div>

                                <div>
                                    <p className="text-gray-500">Start Date</p>
                                    <p className="font-semibold text-gray-900">{startDate}</p>
                                </div>

                                <div>
                                    <p className="text-gray-500">End Date</p>
                                    <p className="font-semibold text-gray-900">{endDate}</p>
                                </div>

                                <div>
                                    <p className="text-gray-500">Location</p>
                                    <p className="font-semibold text-gray-900">{location || 'National'}</p>
                                </div>
                            </div>

                            <div className="border-t pt-4">
                                <h4 className="font-semibold text-gray-900 mb-2">Channel Allocation</h4>
                                {channelMix.map((mix, idx) => (
                                    <div key={idx} className="flex justify-between text-sm py-1">
                                        <span className="text-gray-700">{mix.channel}</span>
                                        <span className="font-medium text-gray-900">
                                            {mix.percentage}% (${((budget * mix.percentage) / 100).toLocaleString()})
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {(goals.impressions || goals.reach || goals.conversions || goals.clicks) && (
                                <div className="border-t pt-4">
                                    <h4 className="font-semibold text-gray-900 mb-2">Performance Goals</h4>
                                    {goals.impressions && (
                                        <div className="flex justify-between text-sm py-1">
                                            <span className="text-gray-700">Impressions</span>
                                            <span className="font-medium text-gray-900">{goals.impressions.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {goals.reach && (
                                        <div className="flex justify-between text-sm py-1">
                                            <span className="text-gray-700">Reach</span>
                                            <span className="font-medium text-gray-900">{goals.reach.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {goals.conversions && (
                                        <div className="flex justify-between text-sm py-1">
                                            <span className="text-gray-700">Conversions</span>
                                            <span className="font-medium text-gray-900">{goals.conversions.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {goals.clicks && (
                                        <div className="flex justify-between text-sm py-1">
                                            <span className="text-gray-700">Clicks</span>
                                            <span className="font-medium text-gray-900">{goals.clicks.toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                            <p className="text-sm text-purple-900">
                                Ready to create your campaign? Click "Create Campaign" to finalize.
                            </p>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {template.icon} {template.name}
                        </h2>
                        <button
                            onClick={onCancel}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Step Progress */}
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => (
                            <div key={index} className="flex items-center flex-1">
                                <div className="flex flex-col items-center flex-1">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${index === currentStep
                                            ? 'bg-purple-600 text-white'
                                            : index < currentStep
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-200 text-gray-600'
                                            }`}
                                    >
                                        {index < currentStep ? <Check size={16} /> : index + 1}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-1 text-center">{step.title}</p>
                                </div>
                                {index < steps.length - 1 && (
                                    <div
                                        className={`h-1 flex-1 mx-2 ${index < currentStep ? 'bg-green-500' : 'bg-gray-200'
                                            }`}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{steps[currentStep].title}</h3>
                    <p className="text-sm text-gray-600 mb-6">{steps[currentStep].description}</p>
                    {renderStepContent()}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 flex items-center justify-between">
                    <button
                        onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                        disabled={currentStep === 0}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={20} />
                        Back
                    </button>

                    {currentStep < steps.length - 1 ? (
                        <button
                            onClick={() => setCurrentStep(currentStep + 1)}
                            disabled={!canProceed()}
                            className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                            <ChevronRight size={20} />
                        </button>
                    ) : (
                        <button
                            onClick={handleComplete}
                            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                        >
                            <Check className="h-4 w-4" />
                            {mode === 'CAMPAIGN' ? 'Create Campaign' : 'Create Flight'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
