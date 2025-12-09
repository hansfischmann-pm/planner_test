import { Campaign, Flight, Line } from '../types';

// ===== Type Definitions =====

export type AlertSeverity = 'CRITICAL' | 'WARNING' | 'INFO';
export type AlertType = 'BUDGET_PACING' | 'PERFORMANCE' | 'DELIVERY_RISK' | 'OPPORTUNITY';

export interface PredictiveAlert {
    id: string;
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    message: string;
    entityId: string; // Campaign/Flight/Line ID
    entityName: string;
    entityType: 'CAMPAIGN' | 'FLIGHT' | 'LINE';
    metric?: string;
    currentValue?: number;
    projectedValue?: number;
    threshold?: number;
    impact?: string;
    recommendation?: string;
    timestamp: number;
}

export interface BudgetPacingAnalysis {
    entityId: string;
    entityName: string;
    budget: number;
    actualSpend: number;
    projectedSpend: number;
    daysElapsed: number;
    daysRemaining: number;
    totalDays: number;
    idealSpend: number; // What should have been spent by now
    paceVariance: number; // Percentage difference from ideal
    status: 'UNDER_PACING' | 'ON_TRACK' | 'OVER_PACING';
    alert?: PredictiveAlert;
}

export interface PerformancePrediction {
    entityId: string;
    entityName: string;
    metric: 'impressions' | 'clicks' | 'conversions' | 'revenue';
    currentValue: number;
    projectedValue: number;
    goalValue?: number;
    confidence: number; // 0-1
    trend: 'DECLINING' | 'STABLE' | 'GROWING';
    alert?: PredictiveAlert;
}

export interface DeliveryRiskAssessment {
    entityId: string;
    entityName: string;
    riskScore: number; // 0-100, higher is riskier
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    factors: {
        name: string;
        score: number; // 0-100
        weight: number; // 0-1
        description: string;
    }[];
    alert?: PredictiveAlert;
}

export interface OpportunityScore {
    entityId: string;
    entityName: string;
    opportunityType: 'BUDGET_REALLOCATION' | 'CHANNEL_SHIFT' | 'AUDIENCE_EXPANSION' | 'CREATIVE_REFRESH';
    score: number; // 0-100, higher is better opportunity
    estimatedImpact: string; // e.g., "+15% ROAS", "$25K additional revenue"
    effort: 'LOW' | 'MEDIUM' | 'HIGH';
    description: string;
    recommendation: string;
    alert?: PredictiveAlert;
}

// ===== Budget Pacing Analysis =====

export function analyzeBudgetPacing(
    entity: Campaign | Flight | Line,
    entityType: 'CAMPAIGN' | 'FLIGHT' | 'LINE'
): BudgetPacingAnalysis | null {
    if (!entity.delivery || !entity.startDate || !entity.endDate) {
        return null;
    }

    const budget = 'budget' in entity ? entity.budget : entity.totalCost;
    const actualSpend = entity.delivery.actualSpend;

    const startDate = new Date(entity.startDate);
    const endDate = new Date(entity.endDate);
    const now = new Date();

    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, totalDays - daysElapsed);

    // Calculate ideal spend (linear pacing)
    const progressRatio = Math.min(1, Math.max(0, daysElapsed / totalDays));
    const idealSpend = budget * progressRatio;

    // Project final spend based on current pace
    const dailySpendRate = daysElapsed > 0 ? actualSpend / daysElapsed : 0;
    const projectedSpend = Math.min(budget * 1.5, actualSpend + (dailySpendRate * daysRemaining));

    // Calculate variance
    const paceVariance = idealSpend > 0 ? ((actualSpend - idealSpend) / idealSpend) * 100 : 0;

    // Determine status
    let status: 'UNDER_PACING' | 'ON_TRACK' | 'OVER_PACING';
    if (paceVariance < -15) {
        status = 'UNDER_PACING';
    } else if (paceVariance > 15) {
        status = 'OVER_PACING';
    } else {
        status = 'ON_TRACK';
    }

    // Create alert if needed
    let alert: PredictiveAlert | undefined;
    if (status !== 'ON_TRACK' && Math.abs(paceVariance) > 20) {
        const severity: AlertSeverity = Math.abs(paceVariance) > 40 ? 'CRITICAL' : 'WARNING';

        alert = {
            id: `pacing-${entity.id}-${Date.now()}`,
            type: 'BUDGET_PACING',
            severity,
            title: status === 'UNDER_PACING' ? 'Under-Pacing Alert' : 'Over-Pacing Alert',
            message: status === 'UNDER_PACING'
                ? `Spend is ${Math.abs(paceVariance).toFixed(0)}% below target. At current rate, you'll only spend $${projectedSpend.toLocaleString()} of $${budget.toLocaleString()} budget.`
                : `Spend is ${paceVariance.toFixed(0)}% above target. Budget may be exhausted ${daysRemaining > 5 ? 'early' : 'soon'}.`,
            entityId: entity.id,
            entityName: entity.name,
            entityType,
            metric: 'budget_pace',
            currentValue: actualSpend,
            projectedValue: projectedSpend,
            threshold: budget,
            impact: status === 'UNDER_PACING'
                ? `Potential ${((budget - projectedSpend) / budget * 100).toFixed(0)}% budget underspend`
                : `May exceed budget by $${(projectedSpend - budget).toLocaleString()}`,
            recommendation: status === 'UNDER_PACING'
                ? 'Consider increasing bids, expanding targeting, or reallocating budget to higher-performing placements.'
                : 'Reduce daily budgets, pause underperforming placements, or increase budget allocation.',
            timestamp: Date.now()
        };
    }

    return {
        entityId: entity.id,
        entityName: entity.name,
        budget,
        actualSpend,
        projectedSpend,
        daysElapsed,
        daysRemaining,
        totalDays,
        idealSpend,
        paceVariance,
        status,
        alert
    };
}

