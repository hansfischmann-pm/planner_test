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
import { AgentMessage, MediaPlan, User, Brand, Campaign, Flight, UserType, LayoutPosition, Placement } from './types';
import {
    MOCK_DATA,
    SAMPLE_BRANDS,
    generateCampaign,
    generateFlight,
    generateId,
    calculateFlightForecast,
    calculateFlightDelivery,
    calculateCampaignForecast,
    calculateCampaignDelivery,
    calculatePlanMetrics
} from './logic/dummyData';

// Helper to recalculate metrics for a brand
const updateBrandMetrics = (brand: Brand): Brand => {
    const updatedCampaigns = brand.campaigns.map(campaign => {
        const updatedFlights = campaign.flights.map(flight => {
            // Recalculate flight metrics from lines
            return {
                ...flight,
                forecast: calculateFlightForecast(flight.lines),
                delivery: calculateFlightDelivery(flight.lines)
            };
        });

        // Recalculate campaign metrics from flights
        return {
            ...campaign,
            flights: updatedFlights,
            forecast: calculateCampaignForecast(updatedFlights),
            delivery: calculateCampaignDelivery(updatedFlights)
        };
    });

    return {
        ...brand,
        campaigns: updatedCampaigns
    };
};

import { generateMediaPlanPDF } from './utils/pdfGenerator';
import { generateMediaPlanPPT } from './utils/pptGenerator';
import { ArrowLeft } from 'lucide-react';

type ViewState = 'LOGIN' | 'CLIENT_SELECTION' | 'CAMPAIGN_LIST' | 'FLIGHT_LIST' | 'MEDIA_PLAN' | 'AGENCY_ANALYTICS';

