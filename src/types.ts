export type CostMethod = 'CPM' | 'CPC' | 'Flat' | 'Spot';

export interface KPI {
    label: string;
    value: number;
    unit: string;
}

export interface Placement {
    id: string;
    name: string;
    channel: 'Search' | 'Social' | 'Display' | 'TV' | 'Radio' | 'OOH' | 'Print';
    vendor: string;
    adUnit: string;
    rate: number;
    costMethod: CostMethod;
    startDate: string;
    endDate: string;
    quantity: number;
    totalCost: number;
}

export interface Campaign {
    id: string;
    name: string;
    advertiser: string;
    budget: number;
    startDate: string;
    endDate: string;
    goals: string[];
    placements: Placement[];
}

export interface MediaPlan {
    campaign: Campaign;
    totalSpend: number;
    remainingBudget: number;
    version: number;
}

export interface AgentMessage {
    id: string;
    role: 'agent' | 'user';
    content: string;
    timestamp: number;
    suggestedActions?: string[];
    action?: 'EXPORT_PDF';
}
