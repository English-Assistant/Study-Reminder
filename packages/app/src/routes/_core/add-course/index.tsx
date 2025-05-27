import { createFileRoute } from '@tanstack/react-router';
import {
  Typography,
  Calendar,
  Form,
  Row,
  Col,
  Button,
  Space,
  Spin,
  App,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useState } from 'react';
import {
  LeftOutlined,
  RightOutlined,
  PlusOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import type { CalendarProps } from 'antd';
import { EntryFormModal } from './-EntryFormModal';

interface EntryFormValues {
  title: string;
  description?: string;
  startTime?: Dayjs;
  courseId: string;
}

import { useRequest } from 'ahooks';
import { getAllManualReviewEntries } from '@/apis/manual-review-entries';
import type { ManualReviewEntryDto } from '@y/interface/manual-review-entries-module/dto/manual-review-entry.dto.ts';

const { Title, Text } = Typography;

export const Route = createFileRoute('/_core/add-course/')({
  component: AddCourseComponent,
});

const getCalendarData = (
  currentDate: Dayjs,
  allItems: ManualReviewEntryDto[],
): ManualReviewEntryDto[] => {
  return allItems.filter((item) =>
    dayjs(item.reviewDate).isSame(currentDate, 'day'),
  );
};

// Helper to get a consistent color based on course name for display purposes
const getColorFromName = (name?: string): string => {
  if (!name) return '#1890ff'; // Default blue
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - color.length) + color;
};

function AddCourseComponent() {
  const { message } = App.useApp();
  const [isEntryModalVisible, setIsEntryModalVisible] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] =
    useState<Dayjs>(dayjs());
  const [entryToEdit, setEntryToEdit] = useState<ManualReviewEntryDto | null>(
    null,
  );

  const {
    data: calendarItems,
    loading: loadingEntries,
    error: entriesError,
    refresh: refreshEntries,
  } = useRequest<ManualReviewEntryDto[], []>(getAllManualReviewEntries, {
    onError: (err) => {
      message.error(err.message || '加载打卡记录失败');
    },
  });

  const [entryForm] = Form.useForm<EntryFormValues>();
  const [currentPanelDate, setCurrentPanelDate] = useState<Dayjs>(dayjs());

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

  const customDateCellContent = (dateValue: Dayjs, panelDate: Dayjs) => {
    const dayItems = getCalendarData(dateValue, calendarItems || []);
    const isToday = dateValue.isSame(dayjs(), 'day');
    const isOutOfViewMonth = dateValue.month() !== panelDate.month();

    return (
      <div
        style={{
          padding: '8px',
          minHeight: '100px',
          height: '100%',
          boxSizing: 'border-box',
          position: 'relative',
          background: isOutOfViewMonth ? '#f0f2f5' : '#FFFFFF',
          cursor: 'pointer',
          overflowY: 'auto',
        }}
        onClick={() => handleOpenAddModal(dateValue)}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: '4px',
            fontWeight: isToday ? '500' : 'normal',
            color: isToday
              ? '#FFFFFF'
              : isOutOfViewMonth
                ? '#A0AEC0'
                : '#4B5563',
            ...(isToday && {
              background: '#4A6CF7',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              lineHeight: '24px',
              margin: '0 auto 4px auto',
            }),
          }}
        >
          {dateValue.date()}
        </div>
        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            fontSize: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          {dayItems.map((item) => {
            const itemColor = getColorFromName(item.courseName);
            const itemBgColor = `${itemColor}26`;

            return (
              <li
                key={item.id}
                style={{
                  padding: '2px 4px',
                  borderRadius: '3px',
                  backgroundColor: itemBgColor,
                  cursor: 'pointer',
                  marginBottom: '2px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenEditModal(item);
                }}
                title={
                  item.title + (item.reviewTime ? ` (${item.reviewTime})` : '')
                }
              >
                <Space
                  direction="vertical"
                  size={0}
                  style={{ flexGrow: 1, minWidth: 0 }}
                >
                  <Text
                    style={{
                      fontSize: '11px',
                      color: itemColor,
                      fontWeight: '500',
                    }}
                    ellipsis
                  >
                    {item.reviewTime ? `${item.reviewTime} - ` : ''}
                    {item.courseName || '课程'}
                  </Text>
                  <Text
                    style={{ fontSize: '12px', color: itemColor }}
                    ellipsis
                    title={item.title}
                  >
                    {item.title}
                  </Text>
                </Space>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const onCalendarPanelChange: CalendarProps<Dayjs>['onPanelChange'] = (
    date,
  ) => {
    setCurrentPanelDate(date);
  };

  const calendarHeaderRender = ({
    value,
    onChange,
  }: {
    value: Dayjs;
    onChange: (date: Dayjs) => void;
  }) => {
    const currentMonth = value.format('MMMM YYYY');
    const goToPreviousMonth = () => {
      onChange(value.subtract(1, 'month'));
    };
    const goToNextMonth = () => {
      onChange(value.add(1, 'month'));
    };

    return (
      <Row
        justify="space-between"
        align="middle"
        style={{ padding: '8px 0', marginBottom: '16px' }}
      >
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            {currentMonth}
          </Title>
        </Col>
        <Col>
          <Space>
            <Button onClick={goToPreviousMonth} icon={<LeftOutlined />} />
            <Button onClick={goToNextMonth} icon={<RightOutlined />} />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenAddModal(dayjs())}
            >
              今日打卡
            </Button>
          </Space>
        </Col>
      </Row>
    );
  };

  if (entriesError) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <Title level={3}>加载打卡记录失败</Title>
        <Text type="danger">{entriesError.message || '未知错误'}</Text>
        <Button
          type="primary"
          onClick={refreshEntries}
          style={{ marginTop: '20px' }}
        >
          重试
        </Button>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Calendar
        dateCellRender={(date) => customDateCellContent(date, currentPanelDate)}
        headerRender={calendarHeaderRender}
        onPanelChange={onCalendarPanelChange}
      />
      <EntryFormModal
        isVisible={isEntryModalVisible}
        onSuccess={handleModalSuccess}
        onCancel={handleModalCancel}
        editingItem={entryToEdit}
        selectedDate={selectedDateForModal}
        form={entryForm}
      />
      {loadingEntries && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          <Text style={{ marginLeft: '8px' }}>加载中...</Text>
        </div>
      )}
    </div>
  );
}
