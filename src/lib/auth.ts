import { prisma } from "@/lib/prisma";

async function getOrCreateLocalUser() {
  const email = process.env.LOCAL_USER_EMAIL;
  if (!email) throw new Error("LOCAL_USER_EMAIL is required");

  const existing = await prisma.user.findFirst({ where: { email } });
  if (existing) return existing;

  const farFuture = new Date();
  farFuture.setFullYear(farFuture.getFullYear() + 100);

  try {
    return await prisma.user.create({
      data: {
        email,
        trialExpiresAt: farFuture,
      },
    });
  } catch {
    return prisma.user.findFirst({ where: { email } });
  }
}

export async function getCurrentUser() {
  return getOrCreateLocalUser();
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("LOCAL_USER_EMAIL not configured");
  return user;
}
