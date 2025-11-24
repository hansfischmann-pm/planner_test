import { Campaign, Placement, CostMethod } from '../types';

const VENDORS = {
    Search: ['Google Ads', 'Bing Ads'],
    Social: ['Facebook', 'Instagram', 'TikTok', 'LinkedIn'],
    Display: ['Google Display Network', 'Trade Desk', 'Criteo'],
    TV: ['NBC', 'ABC', 'Hulu', 'Roku'],
    Radio: ['Spotify', 'Pandora', 'iHeartRadio'],
    OOH: ['Clear Channel', 'Outfront'],
    Print: ['NY Times', 'WSJ', 'Local Daily']
};

const AD_UNITS = {
    Search: ['Keywords', 'Shopping'],
    Social: ['Sponsored Post', 'Story', 'Reel'],
    Display: ['300x250', '728x90', '160x600'],
    TV: ['15s Spot', '30s Spot'],
    Radio: ['30s Audio'],
    OOH: ['Billboard', 'Digital Screen'],
    Print: ['Full Page', 'Half Page']
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const createDummyCampaign = (advertiser: string, budget: number): Campaign => {
    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 90 days out

    return {
        id: generateId(),
        name: `${advertiser} Q${Math.floor((new Date().getMonth() + 3) / 3)} Campaign`,
        advertiser,
        budget,
        startDate,
        endDate,
        goals: ['Brand Awareness', 'Conversions'],
        placements: []
    };
};

export const generatePlacement = (campaignId: string, channel: keyof typeof VENDORS): Placement => {
    const vendor = VENDORS[channel][Math.floor(Math.random() * VENDORS[channel].length)];
    const adUnit = AD_UNITS[channel][Math.floor(Math.random() * AD_UNITS[channel].length)];

    let costMethod: CostMethod = 'CPM';
    let rate = 10;
    let quantity = 100000;

    switch (channel) {
        case 'Search':
            costMethod = 'CPC';
            rate = 2.50;
            quantity = 5000;
            break;
        case 'TV':
            costMethod = 'Spot';
            rate = 5000;
            quantity = 20;
            break;
        case 'Social':
            costMethod = 'CPM';
            rate = 15;
            quantity = 50000;
            break;
        case 'Display':
            costMethod = 'CPM';
            rate = 5;
            quantity = 200000;
            break;
    }

    const totalCost = costMethod === 'CPM' ? (rate * quantity) / 1000 : rate * quantity;

    return {
        id: generateId(),
        name: `${vendor} - ${adUnit}`,
        channel,
        vendor,
        adUnit,
        rate,
        costMethod,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        quantity,
        totalCost
    };
};
