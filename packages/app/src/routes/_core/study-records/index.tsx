import { createFileRoute } from '@tanstack/react-router';
import { Form, Spin, App } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useState } from 'react';
import { EntryFormModal } from './-EntryFormModal';
import { CustomCalendar } from './-CustomCalendar';
import { getStudyRecordsByMonthApi } from '@/apis/study-records';
import type { CourseSummaryDto } from '@y/interface/study-records/dto/study-records-by-month-response.dto.ts';
import { useRequest } from 'ahooks';
import { SubItem } from './-SubItem';

interface EntryFormValues {
  title: string;
  description?: string;
  startTime?: Dayjs;
  courseId: string;
}

// import type { ManualReviewEntryDto } from '@y/interface/manual-review-entries-module/dto/manual-review-entry.dto.ts'; // 暂时注释
import type {
  StudyRecordWithReviewsDto,
  UpcomingReviewInRecordDto,
} from '@y/interface/study-records/dto/study-record-with-reviews.dto.ts';

export type CalendarDisplayEvent = (
  | Omit<StudyRecordWithReviewsDto, 'upcomingReviewsInMonth'>
  | UpcomingReviewInRecordDto
) & {
  _key: string;
};

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
    data: monthlyResp,
    loading: loadingEntries,
    refresh: refreshMonthlyData,
  } = useRequest(
    async () => {
      if (!currentDisplayMonth) return { courses: [], records: [] };
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

  const monthlyData = monthlyResp?.records ?? [];

  const courses = monthlyResp?.courses ?? [];

  const coursesMap = (() => {
    const map: Record<string, CourseSummaryDto> = {};
    courses.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  })();

  const calendarEvents = ((): CalendarDisplayEvent[] => {
    const events: CalendarDisplayEvent[] = [];
    monthlyData.forEach((record) => {
      // 添加学习记录 - 移除 upcomingReviewsInMonth 属性
      const { upcomingReviewsInMonth, ...studyRecord } = record;
      events.push({ ...studyRecord, _key: studyRecord.id });

      // 添加复习提醒
      upcomingReviewsInMonth.forEach((review) => {
        events.push({
          ...review,
          _key: `${review.studyRecordId}-${review.ruleId}`,
        });
      });
    });
    return events;
  })();

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
    return (
      <SubItem
        _date={_date}
        entriesForDate={entriesForDate}
        handleOpenEditModal={handleOpenEditModal}
        monthlyData={monthlyData}
        coursesMap={coursesMap}
      ></SubItem>
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
