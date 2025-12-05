import React, { useState } from 'react';
import { Portfolio } from '../types';
import { ArrowRight, TrendingUp, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { validateBudgetShift } from '../utils/validation';

interface BudgetOptimizerProps {
    portfolio: Portfolio;
    onApplyShift: (sourceId: string, targetId: string, amount: number) => void;
}

export const BudgetOptimizer: React.FC<BudgetOptimizerProps> = ({ portfolio, onApplyShift }) => {
    const [sourceId, setSourceId] = useState<string>('');
    const [targetId, setTargetId] = useState<string>('');
    const [amount, setAmount] = useState<number>(0);
    const [isSimulating, setIsSimulating] = useState(false);
    const [validationError, setValidationError] = useState<string>('');

    const activeCampaigns = portfolio.campaigns.filter(c => c.status === 'ACTIVE');
    const sourceCampaign = activeCampaigns.find(c => c.id === sourceId);
    const targetCampaign = activeCampaigns.find(c => c.id === targetId);

    const maxShift = sourceCampaign ? sourceCampaign.budget * 0.5 : 0; // Max 50% shift

    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);



    const handleApply = () => {
        if (!sourceCampaign || !targetCampaign || amount <= 0) return;
        onApplyShift(sourceId, targetId, amount);
        setAmount(0);
        setIsSimulating(false);
        alert(`Successfully moved ${formatCurrency(amount)} from ${sourceCampaign.name} to ${targetCampaign.name}`);
    };

    // Simple forecast calculation
    const sourceRoas = sourceCampaign?.performance?.roas || 0;
    const targetRoas = targetCampaign?.performance?.roas || 0;
    const projectedImpact = (amount * targetRoas) - (amount * sourceRoas);

    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">Budget Optimizer</h3>
                    <p className="text-sm text-gray-500">Shift budget to higher-performing campaigns</p>
                </div>
                <div className="p-2 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                    AI Recommendation: Shift $50k to "{activeCampaigns.sort((a, b) => (b.performance?.roas || 0) - (a.performance?.roas || 0))[0]?.name}"
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mb-8">
                {/* Source */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">From (Source)</label>
                    <select
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={sourceId}
                        onChange={(e) => {
                            setSourceId(e.target.value);
                            setAmount(0);
                            setIsSimulating(false);
                        }}
                    >
                        <option value="">Select Campaign...</option>
                        {activeCampaigns.filter(c => c.id !== targetId).map(c => (
                            <option key={c.id} value={c.id}>
                                {c.name} (ROAS: {(c.performance?.roas || 0).toFixed(2)}x)
                            </option>
                        ))}
                    </select>
                    {sourceCampaign && (
                        <div className="text-xs text-gray-500 flex justify-between">
                            <span>Available: {formatCurrency(sourceCampaign.budget)}</span>
                            <span className="text-red-600">ROAS: {(sourceCampaign.performance?.roas || 0).toFixed(2)}x</span>
                        </div>
                    )}
                </div>

                {/* Amount */}
                <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-2 bg-gray-100 rounded-full">
                        <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                    <div className="w-full px-4">
                        <input
                            type="range"
                            min="0"
                            max={maxShift}
                            step="1000"
                            value={amount}
                            onChange={(e) => {
                                const newAmount = parseInt(e.target.value);
                                setAmount(newAmount);

                                if (sourceCampaign && targetCampaign) {
                                    const validation = validateBudgetShift(
                                        newAmount,
                                        sourceCampaign.budget
                                    );

                                    if (!validation.isValid) {
                                        setValidationError(validation.error || '');
                                        setIsSimulating(false);
                                    } else {
                                        setValidationError('');
                                        setIsSimulating(true);
                                    }
                                } else {
                                    setIsSimulating(true);
                                }
                            }}
                            disabled={!sourceId || !targetId}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                    </div>
                    <div className="font-bold text-gray-900">{formatCurrency(amount)}</div>
                </div>

                {/* Target */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase">To (Target)</label>
                    <select
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        value={targetId}
                        onChange={(e) => {
                            setTargetId(e.target.value);
                            setIsSimulating(false);
                        }}
                    >
                        <option value="">Select Campaign...</option>
                        {activeCampaigns.filter(c => c.id !== sourceId).map(c => (
                            <option key={c.id} value={c.id}>
                                {c.name} (ROAS: {(c.performance?.roas || 0).toFixed(2)}x)
                            </option>
                        ))}
                    </select>
                    {targetCampaign && (
                        <div className="text-xs text-gray-500 flex justify-between">
                            <span>Current: {formatCurrency(targetCampaign.budget)}</span>
                            <span className="text-green-600">ROAS: {(targetCampaign.performance?.roas || 0).toFixed(2)}x</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Validation Errors */}
            {validationError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-red-900">Validation Error</h4>
                        <p className="text-sm text-red-700 mt-1">{validationError}</p>
                    </div>
                </div>
            )}

            {/* Warning for large shifts */}
            {!validationError && amount > 0 && sourceCampaign && amount > sourceCampaign.budget * 0.3 && (
                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                        <h4 className="text-sm font-bold text-amber-900">Large Budget Shift</h4>
                        <p className="text-sm text-amber-700 mt-1">
                            You're shifting more than 30% of the source campaign's budget. This is a significant change that may impact campaign performance.
                        </p>
                    </div>
                </div>
            )}

            {/* Simulation Results */}
            {isSimulating && sourceCampaign && targetCampaign && amount > 0 && (
                <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-start gap-3">
                        <TrendingUp className={`w-5 h-5 mt-0.5 ${projectedImpact >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                        <div>
                            <h4 className="text-sm font-bold text-gray-900">Projected Impact</h4>
                            <p className="text-sm text-gray-600 mt-1">
                                Moving this budget is estimated to
                                <span className={projectedImpact >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                                    {' '}{projectedImpact >= 0 ? 'increase' : 'decrease'} revenue by {formatCurrency(Math.abs(projectedImpact))}
                                </span> based on current ROAS performance.
                            </p>
                            <div className="mt-3 flex gap-4 text-xs">
                                <div>
                                    <span className="text-gray-500">New {sourceCampaign.name} Budget:</span>
                                    <div className="font-medium">{formatCurrency(sourceCampaign.budget - amount)}</div>
                                </div>
                                <div>
                                    <span className="text-gray-500">New {targetCampaign.name} Budget:</span>
                                    <div className="font-medium">{formatCurrency(targetCampaign.budget + amount)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-end pt-4 border-t border-gray-100">
                <button
                    onClick={handleApply}
                    disabled={!isSimulating || amount <= 0 || !!validationError}
                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    title={validationError ? validationError : 'Apply the budget shift'}
                >
                    <CheckCircle2 className="w-4 h-4" />
                    Apply Budget Shift
                </button>
            </div>
        </div>
    );
};
