"use client";

import { OperationsJournalEntry } from "@/lib/mission-types";
import { Pencil, Trash2, Calendar, Star } from "lucide-react";

interface JournalEntryCardProps {
  entry: OperationsJournalEntry;
  onEdit: () => void;
  onDelete: () => void;
}

export function JournalEntryCard({
  entry,
  onEdit,
  onDelete,
}: JournalEntryCardProps) {
  const formattedDate = new Date(entry.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="rounded-xl p-4 transition-all hover:shadow-md"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            {formattedDate}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg transition-colors hover:bg-opacity-10"
            style={{ color: "var(--text-muted)" }}
            title="Edit entry"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded-lg transition-colors hover:bg-opacity-10"
            style={{ color: "var(--error)" }}
            title="Delete entry"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-3">
        <p
          className="text-sm leading-relaxed whitespace-pre-wrap"
          style={{ color: "var(--text-secondary)" }}
        >
          {entry.narrative}
        </p>
      </div>

      {entry.highlights && entry.highlights.length > 0 && (
        <div className="pt-2" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <Star className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
            <span
              className="text-xs font-medium uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              Highlights
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {entry.highlights.map((highlight, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs rounded-md"
                style={{
                  backgroundColor: "var(--accent)",
                  color: "var(--text-primary)",
                  opacity: 0.9,
                }}
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
