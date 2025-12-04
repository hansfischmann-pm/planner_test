/**
 * Budget Optimization and Recommendation Engine
 * 
 * METHODOLOGY:
 * ============
 * This module provides intelligent budget allocation across media channels
 * based on campaign objectives and historical performance.
 * 
 * ALLOCATION FORMULA:
 * Channel Budget = Total Budget × (Efficiency Weight × 0.6 + Performance Weight × 0.4)
 * 
 * Where:
 * - Efficiency Weight: Channel's ROAS relative to average ROAS
 * - Performance Weight: Historical volume capability
 * - 60/40 Split: Prioritizes efficiency but considers scale
 * 
 * CHANNEL BENCHMARKS:
 * Industry averages for CPA, CPC, CPM, ROAS by channel type
 * Used when no historical data is available
 * Source: 2024 industry benchmarking (simulated for prototype)
 * 
 * OBJECTIVE-BASED ALLOCATION:
 * - Awareness: Prioritizes reach (CTV, Display, Social)
 * - Consideration: Prioritizes engagement (Social, Video, Display)
 * - Conversion: Prioritizes performance (Search, Social, Display)
 * 
 * See: /docs/calculation_methodologies.md for detailed examples
 */

import { Line, Flight } from '../types';

export interface ChannelRecommendation {
    channel: string;
    allocatedBudget: number;
    percentage: number;
    reasoning: string;
    expectedROAS?: number;
    confidence: number;
}

export interface BudgetRecommendation {
    totalBudget: number;
    channels: ChannelRecommendation[];
    assumptions: string[];
    alternatives?: BudgetRecommendation[];
}

export type CampaignObjective = 'awareness' | 'consideration' | 'conversion';

/**
 * Channel performance benchmarks by objective
 * 
 * Structure: { objective: { channel: { efficiency, reach, minBudget } } }
 * 
 * - efficiency: 0-1 scale, higher = better ROAS
 * - reach: 0-1 scale, higher = more people reached
 * - minBudget: Minimum viable budget for channel in dollars
 */
const CHANNEL_BENCHMARKS: Record<CampaignObjective, Record<string, { efficiency: number, reach: number, minBudget: number }>> = {
    awareness: {
        'Connected TV': { efficiency: 0.85, reach: 0.9, minBudget: 25000 },
        'Linear TV': { efficiency: 0.75, reach: 0.95, minBudget: 50000 },
        'DOOH': { efficiency: 0.7, reach: 0.6, minBudget: 15000 },
        'Display': { efficiency: 0.6, reach: 0.8, minBudget: 5000 },
        'Social': { efficiency: 0.7, reach: 0.85, minBudget: 10000 },
        'Video': { efficiency: 0.75, reach: 0.75, minBudget: 15000 },
        'Search': { efficiency: 0.5, reach: 0.4, minBudget: 5000 },  // Lower priority for awareness but still available
        'Audio': { efficiency: 0.65, reach: 0.6, minBudget: 8000 }
    },
    consideration: {
        'Social': { efficiency: 0.8, reach: 0.8, minBudget: 10000 },
        'Display': { efficiency: 0.7, reach: 0.75, minBudget: 5000 },
        'Native': { efficiency: 0.75, reach: 0.7, minBudget: 8000 },
        'Video': { efficiency: 0.8, reach: 0.75, minBudget: 12000 },
        'Audio': { efficiency: 0.7, reach: 0.65, minBudget: 10000 },
        'Search': { efficiency: 0.7, reach: 0.5, minBudget: 5000 },
        'Connected TV': { efficiency: 0.7, reach: 0.7, minBudget: 20000 }
    },
    conversion: {
        'Search': { efficiency: 0.9, reach: 0.5, minBudget: 5000 },
        'Social': { efficiency: 0.85, reach: 0.7, minBudget: 8000 },
        'Display': { efficiency: 0.75, reach: 0.7, minBudget: 5000 },
        'Retail Media': { efficiency: 0.9, reach: 0.4, minBudget: 10000 },
        'Email': { efficiency: 0.95, reach: 0.3, minBudget: 2000 },
        'Connected TV': { efficiency: 0.6, reach: 0.6, minBudget: 20000 }
    }
};

/**
 * Recommend budget allocation across channels
 */
