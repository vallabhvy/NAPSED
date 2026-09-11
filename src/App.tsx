import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import type { UserProfile, Spec, Submission, Role, FeedItem } from "./types";
import { isMockMode, supabase } from "./lib/supabase";
import { getAndClearRolePreference, signOutUser } from "./services/auth";
import {
  getSpecs,
  getFeedItems,
  submitChallengeSolution,
  submitPeerReview,
  createDefaultUserProfile,
  publishChallenge,
  syncUserToDb,
} from "./services/api";
import { Navbar } from "./components/layout/Navbar";
import { CommandPalette } from "./components/layout/CommandPalette";
import { NotificationsDrawer } from "./components/layout/NotificationsDrawer";
import { LandingView } from "./components/features/LandingView";
import { AuthView } from "./components/features/AuthView";
import { OnboardingView } from "./components/features/OnboardingView";
import { FeedView } from "./components/features/FeedView";
import { ChallengeStudioView } from "./components/features/ChallengeStudioView";
import { AuditTerminalView } from "./components/features/AuditTerminalView";
import { GuildMatrixView } from "./components/features/GuildMatrixView";
import { PortfolioView } from "./components/features/PortfolioView";
import { SettingsView } from "./components/features/SettingsView";
import { SpecWriterView } from "./components/features/SpecWriterView";
import { RecruiterPortalView } from "./components/features/RecruiterPortalView";
import { SimulationStudioView } from "./components/features/SimulationStudioView";
import { PublicProofView } from "./components/features/PublicProofView";
import { ProtocolBackground } from "./components/ui/ProtocolBackground";
import type { SimulationSpec } from "./types";

function parseInitialRoute(): { tab: string; proofHandle: string | null } {
  if (typeof window === "undefined") {
    return { tab: "landing", proofHandle: null };
  }
  const pathname = window.location.pathname;
  const match = pathname.match(/^\/@([a-zA-Z0-9_\-\.]+)/);
  if (match) {
    return { tab: "proof", proofHandle: match[1] };
  }
  return { tab: "landing", proofHandle: null };
}

const PUBLIC_TABS = new Set(["landing", "auth", "proof"]);

