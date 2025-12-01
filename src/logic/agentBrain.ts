
import { Campaign, MediaPlan, AgentMessage, Placement, Brand, AgentInfo, AgentExecution, Creative } from '../types';
import { generateCampaign, generateLine, calculatePlanMetrics, SAMPLE_AGENTS, generateId } from './dummyData';
import { DMA_DATA, getDMAByCity } from './dmaData';

// Enhanced Agent Intelligence Modules
import { classifyIntent, IntentCategory } from './intentClassifier';
import { extractAllEntities, extractBudget, extractChannels } from './entityExtractor';
import { contextManager } from './contextManager';
import { recommendBudgetAllocation, analyzeBudgetUsage, suggestOptimizations } from '../utils/budgetOptimizer';
import { generateBatchPlacements } from '../utils/placementGenerator';
import { actionHistory } from '../utils/actionHistory';
import { CAMPAIGN_TEMPLATES } from './campaignTemplates';
import { generateOptimizationReport, formatOptimizationReport } from '../utils/optimizationEngine';
import { analyzePlan, getAnalysisSummary } from '../utils/performanceAnalyzer';
import { forecastCampaign, formatForecastResult, calculateAudienceOverlap } from '../utils/forecastingEngine';

export type AgentState = 'INIT' | 'BUDGETING' | 'CHANNEL_SELECTION' | 'REFINEMENT' | 'OPTIMIZATION' | 'FINISHED';

interface AgentContext {
    state: AgentState;
    mediaPlan: MediaPlan | null;
    brand?: Brand | null;
    history: AgentMessage[];
    agents: AgentInfo[];
    executions: AgentExecution[];
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

    processInput(input: string): AgentMessage {
        const userMsg: AgentMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: Date.now()
        };
        this.context.history.push(userMsg);

        // ===== ENHANCED AGENT INTELLIGENCE =====
        // 1. Classify intent
        const intent = classifyIntent(input);
        console.log('[AgentBrain] Intent detected:', intent);

        // 2. Extract entities
        const entities = extractAllEntities(input);
        console.log('[AgentBrain] Entities extracted:', entities);

        // 3. Add to context manager
        contextManager.addMessage(this.sessionId, 'user', input, intent, entities);

        let responseContent = '';
        let suggestedActions: string[] = [];
        let agentMsg: AgentMessage | null = null;

