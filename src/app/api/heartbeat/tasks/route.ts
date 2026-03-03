import { NextRequest, NextResponse } from "next/server";
import { listTasks, type KanbanTask } from "@/lib/kanban-db";
import { getAutonomySettings } from "@/lib/autonomy-db";

export const dynamic = "force-dynamic";

interface TaskResponse {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
}

/**
 * GET /api/heartbeat/tasks
 * Returns tasks assigned to the agent with status 'in_progress'
 * Requires agentName in query params or uses autonomy settings
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const agentName = searchParams.get("agentName");

    // Get agent name from settings if not provided
    const settings = getAutonomySettings();
    const effectiveAgentName = agentName || settings.agentName;

    if (!effectiveAgentName) {
      return NextResponse.json(
        { error: "No agent name configured. Set agentName in autonomy settings." },
        { status: 400 }
      );
    }

    // Get tasks where assignee = agentName AND status = 'in_progress'
    const tasks = listTasks({
      assignee: effectiveAgentName,
      status: "in_progress",
    });

    // Transform to response format
    const response: TaskResponse[] = tasks.map((task: KanbanTask) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
    }));

    return NextResponse.json({
      agentName: effectiveAgentName,
      count: response.length,
      tasks: response,
    });
  } catch (error) {
    console.error("[tasks] Error getting tasks:", error);
    return NextResponse.json(
      { error: "Failed to get tasks" },
      { status: 500 }
    );
  }
}
