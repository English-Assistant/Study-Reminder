import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { App, Button, Form, Input, Typography, Space, Steps } from 'antd';
import type { FormProps } from 'antd';
import { sendVerificationCodeApi, registerApi } from '@/apis/auth';
import { useRequest } from 'ahooks';
import { useUserStore } from '@/stores/user.store';
import { useState } from 'react';
import type { RegisterDto } from '@y/interface/auth/dto/register.dto.js';
import Logo from '@/assets/icons/about-page-logo.svg?react';
import Bg1 from '@/assets/images/bg1.svg?react';
import VerificationCodeInput from '@/components/VerificationCodeInput';

const { Title, Text, Link } = Typography;

export const Route = createFileRoute('/register')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const { setToken, setUser } = useUserStore((s) => s.actions);
  const [form] = Form.useForm<RegisterDto>();
  const [step, setStep] = useState<'email' | 'register'>('email');
  const [userEmail, setUserEmail] = useState<string>('');

  // 定义步骤
  const steps = [
    {
      title: '验证邮箱',
      description: '获取验证码',
    },
    {
      title: '完善信息',
      description: '设置账号密码',
    },
  ];

  const currentStep = step === 'email' ? 0 : 1;

  // 发送验证码
  const { loading: sendingCode, run: sendCode } = useRequest(
    sendVerificationCodeApi,
    {
      manual: true,
      onError(e) {
        message.error(e.message);
      },
      onSuccess() {
        message.success('验证码已发送到您的邮箱');
        setStep('register');
        // 重置整个表单，然后重新设置邮箱值
        form.resetFields();
        form.setFieldsValue({ email: userEmail });
      },
    },
  );

  // 用户注册
  const { loading: registering, run: register } = useRequest(registerApi, {
    manual: true,
    onError(e) {
      message.error(e.message);
    },
    onSuccess(data) {
      setToken(data.access_token);
      setUser(data.user);
      message.success('注册成功，欢迎使用！');
      setTimeout(() => {
        navigate({ to: '/dashboard' });
      }, 1500);
    },
  });

  const onSendCode = (values: Pick<RegisterDto, 'email'>) => {
    setUserEmail(values.email);
    form.setFieldsValue({ email: values.email });
    sendCode({
      email: values.email,
      type: 'register',
    });
  };

  const handleResendCode = () => {
    sendCode({
      email: userEmail,
      type: 'register',
    });
  };

  const onRegister: FormProps<RegisterDto>['onFinish'] = (values) => {
    register({
      username: values.username,
      password: values.password,
      email: values.email,
      verificationCode: values.verificationCode,
    });
  };

  return (
    <div className="flex">
      <div className="w-40vw p-16">
        <Space align="center" className="mb-16">
          <Logo></Logo>
          <Title className="mb-0!" level={1}>
            欢迎注册 Study Reminder
          </Title>
        </Space>

        <div className="color-#666 lh-6.5 text-size-4">
          请根据提示完善注册信息后来使用,
          <br></br>
          如果在注册过程中遇到问题也可以点击
          <Link
            href="https://github.com/English-Assistant/Study-Reminder/issues"
            target="_blank"
            rel="noreferrer"
            className="color-#666 lh-6.5 text-size-4"
          >
            进行反馈
          </Link>
          。
        </div>
        <Bg1 className="pos-fixed left-0 bottom-0"></Bg1>
      </div>
      <div className="flex-1 p-16 flex flex-col flex-justify-between h-100vh">
        <div className="mb-36">
          <Steps current={currentStep} items={steps} />
        </div>
        <div className="translate-y--15vh">
          {step === 'email' ? (
            <Form
              form={form}
              size="large"
              layout="vertical"
              onFinish={onSendCode}
              className="max-w-600px m-auto"
            >
              <Form.Item<RegisterDto>
                name="email"
                rules={[
                  { required: true, message: '请输入邮箱' },
                  { type: 'email', message: '请输入正确的邮箱格式' },
                ]}
              >
                <Input placeholder="请输入您的邮箱地址" />
              </Form.Item>

              <Form.Item className="mt-8">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={sendingCode}
                  block
                >
                  发送验证码
                </Button>
              </Form.Item>
            </Form>
          ) : (
            <Form
              form={form}
              size="large"
              layout="horizontal"
              onFinish={onRegister}
              labelCol={{ span: 5 }}
              wrapperCol={{ span: 15 }}
            >
              <Form.Item<RegisterDto>
                name="email"
                initialValue={userEmail}
                label="邮箱"
              >
                <Input disabled />
              </Form.Item>

              <Form.Item<RegisterDto>
                label="验证码"
                name="verificationCode"
                rules={[{ required: true, message: '请输入验证码' }]}
              >
                <VerificationCodeInput
                  email={userEmail}
                  onResend={handleResendCode}
                  loading={sendingCode}
                  autoStartCountdown={true}
                  tipText="验证码有效期为10分钟"
                />
              </Form.Item>

              <Form.Item<RegisterDto>
                label="用户名"
                name="username"
                rules={[
                  { required: true, message: '请输入用户名' },
                  { min: 2, message: '用户名至少2个字符' },
                  { max: 50, message: '用户名不能超过50个字符' },
                ]}
              >
                <Input placeholder="请输入用户名" />
              </Form.Item>

              <Form.Item<RegisterDto>
                label="密码"
                name="password"
                rules={[
                  { required: true, message: '请输入密码' },
                  { min: 6, message: '密码至少6个字符' },
                  { max: 100, message: '密码不能超过100个字符' },
                ]}
              >
                <Input.Password placeholder="请输入密码" />
              </Form.Item>
              <Form.Item
                label="确认密码"
                name="newPassword"
                rules={[
                  {
                    required: true,
                    validator: (_, value) => {
                      if (value !== form.getFieldValue('password')) {
                        return Promise.reject(new Error('两次密码不一致'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              >
                <Input.Password placeholder="请输入密码" />
              </Form.Item>

              <Form.Item
                className="mt-8"
                wrapperCol={{ offset: 5, span: 15 }}
                labelCol={{ span: 0 }}
              >
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={registering}
                  block
                >
                  注册
                </Button>
              </Form.Item>
            </Form>
          )}
        </div>
        <div className="text-center">
          {step === 'email' && (
            <div className="mb-4">
              <Text type="secondary">输入邮箱后将向您发送注册验证码</Text>
            </div>
          )}

          {step !== 'email' && (
            <div>
              <Button
                type="link"
                onClick={() => setStep('email')}
                style={{ padding: 0 }}
              >
                返回上一步
              </Button>
            </div>
          )}

          <div>
            <Text type="secondary">已有账号？</Text>
            <Button
              type="link"
              size="small"
              onClick={() => navigate({ to: '/login' })}
              style={{ padding: 0, height: 'auto' }}
            >
              立即登录
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
