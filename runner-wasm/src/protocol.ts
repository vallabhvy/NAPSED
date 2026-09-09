/**
 * Napsed runner-wasm protocol.
 *
 * Main thread (Monaco) never eval()s candidate code. Every run is a
 * structured postMessage into an isolated Worker. Native languages never
 * execute in the browser — they return NATIVE_REQUIRED and the cloud
 * Judge0 broker (not this package) is the only path that sees API keys.
 */

export type RunnerKind = 'js-cjs' | 'pyodide' | 'mock-native';

export type RunStatus =
  | 'COMPLETED'
  | 'COMPILE_ERROR'
  | 'RUNTIME_ERROR'
  | 'TIME_LIMIT'
  | 'NATIVE_REQUIRED'
  | 'WORKER_ERROR';

export interface VirtualFile {
  path: string;
  content: string;
}

export interface RunRequest {
  requestId: string;
  kind: RunnerKind;
  runtime: string;
  entryPath: string;
  files: VirtualFile[];
  timeoutMs: number;
  /** Verification overlay. Never shown in Monaco. */
  hiddenHarness?: VirtualFile[];
}

export interface RunResponse {
  requestId: string;
  status: RunStatus;
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
  raceConditionDetected?: boolean;
  p99Ms?: number;
}

export type WorkerInbound =
  | { type: 'RUN'; payload: RunRequest }
  | { type: 'ABORT'; requestId: string };

export type WorkerOutbound =
  | { type: 'LOG'; requestId: string; stream: 'stdout' | 'stderr'; line: string }
  | { type: 'RESULT'; payload: RunResponse }
  | { type: 'READY'; kind: RunnerKind };
