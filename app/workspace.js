"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  FileText,
  Users,
  Settings,
  Search,
  Plus,
  ArrowUpRight,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
  Clock3,
  Circle,
  Check,
  X,
  LogOut,
  Link2,
  ShieldCheck,
  Globe,
  Columns3,
  List,
  ChartNoAxesGantt,
  MoreHorizontal,
  ArrowRight,
  LoaderCircle,
} from "lucide-react";
const Editor = dynamic(() => import("./editor"), {
  ssr: false,
  loading: () => <div className="editor-loading">…</div>,
});
const words = {
  de: {
    overview: "Übersicht",
    projects: "Projekte",
    tasks: "Aufgaben",
    documents: "Dokumente",
    customers: "Kunden",
    settings: "Einstellungen",
    workspace: "Workspace",
    hello: "Alles im Blick.",
    intro: "Deine Projekte, dein Team und die nächsten Schritte.",
    newProject: "Neues Projekt",
    activeProjects: "Aktive Projekte",
    openTasks: "Offene Aufgaben",
    approvals: "Offene Freigaben",
    customersCount: "Kunden",
    projectOverview: "Deine Projekte",
    viewAll: "Alle ansehen",
    nextTasks: "Als Nächstes",
    activity: "Projektphasen",
    search: "Projekte, Aufgaben, Dokumente suchen …",
    all: "Alle Projekte",
    name: "Name",
    project: "Projekt",
    status: "Status",
    due: "Fällig",
    assignee: "Zuständig",
    priority: "Priorität",
    todo: "Offen",
    progress: "In Arbeit",
    review: "In Prüfung",
    done: "Erledigt",
    low: "Niedrig",
    medium: "Normal",
    high: "Hoch",
    list: "Liste",
    board: "Board",
    calendar: "Kalender",
    timeline: "Zeitplan",
    newTask: "Neue Aufgabe",
    newDoc: "Neue Seite",
    newCustomer: "Neuer Kunde",
    save: "Speichern",
    cancel: "Abbrechen",
    create: "Erstellen",
    title: "Titel",
    description: "Beschreibung",
    customer: "Kunde",
    start: "Startdatum",
    end: "Enddatum",
    budget: "Festpreis (€)",
    hours: "Stundenbudget",
    pricing: "Abrechnung",
    fixed: "Festpreis",
    hourly: "Nach Stunden",
    visible: "Im Kundenportal sichtbar",
    internal: "Intern",
    shared: "Kundensichtbar",
    none: "Nicht zugewiesen",
    empty: "Hier ist Platz für den nächsten Schritt.",
    logout: "Abmelden",
    team: "Team & Kundenzugänge",
    newAccess: "Zugang hinzufügen",
    email: "E-Mail",
    role: "Rolle",
    admin: "Admin",
    customerRole: "Kunde",
    portal: "Kundenportal",
    details: "Details",
    time: "Zeiten & Budget",
    resources: "Links & Ressourcen",
    newLink: "Link hinzufügen",
    logTime: "Zeit erfassen",
    minutes: "Minuten",
    date: "Datum",
    note: "Notiz",
    comments: "Kommentare",
    comment: "Kommentar schreiben …",
    send: "Senden",
    subtasks: "Unteraufgaben",
    newSubtask: "Unteraufgabe",
    recurrence: "Wiederholung",
    never: "Keine",
    weekly: "Wöchentlich",
    monthly: "Monatlich",
    requestApproval: "Freigabe anfordern",
    reference: "Version / Stand / Referenzlink",
    pending: "Ausstehend",
    approved: "Freigegeben",
    changes: "Änderungen gewünscht",
    approve: "Freigeben",
    requestChanges: "Änderungen anfragen",
    feedback: "Feedback",
    phase: "Projektphase",
    parent: "Übergeordnete Seite",
    template: "Als Seitenvorlage nutzen",
    fromTemplate: "Aus Vorlage",
    blank: "Leere Seite",
    working: "Wird gespeichert …",
    saved: "Gespeichert",
    back: "Zurück",
    security: "Zugriff ausschließlich für freigeschaltete E-Mail-Adressen.",
    signIn: "Dein Workspace wartet.",
    loginIntro:
      "Melde dich mit deiner freigeschalteten E-Mail-Adresse an. Du erhältst einen persönlichen Anmeldelink.",
    loginButton: "Anmeldelink senden",
    loginSent:
      "Falls deine Adresse freigeschaltet ist, erhältst du einen Anmeldelink. Er ist 15 Minuten gültig.",
    noProjects: "Noch keine Projekte",
    noTasks: "Keine Aufgaben in dieser Ansicht",
    greeting: "NEXENE OPERATIONS",
    today: "Heute",
    remaining: "Verbleibend",
    tracked: "Erfasst",
    revoked: "Zugang entzogen",
    revoke: "Zugang entziehen",
    logo: "Kundenlogo (https://…)",
    readOnly: "Kundenansicht",
    versionNote: "Freigaben beziehen sich auf den angegebenen Stand.",
    unavailable: "Nicht verfügbar oder kein Zugriff.",
    loadError: "Verbindung fehlgeschlagen. Bitte erneut versuchen.",
    retry: "Erneut versuchen",
  },
  en: {
    overview: "Overview",
    projects: "Projects",
    tasks: "Tasks",
    documents: "Documents",
    customers: "Customers",
    settings: "Settings",
    workspace: "Workspace",
    hello: "A little clarity. A lot of progress.",
    intro: "Your projects, your team and what comes next.",
    newProject: "New project",
    activeProjects: "Active projects",
    openTasks: "Open tasks",
    approvals: "Pending approvals",
    customersCount: "Customers",
    projectOverview: "Your projects",
    viewAll: "View all",
    nextTasks: "Up next",
    activity: "Project phases",
    search: "Search projects, tasks, documents …",
    all: "All projects",
    name: "Name",
    project: "Project",
    status: "Status",
    due: "Due",
    assignee: "Assignee",
    priority: "Priority",
    todo: "To do",
    progress: "In progress",
    review: "In review",
    done: "Done",
    low: "Low",
    medium: "Medium",
    high: "High",
    list: "List",
    board: "Board",
    calendar: "Calendar",
    timeline: "Timeline",
    newTask: "New task",
    newDoc: "New page",
    newCustomer: "New customer",
    save: "Save",
    cancel: "Cancel",
    create: "Create",
    title: "Title",
    description: "Description",
    customer: "Customer",
    start: "Start date",
    end: "Due date",
    budget: "Fixed budget (€)",
    hours: "Hours budget",
    pricing: "Pricing",
    fixed: "Fixed price",
    hourly: "Hourly",
    visible: "Visible in customer portal",
    internal: "Internal",
    shared: "Customer visible",
    none: "Unassigned",
    empty: "Room for your next step.",
    logout: "Sign out",
    team: "Team & customer access",
    newAccess: "Add access",
    email: "Email",
    role: "Role",
    admin: "Admin",
    customerRole: "Customer",
    portal: "Customer portal",
    details: "Details",
    time: "Time & budget",
    resources: "Links & resources",
    newLink: "Add link",
    logTime: "Log time",
    minutes: "Minutes",
    date: "Date",
    note: "Note",
    comments: "Comments",
    comment: "Write a comment …",
    send: "Send",
    subtasks: "Subtasks",
    newSubtask: "Subtask",
    recurrence: "Repeat",
    never: "Never",
    weekly: "Weekly",
    monthly: "Monthly",
    requestApproval: "Request approval",
    reference: "Version / snapshot / reference link",
    pending: "Pending",
    approved: "Approved",
    changes: "Changes requested",
    approve: "Approve",
    requestChanges: "Request changes",
    feedback: "Feedback",
    phase: "Project phase",
    parent: "Parent page",
    template: "Use as page template",
    fromTemplate: "From template",
    blank: "Blank page",
    working: "Saving …",
    saved: "Saved",
    back: "Back",
    security: "Access is limited to approved email addresses.",
    signIn: "Your workspace awaits.",
    loginIntro:
      "Enter your approved email address. We’ll send you a personal sign-in link.",
    loginButton: "Send sign-in link",
    loginSent:
      "If your address is enabled, you’ll receive a sign-in link. It is valid for 15 minutes.",
    noProjects: "No projects yet",
    noTasks: "No tasks in this view",
    greeting: "NEXENE OPERATIONS",
    today: "Today",
    remaining: "Remaining",
    tracked: "Tracked",
    revoked: "Access revoked",
    revoke: "Revoke access",
    logo: "Customer logo (https://…)",
    readOnly: "Customer view",
    versionNote: "Decisions apply to the referenced version.",
    unavailable: "Unavailable or access denied.",
    loadError: "Connection failed. Please try again.",
    retry: "Try again",
  },
};
const statuses = ["todo", "progress", "review", "done"];
const today = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Vienna" });
async function api(path, method = "GET", body) {
  const res = await fetch(`/api/${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok)
    throw Object.assign(new Error(data.error || "Error"), {
      status: res.status,
    });
  return data;
}
function Avatar({ name = "", color, size = "" }) {
  return (
    <span
      className={`avatar ${size}`}
      style={color ? { background: color } : undefined}
    >
      {(name.length <= 2
        ? name
        : name
            .split(/\s+/)
            .map((s) => s[0])
            .join("")
            .slice(0, 2)
      ).toUpperCase()}
    </span>
  );
}
function Badge({ children, status }) {
  return (
    <span className={`badge ${status || ""}`}>
      <i />
      {children}
    </span>
  );
}
function Empty({ children }) {
  return (
    <div className="empty">
      <FolderKanban size={28} />
      <p>{children}</p>
    </div>
  );
}
export default function Workspace() {
  const initialized = useRef(false);
  const [lang, setLang] = useState("de"),
    [data, setData] = useState(null),
    [loading, setLoading] = useState(true),
    [fatal, setFatal] = useState(""),
    [view, setView] = useState("overview"),
    [project, setProject] = useState(""),
    [tab, setTab] = useState("tasks"),
    [mode, setMode] = useState("list"),
    [query, setQuery] = useState(""),
    [modal, setModal] = useState(null),
    [taskId, setTaskId] = useState(""),
    [docId, setDocId] = useState(""),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(false),
    [email, setEmail] = useState(""),
    [sent, setSent] = useState(false),
    [error, setError] = useState(""),
    [month, setMonth] = useState(new Date()),
    [draft, setDraft] = useState(null),
    [dirty, setDirty] = useState(false);
  const t = (key) => words[lang][key] || key,
    admin = data?.user.role === "admin";
  const notify = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 4000);
  };
  async function load() {
    try {
      const d = await api("state");
      setData(d);
      setFatal("");
      return d;
    } catch (e) {
      if (e.status === 401) setData(null);
      else setFatal(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const saved = localStorage.getItem("nexene-lang");
    if (saved === "en") setLang("en");
    const token = new URLSearchParams(window.location.search).get("token");
    (async () => {
      if (token) {
        try {
          await api("auth/verify", "POST", { token });
        } catch (e) {
          setError(e.message);
        }
        const u = new URL(window.location.href);
        u.searchParams.delete("token");
        history.replaceState({}, "", u);
      }
      const d = await load();
      const id = new URLSearchParams(window.location.search).get("doc");
      if (id && d) {
        if (d.documents.some((doc) => doc.id === id)) {
          setDocId(id);
          setView("documents");
        } else notify(words[saved === "en" ? "en" : "de"].unavailable);
      }
    })();
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
    localStorage.setItem("nexene-lang", lang);
  }, [lang]);
  useEffect(() => {
    const handler = (e) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  async function mutate(path, method, body) {
    setBusy(true);
    setError("");
    try {
      const result = await api(path, method, body);
      await load();
      return result;
    } catch (e) {
      notify(e.message);
      throw e;
    } finally {
      setBusy(false);
    }
  }
  function navigate(next, p = "") {
    if (
      dirty &&
      !window.confirm(
        lang === "de"
          ? "Ungespeicherte Änderungen verwerfen?"
          : "Discard unsaved changes?",
      )
    )
      return;
    setDirty(false);
    setDraft(null);
    setView(next);
    setProject(p);
    setTaskId("");
    setDocId("");
    setQuery("");
  }
  function openDoc(id) {
    if (
      dirty &&
      !window.confirm(
        lang === "de"
          ? "Ungespeicherte Änderungen verwerfen?"
          : "Discard unsaved changes?",
      )
    )
      return;
    setDirty(false);
    setDraft(null);
    setDocId(id);
  }
  const fmt = (value, full = false) =>
    value
      ? new Date(
          value.length === 10 ? `${value}T12:00:00` : value,
        ).toLocaleDateString(lang === "de" ? "de-AT" : "en-GB", {
          day: "2-digit",
          month: full ? "long" : "short",
          ...(full ? { year: "numeric" } : {}),
        })
      : "—";
  const localeToggle = (
    <button
      className="language"
      onClick={() => setLang(lang === "de" ? "en" : "de")}
    >
      <Globe size={14} />
      {lang.toUpperCase()}
    </button>
  );
  if (loading)
    return (
      <div className="splash">
        <img src="/logo.svg" alt="Nexene" />
        <LoaderCircle className="spin" />
      </div>
    );
  if (fatal)
    return (
      <div className="splash">
        <p>{t("loadError")}</p>
        <button className="primary" onClick={load}>
          {t("retry")}
        </button>
      </div>
    );
  if (!data)
    return (
      <div className="login">
        <div className="login-art">
          <img src="/logo-white.svg" alt="Nexene" />
          <div className="art-lines" />
          <div className="login-manifesto">
            <span>LESS FRICTION. MORE FLOW.</span>
            <h1>
              Good work.
              <br />
              Great things.
            </h1>
            <p>Nexene Operations Workspace</p>
          </div>
          <span className="login-foot">DESIGNED TO MOVE THINGS FORWARD ↗</span>
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
                  setError(e.message);
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@unternehmen.at"
                />
              </label>
              <button className="primary" disabled={busy}>
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
            {sent && <div className="success">{t("loginSent")}</div>}
            {error && <div className="error">{error}</div>}
            <small>
              <ShieldCheck size={15} />
              {t("security")}
            </small>
          </div>
        </div>
      </div>
    );
  const projects = data.projects.filter(
    (p) =>
      !query ||
      `${p.name} ${p.customer_name}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const selected = data.projects.find((p) => p.id === project);
  const matches = (text) =>
    !query || text.toLowerCase().includes(query.toLowerCase());
  const tasks = data.tasks.filter(
    (x) => (!project || x.project_id === project) && matches(x.title),
  );
  const docs = data.documents.filter(
    (x) => (!project || x.project_id === project) && matches(x.title),
  );
  const doc = data.documents.find((d) => d.id === docId);
  const task = data.tasks.find((d) => d.id === taskId);
  const projectOf = (id) => data.projects.find((p) => p.id === id);
  const taskProgress = (id) => {
    const all = data.tasks.filter((t) => t.project_id === id);
    return all.length
      ? Math.round(
          (all.filter((t) => t.status === "done").length / all.length) * 100,
        )
      : 0;
  };
  const navItems = [
    ["overview", LayoutDashboard],
    ["projects", FolderKanban],
    ["tasks", CheckSquare],
    ["documents", FileText],
    ...(admin ? [["customers", Users]] : []),
  ];
  function projectCard(p) {
    const progress = taskProgress(p.id),
      count = data.tasks.filter(
        (t) => t.project_id === p.id && t.status !== "done",
      ).length;
    return (
      <button
        className="project-card"
        key={p.id}
        onClick={() => {
          navigate("projects", p.id);
          setTab("tasks");
        }}
      >
        <div className="project-card-top">
          <Avatar name={p.initials} color={p.customer_color} />
          <ArrowUpRight size={18} />
        </div>
        <span className="customer-label">{p.customer_name}</span>
        <h3>{p.name}</h3>
        <Badge status="progress">{p.phase}</Badge>
        <div className="progress-label">
          <span>{lang === "de" ? "Fortschritt" : "Progress"}</span>
          <strong>{progress}%</strong>
        </div>
        <div className="progress-bar">
          <span style={{ width: `${progress}%` }} />
        </div>
        <div className="card-bottom">
          <span>
            <CheckSquare size={13} />
            {count} {t("openTasks").toLowerCase()}
          </span>
          <span>
            <CalendarDays size={13} />
            {fmt(p.due_date)}
          </span>
        </div>
      </button>
    );
  }
  function taskRows(list) {
    return (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{t("name")}</th>
              {!project && <th>{t("project")}</th>}
              <th>{t("status")}</th>
              {admin && <th>{t("assignee")}</th>}
              <th>{t("due")}</th>
              <th>{t("priority")}</th>
            </tr>
          </thead>
          <tbody>
            {list.map((task) => (
              <tr key={task.id} onClick={() => setTaskId(task.id)}>
                <td>
                  <div className="task-title">
                    <button
                      aria-label={t("done")}
                      className={`task-check ${task.status === "done" ? "checked" : ""}`}
                      disabled={!admin}
                      onClick={(e) => {
                        e.stopPropagation();
                        mutate(`tasks/${task.id}`, "PATCH", {
                          status: task.status === "done" ? "todo" : "done",
                        }).catch(() => {});
                      }}
                    >
                      {task.status === "done" && <Check size={12} />}
                    </button>
                    <span className={task.status === "done" ? "struck" : ""}>
                      {task.parent_id && "↳ "}
                      {task.title}
                    </span>
                    {!!task.visible && <Globe size={12} className="muted" />}
                  </div>
                </td>
                {!project && (
                  <td className="muted">{projectOf(task.project_id)?.name}</td>
                )}
                <td>
                  <Badge status={task.status}>{t(task.status)}</Badge>
                </td>
                {admin && (
                  <td>
                    {task.assignee_id ? (
                      <span className="person">
                        <Avatar
                          size="tiny"
                          name={
                            data.users.find((u) => u.id === task.assignee_id)
                              ?.name
                          }
                        />
                        {
                          data.users.find((u) => u.id === task.assignee_id)
                            ?.name
                        }
                      </span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                )}
                <td
                  className={
                    task.due_date &&
                    task.due_date < today() &&
                    task.status !== "done"
                      ? "overdue"
                      : "muted"
                  }
                >
                  {fmt(task.due_date)}
                </td>
                <td>
                  <span className={`priority ${task.priority}`}>
                    {t(task.priority)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && <Empty>{t("noTasks")}</Empty>}
      </div>
    );
  }
  function taskViews() {
    if (mode === "board")
      return (
        <div className="board">
          {statuses.map((status) => (
            <section
              key={status}
              onDragOver={(e) => admin && e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                if (data.tasks.some((t) => t.id === id))
                  mutate(`tasks/${id}`, "PATCH", { status }).catch(() => {});
              }}
            >
              <h3>
                <i className={`status-dot ${status}`} />
                {t(status)}
                <span>{tasks.filter((t) => t.status === status).length}</span>
              </h3>
              {tasks
                .filter((t) => t.status === status)
                .map((task) => (
                  <button
                    key={task.id}
                    className="board-card"
                    draggable={admin}
                    onDragStart={(e) =>
                      e.dataTransfer.setData("text/plain", task.id)
                    }
                    onClick={() => setTaskId(task.id)}
                  >
                    <small>{projectOf(task.project_id)?.customer_name}</small>
                    <h4>{task.title}</h4>
                    <div>
                      <span className={`priority ${task.priority}`}>
                        {t(task.priority)}
                      </span>
                      <span>{fmt(task.due_date)}</span>
                    </div>
                  </button>
                ))}
            </section>
          ))}
        </div>
      );
    if (mode === "calendar") {
      const y = month.getFullYear(),
        m = month.getMonth(),
        first = new Date(y, m, 1),
        offset = (first.getDay() + 6) % 7,
        days = new Date(y, m + 1, 0).getDate();
      return (
        <div className="calendar">
          <div className="calendar-head">
            <h3>
              {month.toLocaleDateString(lang === "de" ? "de-AT" : "en-GB", {
                month: "long",
                year: "numeric",
              })}
            </h3>
            <div>
              <button
                className="icon-button"
                onClick={() => setMonth(new Date(y, m - 1, 1))}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                className="secondary"
                onClick={() => setMonth(new Date())}
              >
                {t("today")}
              </button>
              <button
                className="icon-button"
                onClick={() => setMonth(new Date(y, m + 1, 1))}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <div className="calendar-grid">
            {(lang === "de"
              ? ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
              : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
            ).map((x) => (
              <div className="weekday" key={x}>
                {x}
              </div>
            ))}
            {Array.from(
              { length: Math.ceil((offset + days) / 7) * 7 },
              (_, i) => {
                const d = i - offset + 1,
                  key = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                return (
                  <div
                    key={i}
                    className={`calendar-cell ${d < 1 || d > days ? "outside" : ""} ${key === today() ? "today" : ""}`}
                  >
                    {d > 0 && d <= days && (
                      <>
                        <span>{d}</span>
                        {tasks
                          .filter((t) => t.due_date === key)
                          .map((t) => (
                            <button
                              onClick={() => setTaskId(t.id)}
                              key={t.id}
                              className={t.status}
                            >
                              {t.title}
                            </button>
                          ))}
                      </>
                    )}
                  </div>
                );
              },
            )}
          </div>
          {tasks.some((t) => !t.due_date) && (
            <div className="undated">
              <h4>{lang === "de" ? "Ohne Termin" : "No due date"}</h4>
              {tasks
                .filter((t) => !t.due_date)
                .map((t) => (
                  <button
                    className="text-button"
                    key={t.id}
                    onClick={() => setTaskId(t.id)}
                  >
                    {t.title}
                  </button>
                ))}
            </div>
          )}
        </div>
      );
    }
    if (mode === "timeline") {
      const dated = tasks.filter((t) => t.due_date),
        start = dated.length
          ? Math.min(
              ...dated.map((t) => Date.parse(t.start_date || t.due_date)),
            )
          : Date.now(),
        end = dated.length
          ? Math.max(...dated.map((t) => Date.parse(t.due_date)))
          : start + 86400000,
        range = Math.max(end - start, 86400000);
      return (
        <div className="timeline">
          <div className="timeline-scale">
            <span>{fmt(new Date(start).toISOString().slice(0, 10))}</span>
            <span>{fmt(new Date(end).toISOString().slice(0, 10))}</span>
          </div>
          {tasks.map((task) => (
            <button
              className="timeline-row"
              key={task.id}
              onClick={() => setTaskId(task.id)}
            >
              <span>{task.title}</span>
              <div className="timeline-track">
                {task.due_date ? (
                  <i
                    className={task.status}
                    style={{
                      left: `${Math.max(0, ((Date.parse(task.start_date || task.due_date) - start) / range) * 85)}%`,
                      width: `${Math.max(3, ((Date.parse(task.due_date) - Date.parse(task.start_date || task.due_date)) / range) * 85)}%`,
                    }}
                  >
                    {fmt(task.due_date)}
                  </i>
                ) : (
                  <small>—</small>
                )}
              </div>
            </button>
          ))}
        </div>
      );
    }
    return taskRows(tasks);
  }
  function documentTree(parent = null, depth = 0) {
    return docs
      .filter(
        (d) =>
          (docs.some((p) => p.id === d.parent_id) ? d.parent_id : null) ===
          parent,
      )
      .map((d) => (
        <div key={d.id}>
          <button
            className={`doc-item ${docId === d.id ? "selected" : ""}`}
            style={{ paddingLeft: 16 + depth * 16 }}
            onClick={() => openDoc(d.id)}
          >
            <FileText size={16} />
            <span>{d.title}</span>
            {!!d.is_template && <small>T</small>}
            {!!d.visible && <Globe size={12} />}
          </button>
          {depth < 10 && documentTree(d.id, depth + 1)}
        </div>
      ));
  }
  function documentView() {
    return (
      <div className="documents-layout">
        <aside className="doc-tree">
          <h4>
            {t("documents")}
            <span>{docs.length}</span>
          </h4>
          {documentTree()}
          {admin && (
            <button
              className="text-button"
              onClick={() =>
                setModal({
                  type: "document",
                  project_id: project || data.projects[0]?.id,
                  parent_id: docId,
                })
              }
            >
              <Plus size={14} />
              {t("newDoc")}
            </button>
          )}
        </aside>
        <div className="document-main">
          {doc ? (
            <>
              <div className="document-top">
                <Badge status={doc.visible ? "done" : ""}>
                  {t(doc.visible ? "shared" : "internal")}
                </Badge>
                <div>
                  {admin && (
                    <>
                      <label className="inline-check">
                        <input
                          type="checkbox"
                          checked={!!doc.visible}
                          onChange={(e) =>
                            mutate(`documents/${doc.id}`, "PATCH", {
                              visible: e.target.checked,
                            }).catch(() => {})
                          }
                        />
                        {t("visible")}
                      </label>
                      <button
                        disabled={!dirty || busy}
                        className="primary small"
                        onClick={async () => {
                          try {
                            await mutate(`documents/${doc.id}`, "PATCH", {
                              content: draft,
                            });
                            setDirty(false);
                            notify(t("saved"));
                          } catch {}
                        }}
                      >
                        {busy ? t("working") : t("save")}
                      </button>
                    </>
                  )}
                </div>
              </div>
              <small className="muted">{projectOf(doc.project_id)?.name}</small>
              <h1>{doc.title}</h1>
              <Editor
                key={doc.id}
                content={doc.content}
                editable={admin}
                onChange={(value) => {
                  setDraft(value);
                  setDirty(true);
                }}
                documents={data.documents.filter(
                  (d) => d.project_id === doc.project_id,
                )}
              />
              <div className="doc-footer">
                {fmt(doc.updated_at, true)}{" "}
                {admin && "· # Markdown · **bold** · > quote"}
              </div>
            </>
          ) : (
            <Empty>{t("empty")}</Empty>
          )}
        </div>
      </div>
    );
  }
  function approvalsView() {
    const approvals = data.approvals.filter((a) => a.project_id === project);
    return (
      <div className="approvals-list">
        {approvals.map((a) => (
          <div className="approval-card" key={a.id}>
            <div>
              <ShieldCheck size={20} />
              <Badge
                status={
                  a.status === "approved"
                    ? "done"
                    : a.status === "changes"
                      ? "review"
                      : "todo"
                }
              >
                {t(a.status)}
              </Badge>
            </div>
            <h3>{a.title}</h3>
            <p className="reference">{a.reference}</p>
            {a.feedback && <blockquote>{a.feedback}</blockquote>}
            {a.decision_at && (
              <small>
                {a.decision_name} · {fmt(a.decision_at, true)}
              </small>
            )}
            {!admin && a.status === "pending" && (
              <div className="approval-actions">
                <button
                  className="primary small"
                  onClick={() =>
                    setModal({
                      type: "decision",
                      approval_id: a.id,
                      status: "approved",
                    })
                  }
                >
                  <Check size={15} />
                  {t("approve")}
                </button>
                <button
                  className="secondary small"
                  onClick={() =>
                    setModal({
                      type: "decision",
                      approval_id: a.id,
                      status: "changes",
                    })
                  }
                >
                  {t("requestChanges")}
                </button>
              </div>
            )}
          </div>
        ))}
        {!approvals.length && <Empty>{t("empty")}</Empty>}
        <small className="muted">{t("versionNote")}</small>
      </div>
    );
  }
  function resourcesView() {
    return (
      <div className="resource-list">
        {data.resources
          .filter((r) => r.project_id === project)
          .map((r) => (
            <a
              key={r.id}
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="resource-icon">
                <Link2 size={19} />
              </span>
              <span>
                <strong>{r.title}</strong>
                <small>{r.url}</small>
              </span>
              <Badge>{t(r.visible ? "shared" : "internal")}</Badge>
              <ArrowUpRight size={18} />
            </a>
          ))}
        {!data.resources.some((r) => r.project_id === project) && (
          <Empty>{t("empty")}</Empty>
        )}
      </div>
    );
  }
  function timeView() {
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
            [t("remaining"), `${(selected.hours_budget - hours).toFixed(1)} h`],
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
                  <td>{data.users.find((u) => u.id === e.user_id)?.name}</td>
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
  const pageTitle = selected ? selected.name : t(view);
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => navigate("overview")}>
          <img src="/logo.svg" alt="Nexene" />
          <span>OPS</span>
        </button>
        <div className="workspace-label">
          <span className="workspace-symbol">N</span>
          <div>
            Nexene Agency<small>{admin ? t("workspace") : t("portal")}</small>
          </div>
          <ChevronRight size={14} />
        </div>
        <span className="nav-caption">{t("workspace")}</span>
        <nav>
          {navItems.map(([key, Icon]) => (
            <button
              className={view === key ? "active" : ""}
              key={key}
              onClick={() => navigate(key)}
            >
              <Icon size={18} />
              <span>{t(key)}</span>
              {key === "tasks" && (
                <small>
                  {data.tasks.filter((t) => t.status !== "done").length}
                </small>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-projects">
          <span className="nav-caption">
            {t("projects")}
            {admin && (
              <button
                aria-label={t("newProject")}
                onClick={() => setModal({ type: "project" })}
              >
                <Plus size={14} />
              </button>
            )}
          </span>
          {data.projects.slice(0, 5).map((p) => (
            <button
              key={p.id}
              className={project === p.id ? "selected" : ""}
              onClick={() => navigate("projects", p.id)}
            >
              <i style={{ background: p.customer_color }} />
              {p.name}
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          {admin && (
            <button
              className={view === "settings" ? "active" : ""}
              onClick={() => navigate("settings")}
            >
              <Settings size={17} />
              {t("settings")}
            </button>
          )}
          <div className="user-card">
            <Avatar name={data.user.name} />
            <div>
              <strong>{data.user.name}</strong>
              <small>{t(admin ? "admin" : "customerRole")}</small>
            </div>
            <button
              title={t("logout")}
              onClick={async () => {
                try {
                  await api("auth/logout", "POST", {});
                  setData(null);
                  setSent(false);
                  setDocId("");
                  setTaskId("");
                } catch (e) {
                  notify(e.message);
                }
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
      <div className="main-shell">
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
        <main>
          <div className="page-heading">
            <div>
              {selected && (
                <button
                  className="back-button"
                  onClick={() => navigate("projects")}
                >
                  <ArrowLeft size={14} />
                  {t("projects")}
                </button>
              )}
              <span className="eyebrow">
                {selected ? selected.customer_name : t("greeting")}
              </span>
              <h1>
                {(view === "overview" ? t("hello") : pageTitle).replace(
                  /\.$/,
                  "",
                )}
                <span className="heading-dot">.</span>
              </h1>
              {view === "overview" && <p>{t("intro")}</p>}
              {selected && <p>{selected.description}</p>}
            </div>
            {admin && (
              <button
                className="primary"
                onClick={() =>
                  setModal({
                    type:
                      view === "customers"
                        ? "customer"
                        : view === "documents"
                          ? "document"
                          : view === "tasks"
                            ? "task"
                            : "project",
                    project_id: project || data.projects[0]?.id,
                  })
                }
              >
                <Plus size={17} />
                {t(
                  view === "customers"
                    ? "newCustomer"
                    : view === "documents"
                      ? "newDoc"
                      : view === "tasks"
                        ? "newTask"
                        : "newProject",
                )}
              </button>
            )}
          </div>
          {view !== "overview" && view !== "settings" && (
            <div className="search-row">
              <label className="search">
                <Search size={16} />
                <input
                  aria-label={t("search")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("search")}
                />
                {query && (
                  <button onClick={() => setQuery("")}>
                    <X size={13} />
                  </button>
                )}
              </label>
              {!selected && ["tasks", "documents"].includes(view) && (
                <select
                  aria-label={t("project")}
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                >
                  <option value="">{t("all")}</option>
                  {data.projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
          {view === "overview" && (
            <>
              <div className="stats">
                {[
                  [
                    FolderKanban,
                    t("activeProjects"),
                    data.projects.filter((p) => p.phase !== "Betreuung").length,
                    "lavender",
                  ],
                  [
                    CheckSquare,
                    t("openTasks"),
                    data.tasks.filter((t) => t.status !== "done").length,
                    "green",
                  ],
                  [
                    ShieldCheck,
                    t("approvals"),
                    data.approvals.filter((a) => a.status === "pending").length,
                    "peach",
                  ],
                  [Users, t("customersCount"), data.customers.length, "blue"],
                ].map(([Icon, label, value, color]) => (
                  <div className="stat" key={label}>
                    <div>
                      <span>{label}</span>
                      <span className={`stat-icon ${color}`}>
                        <Icon size={17} />
                      </span>
                    </div>
                    <strong>{String(value).padStart(2, "0")}</strong>
                    <small>
                      {lang === "de"
                        ? "In deinem Workspace"
                        : "In your workspace"}
                    </small>
                  </div>
                ))}
              </div>
              <div className="section-heading">
                <h2>
                  {t("projectOverview")}
                  <span>{data.projects.length}</span>
                </h2>
                <button
                  className="text-button"
                  onClick={() => navigate("projects")}
                >
                  {t("viewAll")}
                  <ArrowUpRight size={15} />
                </button>
              </div>
              <div className="project-grid">
                {data.projects.slice(0, 3).map(projectCard)}
                {!data.projects.length && <Empty>{t("noProjects")}</Empty>}
              </div>
              <div className="section-heading">
                <h2>{t("nextTasks")}</h2>
                <button
                  className="text-button"
                  onClick={() => navigate("tasks")}
                >
                  {t("viewAll")}
                  <ArrowUpRight size={15} />
                </button>
              </div>
              {taskRows(
                [...data.tasks]
                  .filter((t) => t.status !== "done")
                  .sort((a, b) =>
                    (a.due_date || "9999").localeCompare(b.due_date || "9999"),
                  )
                  .slice(0, 6),
              )}
              <div className="workspace-footer">
                <span className="footer-mark">N</span>
                <span>MAKE SPACE FOR GOOD WORK.</span>
                <span>NEXENE OPS · V1</span>
              </div>
            </>
          )}
          {view === "projects" && !selected && (
            <div className="project-grid">
              {projects.map(projectCard)}
              {!projects.length && <Empty>{t("noProjects")}</Empty>}
            </div>
          )}
          {view === "projects" && selected && (
            <>
              <div className="project-meta">
                {selected.logo ? (
                  <img
                    className="project-customer-logo"
                    src={selected.logo}
                    alt={selected.customer_name}
                  />
                ) : (
                  <Avatar
                    name={selected.initials}
                    color={selected.customer_color}
                  />
                )}
                <span>{selected.customer_name}</span>
                <Badge status="progress">{selected.phase}</Badge>
                <span>
                  <CalendarDays size={14} />
                  {fmt(selected.start_date)} — {fmt(selected.due_date)}
                </span>
                {admin && (
                  <select
                    aria-label={t("phase")}
                    value={selected.phase}
                    onChange={(e) =>
                      mutate(`projects/${project}`, "PATCH", {
                        phase: e.target.value,
                      }).catch(() => {})
                    }
                  >
                    {data.phases.map((p) => (
                      <option key={p}>{p}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="project-tabs">
                {[
                  "tasks",
                  "documents",
                  "approvals",
                  "resources",
                  ...(admin ? ["time"] : []),
                ].map((v) => (
                  <button
                    key={v}
                    className={tab === v ? "active" : ""}
                    onClick={() => {
                      if (
                        dirty &&
                        !window.confirm(
                          lang === "de"
                            ? "Änderungen verwerfen?"
                            : "Discard changes?",
                        )
                      )
                        return;
                      setDirty(false);
                      setTab(v);
                    }}
                  >
                    {t(v)}
                  </button>
                ))}
              </div>
              <div className="view-toolbar">
                {tab === "tasks" ? (
                  <div className="view-switch">
                    {[
                      ["list", List],
                      ["board", Columns3],
                      ["calendar", CalendarDays],
                      ["timeline", ChartNoAxesGantt],
                    ].map(([v, Icon]) => (
                      <button
                        className={mode === v ? "active" : ""}
                        key={v}
                        onClick={() => setMode(v)}
                      >
                        <Icon size={15} />
                        {t(v)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span />
                )}
                {admin && (
                  <button
                    className="secondary small"
                    onClick={() =>
                      setModal({
                        type: {
                          tasks: "task",
                          documents: "document",
                          approvals: "approval",
                          resources: "resource",
                          time: "time",
                        }[tab],
                        project_id: project,
                      })
                    }
                  >
                    <Plus size={15} />
                    {t(
                      {
                        tasks: "newTask",
                        documents: "newDoc",
                        approvals: "requestApproval",
                        resources: "newLink",
                        time: "logTime",
                      }[tab],
                    )}
                  </button>
                )}
              </div>
              {tab === "tasks" && taskViews()}
              {tab === "documents" && documentView()}
              {tab === "approvals" && approvalsView()}
              {tab === "resources" && resourcesView()}
              {tab === "time" && admin && timeView()}
            </>
          )}
          {view === "tasks" && (
            <>
              <div className="view-toolbar">
                <div className="view-switch">
                  {[
                    ["list", List],
                    ["board", Columns3],
                    ["calendar", CalendarDays],
                    ["timeline", ChartNoAxesGantt],
                  ].map(([v, Icon]) => (
                    <button
                      className={mode === v ? "active" : ""}
                      key={v}
                      onClick={() => setMode(v)}
                    >
                      <Icon size={15} />
                      {t(v)}
                    </button>
                  ))}
                </div>
                <span>
                  {tasks.length} {t("tasks")}
                </span>
              </div>
              {taskViews()}
            </>
          )}
          {view === "documents" && documentView()}
          {view === "customers" && admin && (
            <div className="customer-grid">
              {data.customers
                .filter((c) => matches(c.name))
                .map((c) => (
                  <div className="customer-card" key={c.id}>
                    {c.logo ? (
                      <img
                        className="customer-logo"
                        alt={c.name}
                        src={c.logo}
                      />
                    ) : (
                      <Avatar name={c.initials} color={c.color} />
                    )}
                    <h3>{c.name}</h3>
                    <p>
                      {
                        data.projects.filter((p) => p.customer_id === c.id)
                          .length
                      }{" "}
                      {t("projects")}
                    </p>
                    <div>
                      {data.projects
                        .filter((p) => p.customer_id === c.id)
                        .map((p) => (
                          <button
                            key={p.id}
                            className="text-button"
                            onClick={() => navigate("projects", p.id)}
                          >
                            {p.name}
                            <ArrowUpRight size={13} />
                          </button>
                        ))}
                    </div>
                    <button
                      className="secondary small"
                      onClick={() =>
                        setModal({ type: "access", customer_id: c.id })
                      }
                    >
                      <Plus size={14} />
                      {t("newAccess")}
                    </button>
                  </div>
                ))}
              {!data.customers.length && <Empty>{t("empty")}</Empty>}
            </div>
          )}
          {view === "settings" && admin && (
            <>
              <div className="section-heading">
                <h2>{t("team")}</h2>
                <button
                  className="secondary"
                  onClick={() => setModal({ type: "access" })}
                >
                  <Plus size={15} />
                  {t("newAccess")}
                </button>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>{t("name")}</th>
                      <th>{t("email")}</th>
                      <th>{t("role")}</th>
                      <th>{t("customer")}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {data.users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <span className="person">
                            <Avatar name={u.name} size="small" />
                            {u.name}
                          </span>
                        </td>
                        <td>{u.email}</td>
                        <td>
                          <Badge>
                            {t(u.role === "admin" ? "admin" : "customerRole")}
                          </Badge>
                        </td>
                        <td>
                          {data.customers.find((c) => c.id === u.customer_id)
                            ?.name || "—"}
                        </td>
                        <td>
                          {u.role === "customer" && u.customer_id && (
                            <button
                              className="text-button danger"
                              onClick={async () => {
                                if (window.confirm(t("revoke") + "?"))
                                  try {
                                    await mutate(`users/${u.id}`, "DELETE");
                                    notify(t("revoked"));
                                  } catch {}
                              }}
                            >
                              {t("revoke")}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="info-box">
                <ShieldCheck size={19} />
                <div>
                  <strong>{t("security")}</strong>
                  <p>
                    {lang === "de"
                      ? "Anmeldelinks sind 15 Minuten gültig und einmalig verwendbar. Alle Admins sehen alle Projekte. Kunden sehen nur die Inhalte ihres Kundenbereichs."
                      : "Sign-in links expire after 15 minutes and can be used once. Admins see all projects. Customers only see their own portal content."}
                  </p>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
      {toast && (
        <div className="toast">
          <Check size={16} />
          {toast}
        </div>
      )}
      {modal && (
        <FormModal
          key={`${modal.type}-${modal.project_id || ""}`}
          modal={modal}
          data={data}
          t={t}
          lang={lang}
          busy={busy}
          onClose={() => setModal(null)}
          onSubmit={async (path, body) => {
            const result = await mutate(path, "POST", body);
            setModal(null);
            if (modal.type === "document") {
              setDocId(result.id);
              setView("documents");
              setDirty(false);
              setDraft(null);
            }
            notify(t("saved"));
          }}
          onDecision={async (body) => {
            await mutate(`approvals/${modal.approval_id}`, "PATCH", body);
            setModal(null);
          }}
        />
      )}
      {task && (
        <div className="drawer-overlay" onClick={() => setTaskId("")}>
          <aside className="task-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-heading">
              <small>{projectOf(task.project_id)?.name}</small>
              <button className="icon-button" onClick={() => setTaskId("")}>
                <X size={20} />
              </button>
            </div>
            <h2>{task.title}</h2>
            {task.description && <p>{task.description}</p>}
            <div className="task-properties">
              <label>
                {t("status")}
                {admin ? (
                  <select
                    value={task.status}
                    onChange={(e) =>
                      mutate(`tasks/${task.id}`, "PATCH", {
                        status: e.target.value,
                      }).catch(() => {})
                    }
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {t(s)}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Badge status={task.status}>{t(task.status)}</Badge>
                )}
              </label>
              {admin && (
                <label>
                  {t("assignee")}
                  <select
                    value={task.assignee_id || ""}
                    onChange={(e) =>
                      mutate(`tasks/${task.id}`, "PATCH", {
                        assignee_id: e.target.value,
                      }).catch(() => {})
                    }
                  >
                    <option value="">{t("none")}</option>
                    {data.users
                      .filter((u) => u.role === "admin")
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              <label>
                {t("due")}
                {admin ? (
                  <input
                    type="date"
                    value={task.due_date}
                    onChange={(e) =>
                      mutate(`tasks/${task.id}`, "PATCH", {
                        due_date: e.target.value,
                      }).catch(() => {})
                    }
                  />
                ) : (
                  fmt(task.due_date)
                )}
              </label>
              {admin && (
                <label className="inline-check">
                  <input
                    type="checkbox"
                    checked={!!task.visible}
                    onChange={(e) =>
                      mutate(`tasks/${task.id}`, "PATCH", {
                        visible: e.target.checked,
                      }).catch(() => {})
                    }
                  />
                  {t("visible")}
                </label>
              )}
              {task.recurrence && (
                <label>
                  {t("recurrence")}
                  <span>{t(task.recurrence)}</span>
                </label>
              )}
            </div>
            <div className="section-heading">
              <h3>{t("subtasks")}</h3>
              {admin && (
                <button
                  className="text-button"
                  onClick={() =>
                    setModal({
                      type: "task",
                      parent_id: task.id,
                      project_id: task.project_id,
                    })
                  }
                >
                  <Plus size={14} />
                  {t("newSubtask")}
                </button>
              )}
            </div>
            {data.tasks
              .filter((x) => x.parent_id === task.id)
              .map((x) => (
                <button
                  className="subtask"
                  key={x.id}
                  onClick={() => setTaskId(x.id)}
                >
                  <Circle size={14} />
                  {x.title}
                  <Badge status={x.status}>{t(x.status)}</Badge>
                </button>
              ))}
            <div className="section-heading">
              <h3>{t("resources")}</h3>
              {admin && (
                <button
                  className="text-button"
                  onClick={() =>
                    setModal({
                      type: "resource",
                      project_id: task.project_id,
                      task_id: task.id,
                    })
                  }
                >
                  <Plus size={14} />
                  {t("newLink")}
                </button>
              )}
            </div>
            <div className="task-links">
              {data.attachments
                .filter((a) => a.task_id === task.id)
                .map((a) => (
                  <a
                    key={a.id}
                    href={a.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Link2 size={14} />
                    {a.title}
                    <ArrowUpRight size={13} />
                  </a>
                ))}
            </div>
            <h3 className="comments-title">{t("comments")}</h3>
            {data.comments
              .filter((c) => c.task_id === task.id)
              .map((c) => (
                <div className="comment" key={c.id}>
                  <Avatar name={c.author} size="small" />
                  <div>
                    <strong>{c.author}</strong>
                    <small>
                      {fmt(c.created_at)} ·{" "}
                      {t(c.visible ? "shared" : "internal")}
                    </small>
                    <p>{c.body}</p>
                  </div>
                </div>
              ))}
            <form
              className="comment-form"
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget,
                  body = new FormData(form);
                try {
                  await mutate("comments", "POST", {
                    task_id: task.id,
                    body: body.get("body"),
                    visible: body.get("visible") === "on",
                  });
                  form.reset();
                } catch {}
              }}
            >
              <textarea
                name="body"
                placeholder={t("comment")}
                required
                maxLength={10000}
              />
              <div>
                {admin && (
                  <label className="inline-check">
                    <input name="visible" type="checkbox" />
                    {t("visible")}
                  </label>
                )}
                <button className="primary small" disabled={busy}>
                  {t("send")}
                  <ArrowUpRight size={14} />
                </button>
              </div>
            </form>
          </aside>
        </div>
      )}
    </div>
  );
}

function FormModal({
  modal: m,
  data,
  t,
  lang,
  busy,
  onClose,
  onSubmit,
  onDecision,
}) {
  const [error, setError] = useState(""),
    [role, setRole] = useState("customer"),
    [project, setProject] = useState(
      m.project_id || data.projects[0]?.id || "",
    ),
    [template, setTemplate] = useState("");
  const type = m.type;
  const titles = {
    project: "newProject",
    customer: "newCustomer",
    task: m.parent_id ? "newSubtask" : "newTask",
    document: "newDoc",
    access: "newAccess",
    resource: "newLink",
    time: "logTime",
    approval: "requestApproval",
    decision: m.status === "approved" ? "approve" : "requestChanges",
  };
  const field = (name, label, kind = "text", required = false, value) => (
    <label>
      {t(label)}
      <input
        name={name}
        type={kind}
        required={required}
        defaultValue={value}
        {...(kind === "number"
          ? { min: 0, step: name === "minutes" ? 1 : 0.01 }
          : {})}
      />
    </label>
  );
  const projectSelect = (
    <label>
      {t("project")}
      <select
        name="project_id"
        value={project}
        onChange={(e) => setProject(e.target.value)}
        required
      >
        <option value="">—</option>
        {data.projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
  const visible = (
    <label className="inline-check">
      <input type="checkbox" name="visible" />
      {t("visible")}
    </label>
  );
  return (
    <div className="modal-overlay" onClick={onClose}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-heading">
          <h2 id="modal-title">{t(titles[type])}</h2>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            const f = new FormData(e.currentTarget),
              body = Object.fromEntries(f.entries());
            body.visible = f.get("visible") === "on";
            try {
              if (type === "decision") {
                await onDecision({ status: m.status, feedback: body.feedback });
                return;
              }
              let path = {
                project: "projects",
                customer: "customers",
                task: "tasks",
                document: "documents",
                access: "users",
                resource: "resources",
                time: "time",
                approval: "approvals",
              }[type];
              if (m.parent_id) body.parent_id = m.parent_id;
              if (m.task_id) {
                body.task_id = m.task_id;
                path = "attachments";
              }
              if (type === "project") body.template = true;
              if (type === "document") {
                body.is_template = f.get("is_template") === "on";
                if (template)
                  body.content = data.documents.find(
                    (d) => d.id === template,
                  )?.content;
              }
              await onSubmit(path, body);
            } catch (e) {
              setError(e.message);
            }
          }}
        >
          {type === "customer" && (
            <>
              {field("name", "name", "text", true)}
              {field("logo", "logo", "url")}
            </>
          )}
          {type === "project" && (
            <>
              <label>
                {t("customer")}
                <select
                  name="customer_id"
                  required
                  defaultValue={data.customers[0]?.id || ""}
                >
                  <option value="">—</option>
                  {data.customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              {!data.customers.length && (
                <p className="form-note">
                  {lang === "de"
                    ? "Lege zuerst unter Kunden einen Kunden an."
                    : "Create a customer first."}
                </p>
              )}
              {field("name", "name", "text", true)}
              <label>
                {t("description")}
                <textarea name="description" />
              </label>
              <div className="form-grid">
                {field("start_date", "start", "date", true, today())}
                {field("due_date", "end", "date", true)}
              </div>
              <label>
                {t("pricing")}
                <select name="pricing">
                  <option value="fixed">{t("fixed")}</option>
                  <option value="hourly">{t("hourly")}</option>
                </select>
              </label>
              <div className="form-grid">
                {field("budget", "budget", "number", false, 0)}
                {field("hours_budget", "hours", "number", false, 0)}
              </div>
            </>
          )}
          {type === "task" && (
            <>
              {projectSelect}
              {field("title", "title", "text", true)}
              <label>
                {t("description")}
                <textarea name="description" />
              </label>
              <div className="form-grid">
                <label>
                  {t("assignee")}
                  <select name="assignee_id">
                    <option value="">{t("none")}</option>
                    {data.users
                      .filter((u) => u.role === "admin")
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                  </select>
                </label>
                <label>
                  {t("priority")}
                  <select name="priority" defaultValue="medium">
                    {["low", "medium", "high"].map((p) => (
                      <option key={p} value={p}>
                        {t(p)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="form-grid">
                {field("start_date", "start", "date")}
                {field("due_date", "due", "date")}
              </div>
              <label>
                {t("recurrence")}
                <select name="recurrence">
                  <option value="">{t("never")}</option>
                  <option value="weekly">{t("weekly")}</option>
                  <option value="monthly">{t("monthly")}</option>
                </select>
              </label>
              {visible}
            </>
          )}
          {type === "document" && (
            <>
              {projectSelect}
              {field("title", "title", "text", true)}
              <label>
                {t("parent")}
                <select name="parent_id" defaultValue={m.parent_id || ""}>
                  <option value="">—</option>
                  {data.documents
                    .filter((d) => d.project_id === project)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                {t("fromTemplate")}
                <select
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                >
                  <option value="">{t("blank")}</option>
                  {data.documents
                    .filter((d) => d.is_template)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title}
                      </option>
                    ))}
                </select>
              </label>
              {visible}
              <label className="inline-check">
                <input type="checkbox" name="is_template" />
                {t("template")}
              </label>
            </>
          )}
          {type === "access" && (
            <>
              {field("name", "name", "text", true)}
              {field("email", "email", "email", true)}
              <label>
                {t("role")}
                <select
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="customer">{t("customerRole")}</option>
                  <option value="admin">{t("admin")}</option>
                </select>
              </label>
              {role === "customer" && (
                <label>
                  {t("customer")}
                  <select
                    name="customer_id"
                    required
                    defaultValue={m.customer_id || ""}
                  >
                    <option value="">—</option>
                    {data.customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <p className="form-note">{t("security")}</p>
            </>
          )}
          {type === "resource" && (
            <>
              {projectSelect}
              {field("title", "title", "text", true)}
              {field("url", "URL", "url", true)}
              {visible}
            </>
          )}
          {type === "time" && (
            <>
              {projectSelect}
              <div className="form-grid">
                {field("date", "date", "date", true, today())}
                {field("minutes", "minutes", "number", true, 60)}
              </div>
              {field("note", "note")}
            </>
          )}
          {type === "approval" && (
            <>
              {projectSelect}
              {field("title", "title", "text", true)}
              {field("reference", "reference", "text", true)}
              <p className="form-note">{t("versionNote")}</p>
            </>
          )}
          {type === "decision" && (
            <label>
              {t("feedback")}
              <textarea name="feedback" required={m.status === "changes"} />
            </label>
          )}
          {error && <div className="error">{error}</div>}
          <div className="modal-footer">
            <button className="secondary" type="button" onClick={onClose}>
              {t("cancel")}
            </button>
            <button className="primary" disabled={busy}>
              {busy ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                t(type === "decision" ? titles[type] : "create")
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
