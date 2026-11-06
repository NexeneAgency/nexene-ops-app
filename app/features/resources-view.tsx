"use client";
import { ArrowUpRight, Link2 } from "lucide-react";

import { Badge, Empty } from "../ui/primitives";
import { useWorkspace } from "../workspace-context";

export function ResourcesView() {
  const { data, project, t } = useWorkspace();

  return (
    <div className="resource-list">
      {data.resources
        .filter((r) => r.project_id === project)
        .map((r) => (
          <a key={r.id} href={r.url} target="_blank" rel="noopener noreferrer">
            <span className="resource-icon">
              <Link2 size={19} />
            </span>
            <span>
              <strong>{r.title}</strong>
              <small>{r.url}</small>
            </span>
            <Badge>{t(r.visible ? "shared" : "internal")}</Badge>
            <ArrowUpRight size={18} />
          </a>
        ))}
      {!data.resources.some((r) => r.project_id === project) && (
        <Empty>{t("empty")}</Empty>
      )}
    </div>
  );
}
