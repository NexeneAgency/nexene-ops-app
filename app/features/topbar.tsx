"use client";

import { today } from "../../lib/client";
import { useWorkspace } from "../workspace-context";
export function Topbar() {
  const { data, view, t, admin, fmt, localeToggle, selected } = useWorkspace();

  const pageTitle = selected ? selected.name : t(view);
  return (
    <header className="topbar">
      <div className="breadcrumbs">
        <span>{admin ? t("workspace") : t("portal")}</span>
        <span aria-hidden="true">/</span>
        <strong>{pageTitle}</strong>
      </div>
      <div className="topbar-right">
        {localeToggle}
        <span className="today-label">{fmt(today(), true)}</span>
      </div>
    </header>
  );
}
