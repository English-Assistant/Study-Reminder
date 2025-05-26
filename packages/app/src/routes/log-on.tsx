import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Button, Form, Input, Layout, Typography } from 'antd';
import type { FormProps } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Content, Sider } = Layout;

export const Route = createFileRoute('/log-on')({
  component: RouteComponent,
});

// 定义表单数据类型
type LoginFormValues = {
  username?: string;
  password?: string;
  remember?: boolean;
};

function RouteComponent() {
  const navigate = useNavigate();

  const onFinish: FormProps<LoginFormValues>['onFinish'] = (values) => {
    console.log('Success:', values);
    // 模拟登录逻辑
    // 实际应用中，这里会调用 API进行验证
    if (values.username === 'admin' && values.password === 'password') {
      console.log('登录成功，正在跳转到仪表盘...');
      navigate({ to: '/dashboard' }); // 跳转到仪表盘
    } else {
      // 简单提示，实际应用中可以使用 Ant Design 的 message 或 notification 组件
      alert('用户名或密码错误！');
      console.log('登录失败: 用户名或密码错误');
    }
  };

  const onFinishFailed: FormProps<LoginFormValues>['onFinishFailed'] = (
    errorInfo,
  ) => {
    console.log('Failed:', errorInfo);
  };

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      <Content
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '50px',
        }}
      >
        <div
          style={{
            width: '720px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <Title
              level={2}
              style={{
                fontFamily: 'Archivo',
                fontSize: '40px',
                fontWeight: 400,
                marginBottom: '10px',
              }}
            >
              欢迎使用学习提醒
            </Title>
            <Text
              style={{
                fontFamily: 'Inter',
                fontSize: '16px',
              }}
            >
              快速登录，开始您的学习旅程
            </Text>
          </div>

          <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            style={{ width: '480px' }}
            layout="vertical"
          >
            <Form.Item
              name="username"
              style={{ marginBottom: '17px' }}
              rules={[{ required: true, message: '请输入您的用户名!' }]}
            >
              <Input
                prefix={<UserOutlined className="site-form-item-icon" />}
                placeholder="输入您的用户名 (admin)"
                style={{
                  borderRadius: '6px',
                  height: '43px',
                }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              style={{ marginBottom: '36px' }}
              rules={[{ required: true, message: '请输入您的密码!' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="site-form-item-icon" />}
                placeholder="输入您的密码 (password)"
                style={{
                  borderRadius: '6px',
                  height: '43px',
                }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: '30px' }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                style={{
                  height: '44px',
                  borderRadius: '10px',
                  fontSize: '16px',
                }}
              >
                登录
              </Button>
            </Form.Item>
          </Form>
          <Text style={{ fontFamily: 'Inter', fontSize: '14px' }}>
            未注册用户会自动注册，已注册用户则会登录。
          </Text>
        </div>
      </Content>
      <Sider width={720} style={{ backgroundColor: '#D9D9D9' }}>
        {/* 右侧图片区域，可以根据需要添加图片 */}
      </Sider>
    </Layout>
  );
}
