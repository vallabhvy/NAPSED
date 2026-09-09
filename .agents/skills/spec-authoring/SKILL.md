---
name: spec-authoring
description: >
  End-to-end guide for authoring, inserting, and verifying a Napsed spec that
  users can actually solve in-browser. Covers the database schema, the manifest
  JSON contract, the WASM Web Worker execution engine, the frontend hydration
  pipeline, the defense gate, and critical gotchas discovered through production
  debugging.
---

# Spec Authoring & Solving Pipeline

This skill documents the **complete, working pipeline** for making a Napsed spec
solvable — from inserting data into Supabase through to the user clicking "Run"
and seeing test results in the browser terminal.

---

## 1. Database Layer

### Table: `specs`

| Column      | Type       | Description                                           |
| ----------- | ---------- | ----------------------------------------------------- |
| `id`        | `uuid`     | Auto-generated primary key.                           |
| `slug`      | `text`     | URL-safe identifier, unique. e.g. `"react-infinite-scroll"` |
| `spec_id`   | `text`     | Human ID. e.g. `"prac-react-infinitescroll"`, unique. |
| `title`     | `text`     | Display title shown in the feed and studio.           |
| `spec_type` | `text`     | `"PRACTICE"` or `"CHALLENGE"`.                        |
| `track`     | `text`     | Guild track. Must match `DomainTrack` union in `src/types/index.ts`. |
| `difficulty`| `text`     | `"BEGINNER"`, `"INTERMEDIATE"`, or `"ADVANCED"`.      |
| `manifest`  | `jsonb`    | The full `SpecManifest` JSON (see §2).                |
| `created_at`| `timestamp`| Auto-set on insert.                                   |

### Row Level Security (RLS)

The `specs` table has RLS enabled. A **read policy** must exist or the frontend
(using the anon/publishable key) will silently receive zero rows:

```sql
CREATE POLICY "Enable read access for all users"
  ON specs FOR SELECT USING (true);
```

> **CRITICAL**: If you insert specs and the frontend shows "NO SPECS FOUND",
> the first thing to check is whether a SELECT RLS policy exists. Use the
> direct Postgres connection (`DIRECT_URL` from `.env`) to query:
> ```sql
> SELECT * FROM pg_policies WHERE tablename = 'specs';
> ```

### Writing to the Database

The **anon key cannot UPDATE or INSERT** (no write policy). Always use the
**direct Postgres connection** for mutations:

```javascript
import pg from 'pg';
const client = new pg.Client({ connectionString: process.env.DIRECT_URL });
await client.connect();

await client.query(
  `INSERT INTO specs (slug, spec_id, title, spec_type, track, difficulty, manifest)
   VALUES ($1, $2, $3, $4, $5, $6, $7)`,
  [slug, specId, title, specType, track, difficulty, JSON.stringify(manifest)]
);
```

---

## 2. The SpecManifest JSON Contract

