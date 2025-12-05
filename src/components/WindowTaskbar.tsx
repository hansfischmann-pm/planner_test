/**
 * WindowTaskbar Component - Shows minimized windows
 *
 * Displays at the bottom of the canvas, showing buttons for
 * minimized windows that can be clicked to restore them.
 */

import { } from 'react';
import {
  Layers,
  BarChart3,
  FileText,
  Settings,
  FolderOpen,
  Maximize2,
  MessageSquare
} from 'lucide-react';
import { WindowState, WindowType } from '../types/windowTypes';
import { useCanvas } from '../context/CanvasContext';

interface WindowTaskbarProps {
  minimizedWindows: WindowState[];
}

// Icon mapping for window types
const windowTypeIcons: Record<WindowType, typeof FolderOpen> = {
  'campaign': FolderOpen,
  'flight': Layers,
  'portfolio': BarChart3,
  'report': FileText,
  'settings': Settings,
  'media-plan': Layers,
  'chat': MessageSquare
};

export function WindowTaskbar({ minimizedWindows }: WindowTaskbarProps) {
  const { restoreWindow, dispatch } = useCanvas();

  if (minimizedWindows.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gray-800 border-t border-gray-700 flex items-center px-2 gap-1 z-50">
      {/* Minimized window buttons */}
      {minimizedWindows.map(window => {
        const Icon = windowTypeIcons[window.type] || Layers;
        return (
          <button
            key={window.id}
            onClick={() => restoreWindow(window.id)}
            className="
              flex items-center gap-2 px-3 py-1.5
              bg-gray-700 hover:bg-gray-600
              rounded text-sm text-white
              transition-colors
              max-w-[200px]
            "
            title={`Restore: ${window.title}`}
          >
            <Icon size={14} className="flex-shrink-0" />
            <span className="truncate">{window.title}</span>
            {window.badge && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full ml-1">
                {window.badge}
              </span>
            )}
          </button>
        );
      })}

      {/* Restore All button */}
      {minimizedWindows.length > 1 && (
        <button
          onClick={() => dispatch({ type: 'RESTORE_ALL' })}
          className="
            flex items-center gap-1 px-2 py-1.5 ml-2
            bg-blue-600 hover:bg-blue-500
            rounded text-xs text-white
            transition-colors
          "
          title="Restore all windows"
        >
          <Maximize2 size={12} />
          Restore All
        </button>
      )}
    </div>
  );
}

export default WindowTaskbar;
