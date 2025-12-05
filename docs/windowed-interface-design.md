# Windowed Interface Architecture - Design Document

## Overview
Transform the FuseIQ Media Planner from a traditional page-based navigation system to a windowed canvas interface where campaigns, flights, and portfolios are displayed as resizable, movable windows on a persistent canvas. The chat interface remains anchored on the canvas and interacts with the "active" window.

---

## Core Concepts

### Canvas
The persistent background layer that serves as the workspace foundation.

**Key Features:**
- Always visible
- Contains the chat interface (anchored bottom-right or configurable)
- Manages window state (open windows, active window, z-index ordering)
- Provides workspace for window arrangement

### Windows
Individual UI containers representing campaigns, flights, portfolios, or other views.

**Window Types:**
- **Campaign Window** - Campaign details, flights list, metrics
- **Flight Window** - Flight details, placements table, delivery stats
- **Portfolio Window** - Multi-campaign overview, budget optimizer
- **Reports Window** - Unified reporting, analytics
- **Settings Window** - User preferences, account settings

**Window States:**
- **Maximized** - Full canvas size (minus chat)
- **Normal** - Resizable, movable
- **Minimized** - Title bar only (collapsed to taskbar/dock)
- **Closed** - Removed from canvas

---

## Technical Architecture

### State Management

#### Window State Interface
```typescript
interface WindowState {
  id: string;                    // Unique window ID
  type: 'campaign' | 'flight' | 'portfolio' | 'report' | 'settings';
  entityId?: string;             // Campaign ID, Flight ID, etc.
  title: string;                 // Window title
  state: 'normal' | 'maximized' | 'minimized' | 'closed';
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;                // Stacking order
  isActive: boolean;             // Currently focused
  isResizable: boolean;
  isDraggable: boolean;
  minSize?: { width: number; height: number };
  maxSize?: { width: number; height: number };
}

interface CanvasState {
  windows: WindowState[];
  activeWindowId: string | null;
  nextZIndex: number;
  chatPosition: 'bottom-right' | 'bottom-left' | 'floating';
}
```

### Component Structure

```
App
├── Canvas (new)
│   ├── ChatInterface (anchored to canvas)
│   ├── WindowManager
│   │   ├── WindowContainer (for each window)
│   │   │   ├── WindowHeader (title bar, controls)
│   │   │   └── WindowContent (campaign/flight/portfolio component)
│   │   └── WindowTaskbar (minimized windows)
│   └── CanvasBackground
└── ErrorBoundary
```

---

## Window Management Features

### 1. Window Controls (Title Bar)

**Standard Controls:**
- **Minimize** - Collapse to taskbar
- **Maximize/Restore** - Toggle full canvas
- **Close** - Remove window

**Additional Controls:**
- **Drag Handle** - Move window via title bar
- **Window Menu** - Right-click for options (bring to front, send to back, etc.)

### 2. Window Interactions

#### Opening Windows
```typescript
// From chat: "open Nike Q4 campaign"
openWindow({
  type: 'campaign',
  entityId: 'campaign-123',
  title: 'Nike Q4 2025'
});

// Multiple windows can be open simultaneously
```

#### Switching Focus
```typescript
// From chat: "switch to Holiday campaign"
// Or click on window
setActiveWindow(windowId);
```

#### Window Arrangement
- **Cascade** - Stagger windows diagonally
- **Tile Vertical** - Split canvas vertically
- **Tile Horizontal** - Split canvas horizontally
- **Show Desktop** - Minimize all windows

### 3. Smart Window Positioning

**Default Behavior:**
- First window: Center of canvas
- Subsequent windows: Cascaded (+20px x, +20px y offset)
- Prevent windows from going off-canvas
- Remember last position/size per window type

**Collision Detection:**
- Prevent windows from overlapping on open (optional)
- Snap to grid (optional)
- Snap to other windows (optional)

---

## Chat Interface Integration

### Current Behavior (Unchanged)
- Chat analyzes user input
- Determines intent and extracts entities
- Executes actions on active context

### New Behavior (Enhanced)

#### Active Window Context
```typescript
interface ChatContext {
  activeWindow: WindowState | null;
  activeEntity: Campaign | Flight | Portfolio | null;
  openWindows: WindowState[];
  recentActions: Action[];
}
```

#### Window-Aware Commands

**Window Management:**
- "minimize this"
- "close Nike campaign"
- "maximize"
- "show all windows"
- "switch to flight 2"

