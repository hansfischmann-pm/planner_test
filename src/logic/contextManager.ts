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

export interface FrustrationState {
    consecutiveCorrections: number;   // "No, I meant X" type messages
    lastCorrectionTime: number;
    escalatedToHuman: boolean;
}

/**
 * Tracks the last follow-up question asked by the agent.
 * This allows "yes" responses to trigger the appropriate action.
 */
export interface LastFollowUp {
    question: string;              // The question asked (e.g., "Want a full optimization analysis?")
    yesAction: string;            // Action to trigger on "yes" (e.g., "optimize my plan")
    noAction?: string;            // Optional action for "no"
    timestamp: number;
}

export interface ConversationContext {
    sessionId: string;
    history: Message[];
    currentFocus: ConversationFocus;
    userProfile: UserProfile;
    pendingActions: PendingAction[];
    accumulatedEntities: ExtractedEntities;
    frustration: FrustrationState;
    lastFollowUp?: LastFollowUp;
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
                accumulatedEntities: {},
                frustration: {
                    consecutiveCorrections: 0,
                    lastCorrectionTime: 0,
                    escalatedToHuman: false
                }
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
    private updateUserProfile(context: ConversationContext, message: string, _intent?: DetectedIntent): void {
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
     * Detect if a message indicates frustration/correction
     */
    private isCorrectionMessage(message: string): boolean {
        const correctionPatterns = [
            /^no[,.]?\s/i,
            /that's not/i,
            /that isn't/i,
            /wrong/i,
            /i meant/i,
            /i said/i,
            /not what i/i,
            /i asked for/i,
            /try again/i,
            /you misunderstood/i,
            /didn't ask/i
        ];
        return correctionPatterns.some(pattern => pattern.test(message));
    }

    /**
     * Update frustration state based on user message
     */
    trackFrustration(sessionId: string, message: string): FrustrationState {
        const context = this.getContext(sessionId);
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;

        if (this.isCorrectionMessage(message)) {
            // Reset counter if more than 5 minutes since last correction
            if (now - context.frustration.lastCorrectionTime > fiveMinutes) {
                context.frustration.consecutiveCorrections = 1;
            } else {
                context.frustration.consecutiveCorrections++;
            }
            context.frustration.lastCorrectionTime = now;
        } else {
            // Positive/neutral message - reset frustration if not recent
            if (now - context.frustration.lastCorrectionTime > fiveMinutes) {
                context.frustration.consecutiveCorrections = 0;
            }
        }

        return context.frustration;
    }

    /**
     * Check if user should be offered human escalation
     */
    shouldOfferHumanEscalation(sessionId: string): boolean {
        const context = this.getContext(sessionId);
        // Offer after 2+ corrections, but only once per session
        return context.frustration.consecutiveCorrections >= 2 &&
               !context.frustration.escalatedToHuman;
    }

    /**
     * Mark that human escalation was offered
     */
    markEscalationOffered(sessionId: string): void {
        const context = this.getContext(sessionId);
        context.frustration.escalatedToHuman = true;
    }

    /**
     * Get frustration state
     */
    getFrustrationState(sessionId: string): FrustrationState {
        return this.getContext(sessionId).frustration;
    }

    /**
     * Set a follow-up question context for handling "yes/no" responses
     */
    setFollowUp(sessionId: string, yesAction: string, question?: string, noAction?: string): void {
        const context = this.getContext(sessionId);
        context.lastFollowUp = {
            question: question || '',
            yesAction,
            noAction,
            timestamp: Date.now()
        };
    }

    /**
     * Get the last follow-up question (if still valid - within 2 minutes)
     */
    getFollowUp(sessionId: string): LastFollowUp | null {
        const context = this.getContext(sessionId);
        if (!context.lastFollowUp) return null;

        // Follow-up expires after 2 minutes
        const twoMinutes = 2 * 60 * 1000;
        if (Date.now() - context.lastFollowUp.timestamp > twoMinutes) {
            context.lastFollowUp = undefined;
            return null;
        }

        return context.lastFollowUp;
    }

    /**
     * Clear the follow-up context after it's been used
     */
    clearFollowUp(sessionId: string): void {
        const context = this.getContext(sessionId);
        context.lastFollowUp = undefined;
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
