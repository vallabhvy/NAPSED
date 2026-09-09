import path from 'url';
import pkg from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const { PrismaClient } = pkg;
const { Pool } = pg;

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.submission.deleteMany({});
  await prisma.spec.deleteMany({});
  await prisma.feedItem.deleteMany({
    where: {
      type: 'SENIOR_SPEC'
    }
  });
  console.log("All specs and submissions have been deleted.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
