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
import { Badge, Space, Tag, Tooltip } from 'antd';

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
                    <p>备注：{item.note}</p>
                    <p>
                      课程完成时间：
                      {dayjs(item.studiedAt).format('YYYY-MM-DD HH:mm')}
                    </p>
                    <p>点击编辑</p>
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
            className="cursor-default"
            title={`复习时间：${dayjs(item.expectedReviewAt).format('YYYY-MM-DD HH:mm')}`}
          >
            <Tag
              bordered={false}
              color="rgba(125, 108, 226, 0.85)"
              className="w-full m-0! px-2"
            >
              <div className="flex flex-justify-between">
                <Space align="center">
                  <Badge color={item.course.color || 'blue'} />
                  <div>{item.textTitle}</div>
                </Space>
                <div>{item.course.name}</div>
              </div>
              <div>{item.ruleDescription}</div>
            </Tag>
          </li>
        );
      })}
    </ul>
  );
};
