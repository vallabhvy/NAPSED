import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  const sql = `
DO $$ BEGIN
    CREATE TYPE "SpecType" AS ENUM ('PRACTICE', 'CHALLENGE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DROP TABLE IF EXISTS "DefensePrompt" CASCADE;
DROP TABLE IF EXISTS "Challenge" CASCADE;
DROP TABLE IF EXISTS "Submission" CASCADE;

CREATE TABLE IF NOT EXISTS "specs" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "spec_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "spec_type" "SpecType" NOT NULL,
    "track" TEXT NOT NULL,
    "difficulty" TEXT NOT NULL,
    "manifest" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "specs_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "specs_slug_key" ON "specs"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "specs_spec_id_key" ON "specs"("spec_id");

CREATE TABLE IF NOT EXISTS "submissions" (
    "id" TEXT NOT NULL,
    "spec_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code_files" JSONB NOT NULL,
    "defense_answer" TEXT NOT NULL,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'submissions_spec_id_fkey') THEN
    ALTER TABLE "submissions" ADD CONSTRAINT "submissions_spec_id_fkey" FOREIGN KEY ("spec_id") REFERENCES "specs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'submissions_user_id_fkey') THEN
    ALTER TABLE "submissions" ADD CONSTRAINT "submissions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PeerReview_submissionId_fkey') THEN
    ALTER TABLE "PeerReview" ADD CONSTRAINT "PeerReview_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
  `;

  try {
    await pool.query(sql);
    console.log("SQL migration executed successfully.");
  } catch (err) {
    console.error("SQL migration error:", err);
  } finally {
    pool.end();
  }
}

run();
