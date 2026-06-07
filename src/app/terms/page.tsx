import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — The Morning Money",
};

export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1
        className="font-heading text-3xl font-black mb-6"
        style={{ fontFamily: "var(--font-heading-family)" }}
      >
        Terms of Service
      </h1>
      <div className="text-sm leading-relaxed text-muted-foreground space-y-4">
        <p>
          <strong className="text-foreground">1. Service</strong><br />
          The Morning Money provides plain-English summaries of ASX announcements
          (the &ldquo;Service&rdquo;). The Service is for informational purposes only
          and does not constitute financial advice.
        </p>
        <p>
          <strong className="text-foreground">2. No Financial Advice</strong><br />
          The Service provides general information and sentiment analysis. It does
          not take into account your personal financial situation, objectives, or
          needs. You should seek independent financial advice before making any
          investment decisions.
        </p>
        <p>
          <strong className="text-foreground">3. Accounts</strong><br />
          You are responsible for maintaining the confidentiality of your account
          credentials. You must notify us immediately of any unauthorised use.
        </p>
        <p>
          <strong className="text-foreground">4. Subscription</strong><br />
          Paid plans are billed monthly. You may cancel at any time. Cancellation
          takes effect at the end of the current billing period. No refunds for
          partial periods.
        </p>
        <p>
          <strong className="text-foreground">5. Limitation of Liability</strong><br />
          The Service is provided &ldquo;as is&rdquo;. We make no representations or
          warranties about the accuracy, reliability, or completeness of the
          summaries. To the maximum extent permitted by law, we disclaim all
          liability for any loss or damage arising from your use of the Service.
        </p>
        <p>
          <strong className="text-foreground">6. Changes</strong><br />
          We may update these terms at any time. Continued use of the Service
          after changes constitutes acceptance of the new terms.
        </p>
        <p className="text-xs text-muted-foreground">
          Last updated: June 2026
        </p>
      </div>
    </div>
  );
}
