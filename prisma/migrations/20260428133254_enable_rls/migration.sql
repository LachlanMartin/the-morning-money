-- Enable RLS on all public tables. Prisma connects as the `postgres` role
-- (BYPASSRLS), so application queries are unaffected. With RLS enabled and no
-- policies, PostgREST access via anon/authenticated keys is denied by default,
-- closing the auto-exposed REST surface for these tables.

ALTER TABLE "Watchlist" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WatchlistTicker" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Announcement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Analysis" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DigestRun" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
