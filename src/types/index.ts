export type Role = 'JUNIOR' | 'MID' | 'SENIOR' | 'STAFF' | 'TECH_LEAD';
import type { SpecManifest, SpecType, SpecTrack } from './specs';
export * from './specs';

export type DomainTrack =
  | 'CONCURRENCY'
  | 'DATA_STRUCTURES'
  | 'SYSTEM_DESIGN'
  | 'DEVOPS'
  | 'BACKEND'
  | 'SECURITY'
  | 'FRONTEND_PERF'
  | 'PERFORMANCE'
  | 'DISTRIBUTED_SYSTEMS'
  | 'DEVOPS_INFRA'
  | 'CLOUD_SECURITY'
  | 'BACKEND_PERFORMANCE'
  | 'FRONTEND_ARCHITECTURE'
  | 'DATA_ENGINEERING'
  | 'SYSTEMS_PROGRAMMING'
  | 'BLOCKCHAIN_CRYPTO'
  | 'AI_INFRA_MLOPS'
  | 'DATABASE_INTERNALS'
  | 'OBJECT_ORIENTED_DESIGN';

export interface GuildBadge {
  id: string;
  name: string;
  slug: DomainTrack;
  level: string;
  verifiedAt: string;
  auditedBy: string;
  iconName: string;
}

export interface GithubRepo {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  starsCount: number;
  forksCount: number;
  language: string | null;
  updatedAt: string;
  topics?: string[];
}

export interface UserProfile {
  id: string;
  githubId: string;
  githubUsername: string;
  username: string;
  name: string;
  avatarUrl: string;
  role: Role;
  bio: string;
  githubUrl: string;
  company?: string;
  location?: string;
  publicReposCount?: number;
  followersCount?: number;
  email?: string;
  websiteUrl?: string;
  streakDays: number;
  lastSubmissionDate?: string;
  karmaPoints: number;
  acceptanceRate: number;
  submissionsAudited: number;
  guildBadges: GuildBadge[];
  focusGuilds: DomainTrack[];
  dailyTargetMinutes: number;
}

export interface Spec {
  id: string;
  slug: string;
  specId: string;
  title: string;
  specType: SpecType;
  track: SpecTrack;
  difficulty: string;
  manifest: SpecManifest;
  createdAt: string;
}

export interface Submission {
  id: string;
  specId: string;
  specTitle: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: Role;
  codeFiles: Record<string, string>;
  defenseAnswer: string;
  submittedAt: string;
  status: 'PENDING_REVIEW' | 'VERIFIED' | 'NEEDS_REVISION';
  reviewsCount: number;
}

/** Public Proof Profile ledger entry (peer-audited credential). */
export interface ProofCredential {
  id: string;
  title: string;
  track: string;
  issuedAt: string;
  guildAudits: string;
  sealHash?: string;
  hasDefense?: boolean;
  executionVerified?: boolean;
}

export interface RubricScores {
  architecture: number; // 1-5
  edgeCases: number;    // 1-5
  defenseClarity: number; // 1-5
}

export interface PeerReview {
  id: string;
  submissionId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar: string;
  reviewerRole: Role;
  rubric: RubricScores;
  feedbackText: string;
  inlineComments: Array<{
    lineNumber: number;
    comment: string;
  }>;
  createdAt: string;
  upvotesCount: number;
}

export interface FeedItem {
  id: string;
  type: 'MICRO_BUILD' | 'SENIOR_SPEC' | 'JUNIOR_TIP' | 'VERIFIED_AUDIT';
  title: string;
  author: {
    name: string;
    avatar: string;
    role: Role;
  };
  track: DomainTrack;
  summary: string;
  codeSnippet?: string;
  language?: string;
  commentsCount: number;
  upvotes: number;
  timestamp: string;
}

// Dataset & License Catalog Types (dataset-metadata-architecture skill)
export interface LicenseRule {
  id: string;
  name: string;
  code: string;
  isProprietary: boolean;
  geoRestrictions: string[];
  userAccessScope: 'ALL' | 'INTERNAL_ONLY' | 'VERIFIED_AUDITORS' | 'SUBSCRIBERS';
  pricingTier: 'FREE' | 'TIER_1' | 'ENTERPRISE';
  termsUrl?: string;
}

export interface DatasetCatalogItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  fileType: string;
  sizeBytes: number;
  storageUri: string;
  domain: string;
  source: string;
  tags: string[];
  accessRules: 'PUBLIC' | 'RESTRICTED' | 'INTERNAL';
  customAttributes?: Record<string, any>;
  licenseId: string;
  license?: LicenseRule;
  uploaderId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TelemetryData {
  tick: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  errorRate: number;
  memoryMb: number;
  throughputRps: number;
}

export interface SimulationSpec {
  id: string;
  title: string;
  track: DomainTrack;
  slug: string;
  incidentScenario: string;
  starterWorkspaceId?: string;
  targetMetrics: {
    max_p99_ms: number;
    max_error_rate: number;
  };
  initialCode: string; // added to provide the brownfield setup
  createdAt: string;
}

export interface SimulationRun {
  id: string;
  specId: string;
  userId: string;
  initialP99Ms: number;
  resolvedP99Ms: number;
  simulatedSeed: string;
  timeToResolveSeconds: number;
  postMortemRca: string;
  postMortemTradeoffs: string;
  status: 'PENDING_AUDIT' | 'VERIFIED' | 'FAILED';
  createdAt: string;
}

export interface APIResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}
