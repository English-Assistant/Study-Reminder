import { createFileRoute } from '@tanstack/react-router';
import { Typography, List, Divider } from 'antd';

const { Title, Paragraph, Link } = Typography;

export const Route = createFileRoute('/_core/about')({
  component: AboutComponent,
});

function AboutComponent() {
  const majorFeatures = [
    '用户账户管理：安全注册与登录。',
    '课程管理：自由创建和组织您的学习课程。',
    '学习打卡：记录每次学习的内容、时长和笔记详情。',
    '自定义复习规则：为每个用户设置个性化的复习周期（例如1小时后、1天后、每周等）。',
    '智能复习计划：自动计算并展示未来需要复习的学习条目。',
    '复习提醒：通过邮件和应用内通知及时获得复习提醒。',
    '学习统计：跟踪您的连续打卡天数，激励学习动力。',
    '灵活的通知设置：用户可以自定义接收通知的偏好。',
  ];

  return (
    <div style={{ padding: '20px 40px', maxWidth: '1000px', margin: '0 auto' }}>
      <Title level={2} style={{ textAlign: 'center', marginBottom: '40px' }}>
        关于 Study Reminder
      </Title>

      <section style={{ marginBottom: '40px' }}>
        <Title level={3}>项目愿景</Title>
        <Paragraph style={{ fontSize: '16px' }}>
          Study Reminder
          是一款旨在帮助用户更有效地记忆和巩固所学知识的智能学习工具。我们相信，及时的复习是长期记忆的关键。本应用通过灵活的打卡记录和个性化的复习规则设置，帮助您系统地安排复习计划，确保每一个知识点都能得到充分回顾，从而深化理解，提升学习效率。
        </Paragraph>
      </section>

      <Divider />

      <section style={{ marginBottom: '40px' }}>
        <Title level={3}>核心功能</Title>
        <Paragraph style={{ fontSize: '16px' }}>
          我们的应用提供以下核心功能来支持您的学习旅程：
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
        <Title level={3}>联系我们</Title>
        <Paragraph style={{ fontSize: '16px' }}>
          我们致力于不断改进复习助手，您的宝贵意见对我们非常重要。如果您在使用过程中遇到任何问题，或有任何功能建议，欢迎随时通过下面的邮箱与我们联系。
        </Paragraph>
        <Link href="mailto:yangboses@gmail.com" style={{ fontSize: '16px' }}>
          发送邮件反馈 (yangboses@gmail.com)
        </Link>
      </section>
    </div>
  );
}
