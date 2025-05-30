import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Typography, Button, Row, Col, Card, App, Spin, Table } from 'antd';
import {
  PlusOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { useRequest } from 'ahooks';
import {
  getAllStudyRecordsApi,
  getConsecutiveDaysApi,
} from '@/apis/study-records';
import { getUpcomingReviewsApi } from '@/apis/upcoming-reviews';
import type { TableProps } from 'antd';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export const Route = createFileRoute('/_core/dashboard/')({
  component: DashboardComponent,
});

function DashboardComponent() {
  const navigate = useNavigate();

  const handleAddNewPlan = () => {
    navigate({ to: '/study-records' });
  };

  const { message } = App.useApp();
  const {
    loading,
    data: [consecutiveDays, studyRecords = [], upcomingReviews = []] = [],
  } = useRequest(
    () => {
      return Promise.all([
        getConsecutiveDaysApi(),
        getAllStudyRecordsApi({
          addedWithinDays: 7,
        }),
        getUpcomingReviewsApi(),
      ]);
    },
    {
      onError(e) {
        message.error(e.message);
      },
    },
  );

  // 最近新增课程
  const columnsStudyRecord: TableProps<
    (typeof studyRecords)[number]
  >['columns'] = [
    {
      title: '标题',
      dataIndex: 'textTitle',
    },
    {
      title: '课程',
      dataIndex: ['course', 'name'],
    },
    {
      title: '日期',
      dataIndex: 'studiedAt',
      render(v) {
        return dayjs(v).format('YYYY-MM-DD mm:ss');
      },
    },
  ];

  // 待复习课程
  const columnsUpcoming: TableProps<
    (typeof upcomingReviews)[number]
  >['columns'] = [
    {
      title: '标题',
      dataIndex: 'textTitle',
    },
    {
      title: '课程',
      dataIndex: 'courseName',
    },
    {
      title: '日期',
      dataIndex: 'expectedReviewAt',
      render(v) {
        return dayjs(v).format('YYYY-MM-DD mm:ss');
      },
    },
  ];

  return (
    <Spin spinning={loading} tip="加载中...">
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
              <Title
                level={5}
                style={{ margin: 0, color: '#242524', marginBottom: '10px' }}
              >
                待复习课程
              </Title>
              <Row align="middle" gutter={8}>
                <Col>
                  <ClockCircleOutlined
                    style={{ fontSize: '28px', color: '#646AE8' }}
                  />
                </Col>
                <Col>
                  <Text
                    style={{
                      fontSize: '36px',
                      fontWeight: 'bold',
                      color: '#646AE8',
                    }}
                  >
                    {upcomingReviews?.length ?? 0}
                  </Text>
                  <Text
                    style={{
                      fontSize: '18px',
                      color: '#646AE8',
                      marginLeft: '4px',
                    }}
                  >
                    门
                  </Text>
                </Col>
              </Row>
              <Text
                type="secondary"
                style={{ marginTop: '8px', display: 'block' }}
              >
                7天内需要复习的课程数量
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
              <Title
                level={5}
                style={{ margin: 0, color: '#242524', marginBottom: '10px' }}
              >
                最近新增课程
              </Title>
              <Row align="middle" gutter={8}>
                <Col>
                  <CheckCircleOutlined
                    style={{ fontSize: '28px', color: '#646AE8' }}
                  />
                </Col>
                <Col>
                  <Text
                    style={{
                      fontSize: '36px',
                      fontWeight: 'bold',
                      color: '#646AE8',
                    }}
                  >
                    {studyRecords?.length ?? 0}
                  </Text>
                  <Text
                    style={{
                      fontSize: '18px',
                      color: '#646AE8',
                      marginLeft: '4px',
                    }}
                  >
                    门
                  </Text>
                </Col>
              </Row>
              <Text
                type="secondary"
                style={{ marginTop: '8px', display: 'block' }}
              >
                最近7天内新增的课程数量
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
                  <FireOutlined
                    style={{ fontSize: '28px', color: '#646AE8' }}
                  />
                </Col>
                <Col>
                  <Text
                    style={{
                      fontSize: '36px',
                      fontWeight: 'bold',
                      color: '#646AE8',
                    }}
                  >
                    {consecutiveDays?.days ?? 0}
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
                  待复习课程
                </Title>
              }
              bordered={false}
              style={{
                boxShadow:
                  '0px 0px 1px 0px rgba(23, 26, 31, 0.07), 0px 0px 2px 0px rgba(23, 26, 31, 0.12)',
              }}
              extra={null}
            >
              <Table
                pagination={false}
                columns={columnsUpcoming}
                dataSource={upcomingReviews}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={
                <Title level={4} style={{ margin: 0 }}>
                  最近新增课程
                </Title>
              }
              bordered={false}
              style={{
                boxShadow:
                  '0px 0px 1px 0px rgba(23, 26, 31, 0.07), 0px 0px 2px 0px rgba(23, 26, 31, 0.12)',
              }}
            >
              <Table
                pagination={false}
                columns={columnsStudyRecord}
                dataSource={studyRecords}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </Spin>
  );
}
