import type { JSONContent } from "@tiptap/react";
export type Locale = "de" | "en";
export type View =
  "overview" | "projects" | "tasks" | "documents" | "customers" | "settings";
export type ProjectTab =
  "tasks" | "documents" | "approvals" | "resources" | "time" | "reports";
export type TaskMode = "list" | "board" | "calendar" | "timeline";
export type TaskStatus = "todo" | "progress" | "review" | "done";
export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "customer";
  customer_id: string | null;
}
export interface Customer {
  id: string;
  name: string;
  initials: string;
  color: string;
  logo: string;
}
export interface Project {
  id: string;
  customer_id: string;
  name: string;
  description: string;
  phase: string;
  phase_weights: Record<string, number>;
  progress: number | null;
  project_type: "web" | "seo_geo";
  start_date: string;
  due_date: string;
  budget?: number;
  hours_budget?: number;
  pricing?: "fixed" | "hourly";
  color: string;
  created_at: string;
  customer_name: string;
  initials: string;
  logo: string;
  customer_color: string;
}
export interface Task {
  phase: string;
  id: string;
  project_id: string;
  parent_id: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: "low" | "medium" | "high";
  assignee_id?: string | null;
  start_date: string;
  due_date: string;
  visible: number;
  recurrence: "" | "weekly" | "monthly";
  created_at: string;
}
export interface Document {
  id: string;
  project_id: string;
  parent_id: string | null;
  title: string;
  content: JSONContent;
  visible: number;
  is_template: number;
  updated_at: string;
  revision: number;
}
export interface Comment {
  id: string;
  task_id: string;
  user_id: string;
  body: string;
  visible: number;
  author: string;
  created_at: string;
}
export interface Attachment {
  id: string;
  task_id: string;
  title: string;
  url: string;
  visible: number;
}
export interface Resource {
  id: string;
  project_id: string;
  title: string;
  url: string;
  visible: number;
}
export interface TimeEntry {
  id: string;
  project_id: string;
  user_id: string;
  date: string;
  minutes: number;
  note: string;
}
export interface Approval {
  id: string;
  project_id: string;
  title: string;
  reference: string;
  status: "pending" | "approved" | "changes";
  decision_by: string | null;
  decision_at: string | null;
  decision_name: string | null;
  feedback: string;
  created_at: string;
}
export interface Report {
  id: string;
  project_id: string;
  title: string;
  period: string;
  description: string;
  file_name: string;
  size: number;
  created_at: string;
}
export interface OnboardingAnswers {
  [key: string]:
    string | boolean | Record<string, { status: string; note: string }>;
  accesses: Record<string, { status: string; note: string }>;
}
export interface Onboarding {
  project_id: string;
  status: "draft" | "completed";
  answers: OnboardingAnswers;
  step: number;
  revision: number;
  document_id: string | null;
  completed_at: string | null;
  updated_at: string;
}
export interface WorkspaceState {
  onboarding_email: string;
  onboardings: Onboarding[];
  reports: Report[];
  user: User;
  phases: string[];
  projects: Project[];
  customers: Customer[];
  users: User[];
  tasks: Task[];
  documents: Document[];
  comments: Comment[];
  attachments: Attachment[];
  resources: Resource[];
  time_entries: TimeEntry[];
  approvals: Approval[];
}
export type ModalType =
  | "project"
  | "customer"
  | "task"
  | "document"
  | "access"
  | "resource"
  | "time"
  | "approval"
  | "decision";
export interface ModalConfig {
  type: ModalType;
  project_id?: string;
  customer_id?: string;
  parent_id?: string;
  task_id?: string;
  approval_id?: string;
  status?: "approved" | "changes";
}
export type Translator = (key: string) => string;
export type MutationBody = Record<string, unknown>;
export interface MutationResult {
  id?: string;
  ok?: boolean;
  message?: string;
  revision?: number;
  document_id?: string;
  completed?: boolean;
}
