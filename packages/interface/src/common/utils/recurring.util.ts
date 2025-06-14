import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { ReviewRule } from '@prisma/client';

dayjs.extend(duration);

/**
 * 若 reviewTime 已早于 reference，则按 rule 间隔向未来滚动，
 * 返回第一个不早于 reference 的时间。
 * 非循环规则或已在未来 → 原值返回。
 */
export function ensureFutureRecurringTime(
  reviewTime: dayjs.Dayjs,
  rule: ReviewRule,
  reference: dayjs.Dayjs,
): dayjs.Dayjs {
  if (rule.mode !== 'RECURRING') return reviewTime;
  if (!reviewTime.isBefore(reference)) return reviewTime;

  const ruleInterval = dayjs.duration(
    rule.value,
    rule.unit.toLowerCase() as dayjs.ManipulateType,
  );

  const diff = reference.diff(reviewTime);
  const intervals = Math.ceil(diff / ruleInterval.asMilliseconds());
  return reviewTime.add(
    intervals * ruleInterval.asMilliseconds(),
    'millisecond',
  );
}