// ===== Performance Prediction =====

export function predictPerformance(
    entity: Campaign | Flight | Line,
    entityType: 'CAMPAIGN' | 'FLIGHT' | 'LINE',
    metric: 'impressions' | 'clicks' | 'conversions' | 'revenue'
): PerformancePrediction | null {
    if (!entity.performance && !entity.delivery) {
        return null;
    }

    const startDate = new Date(entity.startDate);
    const endDate = new Date(entity.endDate);
    const now = new Date();

    const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysElapsed = Math.max(1, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, totalDays - daysElapsed);

    // Get current value
    let currentValue = 0;
    let goalValue: number | undefined;

    if (metric === 'impressions') {
        currentValue = entity.delivery?.actualImpressions || entity.performance?.impressions || 0;
        goalValue = entity.forecast?.impressions;
    } else if (entity.performance) {
        // Access metric dynamically - cast to any to handle varying performance types
        currentValue = (entity.performance as Record<string, number>)[metric] || 0;
        if ('numericGoals' in entity && entity.numericGoals) {
            // numericGoals only has certain metrics - check before accessing
            const goals = entity.numericGoals as Record<string, number | undefined>;
            goalValue = goals[metric];
        }
    }

    // Project based on current daily rate
    const dailyRate = daysElapsed > 0 ? currentValue / daysElapsed : 0;
    const projectedValue = currentValue + (dailyRate * daysRemaining);

    // Calculate trend
    let trend: 'DECLINING' | 'STABLE' | 'GROWING' = 'STABLE';
    if (dailyRate > currentValue / daysElapsed * 1.1) {
        trend = 'GROWING';
    } else if (dailyRate < currentValue / daysElapsed * 0.9) {
        trend = 'DECLINING';
    }

    // Confidence based on data available
    const confidence = Math.min(1, daysElapsed / 7); // Higher confidence after 7+ days

    // Create alert if significantly off goal
    let alert: PredictiveAlert | undefined;
    if (goalValue && projectedValue < goalValue * 0.8) {
        alert = {
            id: `perf-${entity.id}-${metric}-${Date.now()}`,
            type: 'PERFORMANCE',
            severity: projectedValue < goalValue * 0.6 ? 'CRITICAL' : 'WARNING',
            title: `${metric.charAt(0).toUpperCase() + metric.slice(1)} Goal at Risk`,
            message: `Projected to achieve ${(projectedValue / goalValue * 100).toFixed(0)}% of ${metric} goal (${projectedValue.toLocaleString()} vs ${goalValue.toLocaleString()}).`,
            entityId: entity.id,
            entityName: entity.name,
            entityType,
            metric,
            currentValue,
            projectedValue,
            threshold: goalValue,
            impact: `${((goalValue - projectedValue) / goalValue * 100).toFixed(0)}% shortfall on ${metric}`,
            recommendation: `Review targeting, creative performance, and budget allocation to improve ${metric} delivery.`,
            timestamp: Date.now()
        };
    }

    return {
        entityId: entity.id,
        entityName: entity.name,
        metric,
        currentValue,
        projectedValue,
        goalValue,
        confidence,
        trend,
        alert
    };
}

// ===== Delivery Risk Assessment =====

