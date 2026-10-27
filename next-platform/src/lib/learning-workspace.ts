import { normalizeSearch } from "./catalog-model";

export type AssignmentReuseSeed = {
  sourceId: string;
  title: string;
  instructions: string;
  contentId: string;
  gameAvailable: boolean;
  gameUpdated: boolean;
};

export type ReportRow = {
  id: string;
  name: string;
  username: string;
  membership: string;
  attempts: number;
  completed: boolean | null;
  progress: number | null;
  score: number | null;
  best_score: number | null;
  last_activity: string | Date | null;
};
export type ReportState =
  "not_started" | "in_progress" | "completed" | "opened";
export function reportState(
  row: Pick<ReportRow, "attempts" | "completed">,
  tracking: boolean,
): ReportState {
  if (!tracking) return row.attempts > 0 ? "opened" : "not_started";
  return row.completed
    ? "completed"
    : row.attempts > 0
      ? "in_progress"
      : "not_started";
}
export function reportCounts(rows: ReportRow[], tracking: boolean) {
  const counts: Record<ReportState, number> = {
    not_started: 0,
    in_progress: 0,
    completed: 0,
    opened: 0,
  };
  for (const row of rows) counts[reportState(row, tracking)]++;
  return counts;
}
export function reportRows(
  rows: ReportRow[],
  tracking: boolean,
  query: string,
  state: ReportState | "all",
  sort: "name" | "activity",
) {
  const needle = normalizeSearch(query.trim());
  return rows
    .filter(
      (r) =>
        (state === "all" || reportState(r, tracking) === state) &&
        normalizeSearch(`${r.name} ${r.username}`).includes(needle),
    )
    .sort(
      (a, b) =>
        (sort === "activity"
          ? (b.last_activity ? new Date(b.last_activity).getTime() : 0) -
            (a.last_activity ? new Date(a.last_activity).getTime() : 0)
          : 0) ||
        a.name.localeCompare(b.name, "tr") ||
        a.id.localeCompare(b.id),
    );
}
export type MemberOption = {
  class_id: string;
  student_id: string;
  name: string;
  status: string;
};
export type GameOption = {
  id: string;
  title: string;
  tracking: boolean;
  grade?: string | number | null;
  subjectId?: string | null;
  subject?: string | null;
};
export type LearningClass = {
  id: string;
  name: string;
  archived: boolean;
  status?: string;
};
export function studentStartState(classes: LearningClass[]) {
  if (classes.some((c) => !c.archived && c.status === "active"))
    return "waiting_assignment";
  if (classes.some((c) => !c.archived && c.status === "pending"))
    return "pending";
  return classes.length ? "inactive" : "join";
}
export function teacherStartStep(
  classes: LearningClass[],
  members: MemberOption[],
  assignments: { id: string; class_id: string }[],
) {
  const active = classes.filter((c) => !c.archived);
  const currentMembers = members.filter((m) =>
    active.some((c) => c.id === m.class_id),
  );
  const assigned = assignments.find((a) =>
    active.some((c) => c.id === a.class_id),
  );
  if (assigned)
    return { step: "report", href: `/ogretmen/odevler/${assigned.id}` };
  if (!active.length) return { step: "class", href: "#class-create" };
  const pending = currentMembers.find((m) => m.status === "pending");
  if (pending) return { step: "approve", href: `#class-${pending.class_id}` };
  if (currentMembers.some((m) => m.status === "active"))
    return { step: "assign", href: "/ogretmen/odevler" };
  return { step: "code", href: `#class-${active[0].id}` };
}
