import type { SubjectKey } from "../lib/catalog-model";
export type ChoiceRound = {
  type: "choice";
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
};
export type MatchRound = {
  type: "match";
  prompt: string;
  pairs: [string, string][];
  explanation: string;
};
export type OrderRound = {
  type: "order";
  prompt: string;
  items: string[];
  explanation: string;
};
export type SortRound = {
  type: "sort";
  prompt: string;
  groups: string[];
  items: { label: string; group: string }[];
  explanation: string;
};
export type GameRound = ChoiceRound | MatchRound | OrderRound | SortRound;
export type DemoGame = {
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  subject: SubjectKey;
  grade: number;
  minutes: number;
  mechanic: string;
  scene: string;
  color: string;
  background: string;
  objective: string;
  teacherNote: string;
  rounds: GameRound[];
};
