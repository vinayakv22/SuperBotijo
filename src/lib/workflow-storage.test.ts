import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  loadWorkflows,
  saveWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  exportWorkflow,
  importWorkflow,
} from "./workflow-storage";
import type { Workflow } from "./workflow-templates";

const DATA_DIR = path.join(process.cwd(), "data");
const WORKFLOWS_FILE = path.join(DATA_DIR, "workflows.json");

function createTestWorkflow(overrides: Partial<Workflow> = {}): Workflow {
  return {
    id: "test-id",
    name: "Test Workflow",
    description: "Test description",
    nodes: [],
    edges: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isTemplate: false,
    status: "draft",
    ...overrides,
  };
}

function backup() {
  try {
    if (fs.existsSync(WORKFLOWS_FILE)) {
      fs.copyFileSync(WORKFLOWS_FILE, `${WORKFLOWS_FILE}.test-backup`);
      fs.unlinkSync(WORKFLOWS_FILE);
    }
  } catch {
    // ignore
  }
}

function restore() {
  try {
    if (fs.existsSync(WORKFLOWS_FILE)) fs.unlinkSync(WORKFLOWS_FILE);
    if (fs.existsSync(`${WORKFLOWS_FILE}.test-backup`)) {
      fs.copyFileSync(`${WORKFLOWS_FILE}.test-backup`, WORKFLOWS_FILE);
      fs.unlinkSync(`${WORKFLOWS_FILE}.test-backup`);
    }
  } catch {
    // ignore
  }
}

describe("workflow-storage", () => {
  beforeEach(() => {
    backup();
  });

  afterEach(() => {
    restore();
  });

  describe("loadWorkflows", () => {
    it("returns empty array when no workflows exist", () => {
      const workflows = loadWorkflows();
      expect(workflows).toEqual([]);
    });

    it("returns workflows from file", () => {
      const testWorkflows = [createTestWorkflow({ id: "test-1", name: "Test Workflow" })];
      saveWorkflows(testWorkflows);

      const loaded = loadWorkflows();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].name).toBe("Test Workflow");
    });
  });

  describe("createWorkflow", () => {
    it("creates a new workflow with generated id", () => {
      const workflow = createWorkflow(createTestWorkflow({ id: "", name: "New Workflow" }));

      expect(workflow.id).toBeDefined();
      expect(workflow.name).toBe("New Workflow");
      expect(workflow.createdAt).toBeDefined();
      expect(workflow.updatedAt).toBeDefined();
    });

    it("preserves provided id", () => {
      const workflow = createWorkflow(createTestWorkflow({ id: "custom-id", name: "Custom ID Workflow" }));

      expect(workflow.id).toBe("custom-id");
    });
  });

  describe("getWorkflow", () => {
    it("returns null for non-existent workflow", () => {
      const result = getWorkflow("non-existent");
      expect(result).toBeNull();
    });

    it("returns workflow by id", () => {
      createWorkflow(createTestWorkflow({ id: "test-get", name: "Test Get" }));

      const result = getWorkflow("test-get");
      expect(result).not.toBeNull();
      expect(result?.name).toBe("Test Get");
    });
  });

  describe("updateWorkflow", () => {
    it("returns null for non-existent workflow", () => {
      const result = updateWorkflow("non-existent", { name: "Updated" });
      expect(result).toBeNull();
    });

    it("updates workflow fields", () => {
      createWorkflow(createTestWorkflow({ id: "test-update", name: "Original Name" }));

      const updated = updateWorkflow("test-update", { name: "Updated Name" });

      expect(updated).not.toBeNull();
      expect(updated?.name).toBe("Updated Name");
      expect(updated?.updatedAt).toBeDefined();
    });
  });

  describe("deleteWorkflow", () => {
    it("returns false for non-existent workflow", () => {
      const result = deleteWorkflow("non-existent");
      expect(result).toBe(false);
    });

    it("deletes existing workflow", () => {
      createWorkflow(createTestWorkflow({ id: "test-delete", name: "To Delete" }));

      const result = deleteWorkflow("test-delete");
      expect(result).toBe(true);

      const deleted = getWorkflow("test-delete");
      expect(deleted).toBeNull();
    });
  });

  describe("exportWorkflow", () => {
    it("returns JSON string", () => {
      const workflow = createTestWorkflow({
        id: "export-test",
        name: "Export Test",
        nodes: [{ id: "node1", type: "task", position: { x: 0, y: 0 }, data: { label: "Test" } }],
      });

      const exported = exportWorkflow(workflow);

      expect(typeof exported).toBe("string");
      expect(exported).toContain("Export Test");
    });
  });

  describe("importWorkflow", () => {
    it("imports valid workflow JSON", () => {
      const json = JSON.stringify(createTestWorkflow({ name: "Imported Workflow" }));

      const imported = importWorkflow(json);

      expect(imported).not.toBeNull();
      expect(imported?.name).toBe("Imported Workflow");
      expect(imported?.isTemplate).toBe(false);
      expect(imported?.status).toBe("draft");
    });

    it("returns null for invalid JSON", () => {
      const result = importWorkflow("not valid json");
      expect(result).toBeNull();
    });

    it("returns null for missing required fields", () => {
      const result = importWorkflow(JSON.stringify({ name: "Missing fields" }));
      expect(result).toBeNull();
    });
  });
});
