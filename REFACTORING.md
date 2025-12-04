# Refactoring Plan for FuseIQ Media Planner

This document outlines the recommended refactoring opportunities identified in the codebase, prioritized by impact and complexity.

**Codebase Metrics:**
- Total LoC: ~17,000
- Files: 57 (33 components + 8 logic modules + 10 utilities + 3 data files)
- Type Safety Issues: 76 `any` usages
- Test Coverage: 0%

---

## Critical Priority (Do First)

### 1. Decompose AgentBrain Class

**File**: `src/logic/agentBrain.ts` (2,229 lines)
**Problem**: God class with 30+ methods, 900+ line `handleGlobalCommands()` method

**Current Structure**:
```
agentBrain.ts (2,229 lines)
├── processInput() - Entry point
├── handleGlobalCommands() - 900 lines of nested conditionals
├── generatePlacements() - Placement creation
├── handleInventoryQuery() - 400 lines of hardcoded data
└── 25+ additional methods
```

**Proposed Structure**:
```
src/logic/
├── AgentBrain.ts          # Core orchestrator (200 lines)
├── CommandRegistry.ts     # Pattern definitions (100 lines)
├── CommandParser.ts       # Intent recognition (150 lines)
├── ChannelManager.ts      # Add/remove channels (200 lines)
├── PlacementGenerator.ts  # Create placements (150 lines)
├── PlacementOptimizer.ts  # Budget shifting, pause/resume (150 lines)
├── InventoryService.ts    # TV, DOOH, vendor data (100 lines)
├── DMAResolver.ts         # Broadcast station lookup (50 lines)
└── AgentContext.ts        # Shared state interface (30 lines)
```

**Implementation Steps**:

1. **Extract AgentContext interface**:
```typescript
// src/logic/AgentContext.ts
export interface AgentContext {
  mediaPlan: MediaPlan | null;
  history: AgentMessage[];
  currentState: AgentState;
  budget: number;
  selectedChannels: Channel[];
  userProfile: UserProfile;
}
```

2. **Create CommandRegistry**:
```typescript
// src/logic/CommandRegistry.ts
interface Command {
  name: string;
  patterns: RegExp[];
  priority: number;
  handler: (input: string, context: AgentContext) => AgentMessage;
}

export const COMMANDS: Command[] = [
  {
    name: 'addChannel',
    patterns: [/add\s+(search|social|display|tv|radio|ooh|print)/i],
    priority: 10,
    handler: (input, ctx) => channelManager.addChannel(input, ctx),
  },
  // ... 30+ more commands
];
```

3. **Extract managers by domain**:
   - `ChannelManager`: addChannel(), removeChannel(), shiftBudget()
   - `PlacementGenerator`: generateBatchPlacements(), generateLine()
   - `InventoryService`: getTVNetworks(), getDOOHMarkets()
   - `PlacementOptimizer`: pausePlacement(), resumePlacement()

**Effort**: 2-3 days
**Impact**: High (maintainability, testability)

---

### 2. Externalize Hardcoded Data

**Files**: `src/logic/agentBrain.ts`, `src/logic/dummyData.ts`
**Problem**: 500+ lines of TV networks, DOOH markets, pricing embedded in code

**Current Locations**:
- `agentBrain.ts:733-848` - TV networks and shows (115 lines)
- `agentBrain.ts:869-1097` - DOOH cities and screen counts (228 lines)
- `dummyData.ts` - Vendor lists, rate ranges

**Proposed Structure**:
```
src/config/
├── tv-networks.json       # Linear TV networks and programming
├── ctv-platforms.json     # CTV/streaming platforms
├── dooh-markets.json      # DOOH markets and screen inventory
├── channel-rates.json     # Default rate ranges by channel
├── vendors.json           # Vendor lists by channel
└── seasonal-factors.json  # Move from forecastingEngine.ts
```

**Example** (`tv-networks.json`):
```json
{
  "linear": [
    {
      "network": "ESPN",
      "shows": [
        { "name": "SportsCenter", "daypart": "Morning", "estimatedCPM": 45 },
        { "name": "Monday Night Football", "daypart": "Prime", "estimatedCPM": 120 }
      ]
    }
  ],
  "ctv": [
    { "platform": "Hulu", "adFormats": ["Pre-roll", "Mid-roll"], "minSpend": 10000 }
  ]
}
```

**Implementation**:
```typescript
// src/services/InventoryService.ts
import tvNetworks from '../config/tv-networks.json';
import doohMarkets from '../config/dooh-markets.json';

export class InventoryService {
  getTVNetworks() { return tvNetworks.linear; }
  getCTVPlatforms() { return tvNetworks.ctv; }
  getDOOHMarkets() { return doohMarkets; }
}
```

