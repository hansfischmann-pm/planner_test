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
    followUp?: { yesAction: string; noAction?: string };
}

// Default flight budget for calculations
const DEFAULT_FLIGHT_BUDGET = 100000;

// Escalation thresholds (per FuseIQ guardrails)
const ESCALATION_THRESHOLDS = {
    BUDGET_CHANGE: 50000,       // Escalate if single budget change > $50K
    CAMPAIGN_COUNT: 10,          // Escalate if affecting > 10 campaigns
    CONFIDENCE_MIN: 0.7          // Escalate if recommendation confidence < 70%
};

/**
 * Check if an action should be escalated to a human
 */
function shouldEscalate(budgetImpact: number, affectedCount: number): { escalate: boolean; reason?: string } {
    if (Math.abs(budgetImpact) > ESCALATION_THRESHOLDS.BUDGET_CHANGE) {
        return {
            escalate: true,
            reason: `This is a $${Math.round(Math.abs(budgetImpact)).toLocaleString()} change—larger than I'd make without a human check.`
        };
    }
    if (affectedCount > ESCALATION_THRESHOLDS.CAMPAIGN_COUNT) {
        return {
            escalate: true,
            reason: `This affects ${affectedCount} placements. I'd recommend having someone review before proceeding.`
        };
    }
    return { escalate: false };
}

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
 * Returns both the message and any follow-up context to set
 */
function handleQuickWins(placements: Placement[]): { message: AgentMessage; followUp?: { yesAction: string; noAction?: string } } {
    const report = generateOptimizationReport(placements, DEFAULT_FLIGHT_BUDGET);

    if (report.quickWins.length === 0) {
        return {
            message: createAgentMessage(
                "No quick wins right now—your plan is running efficiently. Want a full optimization analysis?",
                ['Optimize my plan']
            ),
            followUp: { yesAction: 'optimize my plan' }
        };
    }

    // Calculate total potential impact
    const totalImpact = report.quickWins.reduce((sum, rec) => sum + Math.abs(rec.estimatedImpact), 0);

    let responseContent = `Found ${report.quickWins.length} quick wins worth ~$${Math.round(totalImpact).toLocaleString()}:\n\n`;
    report.quickWins.forEach((rec, idx) => {
        const impact = rec.estimatedImpact > 0
            ? `saves $${Math.round(rec.estimatedImpact).toLocaleString()}`
            : `gains $${Math.round(Math.abs(rec.estimatedImpact)).toLocaleString()}`;
        responseContent += `${idx + 1}. **${rec.description}** — ${impact}\n`;
        responseContent += `   ${rec.specificAction}\n\n`;
    });

    responseContent += `Want me to apply these?`;

    return {
        message: createAgentMessage(responseContent, ['Apply all', 'Show full report']),
        followUp: { yesAction: 'apply all recommendations' }
    };
}

/**
 * Handle "show critical issues"
 */
