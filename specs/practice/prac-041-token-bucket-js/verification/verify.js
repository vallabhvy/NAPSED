// Hidden harness — same invariants as the visible suite, with a wider fan-out.
var TokenBucket = require('./limiter.js').TokenBucket;

async function run() {
  var bucket = new TokenBucket(8);
  var calls = [];
  var i;
  for (i = 0; i < 64; i++) {
    calls.push(bucket.Allow());
  }
  var results = await Promise.all(calls);
  var allowed = 0;
  for (i = 0; i < results.length; i++) {
    if (results[i]) allowed++;
  }
  if (allowed !== 8) {
    console.error("HIDDEN: expected 8 allows, got " + allowed);
    throw new Error("VERIFICATION: FAILED");
  }
  if (bucket.getTokens() < 0) {
    throw new Error("HIDDEN: negative tokens");
  }
  console.log("HIDDEN: ALL TESTS PASSED");
}

run();
