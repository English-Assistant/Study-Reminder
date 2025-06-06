import dayjs from 'dayjs';
import { IntervalUnit } from '@prisma/client';

export function addInterval(
  date: dayjs.Dayjs,
  value: number,
  unit: IntervalUnit,
): dayjs.Dayjs {
  let dayjsUnit: dayjs.ManipulateType;
  switch (unit) {
    case IntervalUnit.MINUTE:
      dayjsUnit = 'minute';
      break;
    case IntervalUnit.HOUR:
      dayjsUnit = 'hour';
      break;
    case IntervalUnit.DAY:
      dayjsUnit = 'day';
      break;
    default:
      // 对于不支持的单位，直接返回原日期
      return date;
  }
  return date.add(value, dayjsUnit);
}
