import { Segment, Placement, PerformanceMetrics } from '../types';

// ============================================================================
// OVERLAP CALCULATIONS
// ============================================================================

/**
 * Calculate overlap percentage between two segments
 * Returns a value between 0 and 1 representing the percentage of overlap
 */
export function calculateOverlap(segment1: Segment, segment2: Segment): number {
    // Same segment = 100% overlap
    if (segment1.id === segment2.id) return 1.0;

    // Demographics have high overlap with each other
    if (segment1.category === 'Demographics' && segment2.category === 'Demographics') {
        return 0.6 + Math.random() * 0.3; // 60-90% overlap
    }

    // Behavioral overlaps moderately with interest
    if ((segment1.category === 'Behavioral' && segment2.category === 'Interest') ||
        (segment1.category === 'Interest' && segment2.category === 'Behavioral')) {
        return 0.3 + Math.random() * 0.3; // 30-60% overlap
    }

    // B2B has low overlap with consumer segments
    if ((segment1.category === 'B2B' && segment2.category !== 'B2B') ||
        (segment2.category === 'B2B' && segment1.category !== 'B2B')) {
        return 0.05 + Math.random() * 0.15; // 5-20% overlap
    }

    // First-party and Pixel-based have minimal overlap with third-party
    if ((segment1.category === 'First-Party' || segment1.category === 'Pixel-Based') &&
        (segment2.category !== 'First-Party' && segment2.category !== 'Pixel-Based')) {
        return 0.1 + Math.random() * 0.2; // 10-30% overlap
    }

    // Default moderate overlap
    return 0.2 + Math.random() * 0.4; // 20-60% overlap
}

/**
 * Calculate unique reach across multiple segments accounting for overlap
 */
export function calculateUniqueReach(segments: Segment[]): number {
    if (segments.length === 0) return 0;
    if (segments.length === 1) return segments[0].reach || 0;

    // Start with first segment's reach
    let uniqueReach = segments[0].reach || 0;

    // Add each subsequent segment, accounting for overlap
    for (let i = 1; i < segments.length; i++) {
        const currentSegment = segments[i];

        // Calculate average overlap with all previous segments
        let avgOverlap = 0;
        for (let j = 0; j < i; j++) {
            avgOverlap += calculateOverlap(segments[j], currentSegment);
        }
        avgOverlap /= i;

        // Add reach accounting for overlap
        const additionalReach = (currentSegment.reach || 0) * (1 - avgOverlap);
        uniqueReach += additionalReach;
    }

    return Math.floor(uniqueReach);
}

/**
 * Calculate overlap matrix for multiple segments
 */
export function calculateOverlapMatrix(segments: Segment[]): number[][] {
    const matrix: number[][] = [];
    for (let i = 0; i < segments.length; i++) {
        matrix[i] = [];
        for (let j = 0; j < segments.length; j++) {
            matrix[i][j] = calculateOverlap(segments[i], segments[j]);
        }
    }
    return matrix;
}

// ============================================================================
// PERFORMANCE AGGREGATION
// ============================================================================

export interface SegmentPerformance {
    segment: Segment;
    impressions: number;
    clicks: number;
    conversions: number;
    spend: number;
    placements: number;
    ctr: number;
    cvr: number;
    cpa: number;
    cpm: number;
    roas: number;
}

/**
 * Aggregate performance metrics by segment across all placements
 */
