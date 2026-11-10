import { randomUUID } from "node:crypto";
import {
  cleanAnswers,
  validateCompletion,
  onboardingDocument,
} from "./onboarding.mjs";
export function onboardingEmail() {
  const email = (
    process.env.ONBOARDING_EMAIL ||
    process.env.ADMIN_EMAILS?.split(",")[0] ||
    ""
  )
    .trim()
    .toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}
const error = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
export async function saveOnboarding(sql, user, project, body) {
  if (!Number.isInteger(body.expected_revision) || body.expected_revision < 0)
    error("Bitte das Onboarding neu laden. / Reload the onboarding.");
  const answers = (() => {
    try {
      return cleanAnswers(body.answers, body.complete === true);
    } catch (e) {
      error(e.message);
    }
  })();
  const complete = body.complete === true;
  const step = body.step;
  if (!Number.isInteger(step) || step < 0 || step > 4)
    error("Ungültiger Schritt / Invalid step");
  if (complete) {
    if (!onboardingEmail())
      error(
        "Die Einladungsadresse ist noch nicht eingerichtet. / The invitation address is not configured.",
        503,
      );
    try {
      validateCompletion(answers, project.project_type);
    } catch (e) {
      error(e.message);
    }
  }
  return sql.transaction(async (tx) => {
    const old = await tx
      .prepare("SELECT * FROM onboardings WHERE project_id=?")
      .get(project.id);
    if (old?.status === "completed")
      return {
        ok: true,
        document_id: old.document_id,
        revision: old.revision,
        completed: true,
      };
    if ((old?.revision || 0) !== body.expected_revision)
      error(
        "Jemand hat das Onboarding geändert. Bitte schließe das Formular und lade den aktuellen Stand. Dein Entwurf bleibt bis dahin geöffnet. / Someone changed the onboarding. Close the form and reload the latest version. Your draft stays open until then.",
        409,
      );
    const revision = (old?.revision || 0) + 1,
      now = new Date().toISOString();
    let documentId = null;
    if (complete) {
      documentId = randomUUID();
      const content = onboardingDocument(
        project,
        answers,
        user,
        onboardingEmail(),
        now,
        body.lang,
      );
      await tx
        .prepare(
          "INSERT INTO documents(id,project_id,title,content,visible) VALUES(?,?,?,?,1)",
        )
        .run(
          documentId,
          project.id,
          "Onboarding: " + project.name,
          JSON.stringify(content),
        );
    }
    await tx
      .prepare(
        `INSERT INTO onboardings(project_id,status,answers,step,revision,document_id,completed_at,updated_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(project_id) DO UPDATE SET status=excluded.status,answers=excluded.answers,step=excluded.step,revision=excluded.revision,document_id=excluded.document_id,completed_at=excluded.completed_at,updated_at=excluded.updated_at`,
      )
      .run(
        project.id,
        complete ? "completed" : "draft",
        JSON.stringify(answers),
        complete ? 4 : step,
        revision,
        documentId,
        complete ? now : null,
        now,
      );
    return { ok: true, revision, document_id: documentId, completed: complete };
  });
}
