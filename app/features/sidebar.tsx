"use client";
import { LogOut, Plus, Settings } from "lucide-react";

import { api, errorMessage } from "../../lib/client";
import { Avatar } from "../ui/primitives";
import { useWorkspace } from "../workspace-context";
export function Sidebar() {
  const {
    lang,
    data,
    setData,
    view,
    project,
    setModal,
    setTaskId,
    setDocId,
    setSent,
    dirty,
    setDirty,
    setDraft,
    setDraftRevision,
    setProject,
    setView,
    setQuery,
    t,
    admin,
    notify,
    navigate,
    projects,
    selected,
    tasks,
    navItems,
  } = useWorkspace();

  const pageTitle = selected ? selected.name : t(view);
  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => navigate("overview")}>
        <img src="/logo.svg" alt="Nexene" />
        <span>OPS</span>
      </button>
      <div className="workspace-label">
        <div>
          Nexene Agency<small>{admin ? t("workspace") : t("portal")}</small>
        </div>
      </div>
      <span className="nav-caption">{t("workspace")}</span>
      <nav aria-label={t("workspace")}>
        {navItems.map(([key, Icon]) => (
          <button
            aria-label={t(key)}
            aria-current={view === key ? "page" : undefined}
            className={view === key ? "active" : ""}
            key={key}
            onClick={() => navigate(key)}
          >
            <Icon size={18} />
            <span>{t(key)}</span>
            {key === "tasks" && (
              <small>
                {data.tasks.filter((t) => t.status !== "done").length}
              </small>
            )}
          </button>
        ))}
      </nav>
      <div className="sidebar-projects">
        <span className="nav-caption">
          {t("projects")}
          {admin && (
            <button
              aria-label={t("newProject")}
              onClick={() => setModal({ type: "project" })}
            >
              <Plus size={14} />
            </button>
          )}
        </span>
        {data.projects.slice(0, 5).map((p) => (
          <button
            key={p.id}
            className={project === p.id ? "selected" : ""}
            onClick={() => navigate("projects", p.id)}
          >
            <i style={{ background: p.customer_color }} />
            {p.name}
          </button>
        ))}
      </div>
      <div className="sidebar-bottom">
        {admin && (
          <button
            className={view === "settings" ? "active" : ""}
            onClick={() => navigate("settings")}
          >
            <Settings size={17} />
            {t("settings")}
          </button>
        )}
        <div className="user-card">
          <Avatar name={data.user.name} />
          <div>
            <strong>{data.user.name}</strong>
            <small>{t(admin ? "admin" : "customerRole")}</small>
          </div>
          <button
            aria-label={t("logout")}
            title={t("logout")}
            onClick={async () => {
              try {
                if (
                  dirty &&
                  !window.confirm(
                    lang === "de"
                      ? "Ungespeicherte Änderungen verwerfen und abmelden?"
                      : "Discard unsaved changes and sign out?",
                  )
                )
                  return;
                await api("auth/logout", "POST", {});
                setData(null);
                setSent(false);
                setDocId("");
                setTaskId("");
                setDirty(false);
                setDraft(null);
                setDraftRevision(null);
                setProject("");
                setQuery("");
                setView("overview");
              } catch (e) {
                notify(errorMessage(e), "error");
              }
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
