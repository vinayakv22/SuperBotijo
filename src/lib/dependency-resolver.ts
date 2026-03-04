/**
 * Dependency Resolution for Multi-Agent Task Coordination
 * Pure functions to compute task executability based on dependencies
 */
import type { KanbanTask } from "@/lib/kanban-db";

export type BlockedReason = "dependency_pending" | "dependency_failed" | "circular";

export interface ResolvedTask extends KanbanTask {
  isExecutable: boolean;
  blockedReason: BlockedReason | null;
}

interface TaskNode {
  id: string;
  dependsOn: string[] | null;
  visited: boolean;
  inStack: boolean;
}

/**
 * Resolve dependencies for all tasks and compute executability
 * @param tasks - Array of tasks to resolve
 * @returns Array of resolved tasks with isExecutable and blockedReason
 */
export function resolveDependencies(tasks: KanbanTask[]): ResolvedTask[] {
  const taskMap = new Map<string, KanbanTask>();
  const nodeMap = new Map<string, TaskNode>();

  for (const task of tasks) {
    taskMap.set(task.id, task);
    nodeMap.set(task.id, {
      id: task.id,
      dependsOn: task.dependsOn,
      visited: false,
      inStack: false,
    });
  }

  const circularTasks = new Set<string>();
  const result: ResolvedTask[] = [];

  for (const task of tasks) {
    const { isExecutable, blockedReason } = computeExecutability(
      task,
      taskMap,
      nodeMap,
      circularTasks
    );
    result.push({
      ...task,
      isExecutable,
      blockedReason,
    });
  }

  return result;
}

/**
 * Get all tasks that are blocked by dependencies
 * @param tasks - Array of tasks to check
 * @returns Array of blocked tasks
 */
export function getBlockedTasks(tasks: KanbanTask[]): KanbanTask[] {
  const resolved = resolveDependencies(tasks);
  return resolved.filter((t) => !t.isExecutable);
}

/**
 * Get all tasks that are ready to be executed (no blocking dependencies)
 * @param tasks - Array of tasks to check
 * @returns Array of executable tasks
 */
export function getExecutableTasks(tasks: KanbanTask[]): KanbanTask[] {
  const resolved = resolveDependencies(tasks);
  return resolved.filter((t) => t.isExecutable);
}

/**
 * Compute executability for a single task
 */
function computeExecutability(
  task: KanbanTask,
  taskMap: Map<string, KanbanTask>,
  nodeMap: Map<string, TaskNode>,
  circularTasks: Set<string>
): { isExecutable: boolean; blockedReason: BlockedReason | null } {
  if (!task.dependsOn || task.dependsOn.length === 0) {
    return { isExecutable: true, blockedReason: null };
  }

  for (const depId of task.dependsOn) {
    if (circularTasks.has(depId)) {
      return { isExecutable: false, blockedReason: "circular" };
    }

    const depTask = taskMap.get(depId);
    if (!depTask) {
      continue;
    }

    if (depTask.executionStatus === "error" || depTask.executionStatus === "skipped") {
      return { isExecutable: false, blockedReason: "dependency_failed" };
    }

    if (depTask.executionStatus !== "success") {
      if (hasCircularDependency(task.id, depId, nodeMap)) {
        circularTasks.add(task.id);
        return { isExecutable: false, blockedReason: "circular" };
      }
      return { isExecutable: false, blockedReason: "dependency_pending" };
    }
  }

  return { isExecutable: true, blockedReason: null };
}

/**
 * Detect circular dependencies using DFS
 */
function hasCircularDependency(
  startId: string,
  targetId: string,
  nodeMap: Map<string, TaskNode>
): boolean {
  const visited = new Set<string>();
  const stack = [targetId];

  while (stack.length > 0) {
    const current = stack.pop()!;
    if (current === startId) {
      return true;
    }

    if (visited.has(current)) {
      continue;
    }
    visited.add(current);

    const node = nodeMap.get(current);
    if (node?.dependsOn) {
      for (const depId of node.dependsOn) {
        if (!visited.has(depId)) {
          stack.push(depId);
        }
      }
    }
  }

  return false;
}
