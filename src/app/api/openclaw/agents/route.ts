import { NextResponse } from "next/server";
import { getOpenClawAgents, syncAgentsToProjects } from "@/lib/openclaw-agents";

export const dynamic = "force-dynamic";

/**
 * GET /api/openclaw/agents
 * Returns list of OpenClaw agents detected from openclaw.json
 */
export async function GET() {
  try {
    const agents = getOpenClawAgents();
    return NextResponse.json({ agents });
  } catch (error) {
    console.error("[/api/openclaw/agents] Error:", error);
    return NextResponse.json(
      { error: "Failed to load OpenClaw agents" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/openclaw/agents
 * Syncs OpenClaw agents to Kanban projects
 */
export async function POST() {
  try {
    const result = syncAgentsToProjects();
    return NextResponse.json({
      success: true,
      synced: result.synced,
      created: result.created,
      agents: result.agents,
    });
  } catch (error) {
    console.error("[/api/openclaw/agents] Sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync agents to projects" },
      { status: 500 }
    );
  }
}
