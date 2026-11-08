import { describe, it, expect, vi } from "vitest";

// Mock dependencies before import
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findMany: vi.fn() } },
}));
vi.mock("@/lib/email/email-service", () => ({
  emailService: { send: vi.fn() },
}));
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn() },
}));

// We need to test the non-exported pure functions (buildDigestHtml, buildDigestText)
// Since they're not exported, we test sendDailyDigests behavior via mocking
// But we can also test by importing the module and accessing the functions via the module internals

// For this test, we test sendDailyDigests which exercises buildDigestHtml and buildDigestText
import { sendDailyDigests } from "../daily-digest";
import { prisma } from "@/lib/prisma";
import { emailService } from "@/lib/email/email-service";

const mockPrisma = prisma as unknown as {
  user: { findMany: ReturnType<typeof vi.fn> };
  notification: { count: ReturnType<typeof vi.fn> };
  workSession: { count: ReturnType<typeof vi.fn> };
  sessionActivity: { findMany: ReturnType<typeof vi.fn> };
  purchaseOrder: { count: ReturnType<typeof vi.fn> };
  $queryRaw: ReturnType<typeof vi.fn>;
};

describe("sendDailyDigests", () => {
  it("returns sent=0, skipped=0, errors=0 when no users", async () => {
    (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await sendDailyDigests();

    expect(result).toEqual({ sent: 0, skipped: 0, errors: 0 });
  });

  it("skips users with no activity", async () => {
    (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "u1", email: "test@test.com", name: "Test" },
    ]);

    // Mock all sub-queries to return zero/empty
    (prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>).notification = { count: vi.fn().mockResolvedValue(0) };
    (prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>).workSession = { count: vi.fn().mockResolvedValue(0) };
    (prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>).sessionActivity = { findMany: vi.fn().mockResolvedValue([]) };
    (prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>).purchaseOrder = { count: vi.fn().mockResolvedValue(0) };
    (prisma as unknown as Record<string, unknown>).$queryRaw = vi.fn().mockResolvedValue([{ count: BigInt(0) }]);

    const result = await sendDailyDigests();

    expect(result.skipped).toBe(1);
    expect(result.sent).toBe(0);
    expect(emailService.send).not.toHaveBeenCalled();
  });

  it("sends digest when user has unread notifications", async () => {
    (prisma.user.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: "u1", email: "test@test.com", name: "Test User" },
    ]);

    (prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>).notification = { count: vi.fn().mockResolvedValue(5) };
    (prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>).workSession = { count: vi.fn().mockResolvedValue(0) };
    (prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>).sessionActivity = { findMany: vi.fn().mockResolvedValue([]) };
    (prisma as unknown as Record<string, Record<string, ReturnType<typeof vi.fn>>>).purchaseOrder = { count: vi.fn().mockResolvedValue(2) };
    (prisma as unknown as Record<string, unknown>).$queryRaw = vi.fn().mockResolvedValue([{ count: BigInt(0) }]);

    const result = await sendDailyDigests();

    expect(result.sent).toBe(1);
    expect(emailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "test@test.com",
        subject: expect.stringContaining("Daily Digest"),
        html: expect.stringContaining("L-ERP MRP Daily Digest"),
        text: expect.stringContaining("Xin chao Test User"),
      })
    );
  });
});
