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
  Space,
  Button,
  Popconfirm,
} from 'antd';
import type { Dayjs } from 'dayjs';
import type { FormInstance } from 'antd';
import { useRequest } from 'ahooks';
import {
  createStudyRecordApi,
  updateStudyRecordApi,
  deleteStudyRecordApi,
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

  const { run: runDeleteEntry, loading: loadingDelete } = useRequest(
    deleteStudyRecordApi,
    {
      manual: true,
      onError(e) {
        message.error(e.message);
      },
      onSuccess() {
        message.success('学习记录已删除!');
        onSuccess();
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
          startTime: dayjs(editingItem.studiedAt),
        });
      } else {
        form.setFieldsValue({
          startTime: dayjs(),
        });
      }
    }
  }, [editingItem, form, isVisible, isEditMode]);

  const handleOk = async () => {
    const values = await form.validateFields();

    let studiedAtDate: Dayjs;

    if (isEditMode && editingItem) {
      // 编辑模式
      if (values.startTime) {
        // 如果选择了时间，使用选择的完整时间
        studiedAtDate = values.startTime;
      } else {
        // 如果没有选择时间，使用当前时间的小时和分钟 + 原记录的日期
        const originalDate = dayjs(editingItem.studiedAt);
        const currentTime = dayjs();
        studiedAtDate = originalDate
          .hour(currentTime.hour())
          .minute(currentTime.minute())
          .second(0)
          .millisecond(0);
      }
    } else {
      // 新增模式
      if (values.startTime) {
        // 如果选择了时间，使用当前日期 + 选择的时间（小时分钟）
        studiedAtDate = selectedDate
          .hour(values.startTime.hour())
          .minute(values.startTime.minute())
          .second(0)
          .millisecond(0);
      } else {
        // 如果没有选择时间，使用当前日期 + 当前时间的小时和分钟
        const currentTime = dayjs();
        studiedAtDate = selectedDate
          .hour(currentTime.hour())
          .minute(currentTime.minute())
          .second(0)
          .millisecond(0);
      }
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
      afterClose={() => form.resetFields()}
      footer={
        <div className="flex">
          <div className="flex-1 text-left">
            {editingItem ? (
              <Popconfirm
                title="删除提醒"
                description={<div>确定要删除 {editingItem.textTitle} 吗？</div>}
                onConfirm={() => {
                  runDeleteEntry(editingItem.id);
                }}
              >
                <Button loading={loadingDelete} danger>
                  删除
                </Button>
              </Popconfirm>
            ) : null}
          </div>
          <Space>
            <Button onClick={onCancel}>取消</Button>
            <Button
              onClick={handleOk}
              type="primary"
              loading={isEditMode ? loadingUpdate : loadingCreate}
            >
              {isEditMode ? '保存更改' : '添加记录'}
            </Button>
          </Space>
        </div>
      }
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
            <Form.Item name="startTime" label="学习时间">
              <DatePicker.TimePicker
                format="HH:mm"
                style={{ width: '100%' }}
                allowClear
                placeholder="选择时间"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="description" label="备注">
          <Input.TextArea
            rows={3}
            placeholder="例如：重点掌握xx概念，完成xx练习题"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
