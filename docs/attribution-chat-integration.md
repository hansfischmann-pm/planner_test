# Attribution System - Chat & Window Integration Design

## Overview

This document outlines the hybrid approach for integrating the Attribution system with the chat interface and windowed canvas environment.

## 1. Hybrid Window Architecture

### Window Types

```typescript
// New window types to add to WindowType
| 'attribution'              // Full attribution dashboard (sidebar + content)
| 'attribution-overview'     // Pop-out: Overview view only
| 'attribution-incrementality' // Pop-out: Incrementality testing
| 'attribution-time'         // Pop-out: Time analysis
| 'attribution-frequency'    // Pop-out: Touchpoint frequency
| 'attribution-models'       // Pop-out: Model comparison
```

### Behavior

| Mode | Description |
|------|-------------|
| **Full Dashboard** | Opens `attribution` window with sidebar navigation (current behavior) |
| **Pop-out View** | Individual view opens in separate window, can be arranged side-by-side |
| **Compare Mode** | Multiple pop-out views open for comparison (e.g., Time + Frequency) |

### Pop-out Mechanism

User can pop-out views via:
1. **Chat command**: "pop out time analysis" / "open time analysis in new window"
2. **UI button**: Pop-out icon in view header
3. **Drag gesture**: Drag view tab out of dashboard (future)

## 2. Agent Chat Commands

### Category: ATTRIBUTION

#### Navigation Commands
| Command ID | Patterns | Action |
|------------|----------|--------|
| `open_attribution` | "show attribution", "open attribution dashboard" | Opens full attribution window |
| `open_attribution_view` | "show time analysis", "open incrementality" | Opens specific view (in dashboard or pop-out) |
| `popout_attribution_view` | "pop out overview", "open frequency in new window" | Opens view as separate window |

#### Model Commands
| Command ID | Patterns | Action |
|------------|----------|--------|
| `change_attribution_model` | "switch to first touch", "use linear model" | Changes attribution model |
| `compare_models` | "compare models", "show model comparison" | Navigate to or open model comparison view |
| `explain_model` | "explain time decay", "what is position based" | Chat explains the model |

#### Incrementality Commands
| Command ID | Patterns | Action |
|------------|----------|--------|
| `create_incrementality_test` | "set up holdout test for Search", "create lift test" | Opens test creation form |
| `view_incrementality_results` | "show lift results", "how did the Search test perform" | Shows test results |
| `explain_incrementality` | "what is incrementality", "explain lift testing" | Chat explains concept |

#### Analysis Commands
| Command ID | Patterns | Action |
|------------|----------|--------|
| `analyze_channel_attribution` | "how is Social performing", "which channel is best opener" | Analyzes specific channel |
| `analyze_conversion_paths` | "show conversion paths", "what's the typical journey" | Shows path analysis |
| `attribution_insights` | "what should I optimize", "attribution recommendations" | AI-driven insights |

### Category: AD_HOC_QUERY (Future)

For queries like: "show me all campaigns over 5x ROAS in midwest using CTV and Search"

| Command ID | Patterns | Action |
|------------|----------|--------|
| `filter_campaigns` | "show campaigns where...", "find campaigns with..." | Ad-hoc filtering |
| `aggregate_metrics` | "total spend across...", "average ROAS for..." | Ad-hoc aggregation |
| `compare_segments` | "compare midwest vs southeast", "CTV vs Display performance" | Segment comparison |

## 3. Help System Integration

### Three-Tier Help Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     HELP SYSTEM                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │  CHAT HELP      │  │  MODAL HELP     │  │  CONTEXTUAL  │ │
│  │  (Conversational)│  │  (Deep Dive)    │  │  (Proactive) │ │
│  ├─────────────────┤  ├─────────────────┤  ├──────────────┤ │
│  │ "explain X"     │  │ ? button opens  │  │ Suggestions  │ │
│  │ "what is Y"     │  │ detailed guide  │  │ based on     │ │
│  │ "how do I Z"    │  │ with examples   │  │ current view │ │
│  │                 │  │ and visuals     │  │ and state    │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Chat Help Responses

When user asks about attribution concepts, the agent responds conversationally:

```
User: "What is time decay attribution?"

Agent: "Time decay attribution gives more credit to touchpoints closer to
the conversion. It uses a half-life model (typically 7 days) where each
interaction's credit decreases the further back in time it occurred.

This model is useful when you believe recent interactions have more
influence on the purchase decision. For example, if a customer saw your
Display ad 3 weeks ago but clicked a Search ad yesterday before converting,
Search would receive significantly more credit.

Would you like me to switch to the time decay model so you can see how
it affects your channel attribution?"
```

### Contextual Suggestions

Based on current view, suggest relevant prompts:

| View | Suggestions |
|------|-------------|
| Attribution Overview | "Compare first-touch vs last-touch", "Which channel is the best closer?" |
| Incrementality | "Set up a holdout test", "What's a good confidence level?" |
| Time Analysis | "Which channels have fastest conversions?", "Why do some take 30+ days?" |
| Model Comparison | "Which model should I use?", "Explain the differences" |

