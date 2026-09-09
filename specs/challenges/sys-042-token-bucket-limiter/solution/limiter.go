package limiter

import (
	"sync"
	"time"
)

// TokenBucket is a thread-safe token bucket. Refill and deduct share one
// critical section so the timestamp and the token count cannot tear.
type TokenBucket struct {
	mu           sync.Mutex
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

func (b *TokenBucket) refillLocked(now time.Time) {
	elapsed := now.Sub(b.lastRefill).Seconds()
	if elapsed <= 0 {
		return
	}
	b.tokens += elapsed * b.refillPerSec
	if b.tokens > b.capacity {
		b.tokens = b.capacity
	}
	b.lastRefill = now
}

func (b *TokenBucket) Allow() bool {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.refillLocked(time.Now())
	if b.tokens < 1 {
		return false
	}
	b.tokens--
	return true
}

func (b *TokenBucket) Tokens() float64 {
	b.mu.Lock()
	defer b.mu.Unlock()
	b.refillLocked(time.Now())
	return b.tokens
}
