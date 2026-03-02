import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  loadGeneratedReports,
  saveGeneratedReports,
  getGeneratedReport,
  getReportByShareToken,
  createGeneratedReport,
  shareReport,
  revokeShare,
  deleteGeneratedReport,
  generateReportData,
  type GeneratedReport,
  type ReportData,
} from "./report-generator";

const DATA_DIR = path.join(process.cwd(), "data");
const REPORTS_FILE = path.join(DATA_DIR, "generated-reports.json");

function backup() {
  try {
    if (fs.existsSync(REPORTS_FILE)) {
      fs.copyFileSync(REPORTS_FILE, `${REPORTS_FILE}.test-backup`);
      fs.unlinkSync(REPORTS_FILE);
    }
  } catch {
    // ignore
  }
}

function restore() {
  try {
    if (fs.existsSync(REPORTS_FILE)) fs.unlinkSync(REPORTS_FILE);
    if (fs.existsSync(`${REPORTS_FILE}.test-backup`)) {
      fs.copyFileSync(`${REPORTS_FILE}.test-backup`, REPORTS_FILE);
      fs.unlinkSync(`${REPORTS_FILE}.test-backup`);
    }
  } catch {
    // ignore
  }
}

function createTestReportData(): ReportData {
  return {
    period: { start: "2024-01-01", end: "2024-01-07" },
    type: "weekly",
    stats: {
      totalActivities: 100,
      successRate: 95.5,
      totalTokens: 1000000,
      totalCost: 10.5,
      topModels: [{ name: "Claude Sonnet", count: 50, cost: 5.0 }],
      topAgents: [{ name: "main", count: 80 }],
    },
    highlights: ["Test highlight"],
    generatedAt: new Date().toISOString(),
  };
}

