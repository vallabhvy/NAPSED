import React, { useEffect, useState } from 'react';
import { 
  Search, 
  CheckSquare, 
  Grid, 
  User, 
  Settings, 
  X,
  PlusCircle,
  Building2
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: string) => void;
  onToggleRole: () => void;
  currentRole: string;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onToggleRole,
  currentRole
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { id: 'feed', title: 'FEED SPECS & PRACTICE', category: 'MAIN PILLARS', shortcut: '⌘K → 1' },
    { id: 'audit', title: 'AUDIT HUB (REVIEW PEER CODE)', category: 'MAIN PILLARS', shortcut: '⌘K → 2' },
    { id: 'guilds', title: 'GUILD MATRIX & TRACKS', category: 'MAIN PILLARS', shortcut: '⌘K → 3' },
    { id: 'portfolio', title: 'PUBLIC PROOF PROFILE', category: 'MAIN PILLARS', shortcut: '⌘K → 4' },
    { id: 'spec-writer', title: '+ PUBLISH SPEC', category: 'QUICK ACTION', shortcut: '⌘K → W' },
    { id: 'recruiter', title: 'RECRUITER PROOF-OF-SKILL VIEW', category: 'HIRING PORTAL', shortcut: '⌘K → E' },
    { id: 'settings', title: 'ACCOUNT & PAT TOKENS', category: 'SETTINGS', shortcut: '⌘K → S' },
  ];

  const filteredCommands = commands.filter(c => 
    c.title.toLowerCase().includes(query.toLowerCase()) || 
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-theme-base/60 backdrop-blur-sm">
      <div 
        className="w-full max-w-xl rounded-none chassis-plate overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input Bar */}
        <div className="flex items-center px-4 py-3 border-b recessed-meter">
          <Search className="h-5 w-5 text-theme-ink mr-3" />
          <input 
            type="text"
            placeholder="TYPE A COMMAND OR SEARCH..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-theme-ink placeholder-[#1D1F23]/40 focus:outline-none uppercase font-medium tracking-wider"
            autoFocus
          />
          <button 
            onClick={onClose}
            className="rounded-none p-1 text-theme-ink hover:bg-theme-surface"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[#1D1F23]/20">
          {filteredCommands.length === 0 ? (
            <div className="p-6 text-center text-xs uppercase font-medium tracking-wider text-theme-ink">
              NO MATCHING COMMANDS FOUND.
            </div>
          ) : (
            filteredCommands.map((cmd) => {
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    onSelectTab(cmd.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-none text-left text-xs text-theme-ink hover:bg-theme-base transition group"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <span className="uppercase font-medium tracking-wider text-theme-ink">{cmd.title}</span>
                      <span className="ml-2 text-micro text-theme-ink/60 uppercase tracking-wider">{cmd.category}</span>
                    </div>
                  </div>

                  {cmd.shortcut && (
                    <kbd className="rounded-none bg-theme-base px-2 py-0.5 font-mono tabular-nums text-micro text-theme-ink border border-theme-ink">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-4 py-2 bg-theme-base border-t border-theme-ink text-micro uppercase font-medium tracking-wider text-theme-ink font-mono tabular-nums">
          <div className="flex items-center gap-2">
            <span>NAPSED PROTOCOL</span>
          </div>
          <div className="flex items-center gap-3 text-theme-ink/60">
            <span>ESC TO CLOSE</span>
            <span>↵ TO SELECT</span>
          </div>
        </div>

      </div>
    </div>
  );
};
