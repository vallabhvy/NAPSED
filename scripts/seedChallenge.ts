import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("Seeding mock challenge...");

  // Create a system user to be the author of the challenge
  const author = await prisma.user.upsert({
    where: { username: "devproof-system" },
    update: {},
    create: {
      email: "system@devproof.app",
      username: "devproof-system",
      githubId: "system-001",
      name: "Napsed System",
      avatarUrl: "https://github.com/github.png",
      githubUrl: "https://github.com",
      role: "TECH_LEAD",
    },
  });

  // Check if challenge exists
  const existing = await prisma.challenge.findUnique({
    where: { slug: "distributed-lock-redis" },
  });

  if (existing) {
    console.log("Challenge already exists!");
    return;
  }

  // Create the challenge following the unified schema (Context, Problem Statement, Constraints, Hints, Initial Code & Solution)
  const challenge = await prisma.challenge.create({
    data: {
      title: "Distributed Lock with Redis",
      slug: "distributed-lock-redis",
      track: "BACKEND",
      difficulty: "HARD",
      context:
        "High-throughput microservices require synchronized mutual exclusion across ephemeral container instances. Standard in-memory mutexes fail when requests hit distinct pods.",
      problemStatement:
        "Implement an atomic acquire and release distributed lock pattern using Redis SETNX with expiration TTL and Lua scripts to ensure non-blocking lock release safety.",
      constraints: [
        "Lock acquisition MUST be atomic using SET key uuid NX PX ttl_ms",
        "Lock release MUST execute via Lua script checking UUID equality to prevent releasing another worker's lock",
        "TTL MUST handle worker crashes and zombie processes automatically"
      ],
      hints: [
        "Hint 1: Use Redis Lua script redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end.",
        "Hint 2: Ensure unique random UUID identifiers for each lock acquisition attempt to verify ownership on release."
      ],
      edgeCases: ["Clock drift between Redis nodes", "Zombie processes holding locks beyond expected execution window"],
      initialCode: `// Distributed Lock Implementation (TypeScript + Redis)
export async function acquireLock(redis: any, lockKey: string, lockValue: string, ttlMs: number): Promise<boolean> {
  // TODO: Implement atomic lock acquisition using SETNX + PX
  return false;
}

export async function releaseLock(redis: any, lockKey: string, lockValue: string): Promise<boolean> {
  // TODO: Implement safe lock release via Lua script
  return false;
}
`,
      solutionCode: `// Reference Architecture Solution
export async function acquireLock(redis: any, lockKey: string, lockValue: string, ttlMs: number): Promise<boolean> {
  const result = await redis.set(lockKey, lockValue, 'NX', 'PX', ttlMs);
  return result === 'OK';
}

export async function releaseLock(redis: any, lockKey: string, lockValue: string): Promise<boolean> {
  const luaScript = \`
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  \`;
  const result = await redis.eval(luaScript, 1, lockKey, lockValue);
  return result === 1;
}
`,
      timeEstimateMinutes: 45,
      authorId: author.id,
      defensePrompts: {
        create: [
          {
            question: "explain your solution",
            placeholder: "Explain why you implemented this lock acquisition and Lua release pattern...",
            minWordCount: 30,
          },
        ],
      },
    },
  });

  console.log(`Created mock challenge: ${challenge.title}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
