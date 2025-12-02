import React, { useState, useEffect, useRef } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { PlanVisualizer } from './components/PlanVisualizer';
import { OnboardingHints } from './components/OnboardingHints';
import { LoginScreen } from './components/LoginScreen';
import { ClientSelectionDashboard } from './components/ClientSelectionDashboard';
import { LayoutControls } from './components/LayoutControls';
import { CampaignList } from './components/CampaignList';
import { FlightList } from './components/FlightList';
import { AgencyAnalyticsDashboard } from './components/AgencyAnalyticsDashboard';
import { IntegrationDashboard } from './components/IntegrationDashboard';
import { GlobalShortcuts } from './components/GlobalShortcuts';

import { AgentBrain, AgentState } from './logic/agentBrain';
import { AgentMessage, MediaPlan, User, Brand, Campaign, Flight, LayoutPosition, Placement } from './types';
import { generateLargeScaleData } from './data/largeScaleData';
import {
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
import { Layout, LogOut, PieChart, Settings, Users, Moon, Sun, BarChart2, ChevronLeft, ChevronRight } from 'lucide-react';

type ViewState = 'LOGIN' | 'CLIENT_SELECTION' | 'CAMPAIGN_LIST' | 'FLIGHT_LIST' | 'MEDIA_PLAN' | 'AGENCY_ANALYTICS' | 'INTEGRATIONS';

function App() {
    // Mutable Data State
    const [brands, setBrands] = useState(() => {
        // Use large scale data generator
        return generateLargeScaleData();
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

    // Theme State
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    // Sync current brand with AgentBrain
    useEffect(() => {
        if (brainRef.current) {
            brainRef.current.setBrand(currentBrand);
        }
    }, [currentBrand]);

    // Sidebar State
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        const saved = localStorage.getItem('fuseiq-sidebar-collapsed');
        return saved ? JSON.parse(saved) : true; // Default to collapsed
    });

    // Persist sidebar state
    const toggleSidebar = () => {
        const newState = !sidebarCollapsed;
        setSidebarCollapsed(newState);
        localStorage.setItem('fuseiq-sidebar-collapsed', JSON.stringify(newState));
    };

    // Logout handler
    const handleLogout = () => {
        setCurrentUser(null);
        setCurrentBrand(null);
        setCurrentCampaign(null);
        setCurrentFlight(null);
        setMediaPlan(null);
        setMessages([]);
        setView('LOGIN');
    };

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
    const [resizeStartPos, setResizeStartPos] = useState({ x: 0, y: 0, size: 0 });

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        // Capture the starting position and current size
        setResizeStartPos({
            x: e.clientX,
            y: e.clientY,
            size: chatSize
        });
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;

            let newSize: number;
            if (layout === 'LEFT') {
                // Calculate delta from start position
                const delta = e.clientX - resizeStartPos.x;
                newSize = Math.max(250, Math.min(800, resizeStartPos.size + delta));
            } else if (layout === 'RIGHT') {
                // For RIGHT layout, calculate from the right edge
                const delta = resizeStartPos.x - e.clientX;
                newSize = Math.max(250, Math.min(800, resizeStartPos.size + delta));
            } else { // BOTTOM
                const delta = resizeStartPos.y - e.clientY;
                newSize = Math.max(200, Math.min(600, resizeStartPos.size + delta));
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
            // For brand user, find their brand from the brands state
            const brand = brands.find(b => b.id === user.brandId);
            if (brand) {
                setCurrentBrand(brand);
                setView('CAMPAIGN_LIST');
            }
        }
    };

    const handleSelectBrand = (brand: Brand) => {
        // Find the brand from the current brands state to get the latest data
        const currentBrandData = brands.find(b => b.id === brand.id) || brand;
        setCurrentBrand(currentBrandData);
        setView('CAMPAIGN_LIST');
    };

    const handleSelectCampaign = (campaign: Campaign) => {
        setCurrentCampaign(campaign);
        setView('FLIGHT_LIST');
    };

    const handleSelectFlight = (flight: Flight) => {
        setCurrentFlight(flight);

        // Create initial media plan from flight
        const initialPlan: MediaPlan = {
            id: generateId(),
            campaign: currentCampaign!,
            totalSpend: flight.lines.reduce((sum, line) => sum + line.totalCost, 0),
            remainingBudget: flight.budget - flight.lines.reduce((sum, line) => sum + line.totalCost, 0),
            version: 1,
            groupingMode: 'DETAILED',
            strategy: 'BALANCED',
            metrics: calculatePlanMetrics(flight.lines)
        };

        // Don't reset the brain - preserve existing state and history
        // Just update the media plan in the existing brain
        if (brainRef.current) {
            const ctx = brainRef.current.getContext();
            ctx.mediaPlan = initialPlan;
            ctx.mediaPlan.campaign.placements = flight.lines; // Legacy support for brain logic
        }

        setMediaPlan(initialPlan);
        setMessages([{
            id: 'init',
            role: 'agent',
            content: `I've loaded the **${flight.name}** flight. You have ${flight.lines.length} placements totaling **$${flight.budget.toLocaleString()}**. How can I help optimize this plan?`,
            timestamp: Date.now(),
            suggestedActions: ['Show performance', 'Optimize plan', 'Add placement']
        }]);
        setAgentState('REFINEMENT' as AgentState);
        setView('MEDIA_PLAN');
    };





    const handleUpdateBrand = (updatedBrand: Brand) => {
        setBrands(prevBrands => prevBrands.map(b => b.id === updatedBrand.id ? updatedBrand : b));
    };

    const handleCreateCampaign = (name: string, budget: number, startDate: string, endDate: string, goals: string[]) => {
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
            status: 'DRAFT',
            tags: [],
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
            const updatedBrands = prevBrands.map((b: Brand) => {
                if (b.id === currentBrand.id) {
                    const updatedBrand = {
                        ...b,
                        campaigns: [...(b as any).campaigns, newCampaign]
                    };
                    // Update currentBrand to reflect the new campaign
                    setCurrentBrand(updatedBrand);
                    return updatedBrand;
                }
                return b;
            });
            return updatedBrands;
        });

        // Select the new campaign and navigate to flight list
        setCurrentCampaign(newCampaign);
        setView('FLIGHT_LIST');
    };

    const handleCreateCampaignFromTemplate = (campaign: Campaign) => {
        if (!currentBrand) return;

        // Update brands state with the new campaign from template
        setBrands((prevBrands: Brand[]) => {
            const updatedBrands = prevBrands.map((b: Brand) => {
                if (b.id === currentBrand.id) {
                    const updatedBrand = {
                        ...b,
                        campaigns: [...(b as any).campaigns, campaign]
                    };
                    // Update currentBrand to reflect the new campaign
                    setCurrentBrand(updatedBrand);
                    return updatedBrand;
                }
                return b;
            });
            return updatedBrands;
        });

        // Select the new campaign and navigate to flight list
        setCurrentCampaign(campaign);
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
            tags: [],
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

    const handleActivateFlight = (flightId: string) => {
        if (!currentBrand || !currentCampaign) return;

        // Update brands state
        setBrands(prevBrands => {
            return prevBrands.map(b => {
                if (b.id === currentBrand.id) {
                    return {
                        ...b,
                        campaigns: (b as any).campaigns.map((c: Campaign) => {
                            if (c.id === currentCampaign.id) {
                                return {
                                    ...c,
                                    flights: c.flights.map(f => {
                                        if (f.id === flightId) {
                                            return { ...f, status: 'ACTIVE' };
                                        }
                                        return f;
                                    })
                                };
                            }
                            return c;
                        })
                    };
                }
                return b;
            });
        });

        // Update current campaign reference
        setCurrentCampaign(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                flights: prev.flights.map(f => {
                    if (f.id === flightId) {
                        return { ...f, status: 'ACTIVE' };
                    }
                    return f;
                })
            };
        });
    };

    const handlePauseFlight = (flightId: string) => {
        if (!currentBrand || !currentCampaign) return;

        // Update brands state
        setBrands(prevBrands => {
            return prevBrands.map(b => {
                if (b.id === currentBrand.id) {
                    return {
                        ...b,
                        campaigns: (b as any).campaigns.map((c: Campaign) => {
                            if (c.id === currentCampaign.id) {
                                return {
                                    ...c,
                                    flights: c.flights.map(f => {
                                        if (f.id === flightId) {
                                            return { ...f, status: 'DRAFT' };
                                        }
                                        return f;
                                    })
                                };
                            }
                            return c;
                        })
                    };
                }
                return b;
            });
        });

        // Update current campaign reference
        setCurrentCampaign(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                flights: prev.flights.map(f => {
                    if (f.id === flightId) {
                        return { ...f, status: 'DRAFT' };
                    }
                    return f;
                })
            };
        });
    };

    const handleAddFlightFromTemplate = (flight: Flight) => {
        if (!currentBrand || !currentCampaign) return;

        // Update brands state
        setBrands(prevBrands => {
            return prevBrands.map(b => {
                if (b.id === currentBrand.id) {
                    return {
                        ...b,
                        campaigns: (b as any).campaigns.map((c: Campaign) => {
                            if (c.id === currentCampaign.id) {
                                return {
                                    ...c,
                                    flights: [...c.flights, flight]
                                };
                            }
                            return c;
                        })
                    };
                }
                return b;
            });
        });

        // Update current campaign reference
        setCurrentCampaign(prev => {
            if (!prev) return prev;
            return {
                ...prev,
                flights: [...prev.flights, flight]
            };
        });

        // Select the new flight
        handleSelectFlight(flight);
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

    // Sync media plan to brain whenever it changes
    // (Force reload for AgentBrain updates)
    useEffect(() => {
        if (brainRef.current) {
            brainRef.current.setMediaPlan(mediaPlan);
        }
    }, [mediaPlan]);

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

        // Handle explicit plan updates from agent (e.g. goal setting)
        if (agentResponse.updatedMediaPlan) {
            setMediaPlan(agentResponse.updatedMediaPlan);
            // Also update the brain's context immediately to keep in sync
            brainRef.current.setMediaPlan(agentResponse.updatedMediaPlan);
        } else {
            // Otherwise sync from context if available
            setMediaPlan(ctx.mediaPlan ? { ...ctx.mediaPlan } : null);
        }

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
                brands={brands}
                onSelectBrand={handleSelectBrand}
                onUpdateBrand={handleUpdateBrand}
                onViewAnalytics={() => setView('AGENCY_ANALYTICS')}
                onViewIntegrations={() => setView('INTEGRATIONS')}
            />
        );
    }

    if (view === 'AGENCY_ANALYTICS') {
        return (
            <AgencyAnalyticsDashboard
                brands={brands}
                onBack={() => setView('CLIENT_SELECTION')}
            />
        );
    }

    if (view === 'INTEGRATIONS') {
        return (
            <IntegrationDashboard
                onBack={() => setView('CLIENT_SELECTION')}
            />
        );
    }

    // Common Layout for Campaign/Flight/Plan views
    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            {/* Sidebar */}
            <div className={`${sidebarCollapsed ? 'w-16' : 'w-64'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0 transition-all duration-200`}>
                <div className={`p-4 border-b border-gray-200 dark:border-gray-700 flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} gap-2`}>
                    {!sidebarCollapsed && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                                <Layout className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-gray-900 dark:text-white">FuseIQ</span>
                        </div>
                    )}
                    <button
                        onClick={toggleSidebar}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0"
                        title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {sidebarCollapsed ? <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" /> : <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <div className="mb-6">
                        {!sidebarCollapsed && (
                            <div className="px-2 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Campaigns
                            </div>
                        )}
                        {currentBrand?.campaigns.map((campaign) => (
                            <button
                                key={campaign.id}
                                onClick={() => {
                                    setCurrentCampaign(campaign);
                                    setView('FLIGHT_LIST');
                                }}
                                className={`w-full flex items-center gap-2 px-2 py-2 text-sm font-medium rounded-lg transition-colors ${currentCampaign?.id === campaign.id && view !== 'CAMPAIGN_LIST'
                                    ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                    }`}
                                title={sidebarCollapsed ? campaign.name : undefined}
                            >
                                <PieChart className="w-4 h-4 flex-shrink-0" />
                                {!sidebarCollapsed && <span className="truncate">{campaign.name}</span>}
                            </button>
                        ))}
                        <button
                            onClick={() => setView('CAMPAIGN_LIST')}
                            className={`w-full flex items-center gap-2 px-2 py-2 text-sm font-medium rounded-lg transition-colors ${view === 'CAMPAIGN_LIST'
                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            title={sidebarCollapsed ? 'All Campaigns' : undefined}
                        >
                            <Layout className="w-4 h-4 flex-shrink-0" />
                            {!sidebarCollapsed && 'All Campaigns'}
                        </button>
                    </div>

                    <div>
                        {!sidebarCollapsed && (
                            <div className="px-2 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                Agency
                            </div>
                        )}
                        <button
                            onClick={() => setView('AGENCY_ANALYTICS')}
                            className={`w-full flex items-center gap-2 px-2 py-2 text-sm font-medium rounded-lg transition-colors ${view === 'AGENCY_ANALYTICS'
                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300'
                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                                }`}
                            title={sidebarCollapsed ? 'Analytics' : undefined}
                        >
                            <BarChart2 className="w-4 h-4 flex-shrink-0" />
                            {!sidebarCollapsed && 'Analytics'}
                        </button>
                        <button
                            onClick={() => alert('Team management coming soon!')}
                            className="w-full flex items-center gap-2 px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title={sidebarCollapsed ? 'Team' : undefined}
                        >
                            <Users className="w-4 h-4 flex-shrink-0" />
                            {!sidebarCollapsed && 'Team'}
                        </button>
                        <button
                            onClick={() => alert('Settings coming soon!')}
                            className="w-full flex items-center gap-2 px-2 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title={sidebarCollapsed ? 'Settings' : undefined}
                        >
                            <Settings className="w-4 h-4 flex-shrink-0" />
                            {!sidebarCollapsed && 'Settings'}
                        </button>
                    </div>
                </nav>

                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-2 px-2 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title={sidebarCollapsed ? (theme === 'light' ? 'Dark Mode' : 'Light Mode') : undefined}
                    >
                        {theme === 'light' ? (
                            <>
                                <Moon className="w-4 h-4 flex-shrink-0" />
                                {!sidebarCollapsed && 'Dark Mode'}
                            </>
                        ) : (
                            <>
                                <Sun className="w-4 h-4 flex-shrink-0" />
                                {!sidebarCollapsed && 'Light Mode'}
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 transition-colors duration-200">
                {/* Header */}
                <header className="h-16 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex items-center justify-between px-6 flex-shrink-0 transition-colors duration-200">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {view === 'CAMPAIGN_LIST' && 'Campaigns'}
                            {view === 'FLIGHT_LIST' && currentCampaign?.name}
                            {view === 'MEDIA_PLAN' && (
                                <div className="flex items-center gap-2">
                                    <span className="text-gray-500 dark:text-gray-400 font-normal cursor-pointer hover:text-purple-600" onClick={() => setView('FLIGHT_LIST')}>
                                        {currentCampaign?.name}
                                    </span>
                                    <span className="text-gray-300 dark:text-gray-600">/</span>
                                    <span>{currentFlight?.name}</span>
                                </div>
                            )}
                            {view === 'AGENCY_ANALYTICS' && 'Agency Analytics'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Layout Controls - only show in media plan view */}
                        {view === 'MEDIA_PLAN' && (
                            <LayoutControls currentLayout={layout} onLayoutChange={handleLayoutChange} />
                        )}
                        <div className="flex flex-col items-end">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{currentUser?.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{currentUser?.type === 'AGENCY' ? 'Agency Admin' : 'Brand Manager'}</span>
                        </div>
                        <img src={currentUser?.avatarUrl} alt="" className="h-8 w-8 rounded-full bg-gray-200" />
                        <button
                            onClick={handleLogout}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
                        </button>
                    </div>
                </header>

                {/* View Content */}
                {view === 'CAMPAIGN_LIST' && (
                    <CampaignList
                        campaigns={currentBrand?.campaigns || []}
                        onSelectCampaign={handleSelectCampaign}
                        onCreateCampaign={handleCreateCampaign}
                        onCreateFromTemplate={handleCreateCampaignFromTemplate}
                        brandId={currentBrand?.id}
                        brandName={currentBrand?.name}
                    />
                )}

                {view === 'FLIGHT_LIST' && currentCampaign && (
                    <FlightList
                        flights={currentCampaign.flights}
                        onSelectFlight={handleSelectFlight}
                        onBack={() => setView('CAMPAIGN_LIST')}
                        onCreateFlight={handleCreateFlight}
                        onActivateFlight={handleActivateFlight}
                        onPauseFlight={handlePauseFlight}
                        onAddFlightFromTemplate={handleAddFlightFromTemplate}
                        brandId={currentBrand?.id || ''}
                        brandName={currentBrand?.name || ''}
                    />
                )}

                {view === 'MEDIA_PLAN' && (
                    <div className={`h-full flex ${layout === 'BOTTOM' ? 'flex-col' : 'flex-row'}`}>
                        {/* Chat Panel */}
                        <div
                            className={`bg-white dark:bg-gray-800 flex flex-col border-gray-200 dark:border-gray-700 transition-colors duration-200 ${layout === 'BOTTOM'
                                ? 'border-t order-3'
                                : layout === 'RIGHT'
                                    ? 'border-l order-3'
                                    : 'border-r order-1'
                                }`}
                            style={{
                                width: layout === 'BOTTOM' ? '100%' : `${chatSize}px`,
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
                            className={`bg-gray-200 dark:bg-gray-700 hover:bg-purple-400 transition-colors ${isResizing ? 'bg-purple-500' : ''
                                } ${layout === 'BOTTOM'
                                    ? 'h-1 cursor-ns-resize w-full order-2'
                                    : layout === 'RIGHT'
                                        ? 'w-1 cursor-ew-resize h-full order-2'
                                        : 'w-1 cursor-ew-resize h-full order-2'
                                }`}
                            style={{ userSelect: 'none' }}
                        />

                        {/* Visualizer Panel */}
                        <div className={`flex-1 flex flex-col overflow-hidden relative bg-gray-50 dark:bg-gray-900 transition-colors duration-200 ${layout === 'BOTTOM' ? 'order-1' : layout === 'RIGHT' ? 'order-1' : 'order-3'
                            }`}>
                            <GlobalShortcuts
                                onSave={() => {
                                    // Simulate save
                                    const toast = document.createElement('div');
                                    toast.className = 'fixed bottom-4 right-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-lg shadow-lg z-50 animate-in fade-in slide-in-from-bottom-4';
                                    toast.innerHTML = '<div class="flex items-center gap-2"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Plan Saved Successfully</div>';
                                    document.body.appendChild(toast);
                                    setTimeout(() => toast.remove(), 3000);
                                }}
                                onFocusChat={() => {
                                    // Dispatch custom event that ChatInterface listens to
                                    window.dispatchEvent(new CustomEvent('focus-chat'));
                                }}
                            />
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
