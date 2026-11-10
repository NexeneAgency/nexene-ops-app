"use client";
import { ArrowUpRight, CalendarDays, CheckSquare } from "lucide-react";

import type { Project } from "../../lib/types";
import { Avatar, Badge } from "../ui/primitives";
import { useWorkspace } from "../workspace-context";

export function ProjectCard({ p }: { p: Project }) {
  const {
    lang,
    data,
    project,
    setTab,
    t,
    navigate,
    fmt,
    projects,
    tasks,
    projectProgress,
  } = useWorkspace();

  const progress = projectProgress(p.id),
    count = data.tasks.filter(
      (t) => t.project_id === p.id && t.status !== "done",
    ).length;
  return (
    <button
      className="project-card"
      key={p.id}
      onClick={() => {
        navigate("projects", p.id);
        setTab("tasks");
      }}
    >
      <div className="project-card-top">
        <Avatar name={p.initials} color={p.customer_color} />
        <ArrowUpRight size={18} />
      </div>
      <span className="customer-label">{p.customer_name}</span>
      <h3>{p.name}</h3>
      <Badge status="progress">
        {p.project_type === "seo_geo" ? "SEO + GEO" : t(`phase:${p.phase}`)}
      </Badge>
      {p.project_type !== "seo_geo" ? (
        <>
          <div className="progress-label">
            <span>{lang === "de" ? "Fortschritt" : "Progress"}</span>
            <strong>{progress}%</strong>
          </div>
          <div className="progress-bar">
            <span style={{ width: `${progress}%` }} />
          </div>
        </>
      ) : (
        <p className="project-report-count">
          {data.reports.filter((r) => r.project_id === p.id).length}{" "}
          {t("reports")}
        </p>
      )}
      <div className="card-bottom">
        <span>
          <CheckSquare size={13} />
          {count} {t("openTasks").toLowerCase()}
        </span>
        <span>
          <CalendarDays size={13} />
          {p.project_type === "seo_geo" ? t("ongoing") : fmt(p.due_date)}
        </span>
      </div>
    </button>
  );
}
