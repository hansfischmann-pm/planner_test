# FuseIQ Media Planner

An AI-powered media planning platform built with React, TypeScript, and Vite. FuseIQ enables media agencies and brands to create, optimize, and manage media campaigns through conversational AI.

## Overview

FuseIQ provides a conversational interface for media planning where users can specify budgets, strategies, and placements through natural language. The AI agent provides recommendations across multiple channels including Search, Social, Display, TV, Radio, OOH (Out-of-Home), and Print.

### Key Features

- **Conversational Planning**: Natural language interface with intent classification (62+ patterns)
- **Multi-Channel Support**: Search, Social, Display, TV, CTV, Radio, OOH, Print, Retail Media
- **Dual User Perspectives**: Agency users manage multiple clients; Brand users manage their own campaigns
- **AI Agent Transparency**: See what agents are doing behind the scenes
- **Advanced NLP**: Intent classification, entity extraction, and context management
- **Optimization Engine**: Quick wins identification, budget optimization, performance recommendations
- **Forecasting Engine**: Campaign predictions with seasonal adjustments and audience overlap
- **Audience Insights**: Segment analysis, overlap visualization, lookalike recommendations
- **Campaign Templates**: 6 pre-configured templates with industry-specific recommendations
- **Undo/Redo System**: Full action history with audit trail
- **Export Capabilities**: PDF, PowerPoint, and CSV exports
- **DMA Lookup**: Broadcast TV station lookup by market
- **Integration Ready**: Framework for DSP/DMP integrations (The Trade Desk, LiveRamp, etc.)

## Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2.0 | UI Framework |
| TypeScript | 5.2.2 | Type Safety |
| Vite | 7.2.4 | Build Tool |
| Tailwind CSS | 3.3.5 | Styling |
| Lucide React | 0.292.0 | Icons |
| jsPDF | 3.0.4 | PDF Generation |
| PptxGenJS | 3.12.0 | PowerPoint Generation |

## Project Structure

```
src/
├── App.tsx                      # Main application (1,082 lines)
├── main.tsx                     # React entry point
├── index.css                    # Tailwind imports
├── types.ts                     # TypeScript interfaces (346 lines)
│
├── components/                  # 33 React components
│   ├── Analytics/
│   │   ├── AudienceInsightsPanel.tsx    # Segment analysis UI
│   │   ├── AudienceOverlapChart.tsx     # Venn diagram visualization
│   │   ├── SegmentBrowser.tsx           # Segment library browser
│   │   ├── SegmentPerformanceTable.tsx  # Segment metrics
│   │   ├── ForecastCards.tsx            # Performance forecasts
│   │   └── CampaignComparisonChart.tsx  # Multi-campaign comparison
│   │
│   ├── Optimization/
│   │   ├── BudgetOptimizer.tsx          # Budget allocation UI
│   │   ├── ExpansionRecommendations.tsx # Growth suggestions
│   │   └── LookalikeRecommendations.tsx # Lookalike audiences
│   │
│   ├── Planning/
│   │   ├── ChatInterface.tsx            # Conversational AI (511 lines)
│   │   ├── PlanVisualizer.tsx           # Placements table (836 lines)
│   │   ├── PlacementDetailPanel.tsx     # Placement editing
│   │   ├── PlanMetricsSummary.tsx       # KPI dashboard
│   │   ├── TemplateLibrary.tsx          # Campaign templates
│   │   └── TemplateWizard.tsx           # Template configuration
│   │
│   ├── Creative/
│   │   ├── CreativeLibrary.tsx          # Asset management
│   │   └── CreativePerformanceCard.tsx  # Creative metrics
│   │
│   ├── Integrations/
│   │   ├── IntegrationDashboard.tsx     # DSP/DMP connections
│   │   └── PortfolioDashboard.tsx       # Multi-campaign view
│   │
│   ├── Reporting/
│   │   └── UnifiedReportView.tsx        # Aggregated metrics
│   │
│   └── Navigation/
│       ├── LoginScreen.tsx              # Authentication
│       ├── ClientSelectionDashboard.tsx # Brand selection
│       ├── CampaignList.tsx             # Campaign grid
│       ├── FlightList.tsx               # Flight management
│       └── GlobalShortcuts.tsx          # Keyboard shortcuts
│
├── logic/                       # AI & Business Logic
│   ├── agentBrain.ts            # Core conversational AI (2,229 lines)
│   ├── intentClassifier.ts      # Intent recognition (307 lines)
│   ├── entityExtractor.ts       # Entity extraction (338 lines)
│   ├── contextManager.ts        # Conversation context (262 lines)
│   ├── campaignTemplates.ts     # Template definitions (233 lines)
│   ├── integrationManager.ts    # Third-party integrations (138 lines)
│   ├── dmaData.ts               # Broadcast TV stations
│   └── dummyData.ts             # Mock data generation
│
├── utils/                       # Utilities & Engines
│   ├── forecastingEngine.ts     # Performance predictions (428 lines)
│   ├── optimizationEngine.ts    # Optimization recommendations (305 lines)
│   ├── performanceAnalyzer.ts   # Issue detection (368 lines)
│   ├── budgetOptimizer.ts       # Budget allocation (282 lines)
│   ├── audienceInsights.ts      # Audience analysis (345 lines)
│   ├── actionHistory.ts         # Undo/redo system (195 lines)
│   ├── placementGenerator.ts    # Batch placement creation (273 lines)
│   ├── segmentOptimization.ts   # Segment optimization (76 lines)
│   ├── pdfGenerator.ts          # PDF export
│   └── pptGenerator.ts          # PowerPoint export
│
├── data/                        # Static Data
│   ├── segmentLibrary.ts        # 60+ audience segments (528 lines)
│   ├── portfolioData.ts         # Multi-brand portfolio (91 lines)
│   └── largeScaleData.ts        # Scale testing (250 lines)
│
├── tests/                       # Test Suite
│   └── agentTests.ts            # Agent test cases (365 lines)
│
└── docs/                        # Documentation
    ├── ROADMAP.md               # Product roadmap
    ├── agent-conversation-patterns.md
    ├── phase3-summary.md
    └── portfolio-management.md
```

