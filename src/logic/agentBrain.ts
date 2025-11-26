import { Campaign, MediaPlan, AgentMessage, Placement, Brand, AgentInfo, AgentExecution } from '../types';
import { generateCampaign, generateLine, generateId, calculatePlanMetrics, SAMPLE_AGENTS } from './dummyData';

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
            responseContent = `I've switched the layout to **${layoutMatch[1]}** position.`;
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
                newCampaign.remainingBudget = budget; // Add this if needed, but Campaign doesn't have remainingBudget, MediaPlan does

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

        // 1. Add Channel
        const addMatch = lowerInput.match(/add\s+(search|social|display|tv|radio|ooh|print|espn|cbs|nbc|abc|fox|cnn|msnbc|hgtv|discovery|tlc|bravo|tnt|netflix|hulu|amazon|disney|hbo|apple|paramount|peacock|youtube|roku|tubi|pluto|f1|dazn|sling)/i);

        if (addMatch) {
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
}
