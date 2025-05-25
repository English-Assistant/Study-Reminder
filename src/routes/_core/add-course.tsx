import { createFileRoute } from '@tanstack/react-router';
import {
  Typography,
  Calendar,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Button,
  Space,
  Divider,
  Tag,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useState } from 'react';
import {
  LeftOutlined,
  RightOutlined,
  PlusOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import type { CalendarProps } from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;

export const Route = createFileRoute('/_core/add-course')({
  component: AddCourseComponent,
});

interface CourseCalendarItem {
  id: string;
  date: Dayjs;
  startTime?: string;
  title: string;
  courseType: 'gaoshu' | 'xiandai' | 'shuju' | 'caozuo' | 'other' | 'review';
  description?: string;
  repoUrl?: string;
  isReview?: boolean;
}

// Updated colors based on Motiff design (rgba for backgrounds)
const courseTypeColors: Record<
  CourseCalendarItem['courseType'],
  { main: string; background: string }
> = {
  gaoshu: { main: '#67C23A', background: 'rgba(103, 194, 58, 0.20)' }, // Green
  xiandai: { main: '#409EFF', background: 'rgba(64, 158, 255, 0.20)' }, // Blue
  shuju: { main: '#E6A23C', background: 'rgba(230, 162, 60, 0.20)' }, // Orange
  caozuo: { main: '#F56C6C', background: 'rgba(245, 108, 108, 0.20)' }, // Red
  review: { main: '#E6A23C', background: 'rgba(230, 162, 60, 0.20)' }, // Orange for review items, as per Motiff bell icon
  other: { main: '#909399', background: 'rgba(144, 147, 153, 0.20)' }, // Grey
};

const courseTypeLabels: Record<CourseCalendarItem['courseType'], string> = {
  gaoshu: '高等数学',
  xiandai: '线性代数',
  shuju: '数据结构',
  caozuo: '操作系统',
  review: '待复习', // This might be redundant if isReview flag is used for styling review items
  other: '其他',
};

const getCalendarData = (
  currentDate: Dayjs,
  allItems: CourseCalendarItem[],
): CourseCalendarItem[] => {
  return allItems.filter((item) => item.date.isSame(currentDate, 'day'));
};

function AddCourseComponent() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDateForModal, setSelectedDateForModal] =
    useState<Dayjs>(dayjs());
  const [editingItem, setEditingItem] = useState<CourseCalendarItem | null>(
    null,
  );
  const [calendarItems, setCalendarItems] = useState<CourseCalendarItem[]>([
    {
      id: '1',
      date: dayjs().date(7),
      startTime: '09:00',
      title: '高等数学复习',
      courseType: 'gaoshu',
      description: '复习第一单元',
    },
    {
      id: '2',
      date: dayjs().date(7),
      startTime: '14:00',
      title: '线性代数作业',
      courseType: 'xiandai',
      description: '完成课后习题1-5',
    },
    {
      id: '3',
      date: dayjs().date(9),
      title: '数据结构预习',
      courseType: 'shuju',
      isReview: true,
      description: '预习链表章节',
    },
    {
      id: '4',
      date: dayjs().date(15),
      startTime: '15:00',
      title: '操作系统 Quiz',
      courseType: 'caozuo',
      description: '准备第二章小测',
    },
    {
      id: '5',
      date: dayjs().date(15),
      title: '复习：操作系统 Quiz',
      courseType: 'caozuo',
      isReview: true,
    }, // Changed courseType to match main item
  ]);

  const [form] = Form.useForm<Omit<CourseCalendarItem, 'id' | 'date'>>();
  const [currentPanelDate, setCurrentPanelDate] = useState<Dayjs>(dayjs());

  const handleOpenModalForAdd = (date: Dayjs) => {
    setEditingItem(null);
    setSelectedDateForModal(date);
    form.resetFields();
    form.setFieldsValue({ courseType: 'other', isReview: false });
    setIsModalVisible(true);
  };

  const handleOpenModalForEdit = (item: CourseCalendarItem) => {
    setEditingItem(item);
    setSelectedDateForModal(item.date);
    form.setFieldsValue({
      title: item.title,
      startTime: item.startTime ? item.startTime : undefined, // Ensure undefined if not present
      courseType: item.courseType,
      description: item.description,
      repoUrl: item.repoUrl,
      isReview: !!item.isReview, // Ensure boolean
    });
    setIsModalVisible(true);
  };

  const customDateCellContent = (dateValue: Dayjs, panelDate: Dayjs) => {
    const dayItems = getCalendarData(dateValue, calendarItems);
    const isToday = dateValue.isSame(dayjs(), 'day');
    const isOutOfViewMonth = dateValue.month() !== panelDate.month();

    return (
      <div
        style={{
          padding: '8px',
          minHeight: '120px',
          position: 'relative',
          background: isOutOfViewMonth ? '#F9FAFB' : '#FFFFFF',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: '8px',
            fontWeight: isToday ? '500' : 'normal',
            color: isToday
              ? '#FFFFFF'
              : isOutOfViewMonth
                ? '#A0AEC0'
                : '#4B5563',
            ...(isToday && {
              background: '#4A6CF7',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              lineHeight: '28px',
              margin: '0 auto 8px auto',
            }),
            ...(!isToday && { paddingTop: '4px' }),
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
            gap: '4px',
          }}
        >
          {dayItems.map((item) => {
            const itemColor = item.isReview
              ? courseTypeColors.review.main
              : courseTypeColors[item.courseType].main;
            const itemBgColor = item.isReview
              ? courseTypeColors.review.background
              : courseTypeColors[item.courseType].background;

            return (
              <li
                key={item.id}
                onClick={() => handleOpenModalForEdit(item)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '6px',
                  backgroundColor: itemBgColor,
                  cursor: 'pointer',
                }}
                title={
                  item.title + (item.startTime ? ` (${item.startTime})` : '')
                }
              >
                <Space direction="vertical" size={2} style={{ width: '100%' }}>
                  <Space size={4} align="center">
                    {item.startTime && (
                      <Text
                        style={{
                          fontSize: '12px',
                          fontWeight: '500',
                          color: itemColor,
                        }}
                      >
                        {item.startTime}
                      </Text>
                    )}
                    <Text
                      style={{
                        fontSize: '14px',
                        color: itemColor,
                        flexGrow: 1,
                        whiteSpace: 'normal',
                      }}
                    >
                      {item.title}
                    </Text>
                  </Space>
                  {item.isReview && (
                    <Space size={4} align="center">
                      <ClockCircleOutlined
                        style={{ color: courseTypeColors.review.main }}
                      />
                      <Text
                        style={{
                          fontSize: '14px',
                          color: courseTypeColors.review.main,
                        }}
                      >
                        复习提醒
                      </Text>
                    </Space>
                  )}
                </Space>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const handleModalOk = () => {
    form
      .validateFields()
      .then((values) => {
        const formValues = {
          ...values,
          startTime: values.startTime
            ? dayjs(values.startTime).format('HH:mm')
            : undefined,
        };

        if (editingItem) {
          const updatedItems = calendarItems.map((item) =>
            item.id === editingItem.id
              ? { ...editingItem, ...formValues, date: selectedDateForModal }
              : item,
          );
          setCalendarItems(updatedItems);
          alert('计划已更新');
        } else {
          const newItem: CourseCalendarItem = {
            id: dayjs().valueOf().toString(),
            date: selectedDateForModal,
            ...formValues,
            title: formValues.title || '未命名计划',
            courseType: formValues.courseType || 'other',
          };
          setCalendarItems([...calendarItems, newItem]);
          alert('计划已添加');
        }
        setIsModalVisible(false);
        form.resetFields();
      })
      .catch((info) => {
        console.log('Validate Failed:', info);
      });
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setEditingItem(null);
  };

  const courseOptions = Object.entries(courseTypeLabels)
    .filter(([key]) => key !== 'review')
    .map(([value, label]) => ({
      value: value as CourseCalendarItem['courseType'],
      label,
    }));

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
    const currentMonth = value.format('YYYY年 M月');

    const goToPreviousMonth = () => {
      const newDate = value.subtract(1, 'month');
      onChange(newDate);
    };

    const goToNextMonth = () => {
      const newDate = value.add(1, 'month');
      onChange(newDate);
    };

    return (
      <Row
        justify="space-between"
        align="middle"
        style={{ padding: '8px 16px', borderBottom: '1px solid #E5E7EB' }}
      >
        <Col>
          <Title
            level={3}
            style={{ margin: 0, color: '#111827', fontWeight: 700 }}
          >
            课程日历
          </Title>
        </Col>
        <Col>
          <Space align="center">
            <Button
              shape="circle"
              icon={<LeftOutlined />}
              onClick={goToPreviousMonth}
              style={{ borderColor: 'transparent' }}
            />
            <Text
              style={{ fontSize: '18px', fontWeight: 500, color: '#000000' }}
            >
              {currentMonth}
            </Text>
            <Button
              shape="circle"
              icon={<RightOutlined />}
              onClick={goToNextMonth}
              style={{ borderColor: 'transparent' }}
            />
          </Space>
        </Col>
        <Col>
          <div
            style={{
              background: '#F3F4F6',
              borderRadius: '8px',
              padding: '4px',
            }}
          >
            <Button
              type="text"
              icon={
                <PlusOutlined style={{ fontSize: '20px', color: '#111827' }} />
              }
              onClick={() => handleOpenModalForAdd(currentPanelDate)}
              style={{
                background: '#FFFFFF',
                borderRadius: '6px',
                boxShadow: '0px 1px 2px 0px rgba(0, 0, 0, 0.05)',
              }}
            />
          </div>
        </Col>
      </Row>
    );
  };

  return (
    <div style={{ padding: '32px', background: '#FFFFFF' }}>
      <style>
        {`
          .add-course-calendar-custom .ant-picker-content thead th {
            padding: 12px 0 !important;
            text-align: center !important;
          }
          .add-course-calendar-custom .ant-picker-panel table {
            border-collapse: collapse !important;
          }
          .add-course-calendar-custom .ant-picker-cell {
            border: 1px solid #E5E7EB !important;
          }
          /* Optional: If antd's default cell padding/height interferes, uncomment and adjust */
          /*
          .add-course-calendar-custom .ant-picker-cell-inner {
            padding: 0 !important; 
            height: auto !important; 
            min-height: 120px; // Match your customDateCellContent div minHeight
          }
          */
        `}
      </style>
      <Calendar
        className="add-course-calendar-custom"
        onPanelChange={onCalendarPanelChange}
        headerRender={calendarHeaderRender}
        onSelect={(date) => {
          if (!getCalendarData(date, calendarItems).length) {
            handleOpenModalForAdd(date);
          }
        }}
        fullCellRender={(date, info) => {
          if (info.type === 'date') {
            return customDateCellContent(date, currentPanelDate);
          }
          return info.originNode;
        }}
      />

      <Modal
        title={
          editingItem
            ? `编辑计划 - ${editingItem.title}`
            : `为 ${selectedDateForModal.format('YYYY-MM-DD')} 添加计划`
        }
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText={editingItem ? '保存更改' : '添加计划'}
        cancelText="取消"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          name="course_calendar_item_form"
          initialValues={{ isReview: false, courseType: 'other' }}
        >
          <Form.Item
            name="title"
            label="计划标题"
            rules={[{ required: true, message: '请输入计划标题!' }]}
          >
            <Input placeholder="例如：复习第一章，完成项目报告" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="courseType"
                label="课程类型"
                rules={[{ required: true, message: '请选择课程类型!' }]}
              >
                <Select placeholder="选择课程类型">
                  {courseOptions.map((opt) => (
                    <Option key={opt.value} value={opt.value}>
                      <Tag
                        color={courseTypeColors[opt.value].main}
                        style={{ marginRight: 8 }}
                      />
                      {opt.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="startTime" label="开始时间 (可选)">
                <DatePicker.TimePicker
                  format="HH:mm"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="详细描述 (可选)">
            <Input.TextArea
              rows={3}
              placeholder="例如：重点掌握xx概念，完成xx练习题"
            />
          </Form.Item>
          <Form.Item
            name="repoUrl"
            label="GitHub 仓库链接 (可选)"
            rules={[{ type: 'url', message: '请输入有效的URL!' }]}
          >
            <Input placeholder="https://github.com/user/repo" />
          </Form.Item>
          <Form.Item
            name="isReview"
            valuePropName="checked"
            label="标记为待复习"
          >
            <Select placeholder="是否标记为待复习">
              <Option value={true}>是</Option>
              <Option value={false}>否</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Divider />
      <div
        style={{ padding: '16px', background: '#F9FAFB', borderRadius: '8px' }}
      >
        <Title
          level={5}
          style={{ marginBottom: '16px', color: '#111827', fontWeight: 500 }}
        >
          课程类型图例:
        </Title>
        <Space wrap size={[16, 16]}>
          {Object.entries(courseTypeLabels)
            .filter(
              ([typeKey]) =>
                typeKey !== 'review' ||
                !courseOptions.find((opt) => opt.value === 'review'),
            )
            .map(([typeKey, label]) => (
              <Space key={typeKey} align="center">
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor:
                      courseTypeColors[
                        typeKey as CourseCalendarItem['courseType']
                      ].main,
                  }}
                />
                <Text style={{ color: '#000000' }}>{label}</Text>
              </Space>
            ))}
          <Space align="center">
            <ClockCircleOutlined
              style={{ color: courseTypeColors.review.main, fontSize: '16px' }}
              title="待复习任务"
            />
            <Text style={{ color: '#000000' }}>: 待复习任务</Text>
          </Space>
        </Space>
      </div>
    </div>
  );
}
