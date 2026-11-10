// Guided onboarding is tested only against the isolated development database.
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { DatabaseSync } from "node:sqlite";
import { randomBytes, createHash } from "node:crypto";
import { resolve } from "node:path";
import { existsSync } from "node:fs";
import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL;
if (!base || !process.env.TEST_DATA_DIR)
  throw new Error("Use npm run test:browser");
const sql = new DatabaseSync(resolve(process.env.TEST_DATA_DIR, "ops.sqlite"));
const tokenFor = (id) => {
  const token = randomBytes(32).toString("hex");
  sql
    .prepare("INSERT INTO auth_tokens VALUES(?,?,?)")
    .run(
      createHash("sha256").update(token).digest("hex"),
      id,
      Date.now() + 60000,
    );
  return token;
};
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
    }),
    page = await context.newPage();
  await page.goto(
    `${base}/?token=${tokenFor(sql.prepare("SELECT id FROM users WHERE role='admin' LIMIT 1").get().id)}`,
  );
  await page
    .getByRole("heading", { name: "Alles im Blick.", exact: true })
    .waitFor();
  const post = async (path, body) =>
    page.evaluate(
      async ({ path, body }) => {
        const r = await fetch("/api/" + path, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      },
      { path, body },
    );
  const customer = await post("customers", { name: "Onboarding customer" });
  const project = await post("projects", {
    customer_id: customer.id,
    name: "Guided SEO onboarding",
    project_type: "seo_geo",
  });
  const contact = await post("users", {
    name: "Onboarding contact",
    email: `onboarding-${randomBytes(3).toString("hex")}@customer.test`,
    customer_id: customer.id,
  });
  const portalContext = await browser.newContext({
      viewport: { width: 1440, height: 1080 },
    }),
    portal = await portalContext.newPage();
  await portal.goto(`${base}/?token=${tokenFor(contact.id)}`);
  await portal
    .getByRole("button", { name: "Onboarding starten", exact: true })
    .click();
  let dialog = portal.getByRole("dialog");
  const scan = async (name) => {
    const result = await new AxeBuilder({ page: portal })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    assert.deepEqual(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      [],
      name,
    );
  };
  await dialog.locator('[name="website"]').fill("https://example.com");
  await dialog.locator('[name="platform"]').fill("WordPress");
  await scan("onboarding contact");
  await dialog.getByRole("button", { name: "Weiter", exact: true }).click();
  await dialog
    .getByRole("button", { name: "Speichern und schließen", exact: true })
    .last()
    .click();
  await dialog.waitFor({ state: "hidden" });
  await portal.reload();
  await portal
    .getByRole("button", { name: "Onboarding fortsetzen", exact: true })
    .click();
  dialog = portal.getByRole("dialog");
  await dialog.locator('[name="goals"]').fill("More qualified enquiries");
  await dialog.locator('[name="services"]').fill("Health services");
  await dialog.locator('[name="audience"]').fill("Local clients");
  await dialog
    .getByLabel("Wir haben einen lokalen Standort oder ein Einzugsgebiet", {
      exact: true,
    })
    .check();
  await dialog.getByRole("button", { name: "Weiter", exact: true }).click();
  await dialog
    .getByRole("heading", { name: "Google Unternehmensprofil", exact: true })
    .waitFor();
  for (const select of await dialog.locator("select").all())
    await select.selectOption("invited");
  await scan("onboarding access");
  await portal.screenshot({
    path: resolve("test-results/screenshots/v1.4-onboarding-access.png"),
    fullPage: true,
  });
  await dialog.getByRole("button", { name: "Weiter", exact: true }).click();
  await dialog
    .locator('[name="content_links"]')
    .fill("https://example.com/assets");
  await dialog.getByRole("button", { name: "Weiter", exact: true }).click();
  await dialog
    .getByLabel(
      "Ich habe die Angaben geprüft und keine Passwörter oder geheimen Schlüssel eingetragen.",
      { exact: true },
    )
    .check();
  await scan("onboarding review");
  await dialog
    .getByRole("button", { name: "Onboarding abschließen", exact: true })
    .click();
  await dialog.waitFor({ state: "hidden" });
  await portal
    .getByRole("heading", {
      name: "Onboarding: Guided SEO onboarding",
      exact: true,
    })
    .waitFor();
  await portal
    .getByRole("button", { name: "Onboarding abgeschlossen", exact: true })
    .waitFor();
  const state = await portal.evaluate(
    async () => await (await fetch("/api/state")).json(),
  );
  const row = state.onboardings.find((row) => row.project_id === project.id);
  assert.equal(row.status, "completed");
  assert.equal(
    state.documents.filter((doc) => doc.id === row.document_id).length,
    1,
  );
  assert.match(
    JSON.stringify(
      state.documents.find((doc) => doc.id === row.document_id).content,
    ),
    /More qualified enquiries/,
  );
  await portal.reload();
  await portal
    .getByRole("button", { name: "Onboarding abgeschlossen", exact: true })
    .click();
  await portal
    .getByRole("heading", {
      name: "Onboarding: Guided SEO onboarding",
      exact: true,
    })
    .waitFor();
  await portal
    .getByRole("button", { name: "Sprache wechseln: Englisch", exact: true })
    .click();
  await portal
    .getByRole("button", { name: "Onboarding completed", exact: true })
    .waitFor();
  console.log(
    "V1.4 passed: guided customer flow, draft/resume, conditional local access, review, exactly one shared document, completed button, reload, DE/EN and accessible wizard states.",
  );
  await portalContext.close();
} finally {
  await browser.close();
  sql.close();
}
