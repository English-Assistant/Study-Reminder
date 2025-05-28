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
import { Dayjs } from 'dayjs';
import type { FormInstance } from 'antd';
import { useRequest } from 'ahooks';
import {
  createManualReviewEntry,
  updateManualReviewEntry,
} from '@/apis/manual-review-entries';
import type { CreateManualReviewEntryDto } from '@y/interface/manual-review-entries-module/dto/create-manual-review-entry.dto.ts';
import type { UpdateManualReviewEntryDto } from '@y/interface/manual-review-entries-module/dto/update-manual-review-entry.dto.ts';
import { getAllCourses } from '@/apis/courses';
import type { Course as PrismaCourse } from '@y/interface/common/prisma.type.ts';
import type { ManualReviewEntryDto } from '@y/interface/manual-review-entries-module/dto/manual-review-entry.dto.ts';
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
  editingItem: ManualReviewEntryDto | null;
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
  >(getAllCourses, {
    onError: (err) => {
      message.error(err.message || '加载课程列表失败');
    },
  });

  const { run: runCreateEntry, loading: loadingCreate } = useRequest(
    createManualReviewEntry,
    {
      manual: true,
      onSuccess: () => {
        message.success('打卡成功，已加入复习计划!');
        form.resetFields();
        onSuccess();
      },
      onError: (error) => {
        message.error(error.message || '添加打卡记录失败');
      },
    },
  );

  const { run: runUpdateEntry, loading: loadingUpdate } = useRequest(
    updateManualReviewEntry,
    {
      manual: true,
      onSuccess: () => {
        message.success('打卡记录已更新!');
        form.resetFields();
        onSuccess();
      },
      onError: (error) => {
        message.error(error.message || '更新打卡记录失败');
      },
    },
  );

  useEffect(() => {
    if (isVisible) {
      if (isEditMode && editingItem) {
        form.setFieldsValue({
          title: editingItem.title,
          description: editingItem.description,
          courseId: editingItem.courseId,
          startTime: editingItem.reviewTime
            ? dayjs(editingItem.reviewTime, 'HH:mm')
            : undefined,
        });
      }
    }
  }, [editingItem, form, isVisible, isEditMode]);

  const handleOk = async () => {
    const values = await form.validateFields();

    if (isEditMode && editingItem) {
      const payload: UpdateManualReviewEntryDto = {
        title: values.title,
        description: values.description,
        courseId: values.courseId,
        reviewDate: editingItem.reviewDate,
        reviewTime: values.startTime
          ? values.startTime.format('HH:mm')
          : undefined,
      };
      runUpdateEntry(editingItem.id, payload);
    } else {
      const payload: CreateManualReviewEntryDto = {
        title: values.title,
        description: values.description,
        courseId: values.courseId,
        reviewDate: selectedDate.format('YYYY-MM-DD'),
        reviewTime: values.startTime
          ? values.startTime.format('HH:mm')
          : undefined,
      };
      runCreateEntry(payload);
    }
  };

  return (
    <Modal
      title={
        isEditMode
          ? `编辑打卡记录 - ${editingItem?.title || ''}`
          : `为 ${selectedDate.format('YYYY-MM-DD')} 添加打卡记录`
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
        name={isEditMode ? 'edit_manual_entry_form' : 'add_manual_entry_form'}
        initialValues={{
          startTime: dayjs(),
        }}
      >
        <Form.Item
          name="title"
          label="打卡标题"
          rules={[{ required: true, message: '请输入打卡标题!' }]}
        >
          <Input placeholder="例如：完成数学第一章练习" />
        </Form.Item>

        <Form.Item
          name="courseId"
          label="选择课程"
          rules={[{ required: true, message: '请选择一个课程!' }]}
        >
          <Select
            placeholder="请选择打卡的课程"
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
            <Form.Item name="startTime" label="打卡时间 (可选)">
              <DatePicker.TimePicker format="HH:mm" style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="详细描述 (可选)">
          <Input.TextArea
            rows={3}
            placeholder="例如：重点掌握xx概念，完成xx练习题"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
