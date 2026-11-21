"use client";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { api, errorMessage } from "../../lib/client";
import type { Lead, LeadStatus, MutationBody } from "../../lib/types";
import { Dialog } from "../ui/dialog";
import { useWorkspace } from "../workspace-context";

const statuses: LeadStatus[] = [
  "neu",
  "kontaktiert",
  "geantwortet",
  "gewonnen",
  "verloren",
];
const statusLabels = {
  de: ["Neu", "Kontaktiert", "Geantwortet", "Gewonnen", "Verloren"],
  en: ["New", "Contacted", "Replied", "Won", "Lost"],
};
const fields = [
  ["company_name", "Firmenname", "Company name", "text", 500],
  ["website", "Website", "Website", "url", 2000],
  [
    "match_reason",
    "Warum passt der Lead?",
    "Why is this a fit?",
    "textarea",
    10000,
  ],
  ["contact_name", "Kontaktname", "Contact name", "text", 500],
  ["contact_role", "Position", "Role", "text", 500],
  ["contact_email", "E-Mail", "Email", "email", 254],
  ["contact_phone", "Telefon", "Phone", "tel", 100],
  ["source", "Quelle", "Source", "textarea", 10000],
  ["outreach_email_draft", "E-Mail-Entwurf", "Email draft", "textarea", 20000],
] as const;

