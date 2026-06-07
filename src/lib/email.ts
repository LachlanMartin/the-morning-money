import { getResendClient } from "@/lib/resend";

const FROM_ADDRESS = "Morning Money <daily@morning-money.app>";

type AnalysisForEmail = {
  asxCode: string;
  headline: string;
  summaryMd: string;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  predictedDirection: "UP" | "FLAT" | "DOWN";
  confidence: number;
};

function sentimentLabel(s: string): string {
  if (s === "POSITIVE") return "Positive";
  if (s === "NEGATIVE") return "Negative";
  return "Neutral";
}

function directionArrow(d: string): string {
  if (d === "UP") return "\u2191";
  if (d === "DOWN") return "\u2193";
  return "\u2192";
}

function buildEmailHtml(
  analyses: AnalysisForEmail[],
  dateStr: string,
  unsubscribeUrl: string,
): string {
  const items = analyses
    .map(
      (a) => `
    <tr>
      <td style="padding:20px 0 16px;border-bottom:1px solid #8a8a7a;">
        <table cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#5b7a9a;padding-bottom:6px;">
              ${a.asxCode}
            </td>
          </tr>
          <tr>
            <td style="font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:700;color:#1a1a1a;padding-bottom:8px;line-height:1.25;">
              ${a.headline}
            </td>
          </tr>
          <tr>
            <td style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.6;color:#1a1a1a;padding-bottom:10px;">
              ${a.summaryMd.replace(/\n/g, "<br>")}
            </td>
          </tr>
          <tr>
            <td style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#6b6258;">
              <span style="color:${a.sentiment === "POSITIVE" ? "#1a7a3a" : a.sentiment === "NEGATIVE" ? "#b33a3a" : "#6b6258"}">${sentimentLabel(a.sentiment)}</span>
              &nbsp;&middot;&nbsp;
              ${directionArrow(a.predictedDirection)} ${a.predictedDirection}
              &nbsp;&middot;&nbsp;
              ${Math.round(a.confidence * 100)}% confidence
            </td>
          </tr>
        </table>
      </td>
    </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your Morning Money digest</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;">
  <table cellpadding="0" cellspacing="0" width="100%">
    <tr>
      <td align="center" style="padding:0;">
        <table cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#f5f0e8;">
          <!-- Masthead -->
          <tr>
            <td style="border-bottom:2px solid #1a1a1a;padding:24px 24px 16px;text-align:center;">
              <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:900;letter-spacing:-0.02em;color:#1a1a1a;margin:0;line-height:1;">
                The Morning Money
              </h1>
            </td>
          </tr>
          <!-- Dateline -->
          <tr>
            <td style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.04em;color:#6b6258;text-transform:uppercase;padding:10px 24px;border-bottom:1px solid #8a8a7a;text-align:center;">
              ${dateStr} &middot; ASX Edition
            </td>
          </tr>
          <!-- Intro -->
          <tr>
            <td style="padding:24px 24px 0;">
              <p style="font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.5;color:#6b6258;margin:0;">
                Here are today's announcements for your watchlist tickers.
                General information only &mdash; not financial advice.
              </p>
            </td>
          </tr>
          <!-- Analyses -->
          <tr>
            <td style="padding:8px 24px 0;">
              <table cellpadding="0" cellspacing="0" width="100%">
                ${items || "<tr><td style='font-family:Georgia,serif;font-size:15px;color:#6b6258;padding:20px 0;text-align:center;'>No announcements for your watchlists today.</td></tr>"}
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="border-top:2px solid #1a1a1a;padding:20px 24px;text-align:center;">
              <p style="font-family:Georgia,'Times New Roman',serif;font-size:12px;line-height:1.5;color:#6b6258;margin:0 0 12px;">
                General information only. Not financial advice.
                The Morning Money provides summaries of ASX announcements
                for informational purposes. It does not constitute personal
                financial product advice.
              </p>
              <p style="font-family:Georgia,'Times New Roman',serif;font-size:12px;color:#6b6258;margin:0;">
                <a href="${unsubscribeUrl}" style="color:#5b7a9a;text-decoration:underline;">Unsubscribe</a>
                &nbsp;&middot;&nbsp;
                &copy; 2026 The Morning Money
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendDigestEmail(
  to: string,
  analyses: AnalysisForEmail[],
  dateStr: string,
  idempotencyKey: string,
): Promise<boolean> {
  const resend = getResendClient();
  const unsubscribeUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://morning-money.app"}/unsubscribe`;

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Your Morning Money digest \u2014 ${dateStr}`,
    html: buildEmailHtml(analyses, dateStr, unsubscribeUrl),
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
  });

  if (error) {
    console.error("Failed to send digest email:", error);
    return false;
  }

  return true;
}
