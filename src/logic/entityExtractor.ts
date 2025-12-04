/**
 * Entity Extraction Utilities
 * 
 * Extracts structured data from natural language input
 */

export interface ExtractedEntities {
    budget?: number;
    channels?: string[];
    dates?: {
        start?: Date;
        end?: Date;
        relative?: string;
    };
    metrics?: {
        name: string;
        value?: number;
        operator?: 'increase' | 'decrease' | 'target';
    }[];
    audience?: {
        demographics?: string[];
        behaviors?: string[];
        geography?: string[];
    };
    placements?: {
        count?: number;
        channel?: string;
        network?: string;
    };
    campaignName?: string;
}

/**
 * Extract budget amounts from input
 */
export function extractBudget(input: string): number | undefined {
    // Match patterns like: $100k, $100,000, 100k, $100K, $2.5M, $2.5m
    const patterns = [
        /\$?([\d,]+\.?\d*)\s*m(?:illion)?/i,  // Match M/million first (more specific)
        /\$?([\d,]+\.?\d*)\s*k/i,              // Then K
        /\$?([\d,]+)/                           // Then plain numbers
    ];

    for (const pattern of patterns) {
        const match = input.match(pattern);
        if (match) {
            let amount = parseFloat(match[1].replace(/,/g, ''));

            // Check the original matched string for suffix
            const originalMatch = match[0].toLowerCase();
            if (originalMatch.includes('m')) {
                amount *= 1000000;
            } else if (originalMatch.includes('k')) {
                amount *= 1000;
            }

            return amount;
        }
    }

    return undefined;
}

/**
 * Extract channel names from input
 */
export function extractChannels(input: string): string[] {
    const channelKeywords: Record<string, string> = {
        'ctv': 'Connected TV',
        'connected tv': 'Connected TV',
        'streaming': 'Connected TV',
        'tv': 'Linear TV',
        'linear tv': 'Linear TV',
        'broadcast': 'Linear TV',
        'display': 'Display',
        'banner': 'Display',
        'native': 'Native',
        'social': 'Social',
        'facebook': 'Social',
        'instagram': 'Social',
        'tiktok': 'Social',
        'search': 'Search',
        'google': 'Search',
        'sem': 'Search',
        'dooh': 'DOOH',
        'out-of-home': 'DOOH',
        'ooh': 'DOOH',
        'audio': 'Audio',
        'podcast': 'Audio',
        'radio': 'Audio',
        'streaming audio': 'Audio',
        'email': 'Email',
        'retail media': 'Retail Media',
        'amazon': 'Retail Media',
        'walmart': 'Retail Media',
        'video': 'Video',
        'youtube': 'Video',
        'vod': 'VOD',
        'addressable': 'Addressable TV'
    };

    const normalizedInput = input.toLowerCase();
    const foundChannels = new Set<string>();

    for (const [keyword, channel] of Object.entries(channelKeywords)) {
        if (normalizedInput.includes(keyword)) {
            foundChannels.add(channel);
        }
    }

    return Array.from(foundChannels);
}

/**
 * Extract date references from input
 */
export function extractDates(input: string): ExtractedEntities['dates'] {
    const result: ExtractedEntities['dates'] = {};

    // Relative dates
    const relativePatterns = [
        { pattern: /next month/i, offset: { months: 1 } },
        { pattern: /next week/i, offset: { weeks: 1 } },
        { pattern: /next quarter|q\d/i, offset: { months: 3 } },
        { pattern: /in (\d+) (day|week|month)s?/i, dynamic: true }
    ];

    for (const rp of relativePatterns) {
        if (rp.pattern.test(input)) {
            const match = input.match(rp.pattern);
            if (match) {
                result.relative = match[0];
                // Would calculate actual dates here in real implementation
            }
        }
    }

    // Absolute dates (simplified - would use a proper date parser in production)
    const datePattern = /(\d{1,2}\/\d{1,2}\/\d{2,4})/g;
    const matches = input.match(datePattern);
    if (matches && matches.length > 0) {
        // First match is start date
        try {
            result.start = new Date(matches[0]);
        } catch (e) {
            // Invalid date
        }

        if (matches.length > 1) {
            try {
                result.end = new Date(matches[1]);
            } catch (e) {
                // Invalid date
            }
        }
    }

    return result;
}

/**
 * Extract performance metrics and targets
 */