**Effort**: 1 day
**Impact**: High (data management, flexibility)

---

### 3. Implement Input Validation

**Problem**: No validation for user inputs (budgets, dates, quantities)
**Impact**: Garbage in, garbage out; potential runtime errors

**New File**: `src/validators/InputValidator.ts`

```typescript
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class InputValidator {
  validateBudget(amount: number): ValidationResult {
    const errors: string[] = [];
    if (isNaN(amount)) errors.push('Budget must be a number');
    if (amount < 0) errors.push('Budget cannot be negative');
    if (amount > 100_000_000) errors.push('Budget exceeds maximum ($100M)');
    return { valid: errors.length === 0, errors };
  }

  validateDateRange(start: Date, end: Date): ValidationResult {
    const errors: string[] = [];
    if (isNaN(start.getTime())) errors.push('Invalid start date');
    if (isNaN(end.getTime())) errors.push('Invalid end date');
    if (start >= end) errors.push('Start date must be before end date');
    if (start < new Date()) errors.push('Start date cannot be in the past');
    return { valid: errors.length === 0, errors };
  }

  validatePlacement(placement: Partial<Line>): ValidationResult {
    const errors: string[] = [];
    if (!placement.name?.trim()) errors.push('Placement name is required');
    if (!placement.channel) errors.push('Channel is required');
    if (!placement.rate || placement.rate <= 0) errors.push('Rate must be positive');
    if (!placement.quantity || placement.quantity <= 0) errors.push('Quantity must be positive');
    return { valid: errors.length === 0, errors };
  }

  validatePercentage(value: number): ValidationResult {
    const errors: string[] = [];
    if (value < 0 || value > 100) errors.push('Percentage must be 0-100');
    return { valid: errors.length === 0, errors };
  }
}
```

**Apply to**:
- `budgetOptimizer.ts`: Validate totalBudget > 0
- `entityExtractor.ts`: Validate extracted dates
- `agentBrain.ts`: Validate all user-provided values
- `PlacementDetailPanel.tsx`: Validate form inputs

**Effort**: 2 days
**Impact**: Medium (reliability, user experience)

---

### 4. Reduce Type Safety Issues

**Problem**: 76 instances of `any` type usage
**Locations**: Throughout components and logic files

**Examples**:
```typescript
// BAD: agentBrain.ts line 101
action: `LAYOUT_${position}` as any

// BAD: intentClassifier.ts line 25
entities: Record<string, any>

// BAD: contextManager.ts line 36
params: Record<string, any>
```

**Fix Strategy**:

1. **Replace `as any` with discriminated unions**:
```typescript
// Before
const action: string = `LAYOUT_${position}` as any;

// After
type LayoutAction =
  | { type: 'LAYOUT_LEFT' }
  | { type: 'LAYOUT_RIGHT' }
  | { type: 'LAYOUT_BOTTOM' };

const action: LayoutAction = { type: `LAYOUT_${position}` as const };
```

2. **Replace `Record<string, any>` with specific interfaces**:
```typescript
// Before
entities: Record<string, any>

// After
interface ExtractedEntities {
  budget?: number;
  channels?: Channel[];
  dates?: { start?: Date; end?: Date };
  audience?: AudienceSpec;
}
```

3. **Enable stricter TypeScript**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

**Effort**: 2 days
**Impact**: Medium (type safety, IDE support)

---

## High Priority (Do Next)

### 5. Fix State Mutation Patterns

**Files**: `src/App.tsx`, `src/components/PlanVisualizer.tsx`
**Problem**: Direct state mutations mixed with immutable updates

**Current (App.tsx:155-158)**:
```typescript
// HACK: We need to inject this plan into the brain
ctx.mediaPlan = initialPlan;
ctx.mediaPlan.campaign.placements = flight.lines;
```

**Current (PlanVisualizer.tsx:22-36)**:
```typescript
const updatedPlacements = mediaPlan.campaign.placements?.map(
  p => p.id === placement.id ? updatedPlacement : p
);
if (updatedPlacements) {
  mediaPlan.campaign.placements = updatedPlacements; // Mutating!
}
```

