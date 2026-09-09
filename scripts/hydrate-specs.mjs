import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const SPECS_ROOT = path.join(REPO_ROOT, 'specs');

export function listSpecPackages() {
  const buckets = ['practice', 'challenges'];
  const packages = [];

  for (const bucket of buckets) {
    const bucketDir = path.join(SPECS_ROOT, bucket);
    if (!fs.existsSync(bucketDir)) continue;
    for (const name of fs.readdirSync(bucketDir)) {
      const dir = path.join(bucketDir, name);
      const manifestPath = path.join(dir, 'manifest.json');
      if (fs.existsSync(manifestPath) && fs.statSync(dir).isDirectory()) {
        packages.push({
          bucket,
          name,
          dir,
          manifestPath,
        });
      }
    }
  }

  return packages;
}

export function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

export function collectStarterFiles(packageDir) {
  const starterDir = path.join(packageDir, 'starter');
  const files = [];

  if (fs.existsSync(starterDir)) {
    walk(starterDir, (abs) => {
      const rel = posixRel(starterDir, abs);
      files.push({
        path: rel,
        readOnly: isReadOnlyStarter(rel),
        content: fs.readFileSync(abs, 'utf8'),
      });
    });
  }

  const goMod = path.join(packageDir, 'go.mod');
  if (fs.existsSync(goMod)) {
    files.push({
      path: 'go.mod',
      readOnly: true,
      content: fs.readFileSync(goMod, 'utf8'),
    });
  }

  files.sort((a, b) => Number(a.readOnly) - Number(b.readOnly));
  return files;
}

export function hydrateManifest(packageDir, manifest) {
  const files = collectStarterFiles(packageDir);
  return {
    ...manifest,
    workspace: {
      ...manifest.workspace,
      files,
    },
  };
}

export function writeCatalog() {
  const catalog = listSpecPackages().map((pkg) => {
    const manifest = hydrateManifest(pkg.dir, readJson(pkg.manifestPath));
    return {
      id: `local-${manifest.slug}`,
      slug: manifest.slug,
      specId: manifest.specId,
      title: manifest.title,
      specType: manifest.specType,
      track: manifest.track,
      difficulty: manifest.difficulty,
      manifest,
      createdAt: new Date(0).toISOString(),
      packageDir: path.relative(REPO_ROOT, pkg.dir).replace(/\\/g, '/'),
    };
  });

  const outPath = path.join(SPECS_ROOT, '.catalog.json');
  fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2) + '\n');
  return { outPath, count: catalog.length };
}

function isReadOnlyStarter(rel) {
  return (
    rel.endsWith('_test.go') ||
    rel.endsWith('.test.js') ||
    rel.endsWith('.test.ts') ||
    rel === 'go.mod'
  );
}

function posixRel(from, to) {
  return path.relative(from, to).split(path.sep).join('/');
}

function walk(dir, visit) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(abs, visit);
    else visit(abs);
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const { outPath, count } = writeCatalog();
  console.log(`hydrated ${count} spec(s) → ${path.relative(REPO_ROOT, outPath)}`);
}
