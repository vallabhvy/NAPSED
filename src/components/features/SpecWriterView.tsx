import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Send, 
  ShieldCheck, 
  Code, 
  ChevronLeft,
  BookOpen
} from 'lucide-react';
import type { DomainTrack } from '../../types';
import { VSCodeEditor } from '../ui/VSCodeEditor';
import { useKeyboardShortcut } from '../../hooks/useKeyboardShortcut';

interface SpecWriterViewProps {
  onPublishSpec: (data: any) => void;
  onBack?: () => void;
}

export const SpecWriterView: React.FC<SpecWriterViewProps> = ({ onPublishSpec, onBack }) => {
  const [postType, setPostType] = useState<'SPEC' | 'TIP'>('SPEC');

  // Spec Mode State
  const [title, setTitle] = useState('');
  const [track, setTrack] = useState<DomainTrack>('DISTRIBUTED_SYSTEMS');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'>('HARD');
  const [context, setContext] = useState('');
  
  const [constraints, setConstraints] = useState<string[]>([]);
  const [newConstraint, setNewConstraint] = useState('');



  const [initialCode, setInitialCode] = useState('');

  // Tip Mode State
  const [tipTitle, setTipTitle] = useState('');
  const [tipSummary, setTipSummary] = useState('');
  const [tipCode, setTipCode] = useState('');

  useKeyboardShortcut({ key: 'Escape' }, (e) => {
    e.preventDefault();
    if (onBack) onBack();
  });

  useKeyboardShortcut({ key: 'Enter', metaKey: true }, (e) => {
    e.preventDefault();
    // Only submit if required fields are present
    if (postType === 'SPEC' && (!title || !context)) return;
    if (postType === 'TIP' && (!tipTitle || !tipSummary)) return;
    handleSubmit(e as unknown as React.FormEvent);
  });

  useKeyboardShortcut({ key: '1', metaKey: true }, (e) => {
    e.preventDefault();
    setPostType('SPEC');
  });

  useKeyboardShortcut({ key: '2', metaKey: true }, (e) => {
    e.preventDefault();
    setPostType('TIP');
  });

  const handleAddConstraint = () => {
    if (!newConstraint.trim()) return;
    setConstraints([...constraints, newConstraint.trim()]);
    setNewConstraint('');
  };

  const handleRemoveConstraint = (idx: number) => {
    setConstraints(constraints.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (postType === 'SPEC') {
      onPublishSpec({
        type: 'SPEC',
        title,
        track,
        difficulty,
        context,
        constraints,

        initialCode
      });
    } else {
      onPublishSpec({
        type: 'TIP',
        title: tipTitle,
        track, // using same track selector conceptually, or hardcoding
        summary: tipSummary,
        codeSnippet: tipCode
      });
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8 font-sans bg-transparent text-theme-ink min-h-[calc(100vh-4rem)]">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b chassis-plate p-6 gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              title="Go back (Esc)"
              className="p-1.5 rounded-none border border-transparent text-theme-ink hover:border-theme-ink transition"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-theme-ink tracking-tight uppercase">COMMUNITY SPEC & TEACHING STUDIO</h1>
            <p className="text-micro font-mono text-theme-ink/60 mt-0.5 uppercase tracking-wider">AUTHOR REAL-WORLD MICRO-ARCHITECTURAL CHALLENGES OR REVERSE-TEACHING BREAKDOWNS.</p>
          </div>
        </div>

        {/* Mode Selector Toggle */}
        <div className="flex rounded-none bg-theme-base p-1 border border-theme-ink text-micro uppercase tracking-wider font-bold font-mono">
          <button
            onClick={() => setPostType('SPEC')}
            className={`px-3.5 py-1.5 rounded-none flex items-center gap-2 transition ${
              postType === 'SPEC' 
                ? 'bg-[#1D1F23] text-theme-base' 
                : 'text-theme-ink hover:bg-theme-surface'
            }`}
          >
            <span>SENIOR SPEC CHALLENGE</span>
            <kbd className={`hidden md:inline-block border rounded-none px-1 py-0.5 text-pico font-mono ${postType === 'SPEC' ? 'border-theme-base/40 text-theme-base/80' : 'border-theme-ink/30 text-theme-ink/60'}`}>⌘1</kbd>
          </button>
          <button
            onClick={() => setPostType('TIP')}
            className={`px-3.5 py-1.5 rounded-none flex items-center gap-2 transition ${
              postType === 'TIP' 
                ? 'bg-[#1D1F23] text-theme-base' 
                : 'text-theme-ink hover:bg-theme-surface'
            }`}
          >
            <span>REVERSE MICRO-TEACHING</span>
            <kbd className={`hidden md:inline-block border rounded-none px-1 py-0.5 text-pico font-mono ${postType === 'TIP' ? 'border-theme-base/40 text-theme-base/80' : 'border-theme-ink/30 text-theme-ink/60'}`}>⌘2</kbd>
          </button>
        </div>
      </div>

      {/* FORM MODE A: SENIOR MICRO-ARCHITECTURAL SPEC */}
      {postType === 'SPEC' && (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Context & Defense Prompts (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Section 1: Problem Context */}
            <div className="rounded-none chassis-plate p-6 space-y-5">
              <h2 className="text-xs font-bold text-theme-ink uppercase tracking-wider font-mono border-b border-theme-ink pb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-theme-ink" />
                <span>1. INCIDENT & CONTEXT</span>
              </h2>

              <div>
                <label className="block text-micro font-bold text-theme-ink/60 mb-2 uppercase tracking-wider">SPEC CHALLENGE TITLE</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-none recessed-meter px-3.5 py-3 text-xs text-theme-ink font-bold uppercase tracking-wider focus:outline-none placeholder-[#1D1F23]/40"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-micro font-bold text-theme-ink/60 mb-2 uppercase tracking-wider">DOMAIN GUILD TRACK</label>
                  <select
                    value={track}
                    onChange={(e) => setTrack(e.target.value as DomainTrack)}
                    className="w-full rounded-none recessed-meter px-3 py-3 text-xs text-theme-ink font-bold focus:outline-none uppercase tracking-wider"
                  >
                    <option value="DISTRIBUTED_SYSTEMS">DISTRIBUTED SYSTEMS</option>
                    <option value="DEVOPS_INFRA">DEVOPS & PLATFORM</option>
                    <option value="CLOUD_SECURITY">CLOUD SECURITY & SECOPS</option>
                    <option value="BACKEND_PERFORMANCE">BACKEND PERFORMANCE</option>
                    <option value="FRONTEND_ARCHITECTURE">FRONTEND SYSTEMS</option>
                    <option value="DATA_ENGINEERING">DATA & INFRASTRUCTURE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-micro font-bold text-theme-ink/60 mb-2 uppercase tracking-wider">DIFFICULTY LEVEL</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value as any)}
                    className="w-full rounded-none recessed-meter px-3 py-3 text-xs text-theme-ink font-bold focus:outline-none uppercase tracking-wider"
                  >
                    <option value="EASY">EASY</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HARD">HARD</option>
                    <option value="EXPERT">EXPERT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-micro font-bold text-theme-ink/60 mb-2 uppercase tracking-wider">REAL-WORLD INCIDENT CONTEXT & BACKGROUND</label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={4}
                  className="w-full rounded-none recessed-meter p-3 text-xs text-theme-ink uppercase tracking-wider leading-relaxed focus:outline-none placeholder-[#1D1F23]/40 resize-none"
                  required
                />
              </div>
            </div>

            {/* Section 2: Production Constraints & Anti-AI Gate Prompts */}
            <div className="rounded-none chassis-plate p-6 space-y-5">
              <h2 className="text-xs font-bold text-theme-ink uppercase tracking-wider font-mono border-b border-theme-ink pb-3 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-theme-ink" />
                <span>2. CONSTRAINTS & REQUIREMENTS</span>
              </h2>

              {/* Constraints list */}
              <div>
                <label className="block text-micro font-bold text-theme-ink/60 mb-3 uppercase tracking-wider">PRODUCTION CONSTRAINTS CHECKLIST</label>
                <div className="space-y-2 mb-4 border-t border-theme-ink/20 pt-4">
                  {constraints.map((c, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 rounded-none recessed-meter text-xs">
                      <span className="text-theme-ink/80 font-mono uppercase tracking-wider text-micro">[{idx + 1}] {c}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveConstraint(idx)}
                        className="text-theme-ink/40 hover:text-theme-ink transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="ADD A HARD ENGINEERING CONSTRAINT..."
                    value={newConstraint}
                    onChange={(e) => setNewConstraint(e.target.value)}
                    className="flex-1 rounded-none recessed-meter px-3 py-3 text-xs font-bold tracking-wider text-theme-ink uppercase focus:outline-none placeholder-[#1D1F23]/40"
                  />
                  <button
                    type="button"
                    onClick={handleAddConstraint}
                    className="rounded-none tactile-btn-primary px-4 py-2 text-xs text-theme-base "
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-none tactile-btn-primary py-3 text-xs uppercase font-bold tracking-wider text-theme-base "
            >
              <Send className="h-4 w-4" />
              <span>PUBLISH ARCHITECTURE SPEC TO COMMUNITY FEED (+100 KARMA)</span>
              <kbd className="hidden md:inline-block border border-theme-base/40 rounded-none px-1.5 py-0.5 text-pico font-mono text-theme-base/80 ml-2">⌘↵</kbd>
            </button>
          </div>

          {/* Right Column: Starter Code & Live Preview */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-none chassis-plate p-6 space-y-4 sticky top-24">
              <h2 className="text-xs font-bold text-theme-ink uppercase tracking-wider font-mono border-b border-theme-ink pb-3 flex items-center gap-2">
                <Code className="h-4 w-4 text-theme-ink" />
                <span>3. STARTER CODE TEMPLATE</span>
              </h2>

              <div>
                <label className="block text-micro font-bold text-theme-ink mb-2 uppercase tracking-wider">STARTER CODE TEMPLATE</label>
                <VSCodeEditor
                  code={initialCode}
                  onChange={setInitialCode}
                  fileName="spec_template.ts"
                  minRows={10}
                />
              </div>

              {/* Spec Card Preview */}
              <div className="rounded-none bg-theme-base p-4 border border-theme-ink font-sans text-xs space-y-2 mt-4">
                <div className="flex items-center justify-between">
                  <span className="rounded-none bg-theme-surface text-theme-ink px-2 py-0.5 text-pico font-mono font-bold uppercase tracking-wider border border-theme-ink">
                    LIVE FEED SPEC PREVIEW
                  </span>
                  <span className="text-nano font-mono font-bold text-theme-ink/60 uppercase tracking-wider">{difficulty}</span>
                </div>
                <h3 className="font-bold text-theme-ink text-sm uppercase tracking-wider">{title || 'UNTITLED SPEC'}</h3>
                <p className="text-theme-ink/80 text-micro line-clamp-2 leading-relaxed uppercase tracking-wider">{context}</p>
              </div>
            </div>
          </div>

        </form>
      )}

      {/* FORM MODE B: JUNIOR / SPECIALIST MICRO-TEACHING TIP */}
      {postType === 'TIP' && (
        <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6 w-full">
          <div className="rounded-none chassis-plate p-6 space-y-5">
            <h2 className="text-xs font-bold text-theme-ink uppercase tracking-wider font-mono border-b border-theme-ink pb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-theme-ink" />
              <span>PUBLISH REVERSE MICRO-TEACHING TOOLING BREAKDOWN</span>
            </h2>

            <div>
              <label className="block text-micro font-bold text-theme-ink mb-1 uppercase tracking-wider">TIP TITLE</label>
              <input
                type="text"
                value={tipTitle}
                onChange={(e) => setTipTitle(e.target.value)}
                className="w-full rounded-none recessed-meter px-3.5 py-2 text-xs text-theme-ink focus:outline-none placeholder-[#1D1F23]/40"
                required
              />
            </div>

            <div>
              <label className="block text-micro font-bold text-theme-ink mb-1 uppercase tracking-wider">WHY THIS TOOL/SCRIPT IMPROVES WORKFLOW SPEED</label>
              <textarea
                value={tipSummary}
                onChange={(e) => setTipSummary(e.target.value)}
                rows={3}
                className="w-full rounded-none recessed-meter p-3 text-xs text-theme-ink focus:outline-none placeholder-[#1D1F23]/40 resize-none"
                required
              />
            </div>

            <div>
              <label className="block text-micro font-bold text-theme-ink mb-2 uppercase tracking-wider">CLI / DIAGNOSTIC CODE SNIPPET</label>
              <VSCodeEditor
                code={tipCode}
                onChange={setTipCode}
                fileName="micro_breakdown.sh"
                minRows={6}
                language="shell"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 rounded-none tactile-btn-primary py-3 text-xs font-bold text-theme-base uppercase tracking-wider "
          >
            <Send className="h-4 w-4 text-inherit" />
            <span>PUBLISH MICRO-TEACHING TIP TO FEED (+50 KARMA)</span>
            <kbd className="hidden md:inline-block border border-theme-base/40 rounded-none px-1.5 py-0.5 text-pico font-mono text-theme-base/80 ml-2">⌘↵</kbd>
          </button>
        </form>
      )}

    </div>
  );
};
