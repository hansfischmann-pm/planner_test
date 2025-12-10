import { Campaign, Line, CostMethod, Brand, User, Flight, AgentInfo, PlanMetrics, ForecastMetrics, DeliveryMetrics, ForecastSource, Creative, ConversionPath, Touchpoint, ChannelType } from '../types';

// Generate a random ID (for user-created entities)
export const generateId = () => Math.random().toString(36).substr(2, 9);

// Generate a deterministic ID based on a seed string (for stable dummy data)
// This ensures IDs remain consistent across page reloads
export const generateStableId = (seed: string): string => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).substr(0, 9).padEnd(9, '0');
};

// --- Constants & Reference Data ---

const VENDORS: Record<string, string[]> = {
    Search: ['Google Ads', 'Microsoft Ads', 'Amazon Ads'],
    Social: ['Meta', 'TikTok', 'LinkedIn', 'Snapchat', 'Pinterest', 'X (Twitter)'],
    Display: ['Google Display Network', 'Taboola', 'Outbrain', 'Criteo', 'The Trade Desk'],
    TV: ['Linear TV', 'CTV'],
    Radio: ['iHeartRadio', 'SiriusXM', 'Audacy', 'Cumulus'],
    'Streaming Audio': ['Spotify', 'Pandora', 'Amazon Music', 'Apple Music', 'Sonos'],
    'Podcast': ['Spotify Podcasts', 'Apple Podcasts', 'Megaphone', 'Acast', 'Art19'],
    'Place-based Audio': ['Vibenomics', 'Mood Media', 'Rockbot', 'Soundtrack Your Brand'],
    OOH: ['Clear Channel', 'Lamar', 'Outfront Media', 'JCDecaux']
    // Print channel removed
};

const TV_NETWORKS: {
    Linear: Record<string, string[]>;
    CTV: Record<string, string[]>;
} = {
    Linear: {
        'ESPN': ['SportsCenter', 'Monday Night Football', 'NBA on ESPN', 'College GameDay', 'First Take'],
        'ESPN2': ['NFL Live', 'College Football', 'NBA Coast to Coast', 'SportsNation'],
        'CBS': ['60 Minutes', 'NCIS', 'FBI', 'Matlock', 'The Price is Right', 'Young Sheldon'],
        'NBC': ['Sunday Night Football', 'The Voice', 'Law & Order', 'Chicago Fire', 'Today Show'],
        'ABC': ['Good Morning America', 'Grey\'s Anatomy', 'The Bachelor', '20/20', 'Dancing with the Stars'],
        'FOX': ['The Simpsons', 'Family Guy', '9-1-1', 'The Masked Singer', 'NFL on FOX'],
        'CNN': ['Anderson Cooper 360', 'The Situation Room', 'CNN Tonight', 'New Day'],
        'MSNBC': ['Morning Joe', 'The Rachel Maddow Show', 'Deadline: White House'],
        'Fox News': ['Tucker Carlson Tonight', 'Hannity', 'The Five', 'Fox & Friends'],
        'HGTV': ['Fixer Upper', 'Property Brothers', 'House Hunters', 'Love It or List It'],
        'Food Network': ['Chopped', 'Guy\'s Grocery Games', 'The Pioneer Woman', 'Beat Bobby Flay'],
        'Discovery': ['Deadliest Catch', 'Gold Rush', 'Mythbusters', 'Shark Week'],
        'TLC': ['90 Day Fiancé', 'My 600-lb Life', 'Say Yes to the Dress'],
        'Bravo': ['Real Housewives', 'Top Chef', 'Below Deck', 'Vanderpump Rules'],
        'TNT': ['NBA on TNT', 'Inside the NBA', 'AEW Dynamite'],
        'USA Network': ['WWE Raw', 'Law & Order: SVU', 'Suits']
    },
    CTV: {
        'Netflix': ['Stranger Things', 'The Crown', 'Squid Game', 'Wednesday', 'Bridgerton', 'Ozark', 'The Witcher'],
        'Hulu': ['The Handmaid\'s Tale', 'Only Murders in the Building', 'The Bear', 'Abbott Elementary'],
        'Amazon Prime Video': ['The Boys', 'Jack Ryan', 'The Marvelous Mrs. Maisel', 'Reacher', 'The Rings of Power'],
        'Disney+': ['The Mandalorian', 'Loki', 'Andor', 'WandaVision', 'Ahsoka'],
        'HBO Max': ['House of the Dragon', 'The Last of Us', 'Succession', 'Euphoria', 'White Lotus'],
        'Apple TV+': ['Ted Lasso', 'The Morning Show', 'Severance', 'For All Mankind', 'Shrinking'],
        'Paramount+': ['1923', 'Yellowstone', 'Star Trek: Strange New Worlds', 'Mayor of Kingstown'],
        'Peacock': ['The Office', 'Poker Face', 'Bel-Air', 'Ted'],
        'YouTube': ['MrBeast', 'MKBHD', 'Dude Perfect', 'Good Mythical Morning'],
        'Roku Channel': ['Roku Originals', 'Live Sports', 'News'],
        'Tubi': ['Free Movies', 'Classic TV', 'Tubi Originals'],
        'Pluto TV': ['Live News', 'Sports', 'Entertainment Channels'],
        'F1 TV': ['Formula 1 Races', 'F1 Highlights', 'Drive to Survive'],
        'ESPN+': ['UFC Fight Night', 'Top Rank Boxing', 'NHL Games', '30 for 30'],
        'DAZN': ['Boxing', 'MMA', 'Soccer'],
        'Sling TV': ['Live TV Channels', 'Sports', 'News']
    }
};