        // GLOBAL: Layout Commands (work regardless of media plan state)
        // Enhanced pattern matching to handle typos and variations
        // Matches: "switch left", "swtich left", "change left", "move to left", etc.
        const layoutMatch = input.toLowerCase().match(/(?:sw[it]+ch|change|set|move|go)(?:\s+to)?\s+(left|right|bottom)/i);
        if (layoutMatch) {
            const position = layoutMatch[1].toUpperCase() as 'LEFT' | 'RIGHT' | 'BOTTOM';
            responseContent = "I've switched the layout to **" + layoutMatch[1] + "** position.";
            suggestedActions = ['Continue planning'];
            agentMsg = {
                id: Date.now().toString(),
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
        // GOAL SETTING COMMANDS (Global - Overrides State)
        // =================================================================
        // Patterns: "set goal impressions 1M", "update goal conversions 500", "show goals", "increase reach to 1M"
        const lowerInput = input.toLowerCase();
        const hasGoalKeyword = lowerInput.includes('goal') ||
            (lowerInput.includes('increase') && (lowerInput.includes('reach') || lowerInput.includes('impression') || lowerInput.includes('conversion') || lowerInput.includes('click'))) ||
            (lowerInput.includes('set') && (lowerInput.includes('reach') || lowerInput.includes('impression') || lowerInput.includes('conversion') || lowerInput.includes('click')));

        if (hasGoalKeyword && (lowerInput.includes('set') || lowerInput.includes('show') || lowerInput.includes('update') || lowerInput.includes('change') || lowerInput.includes('list') || lowerInput.includes('what are') || lowerInput.includes('increase'))) {
            try {
                const plan = this.context.mediaPlan;
                if (!plan) {
                    const response = this.createAgentMessage(
                        "I need an active media plan to manage goals. Please create or select a campaign first.",
                        ['Create new campaign']
                    );
                    this.context.history.push(response);
                    contextManager.addMessage(this.sessionId, 'assistant', response.content);
                    return response;
                }

                // Handle "Show Goals"
                if (lowerInput.includes('show') || lowerInput.includes('list') || lowerInput.includes('what are')) {
                    console.log('[AgentBrain] Matched: Show goals');
                    const goals = plan.campaign.numericGoals || {};
                    const hasGoals = Object.keys(goals).length > 0;

                    if (!hasGoals) {
                        const response = this.createAgentMessage(
                            "You haven't set any numeric goals yet.",
                            ['Set goal impressions 1M', 'Set goal conversions 500']
                        );
                        this.context.history.push(response);
                        contextManager.addMessage(this.sessionId, 'assistant', response.content);
                        return response;
                    }

                    let responseContent = "**🎯 Current Campaign Goals**\n\n";
                    if (goals.impressions) responseContent += `• **Impressions:** ${goals.impressions.toLocaleString()}\n`;
                    if (goals.reach) responseContent += `• **Reach:** ${goals.reach.toLocaleString()}\n`;
                    if (goals.conversions) responseContent += `• **Conversions:** ${goals.conversions.toLocaleString()}\n`;
                    if (goals.clicks) responseContent += `• **Clicks:** ${goals.clicks.toLocaleString()}\n`;

                    const response = this.createAgentMessage(responseContent, ['Forecast this campaign']);
                    this.context.history.push(response);
                    contextManager.addMessage(this.sessionId, 'assistant', responseContent);
                    return response;
                }

                // Handle "Set/Update/Increase Goal"
                if (lowerInput.includes('set') || lowerInput.includes('update') || lowerInput.includes('change') || lowerInput.includes('add') || lowerInput.includes('increase')) {
                    console.log('[AgentBrain] Matched: Set/Update/Increase goal');

                    // Parse metric
                    let metric: 'impressions' | 'reach' | 'conversions' | 'clicks' | null = null;
                    if (lowerInput.includes('impression')) metric = 'impressions';
                    else if (lowerInput.includes('reach')) metric = 'reach';
                    else if (lowerInput.includes('conversion')) metric = 'conversions';
                    else if (lowerInput.includes('click')) metric = 'clicks';

                    if (!metric) {
                        const response = this.createAgentMessage(
                            "Which goal would you like to set? I support Impressions, Reach, Conversions, and Clicks.",
                            ['Set goal impressions 1M', 'Set goal conversions 500']
                        );
                        this.context.history.push(response);
                        contextManager.addMessage(this.sessionId, 'assistant', response.content);
                        return response;
                    }

                    // Parse value - look for number after the metric keyword
                    // This ensures we get "100" from "set goal impressions 100M" not just any first number
                    const metricIndex = lowerInput.indexOf(metric);
                    const afterMetric = metricIndex >= 0 ? lowerInput.substring(metricIndex + metric.length) : lowerInput;
                    const valueMatch = afterMetric.match(/(\d+(?:\.\d+)?)\s*([kKmMbB])?/);

                    if (!valueMatch) {
                        const response = this.createAgentMessage(
                            `I couldn't understand the value for ${metric}. Try saying something like "Set goal ${metric} 1.5M" or "Set goal ${metric} 5000".`,
                            [`Set goal ${metric} 100k`]
                        );
                        this.context.history.push(response);
                        contextManager.addMessage(this.sessionId, 'assistant', response.content);
                        return response;
                    }

                    let value = parseFloat(valueMatch[1]);
                    const suffix = valueMatch[2]?.toLowerCase();

                    if (suffix === 'k') value *= 1000;
                    else if (suffix === 'm') value *= 1000000;
                    else if (suffix === 'b') value *= 1000000000;

                    // Update plan with goal - preserve all existing data
                    if (!plan.campaign.numericGoals) {
                        plan.campaign.numericGoals = {};
                    }
                    plan.campaign.numericGoals[metric] = Math.floor(value);

                    // Return updated plan in response - preserve all existing data
                    const response = this.createAgentMessage(
                        `✅ **Goal Updated!**\n\nI've set your **${metric}** goal to **${Math.floor(value).toLocaleString()}**.\n\nThe goal tracking card in your plan view has been updated.`,
                        ['Show goals', 'Forecast this campaign']
                    );

                    // Important: Attach updated plan to trigger UI update
                    // Use shallow copy to preserve all references (especially placements)
                    response.updatedMediaPlan = {
                        ...plan,
                        campaign: {
                            ...plan.campaign,
                            numericGoals: { ...plan.campaign.numericGoals }
                        }
                    };
                    this.context.history.push(response);
                    contextManager.addMessage(this.sessionId, 'assistant', response.content);
                    return response;
                }
            } catch (e: any) {
                console.error("Error in goal logic:", e);
                const response = this.createAgentMessage(
                    "I encountered an error while processing your goal command: " + (e.message || String(e)),
                    ['Show goals']
                );
                this.context.history.push(response);
                contextManager.addMessage(this.sessionId, 'assistant', response.content);
                return response;
            }
        }

        // =================================================================
        // CAMPAIGN TEMPLATE COMMANDS (Phase 5.4)
        // =================================================================
        if (lowerInput.includes('template')) {
            try {
                // "Show me templates" or "List templates"
                if (lowerInput.includes('show') || lowerInput.includes('list') || lowerInput.includes('browse') || lowerInput.includes('what') || lowerInput.includes('available')) {
                    let responseContent = "**📋 Campaign Templates**\n\nI have 6 pre-configured templates to help you get started quickly:\n\n";

                    CAMPAIGN_TEMPLATES.forEach(template => {
                        responseContent += `${template.icon} **${template.name}**\n`;
                        responseContent += `   ${template.description}\n`;
                        responseContent += `   • Budget: $${(template.recommendedBudget.optimal / 1000).toFixed(0)}k (optimal)\n`;
                        responseContent += `   • Channels: ${template.channelMix.map(m => m.channel).join(', ')}\n\n`;
                    });

                    responseContent += "To use a template, click the **Use Template** button in the campaign list or say \"create campaign from [template name]\".";

                    const response = this.createAgentMessage(responseContent, [
                        'Use Template',
                        'Tell me about the Retail Holiday template',
                        'What\'s best for B2B?'
                    ]);
                    this.context.history.push(response);
                    contextManager.addMessage(this.sessionId, 'assistant', responseContent);
                    return response;
                }

                // "Tell me about [template]" or "What's the [template] template?"
                const templateNames = ['retail holiday', 'b2b lead gen', 'brand launch', 'performance max', 'local store', 'mobile app'];
                const matchedTemplate = CAMPAIGN_TEMPLATES.find(t =>
                    templateNames.some(name => lowerInput.includes(name)) && lowerInput.includes(t.name.toLowerCase().split(' ')[0])
                );

                if (matchedTemplate) {
                    let responseContent = `**${matchedTemplate.icon} ${matchedTemplate.name}**\n\n`;
                    responseContent += `${matchedTemplate.description}\n\n`;
                    responseContent += `**📊 Recommended Budget:** $${(matchedTemplate.recommendedBudget.min / 1000).toFixed(0)}k - $${(matchedTemplate.recommendedBudget.max / 1000).toFixed(0)}k (optimal: $${(matchedTemplate.recommendedBudget.optimal / 1000).toFixed(0)}k)\n\n`;
                    responseContent += `**📺 Channel Mix:**\n`;
                    matchedTemplate.channelMix.forEach(mix => {
                        responseContent += `• ${mix.channel} (${mix.percentage}%): ${mix.rationale}\n`;
                    });
                    responseContent += `\n**🎯 Default Goals:**\n`;
                    if (matchedTemplate.defaultGoals.impressions) responseContent += `• Impressions: ${matchedTemplate.defaultGoals.impressions.toLocaleString()}\n`;
                    if (matchedTemplate.defaultGoals.reach) responseContent += `• Reach: ${matchedTemplate.defaultGoals.reach.toLocaleString()}\n`;
                    if (matchedTemplate.defaultGoals.conversions) responseContent += `• Conversions: ${matchedTemplate.defaultGoals.conversions.toLocaleString()}\n`;

                    const response = this.createAgentMessage(responseContent, ['Use this template', 'Show all templates']);
                    this.context.history.push(response);
                    contextManager.addMessage(this.sessionId, 'assistant', responseContent);
                    return response;
                }

                // "What's best for [industry/goal]?"
                if (lowerInput.includes('best for') || lowerInput.includes('recommend')) {
                    let recommendation = null;

                    if (lowerInput.includes('b2b') || lowerInput.includes('lead')) {
                        recommendation = CAMPAIGN_TEMPLATES.find(t => t.id === 'b2b-lead-gen');
                    } else if (lowerInput.includes('retail') || lowerInput.includes('ecommerce') || lowerInput.includes('store')) {
                        recommendation = CAMPAIGN_TEMPLATES.find(t => t.id === 'retail-holiday');
                    } else if (lowerInput.includes('brand') || lowerInput.includes('awareness') || lowerInput.includes('launch')) {
                        recommendation = CAMPAIGN_TEMPLATES.find(t => t.id === 'brand-launch');
                    } else if (lowerInput.includes('performance') || lowerInput.includes('conversion') || lowerInput.includes('roi')) {
                        recommendation = CAMPAIGN_TEMPLATES.find(t => t.id === 'performance-max');
                    } else if (lowerInput.includes('app') || lowerInput.includes('mobile')) {
                        recommendation = CAMPAIGN_TEMPLATES.find(t => t.id === 'mobile-app-launch');
                    }

                    if (recommendation) {
                        const responseContent = `Based on your requirements, I recommend the **${recommendation.icon} ${recommendation.name}** template.\n\n${recommendation.description}\n\nThis template is optimized with:\n• ${recommendation.channelMix.length} channels including ${recommendation.channelMix.slice(0, 3).map(m => m.channel).join(', ')}\n• Recommended budget: $${(recommendation.recommendedBudget.optimal / 1000).toFixed(0)}k\n• Complexity: ${recommendation.complexity}\n\nClick **Use Template** in the campaign list to get started!`;
                        const response = this.createAgentMessage(responseContent, ['Use Template', 'Show all templates']);
                        this.context.history.push(response);
                        contextManager.addMessage(this.sessionId, 'assistant', responseContent);
                        return response;
                    }
                }

            } catch (e: any) {
                console.error("Error in template logic:", e);
                const response = this.createAgentMessage(
                    "I encountered an error while processing template commands: " + (e.message || String(e)),
                    ['Show campaigns']
                );
                this.context.history.push(response);
                contextManager.addMessage(this.sessionId, 'assistant', response.content);
                return response;
            }
        }

        // =================================================================
        // CREATIVE MANAGEMENT COMMANDS (NEW - Phase 5.3)
        // =================================================================
        if (input.toLowerCase().includes('creative') || input.toLowerCase().includes('upload') || input.toLowerCase().includes('assign')) {
            try {
                const lowerInput = input.toLowerCase();
                const plan = this.context.mediaPlan;
                if (!plan) {
                    return this.createAgentMessage(
                        "I need an active media plan to manage creatives.",
                        ['Create new campaign']
                    );
                }

                // 1. Upload Creative
                if (lowerInput.includes('upload')) {
                    const nameMatch = input.match(/upload\s+(?:creative\s+)?["']?([^"']+)["']?/i);
                    const name = nameMatch ? nameMatch[1] : `New Creative ${Date.now()}`;

                    // Mock upload
                    // In a real app, we'd add this to a global library. 
                    // For now, we'll just confirm it's ready to be assigned.
                    return this.createAgentMessage(
                        `✅ **Creative Uploaded!**\n\nI've added "**${name}**" to your library.\n\nYou can now assign it to a placement.`,
                        ['Assign to all display placements']
                    );
                }

                // 2. Assign Creative
                if (lowerInput.includes('assign')) {
                    // Logic to find placement and assign
                    // Simplified: Assign to first matching placement or all
                    const target = lowerInput.includes('all') ? 'all' : 'first';

                    let count = 0;
                    plan.campaign.placements?.forEach(p => {
                        if (p.channel === 'Display' || p.channel === 'Social') {
                            const newCreative: Creative = {
                                id: generateId(),
                                name: `Assigned Creative ${count + 1}`,
                                type: 'IMAGE',
                                url: `https://picsum.photos/seed/${Math.random()}/400/300`,
                                dimensions: '300x250',
                                metrics: { ctr: 0, conversions: 0 }
                            };
                            p.creatives = [...(p.creatives || []), newCreative];
                            // Sync legacy
                            p.creative = {
                                id: newCreative.id,
                                name: newCreative.name,
                                type: 'image',
                                url: newCreative.url
                            };
                            count++;
                        }
                    });

                    if (count > 0) {
                        const response = this.createAgentMessage(
                            `✅ **Creatives Assigned!**\n\nI've assigned new creatives to ${count} placements.`,
                            ['Check performance']
                        );
                        response.updatedMediaPlan = { ...plan };
                        return response;
                    } else {
                        return this.createAgentMessage(
                            "I couldn't find any suitable placements to assign creatives to.",
                            ['Add display placement']
                        );
                    }
                }

                // 3. Performance Analysis
                if (lowerInput.includes('winning') || lowerInput.includes('best performing')) {
                    // Find best creative across all placements
                    let bestCreative: Creative | null = null;
                    let bestCtr = -1;
                    let bestPlacementName = '';

                    plan.campaign.placements?.forEach(p => {
                        p.creatives?.forEach(c => {
                            if ((c.metrics?.ctr || 0) > bestCtr) {
                                bestCtr = c.metrics?.ctr || 0;
                                bestCreative = c;
                                bestPlacementName = p.name;
                            }
                        });
                    });

                    if (bestCreative) {
                        return this.createAgentMessage(
                            `🏆 **Winning Creative Found!**\n\n**${(bestCreative as Creative).name}** is your top performer.\n\n• **CTR:** ${((bestCtr) * 100).toFixed(2)}%\n• **Placement:** ${bestPlacementName}`,
                            ['Optimize rotation']
                        );
                    } else {
                        return this.createAgentMessage(
                            "I don't have enough performance data yet to determine a winner.",
                            ['Wait for data']
                        );
                    }
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
                    metrics: { impressions: 0, reach: 0, frequency: 0, cpm: 0 } // Initialize metrics
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
                    id: Date.now().toString(),
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
            id: Date.now().toString(),
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
        // OPTIMIZATION COMMANDS (NEW - Phase 5.1)
        // =================================================================

        // Handle specific optimization views (suggested actions)
        if (lowerInput.includes('quick win')) {
            console.log('[AgentBrain] Matched: Quick wins query');

            const plan = this.context.mediaPlan;
            if (!plan || !plan.campaign.placements || plan.campaign.placements.length === 0) {
                return this.createAgentMessage(
                    "I can't show quick wins yet - there are no placements to analyze.",
                    ['Add placements first']
                );
            }

            const flightBudget = 100000;
            const report = generateOptimizationReport(plan.campaign.placements, flightBudget);

            if (report.quickWins.length === 0) {
                return this.createAgentMessage(
                    "🎉 No quick wins needed - your plan is well-optimized!\n\nTry 'optimize my plan' for a full analysis.",
                    ['Optimize my plan']
                );
            }

            let responseContent = `💡 **Quick Wins** (${report.quickWins.length} easy, high-impact actions)\n\n`;
            report.quickWins.forEach((rec, idx) => {
                const impact = rec.estimatedImpact > 0
                    ? `Save $${Math.round(rec.estimatedImpact).toLocaleString('en-US')}`
                    : `Gain $${Math.round(Math.abs(rec.estimatedImpact)).toLocaleString('en-US')}`;
                responseContent += `${idx + 1}. ${rec.description}\n`;
                responseContent += `   ${rec.specificAction}\n`;
                responseContent += `   💰 ${impact}\n\n`;
            });

            return this.createAgentMessage(responseContent, ['Optimize my plan']);
        }

        if (lowerInput.includes('critical issue')) {
            console.log('[AgentBrain] Matched: Critical issues query');

            const plan = this.context.mediaPlan;
            if (!plan || !plan.campaign.placements || plan.campaign.placements.length === 0) {
                return this.createAgentMessage(
                    "I can't show critical issues yet - there are no placements to analyze.",
                    ['Add placements first']
                );
            }

            const flightBudget = 100000;
            const report = generateOptimizationReport(plan.campaign.placements, flightBudget);
            const critical = report.recommendations.filter(r => r.priority === 'HIGH');

            if (critical.length === 0) {
                return this.createAgentMessage(
                    "✅ No critical issues found - great job!\n\nYour plan is in good shape.",
                    ['Show full report']
                );
            }

            let responseContent = `🚨 **Critical Issues** (${critical.length})\n\n`;
            critical.forEach((rec, idx) => {
                const impact = rec.estimatedImpact > 0
                    ? `Save $${Math.round(rec.estimatedImpact).toLocaleString('en-US')}`
                    : `Gain $${Math.round(Math.abs(rec.estimatedImpact)).toLocaleString('en-US')}`;
                responseContent += `${idx + 1}. **${rec.placementName}**\n`;
                responseContent += `   Issue: ${rec.description}\n`;
                responseContent += `   Action: ${rec.specificAction}\n`;
                responseContent += `   💰 ${impact}\n\n`;
            });

            return this.createAgentMessage(responseContent, ['Show full report', 'Show quick wins']);
        }

        if (lowerInput.includes('growth opportunit') || lowerInput.includes('scale') && lowerInput.includes('winner')) {
            console.log('[AgentBrain] Matched: Growth opportunities query');

            const plan = this.context.mediaPlan;
            if (!plan || !plan.campaign.placements || plan.campaign.placements.length === 0) {
                return this.createAgentMessage(
                    "I can't show growth opportunities yet - there are no placements to analyze.",
                    ['Add placements first']
                );
            }

            const flightBudget = 100000;
            const report = generateOptimizationReport(plan.campaign.placements, flightBudget);
            const opportunities = report.recommendations.filter(r => r.estimatedImpact < 0);

            if (opportunities.length === 0) {
                return this.createAgentMessage(
                    "📊 No major growth opportunities identified right now.\n\nYour high performers are already well-funded.",
                    ['Show full report']
                );
            }

            let responseContent = `✨ **Growth Opportunities** (${opportunities.length})\n\n`;
            responseContent += `Scale these high-performers to maximize returns:\n\n`;
            opportunities.forEach((rec, idx) => {
                const gain = Math.abs(rec.estimatedImpact);
                responseContent += `${idx + 1}. **${rec.placementName}**\n`;
                responseContent += `   ${rec.currentMetric}\n`;
                responseContent += `   Action: ${rec.specificAction}\n`;
                responseContent += `   💰 Potential gain: $${Math.round(gain).toLocaleString('en-US')}\n\n`;
            });

            return this.createAgentMessage(responseContent, ['Show full report']);
        }

        if (lowerInput.includes('detailed report') || lowerInput.includes('full report')) {
            console.log('[AgentBrain] Matched: Detailed/Full report query');
            // This will fall through to the main optimize command below
            // Replace the input to trigger the main handler
            input = 'optimize my plan';
        }

        // Patterns: "optimize my plan", "optimize plan", "what's wrong with my plan"
        if (lowerInput.includes('optimize') ||
            (lowerInput.includes('what') && (lowerInput.includes('wrong') || lowerInput.includes('issue'))) ||
            lowerInput.includes('improvement') ||
            lowerInput.includes('opportunities')) {
            console.log('[AgentBrain] Matched: Optimization query');

            const plan = this.context.mediaPlan;
            if (!plan || !plan.campaign.placements || plan.campaign.placements.length === 0) {
                return this.createAgentMessage(
                    "I can't analyze your plan yet because there are no placements. Try adding some placements first!",
                    ['Add 3 social placements', 'How should I allocate $50k?']
                );
            }

            // Get flight budget
            const flightBudget = 100000; // Default, would ideally get from activeFlightId

            // Generate optimization report
            const report = generateOptimizationReport(plan.campaign.placements, flightBudget);

            // Format the report
            const formattedReport = formatOptimizationReport(report);

            // Add suggested actions based on quick wins
            const suggestedActions: string[] = [];
            if (report.quickWins.length > 0) {
                suggestedActions.push('Show quick wins');
            }
            if (report.recommendations.some(r => r.action === 'PAUSE')) {
                suggestedActions.push('Show critical issues only');
            }
            if (report.totalGains > 0) {
                suggestedActions.push('Show growth opportunities');
            }

            return this.createAgentMessage(
                formattedReport,
                suggestedActions.slice(0, 3)
            );
        }

        // Show plan analysis/score
        // Must check for "plan" + "score"/"health"/"grade" to avoid conflicts with other commands
        if ((lowerInput.includes('plan') && (lowerInput.includes('score') || lowerInput.includes('health') || lowerInput.includes('grade'))) ||
            lowerInput.includes('plan score') ||
            lowerInput.includes('plan health')) {
            console.log('[AgentBrain] Matched: Plan score query');

            const plan = this.context.mediaPlan;
            if (!plan || !plan.campaign.placements || plan.campaign.placements.length === 0) {
                return this.createAgentMessage(
                    "I can't score your plan yet - there are no placements to analyze.",
                    ['Add placements first']
                );
            }

            const flightBudget = 100000;
            const analysis = analyzePlan(plan.campaign.placements, flightBudget);
            const summary = getAnalysisSummary(analysis);

            let responseContent = `**📊 Plan Health Check**\n\n${summary}\n\n`;

            if (analysis.criticalCount > 0) {
                responseContent += `You have **${analysis.criticalCount} critical issue${analysis.criticalCount > 1 ? 's' : ''}** that need immediate attention.\n\n`;
            }

            if (analysis.overallScore < 70) {
                responseContent += `Your plan could benefit from optimization. Would you like me to show you specific recommendations?`;
            } else if (analysis.overallScore < 85) {
                responseContent += `Your plan is in good shape! There are a few minor optimizations that could improve performance.`;
            } else {
                responseContent += `Excellent work! Your plan is well-optimized. Keep monitoring for any changes.`;
            }

            return this.createAgentMessage(
                responseContent,
                ['Optimize my plan', 'Show detailed report']
            );
        }


        // =================================================================
        // FORECASTING COMMANDS (NEW - Phase 5.2)
        // =================================================================
        // Patterns: "forecast this campaign", "what's the seasonal impact", "audience overlap"
        if (lowerInput.includes('forecast') ||
            (lowerInput.includes('predict') && (lowerInput.includes('performance') || lowerInput.includes('campaign'))) ||
            lowerInput.includes('will we hit')) {
            console.log('[AgentBrain] Matched: Forecast query');

            const plan = this.context.mediaPlan;
            if (!plan || !plan.campaign.placements || plan.campaign.placements.length === 0) {
                return this.createAgentMessage(
                    "I can't forecast yet - there are no placements to analyze. Add some placements first!",
                    ['Add 3 social placements', 'How should I allocate $50k?']
                );
            }

            // Get campaign date range
            const campaign = plan.campaign;
            const startDate = campaign.startDate || new Date().toISOString();
            const endDate = campaign.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            // Generate forecast
            const forecast = forecastCampaign(plan.campaign.placements, startDate, endDate);
            const formattedForecast = formatForecastResult(forecast);

            return this.createAgentMessage(
                formattedForecast,
                ['Show seasonal impact', 'Check audience overlap', 'Optimize my plan']
            );
        }

        // Seasonal impact query
        if (lowerInput.includes('seasonal') && (lowerInput.includes('impact') || lowerInput.includes('factor'))) {
            console.log('[AgentBrain] Matched: Seasonal impact query');

            const plan = this.context.mediaPlan;
            if (!plan || !plan.campaign.placements || plan.campaign.placements.length === 0) {
                return this.createAgentMessage(
                    "I can't analyze seasonal impact yet - add placements first.",
                    ['Add placements']
                );
            }

            const campaign = plan.campaign;
            const startDate = new Date(campaign.startDate || Date.now());
            const month = startDate.getMonth();
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

            let responseContent = `🌡️ **Seasonal Impact Analysis**\n\n`;
            responseContent += `**Campaign Month:** ${monthNames[month]}\n\n`;

            // Import seasonality factors (would ideally come from forecastingEngine)
            const seasonalFactors: Record<number, string> = {
                0: 'Post-holiday slump - 10-15% lower CPMs',
                1: 'Valentine\'s/Presidents Day - slightly elevated',
                2: 'Spring awakening - baseline CPMs',
                3: 'Spring growth - moderately elevated (5-10%)',
                4: 'Summer prep - elevated (10-15%)',
                5: 'Summer begins - moderately elevated',
                6: 'Summer slump - 5-10% lower CPMs',
                7: 'Back to school prep - lower competition (10-15% cheaper)',
                8: 'Fall activation - back to baseline',
                9: 'Q4 buildup - elevated (5-10%)',
                10: 'Holiday peak - VERY HIGH (15-20% premium)',
                11: 'Holiday peak continues - HIGHEST (15-25% premium)'
            };

            responseContent += `**${monthNames[month]} Trends:**\n`;
            responseContent += `• ${seasonalFactors[month] || 'Normal seasonal patterns'}\n\n`;

            responseContent += `**Recommendations:**\n`;
            if (month === 10 || month === 11) {
                responseContent += `• Book inventory early - high demand period\n`;
                responseContent += `• Expect 15-20% higher CPMs than average\n`;
                responseContent += `• Consider expanding to less competitive channels\n`;
            } else if (month === 6 || month === 7) {
                responseContent += `• Great opportunity for efficient spend\n`;
                responseContent += `• CPMs 10-15% below average\n`;
                responseContent += `• Good time to test new channels/tactics\n`;
            } else {
                responseContent += `• Normal competitive levels expected\n`;
                responseContent += `• Good balance of efficiency and reach\n`;
            }

            return this.createAgentMessage(responseContent, ['Forecast campaign', 'Optimize my plan']);
        }

        // Audience overlap query
        if (lowerInput.includes('audience overlap') ||
            (lowerInput.includes('overlap') && lowerInput.includes('reach'))) {
            console.log('[AgentBrain] Matched: Audience overlap query');

            const plan = this.context.mediaPlan;
            if (!plan || !plan.campaign.placements || plan.campaign.placements.length === 0) {
                return this.createAgentMessage(
                    "I can't calculate audience overlap yet - add placements first.",
                    ['Add placements']
                );
            }

            const overlap = calculateAudienceOverlap(plan.campaign.placements);

            let responseContent = `👥 **Audience Overlap Analysis**\n\n`;
            responseContent += `**Total Reach (Uncorrected):** ${Math.round(overlap.totalReach).toLocaleString()}\n`;
            responseContent += `**Overlap Amount:** ${Math.round(overlap.overlapAmount).toLocaleString()} (${overlap.overlapPercentage.toFixed(1)}%)\n`;
            responseContent += `**Adjusted Unique Reach:** ${Math.round(overlap.adjustedReach).toLocaleString()}\n\n`;

            if (overlap.overlapPercentage > 40) {
                responseContent += `⚠️ **High Overlap Detected**\n`;
                responseContent += `Your channels have significant audience overlap (${overlap.overlapPercentage.toFixed(0)}%). This means:\n`;
                responseContent += `• You're reaching fewer unique people than raw numbers suggest\n`;
                responseContent += `• Consider diversifying to different audience segments\n`;
                responseContent += `• Frequency may be higher than optimal\n`;
            } else if (overlap.overlapPercentage > 25) {
                responseContent += `📊 **Moderate Overlap**\n`;
                responseContent += `Your channels have typical overlap (${overlap.overlapPercentage.toFixed(0)}%). This is normal for multi-channel campaigns.\n`;
            } else {
                responseContent += `✅ **Low Overlap**\n`;
                responseContent += `Great! Your channels reach relatively distinct audiences (${overlap.overlapPercentage.toFixed(0)}% overlap).\n`;
            }

            return this.createAgentMessage(responseContent, ['Forecast campaign', 'Optimize my plan']);
        }

        // Handle inventory questions
        // Triggers: "what available", "what avail", "what inventory"
        if (lowerInput.includes('what') && (lowerInput.includes('available') || lowerInput.includes('avail') || lowerInput.includes('inventory'))) {
            // Check for DMA/Broadcast specific queries first
            // e.g. "what channels are avail in Des Moines", "broadcast stations in Dallas"
            if (lowerInput.includes('channel') || lowerInput.includes('station') || lowerInput.includes('broadcast') || lowerInput.includes('tv')) {
                const dmaMatch = this.handleDMAQuery(input);
                if (dmaMatch) {
                    console.log('[AgentBrain] Matched: DMA Broadcast query');
                    return dmaMatch;
                }
            }

            console.log('[AgentBrain] Matched: Inventory query');
            return this.handleInventoryQuery(input);
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
        // Patterns: "how should I allocate", "split budget", "distribute $X"
        const budgetAllocMatch = lowerInput.match(/(?:how.*allocate|split|distribute|spread).*(?:\$?([\d,]+(?:k|m)?)|budget)/i);

        if (budgetAllocMatch && (lowerInput.includes('allocate') || lowerInput.includes('split') || lowerInput.includes('distribute'))) {
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

            const suggestedActions = recommendation.channels.slice(0, 2).map(ch =>
                `Add ${ch.channel} placements`
            );
            suggestedActions.push('Modify allocation');

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
                id: Date.now().toString(),
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
                id: Date.now().toString(),
                role: 'agent',
                content: `I'm creating a new flight called "**${flightName}**".`,
                timestamp: Date.now(),
                suggestedActions: ['Add TV placement', 'Set flight budget'],
                action: { type: 'CREATE_FLIGHT', payload: { name: flightName } } as any
            };
        }

        // =================================================================
        // BATCH PLACEMENT GENERATION (NEW - Phase 4)
        // =================================================================
        // Pattern: "add 5 social placements", "create 3 TV spots on ESPN"
        const batchMatch = lowerInput.match(/(?:add|create|make|generate)\s+(\d+)\s+(social|display|tv|ctv|connected tv|linear tv|search|audio|video|native)/i);

        if (batchMatch) {
            const count = parseInt(batchMatch[1]);
            let channelInput = batchMatch[2];

            // Normalize channel names
            const channelMap: Record<string, string> = {
                'ctv': 'Connected TV',
                'connected tv': 'Connected TV',
                'linear tv': 'Linear TV',
                'tv': 'Connected TV',  // Default TV to CTV
                'social': 'Social',
                'display': 'Display',
                'search': 'Search',
                'audio': 'Audio',
                'video': 'Video',
                'native': 'Native'
            };

            const channel = channelMap[channelInput.toLowerCase()] || channelInput;

            // Extract network if specified (e.g., "on ESPN")
            const networkMatch = input.match(/on\s+([a-z]+)/i);
            const network = networkMatch ? networkMatch[1] : undefined;

            // Validate count
            if (count < 1 || count > 10) {
                return this.createAgentMessage(
                    `I can create between 1 and 10 placements at a time. You requested ${count}.`,
                    [`Add ${Math.min(count, 10)} ${channel} placements`]
                );
            }

            // Generate batch placements
            const activeFlightId = this.context.mediaPlan!.activeFlightId;
            const activeFlight = this.context.mediaPlan!.campaign.flights?.find(f => f.id === activeFlightId);

            if (!activeFlight) {
                return this.createAgentMessage(
                    "I need to be in a flight to add placements. Please select or create a flight first.",
                    ['Create new flight']
                );
            }

            const placements = generateBatchPlacements({
                channel,
                network,
                count,
                variation: 'diverse'  // Always use diverse for batch generation
            }, activeFlight);

            // Add all placements to campaign
            if (!this.context.mediaPlan!.campaign.placements) {
                this.context.mediaPlan!.campaign.placements = [];
            }

            let totalCost = 0;
            placements.forEach(p => {
                this.context.mediaPlan!.campaign.placements!.push(p);
                totalCost += p.totalCost;
            });

            // Update plan totals
            this.context.mediaPlan!.totalSpend += totalCost;
            this.context.mediaPlan!.remainingBudget = this.context.mediaPlan!.campaign.budget - this.context.mediaPlan!.totalSpend;
            this.context.mediaPlan!.metrics = calculatePlanMetrics(this.context.mediaPlan!.campaign.placements);

            // Record action for undo
            actionHistory.recordAction({
                id: `batch-${Date.now()}`,
                type: 'add_placement',
                description: `Added ${count} ${channel} placements`,
                userCommand: input,
                stateBefore: { placementCount: this.context.mediaPlan!.campaign.placements!.length - count },
                stateAfter: { placementCount: this.context.mediaPlan!.campaign.placements!.length },
                canUndo: true
            });

            // Generate summary
            const placementSummary = placements.slice(0, 3).map(p =>
                `• ${p.vendor} - ${p.adUnit} ($${(p.totalCost / 1000).toFixed(1)}k)`
            ).join('\\n');

            const moreText = count > 3 ? `\\n...and ${count - 3} more` : '';

            responseContent = `✅ Created **${count} ${channel} placements** for **$${(totalCost / 1000).toFixed(1)}k**:\\n\\n${placementSummary}${moreText}\\n\\n` +
                `**Total Spend:** $${(this.context.mediaPlan!.totalSpend / 1000).toFixed(1)}k of $${(this.context.mediaPlan!.campaign.budget / 1000).toFixed(1)}k`;

            // Check budget usage and warn if high
            const budgetUsed = (this.context.mediaPlan!.totalSpend / this.context.mediaPlan!.campaign.budget) * 100;
            if (budgetUsed > 80) {
                responseContent += `\\n\\n⚠️ **${budgetUsed.toFixed(0)}% of budget allocated** - limited budget remaining.`;
            }

            suggestedActions = ['Add more placements', 'Optimize plan', 'Export PDF'];

            // Add to context manager
            contextManager.addMessage(this.sessionId, 'assistant', responseContent);

            return this.createAgentMessage(responseContent, suggestedActions);
        }

        // =================================================================
        // SINGLE PLACEMENT (Existing logic)
        // =================================================================
        // 1. Add Channel
        const addMatch = lowerInput.match(/add\s+(search|social|display|tv|radio|ooh|print|espn|cbs|nbc|abc|fox|cnn|msnbc|hgtv|discovery|tlc|bravo|tnt|netflix|hulu|amazon|disney|hbo|apple|paramount|peacock|youtube|roku|tubi|pluto|f1|dazn|sling|nfl|nba|mlb|nhl)/i);

        if (addMatch) {
            console.log('[AgentBrain] Matched: Add channel/placement', addMatch[1]);
            let channelStr = addMatch[1].toLowerCase();
            let channel: any;
            let networkName: string | undefined;
            let programName: string | undefined;

            const tvNetworks = ['espn', 'espn2', 'cbs', 'nbc', 'abc', 'fox', 'cnn', 'msnbc', 'hgtv', 'discovery', 'tlc', 'bravo', 'tnt', 'netflix', 'hulu', 'amazon', 'disney', 'hbo', 'apple', 'paramount', 'peacock', 'youtube', 'roku', 'tubi', 'pluto', 'f1', 'dazn', 'sling', 'nfl', 'nba', 'mlb', 'nhl'];

            if (tvNetworks.includes(channelStr)) {
                channel = 'TV';
                // Special handling for sports leagues to be more descriptive
                if (['nfl', 'nba', 'mlb', 'nhl', 'f1'].includes(channelStr)) {
                    networkName = 'Sports Network';
                    programName = channelStr.toUpperCase();
                } else {
                    networkName = channelStr;
                }

                const networkPattern = new RegExp(`add\\s+${channelStr}\\s+(.+)`, 'i');
                const programMatch = input.match(networkPattern);
                if (programMatch) {
                    programName = programMatch[1].trim();
                }
            } else {
                if (channelStr === 'tv') channel = 'TV';
                else if (channelStr === 'ooh') channel = 'OOH';
                else channel = channelStr.charAt(0).toUpperCase() + channelStr.slice(1);
            }

            const p = generateLine(channel, this.context.mediaPlan!.campaign.advertiser, networkName, programName);

            const alloc = Math.max(5000, this.context.mediaPlan!.campaign.budget * 0.05);
            if (p.costMethod === 'CPM') {
                p.quantity = Math.floor((alloc * 1000) / p.rate);
                p.totalCost = (p.quantity * p.rate) / 1000;
            } else if (p.costMethod === 'Spot' || p.costMethod === 'Flat') {
                p.quantity = Math.max(1, Math.floor(alloc / p.rate));
                p.totalCost = p.quantity * p.rate;
            } else {
                p.quantity = Math.floor(alloc / p.rate);
                p.totalCost = p.quantity * p.rate;
            }

            // Ensure placements array exists
            if (!this.context.mediaPlan!.campaign.placements) {
                this.context.mediaPlan!.campaign.placements = [];
            }

            this.context.mediaPlan!.campaign.placements.push(p);
            this.context.mediaPlan!.totalSpend += p.totalCost;
            this.context.mediaPlan!.remainingBudget = this.context.mediaPlan!.campaign.budget - this.context.mediaPlan!.totalSpend;

            // Recalculate metrics
            this.context.mediaPlan!.metrics = calculatePlanMetrics(this.context.mediaPlan!.campaign.placements);

            const displayName = channel === 'TV' && p.vendor && p.adUnit
                ? `${p.vendor} - ${p.adUnit}`
                : (networkName
                    ? `${networkName}${programName ? ` - ${programName}` : ''}`
                    : channel);

            responseContent = `I've added a new **${displayName}** placement for $${p.totalCost.toLocaleString()}.\\n\\nCurrent Spend: $${this.context.mediaPlan!.totalSpend.toLocaleString()}`;
            suggestedActions = ['Add another channel', 'Looks good', 'Export PDF'];
            return this.createAgentMessage(responseContent, suggestedActions);
        }

        // Check for show names without network
        const showOnlyMatch = lowerInput.match(/^add\s+(.+)$/i);
        if (showOnlyMatch) {
            const programName = showOnlyMatch[1].trim();
            const channel = 'TV';
            const p = generateLine(channel, this.context.mediaPlan!.campaign.advertiser, undefined, programName);

            const alloc = Math.max(5000, this.context.mediaPlan!.campaign.budget * 0.05);
            if (p.costMethod === 'CPM') {
                p.quantity = Math.floor((alloc * 1000) / p.rate);
                p.totalCost = (p.quantity * p.rate) / 1000;
            } else if (p.costMethod === 'Spot' || p.costMethod === 'Flat') {
                p.quantity = Math.max(1, Math.floor(alloc / p.rate));
                p.totalCost = p.quantity * p.rate;
            } else {
                p.quantity = Math.floor(alloc / p.rate);
                p.totalCost = p.quantity * p.rate;
            }

            if (!this.context.mediaPlan!.campaign.placements) {
                this.context.mediaPlan!.campaign.placements = [];
            }
            this.context.mediaPlan!.campaign.placements.push(p);
            this.context.mediaPlan!.totalSpend += p.totalCost;
            this.context.mediaPlan!.remainingBudget = this.context.mediaPlan!.campaign.budget - this.context.mediaPlan!.totalSpend;

            // Recalculate metrics
            this.context.mediaPlan!.metrics = calculatePlanMetrics(this.context.mediaPlan!.campaign.placements);

            const displayName = p.vendor && p.adUnit
                ? `${p.vendor} - ${p.adUnit}`
                : 'TV';

            responseContent = `I've added a new **${displayName}** placement for $${p.totalCost.toLocaleString()}.\\n\\nCurrent Spend: $${this.context.mediaPlan!.totalSpend.toLocaleString()}`;
            suggestedActions = ['Add another channel', 'Looks good', 'Export PDF'];
            return this.createAgentMessage(responseContent, suggestedActions);
        }

        // 2. Change Budget
        if (lowerInput.includes('budget')) {
            const budgetMatch = input.match(/\$?(\d+(?:,\d{3})*(?:\.\d+)?)\s*([kK]|[mM]{1,2})?/);
            if (budgetMatch) {
                const rawValue = parseFloat(budgetMatch[1].replace(/,/g, ''));
                const suffix = (budgetMatch[2] || '').toLowerCase();
                let newBudget = rawValue;

                if (suffix.startsWith('m')) {
                    newBudget = rawValue * 1000000;
                } else if (suffix.startsWith('k')) {
                    newBudget = rawValue * 1000;
                }

                this.context.mediaPlan!.campaign.budget = newBudget;
                this.context.mediaPlan!.remainingBudget = newBudget - this.context.mediaPlan!.totalSpend;
                responseContent = `Updated total budget to **$${newBudget.toLocaleString()}**. You have $${this.context.mediaPlan!.remainingBudget.toLocaleString()} remaining.`;
                suggestedActions = ['Add TV', 'Export PDF'];
                return this.createAgentMessage(responseContent, suggestedActions);
            }
        }

        // 3. Change Dates
        if (lowerInput.includes('date') || lowerInput.includes('run from') || lowerInput.includes('delay')) {
            if (lowerInput.includes('delay')) {
                const oldStart = new Date(this.context.mediaPlan!.campaign.startDate);
                oldStart.setMonth(oldStart.getMonth() + 1);
                this.context.mediaPlan!.campaign.startDate = oldStart.toISOString().split('T')[0];
                responseContent = "I've shifted the campaign start date by 1 month.";
            } else {
                responseContent = "I've updated the flight dates. (Note: For this prototype, please use 'Delay start' to shift dates).";
            }
            suggestedActions = ['Delay start by 1 month', 'Export PDF'];
            return this.createAgentMessage(responseContent, suggestedActions);
        }

        // 4. Pause Specific Items (by row or name)
        const pauseRowMatch = lowerInput.match(/pause\s+(?:row\s+)?(\d+)/i);
        const pauseNameMatch = lowerInput.match(/pause\s+(.+?)(?:\s+and|\s*$)/i);

        // Only process pause if NOT unpause/resume
        if ((pauseRowMatch || pauseNameMatch) && !lowerInput.includes('unpause') && !lowerInput.includes('resume')) {
            let pausedCount = 0;
            let pausedItems: string[] = [];

            if (pauseRowMatch) {
                // Pause by row number
                const rowNum = parseInt(pauseRowMatch[1]);
                if (this.context.mediaPlan!.campaign.placements && rowNum > 0 && rowNum <= this.context.mediaPlan!.campaign.placements.length) {
                    const placement = this.context.mediaPlan!.campaign.placements[rowNum - 1];
                    if (placement.performance) {
                        placement.performance.status = 'PAUSED';
                        pausedItems.push(`Row #${rowNum} (${placement.vendor})`);
                        pausedCount++;
                    }
                }
            } else if (pauseNameMatch) {
                // Pause by name/vendor
                const searchTerm = pauseNameMatch[1].toLowerCase().trim();
                this.context.mediaPlan!.campaign.placements?.forEach((p, idx) => {
                    if (p.vendor?.toLowerCase().includes(searchTerm) || p.name?.toLowerCase().includes(searchTerm)) {
                        if (p.performance) {
                            p.performance.status = 'PAUSED';
                            pausedItems.push(`${p.vendor || p.name}`);
                            pausedCount++;
                        }
                    }
                });
            }

            if (pausedCount > 0) {
                responseContent = `I've paused ${pausedCount} placement(s): ${pausedItems.join(', ')}.`;
                suggestedActions = ['Resume placements', 'Export PDF'];
                return this.createAgentMessage(responseContent, suggestedActions);
            } else {
                responseContent = "I couldn't find any matching placements to pause. Please check the row number or name.";
                suggestedActions = ['Show Details'];
                return this.createAgentMessage(responseContent, suggestedActions);
            }
        }

        // 4b. Resume/Unpause Specific Items (by row or name)
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

        // 6. Grouping / Views
        if (lowerInput.includes('group') || lowerInput.includes('summary') || lowerInput.includes('detail') || lowerInput.includes('segment') || lowerInput.includes('line item') || lowerInput.includes('placement') || lowerInput.includes('flat')) {
            if (lowerInput.includes('detail') || lowerInput.includes('segment') || lowerInput.includes('line item') || lowerInput.includes('placement') || lowerInput.includes('flat')) {
                this.context.mediaPlan!.groupingMode = 'DETAILED';
                responseContent = "Switched to **Detailed View** (Line Items).";
            } else {
                this.context.mediaPlan!.groupingMode = 'CHANNEL_SUMMARY';
                responseContent = "Switched to **Channel Summary View**. Data is now aggregated by channel.";
            }
            suggestedActions = ['Show Details', 'Show Channel Summary', 'Export PDF'];
            return this.createAgentMessage(responseContent, suggestedActions);
        }

        // 7. Modify Segment by Row
        const segmentMatch = lowerInput.match(/row\s+(\d+).*?segment.*?to\s+(.+)/i) || lowerInput.match(/change\s+segment.*?(\d+).*?to\s+(.+)/i);
        if (segmentMatch) {
            const rowNum = parseInt(segmentMatch[1]);
            const newSegment = segmentMatch[2].replace(/['"]/g, '').trim();

            if (this.context.mediaPlan!.campaign.placements && rowNum > 0 && rowNum <= this.context.mediaPlan!.campaign.placements.length) {
                const placement = this.context.mediaPlan!.campaign.placements[rowNum - 1];
                const oldSegment = placement.segment;
                placement.segment = newSegment;

                const displaySegment = newSegment.charAt(0).toUpperCase() + newSegment.slice(1);
                placement.segment = displaySegment;

                responseContent = `Updated Row #${rowNum} (${placement.vendor}): Changed segment from "${oldSegment}" to "**${displaySegment}**".`;
                suggestedActions = ['Change another segment', 'Export PDF'];
                return this.createAgentMessage(responseContent, suggestedActions);
            } else {
                responseContent = `I couldn't find Row #${rowNum}. Please check the table and try again.`;
                return this.createAgentMessage(responseContent, ['Show Details']);
            }
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
            const offlineChannels = ['TV', 'Radio', 'OOH', 'Print'] as const;
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

    private createAgentMessage(content: string, suggestedActions: string[], action?: AgentMessage['action']): AgentMessage {
        return {
            id: Date.now().toString(),
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

    private handleInventoryQuery(query: string): AgentMessage {
        const lowerQuery = query.toLowerCase();

        // Sports programming
        if (lowerQuery.includes('sports') && (lowerQuery.includes('tv') || lowerQuery.includes('program') || lowerQuery.includes('show'))) {
            console.log('[AgentBrain] Matched: Sports TV inventory');
            return this.createAgentMessage(
                "**📺 Available Sports Programming:**\n\n" +
                "**ESPN:**\n" +
                "• SportsCenter (2-5M viewers)\n" +
                "• Monday Night Football (12-15M viewers)\n" +
                "• NBA on ESPN (3-6M viewers)\n\n" +
                "**Fox Sports:**\n" +
                "• NFL on Fox (15-20M viewers)\n" +
                "• UEFA Champions League (2-4M viewers)\n\n" +
                "**NBC Sports:**\n" +
                "• Sunday Night Football (18-22M viewers)\n" +
                "• Premier League (1-3M viewers)",
                ['Add ESPN Monday Night Football', 'Add NFL Sunday slot']
            );
        }

        // News programming
        if ((lowerQuery.includes('news') || lowerQuery.includes('current events')) && (lowerQuery.includes('program') || lowerQuery.includes('show') || lowerQuery.includes('available') || lowerQuery.includes('avail'))) {
            console.log('[AgentBrain] Matched: News TV inventory');
            return this.createAgentMessage(
                "**📰 Available News Programming:**\n\n" +
                "**Cable News:**\n" +
                "• CNN Prime Time (1-3M viewers)\n" +
                "• Fox News Tonight (3-5M viewers)\n" +
                "• MSNBC Evening (1.5-2.5M viewers)\n\n" +
                "**Broadcast News:**\n" +
                "• NBC Nightly News (6-8M viewers)\n" +
                "• ABC World News Tonight (7-9M viewers)\n" +
                "• CBS Evening News (5-6M viewers)\n\n" +
                "**Morning Shows:**\n" +
                "• Today Show (3-4M viewers)\n" +
                "• Good Morning America (3.5-4.5M viewers)\n" +
                "• CBS Mornings (2.5-3M viewers)",
                ['Add CNN Prime', 'Add NBC Nightly News']
            );
        }

        // Drama series
        if ((lowerQuery.includes('drama') || lowerQuery.includes('series')) && (lowerQuery.includes('show') || lowerQuery.includes('program') || lowerQuery.includes('available') || lowerQuery.includes('avail'))) {
            console.log('[AgentBrain] Matched: Drama TV inventory');
            return this.createAgentMessage(
                "**🎬 Available Drama Programming:**\n\n" +
                "**Network Drama:**\n" +
                "• Law & Order SVU - NBC (4-6M viewers)\n" +
                "• Chicago Fire - NBC (6-8M viewers)\n" +
                "• FBI - CBS (6-7M viewers)\n" +
                "• The Rookie - ABC (4-5M viewers)\n\n" +
                "**Streaming Originals:**\n" +
                "• Stranger Things - Netflix\n" +
                "• The Bear - Hulu\n" +
                "• Yellowstone - Paramount+\n" +
                "• House of the Dragon - HBO Max",
                ['Add Law & Order SVU', 'Add Yellowstone']
            );
        }

        // Comedy programming
        if ((lowerQuery.includes('comedy') || lowerQuery.includes('sitcom')) && (lowerQuery.includes('show') || lowerQuery.includes('program') || lowerQuery.includes('available') || lowerQuery.includes('avail'))) {
            console.log('[AgentBrain] Matched: Comedy TV inventory');
            return this.createAgentMessage(
                "**😂 Available Comedy Programming:**\n\n" +
                "**Network Comedy:**\n" +
                "• Abbott Elementary - ABC (3-4M viewers)\n" +
                "• Young Sheldon - CBS (6-8M viewers)\n" +
                "• The Conners - ABC (3-4M viewers)\n\n" +
                "**Late Night:**\n" +
                "• The Tonight Show - NBC (1.5-2M viewers)\n" +
                "• Jimmy Kimmel Live - ABC (1.8-2.3M viewers)\n" +
                "• The Late Show - CBS (2-2.5M viewers)\n\n" +
                "**Streaming:**\n" +
                "• Ted Lasso - Apple TV+\n" +
                "• Only Murders in the Building - Hulu",
                ['Add Abbott Elementary', 'Add Tonight Show']
            );
        }

        // Reality TV
        if ((lowerQuery.includes('reality') || lowerQuery.includes('competition')) && (lowerQuery.includes('show') || lowerQuery.includes('program') || lowerQuery.includes('available') || lowerQuery.includes('avail'))) {
            console.log('[AgentBrain] Matched: Reality TV inventory');
            return this.createAgentMessage(
                "**⭐ Available Reality Programming:**\n\n" +
                "**Competition Shows:**\n" +
                "• The Voice - NBC (6-8M viewers)\n" +
                "• American Idol - ABC (5-6M viewers)\n" +
                "• Survivor - CBS (6-7M viewers)\n" +
                "• The Masked Singer - Fox (5-6M viewers)\n\n" +
                "**Lifestyle/Home:**\n" +
                "• Fixer Upper - HGTV (2-3M viewers)\n" +
                "• Property Brothers - HGTV (1.5-2M viewers)\n\n" +
                "**Dating/Social:**\n" +
                "• The Bachelor - ABC (4-5M viewers)\n" +
                "• Love Island - Peacock",
                ['Add The Voice', 'Add Survivor']
            );
        }

        // Kids/Family programming
        if ((lowerQuery.includes('kids') || lowerQuery.includes('family') || lowerQuery.includes('children')) && (lowerQuery.includes('show') || lowerQuery.includes('program') || lowerQuery.includes('available') || lowerQuery.includes('avail'))) {
            console.log('[AgentBrain] Matched: Kids/Family TV inventory');
            return this.createAgentMessage(
                "**👨‍👩‍👧‍👦 Available Kids/Family Programming:**\n\n" +
                "**Preschool:**\n" +
                "• Sesame Street - PBS\n" +
                "• Bluey - Disney Jr (1-2M viewers)\n" +
                "• Daniel Tiger - PBS\n\n" +
                "**Kids 6-11:**\n" +
                "• SpongeBob - Nickelodeon (1.5-2M viewers)\n" +
                "• Paw Patrol - Nickelodeon (1-1.5M viewers)\n\n" +
                "**Family Prime:**\n" +
                "• America's Funniest Home Videos - ABC (3-4M viewers)\n" +
                "• The Simpsons - Fox (2-3M viewers)",
                ['Add Bluey', 'Add SpongeBob']
            );
        }

        // Documentary/Educational
        if ((lowerQuery.includes('documentary') || lowerQuery.includes('educational') || lowerQuery.includes('nature')) && (lowerQuery.includes('show') || lowerQuery.includes('program') || lowerQuery.includes('available') || lowerQuery.includes('avail'))) {
            console.log('[AgentBrain] Matched: Documentary TV inventory');
            return this.createAgentMessage(
                "**🌍 Available Documentary Programming:**\n\n" +
                "**Nature/Science:**\n" +
                "• Planet Earth - Discovery/BBC\n" +
                "• Our Planet - Netflix\n" +
                "• Cosmos - National Geographic\n\n" +
                "**True Crime:**\n" +
                "• Dateline NBC (3-4M viewers)\n" +
                "• 48 Hours - CBS (2-3M viewers)\n\n" +
                "**Educational:**\n" +
                "• NOVA - PBS\n" +
                "• How It's Made - Discovery",
                ['Add Planet Earth', 'Add Dateline']
            );
        }

        // DOOH inventory
        if (lowerQuery.includes('dooh') || lowerQuery.includes('outdoor') || lowerQuery.includes('billboard')) {
            // Airport-specific queries (airport codes only)
            // Note: We check these first and return early
            if (lowerQuery.includes('dfw') && !lowerQuery.includes('dallas')) {
                console.log('[AgentBrain] Matched: DOOH DFW Airport only');
                return this.createAgentMessage(
                    "**✈️ DOOH Inventory - DFW Airport:**\n\n" +
                    "**Clear Channel Airports:**\n" +
                    "• DFW Terminal Network (280 screens, 18M monthly impr)\n" +
                    "• Baggage Claim Displays (85 screens, 6M impr)\n\n" +
                    "**JCDecaux Airport:**\n" +
                    "• Gate Area Screens (120 screens, 8M impr)\n" +
                    "• Concourse Digital (65 screens, 4.5M impr)",
                    ['Add DFW Airport DOOH']
                );
            }

            if (lowerQuery.includes('ord') && !lowerQuery.includes('chicago')) {
                console.log('[AgentBrain] Matched: DOOH ORD Airport only');
                return this.createAgentMessage(
                    "**✈️ DOOH Inventory - O'Hare Airport (ORD):**\n\n" +
                    "**Clear Channel Airports:**\n" +
                    "• ORD Terminal Network (350 screens, 22M monthly impr)\n" +
                    "• United Concourse (140 screens, 12M impr)\n\n" +
                    "**JCDecaux Airport:**\n" +
                    "• International Terminal (95 screens, 8M impr)\n" +
                    "• Baggage & Arrivals (78 screens, 5.5M impr)",
                    ['Add ORD Airport DOOH']
                );
            }

            if (lowerQuery.includes('lax') && !lowerQuery.includes('los angeles')) {
                console.log('[AgentBrain] Matched: DOOH LAX Airport only');
                return this.createAgentMessage(
                    "**✈️ DOOH Inventory - LAX Airport:**\n\n" +
                    "**Clear Channel Airports:**\n" +
                    "• LAX Terminal Network (320 screens, 16M monthly impr)\n" +
                    "• Tom Bradley International (110 screens, 9M impr)\n\n" +
                    "**Outfront Airport:**\n" +
                    "• Arrivals Hall (95 screens, 6.5M impr)\n" +
                    "• Curbside Digital (68 screens, 4M impr)",
                    ['Add LAX Airport DOOH']
                );
            }

            if (lowerQuery.includes('atl') && !lowerQuery.includes('atlanta')) {
                console.log('[AgentBrain] Matched: DOOH ATL Airport only');
                return this.createAgentMessage(
                    "**✈️ DOOH Inventory - ATL Airport:**\n\n" +
                    "**Clear Channel Airports:**\n" +
                    "• ATL Terminal Network (420 screens, 28M monthly impr)\n" +
                    "• Domestic Concourses (185 screens, 15M impr)\n\n" +
                    "**JCDecaux Airport:**\n" +
                    "• International Terminal (125 screens, 9M impr)\n" +
                    "• Baggage Claim (95 screens, 6.5M impr)",
                    ['Add ATL Airport DOOH']
                );
            }

            if ((lowerQuery.includes('jfk') || lowerQuery.includes('lga') || lowerQuery.includes('ewr')) && !lowerQuery.includes('new york') && !lowerQuery.includes('nyc')) {
                console.log('[AgentBrain] Matched: DOOH NYC Airports only');
                return this.createAgentMessage(
                    "**✈️ DOOH Inventory - NYC Airports:**\n\n" +
                    "**JFK Airport:**\n" +
                    "• Terminal Network (285 screens, 20M monthly impr)\n\n" +
                    "**Newark (EWR):**\n" +
                    "• Terminal Network (195 screens, 14M impr)\n\n" +
                    "**LaGuardia (LGA):**\n" +
                    "• New Terminal Network (165 screens, 11M impr)",
                    ['Add JFK Airport DOOH']
                );
            }

            if (lowerQuery.includes('mia') && !lowerQuery.includes('miami')) {
                console.log('[AgentBrain] Matched: DOOH MIA Airport only');
                return this.createAgentMessage(
                    "**✈️ DOOH Inventory - MIA Airport:**\n\n" +
                    "**Clear Channel Airports:**\n" +
                    "• MIA Terminal Network (185 screens, 14M monthly impr)\n" +
                    "• Concourse D-E (78 screens, 6M impr)\n\n" +
                    "**JCDecaux Airport:**\n" +
                    "• International Arrivals (65 screens, 5M impr)",
                    ['Add MIA Airport DOOH']
                );
            }

            if (lowerQuery.includes('icn') && !lowerQuery.includes('seoul') && !lowerQuery.includes('korea')) {
                console.log('[AgentBrain] Matched: DOOH ICN Airport only');
                return this.createAgentMessage(
                    "**✈️ DOOH Inventory - Incheon Airport (ICN):**\n\n" +
                    "**JCDecaux Korea:**\n" +
                    "• ICN Terminal 1 (145 screens, 12M monthly impr)\n" +
                    "• ICN Terminal 2 (95 screens, 8M impr)\n\n" +
                    "**Clear Channel Korea:**\n" +
                    "• Arrivals Hall (68 screens, 5.5M impr)",
                    ['Add ICN Airport DOOH']
                );
            }

            // City-wide queries (includes airport in totals)
            if (lowerQuery.includes('seoul') || lowerQuery.includes('korea')) {
                console.log('[AgentBrain] Matched: DOOH Seoul/Korea city-wide');
                return this.createAgentMessage(
                    "**🌏 DOOH Inventory - Seoul (City-Wide):**\n\n" +
                    "**Clear Channel Korea:**\n" +
                    "• Gangnam Station (120 screens, 2.5M monthly impr)\n" +
                    "• Seoul Station Hub (85 screens, 1.8M impr)\n" +
                    "• Incheon Airport (ICN) (68 screens, 5.5M impr)\n\n" +
                    "**JCDecaux Korea:**\n" +
                    "• Hongdae District (150 screens, 1.9M impr)\n" +
                    "• Coex Mall (45 screens, 800K impr)\n" +
                    "• ICN Terminals (240 screens, 20M impr)\n\n" +
                    "**Total: 708 screens, 32.5M monthly impressions**",
                    ['Add Gangnam Station DOOH', 'Add ICN Airport']
                );
            }

            if (lowerQuery.includes('new york') || lowerQuery.includes('nyc')) {
                console.log('[AgentBrain] Matched: DOOH NYC city-wide');
                return this.createAgentMessage(
                    "**🗽 DOOH Inventory - NYC (City-Wide):**\n\n" +
                    "**Clear Channel:**\n" +
                    "• Times Square (25 screens, 15M monthly impr)\n" +
                    "• Penn Station (180 screens, 4.5M impr)\n" +
                    "• JFK/EWR/LGA Airports (645 screens, 45M impr)\n\n" +
                    "**Outfront Media:**\n" +
                    "• MTA Subway (4,500+ screens, 25M impr)\n" +
                    "• LinkNYC Kiosks (1,750 screens, 12M impr)\n\n" +
                    "**Total: 7,100+ screens, 101.5M monthly impressions**",
                    ['Add Times Square DOOH', 'Add MTA Subway']
                );
            }

            if (lowerQuery.includes('los angeles') || (lowerQuery.includes('la ') || lowerQuery.includes(' la'))) {
                console.log('[AgentBrain] Matched: DOOH LA city-wide');
                return this.createAgentMessage(
                    "**🌴 DOOH Inventory - Los Angeles (City-Wide):**\n\n" +
                    "**Clear Channel:**\n" +
                    "• Hollywood Blvd (85 screens, 8M monthly impr)\n" +
                    "• Sunset Strip (45 screens, 5M impr)\n" +
                    "• LAX Airport (320 screens, 16M impr)\n\n" +
                    "**Outfront Media:**\n" +
                    "• Metro Network (1,200 screens, 15M impr)\n\n" +
                    "**JCDecaux:**\n" +
                    "• Beach Cities (180 screens, 6M impr)\n\n" +
                    "**Total: 1,830 screens, 50M monthly impressions**",
                    ['Add Hollywood Blvd DOOH', 'Add LAX Airport']
                );
            }

            if (lowerQuery.includes('dallas')) {
                console.log('[AgentBrain] Matched: DOOH Dallas city-wide');
                return this.createAgentMessage(
                    "**🤠 DOOH Inventory - Dallas/Fort Worth (City-Wide):**\n\n" +
                    "**Clear Channel:**\n" +
                    "• DFW Airport (280 screens, 18M monthly impr)\n" +
                    "• Downtown Dallas (65 screens, 4.5M impr)\n\n" +
                    "**Outfront Media:**\n" +
                    "• DART Rail Network (450 screens, 8M impr)\n" +
                    "• Highway Digital Bulletins (220 screens, 12M impr)\n\n" +
                    "**JCDecaux:**\n" +
                    "• DFW Terminals (185 screens, 12.5M impr)\n\n" +
                    "**Total: 1,200 screens, 55M monthly impressions**",
                    ['Add DFW Airport DOOH', 'Add Downtown Dallas']
                );
            }

            if (lowerQuery.includes('chicago')) {
                console.log('[AgentBrain] Matched: DOOH Chicago city-wide');
                return this.createAgentMessage(
                    "**🏙️ DOOH Inventory - Chicago (City-Wide):**\n\n" +
                    "**Clear Channel:**\n" +
                    "• O'Hare Airport (ORD) (350 screens, 22M monthly impr)\n" +
                    "• Loop District (95 screens, 6M impr)\n\n" +
                    "**Outfront Media:**\n" +
                    "• CTA Train Network (2,100 screens, 18M impr)\n" +
                    "• Michigan Avenue (120 screens, 8M impr)\n\n" +
                    "**JCDecaux:**\n" +
                    "• ORD International (95 screens, 8M impr)\n\n" +
                    "**Total: 2,760 screens, 62M monthly impressions**",
                    ['Add ORD Airport DOOH', 'Add CTA Network']
                );
            }

            if (lowerQuery.includes('atlanta')) {
                console.log('[AgentBrain] Matched: DOOH Atlanta city-wide');
                return this.createAgentMessage(
                    "**🍑 DOOH Inventory - Atlanta (City-Wide):**\n\n" +
                    "**Clear Channel:**\n" +
                    "• ATL Airport (420 screens, 28M monthly impr)\n" +
                    "• Midtown Atlanta (75 screens, 5M impr)\n\n" +
                    "**Outfront Media:**\n" +
                    "• MARTA Network (850 screens, 12M impr)\n" +
                    "• Perimeter Highway (180 screens, 9M impr)\n\n" +
                    "**JCDecaux:**\n" +
                    "• ATL International (125 screens, 9M impr)\n\n" +
                    "**Total: 1,650 screens, 63M monthly impressions**",
                    ['Add ATL Airport DOOH', 'Add MARTA Network']
                );
            }

            if (lowerQuery.includes('miami')) {
                console.log('[AgentBrain] Matched: DOOH Miami city-wide');
                return this.createAgentMessage(
                    "**🌺 DOOH Inventory - Miami (City-Wide):**\n\n" +
                    "**Clear Channel:**\n" +
                    "• MIA Airport (185 screens, 14M monthly impr)\n" +
                    "• South Beach (95 screens, 6.5M impr)\n\n" +
                    "**Outfront Media:**\n" +
                    "• Brickell Financial (65 screens, 4M impr)\n" +
                    "• I-95 Corridor (140 screens, 8M impr)\n\n" +
                    "**JCDecaux:**\n" +
                    "• MIA International (65 screens, 5M impr)\n\n" +
                    "**Total: 550 screens, 37.5M monthly impressions**",
                    ['Add MIA Airport DOOH', 'Add South Beach']
                );
            }

            return this.createAgentMessage(
                "**🌍 DOOH Available in:**\n\n" +
                "• New York (7,000+ screens)\n" +
                "• Los Angeles (5,500+ screens)\n" +
                "• Seoul (2,100+ screens)\n" +
                "• Tokyo (6,500+ screens)\n\n" +
                "Try asking about a specific city!",
                ['Show New York DOOH', 'Show Seoul DOOH']
            );
        }

        // Vertical video
        if ((lowerQuery.includes('vertical') || lowerQuery.includes('9:16')) && lowerQuery.includes('video')) {
            return this.createAgentMessage(
                "**📱 Vertical Video Options:**\n\n" +
                "**Social:**\n" +
                "• TikTok (up to 60s, 9:16)\n" +
                "• Instagram Reels (up to 90s, 9:16)\n" +
                "• Instagram Stories (15s, 9:16)\n" +
                "• Snapchat (up to 60s, 9:16)\n" +
                "• YouTube Shorts (up to 60s, 9:16)\n\n" +
                "**Best for engagement:** TikTok & Instagram Reels",
                ['Add TikTok vertical video', 'Add Instagram Reels']
            );
        }

        return this.createAgentMessage(
            "I can help you find inventory! Try:\n\n" +
            "• 'What sports programming is available?'\n" +
            "• 'What DOOH is in [city]?'\n" +
            "• 'Where can I run vertical video?'",
            ['Show sports programming']
        );
    }

    private handleDMAQuery(query: string): AgentMessage | null {
        const dma = getDMAByCity(query);

        if (dma) {
            const stationList = dma.stations.map(s =>
                `• **${s.callSign}** (${s.network}) - Ch ${s.channel}${s.owner ? ` [${s.owner}]` : ''}`
            ).join('\n');

            const suggestions = dma.stations.slice(0, 2).map(s => `Add ${s.callSign} (${s.network})`);

            return this.createAgentMessage(
                `**📺 Broadcast Stations - ${dma.name} (Rank #${dma.rank}):**\n\n${stationList}`,
                suggestions
            );
        }
        return null;
    }
}

