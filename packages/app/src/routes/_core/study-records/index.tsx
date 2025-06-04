import { createFileRoute } from '@tanstack/react-router';
import { Form, Spin, App, Tag, Badge, Space, Tooltip } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useState, useMemo } from 'react';
import { EntryFormModal } from './-EntryFormModal';
import { CustomCalendar } from './-CustomCalendar';
import { getStudyRecordsByMonthApi } from '@/apis/study-records';
import type {
  StudyRecordWithReviewsDto,
  UpcomingReviewInRecordDto,
} from '@y/interface/study-records/dto/study-record-with-reviews.dto.ts';
import * as _ from 'lodash-es';

interface EntryFormValues {
  title: string;
  description?: string;
  startTime?: Dayjs;
  courseId: string;
}

// import type { ManualReviewEntryDto } from '@y/interface/manual-review-entries-module/dto/manual-review-entry.dto.ts'; // 暂时注释
import { useRequest } from 'ahooks';

type CalendarDisplayEvent =
  | Omit<StudyRecordWithReviewsDto, 'upcomingReviewsInMonth'>
  | UpcomingReviewInRecordDto;

export const Route = createFileRoute('/_core/study-records/')({
  component: AddCourseComponent,
});

// 类型守卫函数
function isStudyRecord(
  item: CalendarDisplayEvent,
): item is Omit<StudyRecordWithReviewsDto, 'upcomingReviewsInMonth'> {
  return 'studiedAt' in item && 'courseId' in item && 'textTitle' in item;
}

function AddCourseComponent() {
  const { message } = App.useApp();
  const [isEntryModalVisible, setIsEntryModalVisible] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] =
    useState<Dayjs>(dayjs());

  // entryToEdit 现在存储完整的 StudyRecordWithReviewsDto 对象或 null
  const [entryToEdit, setEntryToEdit] =
    useState<StudyRecordWithReviewsDto | null>(null);
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState<Dayjs>(
    dayjs().startOf('month'),
  );

  const {
    data: monthlyData = [],
    loading: loadingEntries,
    refresh: refreshMonthlyData,
  } = useRequest(
    async () => {
      if (!currentDisplayMonth) return [];
      return getStudyRecordsByMonthApi({
        year: currentDisplayMonth.year(),
        month: currentDisplayMonth.month() + 1,
      });
    },
    {
      refreshDeps: [currentDisplayMonth],
      onError: (err) => {
        message.error((err as Error).message || '加载月度记录和复习失败');
      },
    },
  );

  const calendarEvents = useMemo((): CalendarDisplayEvent[] => {
    const events: CalendarDisplayEvent[] = [];
    monthlyData.forEach((record) => {
      // 添加学习记录 - 移除 upcomingReviewsInMonth 属性
      const { upcomingReviewsInMonth, ...studyRecord } = record;
      events.push(studyRecord);

      // 添加复习提醒
      upcomingReviewsInMonth.forEach((review) => {
        events.push(review);
      });
    });
    return events;
  }, [monthlyData]);

  const [entryForm] = Form.useForm<EntryFormValues>();

  const handleOpenAddModal = (date: Dayjs) => {
    setSelectedDateForModal(date);
    setEntryToEdit(null);
    entryForm.resetFields();
    // 如果需要，可以在表单中预设学习时间 (studiedAt)
    // entryForm.setFieldsValue({ startTime: date });
    setIsEntryModalVisible(true);
  };

  const handleOpenEditModal = (item: StudyRecordWithReviewsDto) => {
    setSelectedDateForModal(dayjs(item.studiedAt));
    setEntryToEdit(item);
    entryForm.setFieldsValue({
      title: item.textTitle,
      description: item.note || undefined,
      courseId: item.courseId,
      startTime: dayjs(item.studiedAt),
    });
    setIsEntryModalVisible(true);
  };

  const handleModalSuccess = () => {
    setIsEntryModalVisible(false);
    setEntryToEdit(null);
    refreshMonthlyData();
  };

  const handleModalCancel = () => {
    setIsEntryModalVisible(false);
    setEntryToEdit(null);
  };

  const renderDayEntriesList = (
    _date: Dayjs,
    entriesForDate: CalendarDisplayEvent[],
  ) => {
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
        dayjs(a.expectedReviewAt).valueOf() -
        dayjs(b.expectedReviewAt).valueOf()
      );
    });
    sortData.push(...newArr);

    return (
      <ul className="list-none m-0 p-0 flex flex-col gap-1">
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
                      <p>点击编辑</p>
                    </>
                  }
                >
                  <Tag
                    color={item.course?.color || 'blue'}
                    className="w-100% m-0!"
                  >
                    {item.textTitle}
                    <br />
                    {item.course?.name}
                  </Tag>
                </Tooltip>
              </li>
            );
          }
          // 待复习的计划
          return (
            <li
              key={item.expectedReviewAt.valueOf()}
              className="cursor-default my-3px"
              title={`复习时间：${dayjs(item.expectedReviewAt).format('YYYY-MM-DD HH:mm')}`}
            >
              <Space align="center">
                <Badge color={item.course.color || 'blue'} />
                <div>{item.textTitle}</div>
              </Space>
              <div>{item.ruleDescription}</div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      <Spin spinning={loadingEntries} tip="加载中...">
        <div className="p-6 bg-#fff">
          <CustomCalendar
            currentMonth={currentDisplayMonth}
            onMonthChange={setCurrentDisplayMonth}
            renderDayEntries={renderDayEntriesList}
            onDateCellClick={handleOpenAddModal}
            allEntries={calendarEvents}
            className="rounded-lg"
          />
        </div>
      </Spin>
      <EntryFormModal
        isVisible={isEntryModalVisible}
        onSuccess={handleModalSuccess}
        onCancel={handleModalCancel}
        // editingItem 类型现在是 StudyRecordWithReviewsDto | null
        // EntryFormModal 内部需要能处理这个类型，或者只取它需要的字段（如 id）
        // 如果 EntryFormModal 强依赖一个不同的结构，这仍是一个需要适配的点
        editingItem={entryToEdit}
        selectedDate={selectedDateForModal}
        form={entryForm}
      />
    </>
  );
}
