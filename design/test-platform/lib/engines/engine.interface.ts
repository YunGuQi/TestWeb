export interface FinalResult {
  id: number | string;
  key: string;
  title: string;
  tags?: string | string[];
  description?: string;
  quote?: string;
  radar?: any;
  rawScores?: any;
  [key: string]: any;
}

export interface CalculateParams {
  optionIds: string[];
  metadata?: any;
  testId: string;
}

export interface IScoringEngine {
  calculate(params: CalculateParams): Promise<FinalResult>;
}
