"use client";

import { Empty } from "../ui/primitives";
import { useWorkspace } from "../workspace-context";
import { ProjectCard } from "./project-card";
export function ProjectsView() {
  const { view, project, t, projects, task } = useWorkspace();

  return (
    <div className="project-grid">
      {projects.map((p) => (
        <ProjectCard key={p.id} p={p} />
      ))}
      {!projects.length && <Empty>{t("noProjects")}</Empty>}
    </div>
  );
}
