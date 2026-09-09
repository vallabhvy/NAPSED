import React, { useState } from 'react';
import { 
  User, 
  Settings, 
  Key, 
  Bell, 
  Check, 
  Copy, 
  Save, 
  Terminal
} from 'lucide-react';
import type { UserProfile } from '../../types';


const GithubIcon = ({ className = "h-4 w-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
);

interface SettingsViewProps {
  user: UserProfile;
  onUpdateUser: (user: Partial<UserProfile>) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState<'general' | 'guilds' | 'notifications' | 'api'>('general');
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio);
  const [githubUrl, setGithubUrl] = useState(user.githubUrl);
  const [generatedPat, setGeneratedPat] = useState<string | null>(null);
  const [copiedPat, setCopiedPat] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({ name, bio, githubUrl });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleGeneratePAT = () => {
    const token = `devproof_pat_live_${Math.random().toString(36).substring(2)}_${Date.now()}`;
    setGeneratedPat(token);
  };

  const copyPAT = () => {
    if (generatedPat) {
      navigator.clipboard?.writeText?.(generatedPat);
      setCopiedPat(true);
      setTimeout(() => setCopiedPat(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-8 space-y-6 bg-theme-base text-theme-ink font-sans min-h-[calc(100vh-4rem)]">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-theme-ink tracking-tight uppercase">ACCOUNT & DEVELOPER SETTINGS</h1>
        <p className="text-xs text-theme-ink/60 mt-0.5 uppercase tracking-wider">MANAGE YOUR IDENTITY PROFILE, FOCUS TRACKS, NOTIFICATION TRIGGERS, AND API CREDENTIALS.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-theme-ink gap-0">
        {[
          { id: 'general' as const, label: 'GENERAL PROFILE' },
          { id: 'guilds' as const, label: 'GUILD TRACKS' },
          { id: 'notifications' as const, label: 'NOTIFICATIONS' },
          { id: 'api' as const, label: 'API & CLI TOKENS' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs uppercase font-medium tracking-wider border-b-2 transition ${
              activeTab === tab.id
                ? 'border-theme-ink text-theme-ink'
                : 'border-transparent text-theme-ink/50 hover:text-theme-ink'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab 1: General */}
      {activeTab === 'general' && (
        <form onSubmit={handleSave} className="rounded-none chassis-plate p-6 space-y-5">
          <div className="flex items-center gap-4 pb-4 border-b border-theme-ink">
            <img src={user.avatarUrl} alt={user.name} className="h-14 w-14 rounded-none object-cover border border-theme-ink" />
            <div>
<button type="button" className="rounded-none bg-theme-base px-3 py-1.5 text-xs uppercase font-medium tracking-wider text-theme-ink hover:tactile-btn-primary hover:text-theme-base ">
                CHANGE AVATAR
              </button>
              <p className="text-micro text-theme-ink/60 mt-1 font-mono uppercase tracking-wider">JPG, PNG OR GIF (MAX 2MB)</p>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase font-medium tracking-wider text-theme-ink mb-1">DISPLAY NAME</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-none recessed-meter px-3.5 py-2 text-xs text-theme-ink focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-medium tracking-wider text-theme-ink mb-1">DEVELOPER BIO / SUMMARY</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full rounded-none recessed-meter p-3 text-xs text-theme-ink focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs uppercase font-medium tracking-wider text-theme-ink mb-1">GITHUB PROFILE URL</label>
            <div className="relative">
              <GithubIcon className="absolute left-3 top-2.5 h-4 w-4 text-theme-ink" />
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="w-full rounded-none recessed-meter pl-9 pr-3.5 py-2 text-xs text-theme-ink focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            {savedSuccess && (
              <span className="text-xs font-mono uppercase tracking-wider text-theme-ink flex items-center gap-1">
                <Check className="h-4 w-4" /> PROFILE UPDATED SUCCESSFULLY!
              </span>
            )}
            <button
              type="submit"
className="ml-auto flex items-center gap-2 rounded-none tactile-btn-primary px-5 py-2 text-xs uppercase font-bold tracking-wider text-theme-base "
            >
              <Save className="h-4 w-4" />
              <span>SAVE CHANGES</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 4: API & Security */}
      {activeTab === 'api' && (
        <div className="rounded-none chassis-plate p-6 space-y-6">
          <div>
            <h2 className="text-sm font-bold text-theme-ink flex items-center gap-2 uppercase tracking-wider">
              <Key className="h-4 w-4 text-theme-ink" />
              <span>PERSONAL ACCESS TOKENS (PAT)</span>
            </h2>
            <p className="text-xs text-theme-ink/60 mt-1 uppercase tracking-wider">
              GENERATE API TOKENS TO AUTHENTICATE WITH THE NAPSED CLI.
            </p>
          </div>

          <div className="p-4 rounded-none recessed-meter">
            <button
              onClick={handleGeneratePAT}
className="flex items-center gap-2 rounded-none tactile-btn-primary px-4 py-2 text-xs uppercase font-bold tracking-wider text-theme-base "
            >
              <Terminal className="h-4 w-4" />
              <span>GENERATE NEW PAT</span>
            </button>

            {generatedPat && (
              <div className="mt-4 p-3 rounded-none chassis-plate space-y-2">
                <div className="text-micro font-mono uppercase tracking-wider text-theme-ink/60">COPY TOKEN NOW (WILL NOT BE SHOWN AGAIN):</div>
                <div className="flex items-center justify-between font-mono tabular-nums text-xs text-theme-ink bg-theme-base p-2 rounded-none border border-theme-ink">
                  <span>{generatedPat}</span>
                  <button onClick={copyPAT} className="p-1 text-theme-ink hover:bg-theme-surface">
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                {copiedPat && <span className="text-micro font-mono uppercase tracking-wider text-theme-ink">COPIED TO CLIPBOARD!</span>}
              </div>
            )}
          </div>

          {/* API Endpoints */}
          <div className="space-y-3 pt-4 border-t border-theme-ink font-mono tabular-nums text-xs">
            <h3 className="text-xs font-bold text-theme-ink uppercase tracking-wider font-sans">ACTIVE REST API CONTRACT ENDPOINTS</h3>
            <div className="space-y-2">
              <div className="p-2.5 rounded-none recessed-meter flex justify-between uppercase tracking-wider">
                <span className="text-theme-ink">POST /API/V1/AUTH/LOGIN</span>
                <span className="text-theme-ink/60">AUTH TOKEN EXCHANGE</span>
              </div>
              <div className="p-2.5 rounded-none recessed-meter flex justify-between uppercase tracking-wider">
                <span className="text-theme-ink">GET /API/V1/USERS/:USERNAME/PORTFOLIO</span>
                <span className="text-theme-ink/60">PUBLIC BENCHMARK IDENTITY</span>
              </div>
              <div className="p-2.5 rounded-none recessed-meter flex justify-between uppercase tracking-wider">
                <span className="text-theme-ink">POST /API/V1/SUBMISSIONS</span>
                <span className="text-theme-ink/60">UPLOAD SOLUTION + DEFENSE</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs 2 & 3 Fallback */}
      {(activeTab === 'guilds' || activeTab === 'notifications') && (
        <div className="rounded-none chassis-plate p-6 text-center text-xs uppercase tracking-wider text-theme-ink space-y-2">
          <div className="font-semibold text-theme-ink">GUILD TRACKS & NOTIFICATION PREFERENCES ACTIVE</div>
          <p>YOUR DAILY TARGET IS SET TO 30 MINS/DAY WITH INSTANT EMAIL NOTIFICATIONS FOR PEER AUDIT REVIEWS.</p>
        </div>
      )}

    </div>
  );
};
