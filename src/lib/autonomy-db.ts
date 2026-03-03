/**
 * SQLite-backed Autonomy Storage
 * Stores autonomy settings and execution audit log
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

const DB_PATH = path.join(process.cwd(), "data", "kanban.db");

// ============================================================================
// Types
// ============================================================================

export const AUTONOMY_MODE = {
  SUGGEST: "suggest",
  AUTO: "auto",
} as const;

export type AutonomyMode = (typeof AUTONOMY_MODE)[keyof typeof AUTONOMY_MODE];

export const EXECUTION_STATUS = {
  PENDING: "pending",
  RUNNING: "running",
  SUCCESS: "success",
  SKIPPED: "skipped",
  ERROR: "error",
} as const;

export type ExecutionStatus = (typeof EXECUTION_STATUS)[keyof typeof EXECUTION_STATUS];

export interface AutonomySettings {
  enabled: boolean;
  mode: AutonomyMode;
  agentName: string;
  maxTasksPerCycle: number;
}

export interface AutonomyExecution {
  id: string;
  timestamp: string;
  taskId: string;
  taskTitle: string;
  agentName: string;
  mode: AutonomyMode;
  status: ExecutionStatus;
  result: string | null;
  durationMs: number | null;
  metadata: Record<string, unknown> | null;
}

export interface CreateExecutionInput {
  taskId: string;
  taskTitle: string;
  agentName: string;
  mode: AutonomyMode;
  status: ExecutionStatus;
  result?: string | null;
  durationMs?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface ListExecutionsFilters {
  taskId?: string;
  status?: ExecutionStatus;
  agentName?: string;
  limit?: number;
  offset?: number;
}

const DEFAULT_SETTINGS: AutonomySettings = {
  enabled: false,
  mode: AUTONOMY_MODE.SUGGEST,
  agentName: "",
  maxTasksPerCycle: 3,
};

// ============================================================================
// Database Setup
// ============================================================================

let _db: Database.Database | null = null;

/**
 * Get the database connection singleton
 * Uses the same database as kanban for consistency
 */
function getDb(): Database.Database {
  if (_db) return _db;

  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  _db = new Database(DB_PATH);

  // WAL mode for better concurrency
  _db.pragma("journal_mode = WAL");
  _db.pragma("synchronous = NORMAL");

  // Create autonomy tables
  _db.exec(`
    CREATE TABLE IF NOT EXISTS autonomy_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      enabled INTEGER NOT NULL DEFAULT 0,
      mode TEXT NOT NULL DEFAULT 'suggest',
      agent_name TEXT NOT NULL DEFAULT '',
      max_tasks_per_cycle INTEGER NOT NULL DEFAULT 3
    );

    CREATE TABLE IF NOT EXISTS autonomy_executions (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      task_id TEXT NOT NULL,
      task_title TEXT NOT NULL,
      agent_name TEXT NOT NULL,
      mode TEXT NOT NULL,
      status TEXT NOT NULL,
      result TEXT,
      duration_ms INTEGER,
      metadata TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_autonomy_executions_timestamp ON autonomy_executions(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_autonomy_executions_task_id ON autonomy_executions(task_id);
    CREATE INDEX IF NOT EXISTS idx_autonomy_executions_status ON autonomy_executions(status);
    CREATE INDEX IF NOT EXISTS idx_autonomy_executions_agent ON autonomy_executions(agent_name);
  `);

  // Seed default settings if empty
  const settingsExists = _db.prepare("SELECT 1 FROM autonomy_settings WHERE id = 1").get() as { "1": number } | undefined;
  if (!settingsExists) {
    _db.prepare(`
      INSERT INTO autonomy_settings (id, enabled, mode, agent_name, max_tasks_per_cycle)
      VALUES (1, 0, 'suggest', '', 3)
    `).run();
    console.log("[autonomy-db] Seeded default settings");
  }

  return _db;
}

// ============================================================================
// Settings Operations
// ============================================================================

/**
 * Get current autonomy settings
 * @returns Current autonomy settings
 */
export function getAutonomySettings(): AutonomySettings {
  const db = getDb();
  const row = db.prepare("SELECT * FROM autonomy_settings WHERE id = 1").get() as Record<string, unknown> | undefined;

  if (!row) {
    return DEFAULT_SETTINGS;
  }

  return {
    enabled: row.enabled === 1,
    mode: row.mode as AutonomyMode,
    agentName: row.agent_name as string,
    maxTasksPerCycle: row.max_tasks_per_cycle as number,
  };
}

/**
 * Save autonomy settings
 * @param settings - Settings to save
 */
export function saveAutonomySettings(settings: Partial<AutonomySettings>): AutonomySettings {
  const db = getDb();
  const current = getAutonomySettings();

  const enabled = settings.enabled ?? current.enabled;
  const mode = settings.mode ?? current.mode;
  const agentName = settings.agentName ?? current.agentName;
  const maxTasksPerCycle = settings.maxTasksPerCycle ?? current.maxTasksPerCycle;

  db.prepare(`
    UPDATE autonomy_settings
    SET enabled = ?, mode = ?, agent_name = ?, max_tasks_per_cycle = ?
    WHERE id = 1
  `).run(enabled ? 1 : 0, mode, agentName, maxTasksPerCycle);

  return {
    enabled,
    mode,
    agentName,
    maxTasksPerCycle,
  };
}

