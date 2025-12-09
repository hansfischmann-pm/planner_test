# Onboarding Rewards & Growth Stages System
## Design Brief for Implementation

---

## Executive Summary

This document specifies a user onboarding and campaign lifecycle system that combines:

1. **Welcome Rewards Program** - Real incentives (ad credits + swag) tied to setup milestones
2. **Growth Stages** - Campaign lifecycle visualization (Setup → Learning → Optimizing → Scaling)
3. **Growth Rings** - Audience expansion visualization with seed-based relevance scoring

The goal is to reduce onboarding dropout, increase feature adoption, and help users understand that campaigns need time to mature.

---

## Part 1: Welcome Rewards Program

### Strategic Intent

Users drop off during onboarding because:
- Setup feels like work with no immediate payoff
- They don't know what to do next
- Early campaign results are disappointing (learning phase)

Solution: Tie real rewards to setup milestones, making onboarding feel like earning rather than working.

### Reward Structure

| Milestone | Reward | Business Rationale |
|-----------|--------|-------------------|
| Install pixel | None | Table stakes, no reward needed |
| Launch first campaign | $50 ad credit | Gets them spending, proves commitment |
| Set up conversion tracking | None | Required for next milestone |
| Get first conversion | $100 ad credit | Biggest dropout point - proves value |
| Upload customer list | Swag pack (physical) | Drives 1P data adoption, emotional hook |
| Try second channel | $150 ad credit | Cross-sell, increases stickiness |
| Enable AI optimization | $50 ad credit | Feature adoption |
| Achieve 2x ROAS | $200 ad credit | Celebrates success, funds scaling |

**Total possible: $550 in credits + swag pack**

### UX Principles

1. **Always visible, never intrusive**
   - Persistent but collapsible progress indicator
   - Reward badges shown inline with steps
   - Never modal/blocking

2. **Show what's earned AND what's available**
   - "You've earned $50" + "Unlock $500 more"
   - Creates both satisfaction and motivation

3. **Next step is always clear**
   - Highlight the immediate next action
   - Show its reward prominently

4. **Graceful degradation**
   - New users: Full sidebar checklist + banner
   - Returning users (partial): Compact progress bar
   - Completed users: Remove entirely or show "completed" badge

### UI Components Needed

```
ProgressBanner
- Shows % complete, credits earned, credits available
- Gradient background (brand colors)
- Collapsible on click

OnboardingChecklist
- Ordered list of steps
- Visual states: completed (✓), in-progress (highlighted), upcoming (muted)
- Reward badge on each step that has one
- "Start" button on next available step

RewardBadge
- Credit rewards: Green pill, "+$50" format
- Swag rewards: Purple pill, "🎁 Swag pack" format
- Earned state: "✓ Claimed"

RewardsSummary
- Dark card showing totals
- Credits earned / Credits available / Swag status
- Links to full rewards page

CompactProgressBar
- For returning users
- Circular progress indicator + next step + CTA
- Single row, dismissible
```

### Content Guidelines

**Tone**: Encouraging, not game-y
- ✅ "You've earned $50 in ad credits"
- ❌ "Achievement unlocked! +50 XP"

**Language**:
- "Welcome Rewards" not "Achievements" or "Quests"
- "Credits earned" not "Points"
- "Setup progress" not "Level"

---

## Part 2: Growth Stages (Campaign Lifecycle)

### Strategic Intent

Users get frustrated when new campaigns don't immediately perform. They don't understand that:
- Campaigns need data before AI can optimize
- Early metrics aren't representative
- Patience during "learning" leads to better long-term results

Solution: Visualize campaign maturity as growth stages with clear expectations for each.

### The Four Stages

```
┌─────────┐    ┌──────────┐    ┌────────────┐    ┌─────────┐
│  Setup  │ →  │ Learning │ →  │ Optimizing │ →  │ Scaling │
│   ⚙️    │    │    📊    │    │     🎯     │    │   📈    │
└─────────┘    └──────────┘    └────────────┘    └─────────┘
  Day 1         Day 1-14        Day 14-30         Day 30+
```

#### Stage 1: Setup (New)
- **Trigger**: Campaign created but not launched, or launched <24h
- **User mindset**: Excited, uncertain
- **UI treatment**: Neutral (gray/slate)
- **Guidance**: "Let's get your campaign configured"

#### Stage 2: Learning
- **Trigger**: Launched, but <50 conversions (or <100 for complex goals)
- **User mindset**: Impatient, worried
- **UI treatment**: Amber/yellow - attention but not alarm
- **Guidance**:
  - "Your campaign is gathering data"
  - "AI needs ~50 conversions before it can optimize effectively"
  - "Avoid major changes during this phase"
