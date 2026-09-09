import React, { useEffect, useMemo, useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { X, Save, CheckCircle2, FileCode, Lock } from "lucide-react";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { useShallow } from "zustand/react/shallow";

interface MonacoEditorViewProps {
  /** Anti-AI paste gate: editor read-only + overlay until defenses clear. */
  editorLocked?: boolean;
  onPasteDetected?: () => void;
}

function getMonacoLanguage(lang?: string | null, path?: string): string {
  if (lang) {
    if (lang === "cpp" || lang === "c") return "cpp";
    if (lang === "rust") return "rust";
    if (lang === "python") return "python";
    if (lang === "go") return "go";
    if (lang === "java") return "java";
    if (lang === "javascript") return "javascript";
    return "typescript";
  }
  if (path) {
    if (path.endsWith(".py")) return "python";
    if (path.endsWith(".cpp") || path.endsWith(".c")) return "cpp";
    if (path.endsWith(".rs")) return "rust";
    if (path.endsWith(".go")) return "go";
    if (path.endsWith(".java")) return "java";
    if (path.endsWith(".js")) return "javascript";
    if (path.endsWith(".json")) return "json";
    if (path.endsWith(".md")) return "markdown";
  }
  return "typescript";
}

const editorOptions = {
  fontSize: 13,
  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  minimap: { enabled: false },
  scrollBeyondLastLine: false,
  automaticLayout: true,
  tabSize: 2,
  wordWrap: "on" as const,
  lineNumbers: "on" as const,
  folding: true,
  smoothScrolling: false,
  renderWhitespace: "none" as const,
  renderLineHighlight: "line" as const,
  matchBrackets: "near" as const,
  quickSuggestions: false,
  suggestOnTriggerCharacters: false,
  wordBasedSuggestions: "off" as const,
  links: false,
  colorDecorators: false,
  largeFileOptimizations: true,
};

export const MonacoEditorView: React.FC<MonacoEditorViewProps> = ({
  editorLocked = false,
  onPasteDetected,
}) => {
  const openTabs = useWorkspaceStore((s) => s.openTabs);
  const activeNodeId = useWorkspaceStore((s) => s.activeNodeId);
  const setActiveTab = useWorkspaceStore((s) => s.setActiveTab);
  const closeTab = useWorkspaceStore((s) => s.closeTab);
  const updateActiveFileContent = useWorkspaceStore((s) => s.updateActiveFileContent);
  const isSaving = useWorkspaceStore((s) => s.isSaving);
  const lastSavedAt = useWorkspaceStore((s) => s.lastSavedAt);

  const activeMeta = useWorkspaceStore(
    useShallow((s) => {
      const node = s.nodes.find((n) => n.id === s.activeNodeId);
      if (!node) return null;
      return {
        id: node.id,
        path: node.path,
        language: node.language,
      };
    }),
  );

  const pasteHandlerRef = useRef(onPasteDetected);
  useEffect(() => {
    pasteHandlerRef.current = onPasteDetected;
  }, [onPasteDetected]);

  // Snapshot buffer only when the active file changes — keep Monaco uncontrolled while typing.
  const defaultValue = useMemo(() => {
    if (!activeNodeId) return "";
    return useWorkspaceStore.getState().getNodeContent(activeNodeId);
  }, [activeNodeId]);

  const language = useMemo(
    () => getMonacoLanguage(activeMeta?.language, activeMeta?.path),
    [activeMeta?.language, activeMeta?.path],
  );

  const handleMount: OnMount = (editor) => {
    editor.onDidPaste(() => {
      pasteHandlerRef.current?.();
    });
  };

  const options = useMemo(
    () => ({
      ...editorOptions,
      readOnly: editorLocked,
      domReadOnly: editorLocked,
    }),
    [editorLocked],
  );

  return (
    <div className="flex-1 min-w-0 flex flex-col bg-charcoal-surface h-full overflow-hidden contain-strict">
      <div className="flex items-center justify-between bg-charcoal-base border-b border-slate px-2 select-none overflow-x-auto shrink-0 min-h-11">
        <div className="flex items-center space-x-1">
          {openTabs.map((tab) => {
            const isActive = tab.nodeId === activeNodeId;
            return (
              <div
                key={tab.nodeId}
                onClick={() => setActiveTab(tab.nodeId)}
                className={`group flex items-center gap-2 px-3 min-h-11 py-2 text-xs font-mono border-t-2 transition cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-charcoal-surface text-cream border-beige font-semibold"
                    : "bg-charcoal-base text-greige border-transparent hover:bg-charcoal-card hover:text-beige"
                }`}
              >
                <FileCode
                  className={`h-3.5 w-3.5 ${isActive ? "text-beige" : "text-greige"}`}
                />
                <span>{tab.name}</span>
                {tab.isDirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                <button
                  type="button"
                  aria-label={`Close ${tab.name}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.nodeId);
                  }}
                  className="ide-hover-reveal ide-touch-target p-2 hover:bg-charcoal-card rounded text-greige hover:text-cream transition"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-greige px-3 shrink-0">
          {editorLocked && (
            <span className="flex items-center gap-1 text-amber-500">
              <Lock className="h-3 w-3" aria-hidden />
              Editor locked
            </span>
          )}
          {isSaving ? (
            <span className="flex items-center gap-1 text-amber-500 motion-safe:animate-pulse">
              <Save className="h-3 w-3" /> Saving…
            </span>
          ) : lastSavedAt ? (
            <span className="flex items-center gap-1 text-beige">
              <CheckCircle2 className="h-3 w-3" /> Saved to workspace
            </span>
          ) : null}
        </div>
      </div>

      {activeMeta ? (
        <div className="flex-1 relative overflow-hidden contain-size">
          <Editor
            key={activeMeta.id}
            path={activeMeta.path}
            height="100%"
            theme="vs-dark"
            language={language}
            defaultValue={defaultValue}
            keepCurrentModel
            onChange={(val) => {
              if (editorLocked) return;
              updateActiveFileContent(val || "");
            }}
            onMount={handleMount}
            options={options}
            loading={
              <div className="flex h-full items-center justify-center text-xs font-mono text-greige">
                Loading editor…
              </div>
            }
          />

          {editorLocked && (
            <div
              className="absolute inset-0 z-10 flex items-center justify-center bg-charcoal-950/75 backdrop-blur-[2px] p-6"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="paste-gate-title"
              aria-describedby="paste-gate-desc"
            >
              <div className="max-w-sm rounded-xl border-2 border-amber-500 bg-charcoal-card p-5 shadow-[0_0_24px_-2px_rgba(245,158,11,0.35)] text-center space-y-3">
                <Lock className="mx-auto h-8 w-8 text-amber-500" aria-hidden />
                <h2
                  id="paste-gate-title"
                  className="text-sm font-bold text-cream tracking-tight"
                >
                  Anti-AI Defense Gate
                </h2>
                <p id="paste-gate-desc" className="text-xs text-greige leading-relaxed">
                  Paste detected. Open Spec &amp; defense and finish every Architectural
                  Defense prompt (meet each word count) to unlock editing and submit.
                </p>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-greige font-mono text-xs p-6 text-center">
          <FileCode className="h-12 w-12 text-slate mb-3" />
          <p className="text-beige font-bold mb-1">No file open</p>
          <p>Choose a file in the explorer to edit.</p>
        </div>
      )}
    </div>
  );
};
