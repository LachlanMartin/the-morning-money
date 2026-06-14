import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { isLocalMode } from "@/lib/app-mode";

const TRIAL_DAYS = 7;
const LOCAL_USER_SUPABASE_ID = "local";

async function getOrCreateLocalUser() {
  const email = process.env.LOCAL_USER_EMAIL;
  if (!email) throw new Error("LOCAL_USER_EMAIL is required in local mode");

  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) return existing;

  const farFuture = new Date();
  farFuture.setFullYear(farFuture.getFullYear() + 100);

  try {
    return await prisma.user.create({
      data: {
        supabaseId: LOCAL_USER_SUPABASE_ID,
        email,
        trialExpiresAt: farFuture,
      },
    });
  } catch {
    return prisma.user.findFirst({ where: { email } });
  }
}

/**
 * Returns the Prisma User for the current session. In local mode, returns the
 * single user from LOCAL_USER_EMAIL. In public mode, resolves via Supabase auth.
 * Returns null if no session.
 */
export async function getCurrentUser() {
  if (isLocalMode()) {
    return getOrCreateLocalUser();
  }

  try {
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
  } catch {
    return null;
  }
}

export function isTrialExpired(user: {
  plan: string;
  trialExpiresAt: Date | null;
}): boolean {
  if (isLocalMode()) return false;
  if (user.plan !== "FREE") return false;
  if (!user.trialExpiresAt) return false;
  return new Date() > user.trialExpiresAt;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    if (isLocalMode()) throw new Error("LOCAL_USER_EMAIL not configured");
    redirect("/login");
  }
  if (isTrialExpired(user)) redirect("/pricing?trial=expired");
  return user;
}
