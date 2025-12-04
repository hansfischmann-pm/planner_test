import { Campaign, Portfolio } from '../types';
import { generateCampaign, SAMPLE_BRANDS } from '../logic/dummyData';

// Helper to generate a distinct campaign with specific characteristics
const createCampaign = (
    id: string,
    name: string,
    budget: number,
    status: 'ACTIVE' | 'PAUSED' | 'DRAFT' | 'COMPLETED',
    performanceMultiplier: number = 1.0
): Campaign => {
    // Use the first sample brand as a base
    const campaign = generateCampaign(SAMPLE_BRANDS[0]);
    campaign.id = id;
    campaign.name = name;
    campaign.budget = budget;
    campaign.status = status;

    // Initialize performance if missing (generateCampaign might not add it at campaign level fully populated)
    if (!campaign.performance) {
        campaign.performance = {
            spend: 0,
            impressions: 0,
            clicks: 0,
            conversions: 0,
            ctr: 0,
            cvr: 0,
            cpa: 0,
            roas: 0,
            revenue: 0,
            status: status === 'DRAFT' ? 'PAUSED' : status as any
        };
    }

    // Adjust performance metrics based on multiplier
    if (campaign.performance) {
        campaign.performance.spend = budget * (status === 'ACTIVE' ? 0.4 : status === 'COMPLETED' ? 1.0 : 0);
        campaign.performance.impressions = (campaign.performance.impressions || 100000) * performanceMultiplier;
        campaign.performance.clicks = (campaign.performance.clicks || 2000) * performanceMultiplier;
        campaign.performance.conversions = (campaign.performance.conversions || 50) * performanceMultiplier;
        campaign.performance.revenue = campaign.performance.spend * (2.5 * performanceMultiplier);

        // Recalculate derived metrics
        campaign.performance.ctr = campaign.performance.impressions > 0 ? campaign.performance.clicks / campaign.performance.impressions : 0;
        campaign.performance.cvr = campaign.performance.clicks > 0 ? campaign.performance.conversions / campaign.performance.clicks : 0;
        campaign.performance.cpa = campaign.performance.conversions > 0 ? campaign.performance.spend / campaign.performance.conversions : 0;
        campaign.performance.roas = campaign.performance.spend > 0 ? campaign.performance.revenue / campaign.performance.spend : 0;
    }

    return campaign;
};

// Mock Portfolio Data
export const mockPortfolio: Portfolio = {
    id: 'port-001',
    name: 'Nike Global Q4 Portfolio',
    brandId: 'brand-nike',
    campaigns: [
        createCampaign('cmp-001', 'Nike Q4 Brand Awareness', 500000, 'ACTIVE', 1.2),
        createCampaign('cmp-002', 'Jordan Holiday Push', 750000, 'ACTIVE', 1.5),
        createCampaign('cmp-003', 'Running Shoe Launch', 250000, 'PAUSED', 0.8),
        createCampaign('cmp-004', 'Retargeting - Cart Abandoners', 100000, 'ACTIVE', 2.1)
    ],
    totalBudget: 1600000,
    totalSpend: 0,
    totalRevenue: 0,
    roas: 0
};

// Calculate aggregated metrics
export const calculatePortfolioMetrics = (portfolio: Portfolio): Portfolio => {
    let totalSpend = 0;
    let totalRevenue = 0;

    portfolio.campaigns.forEach(campaign => {
        if (campaign.performance) {
            totalSpend += campaign.performance.spend;
            totalRevenue += campaign.performance.revenue;
        }
    });

    return {
        ...portfolio,
        totalSpend,
        totalRevenue,
        roas: totalSpend > 0 ? totalRevenue / totalSpend : 0
    };
};

// Initialize with calculated metrics
export const initialPortfolio = calculatePortfolioMetrics(mockPortfolio);
