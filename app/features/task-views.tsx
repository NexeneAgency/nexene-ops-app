"use client";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { statuses, today } from "../../lib/client";
import { useWorkspace } from "../workspace-context";

import { TaskTable } from "./task-table";
export function TaskViews() {
  const {
    lang,
    data,
    setData,
    mode,
    setTaskId,
    month,
    setMonth,
    t,
    admin,
    mutate,
    fmt,
    tasks,
    task,
    projectOf,
  } = useWorkspace();

  if (mode === "board")
    return (
      <div className="board">
        {statuses.map((status) => (
          <section
            key={status}
            onDragOver={(e) => admin && e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const id = e.dataTransfer.getData("text/plain");
              if (data.tasks.some((t) => t.id === id))
                mutate(`tasks/${id}`, "PATCH", { status }).catch(() => {});
            }}
          >
            <h2>
              <i className={`status-dot ${status}`} />
              {t(status)}
              <span>{tasks.filter((t) => t.status === status).length}</span>
            </h2>
            {tasks
              .filter((t) => t.status === status)
              .map((task) => (
                <button
                  key={task.id}
                  className="board-card"
                  draggable={admin}
                  onDragStart={(e) =>
                    e.dataTransfer.setData("text/plain", task.id)
                  }
                  onClick={() => setTaskId(task.id)}
                >
                  <small>{projectOf(task.project_id)?.customer_name}</small>
                  <h4>{task.title}</h4>
                  <div>
                    <span className={`priority ${task.priority}`}>
                      {t(task.priority)}
                    </span>
                    <span>{fmt(task.due_date)}</span>
                  </div>
                </button>
              ))}
          </section>
        ))}
      </div>
    );
  if (mode === "calendar") {
    const y = month.getFullYear(),
      m = month.getMonth(),
      first = new Date(y, m, 1),
      offset = (first.getDay() + 6) % 7,
      days = new Date(y, m + 1, 0).getDate();
    return (
      <div className="calendar">
        <div className="calendar-head">
          <h2>
            {month.toLocaleDateString(lang === "de" ? "de-AT" : "en-GB", {
              month: "long",
              year: "numeric",
            })}
          </h2>
          <div>
            <button
              className="icon-button"
              aria-label={lang === "de" ? "Vorheriger Monat" : "Previous month"}
              onClick={() => setMonth(new Date(y, m - 1, 1))}
            >
              <ChevronLeft size={18} />
            </button>
            <button className="secondary" onClick={() => setMonth(new Date())}>
              {t("today")}
            </button>
            <button
              className="icon-button"
              aria-label={lang === "de" ? "Nächster Monat" : "Next month"}
              onClick={() => setMonth(new Date(y, m + 1, 1))}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
        <div className="calendar-grid">
          {(lang === "de"
            ? ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
            : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
          ).map((x) => (
            <div className="weekday" key={x}>
              {x}
            </div>
          ))}
          {Array.from(
            { length: Math.ceil((offset + days) / 7) * 7 },
            (_, i) => {
              const d = i - offset + 1,
                key = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              return (
                <div
                  key={i}
                  className={`calendar-cell ${d < 1 || d > days ? "outside" : ""} ${key === today() ? "today" : ""}`}
                >
                  {d > 0 && d <= days && (
                    <>
                      <span>{d}</span>
                      {tasks
                        .filter((t) => t.due_date === key)
                        .map((t) => (
                          <button
                            onClick={() => setTaskId(t.id)}
                            key={t.id}
                            className={t.status}
                          >
                            {t.title}
                          </button>
                        ))}
                    </>
                  )}
                </div>
              );
            },
          )}
        </div>
        {tasks.some((t) => !t.due_date) && (
          <div className="undated">
            <h4>{lang === "de" ? "Ohne Termin" : "No due date"}</h4>
            {tasks
              .filter((t) => !t.due_date)
              .map((t) => (
                <button
                  className="text-button"
                  key={t.id}
                  onClick={() => setTaskId(t.id)}
                >
                  {t.title}
                </button>
              ))}
          </div>
        )}
      </div>
    );
  }
  if (mode === "timeline") {
    const dated = tasks.filter((t) => t.due_date),
      start = dated.length
        ? Math.min(...dated.map((t) => Date.parse(t.start_date || t.due_date)))
        : Date.now(),
      end = dated.length
        ? Math.max(...dated.map((t) => Date.parse(t.due_date)))
        : start + 86400000,
      range = Math.max(end - start, 86400000);
    return (
      <div className="timeline">
        <div className="timeline-scale">
          <span>{fmt(new Date(start).toISOString().slice(0, 10))}</span>
          <span>{fmt(new Date(end).toISOString().slice(0, 10))}</span>
        </div>
        {tasks.map((task) => (
          <button
            className="timeline-row"
            key={task.id}
            onClick={() => setTaskId(task.id)}
          >
            <span>{task.title}</span>
            <div className="timeline-track">
              {task.due_date ? (
                <i
                  className={task.status}
                  style={{
                    left: `${Math.max(0, ((Date.parse(task.start_date || task.due_date) - start) / range) * 85)}%`,
                    width: `${Math.max(3, ((Date.parse(task.due_date) - Date.parse(task.start_date || task.due_date)) / range) * 85)}%`,
                  }}
                >
                  {fmt(task.due_date)}
                </i>
              ) : (
                <small>—</small>
              )}
            </div>
          </button>
        ))}
      </div>
    );
  }
  return <TaskTable list={tasks} />;
}
