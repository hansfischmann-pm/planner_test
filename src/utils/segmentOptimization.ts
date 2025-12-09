import { Segment } from '../types';
import { calculateUniqueReach } from './audienceInsights';

/**
 * Find the optimal set of segments to remove to maximize reach efficiency
 * Uses a greedy algorithm to iteratively remove the segment that gives the best improvement
 */
export function findOptimalSegmentsToRemove(
    currentSegments: Segment[],
    maxToRemove: number = 5
): Segment[] {
    if (currentSegments.length <= 2) return []; // Need at least 3 to optimize

    const segmentsToRemove: Segment[] = [];
    let remainingSegments = [...currentSegments];

    for (let iteration = 0; iteration < maxToRemove && remainingSegments.length > 2; iteration++) {
        let bestRemovalIndex = -1;
        let bestEfficiencyGain = 0;
        let currentEfficiency = calculateEfficiency(remainingSegments);

        // Try removing each segment and see which gives best improvement
        for (let i = 0; i < remainingSegments.length; i++) {
            const testSegments = remainingSegments.filter((_, idx) => idx !== i);
            const testEfficiency = calculateEfficiency(testSegments);
            const gain = testEfficiency - currentEfficiency;

            if (gain > bestEfficiencyGain) {
                bestEfficiencyGain = gain;
                bestRemovalIndex = i;
            }
        }

        // If we found an improvement, remove that segment
        if (bestRemovalIndex >= 0 && bestEfficiencyGain > 0.01) { // At least 1% improvement
            segmentsToRemove.push(remainingSegments[bestRemovalIndex]);
            remainingSegments = remainingSegments.filter((_, idx) => idx !== bestRemovalIndex);
        } else {
            // No more improvements possible
            break;
        }
    }

    return segmentsToRemove;
}

/**
 * Calculate reach efficiency for a set of segments
 */
function calculateEfficiency(segments: Segment[]): number {
    if (segments.length === 0) return 0;

    const uniqueReach = calculateUniqueReach(segments);
    const totalReach = segments.reduce((sum, s) => sum + (s.reach || 0), 0);

    return totalReach > 0 ? (uniqueReach / totalReach) : 0;
}

/**
 * Calculate average overlap for a segment against all others
 */
export function calculateAverageOverlap(_segment: Segment, otherSegments: Segment[], overlapMatrix: number[][], segmentIndex: number): number {
    if (otherSegments.length === 0) return 0;

    let totalOverlap = 0;
    let count = 0;

    otherSegments.forEach((_, otherIdx) => {
        if (otherIdx !== segmentIndex) {
            totalOverlap += overlapMatrix[segmentIndex]?.[otherIdx] || 0;
            count++;
        }
    });

    return count > 0 ? totalOverlap / count : 0;
}
