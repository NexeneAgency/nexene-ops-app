import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { createClient } from "@libsql/client";
import { SqlDatabase, initializeDatabase } from "../lib/database.mjs";

test("migration 7 to 8 preserves records and repeats on SQLite and libSQL", async () => {
  for (const driver of ["sqlite", "libsql"]) {
    const directory = mkdtempSync(join(tmpdir(), "leads-upgrade-"));
    const url = "file:" + join(directory, "ops.sqlite");
    const connect = () => new SqlDatabase(createClient({ url }));
    let sql = connect();
    try {
      await initializeDatabase(sql);
      // Reconstruct the exact pre-8 state: migrations 1–7 and no leads table.
      await sql.exec(
        "DROP TABLE leads; DELETE FROM schema_migrations WHERE version=8;",
      );
      await sql
        .prepare(
          "INSERT INTO customers(id,name,initials) VALUES('legacy','Existing customer','EC')",
        )
        .run();
      sql.close();
      for (let i = 0; i < 2; i++) {
        if (driver === "sqlite") {
          const env = {
            ...process.env,
            DATA_DIR: directory,
            SEED_DEMO: "false",
          };
          delete env.VERCEL;
          delete env.TURSO_DATABASE_URL;
          delete env.TURSO_AUTH_TOKEN;
          execFileSync(
            process.execPath,
            [
              "--input-type=module",
              "-e",
              "import {db} from './lib/db.mjs'; db().close();",
            ],
            { cwd: process.cwd(), env },
          );
        } else {
          const storage = connect();
          try {
            await initializeDatabase(storage);
          } finally {
            storage.close();
          }
        }
      }
      sql = connect();
      assert.equal(
        (
          await sql
            .prepare("SELECT MAX(version) version FROM schema_migrations")
            .get()
        ).version,
        8,
      );
      assert.equal(
        (
          await sql
            .prepare("SELECT name FROM customers WHERE id='legacy'")
            .get()
        ).name,
        "Existing customer",
      );
      await sql
        .prepare(
          "INSERT INTO leads(id,company_name) VALUES('test','Persistent lead')",
        )
        .run();
      sql.close();
      sql = connect();
      assert.equal(
        (await sql.prepare("SELECT status FROM leads WHERE id='test'").get())
          .status,
        "neu",
      );
      await assert.rejects(
        sql.prepare("UPDATE leads SET status='invalid' WHERE id='test'").run(),
      );
      await assert.rejects(
        sql
          .prepare("UPDATE leads SET contact_email_verified=2 WHERE id='test'")
          .run(),
      );
    } finally {
      sql.close();
      rmSync(directory, { recursive: true, force: true });
    }
  }
});
