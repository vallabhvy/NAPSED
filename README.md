# Napsed

LeetCode measures whether you memorized Kadane. Napsed measures whether you have killed a data race at 3 a.m.

This is an assessment engine for senior systems engineers. Specs are real failure modes: token-bucket races, thread starvation, connection-pool exhaustion, brownfield refactors. Passing unit tests is not enough. You still have to defend the diff.

**Public site:** [napsed.dev](https://napsed.dev) · Proof cards: `napsed.dev/@handle`

---

## Cashmere & Concrete

The UI is industrial test equipment, not consumer SaaS. Dieter Rams / Braun functionalism: matte cashmere chassis (`#E6E2DD`), warm concrete recesses (`#D8D3CC`), instrument charcoal ink (`#1D1F23`). Status is a physical lens — emerald for a clean pass, amber for contention, rust for a panic or race. Sharp corners. No floating shadows. Canonical tokens live in [`DESIGN.md`](./DESIGN.md).

---

## 60-second quickstart (zero cloud keys)

Mock mode is the default. No Supabase, no Judge0, no `.env` required.

```bash
pnpm install
pnpm dev
```

Open `http://localhost:5173`, type `start` in the landing terminal (or click through), open **Lost Updates in an Async Token Bucket**, run `limiter.test.js`. The starter fails on purpose. That is the point.

Force mock mode even if you already have cloud keys:

```bash
# .env
VITE_MOCK_MODE=true
```

Do **not** put Judge0 secrets in any `VITE_*` variable. Native runs leave this process through an authenticated broker that does not exist in this repository (`cloud/` is closed-source).

---

## Hybrid execution

```
 Candidate ──▶ Monaco (main thread, never eval)
                    │
                    ▼
              RunnerBridge (timeout + terminate)
                    │
        ┌───────────┼──────────────────┐
        ▼           ▼                  ▼
   js-cjs        pyodide          mock-native
   worker        worker            worker
   (Tier 1)      (Tier 1)         returns
                                  NATIVE_REQUIRED
                                       │
                                       ▼
                              cloud/ Judge0 broker
                              (Tier 2, not in this repo)
                                       │
                                       ▼
                              future microVM topology
                              (Tier 3)
```

| Tier | Where | Runtimes | What it is for |
| --- | --- | --- | --- |
| 1 WASM | Isolated Web Worker | JS/TS CommonJS, Pyodide | Unlimited practice. $0 compute. |
| 2 Native | Linux sandbox via Judge0 broker | Go 1.22+, Rust, C++ | `-race`, TSan/ASan, P99 ceilings |
| 3 MicroVM | Not built | Multi-container | Replica lag, Kafka failover |

Verification is a triad, not a green checkbox:

1. **Deterministic tests** — hidden harness, exit `0`.
2. **Systems telemetry** — race detector clean, CPU/memory/P99 inside `manifest.json`.
3. **Defense gate** — “What did you do, and why did you do that?” Keywords must match the diff. Empty and boilerplate text fail.
4. **Proof card** — SHA-256 of spec + identity + diff + test JSON + defense, published at `napsed.dev/@handle`.

---

## Repository map

This repo is the **open core**.

| Path | Open? | Role |
| --- | --- | --- |
| `specs/` | yes | Versioned spec packages |
| `src/` | yes | App shell (studio, feed, landing) |
| `runner-wasm/` | yes | Worker protocol + JS/Pyodide/mock-native |
| `ui/` | planned | Extracted design-system package |
| `cloud/` | **no** | Signing keys, Judge0 proxy, proof DB |

A spec package is a directory, not a gist:

```
specs/challenges/sys-042-token-bucket-limiter/
├── manifest.json          # schema 1.1.0 — see specs/schema.json
├── README.md
├── go.mod
├── starter/               # what Monaco loads (must fail hidden tests)
├── solution/              # gold standard (must pass 100% + race-clean)
└── verification/           # hidden harness, never shipped to the editor
```

JSON Schema: [`specs/schema.json`](./specs/schema.json)  
TypeScript contract: [`src/types/specs.ts`](./src/types/specs.ts)  
Authoring rules: [`CONTRIBUTING.md`](./CONTRIBUTING.md)

---

## Commands

```bash
pnpm dev                 # mock-mode Vite app
pnpm preflight:specs     # starter must FAIL, solution must PASS
pnpm hydrate:specs       # inline starter/ into specs/.catalog.json
pnpm sync:specs           # upsert hydrated manifests into Postgres (needs DATABASE_URL)
```

---

## Contributing

We welcome contributions of all sizes! Napsed is architected for zero-friction open-source development:
- **Zero Cloud Credentials:** No Supabase, database, or OAuth setup required — default Mock Mode boots in 5 seconds.
- **Spec Authoring:** Create new failure-mode challenge packages in `specs/practice/` or `specs/challenges/`.
- **Industrial Design:** Polish the Braun / Cashmere & Concrete test equipment UI.

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for the step-by-step contributor guide, architecture FAQs, and quality gates.

---

## License

Apache-2.0 for the open core (`specs/`, `runner-wasm/`, UI). Proof signing, Judge0 dispatch, and rate-limit brokers stay proprietary.
