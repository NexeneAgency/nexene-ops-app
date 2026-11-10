"use client";
import { useState } from "react";
import { Plus, ShieldCheck } from "lucide-react";
import type { User } from "../../lib/types";
import { Avatar, Badge } from "../ui/primitives";
import { useWorkspace } from "../workspace-context";
import { UserActions } from "./user-actions";
import { EditUser, DeleteUser } from "./user-dialogs";
export function SettingsView() {
  const { lang, data, setModal, t } = useWorkspace();
  const [editing, setEditing] = useState<User | null>(null),
    [deleting, setDeleting] = useState<User | null>(null);
  const lastLogin = (user: User) => {
    if (user.login_state === "never") return t("neverLoggedIn");
    if (!user.last_login_at) return t("loginNotRecorded");
    const date = new Date(user.last_login_at).toLocaleString(
      lang === "de" ? "de-AT" : "en-GB",
      {
        timeZone: "Europe/Vienna",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      },
    );
    return `${user.login_state === "estimated" ? t("approximately") + " " : ""}${date}`;
  };
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
        <table className="access-table">
          <thead>
            <tr>
              <th>{t("name")}</th>
              <th>{t("email")}</th>
              <th>{t("role")}</th>
              <th>{t("customer")}</th>
              <th>{t("lastLogin")}</th>
              <th className="access-action-cell">
                <span className="visually-hidden">{t("actions")}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((user) => (
              <tr key={user.id}>
                <td>
                  <span className="person">
                    <Avatar name={user.name} />
                    {user.name}
                  </span>
                </td>
                <td>{user.email}</td>
                <td>
                  <Badge>
                    {t(user.role === "admin" ? "admin" : "customerRole")}
                  </Badge>
                </td>
                <td>
                  {data.customers.find((c) => c.id === user.customer_id)
                    ?.name || t("noCustomer")}
                </td>
                <td
                  className="access-last-login"
                  title={
                    user.login_state === "estimated"
                      ? t("estimatedLoginHint")
                      : undefined
                  }
                >
                  {lastLogin(user)}
                </td>
                <td className="access-action-cell">
                  <UserActions
                    user={user}
                    onEdit={setEditing}
                    onDelete={setDeleting}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.users.some(
        (u) => u.login_state === "unknown" || u.login_state === "estimated",
      ) && (
        <p className="form-note login-history-note">{t("loginHistoryNote")}</p>
      )}
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
      {editing && (
        <EditUser
          key={editing.id}
          user={editing}
          onClose={() => setEditing(null)}
        />
      )}
      {deleting && (
        <DeleteUser
          key={deleting.id}
          user={deleting}
          onClose={() => setDeleting(null)}
        />
      )}
    </>
  );
}
