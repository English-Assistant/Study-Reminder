import { App, Button, Card, Form, Input, Space } from 'antd';
import type { FormInstance } from 'antd';
import type { UpdateEmailDto } from '@y/interface/settings/dto/update-email.dto.js';
import { useRequest } from 'ahooks';
import { updateEmailApi } from '@/apis/settings.ts';

interface AccountSettingsProps {
  form: FormInstance;
  showUnregisterConfirm: () => void;
}

export function AccountSettings({
  form,
  showUnregisterConfirm,
}: AccountSettingsProps) {
  const { message } = App.useApp();

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
    <Card title="账号设置" className="mb-8">
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
      <Form.Item label="账号操作">
        <Button type="primary" danger onClick={showUnregisterConfirm}>
          注销账号
        </Button>
      </Form.Item>
    </Card>
  );
}