// --- Sample Data Generation ---

export const SAMPLE_USERS: User[] = [
    {
        id: 'user_agency_1',
        name: 'Alex Agency',
        email: 'agency_demo@fuseiq.ai',
        type: 'AGENCY',
        agencyId: 'agency_1',
        avatarUrl: 'https://i.pravatar.cc/150?u=alex'
    },
    {
        id: 'user_brand_pepsi',
        name: 'Pat Pepsi',
        email: 'brand_demo@fuseiq.ai',
        type: 'BRAND',
        brandId: 'brand_pepsi',
        avatarUrl: 'https://i.pravatar.cc/150?u=pat'
    }
];

export const SAMPLE_BRANDS: Brand[] = [
    {
        id: 'brand_coke',
        name: 'Coca-Cola',
        logoUrl: 'https://logo.clearbit.com/coca-cola.com',
        agencyId: 'agency_1',
        totalSpend: 45000000,
        budget: 50000000,
        activeCampaigns: 3,
        campaigns: []
    },
    {
        id: 'brand_gm',
        name: 'General Motors',
        logoUrl: 'https://logo.clearbit.com/gm.com',
        agencyId: 'agency_1',
        totalSpend: 82000000,
        budget: 90000000,
        activeCampaigns: 5,
        campaigns: []
    },
    {
        id: 'brand_pg',
        name: 'Procter & Gamble',
        logoUrl: 'https://logo.clearbit.com/pg.com',
        agencyId: 'agency_1',
        totalSpend: 120000000,
        budget: 125000000,
        activeCampaigns: 8,
        campaigns: []
    },
    {
        id: 'brand_pepsi',
        name: 'Pepsi',
        logoUrl: 'https://logo.clearbit.com/pepsi.com',
        agencyId: 'agency_1',
        totalSpend: 38000000,
        budget: 42000000,
        activeCampaigns: 2,
        campaigns: []
    }
];

export const SAMPLE_AGENTS: AgentInfo[] = [
    { id: 'agent_insights', name: 'Insights Agent', role: 'Analyst', capabilities: ['TRENDS', 'AUDIENCE'], status: 'IDLE', color: 'bg-blue-100 text-blue-800' },
    { id: 'agent_performance', name: 'Performance Agent', role: 'Optimizer', capabilities: ['EFFICIENCY', 'CONVERSION'], status: 'IDLE', color: 'bg-green-100 text-green-800' },
    { id: 'agent_yield', name: 'Yield Agent', role: 'Negotiator', capabilities: ['COST', 'RATES'], status: 'IDLE', color: 'bg-purple-100 text-purple-800' },
    { id: 'agent_creative', name: 'Creative Agent', role: 'Designer', capabilities: ['ASSETS', 'MESSAGING'], status: 'IDLE', color: 'bg-pink-100 text-pink-800' },
    { id: 'agent_audience', name: 'Audience Agent', role: 'Strategist', capabilities: ['SEGMENTS', 'REACH'], status: 'IDLE', color: 'bg-orange-100 text-orange-800' }
];

// --- Generators ---

