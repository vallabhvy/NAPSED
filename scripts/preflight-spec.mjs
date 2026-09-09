import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  collectStarterFiles,
  listSpecPackages,
  readJson,
} from './hydrate-specs.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const SCHEMA = readJson(path.join(REPO_ROOT, 'specs', 'schema.json'));

const filter = process.argv.find((a) => a.startsWith('sys-') || a.startsWith('prac-') || a.startsWith('chal-'));

function fail(message) {
  console.error(`✖ ${message}`);
  process.exitCode = 1;
}

function walkRequired(manifest) {
  const missing = SCHEMA.required.filter((key) => manifest[key] == null);
  if (missing.length) fail(`manifest missing ${missing.join(', ')}`);
  if (!['PRACTICE', 'CHALLENGE'].includes(manifest.specType)) {
    fail(`invalid specType ${manifest.specType}`);
  }
  if (manifest.schemaVersion === '1.1.0') {
    if (!manifest.executionTier) fail('1.1.0 requires executionTier');
    if (!manifest.verification) fail('1.1.0 requires verification');
    if (!manifest.defenseGate?.keywords?.length) fail('1.1.0 requires defenseGate.keywords');
  }
}

function overlay(from, to) {
  if (!fs.existsSync(from)) return;
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(dest, { recursive: true });
      overlay(src, dest);
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

function runGo(cwd, expectPass, label) {
  const argsRace = ['test', '-v', '-race', '-count=1', '-timeout', '10s', './...'];
  const argsPlain = ['test', '-v', '-count=1', '-timeout', '10s', './...'];

  let go = spawnSync('go', argsRace, {
    cwd,
    encoding: 'utf8',
  });
  if (go.error && go.error.code === 'ENOENT') {
    console.log('  skip native preflight (go not installed)');
    return 'skipped';
  }

  const combined = `${go.stdout || ''}\n${go.stderr || ''}`;
  const raceUnavailable = /unimplemented: 64-bit mode|requires cgo|C compiler not found|gcc:/.test(combined);
  if (raceUnavailable) {
    console.log('  warn: go test -race unavailable on this toolchain; falling back without sanitizer (CI must still run -race)');
    go = spawnSync('go', argsPlain, { cwd, encoding: 'utf8' });
  }

  const passed = go.status === 0;
  if (expectPass && !passed) {
    fail(`${label}: expected PASS\n${go.stdout}\n${go.stderr}`);
    return 'fail';
  }
  if (!expectPass && passed) {
    fail(`${label}: expected FAIL (starter must not satisfy hidden harness)`);
    return 'fail';
  }
  console.log(`  ${label}: ${passed ? 'PASS' : 'FAIL (expected)'}`);
  return passed ? 'pass' : 'fail-ok';
}

function preflightGo(pkg) {
  const goMod = path.join(pkg.dir, 'go.mod');
  if (!fs.existsSync(goMod)) return;

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'napsed-preflight-'));
  try {
    overlay(path.join(pkg.dir, 'starter'), tmp);
    overlay(path.join(pkg.dir, 'verification'), tmp);
    fs.copyFileSync(goMod, path.join(tmp, 'go.mod'));
    console.log(`→ starter+verification ${pkg.name}`);
    runGo(tmp, false, 'starter');

    overlay(path.join(pkg.dir, 'solution'), tmp);
    console.log(`→ solution+verification ${pkg.name}`);
    runGo(tmp, true, 'solution');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function preflightJs(pkg) {
  const starter = path.join(pkg.dir, 'starter');
  const solution = path.join(pkg.dir, 'solution');
  const testFile = fs
    .readdirSync(starter)
    .find((f) => f.endsWith('.test.js'));
  if (!testFile) return;

  const nodeStarter = spawnSync(process.execPath, [path.join(starter, testFile)], {
    cwd: starter,
    encoding: 'utf8',
  });
  const starterFailed =
    nodeStarter.status !== 0 || /VERIFICATION: FAILED/.test(nodeStarter.stdout + nodeStarter.stderr);
  if (!starterFailed) {
    fail(`${pkg.name} starter tests must fail before the reference solution is applied`);
  } else {
    console.log(`  starter JS: FAIL (expected)`);
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'napsed-js-'));
  try {
    overlay(starter, tmp);
    overlay(solution, tmp);
    const nodeSolution = spawnSync(process.execPath, [path.join(tmp, testFile)], {
      cwd: tmp,
      encoding: 'utf8',
    });
    const out = (nodeSolution.stdout || '') + (nodeSolution.stderr || '');
    if (nodeSolution.status !== 0 || /VERIFICATION: FAILED/.test(out)) {
      fail(`${pkg.name} solution must pass visible tests\n${out}`);
    } else {
      console.log(`  solution JS: PASS`);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

const packages = listSpecPackages().filter((pkg) => !filter || pkg.name === filter || pkg.name.includes(filter));

if (!packages.length) {
  fail(filter ? `no package matching ${filter}` : 'no spec packages found');
}

for (const pkg of packages) {
  console.log(`\npreflight ${pkg.bucket}/${pkg.name}`);
  const manifest = readJson(pkg.manifestPath);
  walkRequired(manifest);

  const starterFiles = collectStarterFiles(pkg.dir);
  if (!starterFiles.length) fail('starter/ produced zero workspace files');

  if (!fs.existsSync(path.join(pkg.dir, 'solution'))) fail('missing solution/');
  if (!fs.existsSync(path.join(pkg.dir, 'verification'))) fail('missing verification/');

  if (manifest.workspace?.runtime === 'go1.22') preflightGo(pkg);
  if (manifest.executionTier === 'wasm' && manifest.workspace?.runtime !== 'pyodide') {
    preflightJs(pkg);
  }
}

if (process.exitCode) {
  console.error('\npreflight failed');
} else {
  console.log('\npreflight ok');
}
