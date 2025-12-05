/**
 * Canvas Context - State management for the windowed interface
 *
 * Provides centralized state for all windows on the canvas,
 * including their positions, sizes, and states.
 */

import React, { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react';
import {
  CanvasState,
  WindowState,
  WindowAction,
  WindowType,
  WindowPosition,
  WindowSize,
  ChatMode,
  CanvasWallpaper,
  WINDOW_CONFIGS,
  WINDOW_CASCADE_OFFSET
} from '../types/windowTypes';

// Debug flag for canvas/window tracking - set to true to enable console logs
const CANVAS_DEBUG = true;

// Helper for conditional debug logging
const canvasLog = (...args: unknown[]) => {
  if (CANVAS_DEBUG) {
    console.log('[Canvas]', ...args);
  }
};

// Generate unique window ID
const generateWindowId = () => `window-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// localStorage key for persisting window layouts
const CANVAS_STORAGE_KEY = 'fuseiq-canvas-layout';

// Save canvas state to localStorage (debounced)
// Only pinned windows are persisted across sessions
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
const saveCanvasState = (state: CanvasState) => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      // Only save pinned windows, and don't save content state (could be large/stale)
      const pinnedWindows = state.windows.filter(w => w.isPinned);
      canvasLog(`Saving ${pinnedWindows.length} pinned windows to localStorage`);
      pinnedWindows.forEach(w => {
        canvasLog(`  - ${w.type}: entityId=${w.entityId}, brandId=${w.brandId}, title=${w.title}`);
      });

      const stateToSave = {
        ...state,
        windows: pinnedWindows.map(w => ({
          ...w,
          contentState: undefined // Don't persist content state
        }))
      };
      localStorage.setItem(CANVAS_STORAGE_KEY, JSON.stringify(stateToSave));
    } catch (e) {
      console.warn('Failed to save canvas state:', e);
    }
  }, 500); // Debounce 500ms
};

// Load canvas state from localStorage
const loadCanvasState = (): CanvasState | null => {
  try {
    const saved = localStorage.getItem(CANVAS_STORAGE_KEY);
    canvasLog(`Loading from localStorage, found: ${saved ? 'yes' : 'no'}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate the loaded state has expected structure
      if (parsed && Array.isArray(parsed.windows)) {
        const state = parsed as CanvasState;
        canvasLog(`Loaded ${state.windows.length} windows from localStorage:`);
        state.windows.forEach(w => {
          canvasLog(`  - ${w.type}: entityId=${w.entityId}, brandId=${w.brandId}, title=${w.title}, isPinned=${w.isPinned}`);
        });

        // If chatMode is 'floating' but there's no chat window, reset to docked
        // This can happen if the floating chat wasn't pinned and wasn't saved
        if (state.chatMode === 'floating') {
          const hasChatWindow = state.windows.some(w => w.type === 'chat');
          if (!hasChatWindow) {
            state.chatMode = 'docked';
            state.chatWindowId = null;
          }
        }

        return state;
      }
    }
  } catch (e) {
    console.warn('Failed to load canvas state:', e);
  }
  return null;
};

// Initial state
const initialCanvasState: CanvasState = {
  windows: [],
  activeWindowId: null,
  nextZIndex: 1,
  chatPosition: 'right',
  chatWidth: 400,
  chatCollapsed: false,
  chatMode: 'docked',
  chatWindowId: null,
  wallpaper: { type: 'gradient', value: 'from-slate-900 via-slate-800 to-slate-900' }
};

// Window positioning constants
const WINDOW_TOP_MARGIN = 12; // Start windows 12px from top (per user feedback: 10-15px)

// Calculate next window position (cascade)
function getNextWindowPosition(windows: WindowState[], size: WindowSize): WindowPosition {
  if (windows.length === 0) {
    // First window: start near top-left area
    return {
      x: Math.max(50, (window.innerWidth - size.width - 400) / 2), // Account for chat width
      y: WINDOW_TOP_MARGIN
    };
  }

  // Cascade from last window
  const lastWindow = windows[windows.length - 1];
  let x = lastWindow.position.x + WINDOW_CASCADE_OFFSET;
  let y = lastWindow.position.y + WINDOW_CASCADE_OFFSET;

  // Wrap if going off screen
  const maxX = window.innerWidth - size.width - 450; // Account for chat
  const maxY = window.innerHeight - size.height - 50;

  if (x > maxX || y > maxY) {
    x = 50 + (windows.length % 5) * WINDOW_CASCADE_OFFSET;
    y = WINDOW_TOP_MARGIN + (windows.length % 5) * WINDOW_CASCADE_OFFSET;
  }

  return { x: Math.max(0, x), y: Math.max(WINDOW_TOP_MARGIN, y) };
}

