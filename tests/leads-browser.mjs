import { chromium, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { DatabaseSync } from "node:sqlite";
import { randomBytes, createHash } from "node:crypto";
import { resolve } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL;
if (!base || !process.env.TEST_DATA_DIR)
  throw new Error("Use npm run test:browser");
const sql = new DatabaseSync(resolve(process.env.TEST_DATA_DIR, "ops.sqlite"));
const token = randomBytes(32).toString("hex");
sql
  .prepare("INSERT INTO auth_tokens VALUES(?,?,?)")
  .run(
    createHash("sha256").update(token).digest("hex"),
    sql
      .prepare(
        "SELECT id FROM users WHERE role='admin' AND deleted_at IS NULL LIMIT 1",
      )
      .get().id,
    Date.now() + 60000,
  );
const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH ||
    (existsSync("/usr/bin/chromium")
      ? "/usr/bin/chromium"
      : chromium.executablePath()),
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`${base}/?token=${token}`);
  await page
    .getByRole("heading", { name: "Alles im Blick.", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Leads", exact: true })
    .click({ timeout: 10000 });
  await page.getByRole("button", { name: "Neuer Lead", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog
    .getByLabel("Firmenname", { exact: true })
    .fill("CRM Browsertest GmbH");
  await dialog
    .getByLabel("Website", { exact: true })
    .fill("https://example.test");
  await dialog
    .getByLabel("Warum passt der Lead?", { exact: true })
    .fill("Veraltete Website, klarer Bedarf.");
  await dialog.getByLabel("Kontaktname", { exact: true }).fill("Test Person");
  await dialog.getByLabel("E-Mail", { exact: true }).fill("crm@example.test");
  await dialog.getByLabel("E-Mail verifiziert", { exact: true }).check();
  await dialog
    .getByLabel("Quelle", { exact: true })
    .fill("Manueller lokaler Test");
  await dialog
    .getByLabel("E-Mail-Entwurf", { exact: true })
    .fill("Nur ein Entwurf. Nicht versenden.");
  await dialog.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const row = page.getByRole("row").filter({ hasText: "CRM Browsertest GmbH" });
  await expect(row).toContainText("crm@example.test");
  await expect(row).toContainText("Verifiziert");
  const lead = sql
    .prepare("SELECT * FROM leads WHERE company_name=?")
    .get("CRM Browsertest GmbH");
  assert.equal(lead.contact_email_verified, 1);
  assert.equal(lead.outreach_email_draft, "Nur ein Entwurf. Nicht versenden.");
  await row
    .getByLabel("Status für CRM Browsertest GmbH")
    .selectOption("kontaktiert");
  await expect(row.getByLabel("Status für CRM Browsertest GmbH")).toHaveValue(
    "kontaktiert",
  );
  await page.getByLabel("Lead-Status filtern").selectOption("neu");
  await expect(row).toHaveCount(0);
  await page.getByLabel("Lead-Status filtern").selectOption("kontaktiert");
  await expect(row).toHaveCount(1);
  await row.getByRole("button", { name: "Bearbeiten", exact: true }).click();
  await expect(
    dialog.getByLabel("E-Mail-Entwurf", { exact: true }),
  ).toHaveValue("Nur ein Entwurf. Nicht versenden.");
  await dialog.getByLabel("Kontaktname", { exact: true }).fill("Geändert");
  await dialog.getByRole("button", { name: "Speichern", exact: true }).click();
  await expect(row).toContainText("Geändert");
  await page.reload();
  await page.getByRole("button", { name: "Leads", exact: true }).click();
  await expect(row).toContainText("Geändert");
  const scan = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  assert.deepEqual(
    scan.violations.map((v) => v.id),
    [],
  );
  mkdirSync("test-artifacts", { recursive: true });
  await page.screenshot({
    path: "test-artifacts/leads-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "test-artifacts/leads-mobile.png",
    fullPage: true,
  });
  await row.getByRole("button", { name: "Löschen", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Lead löschen", exact: true })
    .click();
  await expect(row).toHaveCount(0);
  assert.equal(
    sql.prepare("SELECT id FROM leads WHERE id=?").get(lead.id),
    undefined,
  );
  assert.deepEqual(errors, []);
  console.log(
    "Leads browser: persisted create/read/edit/status/filter/delete, reload, axe and screenshots PASS",
  );
} finally {
  await browser.close();
  sql.close();
}