const generateForecast = (channel: string, _vendor: string, budget: number): { forecast: ForecastMetrics, delivery: DeliveryMetrics } => {
    // 1. Determine Source
    let source: ForecastSource = 'Internal';
    if (channel === 'TV') source = 'Nielsen';
    else if (channel === 'Radio') source = 'Arbitron';
    else if (channel === 'OOH') source = 'Geopath';
    else if (channel === 'Display' || channel === 'TV') source = 'Comscore'; // CTV often Comscore
    else if (channel === 'Search' || channel === 'Social') source = 'Internal'; // Platform data

    // 2. Generate Forecast Metrics (Simulated)
    // CPM benchmarks based on 2024-2025 industry data
    // Sources: GroupM, eMarketer, IAB
    let estimatedCpm = 15;
    if (channel === 'TV') estimatedCpm = 20;          // Linear TV: $15-25 CPM (cable avg $20)
    if (channel === 'Social') estimatedCpm = 12;      // Social: $5-15 CPM (avg ~$12)
    if (channel === 'Display') estimatedCpm = 8;      // Display: $2.50-12 CPM (avg ~$8)
    if (channel === 'Search') estimatedCpm = 35;      // Search: $11-200 CPM (typically CPC, higher effective CPM)
    if (channel === 'OOH') estimatedCpm = 8;          // DOOH: $2-15 CPM (avg ~$8)
    if (channel === 'Radio') estimatedCpm = 12;       // Radio: $8-15 CPM
    if (channel === 'Streaming Audio') estimatedCpm = 20;  // Streaming audio: $15-25 CPM
    if (channel === 'Podcast') estimatedCpm = 30;     // Podcast: $18-60 CPM (avg ~$30)

    const forecastedImpressions = Math.floor((budget / estimatedCpm) * 1000);
    const forecastedReach = Math.floor(forecastedImpressions * 0.4); // Rough estimate
    const forecastedFreq = 2.5;

    const forecast: ForecastMetrics = {
        impressions: forecastedImpressions,
        spend: budget,
        reach: forecastedReach,
        frequency: forecastedFreq,
        source: source
    };

    // 3. Generate Delivery Metrics (Simulated Actuals)
    // Randomize delivery status: 70% On Track, 15% Under, 15% Over
    const rand = Math.random();
    let pacing = 1.0; // 100%
    let status: 'ON_TRACK' | 'UNDER_PACING' | 'OVER_PACING' = 'ON_TRACK';

    if (rand > 0.85) {
        pacing = 1.15; // Over-pacing
        status = 'OVER_PACING';
    } else if (rand > 0.70) {
        pacing = 0.85; // Under-pacing
        status = 'UNDER_PACING';
    } else {
        pacing = 0.98 + (Math.random() * 0.04); // +/- 2%
    }

    // Assume we are part-way through the campaign, so actuals are proportional to pacing * progress
    // For simplicity in this mock, let's say we are 50% through the flight
    const progress = 0.5;

    const actualSpend = Math.floor(budget * progress * pacing);
    const actualImpressions = Math.floor(forecastedImpressions * progress * pacing);

    const delivery: DeliveryMetrics = {
        actualImpressions: actualImpressions,
        actualSpend: actualSpend,
        pacing: Math.round(pacing * 100), // Store as percentage (e.g., 98)
        status: status
    };

    return { forecast, delivery };
};

