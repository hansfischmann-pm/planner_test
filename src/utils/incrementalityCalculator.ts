import { IncrementalityTest } from '../types';

export interface IncrementalityResult {
    lift: number;              // % increase in conversions
    liftAbsolute: number;      // Absolute increase in conversions
    confidence: number;        // 0-1 (e.g., 0.95 = 95% confidence)
    isSignificant: boolean;    // p < 0.05
    pValue: number;           // Statistical p-value
    recommendation: 'SCALE_UP' | 'SCALE_DOWN' | 'MAINTAIN' | 'MORE_DATA_NEEDED';
}

/**
 * Calculate incrementality metrics from A/B test data
 */
export function calculateIncrementality(test: IncrementalityTest): IncrementalityResult {
    const { controlGroup, testGroup } = test;

    // Calculate lift based on Conversion Volume (Standard A/B Test Lift)
    // Formula: (Test - Control) / Control
    const liftAbsolute = testGroup.conversions - controlGroup.conversions;
    const lift = controlGroup.conversions > 0
        ? (liftAbsolute / controlGroup.conversions) * 100
        : 0;

    // Simple z-test for statistical significance
    // In production, would use more sophisticated tests
    const { pValue, isSignificant } = calculateSignificance(
        controlGroup.conversions,
        testGroup.conversions,
        controlGroup.spend,
        testGroup.spend
    );

    // Calculate confidence (1 - p-value)
    const confidence = 1 - pValue;

    // Determine recommendation
    let recommendation: IncrementalityResult['recommendation'];

    if (!isSignificant) {
        recommendation = 'MORE_DATA_NEEDED';
    } else if (lift > 20) {
        recommendation = 'SCALE_UP';
    } else if (lift < -10) {
        recommendation = 'SCALE_DOWN';
    } else {
        recommendation = 'MAINTAIN';
    }

    return {
        lift,
        liftAbsolute,
        confidence,
        isSignificant,
        pValue,
        recommendation
    };
}

/**
 * Calculate statistical significance using z-test
 * Simplified implementation for demo purposes
 */
function calculateSignificance(
    controlConversions: number,
    testConversions: number,
    controlSpend: number,
    testSpend: number
): { pValue: number; isSignificant: boolean } {
    let z = 0;

    // SCENARIO 1: Holdout Test (Control Spend is 0)
    // We compare raw conversion counts using a difference of means test (Poisson approximation)
    if (controlSpend === 0) {
        // Standard Error for difference of two counts
        const se = Math.sqrt(controlConversions + testConversions);

        // Avoid division by zero
        if (se > 0) {
            z = Math.abs(testConversions - controlConversions) / se;
        }
    }
    // SCENARIO 2: A/B Test (Both have spend)
    // We compare Conversion Rate per Dollar (Efficiency)
    else {
        // Calculate proportions (Conversions per Spend)
        const p1 = controlConversions / controlSpend;
        const p2 = testSpend > 0 ? testConversions / testSpend : 0;

        // Pooled proportion
        const pPool = (controlConversions + testConversions) / (controlSpend + testSpend);

        // Standard error
        const se = Math.sqrt(pPool * (1 - pPool) * (1 / controlSpend + 1 / testSpend));

        // Z-score
        z = se > 0 ? Math.abs(p1 - p2) / se : 0;
    }

    // Approximate p-value from z-score (two-tailed)
    const pValue = z > 0 ? 2 * (1 - normalCDF(z)) : 1.0;

    return {
        pValue: Math.max(0.001, Math.min(1.0, pValue)), // Clamp between 0.001 and 1.0
        isSignificant: pValue < 0.05 // 95% Confidence
    };
}

/**
 * Normal cumulative distribution function approximation
 */
function normalCDF(x: number): number {
    // Abramowitz and Stegun approximation
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

    return x > 0 ? 1 - p : p;
}

/**
 * Format lift percentage for display
 */
export function formatLift(lift: number): string {
    const sign = lift >= 0 ? '+' : '';
    return `${sign}${lift.toFixed(1)}%`;
}

/**
 * Get recommendation message
 */
export function getRecommendationMessage(recommendation: IncrementalityResult['recommendation']): string {
    switch (recommendation) {
        case 'SCALE_UP':
            return 'Strong positive lift detected. Consider increasing investment.';
        case 'SCALE_DOWN':
            return 'Negative lift detected. Consider reducing or pausing investment.';
        case 'MAINTAIN':
            return 'Modest positive lift. Continue monitoring performance.';
        case 'MORE_DATA_NEEDED':
            return 'Results not statistically significant. Collect more data before making changes.';
    }
}
