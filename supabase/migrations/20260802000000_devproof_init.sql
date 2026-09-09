-- DevProof (Napsed / REIP) Production Database Schema & RLS Policies
-- Compatible with Supabase Postgres and Prisma Schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------
-- Custom Enums
-- ------------------------------------------
CREATE TYPE role_enum AS ENUM ('JUNIOR', 'MID', 'SENIOR', 'STAFF', 'TECH_LEAD');
CREATE TYPE domain_track_enum AS ENUM ('DEVOPS', 'BACKEND', 'SECURITY', 'FRONTEND_PERF', 'DISTRIBUTED_SYSTEMS');
CREATE TYPE difficulty_enum AS ENUM ('EASY', 'MEDIUM', 'HARD', 'EXPERT');
CREATE TYPE submission_status_enum AS ENUM ('PENDING_REVIEW', 'VERIFIED', 'NEEDS_REVISION');
CREATE TYPE feed_type_enum AS ENUM ('MICRO_BUILD', 'SENIOR_SPEC', 'JUNIOR_TIP', 'VERIFIED_AUDIT');

-- ------------------------------------------
-- 1. Users Table (GitHub Identity)
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  github_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_url TEXT,
  role role_enum NOT NULL DEFAULT 'SENIOR',
  bio TEXT,
  github_url TEXT NOT NULL,
  streak_days INT NOT NULL DEFAULT 0,
  karma_points INT NOT NULL DEFAULT 0,
  acceptance_rate DOUBLE PRECISION NOT NULL DEFAULT 100.0,
  submissions_audited INT NOT NULL DEFAULT 0,
  daily_target_minutes INT NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_github_id ON public.users(github_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- ------------------------------------------
-- 2. Guilds & Memberships
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.guilds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug domain_track_enum UNIQUE NOT NULL,
  description TEXT NOT NULL,
  icon_name TEXT NOT NULL DEFAULT 'Shield',
  member_count INT NOT NULL DEFAULT 0,
  total_karma INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.guild_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  guild_id UUID NOT NULL REFERENCES public.guilds(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'MEMBER',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, guild_id)
);

CREATE INDEX IF NOT EXISTS idx_guild_memberships_user ON public.guild_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_guild_memberships_guild ON public.guild_memberships(guild_id);

-- ------------------------------------------
-- 3. Challenges & Defense Prompts
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  track domain_track_enum NOT NULL,
  difficulty difficulty_enum NOT NULL DEFAULT 'HARD',
  context TEXT NOT NULL,
  constraints TEXT[] NOT NULL DEFAULT '{}',
  edge_cases TEXT[] NOT NULL DEFAULT '{}',
  initial_code TEXT NOT NULL,
  solution_code TEXT,
  time_estimate_minutes INT NOT NULL DEFAULT 45,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_challenges_track ON public.challenges(track);
CREATE INDEX IF NOT EXISTS idx_challenges_difficulty ON public.challenges(difficulty);

CREATE TABLE IF NOT EXISTS public.defense_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  placeholder TEXT NOT NULL,
  min_word_count INT NOT NULL DEFAULT 25
);

CREATE INDEX IF NOT EXISTS idx_defense_prompts_challenge ON public.defense_prompts(challenge_id);

-- ------------------------------------------
-- 4. Submissions Table
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'rust',
  defense_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  status submission_status_enum NOT NULL DEFAULT 'PENDING_REVIEW',
  reviews_count INT NOT NULL DEFAULT 0,
  consensus_score DOUBLE PRECISION,
  consensus_seal_hash TEXT UNIQUE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_challenge ON public.submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_submissions_author ON public.submissions(author_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);

-- ------------------------------------------
-- 5. Peer Reviews Table
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.peer_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  architecture_rating INT NOT NULL DEFAULT 5,
  edge_cases_rating INT NOT NULL DEFAULT 5,
  defense_clarity_rating INT NOT NULL DEFAULT 5,
  overall_score DOUBLE PRECISION NOT NULL DEFAULT 5.0,
  feedback_text TEXT NOT NULL,
  inline_comments JSONB NOT NULL DEFAULT '[]'::jsonb,
  upvotes_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(submission_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_peer_reviews_submission ON public.peer_reviews(submission_id);
CREATE INDEX IF NOT EXISTS idx_peer_reviews_reviewer ON public.peer_reviews(reviewer_id);

-- ------------------------------------------
-- 6. Guild Badges
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.guild_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  track domain_track_enum NOT NULL,
  level TEXT NOT NULL DEFAULT 'L3',
  icon_name TEXT NOT NULL DEFAULT 'Award',
  consensus_hash TEXT NOT NULL,
  audited_by TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_guild_badges_user ON public.guild_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_guild_badges_track ON public.guild_badges(track);

-- ------------------------------------------
-- 7. Protocol Feed Items
-- ------------------------------------------
CREATE TABLE IF NOT EXISTS public.feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type feed_type_enum NOT NULL DEFAULT 'MICRO_BUILD',
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  code_snippet TEXT,
  language TEXT,
  comments_count INT NOT NULL DEFAULT 0,
  upvotes INT NOT NULL DEFAULT 0,
  track domain_track_enum NOT NULL,
  author_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feed_items_track ON public.feed_items(track);
CREATE INDEX IF NOT EXISTS idx_feed_items_created ON public.feed_items(created_at DESC);

-- ------------------------------------------
-- Row Level Security (RLS) Policies
-- ------------------------------------------
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guilds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.defense_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guild_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;

-- Public read access for protocol data
CREATE POLICY "Allow public read users" ON public.users FOR SELECT USING (true);
CREATE POLICY "Allow public read guilds" ON public.guilds FOR SELECT USING (true);
CREATE POLICY "Allow public read memberships" ON public.guild_memberships FOR SELECT USING (true);
CREATE POLICY "Allow public read challenges" ON public.challenges FOR SELECT USING (true);
CREATE POLICY "Allow public read prompts" ON public.defense_prompts FOR SELECT USING (true);
CREATE POLICY "Allow public read submissions" ON public.submissions FOR SELECT USING (true);
CREATE POLICY "Allow public read reviews" ON public.peer_reviews FOR SELECT USING (true);
CREATE POLICY "Allow public read badges" ON public.guild_badges FOR SELECT USING (true);
CREATE POLICY "Allow public read feed" ON public.feed_items FOR SELECT USING (true);

-- Authenticated write access
CREATE POLICY "Allow user insert self" ON public.users FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow user update self" ON public.users FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow user insert submission" ON public.submissions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow user insert review" ON public.peer_reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow user insert feed" ON public.feed_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
