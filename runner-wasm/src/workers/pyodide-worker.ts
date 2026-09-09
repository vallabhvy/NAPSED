/**
 * Pyodide worker contract.
 *
 * Load Pyodide from a pinned CDN *inside this worker only*. Write candidate
 * files into the MEMFS virtual filesystem, then exec the entrypoint.
 *
 * This file is the interface. Wiring `loadPyodide()` is a follow-up task;
 * until then the worker replies with a structured runtime error rather than
 * a fake pass.
 */
/// <reference lib="webworker" />

import type { RunRequest, WorkerInbound, WorkerOutbound } from '../protocol';

self.onmessage = async (event: MessageEvent<WorkerInbound>) => {
  const data = event.data;
  if (data.type !== 'RUN') return;

  const request: RunRequest = data.payload;
  const files = request.files.map((f) => f.path).join(', ');

  const outbound: WorkerOutbound = {
    type: 'RESULT',
    payload: {
      requestId: request.requestId,
      status: 'RUNTIME_ERROR',
      stdout: '',
      stderr: [
        'Pyodide worker is not wired yet.',
        'Entrypoint: ' + request.entryPath,
        'VFS files: ' + files,
        'Implement loadPyodide() in runner-wasm/src/workers/pyodide-worker.ts.',
      ].join('\n'),
      exitCode: 2,
      executionTimeMs: 0,
    },
  };
  self.postMessage(outbound);
};

const ready: WorkerOutbound = { type: 'READY', kind: 'pyodide' };
self.postMessage(ready);

/*
 * Target implementation (do not execute on the main thread):
 *
 * const pyodide = await loadPyodide({ indexURL: PYODIDE_INDEX });
 * for (const file of request.files) {
 *   pyodide.FS.writeFile(file.path, file.content);
 * }
 * pyodide.setStdout({ batched: (s) => stdout.push(s) });
 * pyodide.setStderr({ batched: (s) => stderr.push(s) });
 * await pyodide.runPythonAsync(pyodide.FS.readFile(entry, { encoding: 'utf8' }));
 */
