import { describe, it, expect } from "vitest";
import {
  aggregateCommunications,
  type CommunicationMessage,
  type CommunicationGraph,
  type MessageType,
} from "./communication-aggregator";

// Note: These tests rely on the actual sessions directory.
// For isolated testing, the module would need to accept a path parameter.

describe("communication-aggregator", () => {
  describe("aggregateCommunications", () => {
    it("returns graph with correct structure", () => {
      const result = aggregateCommunications();

      expect(result).toHaveProperty("nodes");
      expect(result).toHaveProperty("edges");
      expect(result).toHaveProperty("messages");
      expect(Array.isArray(result.nodes)).toBe(true);
      expect(Array.isArray(result.edges)).toBe(true);
      expect(Array.isArray(result.messages)).toBe(true);
    });

    it("returns empty arrays when no sessions directory exists", () => {
      // This will return empty if no sessions exist
      const result = aggregateCommunications({
        sessionId: "non-existent-session-xyz",
      });

      expect(result.messages).toEqual([]);
    });

    it("filters by message types when specified", () => {
      const result = aggregateCommunications({
        messageTypes: ["error"],
      });

      // All returned messages should be error type
      for (const msg of result.messages) {
        expect(msg.messageType).toBe("error");
      }
    });

    it("filters by session ID when specified", () => {
      const result = aggregateCommunications({
        sessionId: "specific-session-xyz",
      });

      // Should return empty or only messages from that session
      for (const msg of result.messages) {
        expect(msg.sessionId).toBe("specific-session-xyz");
      }
    });

    it("limits messages to 200", () => {
      const result = aggregateCommunications();

      expect(result.messages.length).toBeLessThanOrEqual(200);
    });

    it("sorts nodes with main first if present", () => {
      const result = aggregateCommunications();

      if (result.nodes.length > 0) {
        const mainIndex = result.nodes.findIndex((n) => n.id === "main");
        if (mainIndex !== -1 && mainIndex !== 0) {
          // If main exists but isn't first, check that first node has type "main"
          expect(result.nodes[0].type).toBe("main");
        }
      }
    });

    it("creates nodes with required properties", () => {
      const result = aggregateCommunications();

      for (const node of result.nodes) {
        expect(node).toHaveProperty("id");
        expect(node).toHaveProperty("name");
        expect(node).toHaveProperty("type");
        expect(node).toHaveProperty("messageCount");
        expect(["main", "subagent"]).toContain(node.type);
      }
    });

    it("creates edges with required properties", () => {
      const result = aggregateCommunications();

      for (const edge of result.edges) {
        expect(edge).toHaveProperty("id");
        expect(edge).toHaveProperty("source");
        expect(edge).toHaveProperty("target");
        expect(edge).toHaveProperty("messageCount");
        expect(edge).toHaveProperty("messageTypes");
      }
    });

    it("tracks message types per edge", () => {
      const result = aggregateCommunications();

      for (const edge of result.edges) {
        expect(edge.messageTypes).toHaveProperty("task");
        expect(edge.messageTypes).toHaveProperty("result");
        expect(edge.messageTypes).toHaveProperty("error");
        expect(edge.messageTypes).toHaveProperty("status");
        expect(edge.messageTypes).toHaveProperty("query");
      }
    });
  });

  describe("CommunicationMessage type", () => {
    it("has valid message types", () => {
      const validTypes: MessageType[] = [
        "task",
        "result",
        "error",
        "status",
        "query",
      ];

      const msg: CommunicationMessage = {
        id: "msg-1",
        fromAgent: "main",
        toAgent: "worker",
        messageType: "task",
        timestamp: "2024-01-15T10:00:00Z",
        contentSummary: "Test message",
      };

      expect(validTypes).toContain(msg.messageType);
    });

    it("has all required properties", () => {
      const msg: CommunicationMessage = {
        id: "msg-1",
        fromAgent: "main",
        toAgent: "worker",
        messageType: "task",
        timestamp: "2024-01-15T10:00:00Z",
        contentSummary: "Test message",
        sessionId: "session-123",
      };

      expect(msg.id).toBeDefined();
      expect(msg.fromAgent).toBeDefined();
      expect(msg.toAgent).toBeDefined();
      expect(msg.messageType).toBeDefined();
      expect(msg.timestamp).toBeDefined();
      expect(msg.contentSummary).toBeDefined();
      expect(msg.sessionId).toBeDefined();
    });
  });

  describe("CommunicationGraph type", () => {
    it("has all required properties", () => {
      const graph: CommunicationGraph = {
        nodes: [],
        edges: [],
        messages: [],
      };

      expect(Array.isArray(graph.nodes)).toBe(true);
      expect(Array.isArray(graph.edges)).toBe(true);
      expect(Array.isArray(graph.messages)).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles date range filtering", () => {
      const result = aggregateCommunications({
        startDate: "2020-01-01",
        endDate: "2020-01-02",
      });

      // Should return empty or filtered results
      expect(result).toBeDefined();
      expect(Array.isArray(result.messages)).toBe(true);
    });

    it("handles combined filters", () => {
      const result = aggregateCommunications({
        messageTypes: ["error", "task"],
        startDate: "2020-01-01",
        endDate: "2030-12-31",
      });

      expect(result).toBeDefined();
      for (const msg of result.messages) {
        expect(["error", "task"]).toContain(msg.messageType);
      }
    });
  });
});
