"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPassword } from "../actions";

const initial = { error: null, sent: false };

function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPassword, initial);

  if (state.sent) {
    return (
      <div className="text-center">
        <h2
          className="font-heading text-2xl font-bold mb-3"
          style={{ fontFamily: "var(--font-heading-family)" }}
        >
          Check Your Email
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
          If an account exists for that email, we sent a password reset link.
        </p>
        <p className="text-sm text-muted-foreground mt-6">
          <Link
            href="/login"
            className="text-accent-link underline underline-offset-2 hover:text-accent-hover transition-colors"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form action={action}>
      <div className="mb-[18px]">
        <Label
          htmlFor="email"
          className="font-mono text-[11px] tracking-wider uppercase text-muted-foreground mb-1.5 block"
        >
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
          className="w-full px-3.5 py-2.5 border border-input bg-surface text-foreground font-sans text-[15px] rounded-none h-auto focus:outline-2 focus:outline-accent-link focus:border-accent-link"
        />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive mb-3">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full py-3 bg-foreground text-background font-mono text-xs tracking-[0.08em] uppercase border-none rounded-none mt-2 cursor-pointer transition-colors duration-150 hover:bg-accent-link disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Sending\u2026" : "Send Reset Link"}
      </button>
      <p className="text-center text-sm text-muted-foreground mt-5">
        <Link
          href="/login"
          className="text-accent-link underline underline-offset-2 hover:text-accent-hover transition-colors"
        >
          Back to sign in
        </Link>
      </p>
    </form>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm">
          <Link
            href="/"
            className="font-heading text-[clamp(28px,4vw,36px)] font-black tracking-tight no-underline inline-block mb-5 hover:text-accent-link transition-colors"
            style={{ fontFamily: "var(--font-heading-family)" }}
          >
            The Morning Money
          </Link>
          <hr className="border-t border-foreground mb-7" />
          <ForgotPasswordForm />
        </div>
      </main>
      <footer className="py-6 px-6 text-center">
        <p className="text-sm text-muted-foreground max-w-[48ch] mx-auto leading-relaxed">
          General information only. Not financial advice.
        </p>
      </footer>
    </div>
  );
}
