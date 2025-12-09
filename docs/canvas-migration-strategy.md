# Migration Strategy: Page-Based to Windowed Canvas

## Executive Summary

This document outlines the strategy to migrate the FuseIQ Media Planner from a traditional page-based routing architecture ("Classic") to a windowed canvas paradigm ("Canvas"). The goal is to enable a multi-tasking environment where the AI Agent can contextually interact with multiple active entities (Campaigns, Flights) simultaneously.

---

## Current State vs. Target State

| Feature | Classic (Page-Based) | Target (Canvas-Based) |
| :--- | :--- | :--- |
| Navigation | URL Routing (react-router) | Virtual Window Management (`CanvasContext`) |
| State | Per-Page Local State | Centralized `CanvasState` + `WindowContext` |
| Agent Awareness | Global Context Only | Context-Aware (Active Window Focus) |
| UI Components | Full Page Views (CampaignList.tsx) | Contained Window Content (`CampaignWindowContent`) |
| Multi-tasking | Single View at a time | Multiple overlapping/tiled windows |

---

## Migration Phases (Crawl, Walk, Run)

### Phase 1: Crawl - Architecture & Dual Mode

**Goal:** Establish the Canvas foundation without breaking the existing app.

**Status as of Dec 2024 (verified in codebase):**

- ✅ **Canvas Infrastructure:**
  - `CanvasContext.tsx` (751 lines) - Full state management with reducer
  - Window actions: OPEN, CLOSE, MINIMIZE, MAXIMIZE, RESTORE, FOCUS, MOVE, RESIZE
  - Arrangement: CASCADE, TILE_HORIZONTAL, TILE_VERTICAL, GATHER_WINDOWS
  - Chat modes: Docked/Floating with DOCK_CHAT, UNDOCK_CHAT
  - Persistence: Pinned windows save to localStorage
  - Canvas panning: SET_CANVAS_OFFSET for infinite canvas

- ✅ **Window Types Defined:** (`windowTypes.ts`)
  - campaign, flight, portfolio, report, settings
  - media-plan, audience-insights, chat
  - client-list, client (agency view)

- ✅ **Window Component:** (`Window.tsx`, 353 lines)
  - Uses `react-rnd` for drag/resize
  - Title bar with minimize/maximize/close/pin controls
  - Context menu on title (copy name, copy path)
  - Escape key to close
  - Resize handles

- ✅ **Shell Application:** `WindowedApp.tsx` creates desktop environment
  - Canvas with docked/floating chat
  - Window content components: CampaignWindowContent, FlightWindowContent, etc.

- ✅ **AgentBrain Window Context:** (`agentBrain.ts:37-46`)
  - `WindowContext` interface defined with windowType, brandId, campaignId, flightId
  - `setWindowContext()` method implemented
  - Context manager integration

- ⚠️ **DRY Challenge:** `WindowedApp.tsx` (35k+ tokens) has significant component duplication
  - `CampaignWindowContent` duplicates logic from page components
  - `FlightWindowContent` same issue
  - Should extract shared presentational components

### Phase 2: Walk - Agent Integration

**Goal:** Empower the Agent to control the Canvas.

**Status:**

- ✅ **Partial Context Injection:**
  - `AgentBrain.setWindowContext()` exists and updates `contextManager.updateFocus()`
  - Window context flows through to agent processing

- ⚠️ **CommandRegistry Gaps:**
  - Current commands in `CommandRegistry.ts`: LAYOUT, NAVIGATION, CAMPAIGN_SETUP, BUDGET, CHANNEL, PLACEMENT, OPTIMIZATION, FORECASTING, GOAL, TEMPLATE, CREATIVE, EXPORT, VIEW, UNDO_REDO, HELP, INVENTORY
  - **Missing:** Window management commands (CLOSE_WINDOW, ARRANGE_TILED, FOCUS_WINDOW, etc.)
  - **Missing:** Context-eligibility checks (e.g., "Add Placement" only when flight window active)

