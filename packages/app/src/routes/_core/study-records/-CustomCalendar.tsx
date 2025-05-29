import React from 'react';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
// It's good practice to ensure locale is set if relying on week conventions
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
// import type { ManualReviewEntryDto } from '@y/interface/manual-review-entries-module/dto/manual-review-entry.dto.ts'; // 移除
import { Button } from 'antd';
import type {
  StudyRecordWithReviewsDto,
  UpcomingReviewInRecordDto,
} from '@y/interface/study-records/dto/study-record-with-reviews.dto.ts'; // 导入所需类型

// 从父组件导入 CalendarDisplayEvent 类型，或者在此重新定义
// 假设父组件会导出它，或者我们在这里定义一个匹配的本地类型
interface CalendarDisplayEvent {
  // 本地定义以匹配父组件中的结构
  id: string;
  date: Dayjs;
  type: 'study_record' | 'review_due';
  title: string;
  description?: string;
  color?: string | null;
  source: StudyRecordWithReviewsDto | UpcomingReviewInRecordDto; // <--- 修改此处的类型
  courseName?: string;
}

interface CustomCalendarProps {
  currentMonth: Dayjs;
  onMonthChange: (newMonth: Dayjs) => void;
  renderDayEntries: (
    date: Dayjs,
    entriesForDate: CalendarDisplayEvent[], // 修改类型
  ) => React.ReactNode;
  onDateCellClick: (date: Dayjs) => void;
  allEntries: CalendarDisplayEvent[]; // 修改类型

  className?: string;
}

const weekDays = ['一', '二', '三', '四', '五', '六', '日'];
// const THEME_COLOR = '#7D6CE2'; // Removed unused constant
const THEME_COLOR_BACKGROUND = 'bg-[#7D6CE2]';

export function CustomCalendar({
  currentMonth,
  onMonthChange,
  renderDayEntries,
  onDateCellClick,
  allEntries,
  className = '',
}: CustomCalendarProps) {
  const startOfMonth = currentMonth.startOf('month');
  const endOfMonth = currentMonth.endOf('month');

  // Use 'week' which respects locale (e.g., Monday start for zh-cn)
  const startDate = startOfMonth.startOf('week');
  const endDate = endOfMonth.endOf('week');

  const daysArray: Dayjs[] = [];
  let currentDateIterator = startDate;
  while (
    currentDateIterator.isBefore(endDate) ||
    currentDateIterator.isSame(endDate, 'day')
  ) {
    daysArray.push(currentDateIterator);
    currentDateIterator = currentDateIterator.add(1, 'day');
  }

  // Ensure the grid always shows 6 weeks (42 cells) if necessary, for a consistent layout
  // This is a common practice for month views.
  if (daysArray.length < 42 && daysArray.length > 0) {
    // if it's not a multiple of 7 already (e.g. 35 days for 5 weeks)
    const lastDay = daysArray[daysArray.length - 1];
    let nextDay = lastDay;
    while (daysArray.length < 42) {
      nextDay = nextDay.add(1, 'day');
      daysArray.push(nextDay);
    }
  } else if (daysArray.length === 0 && startDate.isValid()) {
    // Handle empty initial case just in case
    currentDateIterator = startDate;
    for (let i = 0; i < 42; i++) {
      daysArray.push(currentDateIterator);
      currentDateIterator = currentDateIterator.add(1, 'day');
    }
  }

  const handlePrevMonth = () => {
    onMonthChange(currentMonth.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    onMonthChange(currentMonth.add(1, 'month'));
  };

  const getEntriesForDate = (date: Dayjs): CalendarDisplayEvent[] => {
    return allEntries.filter(
      (entry) => dayjs(entry.date).isSame(date, 'day'), // 使用 entry.date
    );
  };

  return (
    <div className={`overflow-hidden rounded ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-9.25">
        <div className="flex-1 font-bold color-#111827 lh-9 text-size-7.5">
          课程日历
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handlePrevMonth}
            type="text"
            icon={<LeftOutlined></LeftOutlined>}
          ></Button>
          <div className="text-size-4.5 lh-7">
            {currentMonth.format('YYYY年MM月')}
          </div>

          <Button
            onClick={handleNextMonth}
            type="text"
            icon={<RightOutlined></RightOutlined>}
          ></Button>
        </div>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 h-14 color-#4B5563 lh-14 text-center border-solid border-1px border-#E5E7EB">
        {weekDays.map((day) => (
          <div key={day}>{day}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1px bg-#E5E7EB border-1px border-solid border-#E5E7EB border-t-0">
        {daysArray.map((day, index) => {
          const isCurrentMonth = day.isSame(currentMonth, 'month');
          const isToday = day.isSame(dayjs(), 'day');
          const entries = getEntriesForDate(day);

          let cellClassName = `relative min-h-40 p-4 flex flex-col hover:bg-gray-100 transition-colors duration-150 cursor-pointer`;

          if (isCurrentMonth) {
            cellClassName += ' bg-white';
          } else {
            cellClassName += ' bg-gray-50'; // Non-current month days
          }

          // Add right border to all cells except the last one in each row
          if ((index + 1) % 7 !== 0) {
            cellClassName += ' ';
          }

          return (
            <div
              key={day.format('YYYY-MM-DD')}
              className={cellClassName}
              onClick={() => onDateCellClick(day)}
            >
              {/* Removed Vertical Bar */}

              {/* Date Number Container - top left */}
              <div className="relative z-10 h-7 self-start mb-1">
                <span
                  className={`text-xs w-6 h-6 flex items-center justify-center rounded-full
                              ${isToday ? `${THEME_COLOR_BACKGROUND} text-white font-semibold` : isCurrentMonth ? 'text-gray-700' : 'text-gray-400'}
                            `}
                >
                  {day.date()}
                </span>
              </div>

              {/* Entries List */}
              <div className="relative z-10 flex-grow overflow-y-auto text-xs space-y-1">
                {renderDayEntries(day, entries)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CustomCalendar;
