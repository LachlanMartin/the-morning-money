import { prisma } from "@/lib/prisma";
import { analyzeUnprocessedAnnouncements } from "@/lib/analysis";
import { ingestAllWatchlistedTickers } from "@/lib/announcements";
import { sendDigestEmail } from "@/lib/email";

export async function generateDigestRun(
  userId: string,
  date: Date,
): Promise<{ digestRunId: string; analysisCount: number } | null> {
  // Check if digest already exists for this user + date
  const existing = await prisma.digestRun.findUnique({
    where: {
      userId_date: {
        userId,
        date: dateToDateOnly(date),
      },
    },
  });

  if (existing?.sentAt) {
    return null;
  }

  // Get the user's watchlist tickers
  const watchlists = await prisma.watchlist.findMany({
    where: { userId },
    include: {
      tickers: { select: { asxCode: true } },
    },
  });

  const asxCodes = new Set(watchlists.flatMap((w) => w.tickers.map((t) => t.asxCode)));
  if (asxCodes.size === 0) return null;

  // Find announcements for today for the user's tickers
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const announcements = await prisma.announcement.findMany({
    where: {
      asxCode: { in: Array.from(asxCodes) },
      publishedAt: { gte: startOfDay, lte: endOfDay },
      analysis: { isNot: null },
    },
    include: {
      analysis: true,
    },
  });

  const analysisIds = announcements.map((a) => a.analysis!.id);

  // Create or update digest run
  const digestRun = await prisma.digestRun.upsert({
    where: {
      userId_date: {
        userId,
        date: dateToDateOnly(date),
      },
    },
    create: {
      userId,
      date: dateToDateOnly(date),
      analysisIds,
    },
    update: {
      analysisIds,
    },
  });

  return {
    digestRunId: digestRun.id,
    analysisCount: analysisIds.length,
  };
}

export async function sendDigest(
  digestRunId: string,
): Promise<boolean> {
  const digestRun = await prisma.digestRun.findUnique({
    where: { id: digestRunId },
    include: {
      user: true,
    },
  });

  if (!digestRun || digestRun.sentAt) return false;

  const analyses = await prisma.analysis.findMany({
    where: { id: { in: digestRun.analysisIds } },
    include: {
      announcement: { select: { asxCode: true, headline: true } },
    },
  });

  const dateStr = digestRun.date.toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const ok = await sendDigestEmail(
    digestRun.user.email,
    analyses.map((a) => ({
      asxCode: a.announcement.asxCode,
      headline: a.announcement.headline,
      summaryMd: a.summaryMd,
      sentiment: a.sentiment as "POSITIVE" | "NEUTRAL" | "NEGATIVE",
      predictedDirection: a.predictedDirection as "UP" | "FLAT" | "DOWN",
      confidence: a.confidence,
    })),
    dateStr,
  );

  if (ok) {
    await prisma.digestRun.update({
      where: { id: digestRunId },
      data: { sentAt: new Date() },
    });
  }

  return ok;
}

function dateToDateOnly(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

export async function runDailyPipeline(): Promise<{
  announcementsFetched: Record<string, number>;
  analyzed: number;
  digestsGenerated: number;
  emailsSent: number;
  errors: string[];
}> {
  const errors: string[] = [];

  const dayOfWeek = new Date().getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return {
      announcementsFetched: {},
      analyzed: 0,
      digestsGenerated: 0,
      emailsSent: 0,
      errors: [],
    };
  }

  // Step 1: Fetch announcements for all watchlisted tickers
  let ingestResults: Record<string, import("@/lib/announcements").IngestResult>;
  try {
    ingestResults = await ingestAllWatchlistedTickers();
  } catch (err) {
    errors.push(`Ingestion failed: ${err}`);
    return {
      announcementsFetched: {},
      analyzed: 0,
      digestsGenerated: 0,
      emailsSent: 0,
      errors,
    };
  }

  const announcementsFetched: Record<string, number> = {};
  for (const [code, result] of Object.entries(ingestResults)) {
    announcementsFetched[code] = result.created;
  }

  const totalFetched = Object.values(ingestResults).reduce(
    (sum, r) => sum + r.fetched,
    0,
  );

  // Step 2: Analyze unprocessed announcements (skip if nothing to analyze)
  let analyzed = 0;
  if (totalFetched > 0) {
    try {
      const analysisResult = await analyzeUnprocessedAnnouncements();
      analyzed = analysisResult.processed;
      errors.push(...analysisResult.errors.map((e) => `Analysis: ${e}`));
    } catch (err) {
      errors.push(`Analysis failed: ${err}`);
    }
  }

  // Step 3: Generate digests for paid users and active trial users
  const today = new Date();
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { plan: "PAID" },
        { plan: "FREE", trialExpiresAt: { gte: today } },
      ],
    },
  });
  let digestsGenerated = 0;
  const digestRunIds: string[] = [];

  for (const user of users) {
    try {
      const result = await generateDigestRun(user.id, today);
      if (result) {
        digestsGenerated++;
        digestRunIds.push(result.digestRunId);
      }
    } catch (err) {
      errors.push(`Digest generation for ${user.email}: ${err}`);
    }
  }

  // Step 4: Send emails
  let emailsSent = 0;
  for (const id of digestRunIds) {
    try {
      const ok = await sendDigest(id);
      if (ok) emailsSent++;
    } catch (err) {
      errors.push(`Email send for digest ${id}: ${err}`);
    }
  }

  return {
    announcementsFetched,
    analyzed,
    digestsGenerated,
    emailsSent,
    errors,
  };
}
