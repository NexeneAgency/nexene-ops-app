"use client";
import {
  ArrowUpRight,
  CheckSquare,
  FolderKanban,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Empty } from "../ui/primitives";
import { useWorkspace } from "../workspace-context";
import { ProjectCard } from "./project-card";
import { TaskTable } from "./task-table";
export function Dashboard() {
  const { lang, data, view, project, t, navigate, projects, tasks, task } =
    useWorkspace();

  return (
    <>
      <div className="stats">
        {(
          [
            [
              FolderKanban,
              t("activeProjects"),
              data.projects.filter((p) => p.phase !== "Betreuung").length,
              "lavender",
            ],
            [
              CheckSquare,
              t("openTasks"),
              data.tasks.filter((t) => t.status !== "done").length,
              "green",
            ],
            [
              ShieldCheck,
              t("approvals"),
              data.approvals.filter((a) => a.status === "pending").length,
              "peach",
            ],
            [Users, t("customersCount"), data.customers.length, "blue"],
          ] as const
        ).map(([Icon, label, value, color]) => (
          <div className="stat" key={label}>
            <div>
              <span>{label}</span>
              <span className={`stat-icon ${color}`}>
                <Icon size={17} />
              </span>
            </div>
            <strong>{String(value).padStart(2, "0")}</strong>
            <small>
              {lang === "de" ? "In deinem Workspace" : "In your workspace"}
            </small>
          </div>
        ))}
      </div>
      <div className="section-heading">
        <h2>
          {t("projectOverview")}
          <span>{data.projects.length}</span>
        </h2>
        <button className="text-button" onClick={() => navigate("projects")}>
          {t("viewAll")}
          <ArrowUpRight size={15} />
        </button>
      </div>
      <div className="project-grid">
        {data.projects.slice(0, 3).map((p) => (
          <ProjectCard key={p.id} p={p} />
        ))}
        {!data.projects.length && <Empty>{t("noProjects")}</Empty>}
      </div>
      <div className="section-heading">
        <h2>{t("nextTasks")}</h2>
        <button className="text-button" onClick={() => navigate("tasks")}>
          {t("viewAll")}
          <ArrowUpRight size={15} />
        </button>
      </div>
      <TaskTable
        list={[...data.tasks]
          .filter((t) => t.status !== "done")
          .sort((a, b) =>
            (a.due_date || "9999").localeCompare(b.due_date || "9999"),
          )
          .slice(0, 6)}
      />
      <div className="workspace-footer">
        <span className="footer-mark">N</span>
        <span>MAKE SPACE FOR GOOD WORK.</span>
        <span>NEXENE OPS · V1</span>
      </div>
    </>
  );
}
