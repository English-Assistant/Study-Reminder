import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { App, Button, Form, Input, Typography, Steps, Space } from 'antd';
import type { FormProps } from 'antd';
import { sendVerificationCodeApi, forgotPasswordApi } from '@/apis/auth';
import { useRequest } from 'ahooks';
import { useState } from 'react';
import type { ForgotPasswordDto } from '@y/interface/auth/dto/forgot-password.dto.js';
import VerificationCodeInput from '@/components/VerificationCodeInput';
import Logo from '@/assets/icons/about-page-logo.svg?react';
import Bg1 from '@/assets/images/bg1.svg?react';

const { Title, Text, Link } = Typography;

export const Route = createFileRoute('/forgot-password')({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm<ForgotPasswordDto>();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [userEmail, setUserEmail] = useState<string>('');

  // 定义步骤
  const steps = [
    {
      title: '验证邮箱',
      description: '获取验证码',
    },
    {
      title: '重置密码',
      description: '设置新密码',
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
        setStep('reset');
        // 重置整个表单，然后重新设置邮箱值
        form.resetFields();
        form.setFieldsValue({ email: userEmail });
      },
    },
  );

  // 重置密码
  const { loading: resetting, run: resetPassword } = useRequest(
    forgotPasswordApi,
    {
      manual: true,
      onError(e) {
        message.error(e.message);
      },
      onSuccess() {
        message.success('密码重置成功，请使用新密码登录');
        setTimeout(() => {
          navigate({ to: '/login' });
        }, 1500);
      },
    },
  );

  const onSendCode = (values: Pick<ForgotPasswordDto, 'email'>) => {
    setUserEmail(values.email);
    form.setFieldsValue({ email: values.email });
    sendCode({
      email: values.email,
      type: 'reset_password',
    });
  };

  const handleResendCode = () => {
    sendCode({
      email: userEmail,
      type: 'reset_password',
    });
  };

  const onResetPassword: FormProps<ForgotPasswordDto>['onFinish'] = (
    values,
  ) => {
    resetPassword({
      email: values.email,
      newPassword: values.newPassword,
      verificationCode: values.verificationCode,
    });
  };

  return (
    <div className="flex">
      <div className="w-40vw p-16">
        <Space align="center" className="mb-16">
          <Logo></Logo>
          <Title className="mb-0!" level={1}>
            重置密码 Study Reminder
          </Title>
        </Space>

        <div className="color-#666 lh-6.5 text-size-4">
          请根据提示重置您的账号密码,
          <br></br>
          如果在重置过程中遇到问题也可以点击
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
              <Form.Item<ForgotPasswordDto>
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
              onFinish={onResetPassword}
              labelCol={{ span: 5 }}
              wrapperCol={{ span: 15 }}
            >
              <Form.Item<ForgotPasswordDto>
                name="email"
                initialValue={userEmail}
                label="邮箱"
              >
                <Input disabled />
              </Form.Item>

              <Form.Item<ForgotPasswordDto>
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

              <Form.Item<ForgotPasswordDto>
                label="新密码"
                name="newPassword"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 6, message: '密码至少6个字符' },
                  { max: 100, message: '密码不能超过100个字符' },
                ]}
              >
                <Input.Password placeholder="请输入新密码" />
              </Form.Item>

              <Form.Item
                label="确认新密码"
                name="confirmPassword"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('两次密码输入不一致'));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="请再次输入新密码" />
              </Form.Item>

              <Form.Item
                className="mt-8"
                wrapperCol={{ offset: 5, span: 15 }}
                labelCol={{ span: 0 }}
              >
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={resetting}
                  block
                >
                  重置密码
                </Button>
              </Form.Item>
            </Form>
          )}
        </div>
        <div className="text-center">
          {step === 'email' && (
            <div className="mb-4">
              <Text type="secondary">输入邮箱后将向您发送重置密码验证码</Text>
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
            <Text type="secondary">想起密码了？</Text>
            <Button
              type="link"
              size="small"
              onClick={() => navigate({ to: '/login' })}
              style={{ padding: 0, height: 'auto' }}
            >
              返回登录
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