export function extractMetrics(input: string): ExtractedEntities['metrics'] {
    const metrics: ExtractedEntities['metrics'] = [];

    const metricPatterns = [
        { name: 'CPA', pattern: /cpa/i },
        { name: 'ROAS', pattern: /roas/i },
        { name: 'CTR', pattern: /ctr|click(?:-|\s+)through/i },
        { name: 'Conversions', pattern: /conversion|convert/i },
        { name: 'Impressions', pattern: /impression/i },
        { name: 'Reach', pattern: /reach/i },
        { name: 'Frequency', pattern: /frequency/i }
    ];

    for (const mp of metricPatterns) {
        if (mp.pattern.test(input)) {
            const metric: any = { name: mp.name };

            // Detect operator
            if (/increase|improve|boost|raise|higher/i.test(input)) {
                metric.operator = 'increase';
            } else if (/decrease|reduce|lower|cut/i.test(input)) {
                metric.operator = 'decrease';
            } else if (/target|goal|aim/i.test(input)) {
                metric.operator = 'target';
            }

            // Try to extract numeric value
            const valuePattern = new RegExp(`${mp.name}.*?(\\d+(?:\\.\\d+)?)`, 'i');
            const match = input.match(valuePattern);
            if (match) {
                metric.value = parseFloat(match[1]);
            }

            metrics.push(metric);
        }
    }

    return metrics;
}

/**
 * Extract audience characteristics
 */
export function extractAudience(input: string): ExtractedEntities['audience'] {
    const audience: ExtractedEntities['audience'] = {
        demographics: [],
        behaviors: [],
        geography: []
    };

    // Demographics
    const demoPatterns = [
        { pattern: /\b(\d{2})-(\d{2})\b/, type: 'age_range' },
        { pattern: /millennials?/i, value: 'Millennials' },
        { pattern: /gen z/i, value: 'Gen Z' },
        { pattern: /parents?/i, value: 'Parents' },
        { pattern: /(?:household )?income (?:over|above) \$?([\d,k]+)/i, type: 'income' }
    ];

    for (const dp of demoPatterns) {
        const match = input.match(dp.pattern);
        if (match) {
            if ('value' in dp && dp.value) {
                audience.demographics?.push(dp.value);
            } else if (dp.type === 'age_range') {
                audience.demographics?.push(`Age ${match[1]}-${match[2]}`);
            } else if (dp.type === 'income' && match[1]) {
                audience.demographics?.push(`HHI $${match[1]}+`);
            }
        }
    }

    // Behaviors/Interests
    const behaviorPatterns = [
        { pattern: /shopping for|in-market for/i, type: 'intent' },
        { pattern: /interested in/i, type: 'interest' }
    ];

    for (const bp of behaviorPatterns) {
        if (bp.pattern.test(input)) {
            const afterMatch = input.split(bp.pattern)[1];
            if (afterMatch) {
                // Extract the next few words as the behavior
                const behavior = afterMatch.trim().split(/[,;.]/)[0];
                audience.behaviors?.push(behavior);
            }
        }
    }

    // Geography
    const geoPatterns = [
        { pattern: /(?:in|targeting) ([\w\s]+(?:dma|metro|market|state|city|zip)s?)/i },
        { pattern: /(?:northeast|southeast|midwest|southwest|west coast|east coast)/i },
        { pattern: /top (\d+) (?:dma|market)s?/i }
    ];

    for (const gp of geoPatterns) {
        const match = input.match(gp.pattern);
        if (match) {
            audience.geography?.push(match[0]);
        }
    }

    return audience;
}

/**
 * Extract placement specifications for batch operations
 */
export function extractPlacementSpecs(input: string): ExtractedEntities['placements'] {
    const specs: ExtractedEntities['placements'] = {};

    // Count: "add 5 placements", "create 3 campaigns"
    const countPattern = /(?:add|create|generate|make)\s+(\d+)\s+/i;
    const countMatch = input.match(countPattern);
    if (countMatch) {
        specs.count = parseInt(countMatch[1]);
    }

    // Channel
    const channels = extractChannels(input);
    if (channels.length > 0) {
        specs.channel = channels[0]; // Use first channel found
    }

    // Network/Publisher
    const networkPatterns = [
        { pattern: /on (espn|cnn|fox|nbc|cbs|abc|hulu|netflix)/i }
    ];

    for (const np of networkPatterns) {
        const match = input.match(np.pattern);
        if (match) {
            specs.network = match[1];
        }
    }

    return specs;
}

/**
 * Extract campaign name from input
 */
export function extractCampaignName(input: string): string | undefined {
    // Look for quoted strings as campaign names
    const quotedPattern = /["']([^"']+)["']/;
    const match = input.match(quotedPattern);
    if (match) {
        return match[1];
    }

    // Look for "campaign for X" patterns
    const forPattern = /campaign for ([^,;.]+)/i;
    const forMatch = input.match(forPattern);
    if (forMatch) {
        return forMatch[1].trim();
    }

    return undefined;
}

/**
 * Extract all entities from input
 */
export function extractAllEntities(input: string): ExtractedEntities {
    return {
        budget: extractBudget(input),
        channels: extractChannels(input),
        dates: extractDates(input),
        metrics: extractMetrics(input),
        audience: extractAudience(input),
        placements: extractPlacementSpecs(input),
        campaignName: extractCampaignName(input)
    };
}