// Reducer
function canvasReducer(state: CanvasState, action: WindowAction): CanvasState {
  switch (action.type) {
    case 'OPEN_WINDOW': {
      const config = WINDOW_CONFIGS[action.payload.type];
      const size = action.payload.size || config.defaultSize;
      const position = action.payload.position || getNextWindowPosition(state.windows, size);

      const newWindow: WindowState = {
        id: generateWindowId(),
        type: action.payload.type,
        entityId: action.payload.entityId,
        brandId: action.payload.brandId,  // Store brand context
        title: action.payload.title,
        state: 'normal',
        position,
        size,
        zIndex: state.nextZIndex,
        isActive: true,
        isResizable: config.isResizable,
        isDraggable: config.isDraggable,
        minSize: config.minSize,
        canClose: action.payload.canClose ?? true,
        isPinned: action.payload.isPinned ?? false,  // New windows are unpinned by default
        badge: action.payload.badge,
        contentState: action.payload.contentState
      };

      // Deactivate all other windows
      const updatedWindows = state.windows.map(w => ({ ...w, isActive: false }));

      return {
        ...state,
        windows: [...updatedWindows, newWindow],
        activeWindowId: newWindow.id,
        nextZIndex: state.nextZIndex + 1
      };
    }

    case 'CLOSE_WINDOW': {
      const windowToClose = state.windows.find(w => w.id === action.windowId);
      if (!windowToClose || !windowToClose.canClose) return state;

      const remainingWindows = state.windows.filter(w => w.id !== action.windowId);

      // Activate the next highest z-index window
      let newActiveId: string | null = null;
      if (remainingWindows.length > 0) {
        const sorted = [...remainingWindows].sort((a, b) => b.zIndex - a.zIndex);
        const topWindow = sorted[0];
        newActiveId = topWindow.id;
        remainingWindows.forEach(w => {
          w.isActive = w.id === newActiveId;
        });
      }

      return {
        ...state,
        windows: remainingWindows,
        activeWindowId: newActiveId
      };
    }

    case 'MINIMIZE_WINDOW': {
      return {
        ...state,
        windows: state.windows.map(w => {
          if (w.id !== action.windowId) return w;
          return {
            ...w,
            previousState: {
              position: w.position,
              size: w.size,
              state: w.state
            },
            state: 'minimized',
            isActive: false
          };
        }),
        activeWindowId: state.activeWindowId === action.windowId ? null : state.activeWindowId
      };
    }

    case 'MAXIMIZE_WINDOW': {
      return {
        ...state,
        windows: state.windows.map(w => {
          if (w.id !== action.windowId) return w;
          return {
            ...w,
            previousState: {
              position: w.position,
              size: w.size,
              state: w.state
            },
            state: 'maximized',
            position: { x: 0, y: 0 },
            size: {
              width: window.innerWidth - (state.chatCollapsed ? 50 : state.chatWidth),
              height: window.innerHeight
            },
            zIndex: state.nextZIndex,
            isActive: true
          };
        }),
        activeWindowId: action.windowId,
        nextZIndex: state.nextZIndex + 1
      };
    }

    case 'RESTORE_WINDOW': {
      return {
        ...state,
        windows: state.windows.map(w => {
          if (w.id === action.windowId && w.previousState) {
            // Restore this window and make it active
            return {
              ...w,
              state: 'normal',
              position: w.previousState.position,
              size: w.previousState.size,
              zIndex: state.nextZIndex,
              isActive: true,
              previousState: undefined
            };
          }
          // Deactivate all other windows
          return { ...w, isActive: false };
        }),
        activeWindowId: action.windowId,
        nextZIndex: state.nextZIndex + 1
      };
    }

    case 'FOCUS_WINDOW': {
      return {
        ...state,
        windows: state.windows.map(w => ({
          ...w,
          isActive: w.id === action.windowId,
          zIndex: w.id === action.windowId ? state.nextZIndex : w.zIndex
        })),
        activeWindowId: action.windowId,
        nextZIndex: state.nextZIndex + 1
      };
    }

    case 'MOVE_WINDOW': {
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.windowId ? { ...w, position: action.position } : w
        )
      };
    }

    case 'RESIZE_WINDOW': {
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.windowId ? { ...w, size: action.size } : w
        )
      };
    }

    case 'BRING_TO_FRONT': {
      return {
        ...state,
        windows: state.windows.map(w => ({
          ...w,
          zIndex: w.id === action.windowId ? state.nextZIndex : w.zIndex,
          isActive: w.id === action.windowId
        })),
        activeWindowId: action.windowId,
        nextZIndex: state.nextZIndex + 1
      };
    }

    case 'SEND_TO_BACK': {
      const minZ = Math.min(...state.windows.map(w => w.zIndex));
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.windowId ? { ...w, zIndex: minZ - 1 } : w
        )
      };
    }

    case 'ARRANGE_CASCADE': {
      let offsetX = 50;
      let offsetY = 50;

      return {
        ...state,
        windows: state.windows.map(w => {
          if (w.state === 'minimized') return w;
          const position = { x: offsetX, y: offsetY };
          offsetX += WINDOW_CASCADE_OFFSET;
          offsetY += WINDOW_CASCADE_OFFSET;
          return { ...w, position, state: 'normal' };
        })
      };
    }

    case 'ARRANGE_TILE_HORIZONTAL': {
      const visibleWindows = state.windows.filter(w => w.state !== 'minimized');
      if (visibleWindows.length === 0) return state;

      const canvasWidth = window.innerWidth - (state.chatCollapsed ? 50 : state.chatWidth);
      const windowWidth = canvasWidth / visibleWindows.length;
      let index = 0;

      return {
        ...state,
        windows: state.windows.map(w => {
          if (w.state === 'minimized') return w;
          const position = { x: index * windowWidth, y: 0 };
          const size = { width: windowWidth, height: window.innerHeight };
          index++;
          return { ...w, position, size, state: 'normal' };
        })
      };
    }

    case 'ARRANGE_TILE_VERTICAL': {
      const visibleWindows = state.windows.filter(w => w.state !== 'minimized');
      if (visibleWindows.length === 0) return state;

      const windowHeight = window.innerHeight / visibleWindows.length;
      const canvasWidth = window.innerWidth - (state.chatCollapsed ? 50 : state.chatWidth);
      let index = 0;

      return {
        ...state,
        windows: state.windows.map(w => {
          if (w.state === 'minimized') return w;
          const position = { x: 0, y: index * windowHeight };
          const size = { width: canvasWidth, height: windowHeight };
          index++;
          return { ...w, position, size, state: 'normal' };
        })
      };
    }

    case 'MINIMIZE_ALL': {
      return {
        ...state,
        windows: state.windows.map(w => ({
          ...w,
          previousState: w.state !== 'minimized' ? {
            position: w.position,
            size: w.size,
            state: w.state
          } : w.previousState,
          state: 'minimized',
          isActive: false
        })),
        activeWindowId: null
      };
    }

    case 'RESTORE_ALL': {
      return {
        ...state,
        windows: state.windows.map(w => {
          if (w.state !== 'minimized' || !w.previousState) return w;
          return {
            ...w,
            state: 'normal',
            position: w.previousState.position,
            size: w.previousState.size,
            previousState: undefined
          };
        })
      };
    }

    case 'CLOSE_ALL': {
      return {
        ...state,
        windows: state.windows.filter(w => !w.canClose),
        activeWindowId: null
      };
    }

    case 'SET_CHAT_POSITION': {
      return { ...state, chatPosition: action.position };
    }

    case 'TOGGLE_CHAT_COLLAPSED': {
      return { ...state, chatCollapsed: !state.chatCollapsed };
    }

    case 'SET_CHAT_WIDTH': {
      return { ...state, chatWidth: action.width };
    }

    case 'SET_CHAT_MODE': {
      return { ...state, chatMode: action.mode };
    }

    case 'UNDOCK_CHAT': {
      // Create a floating chat window
      const chatWindowId = generateWindowId();
      const chatConfig = WINDOW_CONFIGS['chat'];

      const chatWindow: WindowState = {
        id: chatWindowId,
        type: 'chat',
        title: 'Chat',
        state: 'normal',
        position: {
          x: window.innerWidth - chatConfig.defaultSize.width - 50,
          y: 50
        },
        size: chatConfig.defaultSize,
        zIndex: state.nextZIndex,
        isActive: true,
        isResizable: chatConfig.isResizable,
        isDraggable: chatConfig.isDraggable,
        minSize: chatConfig.minSize,
        canClose: false,  // Chat window can't be closed, only docked
        isPinned: true    // Chat window is always pinned
      };

      return {
        ...state,
        windows: [...state.windows.map(w => ({ ...w, isActive: false })), chatWindow],
        activeWindowId: chatWindowId,
        nextZIndex: state.nextZIndex + 1,
        chatMode: 'floating',
        chatWindowId
      };
    }

    case 'DOCK_CHAT': {
      // Remove the chat window and switch back to docked mode
      return {
        ...state,
        windows: state.windows.filter(w => w.type !== 'chat'),
        chatMode: 'docked',
        chatWindowId: null,
        activeWindowId: state.activeWindowId === state.chatWindowId
          ? (state.windows.find(w => w.type !== 'chat')?.id || null)
          : state.activeWindowId
      };
    }

    case 'SET_WALLPAPER': {
      return { ...state, wallpaper: action.wallpaper };
    }

    case 'PIN_WINDOW': {
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.windowId ? { ...w, isPinned: true } : w
        )
      };
    }

    case 'UNPIN_WINDOW': {
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.windowId ? { ...w, isPinned: false } : w
        )
      };
    }

    case 'TOGGLE_PIN_WINDOW': {
      return {
        ...state,
        windows: state.windows.map(w =>
          w.id === action.windowId ? { ...w, isPinned: !w.isPinned } : w
        )
      };
    }

    case 'LOAD_STATE': {
      return action.state;
    }

    case 'CLEAR_LAYOUT': {
      return initialCanvasState;
    }

    default:
      return state;
  }
}