**Fix**:
```typescript
// App.tsx - Pass plan via constructor
const brain = new AgentBrain({ initialPlan });

// PlanVisualizer.tsx - Return new object
const handlePlacementUpdate = (placement: Line) => {
  const updatedPlan: MediaPlan = {
    ...mediaPlan,
    campaign: {
      ...mediaPlan.campaign,
      placements: mediaPlan.campaign.placements?.map(
        p => p.id === placement.id ? placement : p
      ),
    },
  };
  onPlanUpdate(updatedPlan);
};
```

**Effort**: 1.5 days
**Impact**: Medium (predictability, debugging)

---

### 6. Centralize Regex Patterns

**Problem**: 40+ regex patterns scattered across files
**Files**: `intentClassifier.ts`, `agentBrain.ts`, `entityExtractor.ts`

**Current**:
```typescript
// intentClassifier.ts line 46
/(?:create|start|launch|set up|build|make)\s+(?:a|an)?\s*(?:new)?\s*campaign/i

// Similar patterns in multiple files
```

**Solution**: Create `src/patterns/CommandPatterns.ts`

```typescript
export const INTENT_PATTERNS = {
  CAMPAIGN_CREATE: [
    /(?:create|start|launch|set up|build|make)\s+(?:a|an)?\s*(?:new)?\s*campaign/i,
    /i need (?:to )?(run|create|launch)\s+(?:a )?campaign/i,
  ],
  BUDGET_SET: [
    /(?:set|allocate|assign)\s+(?:the\s+)?budget\s+(?:to\s+)?\$?([\d,.]+[kmb]?)/i,
    /budget\s+(?:is|should be|of)\s+\$?([\d,.]+[kmb]?)/i,
  ],
  CHANNEL_ADD: [
    /add\s+(search|social|display|tv|ctv|radio|ooh|print|retail)/i,
    /include\s+(search|social|display|tv|ctv|radio|ooh|print|retail)/i,
  ],
  // ... more patterns
};

export const ENTITY_PATTERNS = {
  BUDGET: /\$?([\d,]+\.?\d*)\s*([kmb](?:illion)?)?/i,
  PERCENTAGE: /(\d+(?:\.\d+)?)\s*%/,
  DATE_RELATIVE: /next\s+(week|month|quarter|year)|q[1-4]|(?:jan|feb|mar|...|dec)/i,
  // ... more patterns
};
```

**Effort**: 1 day
**Impact**: Medium (maintainability)

---

### 7. Add Comprehensive Error Handling

**Problem**: Inconsistent or missing error handling

**Examples**:
```typescript
// BAD: entityExtractor.ts - silent failures
try {
  result.start = new Date(matches[0]);
} catch (e) {
  // Invalid date - silently ignored!
}

// BAD: agentBrain.ts - only some code wrapped
try { ... } catch(e: any) { console.error(...); }

// BAD: App.tsx - no error handling
const response = agentBrain.current.processInput(text); // Can throw!
```

**Solution**: Create error handling utilities

```typescript
// src/utils/errorHandler.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public userMessage: string,
    public recoverable: boolean = true
  ) {
    super(message);
  }
}

export function handleError(error: unknown, context: string): AppError {
  console.error(`[${context}]`, error);

  if (error instanceof AppError) return error;

  return new AppError(
    error instanceof Error ? error.message : 'Unknown error',
    'UNKNOWN_ERROR',
    'Something went wrong. Please try again.',
    true
  );
}
```

**Apply to App.tsx**:
```typescript
const handleSendMessage = async (text: string) => {
  try {
    const response = agentBrain.current.processInput(text);
    // ... success handling
  } catch (error) {
    const appError = handleError(error, 'AgentBrain.processInput');
    setMessages(prev => [...prev, {
      role: 'agent',
      content: appError.userMessage,
      isError: true,
    }]);
  } finally {
    setIsTyping(false);
  }
};
```

**Effort**: 2 days
**Impact**: High (stability, user experience)

---

### 8. Add Comprehensive Logging

**Problem**: Minimal logging, difficult debugging

**Solution**: Create logging service

```typescript
// src/services/Logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private enabled = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, module: string, message: string, data?: unknown) {
    if (!this.enabled && level !== 'error') return;

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${module}]`;

    if (data) {
      console[level](`${prefix} ${message}`, data);
    } else {
      console[level](`${prefix} ${message}`);
    }
  }

  debug(module: string, message: string, data?: unknown) {
    this.log('debug', module, message, data);
  }

  info(module: string, message: string, data?: unknown) {
    this.log('info', module, message, data);
  }

  warn(module: string, message: string, data?: unknown) {
    this.log('warn', module, message, data);
  }

  error(module: string, message: string, error?: unknown) {
    this.log('error', module, message, error);
  }
}

