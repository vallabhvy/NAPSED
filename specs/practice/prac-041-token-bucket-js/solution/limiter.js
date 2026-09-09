function TokenBucket(capacity) {
  this.capacity = capacity;
  this.tokens = capacity;
  this.mutex = Promise.resolve();
}

TokenBucket.prototype.withLock = function withLock(fn) {
  var run;
  var next = new Promise(function (resolve) {
    run = resolve;
  });
  var released = this.mutex.then(function () {
    return fn();
  });
  this.mutex = next;
  return released.finally(function () {
    run();
  });
};

TokenBucket.prototype.Allow = function Allow() {
  var self = this;
  return this.withLock(async function () {
    await Promise.resolve();
    if (self.tokens < 1) {
      return false;
    }
    self.tokens -= 1;
    return true;
  });
};

TokenBucket.prototype.getTokens = function getTokens() {
  return this.tokens;
};

if (typeof module !== 'undefined') {
  module.exports = { TokenBucket: TokenBucket };
}
