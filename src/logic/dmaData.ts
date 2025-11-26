export interface Station {
    callSign: string;
    network: 'ABC' | 'CBS' | 'NBC' | 'FOX' | 'CW' | 'PBS' | 'Telemundo' | 'Univision' | 'Independent';
    channel: string;
    owner?: string;
}

export interface DMA {
    rank: number;
    name: string;
    stations: Station[];
}

export const DMA_DATA: Record<string, DMA> = {
    'new york': {
        rank: 1,
        name: 'New York',
        stations: [
            { callSign: 'WABC', network: 'ABC', channel: '7', owner: 'Disney' },
            { callSign: 'WCBS', network: 'CBS', channel: '2', owner: 'CBS' },
            { callSign: 'WNBC', network: 'NBC', channel: '4', owner: 'NBC' },
            { callSign: 'WNYW', network: 'FOX', channel: '5', owner: 'Fox' },
            { callSign: 'WPIX', network: 'CW', channel: '11', owner: 'Mission' },
            { callSign: 'WNET', network: 'PBS', channel: '13', owner: 'WNET' }
        ]
    },
    'los angeles': {
        rank: 2,
        name: 'Los Angeles',
        stations: [
            { callSign: 'KABC', network: 'ABC', channel: '7', owner: 'Disney' },
            { callSign: 'KCBS', network: 'CBS', channel: '2', owner: 'CBS' },
            { callSign: 'KNBC', network: 'NBC', channel: '4', owner: 'NBC' },
            { callSign: 'KTTV', network: 'FOX', channel: '11', owner: 'Fox' },
            { callSign: 'KTLA', network: 'CW', channel: '5', owner: 'Nexstar' }
        ]
    },
    'chicago': {
        rank: 3,
        name: 'Chicago',
        stations: [
            { callSign: 'WLS', network: 'ABC', channel: '7', owner: 'Disney' },
            { callSign: 'WBBM', network: 'CBS', channel: '2', owner: 'CBS' },
            { callSign: 'WMAQ', network: 'NBC', channel: '5', owner: 'NBC' },
            { callSign: 'WFLD', network: 'FOX', channel: '32', owner: 'Fox' },
            { callSign: 'WGN', network: 'Independent', channel: '9', owner: 'Nexstar' }
        ]
    },
    'philadelphia': {
        rank: 4,
        name: 'Philadelphia',
        stations: [
            { callSign: 'WPVI', network: 'ABC', channel: '6', owner: 'Disney' },
            { callSign: 'KYW', network: 'CBS', channel: '3', owner: 'CBS' },
            { callSign: 'WCAU', network: 'NBC', channel: '10', owner: 'NBC' },
            { callSign: 'WTXF', network: 'FOX', channel: '29', owner: 'Fox' }
        ]
    },
    'dallas': {
        rank: 5,
        name: 'Dallas-Ft. Worth',
        stations: [
            { callSign: 'WFAA', network: 'ABC', channel: '8', owner: 'Tegna' },
            { callSign: 'KTVT', network: 'CBS', channel: '11', owner: 'CBS' },
            { callSign: 'KXAS', network: 'NBC', channel: '5', owner: 'NBC' },
            { callSign: 'KDFW', network: 'FOX', channel: '4', owner: 'Fox' }
        ]
    },
    'des moines': {
        rank: 68,
        name: 'Des Moines-Ames',
        stations: [
            { callSign: 'WOI', network: 'ABC', channel: '5', owner: 'Tegna' },
            { callSign: 'KCCI', network: 'CBS', channel: '8', owner: 'Hearst' },
            { callSign: 'WHO', network: 'NBC', channel: '13', owner: 'Nexstar' },
            { callSign: 'KDSM', network: 'FOX', channel: '17', owner: 'Sinclair' },
            { callSign: 'KCWI', network: 'CW', channel: '23', owner: 'Tegna' }
        ]
    },
    'atlanta': {
        rank: 6,
        name: 'Atlanta',
        stations: [
            { callSign: 'WSB', network: 'ABC', channel: '2', owner: 'Cox' },
            { callSign: 'WANF', network: 'CBS', channel: '46', owner: 'Gray' },
            { callSign: 'WXIA', network: 'NBC', channel: '11', owner: 'Tegna' },
            { callSign: 'WAGA', network: 'FOX', channel: '5', owner: 'Fox' }
        ]
    },
    'houston': {
        rank: 7,
        name: 'Houston',
        stations: [
            { callSign: 'KTRK', network: 'ABC', channel: '13', owner: 'Disney' },
            { callSign: 'KHOU', network: 'CBS', channel: '11', owner: 'Tegna' },
            { callSign: 'KPRC', network: 'NBC', channel: '2', owner: 'Graham' },
            { callSign: 'KRIV', network: 'FOX', channel: '26', owner: 'Fox' }
        ]
    }
};

export const getDMAByCity = (query: string): DMA | null => {
    const lowerQuery = query.toLowerCase();
    // Direct match
    if (DMA_DATA[lowerQuery]) return DMA_DATA[lowerQuery];

    // Partial match
    const found = Object.keys(DMA_DATA).find(key => lowerQuery.includes(key));
    if (found) return DMA_DATA[found];

    // Common abbreviations
    if (lowerQuery.includes('nyc') || lowerQuery.includes('new york')) return DMA_DATA['new york'];
    if (lowerQuery.includes('la ') || lowerQuery === 'la') return DMA_DATA['los angeles'];
    if (lowerQuery.includes('chi ')) return DMA_DATA['chicago'];
    if (lowerQuery.includes('philly')) return DMA_DATA['philadelphia'];
    if (lowerQuery.includes('dfw')) return DMA_DATA['dallas'];
    if (lowerQuery.includes('atl')) return DMA_DATA['atlanta'];

    return null;
};