export const logger = new Logger();
```

**Usage**:
```typescript
// intentClassifier.ts
import { logger } from '../services/Logger';

export function classifyIntent(input: string): DetectedIntent {
  logger.debug('IntentClassifier', 'Classifying input', { input });

  const matched = findMatchingPatterns(input);
  logger.info('IntentClassifier', `Found ${matched.length} matching patterns`);

  return result;
}
```

**Effort**: 1 day
**Impact**: High (debugging, monitoring)

---

## Medium Priority (Nice to Have)

### 9. Add Unit Tests

**Problem**: 0% test coverage
**Impact**: Refactoring is risky, regressions possible

**Framework**: Vitest (Vite-native) or Jest

**Test Priority**:

1. **Core Logic** (highest priority):
   - `intentClassifier.ts`: Test all 10 intent categories
   - `entityExtractor.ts`: Test budget, channel, date extraction
   - `budgetOptimizer.ts`: Test allocation algorithms

2. **Utilities**:
   - `forecastingEngine.ts`: Test seasonal factors, overlap
   - `optimizationEngine.ts`: Test issue detection
   - `actionHistory.ts`: Test undo/redo

3. **Components** (lower priority):
   - Snapshot tests for UI components
   - Integration tests for ChatInterface

**Example Test** (`intentClassifier.test.ts`):
```typescript
import { describe, it, expect } from 'vitest';
import { classifyIntent, IntentCategory } from '../intentClassifier';

describe('IntentClassifier', () => {
  describe('CAMPAIGN_SETUP intent', () => {
    it.each([
      'Create a campaign',
      'Start a new plan',
      'Launch campaign for Q4',
      'I want to build a campaign',
    ])('classifies "%s" as CAMPAIGN_SETUP', (input) => {
      const result = classifyIntent(input);
      expect(result.category).toBe(IntentCategory.CAMPAIGN_SETUP);
      expect(result.confidence).toBeGreaterThan(0.5);
    });
  });

  describe('BUDGET_ALLOCATION intent', () => {
    it('extracts budget amount', () => {
      const result = classifyIntent('Set budget to $500k');
      expect(result.category).toBe(IntentCategory.BUDGET_ALLOCATION);
    });
  });
});
```

**Effort**: 3-4 days
**Impact**: Medium (confidence in changes)

---

### 10. Implement Performance Optimizations

**Current Issues**:
- No virtualization in `PlanVisualizer.tsx` for large tables
- Full table re-render on any state change
- Action history keeps full state snapshots (memory intensive)

**Solutions**:

1. **Add React.memo to pure components**:
```typescript
export const PlacementRow = React.memo(({ placement, onSelect }) => {
  // Row rendering
});
```

2. **Virtualize large tables** (using react-window):
```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={placements.length}
  itemSize={48}
>
  {({ index, style }) => (
    <PlacementRow
      style={style}
      placement={placements[index]}
    />
  )}
</FixedSizeList>
```

3. **Compress action history snapshots**:
```typescript
// Store diffs instead of full state
const recordAction = (action: Action, state: State) => {
  const diff = calculateDiff(lastState, state);
  history.push({ action, diff });
};
```

**Effort**: 2 days
**Impact**: Medium (UX with large datasets)

---

### 11. Add Error Boundaries

**Problem**: Component errors crash entire app

**Solution**:
```typescript
// src/components/ErrorBoundary.tsx
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 text-red-800 rounded">
          <h2>Something went wrong</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Apply in App.tsx**:
```tsx
<ErrorBoundary fallback={<ErrorUI />}>
  <ChatInterface {...props} />
</ErrorBoundary>
<ErrorBoundary fallback={<ErrorUI />}>
  <PlanVisualizer {...props} />
</ErrorBoundary>
```

**Effort**: 1 day
**Impact**: Medium (stability)

---

### 12. Centralize Metric Calculations

**Problem**: Metrics calculated differently across modules

**Files with calculations**:
- `performanceAnalyzer.ts` - Uses hardcoded benchmarks
- `budgetOptimizer.ts` - Uses different efficiency scores
- `forecastingEngine.ts` - Uses seasonal factors
- `dummyData.ts` - Generates mock metrics

**Solution**: Create `src/services/MetricsService.ts`

