import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  MessageSquare,
  FileCode,
  ChevronLeft,
  Clock,
  Inbox,
  Check,
} from "lucide-react";
import type { RubricScores } from "../../types";
import { getPendingAuditSubmissions } from "../../services/api";
import { CardSkeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";
import { Avatar } from "../ui/Avatar";
import { VSCodeEditor } from "../ui/VSCodeEditor";
import { useKeyboardShortcut } from "../../hooks/useKeyboardShortcut";

interface AuditTerminalViewProps {
  onApproveReview: () => void;
  onBack: () => void;
}

export const AuditTerminalView: React.FC<AuditTerminalViewProps> = ({
  onApproveReview,
  onBack,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    "incoming" | "my_submissions"
  >("incoming");
  const [incomingQueue, setIncomingQueue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getPendingAuditSubmissions().then((data) => {
      setIncomingQueue(data);
      if (data.length > 0) setSelectedQueueId(data[0].id);
      setIsLoading(false);
    });
  }, []);
  const mySubmissions: any[] = [];

  useKeyboardShortcut({ key: 'Escape' }, (e) => {
    e.preventDefault();
    if (selectedQueueId) {
      setSelectedQueueId(null);
    } else {
      onBack();
    }
  });

  useKeyboardShortcut({ key: 'Enter', metaKey: true }, (e) => {
    if (activeSubTab === 'incoming' && selectedQueueId) {
      e.preventDefault();
      setSelectedQueueId(null);
      onApproveReview();
    }
  });

  const [rubric, setRubric] = useState<RubricScores>({
    architecture: 0,
    edgeCases: 0,
    defenseClarity: 0,
  });

  const [feedbackText, setFeedbackText] = useState<string>("");

  const [inlineComments, setInlineComments] = useState<
    Array<{ lineNumber: number; comment: string }>
  >([]);
  const [newCommentLine, setNewCommentLine] = useState<number>(14);
  const [newCommentText, setNewCommentText] = useState<string>("");

  const addInlineComment = () => {
    if (!newCommentText) return;
    setInlineComments((prev) => [
      ...prev,
      { lineNumber: newCommentLine, comment: newCommentText },
    ]);
    setNewCommentText("");
  };

  const selectedSubmission =
    incomingQueue.find((q) => q.id === selectedQueueId) || incomingQueue[0];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-theme-base text-theme-ink flex flex-col font-sans">
      
      {/* HEADER & SUB-NAV BAR */}
      <div className="flex items-center justify-between border-b chassis-plate px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-xs uppercase font-medium tracking-wider text-theme-ink hover:text-theme-ink/60 transition"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>DAILY FEED</span>
            <kbd className="hidden md:inline-block border border-theme-ink/30 rounded-none px-1 text-pico font-mono opacity-60 ml-1">ESC</kbd>
          </button>
          <span className="h-4 w-px bg-[#1D1F23]" />
          <h1 className="text-xs font-bold uppercase tracking-wider text-theme-ink flex items-center gap-2">
            <span>PILLAR 3: CONSENSUS AUDIT HUB</span>
            <span className="rounded-none bg-theme-base text-theme-ink px-2 py-0.5 text-nano font-mono border border-theme-ink">
              PEER CONSENSUS
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveSubTab("incoming");
              setSelectedQueueId(null);
            }}
            className={`flex items-center gap-1.5 rounded-none px-3 py-1.5 text-xs uppercase font-medium tracking-wider transition border ${
              activeSubTab === "incoming"
                ? "bg-[#1D1F23] text-theme-base border-theme-ink"
                : "bg-transparent text-theme-ink border-transparent hover:border-theme-ink"
            }`}
          >
            <span>AUDIT QUEUE ({incomingQueue.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab("my_submissions")}
            className={`flex items-center gap-1.5 rounded-none px-3 py-1.5 text-xs uppercase font-medium tracking-wider transition border ${
              activeSubTab === "my_submissions"
                ? "bg-[#1D1F23] text-theme-base border-theme-ink"
                : "bg-transparent text-theme-ink border-transparent hover:border-theme-ink"
            }`}
          >
            <span>MY SUBMISSIONS STATUS</span>
          </button>
        </div>
      </div>

      {/* VIEW A: INCOMING QUEUE LIST */}
      {activeSubTab === "incoming" && !selectedQueueId && (
        <div className="max-w-6xl mx-auto p-6 space-y-6 w-full">
          <div>
            <h2 className="text-base font-bold text-theme-ink font-mono uppercase tracking-wider flex items-center gap-2">
              <span>PENDING PEER SUBMISSIONS AWAITING AUDIT ({incomingQueue.length})</span>
            </h2>
            <p className="text-xs text-theme-ink/60 mt-1 uppercase tracking-wider">
              AUDIT CODE & WRITTEN ARCHITECTURAL DEFENSES TO EARN REVIEW KARMA AND ISSUE SENIOR AUDITOR SEALS.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {isLoading ? (
              <div className="space-y-4">
                <CardSkeleton />
                <CardSkeleton />
              </div>
            ) : incomingQueue.length === 0 ? (
              <EmptyState
                title="AUDIT QUEUE EMPTY"
                description="THERE ARE NO PEER SUBMISSIONS AWAITING AUDIT RIGHT NOW IN THE DATABASE."
                icon={Inbox}
              />
            ) : (
              incomingQueue.map((item) => (
                <motion.div
                  key={item.id}
                  className="rounded-none chassis-plate p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:bg-theme-base transition"
                  onClick={() => setSelectedQueueId(item.id)}
                >
                  <div className="flex items-start gap-4">
                    <Avatar
                      src={item.authorAvatar}
                      alt={item.authorName}
                      className="h-10 w-10 rounded-none border border-theme-ink"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-theme-ink">
                          {item.title}
                        </h3>
                        <span className="rounded-none bg-theme-base text-theme-ink px-2 py-0.5 text-pico font-mono border border-theme-ink uppercase tracking-wider">
                          {item.track}
                        </span>
                      </div>
                      <div className="text-xs text-theme-ink/60 mt-1 font-mono uppercase tracking-wider">
                        BY <strong className="text-theme-ink">{item.authorName}</strong> ({item.authorRole}) · SUBMITTED {item.submittedAt}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                    <span className="text-micro font-mono tabular-nums text-theme-ink/60 flex items-center gap-1 uppercase tracking-wider">
                      <Clock className="h-3.5 w-3.5 text-theme-ink" /> {item.timeEstimate}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW B: ACTIVE AUDIT TERMINAL */}
      {activeSubTab === "incoming" && selectedQueueId && (
        <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 w-full">
          
          {/* Left Side: Code Diff + Author Defense */}
          <motion.div className="lg:col-span-7 space-y-6">
            
            <div className="flex items-center justify-between p-4 rounded-none chassis-plate">
              <div className="flex items-center gap-3">
                <Avatar
                  src={selectedSubmission.authorAvatar}
                  alt={selectedSubmission.authorName}
                  className="h-10 w-10 rounded-none border border-theme-ink"
                />
                <div>
                  <div className="text-sm font-bold text-theme-ink flex items-center gap-1 uppercase tracking-wider">
                    <span>{selectedSubmission.authorName}</span>
                    <span className="text-xs font-mono text-theme-ink/60 font-normal">
                      (AUTHOR)
                    </span>
                  </div>
                  <span className="text-nano font-mono text-theme-ink uppercase tracking-wider">
                    {selectedSubmission.authorRole}
                  </span>
                </div>
              </div>
              <div className="text-right font-mono text-micro text-theme-ink/60 uppercase tracking-wider">
                <div>SUBMITTED: {selectedSubmission.submittedAt}</div>
                <div className="text-theme-ink">
                  TRACK: {selectedSubmission.track}
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-theme-ink font-mono text-xs text-theme-ink uppercase tracking-wider">
                <span className="flex items-center gap-1.5 font-bold">
                  <FileCode className="h-4 w-4" /> SUBMITTER'S SOLUTION CODE
                </span>
                <span>TYPESCRIPT · 27 LINES</span>
              </div>
              <VSCodeEditor
                code={selectedSubmission?.codeSnippet || selectedSubmission?.code || '// Solution implementation submitted by author\n'}
                readOnly={true}
                fileName="solution.ts"
              />
            </div>

            {/* Submitter's Architectural Defense Write-up */}
            <div className="rounded-none chassis-plate p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-theme-ink uppercase tracking-wider border-b border-theme-ink pb-2">
                <ShieldCheck className="h-4 w-4" />
                <span>AUTHOR'S ARCHITECTURAL DEFENSE WRITE-UP</span>
              </div>

              <div className="text-xs text-theme-ink font-sans space-y-4">
                {selectedSubmission?.defenseAnswers && Object.keys(selectedSubmission.defenseAnswers).length > 0 ? (
                  Object.entries(selectedSubmission.defenseAnswers).map(([key, val], idx) => (
                    <div key={key} className="space-y-1">
                      <strong className="font-mono text-micro uppercase tracking-wider">QUESTION {idx + 1}:</strong>
                      <p className="leading-relaxed pl-3 border-l-2 border-theme-ink/20">"{String(val)}"</p>
                    </div>
                  ))
                ) : (
                  <p className="text-theme-ink/60 italic font-mono uppercase tracking-wider">NO WRITTEN DEFENSE ANSWERS PROVIDED FOR THIS SUBMISSION.</p>
                )}
              </div>
            </div>

          </motion.div>

          {/* Right Side: Rubric & Comments */}
          <motion.div className="lg:col-span-5 space-y-6">
            
            <div className="rounded-none chassis-plate p-6 space-y-6">
              <div className="border-b border-theme-ink pb-3">
                <h2 className="text-sm font-bold text-theme-ink uppercase tracking-wider font-mono">
                  3-PILLAR EVALUATION RUBRIC
                </h2>
                <p className="text-xs text-theme-ink/60 mt-1 uppercase tracking-wider">
                  SCORE SUBMISSION ACROSS PILLARS BEFORE ISSUING SENIOR AUDITOR SEAL.
                </p>
              </div>

              <div className="space-y-6 font-sans">
                {[
                  { key: 'architecture' as const, label: '1. ARCHITECTURE & TRADE-OFFS' },
                  { key: 'edgeCases' as const, label: '2. EDGE CASE RESILIENCY' },
                  { key: 'defenseClarity' as const, label: '3. DEFENSE CLARITY & DEPTH' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <div className="flex justify-between text-xs mb-2">
                      <span className="font-bold text-theme-ink uppercase tracking-wider">
                        {label}
                      </span>
                      <span className="font-mono text-theme-ink font-bold tabular-nums">
                        {rubric[key]} / 5
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      value={rubric[key]}
                      onChange={(e) => setRubric({ ...rubric, [key]: Number(e.target.value) })}
                      className="w-full h-2 recessed-meter rounded-none appearance-none cursor-pointer accent-theme-ink"
                    />
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-none recessed-meter flex items-center justify-between">
                <div>
                  <div className="text-micro font-bold uppercase tracking-wider">
                    SENIOR AUDITOR SEAL OF APPROVAL
                  </div>
                  <div className="text-pico text-theme-ink/60 font-mono uppercase tracking-wider mt-0.5">
                    WILL BE STAMPED ON AUTHOR'S VERIFIED IDENTITY PROFILE
                  </div>
                </div>
                <div className="status-lens-verified inline-block h-4 w-4"></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-theme-ink uppercase tracking-wider mb-2">
                  AUDITOR SUMMARY & FEEDBACK
                </label>
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={3}
                  className="w-full rounded-none recessed-meter p-3 text-xs text-theme-ink focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-theme-ink">
                <h3 className="text-xs font-bold text-theme-ink uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>LINE-BY-LINE THREAD COMMENTS</span>
                </h3>

                <div className="space-y-2 mb-3">
                  {inlineComments.map((ic, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-none recessed-meter text-xs"
                    >
                      <div className="flex justify-between text-nano font-mono uppercase tracking-wider text-theme-ink/60 mb-1.5">
                        <span className="font-bold text-theme-ink">LINE #{ic.lineNumber}</span>
                        <span>BY AUDITOR</span>
                      </div>
                      <p className="text-theme-ink leading-relaxed">{ic.comment}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="LN"
                    value={newCommentLine}
                    onChange={(e) => setNewCommentLine(Number(e.target.value))}
                    className="w-16 rounded-none recessed-meter px-2 py-2 text-xs text-theme-ink font-mono tabular-nums focus:outline-none placeholder-[#1D1F23]/40"
                  />
                  <input
                    type="text"
                    placeholder="INLINE CODE COMMENT..."
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    className="flex-1 rounded-none recessed-meter px-3 py-2 text-xs uppercase font-medium tracking-wider text-theme-ink focus:outline-none placeholder-[#1D1F23]/40"
                  />
                  <button
                    onClick={addInlineComment}
className="rounded-none tactile-btn-primary px-4 py-2 text-xs uppercase font-bold tracking-wider text-theme-base "
                  >
                    ADD
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setSelectedQueueId(null);
                    onApproveReview();
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-none tactile-btn-primary py-3.5 text-xs uppercase font-bold tracking-wider text-theme-base "
                >
                  <Check className="h-4 w-4" />
                  <span>APPROVE & ISSUE VERIFIED GUILD BADGE (+25 KARMA)</span>
                  <kbd className="hidden md:inline-block border border-theme-base/40 rounded-none px-1.5 py-0.5 text-pico font-mono text-theme-base/80 ml-2">⌘↵</kbd>
                </button>
              </div>

            </div>
          </motion.div>

        </div>
      )}

      {/* Sub-Tab 2: My Submissions Tracker */}
      {activeSubTab === "my_submissions" && (
        <div className="max-w-5xl mx-auto p-6 space-y-6 w-full">
          <div>
            <h2 className="text-base font-bold text-theme-ink font-mono uppercase tracking-wider">
              MY CODE SUBMISSIONS STATUS TRACKER
            </h2>
            <p className="text-xs text-theme-ink/60 mt-1 uppercase tracking-wider">
              TRACK CONSENSUS AUDIT STATUS OF CODE & DEFENSES SUBMITTED TO NAPSED.
            </p>
          </div>

          <div className="space-y-4">
            {mySubmissions.map((sub) => (
              <motion.div
                key={sub.id}
                className="rounded-none chassis-plate p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer hover:bg-theme-base transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-none bg-theme-base text-theme-ink px-2 py-0.5 text-pico font-mono border border-theme-ink uppercase tracking-wider">
                      {sub.track}
                    </span>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-theme-ink">
                      {sub.title}
                    </h3>
                  </div>
                  <div className="text-xs text-theme-ink/60 mt-1 font-mono uppercase tracking-wider">
                    SUBMITTED: {sub.submittedAt} · AUDITED BY:{" "}
                    <strong className="text-theme-ink">{sub.auditedBy}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right font-mono text-xs tabular-nums uppercase tracking-wider">
                    <div
                      className={
                        sub.status === "VERIFIED"
                          ? "text-theme-ink font-bold"
                          : "text-theme-ink/60 font-bold"
                      }
                    >
                      {sub.status === "VERIFIED"
                        ? "✔ VERIFIED"
                        : "⏳ PENDING REVIEW"}
                    </div>
                    <div className="text-nano text-theme-ink/60 mt-0.5">
                      {sub.badgeIssued}
                    </div>
                  </div>

<button className="rounded-none recessed-meter px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-theme-ink hover:tactile-btn-primary hover:text-theme-base ">
                    VIEW DIFF & REVIEW
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
