import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { App, Button, Form, Input, Typography } from 'antd';
import type { FormProps } from 'antd';
import bg from '@/assets/images/bg.png';
import { loginOrRegisterApi } from '@/apis/auth';
import { useRequest } from 'ahooks';
import type { LoginOrRegisterDto } from '@y/interface/auth/dto/login-or-register.dto.ts';
import { useUserStore } from '@/stores/user.store';

const { Title, Text } = Typography;

export const Route = createFileRoute('/login')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { setToken, setUser } = useUserStore((s) => s.actions);

  const { loading, run } = useRequest(loginOrRegisterApi, {
    manual: true,
    onError(e) {
      message.error(e.message);
    },
    onSuccess(data) {
      setToken(data.access_token);
      setUser(data.user);
      message.success('登录成功');
      setTimeout(() => {
        navigate({ to: '/dashboard' });
      }, 2000);
    },
  });

  const onFinish: FormProps<LoginOrRegisterDto>['onFinish'] = (values) => {
    values.email = values.email || undefined;
    run(values);
  };

  return (
    <div className="h-100vh flex">
      <div
        className="w-60vw h-100vh"
        style={{
          background: `url(${bg}) no-repeat`,
          backgroundSize: '100% auto',
        }}
      ></div>
      <div className="py-12 px-16 flex-1 h-100vh flex flex-col flex-justify-between">
        <div>
          <div className="mb-12">
            <Title level={1}>欢迎回来</Title>
            <Text type="secondary">登录账号以继续使用</Text>
          </div>
          <Form size="large" layout="vertical" onFinish={onFinish}>
            <Form.Item<LoginOrRegisterDto>
              label="用户名"
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入用户名"></Input>
            </Form.Item>
            <Form.Item<LoginOrRegisterDto>
              label="密码"
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入密码"></Input.Password>
            </Form.Item>

            <Form.Item<LoginOrRegisterDto>
              label="邮箱"
              name="email"
              rules={[
                {
                  type: 'email',
                  message: '请输入正确的邮箱',
                },
              ]}
              extra={
                <div>
                  如果用户未注册，则需要提供邮箱，如果已经注册则可以不填直接登陆。
                </div>
              }
            >
              <Input placeholder="请输入邮箱"></Input>
            </Form.Item>

            <Form.Item className="mt-12">
              <Button type="primary" htmlType="submit" loading={loading} block>
                登录/注册
              </Button>
            </Form.Item>
          </Form>
        </div>
        <div className="text-center">
          <Text type="secondary">
            未注册用户会自动注册，已注册用户会自动登陆
          </Text>
        </div>
      </div>
    </div>
  );
}
