import React from 'react';
import { OpportunityScore } from '../utils/predictiveAnalytics';
import { TrendingUp, Zap, Target, RefreshCw, DollarSign, ChevronRight } from 'lucide-react';

interface OpportunityScoreCardProps {
    opportunities: OpportunityScore[];
    onViewDetails?: (opportunity: OpportunityScore) => void;
}

export const OpportunityScoreCard: React.FC<OpportunityScoreCardProps> = ({
    opportunities,
    onViewDetails
}) => {
    if (opportunities.length === 0) {
        return (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                <Zap className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No optimization opportunities detected</p>
            </div>
        );
    }

    const getOpportunityIcon = (type: OpportunityScore['opportunityType']) => {
        switch (type) {
            case 'BUDGET_REALLOCATION':
                return <DollarSign className="h-5 w-5" />;
            case 'CHANNEL_SHIFT':
                return <TrendingUp className="h-5 w-5" />;
            case 'AUDIENCE_EXPANSION':
                return <Target className="h-5 w-5" />;
            case 'CREATIVE_REFRESH':
                return <RefreshCw className="h-5 w-5" />;
        }
    };

    const getEffortColor = (effort: string) => {
        switch (effort) {
            case 'LOW':
                return 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400';
            case 'MEDIUM':
                return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'HIGH':
                return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400';
            default:
                return 'text-gray-600 bg-gray-100 dark:bg-gray-800 dark:text-gray-400';
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 dark:text-green-400';
        if (score >= 60) return 'text-blue-600 dark:text-blue-400';
        if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-gray-600 dark:text-gray-400';
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                    Optimization Opportunities
                </h3>
                <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                    {opportunities.length} found
                </span>
            </div>

            <div className="space-y-3">
                {opportunities.map((opportunity, idx) => (
                    <div
                        key={idx}
                        className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => onViewDetails?.(opportunity)}
                    >
                        <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                                {getOpportunityIcon(opportunity.opportunityType)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                        {opportunity.opportunityType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </h4>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className={`text-lg font-bold ${getScoreColor(opportunity.score)}`}>
                                            {opportunity.score}
                                        </span>
                                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
                                    </div>
                                </div>

                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {opportunity.description}
                                </p>

                                <div className="flex items-center gap-3 text-xs">
                                    <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                                        <TrendingUp className="h-3 w-3" />
                                        {opportunity.estimatedImpact}
                                    </div>
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getEffortColor(opportunity.effort)}`}>
                                        {opportunity.effort} Effort
                                    </span>
                                </div>

                                {opportunity.recommendation && (
                                    <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 border-l-2 border-purple-400 dark:border-purple-600 rounded text-xs text-gray-700 dark:text-gray-300">
                                        <span className="font-semibold">Action:</span> {opportunity.recommendation}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
