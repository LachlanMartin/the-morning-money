import Link from "next/link";

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full max-w-sm text-center">
          <Link
            href="/"
            className="font-heading text-[clamp(28px,4vw,36px)] font-black tracking-tight no-underline inline-block mb-5 hover:text-accent-link transition-colors"
            style={{ fontFamily: "var(--font-heading-family)" }}
          >
            The Morning Money
          </Link>
          <hr className="border-t border-foreground mb-8" />
          <h2
            className="font-heading text-2xl font-bold mb-3"
            style={{ fontFamily: "var(--font-heading-family)" }}
          >
            Check Your Email
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
            We sent you a confirmation link. Click it to finish signing up.
          </p>
          <p className="text-sm text-muted-foreground mt-6">
            Didn&apos;t get it? Check your spam folder, or{" "}
            <Link
              href="/signup"
              className="text-accent-link underline underline-offset-2 hover:text-accent-hover transition-colors"
            >
              try signing up again
            </Link>
            .
          </p>
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
