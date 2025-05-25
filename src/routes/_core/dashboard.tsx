import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  Typography,
  Button,
  Row,
  Col,
  Card,
  Statistic,
  List,
  Space,
  Divider,
} from 'antd';
import {
  PlusOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FireOutlined,
  BookOutlined,
  EyeOutlined,
} from '@ant-design/icons';

// Import downloaded SVG icons
// Note: These paths might need adjustment based on your Vite/build setup for SVG as React components
// For now, we'll use them as img src, or use Ant Design icons as placeholders if direct SVG import is complex.

// Placeholder for downloaded icons - in a real app, these would be imported as components or used with an <img> tag.
// For simplicity in this example, we'll use Ant Design icons or unicode characters if a direct match isn't available.
// const DashboardHeaderLogo = () => <img src="/src/assets/icons/dashboard-header-logo.svg" alt="Logo" style={{ height: '32px' }} />;
// const UpcomingClockIcon = () => <img src="/src/assets/icons/dashboard-upcoming-clock-icon.svg" alt="Clock" style={{ width: '20px', height: '20px' }}/>;
// const CompletedCheckIcon = () => <img src="/src/assets/icons/dashboard-completed-check-icon.svg" alt="Check" style={{ width: '20px', height: '20px' }}/>;
// const StreakFlameIcon = () => <img src="/src/assets/icons/dashboard-streak-flame-icon.svg" alt="Flame" style={{ width: '20px', height: '20px' }}/>;
// const ProgressBookIcon = () => <img src="/src/assets/icons/dashboard-progress-book-icon.svg" alt="Book" style={{ width: '16px', height: '16px', marginRight: '8px' }}/>;

const { Title, Text } = Typography;

interface CourseItem {
  id: string;
  name: string;
  date: string;
  duration?: string; //课时
  completed?: boolean;
}

// Mock data based on Figma
const upcomingCoursesData: CourseItem[] = [
  { id: '1', name: 'React基础', date: '2024-07-25', duration: '5课时' },
  { id: '2', name: 'Tailwind CSS', date: '2024-07-26', duration: '3课时' },
  { id: '3', name: 'TypeScript进阶', date: '2024-07-27', duration: '4课时' },
  { id: '4', name: 'GraphQL入门', date: '2024-07-28', duration: '2课时' },
  { id: '5', name: 'Next.js实践', date: '2024-07-29', duration: '6课时' },
];

const completedCoursesData: CourseItem[] = [
  {
    id: 'c1',
    name: 'HTML基础',
    date: '2024-07-20',
    duration: '3课时',
    completed: true,
  },
  {
    id: 'c2',
    name: 'CSS进阶',
    date: '2024-07-21',
    duration: '4课时',
    completed: true,
  },
  {
    id: 'c3',
    name: 'JavaScript核心',
    date: '2024-07-22',
    duration: '6课时',
    completed: true,
  },
  {
    id: 'c4',
    name: 'Git版本控制',
    date: '2024-07-23',
    duration: '2课时',
    completed: true,
  },
  {
    id: 'c5',
    name: '前端构建工具',
    date: '2024-07-24',
    duration: '3课时',
    completed: true,
  },
];

const recentLearningProgressData: CourseItem[] = [
  { id: 'p1', name: '前端构建工具', date: '2024-07-24', completed: true },
  { id: 'p2', name: 'Git版本控制', date: '2024-07-23', completed: true },
  { id: 'p3', name: 'JavaScript核心', date: '2024-07-22', completed: true },
  { id: 'p4', name: 'CSS进阶', date: '2024-07-21', completed: true },
];

export const Route = createFileRoute('/_core/dashboard')({
  component: DashboardComponent,
});

