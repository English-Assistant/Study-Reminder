import { createFileRoute } from '@tanstack/react-router';
import { Typography, List, Divider, Button } from 'antd';
import { MailOutlined } from '@ant-design/icons';

const { Title, Paragraph, Link } = Typography;

export const Route = createFileRoute('/_core/about')({
  component: AboutComponent,
});

function AboutComponent() {
  const majorFeatures = [
    '与 GitHub 仓库无缝集成',
    '基于日历的复习计划管理',
    '自定义提醒频率设置',
    '仪表盘概览待复习和已完成课程',
    '一键数据备份',
  ];

  return (
    <div style={{ padding: '20px 40px', maxWidth: '1000px', margin: '0 auto' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '40px' }}>
        关于 Study Reminder
      </Title>

      <section style={{ marginBottom: '40px' }}>
        <Title level={3}>项目背景</Title>
        <Paragraph style={{ fontSize: '16px' }}>
          Study Reminder
          是一款旨在帮助学生和终身学习者有效管理复习计划的应用程序。通过与
          GitHub
          仓库集成，它自动化了复习内容跟踪和提醒过程，确保您不会忘记重要知识点。无论是编程教程、课程笔记还是任何需要定期回顾的材料，Study
          Reminder 都能帮助您保持进度并巩固学习成果。
        </Paragraph>
      </section>

      <Divider />

      <section style={{ marginBottom: '40px' }}>
        <Title level={3}>主要功能</Title>
        <Paragraph style={{ fontSize: '16px' }}>
          以下是 Study Reminder 的一些关键功能：
        </Paragraph>
        <List
          dataSource={majorFeatures}
          renderItem={(item) => (
            <List.Item style={{ fontSize: '16px' }}>• {item}</List.Item>
          )}
          style={{ marginLeft: '20px' }}
        />
      </section>

      <Divider />

      <section style={{ marginBottom: '40px' }}>
        <Title level={3}>反馈与支持</Title>
        <Paragraph style={{ fontSize: '16px' }}>
          您的反馈对我们改进 Study Reminder
          至关重要。如果您遇到问题、有功能建议或只是想分享您的使用体验，请通过以下方式联系我们或使用反馈表单。
        </Paragraph>
        <Link href="mailto:yangboses@gmail.com" style={{ fontSize: '16px' }}>
          <MailOutlined style={{ marginRight: '8px' }} />
          发送邮件反馈
        </Link>
      </section>

      <Divider />

      <section style={{ marginBottom: '40px' }}>
        <Title level={3}>数据备份</Title>
        <Paragraph style={{ fontSize: '16px' }}>
          定期备份您的学习数据，以防万一。
        </Paragraph>
        <Button type="primary" onClick={() => alert('数据备份功能待实现！')}>
          立即备份
        </Button>
      </section>
    </div>
  );
}
