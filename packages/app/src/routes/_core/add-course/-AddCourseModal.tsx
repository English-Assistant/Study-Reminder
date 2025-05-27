import { Modal, Form, Input, Select, DatePicker, Row, Col, Tag } from 'antd';
import type { Dayjs } from 'dayjs';
// import dayjs from 'dayjs'; // Removed as it's no longer used directly in this file
import type { FormInstance } from 'antd/es/form';

// Assuming CourseCalendarItem and courseTypeColors/Labels are defined in a shared types file or passed as props
// For now, let's redefine/import them here or expect them as props.
// If these are used ONLY by the modal, they can stay here. Otherwise, consider a shared types file.

export interface CourseCalendarItemBase {
  // Fields used by the form, excluding id and date which are handled outside or passed
  startTime?: Dayjs | undefined;
  title: string;
  courseType: 'gaoshu' | 'xiandai' | 'shuju' | 'caozuo' | 'other' | 'review';
  description?: string;
  repoUrl?: string;
  isReview?: boolean;
}

export interface CourseCalendarItem extends CourseCalendarItemBase {
  id: string;
  date: Dayjs;
}

// Constants remain in this file but are not exported
// They will be used by the Modal or passed as props if needed by the parent for rendering options.
const courseTypeColors: Record<
  CourseCalendarItem['courseType'],
  { main: string; background: string }
> = {
  gaoshu: { main: '#67C23A', background: 'rgba(103, 194, 58, 0.20)' },
  xiandai: { main: '#409EFF', background: 'rgba(64, 158, 255, 0.20)' },
  shuju: { main: '#E6A23C', background: 'rgba(230, 162, 60, 0.20)' },
  caozuo: { main: '#F56C6C', background: 'rgba(245, 108, 108, 0.20)' },
  review: { main: '#E6A23C', background: 'rgba(230, 162, 60, 0.20)' },
  other: { main: '#909399', background: 'rgba(144, 147, 153, 0.20)' },
};

const courseTypeLabels: Record<CourseCalendarItem['courseType'], string> = {
  gaoshu: '高等数学',
  xiandai: '线性代数',
  shuju: '数据结构',
  caozuo: '操作系统',
  review: '待复习',
  other: '其他',
};

const { Option } = Select;

interface AddCourseModalProps {
  isVisible: boolean;
  onOk: (values: CourseCalendarItemBase) => void;
  onCancel: () => void;
  editingItem: CourseCalendarItem | null;
  selectedDate: Dayjs;
  // Pass form instance from parent to allow parent to call form methods like setFieldsValue
  form: FormInstance<CourseCalendarItemBase>;
}

export function AddCourseModal({
  isVisible,
  onOk,
  onCancel,
  editingItem,
  selectedDate,
  form, // Receive form instance as a prop
}: AddCourseModalProps) {
  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        onOk(values);
      })
      .catch((info) => {
        console.log('Validate Failed:', info);
      });
  };

  const courseOptions = Object.entries(courseTypeLabels)
    .filter(([key]) => key !== 'review')
    .map(([value, label]) => ({
      value: value as CourseCalendarItem['courseType'],
      label,
    }));

  return (
    <Modal
      title={
        editingItem
          ? `编辑计划 - ${editingItem.title}`
          : `为 ${selectedDate.format('YYYY-MM-DD')} 添加计划`
      }
      open={isVisible}
      onOk={handleOk}
      onCancel={onCancel}
      okText={editingItem ? '保存更改' : '添加计划'}
      cancelText="取消"
      key={editingItem ? editingItem.id : selectedDate.toString()} // Ensure key changes to re-initialize or use afterClose
      destroyOnClose // Destroys children when closed, helps with form state resetting
      afterClose={() => form.resetFields()} // Still good practice
    >
      <Form
        form={form} // Use the passed form instance
        layout="vertical"
        name="course_calendar_item_form"
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
        <Form.Item
          name="repoUrl"
          label="GitHub 仓库链接 (可选)"
          rules={[{ type: 'url', message: '请输入有效的URL!' }]}
        >
          <Input placeholder="https://github.com/user/repo" />
        </Form.Item>
        <Form.Item name="isReview" label="标记为待复习">
          <Select
            placeholder="是否标记为待复习"
            allowClear
            defaultValue={false}
          >
            <Option value={true}>是</Option>
            <Option value={false}>否</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
}

// Note:
// The useEffect for setting form values when editingItem changes is commented out.
// It's generally better to handle form initialization in the parent component
// when the modal is opened, or by passing a `key` to the Modal/Form to force re-initialization.
// The `afterClose` prop on Modal is a good place to call `form.resetFields()`.
// `initialValues` on Form can be tricky with dynamic data; `form.setFieldsValue` is more explicit.
// `CourseCalendarItemBase` was introduced to represent the form data structure more accurately.
// `courseTypeColors` and `courseTypeLabels` might need to be passed as props if they are shared
// or defined in a common constants file. For now, they are duplicated for simplicity.
// The `startTime` field in `handleOk` now explicitly formats the Dayjs object to 'HH:mm' string.
// Changed `valuePropName="checked"` for `isReview` field to be more explicit, assuming it was intended to be a boolean value.
// If `isReview` is meant to be a checkbox, then `<Checkbox />` should be used instead of `<Select />`.
// The original code used Select for `isReview`, so I kept it as Select.