function DashboardComponent() {
  const navigate = useNavigate();

  const handleAddNewPlan = () => {
    navigate({ to: '/add-course' });
  };

  const renderCourseListItem = (item: CourseItem) => (
    <List.Item>
      <Row justify="space-between" align="middle" style={{ width: '100%' }}>
        <Col flex="auto">
          <Text>{item.name}</Text>
        </Col>
        <Col flex="120px" style={{ textAlign: 'left' }}>
          <Text type="secondary">{item.date}</Text>
        </Col>
        {item.duration && (
          <Col flex="60px" style={{ textAlign: 'right' }}>
            <Text type="secondary">{item.duration}</Text>
          </Col>
        )}
      </Row>
    </List.Item>
  );

  const renderProgressListItem = (item: CourseItem) => (
    <List.Item>
      <Row justify="space-between" align="middle" style={{ width: '100%' }}>
        <Col flex="auto">
          <Space>
            <BookOutlined style={{ color: '#8C8D8B' }} />
            <Text>{item.name}</Text>
          </Space>
        </Col>
        <Col flex="120px">
          <Space>
            <ClockCircleOutlined style={{ color: '#8C8D8B' }} />
            <Text type="secondary">{item.date}</Text>
          </Space>
        </Col>
        <Col flex="30px" style={{ textAlign: 'right' }}>
          {item.completed && <CheckCircleOutlined style={{ color: 'green' }} />}
        </Col>
      </Row>
    </List.Item>
  );

  return (
    <div>
      <Row
        justify="space-between"
        align="middle"
        style={{ marginBottom: '24px' }}
      >
        <Col>
          <Title level={2} style={{ margin: 0 }}>
            仪表盘
          </Title>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAddNewPlan}
          >
            添加新计划
          </Button>
        </Col>
      </Row>

      <Divider style={{ marginTop: 0, marginBottom: '24px' }} />

      <Row gutter={[24, 24]} style={{ marginBottom: '24px' }} align="stretch">
        <Col xs={24} sm={24} md={8}>
          <Card
            bordered={false}
            style={{
              boxShadow:
                '0px 0px 1px 0px rgba(23, 26, 31, 0.07), 0px 0px 2px 0px rgba(23, 26, 31, 0.12)',
              height: '100%',
            }}
          >
            <Statistic
              title="待进行课程"
              value={10}
              valueStyle={{ color: '#242524', fontWeight: 'bold' }}
              prefix={<ClockCircleOutlined />} // Placeholder for UpcomingClockIcon
              suffix="门"
            />
            <Text
              type="secondary"
              style={{ marginTop: '8px', display: 'block' }}
            >
              总共待复习课程
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={24} md={8}>
          <Card
            bordered={false}
            style={{
              boxShadow:
                '0px 0px 1px 0px rgba(23, 26, 31, 0.07), 0px 0px 2px 0px rgba(23, 26, 31, 0.12)',
              height: '100%',
            }}
          >
            <Statistic
              title="已完成课程"
              value={6}
              valueStyle={{ color: '#242524', fontWeight: 'bold' }}
              prefix={<CheckCircleOutlined />} // Placeholder for CompletedCheckIcon
              suffix="门"
            />
            <Text
              type="secondary"
              style={{ marginTop: '8px', display: 'block' }}
            >
              总共已完成课程
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={24} md={8}>
          <Card
            bordered={false}
            style={{
              boxShadow:
                '0px 0px 1px 0px rgba(23, 26, 31, 0.07), 0px 0px 2px 0px rgba(23, 26, 31, 0.12)',
              height: '100%',
            }}
          >
            <Row align="middle" justify="space-between">
              <Col>
                <Title level={5} style={{ margin: 0, color: '#242524' }}>
                  学习打卡天数
                </Title>
              </Col>
            </Row>
            <Row align="middle" gutter={8} style={{ marginTop: '10px' }}>
              <Col>
                <FireOutlined style={{ fontSize: '28px', color: '#646AE8' }} />
              </Col>
              <Col>
                <Text
                  style={{
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: '#646AE8',
                  }}
                >
                  15
                </Text>
              </Col>
            </Row>
            <Text
              type="secondary"
              style={{ marginTop: '8px', display: 'block' }}
            >
              连续学习天数
            </Text>
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                近期待进行课程
              </Title>
            }
            bordered={false}
            style={{
              boxShadow:
                '0px 0px 1px 0px rgba(23, 26, 31, 0.07), 0px 0px 2px 0px rgba(23, 26, 31, 0.12)',
            }}
            extra={
              <Button type="link" icon={<EyeOutlined />}>
                查看全部
              </Button>
            }
          >
            <List
              itemLayout="horizontal"
              dataSource={upcomingCoursesData}
              renderItem={renderCourseListItem}
              header={
                <Row
                  justify="space-between"
                  style={{ padding: '0 16px', color: '#8C8D8B' }}
                >
                  <Col flex="auto">
                    <Text strong>课程</Text>
                  </Col>
                  <Col flex="120px" style={{ textAlign: 'left' }}>
                    <Text strong>日期</Text>
                  </Col>
                  <Col flex="60px" style={{ textAlign: 'right' }}>
                    <Text strong>课时</Text>
                  </Col>
                </Row>
              }
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title={
              <Title level={4} style={{ margin: 0 }}>
                近期已完成课程
              </Title>
            }
            bordered={false}
            style={{
              boxShadow:
                '0px 0px 1px 0px rgba(23, 26, 31, 0.07), 0px 0px 2px 0px rgba(23, 26, 31, 0.12)',
            }}
            extra={
              <Button type="link" icon={<EyeOutlined />}>
                查看全部
              </Button>
            }
          >
            <List
              itemLayout="horizontal"
              dataSource={completedCoursesData}
              renderItem={renderCourseListItem}
              header={
                <Row
                  justify="space-between"
                  style={{ padding: '0 16px', color: '#8C8D8B' }}
                >
                  <Col flex="auto">
                    <Text strong>课程</Text>
                  </Col>
                  <Col flex="120px" style={{ textAlign: 'left' }}>
                    <Text strong>日期</Text>
                  </Col>
                  <Col flex="60px" style={{ textAlign: 'right' }}>
                    <Text strong>课时</Text>
                  </Col>
                </Row>
              }
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <Title level={4} style={{ margin: '0', marginTop: '24px' }}>
            最近学习进度
          </Title>
        }
        bordered={false}
        style={{
          marginTop: '24px',
          boxShadow:
            '0px 0px 1px 0px rgba(23, 26, 31, 0.07), 0px 0px 2px 0px rgba(23, 26, 31, 0.12)',
        }}
      >
        <List
          itemLayout="horizontal"
          dataSource={recentLearningProgressData}
          renderItem={renderProgressListItem}
        />
      </Card>
    </div>
  );
}