export function recommendBudgetAllocation(
    totalBudget: number,
    objective: CampaignObjective,
    requestedChannels?: string[],
    historicalPerformance?: Record<string, number>
): BudgetRecommendation {
    const benchmarks = CHANNEL_BENCHMARKS[objective];
    const assumptions: string[] = [];

    // Determine which channels to use
    let channels: string[];
    if (requestedChannels && requestedChannels.length > 0) {
        channels = requestedChannels.filter(c => benchmarks[c] !== undefined);
        assumptions.push(`Using requested channels: ${channels.join(', ')}`);
    } else {
        // Auto-select best channels for objective
        channels = Object.keys(benchmarks)
            .sort((a, b) => benchmarks[b].efficiency - benchmarks[a].efficiency)
            .slice(0, 3); // Top 3 channels
        assumptions.push(`Auto-selected top ${channels.length} channels for ${objective} objective`);
    }

    // Filter out channels where budget is below minimum
    const viableChannels = channels.filter(c => {
        const minBudget = benchmarks[c]?.minBudget || 0;
        return totalBudget >= minBudget * channels.length * 0.5; // At least 50% of min per channel
    });

    if (viableChannels.length < channels.length) {
        assumptions.push(`Removed ${channels.length - viableChannels.length} channel(s) due to minimum budget requirements`);
    }

    // Calculate allocation weights
    const recommendations: ChannelRecommendation[] = [];
    let totalWeight = 0;

    for (const channel of viableChannels) {
        const benchmark = benchmarks[channel];
        if (!benchmark) continue;

        // Weight based on efficiency and historical performance
        let weight = benchmark.efficiency;

        if (historicalPerformance && historicalPerformance[channel]) {
            // Adjust based on historical ROAS
            const historicalROAS = historicalPerformance[channel];
            weight = weight * 0.6 + (historicalROAS / 5) * 0.4; // Blend benchmark and historical
        }

        totalWeight += weight;
    }

    // Allocate budget proportionally
    for (const channel of viableChannels) {
        const benchmark = benchmarks[channel];
        if (!benchmark) continue;

        let weight = benchmark.efficiency;
        const historicalROAS = historicalPerformance?.[channel];
        if (historicalROAS) {
            weight = weight * 0.6 + (historicalROAS / 5) * 0.4;
        }

        const allocatedBudget = Math.round((weight / totalWeight) * totalBudget);
        const percentage = (allocatedBudget / totalBudget) * 100;

        // Generate reasoning
        let reasoning = `Strong ${objective} performance`;
        if (historicalROAS) {
            reasoning += ` (${historicalROAS.toFixed(2)}x historical ROAS)`;
        } else {
            reasoning += ` (${(benchmark.efficiency * 5).toFixed(2)}x expected ROAS)`;
        }

        recommendations.push({
            channel,
            allocatedBudget,
            percentage,
            reasoning,
            expectedROAS: historicalPerformance?.[channel] || benchmark.efficiency * 5,
            confidence: historicalPerformance?.[channel] ? 0.85 : 0.65
        });
    }

    // Sort by allocation
    recommendations.sort((a, b) => b.allocatedBudget - a.allocatedBudget);

    return {
        totalBudget,
        channels: recommendations,
        assumptions
    };
}

/**
 * Analyze current budget usage and provide warnings
 * 
 * THRESHOLDS:
 * - >95%: Critical - no room for additions
 * - >80%: Warning - limited budget remaining (industry standard alert point)
 * - <50%: Info - underutilized budget
 * - Channel >60%: Concentration risk warning
 * 
 * WHY 80%?
 * - Industry standard campaign management threshold
 * - Provides buffer to make adjustments before it's too late
 * - Allows time to reallocate or increase budget if needed
 * 
 * See: /docs/calculation_methodologies.md Section 7
 */
export function analyzeBudgetUsage(flight: Flight, lines: Line[]): {
    warnings: string[];
    recommendations: string[];
    utilizationPercent: number;
} {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    const totalSpend = lines.reduce((sum, line) => sum + line.totalCost, 0);
    const budget = flight.budget || 0;
    const utilizationPercent = budget > 0 ? (totalSpend / budget) * 100 : 0;

    // Budget warnings
    if (utilizationPercent > 95) {
        warnings.push('⚠️ Budget is 95%+ allocated. No room for additional placements.');
    } else if (utilizationPercent > 80) {
        warnings.push(`⚠️ Budget is ${utilizationPercent.toFixed(0)}% allocated. Limited budget remaining.`);
    }

    if (utilizationPercent < 50 && lines.length > 0) {
        warnings.push(`📊 Only ${utilizationPercent.toFixed(0)}% of budget allocated. Consider adding more placements or increasing spend.`);
    }

    // Channel concentration warnings
    const channelSpend: Record<string, number> = {};
    for (const line of lines) {
        channelSpend[line.channel] = (channelSpend[line.channel] || 0) + line.totalCost;
    }

    for (const [channel, spend] of Object.entries(channelSpend)) {
        const channelPercent = (spend / totalSpend) * 100;
        if (channelPercent > 60) {
            warnings.push(`⚠️ ${channelPercent.toFixed(0)}% of budget in ${channel}. Consider diversifying.`);
        }
    }

    // Recommendations
    if (utilizationPercent < 80 && budget - totalSpend > 10000) {
        const remaining = budget - totalSpend;
        recommendations.push(`💡 You have $${(remaining / 1000).toFixed(0)}k remaining. Consider adding high-performing channels.`);
    }

    return {
        warnings,
        recommendations,
        utilizationPercent
    };
}

/**
 * Suggest optimizations based on performance data
 */
export function suggestOptimizations(lines: Line[]): string[] {
    const suggestions: string[] = [];

    if (lines.length === 0) return suggestions;

    // Analyze performance variance
    const lineCPAs = lines
        .filter(l => l.performance?.cpa)
        .map(l => ({ id: l.id, cpa: l.performance!.cpa!, channel: l.channel }));

    if (lineCPAs.length > 1) {
        const avgCPA = lineCPAs.reduce((sum, l) => sum + l.cpa, 0) / lineCPAs.length;

        // Find underperformers
        const underperformers = lineCPAs.filter(l => l.cpa > avgCPA * 1.5);
        if (underperformers.length > 0) {
            suggestions.push(`💡 ${underperformers.length} placement(s) have CPA >50% above average. Consider pausing or optimizing.`);
        }

        // Find top performers
        const topPerformers = lineCPAs.filter(l => l.cpa < avgCPA * 0.7);
        if (topPerformers.length > 0) {
            suggestions.push(`🎯 ${topPerformers.length} placement(s) performing exceptionally. Consider increasing budget.`);
        }
    }

    // Check frequency
    const highFrequency = lines.filter(l => l.performance && l.performance.frequency && l.performance.frequency > 8);
    if (highFrequency.length > 0) {
        suggestions.push(`⚠️ ${highFrequency.length} placement(s) have frequency >8x. Consider frequency capping.`);
    }

    return suggestions;
}
