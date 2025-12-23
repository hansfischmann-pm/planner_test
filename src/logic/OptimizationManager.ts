/**
 * OptimizationManager - Handles campaign optimization commands
 *
 * This module extracts optimization-related commands from AgentBrain,
 * including quick wins, critical issues, pause/scale actions, and full reports.
 */

import { AgentMessage, MediaPlan, Placement } from '../types';
import { createAgentMessage, AgentContext } from './AgentContext';
import { generateOptimizationReport, formatOptimizationReport } from '../utils/optimizationEngine';
import { analyzePlan, getAnalysisSummary } from '../utils/performanceAnalyzer';
import { calculatePlanMetrics } from './dummyData';

export type PendingActionType = 'PAUSE_UNDERPERFORMERS' | 'SCALE_WINNERS' | 'APPLY_OPTIMIZATION';

export interface PendingAction {
    type: PendingActionType;
    description: string;
    details: string[];
    estimatedImpact: number;
    data?: any;
}

export interface OptimizationCommandResult {
    handled: boolean;
    response?: AgentMessage;
    updatedPlan?: MediaPlan;
    pendingAction?: PendingAction;
}

// Default flight budget for calculations
const DEFAULT_FLIGHT_BUDGET = 100000;

/**
 * Check if input is an optimization-related command
 */
export function isOptimizationCommand(input: string): boolean {
    const lowerInput = input.toLowerCase();
    return lowerInput.includes('optimize') ||
           lowerInput.includes('quick win') ||
           lowerInput.includes('critical issue') ||
           (lowerInput.includes('pause') && lowerInput.includes('underperform')) ||
           (lowerInput.includes('scale') && lowerInput.includes('winner')) ||
           lowerInput.includes('growth opportunit') ||
           lowerInput.includes('apply all') ||
           lowerInput.includes('apply recommendation') ||
           lowerInput.includes('detailed report') ||
           lowerInput.includes('full report') ||
           (lowerInput.includes('plan') && (lowerInput.includes('score') || lowerInput.includes('health') || lowerInput.includes('grade'))) ||
           (lowerInput.includes('what') && (lowerInput.includes('wrong') || lowerInput.includes('issue'))) ||
           lowerInput.includes('improvement') ||
           lowerInput.includes('opportunities');
}

/**
 * Handle "show quick wins"
 */
function handleQuickWins(placements: Placement[]): AgentMessage {
    const report = generateOptimizationReport(placements, DEFAULT_FLIGHT_BUDGET);

    if (report.quickWins.length === 0) {
        return createAgentMessage(
            "No quick wins needed - your plan is well-optimized!\n\nTry 'optimize my plan' for a full analysis.",
            ['Optimize my plan']
        );
    }

    let responseContent = `**Quick Wins** (${report.quickWins.length} easy, high-impact actions)\n\n`;
    report.quickWins.forEach((rec, idx) => {
        const impact = rec.estimatedImpact > 0
            ? `Save $${Math.round(rec.estimatedImpact).toLocaleString('en-US')}`
            : `Gain $${Math.round(Math.abs(rec.estimatedImpact)).toLocaleString('en-US')}`;
        responseContent += `${idx + 1}. ${rec.description}\n`;
        responseContent += `   ${rec.specificAction}\n`;
        responseContent += `   ${impact}\n\n`;
    });

    return createAgentMessage(responseContent, ['Optimize my plan']);
}

/**
 * Handle "show critical issues"
 */
function handleCriticalIssues(placements: Placement[]): AgentMessage {
    const report = generateOptimizationReport(placements, DEFAULT_FLIGHT_BUDGET);
    const critical = report.recommendations.filter(r => r.priority === 'HIGH');

    if (critical.length === 0) {
        return createAgentMessage(
            "No critical issues found - great job!\n\nYour plan is in good shape.",
            ['Show full report']
        );
    }

    let responseContent = `**Critical Issues** (${critical.length})\n\n`;
    critical.forEach((rec, idx) => {
        const impact = rec.estimatedImpact > 0
            ? `Save $${Math.round(rec.estimatedImpact).toLocaleString('en-US')}`
            : `Gain $${Math.round(Math.abs(rec.estimatedImpact)).toLocaleString('en-US')}`;
        responseContent += `${idx + 1}. **${rec.placementName}**\n`;
        responseContent += `   Issue: ${rec.description}\n`;
        responseContent += `   Action: ${rec.specificAction}\n`;
        responseContent += `   ${impact}\n\n`;
    });

    return createAgentMessage(responseContent, ['Show full report', 'Show quick wins']);
}

