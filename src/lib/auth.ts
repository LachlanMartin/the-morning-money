import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

/**
 * Returns the Prisma User for the current Supabase session, creating the row
 * on first sign-in. Returns null if no session.
 */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user: supabaseUser },
  } = await supabase.auth.getUser();

  if (!supabaseUser?.email) return null;

  // Try find-first to avoid the upsert race condition when React
  // server components call getCurrentUser() in parallel on first sign-in.
  const existing = await prisma.user.findFirst({
    where: { email: supabaseUser.email },
  });
  if (existing) {
    if (existing.supabaseId !== supabaseUser.id) {
      return prisma.user.update({
        where: { id: existing.id },
        data: { supabaseId: supabaseUser.id },
      });
    }
    return existing;
  }

  const bySupabaseId = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
  });
  if (bySupabaseId) return bySupabaseId;

  try {
    return await prisma.user.create({
      data: { supabaseId: supabaseUser.id, email: supabaseUser.email },
    });
  } catch (err) {
    // Race: another parallel render already created the row
    const retry = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });
    if (retry) return retry;
    throw err;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
