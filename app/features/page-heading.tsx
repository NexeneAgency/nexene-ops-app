"use client";
import { ArrowLeft, Plus } from "lucide-react";

import { useWorkspace } from "../workspace-context";
export function PageHeading() {
  const {
    data,
    view,
    project,
    setModal,
    t,
    admin,
    navigate,
    projects,
    selected,
    tasks,
    task,
  } = useWorkspace();

  const pageTitle = selected ? selected.name : t(view);
  return (
    <div className="page-heading">
      <div>
        {selected && (
          <button className="back-button" onClick={() => navigate("projects")}>
            <ArrowLeft size={14} />
            {t("projects")}
          </button>
        )}
        <span className="eyebrow">
          {selected ? selected.customer_name : t("greeting")}
        </span>
        <h1>
          {(view === "overview" ? t("hello") : pageTitle).replace(/\.$/, "")}
          <span className="heading-dot">.</span>
        </h1>
        {view === "overview" && <p>{t("intro")}</p>}
        {selected && <p>{selected.description}</p>}
      </div>
      {admin && (
        <button
          className="primary"
          onClick={() =>
            setModal({
              type:
                view === "customers"
                  ? "customer"
                  : view === "documents"
                    ? "document"
                    : view === "tasks"
                      ? "task"
                      : "project",
              project_id: project || data.projects[0]?.id,
            })
          }
        >
          <Plus size={17} />
          {t(
            view === "customers"
              ? "newCustomer"
              : view === "documents"
                ? "newDoc"
                : view === "tasks"
                  ? "newTask"
                  : "newProject",
          )}
        </button>
      )}
    </div>
  );
}