describe("report-generator", () => {
  beforeEach(() => {
    backup();
  });

  afterEach(() => {
    restore();
  });

  describe("loadGeneratedReports", () => {
    it("returns empty array when no reports exist", () => {
      const reports = loadGeneratedReports();
      expect(reports).toEqual([]);
    });

    it("returns reports from file", () => {
      const testReports: GeneratedReport[] = [
        {
          id: "test-1",
          name: "Test Report",
          type: "weekly",
          period: { start: "2024-01-01", end: "2024-01-07" },
          data: createTestReportData(),
          createdAt: new Date().toISOString(),
        },
      ];
      saveGeneratedReports(testReports);

      const loaded = loadGeneratedReports();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe("Test Report");
    });
  });

  describe("createGeneratedReport", () => {
    it("creates a new report with generated id", () => {
      const report = createGeneratedReport(
        "Weekly Report",
        "weekly",
        { start: "2024-01-01", end: "2024-01-07" },
        createTestReportData()
      );

      expect(report.id).toBeDefined();
      expect(report.name).toBe("Weekly Report");
      expect(report.type).toBe("weekly");
      expect(report.createdAt).toBeDefined();
    });

    it("prepends new report to existing ones", () => {
      createGeneratedReport("First", "weekly", { start: "2024-01-01", end: "2024-01-07" }, createTestReportData());
      createGeneratedReport("Second", "weekly", { start: "2024-01-08", end: "2024-01-14" }, createTestReportData());

      const reports = loadGeneratedReports();
      expect(reports[0].name).toBe("Second");
      expect(reports[1].name).toBe("First");
    });

    it("limits to 50 reports", () => {
      // Create 52 reports
      for (let i = 0; i < 52; i++) {
        createGeneratedReport(`Report ${i}`, "weekly", { start: "2024-01-01", end: "2024-01-07" }, createTestReportData());
      }

      const reports = loadGeneratedReports();
      expect(reports.length).toBe(50);
    });
  });

  describe("getGeneratedReport", () => {
    it("returns null for non-existent report", () => {
      const result = getGeneratedReport("non-existent");
      expect(result).toBeNull();
    });

    it("returns report by id", () => {
      const created = createGeneratedReport("Test", "weekly", { start: "2024-01-01", end: "2024-01-07" }, createTestReportData());
      
      const result = getGeneratedReport(created.id);
      
      expect(result).not.toBeNull();
      expect(result?.name).toBe("Test");
    });
  });

  describe("shareReport", () => {
    it("returns null for non-existent report", () => {
      const result = shareReport("non-existent");
      expect(result).toBeNull();
    });

    it("generates share token for existing report", () => {
      const created = createGeneratedReport("Test", "weekly", { start: "2024-01-01", end: "2024-01-07" }, createTestReportData());
      
      const token = shareReport(created.id);
      
      expect(token).not.toBeNull();
      expect(token?.length).toBe(16);
    });

    it("sets expiration when expiresInDays provided", () => {
      const created = createGeneratedReport("Test", "weekly", { start: "2024-01-01", end: "2024-01-07" }, createTestReportData());
      
      shareReport(created.id, 7);
      
      const report = getGeneratedReport(created.id);
      expect(report?.shareExpiresAt).toBeDefined();
    });
  });

  describe("getReportByShareToken", () => {
    it("returns null for non-existent token", () => {
      const result = getReportByShareToken("nonexistent");
      expect(result).toBeNull();
    });

    it("returns report by valid token", () => {
      const created = createGeneratedReport("Test", "weekly", { start: "2024-01-01", end: "2024-01-07" }, createTestReportData());
      const token = shareReport(created.id);
      
      const result = getReportByShareToken(token!);
      
      expect(result).not.toBeNull();
      expect(result?.id).toBe(created.id);
    });

    it("returns null for expired token", () => {
      const created = createGeneratedReport("Test", "weekly", { start: "2024-01-01", end: "2024-01-07" }, createTestReportData());
      
      // Share with expiration
      shareReport(created.id, 7);
      
      // Get the report and manually set expiration to past
      const reports = loadGeneratedReports();
      const index = reports.findIndex((r) => r.id === created.id);
      reports[index].shareExpiresAt = "2020-01-01T00:00:00.000Z"; // Already expired
      saveGeneratedReports(reports);
      
      // Token should be expired
      const result = getReportByShareToken(reports[index].shareToken || "");
      expect(result).toBeNull();
    });
  });

  describe("revokeShare", () => {
    it("returns false for non-existent report", () => {
      const result = revokeShare("non-existent");
      expect(result).toBe(false);
    });

    it("removes share token from report", () => {
      const created = createGeneratedReport("Test", "weekly", { start: "2024-01-01", end: "2024-01-07" }, createTestReportData());
      shareReport(created.id, 7);
      
      const result = revokeShare(created.id);
      
      expect(result).toBe(true);
      
      const report = getGeneratedReport(created.id);
      expect(report?.shareToken).toBeUndefined();
      expect(report?.shareExpiresAt).toBeUndefined();
    });
  });

  describe("deleteGeneratedReport", () => {
    it("returns false for non-existent report", () => {
      const result = deleteGeneratedReport("non-existent");
      expect(result).toBe(false);
    });

    it("deletes existing report", () => {
      const created = createGeneratedReport("Test", "weekly", { start: "2024-01-01", end: "2024-01-07" }, createTestReportData());
      
      const result = deleteGeneratedReport(created.id);
      
      expect(result).toBe(true);
      
      const deleted = getGeneratedReport(created.id);
      expect(deleted).toBeNull();
    });
  });

  describe("generateReportData", () => {
    it("returns report data with required fields", () => {
      const data = generateReportData({ start: "2024-01-01", end: "2024-01-07" });

      expect(data.period).toEqual({ start: "2024-01-01", end: "2024-01-07" });
      expect(data.type).toBe("custom");
      expect(data.stats).toBeDefined();
      expect(data.stats.totalActivities).toBeDefined();
      expect(data.stats.successRate).toBeDefined();
      expect(data.stats.totalTokens).toBeDefined();
      expect(data.stats.totalCost).toBeDefined();
      expect(data.highlights).toBeDefined();
      expect(data.generatedAt).toBeDefined();
    });

    it("includes top models and agents", () => {
      const data = generateReportData({ start: "2024-01-01", end: "2024-01-07" });

      expect(Array.isArray(data.stats.topModels)).toBe(true);
      expect(Array.isArray(data.stats.topAgents)).toBe(true);
    });
  });
});
