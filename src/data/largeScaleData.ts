import { Brand, Campaign, Flight, Line, EntityStatus, PerformanceMetrics, ForecastMetrics, DeliveryMetrics, Segment } from '../types';
import { getRandomSegments } from './segmentLibrary';
import { generateStableId } from '../logic/dummyData';

const CAMPAIGN_STATUSES: EntityStatus[] = ['ACTIVE', 'PAUSED', 'DRAFT', 'COMPLETED', 'ARCHIVED'];
const TAGS = ['Q1', 'Q2', 'Q3', 'Q4', 'Holiday', 'Back to School', 'Brand Awareness', 'Performance', 'Retargeting', 'Experimental'];
// Removed Print channel - not supported
const CHANNELS = ['Search', 'Social', 'Display', 'TV', 'Radio', 'OOH'] as const;

const INDUSTRIES = ['Automotive', 'Retail', 'Financial Services', 'Technology', 'Healthcare', 'CPG', 'Travel', 'Entertainment'];

const VENDORS_BY_CHANNEL: Record<string, string[]> = {
    Display: ['The Trade Desk', 'Google DV360', 'Amazon DSP', 'MediaMath', 'Xandr', 'Criteo'],
    Social: ['Meta Ads', 'LinkedIn Ads', 'TikTok Ads', 'Pinterest Ads', 'Snapchat Ads', 'Reddit Ads'],
    Search: ['Google Ads', 'Microsoft Advertising', 'Amazon Advertising'],
    TV: ['Spectrum Reach', 'Comcast Spotlight', 'Cox Media', 'Local Broadcast', 'Hulu Ad Manager', 'Roku'],
    Radio: ['iHeartMedia', 'Audacy', 'Spotify Audio Ads', 'Pandora', 'SiriusXM'],
    OOH: ['Clear Channel', 'Lamar', 'Outfront Media', 'AdQuick', 'Vistar Media']
};

// Use random ID for user-created items (exported in case other modules need it)
export const generateId = () => Math.random().toString(36).substring(2, 9);

const getRandomItem = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Weighted random for Tiers
const getWeightedTier = (): 'Enterprise' | 'Mid-Market' | 'SMB' => {
    const rand = Math.random();
    if (rand < 0.2) return 'Enterprise';
    if (rand < 0.7) return 'Mid-Market';
    return 'SMB';
};

export const generateDateRange = (year: number) => {
    const startMonth = getRandomInt(0, 11);
    const endMonth = getRandomInt(startMonth, 11);
    const startDate = new Date(year, startMonth, 1).toISOString().split('T')[0];
    const endDate = new Date(year, endMonth, 28).toISOString().split('T')[0];
    return { startDate, endDate };
};

// Generate realistic performance metrics based on status and budget
const generatePerformanceMetrics = (
    budget: number,
    status: EntityStatus,
    cpm: number
): { performance?: PerformanceMetrics; forecast: ForecastMetrics; delivery?: DeliveryMetrics } => {

    // Base Forecast
    const impressions = Math.floor((budget / cpm) * 1000);
    const reach = Math.floor(impressions * 0.4); // Rough estimate
    const frequency = 2.5;

    const forecast: ForecastMetrics = {
        impressions,
        spend: budget,
        reach,
        frequency,
        source: 'Internal'
    };

    if (status === 'DRAFT') {
        return { forecast };
    }

    // Determine completion % based on status
    let completionPct = 0;
    if (status === 'COMPLETED' || status === 'ARCHIVED') {
        completionPct = 1.0;
    } else if (status === 'PAUSED') {
        completionPct = Math.random() * 0.6; // Paused somewhere between 0-60%
    } else if (status === 'ACTIVE') {
        completionPct = Math.random() * 0.9; // Active somewhere between 0-90%
    }

    // Actuals (add some variance)
    const variance = 0.85 + Math.random() * 0.3; // 85% - 115% delivery
    const actualImpressions = Math.floor(impressions * completionPct * variance);
    const actualSpend = budget * completionPct * variance; // Assuming spend tracks with impressions

    // Performance Ratios
    const ctr = 0.005 + Math.random() * 0.025; // 0.5% - 3.0% CTR
    const clicks = Math.floor(actualImpressions * ctr);

    const cvr = 0.01 + Math.random() * 0.05; // 1% - 6% CVR
    const conversions = Math.floor(clicks * cvr);

    const cpc = clicks > 0 ? actualSpend / clicks : 0;
    const cpa = conversions > 0 ? actualSpend / conversions : 0;
    const roas = conversions > 0 ? (conversions * 50) / actualSpend : 0; // Assume $50 value per conversion

    const performance: PerformanceMetrics = {
        impressions: actualImpressions,
        clicks,
        conversions,
        ctr,
        cvr,
        cpc,
        cpa,
        cpm: (actualSpend / actualImpressions) * 1000,
        roas,
        status: status === 'ACTIVE' ? 'ACTIVE' : 'PAUSED'
    };

    const delivery: DeliveryMetrics = {
        actualImpressions,
        actualSpend,
        pacing: (actualSpend / (budget * completionPct)) * 100, // Pacing against time elapsed
        status: variance > 1.05 ? 'OVER_PACING' : variance < 0.95 ? 'UNDER_PACING' : 'ON_TRACK'
    };

    return { performance, forecast, delivery };
};

