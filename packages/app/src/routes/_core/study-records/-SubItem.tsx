import type { Dayjs } from 'dayjs';
import type { CalendarDisplayEvent } from './index';
import type { FC } from 'react';
import { isStudyRecord } from './-utils';
import * as _ from 'lodash-es';
import type { StudyRecordWithReviewsDto } from '@y/interface/study-records/dto/study-record-with-reviews.dto.js';
import dayjs from 'dayjs';
import { Tag, Tooltip } from 'antd';
import clsx from 'clsx';
import type { CourseSummaryDto } from '@y/interface/study-records/dto/study-records-by-month-response.dto.ts';

type CourseInfo = CourseSummaryDto;

interface Props {
  _date: Dayjs;
  entriesForDate: CalendarDisplayEvent[];
  handleOpenEditModal: (item: StudyRecordWithReviewsDto) => void;
  monthlyData: StudyRecordWithReviewsDto[];
  coursesMap: Record<string, CourseInfo>;
}

// 计算复习项状态：过去、当前、未来
// referenceDate: 日历单元格日期（不含时分秒）
function getReviewStatus(
  expected: dayjs.Dayjs,
  referenceDate: dayjs.Dayjs,
): 'past' | 'current' | 'future' {
  const now = dayjs();
  const reference = referenceDate
    .hour(now.hour())
    .minute(now.minute())
    .second(0)
    .millisecond(0);

  const diffMinutes = expected.diff(reference, 'minute');
  if (diffMinutes < -90) {
    return 'past';
  }
  if (diffMinutes > 90) {
    return 'future';
  }
  return 'current';
}

export const SubItem: FC<Props> = ({
  _date,
  entriesForDate,
  handleOpenEditModal,
  monthlyData,
  coursesMap,
}) => {
  const sortData = _.sortBy(entriesForDate, (item) =>
    isStudyRecord(item)
      ? dayjs(item.studiedAt).valueOf()
      : dayjs(item.expectedReviewAt).valueOf(),
  );

  return (
    <ul className="list-none m-0 p-0 flex flex-col gap-1 max-h-240px overflow-auto">
      {sortData.map((item) => {
        if (isStudyRecord(item)) {
          return (
            <li
              key={item._key}
              onClick={(e) => {
                e.stopPropagation();
                const fullRecord = monthlyData.find((r) => r.id === item.id);
                if (fullRecord) {
                  handleOpenEditModal(fullRecord);
                }
              }}
              className="cursor-pointer"
            >
              <Tooltip
                title={
                  <>
                    <p>
                      课程完成时间：
                      {dayjs(item.studiedAt).format('YYYY-MM-DD HH:mm')}
                    </p>
                    {item.note && <p>备注：{item.note}</p>}
                    {coursesMap[item.courseId]?.note && (
                      <p>课程备注：{coursesMap[item.courseId]?.note}</p>
                    )}
                    <p>点击编辑、删除对应记录</p>
                  </>
                }
              >
                <Tag
                  color={coursesMap[item.courseId]?.color || 'blue'}
                  className="w-100% m-0! p-2"
                >
                  <div className="flex flex-justify-between ">
                    <div>{item.textTitle}</div>
                    <div>{coursesMap[item.courseId]?.name}</div>
                  </div>
                </Tag>
              </Tooltip>
            </li>
          );
        }
        // 根据时间段决定样式透明度或颜色
        const status = getReviewStatus(dayjs(item.expectedReviewAt), _date);
        const liClass = clsx('cursor-default pos-relative pl-3', {
          'opacity-50': status === 'past',
          'opacity-70': status === 'future',
        });

        return (
          <li key={item._key} className={liClass}>
            <Tooltip
              placement="leftTop"
              title={`复习时间：${dayjs(item.expectedReviewAt).format(
                'YYYY-MM-DD HH:mm',
              )}`}
            >
              <div>
                <div
                  className="w-1 pos-absolute top-0 bottom-0 left-0"
                  style={{
                    background: coursesMap[item.courseId]?.color || 'blue',
                  }}
                ></div>
                <div className="flex flex-justify-between">
                  <div>{item.textTitle}</div>
                  <div className="ml-1">{coursesMap[item.courseId]?.name}</div>
                </div>
                <div className="flex items-center">
                  <div className="flex-1 break-words whitespace-normal overflow-hidden">
                    {!!item.ruleDescription && (
                      <div>{item.ruleDescription}</div>
                    )}
                  </div>
                  <div className="ml-1">
                    {dayjs(item.expectedReviewAt).format('HH:mm')}
                  </div>
                </div>
              </div>
            </Tooltip>
          </li>
        );
      })}
    </ul>
  );
};
