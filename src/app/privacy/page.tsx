import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — The Morning Money",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <h1
        className="font-heading text-3xl font-black mb-6"
        style={{ fontFamily: "var(--font-heading-family)" }}
      >
        Privacy Policy
      </h1>
      <div className="text-sm leading-relaxed text-muted-foreground space-y-4">
        <p>
          <strong className="text-foreground">1. Information We Collect</strong><br />
          We collect your email address and account credentials (via Supabase Auth)
          when you sign up. We store your watchlist preferences and ASX ticker
          selections. We do not collect any personal financial data, portfolio
          holdings, or trading history.
        </p>
        <p>
          <strong className="text-foreground">2. How We Use Your Information</strong><br />
          Your email is used to send your daily digest and account-related
          notifications. Your watchlist data is used to fetch and analyse ASX
          announcements relevant to you.
        </p>
        <p>
          <strong className="text-foreground">3. Data Sharing</strong><br />
          We do not sell or share your personal data with third parties. We use
          Supabase for authentication and database hosting, AWS S3 for PDF
          storage, Resend for email delivery, and Stripe for payment processing.
          Each of these providers processes data under their own privacy
          commitments.
        </p>
        <p>
          <strong className="text-foreground">4. Data Retention</strong><br />
          We retain your account data for as long as your account is active. You
          may request deletion of your account and associated data at any time
          by contacting us.
        </p>
        <p>
          <strong className="text-foreground">5. Cookies</strong><br />
          We use essential cookies for authentication and session management. We
          do not use tracking cookies or analytics cookies.
        </p>
        <p>
          <strong className="text-foreground">6. Contact</strong><br />
          For privacy inquiries, email privacy@morning-money.app.
        </p>
        <p className="text-xs text-muted-foreground">
          Last updated: June 2026
        </p>
      </div>
    </div>
  );
}
