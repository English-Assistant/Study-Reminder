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
  Spin,
  Alert,
  Input,
  Row,
  Col,
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
import { getGlobalSettings, setGlobalSettings } from '@/apis/review-settings';
import type { GlobalReviewSettingsDto } from '@y/interface/review-settings-module/dto/global-review-settings.dto.ts';
import type { SetGlobalReviewRulesDto } from '@y/interface/review-settings-module/dto/set-global-review-rules.dto.ts';
import type { ReviewRuleDto } from '@y/interface/review-settings-module/dto/review-rule.dto.ts';
import type {
  ReviewRuleUnit,
  ReviewRuleRepetition,
} from '@y/interface/common/prisma.type.js';
import type { FC } from 'react';

const { Title, Paragraph, Text } = Typography;

export const Route = createFileRoute('/_core/set-up')({
  component: SettingsComponent,
});

const friendlyReminderUnitOptions = [
  { value: 'MINUTES' as ReviewRuleUnit, label: '分钟后' },
  { value: 'HOURS' as ReviewRuleUnit, label: '小时后' },
  { value: 'DAYS' as ReviewRuleUnit, label: '天后' },
  { value: 'MONTHS' as ReviewRuleUnit, label: '个月后' },
];

const repetitionOptions = [
  { value: 'ONCE' as ReviewRuleRepetition, label: '仅一次' },
  { value: 'LOOP' as ReviewRuleRepetition, label: '循环' },
];

/*
 * 二次封装的antd组件，包含switch
 */
const SwitchFormItem: FC<{
  label: string;
  [x: string]: unknown;
}> = ({ label, ...rest }) => {
  return (
    <Row>
      <Col flex={1}>
        <Text>{label}</Text>
      </Col>
      <Col>
        <Switch {...rest}></Switch>
      </Col>
    </Row>
  );
};

