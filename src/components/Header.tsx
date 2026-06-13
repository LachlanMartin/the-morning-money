import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";

export async function Header() {
  let user = null;
  try {
    user = await getCurrentUser();
  } catch {
    // fall through — render logged-out UI
  }

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

        {/* Mobile hamburger */}
        <details className="sm:hidden group">
          <summary className="list-none flex items-center cursor-pointer p-1 select-none [&::-webkit-details-marker]:hidden">
            <div className="w-6 flex flex-col gap-1">
              <span className="block h-0.5 w-6 bg-foreground transition-transform group-open:rotate-45 group-open:translate-y-1.5" />
              <span className="block h-0.5 w-6 bg-foreground transition-opacity group-open:opacity-0" />
              <span className="block h-0.5 w-6 bg-foreground transition-transform group-open:-rotate-45 group-open:-translate-y-1.5" />
            </div>
          </summary>
          <nav className="absolute top-full left-0 right-0 bg-background border-b-2 border-foreground p-4 flex flex-col gap-3">
            {user ? (
              <>
                <span className="text-sm text-muted-foreground font-mono text-xs tracking-wider">
                  {user.email}
                </span>
                {user.plan === "FREE" && (
                  <Link
                    href="/pricing"
                    className="text-sm text-accent-link hover:text-accent-hover transition-colors font-mono text-xs uppercase tracking-wider"
                  >
                    Upgrade
                  </Link>
                )}
                <form action="/auth/signout" method="post">
                  <button
                    type="submit"
                    className={buttonVariants({
                      variant: "outline",
                      size: "sm",
                      className:
                        "w-full text-xs font-mono tracking-wider uppercase h-9 transition-all hover:bg-foreground hover:text-background",
                    })}
                  >
                    Sign Out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/pricing"
                  className="text-sm text-muted-foreground hover:text-accent-link transition-colors font-mono text-xs uppercase tracking-wider"
                >
                  Pricing
                </Link>
                <Link
                  href="/login"
                  className="text-sm text-muted-foreground hover:text-accent-link transition-colors font-mono text-xs uppercase tracking-wider"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className={buttonVariants({
                    size: "sm",
                    className:
                      "w-full text-xs font-mono tracking-wider uppercase h-9 transition-all",
                  })}
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>
        </details>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground font-mono text-xs tracking-wider hidden sm:inline">
                {user.email}
              </span>
              {user.plan === "FREE" && (
                <Link
                  href="/pricing"
                  className="text-sm text-accent-link hover:text-accent-hover transition-colors font-mono text-xs uppercase tracking-wider"
                >
                  Upgrade
                </Link>
              )}
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className={buttonVariants({
                    variant: "outline",
                    size: "sm",
                    className:
                      "text-xs font-mono tracking-wider uppercase h-8 transition-all hover:bg-foreground hover:text-background",
                  })}
                >
                  Sign Out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/pricing"
                className="text-sm text-muted-foreground hover:text-accent-link transition-colors font-mono text-xs uppercase tracking-wider"
              >
                Pricing
              </Link>
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-accent-link transition-colors font-mono text-xs uppercase tracking-wider"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className={buttonVariants({
                  size: "sm",
                  className:
                    "text-xs font-mono tracking-wider uppercase h-8 transition-all",
                })}
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