## Architecture

### NLP Pipeline

```
User Input: "Create a campaign with $500k budget for social"
     ↓
┌─────────────────────────────────────────────┐
│ 1. INTENT CLASSIFICATION                    │
│    Pattern matching (62+ patterns)          │
│    → CAMPAIGN_SETUP (confidence: 95%)       │
└─────────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────────┐
│ 2. ENTITY EXTRACTION                        │
│    → budget: $500,000                       │
│    → channels: ["Social"]                   │
│    → dates: null                            │
└─────────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────────┐
│ 3. CONTEXT MANAGEMENT                       │
│    → Session history (max 20 messages)      │
│    → User expertise detection               │
│    → Entity accumulation across turns       │
└─────────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────────┐
│ 4. AGENT BRAIN PROCESSING                   │
│    → State machine (INIT → BUDGETING → ...) │
│    → Command execution                      │
│    → Response generation                    │
└─────────────────────────────────────────────┘
     ↓
Response with suggested actions
```

### Intent Categories

| Category | Examples |
|----------|----------|
| CAMPAIGN_SETUP | "Create a campaign", "Start a new plan" |
| BUDGET_ALLOCATION | "Set budget to $500k", "Allocate 30% to social" |
| AUDIENCE_TARGETING | "Target millennials", "Add sports enthusiasts" |
| PERFORMANCE_MONITORING | "How is the campaign doing?", "Show CTR" |
| OPTIMIZATION | "Optimize for conversions", "Shift budget to display" |
| REPORTING | "Export as PDF", "Generate report" |
| FORECASTING | "Predict performance", "What's the expected reach?" |
| CREATIVE | "Upload creative", "Show ad performance" |
| HELP | "How do I...?", "What can you do?" |

### Optimization Engine

The optimization engine analyzes placements and generates recommendations:

```
Issue Detection:
├── ROAS < 0.5 → CRITICAL: Pause placement
├── ROAS < 1.0 → WARNING: Reduce budget
├── ROAS > 3.0 → INFO: Scale opportunity
├── CPA > 2× benchmark → CRITICAL: Cost issue
├── Frequency > 8 → WARNING: Ad fatigue
└── Single channel > 40% → WARNING: Diversify

Output:
├── Quick Wins (high impact + easy action)
├── Savings Opportunities
└── Growth Opportunities
```

### Forecasting Engine

Multi-stage forecasting with confidence intervals:

```
Stage 1: Base Forecast (from placement data)
Stage 2: Seasonal Adjustment (96 channel×month factors)
Stage 3: Audience Overlap Correction (pairwise deduplication)
Stage 4: Confidence Intervals (p25, p50, p75 percentiles)
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/hansfischmann-pm/planner_test.git
cd planner_test

# Install dependencies
npm install

# Start development server
npm run dev
```

### Demo Credentials

