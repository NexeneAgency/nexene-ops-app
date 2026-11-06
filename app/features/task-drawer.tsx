"use client";
import { ArrowUpRight, Circle, Link2, Plus, X } from "lucide-react";
import { Dialog } from "../ui/dialog";

import { statuses } from "../../lib/client";
import { Avatar, Badge } from "../ui/primitives";
import { useWorkspace } from "../workspace-context";
export function TaskDrawer() {
  const {
    data,
    view,
    project,
    setModal,
    setTaskId,
    busy,
    t,
    admin,
    mutate,
    fmt,
    tasks,
    task,
    projectOf,
  } = useWorkspace();

  if (!task) return null;
  return (
    <Dialog
      className="task-drawer"
      labelledBy="task-title"
      onClose={() => setTaskId("")}
    >
      <div className="drawer-heading">
        <small>{projectOf(task.project_id)?.name}</small>
        <button
          aria-label={t("cancel")}
          className="icon-button"
          onClick={() => setTaskId("")}
        >
          <X size={20} />
        </button>
      </div>
      <h2 id="task-title">{task.title}</h2>
      {task.description && <p>{task.description}</p>}
      <div className="task-properties">
        <label>
          {t("status")}
          {admin ? (
            <select
              value={task.status}
              onChange={(e) =>
                mutate(`tasks/${task.id}`, "PATCH", {
                  status: e.target.value,
                }).catch(() => {})
              }
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {t(s)}
                </option>
              ))}
            </select>
          ) : (
            <Badge status={task.status}>{t(task.status)}</Badge>
          )}
        </label>
        {admin && (
          <label>
            {t("assignee")}
            <select
              value={task.assignee_id || ""}
              onChange={(e) =>
                mutate(`tasks/${task.id}`, "PATCH", {
                  assignee_id: e.target.value,
                }).catch(() => {})
              }
            >
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
        )}
        <label>
          {t("due")}
          {admin ? (
            <input
              type="date"
              value={task.due_date}
              onChange={(e) =>
                mutate(`tasks/${task.id}`, "PATCH", {
                  due_date: e.target.value,
                }).catch(() => {})
              }
            />
          ) : (
            fmt(task.due_date)
          )}
        </label>
        {admin && (
          <label className="inline-check">
            <input
              type="checkbox"
              checked={!!task.visible}
              onChange={(e) =>
                mutate(`tasks/${task.id}`, "PATCH", {
                  visible: e.target.checked,
                }).catch(() => {})
              }
            />
            {t("visible")}
          </label>
        )}
        {task.recurrence && (
          <label>
            {t("recurrence")}
            <span>{t(task.recurrence)}</span>
          </label>
        )}
      </div>
      <div className="section-heading">
        <h3>{t("subtasks")}</h3>
        {admin && (
          <button
            className="text-button"
            onClick={() =>
              setModal({
                type: "task",
                parent_id: task.id,
                project_id: task.project_id,
              })
            }
          >
            <Plus size={14} />
            {t("newSubtask")}
          </button>
        )}
      </div>
      {data.tasks
        .filter((x) => x.parent_id === task.id)
        .map((x) => (
          <button
            className="subtask"
            key={x.id}
            onClick={() => setTaskId(x.id)}
          >
            <Circle size={14} />
            {x.title}
            <Badge status={x.status}>{t(x.status)}</Badge>
          </button>
        ))}
      <div className="section-heading">
        <h3>{t("resources")}</h3>
        {admin && (
          <button
            className="text-button"
            onClick={() =>
              setModal({
                type: "resource",
                project_id: task.project_id,
                task_id: task.id,
              })
            }
          >
            <Plus size={14} />
            {t("newLink")}
          </button>
        )}
      </div>
      <div className="task-links">
        {data.attachments
          .filter((a) => a.task_id === task.id)
          .map((a) => (
            <a
              key={a.id}
              href={a.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Link2 size={14} />
              {a.title}
              <ArrowUpRight size={13} />
            </a>
          ))}
      </div>
      <h3 className="comments-title">{t("comments")}</h3>
      {data.comments
        .filter((c) => c.task_id === task.id)
        .map((c) => (
          <div className="comment" key={c.id}>
            <Avatar name={c.author} size="small" />
            <div>
              <strong>{c.author}</strong>
              <small>
                {fmt(c.created_at)} · {t(c.visible ? "shared" : "internal")}
              </small>
              <p>{c.body}</p>
            </div>
          </div>
        ))}
      <form
        className="comment-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget,
            body = new FormData(form);
          try {
            await mutate("comments", "POST", {
              task_id: task.id,
              body: body.get("body"),
              visible: body.get("visible") === "on",
            });
            form.reset();
          } catch {}
        }}
      >
        <textarea
          aria-label={t("comment")}
          name="body"
          placeholder={t("comment")}
          required
          maxLength={10000}
        />
        <div>
          {admin && (
            <label className="inline-check">
              <input name="visible" type="checkbox" />
              {t("visible")}
            </label>
          )}
          <button className="primary small" disabled={busy}>
            {t("send")}
            <ArrowUpRight size={14} />
          </button>
        </div>
      </form>
    </Dialog>
  );
}
