/**
 * Window Management Types for Canvas Interface
 *
 * These types define the windowed interface where campaigns, flights,
 * and other views are displayed as resizable, movable windows on a canvas.
 */

export type WindowType =
  | 'campaign'
  | 'flight'
  | 'portfolio'
  | 'report'
  | 'settings'
  | 'media-plan'
  | 'chat';  // Special window type for movable chat

export type WindowStateType = 'normal' | 'maximized' | 'minimized';

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowState {
  id: string;                          // Unique window ID
  type: WindowType;                    // Type of window
  entityId?: string;                   // Campaign ID, Flight ID, etc.
  title: string;                       // Window title
  state: WindowStateType;              // Current window state
  position: WindowPosition;            // Position on canvas
  size: WindowSize;                    // Current size
  zIndex: number;                      // Stacking order
  isActive: boolean;                   // Currently focused
  isResizable: boolean;                // Can be resized
  isDraggable: boolean;                // Can be dragged
  minSize: WindowSize;                 // Minimum allowed size
  maxSize?: WindowSize;                // Maximum allowed size (optional)
  canClose: boolean;                   // Can be closed (some windows might be pinned)
  isPinned: boolean;                   // Pinned windows persist across sessions
  badge?: string | number;             // Notification badge
  contentState?: any;                  // Scroll position, selected tab, etc.
  previousState?: {                    // For restore after minimize/maximize
    position: WindowPosition;
    size: WindowSize;
    state: WindowStateType;
  };
}

export type ChatPosition = 'bottom-right' | 'bottom-left' | 'right' | 'left';
export type ChatMode = 'docked' | 'floating';  // Docked = anchored to edge, Floating = movable window

export interface CanvasWallpaper {
  type: 'none' | 'gradient' | 'image' | 'pattern';
  value?: string;        // URL for image, gradient CSS, or pattern name
  opacity?: number;      // 0-1 for overlay opacity
}

export interface CanvasState {
  windows: WindowState[];
  activeWindowId: string | null;
  nextZIndex: number;
  chatPosition: ChatPosition;
  chatWidth: number;                   // Width of chat panel (when docked)
  chatCollapsed: boolean;              // Is chat minimized to icon
  chatMode: ChatMode;                  // Is chat docked or floating
  chatWindowId: string | null;         // ID of chat window when floating
  wallpaper: CanvasWallpaper;          // Canvas background wallpaper
}

// Default values for new windows
export const DEFAULT_WINDOW_SIZE: WindowSize = {
  width: 800,
  height: 600
};

export const DEFAULT_MIN_SIZE: WindowSize = {
  width: 400,
  height: 300
};

export const WINDOW_CASCADE_OFFSET = 30; // Pixels to offset each new window

// Window type configurations
export const WINDOW_CONFIGS: Record<WindowType, {
  defaultSize: WindowSize;
  minSize: WindowSize;
  isResizable: boolean;
  isDraggable: boolean;
}> = {
  'campaign': {
    defaultSize: { width: 900, height: 650 },
    minSize: { width: 500, height: 400 },
    isResizable: true,
    isDraggable: true
  },
  'flight': {
    defaultSize: { width: 850, height: 600 },
    minSize: { width: 450, height: 350 },
    isResizable: true,
    isDraggable: true
  },
  'portfolio': {
    defaultSize: { width: 1000, height: 700 },
    minSize: { width: 600, height: 450 },
    isResizable: true,
    isDraggable: true
  },
  'report': {
    defaultSize: { width: 900, height: 650 },
    minSize: { width: 500, height: 400 },
    isResizable: true,
    isDraggable: true
  },
  'settings': {
    defaultSize: { width: 600, height: 500 },
    minSize: { width: 400, height: 350 },
    isResizable: true,
    isDraggable: true
  },
  'media-plan': {
    defaultSize: { width: 950, height: 700 },
    minSize: { width: 600, height: 450 },
    isResizable: true,
    isDraggable: true
  },
  'chat': {
    defaultSize: { width: 400, height: 600 },
    minSize: { width: 300, height: 400 },
    isResizable: true,
    isDraggable: true
  }
};

// Action types for window management
export type WindowAction =
  | { type: 'OPEN_WINDOW'; payload: Omit<WindowState, 'id' | 'zIndex' | 'isActive'> }
  | { type: 'CLOSE_WINDOW'; windowId: string }
  | { type: 'MINIMIZE_WINDOW'; windowId: string }
  | { type: 'MAXIMIZE_WINDOW'; windowId: string }
  | { type: 'RESTORE_WINDOW'; windowId: string }
  | { type: 'FOCUS_WINDOW'; windowId: string }
  | { type: 'MOVE_WINDOW'; windowId: string; position: WindowPosition }
  | { type: 'RESIZE_WINDOW'; windowId: string; size: WindowSize }
  | { type: 'BRING_TO_FRONT'; windowId: string }
  | { type: 'SEND_TO_BACK'; windowId: string }
  | { type: 'ARRANGE_CASCADE' }
  | { type: 'ARRANGE_TILE_HORIZONTAL' }
  | { type: 'ARRANGE_TILE_VERTICAL' }
  | { type: 'MINIMIZE_ALL' }
  | { type: 'RESTORE_ALL' }
  | { type: 'CLOSE_ALL' }
  | { type: 'SET_CHAT_POSITION'; position: ChatPosition }
  | { type: 'TOGGLE_CHAT_COLLAPSED' }
  | { type: 'SET_CHAT_WIDTH'; width: number }
  | { type: 'SET_CHAT_MODE'; mode: ChatMode }
  | { type: 'UNDOCK_CHAT' }   // Convert docked chat to floating window
  | { type: 'DOCK_CHAT' }     // Convert floating chat back to docked
  | { type: 'SET_WALLPAPER'; wallpaper: CanvasWallpaper }
  | { type: 'PIN_WINDOW'; windowId: string }      // Pin window to persist across sessions
  | { type: 'UNPIN_WINDOW'; windowId: string }    // Unpin window (temporary, closes with session)
  | { type: 'TOGGLE_PIN_WINDOW'; windowId: string }  // Toggle pin state
  | { type: 'LOAD_STATE'; state: CanvasState }
  | { type: 'CLEAR_LAYOUT' };
