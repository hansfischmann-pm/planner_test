/**
 * AttributionManager - Handles attribution analysis commands
 *
 * This module extracts attribution-related commands from AgentBrain,
 * including model comparison, incrementality testing, and analysis views.
 */

import { AgentMessage, MediaPlan, Brand } from '../types';
import { createAgentMessage, WindowContext } from './AgentContext';
import { findMatchingCommand } from './CommandRegistry';

export interface AttributionContext {
    windowContext?: WindowContext;
    mediaPlan?: MediaPlan | null;
    brand?: Brand | null;
}

export interface AttributionCommandResult {
    handled: boolean;
    response?: AgentMessage;
}

/**
 * Check if we have a campaign context (required for most attribution commands)
 */
function hasCampaignContext(context: AttributionContext): boolean {
    return !!(
        context.windowContext?.campaignId ||
        context.mediaPlan ||
        (context.brand?.campaigns && context.brand.campaigns.length > 0)
    );
}

/**
 * Handle attribution commands (Phase 2 - Attribution + Chat Integration)
 * Returns null if the input doesn't match any attribution command
 */
export function handleAttributionCommand(input: string, context: AttributionContext): AgentMessage | null {
    const match = findMatchingCommand(input);
    if (!match || match.command.category !== 'ATTRIBUTION') {
        return null;
    }

    const { command } = match;
    let responseContent = '';
    let action: string | undefined;
    let suggestedActions: string[] = [];
    const hasCampaign = hasCampaignContext(context);

    switch (command.id) {
        // --- Navigation Commands ---
        case 'open_attribution':
            if (!hasCampaign) {
                responseContent = "To view attribution analysis, please select a campaign first.";
                suggestedActions = ['Show campaigns', 'Open portfolio'];
            } else {
                action = 'OPEN_ATTRIBUTION';
                responseContent = "Opening the Attribution dashboard.";
                suggestedActions = ['Compare models', 'Show incrementality', 'View time analysis'];
            }
            break;

        case 'open_attribution_overview':
            if (!hasCampaign) {
                responseContent = "Please select a campaign to view attribution overview.";
                suggestedActions = ['Show campaigns'];
            } else {
                action = 'OPEN_ATTRIBUTION_OVERVIEW';
                responseContent = "Opening Attribution Overview with channel breakdown and conversion paths.";
                suggestedActions = ['Change model', 'View time analysis', 'Compare models'];
            }
            break;

        case 'open_incrementality':
            if (!hasCampaign) {
                responseContent = "Please select a campaign to view incrementality testing.";
                suggestedActions = ['Show campaigns'];
            } else {
                action = 'OPEN_ATTRIBUTION_INCREMENTALITY';
                responseContent = "Opening Incrementality Testing. Here you can set up holdout tests to measure true channel lift.";
                suggestedActions = ['Create new test', 'Explain incrementality', 'View overview'];
            }
            break;

        case 'open_time_analysis':
            if (!hasCampaign) {
                responseContent = "Please select a campaign to view time analysis.";
                suggestedActions = ['Show campaigns'];
            } else {
                action = 'OPEN_ATTRIBUTION_TIME';
                responseContent = "Opening Time Analysis. This shows how long it takes users to convert after their first touchpoint.";
                suggestedActions = ['View frequency', 'Compare models', 'Show overview'];
            }
            break;

        case 'open_frequency_analysis':
            if (!hasCampaign) {
                responseContent = "Please select a campaign to view touchpoint frequency.";
                suggestedActions = ['Show campaigns'];
            } else {
                action = 'OPEN_ATTRIBUTION_FREQUENCY';
                responseContent = "Opening Touchpoint Frequency analysis. This shows how many interactions users typically have before converting.";
                suggestedActions = ['View time analysis', 'Show overview', 'Compare models'];
            }
            break;

        case 'open_model_comparison':
            if (!hasCampaign) {
                responseContent = "Please select a campaign to compare attribution models.";
                suggestedActions = ['Show campaigns'];
            } else {
                action = 'OPEN_ATTRIBUTION_MODELS';
                responseContent = "Opening Model Comparison. Compare how different attribution models allocate credit across your channels.";
                suggestedActions = ['Explain models', 'View overview', 'Show incrementality'];
            }
            break;

        // --- Pop-out Commands ---
        case 'popout_attribution_view': {
            const viewMatch = input.match(/(?:pop\s*out|open|detach|separate)\s+(?:the\s+)?(overview|incrementality|time|frequency|model)/i);
            const viewType = viewMatch?.[1]?.toLowerCase();

            if (!hasCampaign) {
                responseContent = "Please select a campaign first to pop out attribution views.";
                suggestedActions = ['Show campaigns'];
            } else {
                const viewMap: Record<string, string> = {
                    'overview': 'POPOUT_ATTRIBUTION_OVERVIEW',
                    'incrementality': 'POPOUT_ATTRIBUTION_INCREMENTALITY',
                    'time': 'POPOUT_ATTRIBUTION_TIME',
                    'frequency': 'POPOUT_ATTRIBUTION_FREQUENCY',
                    'model': 'POPOUT_ATTRIBUTION_MODELS'
                };
                action = viewMap[viewType || 'overview'];
                responseContent = `Opening ${viewType || 'overview'} in a new window. You can now compare this view side-by-side with other windows.`;
                suggestedActions = ['Pop out another view', 'Tile windows', 'Show overview'];
            }
            break;
        }

        // --- Model Commands ---
        case 'change_attribution_model': {
            const modelMatch = input.match(/(first[- ]?touch|last[- ]?touch|linear|time[- ]?decay|position[- ]?based)/i);
            const modelName = modelMatch?.[1]?.toLowerCase().replace(/[- ]/g, '_').toUpperCase();

            if (!hasCampaign) {
                responseContent = "Please select a campaign first to change the attribution model.";
                suggestedActions = ['Show campaigns', 'Open attribution'];
            } else {
                const modelDisplayNames: Record<string, string> = {
                    'FIRST_TOUCH': 'First Touch',
                    'LAST_TOUCH': 'Last Touch',
                    'LINEAR': 'Linear',
                    'TIME_DECAY': 'Time Decay',
                    'POSITION_BASED': 'Position Based'
                };
                const displayName = modelDisplayNames[modelName || 'LINEAR'] || 'Linear';
                action = `SET_ATTRIBUTION_MODEL_${modelName || 'LINEAR'}`;
                responseContent = `Switched to **${displayName}** attribution model.\n\n`;

                // Add model-specific explanation
                switch (modelName) {
                    case 'FIRST_TOUCH':
                        responseContent += "This model gives 100% credit to the first interaction. It's useful for understanding which channels introduce customers to your brand.";
                        break;
                    case 'LAST_TOUCH':
                        responseContent += "This model gives 100% credit to the last interaction before conversion. It highlights which channels close the deal.";
                        break;
                    case 'LINEAR':
                        responseContent += "This model distributes credit equally across all touchpoints. It values every interaction in the customer journey.";
                        break;
                    case 'TIME_DECAY':
                        responseContent += "This model gives more credit to recent interactions using a 7-day half-life. Recent touchpoints are weighted more heavily.";
                        break;
                    case 'POSITION_BASED':
                        responseContent += "This model gives 40% credit to the first touch, 40% to the last, and distributes 20% among middle interactions.";
                        break;
                }
                suggestedActions = ['Compare models', 'Show overview', 'Explain model differences'];
            }
            break;
        }

        case 'explain_attribution_model': {
            const modelMatch = input.match(/(first[- ]?touch|last[- ]?touch|linear|time[- ]?decay|position[- ]?based)/i);
            const modelName = modelMatch?.[1]?.toLowerCase().replace(/[- ]/g, ' ');

            if (input.match(/difference|compare/i)) {
                // User wants to understand differences between models
                responseContent = `**Attribution Model Comparison**\n\n` +
                    `| Model | Best For | Limitation |\n` +
                    `|-------|----------|------------|\n` +
                    `| **First Touch** | Awareness campaigns | Ignores conversion-driving channels |\n` +
                    `| **Last Touch** | Performance campaigns | Ignores awareness-building |\n` +
                    `| **Linear** | Balanced view | May overvalue minor touchpoints |\n` +
                    `| **Time Decay** | Short sales cycles | May undervalue early awareness |\n` +
                    `| **Position Based** | Balanced awareness + conversion | Arbitrary 40/40/20 split |\n\n` +
                    `For most campaigns, I recommend starting with **Linear** for a balanced view, then comparing with **Position Based** to see how first/last touch channels differ.`;
                suggestedActions = ['Compare models', 'Switch to linear', 'Show model comparison'];
            } else {
                // Explain specific model
                const explanations: Record<string, string> = {
                    'first touch': `**First Touch Attribution**\n\nThis model assigns 100% of the conversion credit to the first interaction a customer has with your brand.\n\n**When to use:**\n- Measuring brand awareness effectiveness\n- Understanding which channels introduce new customers\n- Top-of-funnel optimization\n\n**Example:** If a customer sees a Display ad, then clicks a Search ad, then converts via Email, Display gets 100% credit.`,
                    'last touch': `**Last Touch Attribution**\n\nThis model assigns 100% of the conversion credit to the final interaction before conversion.\n\n**When to use:**\n- Performance-focused campaigns\n- When you need to optimize for immediate conversions\n- Simple ROI calculations\n\n**Example:** If a customer sees a Display ad, then clicks a Search ad, then converts via Email, Email gets 100% credit.`,
                    'linear': `**Linear Attribution**\n\nThis model distributes conversion credit equally across all touchpoints in the customer journey.\n\n**When to use:**\n- When all interactions are considered equally valuable\n- For a balanced view of the full funnel\n- Understanding multi-channel journeys\n\n**Example:** If there are 4 touchpoints, each receives 25% credit.`,
                    'time decay': `**Time Decay Attribution**\n\nThis model gives more credit to touchpoints closer to the conversion, using a half-life decay (typically 7 days).\n\n**When to use:**\n- Short sales cycles\n- When recent interactions likely have more influence\n- B2C with quick purchase decisions\n\n**Example:** A touchpoint 1 day before conversion gets more credit than one from 2 weeks ago.`,
                    'position based': `**Position-Based Attribution** (U-Shaped)\n\nThis model gives 40% credit to the first touch, 40% to the last touch, and distributes the remaining 20% among middle interactions.\n\n**When to use:**\n- Valuing both awareness and conversion\n- When first impression and final decision are key moments\n- Balanced multi-touch analysis\n\n**Example:** In a 5-touchpoint journey, first and last each get 40%, and the 3 middle touchpoints share 20%.`
                };
                responseContent = explanations[modelName || 'linear'] || explanations['linear'];
                suggestedActions = [`Switch to ${modelName || 'linear'}`, 'Compare all models', 'Show overview'];
            }
            break;
        }

        // --- Incrementality Commands ---
        case 'create_incrementality_test': {
            const channelMatch = input.match(/test\s+(?:for\s+)?(\w+)|(\w+)\s+test/i);
            const channel = channelMatch?.[1] || channelMatch?.[2];

            if (!hasCampaign) {
                responseContent = "Please select a campaign first to create an incrementality test.";
                suggestedActions = ['Show campaigns'];
            } else {
                action = channel ? `CREATE_INCREMENTALITY_TEST_${channel.toUpperCase()}` : 'OPEN_INCREMENTALITY_FORM';
                responseContent = channel
                    ? `I'll help you set up an incrementality test for **${channel}**.\n\nTo measure true lift, we'll create a holdout group that doesn't see ${channel} ads. I recommend:\n- **Test duration:** 2-4 weeks for statistical significance\n- **Holdout size:** 10-20% of your audience\n\nOpening the test creation form...`
                    : `Let's set up an incrementality test to measure true channel lift.\n\nI'll open the test creation form where you can:\n1. Select the channel to test\n2. Define test and control group parameters\n3. Set the test duration\n\nWhat channel would you like to test?`;
                suggestedActions = channel
                    ? ['Start test', 'Explain incrementality', 'View existing tests']
                    : ['Test Search', 'Test Social', 'Test Display', 'Explain incrementality'];
            }
            break;
        }

        case 'view_test_results': {
            if (!hasCampaign) {
                responseContent = "Please select a campaign first to view test results.";
                suggestedActions = ['Show campaigns'];
            } else {
                action = 'OPEN_ATTRIBUTION_INCREMENTALITY';
                responseContent = "Opening the Incrementality Testing panel to view your test results.";
                suggestedActions = ['Create new test', 'Explain lift', 'View overview'];
            }
            break;
        }

        // --- Analysis Commands ---
        case 'analyze_channel_attribution': {
            const channelMatch = input.match(/(?:how|what)\s+(?:is|are)\s+(\w+)\s+(?:performing|doing|attributed)/i) ||
                                input.match(/(?:analyze|show)\s+(?:me\s+)?(\w+)\s+(?:attribution|performance)/i);
            const channel = channelMatch?.[1];
            const openerCloserMatch = input.match(/(?:best|top)\s+(opener|closer)/i);

            if (!hasCampaign) {
                responseContent = "Please select a campaign first to analyze channel attribution.";
                suggestedActions = ['Show campaigns', 'Open attribution'];
            } else if (openerCloserMatch) {
                const role = openerCloserMatch[1].toLowerCase();
                action = 'OPEN_ATTRIBUTION_OVERVIEW';
                responseContent = role === 'opener'
                    ? "To find your best **opener** channels, let's look at **First Touch** attribution. Channels that introduce customers to your brand will show highest credit.\n\nOpening the Attribution Overview..."
                    : "To find your best **closer** channels, let's look at **Last Touch** attribution. Channels that drive final conversions will show highest credit.\n\nOpening the Attribution Overview...";
                suggestedActions = ['Switch to first touch', 'Switch to last touch', 'Compare models'];
            } else if (channel) {
                action = 'ANALYZE_CHANNEL';
                responseContent = `Analyzing **${channel}** performance across attribution models...\n\nI'll show you how ${channel} performs as both an opener (first touch) and closer (last touch), along with its overall contribution.`;
                suggestedActions = ['Compare models', 'View conversion paths', 'Show overview'];
            } else {
                action = 'OPEN_ATTRIBUTION_OVERVIEW';
                responseContent = "Opening Attribution Overview to analyze channel performance.";
                suggestedActions = ['Which channel is best opener', 'Which channel is best closer', 'Compare models'];
            }
            break;
        }

        case 'show_conversion_paths':
            if (!hasCampaign) {
                responseContent = "Please select a campaign first to view conversion paths.";
                suggestedActions = ['Show campaigns'];
            } else {
                action = 'OPEN_ATTRIBUTION_OVERVIEW';
                responseContent = "Opening Attribution Overview to show conversion paths.\n\nThe **Sankey diagram** shows how customers flow through channels, and you'll see the **top conversion paths** that lead to purchases.";
                suggestedActions = ['View time analysis', 'View frequency', 'Compare models'];
            }
            break;

        case 'attribution_insights':
            if (!hasCampaign) {
                responseContent = "Please select a campaign first to get attribution insights.";
                suggestedActions = ['Show campaigns'];
            } else {
                action = 'SHOW_ATTRIBUTION_INSIGHTS';
                responseContent = "Analyzing your attribution data for insights...\n\n**Key Recommendations:**\n\n" +
                    "1. **Compare first-touch vs last-touch** to identify if you have dedicated \"opener\" and \"closer\" channels\n" +
                    "2. **Check time-to-conversion** - if most conversions happen quickly, prioritize last-touch channels\n" +
                    "3. **Review touchpoint frequency** - high-frequency paths suggest the need for multi-channel presence\n" +
                    "4. **Run incrementality tests** on your top-spending channels to validate true lift\n\n" +
                    "Would you like me to dive deeper into any of these areas?";
                suggestedActions = ['Compare models', 'View time analysis', 'Create incrementality test', 'Show overview'];
            }
            break;

        // --- Help Commands ---
        case 'explain_incrementality':
            responseContent = `**Incrementality Testing** (also called Lift Testing)\n\n` +
                `Incrementality measures the **true causal impact** of your marketing by comparing:\n` +
                `- **Test Group:** Users who see your ads\n` +
                `- **Control Group:** Users who don't see your ads (holdout)\n\n` +
                `**Why it matters:**\n` +
                `Attribution models show correlation, but incrementality shows causation. A channel might get high attribution credit, but some of those conversions would have happened anyway.\n\n` +
                `**Key metrics:**\n` +
                `- **Lift:** The % increase in conversions from the test group vs control\n` +
                `- **Confidence:** Statistical certainty (aim for >90%)\n` +
                `- **iROAS:** Incremental Return on Ad Spend\n\n` +
                `A good incrementality test typically runs 2-4 weeks with a 10-20% holdout.`;
            suggestedActions = ['Create incrementality test', 'View test results', 'Open incrementality panel'];
            break;

        case 'attribution_help':
            responseContent = `**Attribution Analysis Help**\n\n` +
                `Here's what you can do in the Attribution dashboard:\n\n` +
                `**Overview**\n` +
                `- View channel attribution breakdown\n` +
                `- See conversion path visualizations (Sankey diagram)\n` +
                `- Switch between 5 attribution models\n\n` +
                `**Incrementality Testing**\n` +
                `- Set up A/B holdout tests\n` +
                `- Measure true channel lift\n` +
                `- Validate attribution assumptions\n\n` +
                `**Analysis Views**\n` +
                `- Time Analysis: How long until conversion\n` +
                `- Frequency: Touchpoints before conversion\n` +
                `- Model Comparison: Compare all models side-by-side\n\n` +
                `**Try saying:**\n` +
                `- "Compare attribution models"\n` +
                `- "Which channel is the best opener?"\n` +
                `- "Set up a holdout test for Search"\n` +
                `- "Switch to time decay model"`;
            suggestedActions = ['Show overview', 'Compare models', 'Explain incrementality', 'Create test'];
            break;

        default:
            return null;
    }

    return createAgentMessage(responseContent, suggestedActions, action as any);
}

export const attributionManager = {
    handleAttributionCommand
};
