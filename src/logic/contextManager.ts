/**
 * Conversation Context Manager
 * 
 * Maintains state across multi-turn conversations
 */

import { DetectedIntent } from './intentClassifier';
import { ExtractedEntities } from './entityExtractor';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    intent?: DetectedIntent;
    entities?: ExtractedEntities;
}

export interface ConversationFocus {
    brandId?: string;
    campaignId?: string;
    flightId?: string;
    placementId?: string;
}

export interface UserProfile {
    expertiseLevel: 'beginner' | 'intermediate' | 'expert';
    preferredChannels: string[];
    commonObjectives: string[];
    interactionCount: number;
}

export interface PendingAction {
    id: string;
    type: string;
    description: string;
    params: Record<string, any>;
    requiresConfirmation: boolean;
    confirmed: boolean;
}

export interface ConversationContext {
    sessionId: string;
    history: Message[];
    currentFocus: ConversationFocus;
    userProfile: UserProfile;
    pendingActions: PendingAction[];
    accumulatedEntities: ExtractedEntities;
}

export class ContextManager {
    private contexts: Map<string, ConversationContext> = new Map();
    private readonly MAX_HISTORY = 20;

    /**
     * Get or create context for a session
     */
    getContext(sessionId: string): ConversationContext {
        if (!this.contexts.has(sessionId)) {
            this.contexts.set(sessionId, {
                sessionId,
                history: [],
                currentFocus: {},
                userProfile: {
                    expertiseLevel: 'intermediate',
                    preferredChannels: [],
                    commonObjectives: [],
                    interactionCount: 0
                },
                pendingActions: [],
                accumulatedEntities: {}
            });
        }

        return this.contexts.get(sessionId)!;
    }

    /**
     * Add a message to conversation history
     */
    addMessage(
        sessionId: string,
        role: 'user' | 'assistant',
        content: string,
        intent?: DetectedIntent,
        entities?: ExtractedEntities
    ): void {
        const context = this.getContext(sessionId);

        const message: Message = {
            role,
            content,
            timestamp: Date.now(),
            intent,
            entities
        };

        context.history.push(message);

        // Trim history if too long
        if (context.history.length > this.MAX_HISTORY) {
            context.history = context.history.slice(-this.MAX_HISTORY);
        }

        // Update user profile
        if (role === 'user') {
            context.userProfile.interactionCount++;
            this.updateUserProfile(context, content, intent);
        }

        // Accumulate entities across turns
        if (entities) {
            this.mergeEntities(context, entities);
        }
    }

    /**
     * Update current focus (what campaign/flight/placement is being discussed)
     */
    updateFocus(sessionId: string, focus: Partial<ConversationFocus>): void {
        const context = this.getContext(sessionId);
        context.currentFocus = { ...context.currentFocus, ...focus };
    }

    /**
     * Get accumulated entities from conversation
     */
    getAccumulatedEntities(sessionId: string): ExtractedEntities {
        const context = this.getContext(sessionId);
        return { ...context.accumulatedEntities };
    }

    /**
     * Clear accumulated entities (e.g., after completing an action)
     */
    clearAccumulatedEntities(sessionId: string): void {
        const context = this.getContext(sessionId);
        context.accumulatedEntities = {};
    }

    /**
     * Add a pending action that requires confirmation
     */
    addPendingAction(sessionId: string, action: Omit<PendingAction, 'confirmed'>): void {
        const context = this.getContext(sessionId);
        context.pendingActions.push({
            ...action,
            confirmed: false
        });
    }

    /**
     * Confirm a pending action
     */
    confirmAction(sessionId: string, actionId: string): PendingAction | null {
        const context = this.getContext(sessionId);
        const actionIndex = context.pendingActions.findIndex(a => a.id === actionId);

        if (actionIndex === -1) return null;

        const action = context.pendingActions[actionIndex];
        action.confirmed = true;

        // Remove from pending
        context.pendingActions.splice(actionIndex, 1);

        return action;
    }

    /**
     * Get recent conversation history
     */
    getRecentHistory(sessionId: string, count: number = 5): Message[] {
        const context = this.getContext(sessionId);
        return context.history.slice(-count);
    }

    /**
     * Check if user is asking about something discussed earlier
     */
    findPreviousMention(sessionId: string, keyword: string): Message | null {
        const context = this.getContext(sessionId);

        for (let i = context.history.length - 1; i >= 0; i--) {
            if (context.history[i].content.toLowerCase().includes(keyword.toLowerCase())) {
                return context.history[i];
            }
        }

        return null;
    }

    /**
     * Detect expertise level from user language
     */
    private updateUserProfile(context: ConversationContext, message: string, intent?: DetectedIntent): void {
        const lowercaseMsg = message.toLowerCase();

        // Expert indicators
        const expertTerms = ['incrementality', 'attribution', 'lookalike', 'suppression', 'dma', 'addressable', 'programmatic'];
        const expertCount = expertTerms.filter(term => lowercaseMsg.includes(term)).length;

        // Beginner indicators
        const beginnerPhrases = ['how do i', 'what is', 'explain', 'help me', "i don't know"];
        const beginnerCount = beginnerPhrases.filter(phrase => lowercaseMsg.includes(phrase)).length;

        // Update expertise level based on patterns
        if (expertCount > 1 && context.userProfile.interactionCount > 3) {
            context.userProfile.expertiseLevel = 'expert';
        } else if (beginnerCount > 0 || context.userProfile.interactionCount < 3) {
            context.userProfile.expertiseLevel = 'beginner';
        } else {
            context.userProfile.expertiseLevel = 'intermediate';
        }
    }

    /**
     * Merge new entities into accumulated entities
     */
    private mergeEntities(context: ConversationContext, newEntities: ExtractedEntities): void {
        const acc = context.accumulatedEntities;

        // Add or update individual entity types
        if (newEntities.budget !== undefined) acc.budget = newEntities.budget;
        if (newEntities.campaignName) acc.campaignName = newEntities.campaignName;

        // Merge arrays
        if (newEntities.channels && newEntities.channels.length > 0) {
            acc.channels = [...new Set([...(acc.channels || []), ...newEntities.channels])];
        }

        if (newEntities.metrics && newEntities.metrics.length > 0) {
            acc.metrics = [...(acc.metrics || []), ...newEntities.metrics];
        }

        // Merge complex objects
        if (newEntities.dates) {
            acc.dates = { ...acc.dates, ...newEntities.dates };
        }

        if (newEntities.audience) {
            acc.audience = {
                demographics: [...new Set([...(acc.audience?.demographics || []), ...(newEntities.audience.demographics || [])])],
                behaviors: [...new Set([...(acc.audience?.behaviors || []), ...(newEntities.audience.behaviors || [])])],
                geography: [...new Set([...(acc.audience?.geography || []), ...(newEntities.audience.geography || [])])]
            };
        }

        if (newEntities.placements) {
            acc.placements = { ...acc.placements, ...newEntities.placements };
        }
    }

    /**
     * Reset context for a session
     */
    resetContext(sessionId: string): void {
        this.contexts.delete(sessionId);
    }
}

// Singleton instance
export const contextManager = new ContextManager();