export function generateLine(channel: 'Search' | 'Social' | 'Display' | 'TV' | 'Radio' | 'Streaming Audio' | 'Podcast' | 'Place-based Audio' | 'OOH', _advertiser: string, networkName?: string, programName?: string): Line {
    const vendors = VENDORS;

    const adUnits: Record<string, string[]> = {
        'Search': ['Responsive Search Ad', 'Exact Match Keyword', 'Shopping Ad'],
        'Social': ['Newsfeed Image', 'Story Video', 'Carousel', 'Reels'],
        'Display': ['300x250', '728x90', '160x600', 'Native'],
        'TV': [':30 Spot', ':15 Spot', 'Sponsorship'],
        'Radio': ['Audio Spot :30', 'Host Read', 'Live Read'],
        'Streaming Audio': ['Audio :30', 'Audio :15', 'Companion Banner'],
        'Podcast': ['Host Read :60', 'Pre-roll :15', 'Mid-roll :30', 'Baked-in'],
        'Place-based Audio': ['In-Store Audio :15', 'In-Store Audio :30', 'Checkout Audio'],
        'OOH': ['Digital Billboard', 'Transit Shelter', 'Highway Bulletin']
    };

    const segments: Record<string, string[]> = {
        'Search': ['High Intent', 'Brand Keywords', 'Competitor Conquesting'],
        'Social': ['A18-34', 'Parents', 'Interest: Tech', 'Lookalike 1%'],
        'Display': ['Retargeting', 'In-Market Auto', 'Affinity: Luxury'],
        'TV': ['Broad Reach', 'Sports Fans', 'Morning News'],
        'Radio': ['Commuters', 'Drive Time', 'Morning Show'],
        'Streaming Audio': ['Music Listeners', 'Workout', 'Commute', 'Focus'],
        'Podcast': ['True Crime', 'Business', 'Comedy', 'News & Politics'],
        'Place-based Audio': ['Grocery Shoppers', 'QSR Diners', 'Retail Shoppers'],
        'OOH': ['Urban Centers', 'Highway Traffic']
    };

    // Rate benchmarks based on 2024-2025 industry data
    // TV uses CPM now (data-driven linear approach) rather than spot pricing
    const rateInfo: Record<string, { method: CostMethod; min: number; max: number }> = {
        'Search': { method: 'CPC' as const, min: 1.5, max: 8 },      // Google Ads avg CPC: $2.69-$5.26
        'Social': { method: 'CPM' as const, min: 5, max: 15 },       // Facebook: $10-15, TikTok: $4-7, Instagram: $7-15
        'Display': { method: 'CPM' as const, min: 2.5, max: 12 },    // Programmatic: $2.50-$12
        'TV': { method: 'CPM' as const, min: 15, max: 35 },          // Linear: $15-25, CTV: $20-35
        'Radio': { method: 'CPM' as const, min: 8, max: 15 },        // Terrestrial radio CPM
        'Streaming Audio': { method: 'CPM' as const, min: 15, max: 25 },  // Spotify, Pandora: $15-25
        'Podcast': { method: 'CPM' as const, min: 18, max: 60 },     // Pre-roll: $15, Mid-roll: $25-60
        'Place-based Audio': { method: 'CPM' as const, min: 5, max: 15 }, // In-store audio
        'OOH': { method: 'CPM' as const, min: 2, max: 15 }           // DOOH: $2-15 CPM
    };

    const vendorList = vendors[channel] || vendors['TV'];
    const unitList = adUnits[channel] || adUnits['TV'];
    const segmentList = segments[channel] || segments['TV'];
    const rateInfo2 = rateInfo[channel] || rateInfo['TV'];

    let vendor: string = vendorList[0];
    let adUnit: string = unitList[0];

    // If a specific vendor/network name is provided, use it
    if (networkName) {
        vendor = networkName;
        // If program name is also provided (e.g., "ESPN" + "SportsCenter"), use it
        if (programName) {
            adUnit = programName;
        } else {
            // Pick a random ad unit for this channel
            adUnit = unitList[Math.floor(Math.random() * unitList.length)];
        }
    } else if (channel === 'TV' && programName) {
        // TV-specific: program name goes to adUnit
        vendor = vendorList[Math.floor(Math.random() * vendorList.length)];
        adUnit = programName;

        // Try to find specific network data if available
        if (TV_NETWORKS.Linear[vendor]) {
            // Could use this to validate or refine adUnits
        }
    } else {
        // Random vendor and ad unit
        vendor = vendorList[Math.floor(Math.random() * vendorList.length)];
        adUnit = unitList[Math.floor(Math.random() * unitList.length)];
    }

    const segment = segmentList[Math.floor(Math.random() * segmentList.length)];
    const rate = rateInfo2.min + Math.random() * (rateInfo2.max - rateInfo2.min);
    const costMethod = rateInfo2.method;
    const ctr = 0.005 + Math.random() * 0.025; // 0.5% - 3% CTR range (realistic)

    // Generate realistic budget/cost first, then derive impressions from CPM
    // Budget ranges based on typical placement sizes
    let baseBudget: number;

    if (channel === 'TV') {
        // TV placements: $10k - $100k per flight (realistic for cable)
        baseBudget = 10000 + Math.random() * 90000;
    } else if (channel === 'Search') {
        // Search: $5k - $50k per placement
        baseBudget = 5000 + Math.random() * 45000;
    } else if (channel === 'Social') {
        // Social: $5k - $40k per placement
        baseBudget = 5000 + Math.random() * 35000;
    } else if (channel === 'Podcast') {
        // Podcast: $8k - $30k per placement
        baseBudget = 8000 + Math.random() * 22000;
    } else {
        // Default: $5k - $30k per placement
        baseBudget = 5000 + Math.random() * 25000;
    }

    const totalCost = Math.round(baseBudget);

    // Calculate impressions based on CPM (the standard industry approach)
    // Impressions = (Budget / CPM) * 1000
    let impressions: number;

    if (costMethod === 'CPM' || channel === 'TV') {
        // CPM-based calculation: impressions = (budget / cpm) * 1000
        impressions = Math.floor((totalCost / rate) * 1000);

        // Apply realistic caps based on channel/audience size
        // These caps reflect actual US market sizes
        if (channel === 'TV') {
            // TV caps based on realistic viewership:
            // ESPN SportsCenter: ~700k viewers avg
            // Primetime cable: 1-3M viewers
            // Max reasonable flight impressions: 5-10M for a single show buy
            const isPrimetime = adUnit.includes(':30') || adUnit.includes('Sponsorship');
            const isSports = segment?.includes('Sports') || programName?.toLowerCase().includes('sport') || vendor.toLowerCase().includes('espn');

            let maxImpressions: number;
            if (isSports) {
                // Sports programming: 500k - 5M per flight (depending on event)
                maxImpressions = 500000 + Math.random() * 4500000;
            } else if (isPrimetime) {
                // Primetime: 1M - 5M per flight
                maxImpressions = 1000000 + Math.random() * 4000000;
            } else {
                // Daytime/off-peak: 200k - 1.5M per flight
                maxImpressions = 200000 + Math.random() * 1300000;
            }
            impressions = Math.min(impressions, Math.floor(maxImpressions));
        } else if (channel === 'Podcast') {
            // Podcast: cap at 2M impressions (top podcasts)
            impressions = Math.min(impressions, 2000000);
        } else if (channel === 'OOH') {
            // OOH: cap at 10M impressions per placement
            impressions = Math.min(impressions, 10000000);
        }
        // Social, Display, Streaming Audio can scale higher but still reasonable
        impressions = Math.min(impressions, 50000000); // Global cap: 50M impressions

    } else if (costMethod === 'CPC') {
        // For CPC (Search), quantity represents clicks
        const clicks = Math.floor(totalCost / rate);
        impressions = Math.floor(clicks / ctr); // Derive impressions from clicks and CTR
        impressions = Math.min(impressions, 20000000); // Cap at 20M
    } else {
        // Flat rate: estimate based on units/insertions
        impressions = Math.floor(50000 + Math.random() * 200000); // 50k - 250k
    }

    // Quantity represents different things per channel
    // For CPM: quantity = impressions / 1000 (thousands)
    // For CPC: quantity = clicks
    // For Flat: quantity = units/insertions
    let quantity: number;
    if (costMethod === 'CPM' || channel === 'TV') {
        quantity = Math.floor(impressions / 1000);
    } else if (costMethod === 'CPC') {
        quantity = Math.floor(totalCost / rate);
    } else {
        quantity = Math.floor(1 + Math.random() * 5); // 1-5 insertions for flat rate
    }

    const clicks = Math.floor(impressions * ctr);
    const cvr = 0.001 + Math.random() * 0.05;
    const conversions = Math.floor(impressions * cvr);
    const revenue = conversions * (50 + Math.random() * 100);

    // Performance metrics computed above (impressions, clicks, conversions, etc.)
    // are used for forecast generation, not directly attached to line

    // Buying Type Logic
    const buyingRoll = Math.random();
    let buyingType: 'Auction' | 'PMP' | 'Direct' = 'Auction';
    let dealId: string | undefined;
    let ioNumber: string | undefined;

    if (channel === 'TV' || channel === 'OOH') {
        buyingType = buyingRoll > 0.3 ? 'Direct' : 'Auction';
    } else if (channel === 'Display') {
        if (buyingRoll > 0.8) buyingType = 'PMP';
        else if (buyingRoll > 0.95) buyingType = 'Direct';
    }

    if (buyingType === 'PMP') dealId = `PMP-${Math.floor(Math.random() * 100000)}`;
    if (buyingType === 'Direct') ioNumber = `IO-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`;

    // Generate Creatives
    const numCreatives = Math.floor(Math.random() * 3) + 1; // 1-3 creatives
    const creatives: Creative[] = [];

    for (let i = 0; i < numCreatives; i++) {
        const isVideo = channel === 'TV' || channel === 'Social' && (adUnit.includes('Video') || adUnit.includes('Reel') || adUnit.includes('Story'));
        const videoUrls = [
            'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_1MB.mp4',
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
        ];

        creatives.push({
            id: Math.random().toString(36).substr(2, 9),
            name: `${vendor} ${channel} ${isVideo ? 'Spot' : 'Banner'} v${i + 1}`,
            type: isVideo ? 'VIDEO' : 'IMAGE',
            url: isVideo ? videoUrls[Math.floor(Math.random() * videoUrls.length)] : `https://picsum.photos/seed/${Math.random()}/400/300`,
            dimensions: isVideo ? '1920x1080' : '300x250',
            metrics: {
                ctr: ctr * (0.8 + Math.random() * 0.4), // Variation around placement CTR
                conversions: Math.floor(conversions / numCreatives * (0.8 + Math.random() * 0.4))
            }
        });
    }

    // Legacy single creative
    const creative = {
        id: creatives[0].id,
        name: creatives[0].name,
        type: creatives[0].type === 'VIDEO' ? 'video' : 'image',
        url: creatives[0].url
    };

    // Generate Forecast & Delivery Data
    // Use totalCost as budget proxy
    const { forecast, delivery } = generateForecast(channel, vendor, totalCost);

    return {
        id: generateId(),
        name: `${vendor} - ${channel} Line`,
        channel,
        vendor,
        adUnit,
        segment,
        rate,
        costMethod: rateInfo2.method as any,
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        quantity,
        totalCost,
        forecast: forecast,
        delivery: delivery,
        performance: {
            impressions: delivery.actualImpressions, // Sync performance with delivery actuals
            clicks: Math.floor(delivery.actualImpressions * (ctr || 0.01)),
            conversions: Math.floor(delivery.actualImpressions * (cvr || 0.001)),
            ctr: ctr || 0.01,
            cvr: cvr || 0.001,
            cpc: clicks > 0 ? totalCost / clicks : 0,
            cpa: conversions > 0 ? totalCost / conversions : 0,
            roas: totalCost > 0 ? revenue / totalCost : 0,
            status: 'ACTIVE'
        },
        buyingType,
        dealId,
        ioNumber,
        creative: creative as any, // Cast to any to match legacy type
        creatives: creatives,
        rotationMode: 'OPTIMIZED',
        status: 'ACTIVE' as const
    };
};

