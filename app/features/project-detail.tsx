"use client";
import {
  CalendarDays,
  ChartNoAxesGantt,
  Columns3,
  List,
  Plus,
} from "lucide-react";

import { Avatar, Badge } from "../ui/primitives";
import { useWorkspace } from "../workspace-context";
import { ApprovalsView } from "./approvals-view";
import { DocumentsView } from "./documents-view";
import { ResourcesView } from "./resources-view";
import { TaskViews } from "./task-views";
import { TimeView } from "./time-view";
export function ProjectDetail() {
  const {
    lang,
    data,
    view,
    project,
    tab,
    setTab,
    mode,
    setMode,
    setModal,
    dirty,
    setDirty,
    t,
    admin,
    mutate,
    fmt,
    projects,
    selected,
    tasks,
    task,
  } = useWorkspace();

  if (!selected) return null;
  return (
    <>
      <div className="project-meta">
        {selected.logo ? (
          <img
            className="project-customer-logo"
            src={selected.logo}
            alt={selected.customer_name}
          />
        ) : (
          <Avatar name={selected.initials} color={selected.customer_color} />
        )}
        <span>{selected.customer_name}</span>
        <Badge status="progress">{selected.phase}</Badge>
        <span>
          <CalendarDays size={14} />
          {fmt(selected.start_date)} — {fmt(selected.due_date)}
        </span>
        {admin && (
          <select
            aria-label={t("phase")}
            value={selected.phase}
            onChange={(e) =>
              mutate(`projects/${project}`, "PATCH", {
                phase: e.target.value,
              }).catch(() => {})
            }
          >
            {data.phases.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        )}
      </div>
      <div className="project-tabs">
        {[
          "tasks",
          "documents",
          "approvals",
          "resources",
          ...(admin ? ["time"] : []),
        ].map((v) => (
          <button
            key={v}
            aria-pressed={tab === v}
            className={tab === v ? "active" : ""}
            onClick={() => {
              if (
                dirty &&
                !window.confirm(
                  lang === "de" ? "Änderungen verwerfen?" : "Discard changes?",
                )
              )
                return;
              setDirty(false);
              setTab(v as import("../../lib/types").ProjectTab);
            }}
          >
            {t(v)}
          </button>
        ))}
      </div>
      <div className="view-toolbar">
        {tab === "tasks" ? (
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
        ) : (
          <span />
        )}
        {admin && (
          <button
            className="secondary small"
            onClick={() =>
              setModal({
                type: {
                  tasks: "task",
                  documents: "document",
                  approvals: "approval",
                  resources: "resource",
                  time: "time",
                }[tab] as import("../../lib/types").ModalType,
                project_id: project,
              })
            }
          >
            <Plus size={15} />
            {t(
              {
                tasks: "newTask",
                documents: "newDoc",
                approvals: "requestApproval",
                resources: "newLink",
                time: "logTime",
              }[tab] as import("../../lib/types").ModalType,
            )}
          </button>
        )}
      </div>
      {tab === "tasks" && <TaskViews />}
      {tab === "documents" && <DocumentsView />}
      {tab === "approvals" && <ApprovalsView />}
      {tab === "resources" && <ResourcesView />}
      {tab === "time" && admin && <TimeView />}
    </>
  );
}
