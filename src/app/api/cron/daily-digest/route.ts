import { NextResponse } from "next/server";
import { runDailyPipeline } from "@/lib/digest";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!expected || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const start = Date.now();

  runDailyPipeline()
    .then((result) => {
      const duration = Date.now() - start;
      console.log(
        "[cron] daily-digest completed:",
        JSON.stringify({
          duration: `${(duration / 1000).toFixed(1)}s`,
          announcementsFetched: result.announcementsFetched,
          analyzed: result.analyzed,
          digestsGenerated: result.digestsGenerated,
          emailsSent: result.emailsSent,
          errors: result.errors,
        }),
      );
    })
    .catch((err) => {
      console.error("[cron] daily-digest failed:", err);
    });

  return NextResponse.json({ status: "started" });
}