export function calculatePlanMetrics(lines: Line[]): PlanMetrics {
    // Use forecast if performance is 0 (Planning mode)
    const impressions = lines.reduce((sum, line) => sum + (line.performance?.impressions || line.forecast?.impressions || 0), 0);
    const totalCost = lines.reduce((sum, line) => sum + line.totalCost, 0);

    // Calculate data costs (segment cpmUplift) separately
    const totalDataCost = lines.reduce((sum, line) => {
        const lineImpressions = line.performance?.impressions || line.forecast?.impressions || 0;
        const segmentUplift = (line.segments || []).reduce((s, seg) => s + seg.cpmUplift, 0);
        return sum + (segmentUplift * lineImpressions / 1000);
    }, 0);

    // Inventory cost is total cost minus data costs
    const inventoryCost = totalCost - totalDataCost;

    // Mock calculations for reach/frequency since we don't have real audience data
    const reach = Math.floor(impressions * 0.4); // Assume 40% unique reach
    const frequency = reach > 0 ? impressions / reach : 0;

    // CPM calculations
    const eCpm = impressions > 0 ? (totalCost / impressions) * 1000 : 0; // Effective CPM (all-in)
    const cpm = impressions > 0 ? (inventoryCost / impressions) * 1000 : 0; // Inventory CPM (base)
    const dataCpm = impressions > 0 ? (totalDataCost / impressions) * 1000 : 0; // Data CPM

    return {
        impressions,
        reach,
        frequency,
        cpm,
        eCpm,
        dataCpm
    };
}

