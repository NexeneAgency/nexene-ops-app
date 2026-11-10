import { MAX_REPORT_BYTES } from "./report-limits.mjs";
export { MAX_REPORT_BYTES } from "./report-limits.mjs";
export const REPORT_CHUNK_BYTES = 256 * 1024;
export const reportsMigration = `
  ALTER TABLE projects ADD COLUMN project_type TEXT NOT NULL DEFAULT 'web' CHECK(project_type IN ('web','seo_geo'));
  CREATE TABLE reports (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL, period TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
    file_name TEXT NOT NULL, size INTEGER NOT NULL, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE report_chunks (
    report_id TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    position INTEGER NOT NULL, content BLOB NOT NULL, PRIMARY KEY(report_id,position)
  );
  CREATE INDEX report_project ON reports(project_id,period);
  INSERT INTO schema_migrations VALUES(4);
`;
// Bound reads even when Content-Length is missing or falsified.
export async function readReportRequest(
  request,
  limit = MAX_REPORT_BYTES + 65536,
) {
  if (Number(request.headers.get("content-length") || 0) > limit)
    throw Object.assign(
      new Error("PDF zu groß. Maximal 3 MB. / PDF too large. Maximum 3 MB."),
      { status: 413 },
    );
  const reader = request.body?.getReader();
  if (!reader)
    throw Object.assign(new Error("PDF fehlt / PDF missing"), { status: 400 });
  const parts = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) {
        await reader.cancel();
        throw Object.assign(
          new Error(
            "PDF zu groß. Maximal 3 MB. / PDF too large. Maximum 3 MB.",
          ),
          { status: 413 },
        );
      }
      parts.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  const parsed = new Request(request.url, {
    method: "POST",
    headers: { "content-type": request.headers.get("content-type") || "" },
    body: Buffer.concat(parts),
  });
  return parsed.formData();
}
