/**
 * AgentContext - Shared state interface for the Agent system
 *
 * This module defines the core context that flows through all agent components.
 * It provides a clean separation between state management and command processing.
 */

import { MediaPlan, Brand, AgentMessage, AgentInfo, AgentExecution } from '../types';

// Unique message ID generator to prevent React key collisions
const generateMessageId = (prefix: string = 'msg') =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

/**
 * Agent state machine states
 */
export type AgentState = 'INIT' | 'BUDGETING' | 'CHANNEL_SELECTION' | 'REFINEMENT' | 'OPTIMIZATION' | 'FINISHED';

/**
 * Window context for context-aware chat in windowed mode
 */
export interface WindowContext {
    windowType: 'campaign' | 'flight' | 'portfolio' | 'report' | 'settings' | 'media-plan' | 'client' | 'client-list' | null;
    brandId?: string;      // Brand/Client ID for this window
    brandName?: string;    // Brand/Client name for display
    campaignId?: string;
    campaignName?: string;
    flightId?: string;
    flightName?: string;
}

/**
 * Core agent context - shared across all agent modules
 */
export interface AgentContext {
    /** Current state in the agent state machine */
    state: AgentState;

    /** The active media plan being worked on */
    mediaPlan: MediaPlan | null;

    /** The current brand context (for agency users) */
    brand?: Brand | null;

    /** Conversation history */
    history: AgentMessage[];

    /** Available agent personas */
    agents: AgentInfo[];

    /** Log of agent executions for transparency */
    executions: AgentExecution[];
}

/**
 * Result from command processing
 */
export interface CommandResult {
    /** Whether the command was handled */
    handled: boolean;

    /** The response message (if handled) */
    response?: AgentMessage;

    /** Updated media plan (if changed) */
    updatedPlan?: MediaPlan;

    /** New agent state (if changed) */
    newState?: AgentState;
}

/**
 * Create a default/initial agent context
 */
export function createInitialContext(welcomeMessage?: string): AgentContext {
    return {
        state: 'INIT',
        mediaPlan: null,
        agents: [],
        executions: [],
        history: [{
            id: 'welcome',
            role: 'agent',
            content: welcomeMessage || "Welcome to FuseIQ by AdRoll. I'm your AI assistant. To get started, tell me the Client Name and Total Budget for your new campaign.",
            timestamp: Date.now(),
            suggestedActions: ['Create plan for Nike ($500k)', 'Create plan for Local Coffee Shop ($5k)']
        }]
    };
}

/**
 * Create an agent message with standard fields
 */
export function createAgentMessage(
    content: string,
    suggestedActions: string[] = [],
    action?: AgentMessage['action']
): AgentMessage {
    return {
        id: generateMessageId('agent'),
        role: 'agent',
        content,
        timestamp: Date.now(),
        suggestedActions,
        action
    };
}

/**
 * Create a user message
 */
export function createUserMessage(content: string): AgentMessage {
    return {
        id: generateMessageId('user'),
        role: 'user',
        content,
        timestamp: Date.now()
    };
}
