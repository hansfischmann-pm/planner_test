/**
 * CommandRegistry - Centralized command pattern definitions
 *
 * This module defines all command patterns that the agent can recognize.
 * Commands are organized by category and include priority for disambiguation.
 */

// CommandRegistry command patterns - no runtime imports needed

/**
 * Command categories for organization and routing
 */
export type CommandCategory =
    | 'LAYOUT'
    | 'NAVIGATION'
    | 'CAMPAIGN_SETUP'
    | 'BUDGET'
    | 'CHANNEL'
    | 'PLACEMENT'
    | 'OPTIMIZATION'
    | 'FORECASTING'
    | 'GOAL'
    | 'TEMPLATE'
    | 'CREATIVE'
    | 'EXPORT'
    | 'VIEW'
    | 'UNDO_REDO'
    | 'HELP'
    | 'INVENTORY'
    | 'WINDOW_MANAGEMENT'
    | 'ATTRIBUTION';

/**
 * Command definition structure
 */
export interface CommandDefinition {
    /** Unique identifier for the command */
    id: string;

    /** Human-readable name */
    name: string;

    /** Category for routing */
    category: CommandCategory;

    /** Regex patterns that trigger this command */
    patterns: RegExp[];

    /** Priority (higher = checked first) */
    priority: number;

    /** Description for help text */
    description: string;

    /** Example phrases */
    examples: string[];
}

/**
 * Match result from command parsing
 */
export interface CommandMatch {
    command: CommandDefinition;
    match: RegExpMatchArray;
    confidence: number;
}

// =============================================================================
// COMMAND DEFINITIONS
// =============================================================================

export const LAYOUT_COMMANDS: CommandDefinition[] = [
    {
        id: 'layout_switch',
        name: 'Switch Layout',
        category: 'LAYOUT',
        patterns: [
            /(?:sw[it]+ch|change|set|move|go)(?:\s+to)?\s+(left|right|bottom)/i,
            /(?:switch to|change to|set layout to|layout)\s+(left|right|bottom)/i
        ],
        priority: 100,
        description: 'Change the chat panel position',
        examples: ['switch left', 'move to right', 'layout bottom']
    }
];

export const HELP_COMMANDS: CommandDefinition[] = [
    {
        id: 'help',
        name: 'Help',
        category: 'HELP',
        patterns: [
            /^help$/i,
            /what can you do/i,
            /help me/i,
            /suggestions?/i
        ],
        priority: 90,
        description: 'Get help and suggestions',
        examples: ['help', 'what can you do', 'suggestions']
    }
];

export const UNDO_REDO_COMMANDS: CommandDefinition[] = [
    {
        id: 'undo',
        name: 'Undo',
        category: 'UNDO_REDO',
        patterns: [
            /^undo$/i,
            /undo last\s+(\d+)/i,
            /undo\s+(.+)/i,
            /revert/i,
            /go back/i
        ],
        priority: 95,
        description: 'Undo recent actions',
        examples: ['undo', 'undo last 3', 'undo add NFL']
    },
    {
        id: 'redo',
        name: 'Redo',
        category: 'UNDO_REDO',
        patterns: [/^redo$/i, /redo last/i],
        priority: 95,
        description: 'Redo undone actions',
        examples: ['redo']
    },
    {
        id: 'show_history',
        name: 'Show History',
        category: 'UNDO_REDO',
        patterns: [
            /show history/i,
            /action history/i,
            /recent actions/i
        ],
        priority: 85,
        description: 'Show recent action history',
        examples: ['show history', 'recent actions']
    }
];

export const OPTIMIZATION_COMMANDS: CommandDefinition[] = [
    {
        id: 'quick_wins',
        name: 'Quick Wins',
        category: 'OPTIMIZATION',
        patterns: [/quick win/i],
        priority: 80,
        description: 'Show easy, high-impact optimizations',
        examples: ['show quick wins']
    },
    {
        id: 'critical_issues',
        name: 'Critical Issues',
        category: 'OPTIMIZATION',
        patterns: [/critical issue/i],
        priority: 80,
        description: 'Show critical performance issues',
        examples: ['show critical issues']
    },
    {
        id: 'growth_opportunities',
        name: 'Growth Opportunities',
        category: 'OPTIMIZATION',
        patterns: [
            /growth opportunit/i,
            /scale.*winner/i
        ],
        priority: 80,
        description: 'Show scaling opportunities',
        examples: ['show growth opportunities', 'scale winners']
    },
    {
        id: 'optimize_plan',
        name: 'Optimize Plan',
        category: 'OPTIMIZATION',
        patterns: [
            /optimize/i,
            /what.*wrong/i,
            /what.*issue/i,
            /improvement/i,
            /opportunities/i,
            /detailed report/i,
            /full report/i
        ],
        priority: 70,
        description: 'Generate optimization report',
        examples: ['optimize my plan', 'show full report']
    },
    {
        id: 'plan_score',
        name: 'Plan Score',
        category: 'OPTIMIZATION',
        patterns: [
            /plan\s+score/i,
            /plan\s+health/i,
            /plan\s+grade/i
        ],
        priority: 75,
        description: 'Get plan health score',
        examples: ['plan score', 'plan health']
    }
];

