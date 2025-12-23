/**
 * ForecastManager - Handles campaign forecasting commands
 *
 * This module extracts forecasting-related commands from AgentBrain,
 * including performance predictions, seasonal analysis, and audience overlap.
 */

import { AgentMessage, Placement } from '../types';
import { createAgentMessage, AgentContext } from './AgentContext';
import { forecastCampaign, formatForecastResult, calculateAudienceOverlap } from '../utils/forecastingEngine';

export interface ForecastCommandResult {
    handled: boolean;
    response?: AgentMessage;
}

/**
 * Check if input is a forecasting-related command
 */
export function isForecastCommand(input: string): boolean {
    const lowerInput = input.toLowerCase();
    return lowerInput.includes('forecast') ||
           (lowerInput.includes('predict') && (lowerInput.includes('performance') || lowerInput.includes('campaign'))) ||
           lowerInput.includes('will we hit') ||
           (lowerInput.includes('seasonal') && (lowerInput.includes('impact') || lowerInput.includes('factor'))) ||
           lowerInput.includes('audience overlap') ||
           (lowerInput.includes('overlap') && lowerInput.includes('reach'));
}

/**
 * Handle campaign forecast request
 */
function handleForecast(placements: Placement[], startDate: string, endDate: string): AgentMessage {
    const forecast = forecastCampaign(placements, startDate, endDate);
    const formattedForecast = formatForecastResult(forecast);

    return createAgentMessage(
        formattedForecast,
        ['Show seasonal impact', 'Check audience overlap', 'Optimize my plan']
    );
}

/**
 * Handle seasonal impact analysis
 */
function handleSeasonalImpact(startDate: string): AgentMessage {
    const date = new Date(startDate);
    const month = date.getMonth();
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];

    const seasonalFactors: Record<number, string> = {
        0: 'Post-holiday slump - 10-15% lower CPMs',
        1: 'Valentine\'s/Presidents Day - slightly elevated',
        2: 'Spring awakening - baseline CPMs',
        3: 'Spring growth - moderately elevated (5-10%)',
        4: 'Summer prep - elevated (10-15%)',
        5: 'Summer begins - moderately elevated',
        6: 'Summer slump - 5-10% lower CPMs',
        7: 'Back to school prep - lower competition (10-15% cheaper)',
        8: 'Fall activation - back to baseline',
        9: 'Q4 buildup - elevated (5-10%)',
        10: 'Holiday peak - VERY HIGH (15-20% premium)',
        11: 'Holiday peak continues - HIGHEST (15-25% premium)'
    };

    let responseContent = `**Seasonal Impact Analysis**\n\n`;
    responseContent += `**Campaign Month:** ${monthNames[month]}\n\n`;
    responseContent += `**${monthNames[month]} Trends:**\n`;
    responseContent += `- ${seasonalFactors[month] || 'Normal seasonal patterns'}\n\n`;

    responseContent += `**Recommendations:**\n`;
    if (month === 10 || month === 11) {
        responseContent += `- Book inventory early - high demand period\n`;
        responseContent += `- Expect 15-20% higher CPMs than average\n`;
        responseContent += `- Consider expanding to less competitive channels\n`;
    } else if (month === 6 || month === 7) {
        responseContent += `- Great opportunity for efficient spend\n`;
        responseContent += `- CPMs 10-15% below average\n`;
        responseContent += `- Good time to test new channels/tactics\n`;
    } else {
        responseContent += `- Normal competitive levels expected\n`;
        responseContent += `- Good balance of efficiency and reach\n`;
    }

    return createAgentMessage(responseContent, ['Forecast campaign', 'Optimize my plan']);
}

/**
 * Handle audience overlap analysis
 */
function handleAudienceOverlap(placements: Placement[]): AgentMessage {
    const overlap = calculateAudienceOverlap(placements);

    let responseContent = `**Audience Overlap Analysis**\n\n`;
    responseContent += `**Total Reach (Uncorrected):** ${Math.round(overlap.totalReach).toLocaleString()}\n`;
    responseContent += `**Overlap Amount:** ${Math.round(overlap.overlapAmount).toLocaleString()} (${overlap.overlapPercentage.toFixed(1)}%)\n`;
    responseContent += `**Adjusted Unique Reach:** ${Math.round(overlap.adjustedReach).toLocaleString()}\n\n`;

    if (overlap.overlapPercentage > 40) {
        responseContent += `**High Overlap Detected**\n`;
        responseContent += `Your channels have significant audience overlap (${overlap.overlapPercentage.toFixed(0)}%). This means:\n`;
        responseContent += `- You're reaching fewer unique people than raw numbers suggest\n`;
        responseContent += `- Consider diversifying to different audience segments\n`;
        responseContent += `- Frequency may be higher than optimal\n`;
    } else if (overlap.overlapPercentage > 25) {
        responseContent += `**Moderate Overlap**\n`;
        responseContent += `Your channels have typical overlap (${overlap.overlapPercentage.toFixed(0)}%). This is normal for multi-channel campaigns.\n`;
    } else {
        responseContent += `**Low Overlap**\n`;
        responseContent += `Great! Your channels reach relatively distinct audiences (${overlap.overlapPercentage.toFixed(0)}% overlap).\n`;
    }

    return createAgentMessage(responseContent, ['Forecast campaign', 'Optimize my plan']);
}

/**
 * Main entry point for forecast commands
 */
export function handleForecastCommand(input: string, context: AgentContext): ForecastCommandResult {
    const lowerInput = input.toLowerCase();

    // Check for plan with placements
    if (!context.mediaPlan || !context.mediaPlan.campaign.placements || context.mediaPlan.campaign.placements.length === 0) {
        return {
            handled: true,
            response: createAgentMessage(
                "I can't forecast yet - there are no placements to analyze. Add some placements first!",
                ['Add 3 social placements', 'How should I allocate $50k?']
            )
        };
    }

    const plan = context.mediaPlan;
    const placements = plan.campaign.placements!; // We've already checked this is defined
    const campaign = plan.campaign;
    const startDate = campaign.startDate || new Date().toISOString();
    const endDate = campaign.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Campaign forecast
    if (lowerInput.includes('forecast') ||
        (lowerInput.includes('predict') && (lowerInput.includes('performance') || lowerInput.includes('campaign'))) ||
        lowerInput.includes('will we hit')) {
        return {
            handled: true,
            response: handleForecast(placements, startDate, endDate)
        };
    }

    // Seasonal impact
    if (lowerInput.includes('seasonal') && (lowerInput.includes('impact') || lowerInput.includes('factor'))) {
        return {
            handled: true,
            response: handleSeasonalImpact(startDate)
        };
    }

    // Audience overlap
    if (lowerInput.includes('audience overlap') ||
        (lowerInput.includes('overlap') && lowerInput.includes('reach'))) {
        return {
            handled: true,
            response: handleAudienceOverlap(placements)
        };
    }

    return { handled: false };
}

export const forecastManager = {
    isForecastCommand,
    handleForecastCommand
};
