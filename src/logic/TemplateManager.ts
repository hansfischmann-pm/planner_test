/**
 * TemplateManager - Handles campaign template commands
 *
 * This module extracts template-related commands from AgentBrain,
 * including listing, explaining, and recommending templates.
 */

import { AgentMessage } from '../types';
import { createAgentMessage, AgentContext } from './AgentContext';
import { CAMPAIGN_TEMPLATES } from './campaignTemplates';

export interface TemplateCommandResult {
    handled: boolean;
    response?: AgentMessage;
}

/**
 * Check if input is a template-related command
 */
export function isTemplateCommand(input: string): boolean {
    return input.toLowerCase().includes('template');
}

/**
 * Handle showing/listing all templates
 */
function handleShowTemplates(): AgentMessage {
    let responseContent = `${CAMPAIGN_TEMPLATES.length} templates available:\n\n`;

    CAMPAIGN_TEMPLATES.forEach(template => {
        responseContent += `${template.icon} **${template.name}** — $${(template.recommendedBudget.optimal / 1000).toFixed(0)}k optimal\n`;
        responseContent += `   ${template.channelMix.map(m => m.channel).join(', ')}\n\n`;
    });

    responseContent += `Say "tell me about [name]" or "what's best for B2B?" for details.`;

    return createAgentMessage(responseContent, [
        'What\'s best for B2B?',
        'What\'s best for retail?',
        'Use Template'
    ]);
}

/**
 * Handle explaining a specific template
 */
function handleExplainTemplate(input: string): AgentMessage | null {
    const lowerInput = input.toLowerCase();
    const templateKeywords = ['retail holiday', 'b2b lead gen', 'brand launch', 'performance max', 'local store', 'mobile app'];

    const matchedTemplate = CAMPAIGN_TEMPLATES.find(t =>
        templateKeywords.some(name => lowerInput.includes(name)) &&
        lowerInput.includes(t.name.toLowerCase().split(' ')[0])
    );

    if (!matchedTemplate) return null;

    const t = matchedTemplate;
    let responseContent = `${t.icon} **${t.name}**\n\n`;
    responseContent += `${t.description}\n\n`;
    responseContent += `**Budget:** $${(t.recommendedBudget.min / 1000).toFixed(0)}k–$${(t.recommendedBudget.max / 1000).toFixed(0)}k (optimal $${(t.recommendedBudget.optimal / 1000).toFixed(0)}k)\n\n`;
    responseContent += `**Channels:** ${t.channelMix.map(m => `${m.channel} (${m.percentage}%)`).join(', ')}\n\n`;

    // Condense goals
    const goalParts: string[] = [];
    if (t.defaultGoals.impressions) goalParts.push(`${(t.defaultGoals.impressions / 1000000).toFixed(1)}M impressions`);
    if (t.defaultGoals.reach) goalParts.push(`${(t.defaultGoals.reach / 1000).toFixed(0)}k reach`);
    if (t.defaultGoals.conversions) goalParts.push(`${t.defaultGoals.conversions.toLocaleString()} conversions`);
    if (goalParts.length) responseContent += `**Default Goals:** ${goalParts.join(', ')}`;

    return createAgentMessage(responseContent, ['Use this template', 'Show all templates']);
}

/**
 * Handle recommendation requests ("what's best for...")
 */
function handleTemplateRecommendation(input: string): AgentMessage | null {
    const lowerInput = input.toLowerCase();

    if (!lowerInput.includes('best for') && !lowerInput.includes('recommend')) {
        return null;
    }

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

    if (!recommendation) return null;

    const r = recommendation;
    const responseContent = `I'd use **${r.icon} ${r.name}** — ${r.description.toLowerCase()}\n\n` +
        `${r.channelMix.length} channels (${r.channelMix.slice(0, 3).map(m => m.channel).join(', ')}), ` +
        `$${(r.recommendedBudget.optimal / 1000).toFixed(0)}k optimal budget.\n\n` +
        `Want to use this template?`;

    return createAgentMessage(responseContent, ['Use Template', 'Show all templates']);
}

/**
 * Main entry point for template commands
 */
export function handleTemplateCommand(input: string, _context: AgentContext): TemplateCommandResult {
    const lowerInput = input.toLowerCase();

    // Handle "Use Template" / "Use this template" - opens template library
    if (lowerInput.includes('use template') || lowerInput === 'use this template') {
        const msg = createAgentMessage(
            "Opening the template library...",
            ['Show all templates']
        );
        msg.action = 'OPEN_TEMPLATE_LIBRARY' as any;
        return {
            handled: true,
            response: msg
        };
    }

    // Handle "Show me templates" or "List templates"
    if (lowerInput.includes('show') || lowerInput.includes('list') || lowerInput.includes('browse') || lowerInput.includes('what') || lowerInput.includes('available')) {
        return {
            handled: true,
            response: handleShowTemplates()
        };
    }

    // Handle "Tell me about [template]" or "What's the [template] template?"
    const explainResponse = handleExplainTemplate(input);
    if (explainResponse) {
        return {
            handled: true,
            response: explainResponse
        };
    }

    // Handle "What's best for [industry/goal]?"
    const recommendResponse = handleTemplateRecommendation(input);
    if (recommendResponse) {
        return {
            handled: true,
            response: recommendResponse
        };
    }

    // Template keyword present but no specific action matched
    return { handled: false };
}

export const templateManager = {
    isTemplateCommand,
    handleTemplateCommand
};
