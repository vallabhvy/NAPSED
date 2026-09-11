# Contributing to Napsed

Thank you for your interest in contributing to Napsed! This document explains our architecture, how to develop locally with zero cloud dependencies, the contribution workflows, and our pull request contract.

---

## Table of Contents

1. [The 60-Second Rule: Zero Cloud Keys](#1-the-60-second-rule-zero-cloud-keys)
2. [Database, Migrations & Auth FAQ](#2-database-migrations--auth-faq)
   - [Do I connect to the production database?](#do-i-connect-to-the-production-database)
   - [Do I use the maintainer's GitHub OAuth?](#do-i-use-the-maintainers-github-oauth)
   - [How does authentication work in development?](#how-does-authentication-work-in-development)
3. [Step-by-Step Getting Started](#3-step-by-step-getting-started)
4. [Contribution Tracks](#4-contribution-tracks)
   - [Track A: Authoring Specs (Challenges & Practice)](#track-a-authoring-specs)
   - [Track B: UI / Cashmere & Concrete Design](#track-b-ui--cashmere--concrete-design)
   - [Track C: Runner WASM Protocol (`runner-wasm/`)](#track-c-runner-wasm-protocol)
   - [Track D: Database & Migrations (Advanced)](#track-d-database--migrations-advanced)
5. [Code Style & Conventions](#5-code-style--conventions)
6. [Pre-flight & Verification](#6-pre-flight--verification)
7. [RFC Process (Architectural Changes)](#7-rfc-process-architectural-changes)
8. [Pull Request Checklist](#8-pull-request-checklist)

---

## 1. The 60-Second Rule: Zero Cloud Keys

**You do NOT need Supabase credentials, Judge0 API keys, or cloud access to develop on Napsed.**

The application boots by default in **Mock Mode**:
- Specs are loaded directly from the filesystem (`specs/practice/` and `specs/challenges/`) via Vite glob.
- Tier 1 execution runs in-browser using Web Worker sandboxes (JS CommonJS and Pyodide WASM).
- Authentication is automatically mocked with a default Senior Engineer profile.
- You can test, build, and debug 95% of features immediately after cloning.

```bash
git clone https://github.com/<your-username>/napsed.git
cd napsed
pnpm install
pnpm dev
```

Open `http://localhost:5173`. The app is fully unlocked.

---

## 2. Database, Migrations & Auth FAQ

### Do I connect to the production database?
**No, never.** Production database credentials are kept strictly private for security, privacy, and integrity. External contributors never connect to the live database.

- **For UI, Specs, and WASM work (Default):** You do not need any database. The app runs in Mock Mode (`VITE_MOCK_MODE=true`).
- **For Backend & Database schema work:** You run a local isolated Postgres database on your machine via Docker using the Supabase CLI:
  ```bash
  npx supabase start
  ```
  This creates a local Postgres instance on port `54322` and local Supabase Studio on port `54323`.

### Do I use the maintainer's GitHub OAuth?
**No. You cannot and should not use the maintainer's GitHub OAuth credentials.**

GitHub OAuth applications enforce strict `Homepage URL` and `Authorization Callback URL` constraints (e.g. `https://napsed.com` or `https://<prod>.supabase.co/auth/v1/callback`). GitHub rejects requests from unauthorized domains or local ports using those credentials.

- **In Mock Mode (Default):** GitHub OAuth is completely bypassed. You are automatically logged in as a mock senior user.
- **If you are testing OAuth locally:** You can create your own free OAuth App under your personal GitHub account (**Settings → Developer Settings → OAuth Apps**) with callback `http://127.0.0.1:54321/auth/v1/callback` and plug it into your local Supabase instance.

### How does authentication work in development?
In `src/lib/supabase.ts`, Napsed checks if cloud environment variables are present:
```typescript
export const isMockMode =
  import.meta.env.VITE_MOCK_MODE === "true" || urlMissing || keyMissing;
```
If keys are omitted or `VITE_MOCK_MODE=true`, authentication is simulated in memory. No network calls leave your machine.

---

## 3. Step-by-Step Getting Started

### Prerequisites
- **Node.js**: `20.x` or later
- **pnpm**: `9.x` or later (`corepack enable && corepack use pnpm@latest`)
- **Go**: `1.22+` (optional; only needed if running race preflights on native Go challenge specs)
- **Docker**: (optional; only needed if running local Supabase for database schema work)

### Setup Steps
1. **Fork the repository** on GitHub: [https://github.com/napsed/napsed](https://github.com/napsed/napsed)
2. **Clone your fork:**
   ```bash
   git clone https://github.com/<your-username>/napsed.git
   cd napsed
   git remote add upstream https://github.com/napsed/napsed.git
   ```
3. **Install dependencies:**
   ```bash
   pnpm install
   ```
4. **Start the development server:**
   ```bash
   pnpm dev
   ```
5. **Create a topic branch:**
   ```bash
   git checkout -b feat/my-new-spec
   ```

---

## 4. Contribution Tracks

### Track A: Authoring Specs

Authoring challenge and practice specs is the primary way to contribute to Napsed.

#### Directory Layout
Every spec lives in `specs/practice/<id>/` (Tier 1 WASM) or `specs/challenges/<id>/` (Tier 2 Native).

```
<spec-id>/
├── manifest.json       # validates against specs/schema.json
├── README.md           # candidate problem brief
├── starter/            # candidate initial workspace (must FAIL verification)
├── solution/           # reference solution overlay (must PASS verification)
└── verification/       # hidden tests (never sent to candidate editor)
```

#### `manifest.json` Contract (Schema `1.1.0`)
- `schemaVersion`: `"1.1.0"`.
- `specId`: Matches directory name (`prac-*` or `chal-*` or `sys-*`).
- `executionTier`: `"wasm"` for JS/Python; `"native"` for Go/Rust.
- `defenseGate`:
  - `question`: Exactly `"What did you do, and why did you do that?"`
  - `minCharacters`: `≥ 60`
  - `keywords`: Essential architectural concepts a real fix mentions (e.g., `["mutex", "atomic", "lock-free"]`).
- TypeScript interface: `SpecManifest` in `src/types/specs.ts`.

#### WASM Code Constraints (Tier 1)
The browser JS worker runs in an isolated CommonJS sandbox. Follow these rules to prevent worker crashes:
- No JSX / TSX inside candidate files.
- Use CommonJS (`module.exports` and `require('./file.js')`).
- Avoid template literals in test harnesses (they collide with the worker wrapper).
- Candidate entry file must live in `starter/` without `_test` in the filename.

#### The Pre-Flight Gate
Every spec must pass pre-flight before merging:
1. `starter/` + `verification/` **must FAIL** (verifies false-positive prevention).
2. `solution/` + `verification/` **must PASS** 100% (verifies solution correctness).

```bash
# Run preflight on all specs
pnpm preflight:specs

# Run preflight on a specific spec
pnpm preflight:specs -- sys-042-token-bucket-limiter
```

---

### Track B: UI / Cashmere & Concrete Design

Napsed follows a strict Dieter Rams / Braun industrial design system: **Cashmere & Concrete**.

Before touching components, read [`DESIGN.md`](./DESIGN.md).

- **Colors:**
  - Chassis plate: Cashmere `#E6E2DD`
  - Recessed meter: Concrete `#D8D3CC`
  - Ink: Instrument Charcoal `#1D1F23`
  - Lenses: Emerald `#10B981` (verified), Amber `#F59E0B` (contention), Rust `#DC2626` (panic/race only).
- **Geometry:** `rounded-none` on all structural plates and buttons.
- **Elevation:** No floating blur shadows. Depth is achieved via crisp borders (`1px solid #1D1F23`) and recessed wells.
- **Typography:** Inter for headings and body; JetBrains Mono strictly for code, metrics, timestamps, and hashes.
- **Badges:** Uppercase industrial faceplates (`SPEC // SYS-042`), never bubbly marketing pills.

---

### Track C: Runner WASM Protocol (`runner-wasm/`)

The worker protocol isolates code execution from the main thread.
- Worker protocol: `runner-wasm/src/protocol.ts` (`RunRequest`, `RunResponse`).
- Bridge: `runner-wasm/src/bridge.ts` (`RunnerBridge`).
- Never `eval()` candidate code on the main UI thread.
- Timeouts must strictly abort workers to protect the browser.

---

### Track D: Database & Migrations (Advanced)

If you are modifying database schema or adding new database tables:

1. **Start local Supabase:**
   ```bash
   npx supabase start
   ```
2. **Apply migrations:**
   ```bash
   npx supabase migration up
   ```
3. **Create a new migration:**
   ```bash
   npx supabase migration new <descriptive_name>
   ```
   Add your SQL statements to the newly created file in `supabase/migrations/`.
4. **Update Prisma schema (if applicable):**
   Update `prisma/schema.prisma` to keep ORM models synchronized with the SQL migration.
5. **Never commit secrets:** Never commit your local `.env` file or cloud service keys.

---

## 5. Code Style & Conventions

- **TypeScript:** Strict mode enabled. Use explicit typing and `import type` for type imports.
- **Formatting & Linting:**
  ```bash
  pnpm lint
  ```
  We use `oxlint` for high-speed, zero-noise linting.
- **No Cloud Calls on Mock Path:** Any new API call in `src/services/` must check `isMockMode` and fall back to local mock data.
- **Branch Naming:**
  - `feat/<short-description>`
  - `fix/<short-description>`
  - `spec/<spec-id>`
  - `docs/<short-description>`

---

## 6. Pre-flight & Verification

Before opening a pull request, verify that your changes pass all local quality checks:

```bash
# 1. Verify spec harnesses (starter fails, solution passes)
pnpm preflight:specs

# 2. Run fast linter
pnpm lint

# 3. Verify TypeScript build
pnpm build
```

---

## 7. RFC Process (Architectural Changes)

Architectural changes require an RFC before implementation:
- New execution tier (e.g., MicroVM architecture)
- Breaking changes to `specs/schema.json`
- Changes to proof signing or hashing algorithms
- Modifying defense-gate validation semantics

**RFC Workflow:**
1. Copy `docs/rfcs/0000-template.md` to `docs/rfcs/NNNN-<title>.md`.
2. Open a Pull Request containing **only** the RFC document.
3. Discuss and iterate with maintainers until accepted.
4. Open a second PR implementing the accepted RFC.

---

## 8. Pull Request Checklist

When submitting a pull request, ensure:

- [ ] My code runs under `pnpm dev` with zero cloud credentials (Mock Mode intact).
- [ ] `pnpm lint` passes with zero errors or warnings.
- [ ] `pnpm build` succeeds.
- [ ] **If submitting a spec:**
  - [ ] Directory name matches `specId`.
  - [ ] `manifest.json` conforms to `specs/schema.json` (schema 1.1.0).
  - [ ] `pnpm preflight:specs -- <specId>` passes (starter fails, solution passes).
  - [ ] Defense keywords reflect genuine architectural mechanisms.
- [ ] **If submitting UI changes:**
  - [ ] Complies with `DESIGN.md` (Cashmere & Concrete palette, `rounded-none`, no decorative gradients).
  - [ ] Tested in the browser across standard viewports.
