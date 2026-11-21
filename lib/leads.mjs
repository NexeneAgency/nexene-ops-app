import { randomUUID } from "node:crypto";

export const leadStatuses = [
  "neu",
  "kontaktiert",
  "geantwortet",
  "gewonnen",
  "verloren",
];
export const leadsMigration = `
CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL CHECK(length(trim(company_name)) > 0),
  website TEXT NOT NULL DEFAULT '',
  match_reason TEXT NOT NULL DEFAULT '',
  contact_name TEXT NOT NULL DEFAULT '',
  contact_role TEXT NOT NULL DEFAULT '',
  contact_email TEXT NOT NULL DEFAULT '',
  contact_email_verified INTEGER NOT NULL DEFAULT 0 CHECK(contact_email_verified IN (0,1)),
  contact_phone TEXT NOT NULL DEFAULT '',
  contact_phone_verified INTEGER NOT NULL DEFAULT 0 CHECK(contact_phone_verified IN (0,1)),
  source TEXT NOT NULL DEFAULT '',
  outreach_email_draft TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'neu' CHECK(status IN ('neu','kontaktiert','geantwortet','gewonnen','verloren')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX leads_status_created ON leads(status, created_at);
INSERT INTO schema_migrations VALUES(8);
`;
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
const serialize = (row) => ({
  ...row,
  contact_email_verified: !!row.contact_email_verified,
  contact_phone_verified: !!row.contact_phone_verified,
});
const textFields = {
  company_name: 500,
  website: 2000,
  match_reason: 10000,
  contact_name: 500,
  contact_role: 500,
  contact_email: 254,
  contact_phone: 100,
  source: 10000,
  outreach_email_draft: 20000,
};
function values(body) {
  const result = {};
  for (const [field, max] of Object.entries(textFields)) {
    const value = body[field] ?? "";
    if (typeof value !== "string" || value.length > max)
      fail(`Ungültiges Feld: ${field}`);
    result[field] = value.trim();
  }
  if (!result.company_name) fail("Firmenname fehlt.");
  if (result.website) {
    let url;
    try {
      url = new URL(result.website);
    } catch {
      fail("Ungültige Website.");
    }
    if (!["https:", "http:"].includes(url.protocol)) fail("Ungültige Website.");
  }
  if (
    result.contact_email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.contact_email)
  )
    fail("Ungültige E-Mail.");
  for (const field of ["contact_email_verified", "contact_phone_verified"]) {
    const value = body[field] ?? false;
    if (![true, false, 0, 1].includes(value)) fail(`Ungültiges Feld: ${field}`);
    result[field] = value ? 1 : 0;
  }
  result.status = body.status ?? "neu";
  if (!leadStatuses.includes(result.status)) fail("Ungültiger Lead-Status.");
  return result;
}
export async function handleLeads(sql, user, request, body, id, action) {
  if (user.role !== "admin") fail("Nicht erlaubt / Forbidden", 403);
  const method = request.method;
  const read = async (id) => {
    const row = await sql.prepare("SELECT * FROM leads WHERE id=?").get(id);
    if (!row) fail("Lead nicht gefunden.", 404);
    return serialize(row);
  };
  if (!id && !action && method === "POST") {
    const data = values(body),
      id = randomUUID();
    const fields = Object.keys(data);
    await sql
      .prepare(
        `INSERT INTO leads(id,${fields.join(",")}) VALUES(?,${fields.map(() => "?").join(",")})`,
      )
      .run(id, ...Object.values(data));
    return { body: await read(id), status: 201 };
  }
  if (!id && !action && method === "GET") {
    const status = new URL(request.url).searchParams.get("status");
    if (status !== null && !leadStatuses.includes(status))
      fail("Ungültiger Lead-Status.");
    const rows = await sql
      .prepare(
        `SELECT * FROM leads ${status ? "WHERE status=?" : ""} ORDER BY created_at DESC, id DESC`,
      )
      .all(...(status ? [status] : []));
    return { body: rows.map(serialize) };
  }
  if (id && !action && method === "GET") return { body: await read(id) };
  if (
    id &&
    ((!action && method === "PATCH") ||
      (action === "status" && method === "PATCH"))
  ) {
    const previous = await read(id);
    const allowed =
      action === "status"
        ? ["status"]
        : [
            ...Object.keys(textFields),
            "contact_email_verified",
            "contact_phone_verified",
            "status",
          ];
    if (
      !Object.keys(body).length ||
      Object.keys(body).some((key) => !allowed.includes(key))
    )
      fail("Ungültige Lead-Felder.");
    if (action === "status" && !leadStatuses.includes(body.status))
      fail("Ungültiger Lead-Status.");
    const merged = { ...previous, ...body };
    for (const field of ["contact_email", "contact_phone"])
      if (
        field in body &&
        body[field] !== previous[field] &&
        !(field + "_verified" in body)
      )
        merged[field + "_verified"] = false;
    const data = values(merged);
    // Update only submitted fields (plus invalidated verification flags), not a stale full row.
    const fields = Object.keys(data).filter(
      (key) =>
        key in body ||
        (key.endsWith("_verified") && data[key] !== Number(previous[key])),
    );
    await sql
      .prepare(
        `UPDATE leads SET ${fields.map((key) => `${key}=?`).join(",")}, updated_at=strftime('%Y-%m-%d %H:%M:%f','now') WHERE id=?`,
      )
      .run(...fields.map((key) => data[key]), id);
    return { body: await read(id) };
  }
  if (id && !action && method === "DELETE") {
    const result = await sql.prepare("DELETE FROM leads WHERE id=?").run(id);
    if (!result.changes) fail("Lead nicht gefunden.", 404);
    return { body: { ok: true } };
  }
  fail("Nicht gefunden / Not found", 404);
}
