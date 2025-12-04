/**
 * InventoryService - Centralized inventory data for TV, DOOH, and other media
 *
 * This module extracts all hardcoded inventory data from AgentBrain into a
 * dedicated service. This makes the data easier to maintain, test, and
 * eventually replace with API calls.
 */

import { createAgentMessage } from './AgentContext';
import { AgentMessage } from '../types';
import { getDMAByCity } from './dmaData';

// =============================================================================
// TV PROGRAMMING DATA
// =============================================================================

export interface TVProgram {
    name: string;
    viewerRange: string;
}

export interface TVNetwork {
    name: string;
    programs: TVProgram[];
}

export interface TVCategory {
    name: string;
    emoji: string;
    networks: TVNetwork[];
}

export const TV_PROGRAMMING: TVCategory[] = [
    {
        name: 'Sports',
        emoji: '📺',
        networks: [
            {
                name: 'ESPN',
                programs: [
                    { name: 'SportsCenter', viewerRange: '2-5M' },
                    { name: 'Monday Night Football', viewerRange: '12-15M' },
                    { name: 'NBA on ESPN', viewerRange: '3-6M' }
                ]
            },
            {
                name: 'Fox Sports',
                programs: [
                    { name: 'NFL on Fox', viewerRange: '15-20M' },
                    { name: 'UEFA Champions League', viewerRange: '2-4M' }
                ]
            },
            {
                name: 'NBC Sports',
                programs: [
                    { name: 'Sunday Night Football', viewerRange: '18-22M' },
                    { name: 'Premier League', viewerRange: '1-3M' }
                ]
            }
        ]
    },
    {
        name: 'News',
        emoji: '📰',
        networks: [
            {
                name: 'Cable News',
                programs: [
                    { name: 'CNN Prime Time', viewerRange: '1-3M' },
                    { name: 'Fox News Tonight', viewerRange: '3-5M' },
                    { name: 'MSNBC Evening', viewerRange: '1.5-2.5M' }
                ]
            },
            {
                name: 'Broadcast News',
                programs: [
                    { name: 'NBC Nightly News', viewerRange: '6-8M' },
                    { name: 'ABC World News Tonight', viewerRange: '7-9M' },
                    { name: 'CBS Evening News', viewerRange: '5-6M' }
                ]
            },
            {
                name: 'Morning Shows',
                programs: [
                    { name: 'Today Show', viewerRange: '3-4M' },
                    { name: 'Good Morning America', viewerRange: '3.5-4.5M' },
                    { name: 'CBS Mornings', viewerRange: '2.5-3M' }
                ]
            }
        ]
    },
    {
        name: 'Drama',
        emoji: '🎬',
        networks: [
            {
                name: 'Network Drama',
                programs: [
                    { name: 'Law & Order SVU - NBC', viewerRange: '4-6M' },
                    { name: 'Chicago Fire - NBC', viewerRange: '6-8M' },
                    { name: 'FBI - CBS', viewerRange: '6-7M' },
                    { name: 'The Rookie - ABC', viewerRange: '4-5M' }
                ]
            },
            {
                name: 'Streaming Originals',
                programs: [
                    { name: 'Stranger Things - Netflix', viewerRange: 'N/A' },
                    { name: 'The Bear - Hulu', viewerRange: 'N/A' },
                    { name: 'Yellowstone - Paramount+', viewerRange: 'N/A' },
                    { name: 'House of the Dragon - HBO Max', viewerRange: 'N/A' }
                ]
            }
        ]
    },
    {
        name: 'Comedy',
        emoji: '😂',
        networks: [
            {
                name: 'Network Comedy',
                programs: [
                    { name: 'Abbott Elementary - ABC', viewerRange: '3-4M' },
                    { name: 'Young Sheldon - CBS', viewerRange: '6-8M' },
                    { name: 'The Conners - ABC', viewerRange: '3-4M' }
                ]
            },
            {
                name: 'Late Night',
                programs: [
                    { name: 'The Tonight Show - NBC', viewerRange: '1.5-2M' },
                    { name: 'Jimmy Kimmel Live - ABC', viewerRange: '1.8-2.3M' },
                    { name: 'The Late Show - CBS', viewerRange: '2-2.5M' }
                ]
            },
            {
                name: 'Streaming',
                programs: [
                    { name: 'Ted Lasso - Apple TV+', viewerRange: 'N/A' },
                    { name: 'Only Murders in the Building - Hulu', viewerRange: 'N/A' }
                ]
            }
        ]
    },
    {
        name: 'Reality',
        emoji: '⭐',
        networks: [
            {
                name: 'Competition Shows',
                programs: [
                    { name: 'The Voice - NBC', viewerRange: '6-8M' },
                    { name: 'American Idol - ABC', viewerRange: '5-6M' },
                    { name: 'Survivor - CBS', viewerRange: '6-7M' },
                    { name: 'The Masked Singer - Fox', viewerRange: '5-6M' }
                ]
            },
            {
                name: 'Lifestyle/Home',
                programs: [
                    { name: 'Fixer Upper - HGTV', viewerRange: '2-3M' },
                    { name: 'Property Brothers - HGTV', viewerRange: '1.5-2M' }
                ]
            },
            {
                name: 'Dating/Social',
                programs: [
                    { name: 'The Bachelor - ABC', viewerRange: '4-5M' },
                    { name: 'Love Island - Peacock', viewerRange: 'N/A' }
                ]
            }
        ]
    },
    {
        name: 'Kids/Family',
        emoji: '👨‍👩‍👧‍👦',
        networks: [
            {
                name: 'Preschool',
                programs: [
                    { name: 'Sesame Street - PBS', viewerRange: 'N/A' },
                    { name: 'Bluey - Disney Jr', viewerRange: '1-2M' },
                    { name: 'Daniel Tiger - PBS', viewerRange: 'N/A' }
                ]
            },
            {
                name: 'Kids 6-11',
                programs: [
                    { name: 'SpongeBob - Nickelodeon', viewerRange: '1.5-2M' },
                    { name: 'Paw Patrol - Nickelodeon', viewerRange: '1-1.5M' }
                ]
            },
            {
                name: 'Family Prime',
                programs: [
                    { name: 'America\'s Funniest Home Videos - ABC', viewerRange: '3-4M' },
                    { name: 'The Simpsons - Fox', viewerRange: '2-3M' }
                ]
            }
        ]
    },
    {
        name: 'Documentary',
        emoji: '🌍',
        networks: [
            {
                name: 'Nature/Science',
                programs: [
                    { name: 'Planet Earth - Discovery/BBC', viewerRange: 'N/A' },
                    { name: 'Our Planet - Netflix', viewerRange: 'N/A' },
                    { name: 'Cosmos - National Geographic', viewerRange: 'N/A' }
                ]
            },
            {
                name: 'True Crime',
                programs: [
                    { name: 'Dateline NBC', viewerRange: '3-4M' },
                    { name: '48 Hours - CBS', viewerRange: '2-3M' }
                ]
            },
            {
                name: 'Educational',
                programs: [
                    { name: 'NOVA - PBS', viewerRange: 'N/A' },
                    { name: 'How It\'s Made - Discovery', viewerRange: 'N/A' }
                ]
            }
        ]
    }
];

