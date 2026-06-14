import { prisma } from "@/lib/prisma";
import {
  fetchAnnouncements,
  resolvePdfUrl,
  downloadPdf,
} from "@/lib/asx";
import { savePdf } from "@/lib/storage";
import { sourceHash } from "@/lib/hash";

export type IngestResult = {
  fetched: number;
  created: number;
  skipped: number;
  errors: string[];
};

/**
 * Fetches today's announcements for a given ASX code, downloads PDFs,
 * uploads to local storage, and creates Announcement records.
 */
export async function ingestAnnouncements(
  asxCode: string,
): Promise<IngestResult> {
  const result: IngestResult = {
    fetched: 0,
    created: 0,
    skipped: 0,
    errors: [],
  };

  let announcements;
  try {
    announcements = await fetchAnnouncements(asxCode);
  } catch (err) {
    result.errors.push(
      `Failed to fetch announcements for ${asxCode}: ${err}`,
    );
    return result;
  }

  result.fetched = announcements.length;

  for (const ann of announcements) {
    const hash = sourceHash(ann.idsId);

    const existing = await prisma.announcement.findUnique({
      where: { sourceHash: hash },
    });
    if (existing) {
      result.skipped++;
      continue;
    }

    let pdfS3Key: string;

    try {
      const pdfUrl = await resolvePdfUrl(ann.pdfUrl);
      const pdfBuffer = await downloadPdf(pdfUrl);
      pdfS3Key = await savePdf(ann.idsId, pdfBuffer);
    } catch (err) {
      result.errors.push(
        `Failed to process ${ann.idsId} (${ann.headline}): ${err}`,
      );
      continue;
    }

    try {
      await prisma.announcement.create({
        data: {
          asxCode,
          headline: ann.headline,
          publishedAt: ann.publishedAt,
          pdfS3Key,
          sourceHash: hash,
        },
      });
      result.created++;
    } catch (err) {
      if (
        err instanceof Error &&
        "code" in err &&
        (err as { code: unknown }).code === "P2002"
      ) {
        result.skipped++;
      } else {
        result.errors.push(
          `Failed to save announcement ${ann.idsId}: ${err}`,
        );
      }
    }
  }

  return result;
}

/**
 * Ingests announcements for all unique ASX codes across all watchlists
 * belonging to users with active (non-expired) accounts.
 */
export async function ingestAllWatchlistedTickers(): Promise<
  Record<string, IngestResult>
> {
  const tickers = await prisma.watchlistTicker.findMany({
    distinct: ["asxCode"],
    select: { asxCode: true },
    where: {
      watchlist: {
        user: {
          OR: [
            { plan: "PAID" },
            { trialExpiresAt: { gte: new Date() } },
          ],
        },
      },
    },
  });

  const results: Record<string, IngestResult> = {};

  for (const { asxCode } of tickers) {
    results[asxCode] = await ingestAnnouncements(asxCode);
  }

  return results;
}
