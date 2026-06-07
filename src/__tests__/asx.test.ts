import { describe, it, expect } from "vitest";
import { parseAnnouncementHtml } from "@/lib/asx";

const ASX_HTML = `<announcement_data>
  <tbody>
    <tr>
      <td nowrap="nowrap"><nobr>05/06/2026&nbsp;09:15</nobr></td>
      <td nowrap="nowrap"><nobr>1</nobr></td>
      <td nowrap="nowrap"><nobr>Price Sensitive</nobr></td>
      <td><nobr><a href="/asx/statistics/displayAnnouncement.do?display=text&amp;idsId=02329984">AGL announces board retirement</a></nobr></td>
    </tr>
    <tr>
      <td nowrap="nowrap"><nobr>05/06/2026&nbsp;08:30</nobr></td>
      <td nowrap="nowrap"><nobr>2</nobr></td>
      <td nowrap="nowrap"><nobr></nobr></td>
      <td><nobr><a href="/asx/statistics/displayAnnouncement.do?display=text&amp;idsId=02329990">AGL lodges cleansing notice</a></nobr></td>
    </tr>
    <tr>
      <td nowrap="nowrap"><nobr>04/06/2026&nbsp;16:45</nobr></td>
      <td nowrap="nowrap"><nobr>3</nobr></td>
      <td nowrap="nowrap"><nobr>Price Sensitive</nobr></td>
      <td><nobr><a href="/asx/statistics/displayAnnouncement.do?display=text&amp;idsId=02329850">AGL provides trading update</a></nobr></td>
    </tr>
  </tbody>
</announcement_data>`;

describe("parseAnnouncementHtml", () => {
  it("parses valid ASX HTML into announcements", () => {
    const results = parseAnnouncementHtml(ASX_HTML);
    expect(results).toHaveLength(3);

    expect(results[0]).toMatchObject({
      headline: "AGL announces board retirement",
      idsId: "02329984",
    });
    expect(results[0].publishedAt).toBeInstanceOf(Date);
  });

  it("extracts all expected fields", () => {
    const [ann] = parseAnnouncementHtml(ASX_HTML);

    expect(ann.headline).toBe("AGL announces board retirement");
    expect(ann.idsId).toBe("02329984");
    expect(ann.pdfUrl).toContain(
      "/asx/statistics/displayAnnouncement.do?display=text&idsId=02329984",
    );
    expect(ann.publishedAt.toISOString()).toBe("2026-06-04T14:00:00.000Z");
  });

  it("sorts announcements by date from ASX order", () => {
    const results = parseAnnouncementHtml(ASX_HTML);
    const idsIds = results.map((a) => a.idsId);
    expect(idsIds).toEqual(["02329984", "02329990", "02329850"]);
  });

  it("returns empty array for empty HTML", () => {
    expect(parseAnnouncementHtml("")).toEqual([]);
  });

  it("returns empty array when no announcement_data element", () => {
    expect(parseAnnouncementHtml("<html><body>No data</body></html>")).toEqual(
      [],
    );
  });

  it("skips rows missing date", () => {
    const html = `<announcement_data><tbody>
      <tr><td></td><td></td><td></td><td><a href="/x?idsId=1"/></td></tr>
    </tbody></announcement_data>`;
    expect(parseAnnouncementHtml(html)).toEqual([]);
  });

  it("skips rows missing headline link", () => {
    const html = `<announcement_data><tbody>
      <tr><td>05/06/2026 09:15</td><td></td><td></td><td></td></tr>
    </tbody></announcement_data>`;
    expect(parseAnnouncementHtml(html)).toEqual([]);
  });

  it("skips rows with invalid date format", () => {
    const html = `<announcement_data><tbody>
      <tr><td>not-a-date</td><td></td><td></td><td><a href="/x?idsId=1">Headline</a></td></tr>
    </tbody></announcement_data>`;
    expect(parseAnnouncementHtml(html)).toEqual([]);
  });
});
