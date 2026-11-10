export async function deleteProject(sql, id, expectedName) {
  return sql.transaction(async (tx) => {
    const project = await tx
      .prepare("SELECT id,name,customer_id FROM projects WHERE id=?")
      .get(id);
    if (!project)
      throw Object.assign(
        new Error("Projekt nicht gefunden / Project not found"),
        { status: 404 },
      );
    if (expectedName !== undefined && project.name !== expectedName)
      throw Object.assign(
        new Error(
          "Der Projektname hat sich geändert. Bitte neu laden. / The project name changed. Reload the project.",
        ),
        { status: 409 },
      );
    await tx.prepare("DELETE FROM onboardings WHERE project_id=?").run(id);
    await tx.prepare("DELETE FROM time_entries WHERE project_id=?").run(id);
    await tx.prepare("DELETE FROM approvals WHERE project_id=?").run(id);
    await tx
      .prepare(
        "DELETE FROM task_recurrences WHERE source_id IN (SELECT id FROM tasks WHERE project_id=?) OR next_id IN (SELECT id FROM tasks WHERE project_id=?)",
      )
      .run(id, id);
    // The project foreign keys cascade to tasks, comments, documents, links and report chunks.
    await tx.prepare("DELETE FROM projects WHERE id=?").run(id);
    return { ok: true };
  });
}
