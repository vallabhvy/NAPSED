# SYS-042 — Thread-Safe Token Bucket Limiter

**Tier:** native (Go 1.22 + `go test -race`)  
**Visible tests passing is not a pass.** The hidden harness hammers `Allow()` from 64 goroutines.

## Candidate brief

Implement a token bucket that an API gateway can call on every request. The starter compiles and the visible tests are green. Under concurrency it is a data race: two goroutines refill from a stale timestamp, then both write `tokens` and `lastRefill`.

## Layout

| Path | Visibility | Role |
| --- | --- | --- |
| `starter/limiter.go` | editable | Racy implementation |
| `starter/limiter_test.go` | read-only | Single-threaded functional tests |
| `solution/limiter.go` | hidden | Reference (mutex + refill under lock) |
| `verification/verify_test.go` | hidden | Race + capacity + refill invariants |

## Pre-flight

```bash
# from repo root (requires Go 1.22+)
pnpm preflight:specs -- sys-042-token-bucket-limiter
```

Starter + verification must fail (`-race` or a concurrent invariant).  
Solution overlay + verification must pass 100% with a clean race detector.