export function aggregateSegmentPerformance(placements: Placement[]): Map<string, SegmentPerformance> {
    const segmentMap = new Map<string, SegmentPerformance>();

    placements.forEach(placement => {
        // Only process placements with performance data
        const perf = placement.performance;
        const segs = placement.segments;
        if (!perf || !segs) return;

        segs.forEach(segment => {
            if (!segmentMap.has(segment.id)) {
                segmentMap.set(segment.id, {
                    segment,
                    impressions: 0,
                    clicks: 0,
                    conversions: 0,
                    spend: 0,
                    placements: 0,
                    ctr: 0,
                    cvr: 0,
                    cpa: 0,
                    cpm: 0,
                    roas: 0
                });
            }

            const metrics = segmentMap.get(segment.id)!;

            // Divide performance proportionally among segments on this placement
            const segmentCount = segs.length;
            metrics.impressions += (perf.impressions || 0) / segmentCount;
            metrics.clicks += (perf.clicks || 0) / segmentCount;
            metrics.conversions += (perf.conversions || 0) / segmentCount;
            metrics.spend += (placement.totalCost || 0) / segmentCount;
            metrics.placements += 1;
        });
    });

    // Calculate derived metrics
    segmentMap.forEach(metrics => {
        metrics.ctr = metrics.impressions > 0 ? metrics.clicks / metrics.impressions : 0;
        metrics.cvr = metrics.clicks > 0 ? metrics.conversions / metrics.clicks : 0;
        metrics.cpa = metrics.conversions > 0 ? metrics.spend / metrics.conversions : 0;
        metrics.cpm = metrics.impressions > 0 ? (metrics.spend / metrics.impressions) * 1000 : 0;
        // Assume $50 average order value for ROAS
        metrics.roas = metrics.spend > 0 ? (metrics.conversions * 50) / metrics.spend : 0;
    });

    return segmentMap;
}

// ============================================================================
// LOOKALIKE RECOMMENDATIONS
// ============================================================================

export interface LookalikeRecommendation {
    segment: Segment;
    matchScore: number;
    reason: string;
}

/**
 * Find segments similar to a high-performing base segment
 */
export function findLookalikeSegments(
    baseSegment: Segment,
    allSegments: Segment[],
    currentSegments: Segment[]
): LookalikeRecommendation[] {

    const currentSegmentIds = new Set(currentSegments.map(s => s.id));

    return allSegments
        .filter(s => s.id !== baseSegment.id && !currentSegmentIds.has(s.id))
        .map(segment => {
            let matchScore = 0;

            // Same category = high match
            if (segment.category === baseSegment.category) {
                matchScore += 40;
            }

            // Similar CPM uplift = moderate match
            const cpmDiff = Math.abs(segment.cpmUplift - baseSegment.cpmUplift);
            if (cpmDiff < 1) matchScore += 30;
            else if (cpmDiff < 2) matchScore += 20;
            else if (cpmDiff < 4) matchScore += 10;

            // Similar reach = moderate match
            if (segment.reach && baseSegment.reach) {
                const reachRatio = segment.reach / baseSegment.reach;
                if (reachRatio > 0.5 && reachRatio < 2) matchScore += 20;
            }

            // Same vendor = slight match
            if (segment.vendor && baseSegment.vendor && segment.vendor === baseSegment.vendor) {
                matchScore += 10;
            }

            return {
                segment,
                matchScore,
                reason: generateLookalikeReason(segment, baseSegment, matchScore)
            };
        })
        .filter(rec => rec.matchScore > 30) // Only show good matches
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5); // Top 5
}

function generateLookalikeReason(segment: Segment, base: Segment, score: number): string {
    if (segment.category === base.category && score > 60) {
        return `Similar ${base.category.toLowerCase()} profile`;
    }
    if (Math.abs(segment.cpmUplift - base.cpmUplift) < 1) {
        return `Comparable pricing and quality`;
    }
    if (segment.vendor === base.vendor) {
        return `Same data provider: ${segment.vendor}`;
    }
    return `Related audience characteristics`;
}

// ============================================================================
// EXPANSION RECOMMENDATIONS
// ============================================================================

export interface ExpansionRecommendation {
    goal: 'INCREASE_REACH' | 'REDUCE_CPA' | 'IMPROVE_CVR' | 'INCREASE_CONVERSIONS';
    impact: string;
    segments: Segment[];
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    explanation: string;
}

export interface CampaignGoals {
    impressions?: number;
    reach?: number;
    conversions?: number;
    clicks?: number;
    targetCPA?: number;
}

