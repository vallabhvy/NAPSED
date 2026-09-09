# PRAC-041 — Lost Updates in an Async Token Bucket

**Tier:** wasm (in-browser CommonJS worker)  
Use this spec to verify the 60-second mock-mode loop: open sandbox, run the test file, watch the starter fail, patch, re-run.

## Bug

`Allow()` snapshots `tokens`, `await`s refill, then writes `tokens - 1`. Concurrent callers all snapshot the same value.

## Constraint

WASM worker code must use `var` / `function` / `require` / `module.exports`. No `import`/`export`, no JSX, no template literals in the test file.
