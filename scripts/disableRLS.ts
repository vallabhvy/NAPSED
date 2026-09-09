import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Disabling RLS on tables for frontend testing...");
  
  const tables = ['Challenge', 'FeedItem', 'DefensePrompt', 'Submission', 'User', 'Guild'];
  
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" DISABLE ROW LEVEL SECURITY;`);
      console.log(`Disabled RLS on ${table}`);
    } catch (e: any) {
      console.error(`Failed on ${table}:`, e.message);
    }
  }
}

main().finally(() => prisma.$disconnect());
