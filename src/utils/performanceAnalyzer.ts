import { Placement } from '../types';

export type IssueSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type IssueType = 'COST' | 'PERFORMANCE' | 'PACING' | 'FREQUENCY' | 'BUDGET';

export interface PerformanceIssue {
    severity: IssueSeverity;
    type: IssueType;
    placementId: string;
    placementName: string;
    message: string;
    currentValue: number;
    benchmark: number;
    estimatedWaste?: number;
    recommendation?: string;
}

export interface PlanAnalysis {
    overallScore: number; // 0-100
    issues: PerformanceIssue[];
    criticalCount: number;
    warningCount: number;
    infoCount: number;
    totalWaste: number;
    totalOpportunity: number;
}

// Channel performance benchmarks (industry averages)
const CHANNEL_BENCHMARKS = {
    'Social': { cpa: 45, cpc: 1.2, cpm: 8.5, roas: 2.5, frequency: 5 },
    'Display': { cpa: 65, cpc: 2.5, cpm: 12, roas: 1.8, frequency: 6 },
    'Search': { cpa: 55, cpc: 3.2, cpm: 15, roas: 3.0, frequency: 3 },
    'Video': { cpa: 75, cpc: 0.8, cpm: 18, roas: 2.2, frequency: 5 },
    'CTV': { cpa: 85, cpc: 0.5, cpm: 25, roas: 2.0, frequency: 7 },
    'Audio': { cpa: 70, cpc: 1.5, cpm: 20, roas: 1.9, frequency: 8 },
    'TV': { cpa: 95, cpc: 0.3, cpm: 35, roas: 1.5, frequency: 10 },
    'OOH': { cpa: 120, cpc: 0.1, cpm: 50, roas: 1.2, frequency: 15 }
};

const DEFAULT_BENCHMARK = { cpa: 60, cpc: 2.0, cpm: 15, roas: 2.0, frequency: 6 };

/**
 * Analyzes a media plan for performance issues and optimization opportunities
 */
export function analyzePlan(placements: Placement[], totalBudget: number): PlanAnalysis {
    const issues: PerformanceIssue[] = [];

    placements.forEach(placement => {
        // Get benchmark for this channel
        const benchmark = CHANNEL_BENCHMARKS[placement.channel as keyof typeof CHANNEL_BENCHMARKS] || DEFAULT_BENCHMARK;

        // Check for performance issues
        issues.push(...detectPerformanceIssues(placement, benchmark));
        issues.push(...detectCostIssues(placement, benchmark));
        issues.push(...detectFrequencyIssues(placement, benchmark));
        issues.push(...detectPacingIssues(placement));
    });

    // Check for budget concentration issues
    issues.push(...detectBudgetConcentration(placements, totalBudget));

    // Calculate counts
    const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
    const warningCount = issues.filter(i => i.severity === 'WARNING').length;
    const infoCount = issues.filter(i => i.severity === 'INFO').length;

    // Calculate waste and opportunity
    const totalWaste = issues
        .filter(i => i.estimatedWaste && i.estimatedWaste > 0)
        .reduce((sum, i) => sum + (i.estimatedWaste || 0), 0);

    const totalOpportunity = issues
        .filter(i => i.estimatedWaste && i.estimatedWaste < 0) // Negative waste = opportunity
        .reduce((sum, i) => sum + Math.abs(i.estimatedWaste || 0), 0);

    // Calculate overall score (100 - penalty for issues)
    const criticalPenalty = criticalCount * 20;
    const warningPenalty = warningCount * 10;
    const infoPenalty = infoCount * 3;
    const overallScore = Math.max(0, 100 - criticalPenalty - warningPenalty - infoPenalty);

    return {
        overallScore,
        issues: issues.sort((a, b) => {
            // Sort by severity first, then by estimated impact
            if (a.severity !== b.severity) {
                const severityOrder = { 'CRITICAL': 0, 'WARNING': 1, 'INFO': 2 };
                return severityOrder[a.severity] - severityOrder[b.severity];
            }
            return Math.abs(b.estimatedWaste || 0) - Math.abs(a.estimatedWaste || 0);
        }),
        criticalCount,
        warningCount,
        infoCount,
        totalWaste,
        totalOpportunity
    };
}

/**
 * Detect performance issues (ROAS, CPA)
 */
