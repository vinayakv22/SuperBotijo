"use client";

import { Calendar, X } from "lucide-react";

interface JournalFiltersProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onClear: () => void;
}

export function JournalFilters({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClear,
}: JournalFiltersProps) {
  const hasFilters = startDate || endDate;

  return (
    <div
      className="flex flex-wrap items-center gap-3 p-3 rounded-xl"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
        <span className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          Filters
        </span>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs" style={{ color: "var(--text-muted)" }}>
          From
        </label>
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="px-2 py-1.5 rounded-lg text-sm"
          style={{
            backgroundColor: "var(--card-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        <label className="text-xs" style={{ color: "var(--text-muted)" }}>
          To
        </label>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="px-2 py-1.5 rounded-lg text-sm"
          style={{
            backgroundColor: "var(--card-elevated)",
            border: "1px solid var(--border)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {hasFilters && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
}