// Context types
interface CanvasContextType {
  state: CanvasState;
  dispatch: React.Dispatch<WindowAction>;
  // Convenience methods
  openWindow: (type: WindowType, title: string, entityId?: string, brandId?: string) => void;
  closeWindow: (windowId: string) => void;
  minimizeWindow: (windowId: string) => void;
  maximizeWindow: (windowId: string) => void;
  restoreWindow: (windowId: string) => void;
  focusWindow: (windowId: string) => void;
  togglePinWindow: (windowId: string) => void;
  getActiveWindow: () => WindowState | null;
  findWindowByEntity: (entityId: string) => WindowState | undefined;
}

const CanvasContext = createContext<CanvasContextType | null>(null);

// Provider component
export function CanvasProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(canvasReducer, initialCanvasState);
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Load saved state from localStorage on mount
  useEffect(() => {
    const savedState = loadCanvasState();
    if (savedState) {
      dispatch({ type: 'LOAD_STATE', state: savedState });
    }
    setIsInitialized(true);
  }, []);

  // Save state to localStorage whenever it changes (after initial load)
  useEffect(() => {
    if (isInitialized) {
      saveCanvasState(state);
    }
  }, [state, isInitialized]);

  const openWindow = useCallback((type: WindowType, title: string, entityId?: string, brandId?: string) => {
    // Check if window for this entity AND TYPE AND BRAND already exists
    // (e.g., a flight window and media-plan window can both reference the same flight ID)
    // Also check brandId to allow same entity from different brands
    if (entityId) {
      const existingWindow = state.windows.find(w =>
        w.entityId === entityId &&
        w.type === type &&
        (brandId ? w.brandId === brandId : true)
      );
      if (existingWindow) {
        dispatch({ type: 'FOCUS_WINDOW', windowId: existingWindow.id });
        if (existingWindow.state === 'minimized') {
          dispatch({ type: 'RESTORE_WINDOW', windowId: existingWindow.id });
        }
        return;
      }
    }

    dispatch({
      type: 'OPEN_WINDOW',
      payload: {
        type,
        title,
        entityId,
        brandId,  // Store brand context with the window
        state: 'normal',
        position: { x: 0, y: 0 }, // Will be calculated
        size: WINDOW_CONFIGS[type].defaultSize,
        isResizable: true,
        isDraggable: true,
        minSize: WINDOW_CONFIGS[type].minSize,
        canClose: true,
        isPinned: false  // New windows are unpinned (temporary) by default
      }
    });
  }, [state.windows]);

  const closeWindow = useCallback((windowId: string) => {
    dispatch({ type: 'CLOSE_WINDOW', windowId });
  }, []);

  const minimizeWindow = useCallback((windowId: string) => {
    dispatch({ type: 'MINIMIZE_WINDOW', windowId });
  }, []);

  const maximizeWindow = useCallback((windowId: string) => {
    dispatch({ type: 'MAXIMIZE_WINDOW', windowId });
  }, []);

  const restoreWindow = useCallback((windowId: string) => {
    dispatch({ type: 'RESTORE_WINDOW', windowId });
  }, []);

  const focusWindow = useCallback((windowId: string) => {
    dispatch({ type: 'FOCUS_WINDOW', windowId });
  }, []);

  const togglePinWindow = useCallback((windowId: string) => {
    dispatch({ type: 'TOGGLE_PIN_WINDOW', windowId });
  }, []);

  const getActiveWindow = useCallback(() => {
    return state.windows.find(w => w.id === state.activeWindowId) || null;
  }, [state.windows, state.activeWindowId]);

  const findWindowByEntity = useCallback((entityId: string) => {
    return state.windows.find(w => w.entityId === entityId);
  }, [state.windows]);

  return (
    <CanvasContext.Provider value={{
      state,
      dispatch,
      openWindow,
      closeWindow,
      minimizeWindow,
      maximizeWindow,
      restoreWindow,
      focusWindow,
      togglePinWindow,
      getActiveWindow,
      findWindowByEntity
    }}>
      {children}
    </CanvasContext.Provider>
  );
}

// Hook
export function useCanvas() {
  const context = useContext(CanvasContext);
  if (!context) {
    throw new Error('useCanvas must be used within a CanvasProvider');
  }
  return context;
}

export { CanvasContext };
