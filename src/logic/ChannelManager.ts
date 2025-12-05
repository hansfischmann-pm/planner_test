/**
 * ChannelManager - Handles channel and placement operations
 *
 * This module extracts channel/placement management from AgentBrain,
 * including adding, pausing, resuming, and modifying placements.
 */

import { AgentMessage } from '../types';
import { createAgentMessage, AgentContext } from './AgentContext';
import { generateLine, calculatePlanMetrics } from './dummyData';
import { generateBatchPlacements } from '../utils/placementGenerator';
import { actionHistory } from '../utils/actionHistory';

/**
 * Unsupported channels that should be rejected with helpful error messages
 */
const UNSUPPORTED_CHANNELS = [
    'print', 'newspaper', 'magazine', 'direct mail', 'mailer', 'flyer',
    'email', 'sms', 'text message', 'telemarketing', 'cold call',
    'billboard', 'cinema', 'movie theater'  // Note: OOH supports digital billboards
];

/**
 * TV Networks that trigger TV channel placements
 */
const TV_NETWORKS = [
    'espn', 'espn2', 'cbs', 'nbc', 'abc', 'fox', 'cnn', 'msnbc', 'hgtv',
    'discovery', 'tlc', 'bravo', 'tnt', 'netflix', 'hulu', 'amazon prime',
    'disney', 'hbo', 'apple tv', 'paramount', 'peacock', 'roku',
    'tubi', 'pluto', 'f1', 'dazn', 'sling', 'nfl', 'nba', 'mlb', 'nhl'
];

/**
 * Social platforms that trigger Social channel placements
 */
const SOCIAL_PLATFORMS = [
    'meta', 'facebook', 'instagram', 'tiktok', 'snapchat', 'snap',
    'twitter', 'x', 'linkedin', 'pinterest', 'reddit', 'threads'
];

/**
 * Search platforms
 */
const SEARCH_PLATFORMS = ['google', 'google ads', 'bing', 'bing ads', 'microsoft', 'microsoft ads', 'yahoo', 'yahoo ads'];

/**
 * Display/Programmatic platforms
 */
const DISPLAY_PLATFORMS = ['dv360', 'thetradedesk', 'ttd', 'amazon dsp', 'xandr', 'mediamath'];

/**
 * Streaming Audio platforms (music streaming)
 */
const STREAMING_AUDIO_PLATFORMS = ['spotify', 'pandora', 'sonos', 'amazon music', 'apple music', 'deezer', 'tidal'];

/**
 * Podcast platforms
 */
const PODCAST_PLATFORMS = ['spotify podcasts', 'apple podcasts', 'megaphone', 'acast', 'art19', 'podbean', 'libsyn', 'simplecast'];

/**
 * Place-based Audio (in-store, retail media)
 */
const PLACE_BASED_AUDIO = ['vibenomics', 'mood media', 'mood', 'rockbot', 'soundtrack your brand'];

/**
 * Traditional Radio (broadcast & satellite)
 */
const RADIO_PLATFORMS = ['iheartradio', 'siriusxm', 'sirius', 'audacy', 'cumulus', 'kroq', 'kiis', 'entercom'];

/**
 * Video platforms (non-TV)
 */
const VIDEO_PLATFORMS = ['youtube', 'vimeo', 'twitch'];

/**
 * Sports leagues that need special handling
 */
const SPORTS_LEAGUES = ['nfl', 'nba', 'mlb', 'nhl', 'f1'];

/**
 * Channel mapping for batch generation
 */
import { PlacementTemplate } from '../utils/placementGenerator';

const CHANNEL_MAP: Record<string, PlacementTemplate['channel']> = {
    'ctv': 'TV',
    'connected tv': 'Connected TV',
    'linear tv': 'Linear TV',
    'tv': 'TV',
    'social': 'Social',
    'display': 'Display',
    'search': 'Search',
    'audio': 'Audio',
    'streaming audio': 'Streaming Audio',
    'podcast': 'Podcast',
    'podcasts': 'Podcast',
    'place-based': 'Place-based Audio',
    'place-based audio': 'Place-based Audio',
    'in-store': 'Place-based Audio',
    'radio': 'Radio',
    'video': 'TV',
    'native': 'Display',
    'ooh': 'OOH'
};

/**
 * Determine channel type from vendor name
 */
