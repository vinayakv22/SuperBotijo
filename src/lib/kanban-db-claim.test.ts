import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createTask,
  getTask,
  claimTask,
  releaseTask,
  getAgentWorkload,
  getTasksByClaimant,
  clearAllDataForTesting,
} from "./kanban-db";

describe("kanban-db claim/release", () => {
  beforeEach(() => {
    clearAllDataForTesting();
  });

  afterEach(() => {
    clearAllDataForTesting();
  });

  describe("claimTask", () => {
    it("returns not_found for non-existent task", () => {
      const result = claimTask("non-existent-id", "agent-1");
      expect(result.success).toBe(false);
      expect(result.reason).toBe("not_found");
    });

    it("successfully claims an unclaimed task", () => {
      const task = createTask({ title: "Test task" });
      const result = claimTask(task.id, "agent-1");

      expect(result.success).toBe(true);
      expect(result.task?.claimedBy).toBe("agent-1");
      expect(result.task?.claimedAt).not.toBeNull();
    });

    it("is idempotent for same agent (re-claim)", () => {
      const task = createTask({ title: "Test task" });
      const result1 = claimTask(task.id, "agent-1");
      const result2 = claimTask(task.id, "agent-1");

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      expect(result2.task?.claimedBy).toBe("agent-1");
    });

    it("returns claimed_by_other when different agent tries to claim", () => {
      const task = createTask({ title: "Test task" });
      claimTask(task.id, "agent-1");
      const result = claimTask(task.id, "agent-2");

      expect(result.success).toBe(false);
      expect(result.reason).toBe("claimed_by_other");
    });

    it("returns already_claimed on race condition (double claim)", () => {
      const task = createTask({ title: "Test task" });
      claimTask(task.id, "agent-1");

      const refreshedTask = getTask(task.id);
      if (refreshedTask?.claimedBy === "agent-1") {
        const result = claimTask(task.id, "agent-2");
        expect(result.success).toBe(false);
        expect(result.reason).toBe("claimed_by_other");
      }
    });

    it("sets claimedAt to current timestamp", () => {
      const task = createTask({ title: "Test task" });
      const before = new Date().toISOString();
      const result = claimTask(task.id, "agent-1");
      const after = new Date().toISOString();

      expect(result.task?.claimedAt).toBeDefined();
      const claimedAt = result.task?.claimedAt;
      if (claimedAt) {
        expect(claimedAt >= before).toBe(true);
        expect(claimedAt <= after).toBe(true);
      }
    });

    it("updates task in database after claim", () => {
      const task = createTask({ title: "Test task" });
      claimTask(task.id, "agent-1");

      const stored = getTask(task.id);
      expect(stored?.claimedBy).toBe("agent-1");
      expect(stored?.claimedAt).not.toBeNull();
    });

    it("can claim multiple tasks with same agent", () => {
      const task1 = createTask({ title: "Task 1" });
      const task2 = createTask({ title: "Task 2" });

      const result1 = claimTask(task1.id, "agent-1");
      const result2 = claimTask(task2.id, "agent-1");

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
    });
  });

  describe("releaseTask", () => {
    it("returns not_found for non-existent task", () => {
      const result = releaseTask("non-existent-id", "agent-1");
      expect(result.success).toBe(false);
      expect(result.reason).toBe("not_found");
    });

    it("returns not_claimed when task is not claimed", () => {
      const task = createTask({ title: "Test task" });
      const result = releaseTask(task.id, "agent-1");

      expect(result.success).toBe(false);
      expect(result.reason).toBe("not_claimed");
    });

    it("successfully releases claim by owner", () => {
      const task = createTask({ title: "Test task" });
      claimTask(task.id, "agent-1");
      const result = releaseTask(task.id, "agent-1");

      expect(result.success).toBe(true);

      const stored = getTask(task.id);
      expect(stored?.claimedBy).toBeNull();
      expect(stored?.claimedAt).toBeNull();
    });

    it("returns claimed_by_other when different agent tries to release", () => {
      const task = createTask({ title: "Test task" });
      claimTask(task.id, "agent-1");
      const result = releaseTask(task.id, "agent-2");

      expect(result.success).toBe(false);
      expect(result.reason).toBe("claimed_by_other");

      const stored = getTask(task.id);
      expect(stored?.claimedBy).toBe("agent-1");
    });

    it("allows re-claiming after release", () => {
      const task = createTask({ title: "Test task" });
      claimTask(task.id, "agent-1");
      releaseTask(task.id, "agent-1");
      const result = claimTask(task.id, "agent-2");

      expect(result.success).toBe(true);
      expect(result.task?.claimedBy).toBe("agent-2");
    });
  });

  describe("getAgentWorkload", () => {
    it("returns zero counts for agent with no tasks", () => {
      const workload = getAgentWorkload("agent-1");

      expect(workload.agentId).toBe("agent-1");
      expect(workload.todo).toBe(0);
      expect(workload.inProgress).toBe(0);
      expect(workload.done).toBe(0);
      expect(workload.claimed).toBe(0);
    });

    it("counts claimed tasks", () => {
      const task1 = createTask({ title: "Task 1" });
      const task2 = createTask({ title: "Task 2" });
      claimTask(task1.id, "agent-1");
      claimTask(task2.id, "agent-1");

      const workload = getAgentWorkload("agent-1");
      expect(workload.claimed).toBe(2);
    });

    it("does not count other agents claims", () => {
      const task1 = createTask({ title: "Task 1" });
      const task2 = createTask({ title: "Task 2" });
      claimTask(task1.id, "agent-1");
      claimTask(task2.id, "agent-2");

      const workload = getAgentWorkload("agent-1");
      expect(workload.claimed).toBe(1);
    });

    it("counts tasks by status for assigned agent", () => {
      createTask({ title: "Todo 1", assignee: "agent-1", status: "backlog" });
      createTask({ title: "Todo 2", assignee: "agent-1", status: "backlog" });
      createTask({ title: "Progress 1", assignee: "agent-1", status: "in_progress" });
      createTask({ title: "Done 1", assignee: "agent-1", status: "done" });

      const workload = getAgentWorkload("agent-1");

      expect(workload.todo).toBe(2);
      expect(workload.inProgress).toBe(1);
      expect(workload.done).toBe(1);
    });
  });

  describe("getTasksByClaimant", () => {
    it("returns empty array for agent with no claims", () => {
      const tasks = getTasksByClaimant("agent-1");
      expect(tasks).toEqual([]);
    });

    it("returns tasks claimed by agent", () => {
      const task1 = createTask({ title: "Task 1" });
      const task2 = createTask({ title: "Task 2" });
      claimTask(task1.id, "agent-1");
      claimTask(task2.id, "agent-1");

      const tasks = getTasksByClaimant("agent-1");

      expect(tasks).toHaveLength(2);
      expect(tasks.map((t) => t.id)).toContain(task1.id);
      expect(tasks.map((t) => t.id)).toContain(task2.id);
    });

    it("does not return tasks claimed by other agents", () => {
      const task1 = createTask({ title: "Task 1" });
      const task2 = createTask({ title: "Task 2" });
      claimTask(task1.id, "agent-1");
      claimTask(task2.id, "agent-2");

      const tasks = getTasksByClaimant("agent-1");

      expect(tasks).toHaveLength(1);
      expect(tasks[0].id).toBe(task1.id);
    });

    it("returns tasks ordered by claimed_at", async () => {
      const task1 = createTask({ title: "Task 1" });
      await new Promise((r) => setTimeout(r, 10));
      const task2 = createTask({ title: "Task 2" });
      await new Promise((r) => setTimeout(r, 10));
      const task3 = createTask({ title: "Task 3" });

      claimTask(task1.id, "agent-1");
      await new Promise((r) => setTimeout(r, 10));
      claimTask(task2.id, "agent-1");
      await new Promise((r) => setTimeout(r, 10));
      claimTask(task3.id, "agent-1");

      const tasks = getTasksByClaimant("agent-1");

      expect(tasks).toHaveLength(3);
      expect(tasks[0].id).toBe(task1.id);
      expect(tasks[1].id).toBe(task2.id);
      expect(tasks[2].id).toBe(task3.id);
    });
  });

  describe("claim and release workflow", () => {
    it("supports full claim -> release -> claim cycle", () => {
      const task = createTask({ title: "Test task" });

      const claim1 = claimTask(task.id, "agent-1");
      expect(claim1.success).toBe(true);

      const release = releaseTask(task.id, "agent-1");
      expect(release.success).toBe(true);

      const claim2 = claimTask(task.id, "agent-2");
      expect(claim2.success).toBe(true);
      expect(claim2.task?.claimedBy).toBe("agent-2");
    });

    it("prevents release by non-owner after multiple claims", () => {
      const task = createTask({ title: "Test task" });

      claimTask(task.id, "agent-1");
      const release = releaseTask(task.id, "agent-2");

      expect(release.success).toBe(false);
      expect(release.reason).toBe("claimed_by_other");
    });
  });
});
