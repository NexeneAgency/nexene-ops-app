import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";

export const uid = () => randomUUID();
export const phases = [
  "Kick-off",
  "Inhalte",
  "Freigabe Inhalte",
  "Design",
  "Freigabe Design",
  "Entwicklung",
  "Abnahme",
  "Launch",
  "Betreuung",
];
let instance;
export function db() {
  if (instance) return instance;
  const dir = resolve(
    /* turbopackIgnore: true */ process.env.DATA_DIR || "./data",
  );
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  instance = new DatabaseSync(resolve(dir, "ops.sqlite"));
  instance.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS schema_migrations(version INTEGER PRIMARY KEY);
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','customer')), customer_id TEXT);
    CREATE TABLE IF NOT EXISTS customers(id TEXT PRIMARY KEY, name TEXT NOT NULL, initials TEXT NOT NULL, color TEXT NOT NULL DEFAULT '#e8defa', logo TEXT NOT NULL DEFAULT '');
    CREATE TABLE IF NOT EXISTS projects(id TEXT PRIMARY KEY, customer_id TEXT NOT NULL REFERENCES customers(id), name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', phase TEXT NOT NULL, start_date TEXT NOT NULL, due_date TEXT NOT NULL, budget REAL NOT NULL DEFAULT 0, hours_budget REAL NOT NULL DEFAULT 0, pricing TEXT NOT NULL DEFAULT 'fixed', color TEXT NOT NULL DEFAULT '#b9a0ed', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS tasks(id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE, parent_id TEXT REFERENCES tasks(id), title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', status TEXT NOT NULL DEFAULT 'todo' CHECK(status IN ('todo','progress','review','done')), priority TEXT NOT NULL DEFAULT 'medium', assignee_id TEXT REFERENCES users(id), start_date TEXT NOT NULL DEFAULT '', due_date TEXT NOT NULL DEFAULT '', visible INTEGER NOT NULL DEFAULT 0, recurrence TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS comments(id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id), body TEXT NOT NULL, visible INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS attachments(id TEXT PRIMARY KEY, task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE, title TEXT NOT NULL, url TEXT NOT NULL, visible INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS documents(id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE, parent_id TEXT REFERENCES documents(id), title TEXT NOT NULL, content TEXT NOT NULL DEFAULT '{}', visible INTEGER NOT NULL DEFAULT 0, is_template INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS resources(id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE, title TEXT NOT NULL, url TEXT NOT NULL, visible INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS time_entries(id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), user_id TEXT NOT NULL REFERENCES users(id), date TEXT NOT NULL, minutes INTEGER NOT NULL CHECK(minutes>0), note TEXT NOT NULL DEFAULT '');
    CREATE TABLE IF NOT EXISTS approvals(id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id), title TEXT NOT NULL, reference TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', decision_by TEXT REFERENCES users(id), decision_at TEXT, feedback TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP);
    CREATE TABLE IF NOT EXISTS auth_tokens(hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS login_limits(key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS task_recurrences(source_id TEXT PRIMARY KEY REFERENCES tasks(id), next_id TEXT NOT NULL REFERENCES tasks(id));
    CREATE INDEX IF NOT EXISTS task_project ON tasks(project_id);
    CREATE INDEX IF NOT EXISTS doc_project ON documents(project_id);
    INSERT OR IGNORE INTO schema_migrations VALUES(1);
  `);
  migrateDocuments(instance);
  for (const email of (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean)) {
    instance
      .prepare(
        "INSERT OR IGNORE INTO users(id,email,name,role) VALUES(?,?,?,'admin')",
      )
      .run(uid(), email, email.split("@")[0]);
  }
  if (
    process.env.SEED_DEMO === "true" &&
    !instance.prepare("SELECT id FROM customers LIMIT 1").get()
  )
    seed(instance);
  return instance;
}
export function migrateDocuments(sql) {
  if (
    !sql.prepare("SELECT version FROM schema_migrations WHERE version=2").get()
  ) {
    sql.exec("BEGIN IMMEDIATE");
    try {
      sql.exec(
        "ALTER TABLE documents ADD COLUMN revision INTEGER NOT NULL DEFAULT 1; INSERT INTO schema_migrations VALUES(2); COMMIT;",
      );
    } catch (error) {
      sql.exec("ROLLBACK");
      throw error;
    }
  }
}
export function seed(sql) {
  const admin = sql
    .prepare("SELECT id FROM users WHERE role='admin' LIMIT 1")
    .get();
  const today = new Date();
  const date = (n) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const samples = [
    ["Studio Nord", "SN", "#e9e1f5", "Website Relaunch", "Design", -12, 25],
    [
      "Forma Architektur",
      "FA",
      "#e3ebdf",
      "Digitaler Markenauftritt",
      "Entwicklung",
      -26,
      12,
    ],
    ["Luma Coffee", "LC", "#f5e8d5", "Shop & Website", "Inhalte", -4, 42],
  ];
  for (const [
    name,
    initials,
    color,
    projectName,
    phase,
    start,
    end,
  ] of samples) {
    const c = uid(),
      p = uid();
    sql
      .prepare("INSERT INTO customers(id,name,initials,color) VALUES(?,?,?,?)")
      .run(c, name, initials, color);
    sql
      .prepare(
        "INSERT INTO projects(id,customer_id,name,description,phase,start_date,due_date,budget,hours_budget,color) VALUES(?,?,?,?,?,?,?,?,?,?)",
      )
      .run(
        p,
        c,
        projectName,
        "Ein klarer digitaler Auftritt. Von der ersten Idee bis zum Launch.",
        phase,
        date(start),
        date(end),
        6500,
        70,
        color,
      );
    [
      "Kick-off & Projektziele",
      "Inhalte strukturieren",
      "Startseite gestalten",
      "Design zur Freigabe vorbereiten",
    ].forEach((title, i) =>
      sql
        .prepare(
          "INSERT INTO tasks(id,project_id,title,status,priority,assignee_id,start_date,due_date,visible) VALUES(?,?,?,?,?,?,?,?,?)",
        )
        .run(
          uid(),
          p,
          title,
          ["done", "done", "progress", "todo"][i],
          i === 2 ? "high" : "medium",
          admin?.id || null,
          date(i - 4),
          date(i + 2),
          i === 3 ? 1 : 0,
        ),
    );
    sql
      .prepare(
        "INSERT INTO documents(id,project_id,title,content,visible) VALUES(?,?,?,?,1)",
      )
      .run(
        uid(),
        p,
        "Willkommen im Projekt",
        JSON.stringify({
          type: "doc",
          content: [
            {
              type: "heading",
              attrs: { level: 1 },
              content: [{ type: "text", text: "Ein guter Start." }],
            },
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Hier findest du den aktuellen Projektstand, wichtige Dokumente und die nächsten Schritte. Wir freuen uns auf die Zusammenarbeit.",
                },
              ],
            },
          ],
        }),
      );
  }
}
