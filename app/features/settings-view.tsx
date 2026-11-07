"use client";
import { Plus, ShieldCheck } from "lucide-react";

import { Avatar, Badge } from "../ui/primitives";
import { useWorkspace } from "../workspace-context";
export function SettingsView() {
  const {
    lang,
    data,
    view,
    project,
    setModal,
    email,
    t,
    admin,
    notify,
    mutate,
    projects,
    task,
  } = useWorkspace();

  return (
    <>
      <div className="section-heading">
        <h2>{t("team")}</h2>
        <button
          className="secondary"
          onClick={() => setModal({ type: "access" })}
        >
          <Plus size={15} />
          {t("newAccess")}
        </button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t("name")}</th>
              <th>{t("email")}</th>
              <th>{t("role")}</th>
              <th>{t("customer")}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {data.users.map((u) => (
              <tr key={u.id}>
                <td>
                  <span className="person">
                    <Avatar name={u.name} size="small" />
                    {u.name}
                  </span>
                </td>
                <td>{u.email}</td>
                <td>
                  <Badge>
                    {t(u.role === "admin" ? "admin" : "customerRole")}
                  </Badge>
                </td>
                <td>
                  {data.customers.find((c) => c.id === u.customer_id)?.name ||
                    t("noCustomer")}
                </td>
                <td>
                  {u.role === "customer" && u.customer_id && (
                    <button
                      className="text-button danger"
                      onClick={async () => {
                        if (window.confirm(t("revoke") + "?"))
                          try {
                            await mutate(`users/${u.id}`, "DELETE");
                            notify(t("revoked"));
                          } catch {}
                      }}
                    >
                      {t("revoke")}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="info-box">
        <ShieldCheck size={19} />
        <div>
          <strong>{t("security")}</strong>
          <p>
            {lang === "de"
              ? "Anmeldelinks sind 15 Minuten gültig und einmalig verwendbar. Alle Admins sehen alle Projekte. Kunden sehen nur die Inhalte ihres Kundenbereichs."
              : "Sign-in links expire after 15 minutes and can be used once. Admins see all projects. Customers only see their own portal content."}
          </p>
        </div>
      </div>
    </>
  );
}
