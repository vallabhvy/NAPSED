# Napsed Verification Architecture

## Overview
This skill documents the complete three-tier verification pipeline, spec authoring system, and WASM/Judge0/MicroVM routing decisions for Napsed.

## Three-Tier Verification Pipeline

### Tier 1: Functional Correctness (Deterministic Test Suite)
- **Hidden Test Injections:** On "Submit", the runner swaps in a hidden test suite with boundary checks, malformed inputs, and edge cases.
- **Property-Based Testing (Fuzzing):** Random pseudo-arbitrary inputs to ensure state machines don't desynchronize or panic.
- **Exit Code Verification:** Must terminate with exit code `0`. Any uncaught panic, unhandled rejection, or segfault fails verification.

### Tier 2: Systems Correctness (Concurrency, Resources & Race Conditions)
- **Race Detection:** Go `-race`, Rust/C++ `-fsanitize=thread` / `-fsanitize=address`. Fails even if all assertions passed.
- **Resource Ceiling Enforcement:** Memory allocation ceilings, strict CPU limits (max 2s), kills busy loops/spinlocks.
- **Simulated Contention & P99 Bounds:** 100+ concurrent workers, P99 latency must stay under spec manifest target.

### Tier 3: The Defense Gate (Human/Intent Verification)
```
[ RUNNER: TESTS PASS ] ──► [ RACE: CLEAN ] ──► [ DEFENSE GATE ]
                                                     │
                                                     ▼
                                      "What did you do, and why did you do that?"
```
- **Minimum Length & Semantic Filtering:** Rejects superficial answers.
- **Diff Context Match:** Compares written response against actual code diff.
- **Public Immutable Proof:** Code diff + defense answer saved on proof card (`napsed.com/@handle`).

---

## Spec Authoring & Scaling

### Directory Structure (Git-Driven)
```
specs/
├── sys-042-lru-cache-concurrency/
│   ├── manifest.json       # Metadata, difficulty, hints, runtime targets
│   ├── README.md           # Candidate brief & requirements
│   ├── starter/            # Visible files copied to Monaco on load
│   │   ├── cache.go
│   │   └── cache_test.go   # Basic tests candidate can run freely
│   ├── solution/           # Reference implementation (gold standard)
│   └── verification/       # Hidden tests, stress tests & benchmarks
│       └── verify_test.go
```

### Declarative manifest.json
```json
{
  "slug": "sys-042-lru-cache-concurrency",
  "track": "CONCURRENCY",
  "runtime": "judge0-go1.22",
  "verification": {
    "command": "go test -v -race -run=TestVerification ./...",
    "timeoutSeconds": 10,
    "maxMemoryMB": 128,
    "benchmarks": { "maxP99Ms": 15.0 }
  },
  "defenseGate": {
    "minCharacters": 60,
    "keywords": ["RWMutex", "eviction", "race", "O(1)"]
  }
}
```

### CI/CD Ingestion
GitHub Action validates schema → bundles into compressed JSON → upserts into Supabase `specs` table.

### Pre-Flight (Reference Check)
Before publishing, CI runs `solution/` against `verification/` suite. If reference solution doesn't pass 100% with clean thread safety, spec cannot be published.

---

## Execution Routing Rules

### Use In-Browser WASM ($0 Cost)
- Algorithms & DSA (DP, trees, graphs, sorting, geometry, probabilistic structures)
- In-Memory Engines (DuckDB WASM, SQLite WASM, custom AST parsers, state machines)
- Pure Logic & Refactoring (OOP refactors, single-threaded async, queue math)
- Cryptographic Primitives (Hashing, AES, RSA, HMAC)
- Microcontroller / CPU Emulators
- Configuration Parsing & Linting
- Consensus Algorithm State Machines (Raft/Paxos as message-passing)

### Use Judge0 ($0.0013 per Run)
- Compiler-Enforced Multi-Threading (Go `-race`, Rust thread concurrency)
- Low-Level Native Diagnostics (AddressSanitizer, strict OS memory ceilings)
- Native POSIX Operations (Signals, process exits, raw sockets)
- Strict Big-O Wall-Clock Benchmarks
- Headless UI Snapshot Testing

### Use Multi-Container MicroVMs (Future Tier)
- Distributed Topology (Network partitions, real Kafka/Postgres failovers)
- eBPF, real Docker builds
- Linux kernel features (epoll, io_uring, seccomp)

---

## Judge0 for UI Specs

### Pattern 1: Judge0 as Compiler/Bundler (Preferred)
User writes code → Judge0 runs `esbuild` → returns bundled JS string → frontend renders in sandboxed `<iframe srcDoc={...}>`.

### Pattern 2: Server-Side Rendering to HTML String
Backend templating code → Judge0 renders template → prints raw HTML to stdout → frontend displays via `srcdoc`.

### Pattern 3: Headless Visual Snapshot
Judge0 runs headless browser → takes screenshot → returns base64 → frontend renders image.

---

## Implementation Pipeline Code Reference

```tsx
async function verifySolution(submission: UserSubmission, spec: SpecManifest) {
  // Step 1: Run hidden test suite in sandbox (WASM or Judge0)
  const testRun = await runSandboxedExecution({
    userFiles: submission.files,
    testHarness: spec.hiddenTests,
    flags: spec.workspace.compilerFlags
  });

  if (testRun.exitCode !== 0) {
    return { status: "FAILED", reason: "TEST_FAILURE", logs: testRun.stderr };
  }

  // Step 2: Telemetry verification (P99 / Latency bounds)
  if (spec.performanceTarget && testRun.p99LatencyMs > spec.performanceTarget.maxP99Ms) {
    return { status: "FAILED", reason: "PERFORMANCE_REGRESSION", p99: testRun.p99LatencyMs };
  }

  // Step 3: Defense gate validation
  if (!submission.defenseAnswer || submission.defenseAnswer.trim().length < spec.defenseGate.minCharacters) {
    return { status: "PENDING_DEFENSE", reason: "DEFENSE_REQUIRED" };
  }

  // Step 4: Issue Verified Credential
  return {
    status: "VERIFIED",
    proofId: generateCryptoHash(submission),
    metrics: { p99: testRun.p99LatencyMs, durationMs: testRun.durationMs }
  };
}
```

## Structured Test Output Format
```json
{
  "passed": 8,
  "failed": 0,
  "raceConditionDetected": false,
  "durationMs": 412,
  "p99Ms": 4.2
}
```

## Proof Signing
`SHA256(Spec ID + User ID + Code Diff + Test Output JSON + Defense Text)` → recorded in Supabase, displayed on public proof card.
