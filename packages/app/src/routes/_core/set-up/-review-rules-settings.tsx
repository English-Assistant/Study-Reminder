import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  List,
  Select,
  Space,
  Typography,
} from 'antd';
import {
  DeleteOutlined,
  DownOutlined,
  PlusOutlined,
  SaveOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import type { FormInstance } from 'antd';
import { v4 as uuidv4 } from 'uuid';
import type { ReviewRuleDto } from '@y/interface/review-settings/dto/review-rule.dto.js';

const friendlyReminderUnitOptions = [
  { value: 'MINUTE', label: '分钟后' },
  { value: 'HOUR', label: '小时后' },
  { value: 'DAY', label: '天后' },
];

const repetitionOptions = [
  { value: 'ONCE', label: '仅一次' },
  { value: 'RECURRING', label: '循环' },
];

interface ReviewRulesSettingsProps {
  form: FormInstance;
  onSave: () => void;
  onReset: () => void;
  isSaving: boolean;
}

export function ReviewRulesSettings({
  form,
  onSave,
  onReset,
  isSaving,
}: ReviewRulesSettingsProps) {
  const globalRemindersFormEnabled = Form.useWatch(
    ['notificationSettings', 'globalNotification'],
    form,
  );

  return (
    <Card title="自定义提醒规则" className="mb-8">
      <Typography.Text type="secondary" className="block mb-4">
        在这里定义您的复习周期。例如，您可以设置在学习后1小时、1天、3天和7天分别进行一次复习。系统将根据这些规则自动为您安排复习计划。
      </Typography.Text>
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
                        name={[field.name, 'mode']}
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
                  unit: 'DAY',
                  mode: 'ONCE',
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
      <div className="flex mt-4">
        <div className="flex-1"></div>
        <Space>
          <Button icon={<UndoOutlined />} onClick={onReset}>
            重置规则
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            loading={isSaving}
            style={{ minWidth: '120px' }}
            onClick={onSave}
          >
            保存设置
          </Button>
        </Space>
      </div>
    </Card>
  );
}
