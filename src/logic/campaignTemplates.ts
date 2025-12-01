import { CampaignTemplate, Channel, TemplateCategory } from '../types';

/**
 * Pre-configured campaign templates for quick-start
 * Each template includes recommended budget ranges, channel mix, and default goals
 */

export const CAMPAIGN_TEMPLATES: CampaignTemplate[] = [
    {
        id: 'retail-holiday',
        name: 'Retail Holiday Campaign',
        description: 'High-impact campaign for Q4 holiday shopping season. Heavy emphasis on social and display for quick conversions.',
        category: 'retail',
        icon: '🎄',
        recommendedBudget: {
            min: 50000,
            max: 500000,
            optimal: 200000
        },
        channelMix: [
            { channel: 'Social', percentage: 35, rationale: 'Target holiday shoppers with dynamic product ads and retargeting' },
            { channel: 'Display', percentage: 25, rationale: 'Build awareness with seasonal creative across premium inventory' },
            { channel: 'Search', percentage: 25, rationale: 'Capture high-intent searches for gift ideas and product categories' },
            { channel: 'TV', percentage: 10, rationale: 'Reinforce brand presence during peak shopping weeks' },
            { channel: 'OOH', percentage: 5, rationale: 'Mall and retail district placements for last-minute shoppers' }
        ],
        defaultGoals: {
            impressions: 50000000,
            reach: 2000000,
            conversions: 25000
        },
        flightStructure: [
            { name: 'Pre-Holiday Buildup', budgetPercentage: 30, durationDays: 30 },
            { name: 'Peak Shopping Season', budgetPercentage: 50, durationDays: 21 },
            { name: 'Last Minute Rush', budgetPercentage: 20, durationDays: 7 }
        ],
        tags: ['holiday', 'ecommerce', 'conversion', 'seasonal'],
        industry: ['retail', 'ecommerce'],
        complexity: 'moderate'
    },
    {
        id: 'b2b-lead-gen',
        name: 'B2B Lead Generation',
        description: 'Professional services lead generation with LinkedIn, search, and targeted display for decision makers.',
        category: 'b2b',
        icon: '💼',
        recommendedBudget: {
            min: 25000,
            max: 200000,
            optimal: 75000
        },
        channelMix: [
            { channel: 'Social', percentage: 40, rationale: 'LinkedIn targeting for C-suite and decision makers' },
            { channel: 'Search', percentage: 35, rationale: 'Capture solution-seeking searches with branded and competitor keywords' },
            { channel: 'Display', percentage: 20, rationale: 'Retargeting and account-based marketing on B2B sites' },
            { channel: 'TV', percentage: 5, rationale: 'CTV placements on business news and finance programming' }
        ],
        defaultGoals: {
            impressions: 10000000,
            reach: 500000,
            conversions: 2500,
            clicks: 150000
        },
        flightStructure: [
            { name: 'Awareness Phase', budgetPercentage: 35, durationDays: 45 },
            { name: 'Lead Nurture', budgetPercentage: 40, durationDays: 30 },
            { name: 'Conversion Push', budgetPercentage: 25, durationDays: 15 }
        ],
        tags: ['lead-gen', 'b2b', 'linkedin', 'professional'],
        industry: ['technology', 'professional services', 'saas'],
        complexity: 'moderate'
    },
    {
        id: 'brand-launch',
        name: 'Brand Awareness Launch',
        description: 'Maximum reach campaign for new brand or product launches. Focus on TV, OOH, and video for broad awareness.',
        category: 'brand',
        icon: '🚀',
        recommendedBudget: {
            min: 100000,
            max: 1000000,
            optimal: 400000
        },
        channelMix: [
            { channel: 'TV', percentage: 40, rationale: 'Prime time and sports programming for mass reach' },
            { channel: 'Social', percentage: 25, rationale: 'Video ads and stories for younger demographics' },
            { channel: 'OOH', percentage: 20, rationale: 'High-traffic billboards and transit for visibility' },
            { channel: 'Display', percentage: 10, rationale: 'Premium placements on major publishers' },
            { channel: 'Radio', percentage: 5, rationale: 'Drive time spots for commuters' }
        ],
        defaultGoals: {
            impressions: 100000000,
            reach: 10000000,
            conversions: 50000
        },
        flightStructure: [
            { name: 'Launch Week Blitz', budgetPercentage: 45, durationDays: 14 },
            { name: 'Sustain Awareness', budgetPercentage: 35, durationDays: 45 },
            { name: 'Reinforce Message', budgetPercentage: 20, durationDays: 30 }
        ],
        tags: ['launch', 'awareness', 'reach', 'brand-building'],
        industry: ['cpg', 'automotive', 'entertainment', 'retail'],
        complexity: 'complex'
    },
    {
        id: 'performance-max',
        name: 'Performance Max Conversion',
        description: 'Conversion-focused campaign optimized for immediate ROI. Search and social dominate with aggressive retargeting.',
        category: 'performance',
        icon: '📈',
        recommendedBudget: {
            min: 30000,
            max: 300000,
            optimal: 100000
        },
        channelMix: [
            { channel: 'Search', percentage: 45, rationale: 'High-intent keywords optimized for conversion' },
            { channel: 'Social', percentage: 40, rationale: 'Performance campaigns with conversion objectives' },
            { channel: 'Display', percentage: 15, rationale: 'Retargeting campaigns for cart abandoners and site visitors' }
        ],
        defaultGoals: {
            impressions: 20000000,
            reach: 1000000,
            conversions: 50000,
            clicks: 400000
        },
        flightStructure: [
            { name: 'Test & Learn', budgetPercentage: 20, durationDays: 14 },
            { name: 'Scale Winners', budgetPercentage: 50, durationDays: 30 },
            { name: 'Optimize & Refine', budgetPercentage: 30, durationDays: 30 }
        ],
        tags: ['performance', 'conversion', 'roi', 'retargeting'],
        industry: ['ecommerce', 'direct-to-consumer', 'lead-gen'],
        complexity: 'simple'
    },
    {
        id: 'local-store-opening',
        name: 'Local Store Opening',
        description: 'Geo-targeted campaign for new store locations. OOH, local search, and radio drive foot traffic.',
        category: 'retail',
        icon: '🏪',
        recommendedBudget: {
            min: 10000,
            max: 75000,
            optimal: 30000
        },
        channelMix: [
            { channel: 'OOH', percentage: 35, rationale: 'Billboards and transit ads within 5-mile radius' },
            { channel: 'Search', percentage: 30, rationale: 'Local search ads and maps targeting nearby shoppers' },
            { channel: 'Radio', percentage: 20, rationale: 'Morning and evening drive time on local stations' },
            { channel: 'Social', percentage: 15, rationale: 'Geo-fenced ads for neighborhood residents' }
        ],
        defaultGoals: {
            impressions: 5000000,
            reach: 250000,
            conversions: 5000
        },
        flightStructure: [
            { name: 'Pre-Opening Buzz', budgetPercentage: 40, durationDays: 21 },
            { name: 'Grand Opening', budgetPercentage: 40, durationDays: 7 },
            { name: 'Post-Opening', budgetPercentage: 20, durationDays: 14 }
        ],
        tags: ['local', 'retail', 'geo-targeting', 'store-opening'],
        industry: ['retail', 'restaurants', 'services'],
        complexity: 'simple'
    },
    {
        id: 'mobile-app-launch',
        name: 'Mobile App Launch',
        description: 'App install and engagement campaign. Social video and display optimized for mobile conversions.',
        category: 'performance',
        icon: '📱',
        recommendedBudget: {
            min: 40000,
            max: 400000,
            optimal: 150000
        },
        channelMix: [
            { channel: 'Social', percentage: 50, rationale: 'Instagram, TikTok, and Snapchat for app install campaigns' },
            { channel: 'Display', percentage: 30, rationale: 'Mobile web placements with app download CTA' },
            { channel: 'Search', percentage: 15, rationale: 'App category keywords on mobile search' },
            { channel: 'TV', percentage: 5, rationale: 'CTV placements with QR codes for easy downloads' }
        ],
        defaultGoals: {
            impressions: 30000000,
            reach: 2000000,
            conversions: 100000,
            clicks: 600000
        },
        flightStructure: [
            { name: 'Soft Launch', budgetPercentage: 25, durationDays: 14 },
            { name: 'Full Launch Push', budgetPercentage: 50, durationDays: 30 },
            { name: 'Retention Focus', budgetPercentage: 25, durationDays: 30 }
        ],
        tags: ['mobile', 'app-install', 'digital', 'social-first'],
        industry: ['technology', 'gaming', 'fintech', 'health'],
        complexity: 'moderate'
    }
];

/**
 * Get template by ID
 */
export function getTemplateById(id: string): CampaignTemplate | undefined {
    return CAMPAIGN_TEMPLATES.find(t => t.id === id);
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: TemplateCategory): CampaignTemplate[] {
    return CAMPAIGN_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get templates by industry
 */
export function getTemplatesByIndustry(industry: string): CampaignTemplate[] {
    return CAMPAIGN_TEMPLATES.filter(t => t.industry.includes(industry.toLowerCase()));
}

/**
 * Search templates by keyword
 */
export function searchTemplates(query: string): CampaignTemplate[] {
    const lowerQuery = query.toLowerCase();
    return CAMPAIGN_TEMPLATES.filter(t =>
        t.name.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.tags.some(tag => tag.includes(lowerQuery)) ||
        t.industry.some(ind => ind.includes(lowerQuery))
    );
}