export function assessDeliveryRisk(
    entity: Campaign | Flight,
    entityType: 'CAMPAIGN' | 'FLIGHT'
): DeliveryRiskAssessment {
    const factors: DeliveryRiskAssessment['factors'] = [];

    // Factor 1: Budget Pacing Risk (weight: 0.3)
    const pacingAnalysis = analyzeBudgetPacing(entity, entityType);
    if (pacingAnalysis) {
        const pacingRisk = Math.min(100, Math.abs(pacingAnalysis.paceVariance));
        factors.push({
            name: 'Budget Pacing',
            score: pacingRisk,
            weight: 0.3,
            description: pacingAnalysis.status === 'ON_TRACK'
                ? 'Budget pacing is on track'
                : `${Math.abs(pacingAnalysis.paceVariance).toFixed(0)}% ${pacingAnalysis.status === 'UNDER_PACING' ? 'under' : 'over'} ideal pace`
        });
    }

    // Factor 2: Performance vs Forecast (weight: 0.25)
    if (entity.delivery && entity.forecast) {
        const deliveryRate = entity.delivery.actualImpressions / Math.max(1, entity.forecast.impressions);
        const performanceRisk = Math.min(100, Math.abs(1 - deliveryRate) * 100);
        factors.push({
            name: 'Delivery Performance',
            score: performanceRisk,
            weight: 0.25,
            description: deliveryRate < 0.8
                ? `Delivering ${(deliveryRate * 100).toFixed(0)}% of forecast`
                : deliveryRate > 1.2
                    ? `Over-delivering at ${(deliveryRate * 100).toFixed(0)}% of forecast`
                    : 'Delivery aligned with forecast'
        });
    }

    // Factor 3: Time Remaining Risk (weight: 0.2)
    const endDate = new Date(entity.endDate);
    const now = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const timeRisk = daysRemaining < 3 ? 100 : daysRemaining < 7 ? 60 : daysRemaining < 14 ? 30 : 10;
    factors.push({
        name: 'Time Pressure',
        score: timeRisk,
        weight: 0.2,
        description: daysRemaining < 3
            ? `Only ${daysRemaining} days remaining`
            : daysRemaining < 7
                ? `${daysRemaining} days remaining`
                : 'Adequate time remaining'
    });

    // Factor 4: Performance Metrics (weight: 0.15)
    if (entity.performance) {
        const performanceRisk =
            entity.performance.ctr < 0.5 ? 80 :
                entity.performance.ctr < 1.0 ? 40 :
                    entity.performance.ctr < 2.0 ? 20 : 10;
        factors.push({
            name: 'Engagement Rate',
            score: performanceRisk,
            weight: 0.15,
            description: `CTR: ${entity.performance.ctr.toFixed(2)}%`
        });
    }

    // Factor 5: Status (weight: 0.1)
    const statusRisk = entity.status === 'PAUSED' ? 100 : entity.status === 'DRAFT' ? 80 : 0;
    factors.push({
        name: 'Status',
        score: statusRisk,
        weight: 0.1,
        description: `Current status: ${entity.status}`
    });

    // Calculate weighted risk score
    const riskScore = factors.reduce((sum, factor) => sum + (factor.score * factor.weight), 0);

    // Determine risk level
    const riskLevel: DeliveryRiskAssessment['riskLevel'] =
        riskScore >= 70 ? 'CRITICAL' :
            riskScore >= 50 ? 'HIGH' :
                riskScore >= 30 ? 'MEDIUM' : 'LOW';

    // Create alert for high/critical risk
    let alert: PredictiveAlert | undefined;
    if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
        const topFactors = factors
            .filter(f => f.score * f.weight > 10)
            .sort((a, b) => (b.score * b.weight) - (a.score * a.weight))
            .slice(0, 2);

        alert = {
            id: `risk-${entity.id}-${Date.now()}`,
            type: 'DELIVERY_RISK',
            severity: riskLevel === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
            title: `${riskLevel} Delivery Risk Detected`,
            message: `Risk score: ${riskScore.toFixed(0)}/100. Primary concerns: ${topFactors.map(f => f.name).join(', ')}.`,
            entityId: entity.id,
            entityName: entity.name,
            entityType,
            metric: 'risk_score',
            currentValue: riskScore,
            impact: topFactors[0]?.description || 'Multiple risk factors detected',
            recommendation: 'Review campaign settings, budget allocation, and performance metrics. Consider reallocating budget or adjusting targeting.',
            timestamp: Date.now()
        };
    }

    return {
        entityId: entity.id,
        entityName: entity.name,
        riskScore,
        riskLevel,
        factors,
        alert
    };
}

// ===== Opportunity Scoring =====

