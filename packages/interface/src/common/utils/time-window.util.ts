// 根据学习时间窗口调整发送时间
// ---------------------------------------------------------
// 提供与 ReviewLogicService.adjustTimeForWindows 相同的核心逻辑，
// 方便在其它模块直接调用。所有时间均使用 dayjs。

import dayjs from 'dayjs';

export interface StudyTimeWindowLike {
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
}

/**
 * 根据学习时间段决定实际发送时间。
 * @param reviewTime 计算出的学术复习时间（dayjs 对象）
 * @param windows    用户配置的时间段数组
 * @returns 若 reviewTime 已在窗口内则原值；否则推迟到最近可用窗口的起点
 */
export function calcSendTimeByWindows(
  reviewTime: dayjs.Dayjs,
  windows: StudyTimeWindowLike[] | undefined,
): dayjs.Dayjs {
  if (!windows || windows.length === 0) return reviewTime;

  const todayWindows = windows
    .map((w) => {
      const [sh, sm] = w.startTime.split(':').map(Number);
      const [eh, em] = w.endTime.split(':').map(Number);
      return {
        start: reviewTime.hour(sh).minute(sm).second(0),
        end: reviewTime.hour(eh).minute(em).second(0),
      };
    })
    .sort((a, b) => a.start.valueOf() - b.start.valueOf());

  for (const win of todayWindows) {
    if (reviewTime.isBetween(win.start, win.end, null, '[]')) {
      return reviewTime;
    }
  }

  for (const win of todayWindows) {
    if (reviewTime.isBefore(win.start)) {
      return win.start;
    }
  }

  return todayWindows[0].start.add(1, 'day');
}
