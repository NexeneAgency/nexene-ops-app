// Exercise v1.1 on an isolated database, never against production.
import { chromium } from "@playwright/test";
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
const admin = sql
  .prepare("SELECT id FROM users WHERE role='admin' LIMIT 1")
  .get();
const token = randomBytes(32).toString("hex");
sql
  .prepare("INSERT INTO auth_tokens VALUES(?,?,?)")
  .run(
    createHash("sha256").update(token).digest("hex"),
    admin.id,
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
  const scan = async (name) => {
    const result = await new AxeBuilder({ page })
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
  await page.goto(`${base}/?token=${token}`);
  await page
    .getByRole("heading", { name: "Alles im Blick.", exact: true })
    .waitFor();
  for (const count of await page.locator(".stat strong").allTextContents())
    assert.match(count, /^(0|[1-9]\d*)$/);
  await page
    .getByRole("button", { name: "Neues Projekt", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  const projectName = `V1.1 browser project ${randomBytes(3).toString("hex")}`;
  await dialog.getByLabel("Name", { exact: true }).fill(projectName);
  await dialog.getByLabel("Kunde", { exact: true }).selectOption("__new__");
  await dialog
    .getByLabel("Kundenname", { exact: true })
    .fill("V1.1 inline customer");
  await dialog.getByLabel("Enddatum", { exact: true }).fill("2027-12-31");
  await scan("inline customer dialog");
  const screenshots = resolve("test-results", "screenshots");
  mkdirSync(screenshots, { recursive: true });
  await page.screenshot({
    path: resolve(screenshots, "v1.1-inline-customer.png"),
    fullPage: true,
  });
  await dialog.getByRole("button", { name: "Erstellen", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await page
    .getByRole("button", { name: "Projekte", exact: true })
    .first()
    .click();
  await page
    .locator(".project-card")
    .filter({
      has: page.getByRole("heading", { name: projectName, exact: true }),
    })
    .click();
  await page
    .getByRole("heading", { name: projectName + ".", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Entwicklung", exact: true }).click();
  const drawer = page.getByRole("dialog");
  await drawer.getByLabel("Status", { exact: true }).selectOption("done");
  await page.waitForFunction(
    () =>
      document.querySelector(".project-progress-summary strong")
        ?.textContent === "30%",
  );
  await drawer.getByRole("button", { name: "Abbrechen", exact: true }).click();
  await page
    .getByRole("button", { name: "Phasen gewichten", exact: true })
    .click();
  await dialog.getByLabel("Entwicklung", { exact: true }).fill("50");
  assert.equal(
    await dialog
      .getByRole("button", { name: "Speichern", exact: true })
      .isDisabled(),
    true,
  );
  await dialog.getByLabel("Design", { exact: true }).fill("0");
  await scan("phase weight dialog");
  await page.screenshot({
    path: resolve(screenshots, "v1.1-phase-weights.png"),
    fullPage: true,
  });
  await dialog.getByRole("button", { name: "Speichern", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  assert.equal(
    await page.locator(".project-progress-summary strong").textContent(),
    "50%",
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Projekte", exact: true })
    .first()
    .click();
  const card = page.locator(".project-card").filter({
    has: page.getByRole("heading", { name: projectName, exact: true }),
  });
  assert.equal(
    await card.locator(".progress-label strong").textContent(),
    "50%",
  );
  await card.click();
  await page
    .getByRole("button", { name: "Sprache wechseln: Englisch", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Set phase weights", exact: true })
    .click();
  await dialog.getByLabel("Development", { exact: true }).waitFor();
  await dialog
    .getByRole("button", { name: "Cancel", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "New task", exact: true })
    .first()
    .click();
  await dialog
    .getByLabel("Project phase", { exact: true })
    .selectOption("Design");
  await dialog
    .getByLabel("Title", { exact: true })
    .fill("Phase assignment from browser");
  await dialog.getByRole("button", { name: "Create", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await page
    .getByText("Phase assignment from browser", { exact: true })
    .click();
  assert.equal(
    await page
      .getByRole("dialog")
      .getByLabel("Project phase", { exact: true })
      .inputValue(),
    "Design",
  );
  const bodyText = await page.locator("body").innerText();
  assert.equal(/[—–]/.test(bodyText), false);
  assert.deepEqual(errors, []);
  console.log(
    "V1.1 browser checks passed: numeric stats, inline customer, phase weights, validation, persistence, DE/EN, phase assignment and two accessible dialogs.",
  );
} finally {
  await browser.close();
  sql.close();
}
