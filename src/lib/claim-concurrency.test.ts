import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createTask,
  getTask,
  claimTask,
  releaseTask,
  clearAllDataForTesting,
} from "./kanban-db";

describe("claim concurrency", () => {
  beforeEach(() => {
    clearAllDataForTesting();
  });

  afterEach(() => {
    clearAllDataForTesting();
  });

  describe("atomic claiming behavior", () => {
    it("only one claim succeeds when multiple agents try to claim same task", () => {
      const task = createTask({ title: "Contested task" });

      const results = [
        claimTask(task.id, "agent-1"),
        claimTask(task.id, "agent-2"),
        claimTask(task.id, "agent-3"),
      ];

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      expect(successCount).toBe(1);
      expect(failureCount).toBe(2);
    });

    it("database reflects the first successful claimant", () => {
      const task = createTask({ title: "Contested task" });

      claimTask(task.id, "agent-1");
      claimTask(task.id, "agent-2");

      const stored = getTask(task.id);
      expect(stored?.claimedBy).toBe("agent-1");
    });

    it("first claim wins in sequential race", () => {
      const task = createTask({ title: "Race task" });

      const first = claimTask(task.id, "agent-1");
      const second = claimTask(task.id, "agent-2");

      expect(first.success).toBe(true);
      expect(second.success).toBe(false);
      expect(second.reason).toBe("claimed_by_other");
    });

    it("idempotent claim returns success for same agent", () => {
      const task = createTask({ title: "Test task" });

      const first = claimTask(task.id, "agent-1");
      const second = claimTask(task.id, "agent-1");

      expect(first.success).toBe(true);
      expect(second.success).toBe(true);
    });

    it("multiple tasks can be claimed by different agents concurrently", () => {
      const task1 = createTask({ title: "Task 1" });
      const task2 = createTask({ title: "Task 2" });
      const task3 = createTask({ title: "Task 3" });

      const results = [
        claimTask(task1.id, "agent-1"),
        claimTask(task2.id, "agent-2"),
        claimTask(task3.id, "agent-3"),
      ];

      expect(results.every((r) => r.success)).toBe(true);

      expect(getTask(task1.id)?.claimedBy).toBe("agent-1");
      expect(getTask(task2.id)?.claimedBy).toBe("agent-2");
      expect(getTask(task3.id)?.claimedBy).toBe("agent-3");
    });
  });

  describe("simulated concurrent claims", () => {
    it("simulates race condition with Promise.all (only one wins)", async () => {
      const task = createTask({ title: "Race condition task" });

      const results = await Promise.all([
        Promise.resolve().then(() => claimTask(task.id, "agent-1")),
        Promise.resolve().then(() => claimTask(task.id, "agent-2")),
        Promise.resolve().then(() => claimTask(task.id, "agent-3")),
      ]);

      const successCount = results.filter((r) => r.success).length;
      expect(successCount).toBe(1);

      const stored = getTask(task.id);
      expect(["agent-1", "agent-2", "agent-3"]).toContain(stored?.claimedBy);
    });

    it("verifies claim stability under stress", () => {
      const task = createTask({ title: "Stress test task" });

      for (let i = 0; i < 100; i++) {
        const result = claimTask(task.id, `agent-${i}`);
        if (i === 0) {
          expect(result.success).toBe(true);
        } else {
          expect(result.success).toBe(false);
        }
      }

      const stored = getTask(task.id);
      expect(stored?.claimedBy).toBe("agent-0");
    });
  });

  describe("claim atomicity verification", () => {
    it("claim sets both claimedBy and claimedAt atomically", () => {
      const task = createTask({ title: "Atomic test" });
      const result = claimTask(task.id, "agent-1");

      expect(result.success).toBe(true);
      expect(result.task?.claimedBy).toBe("agent-1");
      expect(result.task?.claimedAt).toBeDefined();

      const stored = getTask(task.id);
      expect(stored?.claimedBy).toBe("agent-1");
      expect(stored?.claimedAt).toBeDefined();
    });

    it("failed claim does not modify task", () => {
      const task = createTask({ title: "Test task" });
      claimTask(task.id, "agent-1");

      const beforeFailed = getTask(task.id);
      claimTask(task.id, "agent-2");
      const afterFailed = getTask(task.id);

      expect(beforeFailed?.claimedBy).toBe("agent-1");
      expect(afterFailed?.claimedBy).toBe("agent-1");
    });

    it("release clears both claimedBy and claimedAt", () => {
      const task = createTask({ title: "Release test" });

      claimTask(task.id, "agent-1");
      releaseTask(task.id, "agent-1");

      const stored = getTask(task.id);
      expect(stored?.claimedBy).toBeNull();
      expect(stored?.claimedAt).toBeNull();
    });
  });
});
