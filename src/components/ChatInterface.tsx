import React, { useState, useRef, useEffect } from 'react';
import { AgentMessage } from '../types';
import { Send, Sparkles } from 'lucide-react';

interface ChatInterfaceProps {
    messages: AgentMessage[];
    onSendMessage: (msg: string) => void;
    isTyping?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isTyping }) => {
    const [input, setInput] = useState('');
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        onSendMessage(input);
        setInput('');
    };

    return (
        <div className="flex flex-col h-full bg-white border-r border-gray-200 shadow-sm">
            <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Media Agent
                </h2>
                <p className="text-xs text-gray-500">AI-Powered Planning Assistant</p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user'
                                    ? 'bg-purple-600 text-white rounded-br-none'
                                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                }`}
                        >
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
                <div className="flex gap-2">
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
                        className="p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
