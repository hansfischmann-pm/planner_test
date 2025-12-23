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
    let responseContent = "**Campaign Templates**\n\nI have 6 pre-configured templates to help you get started quickly:\n\n";

    CAMPAIGN_TEMPLATES.forEach(template => {
        responseContent += `${template.icon} **${template.name}**\n`;
        responseContent += `   ${template.description}\n`;
        responseContent += `   - Budget: $${(template.recommendedBudget.optimal / 1000).toFixed(0)}k (optimal)\n`;
        responseContent += `   - Channels: ${template.channelMix.map(m => m.channel).join(', ')}\n\n`;
    });

    responseContent += "To use a template, click the **Use Template** button in the campaign list or say \"create campaign from [template name]\".";

    return createAgentMessage(responseContent, [
        'Use Template',
        'Tell me about the Retail Holiday template',
        'What\'s best for B2B?'
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

    let responseContent = `**${matchedTemplate.icon} ${matchedTemplate.name}**\n\n`;
    responseContent += `${matchedTemplate.description}\n\n`;
    responseContent += `**Recommended Budget:** $${(matchedTemplate.recommendedBudget.min / 1000).toFixed(0)}k - $${(matchedTemplate.recommendedBudget.max / 1000).toFixed(0)}k (optimal: $${(matchedTemplate.recommendedBudget.optimal / 1000).toFixed(0)}k)\n\n`;
    responseContent += `**Channel Mix:**\n`;
    matchedTemplate.channelMix.forEach(mix => {
        responseContent += `- ${mix.channel} (${mix.percentage}%): ${mix.rationale}\n`;
    });
    responseContent += `\n**Default Goals:**\n`;
    if (matchedTemplate.defaultGoals.impressions) responseContent += `- Impressions: ${matchedTemplate.defaultGoals.impressions.toLocaleString()}\n`;
    if (matchedTemplate.defaultGoals.reach) responseContent += `- Reach: ${matchedTemplate.defaultGoals.reach.toLocaleString()}\n`;
    if (matchedTemplate.defaultGoals.conversions) responseContent += `- Conversions: ${matchedTemplate.defaultGoals.conversions.toLocaleString()}\n`;

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

    const responseContent = `Based on your requirements, I recommend the **${recommendation.icon} ${recommendation.name}** template.\n\n${recommendation.description}\n\nThis template is optimized with:\n- ${recommendation.channelMix.length} channels including ${recommendation.channelMix.slice(0, 3).map(m => m.channel).join(', ')}\n- Recommended budget: $${(recommendation.recommendedBudget.optimal / 1000).toFixed(0)}k\n- Complexity: ${recommendation.complexity}\n\nClick **Use Template** in the campaign list to get started!`;

    return createAgentMessage(responseContent, ['Use Template', 'Show all templates']);
}

/**
 * Main entry point for template commands
 */
export function handleTemplateCommand(input: string, _context: AgentContext): TemplateCommandResult {
    const lowerInput = input.toLowerCase();

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