export function calculateFlightForecast(lines: Line[]): ForecastMetrics {
    return {
        impressions: lines.reduce((sum, line) => sum + (line.forecast?.impressions || 0), 0),
        spend: lines.reduce((sum, line) => sum + (line.forecast?.spend || 0), 0),
        reach: lines.reduce((sum, line) => sum + (line.forecast?.reach || 0), 0),
        frequency: lines.reduce((sum, line) => sum + (line.forecast?.impressions || 0), 0) / Math.max(1, lines.reduce((sum, line) => sum + (line.forecast?.reach || 0), 0)),
        source: 'Internal'
    };
}

export function calculateFlightDelivery(lines: Line[]): DeliveryMetrics {
    return {
        actualImpressions: lines.reduce((sum, line) => sum + (line.delivery?.actualImpressions || 0), 0),
        actualSpend: lines.reduce((sum, line) => sum + (line.delivery?.actualSpend || 0), 0),
        pacing: Math.round(lines.reduce((sum, line) => sum + (line.delivery?.pacing || 100), 0) / Math.max(1, lines.length)),
        status: 'ON_TRACK' // Simplified, could calculate based on pacing
    };
}

export function calculateCampaignForecast(flights: Flight[]): ForecastMetrics {
    return {
        impressions: flights.reduce((sum, flight) => sum + (flight.forecast?.impressions || 0), 0),
        spend: flights.reduce((sum, flight) => sum + (flight.forecast?.spend || 0), 0),
        reach: flights.reduce((sum, flight) => sum + (flight.forecast?.reach || 0), 0),
        frequency: flights.reduce((sum, flight) => sum + (flight.forecast?.impressions || 0), 0) / Math.max(1, flights.reduce((sum, flight) => sum + (flight.forecast?.reach || 0), 0)),
        source: 'Internal'
    };
}

export function calculateCampaignDelivery(flights: Flight[]): DeliveryMetrics {
    return {
        actualImpressions: flights.reduce((sum, flight) => sum + (flight.delivery?.actualImpressions || 0), 0),
        actualSpend: flights.reduce((sum, flight) => sum + (flight.delivery?.actualSpend || 0), 0),
        pacing: Math.round(flights.reduce((sum, flight) => sum + (flight.delivery?.pacing || 100), 0) / Math.max(1, flights.length)),
        status: 'ON_TRACK'
    };
}

export function generateFlight(campaignId: string, name: string, budget: number): Flight {
    const flightId = generateId();
    const lines: Line[] = [];
    let remainingBudget = budget;

    // Distribute budget across channels
    const channels: Array<'Search' | 'Social' | 'Display' | 'TV'> = ['Search', 'Social', 'Display', 'TV'];

    channels.forEach(channel => {
        if (remainingBudget <= 0) return;

        const allocation = Math.floor(budget * (0.2 + Math.random() * 0.1)); // ~20-30% per channel
        const line = generateLine(channel, 'Brand');
        // Adjust line cost to match allocation
        line.totalCost = allocation;
        line.quantity = Math.floor(allocation / line.rate);

        lines.push(line);
        remainingBudget -= allocation;
    });

    return {
        id: flightId,
        name,
        campaignId,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        budget,
        lines,
        status: 'ACTIVE',
        forecast: calculateFlightForecast(lines),
        delivery: calculateFlightDelivery(lines),
        tags: []
    };
}

export function generateCampaign(brand: Brand): Campaign {
    const campaignId = generateId();
    const budget = brand.budget ? brand.budget / 4 : 1000000; // Quarter budget

    // Generate 2 flights
    const flight1 = generateFlight(campaignId, 'Q1 Launch', budget * 0.4);
    const flight2 = generateFlight(campaignId, 'Q1 Sustain', budget * 0.6);

    const flights = [flight1, flight2];

    return {
        id: campaignId,
        name: `${brand.name} Q1 2025 Campaign`,
        brandId: brand.id,
        advertiser: brand.name,
        budget,
        startDate: flight1.startDate,
        endDate: flight2.endDate,
        goals: ['Brand Awareness', 'Sales'],
        numericGoals: {
            impressions: Math.floor(budget * 50), // Goal: 50 impressions per dollar
            reach: Math.floor(budget * 20), // Goal: 20 unique reach per dollar
            conversions: Math.floor(budget * 0.05) // Goal: 5 conversions per $100
        },
        flights,
        status: 'ACTIVE',
        forecast: calculateCampaignForecast(flights),
        delivery: calculateCampaignDelivery(flights),
        placements: [...flight1.lines, ...flight2.lines], // Legacy support
        tags: []
    };
}

