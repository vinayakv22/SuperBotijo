"use client";

import { useState, useEffect } from "react";
import {
  Heart,
  Clock,
  Target,
  Edit3,
  Eye,
  Save,
  FileText,
  ExternalLink,
  Loader2,
  CheckCircle2,
  Bot,
  ToggleLeft,
  ToggleRight,
  ListTodo,
  History,
} from "lucide-react";

interface AutonomySettings {
  enabled: boolean;
  mode: "suggest" | "auto";
  agentName: string;
  maxTasksPerCycle: number;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
}

interface Execution {
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

interface HeartbeatStatusProps {
  data: {
    enabled: boolean;
    every: string;
    target: string;
    activeHours: { start: string; end: string } | null;
    heartbeatMd: string;
    heartbeatMdPath: string;
    configured: boolean;
    autonomy?: AutonomySettings;
  };
  onSave: (content: string) => Promise<void>;
}

const TEMPLATE = `# Heartbeat

## Checks to perform every 30 minutes

- [ ] Check email for urgent messages
- [ ] Review calendar for events in next 2 hours
- [ ] Check weather for significant changes
- [ ] Review pending tasks
- [ ] If idle for 8+ hours, send brief check-in

## Notes

- Only alert if something actually needs attention
- Use \`HEARTBEAT_OK\` if everything is fine
- Be smart about prioritization
`;

const STATUS_COLORS: Record<string, string> = {
  success: "var(--success)",
  error: "var(--error)",
  pending: "var(--info)",
  running: "var(--accent)",
  skipped: "var(--text-muted)",
};

const PRIORITY_COLORS: Record<string, string> = {
  low: "var(--text-muted)",
  medium: "var(--info)",
  high: "var(--accent)",
  critical: "var(--error)",
};

export function HeartbeatStatus({ data, onSave }: HeartbeatStatusProps) {
  const [isEditing, setIsEditing] = useState(!data.configured);
  const [content, setContent] = useState(data.heartbeatMd);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Autonomy state
  const [autonomy, setAutonomy] = useState<AutonomySettings>(
    data.autonomy || {
      enabled: false,
      mode: "suggest",
      agentName: "",
      maxTasksPerCycle: 3,
    }
  );
  const [isSavingAutonomy, setIsSavingAutonomy] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [isLoadingExecutions, setIsLoadingExecutions] = useState(false);

  // Fetch tasks and executions on mount and when autonomy changes
  useEffect(() => {
    if (autonomy.agentName) {
      fetchTasks();
      fetchExecutions();
    }
  }, [autonomy.agentName, autonomy.enabled]);

  const fetchTasks = async () => {
    if (!autonomy.agentName) return;
    setIsLoadingTasks(true);
    try {
      const res = await fetch(`/api/heartbeat/tasks?agentName=${encodeURIComponent(autonomy.agentName)}`);
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch (e) {
      console.error("Failed to fetch tasks:", e);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  const fetchExecutions = async () => {
    if (!autonomy.agentName) return;
    setIsLoadingExecutions(true);
    try {
      const res = await fetch(`/api/heartbeat/executions?agentName=${encodeURIComponent(autonomy.agentName)}&limit=5`);
      if (res.ok) {
        const data = await res.json();
        setExecutions(data.executions || []);
      }
    } catch (e) {
      console.error("Failed to fetch executions:", e);
    } finally {
      setIsLoadingExecutions(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSave(content);
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 2000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutonomySave = async () => {
    setIsSavingAutonomy(true);
    try {
      const res = await fetch("/api/heartbeat/autonomy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(autonomy),
      });
      if (res.ok) {
        const saved = await res.json();
        setAutonomy(saved);
      }
    } catch (e) {
      console.error("Failed to save autonomy:", e);
    } finally {
      setIsSavingAutonomy(false);
    }
  };

  const useTemplate = () => {
    setContent(TEMPLATE);
    setIsEditing(true);
  };

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "just now";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Heartbeat Status Card */}
      <div
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "0.75rem",
          padding: "1.25rem",
        }}
      >
        <h3
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1rem",
            color: "var(--text-primary)",
            fontFamily: "var(--font-heading)",
          }}
        >
          <Heart
            className="w-5 h-5"
            style={{ color: data.enabled ? "var(--error)" : "var(--text-muted)" }}
          />
          Heartbeat Status
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "1rem",
          }}
        >
          <div>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
              Status
            </span>
            <p
              style={{
                color: data.enabled ? "var(--success)" : "var(--text-muted)",
                fontWeight: 600,
                marginTop: "0.25rem",
              }}
            >
              {data.enabled ? "✅ Active" : "⚪ Not configured"}
            </p>
          </div>

          <div>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
              Interval
            </span>
            <p
              style={{
                color: "var(--text-primary)",
                fontWeight: 600,
                marginTop: "0.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <Clock className="w-4 h-4" style={{ color: "var(--info)" }} />
              Every {data.every}
            </p>
          </div>

          <div>
            <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
              Target
            </span>
            <p
              style={{
                color: "var(--text-primary)",
                fontWeight: 600,
                marginTop: "0.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              <Target className="w-4 h-4" style={{ color: "var(--accent)" }} />
              {data.target}
            </p>
          </div>

          {data.activeHours && (
            <div>
              <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                Active Hours
              </span>
              <p
                style={{
                  color: "var(--text-primary)",
                  fontWeight: 600,
                  marginTop: "0.25rem",
                }}
              >
                {data.activeHours.start} - {data.activeHours.end}
              </p>
            </div>
          )}
        </div>

        <a
          href="https://docs.openclaw.ai/gateway/heartbeat"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            marginTop: "1rem",
            color: "var(--info)",
            fontSize: "0.8rem",
            textDecoration: "none",
          }}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Heartbeat Documentation
        </a>
      </div>

      {/* Autonomy Settings Card */}
      <div
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "0.75rem",
          padding: "1.25rem",
        }}
      >
        <h3
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "1rem",
            color: "var(--text-primary)",
            fontFamily: "var(--font-heading)",
          }}
        >
          <Bot className="w-5 h-5" style={{ color: "var(--accent)" }} />
          Autonomy Settings
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Enable Toggle */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                Enable Autonomy
              </span>
              <p style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                Allow agent to execute tasks during heartbeat
              </p>
            </div>
            <button
              onClick={() => setAutonomy((a) => ({ ...a, enabled: !a.enabled }))}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                alignItems: "center",
              }}
            >
              {autonomy.enabled ? (
                <ToggleRight className="w-10 h-10" style={{ color: "var(--success)" }} />
              ) : (
                <ToggleLeft className="w-10 h-10" style={{ color: "var(--text-muted)" }} />
              )}
            </button>
          </div>

          {/* Mode Selector */}
          <div>
            <label
              style={{
                color: "var(--text-primary)",
                fontWeight: 500,
                display: "block",
                marginBottom: "0.5rem",
              }}
            >
              Execution Mode
            </label>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                onClick={() => setAutonomy((a) => ({ ...a, mode: "suggest" }))}
                style={{
                  flex: 1,
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid",
                  borderColor: autonomy.mode === "suggest" ? "var(--accent)" : "var(--border)",
                  backgroundColor: autonomy.mode === "suggest" ? "var(--accent)" : "var(--card-elevated)",
                  color: autonomy.mode === "suggest" ? "#000" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                💡 Suggest
              </button>
              <button
                onClick={() => setAutonomy((a) => ({ ...a, mode: "auto" }))}
                style={{
                  flex: 1,
                  padding: "0.5rem 1rem",
                  borderRadius: "0.5rem",
                  border: "1px solid",
                  borderColor: autonomy.mode === "auto" ? "var(--accent)" : "var(--border)",
                  backgroundColor: autonomy.mode === "auto" ? "var(--accent)" : "var(--card-elevated)",
                  color: autonomy.mode === "auto" ? "#000" : "var(--text-secondary)",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                ⚡ Auto-Execute
              </button>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: "0.5rem" }}>
              {autonomy.mode === "suggest"
                ? "Preview tasks without executing them"
                : "Automatically execute tasks during heartbeat cycles"}
            </p>
          </div>

          {/* Agent Name */}
          <div>
            <label
              style={{
                color: "var(--text-primary)",
                fontWeight: 500,
                display: "block",
                marginBottom: "0.5rem",
              }}
            >
              Agent Name
            </label>
            <input
              type="text"
              value={autonomy.agentName}
              onChange={(e) => setAutonomy((a) => ({ ...a, agentName: e.target.value }))}
              placeholder="Enter agent name to match task assignees"
              style={{
                width: "100%",
                padding: "0.5rem 0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid var(--border)",
                backgroundColor: "var(--card-elevated)",
                color: "var(--text-primary)",
                fontSize: "0.9rem",
              }}
            />
          </div>

          {/* Max Tasks Per Cycle */}
          <div>
            <label
              style={{
                color: "var(--text-primary)",
                fontWeight: 500,
                display: "block",
                marginBottom: "0.5rem",
              }}
            >
              Max Tasks Per Cycle: {autonomy.maxTasksPerCycle}
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={autonomy.maxTasksPerCycle}
              onChange={(e) => setAutonomy((a) => ({ ...a, maxTasksPerCycle: parseInt(e.target.value) }))}
              style={{ width: "100%" }}
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleAutonomySave}
            disabled={isSavingAutonomy}
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "var(--success)",
              color: "#000",
              border: "none",
              borderRadius: "0.5rem",
              cursor: isSavingAutonomy ? "not-allowed" : "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              opacity: isSavingAutonomy ? 0.7 : 1,
            }}
          >
            {isSavingAutonomy ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" /> Save Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pending Tasks Preview */}
      {autonomy.enabled && autonomy.agentName && (
        <div
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "0.75rem",
            padding: "1.25rem",
          }}
        >
          <h3
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
              color: "var(--text-primary)",
              fontFamily: "var(--font-heading)",
            }}
          >
            <ListTodo className="w-5 h-5" style={{ color: "var(--info)" }} />
            Pending Tasks ({tasks.length})
          </h3>

          {isLoadingTasks ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "1rem" }}>
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-muted)" }} />
            </div>
          ) : tasks.length === 0 ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "1rem" }}>
              No tasks assigned to &quot;{autonomy.agentName}&quot; in progress
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {tasks.slice(0, autonomy.maxTasksPerCycle).map((task) => (
                <div
                  key={task.id}
                  style={{
                    padding: "0.75rem",
                    backgroundColor: "var(--card-elevated)",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        padding: "0.1rem 0.4rem",
                        borderRadius: "0.25rem",
                        backgroundColor: PRIORITY_COLORS[task.priority] || "var(--text-muted)",
                        color: task.priority === "low" ? "var(--text-primary)" : "#000",
                        fontWeight: 600,
                        textTransform: "uppercase",
                      }}
                    >
                      {task.priority}
                    </span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                      {task.title}
                    </span>
                  </div>
                  {task.description && (
                    <p
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.8rem",
                        marginTop: "0.25rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {task.description}
                    </p>
                  )}
                </div>
              ))}
              {tasks.length > autonomy.maxTasksPerCycle && (
                <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", textAlign: "center" }}>
                  +{tasks.length - autonomy.maxTasksPerCycle} more tasks
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Recent Executions */}
      {autonomy.agentName && (
        <div
          style={{
            backgroundColor: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: "0.75rem",
            padding: "1.25rem",
          }}
        >
          <h3
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "1rem",
              color: "var(--text-primary)",
              fontFamily: "var(--font-heading)",
            }}
          >
            <History className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
            Recent Executions
          </h3>

          {isLoadingExecutions ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "1rem" }}>
              <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--text-muted)" }} />
            </div>
          ) : executions.length === 0 ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "1rem" }}>
              No executions recorded yet
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {executions.map((exec) => (
                <div
                  key={exec.id}
                  style={{
                    padding: "0.75rem",
                    backgroundColor: "var(--card-elevated)",
                    borderRadius: "0.5rem",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                      {exec.taskTitle}
                    </span>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span
                        style={{
                          fontSize: "0.7rem",
                          padding: "0.1rem 0.4rem",
                          borderRadius: "0.25rem",
                          backgroundColor: STATUS_COLORS[exec.status] || "var(--text-muted)",
                          color: "#000",
                          fontWeight: 600,
                          textTransform: "uppercase",
                        }}
                      >
                        {exec.status}
                      </span>
                      <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                        {formatTimestamp(exec.timestamp)}
                      </span>
                    </div>
                  </div>
                  {exec.result && (
                    <p
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.8rem",
                        marginTop: "0.25rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {exec.result}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* HEARTBEAT.md Editor */}
      <div
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: "0.75rem",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1rem",
            borderBottom: "1px solid var(--border)",
            backgroundColor: "var(--card-elevated)",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              fontWeight: 600,
              color: "var(--text-primary)",
            }}
          >
            <FileText className="w-4 h-4" />
            HEARTBEAT.md
          </span>

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => setIsEditing(!isEditing)}
              style={{
                padding: "0.25rem 0.5rem",
                borderRadius: "0.25rem",
                backgroundColor: isEditing ? "var(--accent)" : "var(--card)",
                color: isEditing ? "#000" : "var(--text-secondary)",
                border: "none",
                cursor: "pointer",
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.25rem",
              }}
            >
              {isEditing ? (
                <>
                  <Eye className="w-3.5 h-3.5" /> Preview
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </>
              )}
            </button>
          </div>
        </div>

        <div style={{ padding: "1rem" }}>
          {!data.configured && !content && (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <p
                style={{
                  color: "var(--text-muted)",
                  marginBottom: "1rem",
                }}
              >
                No HEARTBEAT.md file found. Create one to enable heartbeat checks.
              </p>
              <button
                onClick={useTemplate}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "var(--accent)",
                  color: "#000",
                  border: "none",
                  borderRadius: "0.5rem",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Use Template
              </button>
            </div>
          )}

          {(content || isEditing) && (
            <>
              {isEditing ? (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={TEMPLATE}
                  style={{
                    width: "100%",
                    minHeight: "300px",
                    backgroundColor: "var(--card-elevated)",
                    border: "1px solid var(--border)",
                    borderRadius: "0.5rem",
                    padding: "1rem",
                    color: "var(--text-primary)",
                    fontFamily: "monospace",
                    fontSize: "0.85rem",
                    resize: "vertical",
                    outline: "none",
                  }}
                />
              ) : (
                <div
                  style={{
                    minHeight: "300px",
                    padding: "1rem",
                    backgroundColor: "var(--card-elevated)",
                    borderRadius: "0.5rem",
                    color: "var(--text-secondary)",
                    fontSize: "0.85rem",
                    whiteSpace: "pre-wrap",
                    fontFamily: "monospace",
                  }}
                >
                  {content || TEMPLATE}
                </div>
              )}

              {isEditing && (
                <div
                  style={{
                    marginTop: "1rem",
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    gap: "0.5rem",
                  }}
                >
                  {saveSuccess && (
                    <span
                      style={{
                        color: "var(--success)",
                        fontSize: "0.85rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Saved!
                    </span>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    style={{
                      padding: "0.5rem 1rem",
                      backgroundColor: "var(--success)",
                      color: "#000",
                      border: "none",
                      borderRadius: "0.5rem",
                      cursor: isSaving ? "not-allowed" : "pointer",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem",
                      opacity: isSaving ? 0.7 : 1,
                    }}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" /> Save
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