- **Key metric**: Learning progress % (conversions / threshold)

#### Stage 3: Optimizing
- **Trigger**: Passed conversion threshold, AI actively optimizing
- **User mindset**: Hopeful, engaged
- **UI treatment**: Blue - active, working
- **Guidance**:
  - "AI is now optimizing your campaign"
  - "You should see CPA improve over the next 1-2 weeks"
  - "Consider testing new creatives"

#### Stage 4: Scaling
- **Trigger**: Consistent positive ROAS for 7+ days, stable performance
- **User mindset**: Confident, ready to grow
- **UI treatment**: Green - success
- **Guidance**:
  - "Your campaign is ready to scale"
  - "Consider increasing budget"
  - "Try expanding to new channels"

### UI Components Needed

```
StageIndicator
- Horizontal progress showing all 4 stages
- Current stage highlighted (ring/glow effect)
- Completed stages show checkmark
- Can be compact (pills only) or expanded (with labels)

StageBadge
- Pill/tag showing current stage name
- Color-coded: slate/amber/blue/green

LearningProgressBar
- Shows conversions toward threshold
- "23 / 50 conversions"
- Percentage and visual bar

StageGuidanceCard
- Contextual tips based on current stage
- Collapsible
- Stage-appropriate icon and color scheme

StageTimeline
- Vertical or horizontal journey view
- Shows what happened and what's next
- "Setup ✓ → Learning (now) → Optimizing (soon) → Scaling"
```

### Content by Stage

**Learning Phase Messaging**:
- "Your campaign is in learning phase"
- "New campaigns need 50-100 conversions before AI optimization kicks in"
- "You're X% of the way there"
- "Estimated time remaining: ~Y days"
- Tips:
  - "Be patient - early results aren't representative"
  - "Avoid major targeting changes - they reset learning"
  - "Small budget increases are fine"

**Optimizing Phase Messaging**:
- "AI is now actively optimizing"
- "Expected CPA improvement: 15-30%"
- Tips:
  - "Test new creatives to prevent fatigue"
  - "Review audience performance"
  - "Consider channel expansion"

**Scaling Phase Messaging**:
- "Your campaign is performing well!"
- "Current ROAS: X.Xx"
- Tips:
  - "Increase budget to capture more conversions"
  - "Expand to new channels"
  - "Create lookalike audiences from converters"

---

## Part 3: Growth Rings (Audience Visualization)

### Strategic Intent

Help users understand:
- Audience targeting as expansion from a core (seed)
- Relevance/quality decreases as you expand
- Trade-off between reach and precision
- Value of first-party data

### The Concept

Visualize audiences as concentric rings expanding from a central "seed":

```
         ┌─────────────────────────┐
        │    Contextual Reach     │  (lowest relevance)
       │  ┌─────────────────────┐  │
      │  │   3P Data Segments   │  │
     │  │  ┌─────────────────┐  │  │
    │  │  │   AI Lookalikes  │  │  │
   │  │  │  ┌─────────────┐  │  │  │
  │  │  │  │  1P Expand   │  │  │  │
 │  │  │  │  ┌─────────┐  │  │  │  │
│  │  │  │  │  SEED   │  │  │  │  │  (highest relevance)
 │  │  │  │  └─────────┘  │  │  │  │
  │  │  │  └─────────────┘  │  │  │
   │  │  └─────────────────┘  │  │
    │  └─────────────────────┘  │
     └─────────────────────────┘
```

### Ring Definitions

| Ring | Label | Source | Typical Relevance |
|------|-------|--------|-------------------|
| Center | Seed (Converters) | Conversion data | 100% (baseline) |
| Ring 1 | 1P Expansion | Site visitors, CRM | 85-95% |
| Ring 2 | AI Lookalikes | ML-modeled | 70-85% |
| Ring 3 | 3P Segments | Data providers | 50-70% |
| Ring 4 | Contextual | Keyword/category | 30-50% |

### Visual Properties

**Color**: Green gradient, darker at center (seed), lighter at edges
**Interaction**: Hover to highlight ring and show details
**Locked state**: Grayed/dashed rings for features not yet activated

### Relevance Score

Each ring shows a relevance score (0-100):
- Calculated based on similarity to seed
- Higher = more likely to convert
- Display as small bar + number

### UI Components Needed

