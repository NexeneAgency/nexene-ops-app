"use client";
import { useState } from "react";
import { LoaderCircle, Trash2, X } from "lucide-react";
import { Dialog } from "../ui/dialog";
import { useWorkspace } from "../workspace-context";
import { errorMessage } from "../../lib/client";
export function DeleteProject() {
  const { selected, admin, t, mutate, navigate } = useWorkspace();
  const [open, setOpen] = useState(false),
    [confirmation, setConfirmation] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (!admin || !selected) return null;
  return (
    <>
      <div className="project-danger-zone">
        <div>
          <h2>{t("projectManagement")}</h2>
          <p>{t("deleteProjectHint")}</p>
        </div>
        <button className="secondary danger" onClick={() => setOpen(true)}>
          <Trash2 size={16} />
          {t("deleteProject")}
        </button>
      </div>
      {open && (
        <Dialog
          className="modal"
          labelledBy="delete-project-title"
          busy={busy}
          onClose={() => setOpen(false)}
        >
          <div className="modal-heading">
            <h2 id="delete-project-title">{t("deleteProject")}</h2>
            <button
              className="icon-button"
              aria-label={t("cancel")}
              disabled={busy}
              onClick={() => setOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (confirmation !== selected.name) return;
              setBusy(true);
              setError("");
              try {
                await mutate(`projects/${selected.id}`, "DELETE");
                navigate("projects", "", true);
              } catch (e) {
                setError(errorMessage(e));
              } finally {
                setBusy(false);
              }
            }}
          >
            <p>{t("deleteProjectConsequences")}</p>
            <p>
              <strong>{selected.name}</strong>
            </p>
            <label>
              {t("confirmProjectName")}
              <input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                autoComplete="off"
                required
                disabled={busy}
              />
            </label>
            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}
            <div className="modal-footer">
              <button
                className="secondary"
                type="button"
                disabled={busy}
                onClick={() => setOpen(false)}
              >
                {t("cancel")}
              </button>
              <button
                className="primary destructive"
                disabled={busy || confirmation !== selected.name}
              >
                {busy ? (
                  <LoaderCircle size={16} className="spin" />
                ) : (
                  <Trash2 size={16} />
                )}{" "}
                {t("deletePermanently")}
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}