function getChannelFromVendor(vendor: string): { channel: string; vendorName: string } {
    const lowerVendor = vendor.toLowerCase();

    if (SOCIAL_PLATFORMS.includes(lowerVendor)) {
        // Capitalize vendor name properly
        const vendorName = lowerVendor === 'meta' ? 'Meta' :
                          lowerVendor === 'facebook' ? 'Facebook' :
                          lowerVendor === 'instagram' ? 'Instagram' :
                          lowerVendor === 'tiktok' ? 'TikTok' :
                          lowerVendor === 'snapchat' || lowerVendor === 'snap' ? 'Snapchat' :
                          lowerVendor === 'twitter' || lowerVendor === 'x' ? 'X (Twitter)' :
                          lowerVendor === 'linkedin' ? 'LinkedIn' :
                          lowerVendor === 'pinterest' ? 'Pinterest' :
                          lowerVendor === 'reddit' ? 'Reddit' :
                          lowerVendor === 'threads' ? 'Threads' :
                          vendor;
        return { channel: 'Social', vendorName };
    }

    if (SEARCH_PLATFORMS.includes(lowerVendor)) {
        const vendorName = lowerVendor === 'google' || lowerVendor === 'google ads' ? 'Google Ads' :
                          lowerVendor === 'bing' || lowerVendor === 'bing ads' || lowerVendor === 'microsoft' || lowerVendor === 'microsoft ads' ? 'Microsoft Ads' :
                          lowerVendor === 'yahoo' || lowerVendor === 'yahoo ads' ? 'Yahoo Ads' :
                          vendor;
        return { channel: 'Search', vendorName };
    }

    if (DISPLAY_PLATFORMS.includes(lowerVendor)) {
        const vendorName = lowerVendor === 'dv360' ? 'DV360' :
                          lowerVendor === 'thetradedesk' || lowerVendor === 'ttd' ? 'The Trade Desk' :
                          lowerVendor === 'amazon dsp' ? 'Amazon DSP' :
                          lowerVendor === 'xandr' ? 'Xandr' :
                          lowerVendor === 'mediamath' ? 'MediaMath' :
                          vendor;
        return { channel: 'Display', vendorName };
    }

    // Streaming Audio (music streaming services)
    if (STREAMING_AUDIO_PLATFORMS.includes(lowerVendor)) {
        const vendorName = lowerVendor === 'spotify' ? 'Spotify' :
                          lowerVendor === 'pandora' ? 'Pandora' :
                          lowerVendor === 'sonos' ? 'Sonos' :
                          lowerVendor === 'amazon music' ? 'Amazon Music' :
                          lowerVendor === 'apple music' ? 'Apple Music' :
                          lowerVendor === 'deezer' ? 'Deezer' :
                          lowerVendor === 'tidal' ? 'Tidal' :
                          vendor;
        return { channel: 'Streaming Audio', vendorName };
    }

    // Podcast platforms
    if (PODCAST_PLATFORMS.includes(lowerVendor)) {
        const vendorName = lowerVendor === 'spotify podcasts' ? 'Spotify Podcasts' :
                          lowerVendor === 'apple podcasts' ? 'Apple Podcasts' :
                          lowerVendor === 'megaphone' ? 'Megaphone' :
                          lowerVendor === 'acast' ? 'Acast' :
                          lowerVendor === 'art19' ? 'Art19' :
                          lowerVendor === 'podbean' ? 'Podbean' :
                          lowerVendor === 'libsyn' ? 'Libsyn' :
                          lowerVendor === 'simplecast' ? 'Simplecast' :
                          vendor;
        return { channel: 'Podcast', vendorName };
    }

    // Place-based Audio (in-store, retail)
    if (PLACE_BASED_AUDIO.includes(lowerVendor)) {
        const vendorName = lowerVendor === 'vibenomics' ? 'Vibenomics' :
                          lowerVendor === 'mood media' || lowerVendor === 'mood' ? 'Mood Media' :
                          lowerVendor === 'rockbot' ? 'Rockbot' :
                          lowerVendor === 'soundtrack your brand' ? 'Soundtrack Your Brand' :
                          vendor;
        return { channel: 'Place-based Audio', vendorName };
    }

    // Traditional Radio (broadcast & satellite)
    if (RADIO_PLATFORMS.includes(lowerVendor)) {
        const vendorName = lowerVendor === 'iheartradio' ? 'iHeartRadio' :
                          lowerVendor === 'siriusxm' || lowerVendor === 'sirius' ? 'SiriusXM' :
                          lowerVendor === 'audacy' ? 'Audacy' :
                          lowerVendor === 'cumulus' ? 'Cumulus' :
                          lowerVendor === 'kroq' ? 'KROQ' :
                          lowerVendor === 'kiis' ? 'KIIS-FM' :
                          lowerVendor === 'entercom' ? 'Entercom' :
                          vendor;
        return { channel: 'Radio', vendorName };
    }

    if (VIDEO_PLATFORMS.includes(lowerVendor)) {
        const vendorName = lowerVendor === 'youtube' ? 'YouTube' :
                          lowerVendor === 'vimeo' ? 'Vimeo' :
                          lowerVendor === 'twitch' ? 'Twitch' :
                          vendor;
        return { channel: 'TV', vendorName };  // Maps to TV channel type (digital video)
    }

    // Check if any TV network is mentioned (allows for "ESPN SportsCenter", "CBS 60 Minutes", etc.)
    for (const network of TV_NETWORKS) {
        if (lowerVendor.includes(network)) {
            // Capitalize network name
            const networkName = network === 'espn' ? 'ESPN' :
                               network === 'espn2' ? 'ESPN2' :
                               network === 'cbs' ? 'CBS' :
                               network === 'nbc' ? 'NBC' :
                               network === 'abc' ? 'ABC' :
                               network === 'fox' ? 'FOX' :
                               network === 'cnn' ? 'CNN' :
                               network === 'msnbc' ? 'MSNBC' :
                               network === 'hgtv' ? 'HGTV' :
                               network === 'discovery' ? 'Discovery' :
                               network === 'tlc' ? 'TLC' :
                               network === 'bravo' ? 'Bravo' :
                               network === 'tnt' ? 'TNT' :
                               network === 'netflix' ? 'Netflix' :
                               network === 'hulu' ? 'Hulu' :
                               network === 'amazon prime' ? 'Amazon Prime' :
                               network === 'disney' ? 'Disney' :
                               network === 'hbo' ? 'HBO' :
                               network === 'apple tv' ? 'Apple TV' :
                               network === 'paramount' ? 'Paramount+' :
                               network === 'peacock' ? 'Peacock' :
                               network === 'roku' ? 'Roku' :
                               network === 'tubi' ? 'Tubi' :
                               network === 'pluto' ? 'Pluto' :
                               network === 'f1' ? 'F1 TV' :
                               network === 'dazn' ? 'DAZN' :
                               network === 'sling' ? 'Sling' :
                               network === 'nfl' ? 'NFL' :
                               network === 'nba' ? 'NBA' :
                               network === 'mlb' ? 'MLB' :
                               network === 'nhl' ? 'NHL' :
                               network.toUpperCase();

            // Extract show name if present (everything after the network) - USE ORIGINAL vendor to preserve case
            // Find the position of the network in the original string (case-insensitive)
            const networkIndex = lowerVendor.indexOf(network);
            const showPart = vendor.substring(networkIndex + network.length).trim();
            if (showPart) {
                // Keep the user's original capitalization for the show name
                return { channel: 'TV', vendorName: `${networkName} ${showPart}` };
            }
            return { channel: 'TV', vendorName: networkName };
        }
    }

    // Default to TV for unknown vendors (legacy behavior) - capitalize first letters
    const vendorName = vendor.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    return { channel: 'TV', vendorName };
}