// =============================================================================
// DOOH DATA
// =============================================================================

export interface DOOHVenue {
    name: string;
    screens: number;
    impressions: string;
}

export interface DOOHVendor {
    name: string;
    venues: DOOHVenue[];
}

export interface DOOHMarket {
    city: string;
    emoji: string;
    vendors: DOOHVendor[];
    totalScreens: number;
    totalImpressions: string;
}

export const DOOH_MARKETS: Record<string, DOOHMarket> = {
    'new york': {
        city: 'NYC',
        emoji: '🗽',
        vendors: [
            {
                name: 'Clear Channel',
                venues: [
                    { name: 'Times Square', screens: 25, impressions: '15M monthly' },
                    { name: 'Penn Station', screens: 180, impressions: '4.5M' },
                    { name: 'JFK/EWR/LGA Airports', screens: 645, impressions: '45M' }
                ]
            },
            {
                name: 'Outfront Media',
                venues: [
                    { name: 'MTA Subway', screens: 4500, impressions: '25M' },
                    { name: 'LinkNYC Kiosks', screens: 1750, impressions: '12M' }
                ]
            }
        ],
        totalScreens: 7100,
        totalImpressions: '101.5M monthly'
    },
    'los angeles': {
        city: 'Los Angeles',
        emoji: '🌴',
        vendors: [
            {
                name: 'Clear Channel',
                venues: [
                    { name: 'Hollywood Blvd', screens: 85, impressions: '8M monthly' },
                    { name: 'Sunset Strip', screens: 45, impressions: '5M' },
                    { name: 'LAX Airport', screens: 320, impressions: '16M' }
                ]
            },
            {
                name: 'Outfront Media',
                venues: [
                    { name: 'Metro Network', screens: 1200, impressions: '15M' }
                ]
            },
            {
                name: 'JCDecaux',
                venues: [
                    { name: 'Beach Cities', screens: 180, impressions: '6M' }
                ]
            }
        ],
        totalScreens: 1830,
        totalImpressions: '50M monthly'
    },
    'chicago': {
        city: 'Chicago',
        emoji: '🏙️',
        vendors: [
            {
                name: 'Clear Channel',
                venues: [
                    { name: 'O\'Hare Airport (ORD)', screens: 350, impressions: '22M monthly' },
                    { name: 'Loop District', screens: 95, impressions: '6M' }
                ]
            },
            {
                name: 'Outfront Media',
                venues: [
                    { name: 'CTA Train Network', screens: 2100, impressions: '18M' },
                    { name: 'Michigan Avenue', screens: 120, impressions: '8M' }
                ]
            },
            {
                name: 'JCDecaux',
                venues: [
                    { name: 'ORD International', screens: 95, impressions: '8M' }
                ]
            }
        ],
        totalScreens: 2760,
        totalImpressions: '62M monthly'
    },
    'dallas': {
        city: 'Dallas/Fort Worth',
        emoji: '🤠',
        vendors: [
            {
                name: 'Clear Channel',
                venues: [
                    { name: 'DFW Airport', screens: 280, impressions: '18M monthly' },
                    { name: 'Downtown Dallas', screens: 65, impressions: '4.5M' }
                ]
            },
            {
                name: 'Outfront Media',
                venues: [
                    { name: 'DART Rail Network', screens: 450, impressions: '8M' },
                    { name: 'Highway Digital Bulletins', screens: 220, impressions: '12M' }
                ]
            },
            {
                name: 'JCDecaux',
                venues: [
                    { name: 'DFW Terminals', screens: 185, impressions: '12.5M' }
                ]
            }
        ],
        totalScreens: 1200,
        totalImpressions: '55M monthly'
    },
    'atlanta': {
        city: 'Atlanta',
        emoji: '🍑',
        vendors: [
            {
                name: 'Clear Channel',
                venues: [
                    { name: 'ATL Airport', screens: 420, impressions: '28M monthly' },
                    { name: 'Midtown Atlanta', screens: 75, impressions: '5M' }
                ]
            },
            {
                name: 'Outfront Media',
                venues: [
                    { name: 'MARTA Network', screens: 850, impressions: '12M' },
                    { name: 'Perimeter Highway', screens: 180, impressions: '9M' }
                ]
            },
            {
                name: 'JCDecaux',
                venues: [
                    { name: 'ATL International', screens: 125, impressions: '9M' }
                ]
            }
        ],
        totalScreens: 1650,
        totalImpressions: '63M monthly'
    },
    'miami': {
        city: 'Miami',
        emoji: '🌺',
        vendors: [
            {
                name: 'Clear Channel',
                venues: [
                    { name: 'MIA Airport', screens: 185, impressions: '14M monthly' },
                    { name: 'South Beach', screens: 95, impressions: '6.5M' }
                ]
            },
            {
                name: 'Outfront Media',
                venues: [
                    { name: 'Brickell Financial', screens: 65, impressions: '4M' },
                    { name: 'I-95 Corridor', screens: 140, impressions: '8M' }
                ]
            },
            {
                name: 'JCDecaux',
                venues: [
                    { name: 'MIA International', screens: 65, impressions: '5M' }
                ]
            }
        ],
        totalScreens: 550,
        totalImpressions: '37.5M monthly'
    },
    'seoul': {
        city: 'Seoul',
        emoji: '🌏',
        vendors: [
            {
                name: 'Clear Channel Korea',
                venues: [
                    { name: 'Gangnam Station', screens: 120, impressions: '2.5M monthly' },
                    { name: 'Seoul Station Hub', screens: 85, impressions: '1.8M' },
                    { name: 'Incheon Airport (ICN)', screens: 68, impressions: '5.5M' }
                ]
            },
            {
                name: 'JCDecaux Korea',
                venues: [
                    { name: 'Hongdae District', screens: 150, impressions: '1.9M' },
                    { name: 'Coex Mall', screens: 45, impressions: '800K' },
                    { name: 'ICN Terminals', screens: 240, impressions: '20M' }
                ]
            }
        ],
        totalScreens: 708,
        totalImpressions: '32.5M monthly'
    }
};

