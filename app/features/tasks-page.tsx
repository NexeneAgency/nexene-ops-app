"use client";
import { CalendarDays, ChartNoAxesGantt, Columns3, List } from "lucide-react";

import { useWorkspace } from "../workspace-context";
import { TaskViews } from "./task-views";
export function TasksPage() {
  const { lang, view, project, mode, setMode, t, tasks, task } = useWorkspace();

  return (
    <>
      <div className="view-toolbar">
        <div
          className="view-switch"
          role="group"
          aria-label={lang === "de" ? "Aufgabenansicht" : "Task view"}
        >
          {(
            [
              ["list", List],
              ["board", Columns3],
              ["calendar", CalendarDays],
              ["timeline", ChartNoAxesGantt],
            ] as const
          ).map(([v, Icon]) => (
            <button
              aria-pressed={mode === v}
              className={mode === v ? "active" : ""}
              key={v}
              onClick={() => setMode(v)}
            >
              <Icon size={15} />
              {t(v)}
            </button>
          ))}
        </div>
        <span>
          {tasks.length} {t("tasks")}
        </span>
      </div>
      {<TaskViews />}
    </>
  );
}