**Context-Aware Actions:**
```
User (with Campaign window active): "add 10 placements"
→ Agent knows to add to active campaign's flights

User (with Flight window active): "show performance"
→ Agent displays metrics for active flight

User (no active window): "open Adidas campaign"
→ Agent opens new campaign window
```

#### Multi-Window Workflows
```
User: "open Nike campaign and Adidas campaign"
→ Opens two windows side-by-side

User: "compare these campaigns"
→ Agent opens comparison view with both campaigns
```

---

## AgentBrain Changes

### 1. Intent Patterns (intentClassifier.ts)

**New Window Management Intents:**
```typescript
WINDOW_OPEN: [
  /open (?:the )?(.+) (?:campaign|flight|portfolio)/i,
  /show (?:me )?(?:the )?(.+)/i,
],

WINDOW_CLOSE: [
  /close (?:this|the )?(?:window)?/i,
  /close (.+)/i,
],

WINDOW_MINIMIZE: [
  /minimize (?:this|the )?(?:window)?/i,
  /minimize (.+)/i,
],

WINDOW_MAXIMIZE: [
  /maximize (?:this|the )?(?:window)?/i,
  /make (?:this|it) (?:full ?screen|bigger)/i,
],

WINDOW_SWITCH: [
  /switch to (.+)/i,
  /focus (?:on )?(.+)/i,
  /go to (.+)/i,
],

WINDOW_ARRANGE: [
  /(?:tile|arrange) (?:windows )?(?:vertical(?:ly)?|horizontal(?:ly)?)/i,
  /cascade windows/i,
  /show desktop/i,
],
```

### 2. Context Manager (contextManager.ts)

**Track Active Window:**
```typescript
updateContext(action: Action) {
  // Existing context updates
  
  // New: Track window context
  if (action.type === 'WINDOW_FOCUS') {
    this.context.activeWindowId = action.windowId;
    this.context.activeWindowType = action.windowType;
  }
  
  // Resolve entity from active window
  if (this.context.activeWindowId) {
    this.context.activeEntity = this.getEntityFromWindow(
      this.context.activeWindowId
    );
  }
}
```

### 3. Agent Brain (agentBrain.ts)

**Window Action Handlers:**
```typescript
handleWindowManagement(intent: Intent, entities: Entity[]) {
  switch (intent.type) {
    case 'WINDOW_OPEN':
      return this.openWindow(entities);
    case 'WINDOW_CLOSE':
      return this.closeWindow(entities);
    case 'WINDOW_MINIMIZE':
      return this.minimizeWindow();
    case 'WINDOW_MAXIMIZE':
      return this.maximizeWindow();
    case 'WINDOW_SWITCH':
      return this.switchWindow(entities);
    case 'WINDOW_ARRANGE':
      return this.arrangeWindows(intent.arrangeType);
  }
}
```

**Estimated Lines of Code:** ~150-200 lines for all window management

---

## UI/UX Considerations

### Visual Hierarchy

**Active Window:**
- Full opacity
- Elevated shadow
- Highlighted title bar
- Receives keyboard input

**Inactive Windows:**
- 90% opacity
- Subtle shadow
- Muted title bar
- Click to activate

### Animations

**Window Open:**
- Fade in + scale from 0.9 to 1.0
- Duration: 200ms

**Window Close:**
- Fade out + scale to 0.9
- Duration: 150ms

**Window Minimize:**
- Scale down to taskbar position
- Duration: 250ms

**Window Maximize:**
- Expand from current size to full canvas
- Duration: 200ms

### Accessibility

- **Keyboard Navigation:**
  - `Cmd/Ctrl + Tab` - Cycle through windows
  - `Cmd/Ctrl + W` - Close active window
  - `Cmd/Ctrl + M` - Minimize active window
  - `Cmd/Ctrl + Shift + M` - Maximize active window

- **Screen Readers:**
  - Announce window state changes
  - Describe window position and size
  - List all open windows

- **Focus Management:**
  - Trap focus within active window
  - Escape key to close/minimize
  - Clear focus indicators

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- Create `CanvasContainer` component
- Create `Window` component with basic state
- Implement window state management (Redux/Context)
- Basic open/close/minimize/maximize

### Phase 2: Interactions (Week 2)
- Drag and drop window positioning
- Window resizing
- Z-index management (bring to front)
- Window taskbar for minimized windows

