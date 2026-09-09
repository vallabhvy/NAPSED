import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { 
  Maximize2, 
  Minimize2, 
  BookOpen, 
  FolderTree, 
  Terminal as TerminalIcon, 
  ArrowLeft,
  X,
  PanelLeft,
  PanelRight,
  Lock,
} from 'lucide-react';
import { FileTreeExplorer } from './FileTreeExplorer';
import { XTermConsole } from './XTermConsole';
import { useBrowserRunner } from '../../services/execution/useBrowserRunner';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useMediaQuery } from '../../hooks/useMediaQuery';

const MonacoEditorView = lazy(() =>
  import('./MonacoEditorView').then((m) => ({ default: m.MonacoEditorView })),
);

interface MultiFileIDEProps {
  workspaceId?: string;
  initialName?: string;
  initialFiles?: Array<{ path: string; content: string; language: string }>;
  className?: string;
  detailsSidebar?: React.ReactNode;
  defaultFullscreen?: boolean;
  onBack?: () => void;
  /** Paste-gate lock until Architectural Defense clears. */
  editorLocked?: boolean;
  onPasteDetected?: () => void;
  /** Manifest workspace.entrypoint — ▶ RUN uses this instead of the active tab. */
  entrypointPath?: string;
}

const toolbarBtn =
  'ide-touch-target inline-flex items-center justify-center gap-1.5 rounded border text-xs transition shrink-0';

