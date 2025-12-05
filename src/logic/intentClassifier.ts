/**
 * Intent Classification System
 * 
 * Classifies user input into actionable intents with extracted entities.
 * Uses pattern matching for speed and simplicity.
 */

export enum IntentCategory {
    CAMPAIGN_SETUP = 'campaign_setup',
    AUDIENCE_TARGETING = 'audience_targeting',
    BUDGET_ALLOCATION = 'budget_allocation',
    PERFORMANCE_MONITORING = 'performance_monitoring',
    OPTIMIZATION = 'optimization',
    REPORTING = 'reporting',
    FORECASTING = 'forecasting',
    HELP = 'help',
    CREATIVE = 'creative',
    NAVIGATION = 'navigation',
    UNKNOWN = 'unknown'
}

export interface DetectedIntent {
    category: IntentCategory;
    subIntent: string;
    confidence: number;
    entities: Record<string, any>;
    requiresClarification: boolean;
    patterns: string[];
}

interface IntentPattern {
    category: IntentCategory;
    subIntent: string;
    patterns: RegExp[];
    entityExtractors?: ((input: string) => Record<string, any>)[];
}

/**
 * Intent patterns organized by category
 */
const INTENT_PATTERNS: IntentPattern[] = [
    // Campaign Setup
    {
        category: IntentCategory.CAMPAIGN_SETUP,
        subIntent: 'create_campaign',
        patterns: [
            /(?:create|start|launch|set up|build|make)\s+(?:a|an)?\s*(?:new)?\s*campaign/i,
            /i need (?:to )?(run|create|launch)\s+(?:a )?campaign/i,
            /(?:plan|setup) (?:a )?(?:q\d|campaign)/i,
            /campaign (?:for|targeting)/i  // Added to catch "campaign targeting..."
        ]
    },
    {
        category: IntentCategory.CAMPAIGN_SETUP,
        subIntent: 'clone_campaign',
        patterns: [
            /(?:clone|copy|duplicate)\s+(?:the )?\s*campaign/i,
            /similar to (?:what we ran|last|previous)/i,
            /same as .+ but/i
        ]
    },

    // Budget and Allocation
    {
        category: IntentCategory.BUDGET_ALLOCATION,
        subIntent: 'budget_inquiry',
        patterns: [
            /(?:how much|what.*budget|minimum.*spend|cost.*to)/i,
            /what.*(?:should i|can i) spend/i,
            /(?:budget|spend) (?:for|on)/i
        ]
    },
    {
        category: IntentCategory.BUDGET_ALLOCATION,
        subIntent: 'allocate_budget',
        patterns: [
            /(?:allocate|distribute|split|spread)\s+(?:\$?[\d,k]+\s+)?(?:budget|spend)/i,
            /how (?:should|do) i (?:allocate|split|distribute)/i,
            /\$[\d,k]+ across/i
        ]
    },

    // Audience Targeting
    {
        category: IntentCategory.AUDIENCE_TARGETING,
        subIntent: 'build_audience',
        patterns: [
            /(?:target|reach|find)\s+(?:people|users|audience)/i,
            /i want to (?:target|reach)/i,
            /audience (?:of|targeting)/i,
            /(?:build|create) (?:an )?audience/i,
            /targeting .+(?:with|,)/i  // Added to catch "targeting X with Y"
        ]
    },
    {
        category: IntentCategory.AUDIENCE_TARGETING,
        subIntent: 'audience_size',
        patterns: [
            /how (?:big|large) is (?:this|the|my) audience/i,
            /audience size/i,
            /how many people/i
        ]
    },

    // Performance Monitoring
    {
        category: IntentCategory.PERFORMANCE_MONITORING,
        subIntent: 'check_performance',
        patterns: [
            /how (?:is|are|did|does)\s+(?:the|my)?\s*(?:campaign|campaigns?)\s+(?:doing|performing)/i,
            /(?:show|tell me|what's)\s+(?:my|the)?\s*(?:performance|results)/i,
            /(?:campaign|performance) (?:metrics|stats|numbers)/i,
            /why is (?:my|the) campaign (?:under)?performing/i,  // Added for troubleshooting
            /campaign (?:is |isn't )?(?:under)?performing/i
        ]
    },
    {
        category: IntentCategory.PERFORMANCE_MONITORING,
        subIntent: 'check_pacing',
        patterns: [
            /(?:are we|am i)\s+on (?:pace|track)/i,
            /(?:pacing|spending) (?:on track|correctly)/i,
            /will (?:i|we) (?:hit|reach|meet)/i
        ]
    },

    // Optimization
    {
        category: IntentCategory.OPTIMIZATION,
        subIntent: 'improve_performance',
        patterns: [
            /(?:improve|optimize|increase|boost|enhance)/i,
            /(?:reduce|lower|decrease|cut)\s+(?:cpa|cpc|cost)/i,
            /make it (?:better|more efficient)/i,
            /what (?:should|can) i (?:do|change)/i,
            /(?:cpa|cpc|roas|ctr|cost) (?:is |are )?too (?:high|low)/i,  // Added for metric concerns
            /(?:the |my )?(?:cpa|cpc|roas) .+ what should/i
        ]
    },
    {
        category: IntentCategory.OPTIMIZATION,
        subIntent: 'budget_reallocation',
        patterns: [
            /(?:shift|move|reallocate|transfer)\s+budget/i,
            /(?:pause|stop) (?:the )?underperforming/i,
            /(?:add|give) more (?:budget|spend) to/i
        ]
    },

    // Forecasting
    {
        category: IntentCategory.FORECASTING,
        subIntent: 'predict_performance',
        patterns: [
            /(?:predict|forecast|estimate|expect|project)/i,
            /what (?:results|performance) (?:should|will|can) i (?:expect|get)/i,
            /how (?:many|much) (?:will|should)/i
        ]
    },
    {
        category: IntentCategory.FORECASTING,
        subIntent: 'reach_forecast',
        patterns: [
            /(?:how many people|reach)/i,
            /what (?:reach|audience size)/i
        ]
    },

    // Reporting
    {
        category: IntentCategory.REPORTING,
        subIntent: 'generate_report',
        patterns: [
            /(?:show|give|create|generate)\s+(?:me\s+)?(?:a\s+)?report/i,
            /(?:breakdown|summary) (?:of|for)/i,
            /(?:export|download) (?:the )?data/i
        ]
    },

    // Creative
    {
        category: IntentCategory.CREATIVE,
        subIntent: 'creative_performance',
        patterns: [
            /(?:which|what) creative (?:is|are) (?:performing|working)/i,
            /creative (?:performance|results|metrics)/i,
            /(?:swap|change|update|rotate)\s+creative/i
        ]
    },

    // Navigation
    {
        category: IntentCategory.NAVIGATION,
        subIntent: 'view_predictive_analytics',
        patterns: [
            /(?:show|view|open|display)\s+(?:me\s+)?(?:the\s+)?predictive\s+analytics/i,
            /(?:show|view|open)\s+(?:me\s+)?(?:the\s+)?predictions?/i,
            /(?:show|view|open)\s+(?:me\s+)?(?:the\s+)?insights?/i,
            /predictive\s+analytics?\s+(?:dashboard|view)/i,
            /(?:go to|navigate to)\s+predictive/i,
            /(?:show|view)\s+(?:me\s+)?(?:the\s+)?(?:ai\s+)?insights/i
        ]
    },
    {
        category: IntentCategory.NAVIGATION,
        subIntent: 'view_attribution',
        patterns: [
            /(?:show|view|open|display)\s+(?:me\s+)?(?:the\s+)?attribution/i,
            /attribution\s+(?:analysis|dashboard|view|model)/i,
            /(?:go to|navigate to)\s+attribution/i,
            /(?:show|view)\s+(?:me\s+)?(?:the\s+)?attribution\s+(?:data|results)/i
        ]
    },
    {
        category: IntentCategory.NAVIGATION,
        subIntent: 'view_portfolio',
        patterns: [
            /(?:show|view|open|display)\s+(?:me\s+)?(?:the\s+)?portfolio/i,
            /portfolio\s+(?:dashboard|view)/i,
            /(?:go to|navigate to)\s+portfolio/i,
            /(?:show|view)\s+(?:me\s+)?(?:the\s+)?portfolio\s+(?:data|analysis)/i
        ]
    },
    {
        category: IntentCategory.NAVIGATION,
        subIntent: 'view_integrations',
        patterns: [
            /(?:show|view|open|display)\s+(?:me\s+)?(?:the\s+)?integrations?/i,
            /integrations?\s+(?:dashboard|view)/i,
            /(?:go to|navigate to)\s+integrations?/i,
            /(?:show|view)\s+(?:me\s+)?(?:platform|system)\\s+integrations/i
        ]
    },
    {
        category: IntentCategory.NAVIGATION,
        subIntent: 'view_analytics',
        patterns: [
            /(?:show|view|open|display)\s+(?:me\s+)?(?:the\s+)?(?:agency\s+)?analytics/i,
            /analytics\s+(?:dashboard|view)/i,
            /(?:go to|navigate to)\s+analytics/i,
            /(?:show|view)\s+(?:me\s+)?(?:overall|agency)\s+analytics/i
        ]
    },

    // Help
    {
        category: IntentCategory.HELP,
        subIntent: 'explain_feature',
        patterns: [
            /how (?:does|do) .+ work/i,  // "how does X work"
            /(?:explain|tell me about) .+/i,
            /what (?:is|are) .+/i,
            /what's (?:the )?(?:difference|meaning)/i
        ]
    },
    {
        category: IntentCategory.HELP,
        subIntent: 'best_practice',
        patterns: [
            /best practice/i,
            /(?:should|recommended|typical)/i,
            /what's (?:the )?(?:right|optimal|best) (?:way|frequency|approach)/i,  // More specific
            /right .+ for/i  // "right X for Y"
        ]
    }
];

/**
 * Classify user input into an intent
 */
export function classifyIntent(input: string): DetectedIntent {
    const normalizedInput = input.trim().toLowerCase();

    let bestMatch: DetectedIntent | null = null;
    let highestConfidence = 0;

    for (const pattern of INTENT_PATTERNS) {
        let matchCount = 0;
        const matchedPatterns: string[] = [];

        for (const regex of pattern.patterns) {
            if (regex.test(normalizedInput)) {
                matchCount++;
                matchedPatterns.push(regex.source);
            }
        }

        if (matchCount > 0) {
            const confidence = matchCount / pattern.patterns.length;

            if (confidence > highestConfidence) {
                highestConfidence = confidence;

                // Extract entities if extractors are defined
                let entities: Record<string, any> = {};
                if (pattern.entityExtractors) {
                    for (const extractor of pattern.entityExtractors) {
                        entities = { ...entities, ...extractor(input) };
                    }
                }

                bestMatch = {
                    category: pattern.category,
                    subIntent: pattern.subIntent,
                    confidence,
                    entities,
                    requiresClarification: false,
                    patterns: matchedPatterns
                };
            }
        }
    }

    // If no match found, return unknown intent
    if (!bestMatch) {
        return {
            category: IntentCategory.UNKNOWN,
            subIntent: 'unknown',
            confidence: 0,
            entities: {},
            requiresClarification: true,
            patterns: []
        };
    }

    return bestMatch;
}

/**
 * Determine if an intent requires clarification
 */
export function requiresClarification(intent: DetectedIntent, context: any): boolean {
    // Low confidence intents need clarification
    if (intent.confidence < 0.5) {
        return true;
    }

    // Check if required entities are missing
    const requiredEntities = getRequiredEntities(intent.category, intent.subIntent);
    for (const entityKey of requiredEntities) {
        if (!intent.entities[entityKey] && !context[entityKey]) {
            return true;
        }
    }

    return false;
}

/**
 * Get required entities for an intent
 */
function getRequiredEntities(category: IntentCategory, subIntent: string): string[] {
    const entityMap: Record<string, string[]> = {
        'campaign_setup.create_campaign': ['objective', 'budget'],
        'budget_allocation.allocate_budget': ['totalBudget', 'channels'],
        'audience_targeting.build_audience': ['audience'],
        // Add more as needed
    };

    const key = `${category}.${subIntent}`;
    return entityMap[key] || [];
}
