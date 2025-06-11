import { Injectable, Logger } from '@nestjs/common';
import {
  ReviewRule,
  StudyTimeWindow,
  IntervalUnit,
  ReviewMode,
} from '@prisma/client';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);
dayjs.extend(isBetween);

/**
 * 负责所有与复习时间计算相关的核心、可共享的业务逻辑。
 * 这个服务是无状态的，不直接与数据库交互。
 */
@Injectable()
export class ReviewLogicService {
  private readonly logger = new Logger(ReviewLogicService.name);

  /**
   * 计算基于单条规则的下一个复习时间。
   * @param studiedAt - 学习记录的完成时间。
   * @param rule - 单条复习规则。
   * @returns 计算出的下一个复习时间（dayjs 对象），如果已过期或不适用则返回 null。
   */
  calculateNextReviewTime(studiedAt: Date, rule: ReviewRule): dayjs.Dayjs {
    const baseTime = dayjs(studiedAt).second(0).millisecond(0);
    const expectedTime = this.addInterval(baseTime, rule.value, rule.unit);

    // 对于 ONCE 模式，直接返回计算出的时间，不过滤
    if (rule.mode === ReviewMode.ONCE) {
      return expectedTime;
    }

    // 对于 RECURRING 模式，也先返回第一次的计算时间。
    // 在上层服务中决定如何处理"已过去"的循环事件。
    if (rule.mode === ReviewMode.RECURRING) {
      // 暂时返回第一次，更复杂的逻辑将在上层处理
      return expectedTime;
    }

    // 理论上不会到达这里，因为 mode 只有两种
    return expectedTime;
  }

  /**
   * 根据用户的学习时间窗口调整计划的复习时间。
   * 如果计划时间不在任何窗口内，则推迟到下一个可用窗口的开始时间。
   * @param reviewTime - 原始计算的复习时间。
   * @param windows - 用户设置的学习时间段列表。
   * @returns 调整后的复习时间（dayjs 对象）。
   */
  adjustReviewTimeForStudyWindows(
    reviewTime: dayjs.Dayjs,
    windows: StudyTimeWindow[],
  ): dayjs.Dayjs {
    if (!windows || windows.length === 0) {
      return reviewTime; // 如果未设置时间窗口，则认为全天有效。
    }

    const todayWindows = windows
      .map((w) => {
        const [startH, startM] = w.startTime.split(':').map(Number);
        const [endH, endM] = w.endTime.split(':').map(Number);
        return {
          start: reviewTime.hour(startH).minute(startM).second(0),
          end: reviewTime.hour(endH).minute(endM).second(0),
        };
      })
      .sort((a, b) => a.start.valueOf() - b.start.valueOf());

    for (const window of todayWindows) {
      if (reviewTime.isBetween(window.start, window.end, null, '[]')) {
        return reviewTime;
      }
    }

    for (const window of todayWindows) {
      if (reviewTime.isBefore(window.start)) {
        return window.start;
      }
    }

    const tomorrowFirstWindow = todayWindows[0];
    return tomorrowFirstWindow.start.add(1, 'day');
  }

  /**
   * 根据时间单位向日期添加时间间隔。
   * @param date - 基础日期。
   * @param value - 时间间隔的数值。
   * @param unit - 时间间隔的单位 (MINUTE, HOUR, DAY)。
   * @returns 计算后的新日期。
   */
  addInterval(
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
        this.logger.warn(`不支持的时间间隔单位: ${String(unit)}`);
        return date;
    }
    return date.add(value, dayjsUnit);
  }
}
