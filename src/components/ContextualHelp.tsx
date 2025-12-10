import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { AgentState } from '../logic/agentBrain';

interface ContextualHelpProps {
    state: AgentState | 'IDLE';
    currentView?: 'LOGIN' | 'CLIENT_SELECTION' | 'CAMPAIGN_LIST' | 'FLIGHT_LIST' | 'MEDIA_PLAN' | 'AGENCY_ANALYTICS' | 'ATTRIBUTION';
    hasPlan?: boolean;
    onSendPrompt: (prompt: string) => void;
}

export const ContextualHelp: React.FC<ContextualHelpProps> = ({ state: _state, currentView, hasPlan, onSendPrompt }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const getPrompts = (): { category: string; prompts: string[] }[] => {
        // No plan exists - show creation prompts
        if (!hasPlan && currentView === 'MEDIA_PLAN') {
            return [
                {
                    category: 'Getting Started',
                    prompts: [
                        'Create a media plan with a budget of $500k',
                        'Generate a plan focused on digital channels',
                        'Build a balanced plan for Q1 2025'
                    ]
                }
            ];
        }

        // Plan exists - show optimization prompts
        if (hasPlan && currentView === 'MEDIA_PLAN') {
            return [
                {
                    category: 'Add Placements',
                    prompts: [
                        'Add a Google Search campaign',
                        'Add TV placements on ESPN',
                        'Add Meta social ads targeting millennials'
                    ]
                },
                {
                    category: 'Optimize',
                    prompts: [
                        'Optimize for reach',
                        'Optimize for conversions',
                        'Pause underperformers',
                        'Shift budget to top performers'
                    ]
                },
                {
                    category: 'Adjust',
                    prompts: [
                        'Pause row 3',
                        'Change to grouped view',
                        'Switch to bottom layout',
                        'Show performance metrics'
                    ]
                }
            ];
        }

        // Campaign list view
        if (currentView === 'CAMPAIGN_LIST') {
            return [
                {
                    category: 'Campaign Management',
                    prompts: [
                        'Create a new Q4 campaign',
                        'Show campaign details',
                        'Filter by active campaigns'
                    ]
                }
            ];
        }

        // Agency analytics view
        if (currentView === 'AGENCY_ANALYTICS') {
            return [
                {
                    category: 'Analytics',
                    prompts: [
                        'Export agency data',
                        'Show top performing clients',
                        'Compare channel performance'
                    ]
                }
            ];
        }

        // Attribution Analysis view
        if (currentView === 'ATTRIBUTION') {
            return [
                {
                    category: 'Attribution & Lift',
                    prompts: [
                        'Explain incrementality testing',
                        'Compare first-touch vs linear models',
                        'Help me set up a holdout test',
                        'What is a good confidence score?'
                    ]
                }
            ];
        }

        return [];
    };

    const prompts = getPrompts();

    if (prompts.length === 0) {
        return null;
    }

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                title="Show available prompts"
            >
                <Lightbulb className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Suggestions</span>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* Expanded Prompt List */}
            {isExpanded && (
                <div className="absolute bottom-full mb-2 left-0 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50 max-h-96 overflow-auto">
                    <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <HelpCircle className="w-5 h-5 text-purple-600" />
                            <h3 className="font-semibold text-gray-900">Try These Prompts</h3>
                        </div>

                        <div className="space-y-4">
                            {prompts.map((section, idx) => (
                                <div key={idx}>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                        {section.category}
                                    </p>
                                    <div className="space-y-1">
                                        {section.prompts.map((prompt, promptIdx) => (
                                            <button
                                                key={promptIdx}
                                                onClick={() => {
                                                    onSendPrompt(prompt);
                                                    setIsExpanded(false);
                                                }}
                                                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg transition-colors flex items-start gap-2"
                                            >
                                                <span className="text-purple-400 mt-0.5">→</span>
                                                <span className="flex-1">{prompt}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-4 pt-3 border-t border-gray-100">
                            <p className="text-xs text-gray-500">
                                💡 Tip: You can also type natural language requests like "add more display ads" or "what's my total spend?"
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
