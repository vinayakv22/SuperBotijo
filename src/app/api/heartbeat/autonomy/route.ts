import { NextRequest, NextResponse } from "next/server";
import {
  getAutonomySettings,
  saveAutonomySettings,
  type AutonomySettings,
  type AutonomyMode,
} from "@/lib/autonomy-db";

export const dynamic = "force-dynamic";

/**
 * GET /api/heartbeat/autonomy
 * Returns current autonomy settings
 */
export async function GET() {
  try {
    const settings = getAutonomySettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("[autonomy] Error getting settings:", error);
    return NextResponse.json(
      { error: "Failed to get autonomy settings" },
      { status: 500 }
    );
  }
}

interface UpdateSettingsInput {
  enabled?: boolean;
  mode?: AutonomyMode;
  agentName?: string;
  maxTasksPerCycle?: number;
}

/**
 * PUT /api/heartbeat/autonomy
 * Updates autonomy settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as UpdateSettingsInput;

    // Validate mode if provided
    if (body.mode !== undefined && !["suggest", "auto"].includes(body.mode)) {
      return NextResponse.json(
        { error: "Invalid mode. Must be 'suggest' or 'auto'" },
        { status: 400 }
      );
    }

    // Validate maxTasksPerCycle if provided
    if (body.maxTasksPerCycle !== undefined) {
      if (typeof body.maxTasksPerCycle !== "number" || body.maxTasksPerCycle < 1 || body.maxTasksPerCycle > 10) {
        return NextResponse.json(
          { error: "maxTasksPerCycle must be a number between 1 and 10" },
          { status: 400 }
        );
      }
    }

    // Validate agentName if provided
    if (body.agentName !== undefined && typeof body.agentName !== "string") {
      return NextResponse.json(
        { error: "agentName must be a string" },
        { status: 400 }
      );
    }

    const settings = saveAutonomySettings(body);
    return NextResponse.json(settings);
  } catch (error) {
    console.error("[autonomy] Error saving settings:", error);
    return NextResponse.json(
      { error: "Failed to save autonomy settings" },
      { status: 500 }
    );
  }
}
