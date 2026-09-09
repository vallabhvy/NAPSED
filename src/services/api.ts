import { isMockMode, supabase } from "../lib/supabase";
import { loadLocalSpecs } from "./specCatalog";
import type {
  Spec,
  FeedItem,
  UserProfile,
  DomainTrack,
  ProofCredential,
} from "../types";

/** Prefer snake_case migration tables; fall back to PascalCase legacy names. */
async function selectSubmissions(authorId: string) {
  const snake = await supabase
    .from("submissions")
    .select(
      `
      id,
      spec_id,
      status,
      reviews_count,
      consensus_seal_hash,
      defense_answer,
      submitted_at,
      spec:specs(title, track),
      peer_reviews(id, created_at)
    `,
    )
    .eq("author_id", authorId)
    .order("submitted_at", { ascending: false });

  if (!snake.error) return snake;

  return supabase
    .from("submissions")
    .select(
      `
      id,
      specId:spec_id,
      status,
      reviewsCount:reviews_count,
      consensusSealHash:consensus_seal_hash,
      defenseAnswer:defense_answer,
      submittedAt:submitted_at,
      spec:specs(title, track),
      reviews:PeerReview(id, createdAt)
    `,
    )
    .eq("userId", authorId)
    .order("submittedAt", { ascending: false });
}

function hasDefenseAnswers(answers: unknown): boolean {
  if (!answers) return false;
  if (typeof answers === "string") return answers.trim().length > 0;
  if (typeof answers === "object") {
    return Object.values(answers as Record<string, unknown>).some(
      (value) => typeof value === "string" && value.trim().length > 0,
    );
  }
  return false;
}

function isCredentialRow(row: Record<string, unknown>): boolean {
  const status = String(row.status ?? "");
  const reviews =
    Number(row.reviews_count ?? row.reviewsCount ?? 0) ||
    (Array.isArray(row.peer_reviews) ? row.peer_reviews.length : 0) ||
    (Array.isArray(row.reviews) ? row.reviews.length : 0);
  const seal = row.consensus_seal_hash ?? row.consensusSealHash;
  const defense = row.defense_answer ?? row.defenseAnswers;

  if (!hasDefenseAnswers(defense)) return false;
  return status === "VERIFIED" || reviews >= 2 || Boolean(seal);
}

/**
 * Public Proof Profile ledger: verified multi-file builds with defense + guild audits.
 */
