/**
 * WindowedApp Component - Canvas-based windowed interface
 *
 * This is the windowed version of the main application where
 * campaigns, flights, and other views are displayed as windows
 * on a canvas with an anchored chat interface.
 */

import { useState, useRef, useEffect, ReactNode, useCallback } from 'react';
import { Canvas } from './Canvas';
import { ChatInterface } from './ChatInterface';
import { PlanVisualizer } from './PlanVisualizer';
import { AudienceInsightsPanel } from './AudienceInsightsPanel';
import { TemplateLibrary } from './TemplateLibrary';
import { AsyncButton } from './Spinner';
import { AttributionDashboard } from './AttributionDashboard';
import { CanvasProvider, useCanvas } from '../context/CanvasContext';
import { WindowType, WindowState } from '../types/windowTypes';
import { AgentBrain, AgentState, WindowContext } from '../logic/agentBrain';
import { AgentMessage, MediaPlan, Brand, Campaign, Flight, Placement, Segment, CampaignTemplate, Line } from '../types';
import { generateMediaPlanPDF } from '../utils/pdfGenerator';
import { generateMediaPlanPPT } from '../utils/pptGenerator';
import { calculatePlanMetrics, calculateFlightForecast, calculateFlightDelivery, calculateCampaignForecast, calculateCampaignDelivery, generateId } from '../logic/dummyData';
import { ArrowLeft, Folder, Calendar, BarChart3, FileText, DollarSign, TrendingUp, PanelRightClose, PanelRightOpen, LayoutGrid, Play, Pause, Edit3, Plus, Download, FileDown, Filter, Eye, Target, Users, Search, Briefcase, ChevronRight } from 'lucide-react';

// Debug flag for window interface tracking - set to true to enable console logs
const WINDOW_DEBUG = true;

// Helper for conditional debug logging
const windowLog = (...args: unknown[]) => {
  if (WINDOW_DEBUG) {
    console.log('[Window]', ...args);
  }
};

// Status filter options
type StatusFilter = 'ALL' | 'ACTIVE' | 'PAUSED' | 'DRAFT' | 'COMPLETED';

// Campaign window content with flight filter
interface CampaignWindowContentProps {
  campaign: Campaign;
  onCreateFlight: (name: string, budget?: number, startDate?: string, endDate?: string) => void;
  onOpenFlight: (flightId: string, flightName: string) => void;
  onOpenTemplateLibrary?: () => void;
}

