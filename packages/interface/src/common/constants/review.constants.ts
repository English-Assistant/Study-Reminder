export type IntervalUnit = 'MINUTE' | 'HOUR' | 'DAY';
export type ReviewMode = 'ONCE' | 'RECURRING';

export interface DefaultReviewRule {
  value: number;
  unit: IntervalUnit;
  mode: ReviewMode;
  note?: string;
}

export const defaultReviewRules: DefaultReviewRule[] = [
  { value: 1, unit: 'HOUR', mode: 'ONCE' },
  { value: 1, unit: 'DAY', mode: 'ONCE' },
  { value: 2, unit: 'DAY', mode: 'ONCE' },
  { value: 3, unit: 'DAY', mode: 'ONCE' },
  { value: 7, unit: 'DAY', mode: 'ONCE' },
  { value: 30, unit: 'DAY', mode: 'ONCE' },
  { value: 60, unit: 'DAY', mode: 'ONCE' },
  { value: 90, unit: 'DAY', mode: 'ONCE' },
];