export function identifyOpportunities(
    campaign: Campaign
): OpportunityScore[] {
    const opportunities: OpportunityScore[] = [];

    // Opportunity 1: Budget Reallocation
    if (campaign.flights && campaign.flights.length > 1) {
        const flightPerformance = campaign.flights
            .filter(f => f.performance)
            .map(f => ({
                id: f.id,
                name: f.name,
                roas: f.performance!.roas,
                budget: f.budget,
                spend: f.delivery?.actualSpend || 0
            }))
            .sort((a, b) => b.roas - a.roas);

        if (flightPerformance.length >= 2) {
            const topROAS = flightPerformance[0].roas;
            const avgROAS = flightPerformance.reduce((sum, f) => sum + f.roas, 0) / flightPerformance.length;

            if (topROAS > avgROAS * 1.5) {
                const estimatedLift = (topROAS - avgROAS) / avgROAS * 100;
                opportunities.push({
                    entityId: campaign.id,
                    entityName: campaign.name,
                    opportunityType: 'BUDGET_REALLOCATION',
                    score: Math.min(100, estimatedLift),
                    estimatedImpact: `+${estimatedLift.toFixed(0)}% ROAS potential`,
                    effort: 'LOW',
                    description: `Reallocate budget from lower-performing flights to "${flightPerformance[0].name}" (${topROAS.toFixed(2)}x ROAS).`,
                    recommendation: `Shift 20-30% of budget from underperforming flights to top performer.`
                });
            }
        }
    }

    // Opportunity 2: Channel Performance
    if (campaign.performance) {
        const { ctr, cvr, roas } = campaign.performance;

        // High CTR but low CVR = potential audience/landing page issue
        if (ctr > 2.0 && cvr < 1.0 && roas < 2.0) {
            opportunities.push({
                entityId: campaign.id,
                entityName: campaign.name,
                opportunityType: 'AUDIENCE_EXPANSION',
                score: 75,
                estimatedImpact: '+25-40% conversion rate',
                effort: 'MEDIUM',
                description: 'High click-through rate but low conversion suggests audience refinement opportunity.',
                recommendation: 'Review landing page experience, refine audience targeting, or test conversion-focused creative.'
            });
        }

        // Strong performance = expansion opportunity
        if (roas > 5.0 && ctr > 3.0) {
            opportunities.push({
                entityId: campaign.id,
                entityName: campaign.name,
                opportunityType: 'AUDIENCE_EXPANSION',
                score: 85,
                estimatedImpact: `Potential 2-3x scale at ${roas.toFixed(1)}x ROAS`,
                effort: 'LOW',
                description: 'Exceptional performance indicates room for audience and budget expansion.',
                recommendation: 'Increase budget by 50-100% and test lookalike audiences or broader targeting.'
            });
        }
    }

    // Opportunity 3: Creative Refresh
    const daysSinceStart = Math.ceil((Date.now() - new Date(campaign.startDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceStart > 30 && campaign.performance && campaign.performance.ctr < 1.5) {
        opportunities.push({
            entityId: campaign.id,
            entityName: campaign.name,
            opportunityType: 'CREATIVE_REFRESH',
            score: 60,
            estimatedImpact: '+15-25% CTR improvement',
            effort: 'MEDIUM',
            description: 'Campaign running for 30+ days with below-average engagement.',
            recommendation: 'Test new creative variations or messaging angles to combat ad fatigue.'
        });
    }

    // Create alerts for high-scoring opportunities
    return opportunities.map(opp => {
        if (opp.score >= 70) {
            opp.alert = {
                id: `opp-${opp.entityId}-${opp.opportunityType}-${Date.now()}`,
                type: 'OPPORTUNITY',
                severity: 'INFO',
                title: `Optimization Opportunity Detected`,
                message: opp.description,
                entityId: opp.entityId,
                entityName: opp.entityName,
                entityType: 'CAMPAIGN',
                impact: opp.estimatedImpact,
                recommendation: opp.recommendation,
                timestamp: Date.now()
            };
        }
        return opp;
    });
}

// ===== Aggregate Functions =====

export function getAllAlerts(campaigns: Campaign[]): PredictiveAlert[] {
    const alerts: PredictiveAlert[] = [];

    for (const campaign of campaigns) {
        // Campaign-level alerts
        const campaignPacing = analyzeBudgetPacing(campaign, 'CAMPAIGN');
        if (campaignPacing?.alert) alerts.push(campaignPacing.alert);

        const campaignRisk = assessDeliveryRisk(campaign, 'CAMPAIGN');
        if (campaignRisk?.alert) alerts.push(campaignRisk.alert);

        const opportunities = identifyOpportunities(campaign);
        opportunities.forEach(opp => {
            if (opp.alert) alerts.push(opp.alert);
        });

        // Flight-level alerts
        if (campaign.flights) {
            for (const flight of campaign.flights) {
                const flightPacing = analyzeBudgetPacing(flight, 'FLIGHT');
                if (flightPacing?.alert) alerts.push(flightPacing.alert);

                const flightRisk = assessDeliveryRisk(flight, 'FLIGHT');
                if (flightRisk?.alert) alerts.push(flightRisk.alert);
            }
        }
    }

    // Sort by severity and timestamp
    return alerts.sort((a, b) => {
        const severityOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
        const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
        return severityDiff !== 0 ? severityDiff : b.timestamp - a.timestamp;
    });
}
