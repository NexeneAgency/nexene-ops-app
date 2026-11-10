// Customer portal and PDF publishing use isolated test data only.
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { DatabaseSync } from "node:sqlite";
import { randomBytes, createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
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
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
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
  const customer = await post("customers", { name: "SEO portal customer" });
  const project = await post("projects", {
    customer_id: customer.id,
    name: "SEO + GEO test engagement",
    project_type: "seo_geo",
  });
  const contact = await post("users", {
    name: "SEO contact",
    email: `seo-${randomBytes(3).toString("hex")}@customer.test`,
    customer_id: customer.id,
  });
  await page.reload();
  await page
    .getByRole("button", { name: "Projekte", exact: true })
    .first()
    .click();
  const card = page.locator(".project-card").filter({
    has: page.getByRole("heading", {
      name: "SEO + GEO test engagement",
      exact: true,
    }),
  });
  assert.equal(await card.locator(".progress-bar,.progress-label").count(), 0);
  await card.click();
  await page.getByRole("heading", { name: "Reports", exact: true }).waitFor();
  assert.equal(await page.locator(".project-progress-summary").count(), 0);
  const form = page.locator(".report-upload");
  await form.getByLabel("Titel", { exact: true }).fill("SEO + GEO November");
  await form.getByLabel("Berichtsmonat", { exact: true }).fill("2026-11");
  const pdf = Buffer.from(
    "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF\n",
  );
  await form.getByLabel("PDF-Datei", { exact: true }).setInputFiles({
    name: "seo-november.pdf",
    mimeType: "application/pdf",
    buffer: pdf,
  });
  await form
    .getByRole("button", { name: "PDF veröffentlichen", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "SEO + GEO November", exact: true })
    .waitFor();
  const customerContext = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    }),
    portal = await customerContext.newPage();
  await portal.goto(`${base}/?token=${tokenFor(contact.id)}`);
  await portal
    .getByRole("heading", { name: "SEO + GEO test engagement", exact: true })
    .waitFor();
  await portal
    .getByRole("heading", { name: "SEO + GEO November", exact: true })
    .waitFor();
  assert.equal(
    await portal
      .locator(
        ".sidebar,.topbar,.back-button,.search-row,.project-progress-summary,.view-switch",
      )
      .count(),
    0,
  );
  assert.equal(await portal.locator(".report-upload").count(), 0);
  assert.equal(
    await portal
      .getByRole("button", {
        name: "Report entfernen: SEO + GEO November",
        exact: true,
      })
      .count(),
    0,
  );
  const [download] = await Promise.all([
    portal.waitForEvent("download"),
    portal
      .getByRole("link", {
        name: "PDF herunterladen: SEO + GEO November",
        exact: true,
      })
      .click(),
  ]);
  assert.equal(download.suggestedFilename(), "seo-november.pdf");
  assert.deepEqual(readFileSync(await download.path()), pdf);
  await portal.reload();
  await portal
    .getByRole("heading", { name: "SEO + GEO November", exact: true })
    .waitFor();
  for (const width of [1440, 800]) {
    await portal.setViewportSize({ width, height: 1000 });
    const a11y = await new AxeBuilder({ page: portal })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    assert.deepEqual(
      a11y.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      [],
      `SEO portal ${width}`,
    );
  }
  await portal.setViewportSize({ width: 1440, height: 1000 });
  await portal.screenshot({
    path: resolve("test-results/screenshots/v1.3-seo-portal.png"),
    fullPage: true,
  });
  await portal
    .getByRole("button", { name: "Sprache wechseln: Englisch", exact: true })
    .click();
  await portal
    .getByRole("link", {
      name: "Download PDF: SEO + GEO November",
      exact: true,
    })
    .waitFor();
  const doc = await post("documents", {
    project_id: project.id,
    title: "Portal document",
    visible: true,
  });
  await portal.goto(`${base}/?doc=${doc.id}`);
  await portal
    .getByRole("heading", { name: "Portal document", exact: true })
    .waitFor();
  assert.equal(
    await portal.locator(".sidebar,.topbar,.back-button,.search-row").count(),
    0,
  );
  assert.equal(
    await portal.locator(".portal-project-heading h1").textContent(),
    "SEO + GEO test engagement",
  );
  assert.equal(
    await portal
      .getByRole("button", { name: "Delete project", exact: true })
      .count(),
    0,
  );
  await page
    .getByRole("button", { name: "Projekt löschen", exact: true })
    .click();
  const deletion = page.getByRole("dialog");
  const confirm = deletion.getByLabel(
    "Zum Bestätigen den vollständigen Projektnamen eingeben",
    { exact: true },
  );
  await confirm.fill("Wrong name");
  assert.equal(
    await deletion
      .getByRole("button", { name: "Dauerhaft löschen", exact: true })
      .isDisabled(),
    true,
  );
  await confirm.fill("SEO + GEO test engagement");
  const deletionA11y = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  assert.deepEqual(
    deletionA11y.violations.map((v) => v.id),
    [],
  );
  await deletion
    .getByRole("button", { name: "Dauerhaft löschen", exact: true })
    .click();
  await page.getByRole("heading", { name: "Projekte.", exact: true }).waitFor();
  assert.equal(
    await page
      .locator(".project-card")
      .filter({
        has: page.getByRole("heading", {
          name: "SEO + GEO test engagement",
          exact: true,
        }),
      })
      .count(),
    0,
  );
  await portal.reload();
  await portal
    .getByRole("heading", {
      name: "Your project is being prepared",
      exact: true,
    })
    .waitFor();
  assert.deepEqual(errors, []);
  console.log(
    "V1.3 passed: direct customer portal, no admin navigation, recurring SEO without progress, PDF publishing, private download, refresh, DE/EN and two accessible portal widths.",
  );
  await customerContext.close();
} finally {
  await browser.close();
  sql.close();
}
