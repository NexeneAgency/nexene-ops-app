import { resolve } from "node:path";
import { db, uid } from "./db.mjs";
import { reportsMigration } from "./report-storage.mjs";
import { phaseMigration } from "./project-phases.mjs";
import { schema } from "./schema.mjs";

let connection;
export class DatabaseConfigurationError extends Error {
  constructor(message) {
    super(message);
    this.status = 503;
  }
}
export function databaseConfiguration(env = process.env) {
  const url = env.TURSO_DATABASE_URL;
  if (env.VERCEL && (!url || !/^(libsql|https):\/\//.test(url)))
    throw new DatabaseConfigurationError(
      "Set TURSO_DATABASE_URL to a remote Turso database for Vercel.",
    );
  if (url && !url.startsWith("file:") && !env.TURSO_AUTH_TOKEN)
    throw new DatabaseConfigurationError(
      "Set TURSO_AUTH_TOKEN for the remote database.",
    );
  return { url, authToken: env.TURSO_AUTH_TOKEN };
}
const rows = (result) =>
  result.rows.map((row) =>
    Object.fromEntries(
      result.columns.map((column, index) => [column, row[index]]),
    ),
  );
export class SqlDatabase {
  constructor(client, { transaction = false, driver = "libsql" } = {}) {
    this.client = client;
    this.inTransaction = transaction;
    this.driver = driver;
  }
  prepare(sql) {
    const execute = (args) => this.client.execute({ sql, args });
    return {
      all: async (...args) => rows(await execute(args)),
      get: async (...args) => rows(await execute(args))[0],
      run: async (...args) => {
        const result = await execute(args);
        return {
          changes: result.rowsAffected,
          lastInsertRowid: result.lastInsertRowid,
        };
      },
    };
  }
  async exec(sql) {
    await this.client.executeMultiple(sql);
  }
  async transaction(work) {
    if (this.inTransaction)
      throw new Error("Nested transactions are not supported.");
    const transaction = await this.client.transaction("write");
    try {
      const result = await work(
        new SqlDatabase(transaction, {
          transaction: true,
          driver: this.driver,
        }),
      );
      await transaction.commit();
      return result;
    } catch (error) {
      try {
        await transaction.rollback();
      } catch {}
      throw error;
    } finally {
      transaction.close();
    }
  }
  close() {
    this.client.close();
  }
}
export async function initializeDatabase(sql) {
  await sql.transaction(async (tx) => {
    await tx.exec(schema);
    if (
      !(await tx
        .prepare("SELECT version FROM schema_migrations WHERE version=2")
        .get())
    ) {
      await tx
        .prepare(
          "ALTER TABLE documents ADD COLUMN revision INTEGER NOT NULL DEFAULT 1",
        )
        .run();
      await tx.prepare("INSERT INTO schema_migrations VALUES(2)").run();
    }
    if (
      !(await tx
        .prepare("SELECT version FROM schema_migrations WHERE version=3")
        .get())
    )
      await tx.exec(phaseMigration);
    if (
      !(await tx
        .prepare("SELECT version FROM schema_migrations WHERE version=4")
        .get())
    )
      await tx.exec(reportsMigration);
    for (const email of (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((x) => x.trim().toLowerCase())
      .filter(Boolean)) {
      await tx
        .prepare(
          "INSERT OR IGNORE INTO users(id,email,name,role) VALUES(?,?,?,'admin')",
        )
        .run(uid(), email, email.split("@")[0]);
    }
  });
}
export async function database() {
  const configuration = databaseConfiguration();
  if (!connection) {
    connection = (async () => {
      let url = configuration.url;
      if (!url) {
        db();
        url = `file:${resolve(process.env.DATA_DIR || "./data", "ops.sqlite")}`;
      }
      const { createClient } = await import("@libsql/client");
      const client = createClient({
        url,
        authToken: configuration.authToken,
        intMode: "number",
      });
      const sql = new SqlDatabase(client, {
        driver: configuration.url ? "libsql" : "sqlite",
      });
      try {
        if (configuration.url) await initializeDatabase(sql);
        return sql;
      } catch (error) {
        client.close();
        throw error;
      }
    })().catch((error) => {
      connection = undefined;
      throw error;
    });
  }
  return connection;
}
export async function closeDatabase() {
  const current = connection;
  connection = undefined;
  if (current) (await current).close();
}
