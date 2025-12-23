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

    return createAgentMessage(
        `Added "${name}" to your library. Assign it to placements?`,
        ['Assign to display placements', 'Assign to social placements']
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
            `Assigned creatives to ${count} placement${count > 1 ? 's' : ''}.`,
            ['Show performance', 'Upload another']
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
            "No Display or Social placements to assign to. Add some first?",
            ['Add display placement', 'Add social placement']
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

    if (bestCreative && bestCtr > 0) {
        return createAgentMessage(
            `**${(bestCreative as Creative).name}** is winning at ${(bestCtr * 100).toFixed(2)}% CTR (on ${bestPlacementName}).`,
            ['Scale this creative', 'Show all creatives']
        );
    }

    return createAgentMessage(
        "Not enough performance data yet to pick a winner.",
        ['Show placements', 'Check back later']
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
                "Create a campaign first to manage creatives.",
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
