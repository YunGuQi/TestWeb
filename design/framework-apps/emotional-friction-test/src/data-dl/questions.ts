import config from '@/config/tests/destined-lover.json';

export type AxisScore = "R" | "P" | "D" | "I" | "S" | "C";

export interface Option {
  id: string;
  text: string;
  scores: { axis: AxisScore; score: number }[];
}

export interface Question {
  id: number;
  text: string;
  options: Option[];
}

export const questions: Question[] = config.questions as Question[];
