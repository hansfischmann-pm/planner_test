import {
    ConversionPath,
    AttributionModel,
    AttributionResult,
    Touchpoint
} from '../types';

/**
 * Attribution Engine
 * Calculates multi-touch attribution across conversion paths
 */
export class AttributionEngine {
    /**
     * Calculate attribution for all paths using specified model
     */
    calculateAttribution(
        paths: ConversionPath[],
        model: AttributionModel
    ): AttributionResult[] {
        // Aggregate credit by channel across all paths
        const channelCredits = new Map<string, {
            credit: number;
            revenue: number;
            cost: number;
            conversions: number;
            channelType: string;
        }>();

        // Process each conversion path
        paths.forEach(path => {
            const credits = this.getModelCredits(path, model);

            credits.forEach((credit, channelKey) => {
                const existing = channelCredits.get(channelKey) || {
                    credit: 0,
                    revenue: 0,
                    cost: 0,
                    conversions: 0,
                    channelType: path.touchpoints.find(t => this.getChannelKey(t) === channelKey)?.channelType || 'DISPLAY'
                };

                existing.credit += credit;
                existing.revenue += path.conversionValue * credit;
                existing.cost += path.touchpoints
                    .filter(t => this.getChannelKey(t) === channelKey)
                    .reduce((sum, t) => sum + t.cost, 0);
                existing.conversions += credit;

                channelCredits.set(channelKey, existing);
            });
        });

        // Convert to attribution results
        return Array.from(channelCredits.entries()).map(([channel, data]) => ({
            channel,
            channelType: data.channelType as any,
            model,
            credit: data.credit,
            revenue: data.revenue,
            cost: data.cost,
            roas: data.cost > 0 ? data.revenue / data.cost : 0,
            conversions: data.conversions
        }));
    }

    /**
     * Get channel key for grouping (using channel name)
     */
    private getChannelKey(touchpoint: Touchpoint): string {
        return touchpoint.channel;
    }

    /**
     * Get model-specific credits for a single path
     */
    private getModelCredits(path: ConversionPath, model: AttributionModel): Map<string, number> {
        switch (model) {
            case 'FIRST_TOUCH':
                return this.firstTouch(path);
            case 'LAST_TOUCH':
                return this.lastTouch(path);
            case 'LINEAR':
                return this.linear(path);
            case 'TIME_DECAY':
                return this.timeDecay(path);
            case 'POSITION_BASED':
                return this.positionBased(path);
            default:
                return this.linear(path);
        }
    }

    /**
     * First-touch: 100% credit to first touchpoint
     */
    private firstTouch(path: ConversionPath): Map<string, number> {
        const credits = new Map<string, number>();
        if (path.touchpoints.length > 0) {
            const firstTouch = path.touchpoints[0];
            credits.set(this.getChannelKey(firstTouch), 1.0);
        }
        return credits;
    }

    /**
     * Last-touch: 100% credit to last touchpoint
     */
    private lastTouch(path: ConversionPath): Map<string, number> {
        const credits = new Map<string, number>();
        if (path.touchpoints.length > 0) {
            const lastTouch = path.touchpoints[path.touchpoints.length - 1];
            credits.set(this.getChannelKey(lastTouch), 1.0);
        }
        return credits;
    }

    /**
     * Linear: Equal credit across all touchpoints
     */
    private linear(path: ConversionPath): Map<string, number> {
        const credits = new Map<string, number>();
        const creditPerTouch = 1.0 / path.touchpoints.length;

        path.touchpoints.forEach(touch => {
            const key = this.getChannelKey(touch);
            credits.set(key, (credits.get(key) || 0) + creditPerTouch);
        });

        return credits;
    }

    /**
     * Time-decay: More recent touchpoints get more credit
     * Uses exponential decay with half-life of 7 days
     */
    private timeDecay(path: ConversionPath): Map<string, number> {
        const credits = new Map<string, number>();
        const conversionTime = new Date(path.conversionDate).getTime();
        const halfLifeMs = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

        // Calculate decay factor for each touchpoint
        let totalWeight = 0;
        const weights: number[] = [];

        path.touchpoints.forEach(touch => {
            const touchTime = new Date(touch.timestamp).getTime();
            const timeGap = conversionTime - touchTime;
            const weight = Math.exp(-timeGap / halfLifeMs);
            weights.push(weight);
            totalWeight += weight;
        });

        // Normalize weights to sum to 1.0
        path.touchpoints.forEach((touch, index) => {
            const key = this.getChannelKey(touch);
            const credit = weights[index] / totalWeight;
            credits.set(key, (credits.get(key) || 0) + credit);
        });

        return credits;
    }

    /**
     * Position-based: 40% first, 40% last, 20% divided among middle
     */
    private positionBased(path: ConversionPath): Map<string, number> {
        const credits = new Map<string, number>();

        if (path.touchpoints.length === 1) {
            // Only one touchpoint, gets 100%
            credits.set(this.getChannelKey(path.touchpoints[0]), 1.0);
        } else if (path.touchpoints.length === 2) {
            // Two touchpoints, 40% each (skip middle allocation)
            credits.set(this.getChannelKey(path.touchpoints[0]), 0.4);
            credits.set(this.getChannelKey(path.touchpoints[1]), 0.4);
        } else {
            // Three or more touchpoints
            const firstKey = this.getChannelKey(path.touchpoints[0]);
            const lastKey = this.getChannelKey(path.touchpoints[path.touchpoints.length - 1]);

            // 40% to first
            credits.set(firstKey, (credits.get(firstKey) || 0) + 0.4);

            // 40% to last
            credits.set(lastKey, (credits.get(lastKey) || 0) + 0.4);

            // 20% divided among middle touchpoints
            const middleTouchpoints = path.touchpoints.slice(1, -1);
            const creditPerMiddle = 0.2 / middleTouchpoints.length;

            middleTouchpoints.forEach(touch => {
                const key = this.getChannelKey(touch);
                credits.set(key, (credits.get(key) || 0) + creditPerMiddle);
            });
        }

        return credits;
    }

    /**
     * Compare attribution results across all models
     */
    compareModels(paths: ConversionPath[]): Map<AttributionModel, AttributionResult[]> {
        const models: AttributionModel[] = [
            'FIRST_TOUCH',
            'LAST_TOUCH',
            'LINEAR',
            'TIME_DECAY',
            'POSITION_BASED'
        ];

        const results = new Map<AttributionModel, AttributionResult[]>();

        models.forEach(model => {
            results.set(model, this.calculateAttribution(paths, model));
        });

        return results;
    }
}
