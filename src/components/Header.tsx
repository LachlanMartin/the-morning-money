import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 bg-background border-b-2 border-foreground">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3 sm:py-4">
        <Link
          href={user ? "/dashboard" : "/"}
          className="font-heading text-2xl sm:text-[clamp(28px,4vw,42px)] font-black tracking-tight no-underline leading-none hover:text-accent-link transition-colors"
          style={{ fontFamily: "var(--font-heading-family)" }}
        >
          The Morning Money
        </Link>

        {/* Desktop nav */}
        <nav className="flex items-center gap-6">
          {user && (
            <Link
              href="/dashboard/reports"
              className="text-sm text-muted-foreground hover:text-accent-link transition-colors font-mono text-xs uppercase tracking-wider"
            >
              Reports
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
