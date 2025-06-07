import { Card, Form, Switch, Typography } from 'antd';

interface NotificationSettingsProps {
  onValueChange: () => void;
}

export function NotificationSettings({
  onValueChange,
}: NotificationSettingsProps) {
  return (
    <Card title="通知管理" className="mb-8">
      <Typography.Text type="secondary">
        管理您希望如何接收复习提醒。您可以全局开启或关闭提醒服务，并选择通过邮件或应用内通知接收提醒。
      </Typography.Text>

      <div className="flex flex-justify-between mt-6">
        <div>开启提醒服务</div>
        <Form.Item
          name={['notificationSettings', 'globalNotification']}
          valuePropName="checked"
        >
          <Switch onChange={onValueChange} />
        </Form.Item>
      </div>
      <div className="flex flex-justify-between">
        <div>邮件通知</div>
        <Form.Item
          name={['notificationSettings', 'emailNotification']}
          valuePropName="checked"
        >
          <Switch onChange={onValueChange} />
        </Form.Item>
      </div>
      <div className="flex flex-justify-between">
        <div>应用内通知</div>
        <Form.Item
          name={['notificationSettings', 'inAppNotification']}
          valuePropName="checked"
        >
          <Switch onChange={onValueChange} />
        </Form.Item>
      </div>
    </Card>
  );
}
