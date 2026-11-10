"use client";
import { LogOut } from "lucide-react";
import { api, errorMessage } from "../../lib/client";
import { useWorkspace } from "../workspace-context";
import { ProjectDetail } from "./project-detail";

export function CustomerPortal() {
  const { data, selected, project, navigate, localeToggle, t, notify } =
    useWorkspace();
  return (
    <div className="customer-portal">
      <header className="portal-header">
        <img className="portal-brand" src="/logo.svg" alt="Nexene" />
        <div className="portal-header-actions">
          {localeToggle}
          <button
            className="secondary small"
            onClick={async () => {
              try {
                await api("auth/logout", "POST", {});
                window.location.assign("/");
              } catch (e) {
                notify(errorMessage(e), "error");
              }
            }}
          >
            <LogOut size={16} />
            {t("logout")}
          </button>
        </div>
      </header>
      <main id="main-content" tabIndex={-1} className="portal-content">
        {data.projects.length > 1 && (
          <label className="portal-project-picker">
            {t("yourProject")}
            <select
              value={project}
              onChange={(e) => navigate("projects", e.target.value)}
            >
              {data.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {selected ? (
          <>
            <div className="portal-project-heading">
              <span className="eyebrow">{selected.customer_name}</span>
              <h1>{selected.name}</h1>
              {selected.description && <p>{selected.description}</p>}
            </div>
            <ProjectDetail />
          </>
        ) : (
          <div className="reports-empty">
            <h1>{t("noPortalProject")}</h1>
            <p>{t("noPortalProjectHelp")}</p>
          </div>
        )}
      </main>
      <footer className="portal-footer">Nexene · {t("portalFooter")}</footer>
    </div>
  );
}
