import type { Dayjs } from 'dayjs';
import type { CalendarDisplayEvent } from './index';
import type { FC } from 'react';
import { isStudyRecord } from './-utils';
import * as _ from 'lodash-es';
import type {
  StudyRecordWithReviewsDto,
  UpcomingReviewInRecordDto,
} from '@y/interface/study-records/dto/study-record-with-reviews.dto.js';
import dayjs from 'dayjs';
import { Tag, Tooltip } from 'antd';

interface Props {
  _date: Dayjs;
  entriesForDate: CalendarDisplayEvent[];
  handleOpenEditModal: (item: StudyRecordWithReviewsDto) => void;
}

export const SubItem: FC<Props> = ({ entriesForDate, handleOpenEditModal }) => {
  // 数据排序一下
  const sortData: typeof entriesForDate = entriesForDate.filter((f) =>
    isStudyRecord(f),
  );
  const newArr = _.cloneDeep(
    entriesForDate.filter(
      (f): f is UpcomingReviewInRecordDto => !isStudyRecord(f),
    ),
  );
  newArr.sort((a, b) => {
    return (
      dayjs(a.expectedReviewAt).valueOf() - dayjs(b.expectedReviewAt).valueOf()
    );
  });
  sortData.push(...newArr);

  return (
    <ul className="list-none m-0 p-0 flex flex-col gap-1 max-h-240px overflow-auto">
      {sortData.map((item) => {
        // 添加的复习计划
        if (isStudyRecord(item)) {
          return (
            <li
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEditModal(item as StudyRecordWithReviewsDto);
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
                    {item.course?.note && <p>课程备注：{item.course?.note}</p>}
                    <p>点击编辑、删除对应记录</p>
                  </>
                }
              >
                <Tag
                  color={item.course?.color || 'blue'}
                  className="w-100% m-0! flex flex-justify-between p-2"
                >
                  <div>{item.textTitle}</div>
                  <div>{item.course?.name}</div>
                </Tag>
              </Tooltip>
            </li>
          );
        }
        // 待复习的计划
        return (
          <li
            key={item.expectedReviewAt.valueOf()}
            className="cursor-default pos-relative pl-3"
            title={`复习时间：${dayjs(item.expectedReviewAt).format('YYYY-MM-DD HH:mm')}`}
          >
            <div
              className="w-1 pos-absolute top-0 bottom-0 left-0"
              style={{
                background: item.course.color!,
              }}
            ></div>
            <div className="flex flex-justify-between">
              <div>{item.textTitle}</div>
              <div>{item.course.name}</div>
            </div>
            {!!item.ruleDescription && <div>{item.ruleDescription}</div>}
          </li>
        );
      })}
    </ul>
  );
};
