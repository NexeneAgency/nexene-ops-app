"use client";
import { useEffect, useRef, useState } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Copy,
  LoaderCircle,
  X,
} from "lucide-react";
import {
  accessItems,
  basics,
  contentFields,
  projectFields,
  statusLabels,
} from "../../lib/onboarding.mjs";
import { api, ApiError, errorMessage } from "../../lib/client";
import type { OnboardingAnswers, MutationResult } from "../../lib/types";
import { Dialog } from "../ui/dialog";
import { useWorkspace } from "../workspace-context";

export function OnboardingPanel() {
  const { data, selected, t, setTab, setDocId, fmt } = useWorkspace();
  const [open, setOpen] = useState(false);
  if (!selected) return null;
  const saved = data.onboardings.find((row) => row.project_id === selected.id),
    done = saved?.status === "completed";
  return (
    <>
      <section
        className={`onboarding-panel ${done ? "completed" : ""}`}
        aria-label={t("onboarding")}
      >
        <CheckSquare size={18} aria-hidden="true" />
        <div>
          <h2>{t(done ? "onboardingDone" : "onboardingHeading")}</h2>
          <p>
            {done
              ? `${t("onboardingSubmitted")} ${fmt(saved.completed_at)}`
              : t("onboardingIntro")}
          </p>
        </div>
        <button
          className={done ? "secondary" : "primary"}
          onClick={() => {
            if (done && saved.document_id) {
              setDocId(saved.document_id);
              setTab("documents");
            } else setOpen(true);
          }}
        >
          {done ? <Check size={16} /> : null}
          {t(
            done
              ? "onboardingDone"
              : saved
                ? "onboardingResume"
                : "onboardingStart",
          )}
        </button>
      </section>
      {open && (
        <OnboardingWizard key={selected.id} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
function OnboardingWizard({ onClose }: { onClose: () => void }) {
  const { data, selected, lang, t, load, setTab, setDocId } = useWorkspace();
  const project = selected!,
    saved = data.onboardings.find((row) => row.project_id === project.id),
    i = lang === "de" ? 0 : 1;
  const [answers, setAnswers] = useState<OnboardingAnswers>(
    saved?.answers || {
      company: project.customer_name,
      contact_name: data.user.role === "customer" ? data.user.name : "",
      contact_email: data.user.role === "customer" ? data.user.email : "",
      accesses: {},
    },
  );
  const [step, setStep] = useState(saved?.step || 0),
    [revision, setRevision] = useState(saved?.revision || 0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [conflict, setConflict] = useState(false),
    [copied, setCopied] = useState(false);
  const stepHeading = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    stepHeading.current?.focus({ preventScroll: true });
    stepHeading.current?.closest("dialog")?.scrollTo(0, 0);
  }, [step]);
  const steps = [
    t("onboardingContact"),
    t("onboardingGoals"),
    t("onboardingAccess"),
    t("onboardingAssets"),
    t("onboardingReview"),
  ];
  const fields =
    step === 0
      ? basics
      : step === 1
        ? projectFields(project.project_type)
        : contentFields;
  const items = accessItems(
    project.project_type,
    answers.local_business === true,
  );
  const update = (key: string, value: string | boolean) =>
    setAnswers((current) => ({ ...current, [key]: value, confirmed: false }));
  const persist = async (next: number, complete = false) => {
    setBusy(true);
    setError("");
    try {
      const result = await api<MutationResult>(
        `onboardings/${project.id}`,
        "PATCH",
        { answers, step: next, expected_revision: revision, complete, lang },
      );
      setRevision(result.revision!);
      if (result.completed) {
        await load();
        onClose();
        if (result.document_id) {
          setDocId(result.document_id);
          setTab("documents");
        }
      } else setStep(next);
      return true;
    } catch (e) {
      setError(errorMessage(e));
      if (e instanceof ApiError && e.status === 409) setConflict(true);
      return false;
    } finally {
      setBusy(false);
    }
  };
  const close = async () => {
    if (busy) return;
    if (await persist(step)) {
      await load();
      onClose();
    }
  };
  return (
    <Dialog
      className="modal onboarding-modal"
      labelledBy="onboarding-title"
      busy={busy}
      onClose={() => void close()}
    >
      <div className="modal-heading">
        <div>
          <span className="eyebrow">
            {project.project_type === "seo_geo" ? "SEO + GEO" : t("webProject")}
          </span>
          <h2 id="onboarding-title">{t("onboarding")}</h2>
        </div>
        <button
          className="icon-button"
          disabled={busy}
          aria-label={t("saveAndClose")}
          onClick={() => void close()}
        >
          <X size={20} />
        </button>
      </div>
      <ol className="onboarding-steps" aria-label={t("onboardingSteps")}>
        {steps.map((title, index) => (
          <li
            key={title}
            aria-current={index === step ? "step" : undefined}
            className={
              index === step ? "current" : index < step ? "finished" : ""
            }
          >
            <span>{index < step ? <Check size={14} /> : index + 1}</span>
            {title}
          </li>
        ))}
      </ol>
      <p
        className="onboarding-step-count"
        role="status"
        ref={stepHeading}
        tabIndex={-1}
      >
        {t("step")} {step + 1} {t("of")} 5: {steps[step]}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void persist(step === 4 ? 4 : step + 1, step === 4);
        }}
      >
        <fieldset disabled={busy} className="onboarding-fields">
          {step === 0 && project.project_type === "web" && (
            <label className="inline-check">
              <input
                type="checkbox"
                checked={answers.new_website === true}
                onChange={(e) => update("new_website", e.target.checked)}
              />
              {t("newWebsite")}
            </label>
          )}
          {step === 1 && project.project_type === "seo_geo" && (
            <label className="inline-check">
              <input
                type="checkbox"
                checked={answers.local_business === true}
                onChange={(e) => update("local_business", e.target.checked)}
              />
              {t("localBusiness")}
            </label>
          )}
          {[0, 1, 3].includes(step) &&
            fields.map(([key, de, en, kind, required]) => (
              <label key={String(key)}>
                {String(i === 0 ? de : en)}
                {required ||
                (key === "website" &&
                  (project.project_type === "seo_geo" || !answers.new_website))
                  ? " *"
                  : ""}
                {kind === "textarea" ? (
                  <textarea
                    name={String(key)}
                    maxLength={4000}
                    required={required === true}
                    value={String(answers[String(key)] || "")}
                    onChange={(e) => update(String(key), e.target.value)}
                  />
                ) : (
                  <input
                    name={String(key)}
                    type={String(kind)}
                    placeholder={
                      kind === "url"
                        ? "https://…"
                        : key === "platform"
                          ? "WordPress, Webflow, Shopify …"
                          : undefined
                    }
                    maxLength={4000}
                    required={
                      required === true ||
                      (key === "website" &&
                        (project.project_type === "seo_geo" ||
                          !answers.new_website))
                    }
                    value={String(answers[String(key)] || "")}
                    onChange={(e) => update(String(key), e.target.value)}
                  />
                )}
              </label>
            ))}
          {step === 2 && (
            <>
              <div className="onboarding-invite">
                <strong>{t("invitationAddress")}</strong>
                {data.onboarding_email ? (
                  <div className="onboarding-email">
                    <code>{data.onboarding_email}</code>
                    <button
                      type="button"
                      className="secondary small"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(
                            data.onboarding_email,
                          );
                          setCopied(true);
                        } catch {
                          setError(t("copyEmailManually"));
                        }
                      }}
                    >
                      <Copy size={15} />
                      {t(copied ? "emailCopied" : "copyEmail")}
                    </button>
                  </div>
                ) : (
                  <span>{t("invitationPending")}</span>
                )}
                <p>{t("accessSafety")}</p>
              </div>
              {items.map((item) => (
                <div className="onboarding-access-item" key={item.id}>
                  <h3>{item.label[i]}</h3>
                  <p>{item.help[i]}</p>
                  <label>
                    {t("accessStatus")} *
                    <select
                      required
                      aria-label={`${item.label[i]}: ${t("accessStatus")}`}
                      value={answers.accesses[item.id]?.status || ""}
                      onChange={(e) =>
                        setAnswers((current) => ({
                          ...current,
                          confirmed: false,
                          accesses: {
                            ...current.accesses,
                            [item.id]: {
                              note: current.accesses[item.id]?.note || "",
                              status: e.target.value,
                            },
                          },
                        }))
                      }
                    >
                      <option value="">{t("chooseStatus")}</option>
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option value={value} key={value}>
                          {label[i]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {t("accessNote")}
                    <input
                      value={answers.accesses[item.id]?.note || ""}
                      maxLength={2000}
                      onChange={(e) =>
                        setAnswers((current) => ({
                          ...current,
                          confirmed: false,
                          accesses: {
                            ...current.accesses,
                            [item.id]: {
                              status: current.accesses[item.id]?.status || "",
                              note: e.target.value,
                            },
                          },
                        }))
                      }
                    />
                  </label>
                </div>
              ))}
            </>
          )}
          {step === 3 && <p className="form-note">{t("assetsHelp")}</p>}
          {step === 4 && (
            <div className="onboarding-review">
              <h3>{t("checkAnswers")}</h3>
              <dl>
                {[
                  ...basics,
                  ...projectFields(project.project_type),
                  ...contentFields,
                ]
                  .filter(([key]) => answers[String(key)])
                  .map(([key, de, en]) => (
                    <div key={String(key)}>
                      <dt>{String(i === 0 ? de : en)}</dt>
                      <dd>{String(answers[String(key)])}</dd>
                    </div>
                  ))}
              </dl>
              <h3>{t("onboardingAccess")}</h3>
              <dl>
                {items.map((item) => (
                  <div key={item.id}>
                    <dt>{item.label[i]}</dt>
                    <dd>
                      {statusLabels[
                        answers.accesses[item.id]
                          ?.status as keyof typeof statusLabels
                      ]?.[i] || t("notProvided")}
                      {answers.accesses[item.id]?.note && (
                        <p>{answers.accesses[item.id].note}</p>
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="form-note">{t("onboardingVerificationNote")}</p>
              <label className="inline-check">
                <input
                  type="checkbox"
                  required
                  checked={answers.confirmed === true}
                  onChange={(e) =>
                    setAnswers((current) => ({
                      ...current,
                      confirmed: e.target.checked,
                    }))
                  }
                />
                {t("confirmOnboarding")}
              </label>
            </div>
          )}
        </fieldset>
        {error && (
          <div className="error" role="alert">
            {error}
          </div>
        )}
        {conflict && (
          <button
            type="button"
            className="secondary"
            onClick={async () => {
              if (window.confirm(t("onboardingDiscardConfirm"))) {
                await load();
                onClose();
              }
            }}
          >
            {t("onboardingReload")}
          </button>
        )}
        <div className="modal-footer onboarding-footer">
          <button
            type="button"
            className="text-button"
            disabled={busy}
            onClick={() => void close()}
          >
            {t("saveAndClose")}
          </button>
          {step > 0 && (
            <button
              type="button"
              className="secondary"
              disabled={busy}
              onClick={() => void persist(step - 1)}
            >
              <ChevronLeft size={16} />
              {t("back")}
            </button>
          )}
          <button
            className="primary"
            disabled={busy || (step === 4 && !data.onboarding_email)}
          >
            {busy ? <LoaderCircle className="spin" size={16} /> : null}
            {t(step === 4 ? "submitOnboarding" : "next")}
            {step < 4 ? <ChevronRight size={16} /> : null}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
