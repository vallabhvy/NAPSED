import { normalizeManifest, type SpecManifest } from '../types/specs';
import type { Spec } from '../types';

const manifestModules = import.meta.glob('../../specs/{practice,challenges}/*/manifest.json', {
  eager: true,
}) as Record<string, { default: SpecManifest } | SpecManifest>;

const starterModules = import.meta.glob('../../specs/{practice,challenges}/*/starter/**/*', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

const goModModules = import.meta.glob('../../specs/{practice,challenges}/*/go.mod', {
  eager: true,
  query: '?raw',
  import: 'default',
}) as Record<string, string>;

function posix(filePath: string): string {
  return filePath.replace(/\\/g, '/');
}

function unwrapManifest(mod: { default: SpecManifest } | SpecManifest): SpecManifest {
  if (mod && typeof mod === 'object' && 'default' in mod && (mod as { default: SpecManifest }).default) {
    return (mod as { default: SpecManifest }).default;
  }
  return mod as SpecManifest;
}

function isReadOnly(rel: string): boolean {
  return (
    rel.endsWith('_test.go') ||
    rel.endsWith('.test.js') ||
    rel.endsWith('.test.ts') ||
    rel === 'go.mod'
  );
}

export function loadLocalSpecs(): Spec[] {
  return Object.entries(manifestModules).map(([manifestPath, mod]) => {
    const raw = unwrapManifest(mod);
    const dir = posix(manifestPath).replace(/\/manifest\.json$/, '');
    const files = [];

    const goModPath = `${dir}/go.mod`;
    const goMod = goModModules[goModPath];
    if (typeof goMod === 'string') {
      files.push({ path: 'go.mod', readOnly: true, content: goMod });
    }

    const starterPrefix = `${dir}/starter/`;
    for (const [filePath, content] of Object.entries(starterModules)) {
      const normalized = posix(filePath);
      if (!normalized.startsWith(starterPrefix)) continue;
      const rel = normalized.slice(starterPrefix.length);
      files.push({
        path: rel,
        readOnly: isReadOnly(rel),
        content,
      });
    }

    files.sort((a, b) => Number(a.readOnly) - Number(b.readOnly));

    const manifest = normalizeManifest({
      ...raw,
      workspace: {
        ...raw.workspace,
        files,
      },
    });

    return {
      id: `local-${manifest.specId}`,
      slug: manifest.slug,
      specId: manifest.specId,
      title: manifest.title,
      specType: manifest.specType,
      track: manifest.track,
      difficulty: manifest.difficulty,
      manifest,
      createdAt: '2026-01-01T00:00:00.000Z',
    } satisfies Spec;
  });
}
