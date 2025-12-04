import { Placement } from '../types';
import { analyzePlan, PerformanceIssue, PlanAnalysis } from './performanceAnalyzer';

export interface OptimizationRecommendation {
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    action: 'PAUSE' | 'REDUCE_BUDGET' | 'INCREASE_BUDGET' | 'ADJUST_BID' | 'CAP_FREQUENCY' | 'DIVERSIFY';
    placementId: string;
    placementName: string;
    description: string;
    currentMetric: string;
    targetMetric: string;
    estimatedImpact: number; // Positive = savings, Negative = opportunity gain
    specificAction: string; // e.g., "Reduce budget from $10k to $6k"
}

export interface OptimizationReport {
    analysis: PlanAnalysis;
    recommendations: OptimizationRecommendation[];
    totalSavings: number;
    totalGains: number;
    netImpact: number;
    quickWins: OptimizationRecommendation[]; // Easy + high impact
}

/**
 * Generate optimization recommendations from performance analysis
 */
export function generateOptimizationReport(
    placements: Placement[],
    totalBudget: number
): OptimizationReport {
    // First, analyze the plan
    const analysis = analyzePlan(placements, totalBudget);

    // Generate recommendations from issues
    const recommendations: OptimizationRecommendation[] = [];

    analysis.issues.forEach(issue => {
        const recommendation = issueToRecommendation(issue, placements);
        if (recommendation) {
            recommendations.push(recommendation);
        }
    });

    // Sort by estimated impact (highest first)
    recommendations.sort((a, b) => Math.abs(b.estimatedImpact) - Math.abs(a.estimatedImpact));

    // Identify quick wins (easy actions with high impact)
    const quickWins = recommendations.filter(r =>
        (r.priority === 'HIGH' || r.priority === 'MEDIUM') &&
        Math.abs(r.estimatedImpact) > 1000 &&
        (r.action === 'PAUSE' || r.action === 'REDUCE_BUDGET' || r.action === 'CAP_FREQUENCY')
    );

    // Calculate totals
    const totalSavings = recommendations
        .filter(r => r.estimatedImpact > 0)
        .reduce((sum, r) => sum + r.estimatedImpact, 0);

    const totalGains = Math.abs(recommendations
        .filter(r => r.estimatedImpact < 0)
        .reduce((sum, r) => sum + r.estimatedImpact, 0));

    const netImpact = totalSavings + totalGains;

    return {
        analysis,
        recommendations,
        totalSavings,
        totalGains,
        netImpact,
        quickWins
    };
}

/**
 * Convert a performance issue to an actionable recommendation
 */
