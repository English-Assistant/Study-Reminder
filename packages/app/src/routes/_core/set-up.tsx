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
  InputNumber,
  Popconfirm,
  message,
} from 'antd';
import {
  SaveOutlined,
  DownOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

export const Route = createFileRoute('/_core/set-up')({
  component: SettingsComponent,
});

interface ReminderRule {
  id: string;
  value: number | null;
  unit: 'minutes' | 'hours' | 'days' | 'months';
  repetition: 'once' | 'loop';
}

interface CourseSetting {
  id: string;
  name: string;
}

const initialGlobalReminderRules: ReminderRule[] = [
  { id: uuidv4(), value: 1, unit: 'hours', repetition: 'once' },
  { id: uuidv4(), value: 1, unit: 'days', repetition: 'once' },
  { id: uuidv4(), value: 2, unit: 'days', repetition: 'once' },
  { id: uuidv4(), value: 4, unit: 'days', repetition: 'once' },
  { id: uuidv4(), value: 7, unit: 'days', repetition: 'once' },
  { id: uuidv4(), value: 15, unit: 'days', repetition: 'once' },
  { id: uuidv4(), value: 30, unit: 'days', repetition: 'once' },
  { id: uuidv4(), value: 60, unit: 'days', repetition: 'once' },
  { id: uuidv4(), value: 90, unit: 'days', repetition: 'once' },
];

const initialCourseSettings: CourseSetting[] = [
  { id: 'math', name: '高等数学' },
  { id: 'algebra', name: '线性代数' },
  { id: 'datastruct', name: '数据结构与算法' },
  { id: 'os', name: '操作系统' },
  { id: 'networks', name: '计算机网络' },
  { id: 'db', name: '数据库系统原理' },
  { id: 'discrete', name: '离散数学' },
  { id: 'compiler', name: '编译原理' },
  { id: 'ai', name: '人工智能' },
  { id: 'ml', name: '机器学习' },
];

const reminderUnitOptions = [
  { value: 'minutes', label: '分钟后' },
  { value: 'hours', label: '小时后' },
  { value: 'days', label: '天后' },
  { value: 'months', label: '个月后' },
];

const repetitionOptions = [
  { value: 'once', label: '仅一次' },
  { value: 'loop', label: '循环' },
];

function SettingsComponent() {
  const [form] = Form.useForm();
  const [globalRemindersEnabled, setGlobalRemindersEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [appNotifications, setAppNotifications] = useState(true);
  const [courseSettings] = useState<CourseSetting[]>(initialCourseSettings);
  const [customReminderRules, setCustomReminderRules] = useState<
    ReminderRule[]
  >(initialGlobalReminderRules);
  const [isSaveDisabled, setIsSaveDisabled] = useState(false);

  useEffect(() => {
    if (globalRemindersEnabled && customReminderRules.length > 0) {
      const hasInvalidRule = customReminderRules.some(
        (rule) =>
          rule.value === null ||
          typeof rule.value !== 'number' ||
          rule.value <= 0,
      );
      setIsSaveDisabled(hasInvalidRule);
    } else {
      setIsSaveDisabled(false);
    }
  }, [globalRemindersEnabled, customReminderRules]);

  const handleAddCustomRule = () => {
    setCustomReminderRules((prevRules) => [
      ...prevRules,
      { id: uuidv4(), value: null, unit: 'days', repetition: 'once' },
    ]);
  };

  const handleDeleteCustomRule = (ruleId: string) => {
    setCustomReminderRules((prevRules) =>
      prevRules.filter((rule) => rule.id !== ruleId),
    );
  };

  const handleUpdateCustomRule = (
    ruleId: string,
    field: keyof Omit<ReminderRule, 'id'>,
    value: number | string | null,
  ) => {
    setCustomReminderRules((prevRules) =>
      prevRules.map((rule) =>
        rule.id === ruleId ? { ...rule, [field]: value } : rule,
      ),
    );
  };

  const onFinish = (values: Record<string, never>) => {
    if (globalRemindersEnabled && customReminderRules.length > 0) {
      const hasInvalidRule = customReminderRules.some(
        (rule) =>
          rule.value === null ||
          typeof rule.value !== 'number' ||
          rule.value <= 0,
      );
      if (hasInvalidRule) {
        message.error('自定义提醒规则中的时间值必须是大于0的有效数字。');
        return;
      }
    }

    console.log('Settings saved:', {
      globalRemindersEnabled,
      emailNotifications: globalRemindersEnabled ? emailNotifications : false,
      appNotifications: globalRemindersEnabled ? appNotifications : false,
      customReminderRules: globalRemindersEnabled ? customReminderRules : [],
      courseSettings,
      ...values,
    });
    message.success('设置已保存！');
  };

  return (
    <div style={{ padding: '20px 40px', maxWidth: '1120px', margin: '0 auto' }}>
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Card style={{ marginBottom: '24px' }}>
          <Title level={4}>通用复习提醒设置</Title>
          <Paragraph type="secondary">
            如果关闭，则不会进行任何提醒通知，下方所有相关设置也将被禁用。
          </Paragraph>
          <Form.Item label="开启提醒服务">
            <Switch
              checked={globalRemindersEnabled}
              onChange={setGlobalRemindersEnabled}
            />
          </Form.Item>
        </Card>

        <Card style={{ marginBottom: '24px' }}>
          <Title level={4}>通知渠道</Title>
          <Paragraph type="secondary">
            选择接收复习提醒的渠道。仅当提醒服务开启时有效。
          </Paragraph>
          <List itemLayout="horizontal">
            <List.Item
              actions={[
                <Switch
                  key="email-switch"
                  checked={emailNotifications}
                  onChange={setEmailNotifications}
                  disabled={!globalRemindersEnabled}
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
                  key="app-switch"
                  checked={appNotifications}
                  onChange={setAppNotifications}
                  disabled={!globalRemindersEnabled}
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

        <Card style={{ marginBottom: '24px' }}>
          <Title level={4}>自定义复习规则模板</Title>
          <Paragraph type="secondary">
            {`在此处定义提醒规则。仅当上方的"开启提醒服务"打开时生效。`}
          </Paragraph>
          <List
            itemLayout="vertical"
            dataSource={customReminderRules}
            renderItem={(rule, index) => (
              <List.Item
                key={rule.id}
                style={{
                  padding: '12px 0',
                  borderBottom:
                    index < customReminderRules.length - 1
                      ? '1px solid #f0f0f0'
                      : 'none',
                  opacity: !globalRemindersEnabled ? 0.5 : 1,
                }}
              >
                <Space
                  align="baseline"
                  style={{ display: 'flex', width: '100%', flexWrap: 'wrap' }}
                >
                  <Text
                    style={{ minWidth: '60px' }}
                  >{`规则 ${index + 1}:`}</Text>
                  <InputNumber
                    min={1}
                    value={rule.value}
                    onChange={(value) =>
                      handleUpdateCustomRule(rule.id, 'value', value)
                    }
                    placeholder="时间值 (>0)"
                    style={{ width: '120px', marginRight: '8px' }}
                    disabled={!globalRemindersEnabled}
                  />
                  <Select
                    value={rule.unit}
                    onChange={(value) =>
                      handleUpdateCustomRule(rule.id, 'unit', value)
                    }
                    suffixIcon={<DownOutlined />}
                    style={{ width: '110px', marginRight: '8px' }}
                    disabled={!globalRemindersEnabled}
                  >
                    {reminderUnitOptions.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                  <Select
                    value={rule.repetition}
                    onChange={(value) =>
                      handleUpdateCustomRule(rule.id, 'repetition', value)
                    }
                    suffixIcon={<DownOutlined />}
                    style={{ width: '100px', marginRight: '8px' }}
                    disabled={!globalRemindersEnabled}
                  >
                    {repetitionOptions.map((opt) => (
                      <Option key={opt.value} value={opt.value}>
                        {opt.label}
                      </Option>
                    ))}
                  </Select>
                  <Popconfirm
                    title="确定要删除这条规则吗？"
                    onConfirm={() => handleDeleteCustomRule(rule.id)}
                    okText="确定"
                    cancelText="取消"
                    disabled={!globalRemindersEnabled}
                  >
                    <Button
                      icon={<DeleteOutlined />}
                      type="text"
                      danger
                      style={{ marginLeft: 'auto' }}
                      disabled={!globalRemindersEnabled}
                    />
                  </Popconfirm>
                </Space>
              </List.Item>
            )}
          />
          <Button
            type="dashed"
            onClick={handleAddCustomRule}
            icon={<PlusOutlined />}
            size="large"
            style={{ marginTop: '16px', width: '100%' }}
            disabled={!globalRemindersEnabled}
          >
            添加新规则
          </Button>
        </Card>

        <Form.Item style={{ textAlign: 'right' }}>
          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            disabled={isSaveDisabled}
          >
            保存设置
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
