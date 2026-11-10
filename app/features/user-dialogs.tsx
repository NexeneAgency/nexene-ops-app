"use client";
import { useState } from "react";
import { LoaderCircle, Trash2, X } from "lucide-react";
import { ApiError, errorMessage } from "../../lib/client";
import type { User } from "../../lib/types";
import { Dialog } from "../ui/dialog";
import { useWorkspace } from "../workspace-context";
export function EditUser({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const { data, t, mutate, load } = useWorkspace();
  const [name, setName] = useState(user.name),
    [email, setEmail] = useState(user.email),
    [role, setRole] = useState(user.role),
    [customer, setCustomer] = useState(user.customer_id || ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [conflict, setConflict] = useState(false);
  return (
    <Dialog
      className="modal"
      labelledBy="edit-user-title"
      busy={busy}
      onClose={onClose}
    >
      <div className="modal-heading">
        <h2 id="edit-user-title">{t("editAccess")}</h2>
        <button
          className="icon-button"
          aria-label={t("cancel")}
          onClick={onClose}
          disabled={busy}
        >
          <X size={20} />
        </button>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await mutate(`users/${user.id}`, "PATCH", {
              name,
              email,
              role,
              customer_id: customer,
              expected_revision: user.revision,
            });
            onClose();
          } catch (e) {
            setError(errorMessage(e));
            if (e instanceof ApiError && e.status === 409) setConflict(true);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          {t("name")}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={250}
            disabled={busy}
          />
        </label>
        <label>
          {t("email")}
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={254}
            disabled={busy}
          />
        </label>
        <label>
          {t("role")}
          <select
            aria-label={t("role")}
            value={role}
            onChange={(e) => setRole(e.target.value as User["role"])}
            disabled={busy || user.id === data.user.id}
          >
            <option value="admin">{t("admin")}</option>
            <option value="customer">{t("customerRole")}</option>
          </select>
        </label>
        {role === "customer" && (
          <label>
            {t("customer")}
            <select
              aria-label={t("customer")}
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              required
              disabled={busy}
            >
              <option value="">{t("selectCustomer")}</option>
              {data.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <p className="form-note">{t("accessEditNotice")}</p>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        {conflict && (
          <button
            className="secondary"
            type="button"
            onClick={async () => {
              await load();
              onClose();
            }}
          >
            {t("reloadAccess")}
          </button>
        )}
        <div className="modal-footer">
          <button
            type="button"
            className="secondary"
            onClick={onClose}
            disabled={busy}
          >
            {t("cancel")}
          </button>
          <button className="primary" disabled={busy}>
            {busy ? <LoaderCircle className="spin" size={16} /> : null}
            {t("save")}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
export function DeleteUser({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const { t, mutate } = useWorkspace();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Dialog
      className="modal"
      labelledBy="delete-user-title"
      busy={busy}
      onClose={onClose}
    >
      <div className="modal-heading">
        <h2 id="delete-user-title">{t("deleteAccess")}</h2>
        <button
          className="icon-button"
          aria-label={t("cancel")}
          onClick={onClose}
          disabled={busy}
        >
          <X size={20} />
        </button>
      </div>
      <p>
        <strong>{user.name}</strong>
        <br />
        {user.email}
      </p>
      <p className="delete-user-notice">{t("deleteAccessNotice")}</p>
      {error && (
        <div className="error" role="alert">
          {error}
        </div>
      )}
      <div className="modal-footer">
        <button className="secondary" disabled={busy} onClick={onClose}>
          {t("cancel")}
        </button>
        <button
          className="primary destructive"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError("");
            try {
              await mutate(`users/${user.id}`, "DELETE");
              onClose();
            } catch (e) {
              setError(errorMessage(e));
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? (
            <LoaderCircle className="spin" size={16} />
          ) : (
            <Trash2 size={16} />
          )}{" "}
          {t("deleteAccess")}
        </button>
      </div>
    </Dialog>
  );
}
