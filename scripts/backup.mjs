import { DatabaseSync, backup } from "node:sqlite";
import { mkdirSync, existsSync } from "node:fs";
import { resolve } from "node:path";
if (process.env.TURSO_DATABASE_URL)
  throw new Error(
    "This command backs up local SQLite only. Use the backup/export facilities of the connected Turso database.",
  );
const source = resolve(process.env.DATA_DIR || "./data", "ops.sqlite");
if (!existsSync(source))
  throw new Error("Database not found. Start the application first.");
const directory = resolve(process.env.BACKUP_DIR || "./backups");
mkdirSync(directory, { recursive: true, mode: 0o700 });
const destination = resolve(
  directory,
  `ops-${new Date().toISOString().replaceAll(":", "-")}.sqlite`,
);
const sql = new DatabaseSync(source);
await backup(sql, destination);
const saved = new DatabaseSync(destination, { readOnly: true });
if (saved.prepare("PRAGMA integrity_check").get().integrity_check !== "ok")
  throw new Error("Backup verification failed");
saved.close();
sql.close();
console.info(destination);
