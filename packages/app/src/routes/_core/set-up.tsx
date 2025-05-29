import { createFileRoute } from '@tanstack/react-router';
import {
  Select,
  Switch,
  Card,
  List,
  Button,
  Form,
  Space,
  InputNumber,
  Spin,
  Input,
  App,
} from 'antd';
import {
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  DownOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import { useRequest } from 'ahooks';
import type { ReviewRuleDto } from '@y/interface/review-settings/dto/review-rule.dto.ts';
import {
  getUserSettingsApi,
  updateEmailApi,
  updateNotificationSettingsApi,
} from '@/apis/settings';
import type { UpdateEmailDto } from '@y/interface/settings/dto/update-email.dto.ts';
import type { UpdateReviewNotificationSettingsDto } from '@y/interface/settings/dto/update-review-notification-settings.dto.js';

export const Route = createFileRoute('/_core/set-up')({
  component: SettingsComponent,
});
// 时间间隔单位
export const IntervalUnit = {
  MINUTE: 'MINUTE', // 分钟
  HOUR: 'HOUR', // 小时
  DAY: 'DAY', // 天
} as const;

// 循环模式：只提醒一次或循环提醒
export const ReviewMode = {
  ONCE: 'ONCE', // 一次性复习
  RECURRING: 'RECURRING', // 循环复习
} as const;

const friendlyReminderUnitOptions = [
  { value: IntervalUnit.MINUTE, label: '分钟后' },
  { value: IntervalUnit.HOUR, label: '小时后' },
  { value: IntervalUnit.DAY, label: '天后' },
];

const repetitionOptions = [
  { value: ReviewMode.ONCE, label: '仅一次' },
  { value: ReviewMode.RECURRING, label: '循环' },
];

function SettingsComponent() {
  const [form] = Form.useForm<UpdateReviewNotificationSettingsDto>();

  const { message } = App.useApp();

  const { loading: loadingInitialSettings } = useRequest(getUserSettingsApi, {
    onSuccess: (data) => {
      form.setFieldsValue(data);
    },
    onError: (err) => {
      message.error(err.message);
    },
  });

  const { run: saveSettings, loading: savingSettings } = useRequest(
    updateNotificationSettingsApi,
    {
      manual: true,
      onSuccess: () => {
        message.success('设置已成功保存！');
      },
      onError: (err) => {
        message.error(err.message);
      },
    },
  );

  const onFinish = async (values: UpdateReviewNotificationSettingsDto) => {
    saveSettings(values);
  };

  const handleResetRules = () => {
    const defaultRules: ReviewRuleDto[] = [
      {
        id: uuidv4(),
        value: 1,
        unit: IntervalUnit.HOUR,
        mode: ReviewMode.ONCE,
        note: '',
      },
      {
        id: uuidv4(),
        value: 3,
        unit: IntervalUnit.HOUR,
        mode: ReviewMode.ONCE,
        note: '',
      },
      {
        id: uuidv4(),
        value: 1,
        unit: IntervalUnit.DAY,
        mode: ReviewMode.ONCE,
        note: '',
      },
      {
        id: uuidv4(),
        value: 2,
        unit: IntervalUnit.DAY,
        mode: ReviewMode.ONCE,
        note: '',
      },
      {
        id: uuidv4(),
        value: 3,
        unit: IntervalUnit.DAY,
        mode: ReviewMode.ONCE,
        note: '',
      },
      {
        id: uuidv4(),
        value: 7,
        unit: IntervalUnit.DAY,
        mode: ReviewMode.ONCE,
        note: '',
      },
      {
        id: uuidv4(),
        value: 15,
        unit: IntervalUnit.DAY,
        mode: ReviewMode.ONCE,
        note: '',
      },
      {
        id: uuidv4(),
        value: 30,
        unit: IntervalUnit.DAY,
        mode: ReviewMode.ONCE,
        note: '',
      },
      {
        id: uuidv4(),
        value: 90,
        unit: IntervalUnit.DAY,
        mode: ReviewMode.ONCE,
        note: '',
      },
    ];
    form.setFieldsValue({ reviewRules: defaultRules });
    message.info('规则已重置为默认值，请记得点击保存。');
  };

  const globalRemindersFormEnabled = Form.useWatch(
    [`notificationSettings`, `globalNotification`],
    form,
  );
  const { run: runUpdateEmail, loading: loadingUpdateEmail } = useRequest(
    updateEmailApi,
    {
      manual: true,
      onError(e) {
        message.error(e.message);
      },
      onSuccess() {
        message.success(`更新邮箱成功。`);
      },
    },
  );

  const onUpdateEmail = async () => {
    const value = (await form.validateFields(['email'])) as unknown as {
      email: string;
    };
    runUpdateEmail(value);
  };

  return (
    <Spin spinning={loadingInitialSettings} tip="加载中...">
      <div className="container mx-auto">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            notificationSettings: {
              globalNotification: true,
              emailNotifications: true,
              inAppNotification: true,
            },
            reviewRules: [],
          }}
        >
          <Card title="邮箱设置" className="mb-8">
            <Form.Item label="邮箱">
              <Space>
                <Form.Item<UpdateEmailDto>
                  noStyle
                  name="email"
                  rules={[
                    { required: true, message: '请输入邮箱' },
                    { type: 'email', message: '请输入正确的邮箱地址' },
                  ]}
                >
                  <Input className="w-100" placeholder="请输入邮箱地址" />
                </Form.Item>
                <Button
                  type="primary"
                  onClick={onUpdateEmail}
                  loading={loadingUpdateEmail}
                >
                  更新邮箱
                </Button>
              </Space>
            </Form.Item>
          </Card>
          <Card title="通知管理" className="mb-8">
            <div className="flex flex-justify-between">
              <div>开启提醒服务</div>
              <Form.Item
                name={['notificationSettings', 'globalNotification']}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </div>
            <div className="flex flex-justify-between">
              <div>邮件通知</div>
              <Form.Item
                name={['notificationSettings', 'emailNotification']}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </div>
            <div className="flex flex-justify-between">
              <div>应用内通知</div>
              <Form.Item
                name={['notificationSettings', 'inAppNotification']}
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </div>
          </Card>
          <Card title="自定义提醒规则" className="mb-8">
            <Form.List name="reviewRules">
              {(fields, { add, remove }) => (
                <>
                  <List
                    itemLayout="horizontal"
                    dataSource={fields}
                    locale={{
                      emptyText: globalRemindersFormEnabled
                        ? '暂无自定义规则，请添加新的规则。'
                        : '提醒服务已关闭',
                    }}
                    renderItem={(field, index: number) => {
                      const { key, ...restField } = field;
                      return (
                        <List.Item
                          key={key}
                          style={{
                            padding: '12px 0',
                            borderBottom:
                              index < fields.length - 1
                                ? '1px solid #f0f0f0'
                                : 'none',
                            opacity: !globalRemindersFormEnabled ? 0.5 : 1,
                          }}
                          actions={[]}
                        >
                          <Space align="baseline">
                            <Form.Item
                              {...restField}
                              name={[field.name, 'value']}
                              rules={[
                                { required: true, message: '请输入时间值' },
                                {
                                  type: 'number',
                                  min: 1,
                                  message: '必须大于0',
                                },
                              ]}
                              noStyle
                            >
                              <InputNumber
                                placeholder="时间值 (>0)"
                                style={{ width: '120px' }}
                              />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              name={[field.name, 'unit']}
                              rules={[
                                { required: true, message: '请选择单位' },
                              ]}
                              noStyle
                            >
                              <Select
                                suffixIcon={<DownOutlined />}
                                style={{ width: '110px' }}
                                options={friendlyReminderUnitOptions}
                              />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              name={[field.name, 'mode']}
                              rules={[
                                { required: true, message: '请选择周期' },
                              ]}
                              noStyle
                            >
                              <Select
                                suffixIcon={<DownOutlined />}
                                style={{ width: '110px' }}
                                options={repetitionOptions}
                              />
                            </Form.Item>
                            <Form.Item
                              {...restField}
                              name={[field.name, 'note']}
                              noStyle
                            >
                              <Input
                                placeholder="规则描述 (可选)"
                                style={{ width: '180px' }}
                              />
                            </Form.Item>
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              onClick={() => remove(field.name)}
                            >
                              删除
                            </Button>
                          </Space>
                        </List.Item>
                      );
                    }}
                  />
                  <Button
                    type="link"
                    className="px-0!"
                    onClick={() =>
                      add({
                        id: uuidv4(),
                        value: 1,
                        unit: IntervalUnit.DAY,
                        mode: ReviewMode.ONCE,
                        note: '',
                      } satisfies ReviewRuleDto)
                    }
                    icon={<PlusOutlined />}
                    size="large"
                  >
                    添加新规则
                  </Button>
                </>
              )}
            </Form.List>
          </Card>

          <div className="flex">
            <div className="flex-1"></div>
            <Space>
              <Button icon={<UndoOutlined />} onClick={handleResetRules}>
                重置规则
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                loading={savingSettings}
                style={{ minWidth: '120px' }}
                onClick={() => form.submit()}
              >
                保存设置
              </Button>
            </Space>
          </div>
        </Form>
      </div>
    </Spin>
  );
}