```typescript
export class MetricsService {
  calculateCPA(spend: number, conversions: number): number {
    return conversions > 0 ? spend / conversions : 0;
  }

  calculateROAS(revenue: number, spend: number): number {
    return spend > 0 ? revenue / spend : 0;
  }

  calculateCTR(clicks: number, impressions: number): number {
    return impressions > 0 ? (clicks / impressions) * 100 : 0;
  }

  calculateCPM(spend: number, impressions: number): number {
    return impressions > 0 ? (spend / impressions) * 1000 : 0;
  }

  calculateFrequency(impressions: number, reach: number): number {
    return reach > 0 ? impressions / reach : 0;
  }

  // Centralized benchmarks
  getBenchmark(channel: Channel, metric: string): number {
    return BENCHMARKS[channel]?.[metric] ?? 0;
  }
}
```

**Effort**: 1.5 days
**Impact**: Medium (consistency)

---

## Low Priority (Enhancement)

### 13. Add Accessibility Features

**Missing**:
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus management
- Screen reader compatibility

**Implementation**:
```tsx
// Add ARIA labels
<button
  aria-label="Delete placement"
  onClick={handleDelete}
>
  <Trash2 className="w-4 h-4" />
</button>

// Add keyboard navigation
<div
  role="grid"
  aria-label="Media placements"
  onKeyDown={handleKeyboardNavigation}
>
  {/* rows */}
</div>

// Manage focus
useEffect(() => {
  if (isOpen) {
    modalRef.current?.focus();
  }
}, [isOpen]);
```

**Effort**: 2 days
**Impact**: Low-Medium (inclusivity)

---

### 14. Build Component Library

**Approach**: Create Storybook for isolated development

```bash
npx storybook@latest init
```

**Benefits**:
- Document component props and usage
- Visual regression testing
- Isolated component development

**Effort**: 2-3 days
**Impact**: Low (developer experience)

---

### 15. Add Data Persistence

**Current**: All data lost on page reload

**Solution**: LocalStorage with optional backend sync

```typescript
// src/services/PersistenceService.ts
export class PersistenceService {
  private storageKey = 'fuseiq-plans';

  savePlan(plan: MediaPlan): void {
    const plans = this.getPlans();
    plans[plan.id] = {
      ...plan,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(this.storageKey, JSON.stringify(plans));
  }

  getPlan(id: string): MediaPlan | null {
    const plans = this.getPlans();
    return plans[id] ?? null;
  }

  getPlans(): Record<string, MediaPlan> {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : {};
  }
}
```

**Effort**: 1-2 days
**Impact**: Low (convenience)

---

## Implementation Order

### Phase 1: Critical (Week 1)
1. Decompose AgentBrain (2-3 days)
2. Externalize hardcoded data (1 day)
3. Implement input validation (2 days)

### Phase 2: High Priority (Week 2)
4. Reduce type safety issues (2 days)
5. Fix state mutation patterns (1.5 days)
6. Add error handling (2 days)

### Phase 3: Stability (Week 3)
7. Centralize regex patterns (1 day)
8. Add comprehensive logging (1 day)
9. Add error boundaries (1 day)
10. Add unit tests - core logic (2 days)

### Phase 4: Polish (Week 4+)
11. Performance optimizations
12. Centralize metric calculations
13. Accessibility features
14. Component library

---

## Estimated Effort Summary

| Priority | Items | Estimated Hours |
|----------|-------|-----------------|
| Critical | 4 | 40-50 |
| High | 4 | 25-30 |
| Medium | 4 | 25-35 |
| Low | 3 | 15-20 |
| **Total** | **15** | **105-135** |

---

## Code Smell Summary

| Issue | Files | Severity | Lines Affected |
|-------|-------|----------|----------------|
| God Class (AgentBrain) | agentBrain.ts | CRITICAL | 2,229 |
| Hardcoded data | agentBrain.ts, dummyData.ts | CRITICAL | 500+ |
| `any` type usage | Multiple | HIGH | 76 instances |
| Direct state mutations | App.tsx, PlanVisualizer.tsx | HIGH | 50+ |
| Missing validation | Multiple | HIGH | All inputs |
| Silent error handling | entityExtractor.ts | HIGH | 10+ |
| Scattered regex patterns | Multiple | MEDIUM | 40+ |
| Missing error boundaries | All components | MEDIUM | All |
| No unit tests | All | MEDIUM | 0% coverage |
| Inconsistent metrics | Multiple utils | MEDIUM | 4 files |

---

## Success Criteria

After completing all critical and high-priority items:

- [ ] AgentBrain.ts < 500 lines
- [ ] No hardcoded data in logic files
- [ ] `any` usage < 10 instances
- [ ] All user inputs validated
- [ ] Error handling in all async operations
- [ ] Logging in all major modules
- [ ] Unit test coverage > 50% for core logic
