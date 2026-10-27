import { fail } from "./errors";
export const learningEnabled = () =>
  process.env.STUDENT_LEARNING_ENABLED === "true";
export function requireLearning() {
  if (!learningEnabled()) fail(404, "Bu özellik henüz kullanıma açılmadı.");
}
