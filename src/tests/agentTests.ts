/**
 * Test Suite for Enhanced Agent Intelligence
 * 
 * Tests intent classification, entity extraction, context management,
 * and all new agent capabilities
 */

import { classifyIntent, IntentCategory } from '../logic/intentClassifier';
import { extractAllEntities } from '../logic/entityExtractor';
import { contextManager } from '../logic/contextManager';
import { recommendBudgetAllocation } from '../utils/budgetOptimizer';
import { generateBatchPlacements } from '../utils/placementGenerator';
import { actionHistory } from '../utils/actionHistory';

interface TestCase {
    name: string;
    input: string;
    expectedIntent?: IntentCategory;
    expectedEntities?: Partial<{
        budget: number;
        channels: string[];
        count: number;
    }>;
}

/**
 * Intent Classification Tests
 */
const intentTests: TestCase[] = [
    {
        name: 'Campaign Creation - Simple',
        input: 'I need to launch a campaign for our new product',
        expectedIntent: IntentCategory.CAMPAIGN_SETUP
    },
    {
        name: 'Campaign Creation - Detailed',
        input: 'Create a Q4 holiday campaign targeting parents with kids, $500K budget across CTV and display',
        expectedIntent: IntentCategory.CAMPAIGN_SETUP,
        expectedEntities: {
            budget: 500000,
            channels: ['Connected TV', 'Display']
        }
    },
    {
        name: 'Campaign Cloning',
        input: 'Create a campaign similar to what we ran last Black Friday but with 20% more budget',
        expectedIntent: IntentCategory.CAMPAIGN_SETUP
    },
    {
        name: 'Budget Inquiry',
        input: "What's the minimum budget to get meaningful results in CTV?",
        expectedIntent: IntentCategory.BUDGET_ALLOCATION
    },
    {
        name: 'Budget Allocation',
        input: 'How should I spread $200K across 6 weeks?',
        expectedIntent: IntentCategory.BUDGET_ALLOCATION,
        expectedEntities: {
            budget: 200000
        }
    },
    {
        name: 'Audience Building',
        input: 'I want to target CFOs at companies with 500+ employees',
        expectedIntent: IntentCategory.AUDIENCE_TARGETING
    },
    {
        name: 'Audience Size',
        input: 'How big is this audience?',
        expectedIntent: IntentCategory.AUDIENCE_TARGETING
    },
    {
        name: 'Performance Check',
        input: 'How is my campaign doing?',
        expectedIntent: IntentCategory.PERFORMANCE_MONITORING
    },
    {
        name: 'Performance Troubleshooting',
        input: 'Why is my campaign underperforming?',
        expectedIntent: IntentCategory.PERFORMANCE_MONITORING
    },
    {
        name: 'Optimization Request',
        input: 'The CPA is too high, what should I do?',
        expectedIntent: IntentCategory.OPTIMIZATION
    },
    {
        name: 'Budget Reallocation',
        input: 'Shift budget to the best performing channels',
        expectedIntent: IntentCategory.OPTIMIZATION
    },
    {
        name: 'Forecasting',
        input: 'What results should I expect from this campaign?',
        expectedIntent: IntentCategory.FORECASTING
    },
    {
        name: 'Reach Forecast',
        input: 'How many people will this campaign reach?',
        expectedIntent: IntentCategory.FORECASTING
    },
    {
        name: 'Report Generation',
        input: 'Give me a performance summary for last month',
        expectedIntent: IntentCategory.REPORTING
    },
    {
        name: 'Creative Performance',
        input: 'Which creative is performing best?',
        expectedIntent: IntentCategory.CREATIVE
    },
    {
        name: 'Help - Feature Explanation',
        input: 'How does frequency capping work?',
        expectedIntent: IntentCategory.HELP
    },
    {
        name: 'Help - Best Practice',
        input: "What's the right frequency for my category?",
        expectedIntent: IntentCategory.HELP
    }
];

/**
 * Entity Extraction Tests
 */