export const FORECASTING_COMMANDS: CommandDefinition[] = [
    {
        id: 'forecast',
        name: 'Forecast Campaign',
        category: 'FORECASTING',
        patterns: [
            /forecast/i,
            /predict.*(?:performance|campaign)/i,
            /will we hit/i
        ],
        priority: 75,
        description: 'Forecast campaign performance',
        examples: ['forecast this campaign', 'predict performance']
    },
    {
        id: 'seasonal_impact',
        name: 'Seasonal Impact',
        category: 'FORECASTING',
        patterns: [/seasonal.*(?:impact|factor)/i],
        priority: 75,
        description: 'Analyze seasonal factors',
        examples: ['show seasonal impact']
    },
    {
        id: 'audience_overlap',
        name: 'Audience Overlap',
        category: 'FORECASTING',
        patterns: [
            /audience overlap/i,
            /overlap.*reach/i
        ],
        priority: 75,
        description: 'Calculate audience overlap',
        examples: ['check audience overlap']
    }
];

export const GOAL_COMMANDS: CommandDefinition[] = [
    {
        id: 'show_goals',
        name: 'Show Goals',
        category: 'GOAL',
        patterns: [
            /show.*goal/i,
            /list.*goal/i,
            /what are.*goal/i
        ],
        priority: 80,
        description: 'Show current campaign goals',
        examples: ['show goals', 'what are my goals']
    },
    {
        id: 'set_goal',
        name: 'Set Goal',
        category: 'GOAL',
        patterns: [
            /set\s+goal/i,
            /update\s+goal/i,
            /change\s+goal/i,
            /increase\s+(?:reach|impression|conversion|click)/i
        ],
        priority: 80,
        description: 'Set or update campaign goals',
        examples: ['set goal impressions 1M', 'increase reach to 500k']
    }
];

export const TEMPLATE_COMMANDS: CommandDefinition[] = [
    {
        id: 'show_templates',
        name: 'Show Templates',
        category: 'TEMPLATE',
        patterns: [
            /show.*template/i,
            /list.*template/i,
            /browse.*template/i,
            /what.*template/i,
            /available.*template/i
        ],
        priority: 75,
        description: 'Browse campaign templates',
        examples: ['show templates', 'what templates are available']
    },
    {
        id: 'template_details',
        name: 'Template Details',
        category: 'TEMPLATE',
        patterns: [
            /tell me about.*template/i,
            /what.*(?:retail|b2b|brand|performance|local|mobile).*template/i
        ],
        priority: 75,
        description: 'Get template details',
        examples: ['tell me about the retail holiday template']
    },
    {
        id: 'template_recommendation',
        name: 'Template Recommendation',
        category: 'TEMPLATE',
        patterns: [
            /best for/i,
            /recommend.*template/i
        ],
        priority: 75,
        description: 'Get template recommendations',
        examples: ['what\'s best for B2B?']
    }
];

export const CREATIVE_COMMANDS: CommandDefinition[] = [
    {
        id: 'upload_creative',
        name: 'Upload Creative',
        category: 'CREATIVE',
        patterns: [/upload.*creative/i, /upload/i],
        priority: 70,
        description: 'Upload a creative asset',
        examples: ['upload creative "Holiday Banner"']
    },
    {
        id: 'assign_creative',
        name: 'Assign Creative',
        category: 'CREATIVE',
        patterns: [/assign.*creative/i, /assign/i],
        priority: 70,
        description: 'Assign creative to placements',
        examples: ['assign to all display placements']
    },
    {
        id: 'winning_creative',
        name: 'Winning Creative',
        category: 'CREATIVE',
        patterns: [
            /winning.*creative/i,
            /best performing.*creative/i
        ],
        priority: 70,
        description: 'Find top performing creative',
        examples: ['show winning creative']
    }
];

export const BUDGET_COMMANDS: CommandDefinition[] = [
    {
        id: 'budget_allocation',
        name: 'Budget Allocation',
        category: 'BUDGET',
        patterns: [
            /how.*allocate/i,
            /split.*budget/i,
            /distribute.*budget/i,
            /spread.*budget/i
        ],
        priority: 70,
        description: 'Get budget allocation recommendations',
        examples: ['how should I allocate $100k?']
    },
    {
        id: 'change_budget',
        name: 'Change Budget',
        category: 'BUDGET',
        patterns: [
            /budget.*\$?[\d,]+[kKmM]?/i,
            /set budget/i
        ],
        priority: 65,
        description: 'Change total budget',
        examples: ['set budget to $500k']
    }
];

