"use client";

import { Empty } from "../ui/primitives";
import { useWorkspace } from "../workspace-context";

export function TimeView() {
  const { lang, data, project, t, fmt, selected } = useWorkspace();

  if (!selected) return null;
  const entries = data.time_entries.filter((e) => e.project_id === project),
    hours = entries.reduce((s, e) => s + e.minutes, 0) / 60;
  return (
    <>
      <div className="stats compact">
        {[
          [
            t("budget"),
            `${Number(selected.budget).toLocaleString(lang === "de" ? "de-AT" : "en-GB")} €`,
          ],
          [t("hours"), `${selected.hours_budget} h`],
          [t("tracked"), `${hours.toFixed(1)} h`],
          [
            t("remaining"),
            `${((selected.hours_budget ?? 0) - hours).toFixed(1)} h`,
          ],
        ].map(([l, v]) => (
          <div className="stat" key={l}>
            <span>{l}</span>
            <strong>{v}</strong>
          </div>
        ))}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t("date")}</th>
              <th>{t("assignee")}</th>
              <th>{t("note")}</th>
              <th>{t("time")}</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id}>
                <td>{fmt(e.date)}</td>
                <td>
                  {e.user_name ||
                    data.users.find((u) => u.id === e.user_id)?.name}
                </td>
                <td>{e.note}</td>
                <td>{(e.minutes / 60).toFixed(2)} h</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!entries.length && <Empty>{t("empty")}</Empty>}
      </div>
    </>
  );
}