/**
 * Handle "pause underperformers" - returns pending action for confirmation
 */
function handlePauseUnderperformers(placements: Placement[], _expressMode: boolean = false): OptimizationCommandResult {
    const report = generateOptimizationReport(placements, DEFAULT_FLIGHT_BUDGET);
    const pauseRecs = report.recommendations.filter(r =>
        r.action === 'PAUSE' || r.action === 'REDUCE_BUDGET'
    );

    let totalSavings = 0;
    const pausePreview: { placementId: string; name: string; roas: number }[] = [];

    pauseRecs.forEach(rec => {
        const placement = placements.find(p =>
            p.vendor === rec.placementName || p.id === rec.placementId
        );
        if (placement && placement.performance && placement.performance.status !== 'PAUSED') {
            totalSavings += rec.estimatedImpact;
            pausePreview.push({
                placementId: placement.id,
                name: placement.vendor,
                roas: placement.performance.roas
            });
        }
    });

    if (pausePreview.length === 0) {
        return {
            handled: true,
            response: createAgentMessage(
                "No placements qualified for pausing.\n\nAll your placements are performing well.",
                ['Optimize', 'Show performance']
            )
        };
    }

    // If express mode, execute immediately (handled by caller)
    // Otherwise, return pending action for confirmation
    const pendingAction: PendingAction = {
        type: 'PAUSE_UNDERPERFORMERS',
        description: `Pause ${pausePreview.length} underperforming placement${pausePreview.length > 1 ? 's' : ''}`,
        details: pausePreview.map(p => `${p.name} (ROAS: ${p.roas.toFixed(2)})`),
        estimatedImpact: totalSavings,
        data: { pausePreview, totalSavings }
    };

    let responseContent = `**Confirm: Pause ${pausePreview.length} underperforming placement${pausePreview.length > 1 ? 's' : ''}?**\n\n`;
    responseContent += `**Placements to pause:**\n`;
    pausePreview.forEach(p => {
        responseContent += `  - ${p.name} (ROAS: ${p.roas.toFixed(2)})\n`;
    });
    responseContent += `\n**Estimated savings:** $${Math.round(totalSavings).toLocaleString('en-US')}\n\n`;
    responseContent += `Type **"yes"** to confirm or **"no"** to cancel.`;

    const msg = createAgentMessage(responseContent, ['Yes', 'No']);
    msg.agentsInvoked = ['Performance Agent', 'Insights Agent'];

    return {
        handled: true,
        response: msg,
        pendingAction
    };
}

/**
 * Handle "scale winners" - returns pending action for confirmation
 */
function handleScaleWinners(placements: Placement[], _expressMode: boolean = false): OptimizationCommandResult {
    const report = generateOptimizationReport(placements, DEFAULT_FLIGHT_BUDGET);
    const scaleRecs = report.recommendations.filter(r => r.action === 'INCREASE_BUDGET');

    let totalBudgetIncrease = 0;
    const scalePreview: { placementId: string; name: string; roas: number; currentCost: number; newCost: number }[] = [];

    scaleRecs.forEach(rec => {
        const placement = placements.find(p =>
            p.vendor === rec.placementName || p.id === rec.placementId
        );
        if (placement) {
            const increase = placement.totalCost * 0.25;
            totalBudgetIncrease += increase;
            scalePreview.push({
                placementId: placement.id,
                name: placement.vendor,
                roas: placement.performance?.roas || 0,
                currentCost: placement.totalCost,
                newCost: placement.totalCost * 1.25
            });
        }
    });

    if (scalePreview.length === 0) {
        return {
            handled: true,
            response: createAgentMessage(
                "No placements qualified for scaling (need ROAS > 3.0).\n\nYour high performers may already be well-funded.",
                ['Optimize', 'Show performance']
            )
        };
    }

    const pendingAction: PendingAction = {
        type: 'SCALE_WINNERS',
        description: `Scale ${scalePreview.length} high-performing placement${scalePreview.length > 1 ? 's' : ''} (+25%)`,
        details: scalePreview.map(p => `${p.name} (ROAS: ${p.roas.toFixed(2)}) - $${Math.round(p.currentCost).toLocaleString()} → $${Math.round(p.newCost).toLocaleString()}`),
        estimatedImpact: totalBudgetIncrease,
        data: { scalePreview, totalBudgetIncrease }
    };

    let responseContent = `**Confirm: Scale ${scalePreview.length} high-performing placement${scalePreview.length > 1 ? 's' : ''}?**\n\n`;
    responseContent += `**Placements to scale (+25% budget & impressions):**\n`;
    scalePreview.forEach(p => {
        responseContent += `  - ${p.name} (ROAS: ${p.roas.toFixed(2)}) - $${Math.round(p.currentCost).toLocaleString()} → $${Math.round(p.newCost).toLocaleString()}\n`;
    });
    responseContent += `\n**Total budget increase:** $${Math.round(totalBudgetIncrease).toLocaleString('en-US')}\n\n`;
    responseContent += `Type **"yes"** to confirm or **"no"** to cancel.`;

    const msg = createAgentMessage(responseContent, ['Yes', 'No']);
    msg.agentsInvoked = ['Performance Agent', 'Yield Agent'];

    return {
        handled: true,
        response: msg,
        pendingAction
    };
}