export class ChannelManager {
    /**
     * Add a batch of placements
     */
    addBatchPlacements(
        input: string,
        context: AgentContext
    ): AgentMessage | null {
        const lowerInput = input.toLowerCase();
        const batchMatch = lowerInput.match(
            /(?:add|create|make|generate)\s+(\d+)\s+(social|display|tv|ctv|connected tv|linear tv|search|audio|video|native)/i
        );

        if (!batchMatch) return null;

        const count = parseInt(batchMatch[1]);
        const channelInput = batchMatch[2].toLowerCase();
        const channel = CHANNEL_MAP[channelInput] || 'Display' as PlacementTemplate['channel'];

        // Extract network if specified
        const networkMatch = input.match(/on\s+([a-z]+)/i);
        const network = networkMatch ? networkMatch[1] : undefined;

        // Validate count
        if (count < 1 || count > 10) {
            return createAgentMessage(
                `I can create between 1 and 10 placements at a time. You requested ${count}.`,
                [`Add ${Math.min(count, 10)} ${channel} placements`]
            );
        }

        const plan = context.mediaPlan;
        if (!plan) {
            return createAgentMessage(
                "I need an active media plan to add placements.",
                ['Create new campaign']
            );
        }

        // Get active flight - fallback to first flight if activeFlightId not set
        let activeFlight = plan.campaign.flights?.find(f => f.id === plan.activeFlightId);
        if (!activeFlight && plan.campaign.flights && plan.campaign.flights.length > 0) {
            activeFlight = plan.campaign.flights[0];
            console.log('[ChannelManager] No activeFlightId set, using first flight:', activeFlight.id);
        }
        if (!activeFlight) {
            // Create a mock flight for placement generation if none exists
            activeFlight = {
                id: 'temp-flight',
                name: 'Default Flight',
                campaignId: plan.campaign.id,
                startDate: plan.campaign.startDate || new Date().toISOString().split('T')[0],
                endDate: plan.campaign.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                budget: plan.campaign.budget * 0.5,
                status: 'ACTIVE' as const,
                lines: [],
                tags: []
            };
            console.log('[ChannelManager] No flights found, using temp flight');
        }

        // Generate placements
        const placements = generateBatchPlacements({
            channel,
            network,
            count,
            variation: 'diverse'
        }, activeFlight);

        // Add to campaign
        if (!plan.campaign.placements) {
            plan.campaign.placements = [];
        }

        let totalCost = 0;
        placements.forEach(p => {
            plan.campaign.placements!.push(p);
            totalCost += p.totalCost;
        });

        // Update plan totals
        plan.totalSpend += totalCost;
        plan.remainingBudget = plan.campaign.budget - plan.totalSpend;
        plan.metrics = calculatePlanMetrics(plan.campaign.placements);

        // Record action for undo
        actionHistory.recordAction({
            id: `batch-${Date.now()}`,
            type: 'add_placement',
            description: `Added ${count} ${channel} placements`,
            userCommand: input,
            stateBefore: { placementCount: plan.campaign.placements.length - count },
            stateAfter: { placementCount: plan.campaign.placements.length },
            canUndo: true
        });

        // Generate summary
        const placementSummary = placements.slice(0, 3).map(p =>
            `• ${p.vendor} - ${p.adUnit} ($${(p.totalCost / 1000).toFixed(1)}k)`
        ).join('\n');

        const moreText = count > 3 ? `\n...and ${count - 3} more` : '';

        let responseContent = `✅ Created **${count} ${channel} placements** for **$${(totalCost / 1000).toFixed(1)}k**:\n\n${placementSummary}${moreText}\n\n` +
            `**Total Spend:** $${(plan.totalSpend / 1000).toFixed(1)}k of $${(plan.campaign.budget / 1000).toFixed(1)}k`;

        // Budget warning
        const budgetUsed = (plan.totalSpend / plan.campaign.budget) * 100;
        if (budgetUsed > 80) {
            responseContent += `\n\n⚠️ **${budgetUsed.toFixed(0)}% of budget allocated** - limited budget remaining.`;
        }

        return createAgentMessage(responseContent, ['Add more placements', 'Optimize plan', 'Export PDF']);
    }