function issueToRecommendation(
    issue: PerformanceIssue,
    placements: Placement[]
): OptimizationRecommendation | null {
    const placement = placements.find(p => p.id === issue.placementId);
    if (!placement && issue.placementId !== 'PLAN_LEVEL') return null;

    // Determine priority based on severity and impact
    let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (issue.severity === 'CRITICAL' || (issue.estimatedWaste && Math.abs(issue.estimatedWaste) > 5000)) {
        priority = 'HIGH';
    } else if (issue.severity === 'WARNING' || (issue.estimatedWaste && Math.abs(issue.estimatedWaste) > 2000)) {
        priority = 'MEDIUM';
    }

    // Generate specific recommendations based on issue type
    switch (issue.type) {
        case 'PERFORMANCE':
            if (issue.currentValue < 0.5) {
                // ROAS < 0.5 - pause immediately
                return {
                    priority: 'HIGH',
                    action: 'PAUSE',
                    placementId: issue.placementId,
                    placementName: issue.placementName,
                    description: `Pause placement due to critically low ROAS (${issue.currentValue.toFixed(2)})`,
                    currentMetric: `ROAS: ${issue.currentValue.toFixed(2)}`,
                    targetMetric: `Target: > 1.0`,
                    estimatedImpact: issue.estimatedWaste || 0,
                    specificAction: `Pause "${issue.placementName}" immediately to stop losses`
                };
            } else if (issue.currentValue < 1.0) {
                // ROAS < 1.0 - reduce budget
                const reduction = placement ? placement.totalCost * 0.5 : 0;
                return {
                    priority: 'HIGH',
                    action: 'REDUCE_BUDGET',
                    placementId: issue.placementId,
                    placementName: issue.placementName,
                    description: `Reduce budget by 50% due to below break-even ROAS`,
                    currentMetric: `ROAS: ${issue.currentValue.toFixed(2)}`,
                    targetMetric: `Target: > 1.0`,
                    estimatedImpact: (issue.estimatedWaste || 0) * 0.5,
                    specificAction: placement
                        ? `Reduce budget from $${(placement.totalCost / 1000).toFixed(1)}k to $${(reduction / 1000).toFixed(1)}k`
                        : 'Reduce budget by 50%'
                };
            } else if (issue.currentValue > 3.0) {
                // High ROAS - scale opportunity
                const increase = placement ? placement.totalCost * 0.5 : 0;
                return {
                    priority: 'MEDIUM',
                    action: 'INCREASE_BUDGET',
                    placementId: issue.placementId,
                    placementName: issue.placementName,
                    description: `Scale high-performing placement (ROAS ${issue.currentValue.toFixed(2)})`,
                    currentMetric: `ROAS: ${issue.currentValue.toFixed(2)}`,
                    targetMetric: `Budget: +50%`,
                    estimatedImpact: issue.estimatedWaste || 0, // Negative = opportunity
                    specificAction: placement
                        ? `Increase budget from $${(placement.totalCost / 1000).toFixed(1)}k to $${((placement.totalCost + increase) / 1000).toFixed(1)}k`
                        : 'Increase budget by 50%'
                };
            }
            break;

        case 'COST':
            if (issue.currentValue > issue.benchmark * 2) {
                // CPA/CPC 2x benchmark - reduce budget significantly
                const reduction = placement ? placement.totalCost * 0.6 : 0;
                return {
                    priority: 'HIGH',
                    action: 'REDUCE_BUDGET',
                    placementId: issue.placementId,
                    placementName: issue.placementName,
                    description: `Reduce budget by 40% due to high costs`,
                    currentMetric: issue.message,
                    targetMetric: `Target CPA: $${issue.benchmark.toFixed(2)}`,
                    estimatedImpact: issue.estimatedWaste || 0,
                    specificAction: placement
                        ? `Reduce budget from $${(placement.totalCost / 1000).toFixed(1)}k to $${(reduction / 1000).toFixed(1)}k`
                        : 'Reduce budget by 40%'
                };
            } else {
                // CPA/CPC 1.5x benchmark - adjust bids
                return {
                    priority: 'MEDIUM',
                    action: 'ADJUST_BID',
                    placementId: issue.placementId,
                    placementName: issue.placementName,
                    description: `Lower bids to improve cost efficiency`,
                    currentMetric: issue.message,
                    targetMetric: `Target: $${issue.benchmark.toFixed(2)}`,
                    estimatedImpact: (issue.estimatedWaste || 0) * 0.3,
                    specificAction: `Lower bid by 20-30% and monitor performance`
                };
            }

        case 'FREQUENCY':
            return {
                priority: issue.severity === 'CRITICAL' ? 'HIGH' : 'MEDIUM',
                action: 'CAP_FREQUENCY',
                placementId: issue.placementId,
                placementName: issue.placementName,
                description: `Add frequency cap to prevent ad fatigue`,
                currentMetric: `Frequency: ${issue.currentValue.toFixed(1)}`,
                targetMetric: `Cap at 5 per week`,
                estimatedImpact: placement ? placement.totalCost * 0.15 : 0, // Estimate 15% waste from fatigue
                specificAction: `Set frequency cap of 5 impressions per user per week`
            };

        case 'PACING':
            if (issue.currentValue < 50) {
                return {
                    priority: 'MEDIUM',
                    action: 'ADJUST_BID',
                    placementId: issue.placementId,
                    placementName: issue.placementName,
                    description: `Increase bids to improve delivery pacing`,
                    currentMetric: `Pacing: ${issue.currentValue.toFixed(0)}%`,
                    targetMetric: `Target: 100%`,
                    estimatedImpact: 0,
                    specificAction: `Increase bid by 15-20% or expand targeting`
                };
            } else {
                return {
                    priority: 'MEDIUM',
                    action: 'ADJUST_BID',
                    placementId: issue.placementId,
                    placementName: issue.placementName,
                    description: `Lower bids to slow delivery pace`,
                    currentMetric: `Pacing: ${issue.currentValue.toFixed(0)}%`,
                    targetMetric: `Target: 100%`,
                    estimatedImpact: 0,
                    specificAction: `Lower bid by 10-15% or tighten targeting`
                };
            }

        case 'BUDGET':
            return {
                priority: 'MEDIUM',
                action: 'DIVERSIFY',
                placementId: issue.placementId,
                placementName: issue.placementName,
                description: issue.message,
                currentMetric: `Concentration: ${issue.currentValue.toFixed(0)}%`,
                targetMetric: `Target: < 50%`,
                estimatedImpact: 0,
                specificAction: `Allocate 10-20% budget to complementary channels`
            };
    }

    return null;
}

/**
 * Format optimization report as text for agent responses
 */
