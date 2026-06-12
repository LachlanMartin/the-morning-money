import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const TRIAL_DAYS = 7;

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
    if (
      existing.plan === "FREE" &&
      existing.trialExpiresAt === null
    ) {
      const trialEnd = new Date(
        existing.createdAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000,
      );
      return prisma.user.update({
        where: { id: existing.id },
        data: { trialExpiresAt: trialEnd },
      });
    }
    return existing;
  }

  const bySupabaseId = await prisma.user.findUnique({
    where: { supabaseId: supabaseUser.id },
  });
  if (bySupabaseId) {
    if (
      bySupabaseId.plan === "FREE" &&
      bySupabaseId.trialExpiresAt === null
    ) {
      const trialEnd = new Date(
        bySupabaseId.createdAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000,
      );
      return prisma.user.update({
        where: { id: bySupabaseId.id },
        data: { trialExpiresAt: trialEnd },
      });
    }
    return bySupabaseId;
  }

  const trialExpiresAt = new Date(
    Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000,
  );

  try {
    return await prisma.user.create({
      data: {
        supabaseId: supabaseUser.id,
        email: supabaseUser.email,
        trialExpiresAt,
      },
    });
  } catch (err) {
    const retry = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });
    if (retry) return retry;
    throw err;
  }
}

export function isTrialExpired(user: {
  plan: string;
  trialExpiresAt: Date | null;
}): boolean {
  if (user.plan !== "FREE") return false;
  if (!user.trialExpiresAt) return false;
  return new Date() > user.trialExpiresAt;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (isTrialExpired(user)) redirect("/pricing?trial=expired");
  return user;
}
