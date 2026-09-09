# runner-wasm

In-browser execution workers for Napsed. This directory is the public contract for Tier 1 (WASM) and the **mock** of Tier 2 (native). It must never contain Judge0 keys, signing secrets, or a real Linux sandbox.

```
runner-wasm/src
├── protocol.ts                 Structured RunRequest / RunResponse
├── bridge.ts                   Main-thread spawn / timeout / terminate
├── index.ts
└── workers/
    ├── js-cjs-worker.ts         Isolated CommonJS + virtual require()
    ├── pyodide-worker.ts        Pyodide MEMFS contract (load not wired yet)
    └── mock-native-worker.ts    Returns NATIVE_REQUIRED for Go/Rust/C++/Java
```

## Isolation rules

1. Candidate code runs only inside a Web Worker. Monaco stays on the main thread.
2. One run, one worker. The bridge `terminate()`s after RESULT or timeout so a spinloop cannot freeze the UI.
3. `fetch`, `document`, and `SharedArrayBuffer` are not part of the JS worker surface.
4. Native specs (`go1.22`, `rust1.76`, `cpp20`, `java21`) must return `NATIVE_REQUIRED` in the browser. A fake `COMPLETED` is a false positive.

## Wiring (next)

Replace the inline Blob worker in `src/services/execution/useBrowserRunner.ts` with:

```ts
import { RunnerBridge } from '../../runner-wasm/src/bridge';

const bridge = new RunnerBridge({
  createWorker: (kind) =>
    new Worker(new URL(`../../runner-wasm/src/workers/${workerFile(kind)}`, import.meta.url), {
      type: 'module',
    }),
});
```

Vite needs `worker: { format: 'es' }` once that lands. Until then the studio still uses the Blob worker for JS/TS.
