import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { hydrateManifest, listSpecPackages, readJson } from './hydrate-specs.mjs';

const { PrismaClient } = pkg;
const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required to sync specs. Local UI does not need this.');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const packages = listSpecPackages();
  if (!packages.length) {
    console.log('No spec packages found under specs/practice or specs/challenges.');
    return;
  }

  for (const specPkg of packages) {
    const manifest = hydrateManifest(specPkg.dir, readJson(specPkg.manifestPath));

    await prisma.spec.upsert({
      where: { slug: manifest.slug },
      update: {
        specId: manifest.specId,
        title: manifest.title,
        specType: manifest.specType,
        track: manifest.track,
        difficulty: manifest.difficulty,
        manifest,
      },
      create: {
        slug: manifest.slug,
        specId: manifest.specId,
        title: manifest.title,
        specType: manifest.specType,
        track: manifest.track,
        difficulty: manifest.difficulty,
        manifest,
      },
    });

    console.log(`✓ Synced ${manifest.specType}: ${manifest.title}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
