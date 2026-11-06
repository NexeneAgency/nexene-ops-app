"use client";
import { ArrowUpRight, Plus } from "lucide-react";

import { Avatar, Empty } from "../ui/primitives";
import { useWorkspace } from "../workspace-context";
export function CustomersView() {
  const {
    data,
    view,
    project,
    setModal,
    t,
    navigate,
    projects,
    matches,
    task,
  } = useWorkspace();

  return (
    <div className="customer-grid">
      {data.customers
        .filter((c) => matches(c.name))
        .map((c) => (
          <div className="customer-card" key={c.id}>
            {c.logo ? (
              <img className="customer-logo" alt={c.name} src={c.logo} />
            ) : (
              <Avatar name={c.initials} color={c.color} />
            )}
            <h3>{c.name}</h3>
            <p>
              {data.projects.filter((p) => p.customer_id === c.id).length}{" "}
              {t("projects")}
            </p>
            <div>
              {data.projects
                .filter((p) => p.customer_id === c.id)
                .map((p) => (
                  <button
                    key={p.id}
                    className="text-button"
                    onClick={() => navigate("projects", p.id)}
                  >
                    {p.name}
                    <ArrowUpRight size={13} />
                  </button>
                ))}
            </div>
            <button
              className="secondary small"
              onClick={() => setModal({ type: "access", customer_id: c.id })}
            >
              <Plus size={14} />
              {t("newAccess")}
            </button>
          </div>
        ))}
      {!data.customers.length && <Empty>{t("empty")}</Empty>}
    </div>
  );
}
