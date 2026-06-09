import { describe, it, expect } from "vitest";

// We test the email template by importing buildEmailHtml.
// It's a private function so we verify through the HTML output properties.

const MOCK_ANALYSIS = {
  asxCode: "BHP",
  headline: "BHP reports record iron ore production",
  summaryMd: "BHP announced record production of **300Mt**.\n\nRevenue up 12% YoY.",
  sentiment: "POSITIVE" as const,
  predictedDirection: "UP" as const,
  confidence: 0.85,
};

const MOCK_ANALYSIS_NEGATIVE = {
  asxCode: "CBA",
  headline: "CBA flags rising loan impairments",
  summaryMd: "CBA warned of increasing defaults.",
  sentiment: "NEGATIVE" as const,
  predictedDirection: "DOWN" as const,
  confidence: 0.72,
};

// We can't import private functions, so we test the full send path
// with a mocked Resend client.
import { vi } from "vitest";

vi.mock("@/lib/resend", () => ({
  getResendClient: vi.fn(),
}));

const { getResendClient } = await import("@/lib/resend");
const { sendDigestEmail } = await import("@/lib/email");

describe("sendDigestEmail", () => {
  it("calls Resend with correct parameters", async () => {
    const mockSend = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(getResendClient).mockReturnValue({
      emails: { send: mockSend },
    } as never);

    const result = await sendDigestEmail(
      "user@example.com",
      [MOCK_ANALYSIS],
      "Monday 9 June 2026",
      "idempotent-123",
    );

    expect(result).toBe(true);
    expect(mockSend).toHaveBeenCalledOnce();

    const call = mockSend.mock.calls[0][0];
    expect(call.to).toBe("user@example.com");
    expect(call.from).toContain("Morning Money");
    expect(call.subject).toContain("Monday 9 June 2026");
    expect(call.html).toContain("BHP reports record iron ore production");
    expect(call.html).toContain("BHP");
    expect(call.html).toContain("85% confidence");
    expect(call.html).toContain("The Morning Money");
    expect(call.headers["Idempotency-Key"]).toBe("idempotent-123");
  });

  it("returns false when Resend returns an error", async () => {
    const mockSend = vi.fn().mockResolvedValue({
      error: { message: "Invalid recipient" },
    });
    vi.mocked(getResendClient).mockReturnValue({
      emails: { send: mockSend },
    } as never);

    const result = await sendDigestEmail(
      "bad@example.com",
      [MOCK_ANALYSIS],
      "Tuesday 10 June 2026",
      "idempotent-456",
    );

    expect(result).toBe(false);
  });

  it("includes multiple analysis items in the HTML", async () => {
    const mockSend = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(getResendClient).mockReturnValue({
      emails: { send: mockSend },
    } as never);

    await sendDigestEmail(
      "user@example.com",
      [MOCK_ANALYSIS, MOCK_ANALYSIS_NEGATIVE],
      "Wednesday 11 June 2026",
      "idempotent-789",
    );

    const html = mockSend.mock.calls[0][0].html;
    expect(html).toContain("BHP reports record iron ore production");
    expect(html).toContain("CBA flags rising loan impairments");
  });

  it("handles empty analyses array (no announcements email)", async () => {
    const mockSend = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(getResendClient).mockReturnValue({
      emails: { send: mockSend },
    } as never);

    await sendDigestEmail(
      "user@example.com",
      [],
      "Thursday 12 June 2026",
      "idempotent-000",
    );

    const html = mockSend.mock.calls[0][0].html;
    expect(html).toContain("No announcements for your watchlists today");
  });

  it("renders sentiment labels and arrows correctly", async () => {
    const mockSend = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(getResendClient).mockReturnValue({
      emails: { send: mockSend },
    } as never);

    await sendDigestEmail(
      "user@example.com",
      [MOCK_ANALYSIS, MOCK_ANALYSIS_NEGATIVE],
      "Friday 13 June 2026",
      "id-arrows",
    );

    const html = mockSend.mock.calls[0][0].html;
    // Positive sentiment styling
    expect(html).toMatch(/Positive/);
    // Negative sentiment styling
    expect(html).toMatch(/Negative/);
    // Direction arrows
    expect(html).toContain("UP");
    expect(html).toContain("DOWN");
  });

  it("includes unsubscribe URL in email", async () => {
    const mockSend = vi.fn().mockResolvedValue({ error: null });
    vi.mocked(getResendClient).mockReturnValue({
      emails: { send: mockSend },
    } as never);

    await sendDigestEmail(
      "user@example.com",
      [MOCK_ANALYSIS],
      "Saturday 14 June 2026",
      "id-unsub",
    );

    const html = mockSend.mock.calls[0][0].html;
    expect(html).toContain("unsubscribe");
    expect(html).toContain("/unsubscribe");
  });
});
