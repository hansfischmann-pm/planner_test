import React, { useState, useRef, useEffect } from 'react';
import { AgentMessage } from '../types';
import { Send, Cpu, ChevronDown, ChevronRight } from 'lucide-react';
import { ContextualHelp } from './ContextualHelp';

interface ChatInterfaceProps {
  messages: AgentMessage[];
  onSendMessage: (msg: string) => void;
  isTyping?: boolean;
  currentView?: 'LOGIN' | 'CLIENT_SELECTION' | 'CAMPAIGN_LIST' | 'FLIGHT_LIST' | 'MEDIA_PLAN' | 'AGENCY_ANALYTICS';
  agentState?: 'IDLE' | 'WORKING' | 'WAITING';
  hasPlan?: boolean;
  layout?: 'LEFT' | 'RIGHT' | 'BOTTOM';
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isTyping, currentView, agentState, hasPlan, layout = 'LEFT' }) => {
  const [input, setInput] = useState('');
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  const toggleAgentExpansion = (messageId: string, agentName: string) => {
    const key = `${messageId}-${agentName}`;
    const newExpanded = new Set(expandedAgents);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpandedAgents(newExpanded);
  };

  const getAgentDetails = (agentName: string) => {
    const details: Record<string, { description: string; code: string }> = {
      'Insights Agent': {
        description: 'Analyzing campaign data and identifying optimization opportunities based on performance metrics and industry benchmarks.',
        code: `// Campaign Performance Analysis
async function analyzePerformance(campaign) {
  const placements = campaign.placements || [];
  
  // Calculate aggregate metrics
  const metrics = placements.reduce((acc, p) => ({
    totalSpend: acc.totalSpend + p.totalCost,
    totalImpressions: acc.totalImpressions + (p.performance?.impressions || 0),
    totalClicks: acc.totalClicks + (p.performance?.clicks || 0),
    totalConversions: acc.totalConversions + (p.performance?.conversions || 0)
  }), { totalSpend: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0 });
  
  // Identify top performers by ROAS
  const topPerformers = placements
    .filter(p => p.performance && p.performance.roas > 2.0)
    .sort((a, b) => b.performance.roas - a.performance.roas)
    .slice(0, 5);
  
  // Find underperformers needing attention
  const underperformers = placements
    .filter(p => p.performance && p.performance.roas < 1.0)
    .map(p => ({
      id: p.id,
      vendor: p.vendor,
      roas: p.performance.roas,
      spend: p.totalCost
    }));
  
  return {
    overview: metrics,
    recommendations: {
      scale: topPerformers.map(p => p.vendor),
      pause: underperformers,
      totalWastedSpend: underperformers.reduce((sum, p) => sum + p.spend, 0)
    }
  };
}`
      },
      'Performance Agent': {
        description: 'Optimizing budget allocation across channels to maximize ROI and campaign effectiveness.',
        code: `// Budget Optimization Algorithm
function optimizeBudgetAllocation(placements, totalBudget) {
  // Calculate efficiency score for each placement
  const placementScores = placements.map(p => {
    const roas = p.performance?.roas || 0;
    const spend = p.totalCost || 0;
    const efficiency = spend > 0 ? roas / spend : 0;
    
    return {
      id: p.id,
      vendor: p.vendor,
      channel: p.channel,
      currentSpend: spend,
      efficiency: efficiency,
      roas: roas,
      scalePotential: calculateScalePotential(p)
    };
  });
  
  // Sort by efficiency and scale potential
  const ranked = placementScores.sort((a, b) => {
    const scoreA = a.efficiency * a.scalePotential;
    const scoreB = b.efficiency * b.scalePotential;
    return scoreB - scoreA;
  });
  
  // Redistribute budget to top performers
  let remainingBudget = totalBudget;
  const newAllocation = ranked.map((p, idx) => {
    const baseAllocation = totalBudget * 0.05; // Minimum 5%
    const bonusAllocation = (remainingBudget * 0.6) / (idx + 1); // Weighted by rank
    const allocation = Math.min(baseAllocation + bonusAllocation, remainingBudget);
    
    remainingBudget -= allocation;
    
    return {
      ...p,
      recommendedBudget: allocation,
      change: allocation - p.currentSpend
    };
  });
  
  return newAllocation;
}

function calculateScalePotential(placement) {
  // Consider impression share, market size, etc.
  const impressionShare = placement.performance?.impressionShare || 0.5;
  const roomToGrow = 1 - impressionShare;
  return roomToGrow * (placement.performance?.roas || 1);
}`
      },
      'Yield Agent': {
        description: 'Negotiating rates with media vendors and identifying cost-saving opportunities through volume discounts.',
        code: `// Vendor Rate Negotiation
class YieldOptimizer {
  constructor(vendors, historicalData) {
    this.vendors = vendors;
    this.history = historicalData;
  }
  
  negotiateRates(placement) {
    const vendor = this.vendors[placement.vendor];
    const volume = this.calculateTotalVolume(placement.vendor);
    
    // Calculate volume-based discount tier
    const discountTier = this.getDiscountTier(volume);
    const baseRate = placement.rate;
    const negotiatedRate = baseRate * (1 - discountTier.discount);
    
    // Calculate potential savings
    const savings = {
      perUnit: baseRate - negotiatedRate,
      total: (baseRate - negotiatedRate) * placement.quantity,
      percentage: (discountTier.discount * 100).toFixed(2)
    };
    
    return {
      vendor: placement.vendor,
      originalRate: baseRate,
      negotiatedRate: negotiatedRate,
      savings: savings,
      tier: discountTier.name
    };
  }
  
  getDiscountTier(volume) {
    if (volume > 10000000) return { name: 'Platinum', discount: 0.20 };
    if (volume > 5000000) return { name: 'Gold', discount: 0.15 };
    if (volume > 1000000) return { name: 'Silver', discount: 0.10 };
    return { name: 'Standard', discount: 0.05 };
  }
  
  calculateTotalVolume(vendorName) {
    return this.history
      .filter(p => p.vendor === vendorName)
      .reduce((sum, p) => sum + (p.performance?.impressions || 0), 0);
  }
}`
      },
      'Creative Agent': {
        description: 'Analyzing creative performance to identify winning ad formats and messaging strategies.',
        code: `// Creative Performance Analysis
async function analyzeCreativePerformance(placements) {
  const creativeData = [];
  
  // Group placements by creative attributes
  placements.forEach(p => {
    if (!p.creative) return;
    
    const creative = p.creative;
    creativeData.push({
      id: creative.id,
      type: creative.type, // 'video', 'image', 'carousel', etc.
      format: creative.format,
      messaging: creative.messaging,
      cta: creative.cta,
      metrics: {
        impressions: p.performance?.impressions || 0,
        clicks: p.performance?.clicks || 0,
        conversions: p.performance?.conversions || 0,
        ctr: p.performance?.ctr || 0,
        cvr: p.performance?.cvr || 0,
        cpa: p.performance?.cpa || 0
      }
    });
  });
  
  // Calculate averages by creative type
  const avgByType = creativeData.reduce((acc, c) => {
    if (!acc[c.type]) {
      acc[c.type] = { count: 0, totalCTR: 0, totalCVR: 0, totalCPA: 0 };
    }
    acc[c.type].count++;
    acc[c.type].totalCTR += c.metrics.ctr;
    acc[c.type].totalCVR += c.metrics.cvr;
    acc[c.type].totalCPA += c.metrics.cpa;
    return acc;
  }, {});
  
  // Find winning creative patterns
  const insights = Object.entries(avgByType).map(([type, data]) => ({
    type: type,
    avgCTR: data.totalCTR / data.count,
    avgCVR: data.totalCVR / data.count,
    avgCPA: data.totalCPA / data.count,
    sampleSize: data.count,
    recommendation: data.totalCTR / data.count > 0.02 ? 'Scale' : 'Test'
  }));
  
  return {
    insights: insights.sort((a, b) => b.avgCTR - a.avgCTR),
    topPerformer: insights[0],
    recommendation: generateCreativeRecommendation(insights)
  };
}

function generateCreativeRecommendation(insights) {
  const top = insights[0];
  return \`Focus on \${top.type} creatives with \${top.avgCTR.toFixed(2)}% CTR. 
          Consider A/B testing variations of top performers.\`;
}`
      },
      'Audience Agent': {
        description: 'Identifying high-converting audience segments and optimizing targeting strategies.',
        code: `// Audience Segmentation & Optimization
class AudienceOptimizer {
  async analyzeSegments(placements) {
    const segments = this.groupBySegment(placements);
    
    // Calculate performance metrics per segment
    const segmentPerformance = segments.map(seg => {
      const totalSpend = seg.placements.reduce((sum, p) => sum + p.totalCost, 0);
      const totalConversions = seg.placements.reduce((sum, p) => 
        sum + (p.performance?.conversions || 0), 0);
      const totalImpressions = seg.placements.reduce((sum, p) => 
        sum + (p.performance?.impressions || 0), 0);
      
      const avgCVR = seg.placements.reduce((sum, p) => 
        sum + (p.performance?.cvr || 0), 0) / seg.placements.length;
      
      return {
        segment: seg.name,
        reach: totalImpressions,
        conversions: totalConversions,
        spend: totalSpend,
        cpa: totalSpend / totalConversions,
        cvr: avgCVR,
        roas: (totalConversions * 50) / totalSpend, // Assuming $50 AOV
        efficiency: totalConversions / totalSpend
      };
    });
    
    // Identify high-value segments
    const topSegments = segmentPerformance
      .filter(s => s.cvr > 0.03 && s.roas > 2.0)
      .sort((a, b) => b.efficiency - a.efficiency);
    
    // Find expansion opportunities
    const expansionOpportunities = topSegments
      .filter(s => s.reach < 1000000) // Under 1M impressions
      .map(s => ({
        ...s,
        expansionPotential: 'High',
        recommendedBudgetIncrease: s.spend * 0.5
      }));
    
    return {
      topPerformers: topSegments.slice(0, 5),
      expansionOpportunities,
      recommendation: this.generateAudienceStrategy(topSegments)
    };
  }
  
  groupBySegment(placements) {
    const grouped = placements.reduce((acc, p) => {
      const segment = p.segment || 'General';
      if (!acc[segment]) acc[segment] = [];
      acc[segment].push(p);
      return acc;
    }, {});
    
    return Object.entries(grouped).map(([name, placements]) => ({
      name,
      placements
    }));
  }
  
  generateAudienceStrategy(segments) {
    return \`Focus budget on top 3 segments: \${segments.slice(0, 3)
      .map(s => s.segment).join(', ')}. 
      These show CVR above 3% and strong ROAS.\`;
  }
}`
      }
    };
    return details[agentName] || {
      description: 'Processing campaign data and providing recommendations.',
      code: '// Agent logic'
    };
  };

  return (
    <div className="flex flex-col h-full bg-white shadow-sm">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ?
              `justify-end ${layout === 'BOTTOM' ? 'mr-[24%]' : ''}` :
              `justify-start ${layout === 'BOTTOM' ? 'ml-[25%]' : ''}`
              }`}
          >
            <div
              className={`max-w-[65%] rounded-2xl p-4 ${msg.role === 'user'
                ? 'bg-purple-600 text-white rounded-br-none'
                : 'bg-gray-100 text-gray-800 rounded-bl-none'
                }`}
            >
              {msg.agentsInvoked && msg.agentsInvoked.length > 0 && (
                <div className="mb-3 space-y-2">
                  {msg.agentsInvoked.map((agent, idx) => {
                    const key = `${msg.id}-${agent}`;
                    const isExpanded = expandedAgents.has(key);
                    const details = getAgentDetails(agent);

                    return (
                      <div key={idx} className="border border-purple-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleAgentExpansion(msg.id, agent)}
                          className="w-full flex items-center justify-between px-3 py-2 bg-purple-50 hover:bg-purple-100 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <Cpu className="h-3 w-3 text-purple-600" />
                            <span className="text-xs font-medium text-purple-700">{agent}</span>
                          </div>
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3 text-purple-600" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-purple-600" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="p-3 bg-white space-y-2">
                            <p className="text-xs text-gray-600 leading-relaxed">{details.description}</p>
                            <div className="bg-gray-900 rounded p-2 overflow-x-auto">
                              <pre className="text-xs text-gray-100 font-mono">{details.code}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="whitespace-pre-wrap text-sm">{msg.content}</div>
              {msg.suggestedActions && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {msg.suggestedActions.map((action) => (
                    <button
                      key={action}
                      onClick={() => onSendMessage(action)}
                      className="text-xs bg-white/50 hover:bg-white/80 text-purple-900 px-3 py-1 rounded-full transition-colors border border-purple-200"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-none p-4">
              <span className="animate-pulse">...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-4 border-t border-gray-100 bg-white">
        {layout === 'BOTTOM' ? (
          /* BOTTOM LAYOUT - Horizontal: suggestions left, input center, help right */
          <div className="flex items-center gap-3 mx-[25%]">
            {/* Left: Suggestions placeholder */}
            <div className="flex-none w-32">
              {/* This space reserved for suggestion chips */}
            </div>

            {/* Center: Input field and send button */}
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your instruction..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={handleSend}
                className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>

            {/* Right: Contextual Help */}
            <div className="flex-none w-32">
              <ContextualHelp
                state={agentState || 'IDLE'}
                currentView={currentView}
                hasPlan={hasPlan}
                onSendPrompt={onSendMessage}
              />
            </div>
          </div>
        ) : (
          /* LEFT/RIGHT LAYOUT - Vertical: help above, centered input below */
          <div className="space-y-3">
            {/* Contextual Help - Above input */}
            <div className="px-4">
              <ContextualHelp
                state={agentState || 'IDLE'}
                currentView={currentView}
                hasPlan={hasPlan}
                onSendPrompt={onSendMessage}
              />
            </div>

            {/* Input field and send button - Centered, responsive to panel width */}
            <div className="flex gap-2 px-4">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Type your instruction..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <button
                onClick={handleSend}
                className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
