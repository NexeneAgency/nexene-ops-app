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
    `${base}/?token=${tokenFor(sql.prepare("SELECT id FROM users WHERE role='admin' AND deleted_at IS NULL LIMIT 1").get().id)}`,
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
  const customer = await post("customers", { name: "Access menu customer" }),
    email = `menu-${randomBytes(3).toString("hex")}@customer.test`;
  const user = await post("users", {
    name: "Access menu contact",
    email,
    customer_id: customer.id,
  });
  await page.reload();
  await page
    .getByRole("button", { name: "Einstellungen", exact: true })
    .click();
  await page
    .getByRole("columnheader", { name: "Letztes Login", exact: true })
    .waitFor();
  let row = page.locator(".access-table tbody tr").filter({ hasText: email });
  await row.getByText("Noch nie angemeldet", { exact: true }).waitFor();
  const trigger = row.getByRole("button", {
    name: `Aktionen für ${email}`,
    exact: true,
  });
  await trigger.click();
  await page
    .getByRole("menuitem", { name: "Bearbeiten", exact: true })
    .waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("menu").count(), 0);
  assert.equal(
    await trigger.evaluate((el) => el === document.activeElement),
    true,
  );
  await trigger.click();
  await page.getByRole("menuitem", { name: "Bearbeiten", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Name", { exact: true }).fill("Renamed contact");
  const scan = async (label) => {
    const r = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    assert.deepEqual(
      r.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      [],
      label,
    );
  };
  await scan("edit access");
  await dialog.getByRole("button", { name: "Speichern", exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
  await row.locator(".person").filter({ hasText: "Renamed contact" }).waitFor();
  const portalContext = await browser.newContext(),
    portal = await portalContext.newPage();
  await portal.goto(`${base}/?token=${tokenFor(user.id)}`);
  await portal
    .getByRole("heading", {
      name: "Dein Projekt wird vorbereitet",
      exact: true,
    })
    .waitFor();
  await page.reload();
  await page
    .getByRole("button", { name: "Einstellungen", exact: true })
    .click();
  row = page.locator(".access-table tbody tr").filter({ hasText: email });
  assert.notEqual(
    (await row.locator("td").nth(4).textContent()).trim(),
    "Noch nie angemeldet",
  );
  await row
    .getByRole("button", { name: `Aktionen für ${email}`, exact: true })
    .click();
  await scan("access menu");
  await page.getByRole("menuitem", { name: "Löschen", exact: true }).click();
  await scan("delete access");
  await dialog
    .getByRole("button", { name: "Zugang löschen", exact: true })
    .click();
  await dialog.waitFor({ state: "hidden" });
  assert.equal(
    await page
      .locator(".access-table tbody tr")
      .filter({ hasText: email })
      .count(),
    0,
  );
  await portal.reload();
  await portal
    .getByRole("button", { name: "Anmeldelink senden", exact: true })
    .waitFor();
  console.log(
    "V1.6 passed: never/last login, keyboard menu, edit, confirmed deletion, revoked sessions and three accessible states.",
  );
  await portalContext.close();
} finally {
  await browser.close();
  sql.close();
}
