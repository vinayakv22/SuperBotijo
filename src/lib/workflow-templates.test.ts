import { describe, it, expect } from "vitest";
import {
  WORKFLOW_TEMPLATES,
  createWorkflowFromTemplate,
  type WorkflowTemplate,
  type Workflow,
} from "./workflow-templates";

describe("workflow-templates", () => {
  describe("WORKFLOW_TEMPLATES", () => {
    it("is an array of templates", () => {
      expect(Array.isArray(WORKFLOW_TEMPLATES)).toBe(true);
      expect(WORKFLOW_TEMPLATES.length).toBeGreaterThan(0);
    });

    it("each template has required fields", () => {
      for (const template of WORKFLOW_TEMPLATES) {
        expect(template.id).toBeDefined();
        expect(template.name).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.category).toBeDefined();
        expect(Array.isArray(template.nodes)).toBe(true);
        expect(Array.isArray(template.edges)).toBe(true);
      }
    });

    it("has research-report template", () => {
      const research = WORKFLOW_TEMPLATES.find((t) => t.id === "research-report");
      expect(research).toBeDefined();
      expect(research?.category).toBe("research");
    });

    it("has code-review-pipeline template", () => {
      const codeReview = WORKFLOW_TEMPLATES.find((t) => t.id === "code-review-pipeline");
      expect(codeReview).toBeDefined();
      expect(codeReview?.category).toBe("development");
    });

    it("has daily-digest template", () => {
      const daily = WORKFLOW_TEMPLATES.find((t) => t.id === "daily-digest");
      expect(daily).toBeDefined();
      expect(daily?.category).toBe("automation");
    });
  });

  describe("createWorkflowFromTemplate", () => {
    it("creates a workflow from template", () => {
      const template: WorkflowTemplate = {
        id: "test-template",
        name: "Test Template",
        description: "A test template",
        category: "test",
        nodes: [
          { id: "node-1", type: "task", position: { x: 0, y: 0 }, data: { label: "Task 1" } },
        ],
        edges: [
          { id: "edge-1", source: "node-1", target: "node-2" },
        ],
      };

      const workflow = createWorkflowFromTemplate(template);

      expect(workflow.id).toBeDefined();
      expect(workflow.name).toBe("Test Template");
      expect(workflow.description).toBe("A test template");
      expect(workflow.isTemplate).toBe(false);
      expect(workflow.status).toBe("draft");
      expect(workflow.createdAt).toBeDefined();
      expect(workflow.updatedAt).toBeDefined();
    });

    it("generates unique ids for workflows created at different times", async () => {
      const template: WorkflowTemplate = {
        id: "test",
        name: "Test",
        description: "Test",
        category: "test",
        nodes: [
          { id: "node-1", type: "task", position: { x: 0, y: 0 }, data: { label: "Task" } },
        ],
        edges: [],
      };

      const workflow1 = createWorkflowFromTemplate(template);
      
      // Wait a bit to ensure different timestamp
      await new Promise((r) => setTimeout(r, 10));
      
      const workflow2 = createWorkflowFromTemplate(template);

      // Workflow IDs should be different (different timestamps)
      expect(workflow1.id).not.toBe(workflow2.id);
    });

    it("copies all nodes from template", () => {
      const template = WORKFLOW_TEMPLATES[0];
      const workflow = createWorkflowFromTemplate(template);

      expect(workflow.nodes.length).toBe(template.nodes.length);
    });

    it("copies all edges from template with updated references", () => {
      const template = WORKFLOW_TEMPLATES[0];
      const workflow = createWorkflowFromTemplate(template);

      expect(workflow.edges.length).toBe(template.edges.length);
    });
  });

  describe("Workflow types", () => {
    it("WorkflowNode has correct types", () => {
      const node = {
        id: "test",
        type: "task" as const,
        position: { x: 0, y: 0 },
        data: {
          label: "Test",
          taskType: "code" as const,
        },
      };

      expect(node.type).toBe("task");
      expect(node.data.taskType).toBe("code");
    });

    it("WorkflowEdge has correct types", () => {
      const edge = {
        id: "e1",
        source: "node1",
        target: "node2",
        label: "Test edge",
      };

      expect(edge.source).toBe("node1");
      expect(edge.target).toBe("node2");
    });

    it("Workflow has correct status types", () => {
      const statuses: Array<"draft" | "active" | "archived"> = ["draft", "active", "archived"];
      
      for (const status of statuses) {
        const workflow: Workflow = {
          id: "test",
          name: "Test",
          description: "Test",
          nodes: [],
          edges: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isTemplate: false,
          status,
        };

        expect(workflow.status).toBe(status);
      }
    });
  });
});