The `manifest` column is the single source of truth for everything the frontend
needs to hydrate a solvable spec. Its shape must conform to `SpecManifest` in
[`src/types/specs.ts`](file:///c:/Users/valla/Desktop/devproof-app/src/types/specs.ts).

### Full Schema

```typescript
interface SpecManifest {
  schemaVersion: '1.0.0';
  specType: 'PRACTICE' | 'CHALLENGE';
  specId: string;        // e.g. "prac-react-infinitescroll"
  slug: string;          // e.g. "react-infinite-scroll"
  title: string;
  track: DomainTrack;    // Must match src/types/index.ts union
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  estimatedTimeToSolveMinutes: number;

  brief: {
    overview: string;              // Shown in the left sidebar
    requirements: string[];        // Bullet list of what to implement
    hintsOrConstraints: string[];  // Revealable hints (PRACTICE) or constraints (CHALLENGE)
  };

  workspace: {
    runtime: RuntimeEnvironment;   // e.g. 'node20'
    testCommand: string;           // e.g. 'node test.ts'
    files: WorkspaceFile[];        // The actual code files (see §3)
  };

  defenseGate: {
    question: "What did you do, and why did you do that?";
    placeholder: string;           // Textarea placeholder text
    minCharacters: number;         // Minimum defense length (e.g. 60)
  };
}
```

### `DomainTrack` Values

The `track` field on **both** the top-level DB column and inside the manifest
must be one of the values in the `DomainTrack` union type defined in
[`src/types/index.ts`](file:///c:/Users/valla/Desktop/devproof-app/src/types/index.ts):

```
DEVOPS | BACKEND | SECURITY | FRONTEND_PERF | PERFORMANCE |
DISTRIBUTED_SYSTEMS | DEVOPS_INFRA | CLOUD_SECURITY |
BACKEND_PERFORMANCE | FRONTEND_ARCHITECTURE | DATA_ENGINEERING |
SYSTEMS_PROGRAMMING | BLOCKCHAIN_CRYPTO | AI_INFRA_MLOPS |
DATABASE_INTERNALS | OBJECT_ORIENTED_DESIGN
```

If you add a new track, add it to this union type **first** or TypeScript will
reject it.

---

## 3. Workspace Files — The Critical Contract

The `workspace.files[]` array defines **every file** that loads into Monaco when
the user opens the sandbox. This is where 90% of spec authoring mistakes happen.

### WorkspaceFile Shape

```typescript
interface WorkspaceFile {
  path: string;       // e.g. "src/pagination.ts"
  readOnly: boolean;  // true = user cannot edit (test files, interfaces)
  content: string;    // The full file content as a string
}
```

### Rules That Will Break Things If Violated

1. **No JSX/TSX in WASM specs.**
   The browser runner strips basic TypeScript types via regex but does NOT
   transpile JSX. If your file contains `<div>` or `<Component />`, the Web
   Worker will throw a `SyntaxError`. Use pure TypeScript/JavaScript only.

2. **Use `module.exports` / `require()`, NOT `import`/`export`.**
   The WASM runner wraps each file in a CommonJS-style
   `(function(require, module, exports) { ... })` closure. ES module syntax
   (`import`/`export`) will not work. Use:
   ```javascript
   // In solution file:
   class PaginationEngine { ... }
   if (typeof module !== 'undefined') {
     module.exports = { PaginationEngine };
   }

   // In test file:
   var PaginationEngine = require('./pagination.ts').PaginationEngine;
   ```

3. **Paths must be relative with `./` prefix.**
   `require('./pagination.ts')` ✓
   `require('pagination.ts')` ✗ (treated as external module, will fail)

4. **The first file in the array is auto-opened in the editor tab.**
   Put the solution file first (the one the user will edit), test file second.

5. **File paths are prefixed with `/` by the frontend.**
   The `ChallengeStudioView` at line 282 adds a leading `/` if missing:
   ```typescript
   path: f.path.startsWith("/") ? f.path : `/${f.path}`,
   ```
   So `"src/pagination.ts"` becomes `"/src/pagination.ts"` in the workspace.

6. **The `require()` resolver tries multiple extensions.**
   It checks: exact match → `.ts` → `.js` → `.tsx` → `.jsx`.
   So `require('./pagination')` will find `/src/pagination.ts`.

---

## 4. The WASM Execution Pipeline

When the user clicks **▶ RUN** in the terminal, the following chain executes:

```
XTermConsole.onRun()
  → MultiFileIDE.runCode()
    → useBrowserRunner.runCode()
      → executeJavaScriptTypeScript(nodes, entryNode)
```

### Source: [`useBrowserRunner.ts`](file:///c:/Users/valla/Desktop/devproof-app/src/services/execution/useBrowserRunner.ts)

### Step-by-step:

#### Step 1: Determine the Entrypoint
```
1. Use the currently active tab's file (activeNodeId)
2. Fallback: explicit entrypointPath argument
3. Fallback: first .ts/.js/.py/.cpp file in workspace
```

The user must have the **test file tab active** when they click Run, or the
runner will execute the solution file directly (which has no test assertions).

#### Step 2: Build the Virtual Filesystem
```typescript
const fileMap: Record<string, string> = {};
nodes.filter(n => n.kind === 'file').forEach(n => {
  fileMap[n.path] = stripTypeAnnotations(n.content || '');
});
```

All workspace files are collected into a `{ path → code }` map. Basic
TypeScript type annotations are stripped via regex so the code runs as plain JS.

#### Step 3: Spawn the Web Worker
A Blob URL worker is created with:
- Custom `console.log` / `console.error` that capture to stdout/stderr arrays
- A virtual `require()` function backed by the `fileMap`
- An `eval()`-based module loader with `(function(require, module, exports) { ... })` wrapping

#### Step 4: Module Resolution Inside the Worker
```
require('./pagination.ts')
  → resolvePath('/src/test.ts', './pagination.ts')
  → '/src/pagination.ts'
  → lookup in fileMap
  → wrap in (function(require, module, exports) { <code> })
  → eval() and execute
  → cache in moduleCache
  → return module.exports
```

#### Step 5: Execute and Return Results
The entrypoint is wrapped in an `async` IIFE so `await` works at the top level.
Stdout/stderr are joined with `\n` and posted back to the main thread.

### Execution Limits
- **5-second timeout** — kills the worker and returns `TIME_LIMIT`
- **Single-threaded** — no real Web Workers inside the worker
- **No network access** — `fetch()` is unavailable inside the worker
- **No DOM** — `document`, `window` are undefined

---

## 5. Frontend Hydration Chain

### How specs go from database → rendered sandbox:

```
App.tsx (useEffect on mount)
  → getSpecs()                                    // src/services/api.ts:207
    → supabase.from('specs').select('*')          // Anon key, RLS must allow SELECT
    → maps rows to Spec[] type
  → setChallenges(specs)                          // state in App.tsx

FeedView.tsx
  → filters challenges by specType === 'PRACTICE'
  → renders spec cards with "Open Sandbox" buttons

ChallengeStudioView.tsx
  → startSandbox(spec) sets activeChallenge
  → Passes manifest.workspace.files to MultiFileIDE as initialFiles
  → Each file gets { path: "/src/foo.ts", content: "...", language: "typescript" }

MultiFileIDE.tsx (useEffect)
  → calls initInMemoryWorkspace(name, initialFiles)

workspaceStore.ts → initInMemoryWorkspace()
  → Creates a local sandbox workspace with mock ID
  → Converts initialFiles into WorkspaceNode[] with unique IDs
  → Auto-opens the first file as the active editor tab
  → Sets activeNodeId to the first file's node ID
```

### Defense Gate Hydration

The sidebar in `ChallengeStudioView` reads `manifest.defenseGate`:
- Renders the defense question
- Tracks character count vs `minCharacters`
- Submit button is disabled until defense is valid
- On submit, collects `{ specId, codeFiles, defenseAnswer }` from all workspace nodes

---

## 6. Writing Spec Code That Actually Works

### Template: Solution File

```javascript
// src/solution.ts
// ─── [Title] ────────────────────────────────────────────
// [Brief instructions as comments]
//
// Your job:
//   1. [Method 1] — [description]
//   2. [Method 2] — [description]

class MySolution {
  constructor(config) {
    // TODO: initialize state
  }

  methodOne() {
    // TODO
  }

  methodTwo() {
    // TODO
    return [];
  }
}

// ─── DO NOT MODIFY BELOW THIS LINE ──────────────────────
if (typeof module !== 'undefined') {
  module.exports = { MySolution };
}
```

### Template: Test File

```javascript
// src/test.ts (readOnly: true)
// ─── Visible Practice Tests ─────────────────────────────

var MySolution = require('./solution.ts').MySolution;

// Use var instead of const/let for maximum compatibility.
// Avoid arrow functions in test files — use function declarations.
// Avoid template literals — use string concatenation.

async function runTests() {
  var passed = 0;
  var failed = 0;

  function assert(condition, label) {
    if (condition) {
      console.log("  ✓ " + label);
      passed++;
    } else {
      console.log("  ✗ FAIL: " + label);
      failed++;
    }
  }

  console.log("─── Practice Test Suite ───────────────────");

  // Test 1: ...
  console.log("Test 1: Initial State");
  var instance = new MySolution({});
  assert(instance.methodTwo().length === 0, "Should start empty");

  // ... more tests ...

  console.log("");
  console.log("─── Results: " + passed + " passed, " + failed + " failed ───");

  if (failed > 0) {
    console.error("VERIFICATION: FAILED");
  } else {
    console.log("VERIFICATION: ALL TESTS PASSED");
  }
}

runTests();
```

### Why These Patterns?

| Pattern | Reason |
|---------|--------|
| `var` over `const`/`let` | Avoids TDZ issues in the eval()-wrapped module scope |
| `function()` over `() =>` | Arrow functions can have subtle `this` binding issues inside eval |
| String concatenation over template literals | Template literal backticks can conflict with the outer template literal in the worker source |
| `require('./file.ts')` with full extension | The resolver checks exact match first, then appends extensions — explicit is safer |
| `module.exports = { Class }` | The CommonJS wrapper provides `module` and `exports` — this is the only export mechanism |

---

## 7. Checklist: Adding a New Spec

- [ ] **Author the manifest** following the schema in §2
- [ ] **Write the solution file** using `module.exports` (no `import`/`export`)
- [ ] **Write the test file** using `require()` and `var` declarations
- [ ] **Test locally** by pasting the code into a Node.js REPL to verify it runs
- [ ] **Add the track** to `DomainTrack` union in `src/types/index.ts` if it's new
- [ ] **Insert via direct Postgres** (`DIRECT_URL`), not the anon key
- [ ] **Verify RLS** — run a SELECT via the anon key to confirm the spec is readable
- [ ] **Verify in UI** — open the feed, click the spec, open sandbox, run the test file
- [ ] **Test the defense gate** — write 60+ characters and verify the submit button unlocks

---

## 8. Debugging Common Failures

| Symptom | Root Cause | Fix |
|---------|-----------|-----|
| "NO PRACTICE SPECS FOUND" in feed | No RLS SELECT policy on `specs` table | Create the read policy (see §1) |
| Spec appears but clicking "Open Sandbox" shows blank editor | `manifest.workspace.files` is empty or null | Verify the `files` array in the manifest JSON |
| "Module not found: ./solution.ts" in terminal | Path mismatch — file is at `src/solution.ts` but require uses `./solution.ts` from `/src/test.ts` | Both files must be in the same directory, or use the correct relative path |
| `SyntaxError: Unexpected token '<'` | JSX/TSX syntax in a file | Remove all JSX — WASM runner cannot transpile it |
| `SyntaxError: Unexpected identifier` | TypeScript type that the regex stripper didn't catch (e.g., complex generics, enums) | Simplify the types or write plain JS |
| Tests run but `require()` returns empty `{}` | Solution file doesn't set `module.exports` | Add `module.exports = { ClassName }` at the bottom |
| Defense gate shows "INCOMPLETE" even with text | Character count below `minCharacters` | Check the manifest's `defenseGate.minCharacters` value |
| `Time Limit Exceeded (5000ms)` | Infinite loop or unresolved Promise in user code | The mock API `setTimeout` might be too slow — keep delays under 100ms in tests |

---

## 9. File Reference Map

| File | Role |
|------|------|
| [`src/types/specs.ts`](file:///c:/Users/valla/Desktop/devproof-app/src/types/specs.ts) | `SpecManifest`, `WorkspaceFile`, `RuntimeEnvironment` types |
| [`src/types/index.ts`](file:///c:/Users/valla/Desktop/devproof-app/src/types/index.ts) | `DomainTrack` union, `Spec` interface |
| [`src/services/api.ts`](file:///c:/Users/valla/Desktop/devproof-app/src/services/api.ts) | `getSpecs()` — fetches from Supabase |
| [`src/services/execution/useBrowserRunner.ts`](file:///c:/Users/valla/Desktop/devproof-app/src/services/execution/useBrowserRunner.ts) | WASM Web Worker execution engine |
| [`src/store/workspaceStore.ts`](file:///c:/Users/valla/Desktop/devproof-app/src/store/workspaceStore.ts) | `initInMemoryWorkspace()` — creates in-memory file nodes |
| [`src/components/features/ChallengeStudioView.tsx`](file:///c:/Users/valla/Desktop/devproof-app/src/components/features/ChallengeStudioView.tsx) | Spec selection, sandbox hydration, defense gate UI |
| [`src/components/ide/MultiFileIDE.tsx`](file:///c:/Users/valla/Desktop/devproof-app/src/components/ide/MultiFileIDE.tsx) | Monaco editor + file tree + terminal |
| [`src/components/features/FeedView.tsx`](file:///c:/Users/valla/Desktop/devproof-app/src/components/features/FeedView.tsx) | Renders spec cards, filters by `specType` |