function detectPerformanceIssues(placement: Placement, benchmark: any): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const perf = placement.performance;

    if (!perf) return issues;

    // Check ROAS
    if (perf.roas !== undefined) {
        if (perf.roas < 0.5) {
            // Losing significant money
            const waste = placement.totalCost * (1 - perf.roas);
            issues.push({
                severity: 'CRITICAL',
                type: 'PERFORMANCE',
                placementId: placement.id,
                placementName: placement.vendor,
                message: `ROAS of ${perf.roas.toFixed(2)} is critically low (losing money)`,
                currentValue: perf.roas,
                benchmark: 1.0,
                estimatedWaste: waste,
                recommendation: 'Pause immediately to stop losses'
            });
        } else if (perf.roas < 1.0) {
            const waste = placement.totalCost * (1 - perf.roas);
            issues.push({
                severity: 'WARNING',
                type: 'PERFORMANCE',
                placementId: placement.id,
                placementName: placement.vendor,
                message: `ROAS of ${perf.roas.toFixed(2)} is below break-even`,
                currentValue: perf.roas,
                benchmark: 1.0,
                estimatedWaste: waste,
                recommendation: 'Reduce budget by 50% or optimize targeting'
            });
        } else if (perf.roas > 3.0) {
            // High performer - scale opportunity
            const opportunity = placement.totalCost * 0.5 * (perf.roas - 1); // Estimate 50% budget increase
            issues.push({
                severity: 'INFO',
                type: 'PERFORMANCE',
                placementId: placement.id,
                placementName: placement.vendor,
                message: `ROAS of ${perf.roas.toFixed(2)} is excellent - scale opportunity`,
                currentValue: perf.roas,
                benchmark: benchmark.roas,
                estimatedWaste: -opportunity, // Negative = opportunity
                recommendation: 'Increase budget by 50% to maximize returns'
            });
        }
    }

    // Check CPA
    if (perf.cpa !== undefined) {
        const cpaThreshold = benchmark.cpa * 2;
        if (perf.cpa > cpaThreshold) {
            const waste = placement.totalCost * 0.4; // Estimate 40% waste
            issues.push({
                severity: 'CRITICAL',
                type: 'COST',
                placementId: placement.id,
                placementName: placement.vendor,
                message: `CPA of $${perf.cpa.toFixed(2)} is ${(perf.cpa / benchmark.cpa).toFixed(1)}x benchmark`,
                currentValue: perf.cpa,
                benchmark: benchmark.cpa,
                estimatedWaste: waste,
                recommendation: 'Reduce budget by 40% or adjust targeting'
            });
        } else if (perf.cpa > benchmark.cpa * 1.5) {
            const waste = placement.totalCost * 0.2;
            issues.push({
                severity: 'WARNING',
                type: 'COST',
                placementId: placement.id,
                placementName: placement.vendor,
                message: `CPA of $${perf.cpa.toFixed(2)} is above benchmark ($${benchmark.cpa})`,
                currentValue: perf.cpa,
                benchmark: benchmark.cpa,
                estimatedWaste: waste,
                recommendation: 'Optimize creative or targeting to reduce CPA'
            });
        }
    }

    return issues;
}

/**
 * Detect cost efficiency issues (CPC, CPM)
 */
function detectCostIssues(placement: Placement, benchmark: any): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const perf = placement.performance;

    if (!perf) return issues;

    // Check CPC
    if (perf.cpc !== undefined && perf.cpc > benchmark.cpc * 1.5) {
        issues.push({
            severity: 'WARNING',
            type: 'COST',
            placementId: placement.id,
            placementName: placement.vendor,
            message: `CPC of $${perf.cpc.toFixed(2)} is ${(perf.cpc / benchmark.cpc).toFixed(1)}x benchmark`,
            currentValue: perf.cpc,
            benchmark: benchmark.cpc,
            recommendation: 'Lower bid or improve quality score'
        });
    }

    // Check CPM
    if (perf.cpm !== undefined && perf.cpm > benchmark.cpm * 1.5) {
        issues.push({
            severity: 'INFO',
            type: 'COST',
            placementId: placement.id,
            placementName: placement.vendor,
            message: `CPM of $${perf.cpm.toFixed(2)} is above benchmark ($${benchmark.cpm.toFixed(2)})`,
            currentValue: perf.cpm,
            benchmark: benchmark.cpm,
            recommendation: 'Consider alternative inventory or placements'
        });
    }

    return issues;
}

