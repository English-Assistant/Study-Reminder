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

interface ReviewReminderEmailProps {
  userName: string;
  itemName: string;
  courseName: string;
}

export const ReviewReminderEmail = ({
  userName = '学习者',
  itemName = '新概念英语 Lesson 1',
  courseName = '英语学习',
}: ReviewReminderEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>复习提醒：{itemName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={greeting}>Hey, {userName}</Text>

          <Text style={mainMessage}>
            根据你的复习计划，现在需要复习 <strong>{itemName}</strong> -{' '}
            <em>{courseName}</em> 了。
          </Text>

          <Text style={encouragement}>
            坚持复习是掌握知识的关键。选择你所适合的复习方式来进行复习吧！
          </Text>

          <Hr style={hr} />

          <Text style={footerText}>
            如果您不想再收到这些提醒，可以在设置中关闭邮件通知。
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
  margin: '0 0 20px 0',
};

const encouragement = {
  fontSize: '16px',
  color: '#6b7280',
  lineHeight: '1.6',
  margin: '0 0 24px 0',
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

export default ReviewReminderEmail;
