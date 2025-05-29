import { createFileRoute } from '@tanstack/react-router';
import { Form, Spin, App, Tag, Tooltip } from 'antd';
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

interface EntryFormValues {
  title: string;
  description?: string;
  startTime?: Dayjs;
  courseId: string;
}

// import type { ManualReviewEntryDto } from '@y/interface/manual-review-entries-module/dto/manual-review-entry.dto.ts'; // 暂时注释
import { useRequest } from 'ahooks';

interface CalendarDisplayEvent {
  id: string;
  date: Dayjs;
  type: 'study_record' | 'review_due';
  title: string;
  description?: string;
  color?: string | null; // 允许 null，与 DTO 同步
  source: StudyRecordWithReviewsDto | UpcomingReviewInRecordDto;
  courseName?: string;
}

export const Route = createFileRoute('/_core/study-records/')({
  component: AddCourseComponent,
});

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
      events.push({
        id: `sr-${record.id}`,
        date: dayjs(record.studiedAt),
        type: 'study_record',
        title: record.textTitle,
        description: record.note || undefined,
        color: record.course?.color,
        source: record,
        courseName: record.course?.name,
      });

      record.upcomingReviewsInMonth.forEach((review) => {
        events.push({
          id: `rev-${record.id}-${review.ruleId}`,
          date: dayjs(review.expectedReviewAt),
          type: 'review_due',
          title: `复习: ${review.textTitle}`,
          description: review.ruleDescription,
          color: 'gold',
          source: review,
          courseName: review.courseName,
        });
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

  const handleOpenEditModal = (item: CalendarDisplayEvent) => {
    if (
      item.type === 'study_record' &&
      item.source &&
      'id' in item.source &&
      'courseId' in item.source
    ) {
      const sourceRecord = item.source as StudyRecordWithReviewsDto;
      setSelectedDateForModal(dayjs(sourceRecord.studiedAt));
      setEntryToEdit(sourceRecord); // 存储完整的 sourceRecord 用于编辑

      entryForm.setFieldsValue({
        title: sourceRecord.textTitle,
        description: sourceRecord.note || undefined,
        courseId: sourceRecord.courseId,
        // 如果 EntryFormValues 有 startTime 且与 studiedAt 对应
        startTime: dayjs(sourceRecord.studiedAt),
      });
      setIsEntryModalVisible(true);
    } else if (item.type === 'review_due') {
      message.info('复习计划在"复习规则"页面管理，此处仅为提醒。');
    }
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
    return (
      <ul className="list-none m-0 p-0 flex flex-col gap-1">
        {entriesForDate.map((item) => {
          const tagContent = (
            <>
              <div>{item.title}</div>
              {item.type === 'study_record' &&
                item.source &&
                (item.source as StudyRecordWithReviewsDto).course?.note && (
                  <div>
                    {(item.source as StudyRecordWithReviewsDto).course?.note}
                  </div>
                )}
            </>
          );

          return (
            <li
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEditModal(item);
              }}
              title={item.title}
            >
              <Tooltip
                title={
                  <>
                    <div>课程: {item.courseName || 'N/A'}</div>
                    <div>
                      {item.type === 'study_record' ? '打卡' : '复习'}:{' '}
                      {item.title}
                    </div>
                    {item.description && <div>备注: {item.description}</div>}
                  </>
                }
              >
                <Tag
                  color={
                    item.color ||
                    (item.type === 'study_record' ? 'blue' : 'gold')
                  }
                  className="w-full m-0 cursor-pointer"
                >
                  {tagContent}
                </Tag>
              </Tooltip>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <>
      <Spin spinning={loadingEntries} tip="加载中...">
        <div className="p-6">
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
