import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { App, Button, Form, Input, Typography } from 'antd';
import type { FormProps } from 'antd';
import bg from '@/assets/images/bg.png';
import { loginApi } from '@/apis/auth';
import { useRequest } from 'ahooks';
import { useUserStore } from '@/stores/user.store';
import type { LoginDto } from '@y/interface/auth/dto/login.dto.js';

const { Title, Text } = Typography;

export const Route = createFileRoute('/login')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { setToken, setUser } = useUserStore((s) => s.actions);

  // 用户登录
  const { loading, run: login } = useRequest(loginApi, {
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
      }, 1500);
    },
  });

  const onLogin: FormProps<LoginDto>['onFinish'] = (values) => {
    login({
      username: values.username,
      password: values.password,
    });
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
            <Text type="secondary">请使用账号密码登录</Text>
          </div>

          <Form size="large" layout="vertical" onFinish={onLogin}>
            <Form.Item<LoginDto>
              label="用户名"
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入用户名" />
            </Form.Item>

            <Form.Item<LoginDto>
              label="密码"
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password placeholder="请输入密码" />
            </Form.Item>

            <Form.Item className="mt-8">
              <Button type="primary" htmlType="submit" loading={loading} block>
                登录
              </Button>
            </Form.Item>
          </Form>
        </div>
        <div className="text-center">
          <div className="mb-4">
            <Button
              type="link"
              onClick={() => navigate({ to: '/forgot-password' })}
              style={{ padding: 0 }}
            >
              忘记密码？
            </Button>
          </div>
          <div>
            <Text type="secondary">还没有账号？</Text>
            <Button
              type="link"
              size="small"
              onClick={() => navigate({ to: '/register' })}
              style={{ padding: 0, height: 'auto' }}
            >
              立即注册
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
