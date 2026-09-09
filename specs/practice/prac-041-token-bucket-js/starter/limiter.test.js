// ─── Visible Practice Tests ─────────────────────────────
var TokenBucket = require('./limiter.js').TokenBucket;

async function runTests() {
  var passed = 0;
  var failed = 0;

  function assert(condition, label) {
    if (condition) {
      console.log("  OK " + label);
      passed++;
    } else {
      console.log("  FAIL " + label);
      failed++;
    }
  }

  console.log("--- Practice Test Suite ---");

  console.log("Test 1: Drain");
  var bucket = new TokenBucket(2);
  var a = await bucket.Allow();
  var b = await bucket.Allow();
  var c = await bucket.Allow();
  assert(a === true, "first token allowed");
  assert(b === true, "second token allowed");
  assert(c === false, "empty bucket denies");

  console.log("Test 2: Concurrent callers must not invent tokens");
  var raced = new TokenBucket(5);
  var calls = [];
  var i;
  for (i = 0; i < 20; i++) {
    calls.push(raced.Allow());
  }
  var results = await Promise.all(calls);
  var allowed = 0;
  for (i = 0; i < results.length; i++) {
    if (results[i]) allowed++;
  }
  assert(allowed === 5, "exactly 5 allows under concurrency, got " + allowed);
  assert(raced.getTokens() >= 0, "tokens must not go negative");

  console.log("");
  console.log("--- Results: " + passed + " passed, " + failed + " failed ---");
  if (failed > 0) {
    console.error("VERIFICATION: FAILED");
  } else {
    console.log("VERIFICATION: ALL TESTS PASSED");
  }
}

runTests();