export async function fetchProofCredentials(
  authorId: string,
): Promise<ProofCredential[]> {
  if (!authorId) return [];

  try {
    const { data, error } = await selectSubmissions(authorId);
    if (error || !data?.length) {
      if (error) console.warn("fetchProofCredentials:", error.message);
      return [];
    }

    // Optional: mark builds that also completed an in-browser execution run
    const { data: workspaces } = await supabase
      .from("workspaces")
      .select("id, challenge_id, execution_runs(status)")
      .eq("owner_id", authorId);

    const completedByChallenge = new Set<string>();
    for (const ws of workspaces ?? []) {
      const runs = (ws as { execution_runs?: Array<{ status: string }> })
        .execution_runs;
      const challengeId = (ws as { challenge_id?: string }).challenge_id;
      if (
        challengeId &&
        runs?.some((run) => run.status === "COMPLETED")
      ) {
        completedByChallenge.add(challengeId);
      }
    }

    const mappedSubmissions = (data as Record<string, unknown>[])
      .filter(isCredentialRow)
      .map((row) => {
        const reviews = (row.peer_reviews ?? row.reviews ?? []) as Array<{
          id: string;
          created_at?: string;
          createdAt?: string;
        }>;
        const reviewCount =
          Number(row.reviews_count ?? row.reviewsCount ?? reviews.length) ||
          reviews.length;
        const spec = (row.spec ?? row.challenge ?? {}) as {
          title?: string;
          track?: string;
        };
        const issuedCandidates = reviews
          .map((r) => r.created_at || r.createdAt)
          .filter(Boolean) as string[];
        const submittedAt = String(row.submitted_at ?? row.submittedAt ?? "");
        const issuedAt =
          issuedCandidates.sort().at(-1) || submittedAt || new Date().toISOString();

        const guildN = Math.min(reviewCount, 2);
        const challengeId = String(
          (row as { spec_id?: string; challenge_id?: string; challengeId?: string }).spec_id ??
            (row as { challenge_id?: string; challengeId?: string }).challenge_id ??
            (row as { challengeId?: string }).challengeId ??
            "",
        );
        const ranOk = challengeId
          ? completedByChallenge.has(challengeId)
          : false;

        return {
          id: String(row.id),
          title: spec.title || "Verified architecture build",
          track: spec.track || "BACKEND",
          issuedAt,
          guildAudits: `${guildN}/2`,
          sealHash: String(row.consensus_seal_hash ?? row.consensusSealHash ?? ""),
          hasDefense: true,
          executionVerified: ranOk,
        } satisfies ProofCredential;
      });

    // Also fetch completed SimulationRuns as Proof Credentials
    let simulationCredentials: ProofCredential[] = [];
    try {
      const simRuns = await getSimulationRuns(authorId);
      simulationCredentials = simRuns.map((run: any) => ({
        id: String(run.id),
        title: run.spec?.title || "Incident Resolution",
        track: run.spec?.track || "DISTRIBUTED_SYSTEMS",
        issuedAt: String(run.createdAt),
        guildAudits: "N/A", // Replaced with simulated checks
        sealHash: `sim_seal_${run.id.slice(0,8)}`,
        hasDefense: true,
        executionVerified: true,
      })) as ProofCredential[];
    } catch (e) {
      console.warn("Could not fetch simulation runs for proof card", e);
    }

    return [...mappedSubmissions, ...simulationCredentials].sort(
      (a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime()
    );
  } catch (err) {
    console.warn("fetchProofCredentials error:", err);
    return [];
  }
}

/**
 * Creates a clean default user profile with zero mock history
 */
export function createDefaultUserProfile(githubUsername = ""): UserProfile {
  return {
    id: `user_${Date.now()}`,
    githubId: githubUsername,
    githubUsername: githubUsername,
    username: githubUsername || "engineer",
    name: githubUsername || "Napsed Engineer",
    avatarUrl: "/alex_avatar.png",
    role: "SENIOR",
    bio: "Peer-audited systems engineer. Trade-offs defended on Napsed.",
    githubUrl: githubUsername
      ? `https://github.com/${githubUsername}`
      : "https://github.com",
    streakDays: 0,
    karmaPoints: 0,
    acceptanceRate: 100,
    submissionsAudited: 0,
    focusGuilds: ["BACKEND", "DEVOPS"],
    dailyTargetMinutes: 30,
    guildBadges: [],
  };
}

export async function getSpecs(): Promise<Spec[]> {
  if (isMockMode) {
    return loadLocalSpecs();
  }

  try {
    const { data, error } = await supabase.from('specs').select('*');
    if (error || !data || data.length === 0) {
      if (error) console.warn("Postgres getSpecs error:", error.message);
      return loadLocalSpecs();
    }
    return data.map((d: any) => ({
      id: d.id,
      slug: d.slug,
      specId: d.spec_id,
      title: d.title,
      specType: d.spec_type,
      track: d.track,
      difficulty: d.difficulty,
      manifest: d.manifest,
      createdAt: d.created_at
    }));
  } catch (err) {
    console.warn("Postgres getSpecs error:", err);
    return loadLocalSpecs();
  }
}

export async function getFeedItems(): Promise<FeedItem[]> {
  return [];
}

/**
 * Fetch all engineering guilds from Supabase Postgres
 */
export async function getGuilds(): Promise<
  Array<{
    id: string;
    name: string;
    slug: DomainTrack;
    description: string;
    icon: string;
    verifiedCount: number;
    challengesCount: number;
    verifiers: string[];
  }>
> {
  try {
    const { data, error } = await supabase.from("Guild").select("*");
    if (error || !data || data.length === 0) {
      return [];
    }
    return data.map((g: any) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      description: g.description,
      icon: g.iconName || "Shield",
      verifiedCount: g.memberCount || 0,
      challengesCount: g.totalKarma || 0, // Mocking challenges count using karma
      verifiers: g.verifiers || [],
    }));
  } catch (err) {
    console.warn("Postgres getGuilds error:", err);
    return [];
  }
}

/**
 * Fetch pending audit queue submissions from Supabase Postgres
 */
