import React from 'react';
import { Code, CheckSquare, FileText, User, Building2, Settings } from 'lucide-react';

interface SubHeaderModeBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  category: 'studio' | 'identity';
}

export const SubHeaderModeBar: React.FC<SubHeaderModeBarProps> = ({
  currentTab,
  onSelectTab,
  category
}) => {
  if (category === 'studio') {
    const studioModes = [
      { id: 'challenge', label: '1. SOLVE MICRO-BUILD', icon: Code },
      { id: 'audit', label: '2. AUDIT PEER CODE', icon: CheckSquare },
      { id: 'spec-writer', label: '3. AUTHOR SPEC', icon: FileText },
    ];

    return (
      <div className="border-b chassis-plate px-4 py-2 text-xs font-mono">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-theme-ink uppercase tracking-wider text-micro font-medium">STUDIO WORKFLOW:</span>
            <div className="flex rounded-none bg-theme-base p-1 border border-theme-ink gap-1 font-sans">
              {studioModes.map((mode) => {
                const isActive = currentTab === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => onSelectTab(mode.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs uppercase font-medium tracking-wider rounded-none transition ${
                      isActive
                        ? 'bg-[#1D1F23] text-theme-base'
                        : 'text-theme-ink hover:bg-theme-surface'
                    }`}
                  >
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-micro uppercase tracking-wider font-medium text-theme-ink">
            <span>SOLVE → AUDIT → AUTHOR</span>
          </div>
        </div>
      </div>
    );
  }

  if (category === 'identity') {
    const identityModes = [
      { id: 'portfolio', label: 'BENCHMARK PROFILE', icon: User },
      { id: 'recruiter', label: 'RECRUITER PORTAL', icon: Building2 },
      { id: 'settings', label: 'ACCOUNT SETTINGS', icon: Settings },
    ];

    return (
      <div className="border-b chassis-plate px-4 py-2 text-xs font-mono">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-theme-ink uppercase tracking-wider text-micro font-medium">IDENTITY HUB:</span>
            <div className="flex rounded-none bg-theme-base p-1 border border-theme-ink gap-1 font-sans">
              {identityModes.map((mode) => {
                const isActive = currentTab === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => onSelectTab(mode.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs uppercase font-medium tracking-wider rounded-none transition ${
                      isActive
                        ? 'bg-[#1D1F23] text-theme-base'
                        : 'text-theme-ink hover:bg-theme-surface'
                    }`}
                  >
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-micro uppercase tracking-wider font-medium text-theme-ink">
            <span>VERIFIED IDENTITY ENGINE</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};
