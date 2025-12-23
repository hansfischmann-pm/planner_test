/**
 * WindowManager - Handles window management commands
 *
 * This module extracts window-related commands from AgentBrain,
 * including tile, cascade, minimize, maximize, close, focus, etc.
 */

import { AgentMessage } from '../types';
import { createAgentMessage } from './AgentContext';
import { findMatchingCommand } from './CommandRegistry';

export interface WindowCommandResult {
    handled: boolean;
    response?: AgentMessage;
}

/**
 * Handle window management commands (Phase 2 - Canvas Integration)
 * Returns null if the input doesn't match any window command
 */
export function handleWindowCommand(input: string): AgentMessage | null {
    const match = findMatchingCommand(input);
    if (!match || match.command.category !== 'WINDOW_MANAGEMENT') {
        return null;
    }

    const { command } = match;
    let responseContent = '';
    let action: string | undefined;
    let suggestedActions: string[] = [];

    // Map command IDs to actions and responses
    switch (command.id) {
        case 'close_window':
            action = 'WINDOW_CLOSE';
            responseContent = "Closing the window.";
            suggestedActions = ['Open portfolio', 'Show campaigns'];
            break;

        case 'minimize_window':
            action = 'WINDOW_MINIMIZE';
            responseContent = "Minimizing the window.";
            suggestedActions = ['Restore window', 'Show all windows'];
            break;

        case 'maximize_window':
            action = 'WINDOW_MAXIMIZE';
            responseContent = "Maximizing the window.";
            suggestedActions = ['Restore window'];
            break;

        case 'restore_window':
            action = 'WINDOW_RESTORE';
            responseContent = "Restoring the window.";
            suggestedActions = ['Maximize window', 'Tile windows'];
            break;

        case 'tile_windows': {
            // Check for horizontal/vertical in the match
            const tileMatch = input.match(/tile\s+(horizontal|vertical)/i);
            if (tileMatch) {
                const direction = tileMatch[1].toLowerCase();
                action = direction === 'horizontal' ? 'WINDOW_TILE_HORIZONTAL' : 'WINDOW_TILE_VERTICAL';
                responseContent = `Tiling windows ${direction}ly.`;
            } else {
                action = 'WINDOW_TILE_HORIZONTAL'; // Default to horizontal
                responseContent = "Tiling windows horizontally.";
            }
            suggestedActions = ['Cascade windows', 'Minimize all'];
            break;
        }

        case 'cascade_windows':
            action = 'WINDOW_CASCADE';
            responseContent = "Cascading windows.";
            suggestedActions = ['Tile windows', 'Minimize all'];
            break;

        case 'minimize_all':
            action = 'WINDOW_MINIMIZE_ALL';
            responseContent = "Minimizing all windows.";
            suggestedActions = ['Restore all', 'Open campaign'];
            break;

        case 'restore_all':
            action = 'WINDOW_RESTORE_ALL';
            responseContent = "Restoring all windows.";
            suggestedActions = ['Tile windows', 'Cascade windows'];
            break;

        case 'close_all':
            action = 'WINDOW_CLOSE_ALL';
            responseContent = "Closing all windows.";
            suggestedActions = ['Open portfolio', 'Open campaign'];
            break;

        case 'focus_window': {
            // Extract the window name from the match
            const focusMatch = input.match(/(?:switch|go)\s+to\s+(?:the\s+)?(.+?)(?:\s+window)?$/i) ||
                               input.match(/focus\s+(?:on\s+)?(?:the\s+)?(.+?)(?:\s+window)?$/i) ||
                               input.match(/bring\s+(.+)\s+to\s+(?:the\s+)?front/i) ||
                               input.match(/show\s+(?:me\s+)?(?:the\s+)?(.+?)(?:\s+window)?$/i);
            const windowName = focusMatch?.[1]?.trim();
            action = 'WINDOW_FOCUS';
            responseContent = windowName
                ? `Focusing on the ${windowName} window.`
                : "Focusing on the window.";
            suggestedActions = ['Tile windows', 'Close window'];
            break;
        }

        case 'open_window': {
            // Extract window type from the match
            const openMatch = input.match(/(?:open|new)\s+(?:a\s+)?(?:new\s+)?(campaign|flight|portfolio|report|settings|audience|chat)\s*(?:window)?/i);
            const windowType = openMatch?.[1]?.toLowerCase();
            action = 'WINDOW_OPEN';
            responseContent = windowType
                ? `Opening a new ${windowType} window.`
                : "Opening a new window.";
            suggestedActions = ['Tile windows', 'Close window'];
            break;
        }

        case 'gather_windows':
            action = 'WINDOW_GATHER';
            responseContent = "Bringing all windows back to the visible area.";
            suggestedActions = ['Tile windows', 'Cascade windows'];
            break;

        case 'pin_window':
            action = 'WINDOW_PIN';
            responseContent = "Pinning this window. It will persist across sessions.";
            suggestedActions = ['Unpin window', 'Close window'];
            break;

        case 'unpin_window':
            action = 'WINDOW_UNPIN';
            responseContent = "Unpinning this window. It won't persist after you close it.";
            suggestedActions = ['Pin window', 'Close window'];
            break;

        default:
            return null;
    }

    return createAgentMessage(responseContent, suggestedActions, action as any);
}

export const windowManager = {
    handleWindowCommand
};
