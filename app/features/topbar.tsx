"use client";
import { ChevronRight } from "lucide-react";

import { today } from "../../lib/client";
import { Avatar } from "../ui/primitives";
import { useWorkspace } from "../workspace-context";
export function Topbar() {
  const { data, view, t, admin, fmt, localeToggle, selected } = useWorkspace();

  const pageTitle = selected ? selected.name : t(view);
  return (
    <header className="topbar">
      <div className="breadcrumbs">
        <span>{admin ? "Nexene Ops" : t("portal")}</span>
        <ChevronRight size={13} />
        <strong>{pageTitle}</strong>
      </div>
      <div className="topbar-right">
        {localeToggle}
        <span className="today-label">{fmt(today(), true)}</span>
        <Avatar name={data.user.name} size="small" />
      </div>
    </header>
  );
}
