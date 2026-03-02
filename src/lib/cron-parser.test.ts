import { describe, it, expect } from "vitest";
import { cronToHuman, getNextRuns, isValidCron, CRON_PRESETS } from "./cron-parser";

describe("cronToHuman", () => {
  it("parses every minute", () => {
    expect(cronToHuman("* * * * *")).toBe("Every minute");
  });

  it("parses every hour on the hour", () => {
    expect(cronToHuman("0 * * * *")).toBe("Every hour on the hour");
  });

  it("parses every 5 minutes", () => {
    expect(cronToHuman("*/5 * * * *")).toBe("Every 5 minutes");
  });

  it("parses weekdays range", () => {
    // Implementation takes first day of range
    expect(cronToHuman("0 9 * * 1-5")).toBe("Every Monday at 9:00 AM");
  });

  it("parses every hour at minute 30", () => {
    expect(cronToHuman("30 * * * *")).toBe("Every hour at minute 30");
  });

  it("parses daily at specific time", () => {
    expect(cronToHuman("0 8 * * *")).toBe("Every day at 8:00 AM");
  });

  it("parses daily at noon", () => {
    expect(cronToHuman("0 12 * * *")).toBe("Every day at 12:00 PM");
  });

  it("parses daily at 6 PM", () => {
    expect(cronToHuman("0 18 * * *")).toBe("Every day at 6:00 PM");
  });

  it("parses weekly on Monday", () => {
    expect(cronToHuman("0 9 * * 1")).toBe("Every Monday at 9:00 AM");
  });

  it("parses weekly on Friday", () => {
    expect(cronToHuman("0 17 * * 5")).toBe("Every Friday at 5:00 PM");
  });

  it("parses monthly on specific day", () => {
    expect(cronToHuman("0 0 1 * *")).toBe("On the 1st of every month at 12:00 AM");
  });

  it("returns invalid for malformed expression", () => {
    expect(cronToHuman("invalid")).toBe("Invalid cron expression");
    expect(cronToHuman("")).toBe("Invalid cron expression");
    expect(cronToHuman("1 2 3")).toBe("Invalid cron expression");
  });

  it("parses intervals correctly", () => {
    expect(cronToHuman("*/15 * * * *")).toBe("Every 15 minutes");
    expect(cronToHuman("*/30 * * * *")).toBe("Every 30 minutes");
  });

  it("parses hourly intervals correctly", () => {
    expect(cronToHuman("0 */2 * * *")).toBe("Every 2 hours");
    expect(cronToHuman("0 */6 * * *")).toBe("Every 6 hours");
  });
});

describe("isValidCron", () => {
  it("validates correct expressions", () => {
    expect(isValidCron("* * * * *")).toBe(true);
    expect(isValidCron("0 0 * * *")).toBe(true);
    expect(isValidCron("*/5 * * * *")).toBe(true);
    expect(isValidCron("0 9 * * 1")).toBe(true);
    expect(isValidCron("30 14 1 * *")).toBe(true);
  });

  it("rejects invalid expressions", () => {
    expect(isValidCron("")).toBe(false);
    expect(isValidCron("invalid")).toBe(false);
    expect(isValidCron("* * *")).toBe(false);
    expect(isValidCron("* * * * * *")).toBe(false);
  });

  it("rejects out-of-range values", () => {
    expect(isValidCron("60 * * * *")).toBe(false); // minute > 59
    expect(isValidCron("* 24 * * *")).toBe(false); // hour > 23
    expect(isValidCron("* * 32 * *")).toBe(false); // day > 31
    expect(isValidCron("* * * 13 *")).toBe(false); // month > 12
    expect(isValidCron("* * * * 7")).toBe(false); // day of week > 6
  });

  it("accepts valid ranges", () => {
    expect(isValidCron("59 * * * *")).toBe(true);
    expect(isValidCron("23 * * * *")).toBe(true);
    expect(isValidCron("* 1-5 * * *")).toBe(true);
    expect(isValidCron("0 0 1,15 * *")).toBe(true);
  });
});

describe("getNextRuns", () => {
  it("returns empty array for invalid cron", () => {
    expect(getNextRuns("invalid")).toEqual([]);
    expect(getNextRuns("")).toEqual([]);
  });

  it("returns correct number of runs", () => {
    const runs = getNextRuns("0 * * * *", 3);
    expect(runs).toHaveLength(3);
  });

  it("returns future dates", () => {
    const now = new Date();
    const runs = getNextRuns("0 * * * *", 1);
    
    expect(runs[0].getTime()).toBeGreaterThan(now.getTime());
  });

  it("respects fromDate parameter", () => {
    const fromDate = new Date("2025-01-01T00:00:00Z");
    const runs = getNextRuns("0 * * * *", 1, fromDate);
    
    // First run should be at minute 0 of some hour after fromDate
    expect(runs[0].getTime()).toBeGreaterThanOrEqual(fromDate.getTime());
  });

  it("handles every minute cron", () => {
    const runs = getNextRuns("* * * * *", 5);
    
    // Each run should be 1 minute apart
    for (let i = 1; i < runs.length; i++) {
      const diff = runs[i].getTime() - runs[i-1].getTime();
      expect(diff).toBeGreaterThanOrEqual(60000); // at least 1 minute
      expect(diff).toBeLessThan(120000); // less than 2 minutes
    }
  });
});

describe("CRON_PRESETS", () => {
  it("has valid preset values", () => {
    for (const preset of CRON_PRESETS) {
      expect(isValidCron(preset.value)).toBe(true);
    }
  });

  it("has all expected presets", () => {
    const labels = CRON_PRESETS.map(p => p.label);
    
    expect(labels).toContain("Every minute");
    expect(labels).toContain("Every 5 minutes");
    expect(labels).toContain("Every hour");
    expect(labels).toContain("Every day at midnight");
    expect(labels).toContain("Every Monday at 9 AM");
  });
});