function App() {
    // Mutable Data State
    const [brands, setBrands] = useState(() => {
        // Deep copy MOCK_DATA.brands to allow mutations
        return JSON.parse(JSON.stringify(MOCK_DATA.brands));
    });

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
            metrics: calculatePlanMetrics(flight.lines)
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

    const handleCreateCampaign = (name: string, budget?: number, startDate?: string, endDate?: string) => {
        if (!currentBrand) return;

        const campaignId = generateId();
        const today = new Date().toISOString().split('T')[0];
        const in90Days = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // Create new campaign with NO default flights
        const newCampaign: Campaign = {
            id: campaignId,
            name: name,
            brandId: currentBrand.id,
            advertiser: currentBrand.name,
            budget: budget || 100000,
            startDate: startDate || today,
            endDate: endDate || in90Days,
            goals: ['Brand Awareness'],
            flights: [], // Start with zero flights
            status: 'PLANNING',
            forecast: {
                impressions: 0,
                spend: 0,
                reach: 0,
                frequency: 0,
                source: 'Internal'
            },
            delivery: {
                actualImpressions: 0,
                actualSpend: 0,
                pacing: 0,
                status: 'ON_TRACK'
            },
            placements: [] // Legacy support
        };

        // Update brands state
        setBrands((prevBrands: Brand[]) => {
            return prevBrands.map((b: Brand) => {
                if (b.id === currentBrand.id) {
                    return {
                        ...b,
                        campaigns: [...(b as any).campaigns, newCampaign]
                    };
                }
                return b;
            });
        });

        // Select the new campaign and navigate to flight list
        setCurrentCampaign(newCampaign);
        setView('FLIGHT_LIST');
    };

    const handleCreateFlight = (name: string, budget?: number, startDate?: string, endDate?: string) => {
        if (!currentCampaign) return;

        // Calculate default budget (25% of campaign budget)
        const flightBudget = budget || Math.floor(currentCampaign.budget * 0.25);

        // Generate base flight
        const baseFlight = generateFlight(currentCampaign.id, name, flightBudget);

        // Override to start with zero lines and reset forecast/delivery
        const newFlight: Flight = {
            ...baseFlight,
            startDate: startDate || baseFlight.startDate,
            endDate: endDate || baseFlight.endDate,
            lines: [], // Start with zero lines
            status: 'DRAFT', // New flights start as draft
            forecast: {
                impressions: 0,
                spend: 0,
                reach: 0,
                frequency: 0,
                source: 'Internal'
            },
            delivery: {
                actualImpressions: 0,
                actualSpend: 0,
                pacing: 0,
                status: 'ON_TRACK'
            }
        };

        // Update brands state
        setBrands((prevBrands: Brand[]) => {
            return prevBrands.map((b: Brand) => {
                return {
                    ...b,
                    campaigns: (b as any).campaigns.map((c: Campaign) => {
                        if (c.id === currentCampaign.id) {
                            return {
                                ...c,
                                flights: [...c.flights, newFlight]
                            };
                        }
                        return c;
                    })
                };
            });
        });

        // Update current campaign reference
        setCurrentCampaign(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                flights: [...prev.flights, newFlight]
            };
        });

        // Select the new flight and navigate to media plan
        handleSelectFlight(newFlight);
    };

    const handleUpdatePlacement = (updatedPlacement: Placement) => {
        if (!currentBrand || !currentCampaign || !currentFlight) return;

        setBrands(prevBrands => {
            return prevBrands.map(b => {
                if (b.id === currentBrand.id) {
                    // Create a deep copy of the brand with the updated placement
                    const updatedBrand = {
                        ...b,
                        campaigns: (b as any).campaigns.map((c: Campaign) => {
                            if (c.id === currentCampaign.id) {
                                return {
                                    ...c,
                                    flights: c.flights.map(f => {
                                        if (f.id === currentFlight.id) {
                                            return {
                                                ...f,
                                                lines: f.lines.map(l => l.id === updatedPlacement.id ? updatedPlacement : l)
                                            };
                                        }
                                        return f;
                                    })
                                };
                            }
                            return c;
                        })
                    };

                    // Recalculate metrics
                    const finalBrand = updateBrandMetrics(updatedBrand);
                    return finalBrand;
                }
                return b;
            });
        });

        // Also update the mediaPlan state to refresh the cards immediately
        if (mediaPlan && mediaPlan.activeFlightId === currentFlight?.id) {
            const updatedPlacements = mediaPlan.campaign.placements?.map(p =>
                p.id === updatedPlacement.id ? updatedPlacement : p
            ) || [];

            const newMetrics = calculatePlanMetrics(updatedPlacements);

            const newMediaPlan = {
                ...mediaPlan,
                campaign: {
                    ...mediaPlan.campaign,
                    placements: updatedPlacements
                },
                metrics: newMetrics,
                totalSpend: updatedPlacements.reduce((sum, line) => sum + line.totalCost, 0),
                remainingBudget: (currentFlight?.budget || 0) - updatedPlacements.reduce((sum, line) => sum + line.totalCost, 0)
            };
            setMediaPlan(newMediaPlan);

            // SYNC BRAIN CONTEXT
            if (brainRef.current) {
                const ctx = brainRef.current.getContext();
                if (ctx.mediaPlan && ctx.mediaPlan.id === mediaPlan.id) {
                    ctx.mediaPlan = newMediaPlan;
                }
            }
        }

        // Also update currentFlight to reflect the change
        if (currentFlight) {
            setCurrentFlight({
                ...currentFlight,
                lines: currentFlight.lines.map(l => l.id === updatedPlacement.id ? updatedPlacement : l)
            });
        }
    };

    const handleDeletePlacement = (placementId: string) => {
        if (!currentBrand || !currentCampaign || !currentFlight) {
            return;
        }

        // 1. Update Brands State (Source of Truth)
        setBrands(prevBrands => {
            return prevBrands.map(b => {
                if (b.id === currentBrand.id) {
                    const updatedBrand = {
                        ...b,
                        campaigns: (b as any).campaigns.map((c: Campaign) => {
                            if (c.id === currentCampaign.id) {
                                return {
                                    ...c,
                                    flights: c.flights.map(f => {
                                        if (f.id === currentFlight.id) {
                                            return {
                                                ...f,
                                                lines: f.lines.filter(l => l.id !== placementId)
                                            };
                                        }
                                        return f;
                                    })
                                };
                            }
                            return c;
                        })
                    };
                    return updateBrandMetrics(updatedBrand);
                }
                return b;
            });
        });

        // 2. Update Current Flight State
        setCurrentFlight(prev => {
            if (!prev) return null;
            const newLines = prev.lines.filter(l => l.id !== placementId);
            return {
                ...prev,
                lines: newLines
            };
        });

        // 3. Update Media Plan State (Visualizer)
        if (mediaPlan && mediaPlan.activeFlightId === currentFlight.id) {
            const updatedPlacements = mediaPlan.campaign.placements?.filter(p => p.id !== placementId) || [];

            const newMetrics = calculatePlanMetrics(updatedPlacements);

            const newMediaPlan = {
                ...mediaPlan,
                campaign: {
                    ...mediaPlan.campaign,
                    placements: updatedPlacements
                },
                metrics: newMetrics,
                totalSpend: updatedPlacements.reduce((sum, line) => sum + line.totalCost, 0),
                remainingBudget: (currentFlight.budget || 0) - updatedPlacements.reduce((sum, line) => sum + line.totalCost, 0),
                version: (mediaPlan.version || 0) + 1 // Force update
            };

            setMediaPlan(newMediaPlan);

            // SYNC BRAIN CONTEXT
            if (brainRef.current) {
                const ctx = brainRef.current.getContext();
                if (ctx.mediaPlan && ctx.mediaPlan.id === mediaPlan.id) {
                    ctx.mediaPlan = newMediaPlan;
                }
            }
        }
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
        const action = agentResponse.action as any;
        if (action) {
            if (action === 'EXPORT_PDF' && ctx.mediaPlan) {
                generateMediaPlanPDF(ctx.mediaPlan);
            } else if (action === 'EXPORT_PPT' && ctx.mediaPlan) {
                generateMediaPlanPPT(ctx.mediaPlan);
            } else if (typeof action === 'string' && action.startsWith('LAYOUT_')) {
                // Handle layout changes from conversational commands
                const newLayout = action.replace('LAYOUT_', '') as LayoutPosition;
                handleLayoutChange(newLayout);
            } else if (typeof action === 'object') {
                // Handle complex actions
                if (action.type === 'CREATE_CAMPAIGN') {
                    handleCreateCampaign(action.payload.name);
                } else if (action.type === 'CREATE_FLIGHT') {
                    handleCreateFlight(action.payload.name);
                }
            }
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
                        <CampaignList
                            campaigns={brands.find((b: Brand) => b.id === currentBrand.id)?.campaigns || []}
                            onSelectCampaign={handleSelectCampaign}
                            onCreateCampaign={handleCreateCampaign}
                        />
                    </div>
                )}

                {view === 'FLIGHT_LIST' && currentCampaign && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-full overflow-y-auto">
                        <FlightList
                            flights={currentCampaign.flights}
                            onSelectFlight={handleSelectFlight}
                            onBack={() => setView('CAMPAIGN_LIST')}
                            onCreateFlight={handleCreateFlight}
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
                                layout={layout}
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
                                onUpdatePlacement={handleUpdatePlacement}
                                onDeletePlacement={handleDeletePlacement}
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
