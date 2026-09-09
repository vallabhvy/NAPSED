import type { RunRequest, RunResponse, RunnerKind, WorkerInbound, WorkerOutbound } from './protocol';

export interface RunnerBridgeOptions {
  timeoutMs?: number;
  createWorker: (kind: RunnerKind) => Worker;
}

/**
 * Main-thread bridge. Spawns one worker per kind, times out, and always
 * terminates the worker after a run so a tight loop cannot starve Monaco.
 */
export class RunnerBridge {
  private workers = new Map<RunnerKind, Worker>();

  constructor(private readonly options: RunnerBridgeOptions) {}

  async run(request: RunRequest): Promise<RunResponse> {
    const timeoutMs = request.timeoutMs || this.options.timeoutMs || 5000;
    const worker = this.acquire(request.kind);

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.kill(request.kind);
        resolve({
          requestId: request.requestId,
          status: 'TIME_LIMIT',
          stdout: '',
          stderr: `Time Limit Exceeded (${timeoutMs}ms execution cap reached)`,
          exitCode: 124,
          executionTimeMs: timeoutMs,
        });
      }, timeoutMs);

      const onMessage = (event: MessageEvent<WorkerOutbound>) => {
        const data = event.data;
        if (data.type !== 'RESULT' || data.payload.requestId !== request.requestId) {
          return;
        }
        clearTimeout(timer);
        worker.removeEventListener('message', onMessage);
        this.kill(request.kind);
        resolve(data.payload);
      };

      worker.addEventListener('message', onMessage);
      const inbound: WorkerInbound = { type: 'RUN', payload: request };
      worker.postMessage(inbound);
    });
  }

  dispose() {
    for (const kind of [...this.workers.keys()]) {
      this.kill(kind);
    }
  }

  private acquire(kind: RunnerKind): Worker {
    const existing = this.workers.get(kind);
    if (existing) return existing;
    const worker = this.options.createWorker(kind);
    this.workers.set(kind, worker);
    return worker;
  }

  private kill(kind: RunnerKind) {
    const worker = this.workers.get(kind);
    if (!worker) return;
    worker.terminate();
    this.workers.delete(kind);
  }
}
