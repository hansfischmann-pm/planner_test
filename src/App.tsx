import React, { useState, useEffect, useRef } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { PlanVisualizer } from './components/PlanVisualizer';
import { OnboardingHints } from './components/OnboardingHints';
import { LoginScreen } from './components/LoginScreen';
import { ClientSelectionDashboard } from './components/ClientSelectionDashboard';
import { ClientSwitcher } from './components/ClientSwitcher';
import { LayoutControls } from './components/LayoutControls';
import { ContextualHelp } from './components/ContextualHelp';
import { CampaignList } from './components/CampaignList';
import { FlightList } from './components/FlightList';
import { AgencyAnalyticsDashboard } from './components/AgencyAnalyticsDashboard';

import { AgentBrain, AgentState } from './logic/agentBrain';
import { AgentMessage, MediaPlan, User, Brand, Campaign, Flight, UserType, LayoutPosition } from './types';
import { MOCK_DATA, SAMPLE_BRANDS } from './logic/dummyData';

import { generateMediaPlanPDF } from './utils/pdfGenerator';
import { generateMediaPlanPPT } from './utils/pptGenerator';
import { ArrowLeft } from 'lucide-react';

type ViewState = 'LOGIN' | 'CLIENT_SELECTION' | 'CAMPAIGN_LIST' | 'FLIGHT_LIST' | 'MEDIA_PLAN' | 'AGENCY_ANALYTICS';