    /**
     * Add a single channel/network placement
     */
    addSinglePlacement(
        input: string,
        context: AgentContext
    ): AgentMessage | null {
        const lowerInput = input.toLowerCase();

        // Match channel or network (Print removed - not supported)
        const addMatch = lowerInput.match(
            /add\s+(search|social|display|tv|radio|ooh|espn|cbs|nbc|abc|fox|cnn|msnbc|hgtv|discovery|tlc|bravo|tnt|netflix|hulu|amazon|disney|hbo|apple|paramount|peacock|youtube|roku|tubi|pluto|f1|dazn|sling|nfl|nba|mlb|nhl)/i
        );

        if (!addMatch) return null;

        const plan = context.mediaPlan;
        if (!plan) {
            return createAgentMessage(
                "I need an active media plan to add placements.",
                ['Create new campaign']
            );
        }

        let channelStr = addMatch[1].toLowerCase();
        let channel: string;
        let networkName: string | undefined;
        let programName: string | undefined;

        if (TV_NETWORKS.includes(channelStr)) {
            channel = 'TV';

            // Properly capitalize network name
            const networkCapMap: Record<string, string> = {
                'espn': 'ESPN', 'espn2': 'ESPN2', 'cbs': 'CBS', 'nbc': 'NBC',
                'abc': 'ABC', 'fox': 'FOX', 'cnn': 'CNN', 'msnbc': 'MSNBC',
                'hgtv': 'HGTV', 'discovery': 'Discovery', 'tlc': 'TLC',
                'bravo': 'Bravo', 'tnt': 'TNT', 'netflix': 'Netflix',
                'hulu': 'Hulu', 'amazon prime': 'Amazon Prime', 'disney': 'Disney',
                'hbo': 'HBO', 'apple tv': 'Apple TV', 'paramount': 'Paramount+',
                'peacock': 'Peacock', 'roku': 'Roku', 'tubi': 'Tubi',
                'pluto': 'Pluto', 'f1': 'F1 TV', 'dazn': 'DAZN', 'sling': 'Sling',
                'nfl': 'NFL', 'nba': 'NBA', 'mlb': 'MLB', 'nhl': 'NHL'
            };

            // Special handling for sports leagues
            if (SPORTS_LEAGUES.includes(channelStr)) {
                networkName = 'Sports Network';
                programName = channelStr.toUpperCase();
            } else {
                networkName = networkCapMap[channelStr] || channelStr.toUpperCase();
            }

            // Check for program name after network - preserve original case from input
            const networkPattern = new RegExp(`add\\s+${channelStr}\\s+(.+)`, 'i');
            const programMatch = input.match(networkPattern);
            if (programMatch) {
                programName = programMatch[1].trim();
            }
        } else {
            // Standard channel
            if (channelStr === 'tv') channel = 'TV';
            else if (channelStr === 'ooh') channel = 'OOH';
            else channel = channelStr.charAt(0).toUpperCase() + channelStr.slice(1);
        }

        // Generate placement
        const p = generateLine(channel as any, plan.campaign.advertiser, networkName, programName);

        // Calculate allocation
        const alloc = Math.max(5000, plan.campaign.budget * 0.05);

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

        // Add to plan
        if (!plan.campaign.placements) {
            plan.campaign.placements = [];
        }

        plan.campaign.placements.push(p);
        plan.totalSpend += p.totalCost;
        plan.remainingBudget = plan.campaign.budget - plan.totalSpend;
        plan.metrics = calculatePlanMetrics(plan.campaign.placements);

        // Format display name
        const displayName = channel === 'TV' && p.vendor && p.adUnit
            ? `${p.vendor} - ${p.adUnit}`
            : (networkName
                ? `${networkName}${programName ? ` - ${programName}` : ''}`
                : channel);

        const responseContent = `I've added a new **${displayName}** placement for $${p.totalCost.toLocaleString()}.\n\nCurrent Spend: $${plan.totalSpend.toLocaleString()}`;

        return createAgentMessage(responseContent, ['Add another channel', 'Looks good', 'Export PDF']);
    }