function handleCriticalIssues(placements: Placement[]): { message: AgentMessage; followUp?: { yesAction: string; noAction?: string } } {
    const report = generateOptimizationReport(placements, DEFAULT_FLIGHT_BUDGET);
    const critical = report.recommendations.filter(r => r.priority === 'HIGH');

    if (critical.length === 0) {
        return {
            message: createAgentMessage(
                "No critical issues—your plan is in good shape.",
                ['Show quick wins', 'Optimize my plan']
            )
        };
    }

    const totalImpact = critical.reduce((sum, rec) => sum + Math.abs(rec.estimatedImpact), 0);

    let responseContent = `${critical.length} critical issue${critical.length > 1 ? 's' : ''} need attention (~$${Math.round(totalImpact).toLocaleString()} at stake):\n\n`;
    critical.forEach((rec, idx) => {
        const impact = rec.estimatedImpact > 0
            ? `$${Math.round(rec.estimatedImpact).toLocaleString()} waste`
            : `$${Math.round(Math.abs(rec.estimatedImpact)).toLocaleString()} opportunity`;
        responseContent += `${idx + 1}. **${rec.placementName}** — ${impact}\n`;
        responseContent += `   ${rec.description}. ${rec.specificAction}\n\n`;
    });

    responseContent += `Want me to fix these?`;

    return {
        message: createAgentMessage(responseContent, ['Apply all', 'Show full report']),
        followUp: { yesAction: 'apply all recommendations' }
    };
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
                "Nothing to pause—all placements are performing above threshold.",
                ['Scale winners', 'Show performance']
            )
        };
    }

    // Check escalation thresholds
    const escalation = shouldEscalate(totalSavings, pausePreview.length);
    if (escalation.escalate) {
        return {
            handled: true,
            response: createAgentMessage(
                `${escalation.reason}\n\nI've flagged this for review. Let me know when you'd like to proceed or if you want to adjust the scope.`,
                ['Proceed anyway', 'Show details', 'Cancel']
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

    let responseContent = `I'll pause ${pausePreview.length} underperformer${pausePreview.length > 1 ? 's' : ''}, saving ~$${Math.round(totalSavings).toLocaleString()}:\n\n`;
    pausePreview.forEach(p => {
        responseContent += `• ${p.name} (${p.roas.toFixed(1)}x ROAS)\n`;
    });
    responseContent += `\nConfirm?`;

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
                "No placements hit the scaling threshold (ROAS > 3.0). Your top performers may already be well-funded.",
                ['Pause underperformers', 'Show performance']
            )
        };
    }

    // Check escalation thresholds
    const escalation = shouldEscalate(totalBudgetIncrease, scalePreview.length);
    if (escalation.escalate) {
        return {
            handled: true,
            response: createAgentMessage(
                `${escalation.reason}\n\nI've flagged this for review. Let me know when you'd like to proceed or if you want to adjust the scope.`,
                ['Proceed anyway', 'Show details', 'Cancel']
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

    let responseContent = `I'll scale ${scalePreview.length} winner${scalePreview.length > 1 ? 's' : ''} by 25% (+$${Math.round(totalBudgetIncrease).toLocaleString()}):\n\n`;
    scalePreview.forEach(p => {
        responseContent += `• ${p.name} (${p.roas.toFixed(1)}x ROAS) — $${Math.round(p.currentCost).toLocaleString()} → $${Math.round(p.newCost).toLocaleString()}\n`;
    });
    responseContent += `\nConfirm?`;

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
function handleGrowthOpportunities(placements: Placement[]): { message: AgentMessage; followUp?: { yesAction: string; noAction?: string } } {
    const report = generateOptimizationReport(placements, DEFAULT_FLIGHT_BUDGET);
    const opportunities = report.recommendations.filter(r => r.estimatedImpact < 0);

    if (opportunities.length === 0) {
        return {
            message: createAgentMessage(
                "No major growth opportunities right now—your top performers are already well-funded.",
                ['Show quick wins', 'Optimize my plan']
            )
        };
    }

    const totalGain = opportunities.reduce((sum, r) => sum + Math.abs(r.estimatedImpact), 0);

    let responseContent = `${opportunities.length} growth opportunit${opportunities.length > 1 ? 'ies' : 'y'} worth ~$${Math.round(totalGain).toLocaleString()}:\n\n`;
    opportunities.forEach((rec, idx) => {
        const gain = Math.abs(rec.estimatedImpact);
        responseContent += `${idx + 1}. **${rec.placementName}** — potential +$${Math.round(gain).toLocaleString()}\n`;
        responseContent += `   ${rec.currentMetric}. ${rec.specificAction}\n\n`;
    });

    responseContent += `Want me to scale these?`;

    return {
        message: createAgentMessage(responseContent, ['Scale winners', 'Show full report']),
        followUp: { yesAction: 'scale winners' }
    };
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
                "Nothing to apply—your plan is already optimized.",
                ['Show performance', 'Export PDF']
            )
        };
    }

    // Build concise summary
    const actions: string[] = [];
    if (pausedCount > 0) {
        actions.push(`paused ${pausedCount} underperformer${pausedCount > 1 ? 's' : ''} (saves $${Math.round(totalSavings).toLocaleString()})`);
    }
    if (scaledCount > 0) {
        actions.push(`scaled ${scaledCount} winner${scaledCount > 1 ? 's' : ''} (+$${Math.round(totalIncrease).toLocaleString()})`);
    }

    let responseContent = `Done—${actions.join(' and ')}.\n\nNew total spend: $${plan.totalSpend.toLocaleString()}.`;

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

    // Lead with the score
    let responseContent = `Plan health: **${analysis.overallScore}/100**\n\n${summary}`;

    if (analysis.criticalCount > 0) {
        responseContent += `\n\n${analysis.criticalCount} critical issue${analysis.criticalCount > 1 ? 's' : ''} need attention.`;
    }

    // Add contextual next step
    if (analysis.overallScore < 70) {
        responseContent += ` Want me to show specific fixes?`;
    } else if (analysis.overallScore < 85) {
        responseContent += `\n\nA few minor tweaks could improve this further.`;
    }
    // If score >= 85, the summary already conveys it's in good shape

    return createAgentMessage(
        responseContent,
        analysis.overallScore < 85 ? ['Optimize my plan', 'Show critical issues'] : ['Show quick wins', 'Export PDF']
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

    let responseContent = `Done—paused ${pausedCount} placement${pausedCount > 1 ? 's' : ''}, saving ~$${Math.round(totalSavings).toLocaleString()}.\n\n`;
    responseContent += `Paused: ${pausedPlacements.join(', ')}`;

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

    let responseContent = `Done—scaled ${scaledCount} placement${scaledCount > 1 ? 's' : ''} by 25% (+$${Math.round(totalBudgetIncrease).toLocaleString()}).\n\n`;
    responseContent += `Scaled: ${scaledPlacements.join(', ')}\n`;
    responseContent += `New total spend: $${plan.totalSpend.toLocaleString()}`;

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
                "No placements to analyze yet. Add some first?",
                ['Add 3 social placements', 'Allocate $50k']
            )
        };
    }

    const plan = context.mediaPlan;
    const placements = plan.campaign.placements!; // We've already checked this is defined

    // Quick wins
    if (lowerInput.includes('quick win')) {
        const result = handleQuickWins(placements);
        return { handled: true, response: result.message, followUp: result.followUp };
    }

    // Critical issues
    if (lowerInput.includes('critical issue')) {
        const result = handleCriticalIssues(placements);
        return { handled: true, response: result.message, followUp: result.followUp };
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
        const result = handleGrowthOpportunities(placements);
        return { handled: true, response: result.message, followUp: result.followUp };
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
