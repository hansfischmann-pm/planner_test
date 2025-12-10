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
    campaigns: Campaign[];

    // Enhanced fields
    industry?: string;
    tier?: 'Enterprise' | 'Mid-Market' | 'SMB';
    status?: 'Active' | 'Inactive' | 'Onboarding';
    accountManager?: string;
    lastActivity?: string;
    monthlySpend?: number;
    campaignCount?: number;
    lifetimeValue?: number;
}

export type EntityStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';

export interface Creative {
    id: string;
    name: string;
    type: 'IMAGE' | 'VIDEO' | 'HTML5';
    url: string;
    dimensions: string; // e.g. "300x250"
    metrics?: {
        ctr: number;
        conversions: number;
    };
}

export type Channel = 'Search' | 'Social' | 'Display' | 'TV' | 'Radio' | 'OOH';

export interface Segment {
    id: string;
    name: string;
    category: 'Demographics' | 'Behavioral' | 'Interest' | 'B2B' | 'Contextual' | 'First-Party' | 'Pixel-Based' | 'Custom';
    vendor?: string; // Data provider (e.g., Adobe Audience Manager, Lotame, etc.)
    reach?: number; // Estimated audience size
    cpmUplift: number; // Additional cost per thousand impressions  
    description?: string;
}


export interface Flight {
    id: string;
    name: string;
    campaignId: string;
    startDate: string;
    endDate: string;
    budget: number;
    status: EntityStatus;
    tags: string[];
    lines: Line[];
    forecast?: ForecastMetrics;
    delivery?: DeliveryMetrics;
    performance?: {
        spend: number;
        impressions: number;
        clicks: number;
        conversions: number;
        ctr: number;
        cvr: number;
        cpa: number;
        roas: number;
        revenue: number;
    };
}

export interface PlanMetrics {
    impressions: number;
    reach: number;
    frequency: number;
    cpm: number; // Inventory CPM (base rate without data costs)
    eCpm: number; // Effective CPM (includes data/segment costs)
    dataCpm: number; // Data costs portion of CPM
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
    groupingMode?: 'DETAILED' | 'CHANNEL_SUMMARY' | 'VENDOR' | 'SEGMENT' | 'STATUS' | 'FLIGHT' | 'OBJECTIVE' | 'DEVICE' | 'GEO';
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
    goals: string[]; // Text descriptions like "Brand Awareness"
    numericGoals?: { // Numeric goal targets
        impressions?: number;
        reach?: number;
        conversions?: number;
        clicks?: number;
    };
    performance?: {
        spend: number;
        impressions: number;
        clicks: number;
        conversions: number;
        ctr: number;
        cvr: number;
        cpa: number;
        roas: number;
        revenue: number;
        status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
    };
    flights: Flight[];
    status: EntityStatus;
    tags: string[];
    forecast?: ForecastMetrics;
    delivery?: DeliveryMetrics;
    // Legacy support (optional, or computed)
    placements?: Line[];
    // Template tracking
    templateId?: string;
    customizations?: string[]; // List of what was changed from the template
}

export type IntegrationType = 'DSP' | 'DMP' | 'ANALYTICS' | 'CONTEXTUAL' | 'IDENTITY';
export type IntegrationStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'SYNCING';

export interface Integration {
    id: string;
    name: string;
    provider: string;
    type: IntegrationType;
    status: IntegrationStatus;
    icon: string; // Emoji or URL
    lastSync?: string;
    connectedSince?: string;
    description: string;
}
// Campaign Template Types
export type TemplateCategory = 'retail' | 'b2b' | 'brand' | 'performance' | 'seasonal';
export type TemplateComplexity = 'simple' | 'moderate' | 'complex';

export interface CampaignTemplate {
    id: string;
    name: string;
    description: string;
    category: TemplateCategory;
    icon: string;

    // Budget recommendations
    recommendedBudget: {
        min: number;
        max: number;
        optimal: number;
    };

    // Channel mix (percentages)
    channelMix: {
        channel: Channel;
        percentage: number;
        rationale: string;
    }[];

    // Pre-configured goals
    defaultGoals: {
        impressions?: number;
        reach?: number;
        conversions?: number;
        clicks?: number;
    };

    // Flight structure
    flightStructure: {
        name: string;
        budgetPercentage: number;
        durationDays: number;
    }[];

    // Metadata
    tags: string[];
    industry: string[];
    complexity: TemplateComplexity;
}

export type CostMethod = 'CPM' | 'CPC' | 'Flat' | 'Spot';

export type ForecastSource = 'Nielsen' | 'Comscore' | 'Geopath' | 'Arbitron' | 'Internal';

