/**
 * Window Component - A draggable, resizable window container
 *
 * Uses react-rnd for drag and resize functionality.
 * Displays content within a window frame with title bar and controls.
 */

import { useCallback, useRef, useEffect, useState, ReactNode } from 'react';
import { Rnd } from 'react-rnd';
import {
  X,
  Minus,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Pin,
  PinOff,
  Copy,
  Link
} from 'lucide-react';
import { WindowState } from '../types/windowTypes';
import { useCanvas } from '../context/CanvasContext';

interface WindowProps {
  window: WindowState;
  children: ReactNode;
  path?: string; // Optional path for hierarchical windows (e.g., "Brand > Campaign > Flight")
}

export function Window({ window: windowState, children, path }: WindowProps) {
  const { dispatch, focusWindow, closeWindow, minimizeWindow, maximizeWindow, restoreWindow, togglePinWindow } = useCanvas();
  const rndRef = useRef<Rnd>(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [showCopiedToast, setShowCopiedToast] = useState<string | null>(null);

  // Handle window focus on click
  // Always call focusWindow - even if we think we're active, this ensures
  // the context updates correctly for multi-client windows
  const handleFocus = useCallback(() => {
    focusWindow(windowState.id);
  }, [windowState.id, focusWindow]);

  // Handle drag stop
  const handleDragStop = useCallback((_e: any, d: { x: number; y: number }) => {
    dispatch({
      type: 'MOVE_WINDOW',
      windowId: windowState.id,
      position: { x: d.x, y: d.y }
    });
  }, [dispatch, windowState.id]);

  // Handle resize stop
  const handleResizeStop = useCallback(
    (_e: any, _direction: any, ref: HTMLElement, _delta: any, position: { x: number; y: number }) => {
      dispatch({
        type: 'RESIZE_WINDOW',
        windowId: windowState.id,
        size: {
          width: parseInt(ref.style.width, 10),
          height: parseInt(ref.style.height, 10)
        }
      });
      dispatch({
        type: 'MOVE_WINDOW',
        windowId: windowState.id,
        position
      });
    },
    [dispatch, windowState.id]
  );

  // Handle maximize/restore toggle
  const handleMaximizeToggle = useCallback(() => {
    if (windowState.state === 'maximized') {
      restoreWindow(windowState.id);
    } else {
      maximizeWindow(windowState.id);
    }
  }, [windowState.id, windowState.state, maximizeWindow, restoreWindow]);

  // Handle minimize
  const handleMinimize = useCallback(() => {
    minimizeWindow(windowState.id);
  }, [windowState.id, minimizeWindow]);

  // Handle close
  const handleClose = useCallback(() => {
    closeWindow(windowState.id);
  }, [windowState.id, closeWindow]);

  // Handle pin toggle
  const handlePinToggle = useCallback(() => {
    togglePinWindow(windowState.id);
  }, [windowState.id, togglePinWindow]);

  // Handle context menu on title
  const handleTitleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  }, []);

  // Copy to clipboard helper
  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setShowCopiedToast(label);
      setTimeout(() => setShowCopiedToast(null), 2000);
    });
    setContextMenu(null);
  }, []);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu]);

  // Handle escape key to close active window
  useEffect(() => {
    if (!windowState.isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && windowState.canClose) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [windowState.isActive, windowState.canClose, handleClose]);

  // Don't render if minimized
  if (windowState.state === 'minimized') {
    return null;
  }

  const isMaximized = windowState.state === 'maximized';

  return (
    <Rnd
      ref={rndRef}
      position={windowState.position}
      size={windowState.size}
      minWidth={windowState.minSize.width}
      minHeight={windowState.minSize.height}
      maxWidth={windowState.maxSize?.width}
      maxHeight={windowState.maxSize?.height}
      bounds="parent"
      dragHandleClassName="window-drag-handle"
      enableResizing={windowState.isResizable && !isMaximized}
      disableDragging={!windowState.isDraggable || isMaximized}
      onDragStop={handleDragStop}
      onResizeStop={handleResizeStop}
      onMouseDown={handleFocus}
      style={{ zIndex: windowState.zIndex }}
      resizeHandleStyles={{
        bottomRight: {
          width: '20px',
          height: '20px',
          bottom: '0px',
          right: '0px',
          cursor: 'se-resize'
        },
        bottom: { height: '8px', cursor: 's-resize' },
        right: { width: '8px', cursor: 'e-resize' },
        top: { height: '4px', cursor: 'n-resize' },
        left: { width: '4px', cursor: 'w-resize' },
        topRight: { width: '12px', height: '12px', cursor: 'ne-resize' },
        bottomLeft: { width: '12px', height: '12px', cursor: 'sw-resize' },
        topLeft: { width: '12px', height: '12px', cursor: 'nw-resize' }
      }}
      className={`
        absolute rounded-lg overflow-hidden shadow-2xl
        ${windowState.isActive ? 'ring-2 ring-blue-500' : 'ring-1 ring-gray-300'}
        ${isMaximized ? 'rounded-none' : ''}
        transition-shadow duration-150
      `}
    >
      <div className="flex flex-col h-full bg-white">
        {/* Title Bar */}
        <div
          className={`
            window-drag-handle
            flex items-center justify-between px-3 py-2
            ${windowState.isActive
              ? 'bg-gradient-to-r from-blue-600 to-blue-700'
              : 'bg-gray-500'
            }
            cursor-move select-none
          `}
        >
          {/* Left: Title and Badge */}
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="text-white font-medium text-sm truncate cursor-default"
              onContextMenu={handleTitleContextMenu}
              title={path || windowState.title}
            >
              {windowState.title}
            </span>
            {windowState.badge && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {windowState.badge}
              </span>
            )}
          </div>

          {/* Right: Window Controls */}
          <div className="flex items-center gap-1 ml-2">
            {/* Pin/Unpin toggle */}
            <button
              className={`p-1 rounded transition-colors ${
                windowState.isPinned
                  ? 'bg-white/30 text-white hover:bg-white/40'
                  : 'hover:bg-white/20 text-white/60 hover:text-white'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                handlePinToggle();
              }}
              title={windowState.isPinned ? 'Unpin (window will close with session)' : 'Pin (window persists across sessions)'}
            >
              {windowState.isPinned ? <Pin size={14} /> : <PinOff size={14} />}
            </button>

            {/* More options */}
            <button
              className="p-1 hover:bg-white/20 rounded text-white/80 hover:text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                // TODO: Show context menu
              }}
              title="More options"
            >
              <MoreHorizontal size={14} />
            </button>

            {/* Minimize */}
            <button
              className="p-1 hover:bg-white/20 rounded text-white/80 hover:text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleMinimize();
              }}
              title="Minimize"
            >
              <Minus size={14} />
            </button>

            {/* Maximize/Restore */}
            <button
              className="p-1 hover:bg-white/20 rounded text-white/80 hover:text-white transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                handleMaximizeToggle();
              }}
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            {/* Close */}
            {windowState.canClose && (
              <button
                className="p-1 hover:bg-red-500 rounded text-white/80 hover:text-white transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                title="Close"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Context Menu for Title */}
        {contextMenu && (
          <div
            className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[160px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              onClick={() => copyToClipboard(windowState.title, 'Name copied')}
            >
              <Copy size={14} className="text-gray-400" />
              Copy Name
            </button>
            {path && (
              <button
                className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                onClick={() => copyToClipboard(path, 'Path copied')}
              >
                <Link size={14} className="text-gray-400" />
                Copy Path
              </button>
            )}
            <div className="border-t border-gray-100 my-1" />
            <div className="px-3 py-1 text-xs text-gray-400 truncate max-w-[200px]">
              {path || windowState.title}
            </div>
          </div>
        )}

        {/* Copied Toast */}
        {showCopiedToast && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-full shadow-lg z-50 animate-fade-in">
            {showCopiedToast}
          </div>
        )}

        {/* Content Area - pointer-events-auto but with padding for resize handle */}
        <div className="flex-1 overflow-auto bg-gray-50 relative">
          <div className="h-full" style={{ paddingBottom: windowState.isResizable && !isMaximized ? '16px' : 0 }}>
            {children}
          </div>
        </div>

        {/* Resize Handle Area (bottom-right corner) - larger touch target */}
        {windowState.isResizable && !isMaximized && (
          <div
            className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize z-50"
            style={{ pointerEvents: 'none' }} // Let react-rnd handle the actual resize
          >
            <svg
              className="w-3 h-3 text-gray-400 absolute bottom-1 right-1"
              viewBox="0 0 10 10"
            >
              <path
                d="M9 1L1 9M9 5L5 9M9 9L9 9"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        )}
      </div>
    </Rnd>
  );
}

export default Window;
