import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto pt-10 pb-12">
      <div className="mx-auto max-w-5xl px-6">
        <hr className="newspaper-rule-thick mb-6" />
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-start">
          <div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[50ch]">
              General information only. Not financial advice. The Morning Money
              provides summaries and analysis of ASX announcements for
              informational purposes. It does not constitute personal financial
              product advice, a recommendation, or an offer. You should consider
              your own circumstances before making any investment decision.
            </p>
            <div className="flex gap-4 mt-3">
              <Link href="/terms" className="text-xs text-muted-foreground hover:text-accent-link transition-colors underline underline-offset-2">
                Terms of Service
              </Link>
              <Link href="/privacy" className="text-xs text-muted-foreground hover:text-accent-link transition-colors underline underline-offset-2">
                Privacy Policy
              </Link>
            </div>
          </div>
          <p className="text-sm text-muted-foreground whitespace-nowrap">
            &copy; 2026 The Morning Money &middot; AFSL pending
          </p>
        </div>
      </div>
    </footer>
  );
}
