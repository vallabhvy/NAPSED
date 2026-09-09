package limiter

import (
	"sync"
	"sync/atomic"
	"testing"
	"time"
)

// Hidden harness. Never shipped to Monaco.
// Starter must fail `go test -race` here. Solution must pass clean.

func TestConcurrentAllowNoRace(t *testing.T) {
	b := New(10_000, 0)
	const goroutines = 64
	const each = 200

	var wg sync.WaitGroup
	var allowed atomic.Int64
	wg.Add(goroutines)
	for i := 0; i < goroutines; i++ {
		go func() {
			defer wg.Done()
			for j := 0; j < each; j++ {
				if b.Allow() {
					allowed.Add(1)
				}
			}
		}()
	}
	wg.Wait()

	if got := allowed.Load(); got != 10_000 {
		t.Fatalf("allowed=%d want 10000 (lost or invented tokens under contention)", got)
	}
	if b.Tokens() < 0 {
		t.Fatalf("tokens went negative: %v", b.Tokens())
	}
}

func TestCapacityCeilingUnderConcurrentRefill(t *testing.T) {
	b := New(50, 10_000)
	var wg sync.WaitGroup
	wg.Add(32)
	for i := 0; i < 32; i++ {
		go func() {
			defer wg.Done()
			for j := 0; j < 200; j++ {
				_ = b.Allow()
				_ = b.Tokens()
			}
		}()
	}
	wg.Wait()
	time.Sleep(20 * time.Millisecond)
	if got := b.Tokens(); got > 50+1e-6 {
		t.Fatalf("tokens exceeded capacity: %v", got)
	}
}

func TestRefillDoesNotInventTokensWithoutTime(t *testing.T) {
	b := New(4, 0)
	for i := 0; i < 4; i++ {
		if !b.Allow() {
			t.Fatalf("token %d should allow", i)
		}
	}
	if b.Allow() {
		t.Fatal("zero refill must not invent tokens")
	}
}