/**
 * Generate recommendations for expanding audience to meet campaign goals
 */
export function generateExpansionRecommendations(
    currentSegments: Segment[],
    goals: CampaignGoals,
    currentPerformance: PerformanceMetrics,
    allSegments: Segment[]
): ExpansionRecommendation[] {
    const recommendations: ExpansionRecommendation[] = [];
    const currentSegmentIds = new Set(currentSegments.map(s => s.id));
    const availableSegments = allSegments.filter(s => !currentSegmentIds.has(s.id));

    // Goal: Increase reach
    if (goals.reach && currentPerformance.impressions > 0) {
        // Calculate approximate current reach (40% of impressions)
        const currentReach = currentPerformance.impressions * 0.4;
        if (currentReach < goals.reach) {
            const gap = goals.reach - currentReach;
            const broadSegments = availableSegments
                .filter(s => (s.reach || 0) > 1000000) // Large reach segments
                .sort((a, b) => (b.reach || 0) - (a.reach || 0))
                .slice(0, 3);

            if (broadSegments.length > 0) {
                recommendations.push({
                    goal: 'INCREASE_REACH',
                    impact: `Add ${(gap / 1000000).toFixed(1)}M reach`,
                    segments: broadSegments,
                    priority: 'HIGH',
                    explanation: `You're ${((gap / goals.reach) * 100).toFixed(0)}% short of your reach goal. These broad segments can help close the gap.`
                });
            }
        }
    }

    // Goal: Reduce CPA
    if (currentPerformance.cpa > 0) {
        const targetCPA = goals.targetCPA || 50;
        if (currentPerformance.cpa > targetCPA * 1.2) { // 20% over target
            const efficientSegments = availableSegments
                .filter(s => s.cpmUplift < 2) // Low cost segments
                .sort((a, b) => a.cpmUplift - b.cpmUplift)
                .slice(0, 3);

            if (efficientSegments.length > 0) {
                recommendations.push({
                    goal: 'REDUCE_CPA',
                    impact: `Potentially reduce CPA by 15-25%`,
                    segments: efficientSegments,
                    priority: 'HIGH',
                    explanation: `Current CPA ($${currentPerformance.cpa.toFixed(2)}) is above target. These cost-efficient segments can lower your average CPA.`
                });
            }
        }
    }

    // Goal: Improve conversion rate
    if (goals.conversions && currentPerformance.cvr < 0.03) {
        const highIntentSegments = availableSegments
            .filter(s => s.category === 'Behavioral' || s.category === 'B2B') // High intent
            .sort((a, b) => b.cpmUplift - a.cpmUplift) // Higher cost usually = higher intent
            .slice(0, 3);

        if (highIntentSegments.length > 0) {
            recommendations.push({
                goal: 'IMPROVE_CVR',
                impact: `Target high-intent audiences`,
                segments: highIntentSegments,
                priority: 'MEDIUM',
                explanation: `Current CVR is ${(currentPerformance.cvr * 100).toFixed(2)}%. These high-intent segments typically convert 2-3x better.`
            });
        }
    }

    // Goal: Increase total conversions
    if (goals.conversions && currentPerformance.conversions < goals.conversions) {
        const gap = goals.conversions - currentPerformance.conversions;
        const balancedSegments = availableSegments
            .filter(s => s.cpmUplift > 1 && s.cpmUplift < 4) // Mid-range quality
            .filter(s => (s.reach || 0) > 500000) // Decent reach
            .slice(0, 3);

        if (balancedSegments.length > 0) {
            recommendations.push({
                goal: 'INCREASE_CONVERSIONS',
                impact: `Close ${gap} conversion gap`,
                segments: balancedSegments,
                priority: 'HIGH',
                explanation: `You need ${gap} more conversions to hit your goal. These balanced segments offer good reach and quality.`
            });
        }
    }

    return recommendations.sort((a, b) => {
        const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
}
