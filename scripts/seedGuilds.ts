import { prisma } from "../src/lib/prisma";
import type { DomainTrack } from "@prisma/client";

const guilds = [
  {
    name: 'Distributed Systems Guild',
    slug: 'DISTRIBUTED_SYSTEMS' as DomainTrack,
    description: 'High-concurrency architectures, consensus protocols, and fault-tolerant primitives.',
    iconName: 'Server',
    memberCount: 0,
    totalKarma: 0,
  },
  {
    name: 'DevOps & Platform Guild',
    slug: 'DEVOPS_INFRA' as DomainTrack,
    description: 'Kubernetes, infrastructure as code, eBPF, and zero-downtime deployment pipelines.',
    iconName: 'Terminal',
    memberCount: 0,
    totalKarma: 0,
  },
  {
    name: 'Cloud Security & SecOps Guild',
    slug: 'CLOUD_SECURITY' as DomainTrack,
    description: 'Application security, cryptographic verification, zero-trust gateways, and IAM.',
    iconName: 'Shield',
    memberCount: 0,
    totalKarma: 0,
  },
  {
    name: 'Backend Performance Guild',
    slug: 'BACKEND_PERFORMANCE' as DomainTrack,
    description: 'Database indexing, lock contention, memory optimization, and API throughput.',
    iconName: 'Zap',
    memberCount: 0,
    totalKarma: 0,
  },
  {
    name: 'Frontend Systems Guild',
    slug: 'FRONTEND_ARCHITECTURE' as DomainTrack,
    description: 'Browser rendering engines, virtualized lists, WebAssembly, and state synchronization.',
    iconName: 'Layout',
    memberCount: 0,
    totalKarma: 0,
  },
  {
    name: 'Data & Infrastructure Guild',
    slug: 'DATA_ENGINEERING' as DomainTrack,
    description: 'Stream processing, vector indexing, distributed joins, and memory-efficient ETL.',
    iconName: 'Database',
    memberCount: 0,
    totalKarma: 0,
  }
];

async function main() {
  console.log("Seeding guilds...");
  
  for (const guild of guilds) {
    await prisma.guild.upsert({
      where: { slug: guild.slug },
      update: {
        name: guild.name,
        description: guild.description,
        iconName: guild.iconName
      },
      create: guild,
    });
    console.log(`Upserted guild: ${guild.name}`);
  }
  
  console.log("Guild seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
