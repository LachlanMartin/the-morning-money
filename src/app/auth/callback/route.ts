import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles Supabase email-confirmation links (?code=…) and password-reset
// links (?token_hash=…&type=recovery). For password reset, the token is
// consumed by Supabase's verify endpoint before redirecting here, so we
// check for an existing session as a fallback. Redirect to ?next or
// /dashboard.
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

  // Already authenticated (token consumed by Supabase before redirect) —
  // just forward to the next page
  const { data } = await supabase.auth.getUser();
  if (data.user) {
    return NextResponse.redirect(new URL(next, url.origin));
  }

  return NextResponse.redirect(new URL("/login?error=auth", url.origin));
}
