import React, { useState, useEffect, useRef } from 'react';
import { ChatInterface } from './components/ChatInterface';
import { PlanVisualizer } from './components/PlanVisualizer';
import { OnboardingHints } from './components/OnboardingHints';
import { AgentBrain, AgentState } from './logic/agentBrain';
import { AgentMessage, MediaPlan } from './types';

import { generateMediaPlanPDF } from './utils/pdfGenerator';

function App() {
    // We use a ref for the brain so it persists across renders without triggering them
    const brainRef = useRef<AgentBrain>(new AgentBrain());

    const [messages, setMessages] = useState<AgentMessage[]>([]);
    const [mediaPlan, setMediaPlan] = useState<MediaPlan | null>(null);
    const [agentState, setAgentState] = useState<AgentState>('INIT');
    const [isTyping, setIsTyping] = useState(false);

    // Initialize state from brain
    useEffect(() => {
        const ctx = brainRef.current.getContext();
        setMessages([...ctx.history]);
        setMediaPlan(ctx.mediaPlan);
        setAgentState(ctx.state);
    }, []);

    const handleSendMessage = async (text: string) => {
        // 1. Add user message immediately
        const userMsg: AgentMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: text,
            timestamp: Date.now()
        };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        // 2. Simulate network delay for "thinking"
        setTimeout(() => {
            const response = brainRef.current.processInput(text);
            const ctx = brainRef.current.getContext();

            setMessages([...ctx.history]);
            setMediaPlan(ctx.mediaPlan ? { ...ctx.mediaPlan } : null); // Force new reference
            setAgentState(ctx.state);
            setIsTyping(false);

            // Handle Side Effects (Actions)
            if (response.action === 'EXPORT_PDF' && ctx.mediaPlan) {
                generateMediaPlanPDF(ctx.mediaPlan);
            }
        }, 1000);
    };

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden font-sans text-gray-900">
            {/* Left Panel: Chat (30%) */}
            <div className="w-[400px] flex-shrink-0 h-full z-10 relative">
                <ChatInterface
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isTyping={isTyping}
                />
            </div>

            {/* Right Panel: Visualizer (70%) */}
            <div className="flex-1 h-full relative">
                <PlanVisualizer mediaPlan={mediaPlan} />

                {/* Game Theory Hints Overlay */}
                <OnboardingHints state={agentState} />
            </div>
        </div>
    );
}

export default App;
