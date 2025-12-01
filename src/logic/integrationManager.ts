import { Integration, IntegrationStatus } from '../types';

export const AVAILABLE_INTEGRATIONS: Integration[] = [
    {
        id: 'adroll-dsp',
        name: 'AdRoll DSP',
        provider: 'NextRoll',
        type: 'DSP',
        status: 'DISCONNECTED',
        icon: '/logos/adroll.svg',
        description: 'Unified programmatic advertising for D2C brands.'
    },
    {
        id: 'adroll-abm',
        name: 'AdRoll ABM',
        provider: 'NextRoll',
        type: 'DSP',
        status: 'DISCONNECTED',
        icon: '/logos/adroll.svg',
        description: 'Account-Based Marketing and targeting.'
    },
    {
        id: 'ttd',
        name: 'The Trade Desk',
        provider: 'The Trade Desk',
        type: 'DSP',
        status: 'DISCONNECTED',
        icon: '/logos/thetradedesk.svg',
        description: 'Push flights directly to TTD for programmatic execution.'
    },
    {
        id: 'amazon-ads',
        name: 'Amazon Ads',
        provider: 'Amazon',
        type: 'DSP',
        status: 'DISCONNECTED',
        icon: '/logos/amazon-ads.png',
        description: 'Reach audiences across Amazon properties and devices.'
    },
    {
        id: 'infosum',
        name: 'InfoSum',
        provider: 'InfoSum',
        type: 'DMP',
        status: 'DISCONNECTED',
        icon: '/logos/infosum.svg',
        description: 'Secure data collaboration and identity resolution.'
    },
    {
        id: 'snowflake',
        name: 'Snowflake',
        provider: 'Snowflake',
        type: 'DMP',
        status: 'DISCONNECTED',
        icon: '/logos/snowflake.svg',
        description: 'Cloud data platform for audience activation.'
    },
    {
        id: 'dv360',
        name: 'Display & Video 360',
        provider: 'Google',
        type: 'DSP',
        status: 'DISCONNECTED',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1200px-Google_2015_logo.svg.png',
        description: 'Export campaigns to Google DV360.'
    },
    {
        id: 'liveramp',
        name: 'LiveRamp',
        provider: 'LiveRamp',
        type: 'DMP',
        status: 'DISCONNECTED',
        icon: '/logos/liveramp.svg',
        description: 'Import first-party audience segments.'
    },
    {
        id: 'ga4',
        name: 'Google Analytics 4',
        provider: 'Google',
        type: 'ANALYTICS',
        status: 'DISCONNECTED',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Google_2015_logo.svg/1200px-Google_2015_logo.svg.png',
        description: 'Sync conversion data and site metrics.'
    },
    {
        id: 'adobe-analytics',
        name: 'Adobe Analytics',
        provider: 'Adobe',
        type: 'ANALYTICS',
        status: 'DISCONNECTED',
        icon: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Adobe_Systems_logo_and_wordmark.svg/1200px-Adobe_Systems_logo_and_wordmark.svg.png',
        description: 'Enterprise analytics and attribution reporting.'
    }
];

export const connectIntegration = async (id: string): Promise<Integration> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const integration = AVAILABLE_INTEGRATIONS.find(i => i.id === id);
    if (!integration) throw new Error('Integration not found');

    return {
        ...integration,
        status: 'CONNECTED',
        connectedSince: new Date().toISOString(),
        lastSync: new Date().toISOString()
    };
};

export const disconnectIntegration = async (id: string): Promise<Integration> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const integration = AVAILABLE_INTEGRATIONS.find(i => i.id === id);
    if (!integration) throw new Error('Integration not found');

    return {
        ...integration,
        status: 'DISCONNECTED',
        connectedSince: undefined,
        lastSync: undefined
    };
};

export const syncIntegration = async (id: string): Promise<Integration> => {
    // Simulate sync delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const integration = AVAILABLE_INTEGRATIONS.find(i => i.id === id);
    if (!integration) throw new Error('Integration not found');

    return {
        ...integration,
        status: 'CONNECTED',
        lastSync: new Date().toISOString()
    };
};
