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
import { ReviewItem } from '../src/notifications/types/review-item.type';

interface BulkReminderEmailProps {
  userName: string;
  items: ReviewItem[];
}

export const ReviewReminderBulkEmail = ({
  userName = '学习者',
  items = [],
}: BulkReminderEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>{`您有 ${items.length} 个待复习任务`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={greeting}>Hey, {userName}</Text>
          <Text style={mainMessage}>以下内容已到复习时间：</Text>
          <ul>
            {items.map((it, idx) => (
              <li key={idx}>
                <strong>{it.itemName}</strong> - <em>{it.courseName}</em>
                {it.time ? `，计划时间 ${it.time}` : ''}
              </li>
            ))}
          </ul>
          <Hr style={hr} />
          <Text style={footerText}>祝学习顺利！</Text>
        </Container>
      </Body>
    </Html>
  );
};

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

export default ReviewReminderBulkEmail;
