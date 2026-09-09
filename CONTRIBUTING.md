# Contributing to Napsed

Napsed is open-core. This document is the contract for a pull request. If a change is not listed as in-scope below, open an RFC first (`docs/rfcs/`).

## Where contributions are accepted

| Path | PRs accepted | Notes |
| --- | --- | --- |
| `specs/practice/**` | yes | Tier 1 WASM. Must run in the in-browser worker. |
| `specs/challenges/**` | yes | Tier 2 native packages. CI preflight still required. |
| `runner-wasm/**` | yes | Worker protocol, isolation, timeouts. No secrets. |
| `src/components/**`, `DESIGN.md` | yes | Braun / Cashmere & Concrete UI. |
| `src/types/specs.ts`, `specs/schema.json` | yes | Schema changes need an RFC if they break 1.1.0. |
| `cloud/` | **no** | Not in this repository. Judge0 keys, signing, proof DB. |
| Judge0 API keys in `VITE_*` | **never** | Instant reject. |

Local `pnpm dev` must keep working with **zero** cloud keys. Do not add a mandatory `VITE_SUPABASE_*` or Judge0 lookup to the boot path.

---

## Spec authoring contract

Every spec is a directory under `specs/practice/<id>/` or `specs/challenges/<id>/`.

```
<spec-id>/
├── manifest.json       # validates against specs/schema.json
├── README.md           # human brief
├── starter/            # Monaco payload (hydrate fills workspace.files)
├── solution/           # reference overlay
└── verification/      # hidden tests
```

### `manifest.json`

- `schemaVersion` must be `"1.1.0"`.
- `specId` matches the directory name (`prac-*`, `chal-*`, or `sys-*`).
- `executionTier`: `wasm` for practice JS/Python; `native` for Go/Rust/C++/Java.
- `workspace.files` may be `[]` in git. `scripts/hydrate-specs.mjs` and `src/services/specCatalog.ts` inline `starter/`.
- `defenseGate.question` is exactly: `What did you do, and why did you do that?`
- `defenseGate.minCharacters` ≥ 60. `keywords` must be terms a real fix would mention.
- TypeScript source of truth: `SpecManifest` in `src/types/specs.ts`.

### WASM (Tier 1) code rules

The current JS worker is a CommonJS eval sandbox. These will crash the worker:

- JSX / TSX
- `import` / `export` (use `module.exports` / `require('./file.js')`)
- Template literals in test files (they collide with the worker wrapper)
- `const` / `let` in tests if you can avoid them — prefer `var` + `function`

The first hydrated **editable** file is the tab that opens. Put the candidate's work file in `starter/` without `_test` in the name.

### Pre-flight (false-positive gate)

A spec cannot merge unless:

1. `starter/` + `verification/` **fails** (tests or `-race`).
2. `solution/` overlay + `verification/` **passes** 100%, race-clean.

```bash
pnpm preflight:specs
pnpm preflight:specs -- sys-042-token-bucket-limiter
```

If Go is not installed, native race preflight is skipped with a warning. Do not merge a `go1.22` spec without a green native run on CI.

### Example

Reference package: `specs/challenges/sys-042-token-bucket-limiter` (Go race).  
WASM counterpart for mock-mode: `specs/practice/prac-041-token-bucket-js`.

---

## UI: Cashmere & Concrete

Read `DESIGN.md` before touching chrome.

- Chassis: cashmere `#E6E2DD`, concrete `#D8D3CC`, ink `#1D1F23`.
- Lenses: emerald `#10B981` (verified), amber `#F59E0B` (contention). Rust/red only for panics and races.
- `rounded-none` on structural plates. No hover shadows. No decorative gradients.
- Inter for UI. JetBrains Mono only for telemetry, paths, hashes, code.
- Labels are uppercase faceplates (`SPEC // SYS-042`), not marketing chips.

If a PR restyles a surface, verify the flow in the browser (open, run, fail, fix, defend) — a screenshot is not a test.

---

## Code style

- TypeScript strict as configured. Prefer `import type` (verbatim syntax).
- No new cloud client calls on the mock-mode path (`src/lib/supabase.ts` `isMockMode`).
- Do not eval candidate code on the main thread. Workers only.
- Oxlint: `pnpm lint`.

---

## RFC process

Architectural changes (new execution tier, manifest breaking field, defense-gate semantics, proof hashing) require an RFC:

1. Copy `docs/rfcs/0000-template.md` to `docs/rfcs/NNNN-short-title.md`.
2. Open a PR with the RFC only. No implementation in that PR.
3. After maintainers accept, a second PR implements it.

In-scope without RFC: new spec packages that already fit schema 1.1.0, worker bugfixes, design-token-faithful UI fixes.

---

## PR checklist (specs)

- [ ] Directory name == `specId`
- [ ] `manifest.json` validates against `specs/schema.json`
- [ ] `starter/` fails hidden verification
- [ ] `solution/` passes hidden verification (and `-race` if `raceDetector: true`)
- [ ] Defense keywords appear in the reference solution's diff in spirit (mutex, not "I used AI")
- [ ] WASM specs run under `pnpm dev` with the test file as entrypoint
