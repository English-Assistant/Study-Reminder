import { ReviewRule } from '@prisma/client';

export function getRuleDescription(rule: ReviewRule) {
  return rule.note;
}