    /**
     * Add a placement by vendor/platform name (smart channel detection)
     */
    addShowByName(
        input: string,
        context: AgentContext
    ): AgentMessage | null {
        const lowerInput = input.toLowerCase();
        const showOnlyMatch = lowerInput.match(/^add\s+(.+)$/i);

        if (!showOnlyMatch) return null;

        const plan = context.mediaPlan;
        if (!plan) {
            return createAgentMessage(
                "I need an active media plan to add placements.",
                ['Create new campaign']
            );
        }

        const vendorInput = showOnlyMatch[1].trim();

        // Check for unsupported channels first
        const lowerVendor = vendorInput.toLowerCase();
        for (const unsupported of UNSUPPORTED_CHANNELS) {
            if (lowerVendor.includes(unsupported) || lowerVendor === unsupported) {
                // Return helpful message about unsupported channel
                const alternatives: Record<string, string> = {
                    'print': 'Try digital display or OOH (out-of-home) instead',
                    'newspaper': 'Try digital display or local news streaming instead',
                    'magazine': 'Try digital display or podcast sponsorships instead',
                    'email': 'Email campaigns are handled separately - this tool focuses on media placements',
                    'billboard': 'Try "add OOH" for digital out-of-home placements'
                };
                const altMessage = alternatives[unsupported] || 'Try Search, Social, Display, TV, Radio, or OOH channels instead';
                return createAgentMessage(
                    `Sorry, **${vendorInput}** is not a supported media channel.\n\n${altMessage}.\n\nSupported channels: Search, Social, Display, TV, Radio, Streaming Audio, Podcast, OOH`,
                    ['Add Display', 'Add Social', 'Add TV']
                );
            }
        }

        // Use smart channel detection
        const { channel, vendorName } = getChannelFromVendor(vendorInput);

        // Generate placement with correct channel type
        const p = generateLine(channel as any, plan.campaign.advertiser, vendorName, undefined);

        // Override vendor name AND channel for proper display
        p.vendor = vendorName;
        p.channel = channel as any;

        // Calculate allocation
        const alloc = Math.max(5000, plan.campaign.budget * 0.05);

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

        // Add to plan
        if (!plan.campaign.placements) {
            plan.campaign.placements = [];
        }

        plan.campaign.placements.push(p);
        plan.totalSpend += p.totalCost;
        plan.remainingBudget = plan.campaign.budget - plan.totalSpend;
        plan.metrics = calculatePlanMetrics(plan.campaign.placements);

        const displayName = `${vendorName} (${channel})`;
        const responseContent = `I've added a new **${displayName}** placement for $${p.totalCost.toLocaleString()}.\n\nCurrent Spend: $${plan.totalSpend.toLocaleString()}`;

        return createAgentMessage(responseContent, ['Add another channel', 'Looks good', 'Export PDF']);
    }

