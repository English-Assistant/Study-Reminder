import { createFileRoute } from '@tanstack/react-router';
import {
  Typography,
  Select,
  Switch,
  Card,
  List,
  Button,
  Form,
  Space,
  Divider,
} from 'antd';
import { SaveOutlined, DownOutlined } from '@ant-design/icons';
import React, { useState } from 'react';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export const Route = createFileRoute('/_core/set-up')({
  component: SettingsComponent,
});

// Mock data for course-specific settings
interface CourseSetting {
  id: string;
  name: string;
  overrideEnabled: boolean;
  frequency: string; // e.g., 'daily', 'weekly', 'monthly', 'disabled'
}

const initialCourseSettings: CourseSetting[] = [
  { id: 'math', name: '高等数学', overrideEnabled: true, frequency: 'daily' },
  {
    id: 'algebra',
    name: '线性代数',
    overrideEnabled: true,
    frequency: 'weekly',
  },
  {
    id: 'datastruct',
    name: '数据结构与算法',
    overrideEnabled: false,
    frequency: 'daily',
  },
  { id: 'os', name: '操作系统', overrideEnabled: true, frequency: 'monthly' },
  {
    id: 'networks',
    name: '计算机网络',
    overrideEnabled: true,
    frequency: 'weekly',
  },
  {
    id: 'db',
    name: '数据库系统原理',
    overrideEnabled: false,
    frequency: 'daily',
  },
  {
    id: 'discrete',
    name: '离散数学',
    overrideEnabled: true,
    frequency: 'weekly',
  },
  {
    id: 'compiler',
    name: '编译原理',
    overrideEnabled: true,
    frequency: 'monthly',
  },
  { id: 'ai', name: '人工智能', overrideEnabled: true, frequency: 'daily' },
  {
    id: 'ml',
    name: '机器学习',
    overrideEnabled: false,
    frequency: 'weekly',
  },
];

const frequencyOptions = [
  { value: 'daily', label: '每天' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
  { value: 'disabled', label: '禁用提醒' },
];

function SettingsComponent() {
  const [form] = Form.useForm();
  const [generalFrequency, setGeneralFrequency] = useState('daily');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [appNotifications, setAppNotifications] = useState(true);
  const [courseSettings, setCourseSettings] = useState<CourseSetting[]>(
    initialCourseSettings,
  );

  const handleCourseSettingChange = (
    id: string,
    field: keyof CourseSetting,
    value: any,
  ) => {
    setCourseSettings((prevSettings) =>
      prevSettings.map((course) =>
        course.id === id ? { ...course, [field]: value } : course,
      ),
    );
  };

  const onFinish = (values: any) => {
    console.log('Settings saved:', {
      generalFrequency,
      emailNotifications,
      appNotifications,
      courseSettings,
      ...values, // any other form values if we add more generic form fields
    });
    alert('设置已保存！');
  };

  return (
    <div style={{ padding: '20px 40px', maxWidth: '1120px', margin: '0 auto' }}>
      {/* Header part is handled by _core.tsx, so we only implement the content */}

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Card style={{ marginBottom: '24px' }}>
          <Title level={4}>通用复习提醒设置</Title>
          <Paragraph type="secondary">
            配置所有课程的默认复习提醒频率。
          </Paragraph>
          <Form.Item label="提醒频率" tooltip="选择默认的提醒频率。">
            <Select
              value={generalFrequency}
              onChange={setGeneralFrequency}
              suffixIcon={<DownOutlined />}
              style={{ width: '200px' }}
            >
              {frequencyOptions.map((opt) => (
                <Option key={opt.value} value={opt.value}>
                  {opt.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Card>

        <Card style={{ marginBottom: '24px' }}>
          <Title level={4}>通知渠道</Title>
          <Paragraph type="secondary">选择接收复习提醒的渠道。</Paragraph>
          <List itemLayout="horizontal">
            <List.Item
              actions={[
                <Switch
                  checked={emailNotifications}
                  onChange={setEmailNotifications}
                />,
              ]}
            >
              <List.Item.Meta
                title={<Text strong>电子邮件提醒</Text>}
                description="通过电子邮件接收复习提醒。"
              />
            </List.Item>
            <Divider style={{ margin: '0' }} />
            <List.Item
              actions={[
                <Switch
                  checked={appNotifications}
                  onChange={setAppNotifications}
                />,
              ]}
            >
              <List.Item.Meta
                title={<Text strong>应用内推送提醒</Text>}
                description="通过应用内推送接收复习提醒。"
              />
            </List.Item>
          </List>
        </Card>

        <Card
          title={<Title level={4}>课程特定提醒设置</Title>}
          style={{ marginBottom: '24px' }}
        >
          <Paragraph type="secondary">
            为特定课程设置不同的提醒频率或禁用提醒。
          </Paragraph>
          <List
            itemLayout="vertical"
            dataSource={courseSettings}
            renderItem={(course) => (
              <List.Item
                key={course.id}
                style={{
                  padding: '16px',
                  border: '1px solid #f0f0f0',
                  borderRadius: '8px',
                  marginBottom: '12px',
                }}
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong style={{ fontSize: '16px' }}>
                    {course.name}
                  </Text>
                  <Paragraph type="secondary">
                    {course.overrideEnabled
                      ? `覆盖通用设置为: ${frequencyOptions.find((opt) => opt.value === course.frequency)?.label}`
                      : '使用通用设置'}
                  </Paragraph>
                  <Space
                    style={{ justifyContent: 'space-between', width: '100%' }}
                  >
                    <Select
                      value={course.frequency}
                      onChange={(value) =>
                        handleCourseSettingChange(course.id, 'frequency', value)
                      }
                      disabled={!course.overrideEnabled}
                      suffixIcon={<DownOutlined />}
                      style={{ width: '180px' }}
                    >
                      {frequencyOptions.map((opt) => (
                        <Option key={opt.value} value={opt.value}>
                          {opt.label}
                        </Option>
                      ))}
                    </Select>
                    <Switch
                      checked={course.overrideEnabled}
                      onChange={(checked) =>
                        handleCourseSettingChange(
                          course.id,
                          'overrideEnabled',
                          checked,
                        )
                      }
                      size="small"
                    />
                  </Space>
                </Space>
              </List.Item>
            )}
          />
        </Card>

        <Form.Item style={{ textAlign: 'right' }}>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
            保存设置
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
