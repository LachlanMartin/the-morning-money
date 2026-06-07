import Link from "next/link";

export default function CheckEmailPage() {
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
        className="font-heading mt-6 text-xl font-bold text-center"
        style={{ fontFamily: "var(--font-heading-family)" }}
      >
        Check Your Email
      </h2>
      <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
        We sent you a confirmation link. Click it to finish signing up.
      </p>
      <p className="mt-6 text-xs text-muted-foreground text-center">
        Didn&apos;t get it? Check your spam folder, or{" "}
        <Link href="/signup" className="underline underline-offset-2">
          try signing up again
        </Link>
        .
      </p>
    </div>
  );
}
