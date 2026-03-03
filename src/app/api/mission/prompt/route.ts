/**
 * Mission Prompt API
 * POST /api/mission/prompt
 * Receives a prompt and returns prioritized tasks based on mission alignment
 */

import { NextResponse } from "next/server";
import { getMission } from "@/lib/mission-storage";
import { listTasks } from "@/lib/kanban-db";
import { scoreTasksByMission, type ScoredTask } from "@/lib/reverse-prompt-scorer";

export const dynamic = "force-dynamic";

interface RequestBody {
  prompt?: string;
}

interface ResponseData {
  prompt: string;
  mission: {
    statement: string;
    goals: string[];
    values: string[];
  } | null;
  tasks: ScoredTask[];
  summary: {
    totalTasks: number;
    highPriority: number;
    mediumPriority: number;
    lowPriority: number;
  };
}

/**
 * POST handler - Score tasks against mission
 */
export async function POST(request: Request) {
  try {
    // Parse request body
    let body: RequestBody;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const { prompt } = body;

    // Get mission data
    const mission = getMission();

    // If no mission exists, return empty response
    if (!mission || (!mission.statement && mission.goals.length === 0 && mission.values.length === 0)) {
      const response: ResponseData = {
        prompt: prompt || "",
        mission: null,
        tasks: [],
        summary: {
          totalTasks: 0,
          highPriority: 0,
          mediumPriority: 0,
          lowPriority: 0,
        },
      };
      return NextResponse.json(response);
    }

    // Get all tasks
    const allTasks = listTasks();

    // Score tasks against mission
    const scoredTasks = scoreTasksByMission(allTasks, mission, 20);

    // Calculate summary
    const summary = {
      totalTasks: scoredTasks.length,
      highPriority: scoredTasks.filter((t) => t.priorityLevel === "high").length,
      mediumPriority: scoredTasks.filter((t) => t.priorityLevel === "medium").length,
      lowPriority: scoredTasks.filter((t) => t.priorityLevel === "low").length,
    };

    const response: ResponseData = {
      prompt: prompt || "",
      mission: {
        statement: mission.statement,
        goals: mission.goals,
        values: mission.values,
      },
      tasks: scoredTasks,
      summary,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in POST /api/mission/prompt:", error);
    return NextResponse.json(
      { error: "Failed to score tasks against mission" },
      { status: 500 }
    );
  }
}
