import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Space, ColorPicker } from 'antd';
import type { Color } from 'antd/es/color-picker';

// Exporting this interface so it can be used in page.tsx
export interface CourseFormData {
  name: string;
  description: string;
  color: string;
}

interface CourseFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: CourseFormData) => void;
  initialData?: CourseFormData | null;
}

const predefinedColors = [
  '#4F46E5', // Indigo
  '#10B981', // Emerald
  '#EF4444', // Red
  '#F59E0B', // Amber
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#F97316', // Orange
];

const CourseFormModal: React.FC<CourseFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [form] = Form.useForm<CourseFormData>();

  // colorValue can be Color object or string. Store hex string in form.
  const [colorValue, setColorValue] = useState<Color | string>(
    () => initialData?.color || predefinedColors[0],
  );

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.setFieldsValue({
          name: initialData.name,
          description: initialData.description,
          color: initialData.color,
        });
        setColorValue(initialData.color);
      } else {
        form.resetFields();
        const defaultColor = predefinedColors[0];
        form.setFieldsValue({ color: defaultColor, name: '', description: '' });
        setColorValue(defaultColor);
      }
    }
  }, [initialData, form, open]);

  const handleFormSubmit = () => {
    form
      .validateFields()
      .then((values) => {
        // Ensure color is a hex string before submitting
        const finalColor =
          typeof colorValue === 'string'
            ? colorValue
            : (colorValue as Color).toHexString();
        onSubmit({ ...values, color: finalColor });
      })
      .catch((info) => {
        console.log('Validate Failed:', info);
      });
  };

  // Handles color change from both predefined buttons and ColorPicker
  const handleColorChange = (newColor: Color | string) => {
    const hexColor =
      typeof newColor === 'string' ? newColor : newColor.toHexString();
    setColorValue(newColor); // Keep Color object for picker if it provides it, or string for predefined
    form.setFieldsValue({ color: hexColor }); // Update form with hex string
  };

  return (
    <Modal
      title={initialData ? '编辑课程' : '添加新课程'}
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="back" onClick={onClose}>
          取消
        </Button>,
        <Button key="submit" type="primary" onClick={handleFormSubmit}>
          {initialData ? '保存更改' : '创建课程'}
        </Button>,
      ]}
      width={800} // Width from design
    >
      <Form
        form={form}
        layout="vertical"
        name="course_form"
        initialValues={{
          name: initialData?.name || '',
          description: initialData?.description || '',
          color: initialData?.color || predefinedColors[0],
        }}
      >
        <Form.Item
          name="name"
          label={<span>课程名称</span>}
          rules={[{ required: true, message: '请输入课程名称!' }]}
        >
          <Input placeholder="请输入课程名称" />
        </Form.Item>

        <Form.Item
          name="description"
          label={<span>课程描述</span>}
          rules={[{ required: true, message: '请输入课程描述!' }]}
        >
          <Input.TextArea rows={4} placeholder="请输入课程描述" />
        </Form.Item>

        <Form.Item
          name="color"
          label={<span>课程颜色</span>}
          rules={[{ required: true, message: '请选择一个课程颜色!' }]}
        >
          <div>
            <Space
              wrap
              size={[12, 12]}
              style={{ marginTop: '8px' }}
              align="center"
            >
              {predefinedColors.map((color) => (
                <Button
                  key={color}
                  onClick={() => handleColorChange(color)}
                  style={{
                    width: '32px',
                    height: '32px',
                    background: color,
                    borderRadius: '6px',
                    border:
                      (typeof colorValue === 'string'
                        ? colorValue
                        : (colorValue as Color).toHexString()) === color
                        ? '2px solid #4F46E5'
                        : '2px solid transparent',
                    padding: 0,
                  }}
                  aria-label={`选择颜色 ${color}`}
                />
              ))}
              <ColorPicker
                value={colorValue}
                onChange={handleColorChange}
                showText
              />
            </Space>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CourseFormModal;
