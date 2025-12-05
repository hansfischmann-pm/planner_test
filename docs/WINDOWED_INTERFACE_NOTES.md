# Windowed Interface - Design Notes & Tracking

## Net New Capabilities (for potential classic mode backport)
- [x] Context-aware chat (chat knows which entity is active)
- [x] Multi-entity comparison (side-by-side views)
- [ ] Unified navigation controls (extracted from individual views)
- [x] Persistent layout preferences

---

## Future Window Types to Consider

### Productivity
- [ ] Calendar view (campaign timelines, flight dates)
- [ ] To-do list / task manager
- [ ] Notes / scratchpad per campaign

### Integrations
- [ ] Slack integration panel
- [ ] Teams integration panel
- [ ] Email notifications panel

### Analytics
- [ ] Real-time performance dashboard
- [ ] Budget tracker widget
- [ ] Audience insights panel
- [ ] Competitive intelligence feed

### Workflow
- [ ] Approval workflow panel
- [ ] Audit log / activity feed
- [ ] Team collaboration panel
- [ ] Version history viewer

### Utilities
- [ ] Calculator / budget planner
- [ ] Quick search / command palette
- [ ] Segment browser (standalone)
- [ ] Inventory explorer

---

## Enhanced Features Roadmap

### Chat Panel Enhancements
- [x] Anchored to canvas (right side default)
- [x] Make movable like any window (undock/dock toggle)
- [x] Allow pinning at any position/size
- [ ] Collapse to icon mode
- [x] Context indicator showing active window

### Taskbar Enhancements
- [x] Shows minimized windows
- [x] Click to restore
- [ ] Hover to peek/popup preview
- [ ] Right-click context menu
- [ ] Drag to reorder

### Canvas Enhancements
- [x] Grid background pattern
- [x] Custom wallpaper support (gradient/image)
- [ ] Brand-specific wallpapers
- [ ] Color theme options for canvas

### Window Enhancements
- [x] Drag and resize
- [x] Minimize/maximize/close
- [x] Pin window (persists across sessions)
- [ ] Pin window (always on top) - z-index pinning
- [ ] Snap to edges/corners
- [ ] Snap to other windows
- [ ] Window grouping/tabs

### Persistence
- [x] Save window layouts to localStorage
- [x] Pin/unpin windows (pinned persist, unpinned close with session)
- [ ] Named layout presets (e.g., "Analysis Mode", "Planning Mode")
- [ ] Sync layouts across devices (future)

### Context-Aware Chat
- [x] Chat knows active window type and entity
- [x] Commands scoped to active context
- [x] "this campaign" / "this flight" understanding
- [ ] Multi-select context (compare these windows)

---

## Technical Notes

### Current Architecture
- `CanvasContext` - Reducer-based state for all windows
- `Window` component - Uses react-rnd for drag/resize
- `Canvas` component - Container with chat panel
- `WindowedApp` - Entry point with content rendering

### Key Files
- `src/types/windowTypes.ts` - Type definitions
- `src/context/CanvasContext.tsx` - State management
- `src/components/Window.tsx` - Window component
- `src/components/Canvas.tsx` - Canvas layout
- `src/components/WindowTaskbar.tsx` - Taskbar
- `src/components/WindowedApp.tsx` - App wrapper
