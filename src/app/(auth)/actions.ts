"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/utils";

export type AuthState = { error: string | null };

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return { error: error.message };

    revalidatePath("/", "layout");
    redirect(next);
  } catch (err: unknown) {
    console.error("signIn error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) return { error: error.message };

    if (!data.session) {
      redirect("/signup/check-email");
    }

    revalidatePath("/", "layout");
    redirect("/dashboard");
  } catch (err: unknown) {
    console.error("signUp error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}

export async function forgotPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState & { sent: boolean }> {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    return { error: "Email is required.", sent: false };
  }

  const origin = siteUrl();
  const redirectTo = `${origin}/auth/callback?next=/reset-password`;

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) return { error: error.message, sent: false };

    return { error: null, sent: true };
  } catch (err: unknown) {
    console.error("forgotPassword error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return { error: message, sent: false };
  }
}

export async function resetPassword(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState & { success: boolean }> {
  const password = String(formData.get("password") ?? "");

  if (!password) {
    return { error: "Password is required.", success: false };
  }
  if (password.length < 8) {
    return { error: "Password must be at least 8 characters.", success: false };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: error.message, success: false };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
