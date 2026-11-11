"use client";
import { useState } from "react";
import { Download, FileText, LoaderCircle, Trash2, Upload, X } from "lucide-react";
import { MAX_REPORT_BYTES } from "../../lib/report-limits.mjs";
import { errorMessage } from "../../lib/client";
import { useWorkspace } from "../workspace-context";
import { Dialog } from "../ui/dialog";

export function ReportsView() {
  const { data, project, admin, t, lang, fmt, load, mutate } = useWorkspace();
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const reports = data.reports
    .filter((r) => r.project_id === project)
    .sort(
      (a, b) =>
        b.period.localeCompare(a.period) ||
        b.created_at.localeCompare(a.created_at) ||
        b.id.localeCompare(a.id),
    );

  async function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError("");
    const body = new FormData(form),
      file = body.get("file");
    if (!(file instanceof File) || !file.size) {
      setError(t("selectPdf"));
      return;
    }
    if (file.size > MAX_REPORT_BYTES) {
      setError(t("reportLimit"));
      return;
    }
    body.set("project_id", project);
    setUploading(true);
    const abort = new AbortController(),
      timer = setTimeout(() => abort.abort(), 60000);
    try {
      const result = await fetch("/api/reports", {
        method: "POST",
        body,
        signal: abort.signal,
      });
      const response = await result.json();
      if (!result.ok) throw new Error(response.error || t("uploadFailed"));
      form.reset();
      setShowUpload(false);
      await load();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      clearTimeout(timer);
      setUploading(false);
    }
  }

  return (
    <section className="reports-section" aria-labelledby="reports-title">
      <div className="section-heading">
        <div>
          <h2 id="reports-title">{t("reports")}</h2>
          <p className="muted">{t("reportsIntro")}</p>
        </div>
        <div className="heading-actions">
          <span className="report-count">
            {reports.length}{" "}
            {t(reports.length === 1 ? "reportSingular" : "reports")}
          </span>
          {admin && (
            <button className="primary" onClick={() => setShowUpload(true)}>
              <Upload size={16} />
              {t("addReport")}
            </button>
          )}
        </div>
      </div>

      {reports.length ? (
        <div className="report-list">
          {reports.map((report, index) => (
            <article key={report.id} className="report-card">
              <div className="report-file-icon">
                <FileText size={24} aria-hidden="true" />
              </div>
              <div className="report-copy">
                <div className="report-period">
                  {new Date(`${report.period}-01T12:00:00`).toLocaleDateString(
                    lang === "de" ? "de-AT" : "en-GB",
                    { month: "long", year: "numeric" },
                  )}
                  {index === 0 && (
                    <span className="badge">{t("latestReport")}</span>
                  )}
                </div>
                <h3>{report.title}</h3>
                {report.description && <p>{report.description}</p>}
                <small className="muted">
                  PDF · {Math.ceil(report.size / 1024)} KB ·{" "}
                  {fmt(report.created_at)}
                </small>
              </div>
              <div className="report-actions">
                <a
                  className="secondary"
                  href={`/api/reports/${report.id}/download`}
                  download
                  aria-label={`${t("downloadPdf")}: ${report.title}`}
                >
                  <Download size={16} />
                  {t("downloadPdf")}
                </a>
                {admin && (
                  <button
                    className="icon-button danger"
                    aria-label={`${t("deleteReport")}: ${report.title}`}
                    onClick={async () => {
                      if (!window.confirm(t("deleteReportConfirm"))) return;
                      try {
                        await mutate(`reports/${report.id}`, "DELETE");
                      } catch {}
                    }}
                  >
                    <Trash2 size={17} />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="reports-empty">
          <FileText size={32} aria-hidden="true" />
          <h3>{t("noReports")}</h3>
          <p>{t(admin ? "noReportsAdmin" : "noReportsCustomer")}</p>
        </div>
      )}

      {showUpload && (
        <Dialog
          className="form-modal"
          labelledBy="upload-report-title"
          onClose={() => { if (!uploading) { setShowUpload(false); setError(""); } }}
          busy={uploading}
        >
          <div className="modal-header">
            <h3 id="upload-report-title">{t("addReport")}</h3>
            <button
              className="icon-button"
              onClick={() => { setShowUpload(false); setError(""); }}
              disabled={uploading}
              aria-label={t("cancel")}
            >
              <X size={18} />
            </button>
          </div>
          <form onSubmit={handleUpload} aria-busy={uploading}>
            <fieldset disabled={uploading}>
              <div className="form-grid">
                <label>
                  {t("title")}
                  <input
                    name="title"
                    required
                    maxLength={200}
                    placeholder={t("reportTitleExample")}
                  />
                </label>
                <label>
                  {t("reportPeriod")}
                  <input name="period" type="month" required />
                </label>
              </div>
              <label>
                {t("description")}
                <textarea name="description" maxLength={10000} />
              </label>
              <label>
                {t("pdfFile")}
                <input
                  name="file"
                  type="file"
                  accept="application/pdf,.pdf"
                  required
                  aria-describedby="report-limit"
                />
              </label>
              <p className="form-note" id="report-limit">
                {t("reportLimit")} {t("reportPublishNote")}
              </p>
              <div className="form-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => { setShowUpload(false); setError(""); }}
                  disabled={uploading}
                >
                  {t("cancel")}
                </button>
                <button className="primary" disabled={uploading}>
                  {uploading ? (
                    <LoaderCircle className="spin" size={16} />
                  ) : (
                    <Upload size={16} />
                  )}
                  {uploading ? t("uploading") : t("publishReport")}
                </button>
              </div>
            </fieldset>
            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}
          </form>
        </Dialog>
      )}
    </section>
  );
}
