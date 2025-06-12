import type { Dayjs } from 'dayjs';
import type { CalendarDisplayEvent } from './index';
import type { FC } from 'react';
import { isStudyRecord } from './-utils';
import * as _ from 'lodash-es';
import type { StudyRecordWithReviewsDto } from '@y/interface/study-records/dto/study-record-with-reviews.dto.js';
import dayjs from 'dayjs';
import { Tag, Tooltip } from 'antd';

interface Props {
  _date: Dayjs;
  entriesForDate: CalendarDisplayEvent[];
  handleOpenEditModal: (item: StudyRecordWithReviewsDto) => void;
  monthlyData: StudyRecordWithReviewsDto[];
}

export const SubItem: FC<Props> = ({
  entriesForDate,
  handleOpenEditModal,
  monthlyData,
}) => {
  const sortData = _.sortBy(entriesForDate, (item) =>
    isStudyRecord(item) ? item.studiedAt : item.expectedReviewAt,
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
                    {item.course?.note && <p>课程备注：{item.course?.note}</p>}
                    <p>点击编辑、删除对应记录</p>
                  </>
                }
              >
                <Tag
                  color={item.course?.color || 'blue'}
                  className="w-100% m-0! p-2"
                >
                  <div className="flex flex-justify-between ">
                    <div>{item.textTitle}</div>
                    <div>{item.course?.name}</div>
                  </div>
                </Tag>
              </Tooltip>
            </li>
          );
        }
        return (
          <li key={item._key} className="cursor-default pos-relative pl-3">
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
                    background: item.course.color!,
                  }}
                ></div>
                <div className="flex flex-justify-between">
                  <div>{item.textTitle}</div>
                  <div className="ml-1">{item.course.name}</div>
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
