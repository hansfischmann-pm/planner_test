/**
 * Action History and Undo/Redo System
 */

export interface ActionSnapshot {
    id: string;
    timestamp: number;
    type: 'add_placement' | 'delete_placement' | 'update_placement' | 'update_budget' | 'update_flight' | 'update_campaign';
    description: string;
    userCommand: string;
    stateBefore: any;
    stateAfter: any;
    canUndo: boolean;
    undone: boolean;
}

export class ActionHistoryManager {
    private history: ActionSnapshot[] = [];
    private undoneActions: ActionSnapshot[] = [];
    private readonly MAX_HISTORY = 50;

    /**
     * Record an action
     */
    recordAction(action: Omit<ActionSnapshot, 'timestamp' | 'undone'>): string {
        const snapshot: ActionSnapshot = {
            ...action,
            timestamp: Date.now(),
            undone: false
        };

        this.history.push(snapshot);

        // Clear redo stack when new action is taken
        this.undoneActions = [];

        // Trim history if too long
        if (this.history.length > this.MAX_HISTORY) {
            this.history = this.history.slice(-this.MAX_HISTORY);
        }

        return snapshot.id;
    }

    /**
     * Get recent actions
     */
    getRecentActions(count: number = 10): ActionSnapshot[] {
        return this.history
            .filter(a => !a.undone)
            .slice(-count)
            .reverse();
    }

    /**
     * Find action by ID
     */
    findAction(actionId: string): ActionSnapshot | null {
        return this.history.find(a => a.id === actionId) || null;
    }

    /**
     * Find actions by type
     */
    findActionsByType(type: ActionSnapshot['type'], limit: number = 5): ActionSnapshot[] {
        return this.history
            .filter(a => a.type === type && !a.undone)
            .slice(-limit)
            .reverse();
    }

    /**
     * Find last action matching a keyword
     */
    findLastActionByKeyword(keyword: string): ActionSnapshot | null {
        for (let i = this.history.length - 1; i >= 0; i--) {
            const action = this.history[i];
            if (!action.undone &&
                (action.description.toLowerCase().includes(keyword.toLowerCase()) ||
                    action.userCommand.toLowerCase().includes(keyword.toLowerCase()))) {
                return action;
            }
        }
        return null;
    }

    /**
     * Get the last action
     */
    getLastAction(): ActionSnapshot | null {
        const activeActions = this.history.filter(a => !a.undone);
        return activeActions.length > 0 ? activeActions[activeActions.length - 1] : null;
    }

    /**
     * Get the last N actions
     */
    getLastNActions(n: number): ActionSnapshot[] {
        return this.history
            .filter(a => !a.undone)
            .slice(-n);
    }

    /**
     * Mark action as undone
     */
    markAsUndone(actionId: string): boolean {
        const action = this.findAction(actionId);
        if (action && action.canUndo && !action.undone) {
            action.undone = true;
            this.undoneActions.push(action);
            return true;
        }
        return false;
    }

    /**
     * Get state to restore for undo
     */
    getUndoState(actionId: string): any | null {
        const action = this.findAction(actionId);
        return action?.stateBefore || null;
    }

    /**
     * Get state for redo
     */
    getRedoState(actionId: string): any | null {
        const action = this.undoneActions.find(a => a.id === actionId);
        return action?.stateAfter || null;
    }

    /**
     * Can redo last undone action
     */
    canRedo(): boolean {
        return this.undoneActions.length > 0;
    }

    /**
     * Get last undone action for redo
     */
    getLastUndoneAction(): ActionSnapshot | null {
        return this.undoneActions.length > 0
            ? this.undoneActions[this.undoneActions.length - 1]
            : null;
    }

    /**
     * Mark action as redone (remove from undone list)
     */
    markAsRedone(actionId: string): boolean {
        const index = this.undoneActions.findIndex(a => a.id === actionId);
        if (index !== -1) {
            const action = this.undoneActions[index];
            action.undone = false;
            this.undoneActions.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Clear all history
     */
    clearHistory(): void {
        this.history = [];
        this.undoneActions = [];
    }

    /**
     * Get history summary for display
     */
    getHistorySummary(count: number = 10): string[] {
        return this.getRecentActions(count).map(action => {
            const timeAgo = this.formatTimeAgo(action.timestamp);
            return `${timeAgo}: ${action.description}`;
        });
    }

    /**
     * Format timestamp as "X minutes ago"
     */
    private formatTimeAgo(timestamp: number): string {
        const seconds = Math.floor((Date.now() - timestamp) / 1000);

        if (seconds < 60) return 'Just now';
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
        return `${Math.floor(seconds / 86400)}d ago`;
    }
}

// Singleton instance
export const actionHistory = new ActionHistoryManager();
