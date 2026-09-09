import React, { useState } from 'react';
import type { DomainTrack } from '../../types';
import { ArrowRight, Check } from 'lucide-react';

interface OnboardingViewProps {
  onComplete: () => void;
}

export const OnboardingView: React.FC<OnboardingViewProps> = ({ onComplete }) => {
  const [selectedGuilds, setSelectedGuilds] = useState<DomainTrack[]>(['DEVOPS', 'BACKEND']);
  const [dailyMinutes, setDailyMinutes] = useState(30);

  const toggleGuild = (guild: DomainTrack) => {
    if (selectedGuilds.includes(guild)) {
      setSelectedGuilds(selectedGuilds.filter(g => g !== guild));
    } else {
      setSelectedGuilds([...selectedGuilds, guild]);
    }
  };

  const guilds = [
    { id: 'DEVOPS' as DomainTrack, title: 'DEVOPS & PLATFORM ENGINEERING', desc: 'IaC (Terraform, Pulumi), K8s Controllers, CI/CD Pipeline resilience' },
    { id: 'BACKEND' as DomainTrack, title: 'DISTRIBUTED SYSTEMS & BACKEND', desc: 'Concurrency, Redis Locks, Async I/O, Circuit Breakers' },
    { id: 'SECURITY' as DomainTrack, title: 'CLOUD SECURITY & SECOPS', desc: 'JWT rotation, mTLS, Secrets Vault management, Auth Defense' },
    { id: 'FRONTEND_PERF' as DomainTrack, title: 'FRONTEND PERFORMANCE & ARCH', desc: 'Web Vitals, Virtualization, State machines, Module Federation' },
  ];

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 bg-transparent text-theme-ink">
      <div className="rounded-none chassis-plate p-8">
        
        <div className="mb-8 border-b border-theme-ink pb-6">
          <span className="rounded-none bg-theme-base px-2.5 py-1 text-micro font-mono font-medium text-theme-ink border border-theme-ink uppercase tracking-wider">
            STEP 1 OF 2 — IDENTITY CONFIGURATION
          </span>
          <h2 className="text-2xl font-bold text-theme-ink tracking-tight mt-2 uppercase">SELECT YOUR FOCUS GUILD TRACKS</h2>
          <p className="text-xs text-theme-ink mt-1">
            Choose the specialized domains you want to build proof-of-work badges and conduct peer audits in.
          </p>
        </div>

        {/* Guild Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {guilds.map((g) => {
            const isSelected = selectedGuilds.includes(g.id);
            return (
              <button
                key={g.id}
                onClick={() => toggleGuild(g.id)}
                className={`relative flex items-start gap-3 p-4 rounded-none border text-left transition ${
                  isSelected
                    ? 'recessed-meter text-theme-ink'
                    : 'border-theme-ink/40 bg-theme-surface text-theme-ink/70 hover:border-theme-ink'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs uppercase tracking-wider text-theme-ink">{g.title}</span>
                    {isSelected && <Check className="h-4 w-4 text-theme-ink" />}
                  </div>
                  <p className="text-micro text-theme-ink/70 mt-1 leading-snug">{g.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Daily Target Slider */}
        <div className="mb-8 border-t border-theme-ink pt-6">
          <label className="block text-xs font-semibold uppercase tracking-wider text-theme-ink mb-2">
            DAILY ACTIVE PRACTICE TARGET: <span className="font-mono tabular-nums">{dailyMinutes} MINS/DAY</span>
          </label>
          <input
            type="range"
            min={15}
            max={60}
            step={15}
            value={dailyMinutes}
            onChange={(e) => setDailyMinutes(Number(e.target.value))}
            className="w-full h-2 bg-theme-base rounded-none appearance-none cursor-pointer accent-theme-ink"
          />
          <div className="flex justify-between text-micro text-theme-ink/60 font-mono tabular-nums uppercase tracking-wider mt-1">
            <span>15 MIN (LIGHT)</span>
            <span>30 MIN (RECOMMENDED)</span>
            <span>60 MIN (INTENSIVE)</span>
          </div>
        </div>

        <button
          onClick={onComplete}
className="w-full flex items-center justify-center gap-2 rounded-none tactile-btn-primary py-3 text-xs uppercase font-bold tracking-wider text-theme-base "
        >
          <span>CONFIRM & ENTER FEED</span>
          <ArrowRight className="h-4 w-4" />
        </button>

      </div>
    </div>
  );
};