/**
 * Detect frequency capping issues
 */
function detectFrequencyIssues(placement: Placement, benchmark: any): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const perf = placement.performance;

    if (!perf || perf.frequency === undefined) return issues;

    if (perf.frequency > 10) {
        issues.push({
            severity: 'CRITICAL',
            type: 'FREQUENCY',
            placementId: placement.id,
            placementName: placement.vendor,
            message: `Frequency of ${perf.frequency.toFixed(1)} indicates severe ad fatigue`,
            currentValue: perf.frequency,
            benchmark: benchmark.frequency,
            recommendation: 'Add frequency cap of 5 per week'
        });
    } else if (perf.frequency > 8) {
        issues.push({
            severity: 'WARNING',
            type: 'FREQUENCY',
            placementId: placement.id,
            placementName: placement.vendor,
            message: `Frequency of ${perf.frequency.toFixed(1)} may cause ad fatigue`,
            currentValue: perf.frequency,
            benchmark: benchmark.frequency,
            recommendation: 'Add frequency cap or refresh creative'
        });
    }

    return issues;
}

/**
 * Detect pacing issues
 */
function detectPacingIssues(placement: Placement): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const perf = placement.performance;

    if (!perf || perf.pacing === undefined) return issues;

    // Assuming pacing is a percentage (0-100)
    // If we're at 80% of time but only 20% delivery = underpacing
    // For this simplified version, just check absolute pacing

    if (perf.pacing < 25) {
        issues.push({
            severity: 'WARNING',
            type: 'PACING',
            placementId: placement.id,
            placementName: placement.vendor,
            message: `Pacing at ${perf.pacing}% - severely underpacing`,
            currentValue: perf.pacing,
            benchmark: 100,
            recommendation: 'Increase bids or expand targeting to improve delivery'
        });
    } else if (perf.pacing > 150) {
        issues.push({
            severity: 'WARNING',
            type: 'PACING',
            placementId: placement.id,
            placementName: placement.vendor,
            message: `Pacing at ${perf.pacing}% - burning budget too fast`,
            currentValue: perf.pacing,
            benchmark: 100,
            recommendation: 'Lower bids or tighten targeting to pace evenly'
        });
    }

    return issues;
}

/**
 * Detect budget concentration issues
 */
function detectBudgetConcentration(placements: Placement[], totalBudget: number): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    // Calculate spend by channel
    const channelSpend: Record<string, number> = {};
    placements.forEach(p => {
        channelSpend[p.channel] = (channelSpend[p.channel] || 0) + p.totalCost;
    });

    // Check if any channel has >60% of budget
    Object.entries(channelSpend).forEach(([channel, spend]) => {
        const percentage = (spend / totalBudget) * 100;
        if (percentage > 60) {
            issues.push({
                severity: 'WARNING',
                type: 'BUDGET',
                placementId: 'PLAN_LEVEL',
                placementName: 'Overall Plan',
                message: `${channel} has ${percentage.toFixed(0)}% of budget - risk concentration`,
                currentValue: percentage,
                benchmark: 50,
                recommendation: 'Diversify across more channels to reduce risk'
            });
        }
    });

    return issues;
}

/**
 * Get a simple text summary of the analysis
 */
export function getAnalysisSummary(analysis: PlanAnalysis): string {
    const { overallScore, criticalCount, warningCount, totalWaste, totalOpportunity } = analysis;

    let scoreLabel = 'Excellent';
    if (overallScore < 50) scoreLabel = 'Needs Attention';
    else if (overallScore < 70) scoreLabel = 'Fair';
    else if (overallScore < 85) scoreLabel = 'Good';

    const parts = [
        `Plan Score: ${overallScore}/100 (${scoreLabel})`
    ];

    if (criticalCount > 0) {
        parts.push(`🚨 ${criticalCount} critical issue${criticalCount > 1 ? 's' : ''}`);
    }
    if (warningCount > 0) {
        parts.push(`⚠️ ${warningCount} warning${warningCount > 1 ? 's' : ''}`);
    }

    if (totalWaste > 0) {
        parts.push(`💸 Estimated waste: $${Math.round(totalWaste).toLocaleString('en-US')}`);
    }
    if (totalOpportunity > 0) {
        parts.push(`✨ Growth opportunity: $${Math.round(totalOpportunity).toLocaleString('en-US')}`);
    }

    return parts.join(' • ');
}
