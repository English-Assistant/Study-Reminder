import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Space, ColorPicker } from 'antd';
import type { Color } from 'antd/es/color-picker';
import type { Course } from '@y/interface/common/prisma.type.ts';

interface CourseFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: Course) => void;
  initialData?: Course | null;
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

// Helper function to generate a truly random hex color
const generateRandomHexColor = (): string => {
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += Math.floor(Math.random() * 16).toString(16);
  }
  return color.toUpperCase(); // Ensure uppercase hex, e.g., #AABBCC
};

const CourseFormModal: React.FC<CourseFormModalProps> = ({
  open,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [form] = Form.useForm<Course>();

  const [colorValue, setColorValue] = useState<Color | string>(() => {
    if (initialData?.color) {
      return initialData.color;
    }
    // For new course, generate a truly random color initially
    return generateRandomHexColor();
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        form.setFieldsValue({
          name: initialData.name,
          note: initialData.note || undefined,
          color: initialData.color,
        });
        setColorValue(initialData.color);
      } else {
        // New course: reset fields and set a truly random default color
        form.resetFields();
        const randomColor = generateRandomHexColor(); // Generate a new random color
        form.setFieldsValue({
          name: '',
          note: '',
          color: randomColor,
        });
        setColorValue(randomColor);
      }
    }
  }, [initialData, form, open]);

  const handleFormSubmit = async () => {
    const values = await form.validateFields();
    const finalColor =
      typeof colorValue === 'string'
        ? colorValue
        : (colorValue as Color).toHexString();
    onSubmit({ ...values, color: finalColor });
  };

  // Handles color change from both predefined buttons and ColorPicker
  const handleColorChange = (newColor: Color | string) => {
    const hexColor =
      typeof newColor === 'string' ? newColor : newColor.toHexString();
    setColorValue(newColor); // Keep Color object for picker if it provides it, or string for predefined
    form.setFieldsValue({ color: hexColor }); // Update form with hex string
  };

  const handleRandomColorButtonClick = () => {
    const randomColor = generateRandomHexColor();
    handleColorChange(randomColor); // Use existing handler to update state and form
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
          note: initialData?.note || '',
          color: initialData?.color || colorValue, // Uses the stateful colorValue (random for new)
        }}
      >
        <Form.Item<Course>
          name="name"
          label={<span>课程名称</span>}
          rules={[{ required: true, message: '请输入课程名称!' }]}
        >
          <Input placeholder="请输入课程名称" />
        </Form.Item>

        <Form.Item<Course> name="note" label={<span>课程备注</span>}>
          <Input.TextArea rows={4} placeholder="请输入课程备注" />
        </Form.Item>

        <Form.Item<Course>
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
                        ? '2px solid #4F46E5' // Active border color
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
              <Button onClick={handleRandomColorButtonClick}>随机颜色</Button>
            </Space>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CourseFormModal;
