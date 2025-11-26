import React, { useState } from 'react';
import { AgentInfo, AgentExecution } from '../types';
import { Code2, ChevronDown, ChevronRight, Check, Loader } from 'lucide-react';
import { clsx } from 'clsx';

interface AgentTransparencyPanelProps {
    agents: AgentInfo[];
    executions: AgentExecution[];
}

export const AgentTransparencyPanel: React.FC<AgentTransparencyPanelProps> = ({ agents, executions }) => {
    const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
    const [showCodeFor, setShowCodeFor] = useState<string | null>(null);

    const toggleAgent = (agentId: string) => {
        const newExpanded = new Set(expandedAgents);
        if (newExpanded.has(agentId)) {
            newExpanded.delete(agentId);
        } else {
            newExpanded.add(agentId);
        }
        setExpandedAgents(newExpanded);
    };

    const getAgentExecutions = (agentId: string) => {
        return executions.filter(e => e.agentId === agentId);
    };

    const getCodeExample = (agentName: string) => {
        const codeExamples: Record<string, string> = {
            'Insights Agent': `// Analyzing campaign performance trends
function analyzePerformance(campaign) {
  const metrics = campaign.placements.map(p => ({
    channel: p.channel,
    roas: p.performance?.roas || 0,
    ctr: p.performance?.ctr || 0
  }));
  
  // Identify top performers
  return metrics
    .filter(m => m.roas > 2.0)
    .sort((a, b) => b.roas - a.roas);
}`,
            'Performance Agent': `// Optimizing budget allocation
function optimizeBudget(placements, totalBudget) {
  // Calculate efficiency scores
  const scores = placements.map(p => ({
    id: p.id,
    efficiency: p.performance.roas / p.totalCost
  }));
  
  // Reallocate to high-efficiency placements
  return reallocate(scores, totalBudget);
}`,
            'Yield Agent': `// Negotiating rates with vendors
function negotiateRates(vendor, volume) {
  const baseRate = vendor.baseRate;
  const discount = calculateVolumeDiscount(volume);
  
  return {
    vendor: vendor.name,
    negotiatedRate: baseRate * (1 - discount),
    savings: baseRate * discount * volume
  };
}`,
            'Creative Agent': `// Analyzing creative performance
function analyzeCreative(placements) {
  const creatives = placements.map(p => ({
    id: p.creative.id,
    type: p.creative.type,
    ctr: p.performance.ctr
  }));
  
  // Identify best-performing creative types
  return groupByType(creatives);
}`,
            'Audience Agent': `// Optimizing audience targeting
function optimizeAudience(campaign) {
  const segments = campaign.placements.map(p => ({
    segment: p.segment,
    reach: p.performance.impressions,
    cvr: p.performance.cvr
  }));
  
  // Find high-converting segments
  return segments.filter(s => s.cvr > 0.03);
}`
        };

        return codeExamples[agentName] || `// Code example for ${agentName}\nfunction process() {\n  // Implementation details\n}`;
    };

    if (agents.length === 0) {
        return null;
    }

    return (
        <div className="bg-white border-l border-gray-200 w-80 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Code2 className="h-4 w-4 text-purple-600" />
                    Agent Transparency
                </h3>
                <p className="text-xs text-gray-500 mt-1">Active agents and their execution</p>
            </div>

            <div className="flex-1 overflow-y-auto">
                {agents.map(agent => {
                    const isExpanded = expandedAgents.has(agent.id);
                    const agentExecutions = getAgentExecutions(agent.id);

                    return (
                        <div key={agent.id} className="border-b border-gray-100">
                            <button
                                onClick={() => toggleAgent(agent.id)}
                                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            {isExpanded ? (
                                                <ChevronDown className="h-4 w-4 text-gray-400" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-gray-400" />
                                            )}
                                            <span className="text-sm font-medium text-gray-900">{agent.name}</span>
                                        </div>
                                        <div className="ml-6 mt-1">
                                            <span className="text-xs text-gray-500">{agent.role}</span>
                                        </div>
                                        <div className="ml-6 mt-2 flex flex-wrap gap-1">
                                            {agent.capabilities.map(cap => (
                                                <span
                                                    key={cap}
                                                    className={clsx(
                                                        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                                                        agent.color
                                                    )}
                                                >
                                                    {cap}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {agent.status === 'IDLE' && (
                                            <Check className="h-4 w-4 text-green-500" />
                                        )}
                                        {agent.status === 'PROCESSING' && (
                                            <Loader className="h-4 w-4 text-blue-500 animate-spin" />
                                        )}
                                    </div>
                                </div>
                            </button>

                            {isExpanded && (
                                <div className="px-4 pb-4 ml-6 space-y-3">
                                    {/* Show Code Button */}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setShowCodeFor(showCodeFor === agent.id ? null : agent.id);
                                        }}
                                        className="flex items-center gap-2 text-xs text-purple-600 hover:text-purple-700 font-medium"
                                    >
                                        <Code2 className="h-3 w-3" />
                                        {showCodeFor === agent.id ? 'Hide Code' : 'Show Code'}
                                    </button>

                                    {/* Code Dialog */}
                                    {showCodeFor === agent.id && (
                                        <div className="bg-gray-900 text-gray-100 rounded-lg p-3 text-xs font-mono overflow-x-auto">
                                            <pre className="whitespace-pre-wrap">{getCodeExample(agent.name)}</pre>
                                        </div>
                                    )}

                                    {/* Executions */}
                                    {agentExecutions.length > 0 && (
                                        <div className="space-y-2">
                                            <div className="text-xs font-medium text-gray-700">Recent Actions:</div>
                                            {agentExecutions.slice(0, 3).map(execution => (
                                                <div
                                                    key={execution.id}
                                                    className="text-xs p-2 bg-gray-50 rounded border border-gray-200"
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="font-medium text-gray-900">{execution.action}</span>
                                                        <span className={clsx(
                                                            "inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium",
                                                            execution.status === 'COMPLETED' && "bg-green-100 text-green-800",
                                                            execution.status === 'IN_PROGRESS' && "bg-blue-100 text-blue-800",
                                                            execution.status === 'FAILED' && "bg-red-100 text-red-800"
                                                        )}>
                                                            {execution.status}
                                                        </span>
                                                    </div>
                                                    {execution.details && (
                                                        <div className="text-gray-600">{execution.details}</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
