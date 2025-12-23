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

    const seasonalData: Record<number, { trend: string; cpmChange: string; tip: string }> = {
        0: { trend: 'Post-holiday slump', cpmChange: '10-15% below average', tip: 'Good time to lock in lower rates' },
        1: { trend: 'Valentine\'s/Presidents Day', cpmChange: 'slightly elevated', tip: 'Retail competition picking up' },
        2: { trend: 'Spring baseline', cpmChange: 'normal', tip: 'Standard competitive environment' },
        3: { trend: 'Spring growth', cpmChange: '5-10% above average', tip: 'Competition increasing' },
        4: { trend: 'Summer prep', cpmChange: '10-15% elevated', tip: 'Book early for summer campaigns' },
        5: { trend: 'Early summer', cpmChange: 'moderately elevated', tip: 'Auto and travel advertisers active' },
        6: { trend: 'Summer slump', cpmChange: '5-10% below average', tip: 'Great time to test new channels' },
        7: { trend: 'Back-to-school', cpmChange: '10-15% below average', tip: 'Low competition outside retail' },
        8: { trend: 'Fall activation', cpmChange: 'back to baseline', tip: 'Normal conditions' },
        9: { trend: 'Q4 buildup', cpmChange: '5-10% above average', tip: 'Book Q4 inventory now' },
        10: { trend: 'Holiday peak', cpmChange: '15-20% premium', tip: 'Expect high competition—book early' },
        11: { trend: 'Holiday peak continues', cpmChange: '15-25% premium', tip: 'Highest CPMs of the year' }
    };

    const data = seasonalData[month];

    // Lead with the key insight
    let responseContent = `**${monthNames[month]}**: ${data.trend}. CPMs ${data.cpmChange}.\n\n`;
    responseContent += `${data.tip}.`;

    if (month === 10 || month === 11) {
        responseContent += ` Consider expanding to less competitive channels to maintain efficiency.`;
    } else if (month === 6 || month === 7) {
        responseContent += ` Good window to scale or test without premium pricing.`;
    }

    return createAgentMessage(responseContent, ['Forecast campaign', 'Optimize my plan']);
}

/**
 * Handle audience overlap analysis
 */
function handleAudienceOverlap(placements: Placement[]): AgentMessage {
    const overlap = calculateAudienceOverlap(placements);

    // Lead with the key number
    let responseContent = `**${overlap.overlapPercentage.toFixed(0)}% audience overlap** — `;

    if (overlap.overlapPercentage > 40) {
        responseContent += `high.\n\n`;
        responseContent += `Raw reach: ${Math.round(overlap.totalReach).toLocaleString()} → Unique reach: ${Math.round(overlap.adjustedReach).toLocaleString()}\n\n`;
        responseContent += `You're reaching fewer unique users than the numbers suggest. Consider diversifying channels or tightening targeting to reduce overlap.`;
    } else if (overlap.overlapPercentage > 25) {
        responseContent += `typical for multi-channel.\n\n`;
        responseContent += `Raw reach: ${Math.round(overlap.totalReach).toLocaleString()} → Unique reach: ${Math.round(overlap.adjustedReach).toLocaleString()}\n\n`;
        responseContent += `Normal overlap. Your channel mix is well-balanced.`;
    } else {
        responseContent += `low. Nice work.\n\n`;
        responseContent += `Raw reach: ${Math.round(overlap.totalReach).toLocaleString()} → Unique reach: ${Math.round(overlap.adjustedReach).toLocaleString()}\n\n`;
        responseContent += `Your channels reach distinct audiences—efficient spend.`;
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
                "No placements to forecast yet. Add some first?",
                ['Add 3 social placements', 'Allocate $50k']
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
