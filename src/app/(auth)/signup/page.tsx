"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp, type AuthState } from "../actions";

const initial: AuthState = { error: null };

export default function SignUpPage() {
  const [state, action, pending] = useActionState(signUp, initial);

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
                placeholder="jamie@example.com"
                autoComplete="email"
                required
                className="w-full px-3.5 py-2.5 border border-input bg-surface text-foreground font-sans text-[15px] rounded-none h-auto focus:outline-2 focus:outline-accent-link focus:border-accent-link"
              />
            </div>
            <div className="mb-[18px]">
              <Label
                htmlFor="password"
                className="font-mono text-[11px] tracking-wider uppercase text-muted-foreground mb-1.5 block"
              >
                Password
              </Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Create a strong password"
                autoComplete="new-password"
                minLength={8}
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
              {pending ? "Creating account\u2026" : "Start Free Trial"}
            </button>
            <p className="text-center text-sm text-muted-foreground mt-4 leading-relaxed">
              7-day free trial. No credit card required. Cancel anytime.
            </p>
            <p className="text-center text-sm text-muted-foreground mt-5">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-accent-link underline underline-offset-2 hover:text-accent-hover transition-colors"
              >
                Sign in
              </Link>
            </p>
          </form>
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