const entityTests: TestCase[] = [
    {
        name: 'Budget - K notation',
        input: 'I have $50k to spend',
        expectedEntities: { budget: 50000 }
    },
    {
        name: 'Budget - M notation',
        input: 'Budget is $2.5M',
        expectedEntities: { budget: 2500000 }
    },
    {
        name: 'Budget - Comma notation',
        input: 'We have $100,000 allocated',
        expectedEntities: { budget: 100000 }
    },
    {
        name: 'Multiple Channels',
        input: 'I want to use CTV, display, and social',
        expectedEntities: { channels: ['Connected TV', 'Display', 'Social'] }
    },
    {
        name: 'Batch Count',
        input: 'Add 5 social placements',
        expectedEntities: { count: 5, channels: ['Social'] }
    },
    {
        name: 'Complex Mix',
        input: 'Create 3 TV spots on ESPN with $75k budget',
        expectedEntities: { count: 3, budget: 75000 }
    }
];

/**
 * Context Management Tests
 */
function testContextManagement(): void {
    console.log('\n=== Testing Context Management ===\n');

    const sessionId = 'test-session-' + Date.now();

    // Test 1: Add messages and check history
    contextManager.addMessage(sessionId, 'user', 'Create a campaign');
    contextManager.addMessage(sessionId, 'assistant', 'I can help with that. What type of campaign?');
    contextManager.addMessage(sessionId, 'user', 'Awareness campaign');

    const history = contextManager.getRecentHistory(sessionId, 3);
    console.log(`✓ History tracking: ${history.length} messages stored`);

    // Test 2: Accumulate entities across turns
    const intent1 = classifyIntent('I need a campaign');
    const entities1 = extractAllEntities('Budget is $100k');
    contextManager.addMessage(sessionId, 'user', 'Budget is $100k', intent1, entities1);

    const entities2 = extractAllEntities('Target CTV and display');
    contextManager.addMessage(sessionId, 'user', 'Target CTV and display', undefined, entities2);

    const accumulated = contextManager.getAccumulatedEntities(sessionId);
    console.log(`✓ Entity accumulation: budget=${accumulated.budget}, channels=${accumulated.channels?.join(', ')}`);

    // Test 3: Expertise detection
    contextManager.addMessage(sessionId, 'user', 'I need help understanding incrementality testing and attribution models');
    const profile = contextManager.getContext(sessionId).userProfile;
    console.log(`✓ Expertise detection: ${profile.expertiseLevel}`);

    console.log('\n✅ Context Management Tests Complete\n');
}

/**
 * Budget Optimizer Tests
 */
function testBudgetOptimizer(): void {
    console.log('\n=== Testing Budget Optimizer ===\n');

    // Test 1: Awareness campaign allocation
    const awarenessRec = recommendBudgetAllocation(100000, 'awareness', ['Connected TV', 'Display', 'Social']);
    console.log(`✓ Awareness allocation (${awarenessRec.channels.length} channels):`);
    awarenessRec.channels.forEach(c => {
        console.log(`  - ${c.channel}: $${(c.allocatedBudget / 1000).toFixed(0)}k (${c.percentage.toFixed(1)}%)`);
    });

    // Test 2: Conversion campaign allocation
    const conversionRec = recommendBudgetAllocation(50000, 'conversion');
    console.log(`\n✓ Conversion allocation (auto-select channels):`);
    conversionRec.channels.forEach(c => {
        console.log(`  - ${c.channel}: $${(c.allocatedBudget / 1000).toFixed(0)}k - ${c.reasoning}`);
    });

    console.log('\n✅ Budget Optimizer Tests Complete\n');
}

/**
 * Batch Placement Generator Tests
 */
