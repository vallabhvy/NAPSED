package limiter

import "time"

// TokenBucket is a racy token bucket. Concurrent Allow() calls unsafely
// share tokens and lastRefill — this is the bug you must fix.
type TokenBucket struct {
	capacity     float64
	refillPerSec float64
	tokens       float64
	lastRefill   time.Time
}

func New(capacity, refillPerSec float64) *TokenBucket {
	if capacity < 1 {
		capacity = 1
	}
	if refillPerSec < 0 {
		refillPerSec = 0
	}
	return &TokenBucket{
		capacity:     capacity,
		refillPerSec: refillPerSec,
		tokens:       capacity,
		lastRefill:   time.Now(),
	}
}

// Allow reports whether a single token can be consumed.
// BUG: refill and deduct are not synchronized.
func (b *TokenBucket) Allow() bool {
	now := time.Now()
	elapsed := now.Sub(b.lastRefill).Seconds()
	b.tokens += elapsed * b.refillPerSec
	if b.tokens > b.capacity {
		b.tokens = b.capacity
	}
	b.lastRefill = now

	if b.tokens < 1 {
		return false
	}
	b.tokens--
	return true
}

func (b *TokenBucket) Tokens() float64 {
	return b.tokens
}
