import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function ReportsPage() {
  const user = await requireUser();

  const digestRuns = await prisma.digestRun.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
  });

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-AU", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8">
      {/* Dateline */}
      <div className="flex items-center justify-between text-xs font-mono tracking-wider text-muted-foreground pb-3 border-b border-border">
        <span>
          {dateStr} &middot; ASX Edition
        </span>
        <Link
          href="/dashboard"
          className="hover:text-accent-link transition-colors uppercase"
        >
          &larr; Back to Watchlists
        </Link>
      </div>

      {/* Header */}
      <div className="mt-8 mb-2">
        <h1
          className="font-heading text-[clamp(28px,3vw,36px)] font-extrabold leading-tight"
          style={{ fontFamily: "var(--font-heading-family)" }}
        >
          Daily Reports
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your ASX announcement digests, archived.
        </p>
      </div>

      <div className="flex gap-8 items-baseline py-4 border-b border-border mb-6">
        <div className="flex items-baseline gap-1.5">
          <span
            className="font-heading text-3xl font-extrabold leading-none"
            style={{ fontFamily: "var(--font-heading-family)" }}
          >
            {digestRuns.length}
          </span>
          <span className="text-sm text-muted-foreground uppercase font-mono text-xs tracking-wider">
            Reports
          </span>
        </div>
      </div>

      {digestRuns.length === 0 ? (
        <div className="border border-border p-12 sm:p-16 text-center bg-surface">
          <h3
            className="font-heading text-xl font-bold mb-2"
            style={{ fontFamily: "var(--font-heading-family)" }}
          >
            No reports yet
          </h3>
          <p className="text-sm text-muted-foreground max-w-[36ch] mx-auto leading-relaxed">
            Your daily reports will appear here once the next ASX trading day
            digest is generated. Hang tight.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {digestRuns.map((run) => {
            const digestDate = new Date(run.date);
            const formattedDate = digestDate.toLocaleDateString("en-AU", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });
            return (
              <Link
                key={run.id}
                href={`/dashboard/reports/${run.id}`}
                className="block border border-border p-5 bg-surface hover:border-foreground transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3
                      className="font-heading text-lg font-bold group-hover:text-accent-link transition-colors"
                      style={{ fontFamily: "var(--font-heading-family)" }}
                    >
                      {formattedDate}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5 font-mono text-xs tracking-wider uppercase">
                      {run.analysisIds.length}{" "}
                      {run.analysisIds.length === 1
                        ? "announcement"
                        : "announcements"}
                      {run.sentAt ? "" : " \u2022 not yet sent"}
                    </p>
                  </div>
                  <span className="text-muted-foreground font-mono text-xs tracking-wider group-hover:text-accent-link transition-colors">
                    View &rarr;
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
