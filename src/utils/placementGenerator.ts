/**
 * Batch Placement Generation
 * 
 * Generates multiple placements with variation for batch commands
 */

import { Line, Flight } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface PlacementTemplate {
    channel: Line['channel'] | 'Connected TV' | 'Linear TV' | 'Audio';
    network?: string;
    program?: string;
    count: number;
    variation: 'diverse' | 'similar';
}

/**
 * Generate batch placements with variation
 */
export function generateBatchPlacements(
    template: PlacementTemplate,
    flight: Flight
): Line[] {
    const placements: Line[] = [];

    switch (template.channel) {
        case 'Social':
            placements.push(...generateSocialPlacements(template, flight));
            break;
        case 'Connected TV':
        case 'Linear TV':
            placements.push(...generateTVPlacements(template, flight));
            break;
        case 'Display':
            placements.push(...generateDisplayPlacements(template, flight));
            break;
        case 'Search':
            placements.push(...generateSearchPlacements(template, flight));
            break;
        case 'Audio':
            placements.push(...generateAudioPlacements(template, flight));
            break;
        default:
            placements.push(...generateGenericPlacements(template, flight));
    }

    return placements;
}

/**
 * Generate social media placements with variation
 * Uses CPM-based impression calculation
 */
function generateSocialPlacements(template: PlacementTemplate, flight: Flight): Line[] {
    const platforms = ['Facebook', 'Instagram', 'TikTok'];
    const formats = ['Feed', 'Story', 'Reel', 'Video'];

    // Platform-specific CPM benchmarks (2024)
    const platformCpms: Record<string, { min: number; max: number }> = {
        'Facebook': { min: 10, max: 15 },    // $10-15 CPM
        'Instagram': { min: 7, max: 15 },    // $7-15 CPM
        'TikTok': { min: 4, max: 7 }         // $4-7 CPM (lower CPM, higher reach)
    };

    const placements: Line[] = [];

    for (let i = 0; i < template.count; i++) {
        const platform = template.variation === 'diverse'
            ? platforms[i % platforms.length]
            : platforms[0];

        const format = template.variation === 'diverse'
            ? formats[i % formats.length]
            : formats[0];

        // Social budget: $5k - $25k per placement
        const baseCost = 5000 + (Math.random() * 20000);

        // CPM-based calculation using platform-specific rates
        const cpmRange = platformCpms[platform] || { min: 8, max: 12 };
        const cpm = cpmRange.min + (Math.random() * (cpmRange.max - cpmRange.min));
        const impressions = Math.floor((baseCost / cpm) * 1000);

        placements.push(createPlacement({
            channel: 'Social',
            vendor: platform,
            adUnit: format,
            baseCost,
            impressions,
            flight
        }));
    }

    return placements;
}

/**
 * Generate TV placements (CTV or Linear)
 * Uses CPM-based impression calculation with realistic caps
 */
function generateTVPlacements(template: PlacementTemplate, flight: Flight): Line[] {
    const networks = template.network
        ? [template.network]
        : ['ESPN', 'CNN', 'NBC', 'Fox', 'Hulu'];
    const dayparts = ['Prime Time', 'Morning', 'Afternoon', 'Weekend'];
    const durations = ['15-second', '30-second'];

    const placements: Line[] = [];

    for (let i = 0; i < template.count; i++) {
        const network = template.variation === 'diverse'
            ? networks[i % networks.length]
            : networks[0];

        const daypart = dayparts[i % dayparts.length];
        const duration = durations[i % durations.length];

        // TV budget: $15k - $50k per placement
        const baseCost = 15000 + (Math.random() * 35000);

        // CPM-based calculation: Linear TV $15-25 CPM, CTV $20-35 CPM
        const cpm = 15 + (Math.random() * 15); // $15-30 CPM range
        let impressions = Math.floor((baseCost / cpm) * 1000);

        // Apply realistic caps based on daypart/network
        // ESPN/sports: 500k - 3M impressions per flight
        // Primetime: 1M - 4M impressions per flight
        // Other: 200k - 1.5M impressions per flight
        const isSports = network.toLowerCase().includes('espn') || template.program?.toLowerCase().includes('sport');
        const isPrimetime = daypart === 'Prime Time';

        let maxImpressions: number;
        if (isSports) {
            maxImpressions = 500000 + Math.random() * 2500000;
        } else if (isPrimetime) {
            maxImpressions = 1000000 + Math.random() * 3000000;
        } else {
            maxImpressions = 200000 + Math.random() * 1300000;
        }
        impressions = Math.min(impressions, Math.floor(maxImpressions));

        placements.push(createPlacement({
            channel: 'TV',
            vendor: network,
            adUnit: `${duration} ${daypart}`,
            program: template.program,
            baseCost,
            impressions,
            flight
        }));
    }

    return placements;
}

/**
 * Generate display placements
 * Uses CPM-based impression calculation
 */
