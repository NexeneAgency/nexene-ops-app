"use client";
import { Check, Search, X } from "lucide-react";
import { CustomerPortal } from "./features/customer-portal";
import { CustomersView } from "./features/customers-view";
import { Dashboard } from "./features/dashboard";
import { DocumentsView } from "./features/documents-view";
import { FormModal } from "./features/form-modal";
import { PageHeading } from "./features/page-heading";
import { ProjectDetail } from "./features/project-detail";
import { ProjectsView } from "./features/projects-view";
import { SettingsView } from "./features/settings-view";
import { Sidebar } from "./features/sidebar";
import { TaskDrawer } from "./features/task-drawer";
import { TasksPage } from "./features/tasks-page";
import { Topbar } from "./features/topbar";
import { Login } from "./login";
import { useWorkspaceController } from "./use-workspace";
import { WorkspaceContext, useWorkspace } from "./workspace-context";
export default function Workspace() {
  const controller = useWorkspaceController();
  if (!controller.data || controller.loading || controller.fatal)
    return <Login controller={controller} />;
  return (
    <WorkspaceContext.Provider value={{ ...controller, data: controller.data }}>
      <WorkspaceContent />
    </WorkspaceContext.Provider>
  );
}
function WorkspaceContent() {
  const {
    lang,
    data,
    loading,
    fatal,
    view,
    setView,
    project,
    setProject,
    navigate,
    query,
    setQuery,
    modal,
    setModal,
    setDocId,
    toast,
    setToast,
    toastTone,
    busy,
    setDraft,
    dirty,
    setDirty,
    t,
    admin,
    notify,
    mutate,
    projects,
    selected,
    tasks,
    task,
  } = useWorkspace();

  const pageTitle = selected ? selected.name : t(view);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {lang === "de" ? "Zum Inhalt springen" : "Skip to content"}
      </a>
      {admin ? (
        <>
          <Sidebar />
          <div className="main-shell">
            <Topbar />
            <main id="main-content" tabIndex={-1}>
              <PageHeading />
              {view !== "overview" && view !== "settings" && (
                <div className="search-row">
                  <span className="search-caption">{t("search")}</span>
                  <label className="search">
                    <Search size={16} />
                    <input
                      aria-label={t("search")}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={t("search")}
                    />
                    {query && (
                      <button
                        aria-label={
                          lang === "de" ? "Suche löschen" : "Clear search"
                        }
                        onClick={() => setQuery("")}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </label>
                  {["tasks", "documents"].includes(view) && (
                    <select
                      aria-label={t("project")}
                      value={project}
                      onChange={(e) => navigate(view, e.target.value)}
                    >
                      <option value="">{t("all")}</option>
                      {data.projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              {view === "overview" && <Dashboard />}
              {view === "projects" && !selected && <ProjectsView />}
              {view === "projects" && selected && <ProjectDetail />}
              {view === "tasks" && <TasksPage />}
              {view === "documents" && <DocumentsView />}
              {view === "customers" && admin && <CustomersView />}
              {view === "settings" && admin && <SettingsView />}
            </main>
          </div>
        </>
      ) : (
        <CustomerPortal />
      )}
      {toast && (
        <div
          className={`toast ${toastTone === "error" ? "error" : ""}`}
          role={toastTone === "error" ? "alert" : "status"}
        >
          {toastTone === "error" ? <X size={16} /> : <Check size={16} />}
          {toast}
          <button
            className="icon-button"
            aria-label={
              lang === "de" ? "Meldung schließen" : "Dismiss notification"
            }
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {modal && (
        <FormModal
          key={`${modal.type}-${modal.project_id || ""}`}
          modal={modal}
          data={data}
          t={t}
          lang={lang}
          busy={busy}
          onClose={() => setModal(null)}
          onSubmit={async (path, body) => {
            if (
              modal.type === "document" &&
              dirty &&
              !window.confirm(
                lang === "de"
                  ? "Ungespeicherte Änderungen verwerfen?"
                  : "Discard unsaved changes?",
              )
            )
              return;
            const result = await mutate(path, "POST", body);
            setModal(null);
            if (modal.type === "document") {
              setDocId(result.id || "");
              setView("documents");
              setDirty(false);
              setDraft(null);
            }
            notify(t("saved"));
          }}
          onDecision={async (body) => {
            await mutate(`approvals/${modal.approval_id}`, "PATCH", body);
            setModal(null);
          }}
        />
      )}
      {task && <TaskDrawer />}
    </div>
  );
}