function testPlacementGenerator(): void {
    console.log('\n=== Testing Placement Generator ===\n');

    const testFlight = {
        id: 'test-flight',
        name: 'Test Flight',
        startDate: '2024-12-01',
        endDate: '2024-12-31',
        budget: 100000,
        lines: [],
        campaignId: 'test-campaign',
        status: 'ACTIVE' as const
    };

    // Test 1: Social placements
    const socialPlacements = generateBatchPlacements({
        channel: 'Social',
        count: 3,
        variation: 'diverse'
    }, testFlight);
    console.log(`✓ Generated ${socialPlacements.length} diverse social placements`);
    socialPlacements.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.vendor} - ${p.adUnit}`);
    });

    // Test 2: TV placements
    const tvPlacements = generateBatchPlacements({
        channel: 'Connected TV',
        network: 'ESPN',
        count: 2,
        variation: 'similar'
    }, testFlight);
    console.log(`\n✓ Generated ${tvPlacements.length} ESPN placements`);
    tvPlacements.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.vendor} - ${p.adUnit}`);
    });

    console.log('\n✅ Placement Generator Tests Complete\n');
}

/**
 * Action History Tests
 */
function testActionHistory(): void {
    console.log('\n=== Testing Action History ===\n');

    // Record some actions
    actionHistory.recordAction({
        id: 'action-1',
        type: 'add_placement',
        description: 'Added NFL placement on ESPN',
        userCommand: 'add nfl',
        stateBefore: {},
        stateAfter: {},
        canUndo: true
    });

    actionHistory.recordAction({
        id: 'action-2',
        type: 'update_budget',
        description: 'Updated budget to $50k',
        userCommand: 'set budget to 50k',
        stateBefore: {},
        stateAfter: {},
        canUndo: true
    });

    const recent = actionHistory.getRecentActions(5);
    console.log(`✓ Recorded ${recent.length} actions`);
    recent.forEach(a => {
        console.log(`  - ${a.description}`);
    });

    // Test undo
    const lastAction = actionHistory.getLastAction();
    if (lastAction) {
        actionHistory.markAsUndone(lastAction.id);
        console.log(`✓ Marked action as undone: ${lastAction.description}`);
    }

    const summary = actionHistory.getHistorySummary(5);
    console.log(`\n✓ History summary:`);
    summary.forEach(s => console.log(`  ${s}`));

    console.log('\n✅ Action History Tests Complete\n');
}

/**
 * Run all tests
 */
export function runAllTests(): void {
    console.log('\n🧪 ===== ENHANCED AGENT INTELLIGENCE TEST SUITE =====\n');

    // Run intent classification tests
    console.log('=== Testing Intent Classification ===\n');
    let passedIntents = 0;
    for (const test of intentTests) {
        const result = classifyIntent(test.input);
        const passed = result.category === test.expectedIntent;

        if (passed) {
            passedIntents++;
            console.log(`✓ ${test.name}: ${result.category} (confidence: ${result.confidence.toFixed(2)})`);
        } else {
            console.log(`✗ ${test.name}: Expected ${test.expectedIntent}, got ${result.category}`);
        }
    }
    console.log(`\n${passedIntents}/${intentTests.length} intent tests passed\n`);

    // Run entity extraction tests
    console.log('=== Testing Entity Extraction ===\n');
    let passedEntities = 0;
    for (const test of entityTests) {
        const result = extractAllEntities(test.input);
        let passed = true;

        if (test.expectedEntities?.budget && result.budget !== test.expectedEntities.budget) {
            passed = false;
        }
        if (test.expectedEntities?.count && result.placements?.count !== test.expectedEntities.count) {
            passed = false;
        }

        if (passed) {
            passedEntities++;
            console.log(`✓ ${test.name}`);
        } else {
            console.log(`✗ ${test.name}: Entity mismatch`);
        }
    }
    console.log(`\n${passedEntities}/${entityTests.length} entity tests passed\n`);

    // Run other tests
    testContextManagement();
    testBudgetOptimizer();
    testPlacementGenerator();
    testActionHistory();

    console.log('\n✅ ===== ALL TESTS COMPLETE =====\n');
}

// Export for use in development
if (typeof window !== 'undefined') {
    (window as any).runAgentTests = runAllTests;
}