### Phase 3: AgentBrain Integration (Week 3)
- Add window management intents to classifier
- Update context manager with active window tracking
- Implement window action handlers
- Test chat commands with window context

### Phase 4: Advanced Features (Week 4)
- Window arrangement (cascade, tile)
- Smart positioning and collision detection
- Window state persistence (localStorage)
- Keyboard shortcuts

### Phase 5: Polish & Optimization (Week 5)
- Animations and transitions
- Performance optimization (virtualization for many windows)
- Accessibility enhancements
- Multi-monitor support (future)

---

## Migration Strategy

### Backward Compatibility

The existing page-based navigation can coexist initially:

**Hybrid Approach:**
```typescript
interface AppState {
  interfaceMode: 'classic' | 'windowed';
  // ... existing state
}
```

Users can toggle between classic and windowed mode, allowing gradual migration.

### Data Migration

**No data changes required** - Campaign, Flight, and Portfolio data structures remain unchanged. Only the UI layer changes.

---

## Performance Considerations

### Window Limit
- **Soft limit:** 10 open windows (warn user)
- **Hard limit:** 20 open windows (prevent new)

### Optimization Techniques
- **Lazy render:** Only render visible window content
- **Virtualization:** For large tables within windows
- **Memoization:** Prevent unnecessary re-renders
- **z-index pooling:** Recycle z-index values to prevent overflow

---

## Testing Strategy

### Unit Tests
- Window state reducer
- Window positioning logic
- Z-index management
- Collision detection

### Integration Tests
- Open/close window flows
- Window arrangement functions
- Chat command → window action

### E2E Tests
- User opens multiple campaigns
- User arranges windows via chat
- User switches between windows
- Keyboard navigation

### Browser Testing (via browser subagent)
- Window dragging across canvas
- Window resizing
- Multi-window workflows
- Responsive behavior (if canvas is resized)

---

## Future Enhancements

### Phase 2 Features
- **Window Tabs:** Group related windows (e.g., all Nike campaigns)
- **Window Splitting:** Split single window into panes
- **Floating Panels:** Mini-windows for quick actions
- **Workspace Presets:** Save window layouts

### Phase 3 Features
- **Multi-Monitor:** Span windows across displays
- **Collaboration:** See team members' active windows
- **Window Linking:** Sync scroll/selection between windows
- **Custom Layouts:** User-defined canvas templates

---

## Success Metrics

### User Experience
- Average windows open per session
- Window arrangement patterns (cascade vs tile)
- Time to switch between campaigns
- Chat command success rate for window actions

### Performance
- Window render time < 100ms
- Smooth 60fps animations
- Memory usage < 5MB per window

### Adoption
- % of users using windowed mode vs classic
- Feature usage (minimize, maximize, arrange)
- User feedback and ratings

---

## Questions for Review

1. **Chat Position:** Should chat always be bottom-right, or configurable?
2. **Window Persistence:** Should window positions persist across sessions?
3. **Default Layout:** What should open by default (empty canvas, or last session)?
4. **Mobile/Tablet:** How does windowed interface adapt for smaller screens?
5. **Window Templates:** Pre-configured layouts for common workflows?

---

## Appendix: Example User Flows

### Flow 1: Multi-Campaign Comparison
```
1. User: "open Nike Q4 campaign"
   → Campaign window opens, centered

2. User: "also open Adidas Holiday campaign"
   → Second campaign window opens, cascaded

3. User: "tile these vertically"
   → Windows arranged side-by-side

4. User: "switch to Nike"
   → Nike window gains focus

5. User: "add 5 placements to flight 2"
   → Placements added to Nike campaign (active window context)
```

### Flow 2: Focused Work
```
1. User: "open portfolio dashboard"
   → Portfolio window opens

2. User: "maximize this"
   → Portfolio fills canvas

3. User: "show budget optimizer"
   → Optimizer section scrolls into view (within window)

4. User: "minimize"
   → Portfolio collapses to taskbar, canvas clear

5. User: "restore portfolio"
   → Portfolio window returns to previous size
```

### Flow 3: Quick Reference
```
1. User has Campaign A window open (active)

2. User: "open Campaign B"
   → Campaign B opens, but Campaign A stays open

3. User can see both simultaneously

4. User: "close Campaign B"
   → Campaign B closes, Campaign A still active

5. User continues work on Campaign A
```
