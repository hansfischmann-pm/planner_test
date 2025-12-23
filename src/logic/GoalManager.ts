/**
 * GoalManager - Handles campaign goal setting and display
 *
 * This module extracts goal-related commands from AgentBrain,
 * including setting, showing, and updating numeric goals.
 */

import { AgentMessage, MediaPlan } from '../types';
import { createAgentMessage, AgentContext } from './AgentContext';

export type GoalMetric = 'impressions' | 'reach' | 'conversions' | 'clicks';

export interface GoalCommandResult {
    handled: boolean;
    response?: AgentMessage;
    updatedPlan?: MediaPlan;
}

/**
 * Check if input is a goal-related command
 */
export function isGoalCommand(input: string): boolean {
    const lowerInput = input.toLowerCase();

    const hasGoalKeyword = lowerInput.includes('goal') ||
        (lowerInput.includes('increase') && (
            lowerInput.includes('reach') ||
            lowerInput.includes('impression') ||
            lowerInput.includes('conversion') ||
            lowerInput.includes('click')
        )) ||
        (lowerInput.includes('set') && (
            lowerInput.includes('reach') ||
            lowerInput.includes('impression') ||
            lowerInput.includes('conversion') ||
            lowerInput.includes('click')
        ));

    const hasActionKeyword =
        lowerInput.includes('set') ||
        lowerInput.includes('show') ||
        lowerInput.includes('update') ||
        lowerInput.includes('change') ||
        lowerInput.includes('list') ||
        lowerInput.includes('what are') ||
        lowerInput.includes('increase');

    return hasGoalKeyword && hasActionKeyword;
}

/**
 * Parse which goal metric the user is referring to
 */
function parseGoalMetric(input: string): GoalMetric | null {
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('impression')) return 'impressions';
    if (lowerInput.includes('reach')) return 'reach';
    if (lowerInput.includes('conversion')) return 'conversions';
    if (lowerInput.includes('click')) return 'clicks';

    return null;
}

/**
 * Parse a numeric value with optional k/m/b suffix
 */
function parseGoalValue(input: string, metric: GoalMetric): number | null {
    const lowerInput = input.toLowerCase();

    // Look for number after the metric keyword to avoid false matches
    const metricIndex = lowerInput.indexOf(metric);
    const afterMetric = metricIndex >= 0 ? lowerInput.substring(metricIndex + metric.length) : lowerInput;
    const valueMatch = afterMetric.match(/(\d+(?:\.\d+)?)\s*([kKmMbB])?/);

    if (!valueMatch) return null;

    let value = parseFloat(valueMatch[1]);
    const suffix = valueMatch[2]?.toLowerCase();

    if (suffix === 'k') value *= 1000;
    else if (suffix === 'm') value *= 1000000;
    else if (suffix === 'b') value *= 1000000000;

    return Math.floor(value);
}

/**
 * Handle showing current goals
 */
function handleShowGoals(plan: MediaPlan): AgentMessage {
    const goals = plan.campaign.numericGoals || {};
    const hasGoals = Object.keys(goals).length > 0;

    if (!hasGoals) {
        return createAgentMessage(
            "You haven't set any numeric goals yet.",
            ['Set goal impressions 1M', 'Set goal conversions 500']
        );
    }

    let responseContent = "**Current Campaign Goals**\n\n";
    if (goals.impressions) responseContent += `- **Impressions:** ${goals.impressions.toLocaleString()}\n`;
    if (goals.reach) responseContent += `- **Reach:** ${goals.reach.toLocaleString()}\n`;
    if (goals.conversions) responseContent += `- **Conversions:** ${goals.conversions.toLocaleString()}\n`;
    if (goals.clicks) responseContent += `- **Clicks:** ${goals.clicks.toLocaleString()}\n`;

    return createAgentMessage(responseContent, ['Forecast this campaign']);
}

/**
 * Handle setting or updating a goal
 */
function handleSetGoal(input: string, plan: MediaPlan): GoalCommandResult {
    const metric = parseGoalMetric(input);

    if (!metric) {
        return {
            handled: true,
            response: createAgentMessage(
                "Which goal would you like to set? I support Impressions, Reach, Conversions, and Clicks.",
                ['Set goal impressions 1M', 'Set goal conversions 500']
            )
        };
    }

    const value = parseGoalValue(input, metric);

    if (value === null) {
        return {
            handled: true,
            response: createAgentMessage(
                `I couldn't understand the value for ${metric}. Try saying something like "Set goal ${metric} 1.5M" or "Set goal ${metric} 5000".`,
                [`Set goal ${metric} 100k`]
            )
        };
    }

    // Update plan with goal
    if (!plan.campaign.numericGoals) {
        plan.campaign.numericGoals = {};
    }
    plan.campaign.numericGoals[metric] = value;

    // Create updated plan copy to trigger UI update
    const updatedPlan: MediaPlan = {
        ...plan,
        campaign: {
            ...plan.campaign,
            numericGoals: { ...plan.campaign.numericGoals }
        }
    };

    const response = createAgentMessage(
        `**Goal Updated!**\n\nI've set your **${metric}** goal to **${value.toLocaleString()}**.\n\nThe goal tracking card in your plan view has been updated.`,
        ['Show goals', 'Forecast this campaign']
    );
    response.updatedMediaPlan = updatedPlan;

    return {
        handled: true,
        response,
        updatedPlan
    };
}

/**
 * Main entry point for goal commands
 */
export function handleGoalCommand(input: string, context: AgentContext): GoalCommandResult {
    const lowerInput = input.toLowerCase();

    // Check for plan
    if (!context.mediaPlan) {
        return {
            handled: true,
            response: createAgentMessage(
                "I need an active media plan to manage goals. Please create or select a campaign first.",
                ['Create new campaign']
            )
        };
    }

    const plan = context.mediaPlan;

    // Handle "Show Goals"
    if (lowerInput.includes('show') || lowerInput.includes('list') || lowerInput.includes('what are')) {
        return {
            handled: true,
            response: handleShowGoals(plan)
        };
    }

    // Handle "Set/Update/Increase Goal"
    if (lowerInput.includes('set') || lowerInput.includes('update') || lowerInput.includes('change') || lowerInput.includes('add') || lowerInput.includes('increase')) {
        return handleSetGoal(input, plan);
    }

    // Didn't match a specific action
    return { handled: false };
}

export const goalManager = {
    isGoalCommand,
    handleGoalCommand
};
