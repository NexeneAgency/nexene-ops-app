"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { Dialog } from "../ui/dialog";
import { errorMessage } from "../../lib/client";
import type { Project, Translator } from "../../lib/types";
import { useWorkspace } from "../workspace-context";

export function PhaseWeightFields({
  weights,
  onChange,
  t,
}: {
  weights: Record<string, number>;
  onChange: (weights: Record<string, number>) => void;
  t: Translator;
}) {
  const total = Object.values(weights).reduce((sum, weight) => sum + weight, 0);
  return (
    <fieldset className="phase-weights">
      <legend>{t("phaseWeights")}</legend>
      <p className="form-note" id="phase-weight-help">
        {t("phaseWeightHelp")}
      </p>
      <div className="phase-weight-grid">
        {Object.entries(weights).map(([phase, weight]) => (
          <label key={phase}>
            <span>{t(`phase:${phase}`)}</span>
            <input
              type="number"
              aria-label={t(`phase:${phase}`)}
              min="0"
              max="100"
              step="1"
              required
              value={Number.isNaN(weight) ? "" : weight}
              aria-describedby="phase-weight-help"
              onChange={(e) =>
                onChange({
                  ...weights,
                  [phase]: e.target.value === "" ? NaN : Number(e.target.value),
                })
              }
            />
            <span aria-hidden="true">%</span>
          </label>
        ))}
      </div>
      <p
        className={total === 100 ? "form-note" : "form-note weight-warning"}
        role="status"
      >
        {t("total")}: {Number.isFinite(total) ? total : 0} % / 100 %
      </p>
    </fieldset>
  );
}

export function PhaseWeightsDialog({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const { t, mutate, busy } = useWorkspace();
  const [weights, setWeights] = useState(project.phase_weights);
  const [error, setError] = useState("");
  const valid =
    Object.values(weights).reduce((sum, weight) => sum + weight, 0) === 100;
  return (
    <Dialog
      className="modal"
      labelledBy="phase-weight-title"
      onClose={onClose}
      busy={busy}
    >
      <div className="modal-heading">
        <h2 id="phase-weight-title">{t("editPhaseWeights")}</h2>
        <button
          className="icon-button"
          aria-label={t("cancel")}
          disabled={busy}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setError("");
          try {
            await mutate(`projects/${project.id}`, "PATCH", {
              phase_weights: weights,
            });
            onClose();
          } catch (e) {
            setError(errorMessage(e));
          }
        }}
      >
        <p>{project.name}</p>
        <PhaseWeightFields weights={weights} onChange={setWeights} t={t} />
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
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
          <button className="primary" disabled={busy || !valid}>
            {t("save")}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
