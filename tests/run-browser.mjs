import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import next from "next";
const directory = mkdtempSync(resolve(tmpdir(), "nexene-browser-"));
const port = Number(process.env.TEST_PORT || 3030),
  base = `http://localhost:${port}`;
Object.assign(process.env, {
  DATA_DIR: directory,
  ADMIN_EMAILS: "admin@nexene.test",
  SEED_DEMO: "true",
  APP_URL: base,
  DEV_MAIL_LOG: "true",
  TEST_DATA_DIR: directory,
  TEST_BASE_URL: base,
  NEXENE_BUILD_DIR: ".next-browser-tests",
});
const app = next({ dev: true, dir: process.cwd() });
let server;
try {
  await app.prepare();
  server = createServer(app.getRequestHandler());
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", resolve);
  });
  await fetch(`${base}/api/health`);
  for (const script of [
    "tests/browser.mjs",
    "tests/v11-browser.mjs",
    "tests/v13-browser.mjs",
    "tests/v14-browser.mjs",
    "tests/v16-browser.mjs",
    "tests/accessibility.mjs",
  ]) {
    const exit = await new Promise((resolve) => {
      const child = spawn(process.execPath, [script], {
        stdio: "inherit",
        env: process.env,
      });
      child.on("exit", resolve);
      child.on("error", () => resolve(1));
    });
    if (exit !== 0) throw new Error(`${script} failed`);
  }
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  server?.closeAllConnections();
  server?.close();
  await Promise.race([
    app.close(),
    new Promise((resolve) => setTimeout(resolve, 2000)),
  ]);
  rmSync(directory, { recursive: true, force: true });
}
process.exit(process.exitCode || 0);
