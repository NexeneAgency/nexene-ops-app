"use client";
import { LoaderCircle, X } from "lucide-react";
import type { HTMLInputTypeAttribute } from "react";
import { useState } from "react";
import { Dialog } from "../ui/dialog";

import { errorMessage, today } from "../../lib/client";
import type {
  Locale,
  ModalConfig,
  MutationBody,
  Translator,
  WorkspaceState,
} from "../../lib/types";
export function FormModal({
  modal: m,
  data,
  t,
  lang,
  busy,
  onClose,
  onSubmit,
  onDecision,
}: {
  modal: ModalConfig;
  data: WorkspaceState;
  t: Translator;
  lang: Locale;
  busy: boolean;
  onClose: () => void;
  onSubmit: (path: string, body: MutationBody) => Promise<void>;
  onDecision: (body: MutationBody) => Promise<void>;
}) {
  const [error, setError] = useState(""),
    [role, setRole] = useState("customer"),
    [project, setProject] = useState(
      m.project_id || data.projects[0]?.id || "",
    ),
    [template, setTemplate] = useState("");
  const type = m.type;
  const titles = {
    project: "newProject",
    customer: "newCustomer",
    task: m.parent_id ? "newSubtask" : "newTask",
    document: "newDoc",
    access: "newAccess",
    resource: "newLink",
    time: "logTime",
    approval: "requestApproval",
    decision: m.status === "approved" ? "approve" : "requestChanges",
  };
  const field = (
    name: string,
    label: string,
    kind: HTMLInputTypeAttribute = "text",
    required = false,
    value?: string | number,
  ) => (
    <label>
      {t(label)}
      <input
        name={name}
        type={kind}
        required={required}
        defaultValue={value}
        {...(kind === "number"
          ? { min: 0, step: name === "minutes" ? 1 : 0.01 }
          : {})}
      />
    </label>
  );
  const projectSelect = (
    <label>
      {t("project")}
      <select
        name="project_id"
        value={project}
        onChange={(e) => setProject(e.target.value)}
        required
      >
        <option value="">—</option>
        {data.projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
  const visible = (
    <label className="inline-check">
      <input type="checkbox" name="visible" />
      {t("visible")}
    </label>
  );
  return (
    <Dialog
      className="modal"
      labelledBy="modal-title"
      onClose={onClose}
      busy={busy}
    >
      <div className="modal-heading">
        <h2 id="modal-title">{t(titles[type])}</h2>
        <button
          aria-label={t("cancel")}
          className="icon-button"
          onClick={onClose}
          disabled={busy}
        >
          <X size={20} />
        </button>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          const f = new FormData(e.currentTarget),
            body: MutationBody = Object.fromEntries(f.entries());
          body.visible = f.get("visible") === "on";
          try {
            if (type === "decision") {
              await onDecision({ status: m.status, feedback: body.feedback });
              return;
            }
            let path = {
              project: "projects",
              customer: "customers",
              task: "tasks",
              document: "documents",
              access: "users",
              resource: "resources",
              time: "time",
              approval: "approvals",
            }[type];
            if (m.parent_id && type === "task") body.parent_id = m.parent_id;
            if (m.task_id) {
              body.task_id = m.task_id;
              path = "attachments";
            }
            if (type === "project") body.template = true;
            if (type === "document") {
              body.is_template = f.get("is_template") === "on";
              if (template)
                body.content = data.documents.find(
                  (d) => d.id === template,
                )?.content;
            }
            await onSubmit(path, body);
          } catch (e) {
            setError(errorMessage(e));
          }
        }}
      >
        {type === "customer" && (
          <>
            {field("name", "name", "text", true)}
            {field("logo", "logo", "url")}
          </>
        )}
        {type === "project" && (
          <>
            <label>
              {t("customer")}
              <select
                name="customer_id"
                required
                defaultValue={data.customers[0]?.id || ""}
              >
                <option value="">—</option>
                {data.customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            {!data.customers.length && (
              <p className="form-note">
                {lang === "de"
                  ? "Lege zuerst unter Kunden einen Kunden an."
                  : "Create a customer first."}
              </p>
            )}
            {field("name", "name", "text", true)}
            <label>
              {t("description")}
              <textarea name="description" />
            </label>
            <div className="form-grid">
              {field("start_date", "start", "date", true, today())}
              {field("due_date", "end", "date", true)}
            </div>
            <label>
              {t("pricing")}
              <select name="pricing">
                <option value="fixed">{t("fixed")}</option>
                <option value="hourly">{t("hourly")}</option>
              </select>
            </label>
            <div className="form-grid">
              {field("budget", "budget", "number", false, 0)}
              {field("hours_budget", "hours", "number", false, 0)}
            </div>
          </>
        )}
        {type === "task" && (
          <>
            {projectSelect}
            {field("title", "title", "text", true)}
            <label>
              {t("description")}
              <textarea name="description" />
            </label>
            <div className="form-grid">
              <label>
                {t("assignee")}
                <select name="assignee_id">
                  <option value="">{t("none")}</option>
                  {data.users
                    .filter((u) => u.role === "admin")
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                {t("priority")}
                <select name="priority" defaultValue="medium">
                  {["low", "medium", "high"].map((p) => (
                    <option key={p} value={p}>
                      {t(p)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="form-grid">
              {field("start_date", "start", "date")}
              {field("due_date", "due", "date")}
            </div>
            <label>
              {t("recurrence")}
              <select name="recurrence">
                <option value="">{t("never")}</option>
                <option value="weekly">{t("weekly")}</option>
                <option value="monthly">{t("monthly")}</option>
              </select>
            </label>
            {visible}
          </>
        )}
        {type === "document" && (
          <>
            {projectSelect}
            {field("title", "title", "text", true)}
            <label>
              {t("parent")}
              <select name="parent_id" defaultValue={m.parent_id || ""}>
                <option value="">—</option>
                {data.documents
                  .filter((d) => d.project_id === project)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              {t("fromTemplate")}
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
              >
                <option value="">{t("blank")}</option>
                {data.documents
                  .filter((d) => d.is_template)
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
              </select>
            </label>
            {visible}
            <label className="inline-check">
              <input type="checkbox" name="is_template" />
              {t("template")}
            </label>
          </>
        )}
        {type === "access" && (
          <>
            {field("name", "name", "text", true)}
            {field("email", "email", "email", true)}
            <label>
              {t("role")}
              <select
                name="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="customer">{t("customerRole")}</option>
                <option value="admin">{t("admin")}</option>
              </select>
            </label>
            {role === "customer" && (
              <label>
                {t("customer")}
                <select
                  name="customer_id"
                  required
                  defaultValue={m.customer_id || ""}
                >
                  <option value="">—</option>
                  {data.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <p className="form-note">{t("security")}</p>
          </>
        )}
        {type === "resource" && (
          <>
            {projectSelect}
            {field("title", "title", "text", true)}
            {field("url", "URL", "url", true)}
            {visible}
          </>
        )}
        {type === "time" && (
          <>
            {projectSelect}
            <div className="form-grid">
              {field("date", "date", "date", true, today())}
              {field("minutes", "minutes", "number", true, 60)}
            </div>
            {field("note", "note")}
          </>
        )}
        {type === "approval" && (
          <>
            {projectSelect}
            {field("title", "title", "text", true)}
            {field("reference", "reference", "text", true)}
            <p className="form-note">{t("versionNote")}</p>
          </>
        )}
        {type === "decision" && (
          <label>
            {t("feedback")}
            <textarea name="feedback" required={m.status === "changes"} />
          </label>
        )}
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        <div className="modal-footer">
          <button
            className="secondary"
            type="button"
            onClick={onClose}
            disabled={busy}
          >
            {t("cancel")}
          </button>
          <button
            className="primary"
            aria-label={t(type === "decision" ? titles[type] : "create")}
            disabled={busy}
          >
            {busy ? (
              <LoaderCircle className="spin" size={17} />
            ) : (
              t(type === "decision" ? titles[type] : "create")
            )}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
