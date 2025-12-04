/**
 * CommandRegistry - Centralized command pattern definitions
 *
 * This module defines all command patterns that the agent can recognize.
 * Commands are organized by category and include priority for disambiguation.
 */

import { AgentContext, CommandResult } from './AgentContext';

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
    | 'INVENTORY';

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
            /add\s+(search|social|display|tv|radio|ooh|print|espn|cbs|nbc|abc|fox|cnn|msnbc|hgtv|discovery|tlc|bravo|tnt|netflix|hulu|amazon|disney|hbo|apple|paramount|peacock|youtube|roku|tubi|pluto|f1|dazn|sling|nfl|nba|mlb|nhl)/i
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
    ...NAVIGATION_COMMANDS
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