function SettingsComponent() {
  const [form] = Form.useForm<SetGlobalReviewRulesDto>();

  const { message } = App.useApp();

  const { loading: loadingInitialSettings } = useRequest<
    GlobalReviewSettingsDto,
    []
  >(getGlobalSettings, {
    onSuccess: (data) => {
      form.setFieldsValue(data);
    },
    onError: (err) => {
      message.error(err.message);
    },
  });

  const {
    run: saveSettings,
    loading: savingSettings,
    error: saveError,
  } = useRequest<GlobalReviewSettingsDto, [SetGlobalReviewRulesDto]>(
    setGlobalSettings,
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

  const onFinish = async (values: SetGlobalReviewRulesDto) => {
    const payload: SetGlobalReviewRulesDto = {
      ...values,
      rules: values.rules
        ? values.rules.map((rule: ReviewRuleDto) => ({
            ...rule,
            value: Number(rule.value),
            id:
              rule.id && /^[0-9a-fA-F]{24}$/.test(rule.id as string)
                ? rule.id
                : undefined,
          }))
        : [],
    };

    saveSettings(payload);
  };

  const handleResetRules = () => {
    const defaultRules: ReviewRuleDto[] = [
      {
        id: uuidv4(),
        value: 1,
        unit: 'HOURS' as ReviewRuleUnit,
        repetition: 'ONCE' as ReviewRuleRepetition,
        description: '',
      },
      {
        id: uuidv4(),
        value: 3,
        unit: 'HOURS' as ReviewRuleUnit,
        repetition: 'ONCE' as ReviewRuleRepetition,
        description: '',
      },
      {
        id: uuidv4(),
        value: 1,
        unit: 'DAYS' as ReviewRuleUnit,
        repetition: 'ONCE' as ReviewRuleRepetition,
        description: '',
      },
      {
        id: uuidv4(),
        value: 2,
        unit: 'DAYS' as ReviewRuleUnit,
        repetition: 'ONCE' as ReviewRuleRepetition,
        description: '',
      },
      {
        id: uuidv4(),
        value: 3,
        unit: 'DAYS' as ReviewRuleUnit,
        repetition: 'ONCE' as ReviewRuleRepetition,
        description: '',
      },
      {
        id: uuidv4(),
        value: 7,
        unit: 'DAYS' as ReviewRuleUnit,
        repetition: 'ONCE' as ReviewRuleRepetition,
        description: '',
      },
      {
        id: uuidv4(),
        value: 15,
        unit: 'DAYS' as ReviewRuleUnit,
        repetition: 'ONCE' as ReviewRuleRepetition,
        description: '',
      },
      {
        id: uuidv4(),
        value: 30,
        unit: 'DAYS' as ReviewRuleUnit,
        repetition: 'ONCE' as ReviewRuleRepetition,
        description: '',
      },
      {
        id: uuidv4(),
        value: 90,
        unit: 'DAYS' as ReviewRuleUnit,
        repetition: 'ONCE' as ReviewRuleRepetition,
        description: '',
      },
    ];
    form.setFieldsValue({ rules: defaultRules });
    message.info('规则已重置为默认值，请记得点击保存。');
  };

  const globalRemindersFormEnabled = Form.useWatch('enabled', form);

  const onUpdateEmail = async () => {
    const value = await form.validateFields(['email']);
    console.log(value);
  };

  return (
    <Spin spinning={loadingInitialSettings} tip="加载中...">
      <Card title={<Title level={3}>设置</Title>}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            enabled: true,
            emailNotifications: true,
            appNotifications: true,
            rules: [],
          }}
        >
          <Form.Item label="邮箱" layout="horizontal">
            <Space>
              <Form.Item
                noStyle
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入正确的邮箱地址' },
                ]}
              >
                <Input className="w-100" placeholder="请输入邮箱地址" />
              </Form.Item>
              <Button type="primary" onClick={onUpdateEmail}>
                更新邮箱
              </Button>
            </Space>
          </Form.Item>

          <Form.Item<GlobalReviewSettingsDto>
            name="enabled"
            label={null}
            valuePropName="checked"
          >
            <SwitchFormItem label="开启提醒服务" />
          </Form.Item>

          <Divider />

          <Title level={4} style={{ marginTop: '20px' }}>
            通知渠道
          </Title>
          <Paragraph type="secondary">
            选择您希望如何接收复习提醒。仅当上方的&quot;开启提醒服务&quot;打开时生效。
          </Paragraph>
          <Form.Item<GlobalReviewSettingsDto>
            name="emailNotifications"
            label={null}
            valuePropName="checked"
          >
            <SwitchFormItem label="邮件通知" />
          </Form.Item>

          <Form.Item<GlobalReviewSettingsDto>
            name="appNotifications"
            valuePropName="checked"
            label={null}
          >
            <SwitchFormItem label="应用内通知" />
          </Form.Item>

          <Divider />

          <Title level={4} style={{ marginTop: '20px' }}>
            自定义复习规则模板
          </Title>
          <Paragraph type="secondary">
            在此处定义提醒规则。仅当上方的&quot;开启提醒服务&quot;打开时生效。
          </Paragraph>

          {saveError && (
            <Alert
              message="保存规则时出错"
              description={saveError.message}
              type="error"
              showIcon
              closable
              style={{ marginBottom: '16px' }}
            />
          )}

          <Form.List name="rules">
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
                        actions={[
                          <Popconfirm
                            key={`delete-${key}`}
                            title="确定删除这条规则吗？"
                            onConfirm={() => remove(field.name)}
                            okText="确定"
                            cancelText="取消"
                          >
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                            >
                              删除
                            </Button>
                          </Popconfirm>,
                        ]}
                      >
                        <Space align="baseline">
                          <Form.Item
                            {...restField}
                            name={[field.name, 'value']}
                            rules={[
                              { required: true, message: '请输入时间值' },
                              { type: 'number', min: 1, message: '必须大于0' },
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
                            rules={[{ required: true, message: '请选择单位' }]}
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
                            name={[field.name, 'repetition']}
                            rules={[{ required: true, message: '请选择周期' }]}
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
                            name={[field.name, 'description']}
                            noStyle
                          >
                            <Input
                              placeholder="规则描述 (可选)"
                              style={{ width: '180px' }}
                            />
                          </Form.Item>
                        </Space>
                      </List.Item>
                    );
                  }}
                />
                <Button
                  type="dashed"
                  onClick={() =>
                    add({
                      id: uuidv4(),
                      value: 1,
                      unit: 'DAYS' as ReviewRuleUnit,
                      repetition: 'ONCE' as ReviewRuleRepetition,
                      description: '',
                    })
                  }
                  icon={<PlusOutlined />}
                  style={{ marginTop: '12px', width: '100%' }}
                  size="large"
                >
                  添加新规则
                </Button>
                <Button
                  icon={<UndoOutlined />}
                  onClick={handleResetRules}
                  style={{ marginTop: '12px', marginLeft: '8px' }}
                >
                  重置规则
                </Button>
              </>
            )}
          </Form.List>

          <Divider />

          <Form.Item style={{ marginTop: '24px', textAlign: 'right' }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={savingSettings}
              style={{ minWidth: '120px' }}
            >
              保存设置
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Spin>
  );
}