/**
 * Handle "growth opportunities"
 */
function handleGrowthOpportunities(placements: Placement[]): AgentMessage {
    const report = generateOptimizationReport(placements, DEFAULT_FLIGHT_BUDGET);
    const opportunities = report.recommendations.filter(r => r.estimatedImpact < 0);

    if (opportunities.length === 0) {
        return createAgentMessage(
            "No major growth opportunities identified right now.\n\nYour high performers are already well-funded.",
            ['Show full report']
        );
    }

    let responseContent = `**Growth Opportunities** (${opportunities.length})\n\n`;
    responseContent += `Scale these high-performers to maximize returns:\n\n`;
    opportunities.forEach((rec, idx) => {
        const gain = Math.abs(rec.estimatedImpact);
        responseContent += `${idx + 1}. **${rec.placementName}**\n`;
        responseContent += `   ${rec.currentMetric}\n`;
        responseContent += `   Action: ${rec.specificAction}\n`;
        responseContent += `   Potential gain: $${Math.round(gain).toLocaleString('en-US')}\n\n`;
    });

    return createAgentMessage(responseContent, ['Scale winners', 'Show full report']);
}

/**
 * Handle "apply all recommendations"
 */
function handleApplyAll(plan: MediaPlan): OptimizationCommandResult {
    const placements = plan.campaign.placements || [];
    const report = generateOptimizationReport(placements, DEFAULT_FLIGHT_BUDGET);

    let pausedCount = 0;
    let scaledCount = 0;
    let totalSavings = 0;
    let totalIncrease = 0;

    report.recommendations.forEach(rec => {
        const placement = placements.find(p =>
            p.vendor === rec.placementName || p.id === rec.placementId
        );
        if (!placement) return;

        if ((rec.action === 'PAUSE' || rec.action === 'REDUCE_BUDGET') && placement.performance) {
            placement.performance.status = 'PAUSED';
            totalSavings += rec.estimatedImpact;
            pausedCount++;
        } else if (rec.action === 'INCREASE_BUDGET') {
            const increase = placement.totalCost * 0.25;
            placement.totalCost = placement.totalCost * 1.25;
            placement.quantity = Math.floor(placement.quantity * 1.25);
            if (placement.forecast) {
                placement.forecast.impressions = Math.floor(placement.forecast.impressions * 1.25);
            }
            totalIncrease += increase;
            scaledCount++;
        }
    });

    // Recalculate plan metrics
    plan.totalSpend = placements.reduce((acc, p) => acc + p.totalCost, 0);
    plan.metrics = calculatePlanMetrics(placements);

    if (pausedCount === 0 && scaledCount === 0) {
        return {
            handled: true,
            response: createAgentMessage(
                "No actionable recommendations to apply right now. Your plan is already optimized!",
                ['Show performance', 'Export PDF']
            )
        };
    }

    let responseContent = `**Applied All Recommendations**\n\n`;
    if (pausedCount > 0) {
        responseContent += `- Paused **${pausedCount}** underperforming placement${pausedCount > 1 ? 's' : ''}\n`;
        responseContent += `  Estimated savings: $${Math.round(totalSavings).toLocaleString('en-US')}\n\n`;
    }
    if (scaledCount > 0) {
        responseContent += `- Scaled **${scaledCount}** high-performing placement${scaledCount > 1 ? 's' : ''}\n`;
        responseContent += `  Budget increase: $${Math.round(totalIncrease).toLocaleString('en-US')}\n\n`;
    }

    const msg = createAgentMessage(
        responseContent,
        ['Show performance', 'Undo', 'Export PDF']
    );
    msg.agentsInvoked = ['Performance Agent', 'Insights Agent', 'Yield Agent'];

    return {
        handled: true,
        response: msg,
        updatedPlan: plan
    };
}

