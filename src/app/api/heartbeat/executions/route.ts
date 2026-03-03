import { NextRequest, NextResponse } from "next/server";
import {
  listAutonomyExecutions,
  getAutonomyExecutionsCount,
  type AutonomyExecution,
  type ExecutionStatus,
} from "@/lib/autonomy-db";

export const dynamic = "force-dynamic";

interface ExecutionResponse {
  id: string;
  timestamp: string;
  taskId: string;
  taskTitle: string;
  agentName: string;
  mode: string;
  status: string;
  result: string | null;
  durationMs: number | null;
}

/**
 * GET /api/heartbeat/executions
 * Returns execution history with optional filters
 * Query params: limit, offset, taskId, status, agentName
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit") as string, 10) : 50;
    const offset = searchParams.get("offset") ? parseInt(searchParams.get("offset") as string, 10) : 0;
    const taskId = searchParams.get("taskId") || undefined;
    const status = searchParams.get("status") as ExecutionStatus | null;
    const agentName = searchParams.get("agentName") || undefined;

    // Validate limit and offset
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: "limit must be a number between 1 and 100" },
        { status: 400 }
      );
    }

    if (isNaN(offset) || offset < 0) {
      return NextResponse.json(
        { error: "offset must be a non-negative number" },
        { status: 400 }
      );
    }

    // Validate status if provided
    const validStatuses: ExecutionStatus[] = ["pending", "running", "success", "skipped", "error"];
    const statusFilter = status && validStatuses.includes(status) ? status : undefined;

    const filters = {
      limit,
      offset,
      taskId,
      status: statusFilter,
      agentName,
    };

    const executions = listAutonomyExecutions(filters);
    const total = getAutonomyExecutionsCount(filters);

    // Transform to response format
    const response: ExecutionResponse[] = executions.map((exec: AutonomyExecution) => ({
      id: exec.id,
      timestamp: exec.timestamp,
      taskId: exec.taskId,
      taskTitle: exec.taskTitle,
      agentName: exec.agentName,
      mode: exec.mode,
      status: exec.status,
      result: exec.result,
      durationMs: exec.durationMs,
    }));

    return NextResponse.json({
      total,
      limit,
      offset,
      executions: response,
    });
  } catch (error) {
    console.error("[executions] Error getting executions:", error);
    return NextResponse.json(
      { error: "Failed to get execution history" },
      { status: 500 }
    );
  }
}