const generateLineItems = (count: number, flightBudget: number, flightStatus: EntityStatus, flightId: string): Line[] => {
    const lines: Line[] = [];
    for (let i = 0; i < count; i++) {
        const budget = flightBudget / count;
        // Use deterministic channel/vendor selection based on line index
        const channelIdx = i % CHANNELS.length;
        const channel = CHANNELS[channelIdx];
        const vendorList = VENDORS_BY_CHANNEL[channel];
        const vendor = vendorList[i % vendorList.length];

        // Assign Segments with stable IDs
        const numSegments = (i % 3) + 1; // Deterministic: 1-3 segments
        const assignedSegmentsRaw = getRandomSegments(numSegments);
        const assignedSegments: Segment[] = assignedSegmentsRaw.map((s, sIdx) => ({
            ...s,
            id: generateStableId(`${flightId}-line${i}-seg${sIdx}`)
        }));

        // Calculate Rate (CPM)
        let baseCpm = 10; // Default base
        if (channel === 'TV') baseCpm = 25;
        if (channel === 'Social') baseCpm = 8;
        if (channel === 'Display') baseCpm = 4;

        const segmentUplift = assignedSegments.reduce((sum, s) => sum + s.cpmUplift, 0);
        const finalCpm = baseCpm + segmentUplift;

        // Generate Metrics
        const { performance, forecast, delivery } = generatePerformanceMetrics(budget, flightStatus, finalCpm);

        lines.push({
            id: generateStableId(`${flightId}-line${i}`),
            name: `${channel} - ${vendor} - ${assignedSegments[0].name}`,
            channel,
            status: flightStatus === 'DRAFT' ? 'PLANNING' : flightStatus === 'ARCHIVED' ? 'COMPLETED' : flightStatus as any,
            vendor,
            adUnit: 'Standard',
            rate: finalCpm,
            costMethod: 'CPM',
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            quantity: forecast.impressions,
            totalCost: budget,
            buyingType: 'Auction',
            segments: assignedSegments,
            segment: assignedSegments[0].name, // Legacy support
            forecast,
            delivery,
            performance
        });
    }
    return lines;
};

const generateFlights = (campaignId: string, count: number, campaignBudget: number, campaignStatus: EntityStatus): Flight[] => {
    const flights: Flight[] = [];
    const flightGoals = ['Awareness', 'Consideration', 'Conversion'];

    for (let i = 0; i < count; i++) {
        const budget = campaignBudget / count;
        // Deterministic status based on flight index
        let status: EntityStatus = campaignStatus;

        if (campaignStatus === 'ACTIVE') {
            // Deterministic status: every 4th is completed, every 5th is draft
            if (i % 4 === 3) status = 'COMPLETED';
            else if (i % 5 === 4) status = 'DRAFT';
        }

        const flightId = generateStableId(`${campaignId}-flight${i}`);
        const goal = flightGoals[i % flightGoals.length];
        const lineCount = 3 + (i % 6); // Deterministic: 3-8 lines

        flights.push({
            id: flightId,
            name: `Flight ${i + 1} - ${goal}`,
            campaignId,
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            budget,
            status,
            tags: [TAGS[i % TAGS.length], TAGS[(i + 1) % TAGS.length]],
            lines: generateLineItems(lineCount, budget, status, flightId)
        });
    }
    return flights;
};

export const generateLargeScaleData = (): Brand[] => {
    const brands: Brand[] = [];
    const brandNames = ['Coca Cola', 'Nike', 'Apple', 'Samsung', 'Toyota', 'Ford', 'Pepsi', 'Verizon', 'AT&T', 'Amazon'];

    brandNames.forEach((name, _brandIdx) => {
        const campaigns: Campaign[] = [];
        const brandId = name.toLowerCase().replace(' ', '_');

        // Generate 50 campaigns per brand (reduced from 100 for performance, still plenty)
        for (let i = 0; i < 50; i++) {
            // Deterministic year and dates based on campaign index
            const year = 2023 + (i % 4); // Cycles through 2023-2026
            const startMonth = i % 12;
            const endMonth = Math.min(11, startMonth + 2 + (i % 4));
            const startDate = new Date(year, startMonth, 1).toISOString().split('T')[0];
            const endDate = new Date(year, endMonth, 28).toISOString().split('T')[0];

            // Deterministic budget and status
            const budget = 50000 + ((i * 100000) % 4950000); // 50k to 5M
            const status = CAMPAIGN_STATUSES[i % CAMPAIGN_STATUSES.length];

            const campaignId = generateStableId(`${brandId}-campaign${i}`);
            const flightCount = 2 + (i % 4); // Deterministic: 2-5 flights

            campaigns.push({
                id: campaignId,
                name: `${name} ${year} Campaign ${i + 1}`,
                brandId,
                advertiser: name,
                budget,
                startDate,
                endDate,
                status,
                tags: [TAGS[i % TAGS.length], TAGS[(i + 1) % TAGS.length]],
                goals: ['Brand Awareness'],
                flights: generateFlights(campaignId, flightCount, budget, status)
            });
        }

        brands.push({
            id: name.toLowerCase().replace(' ', '_'),
            name,
            logoUrl: `https://ui-avatars.com/api/?name=${name}&background=random`,
            agencyId: 'agency_1',
            totalSpend: campaigns.reduce((sum, c) => sum + c.budget, 0),
            activeCampaigns: campaigns.filter(c => c.status === 'ACTIVE').length,
            campaigns,
            // Enhanced Brand Fields
            industry: getRandomItem(INDUSTRIES),
            tier: getWeightedTier(),
            status: campaigns.filter(c => c.status === 'ACTIVE').length > 0 ? 'Active' : (Math.random() > 0.5 ? 'Active' : 'Inactive'),
            accountManager: `Account Manager ${getRandomInt(1, 5)}`,
            lastActivity: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString(),
            monthlySpend: Math.floor(Math.random() * 500000) + 10000,
            campaignCount: campaigns.length,
            // lifetimeValue calculated roughly
            lifetimeValue: Math.floor(Math.random() * 10000000) + 100000
        } as any); // Cast to any to support new fields if Brand interface isn't fully updated in all files yet
    });

    return brands;
};
