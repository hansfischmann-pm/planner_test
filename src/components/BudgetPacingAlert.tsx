import React from 'react';
import { BudgetPacingAnalysis } from '../utils/predictiveAnalytics';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BudgetPacingAlertProps {
    pacing: BudgetPacingAnalysis;
    showDetails?: boolean;
}

export const BudgetPacingAlert: React.FC<BudgetPacingAlertProps> = ({
    pacing,
    showDetails = true
}) => {
    const { status, paceVariance, budget, actualSpend, projectedSpend, daysRemaining, idealSpend } = pacing;

    const getStatusIcon = () => {
        switch (status) {
            case 'UNDER_PACING':
                return <TrendingDown className="h-5 w-5" />;
            case 'OVER_PACING':
                return <TrendingUp className="h-5 w-5" />;
            case 'ON_TRACK':
                return <Minus className="h-5 w-5" />;
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'UNDER_PACING':
                return {
                    bg: 'bg-orange-50 dark:bg-orange-900/20',
                    border: 'border-orange-300 dark:border-orange-700',
                    text: 'text-orange-700 dark:text-orange-300',
                    icon: 'text-orange-600 dark:text-orange-400',
                    bar: 'bg-orange-500'
                };
            case 'OVER_PACING':
                return {
                    bg: 'bg-red-50 dark:bg-red-900/20',
                    border: 'border-red-300 dark:border-red-700',
                    text: 'text-red-700 dark:text-red-300',
                    icon: 'text-red-600 dark:text-red-400',
                    bar: 'bg-red-500'
                };
            case 'ON_TRACK':
                return {
                    bg: 'bg-green-50 dark:bg-green-900/20',
                    border: 'border-green-300 dark:border-green-700',
                    text: 'text-green-700 dark:text-green-300',
                    icon: 'text-green-600 dark:text-green-400',
                    bar: 'bg-green-500'
                };
        }
    };

    const colors = getStatusColor();
    const spendPercentage = (actualSpend / budget) * 100;
    const idealPercentage = (idealSpend / budget) * 100;

    return (
        <div className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
            <div className="flex items-center gap-2 mb-3">
                <div className={colors.icon}>
                    {getStatusIcon()}
                </div>
                <h3 className={`text-sm font-semibold ${colors.text}`}>
                    Budget Pacing
                </h3>
                <span className={`ml-auto px-2 py-1 rounded text-xs font-medium ${colors.bg} ${colors.border} border ${colors.text}`}>
                    {status.replace('_', ' ')}
                </span>
            </div>

            {/* Spend Progress Bar */}
            <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Actual Spend</span>
                    <span className={`font-semibold ${colors.text}`}>
                        ${actualSpend.toLocaleString()} / ${budget.toLocaleString()}
                    </span>
                </div>
                <div className="relative w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    {/* Ideal pace marker */}
                    <div
                        className="absolute top-0 bottom-0 w-0.5 bg-gray-400 dark:bg-gray-500"
                        style={{ left: `${idealPercentage}%` }}
                        title={`Ideal: $${idealSpend.toLocaleString()}`}
                    />
                    {/* Actual spend */}
                    <div
                        className={`h-3 rounded-full transition-all ${colors.bar}`}
                        style={{ width: `${Math.min(100, spendPercentage)}%` }}
                    />
                </div>
                <div className="flex justify-between text-xs mt-1 text-gray-500 dark:text-gray-400">
                    <span>Ideal: ${idealSpend.toLocaleString()}</span>
                    <span>{daysRemaining} days left</span>
                </div>
            </div>

            {showDetails && (
                <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center p-2 bg-white/50 dark:bg-black/20 rounded">
                        <span className="text-gray-600 dark:text-gray-400">Pace Variance</span>
                        <span className={`font-semibold ${colors.text}`}>
                            {paceVariance > 0 ? '+' : ''}{paceVariance.toFixed(1)}%
                        </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white/50 dark:bg-black/20 rounded">
                        <span className="text-gray-600 dark:text-gray-400">Projected Spend</span>
                        <span className={`font-semibold ${colors.text}`}>
                            ${projectedSpend.toLocaleString()}
                        </span>
                    </div>
                    {projectedSpend < budget && (
                        <div className="flex justify-between items-center p-2 bg-white/50 dark:bg-black/20 rounded">
                            <span className="text-gray-600 dark:text-gray-400">Projected Underdelivery</span>
                            <span className={`font-semibold ${colors.text}`}>
                                ${(budget - projectedSpend).toLocaleString()} ({((budget - projectedSpend) / budget * 100).toFixed(0)}%)
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
