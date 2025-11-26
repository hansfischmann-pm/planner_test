export type UserType = 'AGENCY' | 'BRAND';

export interface User {
    id: string;
    name: string;
    email: string;
    type: UserType;
    agencyId?: string;
    brandId?: string;
    avatarUrl?: string;
}

export interface Brand {
    id: string;
    name: string;
    logoUrl: string;
    agencyId: string;
    totalSpend?: number;
    budget?: number;
    activeCampaigns?: number;
}

export interface Flight {
    id: string;
    name: string;
    campaignId: string;
    startDate: string;
    endDate: string;
    budget: number;
    lines: Line[];
    status: 'DRAFT' | 'ACTIVE' | 'COMPLETED';
}

export interface PlanMetrics {
    impressions: number;
    reach: number;
    frequency: number;
    cpm: number;
}

export interface AgentInfo {
    id: string;
    name: string;
    role: string;
    capabilities: string[];
    status: 'IDLE' | 'WORKING' | 'WAITING';
    color: string;
}

export interface AgentExecution {
    id: string;
    agentId: string;
    action: string;
    status: 'PENDING' | 'SUCCESS' | 'FAILURE';
    timestamp: number;
    details?: string;
}

export interface ExecutiveSummary {
    id: string;
    planId: string;
    generatedAt: number;
    sections: {
        metrics: PlanMetrics;
        findings: string[];
        recommendations: string[];
        impact: string;
        risk: string;
        nextSteps: string[];
    };
    contributionTags: string[];
}

export type LayoutPosition = 'LEFT' | 'RIGHT' | 'BOTTOM';

export interface MediaPlan {
    id: string;
    campaign: Campaign;
    activeFlightId?: string; // ID of the currently viewed flight
    totalSpend: number;
    remainingBudget: number;
    version: number;
    groupingMode?: 'CHANNEL_SUMMARY' | 'DETAILED';
    strategy?: 'BALANCED' | 'DIGITAL' | 'AWARENESS';

    // New fields for Phase 1
    metrics?: PlanMetrics;
    notes?: string;
    layout?: LayoutPosition;
    agentExecutions?: AgentExecution[];
    executiveSummary?: ExecutiveSummary;
}

export interface Campaign {
    id: string;
    name: string;
    brandId: string;
    advertiser: string; // Brand name
    budget: number;
    startDate: string;
    endDate: string;
    goals: string[];
    flights: Flight[];
    status: 'PLANNING' | 'ACTIVE' | 'COMPLETED';
    // Legacy support (optional, or computed)
    placements?: Line[];
}

export type CostMethod = 'CPM' | 'CPC' | 'Flat' | 'Spot';

// Renamed from Placement to Line, keeping alias for backward compatibility
export interface Line {
    id: string;
    name: string;
    channel: 'Search' | 'Social' | 'Display' | 'TV' | 'Radio' | 'OOH' | 'Print';
    vendor: string;
    adUnit: string;
    segment?: string;
    rate: number;
    costMethod: CostMethod;
    startDate: string;
    endDate: string;
    quantity: number;
    totalCost: number;
    performance?: PerformanceMetrics;
    buyingType?: 'Auction' | 'PMP' | 'Direct';
    dealId?: string;
    ioNumber?: string;
    creative?: CreativeAsset;
}

export type Placement = Line; // Alias for backward compatibility

export interface PerformanceMetrics {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cvr: number;
    cpc: number;
    cpa: number;
    roas: number;
    status: 'ACTIVE' | 'PAUSED';
}

export interface CreativeAsset {
    id: string;
    name: string;
    type: 'image' | 'video';
    url: string;
}

export interface AgentMessage {
    id: string;
    role: 'user' | 'agent';
    content: string;
    timestamp: number;
    suggestedActions?: string[];
    action?: 'EXPORT_PDF' | 'EXPORT_PPT' | string; // Allow other action types
    agentsInvoked?: string[]; // Names of agents being used for this action
}