export function formatOptimizationReport(report: OptimizationReport, placements?: Placement[]): string {
    const { analysis, recommendations, totalSavings, totalGains, netImpact, quickWins } = report;

    let output = `🎯 **Plan Optimization Report**\n\n`;

    // Overall score
    output += `**Overall Score:** ${analysis.overallScore}/100`;
    if (analysis.overallScore < 50) output += ` Needs Attention\n`;
    else if (analysis.overallScore < 70) output += ` Fair\n`;
    else if (analysis.overallScore < 85) output += ` Good\n`;
    else output += ` Excellent\n`;

    output += `\n`;

    // Channel breakdown (if placements provided)
    if (placements && placements.length > 0) {
        output += `**Channel Breakdown:**\n`;

        // Group placements by channel
        const channelGroups: Record<string, Placement[]> = {};
        placements.forEach(p => {
            const channel = p.channel || 'Unknown';
            if (!channelGroups[channel]) channelGroups[channel] = [];
            channelGroups[channel].push(p);
        });

        // Sort channels by total spend
        const sortedChannels = Object.entries(channelGroups)
            .map(([channel, pls]) => ({
                channel,
                placements: pls,
                totalSpend: pls.reduce((sum, p) => sum + p.totalCost, 0),
                avgRoas: pls.filter(p => p.performance?.roas).length > 0
                    ? pls.reduce((sum, p) => sum + (p.performance?.roas || 0), 0) / pls.filter(p => p.performance?.roas).length
                    : null
            }))
            .sort((a, b) => b.totalSpend - a.totalSpend);

        sortedChannels.forEach(({ channel, placements: pls, totalSpend, avgRoas }) => {
            const roasStr = avgRoas !== null ? ` | ROAS: ${avgRoas.toFixed(2)}` : '';
            const status = avgRoas !== null
                ? (avgRoas >= 3.0 ? ' ↑' : avgRoas < 1.0 ? ' ↓' : '')
                : '';
            output += `\n**${channel}** ($${formatCurrency(totalSpend)}${roasStr})${status}\n`;

            // List individual placements
            pls.forEach(p => {
                const perf = p.performance;
                let placementStatus = '';
                let metrics = '';

                if (perf) {
                    if (perf.status === 'PAUSED') {
                        placementStatus = ' [PAUSED]';
                    } else if (perf.roas >= 3.0) {
                        placementStatus = ' ★';
                    } else if (perf.roas < 1.0) {
                        placementStatus = ' !';
                    }
                    metrics = ` | ROAS: ${perf.roas.toFixed(2)} | CTR: ${(perf.ctr * 100).toFixed(2)}%`;
                }

                output += `  • ${p.vendor}: $${formatCurrency(p.totalCost)}${metrics}${placementStatus}\n`;
            });
        });

        output += `\n`;
    }

    // Critical issues
    const critical = recommendations.filter(r => r.priority === 'HIGH');
    if (critical.length > 0) {
        output += `**Critical Issues (${critical.length}):**\n`;
        critical.slice(0, 3).forEach(r => {
            const impact = r.estimatedImpact > 0
                ? `Save $${formatCurrency(r.estimatedImpact)}`
                : `Gain $${formatCurrency(Math.abs(r.estimatedImpact))}`;
            output += `• ${r.placementName}: ${r.description}\n`;
            output += `  ${r.currentMetric} → ${r.specificAction}\n`;
            output += `  ${impact}\n\n`;
        });
        if (critical.length > 3) {
            output += `  _...and ${critical.length - 3} more critical issues_\n\n`;
        }
    }

    // Opportunities
    const opportunities = recommendations.filter(r => r.estimatedImpact < 0);
    if (opportunities.length > 0) {
        output += `**Growth Opportunities (${opportunities.length}):**\n`;
        opportunities.slice(0, 2).forEach(r => {
            const gain = Math.abs(r.estimatedImpact);
            output += `• ${r.placementName}: ${r.description}\n`;
            output += `  ${r.currentMetric} → ${r.specificAction}\n`;
            output += `  Potential gain: $${formatCurrency(gain)}\n\n`;
        });
    }

    // Summary
    output += `**Total Impact:**\n`;
    if (totalSavings > 0) {
        output += `• Save: $${formatCurrency(totalSavings)} from waste reduction\n`;
    }
    if (totalGains > 0) {
        output += `• Gain: $${formatCurrency(totalGains)} from scaling winners\n`;
    }
    if (netImpact > 0) {
        output += `• **Net Impact: +$${formatCurrency(netImpact)}**\n`;
    }

    // Quick wins
    if (quickWins.length > 0) {
        output += `\n${quickWins.length} quick win${quickWins.length > 1 ? 's' : ''} available - easy actions with high impact`;
    }

    return output;
}

/**
 * Format currency with commas
 */
function formatCurrency(amount: number): string {
    return Math.round(amount).toLocaleString('en-US');
}
