/**
 * Isolated CommonJS/JS worker. This file is the contract for the Blob
 * worker currently inlined in `src/services/execution/useBrowserRunner.ts`.
 *
 * Rules:
 * - No DOM, no fetch, no importScripts of untrusted URLs.
 * - Candidate files are a path→source map. require() resolves only inside it.
 * - ES modules are not supported. Authors must use module.exports.
 */
/// <reference lib="webworker" />

import type { RunRequest, RunResponse, WorkerInbound, WorkerOutbound } from '../protocol';

const stdout: string[] = [];
const stderr: string[] = [];

console.log = (...args: unknown[]) => {
  stdout.push(args.map(stringify).join(' '));
};
console.error = (...args: unknown[]) => {
  stderr.push(args.map(stringify).join(' '));
};

function stringify(value: unknown): string {
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

function resolvePath(fromPath: string, reqPath: string): string {
  if (!reqPath.startsWith('.')) return reqPath;
  const fromDir = fromPath.substring(0, fromPath.lastIndexOf('/'));
  const parts = (fromDir + '/' + reqPath).split('/').filter(Boolean);
  const resolved: string[] = [];
  for (const part of parts) {
    if (part === '..') resolved.pop();
    else if (part !== '.') resolved.push(part);
  }
  return '/' + resolved.join('/');
}

self.onmessage = async (event: MessageEvent<WorkerInbound>) => {
  const data = event.data;
  if (data.type !== 'RUN') return;

  stdout.length = 0;
  stderr.length = 0;

  const request: RunRequest = data.payload;
  const fileMap: Record<string, string> = {};
  for (const file of request.files) {
    const path = file.path.startsWith('/') ? file.path : '/' + file.path;
    fileMap[path] = file.content;
  }

  const started = Date.now();
  try {
    const moduleCache: Record<string, { exports: Record<string, unknown> }> = {};

    function createRequire(currentPath: string) {
      return function require(reqPath: string) {
        const resolvedPath = resolvePath(currentPath, reqPath);
        const candidates = [
          resolvedPath,
          resolvedPath + '.ts',
          resolvedPath + '.js',
          resolvedPath + '.tsx',
          resolvedPath + '.jsx',
        ];
        const matchedPath = candidates.find((c) => fileMap[c] !== undefined);
        if (!matchedPath) {
          throw new Error('Module not found: ' + reqPath + ' (resolved to ' + resolvedPath + ')');
        }
        if (moduleCache[matchedPath]) {
          return moduleCache[matchedPath].exports;
        }
        const mod = { exports: {} as Record<string, unknown> };
        moduleCache[matchedPath] = mod;
        const wrapped = '(function(require, module, exports) {\n' + fileMap[matchedPath] + '\n})';
        const moduleFn = eval(wrapped);
        moduleFn(createRequire(matchedPath), mod, mod.exports);
        return mod.exports;
      };
    }

    const entryPath = request.entryPath.startsWith('/')
      ? request.entryPath
      : '/' + request.entryPath;
    const entryCode = fileMap[entryPath];
    if (entryCode === undefined) {
      throw new Error('Entrypoint not found: ' + entryPath);
    }

    const entryModule = { exports: {} as Record<string, unknown> };
    moduleCache[entryPath] = entryModule;
    const wrappedEntry =
      '(async function(require, module, exports) {\n' + entryCode + '\n})';
    const entryFn = eval(wrappedEntry);
    await entryFn(createRequire(entryPath), entryModule, entryModule.exports);

    postResult(request.requestId, {
      status: 'COMPLETED',
      exitCode: 0,
      executionTimeMs: Date.now() - started,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    stderr.push(message);
    postResult(request.requestId, {
      status: 'RUNTIME_ERROR',
      exitCode: 1,
      executionTimeMs: Date.now() - started,
    });
  }
};

function postResult(requestId: string, partial: Partial<RunResponse>) {
  const payload: RunResponse = {
    requestId,
    status: partial.status || 'WORKER_ERROR',
    stdout: stdout.join('\n'),
    stderr: stderr.join('\n'),
    exitCode: partial.exitCode ?? 1,
    executionTimeMs: partial.executionTimeMs ?? 0,
  };
  const outbound: WorkerOutbound = { type: 'RESULT', payload };
  self.postMessage(outbound);
}

const ready: WorkerOutbound = { type: 'READY', kind: 'js-cjs' };
self.postMessage(ready);
