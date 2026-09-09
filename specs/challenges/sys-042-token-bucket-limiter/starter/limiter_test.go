package limiter

import "testing"

func TestAllowDrainsWithoutRefill(t *testing.T) {
	b := New(2, 0)
	if !b.Allow() {
		t.Fatal("first token should be allowed")
	}
	if !b.Allow() {
		t.Fatal("second token should be allowed")
	}
	if b.Allow() {
		t.Fatal("empty bucket must deny")
	}
}

func TestNewStartsFull(t *testing.T) {
	b := New(5, 10)
	if got := b.Tokens(); got != 5 {
		t.Fatalf("full bucket: got %v want 5", got)
	}
}

func TestDenyDoesNotGoNegative(t *testing.T) {
	b := New(1, 0)
	if !b.Allow() {
		t.Fatal("expected allow")
	}
	if b.Allow() {
		t.Fatal("expected deny")
	}
	if b.Tokens() < 0 {
		t.Fatalf("tokens went negative: %v", b.Tokens())
	}
}
