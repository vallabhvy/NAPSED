# Napsed architecture — audit and target

Last audited against the `devproof-app` tree. This is the gap analysis for the hybrid WASM / Judge0 / proof-card engine.

## What exists today

| Area | Status |
| --- | --- |
| Brand / TLD | `napsed.dev` in landing copy; some surfaces still say `napsed.com` or DevProof |
| Vite + React 19 studio | Works. Monaco + in-memory workspace + Blob JS worker |
| Spec types | `src/types/specs.ts` — now schema 1.1.0 |
| Spec git layout | `specs/practice`, `specs/challenges` (were empty; packages added) |
| JSON Schema | `specs/schema.json` (was 1.0.0 inlined files only) |
| JS/TS in-browser run | Isolated Blob worker, 5s timeout, virtual `require()` |
| Pyodide | **Stub** — regex-prints `print()` lines, claims success |
| Go/Rust/C++/Java | Were **fake COMPLETED**. Now return `NATIVE_REQUIRED` |
| Auth | GitHub OAuth via Supabase. Previously **hard-crashed** without keys |
| Mock mode | `isMockMode` in `src/lib/supabase.ts`; local catalog via Vite glob |
| Defense gate | Character count only. No keyword / diff / boilerplate check |
| Proof signing | SHA-256 described, not implemented. No closed `cloud/` tree |
| Judge0 broker | Missing (correctly — must not live in the client) |
| Preflight CI | `pnpm preflight:specs` local script; no GitHub Action yet |
| `ui/` package | Not extracted. Design system lives in `src/components` + `DESIGN.md` |
| `runner-wasm/` | Protocol + workers added; **not wired** into `useBrowserRunner` yet |

## Missing directories vs the blueprint

```
specs/                 PRESENT (packages now land here)
runner-wasm/           PRESENT (protocol; not the live runner)
ui/                    MISSING (still src/components)
cloud/                 ABSENT BY DESIGN (proprietary)
.github/workflows/     MISSING (schema + preflight CI)
docs/rfcs/             PRESENT (process only)
```

Do not add `cloud/` to this repo. The open core stops at a typed `NATIVE_REQUIRED` response.

## Worker bridge (target)

```
useBrowserRunner.runCode()
    │
    ├─ language in {js, ts}     → RunnerKind 'js-cjs'
    ├─ language in {py}          → RunnerKind 'pyodide'
    └─ language in {go,rs,c++}  → RunnerKind 'mock-native'
                                       │
                                       └─ production: POST /v1/execute
                                          (cloud broker, cookie session,
                                           never a VITE_JUDGE0_KEY)
```

Canonical types: `runner-wasm/src/protocol.ts` (`RunRequest` / `RunResponse`).  
Main-thread API: `RunnerBridge` in `runner-wasm/src/bridge.ts` — spawn, timeout, **terminate**.

Pyodide must `loadPyodide()` inside the worker and write files into MEMFS. Until that lands, the pyodide worker returns `RUNTIME_ERROR` rather than a fake pass.

## Manifest schema

- Draft-07: `specs/schema.json`
- TS: `SpecManifest` in `src/types/specs.ts`
- 1.0.0 manifests still hydrate via `normalizeManifest()`
- 1.1.0 requires `executionTier`, `verification`, `defenseGate.keywords`

Git is the source of truth for file bytes (`starter/`, `solution/`, `verification/`). `workspace.files` is a hydration artifact for Monaco.

## Defense gate (not done)

Client today: `defenseAnswer.trim().length >= minCharacters`.

Required before proofs:

1. Reject empty, whitespace, and repeated n-grams.
2. Require `defenseGate.keywords` (case-insensitive) against the **diff vs starter**, not just the essay.
3. Server re-check. The client gate is UX; the cloud broker is authority.

## Immediate five tasks

See the end of the README / the implementation note in the PR description. Tracked in-repo as:

1. Wire `runner-wasm` into `useBrowserRunner` (drop the inline Blob; real Pyodide).
2. Defense validator (keywords + diff overlap + boilerplate) in studio **and** a server stub interface.
3. GitHub Action: `preflight:specs` on every spec PR.
4. Extract Cashmere tokens + plates into `ui/` without breaking mock boot.
5. RFC for the Judge0 broker (`docs/rfcs/`) — do not implement the broker in this repo.
