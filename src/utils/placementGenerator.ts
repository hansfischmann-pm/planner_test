/**
 * Batch Placement Generation
 * 
 * Generates multiple placements with variation for batch commands
 */

import { Line, Flight } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface PlacementTemplate {
    channel: string;
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
 */
function generateSocialPlacements(template: PlacementTemplate, flight: Flight): Line[] {
    const platforms = ['Facebook', 'Instagram', 'TikTok'];
    const formats = ['Feed', 'Story', 'Reel', 'Video'];
    const objectives = ['Brand Awareness', 'Traffic', 'Engagement', 'Conversions'];

    const placements: Line[] = [];

    for (let i = 0; i < template.count; i++) {
        const platform = template.variation === 'diverse'
            ? platforms[i % platforms.length]
            : platforms[0];

        const format = template.variation === 'diverse'
            ? formats[i % formats.length]
            : formats[0];

        const baseCost = 5000 + (Math.random() * 5000);
        const impressions = Math.floor(baseCost * (10 + Math.random() * 20));

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

        const baseCost = 15000 + (Math.random() * 35000);
        const impressions = Math.floor(baseCost * (5 + Math.random() * 10));

        placements.push(createPlacement({
            channel: template.channel,
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
 */
function generateDisplayPlacements(template: PlacementTemplate, flight: Flight): Line[] {
    const sizes = ['300x250', '728x90', '160x600', '970x250'];
    const placements: Line[] = [];

    for (let i = 0; i < template.count; i++) {
        const size = template.variation === 'diverse'
            ? sizes[i % sizes.length]
            : sizes[0];

        const baseCost = 3000 + (Math.random() * 7000);
        const impressions = Math.floor(baseCost * (15 + Math.random() * 35));

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
 */
function generateSearchPlacements(template: PlacementTemplate, flight: Flight): Line[] {
    const matchTypes = ['Exact Match', 'Phrase Match', 'Broad Match'];
    const networks = ['Google Search', 'Microsoft Search'];

    const placements: Line[] = [];

    for (let i = 0; i < template.count; i++) {
        const matchType = matchTypes[i % matchTypes.length];
        const network = networks[i % networks.length];

        const baseCost = 5000 + (Math.random() * 15000);
        const clicks = Math.floor(baseCost / (2 + Math.random() * 8)); // $2-10 CPC
        const impressions = clicks * (10 + Math.floor(Math.random() * 40));

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
 */
function generateAudioPlacements(template: PlacementTemplate, flight: Flight): Line[] {
    const platforms = ['Spotify', 'Pandora', 'iHeartRadio'];
    const formats = ['Pre-roll', 'Mid-roll', 'Podcast'];

    const placements: Line[] = [];

    for (let i = 0; i < template.count; i++) {
        const platform = platforms[i % platforms.length];
        const format = formats[i % formats.length];

        const baseCost = 8000 + (Math.random() * 12000);
        const impressions = Math.floor(baseCost * (8 + Math.random() * 12));

        placements.push(createPlacement({
            channel: 'Audio',
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
 */
function generateGenericPlacements(template: PlacementTemplate, flight: Flight): Line[] {
    const placements: Line[] = [];

    for (let i = 0; i < template.count; i++) {
        const baseCost = 10000 + (Math.random() * 20000);
        const impressions = Math.floor(baseCost * (10 + Math.random() * 20));

        placements.push(createPlacement({
            channel: template.channel,
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
    channel: string;
    vendor: string;
    adUnit: string;
    program?: string;
    baseCost: number;
    impressions: number;
    flight: Flight;
}): Line {
    const { channel, vendor, adUnit, program, baseCost, impressions, flight } = params;

    const cpm = (baseCost / impressions) * 1000;
    const quantity = 1;

    return {
        id: uuidv4(),
        channel,
        vendor,
        adUnit,
        program: program || undefined,
        segment: 'General',
        startDate: flight.startDate,
        endDate: flight.endDate,
        rateType: 'CPM',
        rate: cpm,
        quantity,
        totalCost: baseCost,
        forecast: {
            impressions,
            clicks: Math.floor(impressions * (0.005 + Math.random() * 0.015)),
            conversions: Math.floor(impressions * (0.0001 + Math.random() * 0.0005)),
            ctr: 0.5 + Math.random() * 1.5,
            cpc: 2 + Math.random() * 8,
            cpa: 50 + Math.random() * 150
        },
        source: 'agent'
    };
}