// Generate full data set
export const MOCK_DATA = {
    brands: SAMPLE_BRANDS.map(brand => {
        // Campaign 1: Q1 2025 (Active)
        const campaign1 = generateCampaign(brand);

        // Campaign 2: Q4 2024 (Completed)
        const campaign2 = generateCampaign(brand);
        campaign2.id = generateId();
        campaign2.name = `${brand.name} Q4 2024 Campaign`;
        campaign2.startDate = '2024-10-01';
        campaign2.endDate = '2024-12-31';
        campaign2.status = 'COMPLETED';

        // Regenerate flights for Q4
        const flight1 = generateFlight(campaign2.id, 'Holiday Push', campaign2.budget * 0.5);
        flight1.startDate = '2024-11-15';
        flight1.endDate = '2024-12-25';
        flight1.status = 'COMPLETED';

        const flight2 = generateFlight(campaign2.id, 'End of Year Closeout', campaign2.budget * 0.3);
        flight2.startDate = '2024-12-26';
        flight2.endDate = '2024-12-31';
        flight2.status = 'COMPLETED';

        campaign2.flights = [flight1, flight2];
        campaign2.placements = [...flight1.lines, ...flight2.lines];

        return {
            ...brand,
            campaigns: [campaign1, campaign2]
        };
    })
};

// --- Attribution Data Generation ---

/**
 * Generate realistic conversion paths for attribution modeling
 * Creates data that shows meaningful differences between attribution models
 */
