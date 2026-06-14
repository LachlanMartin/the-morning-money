import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isLocalMode } from "@/lib/app-mode";

export async function POST(request: NextRequest) {
  if (isLocalMode()) return NextResponse.redirect(new URL("/dashboard", request.url), { status: 303 });

  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