export const CHANNEL_COMMANDS: CommandDefinition[] = [
    {
        id: 'add_batch_placements',
        name: 'Add Batch Placements',
        category: 'CHANNEL',
        patterns: [
            /(?:add|create|make|generate)\s+(\d+)\s+(social|display|tv|ctv|connected tv|linear tv|search|audio|video|native)/i
        ],
        priority: 75,
        description: 'Add multiple placements at once',
        examples: ['add 5 social placements', 'create 3 TV spots']
    },
    {
        id: 'add_channel',
        name: 'Add Channel/Placement',
        category: 'CHANNEL',
        patterns: [
            // Print removed - not supported
            /add\s+(search|social|display|tv|radio|ooh|espn|cbs|nbc|abc|fox|cnn|msnbc|hgtv|discovery|tlc|bravo|tnt|netflix|hulu|amazon|disney|hbo|apple|paramount|peacock|youtube|roku|tubi|pluto|f1|dazn|sling|nfl|nba|mlb|nhl)/i
        ],
        priority: 65,
        description: 'Add a channel or network placement',
        examples: ['add search', 'add ESPN SportsCenter']
    },
    {
        id: 'add_show',
        name: 'Add Show',
        category: 'CHANNEL',
        patterns: [/^add\s+(.+)$/i],
        priority: 50, // Lower priority - catch-all for show names
        description: 'Add a TV show by name',
        examples: ['add Monday Night Football']
    }
];

export const PLACEMENT_COMMANDS: CommandDefinition[] = [
    {
        id: 'pause_placement',
        name: 'Pause Placement',
        category: 'PLACEMENT',
        patterns: [
            /pause\s+(?:row\s+)?(\d+)/i,
            /pause\s+(.+)/i
        ],
        priority: 70,
        description: 'Pause a placement',
        examples: ['pause row 3', 'pause Facebook']
    },
    {
        id: 'resume_placement',
        name: 'Resume Placement',
        category: 'PLACEMENT',
        patterns: [
            /(?:resume|unpause)\s+(?:row\s+)?(\d+)/i,
            /(?:resume|unpause)\s+(.+)/i
        ],
        priority: 70,
        description: 'Resume a paused placement',
        examples: ['resume row 3', 'unpause Facebook']
    },
    {
        id: 'modify_segment',
        name: 'Modify Segment',
        category: 'PLACEMENT',
        patterns: [
            /row\s+(\d+).*segment.*to\s+(.+)/i,
            /change\s+segment.*(\d+).*to\s+(.+)/i
        ],
        priority: 70,
        description: 'Change placement segment',
        examples: ['row 2 segment to sports fans']
    }
];

export const VIEW_COMMANDS: CommandDefinition[] = [
    {
        id: 'change_view',
        name: 'Change View',
        category: 'VIEW',
        patterns: [
            /group/i,
            /summary/i,
            /detail/i,
            /segment/i,
            /line item/i,
            /placement/i,
            /flat/i
        ],
        priority: 60,
        description: 'Change grouping view',
        examples: ['show details', 'show channel summary']
    },
    {
        id: 'change_dates',
        name: 'Change Dates',
        category: 'VIEW',
        patterns: [
            /date/i,
            /run from/i,
            /delay/i
        ],
        priority: 60,
        description: 'Modify campaign dates',
        examples: ['delay start by 1 month']
    }
];

export const EXPORT_COMMANDS: CommandDefinition[] = [
    {
        id: 'export_ppt',
        name: 'Export PowerPoint',
        category: 'EXPORT',
        patterns: [/ppt/i, /powerpoint/i],
        priority: 80,
        description: 'Export as PowerPoint',
        examples: ['export to PowerPoint']
    },
    {
        id: 'export_pdf',
        name: 'Export PDF',
        category: 'EXPORT',
        patterns: [/export/i, /pdf/i],
        priority: 75,
        description: 'Export as PDF',
        examples: ['export PDF']
    }
];

export const INVENTORY_COMMANDS: CommandDefinition[] = [
    {
        id: 'inventory_query',
        name: 'Inventory Query',
        category: 'INVENTORY',
        patterns: [
            /what.*(?:available|avail|inventory)/i
        ],
        priority: 60,
        description: 'Query available inventory',
        examples: ['what TV is available?', 'what DOOH is in NYC?']
    },
    {
        id: 'dma_query',
        name: 'DMA Query',
        category: 'INVENTORY',
        patterns: [
            /(?:channel|station|broadcast|tv).*(?:in|available)/i
        ],
        priority: 65,
        description: 'Query broadcast stations by DMA',
        examples: ['what channels are available in Chicago?']
    }
];

export const NAVIGATION_COMMANDS: CommandDefinition[] = [
    {
        id: 'create_campaign',
        name: 'Create Campaign',
        category: 'NAVIGATION',
        patterns: [
            /(?:create|new|add)\s+campaign\s+(?:for\s+)?(.+)/i
        ],
        priority: 70,
        description: 'Create a new campaign',
        examples: ['create campaign for Nike']
    },
    {
        id: 'create_flight',
        name: 'Create Flight',
        category: 'NAVIGATION',
        patterns: [
            /(?:create|new|add)\s+flight\s+(?:for\s+)?(.+)/i
        ],
        priority: 70,
        description: 'Create a new flight',
        examples: ['create flight for Q1']
    }
];

// =============================================================================
// WINDOW MANAGEMENT COMMANDS (Phase 2 - Canvas Integration)
// =============================================================================

