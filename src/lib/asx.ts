import parseHTML from "node-html-parser";

export type ASXAnnouncement = {
  headline: string;
  publishedAt: Date;
  pdfUrl: string;
  idsId: string;
};

const ASX_BASE = "https://www.asx.com.au";

export async function fetchAnnouncements(
  asxCode: string,
): Promise<ASXAnnouncement[]> {
  const url = `${ASX_BASE}/asx/v2/statistics/announcements.do?by=asxCode&asxCode=${asxCode}&timeframe=D&period=T`;

  const res = await fetch(url, {
    headers: { "User-Agent": "MorningMoney/1.0" },
  });

  if (!res.ok) {
    throw new Error(
      `ASX API returned ${res.status} for ${asxCode}`,
    );
  }

  const html = await res.text();
  return parseAnnouncementHtml(html);
}

export function parseAnnouncementHtml(
  html: string,
): ASXAnnouncement[] {
  const root = parseHTML(html);
  const dataEl = root.querySelector("announcement_data");

  if (!dataEl) return [];

  const rows = dataEl.querySelectorAll("tbody tr");
  const announcements: ASXAnnouncement[] = [];

  for (const row of rows) {
    const dateTd = row.querySelector("td:first-child");
    const headlineTd = row.querySelector("td:last-child");

    if (!dateTd || !headlineTd) continue;

    const dateText = dateTd.textContent.trim();
    const headlineLink = headlineTd.querySelector("a");

    if (!headlineLink) continue;

    const href = headlineLink.getAttribute("href") ?? "";
    const headline = (headlineLink.childNodes[0]?.textContent ?? "").trim();

    const idsIdMatch = href.match(/idsId=(\d+)/);
    const idsId = idsIdMatch?.[1];
    if (!idsId) continue;

    const publishedAt = parseAsxDate(dateText);
    if (!publishedAt) continue;

    announcements.push({
      headline,
      publishedAt,
      pdfUrl: `${ASX_BASE}${href}`,
      idsId,
    });
  }

  return announcements;
}

/**
 * Extracts the actual PDF download URL by going through ASX's T&C page.
 */
export async function resolvePdfUrl(displayUrl: string): Promise<string> {
  const res = await fetch(displayUrl, {
    headers: { "User-Agent": "MorningMoney/1.0" },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch display page: ${res.status}`);
  }

  const html = await res.text();
  const root = parseHTML(html);
  const pdfInput = root.querySelector('input[name="pdfURL"]');

  const pdfUrl = pdfInput?.getAttribute("value");
  if (!pdfUrl) {
    throw new Error("Could not find pdfURL in ASX terms page");
  }

  return pdfUrl;
}

/**
 * Downloads a PDF from a URL and returns it as a Buffer.
 */
export async function downloadPdf(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    headers: { "User-Agent": "MorningMoney/1.0" },
  });

  if (!res.ok) {
    throw new Error(`Failed to download PDF: ${res.status}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function parseAsxDate(text: string): Date | null {
  const cleaned = text.replace(/\s*\(.*?\)\s*/g, "").trim();
  const match = cleaned.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;

  const [, day, month, year] = match;
  const date = new Date(`${year}-${month}-${day}T00:00:00+10:00`);
  return isNaN(date.getTime()) ? null : date;
}