    /**
     * Pause placements by row or name
     */
    pausePlacement(
        input: string,
        context: AgentContext
    ): AgentMessage | null {
        const lowerInput = input.toLowerCase();

        // Don't process if it's an unpause/resume command
        if (lowerInput.includes('unpause') || lowerInput.includes('resume')) {
            return null;
        }

        const pauseRowMatch = lowerInput.match(/pause\s+(?:row\s+)?(\d+)/i);
        const pauseNameMatch = lowerInput.match(/pause\s+(.+?)(?:\s+and|\s*$)/i);

        if (!pauseRowMatch && !pauseNameMatch) return null;

        const plan = context.mediaPlan;
        if (!plan || !plan.campaign.placements) {
            return createAgentMessage(
                "I need an active media plan with placements to pause.",
                ['Add placements first']
            );
        }

        let pausedCount = 0;
        const pausedItems: string[] = [];

        if (pauseRowMatch) {
            const rowNum = parseInt(pauseRowMatch[1]);
            if (rowNum > 0 && rowNum <= plan.campaign.placements.length) {
                const placement = plan.campaign.placements[rowNum - 1];
                if (placement.performance) {
                    placement.performance.status = 'PAUSED';
                    pausedItems.push(`Row #${rowNum} (${placement.vendor})`);
                    pausedCount++;
                }
            }
        } else if (pauseNameMatch) {
            const searchTerm = pauseNameMatch[1].toLowerCase().trim();
            plan.campaign.placements.forEach((p) => {
                if (p.vendor?.toLowerCase().includes(searchTerm) ||
                    p.name?.toLowerCase().includes(searchTerm)) {
                    if (p.performance) {
                        p.performance.status = 'PAUSED';
                        pausedItems.push(`${p.vendor || p.name}`);
                        pausedCount++;
                    }
                }
            });
        }

        if (pausedCount > 0) {
            return createAgentMessage(
                `I've paused ${pausedCount} placement(s): ${pausedItems.join(', ')}.`,
                ['Resume placements', 'Export PDF']
            );
        } else {
            return createAgentMessage(
                "I couldn't find any matching placements to pause. Please check the row number or name.",
                ['Show Details']
            );
        }
    }

    /**
     * Resume/unpause placements by row or name
     */
    resumePlacement(
        input: string,
        context: AgentContext
    ): AgentMessage | null {
        const lowerInput = input.toLowerCase();

        if (!lowerInput.includes('resume') && !lowerInput.includes('unpause')) {
            return null;
        }

        const resumeRowMatch = lowerInput.match(/(?:resume|unpause)\s+(?:row\s+)?(\d+)/i);
        const resumeNameMatch = lowerInput.match(/(?:resume|unpause)\s+(.+?)(?:\s+and|\s*$)/i);

        if (!resumeRowMatch && !resumeNameMatch) return null;

        const plan = context.mediaPlan;
        if (!plan || !plan.campaign.placements) {
            return createAgentMessage(
                "I need an active media plan with placements to resume.",
                ['Add placements first']
            );
        }

        let resumedCount = 0;
        const resumedItems: string[] = [];

        if (resumeRowMatch) {
            const rowNum = parseInt(resumeRowMatch[1]);
            if (rowNum > 0 && rowNum <= plan.campaign.placements.length) {
                const placement = plan.campaign.placements[rowNum - 1];
                if (placement.performance && placement.performance.status === 'PAUSED') {
                    placement.performance.status = 'ACTIVE';
                    resumedItems.push(`Row #${rowNum} (${placement.vendor})`);
                    resumedCount++;
                }
            }
        } else if (resumeNameMatch) {
            const searchTerm = resumeNameMatch[1].toLowerCase().trim();
            plan.campaign.placements.forEach((p) => {
                if (p.vendor?.toLowerCase().includes(searchTerm) ||
                    p.name?.toLowerCase().includes(searchTerm)) {
                    if (p.performance && p.performance.status === 'PAUSED') {
                        p.performance.status = 'ACTIVE';
                        resumedItems.push(`${p.vendor || p.name}`);
                        resumedCount++;
                    }
                }
            });
        }

        if (resumedCount > 0) {
            return createAgentMessage(
                `I've resumed ${resumedCount} placement(s): ${resumedItems.join(', ')}.`,
                ['Optimize for Reach', 'Export PDF']
            );
        } else {
            return createAgentMessage(
                "I couldn't find any paused placements matching that criteria to resume.",
                ['Show Details']
            );
        }
    }