// Airport-specific DOOH data
export const AIRPORT_DOOH: Record<string, DOOHMarket> = {
    'dfw': {
        city: 'DFW Airport',
        emoji: '✈️',
        vendors: [
            {
                name: 'Clear Channel Airports',
                venues: [
                    { name: 'DFW Terminal Network', screens: 280, impressions: '18M monthly' },
                    { name: 'Baggage Claim Displays', screens: 85, impressions: '6M' }
                ]
            },
            {
                name: 'JCDecaux Airport',
                venues: [
                    { name: 'Gate Area Screens', screens: 120, impressions: '8M' },
                    { name: 'Concourse Digital', screens: 65, impressions: '4.5M' }
                ]
            }
        ],
        totalScreens: 550,
        totalImpressions: '36.5M monthly'
    },
    'ord': {
        city: 'O\'Hare Airport (ORD)',
        emoji: '✈️',
        vendors: [
            {
                name: 'Clear Channel Airports',
                venues: [
                    { name: 'ORD Terminal Network', screens: 350, impressions: '22M monthly' },
                    { name: 'United Concourse', screens: 140, impressions: '12M' }
                ]
            },
            {
                name: 'JCDecaux Airport',
                venues: [
                    { name: 'International Terminal', screens: 95, impressions: '8M' },
                    { name: 'Baggage & Arrivals', screens: 78, impressions: '5.5M' }
                ]
            }
        ],
        totalScreens: 663,
        totalImpressions: '47.5M monthly'
    },
    'lax': {
        city: 'LAX Airport',
        emoji: '✈️',
        vendors: [
            {
                name: 'Clear Channel Airports',
                venues: [
                    { name: 'LAX Terminal Network', screens: 320, impressions: '16M monthly' },
                    { name: 'Tom Bradley International', screens: 110, impressions: '9M' }
                ]
            },
            {
                name: 'Outfront Airport',
                venues: [
                    { name: 'Arrivals Hall', screens: 95, impressions: '6.5M' },
                    { name: 'Curbside Digital', screens: 68, impressions: '4M' }
                ]
            }
        ],
        totalScreens: 593,
        totalImpressions: '35.5M monthly'
    },
    'atl': {
        city: 'ATL Airport',
        emoji: '✈️',
        vendors: [
            {
                name: 'Clear Channel Airports',
                venues: [
                    { name: 'ATL Terminal Network', screens: 420, impressions: '28M monthly' },
                    { name: 'Domestic Concourses', screens: 185, impressions: '15M' }
                ]
            },
            {
                name: 'JCDecaux Airport',
                venues: [
                    { name: 'International Terminal', screens: 125, impressions: '9M' },
                    { name: 'Baggage Claim', screens: 95, impressions: '6.5M' }
                ]
            }
        ],
        totalScreens: 825,
        totalImpressions: '58.5M monthly'
    },
    'jfk': {
        city: 'NYC Airports',
        emoji: '✈️',
        vendors: [
            {
                name: 'JFK Airport',
                venues: [
                    { name: 'Terminal Network', screens: 285, impressions: '20M monthly' }
                ]
            },
            {
                name: 'Newark (EWR)',
                venues: [
                    { name: 'Terminal Network', screens: 195, impressions: '14M' }
                ]
            },
            {
                name: 'LaGuardia (LGA)',
                venues: [
                    { name: 'New Terminal Network', screens: 165, impressions: '11M' }
                ]
            }
        ],
        totalScreens: 645,
        totalImpressions: '45M monthly'
    },
    'mia': {
        city: 'MIA Airport',
        emoji: '✈️',
        vendors: [
            {
                name: 'Clear Channel Airports',
                venues: [
                    { name: 'MIA Terminal Network', screens: 185, impressions: '14M monthly' },
                    { name: 'Concourse D-E', screens: 78, impressions: '6M' }
                ]
            },
            {
                name: 'JCDecaux Airport',
                venues: [
                    { name: 'International Arrivals', screens: 65, impressions: '5M' }
                ]
            }
        ],
        totalScreens: 328,
        totalImpressions: '25M monthly'
    },
    'icn': {
        city: 'Incheon Airport (ICN)',
        emoji: '✈️',
        vendors: [
            {
                name: 'JCDecaux Korea',
                venues: [
                    { name: 'ICN Terminal 1', screens: 145, impressions: '12M monthly' },
                    { name: 'ICN Terminal 2', screens: 95, impressions: '8M' }
                ]
            },
            {
                name: 'Clear Channel Korea',
                venues: [
                    { name: 'Arrivals Hall', screens: 68, impressions: '5.5M' }
                ]
            }
        ],
        totalScreens: 308,
        totalImpressions: '25.5M monthly'
    }
};

