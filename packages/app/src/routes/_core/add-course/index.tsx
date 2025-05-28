import { createFileRoute } from '@tanstack/react-router';
import { Form, Spin, App, Tag, Tooltip } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useState } from 'react';
import { EntryFormModal } from './-EntryFormModal';
import { CustomCalendar } from './-CustomCalendar';

interface EntryFormValues {
  title: string;
  description?: string;
  startTime?: Dayjs;
  courseId: string;
}

import { useRequest } from 'ahooks';
import { getAllManualReviewEntries } from '@/apis/manual-review-entries';
import type { ManualReviewEntryDto } from '@y/interface/manual-review-entries-module/dto/manual-review-entry.dto.ts';

export const Route = createFileRoute('/_core/add-course/')({
  component: AddCourseComponent,
});

function AddCourseComponent() {
  const { message } = App.useApp();
  const [isEntryModalVisible, setIsEntryModalVisible] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] =
    useState<Dayjs>(dayjs());
  const [entryToEdit, setEntryToEdit] = useState<ManualReviewEntryDto | null>(
    null,
  );
  const [currentDisplayMonth, setCurrentDisplayMonth] = useState<Dayjs>(
    dayjs().startOf('month'),
  );

  const {
    data: calendarItems = [],
    loading: loadingEntries,
    refresh: refreshEntries,
  } = useRequest<ManualReviewEntryDto[], []>(getAllManualReviewEntries, {
    onError: (err) => {
      message.error(err.message || '加载打卡记录失败');
    },
  });

  const [entryForm] = Form.useForm<EntryFormValues>();

  const handleOpenAddModal = (date: Dayjs) => {
    setSelectedDateForModal(date);
    setEntryToEdit(null);
    entryForm.resetFields();
    setIsEntryModalVisible(true);
  };

  const handleOpenEditModal = (item: ManualReviewEntryDto) => {
    setSelectedDateForModal(dayjs(item.reviewDate));
    setEntryToEdit(item);
    entryForm.setFieldsValue({
      title: item.title,
      description: item.description,
      courseId: item.courseId,
      startTime: item.reviewTime ? dayjs(item.reviewTime, 'HH:mm') : undefined,
    });
    setIsEntryModalVisible(true);
  };

  const handleModalSuccess = () => {
    setIsEntryModalVisible(false);
    setEntryToEdit(null);
    refreshEntries();
  };

  const handleModalCancel = () => {
    setIsEntryModalVisible(false);
    setEntryToEdit(null);
  };

  const renderDayEntriesList = (
    _date: Dayjs,
    entriesForDate: ManualReviewEntryDto[],
  ) => {
    return (
      <ul className="list-none m-0 p-0 flex flex-col gap-1">
        {entriesForDate.map((item) => {
          return (
            <li
              key={item.id}
              onClick={(e) => {
                e.stopPropagation();
                handleOpenEditModal(item);
              }}
              title={
                item.title + (item.reviewTime ? ` (${item.reviewTime})` : '')
              }
            >
              <Tooltip
                title={
                  <>
                    <div>{item.course?.name}</div>
                    <div>{item.title}</div>
                  </>
                }
              >
                <Tag color={item.course?.color} className="w-full m-0">
                  <div>{item.title}</div>
                  <div>{item.course?.description}</div>
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
            allEntries={calendarItems}
            className="rounded-lg"
          />
        </div>
      </Spin>
      <EntryFormModal
        isVisible={isEntryModalVisible}
        onSuccess={handleModalSuccess}
        onCancel={handleModalCancel}
        editingItem={entryToEdit}
        selectedDate={selectedDateForModal}
        form={entryForm}
      />
    </>
  );
}