function App() {
    // Navigation & Context State
    const [view, setView] = useState<ViewState>('LOGIN');
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [currentBrand, setCurrentBrand] = useState<Brand | null>(null);
    const [currentCampaign, setCurrentCampaign] = useState<Campaign | null>(null);
    const [currentFlight, setCurrentFlight] = useState<Flight | null>(null);

    // Layout State
    const [layout, setLayout] = useState<LayoutPosition>(() => {
        const saved = localStorage.getItem('fuseiq-layout');
        return (saved as LayoutPosition) || 'LEFT';
    });
    const [chatSize, setChatSize] = useState<number>(() => {
        const saved = localStorage.getItem('fuseiq-chat-size');
        return saved ? parseInt(saved) : 400;
    });
    const [isResizing, setIsResizing] = useState(false);

    // Agent & Media Plan State
    const brainRef = useRef<AgentBrain>(new AgentBrain());
    const [messages, setMessages] = useState<AgentMessage[]>([]);
    const [mediaPlan, setMediaPlan] = useState<MediaPlan | null>(null);
    const [agentState, setAgentState] = useState<AgentState>('INIT');
    const [isTyping, setIsTyping] = useState(false);

    // Persist layout changes
    const handleLayoutChange = (newLayout: LayoutPosition) => {
        setLayout(newLayout);
        localStorage.setItem('fuseiq-layout', newLayout);
        // Reset chat size when changing layout orientation
        const newSize = newLayout === 'BOTTOM' ? 300 : 400;
        setChatSize(newSize);
        localStorage.setItem('fuseiq-chat-size', newSize.toString());
    };

    // Handle resize
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;

            let newSize: number;
            if (layout === 'LEFT') {
                newSize = Math.max(250, Math.min(800, e.clientX));
            } else if (layout === 'RIGHT') {
                newSize = Math.max(250, Math.min(800, window.innerWidth - e.clientX));
            } else { // BOTTOM
                newSize = Math.max(200, Math.min(600, window.innerHeight - e.clientY));
            }

            setChatSize(newSize);
        };

        const handleMouseUp = () => {
            if (isResizing) {
                setIsResizing(false);
                localStorage.setItem('fuseiq-chat-size', chatSize.toString());
            }
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            return () => {
                document.removeEventListener('mousemove', handleMouseMove);
                document.removeEventListener('mouseup', handleMouseUp);
            };
        }
    }, [isResizing, layout, chatSize]);

    // --- Navigation Handlers ---

    const handleLogin = (user: User) => {
        setCurrentUser(user);
        if (user.type === 'AGENCY') {
            setView('CLIENT_SELECTION');
        } else {
            // For brand user, find their brand
            const brand = SAMPLE_BRANDS.find(b => b.id === user.brandId);
            if (brand) {
                setCurrentBrand(brand);
                setView('CAMPAIGN_LIST');
            }
        }
    };

    const handleSelectBrand = (brand: Brand) => {
        setCurrentBrand(brand);
        setView('CAMPAIGN_LIST');
    };

    const handleSelectCampaign = (campaign: Campaign) => {
        setCurrentCampaign(campaign);
        setView('FLIGHT_LIST');
    };

    const handleSelectFlight = (flight: Flight) => {
        setCurrentFlight(flight);

        // Initialize Media Plan from Flight Data
        const initialPlan: MediaPlan = {
            id: flight.id,
            campaign: currentCampaign!,
            activeFlightId: flight.id,
            totalSpend: flight.lines.reduce((sum, line) => sum + line.totalCost, 0),
            remainingBudget: flight.budget - flight.lines.reduce((sum, line) => sum + line.totalCost, 0),
            version: 1,
            groupingMode: 'DETAILED',
            strategy: 'BALANCED',
            // In a real app, we'd calculate these from lines
            metrics: {
                impressions: flight.lines.reduce((sum, line) => sum + (line.performance?.impressions || 0), 0),
                reach: 0, // To be calculated
                frequency: 0, // To be calculated
                cpm: 0 // To be calculated
            }
        };

        // Reset Brain with new context
        brainRef.current = new AgentBrain();
        // Note: In a real app, we'd pass the initialPlan to the brain here
        // For now, we'll manually set the context in the brain if needed, 
        // or just rely on the visualizer to show the plan.
        // Since AgentBrain manages state internally, we might need a method to load a plan.
        // For this mock, we'll just set the local state.

        // HACK: We need to inject this plan into the brain so it knows about it
        const ctx = brainRef.current.getContext();
        ctx.mediaPlan = initialPlan;
        ctx.mediaPlan.campaign.placements = flight.lines; // Legacy support for brain logic

        setMediaPlan(initialPlan);
        setMessages([{
            id: 'welcome',
            role: 'agent',
            content: `Welcome to the media plan for **${flight.name}**. I've loaded the current lines. How can I help you optimize this flight?`,
            timestamp: Date.now()
        }]);
        setAgentState('IDLE');

        setView('MEDIA_PLAN');
    };

    const handleSwitchBrand = (brand: Brand) => {
        setCurrentBrand(brand);
        setCurrentCampaign(null);
        setCurrentFlight(null);
        setView('CAMPAIGN_LIST');
    };

    // --- Agent Interaction ---

    const handleSendMessage = async (text: string) => {
        const userMsg: AgentMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        // Simulate delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Process input
        const agentResponse = brainRef.current.processInput(text);

        // Update state
        const ctx = brainRef.current.getContext();
        setMessages([...ctx.history]);
        setMediaPlan(ctx.mediaPlan ? { ...ctx.mediaPlan } : null);
        setAgentState(ctx.state);
        setIsTyping(false);

        // Handle side effects
        if (agentResponse.action === 'EXPORT_PDF' && ctx.mediaPlan) {
            generateMediaPlanPDF(ctx.mediaPlan);
        } else if (agentResponse.action === 'EXPORT_PPT' && ctx.mediaPlan) {
            generateMediaPlanPPT(ctx.mediaPlan);
        } else if (agentResponse.action?.startsWith('LAYOUT_')) {
            // Handle layout changes from conversational commands
            const newLayout = agentResponse.action.replace('LAYOUT_', '') as LayoutPosition;
            handleLayoutChange(newLayout);
        }
    };

    // --- Render Logic ---

    if (view === 'LOGIN') {
        return <LoginScreen onLogin={handleLogin} />;
    }

    if (view === 'CLIENT_SELECTION') {
        return (
            <ClientSelectionDashboard
                brands={SAMPLE_BRANDS}
                onSelectBrand={handleSelectBrand}
                onViewAnalytics={() => setView('AGENCY_ANALYTICS')}
            />
        );
    }

    if (view === 'AGENCY_ANALYTICS') {
        return (
            <AgencyAnalyticsDashboard
                brands={SAMPLE_BRANDS}
                onBack={() => setView('CLIENT_SELECTION')}
            />
        );
    }

    // Common Layout for Campaign/Flight/Plan views
    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <div className="bg-purple-600 p-1.5 rounded-lg">
                            <img src="/adroll-logo.png" alt="FuseIQ" className="h-5 w-auto brightness-0 invert" />
                        </div>
                        <span className="font-bold text-gray-900 text-lg">FuseIQ</span>
                    </div>

                    <div className="h-6 w-px bg-gray-200 mx-2"></div>

                    {/* Client Switcher (Agency Only) */}
                    {currentUser?.type === 'AGENCY' && currentBrand && (
                        <ClientSwitcher
                            currentBrand={currentBrand}
                            allBrands={SAMPLE_BRANDS}
                            onSwitchBrand={handleSwitchBrand}
                        />
                    )}

                    {/* Breadcrumbs */}
                    {currentBrand && (
                        <div className="flex items-center text-sm text-gray-500">
                            {currentUser?.type === 'BRAND' && <span className="font-medium text-gray-900">{currentBrand.name}</span>}

                            {currentCampaign && (
                                <>
                                    <span className="mx-2">/</span>
                                    <button
                                        onClick={() => setView('CAMPAIGN_LIST')}
                                        className="hover:text-purple-600 transition-colors"
                                    >
                                        Campaigns
                                    </button>
                                </>
                            )}

                            {currentFlight && (
                                <>
                                    <span className="mx-2">/</span>
                                    <button
                                        onClick={() => setView('FLIGHT_LIST')}
                                        className="hover:text-purple-600 transition-colors"
                                    >
                                        {currentCampaign?.name}
                                    </button>
                                    <span className="mx-2">/</span>
                                    <span className="font-medium text-gray-900">{currentFlight.name}</span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Layout Controls - only show in media plan view */}
                    {view === 'MEDIA_PLAN' && (
                        <LayoutControls currentLayout={layout} onLayoutChange={handleLayoutChange} />
                    )}
                    <div className="flex flex-col items-end">
                        <span className="text-sm font-medium text-gray-900">{currentUser?.name}</span>
                        <span className="text-xs text-gray-500">{currentUser?.type === 'AGENCY' ? 'Agency Admin' : 'Brand Manager'}</span>
                    </div>
                    <img src={currentUser?.avatarUrl} alt="" className="h-8 w-8 rounded-full bg-gray-200" />
                </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden">
                {view === 'CAMPAIGN_LIST' && currentBrand && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full overflow-y-auto">
                        {/* Find campaigns for this brand from MOCK_DATA */}
                        <CampaignList
                            campaigns={MOCK_DATA.brands.find(b => b.id === currentBrand.id)?.campaigns || []}
                            onSelectCampaign={handleSelectCampaign}
                        />
                    </div>
                )}

                {view === 'FLIGHT_LIST' && currentCampaign && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full overflow-y-auto">
                        <FlightList
                            flights={currentCampaign.flights}
                            onSelectFlight={handleSelectFlight}
                            onBack={() => setView('CAMPAIGN_LIST')}
                        />
                    </div>
                )}

                {view === 'MEDIA_PLAN' && (
                    <div className={`h-full ${layout === 'BOTTOM' ? 'flex flex-col' : 'flex flex-row'
                        }`}>
                        {/* Chat Panel */}
                        <div
                            className={`bg-white flex flex-col ${layout === 'LEFT' ? 'border-r border-gray-200 order-1' :
                                layout === 'RIGHT' ? 'border-l border-gray-200 order-3' :
                                    'border-t border-gray-200 order-3'
                                }`}
                            style={{
                                width: layout !== 'BOTTOM' ? `${chatSize}px` : '100%',
                                height: layout === 'BOTTOM' ? `${chatSize}px` : '100%',
                                flexShrink: 0
                            }}
                        >
                            <ChatInterface
                                messages={messages}
                                onSendMessage={handleSendMessage}
                                isTyping={isTyping}
                                currentView={view}
                                agentState={agentState}
                                hasPlan={mediaPlan !== null}
                            />
                        </div>

                        {/* Resize Handle */}
                        <div
                            onMouseDown={handleMouseDown}
                            className={`bg-gray-200 hover:bg-purple-400 transition-colors ${isResizing ? 'bg-purple-500' : ''
                                } ${layout === 'BOTTOM' ? 'h-1 cursor-ns-resize w-full order-2' : 'w-1 cursor-ew-resize h-full order-2'
                                }`}
                            style={{ userSelect: 'none' }}
                        />

                        {/* Visualizer Panel */}
                        <div className={`flex-1 flex flex-col overflow-hidden relative bg-gray-50 ${layout === 'LEFT' ? 'order-3' :
                            layout === 'RIGHT' ? 'order-1' :
                                'order-1'
                            }`}>
                            <PlanVisualizer
                                mediaPlan={mediaPlan}
                                onGroupingChange={(mode) => {
                                    if (brainRef.current!.getContext().mediaPlan) {
                                        brainRef.current!.getContext().mediaPlan!.groupingMode = mode;
                                        setMediaPlan({ ...brainRef.current!.getContext().mediaPlan! });
                                    }
                                }}
                            />
                            <OnboardingHints state={agentState} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