export const WINDOW_MANAGEMENT_COMMANDS: CommandDefinition[] = [
    {
        id: 'close_window',
        name: 'Close Window',
        category: 'WINDOW_MANAGEMENT',
        patterns: [
            /^close$/i,
            /close\s+(?:this\s+)?window/i,
            /close\s+(?:the\s+)?(.+)\s+window/i
        ],
        priority: 85,
        description: 'Close the active window or a specific window',
        examples: ['close', 'close window', 'close this window', 'close the campaign window']
    },
    {
        id: 'minimize_window',
        name: 'Minimize Window',
        category: 'WINDOW_MANAGEMENT',
        patterns: [
            /minimize$/i,
            /minimize\s+(?:this\s+)?window/i,
            /minimize\s+(?:the\s+)?(.+)\s+window/i
        ],
        priority: 85,
        description: 'Minimize the active window or a specific window',
        examples: ['minimize', 'minimize window', 'minimize the flight window']
    },
    {
        id: 'maximize_window',
        name: 'Maximize Window',
        category: 'WINDOW_MANAGEMENT',
        patterns: [
            /maximize$/i,
            /maximize\s+(?:this\s+)?window/i,
            /full\s*screen/i
        ],
        priority: 85,
        description: 'Maximize the active window',
        examples: ['maximize', 'maximize window', 'fullscreen']
    },
    {
        id: 'restore_window',
        name: 'Restore Window',
        category: 'WINDOW_MANAGEMENT',
        patterns: [
            /restore\s+(?:this\s+)?window/i,
            /restore\s+(?:the\s+)?(.+)\s+window/i,
            /unminimize/i,
            /unmaximize/i
        ],
        priority: 85,
        description: 'Restore a minimized or maximized window',
        examples: ['restore window', 'restore the campaign window', 'unminimize']
    },
    {
        id: 'tile_windows',
        name: 'Tile Windows',
        category: 'WINDOW_MANAGEMENT',
        patterns: [
            /tile\s+(?:all\s+)?windows?/i,
            /tile\s+(horizontal|vertical)(?:ly)?/i,
            /arrange\s+(?:windows?\s+)?(?:as\s+)?tile/i,
            /snap\s+windows/i
        ],
        priority: 90,
        description: 'Arrange windows in a tiled layout',
        examples: ['tile windows', 'tile horizontal', 'tile vertical', 'arrange as tile']
    },
    {
        id: 'cascade_windows',
        name: 'Cascade Windows',
        category: 'WINDOW_MANAGEMENT',
        patterns: [
            /cascade\s+(?:all\s+)?windows?/i,
            /cascade$/i,
            /arrange\s+(?:windows?\s+)?(?:as\s+)?cascade/i,
            /stack\s+windows/i
        ],
        priority: 90,
        description: 'Arrange windows in a cascading layout',
        examples: ['cascade windows', 'cascade', 'stack windows']
    },
    {
        id: 'minimize_all',
        name: 'Minimize All',
        category: 'WINDOW_MANAGEMENT',
        patterns: [
            /minimize\s+all/i,
            /show\s+desktop/i,
            /hide\s+all\s+windows/i,
            /clear\s+(?:the\s+)?desktop/i
        ],
        priority: 90,
        description: 'Minimize all open windows',
        examples: ['minimize all', 'show desktop', 'hide all windows']
    },
    {
        id: 'restore_all',
        name: 'Restore All',
        category: 'WINDOW_MANAGEMENT',
        patterns: [
            /restore\s+all/i,
            /show\s+all\s+windows/i,
            /unhide\s+(?:all\s+)?windows/i
        ],
        priority: 90,
        description: 'Restore all minimized windows',
        examples: ['restore all', 'show all windows']
    },
    {
        id: 'close_all',
        name: 'Close All Windows',
        category: 'WINDOW_MANAGEMENT',
        patterns: [
            /close\s+all(?:\s+windows)?/i,
            /close\s+everything/i
        ],
        priority: 90,
        description: 'Close all open windows',
        examples: ['close all', 'close all windows', 'close everything']
    },
    {
        id: 'focus_window',
        name: 'Focus Window',
        category: 'WINDOW_MANAGEMENT',
        patterns: [
            /(?:switch|go)\s+to\s+(?:the\s+)?(.+?)(?:\s+window)?$/i,
            /focus\s+(?:on\s+)?(?:the\s+)?(.+?)(?:\s+window)?$/i,
            /bring\s+(.+)\s+to\s+(?:the\s+)?front/i,
            /show\s+(?:me\s+)?(?:the\s+)?(.+?)(?:\s+window)?$/i
        ],
        priority: 80,
        description: 'Switch focus to a specific window',
        examples: ['switch to campaign', 'go to the flight window', 'focus on portfolio', 'bring campaign to front']
    },
    {
        id: 'open_window',
        name: 'Open Window',
        category: 'WINDOW_MANAGEMENT',
        patterns: [
            /open\s+(?:a\s+)?(?:new\s+)?(campaign|flight|portfolio|report|settings|audience|chat)\s*(?:window)?/i,
            /new\s+(campaign|flight|portfolio|report|settings|audience|chat)\s*window/i
        ],
        priority: 85,
        description: 'Open a new window of a specific type',
        examples: ['open campaign window', 'open portfolio', 'new flight window']
    },
    {
        id: 'gather_windows',
        name: 'Gather Windows',
        category: 'WINDOW_MANAGEMENT',
        patterns: [
            /gather\s+(?:all\s+)?windows/i,
            /bring\s+(?:all\s+)?windows\s+(?:back|here)/i,
            /find\s+(?:my\s+)?(?:lost\s+)?windows/i,
            /where\s+(?:are\s+)?(?:my\s+)?windows/i
        ],
        priority: 85,
        description: 'Bring all windows back to the visible area',
        examples: ['gather windows', 'bring windows back', 'find my windows']
    },
    {
        id: 'pin_window',
        name: 'Pin Window',
        category: 'WINDOW_MANAGEMENT',
        patterns: [
            /pin\s+(?:this\s+)?window/i,
            /keep\s+(?:this\s+)?window/i,
            /save\s+(?:this\s+)?window/i
        ],
        priority: 80,
        description: 'Pin the current window to persist across sessions',
        examples: ['pin window', 'keep this window', 'save window']
    },
    {
        id: 'unpin_window',
        name: 'Unpin Window',
        category: 'WINDOW_MANAGEMENT',
        patterns: [
            /unpin\s+(?:this\s+)?window/i,
            /don't\s+keep\s+(?:this\s+)?window/i
        ],
        priority: 80,
        description: 'Unpin the current window',
        examples: ['unpin window', "don't keep this window"]
    }
];

