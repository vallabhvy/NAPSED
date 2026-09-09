import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import type { Spec, FeedItem, UserProfile } from "../../types";
import {
  ChevronRight,
  Filter,
  Inbox,
  MessageSquare,
  PlusCircle,
  ThumbsUp,
  ArrowRight,
  CheckSquare,
} from "lucide-react";
import { FeedSkeleton } from "../ui/Skeleton";
import { EmptyState } from "../ui/EmptyState";

interface FeedViewProps {
  user: UserProfile;
  feedItems: FeedItem[];
  challenges?: Spec[];
  isLoading?: boolean;
  activeMode?: "MAIN_FEED" | "CHALLENGE_SPECS" | "PRACTICE_SPECS";
  onOpenChallenge: (challengeId: string) => void;
  onOpenAuditTerminal: () => void;
  onOpenPortfolio: () => void;
  onOpenSpecWriter: () => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  user,
  feedItems,
  challenges = [],
  isLoading = false,
  activeMode = "MAIN_FEED",
  onOpenChallenge,
  onOpenAuditTerminal,
  onOpenPortfolio,
  onOpenSpecWriter,
}) => {
  const [feedFilter, setFeedFilter] = useState<
    "ALL" | "MICRO_BUILD" | "SENIOR_SPEC" | "JUNIOR_TIP"
  >("ALL");
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const filteredFeed =
    feedFilter === "ALL"
      ? feedItems
      : feedItems.filter((item) => item.type === feedFilter);
  
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  };

  const [selectedTopic, setSelectedTopic] = useState<string>("ALL");
  const challengeSpecs = challenges.filter(c => c.specType !== "PRACTICE");
  const practiceSpecs = challenges.filter(c => c.specType === "PRACTICE");

  const filteredUserSpecs =
    selectedTopic === "ALL"
      ? challengeSpecs
      : challengeSpecs.filter((c) => c.track === selectedTopic);

  const topicsList = [
    { id: "ALL", label: "ALL TOPICS" },
    { id: "OBJECT_ORIENTED_DESIGN", label: "OOPS / DESIGN PATTERNS" },
    { id: "BACKEND", label: "BACKEND & APIS" },
    { id: "SYSTEM_LLD", label: "LOW-LEVEL DESIGN" },
    { id: "DISTRIBUTED_SYSTEMS", label: "DISTRIBUTED SYSTEMS" },
    { id: "DEVOPS", label: "DEVOPS & IAC" },
    { id: "DATABASE_INTERNALS", label: "DATABASES & STORAGE" },
  ];

  useEffect(() => {
    setSelectedIndex(0);
  }, [activeMode, feedFilter, selectedTopic]);

  const activeItemsCount = 
    activeMode === "MAIN_FEED" ? filteredFeed.length :
    activeMode === "CHALLENGE_SPECS" ? filteredUserSpecs.length :
    activeMode === "PRACTICE_SPECS" ? practiceSpecs.length : 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === "j" || e.key === "ArrowDown") {
        setSelectedIndex((prev) => (prev < activeItemsCount - 1 ? prev + 1 : prev));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === "Enter") {
        if (activeMode === "MAIN_FEED") {
          if (filteredFeed[selectedIndex]) {
            const chal = challenges.find((c) => c.title === filteredFeed[selectedIndex].title) || challenges[0];
            if (chal) onOpenChallenge(chal.id);
          }
        } else if (activeMode === "CHALLENGE_SPECS") {
          if (filteredUserSpecs[selectedIndex]) onOpenChallenge(filteredUserSpecs[selectedIndex].id);
        } else if (activeMode === "PRACTICE_SPECS") {
          if (practiceSpecs[selectedIndex]) onOpenChallenge(practiceSpecs[selectedIndex].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeMode, selectedIndex, activeItemsCount, feedFilter, selectedTopic, filteredFeed, filteredUserSpecs, practiceSpecs, challenges, onOpenChallenge]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-7xl px-4 py-8 font-sans text-theme-ink sm:px-6 lg:px-8"
    >
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main Content Area */}
        <section className="space-y-6 lg:col-span-8">
          {activeMode === "MAIN_FEED" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-theme-ink pb-3">
                <div className="flex items-center gap-1">
                  <Filter className="mr-1 h-4 w-4 text-theme-ink" />
                  {(
                    ["ALL", "MICRO_BUILD", "SENIOR_SPEC", "JUNIOR_TIP"] as const
                  ).map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setFeedFilter(filter)}
                      className={`rounded-none px-2.5 py-1 text-xs uppercase font-medium tracking-wider transition border ${
                        feedFilter === filter
                          ? "bg-[#1D1F23] text-theme-base border-theme-ink"
                          : "bg-transparent text-theme-ink border-transparent hover:border-theme-ink"
                      }`}
                    >
                      {filter.replace("_", " ")}
                    </button>
                  ))}
                </div>
                <button
                  onClick={onOpenSpecWriter}
                  className="tactile-btn-secondary flex items-center gap-1 rounded-none px-2.5 py-1 text-xs uppercase font-medium tracking-wider text-theme-ink"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>POST SPEC</span>
                </button>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  <FeedSkeleton />
                  <FeedSkeleton />
                  <FeedSkeleton />
                </div>
              ) : filteredFeed.length === 0 ? (
                <EmptyState
                  title="NO PROTOCOL FEED ITEMS FOUND"
                  description={`THERE ARE NO ACTIVE FEED ITEMS MATCHING THE ${feedFilter.replace("_", " ")} FILTER.`}
                  icon={Inbox}
                  actionLabel="POST FIRST SPEC"
                  onAction={onOpenSpecWriter}
                />
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    visible: { transition: { staggerChildren: 0.08 } },
                  }}
                  className="space-y-4"
                >
                  {filteredFeed.map((item, index) => (
                    <motion.article
                      key={item.id}
                      variants={itemVariants}
                      className={`rounded-none chassis-plate four-screws p-5 space-y-4 transition ${
                        selectedIndex === index 
                          ? "border-theme-ink ring-1 ring-theme-ink" 
                          : "border-theme-ink hover:bg-theme-base"
                      }`}
                    >
                      <div className="screw-tr"></div><div className="screw-bl"></div>
                      <div className="flex justify-between gap-3">
                        <div className="flex gap-3">
                          <img
                            src={item.author.avatar}
                            alt={item.author.name}
                            className="h-8 w-8 rounded-none border border-theme-ink"
                          />
                          <div>
                            <p className="text-xs uppercase font-medium tracking-wider text-theme-ink">
                              {item.author.name}
                            </p>
                            <p className="font-mono text-micro tabular-nums text-theme-ink">
                              {item.timestamp}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="h-fit rounded-none recessed-meter px-2 py-0.5 font-mono text-micro tabular-nums uppercase text-theme-ink">
                            {item.track}
                          </span>
                          <span className="h-fit rounded-none border border-theme-ink bg-[#1D1F23] px-2 py-0.5 font-mono text-micro tabular-nums uppercase text-theme-base">
                            {item.type.replace("_", " ")}
                          </span>
                        </div>
                      </div>

                      <h2 className="text-sm font-bold text-theme-ink uppercase tracking-wider">
                        {item.title}
                      </h2>
                      <p className="text-xs leading-relaxed text-theme-ink">
                        {item.summary}
                      </p>

                      {item.codeSnippet && (
                        <pre className="overflow-x-auto rounded-none recessed-meter p-3 text-micro text-theme-ink font-mono tabular-nums">
                          {item.codeSnippet}
                        </pre>
                      )}

                      <div className="flex items-center justify-between border-t border-theme-ink pt-3 text-xs text-theme-ink">
                        <span className="flex gap-3 font-mono tabular-nums">
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="h-3.5 w-3.5" />
                            {item.upvotes}
                          </span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3.5 w-3.5" />
                            {item.commentsCount}
                          </span>
                        </span>
                        <button
                          onClick={() =>
                            onOpenChallenge(
                              challenges.find(
                                (challenge) => challenge.title === item.title,
                              )?.id ||
                                challenges[0]?.id ||
                                "",
                            )
                          }
                          className="tactile-btn-secondary flex items-center gap-1 uppercase font-medium tracking-wider px-2 py-1"
                        >
                          <span>VIEW SPEC</span>
                          <ChevronRight className="inline h-3.5 w-3.5" />
                        </button>
                      </div>
                    </motion.article>
                  ))}
                </motion.div>
              )}
            </div>
          )}

          {activeMode === "CHALLENGE_SPECS" && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2 pb-2 select-none border-b border-theme-ink">
                <Filter className="h-3.5 w-3.5 text-theme-ink shrink-0 mr-1" />
                {topicsList.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTopic(t.id)}
                    className={`rounded-none px-3 py-1.5 text-xs uppercase font-medium tracking-wider shrink-0 transition border ${
                      selectedTopic === t.id
                        ? "bg-[#1D1F23] text-theme-base border-theme-ink"
                        : "bg-transparent text-theme-ink border-transparent hover:border-theme-ink"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  <FeedSkeleton />
                  <FeedSkeleton />
                </div>
              ) : filteredUserSpecs.length === 0 ? (
                <EmptyState
                  title="NO CHALLENGE SPECS FOUND"
                  description={`BE THE FIRST SENIOR ENGINEER TO PUBLISH A SPEC FOR ${topicsList.find(t => t.id === selectedTopic)?.label || selectedTopic}!`}
                  icon={Inbox}
                  actionLabel="+ PUBLISH FIRST SPEC"
                  onAction={onOpenSpecWriter}
                />
              ) : (
                <div className="grid gap-4 sm:grid-cols-1">
                  {filteredUserSpecs.map((chal, index) => (
                    <div
                      key={chal.id}
                      className={`rounded-none chassis-plate four-screws p-5 space-y-4 transition ${
                        selectedIndex === index 
                          ? "border-theme-ink ring-1 ring-theme-ink" 
                          : "border-theme-ink hover:bg-theme-base"
                      }`}
                    >
                      <div className="screw-tr"></div><div className="screw-bl"></div>
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-theme-ink pb-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={"/alex_avatar.png"}
                            alt={"Community Engineer"}
                            className="h-8 w-8 rounded-none border border-theme-ink"
                          />
                          <div>
                            <p className="text-xs uppercase font-medium tracking-wider text-theme-ink">
                              COMMUNITY ENGINEER
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 font-mono text-micro tabular-nums uppercase">
                          <span className="rounded-none recessed-meter px-2 py-0.5 text-theme-ink">
                            {chal.track}
                          </span>
                          <span className="rounded-none bg-[#1D1F23] border border-theme-ink px-2 py-0.5 text-theme-base">
                            {chal.difficulty}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h2 className="text-base font-bold uppercase tracking-wider text-theme-ink">
                          {chal.title}
                        </h2>
                        <p className="mt-1 text-xs text-theme-ink line-clamp-2 leading-relaxed">
                          {chal.manifest?.brief?.overview}
                        </p>
                      </div>

                      {chal.manifest?.brief?.requirements && chal.manifest.brief.requirements.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {chal.manifest.brief.requirements.slice(0, 2).map((c, idx) => (
                            <span
                              key={idx}
                              className="rounded-none recessed-meter px-2 py-0.5 text-micro font-mono tabular-nums text-theme-ink"
                            >
                              - {c}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-2 border-t border-theme-ink text-xs">
                        <span className="font-mono tabular-nums text-micro uppercase text-theme-ink flex items-center gap-1.5">
                          <span className="status-lens-mitigated inline-block w-2 h-2"></span>
                          EST: {chal.timeEstimateMinutes || 45} MINS
                        </span>

                        <button
                          onClick={() => onOpenChallenge(chal.id)}
                          className="tactile-btn-primary flex items-center gap-1.5 rounded-none px-3.5 py-1.5 text-xs uppercase font-medium tracking-wider text-theme-base"
                        >
                          <span>SOLVE SPEC</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeMode === "PRACTICE_SPECS" && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2 pb-2 select-none border-b border-theme-ink">
                <Filter className="h-3.5 w-3.5 text-theme-ink shrink-0 mr-1" />
                {topicsList.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTopic(t.id)}
                    className={`rounded-none px-3 py-1.5 text-xs uppercase font-medium tracking-wider shrink-0 transition border ${
                      selectedTopic === t.id
                        ? "bg-[#1D1F23] text-theme-base border-theme-ink"
                        : "bg-transparent text-theme-ink border-transparent hover:border-theme-ink"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              {practiceSpecs.filter(spec => selectedTopic === "ALL" || spec.track === selectedTopic).length === 0 ? (
                <EmptyState
                  title="NO PRACTICE SPECS FOUND"
                  description="CURATED PRACTICE SPECS ARE CURRENTLY BEING UPDATED."
                  icon={Inbox}
                />
              ) : (
                practiceSpecs.filter(spec => selectedTopic === "ALL" || spec.track === selectedTopic).map((spec, index) => (
                  <div
                    key={spec.id}
                    className={`rounded-none chassis-plate four-screws p-5 space-y-4 transition ${
                      selectedIndex === index 
                        ? "border-theme-ink ring-1 ring-theme-ink" 
                        : "border-theme-ink hover:bg-theme-base"
                    }`}
                  >
                  <div className="screw-tr"></div><div className="screw-bl"></div>
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-theme-ink pb-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-none bg-[#1D1F23] text-theme-base px-2 py-0.5 text-micro font-mono tabular-nums font-bold">
                        NAPSED PRACTICE SPEC
                      </span>
                      <span className="rounded-none recessed-meter px-2 py-0.5 text-micro font-mono tabular-nums text-theme-ink">
                        {spec.track}
                      </span>
                    </div>
                    <span className="font-mono tabular-nums text-micro text-theme-ink font-bold">
                      {spec.difficulty} // {spec.timeEstimateMinutes} MIN
                    </span>
                  </div>

                  <div>
                    <h2 className="text-base font-bold uppercase tracking-wider text-theme-ink">
                      {spec.title}
                    </h2>
                    <p className="mt-1.5 text-xs text-theme-ink leading-relaxed font-sans">
                      {spec.manifest?.brief?.overview}
                    </p>
                  </div>

                  <div className="rounded-none bg-theme-base p-3 border border-theme-ink space-y-1.5">
                    <p className="text-micro uppercase font-medium tracking-wider text-theme-ink">
                      CORE DESIGN OBJECTIVES:
                    </p>
                    <ul className="space-y-1 text-micro text-theme-ink font-sans">
                      {spec.manifest?.brief?.requirements?.map((c, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-theme-ink font-bold">-</span>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-end pt-2">
                    <button
                      onClick={() => onOpenChallenge(spec.id)}
                      className="tactile-btn-primary flex items-center gap-2 rounded-none px-4 py-2 text-xs uppercase font-medium tracking-wider text-theme-base"
                    >
                      <span>START PRACTICE SPEC</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
            </div>
          )}
        </section>

        {/* Right Telemetry & Profile Sidebar */}
        <aside className="space-y-5 lg:col-span-4">
          <div className="rounded-none chassis-plate four-screws p-5 space-y-4">
            <div className="screw-tr"></div><div className="screw-bl"></div>
            <div className="flex items-center gap-3">
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-10 w-10 rounded-none border border-theme-ink"
              />
              <div>
                <p className="text-sm font-bold uppercase tracking-wider text-theme-ink flex items-center gap-2">
                  {user.name}
                  <span className="status-lens-verified inline-block w-2.5 h-2.5"></span>
                </p>
                <p className="font-mono tabular-nums text-micro text-theme-ink">
                  @{user.githubUsername || user.username}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 border-t border-theme-ink pt-3 text-center text-micro uppercase font-medium tracking-wider text-theme-ink">
              <div className="rounded-none bg-theme-base p-2 border border-theme-ink">
                <span className="status-lens-mitigated inline-block mx-auto h-2 w-2 mt-0.5"></span>
                <span className="mt-1 block font-mono tabular-nums font-bold text-theme-ink">
                  {user.streakDays ?? 0}D
                </span>
                <span>STREAK</span>
              </div>
              <div className="rounded-none bg-theme-base p-2 border border-theme-ink">
                <span className="block mx-auto h-2 w-2 mt-0.5 border border-theme-ink rounded-none bg-theme-surface"></span>
                <span className="mt-1 block font-mono tabular-nums font-bold text-theme-ink">
                  {user.karmaPoints}
                </span>
                <span>KARMA</span>
              </div>
              <div className="rounded-none bg-theme-base p-2 border border-theme-ink">
                <span className="status-lens-verified inline-block mx-auto h-2 w-2 mt-0.5"></span>
                <span className="mt-1 block font-mono tabular-nums font-bold text-theme-ink">
                  {user.acceptanceRate}%
                </span>
                <span className="mt-1 block">ACCEPTED</span>
              </div>
            </div>
          </div>

          <div className="rounded-none chassis-plate four-screws p-5 space-y-3">
            <div className="screw-tr"></div><div className="screw-bl"></div>
            <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-theme-ink">
              <CheckSquare className="h-4 w-4 text-theme-ink" />
              <span>PEER AUDIT HUB</span>
            </h2>
            <p className="text-xs text-theme-ink leading-relaxed">
              REVIEW SUBMITTED TRADE-OFF DEFENSE WRITE-UPS TO VERIFY ARCHITECTURAL CONSENSUS.
            </p>
            <button
              onClick={onOpenAuditTerminal}
              className="tactile-btn-secondary w-full flex items-center justify-center gap-2 rounded-none py-2 text-xs uppercase font-medium tracking-wider text-theme-ink"
            >
              <span>LAUNCH AUDIT TERMINAL</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </aside>
      </div>
    </motion.div>
  );
};
