import { describe, it, expect } from "vitest";

// We test the email template by importing buildEmailHtml.
// It's a private function so we verify through the HTML output properties.

const MOCK_ANALYSIS = {
  asxCode: "BHP",
  headline: "BHP reports record iron ore production",
  summaryMd: "BHP announced record production of 300Mt. Revenue up 12% YoY.",
};

const MOCK_ANALYSIS_NEGATIVE = {
  asxCode: "CBA",
  headline: "CBA flags rising loan impairments",
  summaryMd: "CBA warned of increasing defaults.",
};

// We can't import private functions, so we test the full send path
// with a mocked Resend client.
import { vi } from "vitest";

vi.mock("@/lib/smtp", () => ({
  getTransport: vi.fn(),
  getFromAddress: vi.fn().mockReturnValue("Morning Money <daily@localhost>"),
}));

const { getTransport } = await import("@/lib/smtp");
const { sendDigestEmail } = await import("@/lib/email");

describe("sendDigestEmail", () => {
  it("calls SMTP transport with correct parameters", async () => {
    const mockSendMail = vi.fn().mockResolvedValue(undefined);
    vi.mocked(getTransport).mockReturnValue({
      sendMail: mockSendMail,
      verify: vi.fn(),
    } as never);

    const result = await sendDigestEmail(
      "user@example.com",
      [MOCK_ANALYSIS],
      "Monday 9 June 2026",
    );

    expect(result).toBe(true);
    expect(mockSendMail).toHaveBeenCalledOnce();

    const call = mockSendMail.mock.calls[0][0];
    expect(call.to).toBe("user@example.com");
    expect(call.from).toContain("Morning Money");
    expect(call.subject).toContain("Monday 9 June 2026");
    expect(call.html).toContain("BHP reports record iron ore production");
    expect(call.html).toContain("BHP");
    expect(call.html).toContain("The Morning Money");
  });

  it("returns false when SMTP transport fails", async () => {
    const mockSendMail = vi.fn().mockRejectedValue(new Error("Invalid recipient"));
    vi.mocked(getTransport).mockReturnValue({
      sendMail: mockSendMail,
      verify: vi.fn(),
    } as never);

    const result = await sendDigestEmail(
      "bad@example.com",
      [MOCK_ANALYSIS],
      "Tuesday 10 June 2026",
    );

    expect(result).toBe(false);
  });

  it("includes multiple analysis items in the HTML", async () => {
    const mockSendMail = vi.fn().mockResolvedValue(undefined);
    vi.mocked(getTransport).mockReturnValue({
      sendMail: mockSendMail,
      verify: vi.fn(),
    } as never);

    await sendDigestEmail(
      "user@example.com",
      [MOCK_ANALYSIS, MOCK_ANALYSIS_NEGATIVE],
      "Wednesday 11 June 2026",
    );

    const html = mockSendMail.mock.calls[0][0].html;
    expect(html).toContain("BHP reports record iron ore production");
    expect(html).toContain("CBA flags rising loan impairments");
  });

  it("handles empty analyses array (no announcements email)", async () => {
    const mockSendMail = vi.fn().mockResolvedValue(undefined);
    vi.mocked(getTransport).mockReturnValue({
      sendMail: mockSendMail,
      verify: vi.fn(),
    } as never);

    await sendDigestEmail(
      "user@example.com",
      [],
      "Thursday 12 June 2026",
    );

    const html = mockSendMail.mock.calls[0][0].html;
    expect(html).toContain("No announcements for your watchlists today");
  });

  it("renders summary as plain text in the HTML", async () => {
    const mockSendMail = vi.fn().mockResolvedValue(undefined);
    vi.mocked(getTransport).mockReturnValue({
      sendMail: mockSendMail,
      verify: vi.fn(),
    } as never);

    await sendDigestEmail(
      "user@example.com",
      [MOCK_ANALYSIS],
      "Friday 13 June 2026",
    );

    const html = mockSendMail.mock.calls[0][0].html;
    expect(html).toContain("BHP reports record iron ore production");
    expect(html).toContain("BHP announced record production");
  });

});