- [ ] **TODO:** Add WINDOW_MANAGEMENT category to CommandRegistry:
  ```typescript
  export const WINDOW_COMMANDS: CommandDefinition[] = [
    { id: 'close_window', patterns: [/close.*window/i, /close this/i] },
    { id: 'tile_windows', patterns: [/tile.*window/i, /arrange.*tile/i] },
    { id: 'cascade_windows', patterns: [/cascade/i] },
    { id: 'minimize_all', patterns: [/minimize all/i, /show desktop/i] },
    { id: 'focus_window', patterns: [/switch to (.+)/i, /go to (.+)/i] }
  ];
  ```

- [ ] **TODO:** Contextual command validation:
  ```typescript
  function isCommandEligible(cmd: CommandDefinition, ctx: WindowContext): boolean {
    if (cmd.category === 'PLACEMENT' && ctx.windowType !== 'flight') return false;
    // etc.
  }
  ```

### Phase 3: Run - Advanced Workflows

**Goal:** Leverage the Canvas for unique value.

- [ ] Cross-Window Interactions: Drag-and-drop placements between Flight windows
- [ ] Comparisons: Agent command "Compare these two campaigns" opens Comparison Window
- [ ] Workspace Persistence: Save/Load named window layouts (foundation exists with localStorage)
- [ ] **Parallel Agent Tasks:** Multiple agents running concurrently across different windows

---

## Parallel Agent Task Architecture

### Core Concept

Each window can independently trigger agent tasks (analyze, optimize, generate report, etc.). Users may switch context to another window while an agent task is executing. **Multiple agents can operate in parallel across different windows.**

### Key Requirements

1. **Window-Scoped Agent Instances**
   - Each window with an active task has its own agent execution context
   - Agent tasks are tied to their originating window, not the global chat
   - Results are delivered back to the originating window

2. **Non-Blocking Context Switching**
   - User can focus a different window while agent tasks run
   - Background tasks continue executing
   - Active window focus does NOT cancel pending tasks in other windows

3. **Task State Per Window**
   - Each `WindowState` needs to track active agent tasks:
   ```typescript
   interface WindowState {
     // ... existing fields
     agentTasks?: AgentTask[];  // Active tasks for this window
   }

   interface AgentTask {
     id: string;
     type: 'analyze' | 'optimize' | 'report' | 'forecast' | 'custom';
     status: 'pending' | 'running' | 'completed' | 'failed';
     progress?: number;        // 0-100
     startedAt: Date;
     completedAt?: Date;
     result?: any;
     error?: string;
   }
   ```

4. **Visual Indicators**
   - Window title bar shows task status (spinner, progress)
   - Minimized windows in taskbar show activity indicator
   - Toast/notification when background task completes

5. **Task Queue Management**
   - Global task coordinator to manage resource limits
   - Priority queue (active window tasks > background window tasks)
   - Configurable concurrency limit (e.g., max 3 parallel agent tasks)

### UI/UX Patterns

**Window Title Bar:**
```
┌────────────────────────────────────────────────────┐
│ Campaign: Summer Sale  [⟳ Analyzing...]  [−][□][×] │
├────────────────────────────────────────────────────┤
```

**Taskbar (minimized window with active task):**
```
┌─────────────────────────┐
│ [⟳] Summer Sale (47%)   │  ← Spinner + progress
└─────────────────────────┘
```

**Completion Notification:**
```
┌─────────────────────────────────────┐
│ ✓ Analysis complete                 │
│   "Summer Sale" campaign ready      │
│   [View Results]  [Dismiss]         │
└─────────────────────────────────────┘
```

### Implementation Components

1. **AgentTaskManager** (new)
   - Singleton managing all active agent tasks across windows
   - Handles task lifecycle: create, start, progress, complete, fail
   - Enforces concurrency limits
   - Emits events for UI updates

2. **useWindowAgentTasks** (new hook)
   - Hook for components to access their window's active tasks
   - Subscribe to task state changes
   - Trigger new tasks

3. **WindowAction additions:**
   ```typescript
   | { type: 'START_AGENT_TASK'; windowId: string; task: Omit<AgentTask, 'id'> }
   | { type: 'UPDATE_AGENT_TASK'; windowId: string; taskId: string; updates: Partial<AgentTask> }
   | { type: 'COMPLETE_AGENT_TASK'; windowId: string; taskId: string; result: any }
   | { type: 'FAIL_AGENT_TASK'; windowId: string; taskId: string; error: string }
   | { type: 'CANCEL_AGENT_TASK'; windowId: string; taskId: string }
   ```

