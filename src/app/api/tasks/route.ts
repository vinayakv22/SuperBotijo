import { NextResponse } from "next/server";
import { execSync } from "child_process";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

const OPENCLAW_DIR = process.env.OPENCLAW_DIR || "/home/daniel/.openclaw";

export interface UnifiedTask {
  id: string;
  name: string;
  type: "cron" | "heartbeat" | "scheduled";
  agentId?: string;
  schedule: string;
  scheduleDisplay: string;
  enabled: boolean;
  nextRun: string | null;
  lastRun: string | null;
  description?: string;
  status?: "success" | "error" | "running" | "pending";
  error?: string;
}

/**
 * GET /api/tasks
 * Returns unified view of all scheduled tasks: cron jobs + heartbeat
 */
export async function GET() {
  try {
    const tasks: UnifiedTask[] = [];

    // 1. Get OpenClaw cron jobs
    try {
      const output = execSync("openclaw cron list --json --all 2>/dev/null", {
        timeout: 10000,
        encoding: "utf-8",
      });

      const parsed = JSON.parse(output);
      const cronJobs = parsed.jobs || [];

      for (const job of cronJobs) {
        const schedule = job.schedule || {};
        const state = job.state || {};

        let scheduleDisplay = "Custom";
        let scheduleString = "* * * * *";

        if (schedule.kind === "every") {
          const everyMs = schedule.everyMs;
          if (everyMs === 1800000) scheduleDisplay = "Every 30 min";
          else if (everyMs === 3600000) scheduleDisplay = "Every hour";
          else if (everyMs === 86400000) scheduleDisplay = "Daily";
          else scheduleDisplay = `Every ${everyMs / 60000} min`;
          scheduleString = `*/${everyMs / 60000} * * * *`;
        } else if (schedule.kind === "cron") {
          scheduleString = schedule.expr || "* * * * *";
          scheduleDisplay = scheduleString;
        }

        let status: "success" | "error" | "running" | "pending" = "pending";
        if (state.lastRunStatus === "success") status = "success";
        else if (state.lastRunStatus === "error") status = "error";

        tasks.push({
          id: job.id,
          name: job.name,
          type: "cron",
          agentId: job.agentId,
          schedule: scheduleString,
          scheduleDisplay,
          enabled: job.enabled !== false,
          nextRun: state.nextRunAtMs ? new Date(state.nextRunAtMs).toISOString() : null,
          lastRun: state.lastRunAtMs ? new Date(state.lastRunAtMs).toISOString() : null,
          description: job.description,
          status,
          error: state.lastError,
        });
      }
    } catch (error) {
      console.error("[tasks API] Error fetching cron jobs:", error);
    }

    // 2. Get Heartbeat configuration
    try {
      const configPath = join(OPENCLAW_DIR, "openclaw.json");
      if (existsSync(configPath)) {
        const raw = readFileSync(configPath, "utf-8");
        const json = JSON.parse(raw);
        const hb = json.agents?.defaults?.heartbeat;

        if (hb && hb.every) {
          const heartbeatPath = join(OPENCLAW_DIR, "HEARTBEAT.md");
          const wsHeartbeatPath = join(OPENCLAW_DIR, "workspace", "HEARTBEAT.md");

          let heartbeatMd = "";
          if (existsSync(heartbeatPath)) {
            heartbeatMd = readFileSync(heartbeatPath, "utf-8");
          } else if (existsSync(wsHeartbeatPath)) {
            heartbeatMd = readFileSync(wsHeartbeatPath, "utf-8");
          }

          const everyMs = parseInt(hb.every) || 1800000;
          let scheduleDisplay = "Custom";
          if (everyMs === 1800000) scheduleDisplay = "Every 30 min";
          else if (everyMs === 3600000) scheduleDisplay = "Every hour";
          else if (everyMs === 60000) scheduleDisplay = "Every min";
          else scheduleDisplay = `Every ${everyMs / 60000} min`;

          tasks.push({
            id: "heartbeat",
            name: "Heartbeat",
            type: "heartbeat",
            agentId: json.agents?.defaults?.id || "main",
            schedule: `*/${everyMs / 60000} * * * *`,
            scheduleDisplay,
            enabled: true,
            nextRun: null, // Calculated dynamically
            lastRun: null,
            description: heartbeatMd.slice(0, 200) || "Periodic agent self-check",
          });
        }
      }
    } catch (error) {
      console.error("[tasks API] Error fetching heartbeat:", error);
    }

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("[tasks API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}
