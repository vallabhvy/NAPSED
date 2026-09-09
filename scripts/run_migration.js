import pg from 'pg';

const pool = new pg.Pool({

  connectionString: process.env.DATABASE_URL
});

async function run() {
  const sql = `
CREATE TABLE IF NOT EXISTS "SimulationSpec" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "track" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "incidentScenario" TEXT NOT NULL,
  "starterWorkspaceId" TEXT,
  "targetMetrics" JSONB NOT NULL,
  "initialCode" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SimulationSpec_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "SimulationSpec_slug_key" ON "SimulationSpec"("slug");

CREATE TABLE IF NOT EXISTS "SimulationRun" (
  "id" TEXT NOT NULL,
  "specId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "initialP99Ms" DOUBLE PRECISION NOT NULL,
  "resolvedP99Ms" DOUBLE PRECISION NOT NULL,
  "simulatedSeed" TEXT NOT NULL,
  "timeToResolveSeconds" INTEGER NOT NULL,
  "postMortemRca" TEXT NOT NULL,
  "postMortemTradeoffs" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING_AUDIT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SimulationRun_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SimulationRun_specId_fkey') THEN
    ALTER TABLE "SimulationRun" ADD CONSTRAINT "SimulationRun_specId_fkey" FOREIGN KEY ("specId") REFERENCES "SimulationSpec"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'SimulationRun_userId_fkey') THEN
    ALTER TABLE "SimulationRun" ADD CONSTRAINT "SimulationRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

ALTER TABLE "SimulationSpec" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SimulationRun" ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Public read simulation specs" ON "SimulationSpec" FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users view and insert their simulation runs" ON "SimulationRun" 
      FOR ALL USING (auth.uid()::text = "userId") WITH CHECK (auth.uid()::text = "userId");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
  `;
  try {
    await pool.query(sql);
    console.log("SQL executed successfully.");
  } catch (err) {
    console.error("SQL execution error:", err);
  } finally {
    pool.end();
  }
}

run();
