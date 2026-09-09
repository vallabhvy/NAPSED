// ─── Token Bucket ────────────────────────────────────────
// Allow() is async so refill can yield. The snapshot-then-write
// pattern loses updates when callers interleave.

function TokenBucket(capacity) {
  this.capacity = capacity;
  this.tokens = capacity;
  this.queue = Promise.resolve();
}

TokenBucket.prototype.refill = async function refill() {
  // Simulated I/O yield — the race window.
  await Promise.resolve();
};

TokenBucket.prototype.Allow = async function Allow() {
  var snapshot = this.tokens;
  await this.refill();
  if (snapshot < 1) {
    return false;
  }
  this.tokens = snapshot - 1;
  return true;
};

TokenBucket.prototype.getTokens = function getTokens() {
  return this.tokens;
};

if (typeof module !== 'undefined') {
  module.exports = { TokenBucket: TokenBucket };
}
