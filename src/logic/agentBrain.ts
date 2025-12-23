
import { MediaPlan, AgentMessage, Placement, Brand, AgentInfo, AgentExecution } from '../types';
import { generateCampaign, generateLine, calculatePlanMetrics, SAMPLE_AGENTS, generateId } from './dummyData';

// Unique message ID generator to prevent React key collisions
const generateMessageId = (prefix: string = 'msg') =>
    `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Enhanced Agent Intelligence Modules
import { classifyIntent } from './intentClassifier';
import { extractAllEntities, extractBudget, extractChannels } from './entityExtractor';
import { contextManager } from './contextManager';
import { recommendBudgetAllocation } from '../utils/budgetOptimizer';
import { actionHistory } from '../utils/actionHistory';

// Extracted modules for AgentBrain decomposition
import { channelManager } from './ChannelManager';
import { inventoryService } from './InventoryService';
import { goalManager, isGoalCommand } from './GoalManager';
import { templateManager, isTemplateCommand } from './TemplateManager';
import { creativeManager, isCreativeCommand } from './CreativeManager';
import { optimizationManager, isOptimizationCommand, PendingAction, executePauseUnderperformers, executeScaleWinners } from './OptimizationManager';
import { forecastManager, isForecastCommand } from './ForecastManager';
import { windowManager } from './WindowManager';
import { attributionManager } from './AttributionManager';
import { WindowContext } from './AgentContext';

// Re-export WindowContext for backwards compatibility
export type { WindowContext } from './AgentContext';

export type AgentState = 'INIT' | 'BUDGETING' | 'CHANNEL_SELECTION' | 'REFINEMENT' | 'OPTIMIZATION' | 'FINISHED';

// PendingActionType and PendingAction are now imported from OptimizationManager
// WindowContext is now imported from AgentContext

interface AgentContext {
    state: AgentState;
    mediaPlan: MediaPlan | null;
    brand?: Brand | null;
    history: AgentMessage[];
    agents: AgentInfo[];
    executions: AgentExecution[];
    pendingAction?: PendingAction;
    expressMode?: boolean; // If true, skip confirmation dialogs
    windowContext?: WindowContext; // Context from active window in windowed mode
}

export class AgentBrain {
    private context: AgentContext;
    private sessionId: string; // Session ID for context manager

    constructor() {
        this.sessionId = 'session-' + Date.now();
        this.context = {
            state: 'INIT',
            mediaPlan: null,
            agents: SAMPLE_AGENTS,
            executions: [],
            history: [{
                id: 'welcome',
                role: 'agent',
                content: "Welcome to FuseIQ by AdRoll. I'm your AI assistant. To get started, tell me the Client Name and Total Budget for your new campaign.",
                timestamp: Date.now(),
                suggestedActions: ['Create plan for Nike ($500k)', 'Create plan for Local Coffee Shop ($5k)']
            }]
        };
    }

    getContext(): AgentContext {
        return this.context;
    }

    setMediaPlan(plan: MediaPlan | null) {
        this.context.mediaPlan = plan;
    }

    setBrand(brand: Brand | null) {
        this.context.brand = brand;
    }

    setWindowContext(windowContext: WindowContext | undefined) {
        this.context.windowContext = windowContext;
        // Also update the contextManager focus
        if (windowContext) {
            contextManager.updateFocus(this.sessionId, {
                campaignId: windowContext.campaignId,
                flightId: windowContext.flightId
            });
        }
    }

    getWindowContext(): WindowContext | undefined {
        return this.context.windowContext;
    }

    processInput(input: string): AgentMessage {
        const userMsg: AgentMessage = {
            id: generateMessageId('user'),
            role: 'user',
            content: input,
            timestamp: Date.now()
        };
        this.context.history.push(userMsg);

        // ===== ENHANCED AGENT INTELLIGENCE =====
        // 1. Classify intent
        const intent = classifyIntent(input);

        // 2. Extract entities
        const entities = extractAllEntities(input);

        // 3. Add to context manager
        contextManager.addMessage(this.sessionId, 'user', input, intent, entities);

        let responseContent = '';
        let suggestedActions: string[] = [];
        let agentMsg: AgentMessage | null = null;

        // ===== PENDING ACTION CONFIRMATION HANDLING =====
        // Check if user is confirming or canceling a pending action
        if (this.context.pendingAction) {
            const confirmPatterns = /^(yes|confirm|apply|proceed|do it|go ahead|execute|ok|okay)$/i;
            const cancelPatterns = /^(no|cancel|nevermind|never mind|abort|stop|don't|dont)$/i;

            if (confirmPatterns.test(input.trim())) {
                // User confirmed - execute the pending action
                const action = this.context.pendingAction;
                this.context.pendingAction = undefined;
                return this.executePendingAction(action);
            } else if (cancelPatterns.test(input.trim())) {
                // User canceled
                this.context.pendingAction = undefined;
                const response = this.createAgentMessage(
                    "Action canceled. No changes were made.",
                    ['Show performance', 'Optimize']
                );
                this.context.history.push(response);
                contextManager.addMessage(this.sessionId, 'assistant', response.content);
                return response;
            }
            // If neither confirm nor cancel, clear the pending action and process normally
            this.context.pendingAction = undefined;
        }

        // GLOBAL: Layout Commands (work regardless of media plan state)
        // Enhanced pattern matching to handle typos and variations
        // Matches: "switch left", "swtich left", "change left", "move to left", etc.
        const layoutMatch = input.toLowerCase().match(/(?:sw[it]+ch|change|set|move|go)(?:\s+to)?\s+(left|right|bottom)/i);
        if (layoutMatch) {
            const position = layoutMatch[1].toUpperCase() as 'LEFT' | 'RIGHT' | 'BOTTOM';
            responseContent = "I've switched the layout to **" + layoutMatch[1] + "** position.";
            suggestedActions = ['Continue planning'];
            agentMsg = {
                id: generateMessageId('agent'),
                role: 'agent',
                content: responseContent,
                timestamp: Date.now(),
                suggestedActions,
                action: `LAYOUT_${position}` as any
            };
            this.context.history.push(agentMsg);
            contextManager.addMessage(this.sessionId, 'assistant', responseContent);
            return agentMsg;
        }

        // GLOBAL: Window Management Commands (work in windowed canvas mode)
        const windowCommandResult = windowManager.handleWindowCommand(input);
        if (windowCommandResult) {
            this.context.history.push(windowCommandResult);
            contextManager.addMessage(this.sessionId, 'assistant', windowCommandResult.content);
            return windowCommandResult;
        }

        // GLOBAL: Attribution Commands (work in windowed canvas mode with campaign context)
        const attributionCommandResult = attributionManager.handleAttributionCommand(input, {
            windowContext: this.context.windowContext,
            mediaPlan: this.context.mediaPlan,
            brand: this.context.brand
        });
        if (attributionCommandResult) {
            this.context.history.push(attributionCommandResult);
            contextManager.addMessage(this.sessionId, 'assistant', attributionCommandResult.content);
            return attributionCommandResult;
        }

        // GLOBAL: Navigation Commands (work regardless of media plan state)
        // Handle intent-based navigation to analytics dashboards
        if (intent.category === 'navigation') {
            let action: string | null = null;
            let message = '';
            let actions: string[] = [];

            switch (intent.subIntent) {
                case 'view_predictive_analytics':
                    if (!this.context.brand) {
                        message = "Please select a brand first to view predictive analytics.";
                        actions = [];
                    } else {
                        action = 'NAVIGATE_TO_PREDICTIVE_ANALYTICS';
                        message = "Opening Predictive Analytics dashboard...";
                        actions = [];
                    }
                    break;

                case 'view_attribution':
                    // Attribution requires a campaign context
                    message = "To view attribution analysis, please select a campaign from the flight list.";
                    actions = ['Select a campaign'];
                    break;

                case 'view_portfolio':
                    if (!this.context.brand) {
                        message = "Please select a brand first to view the portfolio.";
                        actions = [];
                    } else {
                        action = 'NAVIGATE_TO_PORTFOLIO';
                        message = "Opening Portfolio dashboard...";
                        actions = [];
                    }
                    break;

                case 'view_integrations':
                    action = 'NAVIGATE_TO_INTEGRATIONS';
                    message = "Opening Integrations dashboard...";
                    actions = [];
                    break;

                case 'view_analytics':
                    action = 'NAVIGATE_TO_ANALYTICS';
                    message = "Opening Agency Analytics dashboard...";
                    actions = [];
                    break;
            }

            if (message) {
                agentMsg = this.createAgentMessage(message, actions, action as any);
                this.context.history.push(agentMsg);
                contextManager.addMessage(this.sessionId, 'assistant', message);
                return agentMsg;
            }
        }


        // 1. GLOBAL COMMANDS (Available whenever a plan exists)
        if (this.context.mediaPlan) {
            agentMsg = this.handleGlobalCommands(input);
            if (agentMsg) {
                this.context.history.push(agentMsg);
                contextManager.addMessage(this.sessionId, 'assistant', agentMsg.content);
                return agentMsg;
            }
        }

        // =================================================================
        // DELEGATED COMMAND HANDLERS (Extracted to separate managers)
        // =================================================================
        const lowerInput = input.toLowerCase();

        // Goal Commands (via GoalManager)
        if (isGoalCommand(input)) {
            console.log('[AgentBrain] Matched: Goal command (via GoalManager)');
            try {
                const result = goalManager.handleGoalCommand(input, this.context as any);
                if (result.handled && result.response) {
                    this.context.history.push(result.response);
                    contextManager.addMessage(this.sessionId, 'assistant', result.response.content);
                    return result.response;
                }
            } catch (e: any) {
                console.error("Error in goal logic:", e);
                const response = this.createAgentMessage(
                    "I encountered an error while processing your goal command: " + (e.message || String(e)),
                    ['Show goals']
                );
                this.context.history.push(response);
                return response;
            }
        }

        // Template Commands (via TemplateManager)
        if (isTemplateCommand(input)) {
            console.log('[AgentBrain] Matched: Template command (via TemplateManager)');
            try {
                const result = templateManager.handleTemplateCommand(input, this.context as any);
                if (result.handled && result.response) {
                    this.context.history.push(result.response);
                    contextManager.addMessage(this.sessionId, 'assistant', result.response.content);
                    return result.response;
                }
            } catch (e: any) {
                console.error("Error in template logic:", e);
                const response = this.createAgentMessage(
                    "I encountered an error while processing template commands: " + (e.message || String(e)),
                    ['Show campaigns']
                );
                this.context.history.push(response);
                return response;
            }
        }

        // Creative Commands (via CreativeManager)
        if (isCreativeCommand(input)) {
            console.log('[AgentBrain] Matched: Creative command (via CreativeManager)');
            try {
                const result = creativeManager.handleCreativeCommand(input, this.context as any);
                if (result.handled && result.response) {
                    this.context.history.push(result.response);
                    contextManager.addMessage(this.sessionId, 'assistant', result.response.content);
                    return result.response;
                }
            } catch (e: any) {
                console.error("Error in creative logic:", e);
                return this.createAgentMessage(
                    "I encountered an error managing creatives.",
                    []
                );
            }
        }

        // 2. STATE-SPECIFIC LOGIC
        switch (this.context.state) {
            case 'INIT':
                // SAFEGUARD: If a media plan already exists, don't accidentally create a new one
                // unless the user explicitly says "new campaign" or "create campaign"
                if (this.context.mediaPlan &&
                    !lowerInput.includes('new campaign') &&
                    !lowerInput.includes('create campaign') &&
                    !lowerInput.includes('start over') &&
                    !lowerInput.includes('reset')) {

                    // Check if this looks like an accidental trigger (has numbers but unclear intent)
                    const hasNumbers = /\d/.test(input);
                    if (hasNumbers) {
                        return this.createAgentMessage(
                            "⚠️ **Wait!** You already have an active campaign.\n\n" +
                            "Did you mean to:\n" +
                            "• Modify the existing campaign?\n" +
                            "• Create a brand new campaign? (say 'create new campaign')\n\n" +
                            "I want to make sure I don't accidentally overwrite your work!",
                            ['Continue with existing campaign', 'Create new campaign']
                        );
                    }

                    // If no numbers, treat as unclear command
                    return this.createAgentMessage(
                        "I'm not sure what you'd like me to do. You have an active campaign.\n\n" +
                        "Try commands like:\n" +
                        "• 'Add TV placement'\n" +
                        "• 'Show goals'\n" +
                        "• 'Optimize my plan'\n" +
                        "• 'Create new campaign' (to start fresh)",
                        ['Show goals', 'Add placement', 'Optimize plan']
                    );
                }

                // Improved parsing for k/m/mm suffixes
                const budgetMatch = input.match(/\$?(\d+(?:,\d{3})*(?:\.\d+)?)\s*([kK]|[mM]{1,2})?/);
                let budget = 100000;
                let clientName = 'Client';

                if (budgetMatch) {
                    const rawValue = parseFloat(budgetMatch[1].replace(/,/g, ''));
                    const suffix = (budgetMatch[2] || '').toLowerCase();

                    if (suffix.startsWith('m')) {
                        budget = rawValue * 1000000;
                    } else if (suffix.startsWith('k')) {
                        budget = rawValue * 1000;
                    } else {
                        budget = rawValue;
                    }
                }

                // Extract client name
                const clientMatch = input.match(/for\s+(.+?)(?:\s+\$|\s+\d|$)/i);
                if (clientMatch) {
                    clientName = clientMatch[1];
                } else {
                    clientName = input.split(' ')[3] || 'Client';
                }

                // Create a temporary brand for this session
                const tempBrand: Brand = {
                    id: generateId(),
                    name: clientName,
                    logoUrl: `https://ui-avatars.com/api/?name=${clientName}&background=random`,
                    agencyId: 'temp_agency',
                    budget: budget,
                    totalSpend: 0,
                    activeCampaigns: 1,
                    campaigns: []
                };

                const newCampaign = generateCampaign(tempBrand);
                // Override budget with user input if different from default logic
                newCampaign.budget = budget;


                this.context.mediaPlan = {
                    id: generateId(),
                    campaign: newCampaign,
                    totalSpend: 0,
                    remainingBudget: budget,
                    version: 1,
                    groupingMode: 'DETAILED',
                    activeFlightId: newCampaign.flights[0].id, // Default to first flight
                    metrics: { impressions: 0, reach: 0, frequency: 0, cpm: 0, eCpm: 0, dataCpm: 0 } // Initialize metrics
                };

                // Ensure placements are populated for legacy view
                this.context.mediaPlan.campaign.placements = [];

                this.context.state = 'BUDGETING';
                responseContent = `Great! I've initialized a campaign for **${clientName}** with a budget of **$${budget.toLocaleString()}**. \n\nHow would you like to allocate this budget across channels? I recommend a 70/20/10 split for balanced growth.`;
                suggestedActions = ['Apply 70/20/10 Rule', 'Focus on Digital Only', 'Focus on Brand Awareness (TV/OOH)'];
                break;

            case 'BUDGETING':
                let strategySelected = false;
                if (input.toLowerCase().includes('70/20/10')) {
                    this.context.mediaPlan!.strategy = 'BALANCED';
                    strategySelected = true;
                } else if (input.toLowerCase().includes('digital')) {
                    this.context.mediaPlan!.strategy = 'DIGITAL';
                    strategySelected = true;
                } else if (input.toLowerCase().includes('awareness') || input.toLowerCase().includes('tv') || input.toLowerCase().includes('ooh')) {
                    this.context.mediaPlan!.strategy = 'AWARENESS';
                    strategySelected = true;
                }

                // If strategy selected OR user explicitly asks to generate/show plan
                if (strategySelected || input.toLowerCase().includes('generate') || input.toLowerCase().includes('show') || input.toLowerCase().includes('yes') || input.toLowerCase().includes('create')) {
                    if (!this.context.mediaPlan!.strategy) this.context.mediaPlan!.strategy = 'BALANCED';

                    this.generatePlacements();
                    responseContent = `I've generated a **${this.context.mediaPlan?.strategy}** media plan with ${this.context.mediaPlan?.campaign.placements?.length || 0} placements.\n\nI've optimized the channel mix for your strategy. How does it look?`;
                    suggestedActions = ['Optimize for Reach', 'Optimize for Conversions', 'Looks good'];
                    this.context.state = 'REFINEMENT';
                } else {
                    this.context.mediaPlan!.strategy = 'BALANCED';
                    responseContent = "I'll draft a Balanced plan. Ready to see the placements?";
                    suggestedActions = ['Show me the plan'];
                }

                agentMsg = {
                    id: generateMessageId('agent'),
                    role: 'agent',
                    content: responseContent,
                    timestamp: Date.now(),
                    suggestedActions,
                    agentsInvoked: ['Insights Agent', 'Yield Agent']
                };
                this.context.history.push(agentMsg);
                return agentMsg;

            case 'CHANNEL_SELECTION':
                this.generatePlacements();
                responseContent = `I've generated a **${this.context.mediaPlan?.strategy}** media plan with ${this.context.mediaPlan?.campaign.placements?.length || 0} placements.\n\nI've optimized the channel mix for your strategy. How does it look?`;
                suggestedActions = ['Optimize for Reach', 'Optimize for Conversions', 'Looks good'];
                this.context.state = 'REFINEMENT';

                agentMsg = this.createAgentMessage(responseContent, suggestedActions);
                agentMsg.agentsInvoked = ['Insights Agent', 'Performance Agent', 'Yield Agent'];
                this.context.history.push(agentMsg);
                return agentMsg;

            case 'REFINEMENT':
            case 'OPTIMIZATION':
                responseContent = "I'm listening. You can ask me to **Add channels**, **Change budget**, **Optimize performance**, or **Export**.";
                suggestedActions = ['Add TV', 'Set budget to $1M', 'Show Performance', 'Export PDF'];
                break;

            case 'FINISHED':
                this.context.state = 'INIT';
                responseContent = "Starting a new session. Who is the client?";
                suggestedActions = ['Create plan for Nike ($500k)'];
                break;
        }

        agentMsg = {
            id: generateMessageId('agent'),
            role: 'agent',
            content: responseContent,
            timestamp: Date.now(),
            suggestedActions
        };

        this.context.history.push(agentMsg);
        return agentMsg;
    }

    private handleGlobalCommands(input: string): AgentMessage | null {
        const lowerInput = input.toLowerCase();
        let responseContent = '';
        let suggestedActions: string[] = [];

        // Log user input for pattern analysis
        console.log('[AgentBrain] User Input:', {
            timestamp: new Date().toISOString(),
            input: input,
            lowerInput: lowerInput,
            length: input.length,
            hasNumbers: /\d/.test(input),
            hasDollarSign: /\$/.test(input)
        });

        // Handle conversational help/suggestions requests
        // Triggers: "help", "suggestions", "what can you do", "help me"
        if (lowerInput === 'help' || lowerInput.includes('suggestion') || lowerInput.includes('what can') || (lowerInput.includes('help') && lowerInput.includes('me'))) {
            console.log('[AgentBrain] Matched: Help/Suggestions query');
            return this.provideSuggestions();
        }

        // =================================================================
        // UNDO/REDO COMMANDS (NEW - Phase 4)
        // =================================================================
        // Patterns: "undo", "undo last 3", "undo add NFL", "show history"
        if (lowerInput.includes('undo') || lowerInput.includes('revert') || lowerInput.includes('go back')) {
            console.log('[AgentBrain] Matched: Undo command');

            // Check for count-based undo: "undo last 3"
            const countMatch = input.match(/undo.*last\s+(\d+)/i);
            if (countMatch) {
                const count = parseInt(countMatch[1]);
                const actions = actionHistory.getLastNActions(count);

                if (actions.length === 0) {
                    return this.createAgentMessage(
                        "No recent actions to undo.",
                        []
                    );
                }

                // Mark actions as undone
                actions.forEach(a => actionHistory.markAsUndone(a.id));

                return this.createAgentMessage(
                    `⏮️ Undid last ${actions.length} action(s):\\n` +
                    actions.map((a: any) => `• ${a.description}`).join('\\n') +
                    '\\n\\n💡 **Note**: Undo tracking is active. Changes will take effect when you refresh.',
                    ['Show history']
                );
            }

            // Check for keyword-based undo: "undo add NFL"
            const keywordMatch = input.match(/undo\s+(.+)/i);
            if (keywordMatch && keywordMatch[1] !== 'last') {
                const keyword = keywordMatch[1].trim();
                const action = actionHistory.findLastActionByKeyword(keyword);

                if (action) {
                    actionHistory.markAsUndone(action.id);
                    return this.createAgentMessage(
                        `⏮️ Undid: **${action.description}**\\n\\n💡 **Note**: Undo tracking is active. Changes will take effect when you refresh.`,
                        ['Show history']
                    );
                } else {
                    return this.createAgentMessage(
                        `I couldn't find an action matching "${keyword}". Try "show history" to see recent actions.`,
                        ['Show history']
                    );
                }
            }

            // Simple undo - undo last action
            const lastAction = actionHistory.getLastAction();
            if (lastAction) {
                actionHistory.markAsUndone(lastAction.id);
                return this.createAgentMessage(
                    `⏮️ Undid: **${lastAction.description}**\\n\\n💡 **Note**: Undo tracking is active. Changes will take effect when you refresh.`,
                    ['Show history']
                );
            } else {
                return this.createAgentMessage(
                    "Nothing to undo - no recent actions found.",
                    []
                );
            }
        }

        // Redo command
        if (lowerInput.includes('redo')) {
            console.log('[AgentBrain] Matched: Redo command');

            const lastUndone = actionHistory.getLastUndoneAction();
            if (lastUndone) {
                actionHistory.markAsRedone(lastUndone.id);
                return this.createAgentMessage(
                    `⏭️ Redid: **${lastUndone.description}**\\n\\n💡 **Note**: Redo tracking is active. Changes will take effect when you refresh.`,
                    ['Show history']
                );
            } else {
                return this.createAgentMessage(
                    "Nothing to redo.",
                    []
                );
            }
        }

        // Show action history
        if (lowerInput.includes('show history') || lowerInput.includes('action history') || lowerInput.includes('recent actions')) {
            console.log('[AgentBrain] Matched: Show history query');

            const recent = actionHistory.getRecentActions(10);
            if (recent.length === 0) {
                return this.createAgentMessage(
                    "No recent actions to show.",
                    []
                );
            }

            let responseContent = `**📜 Recent Actions:**\\n\\n`;
            recent.forEach((action: any, idx: number) => {
                const canUndo = action.canUndo ? '✓' : '✗';
                responseContent += `${idx + 1}. [${canUndo}] ${action.description}\\n`;
            });
            responseContent += `\\n💡 Use "undo" to revert the last action.`;

            return this.createAgentMessage(
                responseContent,
                ['Undo last action']
            );
        }

        // =================================================================
        // OPTIMIZATION COMMANDS (via OptimizationManager)
        // =================================================================
        if (isOptimizationCommand(lowerInput)) {
            console.log('[AgentBrain] Matched: Optimization command (via OptimizationManager)');
            const result = optimizationManager.handleOptimizationCommand(input, this.context as any, this.context.expressMode);
            if (result.handled && result.response) {
                // Store pending action if returned
                if (result.pendingAction) {
                    this.context.pendingAction = result.pendingAction;
                }
                return result.response;
            }
        }

        // =================================================================
        // FORECASTING COMMANDS (via ForecastManager)
        // =================================================================
        if (isForecastCommand(lowerInput)) {
            console.log('[AgentBrain] Matched: Forecast command (via ForecastManager)');
            const result = forecastManager.handleForecastCommand(input, this.context as any);
            if (result.handled && result.response) {
                return result.response;
            }
        }

        // Handle inventory questions (delegated to InventoryService)
        // Triggers: "what available", "what avail", "what inventory"
        // Inventory queries: "what is available", "what DOOH is in NYC", "what sports shows..."
        if (lowerInput.includes('what') && (
            lowerInput.includes('available') ||
            lowerInput.includes('avail') ||
            lowerInput.includes('inventory') ||
            (lowerInput.includes('dooh') && lowerInput.includes(' in ')) ||
            (lowerInput.includes('ooh') && lowerInput.includes(' in '))
        )) {
            // Check for DMA/Broadcast specific queries first
            // e.g. "what channels are avail in Des Moines", "broadcast stations in Dallas"
            if (lowerInput.includes('channel') || lowerInput.includes('station') || lowerInput.includes('broadcast') || lowerInput.includes('tv')) {
                const dmaMatch = inventoryService.handleDMAQuery(input);
                if (dmaMatch) {
                    console.log('[AgentBrain] Matched: DMA Broadcast query (via InventoryService)');
                    return dmaMatch;
                }
            }

            console.log('[AgentBrain] Matched: Inventory query (via InventoryService)');
            return inventoryService.handleInventoryQuery(input);
        }

        // Handle Forecast/Delivery questions
        // Triggers: "how is the plan pacing", "what is the forecast", "delivery status"
        if (lowerInput.includes('forecast') || lowerInput.includes('delivery') || lowerInput.includes('pacing') || lowerInput.includes('performance')) {
            console.log('[AgentBrain] Matched: Forecast/Delivery query');
            const plan = this.context.mediaPlan;
            if (!plan) {
                return this.createAgentMessage("I can't show you the forecast yet because we haven't created a plan. Shall we start by defining a budget?", []);
            }

            const forecast = plan.campaign.forecast;
            const delivery = plan.campaign.delivery;

            if (!forecast || !delivery) {
                return this.createAgentMessage("I don't have forecast data for this plan yet. Try generating placements first.", []);
            }

            return this.createAgentMessage(
                `**📊 Plan Performance & Forecast:**\n\n` +
                `**Delivery Status:** ${delivery.status.replace('_', ' ')} (${delivery.pacing}% Pacing)\n` +
                `**Impressions:** ${(delivery.actualImpressions || 0).toLocaleString()} delivered / ${(forecast.impressions || 0).toLocaleString()} forecasted\n` +
                `**Spend:** $${(delivery.actualSpend || 0).toLocaleString()} spent / $${(forecast.spend || 0).toLocaleString()} planned\n\n` +
                `**Forecast Source:** ${forecast.source}\n` +
                `**Est. Reach:** ${(forecast.reach || 0).toLocaleString()} unique users`,
                ['Show detailed performance', 'Optimize under-pacing lines']
            );
        }

        // =================================================================
        // BUDGET ALLOCATION RECOMMENDATIONS (NEW - Phase 4)
        // =================================================================
        // Patterns: "allocate $50k", "how should I allocate", "split budget", "distribute $X"
        const budgetAllocMatch = lowerInput.match(/(?:allocate|split|distribute|spread).*(?:\$?([\d,]+(?:k|m)?)|budget)/i);

        if (budgetAllocMatch && (lowerInput.includes('allocate') || lowerInput.includes('split') || lowerInput.includes('distribute') || lowerInput.includes('spread'))) {
            console.log('[AgentBrain] Matched: Budget allocation query');

            // Extract budget from input or use campaign budget
            const budgetStr = budgetAllocMatch[1];
            let budget = this.context.mediaPlan?.campaign.budget || 100000;

            if (budgetStr) {
                const extractedBudget = extractBudget(input);
                if (extractedBudget) {
                    budget = extractedBudget;
                }
            }

            // Detect objective from context or default to 'awareness'
            let objective: 'awareness' | 'consideration' | 'conversion' = 'awareness';
            if (lowerInput.includes('conversion') || lowerInput.includes('sales') || lowerInput.includes('purchase')) {
                objective = 'conversion';
            } else if (lowerInput.includes('consideration') || lowerInput.includes('engagement')) {
                objective = 'consideration';
            }

            // Extract requested channels if specified
            const channels = extractChannels(input);

            // Get recommendation
            const recommendation = recommendBudgetAllocation(
                budget,
                objective,
                channels.length > 0 ? channels : undefined
            );

            // Format response
            let responseContent = `**💰 Smart Budget Allocation for ${objective.charAt(0).toUpperCase() + objective.slice(1)}**\n\n`;
            responseContent += `Total Budget: **$${(budget / 1000).toFixed(0)}k**\n\n`;

            recommendation.channels.forEach((ch, idx) => {
                const emoji = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '•';
                responseContent += `${emoji} **${ch.channel}**: $${(ch.allocatedBudget / 1000).toFixed(1)}k (${ch.percentage.toFixed(0)}%)\n`;
                responseContent += `   ${ch.reasoning}\n`;
                if (ch.expectedROAS) {
                    responseContent += `   Expected ROAS: ${ch.expectedROAS.toFixed(2)}x\n`;
                }
                responseContent += `\n`;
            });

            if (recommendation.assumptions.length > 0) {
                responseContent += `**Assumptions:**\n`;
                recommendation.assumptions.forEach(a => {
                    responseContent += `• ${a}\n`;
                });
            }

            // Actually create placements based on the allocation
            const plan = this.context.mediaPlan;
            if (plan) {
                if (!plan.campaign.placements) {
                    plan.campaign.placements = [];
                }
                const placements = plan.campaign.placements;

                let addedCount = 0;
                recommendation.channels.forEach(ch => {
                    // Create a placement for each recommended channel
                    const p = generateLine(
                        ch.channel as any,
                        plan.campaign.advertiser,
                        ch.channel, // vendor name
                        undefined
                    );

                    // Set the allocated budget
                    p.totalCost = ch.allocatedBudget;
                    if (p.costMethod === 'CPM' && p.rate > 0) {
                        p.quantity = Math.floor((ch.allocatedBudget * 1000) / p.rate);
                    } else if (p.rate > 0) {
                        p.quantity = Math.floor(ch.allocatedBudget / p.rate);
                    }

                    // Update forecast based on budget
                    if (p.forecast) {
                        p.forecast.impressions = Math.floor(ch.allocatedBudget * 100); // Estimate
                        p.forecast.spend = ch.allocatedBudget;
                    }

                    placements.push(p);
                    addedCount++;
                });

                // Update plan totals
                plan.totalSpend = placements.reduce((acc, p) => acc + p.totalCost, 0);
                plan.remainingBudget = plan.campaign.budget - plan.totalSpend;
                plan.metrics = calculatePlanMetrics(placements);

                responseContent += `\n**${addedCount} placements added to your plan.**\nTotal spend: $${plan.totalSpend.toLocaleString()}`;
            }

            const suggestedActions = ['Optimize', 'Show plan', 'Export PDF'];

            return this.createAgentMessage(responseContent, suggestedActions);
        }

        // Handle Forecast/Delivery questions (moved down to not conflict)
        if (false) {  // Disabled - handled above
        }

        // Handle Creation Commands
        // Triggers: "create campaign [name]", "new campaign [name]"
        const createCampaignMatch = input.match(/(?:create|new|add)\s+campaign\s+(?:for\s+)?(.+)/i);
        if (createCampaignMatch) {
            const campaignName = createCampaignMatch[1].trim();
            console.log('[AgentBrain] Matched: Create Campaign', campaignName);

            return {
                id: generateMessageId('agent'),
                role: 'agent',
                content: `I'm creating a new campaign called "**${campaignName}**".`,
                timestamp: Date.now(),
                suggestedActions: ['Create flight for Q1', 'Set budget to $100k'],
                action: { type: 'CREATE_CAMPAIGN', payload: { name: campaignName } } as any
            };
        }

        // Triggers: "create flight [name]", "new flight [name]"
        const createFlightMatch = input.match(/(?:create|new|add)\s+flight\s+(?:for\s+)?(.+)/i);
        if (createFlightMatch) {
            const flightName = createFlightMatch[1].trim();
            console.log('[AgentBrain] Matched: Create Flight', flightName);

            return {
                id: generateMessageId('agent'),
                role: 'agent',
                content: `I'm creating a new flight called "**${flightName}**".`,
                timestamp: Date.now(),
                suggestedActions: ['Add TV placement', 'Set flight budget'],
                action: { type: 'CREATE_FLIGHT', payload: { name: flightName } } as any
            };
        }

        // =================================================================
        // BATCH PLACEMENT GENERATION (Delegated to ChannelManager)
        // =================================================================
        // Pattern: "add 5 social placements", "create 3 TV spots on ESPN"
        const batchResult = channelManager.addBatchPlacements(input, this.context as any);
        if (batchResult) {
            console.log('[AgentBrain] Matched: Batch placement (via ChannelManager)');
            contextManager.addMessage(this.sessionId, 'assistant', batchResult.content);
            return batchResult;
        }

        // =================================================================
        // SINGLE PLACEMENT (Delegated to ChannelManager)
        // =================================================================
        // Try single channel/network placement first
        const singleResult = channelManager.addSinglePlacement(input, this.context as any);
        if (singleResult) {
            console.log('[AgentBrain] Matched: Single placement (via ChannelManager)');
            return singleResult;
        }

        // Try show name without network (catch-all for "add SportsCenter")
        const showResult = channelManager.addShowByName(input, this.context as any);
        if (showResult) {
            console.log('[AgentBrain] Matched: Show by name (via ChannelManager)');
            return showResult;
        }

        // =================================================================
        // BUDGET, DATES, PAUSE/RESUME (Delegated to ChannelManager)
        // =================================================================

        // 2. Change Budget
        const budgetResult = channelManager.changeBudget(input, this.context as any);
        if (budgetResult) {
            console.log('[AgentBrain] Matched: Change budget (via ChannelManager)');
            return budgetResult;
        }

        // 3. Change Dates
        const datesResult = channelManager.changeDates(input, this.context as any);
        if (datesResult) {
            console.log('[AgentBrain] Matched: Change dates (via ChannelManager)');
            return datesResult;
        }

        // 4. Pause Specific Items (by row or name)
        const pauseResult = channelManager.pausePlacement(input, this.context as any);
        if (pauseResult) {
            console.log('[AgentBrain] Matched: Pause placement (via ChannelManager)');
            return pauseResult;
        }

        // 4b. Resume/Unpause Specific Items (by row or name)
        const resumeResult = channelManager.resumePlacement(input, this.context as any);
        if (resumeResult) {
            console.log('[AgentBrain] Matched: Resume placement (via ChannelManager)');
            return resumeResult;
        }

        // Legacy fallback for complex resume logic (will be refactored)
        const resumeRowMatch = lowerInput.match(/(?:resume|unpause)\s+(?:row\s+)?(\d+)/i);
        const resumeNameMatch = lowerInput.match(/(?:resume|unpause)\s+(.+?)(?:\s+and|\s*$)/i);

        if ((lowerInput.includes('resume') || lowerInput.includes('unpause')) && (resumeRowMatch || resumeNameMatch)) {
            let resumedCount = 0;
            let resumedItems: string[] = [];

            if (resumeRowMatch) {
                // Resume by row number
                const rowNum = parseInt(resumeRowMatch[1]);
                if (this.context.mediaPlan!.campaign.placements && rowNum > 0 && rowNum <= this.context.mediaPlan!.campaign.placements.length) {
                    const placement = this.context.mediaPlan!.campaign.placements[rowNum - 1];
                    if (placement.performance && placement.performance.status === 'PAUSED') {
                        placement.performance.status = 'ACTIVE';
                        resumedItems.push(`Row #${rowNum} (${placement.vendor})`);
                        resumedCount++;
                    }
                }
            } else if (resumeNameMatch) {
                // Resume by name/vendor
                const searchTerm = resumeNameMatch[1].toLowerCase().trim();
                this.context.mediaPlan!.campaign.placements?.forEach((p) => {
                    if (p.vendor?.toLowerCase().includes(searchTerm) || p.name?.toLowerCase().includes(searchTerm)) {
                        if (p.performance && p.performance.status === 'PAUSED') {
                            p.performance.status = 'ACTIVE';
                            resumedItems.push(`${p.vendor || p.name}`);
                            resumedCount++;
                        }
                    }
                });
            }

            if (resumedCount > 0) {
                responseContent = `I've resumed ${resumedCount} placement(s): ${resumedItems.join(', ')}.`;
                suggestedActions = ['Optimize for Reach', 'Export PDF'];
                return this.createAgentMessage(responseContent, suggestedActions);
            } else {
                responseContent = "I couldn't find any paused placements matching that criteria to resume.";
                suggestedActions = ['Show Details'];
                return this.createAgentMessage(responseContent, suggestedActions);
            }
        }

        // 5. Optimization / Performance
        if (lowerInput.includes('performance') || lowerInput.includes('optimize') || lowerInput.includes('pause') || lowerInput.includes('boost')) {
            this.context.state = 'OPTIMIZATION';

            if (lowerInput.includes('pause')) {
                let pausedCount = 0;
                this.context.mediaPlan!.campaign.placements?.forEach(p => {
                    if (p.performance && p.performance.roas < 2.0) {
                        p.performance.status = 'PAUSED';
                        pausedCount++;
                    }
                });
                // Recalculate metrics after pausing (optional, but good practice if we filter active)
                // For now, metrics include everything, but we could filter.

                responseContent = `I've paused ${pausedCount} placements that were underperforming (ROAS < 2.0).`;
                suggestedActions = ['Shift budget to Search', 'Export PDF'];

                const msg = this.createAgentMessage(responseContent, suggestedActions);
                msg.agentsInvoked = ['Performance Agent', 'Insights Agent'];
                return msg;
            } else if (lowerInput.includes('shift') || lowerInput.includes('boost')) {
                const searchPlacements = this.context.mediaPlan!.campaign.placements?.filter(p => p.channel === 'Search') || [];
                searchPlacements.forEach(p => {
                    p.quantity = Math.floor(p.quantity * 1.2);
                    p.totalCost = p.quantity * p.rate;
                    if (p.performance) {
                        p.performance.impressions = Math.floor(p.performance.impressions * 1.2);
                        p.performance.clicks = Math.floor(p.performance.clicks * 1.2);
                        p.performance.conversions = Math.floor(p.performance.conversions * 1.2);
                    }
                });
                this.context.mediaPlan!.totalSpend = this.context.mediaPlan!.campaign.placements?.reduce((acc, p) => acc + p.totalCost, 0) || 0;
                this.context.mediaPlan!.remainingBudget = this.context.mediaPlan!.campaign.budget - this.context.mediaPlan!.totalSpend;

                // Recalculate metrics
                this.context.mediaPlan!.metrics = calculatePlanMetrics(this.context.mediaPlan!.campaign.placements || []);

                responseContent = "I've increased the budget for Search placements by 20%.";
                suggestedActions = ['Export PDF', 'Start New Campaign'];
            } else {
                responseContent = "I've analyzed the performance data. \n\n**Insights:**\n- **Search** is performing best (High ROAS).\n- **Display** has a low CTR.\n\nWould you like me to pause underperforming ads or shift budget to Search?";
                suggestedActions = ['Pause underperformers', 'Shift budget to Search'];
            }
            return this.createAgentMessage(responseContent, suggestedActions);
        }

        // 8. Layout Commands
        const layoutMatch = lowerInput.match(/(?:switch to|change to|set layout to|layout)\s+(left|right|bottom)/i);
        if (layoutMatch) {
            const position = layoutMatch[1].toUpperCase() as 'LEFT' | 'RIGHT' | 'BOTTOM';
            responseContent = `I've switched the layout to **${layoutMatch[1]}** position.`;
            suggestedActions = ['Export PDF'];
            return this.createAgentMessage(responseContent, suggestedActions, `LAYOUT_${position}` as any);
        }

        // 9. Exports
        if (lowerInput.includes('ppt') || lowerInput.includes('powerpoint')) {
            responseContent = "Generating your PowerPoint presentation now...";
            suggestedActions = ['Start New Campaign'];
            return this.createAgentMessage(responseContent, suggestedActions, 'EXPORT_PPT');
        }

        if (lowerInput.includes('export') || lowerInput.includes('pdf')) {
            responseContent = "Generating your PDF export now...";
            suggestedActions = ['Start New Campaign'];
            return this.createAgentMessage(responseContent, suggestedActions, 'EXPORT_PDF');
        }

        // 6. Grouping / Views (Delegated to ChannelManager)
        const groupingResult = channelManager.changeGrouping(input, this.context as any);
        if (groupingResult) {
            console.log('[AgentBrain] Matched: Change grouping (via ChannelManager)');
            return groupingResult;
        }

        // 7. Modify Segment by Row (Delegated to ChannelManager)
        const segmentResult = channelManager.modifySegment(input, this.context as any);
        if (segmentResult) {
            console.log('[AgentBrain] Matched: Modify segment (via ChannelManager)');
            return segmentResult;
        }

        return null;
    }

    private generatePlacements() {
        if (!this.context.mediaPlan) return;

        const placements: Placement[] = [];
        const targetBudget = this.context.mediaPlan.campaign.budget;
        let currentSpend = 0;
        const strategy = this.context.mediaPlan.strategy || 'BALANCED';

        // 1. Core Digital Layer
        const digitalChannels = ['Search', 'Social', 'Display'] as const;
        digitalChannels.forEach(channel => {
            if (strategy === 'AWARENESS' && channel === 'Display') return;

            const p = generateLine(channel, this.context.mediaPlan!.campaign.advertiser);

            let allocPct = 0.10;
            if (strategy === 'DIGITAL') allocPct = 0.25;

            if (strategy === 'AWARENESS') {
                if (channel === 'Search') {
                    allocPct = 0.02;
                } else {
                    allocPct = 0.05;
                }
            }

            const alloc = targetBudget * (allocPct + Math.random() * 0.02);

            if (p.costMethod === 'CPM') {
                p.quantity = Math.floor((alloc * 1000) / p.rate);
                p.totalCost = (p.quantity * p.rate) / 1000;
            } else {
                p.quantity = Math.floor(alloc / p.rate);
                p.totalCost = p.quantity * p.rate;
            }
            placements.push(p);
            currentSpend += p.totalCost;
        });

        // 2. Offline / Broad Reach Layers
        if (strategy === 'AWARENESS' || targetBudget > 50000) {
            const offlineChannels = ['TV', 'Radio', 'OOH'] as const;
            const count = strategy === 'AWARENESS' ? 4 : 2;

            for (let i = 0; i < count; i++) {
                let channel = offlineChannels[Math.floor(Math.random() * offlineChannels.length)];
                if (strategy === 'AWARENESS' && i === 0) channel = 'TV';
                if (strategy === 'AWARENESS' && i === 1) channel = 'OOH';

                const p = generateLine(channel, this.context.mediaPlan!.campaign.advertiser);

                let allocPct = 0.15;
                if (strategy === 'AWARENESS') allocPct = 0.25;

                const alloc = targetBudget * allocPct;

                if (p.costMethod === 'Spot' || p.costMethod === 'Flat') {
                    p.quantity = Math.max(1, Math.floor(alloc / p.rate));
                    p.totalCost = p.quantity * p.rate;
                } else {
                    p.quantity = Math.floor((alloc * 1000) / p.rate);
                    p.totalCost = (p.quantity * p.rate) / 1000;
                }

                if (currentSpend + p.totalCost <= targetBudget || (strategy === 'AWARENESS' && i === 0)) {
                    placements.push(p);
                    currentSpend += p.totalCost;
                }
            }
        }

        // 3. Fill remaining budget
        let safetyCounter = 0;
        while (currentSpend < targetBudget * 0.95 && safetyCounter < 20) {
            const channel = Math.random() > 0.5 ? 'Social' : 'Display';
            const p = generateLine(channel, this.context.mediaPlan!.campaign.advertiser);
            const remaining = targetBudget - currentSpend;
            const alloc = Math.min(remaining, targetBudget * 0.05);

            p.quantity = Math.floor((alloc * 1000) / p.rate);
            p.totalCost = (p.quantity * p.rate) / 1000;

            if (p.totalCost > 10) {
                placements.push(p);
                currentSpend += p.totalCost;
            }
            safetyCounter++;
        }

        this.context.mediaPlan.campaign.placements = placements;
        this.context.mediaPlan.totalSpend = currentSpend;
        this.context.mediaPlan.remainingBudget = targetBudget - currentSpend;

        // Calculate metrics for the new plan
        this.context.mediaPlan.metrics = calculatePlanMetrics(placements);
    }

    /**
     * Execute a pending action after user confirmation
     * Delegates to OptimizationManager for pause/scale operations
     */
    private executePendingAction(action: PendingAction): AgentMessage {
        const plan = this.context.mediaPlan;
        if (!plan) {
            return this.createAgentMessage(
                "Error: No media plan found.",
                ['Create new campaign']
            );
        }

        let result;
        switch (action.type) {
            case 'PAUSE_UNDERPERFORMERS':
                result = executePauseUnderperformers(
                    plan,
                    action.data.pausePreview,
                    action.data.totalSavings
                );
                break;
            case 'SCALE_WINNERS':
                result = executeScaleWinners(
                    plan,
                    action.data.scalePreview,
                    action.data.totalBudgetIncrease
                );
                break;
            default:
                return this.createAgentMessage(
                    "Unknown action type. No changes were made.",
                    ['Show performance', 'Optimize']
                );
        }

        if (result.response) {
            this.context.history.push(result.response);
            contextManager.addMessage(this.sessionId, 'assistant', result.response.content);
            return result.response;
        }

        return this.createAgentMessage(
            "Action completed.",
            ['Show performance', 'Optimize']
        );
    }

    private createAgentMessage(content: string, suggestedActions: string[], action?: AgentMessage['action']): AgentMessage {
        return {
            id: generateMessageId('agent'),
            role: 'agent',
            content,
            timestamp: Date.now(),
            suggestedActions,
            action
        };
    }

    private provideSuggestions(): AgentMessage {
        const hasPlan = this.context.mediaPlan !== null;

        if (!hasPlan) {
            return this.createAgentMessage(
                "Here are some ways to get started:\n\n" +
                "• **'Create a media plan with a budget of $500k'** - Generate a new plan\n" +
                "• **'Build a balanced plan for Q1 2025'** - Create quarterly plan\n" +
                "• **'What sports programming is available?'** - Browse TV inventory\n" +
                "• **'What DOOH is available in New York?'** - Check outdoor inventory",
                ['Create a $500k plan', 'Show TV sports inventory']
            );
        }

        return this.createAgentMessage(
            "Here's what I can help you with:\n\n" +
            "**Add Placements:**\n" +
            "• 'Add Google Search ads'\n" +
            "• 'Add ESPN SportsCenter'\n\n" +
            "**Optimize:**\n" +
            "• 'Optimize for reach'\n" +
            "• 'Pause underperformers'\n\n" +
            "**Inventory Questions:**\n" +
            "• 'What sports shows are available?'\n" +
            "• 'What DOOH is in Seoul?'\n" +
            "• 'Where can I run vertical video?'",
            ['Add TV placement', 'Optimize for conversions']
        );
    }
}

