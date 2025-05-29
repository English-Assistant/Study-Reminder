import {
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Row,
  Col,
  Tag,
  App,
  Spin,
} from 'antd';
import type { Dayjs } from 'dayjs';
import type { FormInstance } from 'antd';
import { useRequest } from 'ahooks';
import {
  createStudyRecordApi,
  updateStudyRecordApi,
} from '@/apis/study-records';
import type { CreateStudyRecordDto } from '@y/interface/study-records/dto/create-study-record.dto.ts';
import type { UpdateStudyRecordDto } from '@y/interface/study-records/dto/update-study-record.dto.ts';
import type { StudyRecordWithReviewsDto } from '@y/interface/study-records/dto/study-record-with-reviews.dto.ts';
import { getAllCoursesApi } from '@/apis/courses';
import type { Course as PrismaCourse } from '@y/interface/common/prisma.type.ts';
import dayjs from 'dayjs';
import { useEffect } from 'react';

interface EntryFormValues {
  title: string;
  description?: string;
  startTime?: Dayjs;
  courseId: string;
}

const { Option } = Select;

interface EntryFormModalProps {
  isVisible: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  editingItem: StudyRecordWithReviewsDto | null;
  selectedDate: Dayjs;
  form: FormInstance<EntryFormValues>;
}

export function EntryFormModal({
  isVisible,
  onSuccess,
  onCancel,
  editingItem,
  selectedDate,
  form,
}: EntryFormModalProps) {
  const { message } = App.useApp();
  const isEditMode = !!editingItem;

  const { data: coursesData, loading: loadingCourses } = useRequest<
    PrismaCourse[],
    []
  >(getAllCoursesApi, {
    onError: (err) => {
      message.error((err as Error).message || '加载课程列表失败');
    },
  });

  const { run: runCreateEntry, loading: loadingCreate } = useRequest(
    createStudyRecordApi,
    {
      manual: true,
      onSuccess: () => {
        message.success('学习记录已添加!');
        form.resetFields();
        onSuccess();
      },
      onError: (error) => {
        message.error((error as Error).message || '添加学习记录失败');
      },
    },
  );

  const { run: runUpdateEntry, loading: loadingUpdate } = useRequest(
    (id: string, data: UpdateStudyRecordDto) => updateStudyRecordApi(id, data),
    {
      manual: true,
      onSuccess: () => {
        message.success('学习记录已更新!');
        form.resetFields();
        onSuccess();
      },
      onError: (error) => {
        message.error((error as Error).message || '更新学习记录失败');
      },
    },
  );

  useEffect(() => {
    if (isVisible) {
      if (isEditMode && editingItem) {
        form.setFieldsValue({
          title: editingItem.textTitle,
          description: editingItem.note || undefined,
          courseId: editingItem.courseId,
          startTime: editingItem.studiedAt
            ? dayjs(editingItem.studiedAt)
            : undefined,
        });
      } else {
        // 创建模式下，可以预设 selectedDate 的时间为当前时间，或留空由用户选择
        // form.setFieldsValue({ startTime: dayjs().hour(selectedDate.hour()).minute(selectedDate.minute()) });
      }
    }
  }, [editingItem, form, isVisible, isEditMode /*, selectedDate */]);

  const handleOk = async () => {
    const values = await form.validateFields();

    let studiedAtDate: Dayjs;
    if (values.startTime) {
      const baseDate =
        isEditMode && editingItem ? dayjs(editingItem.studiedAt) : selectedDate;
      studiedAtDate = baseDate
        .hour(values.startTime.hour())
        .minute(values.startTime.minute())
        .second(0)
        .millisecond(0);
    } else {
      const baseDate =
        isEditMode && editingItem ? dayjs(editingItem.studiedAt) : selectedDate;
      studiedAtDate = baseDate.startOf('day');
    }

    if (isEditMode && editingItem) {
      const payload: UpdateStudyRecordDto = {
        textTitle: values.title,
        note: values.description,
        courseId: values.courseId,
        studiedAt: studiedAtDate.toISOString(),
      };
      runUpdateEntry(editingItem.id, payload);
    } else {
      const payload: CreateStudyRecordDto = {
        textTitle: values.title,
        note: values.description,
        courseId: values.courseId,
        studiedAt: studiedAtDate.toISOString(),
      };
      runCreateEntry(payload);
    }
  };

  return (
    <Modal
      title={
        isEditMode
          ? `编辑学习记录 - ${editingItem?.textTitle || ''}`
          : `为 ${selectedDate.format('YYYY-MM-DD')} 添加学习记录`
      }
      open={isVisible}
      onOk={handleOk}
      onCancel={onCancel}
      okText={isEditMode ? '保存更改' : '添加记录'}
      cancelText="取消"
      confirmLoading={isEditMode ? loadingUpdate : loadingCreate}
      afterClose={() => form.resetFields()}
    >
      <Form
        form={form}
        layout="vertical"
        name={isEditMode ? 'edit_study_record_form' : 'add_study_record_form'}
      >
        <Form.Item
          name="title"
          label="标题"
          rules={[{ required: true, message: '请输入标题!' }]}
        >
          <Input placeholder="例如：完成数学第一章练习" />
        </Form.Item>

        <Form.Item
          name="courseId"
          label="选择课程"
          rules={[{ required: true, message: '请选择一个课程!' }]}
        >
          <Select
            placeholder="请选择课程"
            loading={loadingCourses}
            showSearch
            optionFilterProp="label"
            filterOption={(input, option) =>
              String(option?.label ?? '')
                .toLowerCase()
                .includes(input.toLowerCase())
            }
            notFoundContent={loadingCourses ? <Spin size="small" /> : null}
          >
            {coursesData?.map((course) => (
              <Option key={course.id} value={course.id} label={course.name}>
                <Tag
                  color={course.color || '#108ee9'}
                  style={{ marginRight: 8 }}
                />
                {course.name}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="startTime" label="学习时间 (可选)">
              <DatePicker.TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="笔记 (可选)">
          <Input.TextArea
            rows={3}
            placeholder="例如：重点掌握xx概念，完成xx练习题"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