export function generateConversionPaths(campaign: Campaign, count: number = 50): ConversionPath[] {
    const paths: ConversionPath[] = [];

    // Map channels to ChannelType
    const channelTypeMap: Record<string, ChannelType> = {
        'Search': 'SEARCH',
        'Social': 'SOCIAL',
        'Display': 'DISPLAY',
        'TV': 'VIDEO',
        'Radio': 'AUDIO',
        'Streaming Audio': 'AUDIO',
        'Podcast': 'AUDIO',
        'Place-based Audio': 'AUDIO',
        'OOH': 'OOH',
        'Print': 'DISPLAY',
        // Fallback channels
        'Google Ads': 'SEARCH',
        'Meta': 'SOCIAL',
        'Google Display Network': 'DISPLAY',
        'CTV': 'VIDEO',
        'Email': 'EMAIL'
    };

    // Get all placements from campaign flights
    const allPlacements: Line[] = campaign.flights.flatMap(f => f.lines);

    // If no placements, generate realistic fallback data with common channel mix
    // This ensures attribution dashboard always has meaningful data to show
    const fallbackChannels = [
        { channel: 'Google Ads', vendor: 'Google Ads', channelType: 'SEARCH' as ChannelType, avgCost: 2.50 },
        { channel: 'Meta', vendor: 'Meta', channelType: 'SOCIAL' as ChannelType, avgCost: 1.80 },
        { channel: 'Google Display Network', vendor: 'Google Display Network', channelType: 'DISPLAY' as ChannelType, avgCost: 0.75 },
        { channel: 'CTV', vendor: 'CTV', channelType: 'VIDEO' as ChannelType, avgCost: 25.00 },
        { channel: 'Email', vendor: 'Email', channelType: 'EMAIL' as ChannelType, avgCost: 0.10 },
    ];

    const useFallback = allPlacements.length === 0;

    // Define realistic journey patterns that show model differences:
    // - AWARENESS_TO_CONVERSION: Display/Social -> Search -> Conversion (shows first-touch vs last-touch)
    // - MULTI_TOUCH_AWARENESS: CTV -> Display -> Social -> Search (shows linear value of middle touches)
    // - RETARGETING_HEAVY: Display -> Display -> Display -> Search (shows time-decay, recent touches)
    // - DIRECT_RESPONSE: Email -> Search -> Conversion (short, high-intent path)
    // - BRAND_JOURNEY: CTV -> Social -> Display -> Email -> Search (full funnel, position-based)
    const journeyPatterns = [
        { name: 'AWARENESS_TO_CONVERSION', channels: ['DISPLAY', 'SOCIAL', 'SEARCH'], weight: 25 },
        { name: 'MULTI_TOUCH_AWARENESS', channels: ['VIDEO', 'DISPLAY', 'SOCIAL', 'SEARCH'], weight: 20 },
        { name: 'RETARGETING_HEAVY', channels: ['DISPLAY', 'DISPLAY', 'DISPLAY', 'SEARCH'], weight: 15 },
        { name: 'DIRECT_RESPONSE', channels: ['EMAIL', 'SEARCH'], weight: 20 },
        { name: 'BRAND_JOURNEY', channels: ['VIDEO', 'SOCIAL', 'DISPLAY', 'EMAIL', 'SEARCH'], weight: 10 },
        { name: 'SOCIAL_FIRST', channels: ['SOCIAL', 'DISPLAY', 'SEARCH'], weight: 10 },
    ];

    // Helper to pick a channel source based on channel type
    const getChannelForType = (channelType: ChannelType): { channel: string; vendor: string; avgCost: number } => {
        if (useFallback) {
            const match = fallbackChannels.find(c => c.channelType === channelType);
            if (match) return { channel: match.channel, vendor: match.vendor, avgCost: match.avgCost };
            return fallbackChannels[0]; // Default fallback
        }

        // Find placements matching this channel type
        const matchingPlacements = allPlacements.filter(p => channelTypeMap[p.channel] === channelType);
        if (matchingPlacements.length > 0) {
            const placement = matchingPlacements[Math.floor(Math.random() * matchingPlacements.length)];
            return {
                channel: placement.vendor,
                vendor: placement.vendor,
                avgCost: placement.totalCost / (placement.quantity || 1)
            };
        }

        // Fallback to any placement if no match
        const placement = allPlacements[Math.floor(Math.random() * allPlacements.length)];
        return {
            channel: placement.vendor,
            vendor: placement.vendor,
            avgCost: placement.totalCost / (placement.quantity || 1)
        };
    };

    // Select a journey pattern based on weights
    const selectPattern = (): typeof journeyPatterns[0] => {
        const totalWeight = journeyPatterns.reduce((sum, p) => sum + p.weight, 0);
        let random = Math.random() * totalWeight;
        for (const pattern of journeyPatterns) {
            random -= pattern.weight;
            if (random <= 0) return pattern;
        }
        return journeyPatterns[0];
    };

    for (let i = 0; i < count; i++) {
        const pathId = generateId();
        const userId = `user_${generateId()}`;

        // Select a journey pattern
        const pattern = selectPattern();
        const patternChannels = [...pattern.channels];

        // Sometimes add extra touchpoints of same channel (for retargeting feel)
        if (Math.random() < 0.3 && patternChannels.length < 6) {
            const insertIdx = Math.floor(Math.random() * (patternChannels.length - 1)) + 1;
            patternChannels.splice(insertIdx, 0, patternChannels[insertIdx - 1]);
        }

        const numTouchpoints = patternChannels.length;
        const touchpoints: Touchpoint[] = [];
        const now = new Date();

        // Time to conversion varies by journey type
        // - Direct response: 1-3 days
        // - Awareness journeys: 7-30 days
        let timeToConversionHours: number;
        if (pattern.name === 'DIRECT_RESPONSE') {
            timeToConversionHours = 24 + Math.random() * (2 * 24); // 1-3 days
        } else if (pattern.name === 'BRAND_JOURNEY') {
            timeToConversionHours = 7 * 24 + Math.random() * (23 * 24); // 7-30 days
        } else {
            timeToConversionHours = 3 * 24 + Math.random() * (14 * 24); // 3-17 days
        }

        const conversionDate = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date in past 30 days
        const pathStartTime = conversionDate.getTime() - timeToConversionHours * 60 * 60 * 1000;

        // Distribute touchpoints across the time window
        const timePerTouch = timeToConversionHours / numTouchpoints;

        for (let t = 0; t < numTouchpoints; t++) {
            const channelType = patternChannels[t] as ChannelType;
            const channelInfo = getChannelForType(channelType);

            // Time for this touchpoint (with some randomness)
            const baseTime = pathStartTime + t * timePerTouch * 60 * 60 * 1000;
            const jitter = (Math.random() - 0.5) * timePerTouch * 0.5 * 60 * 60 * 1000;
            const touchTime = baseTime + jitter;

            // Cost varies by channel type
            let touchpointCost = channelInfo.avgCost * (0.5 + Math.random());
            // Video/CTV tends to be more expensive
            if (channelType === 'VIDEO') touchpointCost *= 2;
            // Email is very cheap
            if (channelType === 'EMAIL') touchpointCost *= 0.1;

            // Determine interaction type (Click vs View)
            let isClick = false;
            if (channelType === 'SEARCH' || channelType === 'EMAIL' || channelType === 'SOCIAL') {
                isClick = Math.random() < 0.8; // 80% chance of click
            } else if (channelType === 'AUDIO' || channelType === 'DISPLAY') {
                isClick = Math.random() < 0.2; // 20% chance of click
            } else {
                isClick = Math.random() < 0.05; // 5% chance of click (TV, OOH)
            }

            touchpoints.push({
                id: generateId(),
                channel: channelInfo.channel,
                channelType: channelType,
                interactionType: isClick ? 'CLICK' : 'VIEW',
                campaignId: campaign.id,
                campaignName: campaign.name,
                timestamp: new Date(touchTime).toISOString(),
                cost: Math.round(touchpointCost * 100) / 100
            });
        }

        // Sort touchpoints by timestamp to ensure chronological order
        touchpoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Conversion value varies by journey complexity
        // - Longer journeys tend to have higher value (more considered purchases)
        const baseValue = 50 + Math.random() * 200;
        const journeyMultiplier = 1 + (numTouchpoints - 2) * 0.2; // +20% per extra touchpoint
        const conversionValue = baseValue * journeyMultiplier;

        paths.push({
            id: pathId,
            userId,
            touchpoints,
            conversionValue: Math.round(conversionValue * 100) / 100,
            conversionDate: conversionDate.toISOString(),
            timeToConversion: timeToConversionHours
        });
    }

    return paths;
}

/**
 * Generate attribution data for all campaigns in a brand
 */
export function generateBrandAttributionData(brand: Brand): Map<string, ConversionPath[]> {
    const attributionData = new Map<string, ConversionPath[]>();

    brand.campaigns.forEach(campaign => {
        // Generate 30-80 paths per campaign (based on campaign size)
        const pathCount = 30 + Math.floor(Math.random() * 50);
        const paths = generateConversionPaths(campaign, pathCount);
        attributionData.set(campaign.id, paths);
    });

    return attributionData;
}
