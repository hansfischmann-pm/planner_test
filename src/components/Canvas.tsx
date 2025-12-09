/**
 * Canvas Component - The main workspace for the windowed interface
 *
 * This is the primary container that holds all windows and the chat interface.
 * It manages the overall layout and provides the canvas background.
 */

import { useMemo, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { useCanvas } from '../context/CanvasContext';
import { Window } from './Window';
import { WindowTaskbar } from './WindowTaskbar';
import { WindowType } from '../types/windowTypes';
import { Move } from 'lucide-react';

// Content components for different window types
// These will be replaced with actual components later
interface WindowContentProps {
  entityId?: string;
  windowType: WindowType;
}

function WindowContent({ entityId, windowType }: WindowContentProps) {
  // Placeholder content - will be replaced with actual components
  return (
    <div className="p-4 h-full">
      <div className="text-gray-600 text-sm mb-2">
        Window Type: <span className="font-medium">{windowType}</span>
      </div>
      {entityId && (
        <div className="text-gray-600 text-sm mb-2">
          Entity ID: <span className="font-medium">{entityId}</span>
        </div>
      )}
      <div className="text-gray-500 text-xs mt-4">
        Content for this window type will be rendered here.
      </div>
    </div>
  );
}

interface CanvasProps {
  chatComponent: ReactNode;
  renderWindowContent?: (windowType: WindowType, entityId?: string, brandId?: string) => ReactNode;
}

export function Canvas({ chatComponent, renderWindowContent }: CanvasProps) {
  const { state, gatherWindows, hasOffscreenWindows, setCanvasOffset } = useCanvas();

  // Track viewport size for scroll bar calculations (re-render on resize)
  const [viewportDimensions, setViewportDimensions] = useState({ width: 0, height: 0 });

  // Refs for scroll bar dragging
  const isDraggingScrollX = useRef(false);
  const isDraggingScrollY = useRef(false);
  const scrollStartPos = useRef({ x: 0, y: 0 });
  const scrollStartOffset = useRef({ x: 0, y: 0 });

  // Calculate the bounds of all windows (the virtual canvas size)
  const canvasBounds = useMemo(() => {
    const nonChatWindows = state.windows.filter(w => w.type !== 'chat' && w.state !== 'minimized');
    if (nonChatWindows.length === 0) {
      return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
    }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    nonChatWindows.forEach(w => {
      minX = Math.min(minX, w.position.x);
      minY = Math.min(minY, w.position.y);
      maxX = Math.max(maxX, w.position.x + w.size.width);
      maxY = Math.max(maxY, w.position.y + w.size.height);
    });

    // Add padding around the bounds
    const PADDING = 100;
    return {
      minX: minX - PADDING,
      minY: minY - PADDING,
      maxX: maxX + PADDING,
      maxY: maxY + PADDING,
      width: maxX - minX + PADDING * 2,
      height: maxY - minY + PADDING * 2
    };
  }, [state.windows]);

  // Calculate viewport dimensions (uses tracked dimensions for reactivity)
  const viewportSize = useMemo(() => {
    const chatWidth = state.chatMode === 'docked' ? (state.chatCollapsed ? 50 : state.chatWidth) : 0;
    const width = viewportDimensions.width || (typeof window !== 'undefined' ? window.innerWidth : 1200);
    const height = viewportDimensions.height || (typeof window !== 'undefined' ? window.innerHeight : 800);
    return {
      width: width - chatWidth,
      height: height
    };
  }, [state.chatMode, state.chatCollapsed, state.chatWidth, viewportDimensions]);

  // Determine if scroll bars should be shown
  const showScrollBars = useMemo(() => {
    const showX = canvasBounds.width > viewportSize.width ||
                  canvasBounds.minX < 0 ||
                  canvasBounds.maxX > viewportSize.width;
    const showY = canvasBounds.height > viewportSize.height ||
                  canvasBounds.minY < 0 ||
                  canvasBounds.maxY > viewportSize.height;
    return { x: showX, y: showY };
  }, [canvasBounds, viewportSize]);

  // Calculate scroll bar positions and sizes
  const scrollBarInfo = useMemo(() => {
    const offset = state.canvasOffset || { x: 0, y: 0 };

    // Total scrollable range (virtual canvas size minus viewport)
    const scrollRangeX = Math.max(0, canvasBounds.width - viewportSize.width);
    const scrollRangeY = Math.max(0, canvasBounds.height - viewportSize.height);

    // Current scroll position as percentage
    const currentOffsetX = -offset.x - canvasBounds.minX;
    const currentOffsetY = -offset.y - canvasBounds.minY;

    const scrollPercentX = scrollRangeX > 0 ? Math.max(0, Math.min(1, currentOffsetX / scrollRangeX)) : 0;
    const scrollPercentY = scrollRangeY > 0 ? Math.max(0, Math.min(1, currentOffsetY / scrollRangeY)) : 0;

    // Scroll bar thumb size as percentage of track
    const thumbSizeX = Math.max(0.1, Math.min(1, viewportSize.width / canvasBounds.width));
    const thumbSizeY = Math.max(0.1, Math.min(1, viewportSize.height / canvasBounds.height));

    return {
      scrollPercentX,
      scrollPercentY,
      thumbSizeX,
      thumbSizeY,
      scrollRangeX,
      scrollRangeY
    };
  }, [state.canvasOffset, canvasBounds, viewportSize]);

  // Handle scroll bar drag
  const handleScrollBarMouseDown = useCallback((axis: 'x' | 'y', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (axis === 'x') {
      isDraggingScrollX.current = true;
    } else {
      isDraggingScrollY.current = true;
    }
    scrollStartPos.current = { x: e.clientX, y: e.clientY };
    scrollStartOffset.current = state.canvasOffset || { x: 0, y: 0 };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingScrollX.current && !isDraggingScrollY.current) return;

      const deltaX = moveEvent.clientX - scrollStartPos.current.x;
      const deltaY = moveEvent.clientY - scrollStartPos.current.y;

      // Calculate new offset based on scroll bar movement
      // Scroll bar track length is viewport size minus thumb size
      const trackLengthX = viewportSize.width - 40; // Account for padding
      const trackLengthY = viewportSize.height - 40;

      const thumbLengthX = trackLengthX * scrollBarInfo.thumbSizeX;
      const thumbLengthY = trackLengthY * scrollBarInfo.thumbSizeY;

      const availableTrackX = trackLengthX - thumbLengthX;
      const availableTrackY = trackLengthY - thumbLengthY;

      let newOffset = { ...scrollStartOffset.current };

      if (isDraggingScrollX.current && availableTrackX > 0) {
        // Convert scroll bar movement to canvas offset
        const scrollRatio = deltaX / availableTrackX;
        const offsetDelta = scrollRatio * scrollBarInfo.scrollRangeX;
        newOffset.x = scrollStartOffset.current.x - offsetDelta;
      }

      if (isDraggingScrollY.current && availableTrackY > 0) {
        const scrollRatio = deltaY / availableTrackY;
        const offsetDelta = scrollRatio * scrollBarInfo.scrollRangeY;
        newOffset.y = scrollStartOffset.current.y - offsetDelta;
      }

      // Clamp the offset to valid bounds
      const maxOffsetX = -canvasBounds.minX;
      const minOffsetX = -(canvasBounds.maxX - viewportSize.width);
      const maxOffsetY = -canvasBounds.minY;
      const minOffsetY = -(canvasBounds.maxY - viewportSize.height);

      newOffset.x = Math.max(minOffsetX, Math.min(maxOffsetX, newOffset.x));
      newOffset.y = Math.max(minOffsetY, Math.min(maxOffsetY, newOffset.y));

      setCanvasOffset(newOffset);
    };

    const handleMouseUp = () => {
      isDraggingScrollX.current = false;
      isDraggingScrollY.current = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [state.canvasOffset, viewportSize, canvasBounds, scrollBarInfo, setCanvasOffset]);

  // Update viewport dimensions on resize
  useEffect(() => {
    const updateViewport = () => {
      setViewportDimensions({ width: window.innerWidth, height: window.innerHeight });
    };

    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  // Separate minimized windows and chat window for taskbar
  const { visibleWindows, minimizedWindows, chatWindow } = useMemo(() => {
    const visible = state.windows.filter(w => w.state !== 'minimized' && w.type !== 'chat');
    const minimized = state.windows.filter(w => w.state === 'minimized');
    const chat = state.windows.find(w => w.type === 'chat' && w.state !== 'minimized');
    return { visibleWindows: visible, minimizedWindows: minimized, chatWindow: chat };
  }, [state.windows]);

  // Calculate chat panel width (only when docked)
  const chatPanelWidth = state.chatMode === 'docked'
    ? (state.chatCollapsed ? 50 : state.chatWidth)
    : 0;

  // Count non-chat windows for empty state
  const nonChatWindowCount = state.windows.filter(w => w.type !== 'chat').length;

  // Generate wallpaper styles
  const getWallpaperStyles = () => {
    const { wallpaper } = state;
    if (!wallpaper || wallpaper.type === 'none') {
      return { background: '#1e293b' }; // Default slate-800
    }

    if (wallpaper.type === 'gradient') {
      // Use Tailwind-like gradient classes
      return { className: `bg-gradient-to-br ${wallpaper.value || 'from-slate-900 via-slate-800 to-slate-900'}` };
    }

    if (wallpaper.type === 'image' && wallpaper.value) {
      return {
        style: {
          backgroundImage: `url(${wallpaper.value})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }
      };
    }

    return { className: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' };
  };

  const wallpaperStyles = getWallpaperStyles();

  return (
    <div
      className={`fixed inset-0 overflow-hidden ${wallpaperStyles.className || ''}`}
      style={wallpaperStyles.style}
    >
      {/* Canvas Background Pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />

      {/* Canvas Info/Help (shown when no windows open) */}
      {nonChatWindowCount === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-white/40">
            <div className="text-6xl mb-4">FuseIQ</div>
            <div className="text-lg">Open a campaign or portfolio to get started</div>
            <div className="text-sm mt-2">Try: "Open Nike Q4 campaign" or "Show portfolio dashboard"</div>
          </div>
        </div>
      )}

      {/* Windows Container */}
      <div
        className="absolute top-0 left-0 bottom-0 overflow-hidden"
        style={{
          right: chatPanelWidth,
          paddingBottom: minimizedWindows.length > 0 ? 48 : 0 // Space for taskbar
        }}
      >
        {/* Gather Windows Button - only show when windows are offscreen */}
        {visibleWindows.length > 0 && hasOffscreenWindows() && (
          <button
            onClick={gatherWindows}
            className="absolute top-3 left-3 z-50 flex items-center gap-2 px-2.5 py-1.5 bg-slate-700/80 hover:bg-slate-600 text-white/80 hover:text-white text-xs font-medium rounded shadow-md transition-all backdrop-blur-sm border border-slate-600/50"
            title="Gather all windows to visible area"
          >
            <Move className="w-3.5 h-3.5" />
            Gather
          </button>
        )}

        {/* Regular windows - offset by canvas pan position */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translate(${state.canvasOffset?.x || 0}px, ${state.canvasOffset?.y || 0}px)`
          }}
        >
          {visibleWindows.map(window => (
            <Window
              key={window.id}
              window={window}
              path={window.title} // Title contains the path (e.g., "Campaign > Flight")
            >
              {renderWindowContent
                ? renderWindowContent(window.type, window.entityId, window.brandId)
                : <WindowContent
                    entityId={window.entityId}
                    windowType={window.type}
                  />
              }
            </Window>
          ))}

          {/* Floating chat window (when undocked) */}
          {chatWindow && state.chatMode === 'floating' && (
            <Window key={chatWindow.id} window={chatWindow}>
              {chatComponent}
            </Window>
          )}
        </div>

        {/* Taskbar for minimized windows */}
        <WindowTaskbar minimizedWindows={minimizedWindows} />

        {/* Horizontal Scroll Bar - at very bottom edge */}
        {showScrollBars.x && (
          <div
            className="absolute left-0 h-2 z-50 group"
            style={{
              bottom: minimizedWindows.length > 0 ? 48 : 0,
              right: showScrollBars.y ? 8 : 0
            }}
          >
            {/* Track */}
            <div className="relative h-full w-full bg-black/30">
              {/* Thumb */}
              <div
                className="absolute top-0 h-full bg-white/60 hover:bg-white/80 rounded-sm cursor-grab active:cursor-grabbing transition-colors"
                style={{
                  left: `${scrollBarInfo.scrollPercentX * (100 - scrollBarInfo.thumbSizeX * 100)}%`,
                  width: `${Math.max(10, scrollBarInfo.thumbSizeX * 100)}%`,
                  minWidth: '24px'
                }}
                onMouseDown={(e) => handleScrollBarMouseDown('x', e)}
              />
            </div>
          </div>
        )}

        {/* Vertical Scroll Bar - at very right edge */}
        {showScrollBars.y && (
          <div
            className="absolute top-0 w-2 z-50 group"
            style={{
              right: 0,
              bottom: (minimizedWindows.length > 0 ? 48 : 0) + (showScrollBars.x ? 8 : 0)
            }}
          >
            {/* Track */}
            <div className="relative w-full h-full bg-black/30">
              {/* Thumb */}
              <div
                className="absolute left-0 w-full bg-white/60 hover:bg-white/80 rounded-sm cursor-grab active:cursor-grabbing transition-colors"
                style={{
                  top: `${scrollBarInfo.scrollPercentY * (100 - scrollBarInfo.thumbSizeY * 100)}%`,
                  height: `${Math.max(10, scrollBarInfo.thumbSizeY * 100)}%`,
                  minHeight: '24px'
                }}
                onMouseDown={(e) => handleScrollBarMouseDown('y', e)}
              />
            </div>
          </div>
        )}
      </div>

      {/* Docked Chat Panel (right side) - only when in docked mode */}
      {state.chatMode === 'docked' && (
        <div
          className="absolute top-0 right-0 bottom-0 bg-white border-l border-gray-200 shadow-xl flex flex-col"
          style={{ width: chatPanelWidth }}
        >
          {chatComponent}
        </div>
      )}
    </div>
  );
}

export default Canvas;
