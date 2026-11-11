"use client";
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
              t("activeProjects"),
              data.projects.filter((p) => p.phase !== "Betreuung").length,
            ],
            [
              t("openTasks"),
              data.tasks.filter((t) => t.status !== "done").length,
            ],
            [
              t("approvals"),
              data.approvals.filter((a) => a.status === "pending").length,
            ],
            [t("customersCount"), data.customers.length],
          ] as const
        ).map(([label, value]) => (
          <div className="stat" key={label}>
            <div>
              <span>{label}</span>
            </div>
            <strong>{value}</strong>
            <small>
              {lang === "de" ? "In deinem Workspace" : "In your workspace"}
            </small>
          </div>
        ))}
      </div>
      <div className="section-heading">
        <h2>{t("projectOverview")}</h2>
        <button className="secondary" onClick={() => navigate("projects")}>
          {t("viewAll")}
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
        <button className="secondary" onClick={() => navigate("tasks")}>
          {t("viewAll")}
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
        <span>{t("workspace")}</span>
        <span>NEXENE OPS · V1.6</span>
      </div>
    </>
  );
}