// =============================================================================
// ATTRIBUTION COMMANDS (Phase 2 - Attribution + Chat Integration)
// =============================================================================

export const ATTRIBUTION_COMMANDS: CommandDefinition[] = [
    // --- Navigation Commands ---
    {
        id: 'open_attribution',
        name: 'Open Attribution Dashboard',
        category: 'ATTRIBUTION',
        patterns: [
            /(?:show|open|view|display)\s+(?:me\s+)?(?:the\s+)?attribution(?:\s+dashboard)?$/i,
            /(?:go\s+to|navigate\s+to)\s+attribution/i,
            /attribution\s+(?:dashboard|analysis|view)$/i
        ],
        priority: 90,
        description: 'Open the full attribution dashboard',
        examples: ['show attribution', 'open attribution dashboard', 'go to attribution']
    },
    {
        id: 'open_attribution_overview',
        name: 'Open Attribution Overview',
        category: 'ATTRIBUTION',
        patterns: [
            /(?:show|open|view)\s+(?:me\s+)?(?:the\s+)?attribution\s+overview/i,
            /(?:show|open|view)\s+(?:me\s+)?(?:the\s+)?(?:channel\s+)?attribution\s+(?:breakdown|summary|table)/i
        ],
        priority: 88,
        description: 'Open the attribution overview view',
        examples: ['show attribution overview', 'view channel attribution breakdown']
    },
    {
        id: 'open_incrementality',
        name: 'Open Incrementality Testing',
        category: 'ATTRIBUTION',
        patterns: [
            /(?:show|open|view)\s+(?:me\s+)?(?:the\s+)?incrementality(?:\s+testing)?/i,
            /(?:show|open|view)\s+(?:me\s+)?(?:the\s+)?(?:lift|holdout)\s+test(?:s|ing)?/i,
            /(?:go\s+to|navigate\s+to)\s+incrementality/i
        ],
        priority: 88,
        description: 'Open the incrementality testing view',
        examples: ['show incrementality', 'open lift testing', 'view holdout tests']
    },
    {
        id: 'open_time_analysis',
        name: 'Open Time Analysis',
        category: 'ATTRIBUTION',
        patterns: [
            /(?:show|open|view)\s+(?:me\s+)?(?:the\s+)?time\s+(?:analysis|to\s+conversion)/i,
            /(?:show|open|view)\s+(?:me\s+)?conversion\s+(?:time|velocity)/i,
            /how\s+long\s+(?:does\s+it\s+take|until)\s+(?:users?\s+)?convert/i
        ],
        priority: 88,
        description: 'Open the time-to-conversion analysis view',
        examples: ['show time analysis', 'view conversion time', 'how long until users convert']
    },
    {
        id: 'open_frequency_analysis',
        name: 'Open Touchpoint Frequency',
        category: 'ATTRIBUTION',
        patterns: [
            /(?:show|open|view)\s+(?:me\s+)?(?:the\s+)?(?:touchpoint\s+)?frequency/i,
            /(?:show|open|view)\s+(?:me\s+)?touchpoint\s+(?:analysis|count)/i,
            /how\s+many\s+(?:touchpoints?|interactions?)\s+(?:before|until|to)\s+convert/i
        ],
        priority: 88,
        description: 'Open the touchpoint frequency analysis view',
        examples: ['show frequency analysis', 'view touchpoint count', 'how many touchpoints to convert']
    },
    {
        id: 'open_model_comparison',
        name: 'Open Model Comparison',
        category: 'ATTRIBUTION',
        patterns: [
            /(?:show|open|view)\s+(?:me\s+)?(?:the\s+)?model\s+comparison/i,
            /compare\s+(?:attribution\s+)?models/i,
            /(?:show|view)\s+(?:me\s+)?(?:all\s+)?(?:attribution\s+)?models/i,
            /(?:which|what)\s+model\s+(?:is\s+best|should\s+I\s+use)/i
        ],
        priority: 88,
        description: 'Open the attribution model comparison view',
        examples: ['show model comparison', 'compare models', 'which model is best']
    },
    // --- Pop-out Commands ---
    {
        id: 'popout_attribution_view',
        name: 'Pop Out Attribution View',
        category: 'ATTRIBUTION',
        patterns: [
            /pop\s*out\s+(?:the\s+)?(overview|incrementality|time|frequency|model)/i,
            /open\s+(overview|incrementality|time|frequency|model)\s+in\s+(?:a\s+)?new\s+window/i,
            /(?:detach|separate)\s+(?:the\s+)?(overview|incrementality|time|frequency|model)/i
        ],
        priority: 92,
        description: 'Open an attribution view in a separate window',
        examples: ['pop out overview', 'open time in new window', 'detach incrementality']
    },
    // --- Model Commands ---
    {
        id: 'change_attribution_model',
        name: 'Change Attribution Model',
        category: 'ATTRIBUTION',
        patterns: [
            /(?:switch|change|set)\s+(?:to\s+)?(?:the\s+)?(first[- ]?touch|last[- ]?touch|linear|time[- ]?decay|position[- ]?based)\s*(?:model|attribution)?/i,
            /use\s+(?:the\s+)?(first[- ]?touch|last[- ]?touch|linear|time[- ]?decay|position[- ]?based)\s*(?:model|attribution)?/i,
            /(?:attribution\s+)?model\s*[=:]\s*(first[- ]?touch|last[- ]?touch|linear|time[- ]?decay|position[- ]?based)/i
        ],
        priority: 85,
        description: 'Change the active attribution model',
        examples: ['switch to first touch', 'use linear model', 'change to time decay']
    },
    {
        id: 'explain_attribution_model',
        name: 'Explain Attribution Model',
        category: 'ATTRIBUTION',
        patterns: [
            /(?:explain|what\s+is|tell\s+me\s+about)\s+(?:the\s+)?(first[- ]?touch|last[- ]?touch|linear|time[- ]?decay|position[- ]?based)(?:\s+(?:model|attribution))?/i,
            /how\s+does\s+(?:the\s+)?(first[- ]?touch|last[- ]?touch|linear|time[- ]?decay|position[- ]?based)\s*(?:model)?\s*work/i,
            /(?:what's|what\s+is)\s+the\s+difference\s+between\s+(?:attribution\s+)?models/i
        ],
        priority: 82,
        description: 'Explain how an attribution model works',
        examples: ['explain time decay', 'what is first touch attribution', 'how does linear model work']
    },
    // --- Incrementality Commands ---
    {
        id: 'create_incrementality_test',
        name: 'Create Incrementality Test',
        category: 'ATTRIBUTION',
        patterns: [
            /(?:create|set\s+up|start|run)\s+(?:a\s+)?(?:new\s+)?(?:incrementality|lift|holdout)\s+test/i,
            /(?:create|set\s+up|start)\s+(?:a\s+)?(?:new\s+)?(?:incrementality|lift|holdout)\s+test\s+(?:for\s+)?(\w+)/i,
            /test\s+(?:the\s+)?(?:incrementality|lift)\s+(?:of|for)\s+(\w+)/i
        ],
        priority: 85,
        description: 'Create a new incrementality/lift test',
        examples: ['create incrementality test', 'set up holdout test for Search', 'test lift for Social']
    },
    {
        id: 'view_test_results',
        name: 'View Test Results',
        category: 'ATTRIBUTION',
        patterns: [
            /(?:show|view)\s+(?:me\s+)?(?:the\s+)?(?:incrementality|lift|test)\s+results/i,
            /how\s+did\s+(?:the\s+)?(\w+)\s+test\s+(?:perform|do|go)/i,
            /(?:what|what's)\s+(?:the\s+)?lift\s+(?:for|on)\s+(\w+)/i
        ],
        priority: 83,
        description: 'View incrementality test results',
        examples: ['show test results', 'how did the Search test perform', 'what is the lift for Social']
    },
    // --- Analysis Commands ---
    {
        id: 'analyze_channel_attribution',
        name: 'Analyze Channel Attribution',
        category: 'ATTRIBUTION',
        patterns: [
            /(?:how|what)\s+(?:is|are)\s+(\w+)\s+(?:performing|doing|attributed)/i,
            /(?:analyze|show)\s+(?:me\s+)?(\w+)\s+(?:attribution|performance|contribution)/i,
            /(?:which|what)\s+channel\s+(?:is\s+)?(?:the\s+)?(?:best|top)\s+(opener|closer|performer)/i,
            /(?:which|what)\s+channels?\s+(?:drives?|generates?)\s+(?:the\s+)?most\s+(?:conversions?|revenue)/i
        ],
        priority: 80,
        description: 'Analyze attribution for a specific channel',
        examples: ['how is Social performing', 'which channel is the best opener', 'what drives most conversions']
    },
    {
        id: 'show_conversion_paths',
        name: 'Show Conversion Paths',
        category: 'ATTRIBUTION',
        patterns: [
            /(?:show|view|display)\s+(?:me\s+)?(?:the\s+)?conversion\s+paths?/i,
            /(?:show|view)\s+(?:me\s+)?(?:the\s+)?(?:customer|user)\s+journey/i,
            /(?:what|what's)\s+(?:the\s+)?(?:typical|common|average)\s+(?:conversion\s+)?path/i,
            /how\s+do\s+(?:users?|customers?|people)\s+(?:typically\s+)?convert/i
        ],
        priority: 80,
        description: 'Show conversion path analysis',
        examples: ['show conversion paths', 'view customer journey', 'how do users typically convert']
    },
    {
        id: 'attribution_insights',
        name: 'Attribution Insights',
        category: 'ATTRIBUTION',
        patterns: [
            /(?:what|give\s+me)\s+(?:attribution\s+)?(?:insights|recommendations)/i,
            /(?:what\s+should\s+I|how\s+can\s+I)\s+(?:optimize|improve)\s+(?:based\s+on\s+)?attribution/i,
            /attribution\s+(?:insights|recommendations|suggestions)/i,
            /(?:analyze|review)\s+(?:my\s+)?attribution\s+(?:data|results)/i
        ],
        priority: 78,
        description: 'Get AI-driven attribution insights and recommendations',
        examples: ['give me attribution insights', 'what should I optimize', 'analyze my attribution data']
    },
    // --- Help Commands ---
    {
        id: 'explain_incrementality',
        name: 'Explain Incrementality',
        category: 'ATTRIBUTION',
        patterns: [
            /(?:explain|what\s+is|tell\s+me\s+about)\s+incrementality/i,
            /(?:explain|what\s+is|tell\s+me\s+about)\s+(?:lift|holdout)\s+test(?:ing)?/i,
            /how\s+(?:does|do)\s+(?:incrementality|lift)\s+test(?:s|ing)?\s+work/i,
            /(?:what's|what\s+is)\s+(?:a\s+)?(?:good|ideal)\s+(?:confidence|lift)\s+(?:score|level)/i
        ],
        priority: 75,
        description: 'Explain incrementality testing concepts',
        examples: ['explain incrementality', 'what is a holdout test', 'what is a good confidence score']
    },
    {
        id: 'attribution_help',
        name: 'Attribution Help',
        category: 'ATTRIBUTION',
        patterns: [
            /(?:help\s+(?:me\s+)?with|how\s+do\s+I\s+use)\s+attribution/i,
            /(?:what|how)\s+(?:can\s+I|do\s+I)\s+(?:do|use)\s+(?:in\s+)?attribution/i,
            /attribution\s+help/i
        ],
        priority: 70,
        description: 'Get help with attribution features',
        examples: ['help me with attribution', 'how do I use attribution', 'attribution help']
    }
];

// =============================================================================
// REGISTRY
// =============================================================================

/**
 * All commands in priority order
 */
export const ALL_COMMANDS: CommandDefinition[] = [
    ...LAYOUT_COMMANDS,
    ...HELP_COMMANDS,
    ...UNDO_REDO_COMMANDS,
    ...OPTIMIZATION_COMMANDS,
    ...FORECASTING_COMMANDS,
    ...GOAL_COMMANDS,
    ...TEMPLATE_COMMANDS,
    ...CREATIVE_COMMANDS,
    ...BUDGET_COMMANDS,
    ...CHANNEL_COMMANDS,
    ...PLACEMENT_COMMANDS,
    ...VIEW_COMMANDS,
    ...EXPORT_COMMANDS,
    ...INVENTORY_COMMANDS,
    ...NAVIGATION_COMMANDS,
    ...WINDOW_MANAGEMENT_COMMANDS,
    ...ATTRIBUTION_COMMANDS
].sort((a, b) => b.priority - a.priority);

/**
 * Get commands by category
 */
export function getCommandsByCategory(category: CommandCategory): CommandDefinition[] {
    return ALL_COMMANDS.filter(cmd => cmd.category === category);
}

/**
 * Find matching command for input
 */
export function findMatchingCommand(input: string): CommandMatch | null {
    for (const command of ALL_COMMANDS) {
        for (const pattern of command.patterns) {
            const match = input.match(pattern);
            if (match) {
                return {
                    command,
                    match,
                    confidence: 1.0 // Simple matching for now
                };
            }
        }
    }
    return null;
}

/**
 * Find all matching commands (for disambiguation)
 */
export function findAllMatchingCommands(input: string): CommandMatch[] {
    const matches: CommandMatch[] = [];

    for (const command of ALL_COMMANDS) {
        for (const pattern of command.patterns) {
            const match = input.match(pattern);
            if (match) {
                matches.push({
                    command,
                    match,
                    confidence: 1.0
                });
                break; // Only one match per command
            }
        }
    }

    return matches;
}

// =============================================================================
// CONTEXTUAL COMMAND ELIGIBILITY (Phase 2 - Agent + Canvas Integration)
// =============================================================================

/**
 * Window context for eligibility checks
 */
export interface CommandWindowContext {
    windowType: 'campaign' | 'flight' | 'portfolio' | 'report' | 'settings' | 'media-plan' | 'audience-insights' | 'chat' | 'client' | 'client-list' | 'attribution' | 'attribution-overview' | 'attribution-incrementality' | 'attribution-time' | 'attribution-frequency' | 'attribution-models' | null;
    hasMediaPlan: boolean;
    hasCampaign: boolean;
    hasFlight: boolean;
    hasWindows: boolean;     // Are there any open windows?
    activeWindowId?: string;
    // Attribution-specific context
    isAttributionOpen?: boolean;
    currentAttributionView?: 'OVERVIEW' | 'INCREMENTALITY' | 'TIME' | 'FREQUENCY' | 'ROI' | null;
    selectedAttributionModel?: string;
}

/**
 * Eligibility result with reason
 */
export interface EligibilityResult {
    eligible: boolean;
    reason?: string;
}

/**
 * Command context requirements mapping
 * Defines what context each command category requires
 */
const COMMAND_CONTEXT_REQUIREMENTS: Record<CommandCategory, {
    requiredWindowTypes?: string[];  // Empty means any window, undefined means no window needed
    requiresMediaPlan?: boolean;
    requiresCampaign?: boolean;
    requiresFlight?: boolean;
    requiresWindows?: boolean;       // Requires at least one window open
}> = {
    // Layout commands - always available
    'LAYOUT': {},

    // Navigation - always available
    'NAVIGATION': {},

    // Help - always available
    'HELP': {},

    // Campaign setup - requires a campaign context
    'CAMPAIGN_SETUP': { requiresCampaign: true },

    // Budget - requires media plan
    'BUDGET': { requiresMediaPlan: true },

    // Channel - requires media plan
    'CHANNEL': { requiresMediaPlan: true },

    // Placement - requires flight context (can only add placements in flight view)
    'PLACEMENT': { requiresFlight: true },

    // Optimization - requires media plan
    'OPTIMIZATION': { requiresMediaPlan: true },

    // Forecasting - requires media plan
    'FORECASTING': { requiresMediaPlan: true },

    // Goal - requires campaign
    'GOAL': { requiresCampaign: true },

    // Template - always available
    'TEMPLATE': {},

    // Creative - requires media plan
    'CREATIVE': { requiresMediaPlan: true },

    // Export - requires media plan
    'EXPORT': { requiresMediaPlan: true },

    // View - requires media plan
    'VIEW': { requiresMediaPlan: true },

    // Undo/Redo - always available
    'UNDO_REDO': {},

    // Inventory - always available
    'INVENTORY': {},

    // Window Management - mostly always available, some require windows
    'WINDOW_MANAGEMENT': {},

    // Attribution - requires campaign context for data, but navigation always available
    'ATTRIBUTION': { requiresCampaign: true }
};

/**
 * Window commands that require at least one window
 */
const WINDOW_COMMANDS_REQUIRING_WINDOWS = [
    'close_window',
    'minimize_window',
    'maximize_window',
    'restore_window',
    'tile_windows',
    'cascade_windows',
    'minimize_all',
    'restore_all',
    'close_all',
    'focus_window',
    'gather_windows',
    'pin_window',
    'unpin_window'
];

/**
 * Check if a command is eligible given the current window context
 */
export function isCommandEligible(
    command: CommandDefinition,
    context: CommandWindowContext
): EligibilityResult {
    const requirements = COMMAND_CONTEXT_REQUIREMENTS[command.category];

    // No requirements means always eligible
    if (!requirements) {
        return { eligible: true };
    }

    // Check media plan requirement
    if (requirements.requiresMediaPlan && !context.hasMediaPlan) {
        return {
            eligible: false,
            reason: 'This command requires an active media plan. Please create or select a campaign first.'
        };
    }

    // Check campaign requirement
    if (requirements.requiresCampaign && !context.hasCampaign) {
        return {
            eligible: false,
            reason: 'This command requires a campaign context. Please select or create a campaign.'
        };
    }

    // Check flight requirement
    if (requirements.requiresFlight && !context.hasFlight) {
        return {
            eligible: false,
            reason: 'This command requires a flight context. Please open a flight to manage placements.'
        };
    }

    // Check window-specific requirements
    if (requirements.requiredWindowTypes && requirements.requiredWindowTypes.length > 0) {
        if (!context.windowType || !requirements.requiredWindowTypes.includes(context.windowType)) {
            return {
                eligible: false,
                reason: `This command is only available in ${requirements.requiredWindowTypes.join(' or ')} windows.`
            };
        }
    }

    // Special handling for window management commands
    if (command.category === 'WINDOW_MANAGEMENT') {
        if (WINDOW_COMMANDS_REQUIRING_WINDOWS.includes(command.id) && !context.hasWindows) {
            return {
                eligible: false,
                reason: 'There are no windows open to manage.'
            };
        }
    }

    return { eligible: true };
}

/**
 * Find matching command with eligibility check
 * Returns the first eligible matching command, or null if none match
 */
export function findEligibleCommand(
    input: string,
    context: CommandWindowContext
): { match: CommandMatch; eligibility: EligibilityResult } | null {
    const matches = findAllMatchingCommands(input);

    for (const match of matches) {
        const eligibility = isCommandEligible(match.command, context);
        if (eligibility.eligible) {
            return { match, eligibility };
        }
    }

    // If no eligible matches, return the first match with its ineligibility reason
    if (matches.length > 0) {
        const eligibility = isCommandEligible(matches[0].command, context);
        return { match: matches[0], eligibility };
    }

    return null;
}
