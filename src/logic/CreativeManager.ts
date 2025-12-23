/**
 * CreativeManager - Handles creative asset commands
 *
 * This module extracts creative-related commands from AgentBrain,
 * including uploading, assigning, and analyzing creative performance.
 */

import { AgentMessage, MediaPlan, Creative } from '../types';
import { createAgentMessage, AgentContext } from './AgentContext';
import { generateId } from './dummyData';

export interface CreativeCommandResult {
    handled: boolean;
    response?: AgentMessage;
    updatedPlan?: MediaPlan;
}

/**
 * Check if input is a creative-related command
 */
export function isCreativeCommand(input: string): boolean {
    const lowerInput = input.toLowerCase();
    return lowerInput.includes('creative') ||
           lowerInput.includes('upload') ||
           lowerInput.includes('assign');
}

/**
 * Handle uploading a creative
 */
function handleUploadCreative(input: string): AgentMessage {
    const nameMatch = input.match(/upload\s+(?:creative\s+)?["']?([^"']+)["']?/i);
    const name = nameMatch ? nameMatch[1] : `New Creative ${Date.now()}`;

    // In a real app, we'd add this to a global library
    return createAgentMessage(
        `**Creative Uploaded!**\n\nI've added "**${name}**" to your library.\n\nYou can now assign it to a placement.`,
        ['Assign to all display placements']
    );
}

/**
 * Handle assigning creatives to placements
 */
function handleAssignCreative(plan: MediaPlan): CreativeCommandResult {
    let count = 0;

    plan.campaign.placements?.forEach(p => {
        if (p.channel === 'Display' || p.channel === 'Social') {
            const newCreative: Creative = {
                id: generateId(),
                name: `Assigned Creative ${count + 1}`,
                type: 'IMAGE',
                url: `https://picsum.photos/seed/${Math.random()}/400/300`,
                dimensions: '300x250',
                metrics: { ctr: 0, conversions: 0 }
            };
            p.creatives = [...(p.creatives || []), newCreative];
            // Sync legacy creative field
            p.creative = {
                id: newCreative.id,
                name: newCreative.name,
                type: 'image',
                url: newCreative.url
            };
            count++;
        }
    });

    if (count > 0) {
        const response = createAgentMessage(
            `**Creatives Assigned!**\n\nI've assigned new creatives to ${count} placements.`,
            ['Check performance']
        );
        response.updatedMediaPlan = { ...plan };
        return {
            handled: true,
            response,
            updatedPlan: plan
        };
    }

    return {
        handled: true,
        response: createAgentMessage(
            "I couldn't find any suitable placements to assign creatives to.",
            ['Add display placement']
        )
    };
}

/**
 * Handle finding the best performing creative
 */
function handleWinningCreative(plan: MediaPlan): AgentMessage {
    let bestCreative: Creative | null = null;
    let bestCtr = -1;
    let bestPlacementName = '';

    plan.campaign.placements?.forEach(p => {
        p.creatives?.forEach(c => {
            if ((c.metrics?.ctr || 0) > bestCtr) {
                bestCtr = c.metrics?.ctr || 0;
                bestCreative = c;
                bestPlacementName = p.name;
            }
        });
    });

    if (bestCreative) {
        return createAgentMessage(
            `**Winning Creative Found!**\n\n**${(bestCreative as Creative).name}** is your top performer.\n\n- **CTR:** ${(bestCtr * 100).toFixed(2)}%\n- **Placement:** ${bestPlacementName}`,
            ['Optimize rotation']
        );
    }

    return createAgentMessage(
        "I don't have enough performance data yet to determine a winner.",
        ['Wait for data']
    );
}

/**
 * Main entry point for creative commands
 */
export function handleCreativeCommand(input: string, context: AgentContext): CreativeCommandResult {
    const lowerInput = input.toLowerCase();

    // Check for plan
    if (!context.mediaPlan) {
        return {
            handled: true,
            response: createAgentMessage(
                "I need an active media plan to manage creatives.",
                ['Create new campaign']
            )
        };
    }

    const plan = context.mediaPlan;

    // Handle upload
    if (lowerInput.includes('upload')) {
        return {
            handled: true,
            response: handleUploadCreative(input)
        };
    }

    // Handle assign
    if (lowerInput.includes('assign')) {
        return handleAssignCreative(plan);
    }

    // Handle performance analysis / winning creative
    if (lowerInput.includes('winning') || lowerInput.includes('best performing')) {
        return {
            handled: true,
            response: handleWinningCreative(plan)
        };
    }

    // Creative keyword present but no specific action matched
    return { handled: false };
}

export const creativeManager = {
    isCreativeCommand,
    handleCreativeCommand
};