// =============================================================================
// VERTICAL VIDEO OPTIONS
// =============================================================================

export interface VerticalVideoOption {
    platform: string;
    duration: string;
    aspectRatio: string;
}

export const VERTICAL_VIDEO_OPTIONS: VerticalVideoOption[] = [
    { platform: 'TikTok', duration: 'up to 60s', aspectRatio: '9:16' },
    { platform: 'Instagram Reels', duration: 'up to 90s', aspectRatio: '9:16' },
    { platform: 'Instagram Stories', duration: '15s', aspectRatio: '9:16' },
    { platform: 'Snapchat', duration: 'up to 60s', aspectRatio: '9:16' },
    { platform: 'YouTube Shorts', duration: 'up to 60s', aspectRatio: '9:16' }
];

// =============================================================================
// SERVICE CLASS
// =============================================================================

export class InventoryService {
    /**
     * Get TV programming for a category
     */
    getTVProgramming(category: string): TVCategory | undefined {
        const lowerCategory = category.toLowerCase();
        return TV_PROGRAMMING.find(cat =>
            cat.name.toLowerCase().includes(lowerCategory) ||
            lowerCategory.includes(cat.name.toLowerCase())
        );
    }

    /**
     * Get all TV categories
     */
    getAllTVCategories(): TVCategory[] {
        return TV_PROGRAMMING;
    }

