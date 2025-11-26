
import { Campaign, MediaPlan, AgentMessage, Placement, Brand, AgentInfo, AgentExecution } from '../types';
import { generateCampaign, generateLine, calculatePlanMetrics, SAMPLE_AGENTS, generateId } from './dummyData';
import { DMA_DATA, getDMAByCity } from './dmaData';

export type AgentState = 'INIT' | 'BUDGETING' | 'CHANNEL_SELECTION' | 'REFINEMENT' | 'OPTIMIZATION' | 'FINISHED';

interface AgentContext {
    state: AgentState;
    mediaPlan: MediaPlan | null;
    history: AgentMessage[];
    agents: AgentInfo[];
    executions: AgentExecution[];
}

export class AgentBrain {
    private context: AgentContext;

    constructor() {
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

    getContext() {
        return this.context;
    }

    processInput(input: string): AgentMessage {
        const userMsg: AgentMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: Date.now()
        };
        this.context.history.push(userMsg);

        let responseContent = '';
        let suggestedActions: string[] = [];
        let agentMsg: AgentMessage | null = null;

        // GLOBAL: Layout Commands (work regardless of media plan state)
        const layoutMatch = input.toLowerCase().match(/(?:switch to|change to|set layout to|layout)\s+(left|right|bottom)/i);
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
                action: `LAYOUT_${position} ` as any
            };
            this.context.history.push(agentMsg);
            return agentMsg;
        }

        // 1. GLOBAL COMMANDS (Available whenever a plan exists)
        if (this.context.mediaPlan) {
            agentMsg = this.handleGlobalCommands(input);
            if (agentMsg) {
                this.context.history.push(agentMsg);
                return agentMsg;
            }
        }

        // 2. STATE-SPECIFIC LOGIC
        switch (this.context.state) {
            case 'INIT':
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
                    activeCampaigns: 1
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

        // 1. Add Channel
        const addMatch = lowerInput.match(/add\s+(search|social|display|tv|radio|ooh|print|espn|cbs|nbc|abc|fox|cnn|msnbc|hgtv|discovery|tlc|bravo|tnt|netflix|hulu|amazon|disney|hbo|apple|paramount|peacock|youtube|roku|tubi|pluto|f1|dazn|sling)/i);

        if (addMatch) {
            console.log('[AgentBrain] Matched: Add channel/placement', addMatch[1]);
            let channelStr = addMatch[1].toLowerCase();
            let channel: any;
            let networkName: string | undefined;
            let programName: string | undefined;

            const tvNetworks = ['espn', 'espn2', 'cbs', 'nbc', 'abc', 'fox', 'cnn', 'msnbc', 'hgtv', 'discovery', 'tlc', 'bravo', 'tnt', 'netflix', 'hulu', 'amazon', 'disney', 'hbo', 'apple', 'paramount', 'peacock', 'youtube', 'roku', 'tubi', 'pluto', 'f1', 'dazn', 'sling'];

            if (tvNetworks.includes(channelStr)) {
                channel = 'TV';
                networkName = channelStr;

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

