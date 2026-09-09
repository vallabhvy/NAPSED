import React, { useState } from 'react';
import { Play, Trash2, Terminal as TerminalIcon, Cpu, ChevronDown, ChevronUp } from 'lucide-react';

interface XTermConsoleProps {
  logs: Array<{ type: 'stdout' | 'stderr' | 'system' | 'success'; text: string }>;
  isRunning: boolean;
  onRun: () => void;
  onClear: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  /** Shorter expanded panel for narrow viewports. */
  compact?: boolean;
}

export const XTermConsole: React.FC<XTermConsoleProps> = ({
  logs,
  isRunning,
  onRun,
  onClear,
  isCollapsed: externalIsCollapsed,
  onToggleCollapse,
  compact = false,
}) => {
  const [internalIsCollapsed, setInternalIsCollapsed] = useState(false);

  const isCollapsed = externalIsCollapsed !== undefined ? externalIsCollapsed : internalIsCollapsed;
  const toggleCollapse = onToggleCollapse || (() => setInternalIsCollapsed(!internalIsCollapsed));

  const handleRunClick = () => {
    if (isCollapsed) {
      toggleCollapse();
    }
    onRun();
  };

  const expandedHeight = compact ? 'h-40 max-h-[36dvh]' : 'h-56';

  return (
    <div
      className={`bg-charcoal-surface border-t border-slate flex flex-col font-mono text-xs text-cream shrink-0 transition-all duration-200 ${
        isCollapsed ? 'h-11' : expandedHeight
      }`}
    >
      <div 
        onClick={toggleCollapse}
        className="flex items-center justify-between bg-charcoal-base border-b border-slate px-2 sm:px-3 min-h-11 select-none shrink-0 cursor-pointer hover:bg-charcoal-card transition"
      >
        <div className="flex items-center gap-2 text-xs font-bold text-beige min-w-0">
          <TerminalIcon className="h-4 w-4 text-greige shrink-0" />
          <span>Terminal</span>
          <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-charcoal-surface border border-slate text-nano text-greige">
            Runs in your browser
          </span>
          {logs.length > 0 && (
            <span className="px-1.5 py-0.5 rounded bg-charcoal-card border border-slate text-nano text-beige">
              {logs.length} logs
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={handleRunClick}
            disabled={isRunning}
            className={`ide-touch-target flex items-center gap-1.5 px-3 py-2 rounded text-xs font-bold transition ${
              isRunning
                ? 'bg-charcoal-card text-greige cursor-not-allowed'
                : 'bg-beige text-charcoal-base hover:bg-cream shadow-sm'
            }`}
          >
            {isRunning ? (
              <>
                <Cpu className="h-4 w-4 animate-spin text-greige" />
                <span className="hidden sm:inline">Running…</span>
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                Run
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClear}
            title="Clear output"
            aria-label="Clear terminal output"
            className="ide-touch-target p-2 hover:bg-charcoal-card rounded text-greige hover:text-cream transition"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={toggleCollapse}
            title={isCollapsed ? 'Expand terminal' : 'Collapse terminal'}
            aria-label={isCollapsed ? 'Expand terminal' : 'Collapse terminal'}
            className="ide-touch-target p-2 hover:bg-charcoal-card rounded text-beige transition"
          >
            {isCollapsed ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          <div className="flex-1 min-h-0 p-3 overflow-y-auto overscroll-contain font-mono text-xs leading-relaxed space-y-1 bg-charcoal-surface">
            {logs.length === 0 ? (
              <div className="text-greige italic opacity-70">
                Press Run to execute the active workspace entrypoint in WebAssembly.
              </div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="shrink-0 select-none text-slate">
                    {log.type === 'stdout' ? '>' : log.type === 'stderr' ? '!' : log.type === 'success' ? '✓' : '●'}
                  </span>
                  <span
                    className={
                      log.type === 'stdout'
                        ? 'text-cream'
                        : log.type === 'stderr'
                        ? 'text-red-400 font-semibold'
                        : log.type === 'success'
                        ? 'text-beige font-semibold'
                        : 'text-greige'
                    }
                  >
                    {log.text}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="hidden sm:flex items-center justify-between bg-charcoal-base border-t border-slate px-3 py-1 text-nano text-greige shrink-0">
            <div className="flex items-center gap-3">
              <span>WebAssembly worker</span>
              <span>{isRunning ? 'Running' : 'Ready'}</span>
            </div>
            <div className="flex items-center gap-2 text-beige">
              <span>Napsed sandbox</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
