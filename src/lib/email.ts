import { marked } from "marked";
import { getTransport, getFromAddress } from "@/lib/smtp";
import type { Sentiment, Direction } from "@/generated/prisma/client";

type AnalysisForEmail = {
  asxCode: string;
  headline: string;
  summaryMd: string;
  sentiment: Sentiment | null;
  predictedDirection: Direction | null;
  confidence: number | null;
};

function buildEmailHtml(
  analyses: AnalysisForEmail[],
  dateStr: string,
): string {
  const intro = "Here are today's announcements for your watchlist tickers.\n\nGeneral information only — not financial advice.";

  const body = analyses.length === 0
    ? "No announcements for your watchlists today.\n"
    : analyses.map((a, i) => {
        const sep = i > 0 ? "\n\n---\n\n" : "";
        return `${sep}${a.summaryMd}`;
      }).join("");

  const md = `${intro}\n\n---\n\n${body}`;

  const contentHtml = marked.parse(md, { async: false }) as string;

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Your Morning Money digest</title>
  <style>
    .email-body h2 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 20px;
      font-weight: 700;
      color: #1a1a1a;
      margin: 16px 0 8px;
      line-height: 1.25;
    }
    .email-body h2:first-child { margin-top: 0; }
    .email-body p {
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 15px;
      line-height: 1.6;
      color: #1a1a1a;
      margin: 0 0 10px;
    }
    .email-body strong { font-weight: 700; }
    .email-body em { font-style: italic; color: #6b6258; }
    .email-body hr {
      border: none;
      border-top: 1px solid #8a8a7a;
      margin: 20px 0;
    }
  </style>
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
          <!-- Content body (markdown rendered) -->
          <tr>
            <td class="email-body" style="padding:16px 24px 0;">
              ${contentHtml}
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
): Promise<boolean> {
  const transport = getTransport();
  const from = getFromAddress();
  try {
    await transport.sendMail({
      from,
      to,
      subject: `Your Morning Money digest \u2014 ${dateStr}`,
      html: buildEmailHtml(analyses, dateStr),
    });
    return true;
  } catch (error) {
    console.error("Failed to send digest email:", error);
    return false;
  }
}