```
GrowthRingsVisualization
- SVG or Canvas-based concentric circles
- Hover states with tooltips
- Click to select/configure ring
- Locked state for unavailable rings

RingLegend
- List view of all rings
- Shows: color, label, audience size, relevance score
- Locked indicator for unavailable

SeedSelector
- Choose what audience is the "seed"
- Options: Converters, CRM upload, High-value customers
- Explanation of why seed matters

RelevanceScore
- Small inline component
- Bar + number (e.g., "78%")
- Color gradient from red (low) to green (high)

AudienceExpansionControls
- Toggle AI lookalike expansion on/off
- Slider for minimum relevance threshold
- Projected reach display
```

### Content Guidelines

**Seed explanation**:
- "Your seed is your most valuable customers"
- "All targeting is measured against similarity to your seed"
- "Use conversion data as your seed for best results"

**Locked ring messaging**:
- "🔒 Upload a customer list to unlock 1P Expansion"
- "🔒 Enable AI to unlock Lookalike audiences"

**Relevance explanation**:
- "Relevance shows how similar an audience is to your seed"
- "Higher relevance = more likely to convert"
- "Expanding reach trades off against relevance"

---

## Part 4: Integration Patterns

### How Components Work Together

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER                                                      │
│ [Logo] [Nav] [Rewards: 🎁 $50 earned]                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────┐  ┌──────────┐ │
│  │ WELCOME BANNER (new users)              │  │ CHECKLIST│ │
│  │ Progress ████████░░ 62%                 │  │          │ │
│  │ $50 earned · $500 available             │  └──────────┘ │
│  └─────────────────────────────────────────┘  │ ✓ Step 1 │ │
│                                               │ ✓ Step 2 │ │
│  ┌─────────────────────────────────────────┐  │ → Step 3 │ │
│  │ CAMPAIGN CARD                           │  │ ○ Step 4 │ │
│  │ "Summer Sale" [Learning]                │  │          │ │
│  │                                         │  │ ──────── │ │
│  │ Stage: ●──●──○──○  Learning (46%)       │  │ REWARDS  │ │
│  │        Setup→Learn→Optimize→Scale       │  │ $50 earn │ │
│  │                                         │  │ $500 avl │ │
│  │ [Growth Rings]    [Stage Tips]          │  └──────────┘ │
│  │      ◎            "Be patient..."       │               │
│  │     ◎ ◎                                 │               │
│  │    ◎   ◎                                │               │
│  └─────────────────────────────────────────┘               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Rewards ↔ Stages Connection

Some rewards are tied to stage progression:
- "First conversion" reward often coincides with entering Learning
- "Enable AI optimization" available after Learning completes
- "Achieve 2x ROAS" typically happens in Scaling stage

### Rewards ↔ Growth Rings Connection

- "Upload customer list" unlocks 1P Expansion ring
- "Enable AI optimization" unlocks Lookalike ring
- Visual connection: locked rings show which reward unlocks them

### Contextual Guidance Priority

When multiple guidance could show, prioritize:
1. Blocking issues (campaign paused, budget exhausted)
2. Reward opportunities (next step has reward)
3. Stage-specific tips
4. General optimization suggestions

---

## Part 5: Implementation Notes

### State Management

Track per-user:
```typescript
interface UserOnboardingState {
  completedSteps: string[];
  creditsEarned: number;
  swagEligible: boolean;
  swagClaimed: boolean;
  dismissedBanner: boolean;
}
```

Track per-campaign:
```typescript
interface CampaignGrowthState {
  stage: 'setup' | 'learning' | 'optimizing' | 'scaling';
  learningProgress: number; // 0-100
  conversionsCount: number;
  conversionsThreshold: number;
  daysInCurrentStage: number;
  stageHistory: StageTransition[];
}
```

### API Considerations

- Onboarding progress should persist server-side
- Credits should be applied automatically when milestone hit
- Stage calculation can be client-side based on campaign metrics
- Swag fulfillment needs separate flow (address collection, shipping)

### Analytics Events

Track:
- `onboarding_step_completed` (step_id, reward_earned)
- `onboarding_reward_claimed` (reward_type, value)
- `campaign_stage_changed` (campaign_id, from_stage, to_stage)
- `growth_rings_interacted` (ring_id, action)
- `guidance_tip_viewed` (tip_id, context)
- `guidance_tip_actioned` (tip_id, action_taken)

### Accessibility

- Stage indicators need aria-labels
- Progress bars need role="progressbar" with aria-valuenow
- Color is never the only indicator (always pair with icon/text)
- Reward badges need screen reader text

