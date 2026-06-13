import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (e) {
    console.error("proxy error:", e);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Match all paths except Next.js internals, static files, and cron API routes.
    "/((?!_next/static|_next/image|favicon.ico|api/cron/|api/webhooks/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
