import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { marked } from "marked";

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

  const mdContent = analyses.length === 0
    ? "\n\nNo announcements for your watchlists on this day.\n"
    : analyses.map((a, i) => {
        const sep = i > 0 ? "\n\n---\n\n" : "";
        return `${sep}${a.summaryMd}`;
      }).join("");

  const bodyHtml = marked.parse(mdContent, { async: false }) as string;

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

      {/* Analyses — markdown rendered */}
      <div
        className="prose prose-sm max-w-none
          prose-headings:font-heading prose-headings:font-bold prose-headings:tracking-tight
          prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3
          prose-p:text-[15px] prose-p:leading-relaxed prose-p:mb-3
          prose-strong:font-bold
          prose-em:italic prose-em:text-muted-foreground
          prose-hr:border-border prose-hr:my-6
          [&_h2]:font-heading [&_h2]:font-bold [&_h2]:tracking-tight
          [&_h2]:text-xl [&_h2]:mt-8 [&_h2]:mb-3
          [&_p]:text-[15px] [&_p]:leading-relaxed [&_p]:mb-3
          [&_strong]:font-bold
          [&_em]:italic [&_em]:text-muted-foreground
          [&_hr]:border-border [&_hr]:my-6"
        dangerouslySetInnerHTML={{ __html: bodyHtml }}
      />

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