function generateDisplayPlacements(template: PlacementTemplate, flight: Flight): Line[] {
    const sizes = ['300x250', '728x90', '160x600', '970x250'];
    const placements: Line[] = [];

    for (let i = 0; i < template.count; i++) {
        const size = template.variation === 'diverse'
            ? sizes[i % sizes.length]
            : sizes[0];

        // Display budget: $3k - $15k per placement
        const baseCost = 3000 + (Math.random() * 12000);

        // Display CPM: $2.50 - $12 (programmatic range)
        const cpm = 2.5 + (Math.random() * 9.5);
        const impressions = Math.floor((baseCost / cpm) * 1000);

        placements.push(createPlacement({
            channel: 'Display',
            vendor: template.network || 'Programmatic',
            adUnit: size,
            baseCost,
            impressions,
            flight
        }));
    }

    return placements;
}

/**
 * Generate search placements
 * Uses CPC-based calculation (Search is priced per click, not per impression)
 */
function generateSearchPlacements(template: PlacementTemplate, flight: Flight): Line[] {
    const matchTypes = ['Exact Match', 'Phrase Match', 'Broad Match'];
    const networks = ['Google Search', 'Microsoft Search'];

    const placements: Line[] = [];

    for (let i = 0; i < template.count; i++) {
        const matchType = matchTypes[i % matchTypes.length];
        const network = networks[i % networks.length];

        // Search budget: $5k - $25k per placement
        const baseCost = 5000 + (Math.random() * 20000);

        // CPC: $1.50 - $8 (Google Ads average: $2.69-$5.26)
        const cpc = 1.5 + (Math.random() * 6.5);
        const clicks = Math.floor(baseCost / cpc);

        // CTR: 2% - 5% for search (higher than display)
        const ctr = 0.02 + (Math.random() * 0.03);
        const impressions = Math.floor(clicks / ctr);

        placements.push(createPlacement({
            channel: 'Search',
            vendor: network,
            adUnit: matchType,
            baseCost,
            impressions,
            flight
        }));
    }

    return placements;
}

/**
 * Generate audio placements
 * Uses CPM-based impression calculation
 */
function generateAudioPlacements(template: PlacementTemplate, flight: Flight): Line[] {
    const platforms = ['Spotify', 'Pandora', 'iHeartRadio'];
    const formats = ['Pre-roll', 'Mid-roll', 'Podcast'];

    const placements: Line[] = [];

    for (let i = 0; i < template.count; i++) {
        const platform = platforms[i % platforms.length];
        const format = formats[i % formats.length];

        // Audio budget: $8k - $25k per placement
        const baseCost = 8000 + (Math.random() * 17000);

        // Audio CPM: $15 - $30 (streaming audio & podcast range)
        const cpm = 15 + (Math.random() * 15);
        const impressions = Math.floor((baseCost / cpm) * 1000);

        placements.push(createPlacement({
            channel: 'Streaming Audio',
            vendor: platform,
            adUnit: format,
            baseCost,
            impressions,
            flight
        }));
    }

    return placements;
}

/**
 * Generate generic placements for other channels
 * Uses CPM-based impression calculation
 */
function generateGenericPlacements(template: PlacementTemplate, flight: Flight): Line[] {
    const placements: Line[] = [];

    for (let i = 0; i < template.count; i++) {
        // Generic budget: $10k - $30k per placement
        const baseCost = 10000 + (Math.random() * 20000);

        // Generic CPM: $10 - $25
        const cpm = 10 + (Math.random() * 15);
        const impressions = Math.floor((baseCost / cpm) * 1000);

        // Map template channel to valid Line channel
        const channelMap: Record<string, Line['channel']> = {
            'Connected TV': 'TV',
            'Linear TV': 'TV',
            'Audio': 'Streaming Audio'
        };
        const lineChannel = channelMap[template.channel] || template.channel as Line['channel'];

        placements.push(createPlacement({
            channel: lineChannel,
            vendor: template.network || 'Programmatic',
            adUnit: 'Standard',
            baseCost,
            impressions,
            flight
        }));
    }

    return placements;
}

/**
 * Create a placement with standard fields
 */
function createPlacement(params: {
    channel: Line['channel'];
    vendor: string;
    adUnit: string;
    program?: string;
    baseCost: number;
    impressions: number;
    flight: Flight;
}): Line {
    const { channel, vendor, adUnit, baseCost, impressions, flight } = params;

    const cpm = (baseCost / impressions) * 1000;
    const quantity = 1;

    return {
        id: uuidv4(),
        name: `${vendor} - ${adUnit}`,
        channel,
        status: 'PLANNING',
        vendor,
        adUnit,
        segment: 'General',
        startDate: flight.startDate,
        endDate: flight.endDate,
        costMethod: 'CPM',
        rate: cpm,
        quantity,
        totalCost: baseCost,
        forecast: {
            impressions,
            spend: baseCost,
            reach: Math.floor(impressions * 0.7),
            frequency: 1.5 + Math.random(),
            source: 'Internal'
        }
    };
}
