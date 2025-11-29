import { Campaign, Line, CostMethod, Brand, User, Flight, MediaPlan, AgentInfo, AgentExecution, PlanMetrics, ForecastMetrics, DeliveryMetrics, ForecastSource, Creative } from '../types';

export const generateId = () => Math.random().toString(36).substr(2, 9);

// --- Constants & Reference Data ---

const VENDORS: Record<string, string[]> = {
    Search: ['Google Ads', 'Microsoft Ads', 'Amazon Ads'],
    Social: ['Meta', 'TikTok', 'LinkedIn', 'Snapchat', 'Pinterest', 'X (Twitter)'],
    Display: ['Google Display Network', 'Taboola', 'Outbrain', 'Criteo', 'The Trade Desk'],
    TV: ['Linear TV', 'CTV'],
    Radio: ['iHeartRadio', 'Spotify Audio Ads', 'Pandora', 'SiriusXM'],
    OOH: ['Clear Channel', 'Lamar', 'Outfront Media', 'JCDecaux'],
    Print: ['The New York Times', 'WSJ', 'USA Today', 'Local Newspapers']
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

const generateForecast = (channel: string, vendor: string, budget: number): { forecast: ForecastMetrics, delivery: DeliveryMetrics } => {
    // 1. Determine Source
    let source: ForecastSource = 'Internal';
    if (channel === 'TV') source = 'Nielsen';
    else if (channel === 'Radio') source = 'Arbitron';
    else if (channel === 'OOH') source = 'Geopath';
    else if (channel === 'Display' || channel === 'TV') source = 'Comscore'; // CTV often Comscore
    else if (channel === 'Search' || channel === 'Social') source = 'Internal'; // Platform data

    // 2. Generate Forecast Metrics (Simulated)
    // CPM assumptions for forecasting
    let estimatedCpm = 15;
    if (channel === 'TV') estimatedCpm = 25;
    if (channel === 'Social') estimatedCpm = 8;
    if (channel === 'Search') estimatedCpm = 5;
    if (channel === 'OOH') estimatedCpm = 12;

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

export function generateLine(channel: 'Search' | 'Social' | 'Display' | 'TV' | 'Radio' | 'OOH' | 'Print', advertiser: string, networkName?: string, programName?: string): Line {
    const vendors = VENDORS;

    const adUnits = {
        'Search': ['Responsive Search Ad', 'Exact Match Keyword', 'Shopping Ad'],
        'Social': ['Newsfeed Image', 'Story Video', 'Carousel', 'Reels'],
        'Display': ['300x250', '728x90', '160x600', 'Native'],
        'TV': [':30 Spot', ':15 Spot', 'Sponsorship'],
        'Radio': ['Audio Spot :30', 'Host Read'],
        'OOH': ['Digital Billboard', 'Transit Shelter', 'Highway Bulletin'],
        'Print': ['Full Page Color', 'Half Page', 'Quarter Page']
    };

    const segments = {
        'Search': ['High Intent', 'Brand Keywords', 'Competitor Conquesting'],
        'Social': ['A18-34', 'Parents', 'Interest: Tech', 'Lookalike 1%'],
        'Display': ['Retargeting', 'In-Market Auto', 'Affinity: Luxury'],
        'TV': ['Broad Reach', 'Sports Fans', 'Morning News'],
        'Radio': ['Commuters', 'Music Lovers'],
        'OOH': ['Urban Centers', 'Highway Traffic'],
        'Print': ['Affluent Readers', 'Local Community']
    };

    const rateInfo = {
        'Search': { method: 'CPC' as const, min: 0.5, max: 12 },
        'Social': { method: 'CPM' as const, min: 3, max: 20 },
        'Display': { method: 'CPM' as const, min: 1, max: 8 },
        'TV': { method: 'Spot' as const, min: 500, max: 50000 },
        'Radio': { method: 'Spot' as const, min: 50, max: 2000 },
        'OOH': { method: 'Flat' as const, min: 1000, max: 25000 },
        'Print': { method: 'Flat' as const, min: 500, max: 10000 }
    };

    const vendorList = vendors[channel];
    const unitList = adUnits[channel];
    const segmentList = segments[channel];
    const rateInfo2 = rateInfo[channel];

    let vendor: string = vendorList[0];
    let adUnit: string = unitList[0];

    // TV Logic (simplified from original for brevity, but keeping core logic)
    if (channel === 'TV' && (networkName || programName)) {
        // Logic to match network/program
        if (networkName) vendor = networkName;
        if (programName) adUnit = programName;

        // Try to find specific network data if available
        if (networkName && TV_NETWORKS.Linear[networkName]) {
            // Could use this to validate or refine adUnits
        }
    } else {
        vendor = vendorList[Math.floor(Math.random() * vendorList.length)];
        adUnit = unitList[Math.floor(Math.random() * unitList.length)];
    }

    const segment = segmentList[Math.floor(Math.random() * segmentList.length)];
    const rate = Math.floor(Math.random() * (rateInfo2.max - rateInfo2.min + 1)) + rateInfo2.min;

    // Generate Performance Data
    const quantity = Math.floor(Math.random() * 1000) + 100;
    const totalCost = rate * quantity;
    const ctr = Math.random() * 0.05;

    const costMethod = rateInfo2.method;

    // Estimate impressions based on cost method
    let impressions: number;

    if (channel === 'TV') {
        // TV impressions based on ratings/viewership
        // Using realistic Nielsen-style ratings
        // :30 spot during primetime: 2-10M viewers
        // :30 spot during daytime: 500K-2M viewers
        // Sports/major events: 5-20M viewers
        const isPrimetime = adUnit.includes(':30') || adUnit.includes('Sponsorship');
        const isSports = segment?.includes('Sports') || programName?.toLowerCase().includes('sport');

        if (isSports) {
            impressions = (5000000 + Math.random() * 15000000) * quantity; // 5M-20M per spot
        } else if (isPrimetime) {
            impressions = (2000000 + Math.random() * 8000000) * quantity; // 2M-10M per spot
        } else {
            impressions = (500000 + Math.random() * 1500000) * quantity; // 500K-2M per spot
        }
    } else if (costMethod === 'CPM') {
        impressions = quantity * 1000;
    } else if (costMethod === 'CPC') {
        impressions = quantity / ctr; // if quantity is clicks
    } else {
        impressions = (totalCost / (rate / 1000)); // fallback estimation
    }

    const clicks = Math.floor(impressions * ctr);
    const cvr = 0.001 + Math.random() * 0.05;
    const conversions = Math.floor(impressions * cvr);
    const revenue = conversions * (50 + Math.random() * 100);

    const performance = {
        impressions: Math.floor(impressions),
        clicks,
        conversions,
        ctr,
        cvr,
        cpc: clicks > 0 ? totalCost / clicks : 0,
        cpa: conversions > 0 ? totalCost / conversions : 0,
        roas: totalCost > 0 ? revenue / totalCost : 0,
        status: 'ACTIVE' as const
    };

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
        rotationMode: 'OPTIMIZED'
    };
};

export function calculatePlanMetrics(lines: Line[]): PlanMetrics {
    // Use forecast if performance is 0 (Planning mode)
    const impressions = lines.reduce((sum, line) => sum + (line.performance?.impressions || line.forecast?.impressions || 0), 0);
    const totalCost = lines.reduce((sum, line) => sum + line.totalCost, 0);

    // Mock calculations for reach/frequency since we don't have real audience data
    const reach = Math.floor(impressions * 0.4); // Assume 40% unique reach
    const frequency = reach > 0 ? impressions / reach : 0;
    const cpm = impressions > 0 ? (totalCost / impressions) * 1000 : 0;

    return {
        impressions,
        reach,
        frequency,
        cpm
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
        delivery: calculateFlightDelivery(lines)
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
        placements: [...flight1.lines, ...flight2.lines] // Legacy support
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
