"use client";

import { OperationsJournalEntry } from "@/lib/mission-types";
import { JournalEntryCard } from "./JournalEntryCard";

interface JournalTimelineProps {
  entries: OperationsJournalEntry[];
  onEdit: (entry: OperationsJournalEntry) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function JournalTimeline({
  entries,
  onEdit,
  onDelete,
  isLoading,
}: JournalTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-xl p-4"
            style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
          >
            <div className="h-4 w-24 rounded mb-3" style={{ backgroundColor: "var(--border)" }} />
            <div className="h-3 w-full rounded mb-2" style={{ backgroundColor: "var(--border)" }} />
            <div className="h-3 w-3/4 rounded" style={{ backgroundColor: "var(--border)" }} />
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div
        className="text-center py-12 rounded-xl"
        style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
      >
        <p style={{ color: "var(--text-muted)" }}>No journal entries yet</p>
        <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "8px" }}>
          Create your first entry to start tracking your operations
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <JournalEntryCard
          key={entry.id}
          entry={entry}
          onEdit={() => onEdit(entry)}
          onDelete={() => onDelete(entry.id)}
        />
      ))}
    </div>
  );
}