/**
 * Handle "plan score" / "plan health"
 */
function handlePlanScore(placements: Placement[]): AgentMessage {
    const analysis = analyzePlan(placements, DEFAULT_FLIGHT_BUDGET);
    const summary = getAnalysisSummary(analysis);

    let responseContent = `**Plan Health Check**\n\n${summary}\n\n`;

    if (analysis.criticalCount > 0) {
        responseContent += `You have **${analysis.criticalCount} critical issue${analysis.criticalCount > 1 ? 's' : ''}** that need immediate attention.\n\n`;
    }

    if (analysis.overallScore < 70) {
        responseContent += `Your plan could benefit from optimization. Would you like me to show you specific recommendations?`;
    } else if (analysis.overallScore < 85) {
        responseContent += `Your plan is in good shape! There are a few minor optimizations that could improve performance.`;
    } else {
        responseContent += `Excellent work! Your plan is well-optimized. Keep monitoring for any changes.`;
    }

    return createAgentMessage(
        responseContent,
        ['Optimize my plan', 'Show detailed report']
    );
}

/**
 * Handle full optimization report
 */
function handleFullReport(placements: Placement[]): AgentMessage {
    const report = generateOptimizationReport(placements, DEFAULT_FLIGHT_BUDGET);
    const formattedReport = formatOptimizationReport(report, placements);

    // Build actionable suggested actions
    const suggestedActions: string[] = [];
    const pauseRecs = report.recommendations.filter(r => r.action === 'PAUSE' || r.action === 'REDUCE_BUDGET');
    const scaleRecs = report.recommendations.filter(r => r.action === 'INCREASE_BUDGET');

    if (pauseRecs.length > 0) suggestedActions.push('Pause underperformers');
    if (scaleRecs.length > 0) suggestedActions.push('Scale winners');
    if (report.recommendations.length > 0) suggestedActions.push('Apply all recommendations');

    return createAgentMessage(formattedReport, suggestedActions.slice(0, 3));
}

/**
 * Execute pause underperformers (after confirmation)
 */
export function executePauseUnderperformers(
    plan: MediaPlan,
    pausePreview: { placementId: string; name: string; roas: number }[],
    totalSavings: number
): OptimizationCommandResult {
    const placements = plan.campaign.placements || [];
    let pausedCount = 0;
    const pausedPlacements: string[] = [];

    pausePreview.forEach(preview => {
        const placement = placements.find(p => p.id === preview.placementId);
        if (placement && placement.performance && placement.performance.status !== 'PAUSED') {
            placement.performance.status = 'PAUSED';
            pausedPlacements.push(`${preview.name} (ROAS: ${preview.roas.toFixed(2)})`);
            pausedCount++;
        }
    });

    plan.totalSpend = placements.reduce((acc, p) => acc + p.totalCost, 0);
    plan.metrics = calculatePlanMetrics(placements);

    let responseContent = `**Paused ${pausedCount} underperforming placement${pausedCount > 1 ? 's' : ''}**\n\n`;
    responseContent += `**Placements paused:**\n`;
    pausedPlacements.forEach(name => {
        responseContent += `  - ${name}\n`;
    });
    responseContent += `\n**Estimated savings:** $${Math.round(totalSavings).toLocaleString('en-US')}`;

    const msg = createAgentMessage(
        responseContent,
        ['Scale winners', 'Show performance', 'Undo']
    );
    msg.agentsInvoked = ['Performance Agent', 'Insights Agent'];

    return {
        handled: true,
        response: msg,
        updatedPlan: plan
    };
}

/**
 * Execute scale winners (after confirmation)
 */
