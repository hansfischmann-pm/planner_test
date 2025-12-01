import React, { useEffect, useState } from 'react';
import { Command, Save, HelpCircle, X } from 'lucide-react';

interface GlobalShortcutsProps {
    onSave: () => void;
    onFocusChat: () => void;
}

export const GlobalShortcuts: React.FC<GlobalShortcutsProps> = ({ onSave, onFocusChat }) => {
    const [showHelp, setShowHelp] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            console.log('Key pressed:', e.key, 'Meta:', e.metaKey, 'Ctrl:', e.ctrlKey);
            // Ignore if typing in an input or textarea (except for specific commands like Cmd+S)
            const target = e.target as HTMLElement;
            const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

            // Cmd+K / Ctrl+K: Focus Chat
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                console.log('Triggering Focus Chat');
                e.preventDefault();
                onFocusChat();
            }

            // Cmd+S / Ctrl+S: Save
            if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                console.log('Triggering Save');
                e.preventDefault();
                onSave();
            }

            // ?: Show Help (only if not typing)
            if (e.key === '?' && !isInput) {
                console.log('Triggering Help');
                e.preventDefault();
                setShowHelp(prev => !prev);
            }

            // Esc: Close Help
            if (e.key === 'Escape' && showHelp) {
                setShowHelp(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onSave, onFocusChat, showHelp]);

    if (!showHelp) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowHelp(false)}>
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                            <Command className="w-5 h-5" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">Keyboard Shortcuts</h2>
                    </div>
                    <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    <ShortcutRow
                        keys={['⌘', 'K']}
                        description="Focus Agent Chat"
                        icon={<Command className="w-4 h-4" />}
                    />
                    <ShortcutRow
                        keys={['⌘', 'S']}
                        description="Save Media Plan"
                        icon={<Save className="w-4 h-4" />}
                    />
                    <ShortcutRow
                        keys={['?']}
                        description="Show this help"
                        icon={<HelpCircle className="w-4 h-4" />}
                    />
                    <ShortcutRow
                        keys={['Esc']}
                        description="Close modals / Clear selection"
                        icon={<X className="w-4 h-4" />}
                    />
                </div>

                <div className="mt-8 pt-4 border-t border-gray-100 text-center text-sm text-gray-500">
                    Press <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-700 font-mono text-xs mx-1">?</kbd> anytime to view this menu
                </div>
            </div>
        </div>
    );
};

const ShortcutRow = ({ keys, description, icon }: { keys: string[], description: string, icon: React.ReactNode }) => (
    <div className="flex items-center justify-between group">
        <div className="flex items-center gap-3 text-gray-700">
            <span className="text-gray-400 group-hover:text-purple-600 transition-colors">{icon}</span>
            <span className="font-medium">{description}</span>
        </div>
        <div className="flex gap-1">
            {keys.map((k, i) => (
                <kbd key={i} className="min-w-[24px] px-2 py-1 bg-gray-100 border border-gray-200 rounded text-xs font-mono text-gray-600 font-bold text-center">
                    {k}
                </kbd>
            ))}
        </div>
    </div>
);
