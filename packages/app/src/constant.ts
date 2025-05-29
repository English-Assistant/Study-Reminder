// 时间间隔单位
export const IntervalUnit = {
  MINUTE: 'MINUTE', // 分钟
  HOUR: 'HOUR', // 小时
  DAY: 'DAY', // 天
} as const;

// 循环模式：只提醒一次或循环提醒
export const ReviewMode = {
  ONCE: 'ONCE', // 一次性复习
  RECURRING: 'RECURRING', // 循环复习
} as const;