4. **CommandRegistry additions:**
   ```typescript
   // TASK_MANAGEMENT category
   { id: 'cancel_task', patterns: [/cancel.*task/i, /stop.*analysis/i] },
   { id: 'show_tasks', patterns: [/show.*tasks/i, /running.*tasks/i] },
   { id: 'task_status', patterns: [/task.*status/i, /progress/i] },
   ```

### Agent Types by Window Context

| Window Type | Available Agent Tasks |
|-------------|----------------------|
| campaign | Analyze performance, Optimize budget, Generate report, Forecast |
| flight | Analyze placement mix, Optimize channels, A/B test recommendations |
| portfolio | Cross-campaign analysis, Budget reallocation, Portfolio health |
| audience-insights | Segment analysis, Lookalike expansion, Overlap analysis |
| report | Data refresh, Export generation, Schedule setup |

### Concurrency Considerations

- **Resource limits:** Max N concurrent agent tasks (configurable, default 3)
- **Priority:** Active window > Recently active > Background
- **Queuing:** Tasks beyond limit enter queue with estimated wait time
- **Cancellation:** User can cancel any pending/running task
- **Timeout:** Tasks have configurable timeout (default 5 min)

### State Sync with Chat

The global chat should be aware of parallel tasks:
- "I've started analyzing 3 campaigns. You can continue working - I'll notify you when each completes."
- Task completion messages appear in chat even if user has switched windows
- Chat can reference results from any window's completed tasks

---

## Critical Technical Tasks

### 1. Unified Component Architecture

Ideally, `CampaignList.tsx` (Page) and `CampaignWindow` (Canvas) should share 90% of their code.

- **Action:** Extract `CampaignListView` and `FlightDetailView` as pure UI components accepting props.
- **Wrapper:** Create `PageWrapper` (connects to Router params) and `WindowWrapper` (connects to Window props) to feed data to these views.

**Current State:** `WindowedApp.tsx` contains inline component definitions that duplicate page logic. This is the main technical debt.

### 2. AgentBrain Connection

The `AgentBrain` refactoring (Managers + Registry) is the perfect foundation.

- ✅ `AgentBrain.setWindowContext()` implemented
- ✅ `contextManager.updateFocus()` called with window context
- [ ] **Action:** Add window management commands to CommandRegistry
- [ ] **Action:** Add command eligibility checks based on active window type

### 3. Routing Hybrid

Users might still want deep links (`/campaign/123`).

- [ ] **Action:** Update Router to open the Canvas with the specific Window pre-opened when a deep link is accessed, bridging the two worlds.

---

## Risk Assessment

| Risk | Mitigation |
| :--- | :--- |
| **Performance:** Rendering multiple heavy windows (e.g., complex Media Plans) could cause lag. | Implement CSS `content-visibility` or virtualize hidden windows. |
| **State Sync:** If a Campaign is open in a Window and modified via Agent, the Window must re-render. | Ensure shared data source (Context or Global Store) rather than local component state. |

---

## Integration Notes

This migration aligns with:
- **Phase 6 (Platform Integrations):** Canvas windows can display real-time data from AdRoll/RollWorks sync
- **Phase 12.1 (Voice Input):** Voice commands can target specific windows by context
- **Export System:** Export context can be derived from active window type (implemented in `exportConfig.ts`)

---

## File Reference

| File | Purpose | Lines |
|------|---------|-------|
| `src/context/CanvasContext.tsx` | Window state management | ~750 |
| `src/types/windowTypes.ts` | Type definitions | ~194 |
| `src/components/Window.tsx` | Window component with react-rnd | ~353 |
| `src/components/WindowedApp.tsx` | Main canvas shell | ~35k tokens |
| `src/components/WindowTaskbar.tsx` | Taskbar for minimized windows | TBD |
| `src/components/Canvas.tsx` | Canvas viewport | TBD |
| `src/logic/agentBrain.ts` | Agent with WindowContext | ~1000+ |
| `src/logic/CommandRegistry.ts` | Command patterns | ~627 |

---

*Last updated: Dec 9, 2024 - Based on codebase exploration*
