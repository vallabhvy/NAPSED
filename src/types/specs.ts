export type SpecType = 'PRACTICE' | 'CHALLENGE';

/** schema 1.0.0 (legacy inlined workspaces) or 1.1.0 (hybrid packages). */
export type SpecSchemaVersion = '1.0.0' | '1.1.0';

/**
 * Execution routing. PRACTICE specs should be `wasm`.
 * CHALLENGE specs that need OS threads / sanitizers must be `native`.
 * Multi-container chaos topologies are `microvm` (not implemented).
 */
export type ExecutionTier = 'wasm' | 'native' | 'microvm';

export type RuntimeEnvironment =
  | 'node20'
  | 'browser-js'
  | 'pyodide'
  | 'go1.22'
  | 'python3.11'
  | 'rust1.76'
  | 'cpp20'
  | 'java21';

/**
 * Spec tracks. Includes guild tracks (`DomainTrack`) plus systems-authoring
 * tracks used by `specs/` packages (CONCURRENCY, DATA_STRUCTURES, SYSTEM_DESIGN).
 */
export type SpecTrack =
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

export interface WorkspaceFile {
  /** Path inside the Monaco workspace, no leading slash. e.g. `limiter.go` */
  path: string;
  /** If true, the candidate cannot edit (interfaces, visible tests). */
  readOnly: boolean;
  /** File contents. Git packages hydrate this from `starter/`. */
  content: string;
}

export interface VerificationConfig {
  /** Shell command executed in the sandbox. e.g. `go test -v -race ./...` */
  command: string;
  timeoutSeconds: number;
  maxMemoryMB: number;
  /** Enable Go `-race` / TSan / ASan. Ignored on WASM tiers. */
  raceDetector: boolean;
  compilerFlags?: string[];
  benchmarks?: {
    maxP99Ms: number;
    maxCpuSeconds?: number;
  };
  /** Package-relative path to the hidden harness. */
  hiddenHarnessPath?: string;
}

export interface DefenseGate {
  question: 'What did you do, and why did you do that?';
  placeholder: string;
  minCharacters: number;
  /**
   * Technical tokens that must appear in the defense *and* align with the
   * candidate's diff vs `starter/`. Required for schema 1.1.0.
   */
  keywords?: string[];
  rejectBoilerplate?: boolean;
}

export interface SpecPackageLayout {
  starterDir: 'starter';
  solutionDir: 'solution';
  verificationDir: 'verification';
}

export interface SpecManifest {
  schemaVersion: SpecSchemaVersion;
  specType: SpecType;
  specId: string;
  slug: string;
  title: string;
  track: SpecTrack;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedTimeToSolveMinutes: number;
  /** Routing key for the hybrid runtime. Defaults by runtime if omitted (1.0.0). */
  executionTier?: ExecutionTier;
  brief: {
    overview: string;
    requirements: string[];
    hintsOrConstraints: string[];
  };
  workspace: {
    runtime: RuntimeEnvironment;
    testCommand: string;
    /** File the visible ▶ RUN action should execute. */
    entrypoint?: string;
    files: WorkspaceFile[];
  };
  verification?: VerificationConfig;
  defenseGate: DefenseGate;
  package?: SpecPackageLayout;
}

const WASM_RUNTIMES: RuntimeEnvironment[] = ['node20', 'browser-js', 'pyodide', 'python3.11'];

export function inferExecutionTier(runtime: RuntimeEnvironment): ExecutionTier {
  if (WASM_RUNTIMES.includes(runtime)) return 'wasm';
  return 'native';
}

/** Fill 1.1.0 fields so 1.0.0 manifests still hydrate the studio. */
export function normalizeManifest(raw: SpecManifest): SpecManifest {
  const executionTier = raw.executionTier ?? inferExecutionTier(raw.workspace.runtime);
  return {
    ...raw,
    executionTier,
    verification: raw.verification ?? {
      command: raw.workspace.testCommand,
      timeoutSeconds: 10,
      maxMemoryMB: 128,
      raceDetector: raw.workspace.runtime === 'go1.22',
    },
    defenseGate: {
      ...raw.defenseGate,
      keywords: raw.defenseGate.keywords ?? [],
      rejectBoilerplate: raw.defenseGate.rejectBoilerplate ?? true,
    },
    package: raw.package ?? {
      starterDir: 'starter',
      solutionDir: 'solution',
      verificationDir: 'verification',
    },
  };
}