export function LeadsView() {
  const { lang, query } = useWorkspace();
  const label = (de: string, en: string) => (lang === "de" ? de : en);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [editor, setEditor] = useState<Lead | "new" | null>(null);
  const [deleting, setDeleting] = useState<Lead | null>(null);
  const [formError, setFormError] = useState("");
  useEffect(() => {
    let active = true;
    api<Lead[]>("leads")
      .then((rows) => {
        if (active) {
          setLeads(rows);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(errorMessage(e));
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  const replace = (lead: Lead) =>
    setLeads((rows) =>
      rows.some((row) => row.id === lead.id)
        ? rows.map((row) => (row.id === lead.id ? lead : row))
        : [lead, ...rows],
    );
  const options = statuses.map((value, i) => (
    <option key={value} value={value}>
      {statusLabels[lang][i]}
    </option>
  ));
  const filtered = leads.filter(
    (lead) =>
      (!status || lead.status === status) &&
      (!query ||
        `${lead.company_name} ${lead.website} ${lead.contact_name} ${lead.contact_email} ${lead.match_reason}`
          .toLowerCase()
          .includes(query.toLowerCase())),
  );
  return (
    <section aria-label="Leads">
      <div className="leads-toolbar">
        <label>
          {label("Status", "Status")}{" "}
          <select
            aria-label={label("Lead-Status filtern", "Filter lead status")}
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">{label("Alle", "All")}</option>
            {options}
          </select>
        </label>
        <button
          className="primary"
          onClick={() => {
            setFormError("");
            setEditor("new");
          }}
        >
          {label("Neuer Lead", "New lead")}
        </button>
      </div>
      {error && (
        <p role="alert">
          {error}{" "}
          <button
            className="secondary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                setLeads(await api<Lead[]>("leads"));
                setError("");
              } catch (e) {
                setError(errorMessage(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            {label("Erneut laden", "Reload")}
          </button>
        </p>
      )}
      {loading ? (
        <p role="status">
          {label("Leads werden geladen …", "Loading leads …")}
        </p>
      ) : (
        <div className="table-wrap">
          <table className="leads-table">
            <caption className="visually-hidden">
              {label("Leads und Kontaktstatus", "Leads and contact status")}
            </caption>
            <thead>
              <tr>
                <th scope="col">{label("Firma / Fit", "Company / Fit")}</th>
                <th scope="col">{label("Kontakt", "Contact")}</th>
                <th scope="col">Status</th>
                <th scope="col">{label("Quelle", "Source")}</th>
                <th scope="col">{label("Aktionen", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => (
                <tr key={lead.id}>
                  <td>
                    <strong>{lead.company_name}</strong>
                    {lead.website && (
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {lead.website}
                      </a>
                    )}
                    <p>{lead.match_reason}</p>
                  </td>
                  <td>
                    <strong>{lead.contact_name || "—"}</strong>
                    <small>{lead.contact_role}</small>
                    {lead.contact_email && (
                      <div>
                        {lead.contact_email}
                        <small>
                          {lead.contact_email_verified
                            ? label("Verifiziert", "Verified")
                            : label("Nicht verifiziert", "Not verified")}
                        </small>
                      </div>
                    )}
                    {lead.contact_phone && (
                      <div>
                        {lead.contact_phone}
                        <small>
                          {lead.contact_phone_verified
                            ? label("Verifiziert", "Verified")
                            : label("Nicht verifiziert", "Not verified")}
                        </small>
                      </div>
                    )}
                  </td>
                  <td>
                    <select
                      aria-label={
                        label("Status für ", "Status for ") + lead.company_name
                      }
                      disabled={busy}
                      value={lead.status}
                      onChange={async (e) => {
                        const next = e.target.value;
                        setBusy(true);
                        setError("");
                        try {
                          replace(
                            await api<Lead>(
                              `leads/${lead.id}/status`,
                              "PATCH",
                              { status: next },
                            ),
                          );
                        } catch (e) {
                          setError(errorMessage(e));
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      {options}
                    </select>
                  </td>
                  <td>{lead.source || "—"}</td>
                  <td>
                    <div className="leads-actions">
                      <button
                        className="secondary small"
                        disabled={busy}
                        onClick={() => {
                          setFormError("");
                          setEditor(lead);
                        }}
                      >
                        {label("Bearbeiten", "Edit")}
                      </button>
                      <button
                        className="secondary small"
                        disabled={busy}
                        onClick={() => {
                          setFormError("");
                          setDeleting(lead);
                        }}
                      >
                        {label("Löschen", "Delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={5}>
                    {label(
                      "Keine Leads für diese Auswahl.",
                      "No leads match this selection.",
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      {editor && (
        <Dialog
          className="modal"
          labelledBy="lead-editor-title"
          busy={busy}
          onClose={() => setEditor(null)}
        >
          <div className="modal-heading">
            <h2 id="lead-editor-title">
              {editor === "new"
                ? label("Neuer Lead", "New lead")
                : label("Lead bearbeiten", "Edit lead")}
            </h2>
            <button
              className="icon-button"
              aria-label={label("Schließen", "Close")}
              disabled={busy}
              onClick={() => setEditor(null)}
            >
              <X size={18} />
            </button>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              const body: MutationBody = Object.fromEntries(form.entries());
              body.contact_email_verified =
                form.get("contact_email_verified") === "on";
              body.contact_phone_verified =
                form.get("contact_phone_verified") === "on";
              setBusy(true);
              setFormError("");
              try {
                replace(
                  await api<Lead>(
                    editor === "new" ? "leads" : `leads/${editor.id}`,
                    editor === "new" ? "POST" : "PATCH",
                    body,
                  ),
                );
                setEditor(null);
              } catch (e) {
                setFormError(errorMessage(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            <fieldset disabled={busy} className="leads-fields">
              {fields.map(([name, de, en, type, max]) => (
                <label key={name}>
                  <span id={`lead-label-${name}`}>{label(de, en)}</span>
                  {type === "textarea" ? (
                    <textarea
                      aria-labelledby={`lead-label-${name}`}
                      name={name}
                      maxLength={max}
                      rows={name === "outreach_email_draft" ? 6 : 3}
                      defaultValue={editor === "new" ? "" : editor[name]}
                    />
                  ) : (
                    <input
                      name={name}
                      type={type}
                      required={name === "company_name"}
                      maxLength={max}
                      defaultValue={editor === "new" ? "" : editor[name]}
                    />
                  )}
                </label>
              ))}
              <label className="inline-check">
                <input
                  type="checkbox"
                  name="contact_email_verified"
                  defaultChecked={
                    editor !== "new" && editor.contact_email_verified
                  }
                />
                {label("E-Mail verifiziert", "Email verified")}
              </label>
              <label className="inline-check">
                <input
                  type="checkbox"
                  name="contact_phone_verified"
                  defaultChecked={
                    editor !== "new" && editor.contact_phone_verified
                  }
                />
                {label("Telefon verifiziert", "Phone verified")}
              </label>
              <label>
                Status
                <select
                  name="status"
                  defaultValue={editor === "new" ? "neu" : editor.status}
                >
                  {options}
                </select>
              </label>
            </fieldset>
            <p>
              {label(
                "Der E-Mail-Entwurf wird nur gespeichert. Es wird nichts versendet.",
                "The email draft is stored only. Nothing is sent.",
              )}
            </p>
            {formError && <p role="alert">{formError}</p>}
            <div className="leads-actions">
              <button
                className="secondary"
                type="button"
                disabled={busy}
                onClick={() => setEditor(null)}
              >
                {label("Abbrechen", "Cancel")}
              </button>
              <button className="primary" disabled={busy}>
                {busy
                  ? label("Wird gespeichert …", "Saving …")
                  : label("Speichern", "Save")}
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {deleting && (
        <Dialog
          className="modal"
          labelledBy="lead-delete-title"
          busy={busy}
          onClose={() => setDeleting(null)}
        >
          <h2 id="lead-delete-title">{label("Lead löschen", "Delete lead")}</h2>
          <p>
            {label(
              "Diesen Lead dauerhaft löschen?",
              "Permanently delete this lead?",
            )}{" "}
            <strong>{deleting.company_name}</strong>
          </p>
          {formError && <p role="alert">{formError}</p>}
          <div className="leads-actions">
            <button
              className="secondary"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              {label("Abbrechen", "Cancel")}
            </button>
            <button
              className="primary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setFormError("");
                try {
                  await api(`leads/${deleting.id}`, "DELETE");
                  setLeads((rows) =>
                    rows.filter((row) => row.id !== deleting.id),
                  );
                  setDeleting(null);
                } catch (e) {
                  setFormError(errorMessage(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {label("Lead löschen", "Delete lead")}
            </button>
          </div>
        </Dialog>
      )}
    </section>
  );
}
