import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Text,
  Hr,
} from '@react-email/components';
import * as React from 'react';

interface VerificationCodeEmailProps {
  userName: string;
  verificationCode: string;
  expirationTime?: number; // 过期时间，单位分钟
  type?: 'register'; // 验证码类型（现在只支持注册）
}

export const VerificationCodeEmail = ({
  userName = '用户',
  verificationCode = '123456',
  expirationTime = 10,
}: VerificationCodeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>您的验证码：{verificationCode}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={greeting}>您好，{userName}</Text>

          <Text style={mainMessage}>
            感谢您注册 Study Reminder！您的邮箱验证码是：
          </Text>

          <Container style={codeContainer}>
            <Text style={codeText}>{verificationCode}</Text>
          </Container>

          <Text style={instructions}>
            请在 <strong>{expirationTime} 分钟</strong> 内使用此验证码完成注册。
            如果您没有请求此验证码，请忽略此邮件。
          </Text>

          <Hr style={hr} />

          <Text style={footerText}>
            此邮件由系统自动发送，请勿回复。如有疑问，请进行问题反馈。
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// 样式定义
const main = {
  backgroundColor: '#f9fafb',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  padding: '20px 0',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '32px',
  maxWidth: '500px',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
};

const greeting = {
  fontSize: '20px',
  fontWeight: '500',
  color: '#1f2937',
  margin: '0 0 20px 0',
};

const mainMessage = {
  fontSize: '16px',
  color: '#374151',
  lineHeight: '1.6',
  margin: '0 0 24px 0',
};

const codeContainer = {
  backgroundColor: '#f3f4f6',
  border: '2px dashed #d1d5db',
  borderRadius: '8px',
  padding: '24px',
  textAlign: 'center' as const,
  margin: '24px 0',
};

const codeText = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#1f2937',
  letterSpacing: '8px',
  margin: '0',
  fontFamily: 'Monaco, Consolas, "Courier New", monospace',
};

const instructions = {
  fontSize: '16px',
  color: '#6b7280',
  lineHeight: '1.6',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
};

const hr = {
  borderColor: '#e5e7eb',
  margin: '24px 0',
};

const footerText = {
  fontSize: '14px',
  color: '#9ca3af',
  lineHeight: '1.5',
  margin: '0',
  textAlign: 'center' as const,
};

export default VerificationCodeEmail;
