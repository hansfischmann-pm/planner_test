import { Campaign, MediaPlan, AgentMessage, Placement } from '../types';
import { createDummyCampaign, generatePlacement } from './dummyData';

export type AgentState = 'INIT' | 'BUDGETING' | 'CHANNEL_SELECTION' | 'REFINEMENT' | 'FINISHED';

interface AgentContext {
    state: AgentState;
    mediaPlan: MediaPlan | null;
    history: AgentMessage[];
}

export class AgentBrain {
    private context: AgentContext;

    constructor() {
        this.context = {
            state: 'INIT',
            mediaPlan: null,
            history: [{
                id: 'welcome',
                role: 'agent',
                content: "Welcome to the OmniChannel Media Planner. I'm your AI assistant. To get started, tell me the Client Name and Total Budget for your new campaign.",
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

        // Simple State Machine
        switch (this.context.state) {
            case 'INIT':
                // Naive parsing for demo purposes
                const budgetMatch = input.match(/\$?(\d+)[kK]?/);
                const budget = budgetMatch ? parseInt(budgetMatch[1]) * (input.toLowerCase().includes('k') ? 1000 : 1) : 100000;
                const clientName = input.split(' ')[3] || 'Client'; // Very naive

                this.context.mediaPlan = {
                    campaign: createDummyCampaign(clientName, budget),
                    totalSpend: 0,
                    remainingBudget: budget,
                    version: 1
                };
                this.context.state = 'BUDGETING';
                responseContent = `Great! I've initialized a campaign for **${clientName}** with a budget of **$${budget.toLocaleString()}**. \n\nHow would you like to allocate this budget across channels? I recommend a 70/20/10 split for balanced growth.`;
                suggestedActions = ['Apply 70/20/10 Rule', 'Focus on Digital Only', 'Focus on Brand Awareness (TV/OOH)'];
                break;

            case 'BUDGETING':
                if (input.toLowerCase().includes('70/20/10')) {
                    responseContent = "Applying the 70/20/10 rule: 70% to proven channels (Search, Social), 20% to safe bets (Display), and 10% to experimental.\n\nShall I generate the placements now?";
                    suggestedActions = ['Yes, generate placements', 'No, adjust manually'];
                } else if (input.toLowerCase().includes('digital')) {
                    responseContent = "Understood. Focusing 100% on digital channels (Search, Social, Display). Shall I generate placements?";
                    suggestedActions = ['Yes, generate placements'];
                } else {
                    responseContent = "I've noted your preference. I'll draft a plan based on that. Ready to see the placements?";
                    suggestedActions = ['Show me the plan'];
                }
                this.context.state = 'CHANNEL_SELECTION';
                break;

            case 'CHANNEL_SELECTION':
                if (this.context.mediaPlan) {
                    // Generate some dummy placements
                    const p1 = generatePlacement(this.context.mediaPlan.campaign.id, 'Search');
                    const p2 = generatePlacement(this.context.mediaPlan.campaign.id, 'Social');
                    const p3 = generatePlacement(this.context.mediaPlan.campaign.id, 'Display');

                    // Adjust quantities to fit budget roughly
                    const targetBudget = this.context.mediaPlan.campaign.budget;
                    p1.quantity = Math.floor((targetBudget * 0.4) / p1.rate); // 40% Search (CPC)
                    p1.totalCost = p1.quantity * p1.rate;

                    p2.quantity = Math.floor(((targetBudget * 0.4) * 1000) / p2.rate); // 40% Social (CPM)
                    p2.totalCost = (p2.quantity * p2.rate) / 1000;

                    p3.quantity = Math.floor(((targetBudget * 0.2) * 1000) / p3.rate); // 20% Display
                    p3.totalCost = (p3.quantity * p3.rate) / 1000;

                    this.context.mediaPlan.campaign.placements = [p1, p2, p3];
                    this.context.mediaPlan.totalSpend = p1.totalCost + p2.totalCost + p3.totalCost;
                    this.context.mediaPlan.remainingBudget = this.context.mediaPlan.campaign.budget - this.context.mediaPlan.totalSpend;
                }

                responseContent = "I've generated a draft media plan. You can see the details in the visualizer panel.\n\nNotice that Search is taking up a large portion. Would you like to optimize for lower CPM?";
                suggestedActions = ['Optimize for Reach (Lower CPM)', 'Optimize for Conversions', 'Looks good'];
                this.context.state = 'REFINEMENT';
                break;

            case 'REFINEMENT':
                if (input.toLowerCase().includes('reach') || input.toLowerCase().includes('cpm')) {
                    responseContent = "Optimizing for Reach... I've shifted budget from Search to Display and Social, which have lower CPMs.";
                    // Logic to shift budget would go here
                } else if (input.toLowerCase().includes('export')) {
                    responseContent = "Generating your PDF export now... The file should download automatically.";
                    suggestedActions = ['Start New Campaign'];
                    this.context.state = 'FINISHED';

                    const agentMsg: AgentMessage = {
                        id: Date.now().toString(),
                        role: 'agent',
                        content: responseContent,
                        timestamp: Date.now(),
                        suggestedActions,
                        action: 'EXPORT_PDF'
                    };
                    this.context.history.push(agentMsg);
                    return agentMsg;
                } else {
                    responseContent = "Excellent. The plan is locked. You can export it or make further manual tweaks.";
                    suggestedActions = ['Export to PDF', 'Start New Campaign'];
                }
                // Stay in REFINEMENT until finished or exported
                break;

            case 'FINISHED':
                if (input.toLowerCase().includes('export')) {
                    responseContent = "Generating your PDF export now...";
                    suggestedActions = ['Start New Campaign'];
                    const agentMsg: AgentMessage = {
                        id: Date.now().toString(),
                        role: 'agent',
                        content: responseContent,
                        timestamp: Date.now(),
                        suggestedActions,
                        action: 'EXPORT_PDF'
                    };
                    this.context.history.push(agentMsg);
                    return agentMsg;
                }
                this.context.state = 'INIT';
                responseContent = "Starting a new session. Who is the client?";
                suggestedActions = ['Create plan for Nike ($500k)'];
                break;
        }

        const agentMsg: AgentMessage = {
            id: Date.now().toString(),
            role: 'agent',
            content: responseContent,
            timestamp: Date.now(),
            suggestedActions
        };

        this.context.history.push(agentMsg);
        return agentMsg;
    }
}
