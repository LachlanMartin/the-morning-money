"use client";

import Link from "next/link";
import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, type AuthState } from "../actions";

const initial: AuthState = { error: null };

function LoginForm() {
  const [state, action, pending] = useActionState(signIn, initial);
  const next = useSearchParams().get("next") ?? "/dashboard";

  return (
    <form action={action} className="mt-6 w-full max-w-sm space-y-4">
      <input type="hidden" name="next" value={next} />
      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs uppercase tracking-wider">
          Email
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label
          htmlFor="password"
          className="text-xs uppercase tracking-wider"
        >
          Password
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="text-sm"
        />
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className={buttonVariants({
          className: "w-full text-sm tracking-wider uppercase",
        })}
      >
        {pending ? "Signing in…" : "Sign In"}
      </button>
      <p className="text-center text-xs text-muted-foreground">
        No account?{" "}
        <Link href="/signup" className="underline underline-offset-2">
          Sign up
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-svh w-full max-w-lg flex-col items-center justify-center px-6">
      <Link
        href="/"
        className="font-heading text-3xl font-black tracking-tight no-underline"
        style={{ fontFamily: "var(--font-heading-family)" }}
      >
        The Morning Money
      </Link>
      <hr className="newspaper-rule-thick mt-4 w-full max-w-sm" />
      <h2
        className="font-heading mt-6 text-xl font-bold"
        style={{ fontFamily: "var(--font-heading-family)" }}
      >
        Sign In
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Welcome back to your daily briefing.
      </p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