export interface ForecastMetrics {
    impressions: number;
    spend: number;
    reach: number;
    frequency: number;
    source: ForecastSource;
}

export interface DeliveryMetrics {
    actualImpressions: number;
    actualSpend: number;
    pacing: number; // Percentage (0-100+)
    status: 'ON_TRACK' | 'UNDER_PACING' | 'OVER_PACING';
}

export interface PerformanceMetrics {
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cvr: number;
    cpc: number;
    cpa: number;
    cpm?: number; // Cost per thousand impressions
    roas: number;
    frequency?: number; // Average frequency
    pacing?: number; // Delivery pacing percentage
    status: 'ACTIVE' | 'PAUSED';
}

export type PlacementStatus = 'PLANNING' | 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'PAUSED';

// Renamed from Placement to Line, keeping alias for backward compatibility
export interface Line {
    id: string;
    name: string;
    channel: 'Search' | 'Social' | 'Display' | 'TV' | 'Radio' | 'Streaming Audio' | 'Podcast' | 'Place-based Audio' | 'OOH';
    status: PlacementStatus;
    vendor: string;
    adUnit: string;
    segment?: string; // Legacy - single segment name
    segments?: Segment[]; // New - multiple segments with full metadata
    rate: number;
    costMethod: CostMethod;
    startDate: string;
    endDate: string;
    quantity: number;
    totalCost: number;

    targeting?: {
        geo: string[];
        demographics: string[];
        devices: string[];
    };

    // New Forecasting & Delivery Fields
    forecast?: ForecastMetrics;
    delivery?: DeliveryMetrics;

    performance?: PerformanceMetrics;
    buyingType?: 'Auction' | 'PMP' | 'Direct';
    dealId?: string;
    ioNumber?: string;

    // Creative Management
    creatives?: Creative[];
    rotationMode?: 'EVEN' | 'WEIGHTED' | 'OPTIMIZED';
    creative?: CreativeAsset; // Legacy
}

export type Placement = Line; // Alias for backward compatibility

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
    updatedMediaPlan?: MediaPlan; // Optional plan update to sync state
}
export interface Portfolio {
    id: string;
    name: string;
    brandId: string;
    campaigns: Campaign[];
    totalBudget: number;
    totalSpend: number;
    totalRevenue: number;
    roas: number;
}

export interface BudgetShift {
    id: string;
    sourceCampaignId: string;
    targetCampaignId: string;
    amount: number;
    timestamp: number;
    reason?: string;
    status: 'PENDING' | 'APPLIED' | 'REVERTED';
}

// Attribution Modeling Types
export type AttributionModel =
    | 'FIRST_TOUCH'
    | 'LAST_TOUCH'
    | 'LINEAR'
    | 'TIME_DECAY'
    | 'POSITION_BASED'
    | 'BLENDED'      // AdRoll Blended (Last Touch, Click Priority)
    | 'LAST_CLICK';  // 100% to Last Click

export type ChannelType = 'SEARCH' | 'SOCIAL' | 'DISPLAY' | 'VIDEO' | 'EMAIL' | 'TV' | 'AUDIO' | 'OOH';

export interface Touchpoint {
    id: string;
    channel: string;
    channelType: ChannelType;
    interactionType: 'CLICK' | 'VIEW'; // New field for Blended/Last View logic
    campaignId: string;
    campaignName: string;
    timestamp: string;
    cost: number;
}

export interface ConversionPath {
    id: string;
    userId: string;
    touchpoints: Touchpoint[];
    conversionValue: number;
    conversionDate: string;
    timeToConversion: number; // hours
}

export interface AttributionResult {
    channel: string;
    channelType: ChannelType;
    model: AttributionModel;
    credit: number;           // Attribution credit (0-1)
    revenue: number;          // Attributed revenue
    cost: number;             // Channel cost
    roas: number;             // Attributed ROAS
    conversions: number;      // Attributed conversions
}

export interface IncrementalityTest {
    id: string;
    channel: string;
    channelType: ChannelType;
    testPeriod: { start: string; end: string };
    controlGroup: { spend: number; conversions: number; revenue: number };
    testGroup: { spend: number; conversions: number; revenue: number };
    lift: number;             // % lift in conversions
    confidence: number;       // Statistical confidence (0-1)
    isSignificant: boolean;
    pValue: number;          // Statistical p-value
}

export interface AttributionAnalysis {
    paths: ConversionPath[];
    results: Map<AttributionModel, AttributionResult[]>;
    incrementalityTests: IncrementalityTest[];
    summary: {
        totalConversions: number;
        totalRevenue: number;
        avgTouchpoints: number;
        avgTimeToConversion: number; // hours
        topPerformingChannels: string[];
    };
}