// ============================================================================
// Execution Operations
// ============================================================================

/**
 * Create a new autonomy execution record
 * @param input - Execution creation data
 * @returns The created execution record
 */
export function createAutonomyExecution(input: CreateExecutionInput): AutonomyExecution {
  const db = getDb();
  const id = randomUUID();
  const timestamp = new Date().toISOString();

  db.prepare(`
    INSERT INTO autonomy_executions (id, timestamp, task_id, task_title, agent_name, mode, status, result, duration_ms, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    timestamp,
    input.taskId,
    input.taskTitle,
    input.agentName,
    input.mode,
    input.status,
    input.result ?? null,
    input.durationMs ?? null,
    input.metadata ? JSON.stringify(input.metadata) : null
  );

  // Prune executions older than 30 days
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  db.prepare("DELETE FROM autonomy_executions WHERE timestamp < ?").run(cutoff);

  return {
    id,
    timestamp,
    taskId: input.taskId,
    taskTitle: input.taskTitle,
    agentName: input.agentName,
    mode: input.mode,
    status: input.status,
    result: input.result ?? null,
    durationMs: input.durationMs ?? null,
    metadata: input.metadata ?? null,
  };
}

/**
 * Update an existing execution record
 * @param id - Execution UUID
 * @param updates - Fields to update
 * @returns The updated execution or null if not found
 */
export function updateAutonomyExecution(
  id: string,
  updates: {
    status?: ExecutionStatus;
    result?: string | null;
    durationMs?: number | null;
    metadata?: Record<string, unknown> | null;
  }
): AutonomyExecution | null {
  const db = getDb();

  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.status !== undefined) {
    fields.push("status = ?");
    values.push(updates.status);
  }
  if (updates.result !== undefined) {
    fields.push("result = ?");
    values.push(updates.result);
  }
  if (updates.durationMs !== undefined) {
    fields.push("duration_ms = ?");
    values.push(updates.durationMs);
  }
  if (updates.metadata !== undefined) {
    fields.push("metadata = ?");
    values.push(updates.metadata ? JSON.stringify(updates.metadata) : null);
  }

  if (fields.length === 0) {
    return getAutonomyExecutionById(id);
  }

  values.push(id);
  db.prepare(`UPDATE autonomy_executions SET ${fields.join(", ")} WHERE id = ?`).run(...values);

  return getAutonomyExecutionById(id);
}

/**
 * Get an execution by ID
 * @param id - Execution UUID
 * @returns The execution or null if not found
 */
export function getAutonomyExecutionById(id: string): AutonomyExecution | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM autonomy_executions WHERE id = ?").get(id) as Record<string, unknown> | undefined;
  return row ? parseExecutionRow(row) : null;
}

/**
 * List autonomy executions with optional filters
 * @param filters - Optional filters for task, status, agent, and pagination
 * @returns Array of executions ordered by timestamp (newest first)
 */
export function listAutonomyExecutions(filters?: ListExecutionsFilters): AutonomyExecution[] {
  const db = getDb();

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters?.taskId) {
    conditions.push("task_id = ?");
    params.push(filters.taskId);
  }

  if (filters?.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  }

  if (filters?.agentName) {
    conditions.push("agent_name = ?");
    params.push(filters.agentName);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const limit = filters?.limit ?? 50;
  const offset = filters?.offset ?? 0;

  const rows = db
    .prepare(`SELECT * FROM autonomy_executions ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`)
    .all(...params, limit, offset) as Record<string, unknown>[];

  return rows.map(parseExecutionRow);
}

/**
 * Get execution count with optional filters
 * @param filters - Optional filters
 * @returns Count of matching executions
 */
export function getAutonomyExecutionsCount(filters?: ListExecutionsFilters): number {
  const db = getDb();

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters?.taskId) {
    conditions.push("task_id = ?");
    params.push(filters.taskId);
  }

  if (filters?.status) {
    conditions.push("status = ?");
    params.push(filters.status);
  }

  if (filters?.agentName) {
    conditions.push("agent_name = ?");
    params.push(filters.agentName);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const result = db.prepare(`SELECT COUNT(*) as n FROM autonomy_executions ${where}`).get(...params) as { n: number };

  return result.n;
}

// ============================================================================
// Helper Functions
// ============================================================================

function parseExecutionRow(row: Record<string, unknown>): AutonomyExecution {
  return {
    id: row.id as string,
    timestamp: row.timestamp as string,
    taskId: row.task_id as string,
    taskTitle: row.task_title as string,
    agentName: row.agent_name as string,
    mode: row.mode as AutonomyMode,
    status: row.status as ExecutionStatus,
    result: row.result as string | null,
    durationMs: row.duration_ms as number | null,
    metadata: row.metadata ? JSON.parse(row.metadata as string) : null,
  };
}