    /**
     * Get DOOH market data for a city
     */
    getDOOHMarket(city: string): DOOHMarket | undefined {
        const lowerCity = city.toLowerCase();

        // Check for city matches
        for (const [key, market] of Object.entries(DOOH_MARKETS)) {
            if (lowerCity.includes(key) || key.includes(lowerCity)) {
                return market;
            }
        }

        // Check for special aliases
        if (lowerCity.includes('nyc')) {
            return DOOH_MARKETS['new york'];
        }
        if (lowerCity.includes('la ') || lowerCity.endsWith(' la')) {
            return DOOH_MARKETS['los angeles'];
        }
        if (lowerCity.includes('korea')) {
            return DOOH_MARKETS['seoul'];
        }

        return undefined;
    }

    /**
     * Get airport-specific DOOH data
     */
    getAirportDOOH(airportCode: string): DOOHMarket | undefined {
        const lowerCode = airportCode.toLowerCase();
        return AIRPORT_DOOH[lowerCode];
    }

    /**
     * Get vertical video options
     */
    getVerticalVideoOptions(): VerticalVideoOption[] {
        return VERTICAL_VIDEO_OPTIONS;
    }

    /**
     * Handle an inventory query and return an AgentMessage
     */
    handleInventoryQuery(query: string): AgentMessage {
        const lowerQuery = query.toLowerCase();

        // Sports programming
        if (lowerQuery.includes('sports') && (lowerQuery.includes('tv') || lowerQuery.includes('program') || lowerQuery.includes('show'))) {
            const category = this.getTVProgramming('sports');
            if (category) {
                return this.formatTVCategoryResponse(category);
            }
        }

        // News programming
        if ((lowerQuery.includes('news') || lowerQuery.includes('current events')) &&
            (lowerQuery.includes('program') || lowerQuery.includes('show') || lowerQuery.includes('available') || lowerQuery.includes('avail'))) {
            const category = this.getTVProgramming('news');
            if (category) {
                return this.formatTVCategoryResponse(category);
            }
        }

        // Drama programming
        if ((lowerQuery.includes('drama') || lowerQuery.includes('series')) &&
            (lowerQuery.includes('show') || lowerQuery.includes('program') || lowerQuery.includes('available') || lowerQuery.includes('avail'))) {
            const category = this.getTVProgramming('drama');
            if (category) {
                return this.formatTVCategoryResponse(category);
            }
        }

        // Comedy programming
        if ((lowerQuery.includes('comedy') || lowerQuery.includes('sitcom')) &&
            (lowerQuery.includes('show') || lowerQuery.includes('program') || lowerQuery.includes('available') || lowerQuery.includes('avail'))) {
            const category = this.getTVProgramming('comedy');
            if (category) {
                return this.formatTVCategoryResponse(category);
            }
        }

        // Reality programming
        if ((lowerQuery.includes('reality') || lowerQuery.includes('competition')) &&
            (lowerQuery.includes('show') || lowerQuery.includes('program') || lowerQuery.includes('available') || lowerQuery.includes('avail'))) {
            const category = this.getTVProgramming('reality');
            if (category) {
                return this.formatTVCategoryResponse(category);
            }
        }

        // Kids/Family programming
        if ((lowerQuery.includes('kids') || lowerQuery.includes('family') || lowerQuery.includes('children')) &&
            (lowerQuery.includes('show') || lowerQuery.includes('program') || lowerQuery.includes('available') || lowerQuery.includes('avail'))) {
            const category = this.getTVProgramming('kids/family');
            if (category) {
                return this.formatTVCategoryResponse(category);
            }
        }

        // Documentary programming
        if ((lowerQuery.includes('documentary') || lowerQuery.includes('educational') || lowerQuery.includes('nature')) &&
            (lowerQuery.includes('show') || lowerQuery.includes('program') || lowerQuery.includes('available') || lowerQuery.includes('avail'))) {
            const category = this.getTVProgramming('documentary');
            if (category) {
                return this.formatTVCategoryResponse(category);
            }
        }

        // DOOH inventory
        if (lowerQuery.includes('dooh') || lowerQuery.includes('outdoor') || lowerQuery.includes('billboard')) {
            return this.handleDOOHQuery(lowerQuery);
        }

        // Vertical video
        if ((lowerQuery.includes('vertical') || lowerQuery.includes('9:16')) && lowerQuery.includes('video')) {
            return this.formatVerticalVideoResponse();
        }

        // Default response
        return createAgentMessage(
            "I can help you find inventory! Try:\n\n" +
            "• 'What sports programming is available?'\n" +
            "• 'What DOOH is in [city]?'\n" +
            "• 'Where can I run vertical video?'",
            ['Show sports programming']
        );
    }