export function executeScaleWinners(
    plan: MediaPlan,
    scalePreview: { placementId: string; name: string; roas: number; currentCost: number; newCost: number }[],
    totalBudgetIncrease: number
): OptimizationCommandResult {
    const placements = plan.campaign.placements || [];
    let scaledCount = 0;
    const scaledPlacements: string[] = [];

    scalePreview.forEach(preview => {
        const placement = placements.find(p => p.id === preview.placementId);
        if (placement) {
            placement.totalCost = preview.newCost;
            placement.quantity = Math.floor(placement.quantity * 1.25);
            if (placement.forecast) {
                placement.forecast.impressions = Math.floor(placement.forecast.impressions * 1.25);
            }
            scaledPlacements.push(`${preview.name} (ROAS: ${preview.roas.toFixed(2)})`);
            scaledCount++;
        }
    });

    plan.totalSpend = placements.reduce((acc, p) => acc + p.totalCost, 0);
    plan.metrics = calculatePlanMetrics(placements);

    let responseContent = `**Scaled ${scaledCount} high-performing placement${scaledCount > 1 ? 's' : ''}**\n\n`;
    responseContent += `**Placements scaled (+25% budget & impressions):**\n`;
    scaledPlacements.forEach(name => {
        responseContent += `  - ${name}\n`;
    });
    responseContent += `\n**Total budget increase:** $${Math.round(totalBudgetIncrease).toLocaleString('en-US')}`;
    responseContent += `\n**New total spend:** $${plan.totalSpend.toLocaleString('en-US')}`;

    const msg = createAgentMessage(
        responseContent,
        ['Pause underperformers', 'Show performance', 'Undo']
    );
    msg.agentsInvoked = ['Performance Agent', 'Yield Agent'];

    return {
        handled: true,
        response: msg,
        updatedPlan: plan
    };
}

/**
 * Main entry point for optimization commands
 */
export function handleOptimizationCommand(input: string, context: AgentContext, expressMode: boolean = false): OptimizationCommandResult {
    const lowerInput = input.toLowerCase();

    // Check for plan with placements
    if (!context.mediaPlan || !context.mediaPlan.campaign.placements || context.mediaPlan.campaign.placements.length === 0) {
        return {
            handled: true,
            response: createAgentMessage(
                "I can't analyze your plan yet because there are no placements. Try adding some placements first!",
                ['Add 3 social placements', 'How should I allocate $50k?']
            )
        };
    }

    const plan = context.mediaPlan;
    const placements = plan.campaign.placements!; // We've already checked this is defined

    // Quick wins
    if (lowerInput.includes('quick win')) {
        return { handled: true, response: handleQuickWins(placements) };
    }

    // Critical issues
    if (lowerInput.includes('critical issue')) {
        return { handled: true, response: handleCriticalIssues(placements) };
    }

    // Pause underperformers
    if (lowerInput.includes('pause') && lowerInput.includes('underperform')) {
        return handlePauseUnderperformers(placements, expressMode);
    }

    // Scale winners
    if (lowerInput.includes('scale') && lowerInput.includes('winner')) {
        return handleScaleWinners(placements, expressMode);
    }

    // Growth opportunities
    if (lowerInput.includes('growth opportunit')) {
        return { handled: true, response: handleGrowthOpportunities(placements) };
    }

    // Apply all recommendations
    if (lowerInput.includes('apply all') || lowerInput.includes('apply recommendation')) {
        return handleApplyAll(plan);
    }

    // Plan score / health
    if ((lowerInput.includes('plan') && (lowerInput.includes('score') || lowerInput.includes('health') || lowerInput.includes('grade'))) ||
        lowerInput.includes('plan score') ||
        lowerInput.includes('plan health')) {
        return { handled: true, response: handlePlanScore(placements) };
    }

    // Full report / optimize
    if (lowerInput.includes('detailed report') || lowerInput.includes('full report') ||
        lowerInput.includes('optimize') ||
        (lowerInput.includes('what') && (lowerInput.includes('wrong') || lowerInput.includes('issue'))) ||
        lowerInput.includes('improvement') ||
        lowerInput.includes('opportunities')) {
        return { handled: true, response: handleFullReport(placements) };
    }

    return { handled: false };
}

export const optimizationManager = {
    isOptimizationCommand,
    handleOptimizationCommand,
    executePauseUnderperformers,
    executeScaleWinners
};
