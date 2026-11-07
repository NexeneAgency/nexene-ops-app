export const phases = [
  "Kick-off",
  "Inhalte",
  "Freigabe Inhalte",
  "Design",
  "Freigabe Design",
  "Entwicklung",
  "Abnahme",
  "Launch",
  "Betreuung",
];
// Starting values, editable independently for every project.
export const defaultWeights = [5, 15, 5, 20, 5, 30, 10, 10, 0];
export const defaultPhaseWeights = Object.fromEntries(
  phases.map((phase, i) => [phase, defaultWeights[i]]),
);
export function projectProgress(tasks, weights) {
  let earned = 0;
  for (const phase of phases) {
    // Subtasks are part of their parent task, never a second progress unit.
    const group = tasks.filter(
      (task) => !task.parent_id && task.phase === phase,
    );
    if (group.length)
      earned +=
        (weights[phase] *
          group.filter((task) => task.status === "done").length) /
        group.length;
  }
  return Math.round(earned);
}
export const phaseMigration = `
  ALTER TABLE projects ADD COLUMN phase_weights TEXT NOT NULL DEFAULT '${JSON.stringify(defaultPhaseWeights)}';
  ALTER TABLE tasks ADD COLUMN phase TEXT NOT NULL DEFAULT 'Kick-off';
  UPDATE tasks SET phase = CASE WHEN title IN (${phases.map((p) => "'" + p + "'").join(",")}) THEN title ELSE COALESCE((SELECT phase FROM projects WHERE projects.id=tasks.project_id), 'Kick-off') END;
  WITH RECURSIVE inherited(id,phase) AS (SELECT id,phase FROM tasks WHERE parent_id IS NULL UNION ALL SELECT child.id,parent.phase FROM tasks child JOIN inherited parent ON child.parent_id=parent.id) UPDATE tasks SET phase=(SELECT phase FROM inherited WHERE inherited.id=tasks.id);
  INSERT INTO schema_migrations VALUES(3);
`;
