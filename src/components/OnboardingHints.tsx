import React from 'react';
import { AgentState } from '../logic/agentBrain';
import { HelpCircle, Info } from 'lucide-react';

interface OnboardingHintsProps {
    state: AgentState;
}

export const OnboardingHints: React.FC<OnboardingHintsProps> = ({ state }) => {
    const getHint = () => {
        switch (state) {
            case 'INIT':
                return {
                    title: "Getting Started",
                    text: "Media planning starts with a Brief. Define your Client, Budget, and Goals. The Agent will use this to structure the plan."
                };
            case 'BUDGETING':
                return {
                    title: "Budget Allocation",
                    text: "The '70/20/10 Rule' is a classic strategy: 70% 'Now' (Proven), 20% 'New' (Emerging), 10% 'Next' (Experimental)."
                };
            case 'CHANNEL_SELECTION':
                return {
                    title: "Channel Mix",
                    text: "Different channels serve different goals. Search captures intent (Conversion), while Display/TV builds awareness (Reach)."
                };
            case 'REFINEMENT':
                return {
                    title: "Optimization",
                    text: "Check your CPMs (Cost Per Thousand). If they look high, ask the agent to optimize for efficiency."
                };
            default:
                return null;
        }
    };

    const hint = getHint();
    if (!hint) return null;

    return (
        <div className="absolute bottom-6 right-6 max-w-sm bg-white p-4 rounded-xl shadow-lg border border-yellow-100 animate-fade-in z-10">
            <div className="flex items-start gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                    <Info className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">{hint.title}</h3>
                    <p className="text-xs text-gray-600 leading-relaxed">{hint.text}</p>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                    <HelpCircle className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
