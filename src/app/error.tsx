"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-20 text-center">
      <h1
        className="font-heading text-4xl font-black mb-4"
        style={{ fontFamily: "var(--font-heading-family)" }}
      >
        Something went wrong
      </h1>
      <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <div className="flex gap-4 justify-center">
        <button
          onClick={reset}
          className={buttonVariants({
            className: "text-xs font-mono tracking-wider uppercase",
          })}
        >
          Try Again
        </button>
        <Link
          href="/"
          className={buttonVariants({
            variant: "outline",
            className: "text-xs font-mono tracking-wider uppercase",
          })}
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
