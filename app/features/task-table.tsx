"use client";
import { Check, Globe } from "lucide-react";

import { today } from "../../lib/client";
import type { Task } from "../../lib/types";
import { Avatar, Badge, Empty } from "../ui/primitives";
import { useWorkspace } from "../workspace-context";

export function TaskTable({ list }: { list: Task[] }) {
  const {
    data,
    project,
    setTaskId,
    t,
    admin,
    mutate,
    fmt,
    tasks,
    task,
    projectOf,
  } = useWorkspace();

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>{t("name")}</th>
            {!project && <th>{t("project")}</th>}
            <th>{t("status")}</th>
            {admin && <th>{t("assignee")}</th>}
            <th>{t("due")}</th>
            <th>{t("priority")}</th>
          </tr>
        </thead>
        <tbody>
          {list.map((task) => (
            <tr key={task.id} onClick={() => setTaskId(task.id)}>
              <td>
                <div className="task-title">
                  <button
                    aria-label={`${t(task.status === "done" ? "todo" : "done")}: ${task.title}`}
                    aria-pressed={task.status === "done"}
                    className={`task-check ${task.status === "done" ? "checked" : ""}`}
                    disabled={!admin}
                    onClick={(e) => {
                      e.stopPropagation();
                      mutate(`tasks/${task.id}`, "PATCH", {
                        status: task.status === "done" ? "todo" : "done",
                      }).catch(() => {});
                    }}
                  >
                    {task.status === "done" && <Check size={12} />}
                  </button>
                  <button
                    className={`task-open ${task.status === "done" ? "struck" : ""}`}
                    onClick={() => setTaskId(task.id)}
                  >
                    {task.parent_id && "↳ "}
                    {task.title}
                  </button>
                  {!!task.visible && <Globe size={12} className="muted" />}
                </div>
              </td>
              {!project && (
                <td className="muted">{projectOf(task.project_id)?.name}</td>
              )}
              <td>
                <Badge status={task.status}>{t(task.status)}</Badge>
              </td>
              {admin && (
                <td>
                  {task.assignee_id ? (
                    <span className="person">
                      <Avatar
                        size="tiny"
                        name={
                          data.users.find((u) => u.id === task.assignee_id)
                            ?.name
                        }
                      />
                      {data.users.find((u) => u.id === task.assignee_id)?.name}
                    </span>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
              )}
              <td
                className={
                  task.due_date &&
                  task.due_date < today() &&
                  task.status !== "done"
                    ? "overdue"
                    : "muted"
                }
              >
                {fmt(task.due_date)}
              </td>
              <td>
                <span className={`priority ${task.priority}`}>
                  {t(task.priority)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!list.length && <Empty>{t("noTasks")}</Empty>}
    </div>
  );
}
