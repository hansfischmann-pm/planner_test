import React from 'react';
import { DeliveryRiskAssessment } from '../utils/predictiveAnalytics';
import { AlertTriangle, TrendingDown, Activity, Clock } from 'lucide-react';

interface DeliveryRiskIndicatorProps {
    riskAssessment: DeliveryRiskAssessment;
    compact?: boolean;
}

export const DeliveryRiskIndicator: React.FC<DeliveryRiskIndicatorProps> = ({
    riskAssessment,
    compact = false
}) => {
    const { riskScore, riskLevel, factors } = riskAssessment;

    const getRiskColor = () => {
        switch (riskLevel) {
            case 'CRITICAL':
                return {
                    bg: 'bg-red-100 dark:bg-red-900/30',
                    border: 'border-red-300 dark:border-red-700',
                    text: 'text-red-800 dark:text-red-200',
                    bar: 'bg-red-600 dark:bg-red-500',
                    badge: 'bg-red-600 text-white'
                };
            case 'HIGH':
                return {
                    bg: 'bg-orange-100 dark:bg-orange-900/30',
                    border: 'border-orange-300 dark:border-orange-700',
                    text: 'text-orange-800 dark:text-orange-200',
                    bar: 'bg-orange-600 dark:bg-orange-500',
                    badge: 'bg-orange-600 text-white'
                };
            case 'MEDIUM':
                return {
                    bg: 'bg-yellow-100 dark:bg-yellow-900/30',
                    border: 'border-yellow-300 dark:border-yellow-700',
                    text: 'text-yellow-800 dark:text-yellow-200',
                    bar: 'bg-yellow-600 dark:bg-yellow-500',
                    badge: 'bg-yellow-600 text-white'
                };
            case 'LOW':
                return {
                    bg: 'bg-green-100 dark:bg-green-900/30',
                    border: 'border-green-300 dark:border-green-700',
                    text: 'text-green-800 dark:text-green-200',
                    bar: 'bg-green-600 dark:bg-green-500',
                    badge: 'bg-green-600 text-white'
                };
        }
    };

    const colors = getRiskColor();
    const topFactors = factors
        .map(f => ({ ...f, weightedScore: f.score * f.weight }))
        .sort((a, b) => b.weightedScore - a.weightedScore)
        .slice(0, 3);

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <div className={`px-2 py-1 rounded text-xs font-medium ${colors.badge}`}>
                    {riskLevel}
                </div>
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2 max-w-24">
                    <div
                        className={`h-2 rounded-full transition-all ${colors.bar}`}
                        style={{ width: `${riskScore}%` }}
                    />
                </div>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                    {riskScore.toFixed(0)}
                </span>
            </div>
        );
    }

    return (
        <div className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-5 w-5 ${colors.text}`} />
                    <h3 className={`text-sm font-semibold ${colors.text}`}>
                        Delivery Risk Assessment
                    </h3>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
                    {riskLevel} RISK
                </span>
            </div>

            {/* Risk Score Bar */}
            <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                    <span className={colors.text}>Risk Score</span>
                    <span className={`font-semibold ${colors.text}`}>{riskScore.toFixed(0)}/100</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div
                        className={`h-3 rounded-full transition-all ${colors.bar}`}
                        style={{ width: `${riskScore}%` }}
                    />
                </div>
            </div>

            {/* Top Risk Factors */}
            <div className="space-y-2">
                <h4 className={`text-xs font-medium ${colors.text} uppercase tracking-wide`}>
                    Key Risk Factors
                </h4>
                {topFactors.map((factor, idx) => (
                    <div key={idx} className="bg-white/50 dark:bg-black/20 rounded p-2">
                        <div className="flex items-center justify-between mb-1">
                            <span className={`text-xs font-medium ${colors.text}`}>
                                {factor.name}
                            </span>
                            <span className={`text-xs ${colors.text}`}>
                                {(factor.weightedScore).toFixed(0)}pts
                            </span>
                        </div>
                        <p className={`text-xs ${colors.text} opacity-75`}>
                            {factor.description}
                        </p>
                        <div className="mt-1 w-full bg-gray-300 dark:bg-gray-600 rounded-full h-1">
                            <div
                                className={`h-1 rounded-full ${colors.bar}`}
                                style={{ width: `${factor.score}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