export async function getPendingAuditSubmissions(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from("submissions")
      .select(
        "*, author:User(id, name, role), spec:specs(title, track)",
      )
      .eq("status", "PENDING_REVIEW");

    if (error || !data || data.length === 0) {
      return [];
    }

    return data.map((item: any) => ({
      id: item.id,
      title: item.spec?.title || "Peer Submission Audit",
      track: item.spec?.track || "BACKEND",
      authorName: item.author?.name || "Peer Engineer",
      authorRole: item.author?.role || "SENIOR",
      authorAvatar: item.author?.avatarUrl || "/alex_avatar.png",
      submittedAt: new Date(item.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      timeEstimate: "10 min review",
      codeFiles: item.code_files,
      defenseAnswer: item.defense_answer || "",
    }));
  } catch (err) {
    console.warn("Postgres getPendingAuditSubmissions error:", err);
    return [];
  }
}

/**
 * Submit solution and written architectural defense to Supabase Postgres
 */
export async function submitChallengeSolution(payload: {
  challengeId: string;
  authorId: string;
  codeFiles: Record<string, string>;
  defenseAnswer: string;
}): Promise<boolean> {
  const rowSnake = {
    id: crypto.randomUUID(),
    spec_id: payload.challengeId,
    user_id: payload.authorId,
    code_files: payload.codeFiles,
    defense_answer: payload.defenseAnswer,
    status: "PENDING_REVIEW",
    created_at: new Date().toISOString(),
  };

  try {
    const { error } = await supabase.from("submissions").insert(rowSnake);
    if (error) {
      console.warn("Database error:", error.message);
    }
    return true;
  } catch (err) {
    console.warn("Database submission error:", err);
    return true;
  }
}

/**
 * Submit peer audit review & rubric scores.
 * Prefers atomic RPC `record_guild_audit` (seals at 2 reviews); falls back to insert.
 */
export async function submitPeerReview(payload: {
  submissionId: string;
  reviewerId: string;
  architectureRating: number;
  edgeCasesRating: number;
  defenseClarityRating: number;
  feedbackText: string;
  inlineComments: Array<{ lineNumber: number; comment: string }>;
}): Promise<{ sealed: boolean; reviewsCount: number }> {
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "record_guild_audit",
      {
        p_submission_id: payload.submissionId,
        p_architecture_rating: payload.architectureRating,
        p_edge_cases_rating: payload.edgeCasesRating,
        p_defense_clarity_rating: payload.defenseClarityRating,
        p_feedback_text: payload.feedbackText,
        p_inline_comments: payload.inlineComments,
      },
    );

    if (!rpcError && rpcData) {
      const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
      return {
        sealed: Boolean(row?.sealed),
        reviewsCount: Number(row?.reviews_count ?? 0),
      };
    }

    if (rpcError) {
      console.warn("record_guild_audit RPC unavailable, falling back:", rpcError.message);
    }

    const { error } = await supabase.from("peer_reviews").insert({
      id: crypto.randomUUID(),
      submission_id: payload.submissionId,
      reviewer_id: payload.reviewerId,
      architecture_rating: payload.architectureRating,
      edge_cases_rating: payload.edgeCasesRating,
      defense_clarity_rating: payload.defenseClarityRating,
      overall_score:
        (payload.architectureRating +
          payload.edgeCasesRating +
          payload.defenseClarityRating) /
        3,
      feedback_text: payload.feedbackText,
      inline_comments: payload.inlineComments,
      created_at: new Date().toISOString(),
    });

    if (error) {
      // Legacy PascalCase fallback
      const { error: pascalErr } = await supabase.from("PeerReview").insert({
        id: crypto.randomUUID(),
        submissionId: payload.submissionId,
        reviewerId: payload.reviewerId,
        architectureRating: payload.architectureRating,
        edgeCasesRating: payload.edgeCasesRating,
        defenseClarityRating: payload.defenseClarityRating,
        feedbackText: payload.feedbackText,
        inlineComments: payload.inlineComments,
        createdAt: new Date().toISOString(),
      });
      if (pascalErr) console.warn("Database review error:", pascalErr.message);
    }

    // Best-effort consensus bump when RPC is missing
    const { count } = await supabase
      .from("peer_reviews")
      .select("id", { count: "exact", head: true })
      .eq("submission_id", payload.submissionId);

    const reviewsCount = count ?? 0;
    if (reviewsCount >= 2) {
      await supabase
        .from("submissions")
        .update({
          reviews_count: reviewsCount,
          status: "VERIFIED",
          consensus_seal_hash: `napsed_seal_${payload.submissionId}_${reviewsCount}`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", payload.submissionId);
    }

    return { sealed: reviewsCount >= 2, reviewsCount };
  } catch (err) {
    console.warn("Database review error:", err);
    return { sealed: false, reviewsCount: 0 };
  }
}
/**
 * Sync authenticated GitHub user to the User table (called once on login)
 */
