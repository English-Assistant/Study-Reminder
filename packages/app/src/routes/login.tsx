import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { App, Button, Form, Input, Layout, Typography } from 'antd';
import type { FormProps } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import bg from '@/assets/images/bg.png';
import { loginOrRegister } from '@/apis/auth';
import { useRequest } from 'ahooks';
import type { LoginOrRegisterDto } from '@y/interface/auth/dto/login-or-register.dto.ts';
import { useUserStore } from '@/stores/user.store';

const { Title, Text } = Typography;
const { Content, Sider } = Layout;

// Motiff Colors
const MOTIFF_TEXT_PRIMARY_DARK = '#111827';
const MOTIFF_TEXT_SECONDARY_DARK = '#4B5563';
const MOTIFF_PLACEHOLDER_COLOR = '#9CA3AF';

export const Route = createFileRoute('/login')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { setToken, setUser } = useUserStore((s) => s.actions);

  const { loading, run } = useRequest(loginOrRegister, {
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
      }, 3000);
    },
  });

  const onFinish: FormProps<LoginOrRegisterDto>['onFinish'] = (values) => {
    run(values);
  };

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      <Sider
        width={864}
        style={{
          background: `url(${bg}) no-repeat`,
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center', // Center the inner content vertically if needed
          alignItems: 'center', // Center the inner content horizontally if needed
        }}
      >
        <div className="px-16 py-64 color-#fff">
          <div className="text-size-12 lh-18 mb-4">Study Reminder</div>
          <div className="text-size-4.5 lh-7">
            加入我们的学习社区，与数百万学习者一起成长
          </div>
        </div>
      </Sider>
      <Content
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '50px', // Original padding, might need adjustment
        }}
      >
        <div
          style={{
            width: '400px', // Adjusted to Motiff form width
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center', // Center form items if form itself isn't full width
          }}
        >
          <div
            style={{ textAlign: 'left', marginBottom: '40px', width: '100%' }}
          >
            <Title
              level={2}
              style={{
                // fontFamily: 'Archivo', // Keep AntD default or define globally
                color: MOTIFF_TEXT_PRIMARY_DARK,
                fontSize: '32px', // From Motiff
                fontWeight: 700, // From Motiff
                lineHeight: '48px', // From Motiff
                marginBottom: '12px', // From Motiff: gap 12px
              }}
            >
              欢迎使用学习提醒
            </Title>
            <Text
              style={{
                // fontFamily: 'Inter', // Keep AntD default or define globally
                color: MOTIFF_TEXT_SECONDARY_DARK,
                fontSize: '14px', // From Motiff
                lineHeight: '20px', // From Motiff
              }}
            >
              未注册用户将会自动注册，已注册用户可直接登录。
            </Text>
          </div>

          <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            style={{ width: '100%' }} // Form takes full width of its 400px container
            layout="vertical"
            size="large"
          >
            <Form.Item<LoginOrRegisterDto>
              name="username"
              rules={[
                { required: true, message: '请输入您的用户名!' },
                // 最小长度4位
                {
                  min: 4,
                  message: '用户名长度不能小于4位',
                },
              ]}
            >
              <Input
                prefix={
                  <UserOutlined
                    className="site-form-item-icon"
                    style={{ color: MOTIFF_PLACEHOLDER_COLOR }}
                  />
                }
                placeholder="输入您的用户名" // Placeholder from Motiff
              />
            </Form.Item>

            <Form.Item<LoginOrRegisterDto>
              name="password"
              rules={[
                { required: true, message: '请输入您的密码!' },
                // 最小长度4位
                {
                  min: 8,
                  message: '密码长度不能小于8位',
                },
              ]}
            >
              <Input.Password
                prefix={
                  <LockOutlined
                    className="site-form-item-icon"
                    style={{ color: MOTIFF_PLACEHOLDER_COLOR }}
                  />
                }
                placeholder="输入您的密码" // Placeholder from Motiff
              />
            </Form.Item>

            <Form.Item style={{ marginTop: '20px', marginBottom: '30px' }}>
              <Button type="primary" htmlType="submit" block loading={loading}>
                登录
              </Button>
            </Form.Item>
          </Form>
        </div>
      </Content>
    </Layout>
  );
}