---

## Part 6: Visual Design Guidelines

### Color Palette

| Purpose | Color | Usage |
|---------|-------|-------|
| Rewards/Credits | Green (#16a34a) | Credit badges, earned indicators |
| Swag | Purple (#9333ea) | Swag badges, physical reward indicators |
| Learning Stage | Amber (#f59e0b) | Learning badges, progress bars |
| Optimizing Stage | Blue (#3b82f6) | Optimizing badges, AI indicators |
| Scaling Stage | Green (#22c55e) | Success states, scaling badges |
| Locked/Disabled | Slate (#94a3b8) | Locked rings, unavailable steps |

### Growth Rings Colors

Center (seed) to edge:
- #16a34a (dark green, 100% relevance)
- #22c55e (green, 85%)
- #4ade80 (light green, 70%)
- #86efac (lighter, 55%)
- #bbf7d0 (lightest, 40%)

### Animation Suggestions

- Progress bars: Smooth fill transitions (300ms ease)
- Stage changes: Celebrate with subtle pulse/glow
- Reward earned: Brief confetti or sparkle (keep professional)
- Ring hover: Gentle scale up (1.02x) + border highlight

---

## Appendix: Reference Implementation

See accompanying JSX files for React implementation examples:
- `option1-subtle-growth.jsx` - Dashboard with subtle growth language
- `option2-growth-rings.jsx` - Audience rings visualization
- `option3-campaign-journey.jsx` - Stage-focused campaign view
- `onboarding-rewards-mockup.jsx` - Full rewards system
- `comprehensive-dsp-mockup.jsx` - All concepts combined

These are reference implementations, not production code. Adapt patterns and principles to your design system.

---

## Canvas Integration Analysis

*Added: Dec 9, 2024*

### How This Fits the Windowed Canvas Architecture

The onboarding/rewards system integrates with the canvas paradigm in several ways:

#### 1. Window Types to Add

New window types for `windowTypes.ts`:
- `'onboarding'` - Full onboarding wizard/checklist window
- `'rewards'` - Rewards summary and history window
- `'audience-builder'` - Growth rings visualization and audience configuration

#### 2. Canvas-Level Components (Not Windowed)

Some elements should exist at the canvas level, not as windows:
- **ProgressBanner** - Top of canvas, above all windows
- **CompactProgressBar** - Taskbar integration or floating pill
- **Rewards indicator** - Part of canvas header/toolbar

#### 3. Campaign Window Integration

The `CampaignWindowContent` should incorporate:
- **StageBadge** in the window title bar or header
- **StageIndicator** as a collapsible section
- **StageGuidanceCard** as contextual tips panel

#### 4. Flight Window Integration

The `FlightWindowContent` should show:
- **Growth Rings** visualization for audience targeting
- **Relevance scores** on audience segments
- **Locked ring indicators** tied to onboarding milestones

#### 5. Agent Brain Awareness

The `AgentBrain` should be aware of:
- Current onboarding stage (to provide contextual suggestions)
- Campaign growth stage (to avoid premature optimization advice)
- Locked features (to guide users toward unlocking them)

New commands to add to `CommandRegistry.ts`:
```typescript
// ONBOARDING category
{ id: 'show_onboarding', patterns: [/show.*onboarding/i, /setup.*wizard/i] },
{ id: 'check_rewards', patterns: [/my rewards/i, /credits.*earned/i] },
{ id: 'next_step', patterns: [/what.*next/i, /next.*step/i] },

// AUDIENCE category (expand existing)
{ id: 'show_growth_rings', patterns: [/growth.*rings/i, /audience.*expansion/i] },
{ id: 'set_seed_audience', patterns: [/set.*seed/i, /seed.*audience/i] },
{ id: 'expand_reach', patterns: [/expand.*reach/i, /lookalike/i] },
```

#### 6. State Management Considerations

The onboarding/rewards state should be:
- **Persisted server-side** (not localStorage like window positions)
- **Loaded into a React context** accessible across all windows
- **Synchronized with AgentBrain** for contextual responses

#### 7. Implementation Priority

For the prototype phase:
1. **Visual indicators only** - StageBadge, StageIndicator (no real rewards)
2. **Static Growth Rings** - Visualization without actual audience data
3. **Mock onboarding state** - Simulate various progress states for demo

Production requirements:
1. Backend API for onboarding progress
2. Credit ledger system
3. Swag fulfillment integration
4. Real audience data for Growth Rings

---

*Last updated: Dec 9, 2024*
