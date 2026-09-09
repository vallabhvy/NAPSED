import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Spec, Submission } from "../../types";
import {
  ShieldCheck,
  Code,
  Send,
  Clock,
  ChevronLeft,
  ArrowRight,
  Lightbulb,
  Eye,
  Lock,
} from "lucide-react";
import { Avatar } from "../ui/Avatar";
import { MultiFileIDE } from "../ide/MultiFileIDE";
import { useWorkspaceStore } from "../../store/workspaceStore";
import { zipSync, strToU8 } from "fflate";
import { useKeyboardShortcut } from "../../hooks/useKeyboardShortcut";

interface ChallengeStudioViewProps {
  challenges: Spec[];
  challenge?: Spec;
  onSubmit: (submission: Partial<Submission>) => void;
  onBack: () => void;
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function pickSolutionCode(
  nodes: Array<{ kind: string; path: string; content?: string | null }>,
) {
  const files = nodes.filter((n) => n.kind === "file");
  const preferred =
    files.find((n) => n.path.endsWith("/solution.ts") || n.path.endsWith("solution.ts")) ||
    files.find((n) => n.path.includes("main")) ||
    files.find(
      (n) =>
        n.path.endsWith(".ts") ||
        n.path.endsWith(".js") ||
        n.path.endsWith(".rs") ||
        n.path.endsWith(".py"),
    ) ||
    files[0];
  return preferred?.content || "";
}

export const ChallengeStudioView: React.FC<ChallengeStudioViewProps> = ({
  challenges,
  challenge,
  onSubmit,
  onBack,
}) => {
  const [selectedGuildTrack, setSelectedGuildTrack] = useState<string>("ALL");
  const initialActive =
    challenge?.id && challenge?.id !== "empty_chal" ? challenge : challenges[0] || null;
  const [activeChallenge, setActiveChallenge] = useState<Spec | null>(
    initialActive,
  );
  const [defenseAnswer, setDefenseAnswer] = useState<string>("");
  const [pasteDetected, setPasteDetected] = useState(false);
  const [unlockedHints, setUnlockedHints] = useState<Record<number, boolean>>(
    {},
  );
  const [showSolution, setShowSolution] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useKeyboardShortcut({ key: 'Escape' }, (e) => {
    e.preventDefault();
    if (activeChallenge) {
      setActiveChallenge(null);
    } else {
      onBack();
    }
  });

  useKeyboardShortcut({ key: 'Enter', metaKey: true }, (e) => {
    if (activeChallenge && isDefenseValid && !editorLocked && !isSubmitting) {
      e.preventDefault();
      handleSubmit();
    }
  });

  const startSandbox = (chal: Spec) => {
    setActiveChallenge(chal);
    setDefenseAnswer("");
    setPasteDetected(false);
    setUnlockedHints({});
    setShowSolution(false);
    setSubmitError(null);
  };

  const handleDefenseChange = (value: string) => {
    setDefenseAnswer(value);
  };

  const defenseGate = activeChallenge?.manifest?.defenseGate;

  const isDefenseValid =
    !defenseGate
      ? true
      : defenseAnswer.trim().length >= defenseGate.minCharacters;

  const editorLocked = pasteDetected && !isDefenseValid;

  const gateBadge = useMemo(() => {
    if (editorLocked) {
      return {
        label: "EDITOR LOCKED — FINISH DEFENSE",
        className: "bg-red-700 text-theme-base border border-theme-ink",
      };
    }
    if (pasteDetected && isDefenseValid) {
      return {
        label: "DEFENSE COMPLETE — UNLOCKED",
        className: "bg-[#1D1F23] text-theme-base border border-theme-ink",
      };
    }
    return {
      label: "PASTE DETECTION ON",
      className: "bg-theme-surface text-theme-ink border border-theme-ink",
    };
  }, [editorLocked, pasteDetected, isDefenseValid]);

  const handleSubmit = () => {
    if (!activeChallenge || isSubmitting || editorLocked) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const nodes = useWorkspaceStore.getState().getResolvedNodes();

    const codeFiles: Record<string, string> = {};
    nodes
      .filter((n) => n.kind === "file" && n.content != null)
      .forEach((n) => {
        const cleanPath = n.path.startsWith("/") ? n.path.substring(1) : n.path;
        codeFiles[cleanPath] = n.content || "";
      });

    if (Object.keys(codeFiles).length === 0) {
      setSubmitError(
        "NO CODE TO SUBMIT. EDIT A SOURCE FILE IN THE WORKSPACE, THEN TRY AGAIN.",
      );
      setIsSubmitting(false);
      return;
    }

    onSubmit({
      specId: activeChallenge.specId,
      codeFiles,
      defenseAnswer,
    });
    setIsSubmitting(false);
  };

  const filteredChallenges =
    selectedGuildTrack === "ALL"
      ? challenges
      : challenges.filter((c) => c.track === selectedGuildTrack);

  const guildPills = [
    { id: "ALL", label: "ALL TRACKS" },
    { id: "DEVOPS", label: "DEVOPS & IAC" },
    { id: "BACKEND", label: "BACKEND" },
    { id: "SECURITY", label: "SECURITY" },
    { id: "FRONTEND_PERF", label: "FRONTEND" },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-theme-base text-theme-ink flex flex-col font-sans">
      {!activeChallenge && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b chassis-plate px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={onBack}
              title="Go back (Esc)"
              className="flex items-center gap-1 text-xs uppercase font-medium tracking-wider text-theme-ink hover:text-theme-ink/60 transition"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>LEAVE STUDIO</span>
              <kbd className="hidden md:inline-block border border-theme-ink/30 rounded-none px-1 text-pico font-mono opacity-60 ml-1">ESC</kbd>
            </button>
            <span className="h-4 w-px bg-[#1D1F23]" />
            <h1 className="text-xs font-bold uppercase tracking-wider text-theme-ink">BUILD & DEFEND</h1>
          </div>
        </div>
      )}

      {!activeChallenge && (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 w-full">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-theme-ink pb-4 gap-4">
            <div>
              <h2 className="text-sm font-bold text-theme-ink font-mono uppercase tracking-wider flex items-center gap-2">
                <Code className="h-4 w-4 text-theme-ink" />
                <span>GUILD SPECS ({filteredChallenges.length})</span>
              </h2>
              <p className="text-xs text-theme-ink/60 mt-1 uppercase tracking-wider">
                PICK A TRACK, BUILD IN THE SANDBOX, THEN WRITE YOUR ARCHITECTURAL DEFENSE BEFORE GUILD AUDIT.
              </p>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
              {guildPills.map((pill) => {
                const isSelected = selectedGuildTrack === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setSelectedGuildTrack(pill.id)}
                    className={`flex items-center gap-1.5 rounded-none px-3 py-1.5 text-xs uppercase font-medium tracking-wider transition shrink-0 border ${
                      isSelected
                        ? "bg-[#1D1F23] text-theme-base border-theme-ink"
                        : "bg-transparent text-theme-ink border-transparent hover:border-theme-ink"
                    }`}
                  >
                    <span>{pill.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredChallenges.map((chal) => (
              <motion.div
                key={chal.id}
                onClick={() => startSandbox(chal)}
                className="rounded-none chassis-plate p-6 flex flex-col justify-between cursor-pointer group hover:bg-theme-base transition"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="rounded-none bg-theme-base text-theme-ink px-2 py-0.5 text-pico font-mono border border-theme-ink uppercase tracking-wider">
                      {chal.track}
                    </span>
                    <span className="text-micro font-mono tabular-nums text-theme-ink/60 flex items-center gap-1 uppercase tracking-wider">
                      <Clock className="h-3 w-3" /> ~{chal.timeEstimateMinutes} MINS ·{" "}
                      <strong className="text-theme-ink">{chal.difficulty}</strong>
                    </span>
                  </div>

                  <h3 className="text-sm font-bold uppercase tracking-wider text-theme-ink mb-2 leading-snug">
                    {chal.title}
                  </h3>

                  <p className="text-xs text-theme-ink/80 leading-relaxed mb-4 line-clamp-3">
                    {chal.manifest?.brief?.overview}
                  </p>
                </div>

                <div className="pt-4 border-t border-theme-ink flex items-center justify-end">
                  <button
                    type="button"
className="flex items-center gap-1.5 rounded-none tactile-btn-primary px-3.5 py-2 text-xs uppercase font-bold tracking-wider text-theme-base "
                  >
                    <span>OPEN SANDBOX</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {activeChallenge && (
        <div className="w-full h-full flex-1">
          <MultiFileIDE
            initialName={activeChallenge.title}
            defaultFullscreen={true}
            onBack={() => setActiveChallenge(null)}
            editorLocked={editorLocked}
            onPasteDetected={() => setPasteDetected(true)}
            entrypointPath={
              activeChallenge.manifest?.workspace?.entrypoint
                ? activeChallenge.manifest.workspace.entrypoint.startsWith("/")
                  ? activeChallenge.manifest.workspace.entrypoint
                  : `/${activeChallenge.manifest.workspace.entrypoint}`
                : undefined
            }
            initialFiles={
              activeChallenge.manifest?.workspace?.files?.map(f => ({
                path: f.path.startsWith("/") ? f.path : `/${f.path}`,
                content: f.content,
                language: f.path.split(".").pop() === "ts" ? "typescript" :
                         f.path.split(".").pop() === "js" ? "javascript" :
                         f.path.split(".").pop() === "go" ? "go" :
                         f.path.split(".").pop() === "py" ? "python" :
                         "plaintext",
              })) || []
            }
            detailsSidebar={
              <div className="space-y-5 text-xs font-sans text-theme-ink">
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-none chassis-plate">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="min-w-0">
                      <div className="font-bold uppercase tracking-wider text-theme-ink truncate">
                        {activeChallenge.title}
                      </div>
                      <div className="font-mono tabular-nums text-nano text-theme-ink/60 flex items-center gap-2 uppercase tracking-wider">
                        <span>~{activeChallenge.manifest?.estimatedTimeToSolveMinutes} MIN</span>
                        <span>{activeChallenge.difficulty}</span>
                      </div>
                    </div>
                  </div>
                  <span
                    className={`rounded-none px-2 py-1 text-pico font-mono font-bold uppercase tracking-wider shrink-0 ${gateBadge.className}`}
                  >
                    {gateBadge.label}
                  </span>
                </div>

                {editorLocked && (
                  <div
                    className="rounded-none border border-red-700 bg-red-700/10 p-3 flex gap-2 text-micro font-mono uppercase tracking-wider text-red-700"
                    role="status"
                    aria-live="polite"
                  >
                    <Lock className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
                    <p>
                      PASTE LOCKED THE EDITOR. FINISH EVERY ARCHITECTURAL DEFENSE PROMPT
                      BELOW (MEET EACH WORD COUNT) TO UNLOCK EDITING AND SUBMIT.
                    </p>
                  </div>
                )}

                <div>
                  <h3 className="text-micro font-mono font-bold text-theme-ink/60 uppercase tracking-wider mb-2">
                    SYSTEM CONTEXT
                  </h3>
                  <p className="text-xs text-theme-ink leading-relaxed font-sans">
                    {activeChallenge.manifest?.brief?.overview}
                  </p>
                </div>

                <div>
                  <h3 className="text-micro font-mono font-bold text-theme-ink/60 uppercase tracking-wider mb-2">
                    REQUIREMENTS
                  </h3>
                  <ul className="space-y-2 text-xs text-theme-ink font-sans">
                    {activeChallenge.manifest?.brief?.requirements?.map((c, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-bold">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {activeChallenge.manifest?.brief?.hintsOrConstraints && activeChallenge.manifest.brief.hintsOrConstraints.length > 0 && (
                  <div>
                    <h3 className="text-micro font-mono font-bold text-theme-ink/60 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Lightbulb className="h-3.5 w-3.5 text-theme-ink/60" />
                      <span>{activeChallenge.specType === 'PRACTICE' ? 'HINTS' : 'CONSTRAINTS'}</span>
                    </h3>
                    <div className="space-y-2">
                      {activeChallenge.manifest.brief.hintsOrConstraints.map((hint, idx) => {
                        const isRevealed = unlockedHints[idx];
                        return (
                          <div
                            key={idx}
                            className="rounded-none chassis-plate p-2.5 text-xs"
                          >
                            {isRevealed ? (
                              <p className="text-theme-ink leading-relaxed font-mono uppercase tracking-wider text-micro">
                                {hint}
                              </p>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  setUnlockedHints((prev) => ({
                                    ...prev,
                                    [idx]: true,
                                  }))
                                }
                                className="flex items-center gap-1.5 text-micro uppercase tracking-wider font-mono text-theme-ink hover:text-theme-ink/60 transition"
                              >
                                <Eye className="h-3.5 w-3.5 text-theme-ink" />
                                <span>REVEAL {activeChallenge.specType === 'PRACTICE' ? 'HINT' : 'CONSTRAINT'} {idx + 1}</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="rounded-none chassis-plate p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-theme-ink pb-2">
                    <div className="flex items-center gap-2 text-theme-ink font-bold text-xs uppercase tracking-wider">
                      <ShieldCheck className="h-4 w-4" />
                      <span>ARCHITECTURAL DEFENSE</span>
                    </div>
                    <span
                      className={`text-nano font-mono uppercase tracking-wider font-bold ${isDefenseValid ? "text-[#10B981]" : "text-theme-ink/60"}`}
                    >
                      {isDefenseValid ? "REQUIREMENT MET" : "INCOMPLETE"}
                    </span>
                  </div>

                  {defenseGate && (
                      <div className="space-y-2">
                        <label
                          htmlFor="defense-answer"
                          className="block text-xs font-mono uppercase tracking-wider text-theme-ink"
                        >
                          <strong>DEFENSE:</strong> {defenseGate.question}
                        </label>
                        <textarea
                          id="defense-answer"
                          value={defenseAnswer}
                          onChange={(e) =>
                            handleDefenseChange(e.target.value)
                          }
                          placeholder={defenseGate.placeholder}
                          rows={4}
                          className="w-full rounded-none recessed-meter p-3 text-xs text-theme-ink focus:outline-none"
                        />
                        <p
                          className={`font-mono text-nano tabular-nums uppercase tracking-wider font-bold ${isDefenseValid ? "text-[#10B981]" : "text-theme-ink/60"}`}
                        >
                          {defenseAnswer.length} / {defenseGate.minCharacters} CHARS
                        </p>
                      </div>
                  )}

                  {submitError && (
                    <p
                      role="alert"
                      className="text-micro font-mono uppercase tracking-wider text-red-700 border border-red-700 bg-red-700/10 p-2"
                    >
                      {submitError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!isDefenseValid || isSubmitting || editorLocked}
                    className={`w-full flex items-center justify-center gap-2 rounded-none py-3 font-bold text-xs uppercase tracking-wider transition border ${
                      isDefenseValid && !editorLocked
                        ? "bg-[#1D1F23] text-theme-base border-theme-ink hover:bg-transparent hover:text-theme-ink cursor-pointer"
                        : "bg-theme-surface text-theme-ink/40 border-theme-ink/40 cursor-not-allowed"
                    }`}
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>
                      {editorLocked
                        ? "FINISH DEFENSE TO UNLOCK"
                        : isDefenseValid
                          ? isSubmitting
                            ? "SUBMITTING…"
                            : "SUBMIT FOR GUILD AUDIT"
                          : "MEET WORD COUNTS TO SUBMIT"}
                    </span>
                    {isDefenseValid && !editorLocked && (
                      <kbd className="hidden md:inline-block border border-theme-base/40 rounded-none px-1.5 py-0.5 text-pico font-mono opacity-80 ml-2">⌘↵</kbd>
                    )}
                  </button>
                </div>
              </div>
            }
          />
        </div>
      )}
    </div>
  );
};
