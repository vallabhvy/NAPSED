import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { SpecManifest } from '../src/types/specs';

const prisma = new PrismaClient();

async function syncDirectory(dirPath: string) {
  if (!fs.existsSync(dirPath)) return;
  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    const raw = fs.readFileSync(path.join(dirPath, file), 'utf-8');
    const manifest: SpecManifest = JSON.parse(raw);

    await prisma.spec.upsert({
      where: { slug: manifest.slug },
      update: {
        specId: manifest.specId,
        title: manifest.title,
        specType: manifest.specType as any,
        track: manifest.track,
        difficulty: manifest.difficulty,
        manifest: manifest as any,
      },
      create: {
        slug: manifest.slug,
        specId: manifest.specId,
        title: manifest.title,
        specType: manifest.specType as any,
        track: manifest.track,
        difficulty: manifest.difficulty,
        manifest: manifest as any,
      },
    });

    console.log(`✓ Synced ${manifest.specType}: ${manifest.title}`);
  }
}

async function main() {
  await syncDirectory(path.join(__dirname, '../specs/practice'));
  await syncDirectory(path.join(__dirname, '../specs/challenges'));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
