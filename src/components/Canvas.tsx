/**
 * Canvas Component - The main workspace for the windowed interface
 *
 * This is the primary container that holds all windows and the chat interface.
 * It manages the overall layout and provides the canvas background.
 */

import { useMemo, ReactNode } from 'react';
import { useCanvas } from '../context/CanvasContext';
import { Window } from './Window';
import { WindowTaskbar } from './WindowTaskbar';
import { WindowType } from '../types/windowTypes';

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
  const { state } = useCanvas();

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
        {/* Regular windows */}
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

        {/* Taskbar for minimized windows */}
        <WindowTaskbar minimizedWindows={minimizedWindows} />
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