export function App() {
  const [user, setUser] = useState<UserProfile>(() => createDefaultUserProfile());

  // Session is null until Supabase confirms a real GitHub OAuth session
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(isMockMode);
  
  const initialRoute = parseInitialRoute();
  const [currentTab, setCurrentTab] = useState<string>(initialRoute.tab);
  const [proofHandle, setProofHandle] = useState<string | null>(initialRoute.proofHandle);
  const appUnlocked = !!session || isMockMode;

  // Build a UserProfile from a Supabase session (shared by both auth handlers)
  const handleAuthSession = (
    supaSession: any,
    shouldSyncToDb: boolean,
    role: Role = "SENIOR",
  ) => {
    const supaUser = supaSession.user;
    const meta = supaUser.user_metadata;
    const githubUsername =
      meta?.preferred_username || meta?.user_name || "github_user";
    const githubAvatar =
      meta?.avatar_url || meta?.picture || "/alex_avatar.png";
    const githubFullName = meta?.full_name || meta?.name || githubUsername;

    const profile: Partial<UserProfile> = {
      id: supaUser.id,
      githubId: supaUser.id,
      githubUsername,
      username: githubUsername,
      name: githubFullName,
      avatarUrl: githubAvatar,
      githubUrl: meta?.html_url || `https://github.com/${githubUsername}`,
      bio: meta?.bio || undefined,
      company: meta?.company || undefined,
      location: meta?.location || undefined,
      publicReposCount: meta?.public_repos,
      followersCount: meta?.followers,
      email: supaUser.email || undefined,
      websiteUrl: meta?.blog || meta?.website || undefined,
      role,
    };

    setUser((prev) => ({ ...prev, ...profile } as UserProfile));

    setSession(supaSession);
    if (currentTab !== "proof") {
      setCurrentTab("feed");
    }

    // Only sync to DB on first sign-in, not on page reloads or token refreshes
    if (shouldSyncToDb) {
      syncUserToDb({ ...createDefaultUserProfile(), ...profile } as UserProfile);
    }
  };

  // Listen for browser popstate (back/forward button) to support direct @handle URLs
  useEffect(() => {
    const handlePopState = () => {
      const route = parseInitialRoute();
      if (route.tab === "proof" && route.proofHandle) {
        setProofHandle(route.proofHandle);
        setCurrentTab("proof");
      } else {
        setProofHandle(null);
        setCurrentTab(session || isMockMode ? "feed" : "landing");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [session]);

  // Listen for Supabase GitHub OAuth Authentication state changes
  useEffect(() => {
    if (isMockMode) {
      setIsAuthChecked(true);
      return;
    }

    // Check for existing Supabase session on mount
    const restoreSession = async () => {
      const { data: { session: existingSession } } = await supabase.auth.getSession();

      if (existingSession) {
        const { data, error } = await supabase.auth.getClaims();
        if (!error && data?.claims?.sub === existingSession.user.id) {
          handleAuthSession(existingSession, false);
        } else {
          await supabase.auth.signOut({ scope: "local" });
        }
      }

      setIsAuthChecked(true);
    };

    void restoreSession();

    // Listen for future auth state changes (login, logout, token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, supaSession) => {
        if (event === "SIGNED_OUT") {
          setSession(null);
          if (currentTab !== "proof") {
            setCurrentTab("landing");
          }
          return;
        }

        if (supaSession?.user) {
          // Only sync to DB on actual sign-in, not token refreshes
          handleAuthSession(
            supaSession,
            event === "SIGNED_IN",
            event === "SIGNED_IN" ? getAndClearRolePreference() : "SENIOR",
          );
        }
      },
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const [challenges, setChallenges] = useState<Spec[]>([]);
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  const fetchData = async () => {
    setIsLoadingData(true);
    const [cData, fData] = await Promise.all([getSpecs(), getFeedItems()]);
    setChallenges(cData);
    setFeedItems(fData);
    setIsLoadingData(false);
  };

  useEffect(() => {
    if (!session && !isMockMode) {
      setChallenges([]);
      setFeedItems([]);
      setIsLoadingData(false);
      return;
    }

    void fetchData();
  }, [session]);

  const [selectedChallengeId, setSelectedChallengeId] = useState<string>("");
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] =
    useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] =
    useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleLogout = () => {
    signOutUser().catch((err) => console.warn("Supabase sign out error:", err));
    setSession(null);
    showToast("Logged out.");
    setCurrentTab("landing");
  };

  const defaultSimulationSpec: SimulationSpec = {
    id: "sim_1",
    title: "Incident Triage: 504 Memory Pressure",
    track: "DISTRIBUTED_SYSTEMS",
    slug: "incident-triage-504",
    incidentScenario: "The event consumer service is throwing 504 Gateway Timeouts under memory pressure. The P99 latency has spiked due to synchronous locking in the request pipeline. Your goal is to rewrite the consumer to use an asynchronous actor-based ring buffer or cache to alleviate the locks.",
    targetMetrics: {
      max_p99_ms: 45,
      max_error_rate: 0.0
    },
    initialCode: "class EventConsumer {\n  private events = [];\n  private lock = false;\n\n  async process(db, req) {\n    while(this.lock) { /* wait */ }\n    this.lock = true;\n    // slow DB query simulating lock contention\n    const res = await new Promise(r => setTimeout(r, db.queryTime));\n    this.events.push(req);\n    this.lock = false;\n    return res;\n  }\n}",
    createdAt: new Date().toISOString()
  };

  const fallbackChallenge: Spec = {
    id: "empty_chal",
    title: "No Challenge Found",
    slug: "empty-chal",
    specId: "empty-chal",
    specType: "CHALLENGE",
    track: "BACKEND",
    difficulty: "EASY",
    manifest: {
      schemaVersion: "1.0.0",
      specType: "CHALLENGE",
      specId: "empty-chal",
      slug: "empty-chal",
      title: "No Challenge Found",
      track: "BACKEND",
      difficulty: "BEGINNER",
      estimatedTimeToSolveMinutes: 0,
      brief: { overview: "", requirements: [], hintsOrConstraints: [] },
      workspace: { runtime: "node20", testCommand: "", files: [] },
      defenseGate: { question: "What did you do, and why did you do that?", placeholder: "", minCharacters: 0 }
    },
    createdAt: new Date().toISOString(),
  };

  const allAvailableChallenges = challenges;

  const selectedChallenge =
    allAvailableChallenges.find((c) => c.id === selectedChallengeId) ||
    allAvailableChallenges[0] ||
    fallbackChallenge;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const navigateToProof = (handle: string) => {
    const clean = handle.replace(/^@/, "");
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", `/@${clean}`);
    }
    setProofHandle(clean);
    setCurrentTab("proof");
  };

  const navigateToHome = () => {
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/@")) {
      window.history.pushState(null, "", "/");
    }
    setProofHandle(null);
    setCurrentTab(appUnlocked ? "feed" : "landing");
  };

  const handleSelectTab = (nextTab: string) => {
    if (!appUnlocked && !PUBLIC_TABS.has(nextTab)) {
      setCurrentTab("auth");
      return;
    }

    if (nextTab !== "proof" && typeof window !== "undefined" && window.location.pathname.startsWith("/@")) {
      window.history.pushState(null, "", "/");
    }

    setCurrentTab(nextTab);
  };

  const handleToggleRole = () => {
    const nextRole: Role = user.role === "SENIOR" ? "JUNIOR" : "SENIOR";
    setUser({ ...user, role: nextRole });
    showToast(`Role switched to ${nextRole} Mode`);
  };

  const handleOpenChallenge = (challengeId: string) => {
    // If it's a simulation trigger (e.g. from CommandPalette or special link), open simulation
    if (challengeId === "sim_1") {
      setCurrentTab("simulation");
      return;
    }
    setSelectedChallengeId(challengeId);
    setCurrentTab("challenge");
  };

  const handleSubmitSolution = (submission: Partial<Submission>) => {
    submitChallengeSolution({
      challengeId: selectedChallenge.id,
      authorId: user.id,
      codeFiles: (submission.codeFiles as Record<string, string>) || {},
      defenseAnswer: submission.defenseAnswer || "",
    });

    const todayStr = new Date().toISOString().split('T')[0];

    setUser((prev) => {
      let nextStreak = prev.streakDays;
      const lastDate = prev.lastSubmissionDate;

      if (!lastDate) {
        nextStreak = 1;
      } else if (lastDate !== todayStr) {
        const lastTime = new Date(lastDate).getTime();
        const todayTime = new Date(todayStr).getTime();
        const diffDays = Math.round((todayTime - lastTime) / (1000 * 3600 * 24));

        if (diffDays === 1) {
          nextStreak = prev.streakDays + 1;
        } else if (diffDays > 1) {
          nextStreak = 1;
        }
      }

      return {
        ...prev,
        streakDays: nextStreak,
        lastSubmissionDate: todayStr,
        karmaPoints: prev.karmaPoints + 50,
      };
    });

    showToast("Solution & Architectural Defense submitted! +50 Karma earned.");
    setCurrentTab("audit");
  };

  const handleApprovePeerReview = async () => {
    const result = await submitPeerReview({
      submissionId: "sub_queue_1",
      reviewerId: user.id,
      architectureRating: 5,
      edgeCasesRating: 4,
      defenseClarityRating: 5,
      feedbackText: "Flawless defense & atomic state machine execution.",
      inlineComments: [{ lineNumber: 14, comment: "Good backoff multiplier." }],
    });
    setUser((prev) => ({
      ...prev,
      karmaPoints: prev.karmaPoints + 25,
      submissionsAudited: prev.submissionsAudited + 1,
    }));
    showToast(
      result.sealed
        ? "Guild consensus reached — Proof Credential sealed. +25 Review Karma."
        : `Peer audit recorded (${result.reviewsCount}/2). +25 Review Karma.`,
    );
    setCurrentTab("portfolio");
  };

  const handlePublishSpec = async (payload: any) => {
    try {
      await publishChallenge(payload, user.id);
      
      setUser((prev) => ({
        ...prev,
        karmaPoints: prev.karmaPoints + (payload.type === 'SPEC' ? 100 : 50),
      }));
      showToast(`${payload.type === 'SPEC' ? 'Micro-Spec' : 'Micro-Teaching Tip'} Published to Feed!`);
      // Fetch latest data from database to reflect the newly published item
      await fetchData();
      
      setCurrentTab("feed");
    } catch (err: any) {
      showToast(`Error publishing: ${err.message}`);
    }
  };

  const handleUpdateUser = (updated: Partial<UserProfile>) => {
    setUser({ ...user, ...updated });
    showToast("User profile settings saved.");
  };

  return (
    <div className="min-h-screen bg-charcoal-950 text-beige flex flex-col relative overflow-hidden">
      {/* Cashmere & Concrete — Neutral Protocol atmosphere */}
      <ProtocolBackground />
      {/* Top Streamlined Navbar with 5 Dedicated Pillars (Visible only when authenticated and not on landing or proof page) */}
      {appUnlocked && currentTab !== "landing" && currentTab !== "proof" && (
        <Navbar
          user={user}
          currentTab={currentTab}
          onSelectTab={handleSelectTab}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onLogout={handleLogout}
          pendingAuditCount={0}
        />
      )}

      {/* Cmd+K Global Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={handleSelectTab}
        onToggleRole={handleToggleRole}
        currentRole={user.role}
      />

      {/* Slide-over Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Floating Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 rounded-xl border border-slate bg-charcoal-card px-4 py-3 text-xs font-semibold text-cream">
          {toastMessage}
        </div>
      )}

      {/* Active Screen View Router */}
      <main className="flex-1 relative z-10">
        {!isAuthChecked ? (
          <div className="min-h-[85vh] flex items-center justify-center font-mono text-sm text-greige">
            Verifying secure session…
          </div>
        ) : currentTab === "landing" ? (
          <LandingView
            onStart={() => handleSelectTab(appUnlocked ? "feed" : "auth")}
            onExplorePortfolio={() => navigateToProof("alex_r")}
            isAuthenticated={appUnlocked}
          />
        ) : currentTab === "proof" ? (
          <PublicProofView
            handle={proofHandle || "alex_r"}
            onNavigateHome={navigateToHome}
            onEnterSandbox={() => {
              if (appUnlocked) {
                setCurrentTab("feed");
              } else {
                setCurrentTab("auth");
              }
            }}
            isAuthenticated={appUnlocked}
          />
        ) : (!appUnlocked && !PUBLIC_TABS.has(currentTab)) || currentTab === "auth" ? (
          <AuthView />
        ) : (
          <>
            {currentTab === "onboarding" && (
              <OnboardingView onComplete={() => handleSelectTab("feed")} />
            )}

            {currentTab === "feed" && (
              <FeedView
                user={user}
                feedItems={feedItems}
                challenges={challenges}
                isLoading={isLoadingData}
                activeMode="MAIN_FEED"
                onOpenChallenge={handleOpenChallenge}
                onOpenAuditTerminal={() => handleSelectTab("audit")}
                onOpenPortfolio={() => handleSelectTab("portfolio")}
                onOpenSpecWriter={() => handleSelectTab("spec-writer")}
              />
            )}

            {currentTab === "challenge-specs" && (
              <FeedView
                user={user}
                feedItems={feedItems}
                challenges={challenges}
                isLoading={isLoadingData}
                activeMode="CHALLENGE_SPECS"
                onOpenChallenge={handleOpenChallenge}
                onOpenAuditTerminal={() => handleSelectTab("audit")}
                onOpenPortfolio={() => handleSelectTab("portfolio")}
                onOpenSpecWriter={() => handleSelectTab("spec-writer")}
              />
            )}

            {currentTab === "practice" && (
              <FeedView
                user={user}
                feedItems={feedItems}
                challenges={challenges}
                isLoading={isLoadingData}
                activeMode="PRACTICE_SPECS"
                onOpenChallenge={handleOpenChallenge}
                onOpenAuditTerminal={() => handleSelectTab("audit")}
                onOpenPortfolio={() => handleSelectTab("portfolio")}
                onOpenSpecWriter={() => handleSelectTab("spec-writer")}
              />
            )}
            {currentTab === "challenge" && (
              <ChallengeStudioView
                challenges={allAvailableChallenges}
                challenge={selectedChallenge}
                onSubmit={handleSubmitSolution}
                onBack={() => handleSelectTab("feed")}
              />
            )}

            {currentTab === "audit" && (
              <AuditTerminalView
                onApproveReview={handleApprovePeerReview}
                onBack={() => handleSelectTab("feed")}
              />
            )}

            {currentTab === "simulation" && (
              <SimulationStudioView
                spec={defaultSimulationSpec}
                user={user}
                onBack={() => handleSelectTab("feed")}
              />
            )}

            {currentTab === "guilds" && (
              <GuildMatrixView challenges={challenges} onOpenChallenge={handleOpenChallenge} />
            )}

            {currentTab === "spec-writer" && (
              <SpecWriterView onPublishSpec={handlePublishSpec} />
            )}

            {currentTab === "recruiter" && <RecruiterPortalView />}

            {currentTab === "portfolio" && (
              <PortfolioView user={user} onUpdateUser={handleUpdateUser} />
            )}

            {currentTab === "settings" && (
              <SettingsView user={user} onUpdateUser={handleUpdateUser} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
