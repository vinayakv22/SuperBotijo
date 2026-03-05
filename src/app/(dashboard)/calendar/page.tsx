"use client";

import { WeeklyCalendar } from "@/components/WeeklyCalendar";
import { useI18n } from "@/i18n/provider";

export default function CalendarPage() {
  const { t } = useI18n();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: "var(--text-primary)", fontFamily: "var(--font-heading)" }}
        >
          {t("calendar.title")}
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          {t("calendar.subtitle")}
        </p>
      </div>

      <WeeklyCalendar />
    </div>
  );
}
