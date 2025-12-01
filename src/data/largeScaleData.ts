import { Brand, Campaign, Flight, Line, EntityStatus } from '../types';

const CAMPAIGN_STATUSES: EntityStatus[] = ['ACTIVE', 'PAUSED', 'DRAFT', 'COMPLETED', 'ARCHIVED'];
const TAGS = ['Q1', 'Q2', 'Q3', 'Q4', 'Holiday', 'Back to School', 'Brand Awareness', 'Performance', 'Retargeting', 'Experimental'];
const CHANNELS = ['Search', 'Social', 'Display', 'TV', 'Radio', 'OOH', 'Print'] as const;

const generateId = () => Math.random().toString(36).substring(2, 9);

const getRandomItem = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

const generateDateRange = (year: number) => {
    const startMonth = getRandomInt(0, 11);
    const endMonth = getRandomInt(startMonth, 11);
    const startDate = new Date(year, startMonth, 1).toISOString().split('T')[0];
    const endDate = new Date(year, endMonth, 28).toISOString().split('T')[0];
    return { startDate, endDate };
};

const generateLineItems = (count: number, flightBudget: number): Line[] => {
    const lines: Line[] = [];
    for (let i = 0; i < count; i++) {
        const budget = flightBudget / count;
        lines.push({
            id: generateId(),
            name: `${getRandomItem(CHANNELS)} Placement ${i + 1}`,
            channel: getRandomItem(CHANNELS),
            status: 'ACTIVE',
            vendor: 'Vendor X',
            adUnit: 'Standard',
            rate: 10,
            costMethod: 'CPM',
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            quantity: budget / 10,
            totalCost: budget,
            buyingType: 'Auction'
        });
    }
    return lines;
};

const generateFlights = (campaignId: string, count: number, campaignBudget: number): Flight[] => {
    const flights: Flight[] = [];
    for (let i = 0; i < count; i++) {
        const budget = campaignBudget / count;
        flights.push({
            id: generateId(),
            name: `Flight ${i + 1} - ${getRandomItem(['Awareness', 'Consideration', 'Conversion'])}`,
            campaignId,
            startDate: '2025-01-01',
            endDate: '2025-12-31',
            budget,
            status: getRandomItem(CAMPAIGN_STATUSES),
            tags: [getRandomItem(TAGS), getRandomItem(TAGS)],
            lines: generateLineItems(getRandomInt(3, 8), budget)
        });
    }
    return flights;
};

export const generateLargeScaleData = (): Brand[] => {
    const brands: Brand[] = [];
    const brandNames = ['Coca Cola', 'Nike', 'Apple', 'Samsung', 'Toyota'];

    brandNames.forEach(name => {
        const campaigns: Campaign[] = [];
        // Generate 100 campaigns per brand
        for (let i = 0; i < 100; i++) {
            const year = getRandomInt(2023, 2026);
            const { startDate, endDate } = generateDateRange(year);
            const budget = getRandomInt(50000, 5000000);
            const status = getRandomItem(CAMPAIGN_STATUSES);
            const id = generateId();

            campaigns.push({
                id,
                name: `${name} ${year} Campaign ${i + 1}`,
                brandId: name.toLowerCase().replace(' ', '_'),
                advertiser: name,
                budget,
                startDate,
                endDate,
                status,
                tags: [getRandomItem(TAGS), getRandomItem(TAGS)],
                goals: ['Brand Awareness'],
                flights: generateFlights(id, getRandomInt(2, 5), budget)
            });
        }

        brands.push({
            id: name.toLowerCase().replace(' ', '_'),
            name,
            logoUrl: `https://ui-avatars.com/api/?name=${name}&background=random`,
            agencyId: 'agency_1',
            totalSpend: campaigns.reduce((sum, c) => sum + c.budget, 0),
            activeCampaigns: campaigns.filter(c => c.status === 'ACTIVE').length,
            campaigns
        });
    });

    return brands;
};
