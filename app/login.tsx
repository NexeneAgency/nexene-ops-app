"use client";
import { ArrowRight, LoaderCircle, ShieldCheck } from "lucide-react";
import { api, errorMessage } from "../lib/client";
import type { useWorkspaceController } from "./use-workspace";
export function Login({
  controller,
}: {
  controller: ReturnType<typeof useWorkspaceController>;
}) {
  const {
    data,
    loading,
    fatal,
    busy,
    setBusy,
    email,
    setEmail,
    sent,
    setSent,
    error,
    setError,
    t,
    load,
    localeToggle,
  } = controller;
  if (loading)
    return (
      <main className="splash">
        <img src="/logo.svg" alt="Nexene" />
        <LoaderCircle className="spin" />
      </main>
    );
  if (fatal)
    return (
      <main className="splash">
        <p>{t("loadError")}</p>
        <button className="primary" onClick={load}>
          {t("retry")}
        </button>
      </main>
    );
  if (!data)
    return (
      <main className="login">
        <div className="login-art">
          <img src="/logo-white.svg" alt="Nexene" />
          <div className="art-lines" />
          <div className="login-manifesto">
            <span>{t("greeting")}</span>
            <h1>{t("portalHeadline")}</h1>
            <p>{t("portalIntro")}</p>
          </div>
          <span className="login-foot">{t("security")}</span>
        </div>
        <div className="login-form">
          {localeToggle}
          <div className="login-box">
            <span className="eyebrow">NEXENE OPS</span>
            <h1>{t("signIn")}</h1>
            <p>{t("loginIntro")}</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError("");
                try {
                  await api("auth/login", "POST", { email });
                  setSent(true);
                } catch (e) {
                  setError(errorMessage(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <label>
                {t("email")}
                <input
                  required
                  type="email"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@unternehmen.at"
                />
              </label>
              <button
                className="primary"
                aria-label={t("loginButton")}
                disabled={busy}
              >
                {busy ? (
                  <LoaderCircle className="spin" size={17} />
                ) : (
                  <>
                    {t("loginButton")}
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>
            {sent && (
              <div className="success" role="status">
                {t("loginSent")}
              </div>
            )}
            {error && (
              <div className="error" role="alert">
                {error}
              </div>
            )}
            <small>
              <ShieldCheck size={15} />
              {t("security")}
            </small>
          </div>
        </div>
      </main>
    );
  return null;
}