## 4. Data Query Framework (Future)

### Query Structure

```typescript
interface AdHocQuery {
  // What to find
  entity: 'campaigns' | 'flights' | 'placements' | 'channels';

  // Filters
  filters: QueryFilter[];

  // Aggregations
  aggregations?: Aggregation[];

  // Grouping
  groupBy?: string[];

  // Sorting
  orderBy?: { field: string; direction: 'asc' | 'desc' };

  // Limit
  limit?: number;
}

interface QueryFilter {
  field: string;           // e.g., 'roas', 'region', 'channel'
  operator: 'eq' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: any;
}
```

### NLP to Query Translation

```
User: "show me all campaigns over 5x ROAS in the midwest region that used CTV and Search"

Parsed Query:
{
  entity: 'campaigns',
  filters: [
    { field: 'roas', operator: 'gt', value: 5 },
    { field: 'region', operator: 'eq', value: 'midwest' },
    { field: 'channels', operator: 'in', value: ['CTV', 'Search'] }
  ]
}
```

### Entity Extraction Enhancements

```typescript
// New entities to extract
interface ExtendedEntities {
  // Existing
  budget?: number;
  channels?: string[];
  audiences?: string[];

  // New for ad-hoc queries
  metrics?: {
    name: string;      // 'ROAS', 'CPA', 'CTR', etc.
    operator?: string; // 'over', 'under', 'between'
    value?: number;
    value2?: number;   // For 'between X and Y'
  }[];

  regions?: string[];           // 'midwest', 'northeast', etc.
  timeframes?: {
    type: 'relative' | 'absolute';
    value: string;              // 'last 30 days', 'Q4 2024'
  };

  attributionModel?: AttributionModel;
  comparisonType?: 'vs' | 'and' | 'or';
}
```

## 5. Implementation Phases

### Phase 1: Window Types & Basic Navigation (Current Sprint)
- [ ] Add attribution window types to `windowTypes.ts`
- [ ] Add window configs for each type
- [ ] Add attribution commands to `CommandRegistry.ts`
- [ ] Implement basic navigation in `agentBrain.ts`
- [ ] Add pop-out button to AttributionDashboard views

### Phase 2: Model & Test Commands
- [ ] Add model switching commands
- [ ] Add incrementality test creation via chat
- [ ] Implement conversational help for models
- [ ] Add contextual suggestions to ChatInterface

### Phase 3: Analysis Commands
- [ ] Implement channel analysis responses
- [ ] Add conversion path explanations
- [ ] Create AI-driven insights/recommendations

### Phase 4: Ad-Hoc Query Framework
- [ ] Design query data structure
- [ ] Implement NLP entity extraction for metrics/filters
- [ ] Build query execution engine
- [ ] Add results visualization

## 6. Example Chat Interactions

### Opening Attribution
```
User: "show me attribution"
Agent: "Opening the Attribution dashboard for the Summer Sale campaign."
[Opens attribution window]
```

### Switching Models
```
User: "switch to first touch"
Agent: "Switched to First Touch attribution. This model gives 100% credit
to the first interaction in each conversion path.

I notice Social and Display now show significantly higher contribution -
these channels often introduce customers to your brand before they convert
through Search or Direct."
[Updates model selector, attribution table refreshes]
```

### Creating a Test
```
User: "set up a holdout test for Paid Social"
Agent: "I'll help you create an incrementality test for Paid Social.

To measure true lift, we'll need to define:
1. Test period (I'd recommend at least 2 weeks)
2. Holdout percentage (typically 10-20% of audience)

Would you like me to open the test creation form, or should I set up a
standard 2-week test with 15% holdout?"
[Opens incrementality panel or creates test directly]
```

### Ad-Hoc Query (Future)
```
User: "which channels had the best ROAS last month for awareness campaigns"
Agent: "Looking at awareness campaigns from last month:

| Channel | ROAS | Spend | Revenue |
|---------|------|-------|---------|
| CTV     | 4.2x | $45K  | $189K   |
| YouTube | 3.8x | $32K  | $122K   |
| Display | 2.1x | $28K  | $59K    |

CTV is outperforming by 10%+ compared to YouTube, though at higher spend
levels. Would you like me to show the attribution paths for CTV conversions?"
```

## 7. Window Context for Commands

The agent needs to know the current context to handle commands appropriately:

```typescript
interface AttributionWindowContext {
  isAttributionOpen: boolean;
  currentView: AttributionView | null;
  selectedModel: AttributionModel;
  campaignId: string | null;

  // For command eligibility
  hasTests: boolean;
  hasConversionPaths: boolean;
}
```

Commands should adapt based on context:
- If attribution not open: "show time analysis" opens attribution window to time view
- If attribution open: "show time analysis" switches to time view in current window
- "pop out time analysis" always opens new window regardless of state