    /**
     * Handle DMA broadcast station queries
     */
    handleDMAQuery(query: string): AgentMessage | null {
        const dma = getDMAByCity(query);

        if (dma) {
            const stationList = dma.stations.map(s =>
                `• **${s.callSign}** (${s.network}) - Ch ${s.channel}${s.owner ? ` [${s.owner}]` : ''}`
            ).join('\n');

            const suggestions = dma.stations.slice(0, 2).map(s => `Add ${s.callSign} (${s.network})`);

            return createAgentMessage(
                `**📺 Broadcast Stations - ${dma.name} (Rank #${dma.rank}):**\n\n${stationList}`,
                suggestions
            );
        }
        return null;
    }

    private handleDOOHQuery(lowerQuery: string): AgentMessage {
        // Check for airport-only queries first
        const airportCodes = ['dfw', 'ord', 'lax', 'atl', 'jfk', 'lga', 'ewr', 'mia', 'icn'];
        const cityNames = ['dallas', 'chicago', 'los angeles', 'atlanta', 'new york', 'nyc', 'miami', 'seoul', 'korea'];

        for (const code of airportCodes) {
            // Only match if airport code is present but NOT the city name
            if (lowerQuery.includes(code)) {
                const hasCity = cityNames.some(city => lowerQuery.includes(city));
                if (!hasCity) {
                    const airport = this.getAirportDOOH(code);
                    if (airport) {
                        return this.formatDOOHResponse(airport, true);
                    }
                }
            }
        }

        // Check for city-wide queries
        for (const [key] of Object.entries(DOOH_MARKETS)) {
            if (lowerQuery.includes(key)) {
                const market = DOOH_MARKETS[key];
                return this.formatDOOHResponse(market, false);
            }
        }

        // Special city aliases
        if (lowerQuery.includes('nyc')) {
            return this.formatDOOHResponse(DOOH_MARKETS['new york'], false);
        }
        // Match "la " or " la" but NOT "lax" (airport code handled above)
        if ((lowerQuery.includes('la ') || /\bla$/.test(lowerQuery)) && !lowerQuery.includes('lax')) {
            return this.formatDOOHResponse(DOOH_MARKETS['los angeles'], false);
        }
        if (lowerQuery.includes('korea')) {
            return this.formatDOOHResponse(DOOH_MARKETS['seoul'], false);
        }

        // Default DOOH response
        return createAgentMessage(
            "**🌍 DOOH Available in:**\n\n" +
            "• New York (7,000+ screens)\n" +
            "• Los Angeles (5,500+ screens)\n" +
            "• Seoul (2,100+ screens)\n" +
            "• Tokyo (6,500+ screens)\n\n" +
            "Try asking about a specific city!",
            ['Show New York DOOH', 'Show Seoul DOOH']
        );
    }

