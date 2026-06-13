import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = url.searchParams.get("next") ?? "/dashboard";

  const supabase = await createClient();

  // Signup confirmation — exchange code for session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
    return NextResponse.redirect(new URL("/login?error=auth", url.origin));
  }

  // Password reset — exchange token_hash for session
  if (type === "recovery" && tokenHash) {
    const { error } = await supabase.auth.verifyOtp({
      type: "recovery",
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(new URL(next, url.origin));
    }
    return NextResponse.redirect(new URL("/login?error=auth", url.origin));
  }

  // Fallback: Supabase may have already set the session via the redirect.
  // Call getSession() to trigger the middleware-level cookie exchange, then
  // check getUser() for the session.
  await supabase.auth.getSession();
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    return NextResponse.redirect(new URL(next, url.origin));
  }

  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}