| User Type | Email | Password |
|-----------|-------|----------|
| Agency | agency@fuseiq.com | demo123 |
| Brand | brand@cocacola.com | demo123 |

## Usage

### Conversational Commands

**Campaign Setup**
- "Create a campaign with $500k budget"
- "Start a new plan for social and display"
- "Use the retail holiday template"

**Budget Management**
- "Set budget to $1M"
- "Allocate 40% to social, 30% to search"
- "Shift 20% from display to CTV"

**Channel Management**
- "Add search channel"
- "Add TV - ESPN SportsCenter"
- "Remove display placements"

**Audience Targeting**
- "Target millennials interested in sports"
- "Add in-market auto intenders"
- "Show audience overlap"

**Optimization**
- "Optimize for conversions"
- "Show quick wins"
- "Pause underperforming placements"

**Forecasting**
- "Predict campaign performance"
- "What's our expected reach?"
- "Show confidence intervals"

**View Controls**
- "Show detailed view"
- "Show channel summary"
- "Move chat to bottom"

**Exports**
- "Export as PDF"
- "Generate PowerPoint"
- "Download CSV"

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Z` | Undo last action |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + /` | Focus chat input |
| `Escape` | Close panels |

## Campaign Templates

| Template | Channels | Budget Range |
|----------|----------|--------------|
| Retail Holiday (Q4) | Social 35%, Display 25%, Search 25%, TV 10%, OOH 5% | $50k - $500k |
| B2B Lead Gen | Social 40%, Search 35%, Display 20%, TV 5% | $25k - $200k |
| Brand Awareness Launch | TV 40%, Social 25%, OOH 20%, Display 10%, Radio 5% | $100k - $1M |
| Performance E-Commerce | Search 35%, Social 40%, Display 20%, Retail 5% | $25k - $300k |
| Seasonal Campaign | Varies by season | $30k - $250k |

## Supported Channels

| Channel | Rate Types | Vendors |
|---------|------------|---------|
| Search | CPC | Google, Bing, Yahoo |
| Social | CPM | Meta, TikTok, Snapchat, Pinterest, LinkedIn, X |
| Display | CPM | Google Display, Trade Desk, Amazon DSP |
| TV (Linear) | Spot/CPM | ABC, CBS, NBC, Fox, ESPN, etc. |
| CTV | CPM | Hulu, Roku, YouTube TV, Peacock, Max |
| Radio | Spot | iHeart, Spotify, SiriusXM |
| OOH | Flat/CPM | Clear Channel, Lamar, DOOH networks |
| Print | Flat | Magazines, Newspapers |
| Retail Media | CPM | Amazon, Walmart, Instacart |

## Audience Segments

60+ pre-defined segments across categories:
- **Demographics**: Age, income, household
- **Behavioral**: Purchase intent, browsing behavior
- **Interest**: Sports, entertainment, lifestyle
- **B2B**: Job title, company size, industry
- **Contextual**: Content adjacency, topic targeting
- **First-Party**: CRM, website visitors, lookalikes

## Integration Support

**DSP Integrations (Planned)**
- The Trade Desk
- Google DV360
- Amazon Ads
- AdRoll

**DMP Integrations (Planned)**
- LiveRamp
- Adobe Audience Manager
- Oracle Data Cloud
- Lotame

**Analytics (Planned)**
- Google Analytics 4
- Adobe Analytics

## Development

### Scripts

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
npm run test     # Run tests (test-runner.html)
```

### Code Quality Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Total LoC | ~17,000 | <20,000 |
| Type Coverage | 82% | 95%+ |
| Test Coverage | 0% | 70%+ |
| Max File Size | 2,229 LoC | <500 LoC |

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for the full product roadmap.

**Current Status: Phase 5.5 Complete**

- ✅ Phase 1-3: Foundation (UI, Agent Brain, Enhanced Intelligence)
- ✅ Phase 4: Advanced Features (Undo/Redo, Budget Tools)
- ✅ Phase 5: Intelligence & Optimization (Forecasting, Templates, Audience)
- 📋 Phase 6: Platform Integrations (Planned)
- 📋 Phase 7: Collaboration & Workflow (Planned)
- 📋 Phase 8: Advanced AI & ML (Planned)

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Known Issues

See [REFACTORING.md](REFACTORING.md) for technical debt and improvement opportunities.

**Key Areas for Improvement:**
- AgentBrain class needs decomposition (2,229 lines)
- Hardcoded data should be externalized to config files
- Input validation needs implementation
- Test coverage needs expansion

## License

Private - All rights reserved.
