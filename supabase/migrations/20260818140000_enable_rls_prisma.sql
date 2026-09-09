-- Enable Row Level Security on all Prisma-generated tables to secure the PostgREST API
-- By default, this will deny all access via the data API unless explicit policies are created.
-- Server-side Prisma connections bypassing RLS will continue to work.

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Guild" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GuildMembership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "specs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PeerReview" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "GuildBadge" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "License" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Dataset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FeedItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SimulationSpec" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SimulationRun" ENABLE ROW LEVEL SECURITY;
