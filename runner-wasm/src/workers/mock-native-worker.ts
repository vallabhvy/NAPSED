/**
 * Mock native worker for local UI development.
 *
 * Go / Rust / C++ / Java never run in the browser. In mock mode this worker
 * returns NATIVE_REQUIRED so the studio cannot mint a false-positive pass.
 *
 * Heuristic preview (opt-in via request.runtime ending in `+preview`) inspects
 * the source for a mutex and concurrent test hooks. It is not a sanitizer.
 */
/// <reference lib="webworker" />

import type { RunRequest, WorkerInbound, WorkerOutbound } from '../protocol';

self.onmessage = (event: MessageEvent<WorkerInbound>) => {
  const data = event.data;
  if (data.type !== 'RUN') return;

  const request: RunRequest = data.payload;
  const sources = request.files.map((f) => f.content).join('\n');
  const wantsPreview = request.runtime.endsWith('+preview');

  if (!wantsPreview) {
    const outbound: WorkerOutbound = {
      type: 'RESULT',
      payload: {
        requestId: request.requestId,
        status: 'NATIVE_REQUIRED',
        stdout: '',
        stderr: [
          'NATIVE RUNTIME REQUIRED',
          'Language: ' + request.runtime,
          'This spec needs OS threads and sanitizers (go test -race, TSan, ASan).',
          'Browser WASM cannot satisfy the verification gate.',
          'In production the authenticated Judge0 broker in cloud/ runs this.',
        ].join('\n'),
        exitCode: 78,
        executionTimeMs: 0,
        raceConditionDetected: undefined,
      },
    };
    self.postMessage(outbound);
    return;
  }

  const hasMutex = /sync\.Mutex|std::mutex|Mutex<|>/.test(sources);
  const looksRacy = /lastRefill|tokens\s*\+\+|tokens--/.test(sources) && !hasMutex;

  const outbound: WorkerOutbound = {
    type: 'RESULT',
    payload: {
      requestId: request.requestId,
      status: looksRacy ? 'RUNTIME_ERROR' : 'COMPLETED',
      stdout: looksRacy
        ? 'PREVIEW: likely data race (no mutex around refill/deduct)'
        : 'PREVIEW: mutex detected — not a substitute for go test -race',
      stderr: looksRacy ? 'raceConditionDetected=true (heuristic)' : '',
      exitCode: looksRacy ? 1 : 0,
      executionTimeMs: 4,
      raceConditionDetected: looksRacy,
    },
  };
  self.postMessage(outbound);
};

const ready: WorkerOutbound = { type: 'READY', kind: 'mock-native' };
self.postMessage(ready);