    private formatTVCategoryResponse(category: TVCategory): AgentMessage {
        let content = `**${category.emoji} Available ${category.name} Programming:**\n\n`;

        for (const network of category.networks) {
            content += `**${network.name}:**\n`;
            for (const program of network.programs) {
                content += `• ${program.name} (${program.viewerRange} viewers)\n`;
            }
            content += '\n';
        }

        const firstProgram = category.networks[0]?.programs[0]?.name || 'program';
        return createAgentMessage(content.trim(), [`Add ${firstProgram}`]);
    }

    private formatDOOHResponse(market: DOOHMarket, isAirport: boolean): AgentMessage {
        const title = isAirport
            ? `**${market.emoji} DOOH Inventory - ${market.city}:**`
            : `**${market.emoji} DOOH Inventory - ${market.city} (City-Wide):**`;

        let content = `${title}\n\n`;

        for (const vendor of market.vendors) {
            content += `**${vendor.name}:**\n`;
            for (const venue of vendor.venues) {
                content += `• ${venue.name} (${venue.screens} screens, ${venue.impressions} impr)\n`;
            }
            content += '\n';
        }

        content += `**Total: ${market.totalScreens.toLocaleString()} screens, ${market.totalImpressions} impressions**`;

        const firstVenue = market.vendors[0]?.venues[0]?.name || 'DOOH';
        return createAgentMessage(content, [`Add ${firstVenue} DOOH`]);
    }

    private formatVerticalVideoResponse(): AgentMessage {
        let content = "**📱 Vertical Video Options:**\n\n**Social:**\n";

        for (const option of VERTICAL_VIDEO_OPTIONS) {
            content += `• ${option.platform} (${option.duration}, ${option.aspectRatio})\n`;
        }

        content += "\n**Best for engagement:** TikTok & Instagram Reels";

        return createAgentMessage(content, ['Add TikTok vertical video', 'Add Instagram Reels']);
    }
}

// Export singleton instance
export const inventoryService = new InventoryService();