function CampaignWindowContent({ campaign, onCreateFlight, onOpenFlight, onOpenTemplateLibrary }: CampaignWindowContentProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE');
  const [visibleCount, setVisibleCount] = useState(10);
  const [showNewFlightForm, setShowNewFlightForm] = useState(false);
  const [flightName, setFlightName] = useState('');
  const [flightBudget, setFlightBudget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Filter flights by status
  const filteredFlights = campaign.flights.filter(flight => {
    if (statusFilter === 'ALL') return true;
    return flight.status === statusFilter;
  });

  // Paginated flights
  const visibleFlights = filteredFlights.slice(0, visibleCount);
  const hasMore = visibleCount < filteredFlights.length;

  // Get status counts
  const statusCounts = {
    ALL: campaign.flights.length,
    ACTIVE: campaign.flights.filter(f => f.status === 'ACTIVE').length,
    PAUSED: campaign.flights.filter(f => f.status === 'PAUSED').length,
    DRAFT: campaign.flights.filter(f => f.status === 'DRAFT').length,
    COMPLETED: campaign.flights.filter(f => f.status === 'COMPLETED').length,
  };

  const handleSubmitNewFlight = () => {
    if (flightName.trim()) {
      onCreateFlight(
        flightName.trim(),
        flightBudget ? parseFloat(flightBudget) : undefined,
        startDate || undefined,
        endDate || undefined
      );
      setFlightName('');
      setFlightBudget('');
      setStartDate('');
      setEndDate('');
      setShowNewFlightForm(false);
    }
  };

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Folder className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{campaign.name}</h2>
            <p className="text-sm text-gray-500">{campaign.flights.length} flights</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onOpenTemplateLibrary && (
            <button
              onClick={onOpenTemplateLibrary}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-purple-200 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Use Template
            </button>
          )}
          <button
            onClick={() => setShowNewFlightForm(!showNewFlightForm)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Flight
          </button>
        </div>
      </div>

      {/* New Flight Form */}
      {showNewFlightForm && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Create New Flight</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Flight Name</label>
              <input
                type="text"
                value={flightName}
                onChange={(e) => setFlightName(e.target.value)}
                placeholder="e.g., 'Q1 Launch' or 'Holiday Push'"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Budget (Optional)</label>
              <input
                type="number"
                value={flightBudget}
                onChange={(e) => setFlightBudget(e.target.value)}
                placeholder={`Leave blank for default ($${Math.floor(campaign.budget * 0.25).toLocaleString()})`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSubmitNewFlight}
                disabled={!flightName.trim()}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Flight
              </button>
              <button
                onClick={() => {
                  setFlightName('');
                  setFlightBudget('');
                  setStartDate('');
                  setEndDate('');
                  setShowNewFlightForm(false);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs text-blue-600 font-medium">Budget</div>
          <div className="text-lg font-semibold text-blue-900">
            ${campaign.budget?.toLocaleString() || '0'}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-xs text-green-600 font-medium">Status</div>
          <div className="text-lg font-semibold text-green-900">{campaign.status}</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-xs text-purple-600 font-medium">Impressions</div>
          <div className="text-lg font-semibold text-purple-900">
            {(campaign.forecast?.impressions || 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Flights header with filter */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">Flights</h3>
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="text-xs border-none bg-transparent text-gray-600 cursor-pointer focus:ring-0 pr-6"
          >
            <option value="ALL">All ({statusCounts.ALL})</option>
            <option value="ACTIVE">Active ({statusCounts.ACTIVE})</option>
            <option value="PAUSED">Paused ({statusCounts.PAUSED})</option>
            <option value="DRAFT">Draft ({statusCounts.DRAFT})</option>
            <option value="COMPLETED">Completed ({statusCounts.COMPLETED})</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        {filteredFlights.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No {statusFilter.toLowerCase()} flights found
          </div>
        ) : (
          visibleFlights.map(flight => (
            <button
              key={flight.id}
              onClick={() => onOpenFlight(flight.id, flight.name)}
              className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">{flight.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${flight.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                  flight.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                  {flight.status}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                ${flight.budget?.toLocaleString() || '0'}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setVisibleCount(prev => prev + 10)}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-purple-600 transition-colors"
          >
            Load More ({filteredFlights.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}

// Portfolio window content with campaign filter
interface PortfolioWindowContentProps {
  brand: Brand;
  onCreateCampaign: () => void;
  onOpenCampaign: (campaignId: string, campaignName: string) => void;
}

function PortfolioWindowContent({ brand, onCreateCampaign, onOpenCampaign }: PortfolioWindowContentProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE');
  const [visibleCount, setVisibleCount] = useState(10);

  const totalBudget = brand.campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalSpend = brand.campaigns.reduce((sum, c) => sum + (c.delivery?.actualSpend || 0), 0);

  // Filter campaigns by status
  const filteredCampaigns = brand.campaigns.filter(campaign => {
    if (statusFilter === 'ALL') return true;
    return campaign.status === statusFilter;
  });

  // Paginated campaigns
  const visibleCampaigns = filteredCampaigns.slice(0, visibleCount);
  const hasMore = visibleCount < filteredCampaigns.length;

  // Get status counts
  const statusCounts = {
    ALL: brand.campaigns.length,
    ACTIVE: brand.campaigns.filter(c => c.status === 'ACTIVE').length,
    PAUSED: brand.campaigns.filter(c => c.status === 'PAUSED').length,
    DRAFT: brand.campaigns.filter(c => c.status === 'DRAFT').length,
    COMPLETED: brand.campaigns.filter(c => c.status === 'COMPLETED').length,
  };

  return (
    <div className="p-4 h-full overflow-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">{brand.name} Portfolio</h2>
            <p className="text-sm text-gray-500">{brand.campaigns.length} campaigns</p>
          </div>
        </div>
        <button
          onClick={onCreateCampaign}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">Total Budget</span>
          </div>
          <div className="text-2xl font-bold text-blue-900">
            ${totalBudget.toLocaleString()}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <span className="text-xs text-green-600 font-medium">Total Spend</span>
          </div>
          <div className="text-2xl font-bold text-green-900">
            ${totalSpend.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Campaigns header with filter */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-700">Campaigns</h3>
        <div className="flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="text-xs border-none bg-transparent text-gray-600 cursor-pointer focus:ring-0 pr-6"
          >
            <option value="ALL">All ({statusCounts.ALL})</option>
            <option value="ACTIVE">Active ({statusCounts.ACTIVE})</option>
            <option value="PAUSED">Paused ({statusCounts.PAUSED})</option>
            <option value="DRAFT">Draft ({statusCounts.DRAFT})</option>
            <option value="COMPLETED">Completed ({statusCounts.COMPLETED})</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No {statusFilter.toLowerCase()} campaigns found
          </div>
        ) : (
          visibleCampaigns.map(campaign => (
            <button
              key={campaign.id}
              onClick={() => onOpenCampaign(campaign.id, campaign.name)}
              className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">{campaign.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                  campaign.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                  {campaign.status}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                ${(campaign.budget || 0).toLocaleString()}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setVisibleCount(prev => prev + 10)}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-purple-600 transition-colors"
          >
            Load More ({filteredCampaigns.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
}

// Flight window content with performance cards (performance view)
interface FlightWindowContentProps {
  flight: Flight;
  campaignName: string;
  onToggleStatus: (newStatus: 'ACTIVE' | 'DRAFT') => void;
  onEditPlan: () => void;
}

function FlightWindowContent({ flight, campaignName, onToggleStatus, onEditPlan }: FlightWindowContentProps) {
  const [visibleCount, setVisibleCount] = useState(10);
  const plannedSpend = flight.lines.reduce((sum, l) => sum + l.totalCost, 0);
  const totalImpressions = flight.lines.reduce((sum, l) => sum + (l.forecast?.impressions || 0), 0);

  // Calculate actual metrics from line-level delivery/performance data
  const lineActualImpressions = flight.lines.reduce((sum, l) => sum + (l.delivery?.actualImpressions || l.performance?.impressions || 0), 0);
  const lineActualSpend = flight.lines.reduce((sum, l) => sum + (l.delivery?.actualSpend || 0), 0);

  // Use flight-level if available, otherwise fall back to line-level aggregation
  const actualImpressions = flight.delivery?.actualImpressions || lineActualImpressions || 0;
  const actualSpend = flight.delivery?.actualSpend || lineActualSpend || plannedSpend * 0.7; // Use actual or simulate 70% delivered
  const isActive = flight.status === 'ACTIVE';

  // Calculate derived metrics
  const cpm = actualImpressions > 0 ? (actualSpend / actualImpressions) * 1000 : 0;
  const pacing = flight.budget > 0 ? (actualSpend / flight.budget) * 100 : 0;
  const impressionPacing = totalImpressions > 0 ? (actualImpressions / totalImpressions) * 100 : 0;

  // Days calculation
  const startDate = new Date(flight.startDate);
  const endDate = new Date(flight.endDate);
  const now = new Date();
  const totalDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const elapsedDays = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const remainingDays = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  const timeProgress = Math.min(100, (elapsedDays / totalDays) * 100);

  // Performance status
  const getPerformanceStatus = () => {
    if (pacing > timeProgress + 10) return { label: 'Over Pacing', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    if (pacing < timeProgress - 10) return { label: 'Under Pacing', color: 'text-red-600', bg: 'bg-red-100' };
    return { label: 'On Track', color: 'text-green-600', bg: 'bg-green-100' };
  };
  const perfStatus = getPerformanceStatus();

  return (
    <div className="p-4 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">{flight.name}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}>
                {flight.status}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${perfStatus.bg} ${perfStatus.color}`}>
                {perfStatus.label}
              </span>
            </div>
            <p className="text-sm text-gray-500">{campaignName} • {flight.lines.length} placements</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleStatus(isActive ? 'DRAFT' : 'ACTIVE')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${isActive
              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
              : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isActive ? 'Pause' : 'Activate'}
          </button>
          <button
            onClick={onEditPlan}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Edit Plan
          </button>
        </div>
      </div>

      {/* Performance Cards - Top Row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs text-blue-600 font-medium">Budget</span>
          </div>
          <div className="text-lg font-bold text-blue-900">
            ${flight.budget?.toLocaleString() || '0'}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-green-600" />
            <span className="text-xs text-green-600 font-medium">Spend</span>
          </div>
          <div className="text-lg font-bold text-green-900">
            ${actualSpend.toLocaleString()}
          </div>
          <div className="text-xs text-green-600 mt-0.5">
            {pacing.toFixed(1)}% of budget
          </div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Eye className="w-3.5 h-3.5 text-purple-600" />
            <span className="text-xs text-purple-600 font-medium">Impressions</span>
          </div>
          <div className="text-lg font-bold text-purple-900">
            {(actualImpressions / 1000000).toFixed(2)}M
          </div>
          <div className="text-xs text-purple-600 mt-0.5">
            of {(totalImpressions / 1000000).toFixed(2)}M forecast
          </div>
        </div>
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Target className="w-3.5 h-3.5 text-orange-600" />
            <span className="text-xs text-orange-600 font-medium">CPM</span>
          </div>
          <div className="text-lg font-bold text-orange-900">
            ${cpm.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="space-y-3">
          {/* Timeline Progress */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Flight Timeline</span>
              <span>{remainingDays > 0 ? `${remainingDays} days remaining` : 'Completed'}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-purple-600 transition-all"
                style={{ width: `${timeProgress}%` }}
              />
            </div>
          </div>

          {/* Budget Pacing */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Budget Pacing</span>
              <span>${actualSpend.toLocaleString()} / ${flight.budget.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${pacing > timeProgress + 10 ? 'bg-yellow-500' :
                  pacing < timeProgress - 10 ? 'bg-red-500' : 'bg-green-500'
                  }`}
                style={{ width: `${Math.min(100, pacing)}%` }}
              />
            </div>
          </div>

          {/* Impression Delivery */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Impression Delivery</span>
              <span>{(actualImpressions / 1000000).toFixed(2)}M / {(totalImpressions / 1000000).toFixed(2)}M</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all"
                style={{ width: `${Math.min(100, impressionPacing)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Placements Table */}
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Placements</h3>
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Vendor</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-gray-500 uppercase">Channel</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 uppercase">Cost</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 uppercase">Impressions</th>
              <th className="text-right px-3 py-2 text-xs font-medium text-gray-500 uppercase">CPM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {flight.lines.slice(0, visibleCount).map(line => {
              const lineCpm = line.forecast?.impressions ? (line.totalCost / line.forecast.impressions) * 1000 : 0;
              return (
                <tr key={line.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 font-medium text-gray-900">{line.vendor}</td>
                  <td className="px-3 py-2 text-gray-600">{line.channel}</td>
                  <td className="px-3 py-2 text-right text-gray-900">${line.totalCost?.toLocaleString() || '0'}</td>
                  <td className="px-3 py-2 text-right text-gray-600">{((line.forecast?.impressions || 0) / 1000).toFixed(0)}K</td>
                  <td className="px-3 py-2 text-right text-gray-600">${lineCpm.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {flight.lines.length > visibleCount && (
          <button
            onClick={() => setVisibleCount(prev => prev + 10)}
            className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2 border-t border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors"
          >
            Load More (+{Math.min(10, flight.lines.length - visibleCount)} of {flight.lines.length - visibleCount} remaining)
          </button>
        )}
      </div>
    </div>
  );
}

// Client List Window - Agency view showing all clients/brands
interface ClientListWindowContentProps {
  brands: Brand[];
  currentBrandId: string;
  onSelectClient: (brandId: string) => void;
  onOpenClientDetail: (brandId: string, brandName: string) => void;
}

function ClientListWindowContent({ brands, currentBrandId, onSelectClient, onOpenClientDetail }: ClientListWindowContentProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'Enterprise' | 'Mid-Market' | 'SMB'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');

  // Filter brands
  const filteredBrands = brands.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTier = tierFilter === 'ALL' || b.tier === tierFilter;
    const matchesStatus = statusFilter === 'ALL' || b.status === statusFilter;
    return matchesSearch && matchesTier && matchesStatus;
  });

  // Stats
  const totalSpend = brands.reduce((sum, b) => sum + (b.totalSpend || 0), 0);
  const activeBrands = brands.filter(b => b.status === 'Active').length;

  return (
    <div className="p-4 h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">All Clients</h2>
            <p className="text-sm text-gray-500">{brands.length} clients • ${(totalSpend / 1000000).toFixed(1)}M total spend</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-xs text-green-600 font-medium">Active Clients</div>
          <div className="text-xl font-bold text-green-900">{activeBrands}</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-xs text-blue-600 font-medium">Total Budget</div>
          <div className="text-xl font-bold text-blue-900">${(totalSpend / 1000000).toFixed(1)}M</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-3">
          <div className="text-xs text-purple-600 font-medium">Campaigns</div>
          <div className="text-xl font-bold text-purple-900">{brands.reduce((sum, b) => sum + (b.campaignCount || b.campaigns.length), 0)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value as any)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2"
        >
          <option value="ALL">All Tiers</option>
          <option value="Enterprise">Enterprise</option>
          <option value="Mid-Market">Mid-Market</option>
          <option value="SMB">SMB</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2"
        >
          <option value="ALL">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Client List */}
      <div className="flex-1 overflow-auto space-y-2">
        {filteredBrands.map(b => (
          <div
            key={b.id}
            className={`flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${b.id === currentBrandId
              ? 'bg-indigo-50 border-indigo-300'
              : 'bg-white border-gray-200 hover:border-indigo-200 hover:shadow-sm'
              }`}
            onClick={() => onOpenClientDetail(b.id, b.name)}
          >
            <div className="flex items-center gap-3">
              <img
                src={b.logoUrl}
                alt={b.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{b.name}</span>
                  {b.id === currentBrandId && (
                    <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-full">Current</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${b.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                    {b.status}
                  </span>
                  {b.tier && (
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                      {b.tier}
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  {b.campaigns.length} campaigns • ${((b.totalSpend || 0) / 1000).toFixed(0)}k spend
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectClient(b.id);
                }}
                className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                Switch
              </button>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        ))}
        {filteredBrands.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No clients match your filters
          </div>
        )}
      </div>
    </div>
  );
}

// Attribution Report Window Content
interface AttributionReportContentProps {
  entityName: string;
  entityType: 'brand' | 'campaign' | 'flight';
  channels: string[];
}

function AttributionReportContent({ entityName, entityType, channels }: AttributionReportContentProps) {
  // Generate sample attribution data
  const attributionData = (channels.length > 0 ? channels : ['Search', 'Social', 'Display', 'Video']).map(ch => ({
    channel: ch,
    firstTouch: Math.floor(Math.random() * 30 + 10),
    lastTouch: Math.floor(Math.random() * 40 + 15),
    linear: Math.floor(Math.random() * 25 + 20),
    timeDecay: Math.floor(Math.random() * 35 + 12),
    positionBased: Math.floor(Math.random() * 28 + 18)
  }));

  const models = ['First Touch', 'Last Touch', 'Linear', 'Time Decay', 'Position Based'];

  return (
    <div className="p-4 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Attribution Report</h2>
          <p className="text-sm text-gray-500">{entityName} • {entityType}</p>
        </div>
      </div>

      {/* Attribution Model Comparison */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-sm font-medium text-gray-700">Multi-Touch Attribution by Channel</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-2 text-xs font-medium text-gray-500 uppercase">Channel</th>
              {models.map(m => (
                <th key={m} className="text-right px-3 py-2 text-xs font-medium text-gray-500 uppercase">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {attributionData.map(row => (
              <tr key={row.channel} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{row.channel}</td>
                <td className="px-3 py-3 text-right text-gray-600">{row.firstTouch}%</td>
                <td className="px-3 py-3 text-right text-gray-600">{row.lastTouch}%</td>
                <td className="px-3 py-3 text-right text-gray-600">{row.linear}%</td>
                <td className="px-3 py-3 text-right text-gray-600">{row.timeDecay}%</td>
                <td className="px-3 py-3 text-right text-gray-600">{row.positionBased}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Insights */}
      <div className="bg-indigo-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-indigo-900 mb-2">Key Insights</h4>
        <ul className="text-sm text-indigo-700 space-y-1">
          <li>• {attributionData[0]?.channel || 'Search'} shows strongest first-touch attribution</li>
          <li>• Consider multi-touch models for more accurate ROI measurement</li>
          <li>• Cross-channel synergy detected between top channels</li>
        </ul>
      </div>
    </div>
  );
}

// Client Detail Window - Shows a specific client's overview before switching
interface ClientDetailWindowContentProps {
  clientBrand: Brand;
  isCurrentClient: boolean;
  onSwitchToClient: () => void;
  onOpenCampaign: (campaignId: string, campaignName: string) => void;
}

function ClientDetailWindowContent({ clientBrand, isCurrentClient, onSwitchToClient, onOpenCampaign }: ClientDetailWindowContentProps) {
  const totalBudget = clientBrand.campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalSpend = clientBrand.campaigns.reduce((sum, c) => sum + (c.delivery?.actualSpend || 0), 0);
  const activeCampaigns = clientBrand.campaigns.filter(c => c.status === 'ACTIVE').length;

  return (
    <div className="p-4 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <img
            src={clientBrand.logoUrl}
            alt={clientBrand.name}
            className="w-16 h-16 rounded-xl object-cover border border-gray-200"
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{clientBrand.name}</h2>
              {isCurrentClient && (
                <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded-full">Active Workspace</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {clientBrand.tier && (
                <span className="text-sm px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">{clientBrand.tier}</span>
              )}
              {clientBrand.industry && (
                <span className="text-sm text-gray-500">{clientBrand.industry}</span>
              )}
              {clientBrand.accountManager && (
                <span className="text-sm text-gray-500">• {clientBrand.accountManager}</span>
              )}
            </div>
          </div>
        </div>
        {!isCurrentClient && (
          <button
            onClick={onSwitchToClient}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            <Users className="w-4 h-4" />
            Switch to Client
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-xs text-blue-600 font-medium mb-1">Total Budget</div>
          <div className="text-2xl font-bold text-blue-900">${(totalBudget / 1000000).toFixed(2)}M</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-xs text-green-600 font-medium mb-1">Spend YTD</div>
          <div className="text-2xl font-bold text-green-900">${(totalSpend / 1000000).toFixed(2)}M</div>
        </div>
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-xs text-purple-600 font-medium mb-1">Active Campaigns</div>
          <div className="text-2xl font-bold text-purple-900">{activeCampaigns}</div>
        </div>
        <div className="bg-amber-50 rounded-lg p-4">
          <div className="text-xs text-amber-600 font-medium mb-1">Total Campaigns</div>
          <div className="text-2xl font-bold text-amber-900">{clientBrand.campaigns.length}</div>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Recent Campaigns</h3>
        <div className="space-y-2">
          {clientBrand.campaigns.slice(0, 8).map(campaign => (
            <button
              key={campaign.id}
              onClick={() => onOpenCampaign(campaign.id, campaign.name)}
              className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4 text-gray-400" />
                <div className="text-left">
                  <div className="font-medium text-gray-900">{campaign.name}</div>
                  <div className="text-sm text-gray-500">
                    ${(campaign.budget / 1000).toFixed(0)}k • {campaign.flights?.length || 0} flights
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${campaign.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                  campaign.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                  {campaign.status}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </button>
          ))}
        </div>
        {clientBrand.campaigns.length > 8 && (
          <div className="text-center mt-3 text-sm text-gray-500">
            +{clientBrand.campaigns.length - 8} more campaigns
          </div>
        )}
      </div>
    </div>
  );
}

interface WindowedAppInnerProps {
  brand: Brand;
  allBrands: Brand[];  // All clients/brands for multi-client support
  onBrandUpdate: (brand: Brand) => void;
  onBrandSelect: (brandId: string) => void;  // Switch to different client
  onBack: () => void;
  onSwitchToClassic: () => void;
}

function WindowedAppInner({ brand, allBrands, onBrandUpdate, onBrandSelect, onBack, onSwitchToClassic }: WindowedAppInnerProps) {
  const { openWindow, closeWindow, state: canvasState, getActiveWindow, dispatch } = useCanvas();

  // Debug: log when allBrands changes
  useEffect(() => {
    windowLog(`allBrands updated: ${allBrands.length} brands`, allBrands.map(b => b.id));
    windowLog(`Current brand: ${brand.id} (${brand.name})`);
    windowLog(`Current windows:`, canvasState.windows.map(w => ({ id: w.id, type: w.type, brandId: w.brandId, entityId: w.entityId })));
  }, [allBrands, brand]);

  // Agent state
  const brainRef = useRef<AgentBrain>(new AgentBrain());
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [agentState, setAgentState] = useState<AgentState>('INIT');
  const [isTyping, setIsTyping] = useState(false);

  // Attribution state (shared across attribution windows)
  const [attributionModel, setAttributionModel] = useState<string>('LINEAR');
  const [attributionView, setAttributionView] = useState<string>('OVERVIEW');

  // Template library state - tracks which campaign is showing template library
  const [templateLibraryCampaignId, setTemplateLibraryCampaignId] = useState<string | null>(null);

  // Handler for when a template is selected from the library
  const handleTemplateSelect = useCallback((campaignId: string, template: CampaignTemplate) => {
    // Find the campaign for this template
    const campaign = brand.campaigns.find(c => c.id === campaignId);
    if (!campaign) {
      console.warn(`[Template] Campaign ${campaignId} not found`);
      setTemplateLibraryCampaignId(null);
      return;
    }

    // Calculate total budget from campaign (use 25% of campaign budget for template-based flight)
    const flightBudget = Math.floor(campaign.budget * 0.25);
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];

    // Create placements based on template channel mix
    const placements: Placement[] = template.channelMix.map((mix) => {
      const placementBudget = Math.floor(flightBudget * (mix.percentage / 100));
      const channelName = mix.channel as Line['channel'];

      // Calculate CPM based on channel (rough industry averages)
      const cpmRates: Record<string, number> = {
        'Search': 2.50,
        'Social': 8.00,
        'Display': 3.50,
        'TV': 25.00,
        'Radio': 6.00,
        'Streaming Audio': 12.00,
        'Podcast': 20.00,
        'Place-based Audio': 8.00,
        'OOH': 5.00
      };
      const cpm = cpmRates[channelName] || 10.00;
      const impressions = Math.floor((placementBudget / cpm) * 1000);

      // Determine duration based on template flight structure (default 30 days)
      const durationDays = template.flightStructure[0]?.durationDays || 30;
      const endDate = new Date(today.getTime() + durationDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      return {
        id: generateId(),
        name: `${channelName} - ${template.name}`,
        channel: channelName,
        status: 'DRAFT' as const,
        vendor: 'TBD',
        adUnit: 'Standard',
        rate: cpm,
        costMethod: 'CPM' as const,
        startDate,
        endDate,
        quantity: impressions,
        totalCost: placementBudget,
        targeting: {
          geo: ['United States'],
          demographics: ['Adults 25-54'],
          devices: ['Desktop', 'Mobile']
        }
      };
    });

    // Create the new flight with placements
    const newFlight: Flight = {
      id: generateId(),
      campaignId: campaign.id,
      name: `${template.name} Flight`,
      budget: flightBudget,
      startDate,
      endDate: new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      lines: placements,
      status: 'DRAFT',
      tags: template.tags.slice(0, 3),
      forecast: { impressions: 0, spend: 0, reach: 0, frequency: 0, source: 'Internal' },
      delivery: { actualImpressions: 0, actualSpend: 0, pacing: 0, status: 'ON_TRACK' }
    };

    // Update the brand with the new flight
    onBrandUpdate({
      ...brand,
      campaigns: brand.campaigns.map(c =>
        c.id === campaign.id
          ? { ...c, flights: [...c.flights, newFlight] }
          : c
      )
    });

    // Close the template library
    setTemplateLibraryCampaignId(null);

    // Open the new flight window
    openWindow('flight', `${campaign.name}\\${newFlight.name}`, newFlight.id, brand.id);

    // Show confirmation in chat
    setMessages(prev => [...prev, {
      id: generateId(),
      role: 'agent' as const,
      content: `Created new flight "${newFlight.name}" with ${placements.length} placements based on the ${template.name} template. Total budget: $${flightBudget.toLocaleString()}.`,
      timestamp: Date.now()
    }]);
  }, [brand, onBrandUpdate, openWindow, setMessages]);

  // Chat log persistence - store all messages for later analysis
  const CHAT_LOG_KEY = 'fuseiq-chat-log';

  // Load chat history on mount
  useEffect(() => {
    try {
      const savedLog = localStorage.getItem(CHAT_LOG_KEY);
      if (savedLog) {
        const parsed = JSON.parse(savedLog);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Only load recent messages (last 100)
          const recent = parsed.slice(-100);
          console.log(`[Chat Log] Loaded ${recent.length} messages from history`);
        }
      }
    } catch (e) {
      console.warn('[Chat Log] Failed to load chat history:', e);
    }
  }, []);

  // Save messages to log whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        // Get existing log
        const existingLog = localStorage.getItem(CHAT_LOG_KEY);
        const existing = existingLog ? JSON.parse(existingLog) : [];

        // Get the latest message and add to log with timestamp and session info
        const latestMsg = messages[messages.length - 1];
        const logEntry = {
          ...latestMsg,
          brandId: brand.id,
          brandName: brand.name,
          userId: null, // TODO: Populate when user auth is implemented
          sessionTimestamp: Date.now()
        };

        // Append to log (keep last 2000 messages max for NLP/analysis)
        const updatedLog = [...existing, logEntry].slice(-2000);
        localStorage.setItem(CHAT_LOG_KEY, JSON.stringify(updatedLog));
      } catch (e) {
        console.warn('[Chat Log] Failed to save chat message:', e);
      }
    }
  }, [messages, brand.id, brand.name]);

  // Track active media plans per flight (for plan editor windows)
  const [mediaPlans, setMediaPlans] = useState<Record<string, MediaPlan>>({});

  // Open portfolio window for the selected brand by default
  // Track if we've already tried to open the default window to prevent loops
  const hasOpenedDefaultWindow = useRef(false);
  const hasCheckedInitialState = useRef(false);
  const lastOpenedBrandId = useRef<string | null>(null);

  useEffect(() => {
    // When brand changes, we may need to open a portfolio for the new brand
    const brandChanged = lastOpenedBrandId.current !== null && lastOpenedBrandId.current !== brand.id;

    // Only run once per brand
    if (hasOpenedDefaultWindow.current && !brandChanged) return;

    // Wait longer for canvas state to stabilize after loading from localStorage
    // The localStorage load happens asynchronously in CanvasContext
    const timer = setTimeout(() => {
      // Check again if we've already opened (in case of race)
      if (hasOpenedDefaultWindow.current && !brandChanged) return;

      // Mark that we've checked - only do this once per brand
      if (!hasCheckedInitialState.current || brandChanged) {
        hasCheckedInitialState.current = true;

        // Check if there's a portfolio window for THIS brand already open
        const hasPortfolioForBrand = canvasState.windows.some(w =>
          w.type === 'portfolio' && (w.brandId === brand.id || !w.brandId)
        );

        // Also check for any content windows belonging to this brand
        const hasBrandContentWindows = canvasState.windows.some(w =>
          w.type !== 'chat' && w.type !== 'client-list' && w.brandId === brand.id
        );

        windowLog('Initial check for brand', brand.name, ':', {
          hasPortfolioForBrand,
          hasBrandContentWindows,
          totalWindows: canvasState.windows.length
        });

        // If no portfolio or brand-specific windows, open portfolio for this brand
        if (!hasPortfolioForBrand && !hasBrandContentWindows) {
          windowLog('Opening portfolio for brand:', brand.name);
          hasOpenedDefaultWindow.current = true;
          lastOpenedBrandId.current = brand.id;
          openWindow('portfolio', `${brand.name} Portfolio`, undefined, brand.id);
        } else {
          // Mark as done since we already have windows for this brand
          windowLog('Windows exist for brand, not opening portfolio');
          hasOpenedDefaultWindow.current = true;
          lastOpenedBrandId.current = brand.id;
        }
      }
    }, 300); // Increased delay to ensure localStorage fully loaded

    return () => clearTimeout(timer);
  }, [canvasState.windows, openWindow, brand.id, brand.name]);

  // Current context (derived from active window)
  const [windowContext, setWindowContext] = useState<WindowContext | undefined>(undefined);

  // Validate pinned windows - close windows with invalid entityIds
  // This handles the case where IDs change between sessions (e.g., data regeneration)
  // Track validated window IDs to avoid re-validating the same windows
  const validatedWindowIds = useRef<Set<string>>(new Set());

  // DISABLED: Window validation was closing pinned windows prematurely
  // The issue is that windows are loaded from localStorage before we know if
  // the user will select the same brand. For now, we let windows stay open
  // even if the entity doesn't exist - the window content will show an error.
  //
  // TODO: Consider storing brandId with windows and only validating windows
  // that belong to the current brand
  useEffect(() => {
    // Only validate if there are windows to check
    if (canvasState.windows.length === 0) return;

    // Collect all valid entity IDs from the brand
    const validCampaignIds = new Set(brand.campaigns.map(c => c.id));
    const validFlightIds = new Set(brand.campaigns.flatMap(c => c.flights.map(f => f.id)));

    // Debug: Log what we're checking
    windowLog(`Validating ${canvasState.windows.length} windows for brand ${brand.id}`);
    windowLog(`Valid campaign IDs (first 5):`, Array.from(validCampaignIds).slice(0, 5));
    windowLog(`Valid flight IDs (first 5):`, Array.from(validFlightIds).slice(0, 5));

    // Log each window's status but DON'T close invalid ones
    canvasState.windows.forEach(w => {
      // Skip if already validated
      if (validatedWindowIds.current.has(w.id)) {
        return;
      }

      // Mark as validated
      validatedWindowIds.current.add(w.id);

      if (w.entityId) {
        const isValid =
          (w.type === 'campaign' && validCampaignIds.has(w.entityId)) ||
          (w.type === 'flight' && validFlightIds.has(w.entityId)) ||
          (w.type === 'media-plan' && validFlightIds.has(w.entityId)) ||
          (w.type !== 'campaign' && w.type !== 'flight' && w.type !== 'media-plan');

        windowLog(`Window ${w.type} (${w.entityId}): ${isValid ? 'VALID' : 'INVALID but keeping open'}`);
      }
    });
  }, [canvasState.windows, brand.campaigns, dispatch]); // Re-run when windows change (e.g., after loading from localStorage)

  // Helper to recalculate metrics for brand
  const updateBrandMetrics = useCallback((brandToUpdate: Brand): Brand => {
    const updatedCampaigns = brandToUpdate.campaigns.map(campaign => {
      const updatedFlights = campaign.flights.map(flight => ({
        ...flight,
        forecast: calculateFlightForecast(flight.lines),
        delivery: calculateFlightDelivery(flight.lines)
      }));
      return {
        ...campaign,
        flights: updatedFlights,
        forecast: calculateCampaignForecast(updatedFlights),
        delivery: calculateCampaignDelivery(updatedFlights)
      };
    });
    return { ...brandToUpdate, campaigns: updatedCampaigns };
  }, []);

  // Open a flight in the plan editor (kept for chat command support)
  // @ts-expect-error Intentionally unused - kept for future chat command integration
  const _openFlightInPlanEditor = useCallback((flightId: string, flightName: string, campaignName: string) => {
    windowLog('Opening flight in plan editor:', flightId, flightName);

    // Find the flight
    let foundFlight: Flight | undefined;
    let foundCampaign: Campaign | undefined;
    for (const c of brand.campaigns) {
      const f = c.flights.find(fl => fl.id === flightId);
      if (f) {
        foundFlight = f;
        foundCampaign = c;
        break;
      }
    }
    if (!foundFlight || !foundCampaign) {
      console.warn('[WindowedApp] Flight or campaign not found:', flightId);
      return;
    }

    // Create media plan if not exists and set it synchronously
    const existingPlan = mediaPlans[flightId];
    if (!existingPlan) {
      const newPlan: MediaPlan = {
        id: generateId(),
        campaign: {
          ...foundCampaign,
          placements: foundFlight.lines
        },
        activeFlightId: flightId,
        totalSpend: foundFlight.lines.reduce((sum, line) => sum + line.totalCost, 0),
        remainingBudget: foundFlight.budget - foundFlight.lines.reduce((sum, line) => sum + line.totalCost, 0),
        version: 1,
        groupingMode: 'DETAILED',
        strategy: 'BALANCED',
        metrics: calculatePlanMetrics(foundFlight.lines)
      };
      windowLog('Created new media plan for flight:', flightId, newPlan);
      setMediaPlans(prev => ({ ...prev, [flightId]: newPlan }));

      // Also set it in the agent brain so commands work on this plan
      brainRef.current.setMediaPlan(newPlan);
    } else {
      windowLog('Using existing media plan for flight:', flightId);
      // Ensure brain has the current plan
      brainRef.current.setMediaPlan(existingPlan);
    }

    // Open the media-plan window
    windowLog('Opening media-plan window for:', campaignName, flightName);
    openWindow('media-plan', `${campaignName}\\${flightName}`, flightId);
  }, [brand.campaigns, mediaPlans, openWindow]);

  // Helper to find brand containing a specific flight
  // MULTI-CLIENT: Critical for operations that receive only flightId
  const findBrandByFlightId = useCallback((flightId: string): Brand | undefined => {
    for (const b of allBrands) {
      for (const c of b.campaigns) {
        if (c.flights.some(f => f.id === flightId)) {
          return b;
        }
      }
    }
    return undefined;
  }, [allBrands]);

  // Handle placement update
  const handleUpdatePlacement = useCallback((flightId: string, updatedPlacement: Placement) => {
    // Find the brand containing this flight
    const targetBrand = findBrandByFlightId(flightId) || brand;

    // Update brand state
    const updatedBrand = {
      ...targetBrand,
      campaigns: targetBrand.campaigns.map(c => ({
        ...c,
        flights: c.flights.map(f => {
          if (f.id === flightId) {
            return {
              ...f,
              lines: f.lines.map(l => l.id === updatedPlacement.id ? updatedPlacement : l)
            };
          }
          return f;
        })
      }))
    };
    const finalBrand = updateBrandMetrics(updatedBrand);
    onBrandUpdate(finalBrand);

    // Update media plan
    setMediaPlans(prev => {
      const plan = prev[flightId];
      if (!plan) return prev;
      const updatedPlacements = plan.campaign.placements?.map(p =>
        p.id === updatedPlacement.id ? updatedPlacement : p
      ) || [];
      const flight = finalBrand.campaigns.flatMap(c => c.flights).find(f => f.id === flightId);
      return {
        ...prev,
        [flightId]: {
          ...plan,
          campaign: { ...plan.campaign, placements: updatedPlacements },
          metrics: calculatePlanMetrics(updatedPlacements),
          totalSpend: updatedPlacements.reduce((sum, line) => sum + line.totalCost, 0),
          remainingBudget: (flight?.budget || 0) - updatedPlacements.reduce((sum, line) => sum + line.totalCost, 0)
        }
      };
    });
  }, [findBrandByFlightId, brand, onBrandUpdate, updateBrandMetrics]);

  // Handle placement delete
  const handleDeletePlacement = useCallback((flightId: string, placementId: string) => {
    // Find the brand containing this flight
    const targetBrand = findBrandByFlightId(flightId) || brand;

    // Update brand state
    const updatedBrand = {
      ...targetBrand,
      campaigns: targetBrand.campaigns.map(c => ({
        ...c,
        flights: c.flights.map(f => {
          if (f.id === flightId) {
            return {
              ...f,
              lines: f.lines.filter(l => l.id !== placementId)
            };
          }
          return f;
        })
      }))
    };
    const finalBrand = updateBrandMetrics(updatedBrand);
    onBrandUpdate(finalBrand);

    // Update media plan
    setMediaPlans(prev => {
      const plan = prev[flightId];
      if (!plan) return prev;
      const updatedPlacements = plan.campaign.placements?.filter(p => p.id !== placementId) || [];
      const flight = finalBrand.campaigns.flatMap(c => c.flights).find(f => f.id === flightId);
      return {
        ...prev,
        [flightId]: {
          ...plan,
          campaign: { ...plan.campaign, placements: updatedPlacements },
          metrics: calculatePlanMetrics(updatedPlacements),
          totalSpend: updatedPlacements.reduce((sum, line) => sum + line.totalCost, 0),
          remainingBudget: (flight?.budget || 0) - updatedPlacements.reduce((sum, line) => sum + line.totalCost, 0),
          version: (plan.version || 0) + 1
        }
      };
    });
  }, [findBrandByFlightId, brand, onBrandUpdate, updateBrandMetrics]);

  // Handle activate/pause flight (global version - kept for chat commands)
  // @ts-expect-error Intentionally unused - kept for future chat command integration
  const _handleToggleFlightStatus = useCallback((flightId: string, newStatus: 'ACTIVE' | 'DRAFT') => {
    // Find the brand containing this flight
    const targetBrand = findBrandByFlightId(flightId) || brand;

    const updatedBrand = {
      ...targetBrand,
      campaigns: targetBrand.campaigns.map(c => ({
        ...c,
        flights: c.flights.map(f => f.id === flightId ? { ...f, status: newStatus } : f)
      }))
    };
    onBrandUpdate(updatedBrand);
  }, [findBrandByFlightId, brand, onBrandUpdate]);

  // Handle adding a new placement to a flight
  const handleAddPlacement = useCallback((flightId: string) => {
    // Find the brand containing this flight
    const targetBrand = findBrandByFlightId(flightId) || brand;

    // Find the flight and campaign in the target brand
    let foundFlight: Flight | undefined;
    let foundCampaign: Campaign | undefined;
    for (const c of targetBrand.campaigns) {
      const f = c.flights.find(fl => fl.id === flightId);
      if (f) {
        foundFlight = f;
        foundCampaign = c;
        break;
      }
    }

    if (!foundFlight || !foundCampaign) {
      console.warn('[WindowedApp] Cannot add placement: flight not found', flightId);
      return;
    }

    // Create a new DRAFT placement with default values
    const newPlacement: Placement = {
      id: generateId(),
      name: 'New Line',
      channel: 'Display', // Default channel
      vendor: 'New Vendor',
      adUnit: 'New Placement',
      segment: 'General Audience',
      costMethod: 'CPM',
      rate: 10.00, // Default CPM
      quantity: 100000, // Default 100k impressions
      totalCost: 1000, // $1k default
      startDate: foundFlight.startDate,
      endDate: foundFlight.endDate,
      status: 'DRAFT', // New lines default to DRAFT
      segments: [],
      forecast: {
        impressions: 100000,
        spend: 1000,
        reach: 50000,
        frequency: 2,
        source: 'Internal'
      },
      delivery: {
        actualImpressions: 0,
        actualSpend: 0,
        pacing: 0,
        status: 'ON_TRACK'
      }
    };

    // Update brand state
    const updatedBrand = {
      ...targetBrand,
      campaigns: targetBrand.campaigns.map(c => ({
        ...c,
        flights: c.flights.map(f => {
          if (f.id === flightId) {
            return {
              ...f,
              lines: [...f.lines, newPlacement]
            };
          }
          return f;
        })
      }))
    };
    const finalBrand = updateBrandMetrics(updatedBrand);
    onBrandUpdate(finalBrand);

    // Update media plan
    setMediaPlans(prev => {
      const plan = prev[flightId];
      if (!plan) return prev;
      const updatedPlacements = [...(plan.campaign.placements || []), newPlacement];
      const flight = finalBrand.campaigns.flatMap(c => c.flights).find(f => f.id === flightId);
      return {
        ...prev,
        [flightId]: {
          ...plan,
          campaign: { ...plan.campaign, placements: updatedPlacements },
          metrics: calculatePlanMetrics(updatedPlacements),
          totalSpend: updatedPlacements.reduce((sum, line) => sum + line.totalCost, 0),
          remainingBudget: (flight?.budget || 0) - updatedPlacements.reduce((sum, line) => sum + line.totalCost, 0),
          version: (plan.version || 0) + 1
        }
      };
    });

    windowLog('Added new DRAFT placement to flight:', flightId);
  }, [findBrandByFlightId, brand, onBrandUpdate, updateBrandMetrics]);

  // Sync placements from agent's media plan back to brand state
  // This is critical for keeping the flight detail window in sync with chat changes
  // MULTI-CLIENT: Find which brand contains the flight rather than assuming global brand
  const syncPlacementsToBrand = useCallback((flightId: string, placements: Placement[]) => {
    // Find the brand that contains this flight
    let targetBrand: Brand | undefined;
    for (const b of allBrands) {
      for (const c of b.campaigns) {
        if (c.flights.some(f => f.id === flightId)) {
          targetBrand = b;
          break;
        }
      }
      if (targetBrand) break;
    }

    // Fall back to current brand if not found (shouldn't happen, but safe fallback)
    if (!targetBrand) {
      console.warn('[syncPlacementsToBrand] Flight not found in any brand, using current brand:', flightId);
      targetBrand = brand;
    }

    const updatedBrand = {
      ...targetBrand,
      campaigns: targetBrand.campaigns.map(c => ({
        ...c,
        flights: c.flights.map(f => {
          if (f.id === flightId) {
            return {
              ...f,
              lines: placements
            };
          }
          return f;
        })
      }))
    };
    const finalBrand = updateBrandMetrics(updatedBrand);
    onBrandUpdate(finalBrand);
  }, [allBrands, brand, onBrandUpdate, updateBrandMetrics]);

  // Sync brand with AgentBrain
  useEffect(() => {
    if (brainRef.current) {
      brainRef.current.setBrand(brand);
    }
  }, [brand]);

  // Update window context based on active CONTENT window (not chat)
  // This ensures clicking on chat doesn't lose the context
  // IMPORTANT: Use the window's brandId to get the correct brand context
  useEffect(() => {
    const activeWindow = getActiveWindow();

    windowLog('Active window changed:', {
      id: activeWindow?.id,
      type: activeWindow?.type,
      entityId: activeWindow?.entityId,
      brandId: activeWindow?.brandId,
      title: activeWindow?.title,
      activeWindowId: canvasState.activeWindowId
    });

    // Skip if active window is chat - keep previous context
    if (activeWindow?.type === 'chat') {
      windowLog('Skipping chat window, keeping previous context');
      return;
    }

    if (!activeWindow) {
      // Only clear context if there are no content windows at all
      const hasContentWindows = canvasState.windows.some(w => w.type !== 'chat');
      if (!hasContentWindows) {
        windowLog('No content windows, clearing context');
        setWindowContext(undefined);
        brainRef.current?.setWindowContext(undefined);
      }
      return;
    }

    // Get the brand for this window (uses window's brandId, falls back to current brand)
    const windowBrand = activeWindow.brandId
      ? allBrands.find(b => b.id === activeWindow.brandId) || brand
      : brand;

    let newContext: WindowContext = {
      windowType: activeWindow.type as WindowContext['windowType'],
      brandId: windowBrand.id,
      brandName: windowBrand.name
    };

    if (activeWindow.type === 'campaign' && activeWindow.entityId) {
      const campaign = windowBrand.campaigns.find(c => c.id === activeWindow.entityId);
      if (campaign) {
        newContext = {
          ...newContext,
          campaignId: campaign.id,
          campaignName: campaign.name
        };
      }
    } else if (activeWindow.type === 'flight' && activeWindow.entityId) {
      // Find flight and its parent campaign in the WINDOW's brand
      for (const campaign of windowBrand.campaigns) {
        const flight = campaign.flights.find(f => f.id === activeWindow.entityId);
        if (flight) {
          newContext = {
            ...newContext,
            campaignId: campaign.id,
            campaignName: campaign.name,
            flightId: flight.id,
            flightName: flight.name
          };
          break;
        }
      }
    } else if (activeWindow.type === 'media-plan' && activeWindow.entityId) {
      // Find the flight for this media plan in the WINDOW's brand
      const flightId = activeWindow.entityId;
      for (const campaign of windowBrand.campaigns) {
        const flight = campaign.flights.find(f => f.id === flightId);
        if (flight) {
          newContext = {
            ...newContext,
            campaignId: campaign.id,
            campaignName: campaign.name,
            flightId: flight.id,
            flightName: flight.name
          };

          // CRITICAL: Sync the media plan to AgentBrain so chat commands work
          // First check if we have a cached plan, otherwise create one
          const existingPlan = mediaPlans[flightId];
          if (existingPlan) {
            windowLog('Setting AgentBrain media plan for:', flightId);
            brainRef.current?.setMediaPlan(existingPlan);
          } else {
            // Create a media plan on-the-fly for the brain
            const newPlan: MediaPlan = {
              id: `plan-${flightId}`,
              campaign: {
                ...campaign,
                placements: flight.lines
              },
              activeFlightId: flightId,
              totalSpend: flight.lines.reduce((sum, l) => sum + l.totalCost, 0),
              remainingBudget: flight.budget - flight.lines.reduce((sum, l) => sum + l.totalCost, 0),
              version: 1,
              groupingMode: 'DETAILED',
              strategy: 'BALANCED',
              metrics: calculatePlanMetrics(flight.lines)
            };
            windowLog('Creating and setting AgentBrain media plan for:', flightId);
            brainRef.current?.setMediaPlan(newPlan);
          }
          break;
        }
      }
    } else if (activeWindow.type === 'portfolio') {
      newContext = {
        windowType: 'portfolio',
        brandId: windowBrand.id,
        brandName: windowBrand.name
      };
    } else if (activeWindow.type === 'client-list') {
      // Client list window - no specific brand context, it's an agency-level view
      // Keep the last valid context from the previously focused content window
      // This allows chat commands to still work with the last focused client's data
      windowLog('Client-list window - keeping previous context or using global brand');
      // Don't update context - keep previous one so user can still chat about last focused client
      return;
    } else if (activeWindow.type === 'client') {
      // Client detail window - show the client being viewed
      const clientBrand = allBrands.find(b => b.id === activeWindow.entityId);
      windowLog('Client window - looking up brand:', {
        entityId: activeWindow.entityId,
        foundBrand: clientBrand?.name
      });
      if (clientBrand) {
        newContext = {
          windowType: 'client',
          brandId: clientBrand.id,
          brandName: clientBrand.name
        };
      }
    }

    windowLog('Setting new context:', newContext);
    setWindowContext(newContext);
    brainRef.current?.setWindowContext(newContext);
  }, [canvasState.activeWindowId, canvasState.windows, brand, allBrands, getActiveWindow, mediaPlans]);

  // Handle window management actions from agent
  const handleWindowAction = useCallback((action: string) => {
    windowLog('Handling window action:', action);
    const activeWindow = getActiveWindow();

    switch (action) {
      case 'WINDOW_CLOSE':
        if (activeWindow) {
          dispatch({ type: 'CLOSE_WINDOW', windowId: activeWindow.id });
        }
        break;

      case 'WINDOW_MINIMIZE':
        if (activeWindow) {
          dispatch({ type: 'MINIMIZE_WINDOW', windowId: activeWindow.id });
        }
        break;

      case 'WINDOW_MAXIMIZE':
        if (activeWindow) {
          dispatch({ type: 'MAXIMIZE_WINDOW', windowId: activeWindow.id });
        }
        break;

      case 'WINDOW_RESTORE':
        if (activeWindow) {
          dispatch({ type: 'RESTORE_WINDOW', windowId: activeWindow.id });
        }
        break;

      case 'WINDOW_TILE_HORIZONTAL':
        dispatch({ type: 'ARRANGE_TILE_HORIZONTAL' });
        break;

      case 'WINDOW_TILE_VERTICAL':
        dispatch({ type: 'ARRANGE_TILE_VERTICAL' });
        break;

      case 'WINDOW_CASCADE':
        dispatch({ type: 'ARRANGE_CASCADE' });
        break;

      case 'WINDOW_MINIMIZE_ALL':
        dispatch({ type: 'MINIMIZE_ALL' });
        break;

      case 'WINDOW_RESTORE_ALL':
        dispatch({ type: 'RESTORE_ALL' });
        break;

      case 'WINDOW_CLOSE_ALL':
        dispatch({ type: 'CLOSE_ALL' });
        break;

      case 'WINDOW_GATHER':
        dispatch({
          type: 'GATHER_WINDOWS',
          viewportWidth: window.innerWidth,
          viewportHeight: window.innerHeight
        });
        break;

      case 'WINDOW_PIN':
        if (activeWindow) {
          dispatch({ type: 'PIN_WINDOW', windowId: activeWindow.id });
        }
        break;

      case 'WINDOW_UNPIN':
        if (activeWindow) {
          dispatch({ type: 'UNPIN_WINDOW', windowId: activeWindow.id });
        }
        break;

      case 'WINDOW_FOCUS':
        // Focus is handled by the agent brain based on window name matching
        // For now, this is a placeholder - actual focus needs window ID lookup
        windowLog('Window focus requested - requires window lookup');
        break;

      case 'WINDOW_OPEN':
        // Open is handled by the agent brain based on window type
        // For now, this is a placeholder - actual open needs type lookup
        windowLog('Window open requested - requires type specification');
        break;

      default:
        windowLog('Unknown window action:', action);
    }
  }, [dispatch, getActiveWindow]);

  // Handle attribution actions from agent
  const handleAttributionAction = useCallback((action: string) => {
    windowLog('Handling attribution action:', action);

    // Get the current campaign context from the window
    const currentCampaign = windowContext?.campaignId
      ? brand.campaigns.find(c => c.id === windowContext.campaignId)
      : brand.campaigns[0]; // Fallback to first campaign

    if (!currentCampaign) {
      windowLog('No campaign available for attribution');
      return;
    }

    // Map action to view type
    const actionToView: Record<string, string> = {
      'OPEN_ATTRIBUTION': 'OVERVIEW',
      'OPEN_ATTRIBUTION_OVERVIEW': 'OVERVIEW',
      'OPEN_ATTRIBUTION_INCREMENTALITY': 'INCREMENTALITY',
      'OPEN_ATTRIBUTION_TIME': 'TIME',
      'OPEN_ATTRIBUTION_FREQUENCY': 'FREQUENCY',
      'OPEN_ATTRIBUTION_MODELS': 'ROI',
    };

    // Map action to window type for pop-outs
    const actionToWindowType: Record<string, string> = {
      'POPOUT_ATTRIBUTION_OVERVIEW': 'attribution-overview',
      'POPOUT_ATTRIBUTION_INCREMENTALITY': 'attribution-incrementality',
      'POPOUT_ATTRIBUTION_TIME': 'attribution-time',
      'POPOUT_ATTRIBUTION_FREQUENCY': 'attribution-frequency',
      'POPOUT_ATTRIBUTION_MODELS': 'attribution-models',
    };

    // Check if it's a pop-out action
    if (action.startsWith('POPOUT_')) {
      const windowType = actionToWindowType[action];
      if (windowType) {
        const viewName = action.replace('POPOUT_ATTRIBUTION_', '');
        const title = `${viewName.charAt(0) + viewName.slice(1).toLowerCase()} - ${currentCampaign.name}`;
        openWindow(windowType as any, title, currentCampaign.id, brand.id);
      }
    }
    // Regular open action - open full attribution dashboard or navigate to view
    else if (action.startsWith('OPEN_ATTRIBUTION')) {
      const view = actionToView[action] || 'OVERVIEW';
      setAttributionView(view);

      // Check if we already have an attribution window for this campaign
      const existingAttrWindow = canvasState.windows.find(
        w => w.type === 'attribution' && w.entityId === currentCampaign.id
      );

      if (existingAttrWindow) {
        // Focus and update view
        dispatch({ type: 'FOCUS_WINDOW', windowId: existingAttrWindow.id });
      } else {
        // Open new attribution window
        openWindow('attribution', `Attribution - ${currentCampaign.name}`, currentCampaign.id, brand.id);
      }
    }
  }, [windowContext, brand, openWindow, dispatch, canvasState.windows]);

  // Handle message sending
  const handleSendMessage = async (text: string) => {
    // Silent clear command - clears chat without any response
    if (text.toLowerCase().trim() === '/clear' || text.toLowerCase().trim() === 'clear chat') {
      setMessages([]);
      return;
    }

    const userMsg: AgentMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: text,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    await new Promise(resolve => setTimeout(resolve, 500));

    // Get the WINDOW's brand for context-aware commands (not the global brand)
    // This is critical for multi-client support - chat commands should operate
    // on the brand of the currently focused window
    const contextBrand = windowContext?.brandId
      ? allBrands.find(b => b.id === windowContext.brandId) || brand
      : brand;

    // Check for window management and context-aware commands
    const lowerText = text.toLowerCase();

    // Context-aware commands - interpret "this campaign", "this flight", etc.
    const thisPattern = /\b(this|current|the|my)\s+(campaign|flight)\b/i;
    const hasContextRef = thisPattern.test(lowerText);

    // If user refers to "this campaign" and we have context, use it
    if (hasContextRef && windowContext?.campaignId) {
      const campaign = contextBrand.campaigns.find(c => c.id === windowContext.campaignId);
      const flight = windowContext.flightId
        ? campaign?.flights.find(f => f.id === windowContext.flightId)
        : undefined;

      // "Show flights" or "show flights for this campaign" - only useful from a flight view
      // to show sibling flights in the same campaign
      if (lowerText.includes('flight') && (lowerText.includes('show') || lowerText.includes('list'))) {
        if (campaign && flight) {
          // User is viewing a flight, show other flights in the campaign
          const siblingFlights = campaign.flights.filter(f => f.id !== flight.id);
          openWindow('campaign', campaign.name, campaign.id, contextBrand.id);
          const responseMsg: AgentMessage = {
            id: `agent-${Date.now()}`,
            role: 'agent',
            content: siblingFlights.length > 0
              ? `Showing flights in **${campaign.name}** (${campaign.flights.length} total):\n\n${campaign.flights.map(f => `• ${f.name}${f.id === flight.id ? ' *(current)*' : ''} - $${f.budget?.toLocaleString() || 0}`).join('\n')}`
              : `**${flight.name}** is the only flight in ${campaign.name}.`,
            timestamp: Date.now(),
            suggestedActions: siblingFlights.slice(0, 3).map(f => `Open ${f.name}`)
          };
          setMessages(prev => [...prev, responseMsg]);
          setIsTyping(false);
          return;
        } else if (campaign && !flight) {
          // User is already viewing a campaign - they can already see flights
          const responseMsg: AgentMessage = {
            id: `agent-${Date.now()}`,
            role: 'agent',
            content: `You're already viewing the campaign window which shows all ${campaign.flights.length} flights. Click on any flight to open it.`,
            timestamp: Date.now(),
            suggestedActions: campaign.flights.slice(0, 3).map(f => `Open ${f.name}`)
          };
          setMessages(prev => [...prev, responseMsg]);
          setIsTyping(false);
          return;
        }
      }

      // "Add a flight" to current campaign
      if (lowerText.includes('add') && lowerText.includes('flight') && campaign) {
        const responseMsg: AgentMessage = {
          id: `agent-${Date.now()}`,
          role: 'agent',
          content: `I can add a flight to **${campaign.name}**. What would you like to name it, and what's the budget?`,
          timestamp: Date.now(),
          suggestedActions: ['Q1 Awareness - $50k', 'Holiday Push - $100k']
        };
        setMessages(prev => [...prev, responseMsg]);
        setIsTyping(false);
        return;
      }

      // "Show performance" for current context
      if (lowerText.includes('performance') || lowerText.includes('metrics') || lowerText.includes('stats')) {
        const entityName = flight ? `${campaign?.name} › ${flight.name}` : campaign?.name;
        const entityType = flight ? 'flight' : 'campaign';
        const metrics = flight
          ? { impressions: flight.lines.reduce((s, l) => s + (l.forecast?.impressions || 0), 0), spend: flight.lines.reduce((s, l) => s + l.totalCost, 0) }
          : { impressions: campaign?.forecast?.impressions || 0, spend: campaign?.delivery?.actualSpend || 0 };

        const responseMsg: AgentMessage = {
          id: `agent-${Date.now()}`,
          role: 'agent',
          content: `**Performance for ${entityName}:**\n\n📊 **Impressions:** ${metrics.impressions.toLocaleString()}\n💰 **Spend:** $${metrics.spend.toLocaleString()}\n\n*This ${entityType} is performing within expected parameters.*`,
          timestamp: Date.now(),
          suggestedActions: ['Optimize placements', 'Compare to benchmark', 'Export report']
        };
        setMessages(prev => [...prev, responseMsg]);
        setIsTyping(false);
        return;
      }

      // Attribution commands are now handled by agentBrain via handleAttributionCommands
      // (removed hardcoded handler - let it fall through to agentBrain)
    }

    // Window open commands - "open [campaign name]" or "open campaign [name]"
    if (lowerText.includes('open')) {
      // Extract what comes after "open" - support both "open campaign X" and "open X"
      const afterOpen = text.substring(lowerText.indexOf('open') + 4).trim();
      const searchName = afterOpen.replace(/^(the\s+)?campaign\s*/i, '').trim();

      if (searchName.length > 0) {
        // Try to find a campaign that matches the search
        const campaign = contextBrand.campaigns.find(c =>
          c.name.toLowerCase().includes(searchName.toLowerCase()) ||
          searchName.toLowerCase().includes(c.name.toLowerCase().split(' ')[0]) // Match first word
        );
        if (campaign) {
          openWindow('campaign', campaign.name, campaign.id, contextBrand.id);
          const responseMsg: AgentMessage = {
            id: `agent-${Date.now()}`,
            role: 'agent',
            content: `Opened campaign: **${campaign.name}**`,
            timestamp: Date.now(),
            suggestedActions: ['Show flights', 'View performance']
          };
          setMessages(prev => [...prev, responseMsg]);
          setIsTyping(false);
          return;
        }
      }
    }

    // Attribution commands are handled by agentBrain via handleAttributionCommands
    // (removed second hardcoded handler - let it fall through to agentBrain)

    // "Show insights" or "show audience insights" command
    if ((lowerText.includes('insight') || lowerText.includes('audience')) &&
      (lowerText.includes('show') || lowerText.includes('open') || lowerText.includes('view'))) {
      // Need a flight context to show insights
      if (windowContext?.flightId) {
        const flightId = windowContext.flightId;
        const plan = mediaPlans[flightId];
        if (plan) {
          const flightName = plan.campaign.name || 'Media Plan';
          openWindow('audience-insights', `Audience Insights: ${flightName}`, flightId, contextBrand.id);
          const responseMsg: AgentMessage = {
            id: `agent-${Date.now()}`,
            role: 'agent',
            content: `Opened **Audience Insights** for ${flightName}.\n\nThis panel shows segment overlap, reach efficiency, and recommendations for your audience targeting.`,
            timestamp: Date.now(),
            suggestedActions: ['Add segment', 'Optimize reach', 'Export']
          };
          setMessages(prev => [...prev, responseMsg]);
          setIsTyping(false);
          return;
        }
      }
      // No flight context
      const responseMsg: AgentMessage = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: `To view Audience Insights, please open a flight or media plan first. The insights panel analyzes segment overlap and reach for your placements.`,
        timestamp: Date.now(),
        suggestedActions: ['Open portfolio', 'Show campaigns']
      };
      setMessages(prev => [...prev, responseMsg]);
      setIsTyping(false);
      return;
    }

    // Portfolio command with fuzzy matching for common misspellings
    const portfolioPatterns = [
      'portfolio', 'porfolio', 'portflio', 'porftolio', 'protfolio',
      'portoflio', 'portofolio', 'portfolo', 'potfolio', 'protofolio',
      'dashboard', 'dashbord', 'dashbaord', 'dasbhoard'
    ];
    const matchesPortfolio = portfolioPatterns.some(p => lowerText.includes(p)) ||
      (lowerText.includes('open') && (lowerText.includes('port') || lowerText.includes('dash')));

    if (matchesPortfolio) {
      openWindow('portfolio', `${contextBrand.name} Portfolio`, undefined, contextBrand.id);
      const responseMsg: AgentMessage = {
        id: `agent-${Date.now()}`,
        role: 'agent',
        content: `Opened the Portfolio Dashboard for **${contextBrand.name}**.`,
        timestamp: Date.now(),
        suggestedActions: ['Show budget optimization', 'View all campaigns']
      };
      setMessages(prev => [...prev, responseMsg]);
      setIsTyping(false);
      return;
    }

    // Process with AgentBrain for other commands
    // CRITICAL: Set the AgentBrain's brand to the window's brand context
    // This ensures all agent operations work on the correct client's data
    brainRef.current.setBrand(contextBrand);
    const agentResponse = brainRef.current.processInput(text);
    const ctx = brainRef.current.getContext();
    setMessages([...ctx.history]);

    // Handle agent media plan updates - store by flight ID and sync to brand
    if (agentResponse.updatedMediaPlan) {
      const flightId = agentResponse.updatedMediaPlan.activeFlightId;
      if (flightId) {
        setMediaPlans(prev => ({ ...prev, [flightId]: agentResponse.updatedMediaPlan! }));

        // CRITICAL: Sync placements from agent's media plan back to brand state
        const agentPlacements = agentResponse.updatedMediaPlan.campaign.placements || [];
        syncPlacementsToBrand(flightId, agentPlacements);
      }
      brainRef.current.setMediaPlan(agentResponse.updatedMediaPlan);
    } else if (ctx.mediaPlan?.activeFlightId) {
      const flightId = ctx.mediaPlan.activeFlightId;
      const plan = ctx.mediaPlan;
      setMediaPlans(prev => ({ ...prev, [flightId]: { ...plan } }));

      // CRITICAL: Sync placements from agent's media plan back to brand state
      const agentPlacements = plan.campaign.placements || [];
      syncPlacementsToBrand(flightId, agentPlacements);
    }

    setAgentState(ctx.state);
    setIsTyping(false);

    // Handle actions
    const action = agentResponse.action as any;
    if (action) {
      // Window management actions
      if (typeof action === 'string' && action.startsWith('WINDOW_')) {
        handleWindowAction(action);
      }
      // Attribution actions
      else if (typeof action === 'string' && (action.startsWith('OPEN_ATTRIBUTION') || action.startsWith('POPOUT_ATTRIBUTION'))) {
        handleAttributionAction(action);
      }
      // Attribution model change
      else if (typeof action === 'string' && action.startsWith('SET_ATTRIBUTION_MODEL_')) {
        const model = action.replace('SET_ATTRIBUTION_MODEL_', '');
        setAttributionModel(model);
      }
      else if (action === 'EXPORT_PDF' && ctx.mediaPlan) {
        generateMediaPlanPDF(ctx.mediaPlan);
      } else if (action === 'EXPORT_PPT' && ctx.mediaPlan) {
        generateMediaPlanPPT(ctx.mediaPlan);
      } else if (action.type === 'CREATE_CAMPAIGN' && action.payload?.name) {
        // Create the new campaign
        const campaignName = action.payload.name;
        const today = new Date().toISOString().split('T')[0];
        const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        const newCampaign: Campaign = {
          id: generateId(),
          name: campaignName,
          brandId: contextBrand.id,
          advertiser: contextBrand.name,
          budget: 100000, // Default budget
          startDate: today,
          endDate: in90Days,
          goals: ['Brand Awareness'],
          status: 'DRAFT',
          flights: [],
          tags: [],
          forecast: { impressions: 0, spend: 0, reach: 0, frequency: 0, source: 'Internal' },
          delivery: { actualImpressions: 0, actualSpend: 0, pacing: 0, status: 'ON_TRACK' }
        };

        // Add campaign to brand
        const updatedBrand: Brand = {
          ...contextBrand,
          campaigns: [...contextBrand.campaigns, newCampaign]
        };
        onBrandUpdate(updatedBrand);

        // Open the new campaign window
        openWindow('campaign', newCampaign.name, newCampaign.id, contextBrand.id);
      }
    }
  };

  // Helper to get brand by ID, falling back to current brand
  const getBrandById = useCallback((brandId?: string): Brand => {
    if (brandId) {
      const found = allBrands.find(b => b.id === brandId);
      if (found) {
        console.log(`[getBrandById] Found brand ${brandId} with ${found.campaigns.length} campaigns`);
        return found;
      }
      console.warn(`[getBrandById] Brand ${brandId} not found in allBrands (${allBrands.length} brands). Available IDs:`, allBrands.map(b => b.id));
    }
    console.log(`[getBrandById] Falling back to current brand: ${brand.id}`);
    return brand; // Fall back to current brand
  }, [allBrands, brand]);

  // Helper to update a specific brand (not necessarily the current one)
  const updateBrandById = useCallback((brandId: string, updater: (b: Brand) => Brand) => {
    const targetBrand = allBrands.find(b => b.id === brandId);
    if (!targetBrand) return;

    const updatedBrand = updater(targetBrand);

    // If this is the current brand, use the standard update path
    if (brandId === brand.id) {
      onBrandUpdate(updatedBrand);
    } else {
      // For other brands, we need a way to update them
      // This requires App.tsx to support updating any brand, not just current
      // For now, we'll use the onBrandUpdate with the updated brand
      // App.tsx should handle this by checking the brand.id
      onBrandUpdate(updatedBrand);
    }
  }, [allBrands, brand.id, onBrandUpdate]);

  // Helper to find which brand contains a given entity
  const findBrandForEntity = useCallback((entityId: string, windowType: WindowType): Brand | undefined => {
    for (const b of allBrands) {
      if (windowType === 'campaign' && b.campaigns.some(c => c.id === entityId)) {
        return b;
      }
      if ((windowType === 'flight' || windowType === 'media-plan') &&
        b.campaigns.some(c => c.flights.some(f => f.id === entityId))) {
        return b;
      }
      if (windowType === 'portfolio' && b.id === entityId) {
        return b;
      }
    }
    return undefined;
  }, [allBrands]);

  // Render window content based on type - each window maintains its own brand context
  const renderWindowContent = (windowType: WindowType, entityId?: string, windowBrandId?: string): ReactNode => {
    windowLog(`renderWindowContent type=${windowType}, entityId=${entityId}, windowBrandId=${windowBrandId}`);

    // Get the brand for THIS window (may be different from current active brand)
    // If windowBrandId is not set, try to find the brand that contains the entity
    let windowBrand = getBrandById(windowBrandId);

    // Fallback: if brand lookup failed or brand doesn't contain the entity, search all brands
    if (!windowBrandId && entityId) {
      const foundBrand = findBrandForEntity(entityId, windowType);
      if (foundBrand) {
        windowLog(`Found brand ${foundBrand.id} for entity ${entityId}`);
        windowBrand = foundBrand;
      }
    }

    switch (windowType) {
      case 'campaign': {
        let campaign = windowBrand.campaigns.find(c => c.id === entityId);

        // If not found in windowBrand, search all brands (handles legacy pinned windows)
        if (!campaign && entityId) {
          for (const b of allBrands) {
            const found = b.campaigns.find(c => c.id === entityId);
            if (found) {
              windowLog(`Found campaign ${entityId} in brand ${b.id} (searched all brands)`);
              windowBrand = b;
              campaign = found;
              break;
            }
          }
        }

        if (!campaign) {
          console.warn(`[renderWindowContent] Campaign ${entityId} not found in any brand`);
          return <div className="p-4 text-gray-500">Campaign not found</div>;
        }

        // Handler for creating a new flight in this campaign
        const handleCreateFlight = (name: string, budget?: number, startDateParam?: string, endDateParam?: string) => {
          const today = new Date().toISOString().split('T')[0];
          const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          const newFlight: Flight = {
            id: generateId(),
            campaignId: campaign.id,
            name: name,
            budget: budget || Math.floor(campaign.budget * 0.25),
            startDate: startDateParam || today,
            endDate: endDateParam || in30Days,
            lines: [],
            status: 'DRAFT',
            tags: [],
            forecast: { impressions: 0, spend: 0, reach: 0, frequency: 0, source: 'Internal' },
            delivery: { actualImpressions: 0, actualSpend: 0, pacing: 0, status: 'ON_TRACK' }
          };

          // Update the window's brand (which may not be the current brand)
          updateBrandById(windowBrand.id, (b) => ({
            ...b,
            campaigns: b.campaigns.map(c =>
              c.id === campaign.id
                ? { ...c, flights: [...c.flights, newFlight] }
                : c
            )
          }));

          // Open the new flight with the window's brand context
          openWindow('flight', `${campaign.name}\\${newFlight.name}`, newFlight.id, windowBrand.id);
        };

        // Handler for opening template library
        const handleOpenTemplateLibrary = () => {
          setTemplateLibraryCampaignId(campaign.id);
        };

        return <CampaignWindowContent
          campaign={campaign}
          onCreateFlight={handleCreateFlight}
          onOpenFlight={(flightId, flightName) => openWindow('flight', `${campaign.name}\\${flightName}`, flightId, windowBrand.id)}
          onOpenTemplateLibrary={handleOpenTemplateLibrary}
        />;
      }

      case 'flight': {
        // Find the flight and its parent campaign in the WINDOW's brand
        let foundCampaign: Campaign | undefined;
        let foundFlight: Flight | undefined;
        let actualBrand = windowBrand;

        for (const c of windowBrand.campaigns) {
          const f = c.flights.find(fl => fl.id === entityId);
          if (f) {
            foundCampaign = c;
            foundFlight = f;
            break;
          }
        }

        // If not found in windowBrand, search all brands (handles legacy pinned windows)
        if (!foundFlight && entityId) {
          for (const b of allBrands) {
            for (const c of b.campaigns) {
              const f = c.flights.find(fl => fl.id === entityId);
              if (f) {
                windowLog(`Found flight ${entityId} in brand ${b.id} (searched all brands)`);
                actualBrand = b;
                foundCampaign = c;
                foundFlight = f;
                break;
              }
            }
            if (foundFlight) break;
          }
        }

        if (!foundFlight || !foundCampaign) {
          console.warn(`[renderWindowContent] Flight ${entityId} not found in any brand`);
          return (
            <div className="p-4 h-full flex items-center justify-center">
              <div className="text-center">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">Flight not found</p>
                <p className="text-xs text-gray-400 mt-1">Flight ID: {entityId}</p>
              </div>
            </div>
          );
        }

        // Use the actual brand we found for operations
        windowBrand = actualBrand;

        // Create handlers that operate on the window's brand
        const handleWindowToggleStatus = (flightId: string, newStatus: 'ACTIVE' | 'DRAFT') => {
          updateBrandById(windowBrand.id, (b) => ({
            ...b,
            campaigns: b.campaigns.map(c => ({
              ...c,
              flights: c.flights.map(f => f.id === flightId ? { ...f, status: newStatus } : f)
            }))
          }));
        };

        return <FlightWindowContent
          flight={foundFlight}
          campaignName={foundCampaign.name}
          onToggleStatus={(newStatus) => handleWindowToggleStatus(foundFlight!.id, newStatus)}
          onEditPlan={() => openWindow('media-plan', `${foundCampaign!.name}\\${foundFlight!.name}`, foundFlight!.id, windowBrand.id)}
        />;
      }

      case 'portfolio': {
        // Handler for creating a new campaign in the window's brand
        const handleCreateCampaign = () => {
          const campaignName = prompt('Enter campaign name:');
          if (!campaignName) return;

          const budgetStr = prompt('Enter campaign budget (e.g., 100000):', '100000');
          const budget = parseInt(budgetStr || '100000', 10);

          const today = new Date().toISOString().split('T')[0];
          const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

          const newCampaign: Campaign = {
            id: generateId(),
            name: campaignName,
            brandId: windowBrand.id,
            advertiser: windowBrand.name,
            budget: budget,
            startDate: today,
            endDate: in90Days,
            goals: ['Brand Awareness'],
            flights: [],
            status: 'DRAFT',
            tags: [],
            forecast: { impressions: 0, spend: 0, reach: 0, frequency: 0, source: 'Internal' },
            delivery: { actualImpressions: 0, actualSpend: 0, pacing: 0, status: 'ON_TRACK' },
            placements: []
          };

          // Update the window's brand
          updateBrandById(windowBrand.id, (b) => ({
            ...b,
            campaigns: [...b.campaigns, newCampaign]
          }));

          // Open the new campaign with the window's brand context
          openWindow('campaign', newCampaign.name, newCampaign.id, windowBrand.id);
        };

        return <PortfolioWindowContent
          brand={windowBrand}
          onCreateCampaign={handleCreateCampaign}
          onOpenCampaign={(campaignId, campaignName) => openWindow('campaign', campaignName, campaignId, windowBrand.id)}
        />;
      }

      case 'media-plan': {
        // entityId is the flightId for media-plan windows
        const flightId = entityId;
        let plan = flightId ? mediaPlans[flightId] : null;
        let actualPlanBrand = windowBrand;

        // If plan not in state yet, try to create it from the WINDOW's brand data (handles race condition)
        if (!plan && flightId) {
          let foundFlight: Flight | undefined;
          let foundCampaign: Campaign | undefined;

          // First try windowBrand
          for (const c of windowBrand.campaigns) {
            const f = c.flights.find(fl => fl.id === flightId);
            if (f) {
              foundFlight = f;
              foundCampaign = c;
              break;
            }
          }

          // If not found, search all brands
          if (!foundFlight) {
            for (const b of allBrands) {
              for (const c of b.campaigns) {
                const f = c.flights.find(fl => fl.id === flightId);
                if (f) {
                  windowLog(`Found flight ${flightId} for media-plan in brand ${b.id} (searched all brands)`);
                  actualPlanBrand = b;
                  foundFlight = f;
                  foundCampaign = c;
                  break;
                }
              }
              if (foundFlight) break;
            }
          }

          if (foundFlight && foundCampaign) {
            // Create the plan on-the-fly for rendering
            plan = {
              id: generateId(),
              campaign: {
                ...foundCampaign,
                placements: foundFlight.lines
              },
              activeFlightId: flightId,
              totalSpend: foundFlight.lines.reduce((sum, line) => sum + line.totalCost, 0),
              remainingBudget: foundFlight.budget - foundFlight.lines.reduce((sum, line) => sum + line.totalCost, 0),
              version: 1,
              groupingMode: 'DETAILED',
              strategy: 'BALANCED',
              metrics: calculatePlanMetrics(foundFlight.lines)
            };
            // Schedule state update for next tick
            setTimeout(() => {
              setMediaPlans(prev => {
                if (!prev[flightId]) {
                  return { ...prev, [flightId]: plan! };
                }
                return prev;
              });
            }, 0);
          }
        }

        if (!plan) {
          return (
            <div className="h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No media plan loaded</p>
                <p className="text-sm mt-1">Open a flight and click "Edit Plan" to start</p>
              </div>
            </div>
          );
        }

        // Use the actual brand we found for operations
        windowBrand = actualPlanBrand;

        // Export handlers
        const handleExportPDF = () => {
          if (plan) {
            generateMediaPlanPDF(plan);
          }
        };

        const handleExportPPT = () => {
          if (plan) {
            generateMediaPlanPPT(plan);
          }
        };

        return (
          <div className="h-full flex flex-col bg-gray-50">
            {/* Export toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-white border-b border-gray-200">
              <div className="text-sm text-gray-600">
                {plan.campaign.placements?.length || 0} placements | ${plan.totalSpend?.toLocaleString() || '0'} spend
              </div>
              <div className="flex items-center gap-2">
                <AsyncButton
                  onClick={handleExportPDF}
                  icon={<FileDown className="w-4 h-4" />}
                  loadingText="Exporting..."
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Export PDF
                </AsyncButton>
                <AsyncButton
                  onClick={handleExportPPT}
                  icon={<Download className="w-4 h-4" />}
                  loadingText="Exporting..."
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Export PPT
                </AsyncButton>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <PlanVisualizer
                mediaPlan={plan}
                onGroupingChange={(mode) => {
                  setMediaPlans(prev => ({
                    ...prev,
                    [flightId!]: { ...prev[flightId!], groupingMode: mode }
                  }));
                }}
                onUpdatePlacement={(placement) => handleUpdatePlacement(flightId!, placement)}
                onDeletePlacement={(placementId) => handleDeletePlacement(flightId!, placementId)}
                onAddPlacement={() => handleAddPlacement(flightId!)}
                onOpenAudienceInsights={() => {
                  // Open audience insights as a separate window
                  // Use flightId as entityId to associate with the current plan
                  const flightName = plan?.campaign.name || 'Media Plan';
                  openWindow('audience-insights', `Audience Insights: ${flightName}`, flightId!, windowBrand.id);
                }}
              />
            </div>
          </div>
        );
      }

      case 'audience-insights': {
        // entityId is the flightId - get the media plan for this flight
        const plan = entityId ? mediaPlans[entityId] : null;
        if (!plan) {
          return (
            <div className="p-4 h-full flex items-center justify-center">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">No media plan found for this flight</p>
                <p className="text-xs text-gray-400 mt-1">Flight ID: {entityId}</p>
              </div>
            </div>
          );
        }

        const campaign = plan.campaign;
        const placements = campaign.placements || [];

        // Get all unique segments from placements
        const getAllCurrentSegments = (): Segment[] => {
          const segmentMap = new Map<string, Segment>();
          placements.forEach(p => {
            if (p.segments) {
              p.segments.forEach(s => segmentMap.set(s.id, s));
            }
          });
          return Array.from(segmentMap.values());
        };

        // Handler for adding segment to all placements (simplified)
        const handleQuickAddSegment = (segment: Segment) => {
          placements.forEach(placement => {
            const existingSegments = placement.segments || [];
            if (!existingSegments.some(s => s.id === segment.id)) {
              handleUpdatePlacement(entityId!, {
                ...placement,
                segments: [...existingSegments, segment]
              });
            }
          });
        };

        // Handler for removing segment from all placements
        const handleRemoveSegment = (segment: Segment) => {
          placements.forEach(placement => {
            const existingSegments = placement.segments || [];
            if (existingSegments.some(s => s.id === segment.id)) {
              handleUpdatePlacement(entityId!, {
                ...placement,
                segments: existingSegments.filter(s => s.id !== segment.id)
              });
            }
          });
        };

        return (
          <div className="h-full overflow-hidden">
            <AudienceInsightsPanel
              isOpen={true}
              embedded={true}
              onClose={() => {
                // Find and close this window
                const windowToClose = canvasState.windows.find(
                  w => w.type === 'audience-insights' && w.entityId === entityId
                );
                if (windowToClose) {
                  closeWindow(windowToClose.id);
                }
              }}
              placements={placements}
              currentSegments={getAllCurrentSegments()}
              goals={campaign.numericGoals}
              onAddSegment={handleQuickAddSegment}
              onRemoveSegment={handleRemoveSegment}
            />
          </div>
        );
      }

      case 'client-list': {
        return (
          <ClientListWindowContent
            brands={allBrands}
            currentBrandId={brand.id}
            onSelectClient={onBrandSelect}
            onOpenClientDetail={(brandId, brandName) => openWindow('client', brandName, brandId, brandId)}
          />
        );
      }

      case 'client': {
        const clientBrand = allBrands.find(b => b.id === entityId);
        if (!clientBrand) {
          return (
            <div className="p-4 h-full flex items-center justify-center">
              <div className="text-center">
                <Users className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">Client not found</p>
                <p className="text-xs text-gray-400 mt-1">Client ID: {entityId}</p>
              </div>
            </div>
          );
        }

        return (
          <ClientDetailWindowContent
            clientBrand={clientBrand}
            isCurrentClient={clientBrand.id === brand.id}
            onSwitchToClient={() => onBrandSelect(clientBrand.id)}
            onOpenCampaign={(campaignId, campaignName) => {
              // Open campaign window with the CLIENT's brand context
              // No need to switch brands - the window will have its own context
              openWindow('campaign', campaignName, campaignId, clientBrand.id);
            }}
          />
        );
      }

      case 'report': {
        // entityId encodes: entityType:entityId (e.g., "flight:flight-123" or "campaign:campaign-456")
        // The window title contains the entity name for display
        let reportEntityName = 'Report';
        let reportEntityType: 'brand' | 'campaign' | 'flight' = 'campaign';
        let reportChannels: string[] = [];

        if (entityId) {
          const [type, id] = entityId.split(':');
          if (type === 'flight') {
            reportEntityType = 'flight';
            // Find the flight to get channels
            for (const campaign of windowBrand.campaigns) {
              const flight = campaign.flights.find(f => f.id === id);
              if (flight) {
                reportEntityName = `${campaign.name} › ${flight.name}`;
                reportChannels = [...new Set(flight.lines.map(l => l.channel))];
                break;
              }
            }
          } else if (type === 'campaign') {
            reportEntityType = 'campaign';
            const campaign = windowBrand.campaigns.find(c => c.id === id);
            if (campaign) {
              reportEntityName = campaign.name;
              reportChannels = [...new Set(campaign.flights.flatMap(f => f.lines.map(l => l.channel)))];
            }
          } else if (type === 'brand') {
            reportEntityType = 'brand';
            reportEntityName = windowBrand.name;
            reportChannels = [...new Set(windowBrand.campaigns.flatMap(c => c.flights.flatMap(f => f.lines.map(l => l.channel))))];
          }
        }

        return (
          <AttributionReportContent
            entityName={reportEntityName}
            entityType={reportEntityType}
            channels={reportChannels.slice(0, 6)}
          />
        );
      }

      // Attribution windows - full dashboard and pop-out views
      case 'attribution': {
        // entityId is the campaignId
        const campaign = windowBrand.campaigns.find(c => c.id === entityId);
        if (!campaign) {
          return (
            <div className="p-4 h-full flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">Campaign not found</p>
                <p className="text-xs text-gray-400 mt-1">Campaign ID: {entityId}</p>
              </div>
            </div>
          );
        }

        // Handler for pop-out
        const handlePopOut = (viewType: string, title: string) => {
          openWindow(viewType as any, title, campaign.id, windowBrand.id);
        };

        return (
          <AttributionDashboard
            campaign={campaign}
            onBack={() => {
              // Find and close this window
              const windowToClose = canvasState.windows.find(
                w => w.type === 'attribution' && w.entityId === entityId
              );
              if (windowToClose) {
                closeWindow(windowToClose.id);
              }
            }}
            onPopOut={handlePopOut}
            initialView={attributionView as any}
            initialModel={attributionModel as any}
            onModelChange={(model) => setAttributionModel(model)}
            onViewChange={(view) => setAttributionView(view)}
          />
        );
      }

      // Pop-out attribution views (single view without sidebar)
      case 'attribution-overview':
      case 'attribution-incrementality':
      case 'attribution-time':
      case 'attribution-frequency':
      case 'attribution-models': {
        const campaign = windowBrand.campaigns.find(c => c.id === entityId);
        if (!campaign) {
          return (
            <div className="p-4 h-full flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">Campaign not found</p>
              </div>
            </div>
          );
        }

        // Map window type to view
        const windowTypeToView: Record<string, string> = {
          'attribution-overview': 'OVERVIEW',
          'attribution-incrementality': 'INCREMENTALITY',
          'attribution-time': 'TIME',
          'attribution-frequency': 'FREQUENCY',
          'attribution-models': 'ROI',
        };

        const viewForWindow = windowTypeToView[windowType] || 'OVERVIEW';

        return (
          <AttributionDashboard
            campaign={campaign}
            hideSidebar={true}
            initialView={viewForWindow as any}
            initialModel={attributionModel as any}
            onModelChange={(model) => setAttributionModel(model)}
          />
        );
      }

      default:
        return (
          <div className="p-4 text-gray-500">
            Content for {windowType} will be displayed here.
          </div>
        );
    }
  };

  // Generate context display text - includes brand name if different from current
  // IMPORTANT: Also check the active window directly for immediate responsiveness
  const getContextDisplayText = () => {
    const activeWin = getActiveWindow();

    // If we have an active content window, derive context directly from it
    // This ensures immediate updates when clicking on windows
    if (activeWin && activeWin.type !== 'chat') {
      // Get brand info directly from window
      // For client windows, entityId IS the brandId
      const winBrandId = activeWin.type === 'client'
        ? (activeWin.brandId || activeWin.entityId)
        : activeWin.brandId;
      const winBrand = winBrandId ? allBrands.find(b => b.id === winBrandId) : null;
      const brandName = winBrand?.name || brand.name;
      const isDifferentBrand = winBrandId && winBrandId !== brand.id;

      let contextPath = '';

      if (activeWin.type === 'client-list') {
        return 'All Clients';
      } else if (activeWin.type === 'portfolio') {
        contextPath = 'Portfolio Dashboard';
      } else if (activeWin.type === 'client') {
        // For client windows, get the brand name from entityId (which is the brandId)
        const clientBrand = allBrands.find(b => b.id === activeWin.entityId);
        contextPath = `Client: ${clientBrand?.name || activeWin.title}`;
      } else if (activeWin.type === 'flight' || activeWin.type === 'media-plan') {
        // Look up flight and campaign info
        if (winBrand && activeWin.entityId) {
          for (const campaign of winBrand.campaigns) {
            const flight = campaign.flights.find(f => f.id === activeWin.entityId);
            if (flight) {
              contextPath = `${campaign.name} › ${flight.name}`;
              break;
            }
          }
        }
        if (!contextPath) {
          contextPath = activeWin.title || activeWin.type;
        }
      } else if (activeWin.type === 'campaign') {
        if (winBrand && activeWin.entityId) {
          const campaign = winBrand.campaigns.find(c => c.id === activeWin.entityId);
          contextPath = campaign?.name || activeWin.title || 'Campaign';
        } else {
          contextPath = activeWin.title || 'Campaign';
        }
      } else {
        contextPath = activeWin.title || activeWin.type.charAt(0).toUpperCase() + activeWin.type.slice(1);
      }

      // Prepend brand name if different from global brand
      if (isDifferentBrand && brandName) {
        return `[${brandName}] ${contextPath}`;
      }
      return contextPath;
    }

    // Fallback to windowContext for chat windows or when no active window
    if (!windowContext?.windowType) return null;

    // Build context path
    let contextPath = '';

    if (windowContext.flightName) {
      contextPath = `${windowContext.campaignName} › ${windowContext.flightName}`;
    } else if (windowContext.campaignName) {
      contextPath = windowContext.campaignName;
    } else if (windowContext.windowType === 'portfolio') {
      contextPath = 'Portfolio Dashboard';
    } else if (windowContext.windowType === 'client') {
      contextPath = `Client: ${windowContext.brandName || 'Unknown'}`;
    } else if (windowContext.windowType === 'client-list') {
      contextPath = 'All Clients';
    } else {
      contextPath = windowContext.windowType.charAt(0).toUpperCase() + windowContext.windowType.slice(1);
    }

    // Prepend brand name if it's different from the current brand
    if (windowContext.brandName && windowContext.brandId !== brand.id) {
      return `[${windowContext.brandName}] ${contextPath}`;
    }

    return contextPath;
  };

  const contextDisplayText = getContextDisplayText();

  // Get the active window for header display
  const currentActiveWindow = getActiveWindow();

  // Get the active window's brand name for the header
  // IMPORTANT: Derive directly from the active window's brandId, NOT from windowContext
  // This ensures the header updates immediately when clicking on windows from different brands
  // (windowContext is updated asynchronously via useEffect)
  const activeWindowBrandName = (() => {
    if (!currentActiveWindow) {
      return brand.name; // No active window, use global brand
    }
    if (currentActiveWindow.type === 'client-list') {
      return 'All Clients';
    }
    if (currentActiveWindow.type === 'chat') {
      // Chat window: use windowContext (which preserves the last content window's brand)
      return windowContext?.brandName || brand.name;
    }
    if (currentActiveWindow.type === 'client') {
      // Client window: entityId IS the brandId - look up brand name
      const clientBrand = allBrands.find(b => b.id === currentActiveWindow.entityId);
      return clientBrand?.name || currentActiveWindow.title || brand.name;
    }
    // For all other windows: look up brand directly from window's brandId
    if (currentActiveWindow.brandId) {
      const windowBrand = allBrands.find(b => b.id === currentActiveWindow.brandId);
      return windowBrand?.name || brand.name;
    }
    return brand.name;
  })();

  // Toggle chat dock/undock
  const handleToggleChatMode = () => {
    if (canvasState.chatMode === 'docked') {
      dispatch({ type: 'UNDOCK_CHAT' });
    } else {
      dispatch({ type: 'DOCK_CHAT' });
    }
  };

  // Chat component
  const chatComponent = (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              title="Back to Client Selection"
            >
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <div>
              <div className="font-medium text-gray-900 flex items-center gap-1">
                {activeWindowBrandName}
                {/* Show indicator if viewing a different client */}
                {windowContext?.brandId && windowContext.brandId !== brand.id && (
                  <span className="text-xs font-normal text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                    viewing
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {canvasState.windows.filter(w => w.type !== 'chat').length} window{canvasState.windows.filter(w => w.type !== 'chat').length !== 1 ? 's' : ''} open
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* All Clients button - only show if multi-client mode */}
            {allBrands.length > 1 && (
              <button
                onClick={() => openWindow('client-list', 'All Clients')}
                className="p-1.5 hover:bg-gray-200 rounded transition-colors"
                title="View All Clients"
              >
                <Users size={18} className="text-gray-600" />
              </button>
            )}

            {/* Switch to Classic Mode */}
            <button
              onClick={onSwitchToClassic}
              className="p-1.5 hover:bg-gray-200 rounded transition-colors"
              title="Switch to Classic Mode"
            >
              <LayoutGrid size={18} className="text-gray-600" />
            </button>

            {/* Dock/Undock button */}
            <button
              onClick={handleToggleChatMode}
              className="p-1.5 hover:bg-gray-200 rounded transition-colors"
              title={canvasState.chatMode === 'docked' ? 'Undock chat (make movable)' : 'Dock chat (anchor to side)'}
            >
              {canvasState.chatMode === 'docked'
                ? <PanelRightClose size={18} className="text-gray-600" />
                : <PanelRightOpen size={18} className="text-gray-600" />
              }
            </button>
          </div>
        </div>

        {/* Context Indicator */}
        {contextDisplayText && (
          <div className="mt-2 flex items-center gap-2 px-2 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span className="text-xs text-blue-700 font-medium">
              Context: <span className="text-blue-900">{contextDisplayText}</span>
            </span>
            <span className="text-xs text-blue-600 ml-auto">
              Try "add a flight" or "show performance"
            </span>
          </div>
        )}
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isTyping={isTyping}
          agentState={agentState}
        />
      </div>
    </div>
  );

  // Define window actions based on window type
  const getWindowActions = (window: WindowState): { label: string; onClick: () => void }[] => {
    const actions = [];

    if (window.type === 'campaign') {
      // Add "Open Attribution Dashboard" action for campaign windows
      actions.push({
        label: 'Open Attribution Dashboard',
        onClick: () => {
          // Find the campaign to get title
          // window.entityId is the campaignId for campaign windows
          const cId = window.entityId;
          const bId = window.brandId || brand.id; // Use window brand or current brand fallback

          if (cId) {
            // Find campaign name for the window title
            let campaignName = 'Campaign';

            openWindow('attribution', 'Attribution Dashboard', cId, bId);
          } else {
            console.warn('Cannot open attribution: validation failed', { cId, bId });
          }
        }
      });
    }

    return actions;
  };

  return (
    <>
      <Canvas
        chatComponent={chatComponent}
        renderWindowContent={renderWindowContent}
        getWindowActions={getWindowActions}
      />
      {templateLibraryCampaignId && (
        <TemplateLibrary
          onSelectTemplate={(template) => handleTemplateSelect(templateLibraryCampaignId, template)}
          onClose={() => setTemplateLibraryCampaignId(null)}
        />
      )}
    </>
  );
}

interface WindowedAppProps {
  brand: Brand;
  allBrands?: Brand[];  // Optional: all clients/brands for multi-client support
  onBrandUpdate: (brand: Brand) => void;
  onBrandSelect?: (brandId: string) => void;  // Optional: switch to different client
  onBack: () => void;
  onSwitchToClassic: () => void;
}

export function WindowedApp({ brand, allBrands = [], onBrandUpdate, onBrandSelect, onBack, onSwitchToClassic }: WindowedAppProps) {
  return (
    <CanvasProvider>
      <WindowedAppInner
        brand={brand}
        allBrands={allBrands.length > 0 ? allBrands : [brand]}  // Default to current brand if no list provided
        onBrandUpdate={onBrandUpdate}
        onBrandSelect={onBrandSelect || (() => { })}
        onBack={onBack}
        onSwitchToClassic={onSwitchToClassic}
      />
    </CanvasProvider>
  );
}

export default WindowedApp;
