ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own row"
ON "User"
FOR SELECT
USING ((SELECT auth.uid())::text = "supabaseId");

CREATE POLICY "Users can update own row"
ON "User"
FOR UPDATE
USING ((SELECT auth.uid())::text = "supabaseId")
WITH CHECK ((SELECT auth.uid())::text = "supabaseId");
