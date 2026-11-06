"use client";
import { Check, ShieldCheck } from "lucide-react";

import { Badge, Empty } from "../ui/primitives";
import { useWorkspace } from "../workspace-context";

export function ApprovalsView() {
  const { data, project, setModal, t, admin, fmt } = useWorkspace();

  const approvals = data.approvals.filter((a) => a.project_id === project);
  return (
    <div className="approvals-list">
      {approvals.map((a) => (
        <div className="approval-card" key={a.id}>
          <div>
            <ShieldCheck size={20} />
            <Badge
              status={
                a.status === "approved"
                  ? "done"
                  : a.status === "changes"
                    ? "review"
                    : "todo"
              }
            >
              {t(a.status)}
            </Badge>
          </div>
          <h3>{a.title}</h3>
          <p className="reference">{a.reference}</p>
          {a.feedback && <blockquote>{a.feedback}</blockquote>}
          {a.decision_at && (
            <small>
              {a.decision_name} · {fmt(a.decision_at, true)}
            </small>
          )}
          {!admin && a.status === "pending" && (
            <div className="approval-actions">
              <button
                className="primary small"
                onClick={() =>
                  setModal({
                    type: "decision",
                    approval_id: a.id,
                    status: "approved",
                  })
                }
              >
                <Check size={15} />
                {t("approve")}
              </button>
              <button
                className="secondary small"
                onClick={() =>
                  setModal({
                    type: "decision",
                    approval_id: a.id,
                    status: "changes",
                  })
                }
              >
                {t("requestChanges")}
              </button>
            </div>
          )}
        </div>
      ))}
      {!approvals.length && <Empty>{t("empty")}</Empty>}
      <small className="muted">{t("versionNote")}</small>
    </div>
  );
}
