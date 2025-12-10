import { Campaign } from '../types';

export interface ForecastDataPoint {
    date: string;
    actualRevenue: number | null; // Null for future dates
    predictedRevenue: number | null; // Null for past dates (or can overlap for validation)
    lowerBound: number | null;
    upperBound: number | null;
}

export interface PredictionResult {
    campaignId: string;
    forecast: ForecastDataPoint[];
    totalPredictedRevenue: number;
    confidenceScore: number; // 0-1
}

/**
 * Generates mock forecast data for a campaign.
 * Simulates 6 months of history and 3 months of future prediction.
 */
export const generateRevenueForecast = (campaign: Campaign): PredictionResult => {
    const data: ForecastDataPoint[] = [];
    const today = new Date();

    // Simulate start date as 6 months ago
    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() - 6);

    // Simulate end date as 3 months from now
    const endDate = new Date(today);
    endDate.setMonth(today.getMonth() + 3);

    let currentDate = new Date(startDate);
    let totalPredictedRevenue = 0;

    // Base revenue determines the scale
    const baseRevenue = (campaign.budget * 2) / 9; // Rough ROI assumption distributed over 9 months

    while (currentDate <= endDate) {
        const isFuture = currentDate > today;
        const dateStr = currentDate.toISOString().split('T')[0];

        // Add some seasonality (sine wave) and trend (linear growth)
        const monthIndex = currentDate.getMonth();
        const seasonality = Math.sin(monthIndex * (Math.PI / 6)) * 0.2; // +/- 20%
        const trend = (currentDate.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime()) * 0.3; // +30% growth over time
        const noise = (Math.random() - 0.5) * 0.1; // +/- 5% noise

        const revenue = baseRevenue * (1 + seasonality + trend + noise);

        if (isFuture) {
            // Future: Prediction with confidence intervals
            const uncertainty = (currentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 30) * 0.1; // Uncertainty grows 10% per month

            data.push({
                date: dateStr,
                actualRevenue: null,
                predictedRevenue: revenue,
                lowerBound: revenue * (1 - uncertainty),
                upperBound: revenue * (1 + uncertainty)
            });
            totalPredictedRevenue += revenue;
        } else {
            // Past: Actuals only
            data.push({
                date: dateStr,
                actualRevenue: revenue,
                predictedRevenue: null,
                lowerBound: null,
                upperBound: null
            });
        }

        // Advance by 1 week
        currentDate.setDate(currentDate.getDate() + 7);
    }

    return {
        campaignId: campaign.id,
        forecast: data,
        totalPredictedRevenue: Math.round(totalPredictedRevenue),
        confidenceScore: 0.85
    };
};

/**
 * Simulates a scenario based on budget adjustments.
 */
export const simulateScenario = (campaign: Campaign, adjustments: Record<string, number>): PredictionResult => {
    // 1. Generate base forecast
    const baseResult = generateRevenueForecast(campaign);

    // 2. Calculate aggregate impact multiplier
    // Simplification: Average of all channel adjustments
    const vals = Object.values(adjustments);
    const avgAdjustment = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 1;

    // 3. Apply Diminishing Returns logic
    // If avg > 1 (spend increase), impact grows slower (sqrt)
    // If avg < 1 (spend decrease), impact drops linear or faster
    let impactMultiplier = 1;
    if (avgAdjustment > 1) {
        impactMultiplier = 1 + (avgAdjustment - 1) * 0.8; // 80% efficiency on scaled spend
    } else {
        impactMultiplier = avgAdjustment; // Linear drop
    }

    // 4. Modifiy the base forecast
    const modifiedForecast = baseResult.forecast.map(point => {
        if (point.predictedRevenue === null) return point; // Past data unchanged

        // Ramp up the impact over the 3 months (scenario takes time to kick in)
        const date = new Date(point.date);
        const today = new Date();
        const weeksFuture = (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24 * 7);
        const rampFactor = Math.min(weeksFuture / 4, 1); // Full impact after 4 weeks

        const effectiveMultiplier = 1 + (impactMultiplier - 1) * rampFactor;

        return {
            ...point,
            predictedRevenue: point.predictedRevenue * effectiveMultiplier,
            lowerBound: (point.lowerBound || 0) * effectiveMultiplier,
            upperBound: (point.upperBound || 0) * effectiveMultiplier
        };
    });

    const newTotal = modifiedForecast.reduce((sum, p) => sum + (p.predictedRevenue || 0), 0);

    return {
        ...baseResult,
        forecast: modifiedForecast,
        totalPredictedRevenue: Math.round(newTotal),
        confidenceScore: baseResult.confidenceScore * 0.9 // Confidence drops with simulation
    };
};

export interface Recommendation {
    id: string;
    channel: string;
    action: 'INCREASE' | 'DECREASE' | 'MAINTAIN';
    percentage: number;
    reasoning: string;
    impact: string;
}

/**
 * Generates AI-driven recommendations for budget allocation.
 */
export const generateRecommendations = (campaign: Campaign): Recommendation[] => {
    const recommendations: Recommendation[] = [];

    // Extract unique channels
    const channels = new Set<string>();
    campaign.flights.forEach(f => f.lines.forEach(l => channels.add(l.channel)));
    const channelList = Array.from(channels);

    if (channelList.length === 0) {
        // Fallback for empty campaign
        channelList.push('Search', 'Social', 'Display');
    }

    channelList.forEach((channel, index) => {
        // Mock logic: Deterministic based on channel name length or index for stability
        // In reality, this would query backend ML models
        const roas = (channel.length % 5) + 1; // Random ROAS between 1 and 5

        if (roas > 3.5) {
            recommendations.push({
                id: `rec-${index}`,
                channel,
                action: 'INCREASE',
                percentage: 0.2, // +20%
                reasoning: `High ROAS (${roas.toFixed(1)}x) indicates room for scaling.`,
                impact: `Est. +$${(Math.random() * 10000 + 5000).toFixed(0)} Revenue`
            });
        } else if (roas < 2.0) {
            recommendations.push({
                id: `rec-${index}`,
                channel,
                action: 'DECREASE',
                percentage: -0.1, // -10%
                reasoning: `Low efficiency (${roas.toFixed(1)}x). Reduce waste.`,
                impact: `Save $${(Math.random() * 2000 + 1000).toFixed(0)} Budget`
            });
        }
    });

    if (recommendations.length === 0) {
        recommendations.push({
            id: 'rec-default',
            channel: 'General',
            action: 'MAINTAIN',
            percentage: 0,
            reasoning: 'Current allocation is optimal.',
            impact: 'Stable Growth'
        });
    }

    return recommendations;
};