    /**
     * Modify segment for a placement
     */
    modifySegment(
        input: string,
        context: AgentContext
    ): AgentMessage | null {
        const lowerInput = input.toLowerCase();

        const segmentMatch = lowerInput.match(/row\s+(\d+).*?segment.*?to\s+(.+)/i) ||
            lowerInput.match(/change\s+segment.*?(\d+).*?to\s+(.+)/i);

        if (!segmentMatch) return null;

        const plan = context.mediaPlan;
        if (!plan || !plan.campaign.placements) {
            return createAgentMessage(
                "I need an active media plan with placements to modify.",
                ['Add placements first']
            );
        }

        const rowNum = parseInt(segmentMatch[1]);
        const newSegment = segmentMatch[2].replace(/['"]/g, '').trim();

        if (rowNum > 0 && rowNum <= plan.campaign.placements.length) {
            const placement = plan.campaign.placements[rowNum - 1];
            const oldSegment = placement.segment;

            const displaySegment = newSegment.charAt(0).toUpperCase() + newSegment.slice(1);
            placement.segment = displaySegment;

            return createAgentMessage(
                `Updated Row #${rowNum} (${placement.vendor}): Changed segment from "${oldSegment}" to "**${displaySegment}**".`,
                ['Change another segment', 'Export PDF']
            );
        } else {
            return createAgentMessage(
                `I couldn't find Row #${rowNum}. Please check the table and try again.`,
                ['Show Details']
            );
        }
    }

    /**
     * Change budget
     */
    changeBudget(
        input: string,
        context: AgentContext
    ): AgentMessage | null {
        const lowerInput = input.toLowerCase();

        if (!lowerInput.includes('budget')) return null;

        const plan = context.mediaPlan;
        if (!plan) {
            return createAgentMessage(
                "I need an active media plan to change budget.",
                ['Create new campaign']
            );
        }

        // Check for row-specific budget change: "change budget for row 1 to $10k"
        const rowBudgetMatch = lowerInput.match(/(?:change|set|update).*budget.*(?:for\s+)?row\s*(\d+).*?(?:to\s+)?\$?([\d,]+(?:\.\d+)?)\s*([kKmM])?(?:\s|$)/i);
        if (rowBudgetMatch && plan.campaign.placements) {
            const rowNum = parseInt(rowBudgetMatch[1]);
            const rawValue = parseFloat(rowBudgetMatch[2].replace(/,/g, ''));
            const suffix = (rowBudgetMatch[3] || '').toLowerCase();
            let newBudget = rawValue;

            if (suffix === 'm') {
                newBudget = rawValue * 1000000;
            } else if (suffix === 'k') {
                newBudget = rawValue * 1000;
            }

            // Validate the budget value is reasonable (not 0 or negative)
            if (newBudget <= 0) {
                return createAgentMessage(
                    `Budget must be greater than 0. Please specify a valid amount like "$10k" or "$50,000".`,
                    []
                );
            }

            if (rowNum > 0 && rowNum <= plan.campaign.placements.length) {
                const placement = plan.campaign.placements[rowNum - 1];
                const oldBudget = placement.totalCost;
                placement.totalCost = newBudget;

                // Also update quantity to match new budget (for CPM-based placements)
                if (placement.costMethod === 'CPM' && placement.rate > 0) {
                    placement.quantity = Math.floor((newBudget * 1000) / placement.rate);
                    if (placement.forecast) {
                        placement.forecast.impressions = placement.quantity;
                        placement.forecast.spend = newBudget;
                    }
                }

                // Recalculate plan totals
                plan.totalSpend = plan.campaign.placements.reduce((acc, p) => acc + p.totalCost, 0);
                plan.remainingBudget = plan.campaign.budget - plan.totalSpend;
                plan.metrics = calculatePlanMetrics(plan.campaign.placements);

                return createAgentMessage(
                    `Updated **${placement.vendor}** (Row ${rowNum}) budget from $${oldBudget.toLocaleString()} to **$${newBudget.toLocaleString()}**.\n\nNew total spend: $${plan.totalSpend.toLocaleString()}`,
                    ['Optimize', 'Export PDF']
                );
            } else {
                return createAgentMessage(
                    `Row ${rowNum} doesn't exist. You have ${plan.campaign.placements.length} placements.`,
                    []
                );
            }
        }

        // Fallback: Change campaign budget (must have explicit budget value with $ or k/m suffix)
        // Matches: "$50k", "$100,000", "50k", "100m" - but NOT bare numbers like "1" or "100"
        const budgetMatch = input.match(/\$(\d+(?:,\d{3})*(?:\.\d+)?)\s*([kKmM])?|(\d+(?:,\d{3})*(?:\.\d+)?)\s*([kKmM])/);
        if (!budgetMatch) return null;

        // Handle either capture group format
        const numStr = budgetMatch[1] || budgetMatch[3];
        const suffixStr = budgetMatch[2] || budgetMatch[4] || '';

        if (!numStr) return null;

        const rawValue = parseFloat(numStr.replace(/,/g, ''));
        const suffix = suffixStr.toLowerCase();
        let newBudget = rawValue;

        if (suffix === 'm') {
            newBudget = rawValue * 1000000;
        } else if (suffix === 'k') {
            newBudget = rawValue * 1000;
        }

        // Validate budget is reasonable
        if (newBudget <= 0) {
            return createAgentMessage(
                `Budget must be greater than 0. Please specify a valid amount like "$100k" or "$500,000".`,
                []
            );
        }

        plan.campaign.budget = newBudget;
        plan.remainingBudget = newBudget - plan.totalSpend;

        return createAgentMessage(
            `Updated total campaign budget to **$${newBudget.toLocaleString()}**. You have $${plan.remainingBudget.toLocaleString()} remaining.`,
            ['Add TV', 'Export PDF']
        );
    }

    /**
     * Change dates
     */
    changeDates(
        input: string,
        context: AgentContext
    ): AgentMessage | null {
        const lowerInput = input.toLowerCase();

        if (!lowerInput.includes('date') && !lowerInput.includes('run from') && !lowerInput.includes('delay')) {
            return null;
        }

        const plan = context.mediaPlan;
        if (!plan) {
            return createAgentMessage(
                "I need an active media plan to change dates.",
                ['Create new campaign']
            );
        }

        if (lowerInput.includes('delay')) {
            const oldStart = new Date(plan.campaign.startDate);
            oldStart.setMonth(oldStart.getMonth() + 1);
            plan.campaign.startDate = oldStart.toISOString().split('T')[0];
            return createAgentMessage(
                "I've shifted the campaign start date by 1 month.",
                ['Delay start by 1 month', 'Export PDF']
            );
        }

        return createAgentMessage(
            "I've updated the flight dates. (Note: For this prototype, please use 'Delay start' to shift dates).",
            ['Delay start by 1 month', 'Export PDF']
        );
    }

    /**
     * Change grouping view
     */
    changeGrouping(
        input: string,
        context: AgentContext
    ): AgentMessage | null {
        const lowerInput = input.toLowerCase();

        const hasGroupingKeyword = lowerInput.includes('group') ||
            lowerInput.includes('summary') ||
            lowerInput.includes('detail') ||
            lowerInput.includes('segment') ||
            lowerInput.includes('line item') ||
            lowerInput.includes('placement') ||
            lowerInput.includes('flat');

        if (!hasGroupingKeyword) return null;

        const plan = context.mediaPlan;
        if (!plan) {
            return createAgentMessage(
                "I need an active media plan to change view.",
                ['Create new campaign']
            );
        }

        if (lowerInput.includes('detail') ||
            lowerInput.includes('segment') ||
            lowerInput.includes('line item') ||
            lowerInput.includes('placement') ||
            lowerInput.includes('flat')) {
            plan.groupingMode = 'DETAILED';
            return createAgentMessage(
                "Switched to **Detailed View** (Line Items).",
                ['Show Details', 'Show Channel Summary', 'Export PDF']
            );
        } else {
            plan.groupingMode = 'CHANNEL_SUMMARY';
            return createAgentMessage(
                "Switched to **Channel Summary View**. Data is now aggregated by channel.",
                ['Show Details', 'Show Channel Summary', 'Export PDF']
            );
        }
    }
}

// Export singleton instance
export const channelManager = new ChannelManager();