export async function syncUserToDb(profile: UserProfile) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("User")
    .upsert(
      {
        id: profile.id,
        name: profile.name,
        username: profile.githubUsername || profile.username,
        email: profile.email || `${profile.githubUsername}@users.noreply.github.com`,
        githubId: profile.githubId,
        githubUrl: profile.githubUrl,
        role: profile.role || "SENIOR",
        avatarUrl: profile.avatarUrl,
        bio: profile.bio,
        createdAt: now,
        updatedAt: now,
      },
      { onConflict: "id" },
    );
  if (error) console.warn("syncUserToDb error:", error);
}

/**
 * Publish a new Spec or Tip to the Feed via Supabase JS
 */
export async function publishChallenge(payload: any, authorId: string) {
  try {
    if (payload.type === "SPEC") {
      // 1. Insert Spec
      const challengeId = crypto.randomUUID();
      const slug =
        payload.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") +
        "-" +
        Date.now();
        
      const manifest = {
        schemaVersion: '1.0.0',
        specType: payload.specType || 'CHALLENGE',
        specId: slug,
        slug,
        title: payload.title,
        track: payload.track,
        difficulty: payload.difficulty,
        estimatedTimeToSolveMinutes: 45,
        brief: {
          overview: payload.context,
          requirements: payload.constraints,
          hintsOrConstraints: payload.edgeCases || []
        },
        workspace: {
          runtime: 'node20',
          testCommand: 'npm test',
          files: [{ path: 'solution.ts', readOnly: false, content: payload.initialCode }]
        },
        defenseGate: {
          question: "What did you do, and why did you do that?",
          placeholder: "Explain your reasoning...",
          minCharacters: 50
        }
      };

      const { data: challenge, error: challengeErr } = await supabase
        .from("specs")
        .insert({
          id: challengeId,
          slug,
          spec_id: slug,
          title: payload.title,
          spec_type: manifest.specType,
          track: payload.track,
          difficulty: payload.difficulty,
          manifest,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (challengeErr) throw challengeErr;

      // 3. Insert Feed Item
      await supabase.from("FeedItem").insert({
        id: crypto.randomUUID(),
        type: "SENIOR_SPEC",
        title: payload.title,
        summary: payload.context.substring(0, 150) + "...",
        track: payload.track,
        authorId,
        createdAt: new Date().toISOString(),
      });

      return challenge;
    } else {
      // Insert Tip Feed Item
      const { data: tip, error } = await supabase
        .from("FeedItem")
        .insert({
          id: crypto.randomUUID(),
          type: "JUNIOR_TIP",
          title: payload.title,
          summary: payload.summary,
          codeSnippet: payload.codeSnippet,
          track: payload.track,
          authorId,
          createdAt: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return tip;
    }
  } catch (err) {
    console.error("publishChallenge error:", err);
    throw err;
  }
}

export async function getSimulationSpecs(): Promise<any[]> {
  return [];
}

export async function getSimulationRuns(userId: string): Promise<any[]> {
  return [];
}

/**
 * Submit a completed simulation run
 */
export async function submitSimulationRun(payload: {
  specId: string;
  userId: string;
  initialP99Ms: number;
  resolvedP99Ms: number;
  simulatedSeed: string;
  timeToResolveSeconds: number;
  postMortemRca: string;
  postMortemTradeoffs: string;
}): Promise<boolean> {
  try {
    const { error } = await supabase.from("SimulationRun").insert({
      id: crypto.randomUUID(),
      ...payload,
      status: "PENDING_AUDIT",
      createdAt: new Date().toISOString(),
    });
    if (error) {
       console.warn("submitSimulationRun error:", error);
       return false;
    }
    return true;
  } catch (err) {
    console.warn("submitSimulationRun error:", err);
    return false;
  }
}
