import React, { useMemo, useState } from 'react';
import { Campaign } from '../types';
import {
    getAllAlerts,
    analyzeBudgetPacing,
    predictPerformance,
    assessDeliveryRisk,
    identifyOpportunities
} from '../utils/predictiveAnalytics';
import { PredictiveAlertsPanel } from './PredictiveAlertsPanel';
import { DeliveryRiskIndicator } from './DeliveryRiskIndicator';
import { OpportunityScoreCard } from './OpportunityScoreCard';
import { BudgetPacingAlert } from './BudgetPacingAlert';
import { PerformancePredictionCard } from './PerformancePredictionCard';
import { TrendingUp, BarChart3, AlertTriangle, Lightbulb } from 'lucide-react';

interface PredictiveAnalyticsDashboardProps {
    campaigns: Campaign[];
    onBack: () => void;
}

export const PredictiveAnalyticsDashboard: React.FC<PredictiveAnalyticsDashboardProps> = ({
    campaigns,
    onBack
}) => {
    const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

    // Generate all analytics
    const analytics = useMemo(() => {
        const allAlerts = getAllAlerts(campaigns).filter(alert => !dismissedAlerts.has(alert.id));
        const criticalAlerts = allAlerts.filter(a => a.severity === 'CRITICAL');
        const warningAlerts = allAlerts.filter(a => a.severity === 'WARNING');

        // Get risk assessments for all active campaigns
        const riskAssessments = campaigns
            .filter(c => c.status === 'ACTIVE' || c.status === 'PAUSED')
            .map(c => assessDeliveryRisk(c, 'CAMPAIGN'))
            .sort((a, b) => b.riskScore - a.riskScore);

        // Get budget pacing for active campaigns
        const pacingAnalysis = campaigns
            .filter(c => c.status === 'ACTIVE')
            .map(c => analyzeBudgetPacing(c, 'CAMPAIGN'))
            .filter((p): p is NonNullable<typeof p> => p !== null)
            .filter(p => p.status !== 'ON_TRACK');

        // Get performance predictions
        const predictions = campaigns
            .filter(c => c.status === 'ACTIVE' && c.performance)
            .flatMap(c => [
                predictPerformance(c, 'CAMPAIGN', 'impressions'),
                predictPerformance(c, 'CAMPAIGN', 'conversions'),
                predictPerformance(c, 'CAMPAIGN', 'revenue')
            ])
            .filter((p): p is NonNullable<typeof p> => p !== null);

        // Get opportunities
        const opportunities = campaigns
            .filter(c => c.status === 'ACTIVE')
            .flatMap(c => identifyOpportunities(c))
            .sort((a, b) => b.score - a.score);

        return {
            allAlerts,
            criticalAlerts,
            warningAlerts,
            riskAssessments,
            pacingAnalysis,
            predictions,
            opportunities
        };
    }, [campaigns, dismissedAlerts]);

    const handleDismissAlert = (alertId: string) => {
        setDismissedAlerts(prev => new Set([...prev, alertId]));
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={onBack}
                        className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2"
                    >
                        ← Back
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="h-7 w-7 text-purple-600 dark:text-purple-400" />
                        Predictive Analytics Dashboard
                    </h1>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        AI-powered insights and predictions for your campaigns
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                            Critical Alerts
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {analytics.criticalAlerts.length}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                            Warnings
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {analytics.warningAlerts.length}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                            High Risk
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {analytics.riskAssessments.filter(r => r.riskLevel === 'HIGH' || r.riskLevel === 'CRITICAL').length}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-2 mb-2">
                        <Lightbulb className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                            Opportunities
                        </span>
                    </div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {analytics.opportunities.length}
                    </div>
                </div>
            </div>

            {/* Alerts Section */}
            {analytics.allAlerts.length > 0 && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                    <PredictiveAlertsPanel
                        alerts={analytics.allAlerts}
                        onDismiss={handleDismissAlert}
                        maxAlerts={10}
                    />
                </div>
            )}

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                    {/* Budget Pacing Section */}
                    {analytics.pacingAnalysis.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                Budget Pacing Alerts
                            </h2>
                            <div className="space-y-4">
                                {analytics.pacingAnalysis.slice(0, 3).map((pacing, idx) => (
                                    <BudgetPacingAlert
                                        key={idx}
                                        pacing={pacing}
                                        showDetails={true}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Performance Predictions */}
                    {analytics.predictions.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                            <PerformancePredictionCard predictions={analytics.predictions.slice(0, 4)} />
                        </div>
                    )}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Delivery Risk Assessments */}
                    {analytics.riskAssessments.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                Delivery Risk Assessment
                            </h2>
                            <div className="space-y-4">
                                {analytics.riskAssessments.slice(0, 3).map((risk, idx) => (
                                    <DeliveryRiskIndicator
                                        key={idx}
                                        riskAssessment={risk}
                                        compact={false}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Opportunities */}
                    {analytics.opportunities.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                            <OpportunityScoreCard opportunities={analytics.opportunities} />
                        </div>
                    )}
                </div>
            </div>

            {/* Empty State */}
            {analytics.allAlerts.length === 0 && analytics.opportunities.length === 0 && (
                <div className="bg-white dark:bg-gray-800 p-12 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                    <TrendingUp className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        All Systems Running Smoothly
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        No alerts or optimization opportunities detected at this time.
                    </p>
                </div>
            )}
        </div>
    );
};
