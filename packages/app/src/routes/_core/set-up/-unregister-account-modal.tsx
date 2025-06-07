import { Button, Form, Input, message, Modal, Space } from 'antd';
import { useRequest } from 'ahooks';
import {
  confirmUnregisterApi,
  sendUnregisterCodeApi,
} from '../../../apis/auth.ts';
import type { UnregisterDto } from '@y/interface/auth/dto/unregister.dto.js';

interface UnregisterAccountModalProps {
  open: boolean;
  onClose: () => void;
}
export function UnregisterAccountModal({
  open,
  onClose,
}: UnregisterAccountModalProps) {
  const [form] = Form.useForm<UnregisterDto>();

  const { run: sendCode, loading: isSendingCode } = useRequest(
    sendUnregisterCodeApi,
    {
      manual: true,
      onSuccess: (data) => {
        message.success(data.message);
      },
      onError: (e) => {
        message.error(e.message);
      },
    },
  );

  const { run: confirmUnregister, loading: isConfirming } = useRequest(
    confirmUnregisterApi,
    {
      manual: true,
      onSuccess: () => {
        message.success('账号已成功注销');
        onClose();
        // full page reload to clear all state
        window.location.href = '/login';
      },
      onError: (e) => {
        message.error(e.message);
      },
    },
  );

  const handleOk = () => {
    form.validateFields().then((values) => {
      confirmUnregister(values);
    });
  };

  return (
    <Modal
      title="注销账号"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={isConfirming}
      okText="确认注销"
      cancelText="取消"
    >
      <p className="mb-4">
        为了您的账号安全，我们需要验证您的身份。请点击发送验证码，我们将会把验证码发送到您绑定的邮箱中。
      </p>
      <Form form={form} layout="vertical">
        <Form.Item label="验证码">
          <Space>
            <Form.Item<UnregisterDto>
              noStyle
              name="verificationCode"
              rules={[{ required: true, message: '请输入验证码' }]}
            >
              <Input placeholder="请输入6位验证码" />
            </Form.Item>
            <Button
              type="primary"
              onClick={() => sendCode()}
              loading={isSendingCode}
            >
              发送验证码
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
}
