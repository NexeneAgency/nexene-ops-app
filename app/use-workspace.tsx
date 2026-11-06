"use client";
import {
  CheckSquare,
  FileText,
  FolderKanban,
  Globe,
  LayoutDashboard,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { JSONContent } from "@tiptap/react";
import type { LucideIcon } from "lucide-react";
import { api, ApiError, errorMessage } from "../lib/client";
import { words } from "../lib/i18n";
import type {
  Locale,
  ModalConfig,
  MutationBody,
  ProjectTab,
  TaskMode,
  View,
  WorkspaceState,
} from "../lib/types";
const empty: WorkspaceState = {
  user: { id: "", name: "", email: "", role: "customer", customer_id: null },
  phases: [],
  projects: [],
  tasks: [],
  documents: [],
  comments: [],
  attachments: [],
  resources: [],
  time_entries: [],
  approvals: [],
  customers: [],
  users: [],
};
export function useWorkspaceController() {
  const initialized = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toastTone, setToastTone] = useState<"success" | "error">("success");
  const [lang, setLang] = useState<Locale>("de"),
    [data, setData] = useState<WorkspaceState | null>(null),
    [loading, setLoading] = useState(true),
    [fatal, setFatal] = useState(""),
    [view, setView] = useState<View>("overview"),
    [project, setProject] = useState(""),
    [tab, setTab] = useState<ProjectTab>("tasks"),
    [mode, setMode] = useState<TaskMode>("list"),
    [query, setQuery] = useState(""),
    [modal, setModal] = useState<ModalConfig | null>(null),
    [taskId, setTaskId] = useState(""),
    [docId, setDocId] = useState(""),
    [toast, setToast] = useState(""),
    [busy, setBusy] = useState(false),
    [email, setEmail] = useState(""),
    [sent, setSent] = useState(false),
    [error, setError] = useState(""),
    [month, setMonth] = useState(new Date()),
    [draft, setDraft] = useState<JSONContent | null>(null),
    [draftRevision, setDraftRevision] = useState<number | null>(null),
    [dirty, setDirty] = useState(false);
  const t = (key: string) => words[lang][key] || key,
    admin = data?.user.role === "admin";
  const notify = (message: string, tone: "success" | "error" = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastTone(tone);
    setToast(message);
    if (tone === "success")
      toastTimer.current = setTimeout(() => setToast(""), 5000);
  };
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );
  async function load() {
    try {
      const d = await api<WorkspaceState>("state");
      setData(d);
      setFatal("");
      return d;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setData(null);
      else setFatal(errorMessage(e));
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
          setError(errorMessage(e));
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
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  async function mutate(path: string, method: string, body?: MutationBody) {
    setBusy(true);
    setError("");
    try {
      const result = await api(path, method, body);
      await load();
      return result;
    } catch (e) {
      notify(errorMessage(e), "error");
      throw e;
    } finally {
      setBusy(false);
    }
  }
  function navigate(next: View, p = "") {
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
    setDraftRevision(null);
    setView(next);
    setProject(p);
    setTaskId("");
    setDocId("");
    setQuery("");
  }
  function openDoc(id: string) {
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
  useEffect(() => {
    const heading = document.querySelector<HTMLElement>("#main-content h1");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }, [view, project, data?.user.id]);
  const fmt = (value: string | null | undefined, full = false) =>
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
      aria-label={
        lang === "de" ? "Sprache wechseln: Englisch" : "Change language: German"
      }
      onClick={() => setLang(lang === "de" ? "en" : "de")}
    >
      <Globe size={14} />
      {lang.toUpperCase()}
    </button>
  );

  const state = data ?? empty;
  const projects = state.projects.filter(
    (p) =>
      !query ||
      `${p.name} ${p.customer_name}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const selected = state.projects.find((p) => p.id === project);
  const matches = (text: string) =>
    !query || text.toLowerCase().includes(query.toLowerCase());
  const tasks = state.tasks.filter(
    (x) => (!project || x.project_id === project) && matches(x.title),
  );
  const docs = state.documents.filter(
    (x) => (!project || x.project_id === project) && matches(x.title),
  );
  const doc = state.documents.find((d) => d.id === docId);
  const task = state.tasks.find((d) => d.id === taskId);
  const projectOf = (id: string) => state.projects.find((p) => p.id === id);
  const taskProgress = (id: string) => {
    const all = state.tasks.filter((t) => t.project_id === id);
    return all.length
      ? Math.round(
          (all.filter((t) => t.status === "done").length / all.length) * 100,
        )
      : 0;
  };
  const navItems: [View, LucideIcon][] = [
    ["overview", LayoutDashboard],
    ["projects", FolderKanban],
    ["tasks", CheckSquare],
    ["documents", FileText],
    ...(admin ? [["customers", Users] as [View, LucideIcon]] : []),
  ];

  return {
    draftRevision,
    setDraftRevision,
    toastTone,
    lang,
    setLang,
    data,
    setData,
    loading,
    fatal,
    view,
    setView,
    project,
    setProject,
    tab,
    setTab,
    mode,
    setMode,
    query,
    setQuery,
    modal,
    setModal,
    taskId,
    setTaskId,
    docId,
    setDocId,
    toast,
    setToast,
    busy,
    setBusy,
    email,
    setEmail,
    sent,
    setSent,
    error,
    setError,
    month,
    setMonth,
    draft,
    setDraft,
    dirty,
    setDirty,
    t,
    admin,
    notify,
    load,
    mutate,
    navigate,
    openDoc,
    fmt,
    localeToggle,
    projects,
    selected,
    matches,
    tasks,
    docs,
    doc,
    task,
    projectOf,
    taskProgress,
    navItems,
  };
}
