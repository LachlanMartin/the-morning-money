import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function sentimentLabel(s: string): string {
  if (s === "POSITIVE") return "Positive";
  if (s === "NEGATIVE") return "Negative";
  return "Neutral";
}

function sentimentColor(s: string): string {
  if (s === "POSITIVE") return "text-green-700 dark:text-green-400";
  if (s === "NEGATIVE") return "text-red-700 dark:text-red-400";
  return "text-muted-foreground";
}

function directionArrow(d: string): string {
  if (d === "UP") return "\u2191";
  if (d === "DOWN") return "\u2193";
  return "\u2192";
}

export default async function ReportDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await requireUser();

  const digestRun = await prisma.digestRun.findUnique({
    where: { id },
  });

  if (!digestRun || digestRun.userId !== user.id) {
    notFound();
  }

  const analyses = await prisma.analysis.findMany({
    where: { id: { in: digestRun.analysisIds } },
    include: {
      announcement: { select: { asxCode: true, headline: true } },
    },
  });

  const digestDate = new Date(digestRun.date);
  const dateStr = digestDate.toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      {/* Dateline */}
      <div className="flex items-center justify-between text-xs font-mono tracking-wider text-muted-foreground pb-3 border-b border-border">
        <span>{dateStr} &middot; ASX Edition</span>
      </div>

      {/* Masthead */}
      <div className="mt-8 mb-6 text-center">
        <h1
          className="font-heading text-[clamp(32px,5vw,48px)] font-black tracking-tight"
          style={{ fontFamily: "var(--font-heading-family)" }}
        >
          The Morning Money
        </h1>
        <p className="font-mono text-xs tracking-wider text-muted-foreground uppercase mt-2">
          {dateStr} &middot; ASX Edition
        </p>
      </div>

      {/* Disclaimer */}
      <div className="border-y border-border py-3 mb-8 text-center">
        <p className="text-sm text-muted-foreground max-w-[52ch] mx-auto leading-relaxed font-sans">
          General information only &mdash; not financial advice. These are
          AI-generated summaries of ASX announcements for informational
          purposes.
        </p>
      </div>

      {/* Analyses */}
      {analyses.length === 0 ? (
        <div className="border border-border p-12 sm:p-16 text-center bg-surface">
          <p className="text-sm text-muted-foreground">
            No announcements for your watchlists on this day.
          </p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {analyses.map((a) => (
            <article key={a.id} className="py-6 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs tracking-wider uppercase text-accent-link font-semibold">
                  {a.announcement.asxCode}
                </span>
              </div>
              <h2
                className="font-heading text-xl font-bold leading-tight mb-3"
                style={{ fontFamily: "var(--font-heading-family)" }}
              >
                {a.announcement.headline}
              </h2>
              <p className="text-[15px] leading-relaxed text-foreground mb-3 font-sans whitespace-pre-line">
                {a.summaryMd}
              </p>
              <div className="flex items-center gap-2 font-mono text-xs tracking-wider text-muted-foreground">
                <span className={sentimentColor(a.sentiment)}>
                  {sentimentLabel(a.sentiment)}
                </span>
                <span>&middot;</span>
                <span>
                  {directionArrow(a.predictedDirection)}{" "}
                  {a.predictedDirection}
                </span>
                <span>&middot;</span>
                <span>{Math.round(a.confidence * 100)}% confidence</span>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="border-t-2 border-foreground mt-10 pt-4 text-center">
        <p className="font-mono text-[10px] tracking-wider text-muted-foreground uppercase">
          {digestRun.sentAt
            ? `Sent ${new Date(digestRun.sentAt).toLocaleDateString("en-AU", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}`
            : "Not yet sent"}
          &nbsp;&middot;&nbsp;
          &copy; {new Date().getFullYear()} The Morning Money
        </p>
      </div>
    </div>
  );
}
