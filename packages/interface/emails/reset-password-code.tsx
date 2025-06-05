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

interface ResetPasswordCodeEmailProps {
  userName: string;
  verificationCode: string;
  expirationTime?: number; // 过期时间，单位分钟
}

export const ResetPasswordCodeEmail = ({
  userName = '用户',
  verificationCode = '123456',
  expirationTime = 10,
}: ResetPasswordCodeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>密码重置验证码：{verificationCode}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={greeting}>您好，{userName}</Text>

          <Text style={warningMessage}>
            我们收到了重置您 Study Reminder 账户密码的请求。
          </Text>

          <Text style={mainMessage}>您的密码重置验证码是：</Text>

          <Container style={codeContainer}>
            <Text style={codeText}>{verificationCode}</Text>
          </Container>

          <Text style={instructions}>
            请在 <strong>{expirationTime} 分钟</strong>{' '}
            内使用此验证码完成密码重置。
          </Text>

          <Container style={securityWarning}>
            <Text style={securityTitle}>🔒 安全提醒</Text>
            <Text style={securityText}>
              • 如果您没有申请重置密码，请忽略此邮件
              <br />
              • 请不要将验证码告诉任何人
              <br />• 建议设置强密码以保护账户安全
            </Text>
          </Container>

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

const warningMessage = {
  fontSize: '16px',
  color: '#dc2626',
  lineHeight: '1.6',
  margin: '0 0 16px 0',
  fontWeight: '500',
};

const mainMessage = {
  fontSize: '16px',
  color: '#374151',
  lineHeight: '1.6',
  margin: '0 0 24px 0',
};

const codeContainer = {
  backgroundColor: '#fef2f2',
  border: '2px dashed #f87171',
  borderRadius: '8px',
  padding: '24px',
  textAlign: 'center' as const,
  margin: '24px 0',
};

const codeText = {
  fontSize: '32px',
  fontWeight: 'bold',
  color: '#dc2626',
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

const securityWarning = {
  backgroundColor: '#fef3c7',
  border: '1px solid #f59e0b',
  borderRadius: '6px',
  padding: '16px',
  margin: '24px 0',
};

const securityTitle = {
  fontSize: '16px',
  fontWeight: 'bold',
  color: '#92400e',
  margin: '0 0 8px 0',
};

const securityText = {
  fontSize: '14px',
  color: '#92400e',
  lineHeight: '1.5',
  margin: '0',
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

export default ResetPasswordCodeEmail;
