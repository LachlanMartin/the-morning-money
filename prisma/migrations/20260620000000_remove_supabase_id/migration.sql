-- Remove unused Supabase auth column from User
ALTER TABLE "User" DROP COLUMN "supabaseId";
DROP INDEX IF EXISTS "User_supabaseId_key";