export const MultiFileIDE: React.FC<MultiFileIDEProps> = ({
  workspaceId,
  initialName = 'Sandbox Workspace',
  initialFiles,
  className = '',
  detailsSidebar,
  defaultFullscreen = true,
  onBack,
  editorLocked = false,
  onPasteDetected,
  entrypointPath,
}) => {
  const loadWorkspace = useWorkspaceStore((s) => s.loadWorkspace);
  const initInMemoryWorkspace = useWorkspaceStore((s) => s.initInMemoryWorkspace);
  const activeWorkspace = useWorkspaceStore((s) => s.activeWorkspace);
  const isLoading = useWorkspaceStore((s) => s.isLoading);
  const { isRunning, logs, runCode, clearLogs } = useBrowserRunner();
  const isNarrow = useMediaQuery('(max-width: 767px)');
  const appliedNarrowDefaults = useRef(false);

  const [isFullscreen, setIsFullscreen] = useState(defaultFullscreen);
  const [isTreeOpen, setIsTreeOpen] = useState(true);
  const [isDetailsOpen, setIsDetailsOpen] = useState(!!detailsSidebar);
  const [detailsPosition, setDetailsPosition] = useState<'left' | 'right'>('left');
  const [isTerminalCollapsed, setIsTerminalCollapsed] = useState(false);

  useEffect(() => {
    if (workspaceId && !workspaceId.startsWith('local-sandbox')) {
      loadWorkspace(workspaceId);
    } else if (!activeWorkspace) {
      initInMemoryWorkspace(initialName, initialFiles || [
        { path: '/src/main.ts', content: `// Napsed multi-file sandbox\nconsole.log("Napsed workspace ready");\n`, language: 'typescript' },
        { path: '/README.md', content: `# Napsed sandbox\n\nEdit files here. Run executes in your browser via WebAssembly.\n`, language: 'markdown' }
      ]);
    }
  }, [workspaceId]);

  // Phone: one pane at a time — editor first, side panels overlay.
  useEffect(() => {
    if (!isNarrow) {
      appliedNarrowDefaults.current = false;
      return;
    }
    if (appliedNarrowDefaults.current) return;
    appliedNarrowDefaults.current = true;
    setIsTreeOpen(false);
    setIsDetailsOpen(false);
    setIsTerminalCollapsed(true);
    setIsFullscreen(true);
  }, [isNarrow]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isNarrow && (isDetailsOpen || isTreeOpen)) {
          setIsDetailsOpen(false);
          setIsTreeOpen(false);
          return;
        }
        if (isFullscreen && !isNarrow) {
          setIsFullscreen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, isNarrow, isDetailsOpen, isTreeOpen]);

  const toggleSpec = () => {
    if (isNarrow) {
      setIsTreeOpen(false);
      setIsDetailsOpen((open) => !open);
      return;
    }
    setIsDetailsOpen((open) => !open);
  };

  const toggleFiles = () => {
    if (isNarrow) {
      setIsDetailsOpen(false);
      setIsTreeOpen((open) => !open);
      return;
    }
    setIsTreeOpen((open) => !open);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-charcoal-surface border border-slate rounded-xl font-mono text-xs text-beige">
        <div className="h-6 w-6 border-2 border-greige border-t-transparent rounded-full animate-spin mb-3" />
        <span>Loading workspace…</span>
      </div>
    );
  }

  const renderDetailsSidebar = (asOverlay: boolean) => (
    <div
      className={`bg-charcoal-surface border-slate flex flex-col h-full overflow-hidden shrink-0 z-30 shadow-xl ${
        asOverlay
          ? 'absolute inset-0 w-full border-0'
          : `w-80 sm:w-96 ${detailsPosition === 'left' ? 'border-r' : 'border-l'}`
      }`}
      role={asOverlay ? 'dialog' : undefined}
      aria-modal={asOverlay ? true : undefined}
      aria-label="Spec and defense"
    >
      <div className="flex items-center justify-between px-3 min-h-11 bg-charcoal-base border-b border-slate text-xs font-bold font-mono text-beige shrink-0">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-greige" aria-hidden />
          <span>Spec &amp; defense</span>
        </div>
        <div className="flex items-center gap-1">
          {!asOverlay && (
            <button
              type="button"
              onClick={() => setDetailsPosition(detailsPosition === 'left' ? 'right' : 'left')}
              className={`${toolbarBtn} p-2 border-transparent text-greige hover:bg-charcoal-card hover:text-cream`}
              title={`Move Spec & defense to the ${detailsPosition === 'left' ? 'right' : 'left'}`}
              aria-label={`Move Spec & defense to the ${detailsPosition === 'left' ? 'right' : 'left'}`}
            >
              {detailsPosition === 'left' ? <PanelRight className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsDetailsOpen(false)}
            className={`${toolbarBtn} p-2 border-transparent text-greige hover:bg-charcoal-card hover:text-cream`}
            title="Close Spec & defense"
            aria-label="Close Spec & defense"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="p-4 space-y-4 font-sans text-sm md:text-xs flex-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
        {detailsSidebar}
      </div>
    </div>
  );

  const shellHeight = isFullscreen
    ? 'fixed top-16 inset-x-0 bottom-0 z-30 h-[calc(100dvh-4rem)] max-h-[calc(100dvh-4rem)] w-screen rounded-none border-t border-slate pb-[env(safe-area-inset-bottom)]'
    : 'h-[min(650px,70dvh)] md:h-[650px] rounded-xl border border-slate shadow-2xl overflow-hidden';

  return (
    <div
      className={`flex flex-col w-full bg-charcoal-surface font-sans transition-all duration-200 ${shellHeight} ${className}`}
    >
      <div className="flex items-center gap-2 bg-charcoal-base border-b border-slate px-2 sm:px-3 min-h-11 select-none shrink-0 font-mono text-xs text-beige overflow-x-auto overscroll-x-contain">
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className={`${toolbarBtn} px-2.5 py-2 bg-charcoal-surface border-slate text-beige hover:bg-charcoal-card`}
              title="Back to Guild Specs"
              aria-label="Back to Guild Specs"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
          )}

          {detailsSidebar && (
            <button
              type="button"
              onClick={toggleSpec}
              className={`${toolbarBtn} px-2.5 py-2 ${
                isDetailsOpen
                  ? 'bg-charcoal-card border-amber-500 text-cream shadow-sm font-semibold'
                  : 'bg-charcoal-surface border-slate text-greige hover:text-beige hover:border-greige'
              }`}
              title={isDetailsOpen ? 'Hide Spec & defense' : 'Show Spec & defense'}
              aria-pressed={isDetailsOpen}
            >
              <BookOpen className="h-4 w-4 text-greige" />
              <span className="hidden sm:inline">Spec</span>
            </button>
          )}

          <button
            type="button"
            onClick={toggleFiles}
            className={`${toolbarBtn} px-2.5 py-2 ${
              isTreeOpen
                ? 'bg-charcoal-card border-slate text-cream'
                : 'bg-charcoal-surface border-slate text-greige hover:text-beige hover:border-greige'
            }`}
            title={isTreeOpen ? 'Hide file explorer' : 'Show file explorer'}
            aria-pressed={isTreeOpen}
          >
            <FolderTree className="h-4 w-4 text-beige" />
            <span className="hidden sm:inline">Files</span>
          </button>

          <button
            type="button"
            onClick={() => setIsTerminalCollapsed(!isTerminalCollapsed)}
            className={`${toolbarBtn} px-2.5 py-2 ${
              !isTerminalCollapsed
                ? 'bg-charcoal-card border-slate text-cream'
                : 'bg-charcoal-surface border-slate text-greige hover:text-beige hover:border-greige'
            }`}
            title={isTerminalCollapsed ? 'Show terminal' : 'Hide terminal'}
            aria-pressed={!isTerminalCollapsed}
          >
            <TerminalIcon className="h-4 w-4 text-greige" />
            <span className="hidden sm:inline">Terminal</span>
          </button>

          {editorLocked && (
            <span className="hidden sm:inline-flex items-center gap-1 text-amber-500 px-1 shrink-0">
              <Lock className="h-3.5 w-3.5" aria-hidden />
              Locked
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 ml-auto shrink-0 pl-2">
          <span className="hidden md:inline-block font-mono text-nano text-greige truncate max-w-[14rem]">
            {activeWorkspace?.name || initialName}
          </span>
          {!isNarrow && (
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`${toolbarBtn} px-3 py-2 bg-charcoal-surface border-slate font-bold text-beige hover:bg-charcoal-card hover:border-greige shadow-sm`}
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              <span className="hidden lg:inline">{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative min-h-0">
        {detailsSidebar && isDetailsOpen && detailsPosition === 'left' && !isNarrow && renderDetailsSidebar(false)}

        {isTreeOpen && !isNarrow && (
          <FileTreeExplorer />
        )}

        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center text-xs font-mono text-greige bg-charcoal-surface">
              Loading editor…
            </div>
          }
        >
          <MonacoEditorView
            editorLocked={editorLocked}
            onPasteDetected={onPasteDetected}
          />
        </Suspense>

        {detailsSidebar && isDetailsOpen && detailsPosition === 'right' && !isNarrow && renderDetailsSidebar(false)}

        {/* Mobile exclusive overlays */}
        {isNarrow && isDetailsOpen && detailsSidebar && renderDetailsSidebar(true)}
        {isNarrow && isTreeOpen && (
          <div className="absolute inset-0 z-30" role="dialog" aria-modal="true" aria-label="File explorer">
            <FileTreeExplorer
              className="w-full border-r-0"
              onClose={() => setIsTreeOpen(false)}
              onFileOpened={() => setIsTreeOpen(false)}
            />
          </div>
        )}
      </div>

      <XTermConsole
        logs={logs}
        isRunning={isRunning}
        onRun={() => {
          setIsTerminalCollapsed(false);
          runCode(entrypointPath);
        }}
        onClear={clearLogs}
        isCollapsed={isTerminalCollapsed}
        onToggleCollapse={() => setIsTerminalCollapsed(!isTerminalCollapsed)}
        compact={isNarrow}
      />
    </div>
  );
};
