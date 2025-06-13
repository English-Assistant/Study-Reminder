import { createFileRoute } from '@tanstack/react-router';
import { Typography, App, Spin, Tabs, Divider, Badge, Tag, Empty } from 'antd';
import { useRequest } from 'ahooks';
import {
  getAllStudyRecordsApi,
  getConsecutiveDaysApi,
  getStudyRecordsCountApi,
} from '@/apis/study-records';
import { getUpcomingReviewsApi } from '@/apis/upcoming-reviews';
import dayjs from 'dayjs';
import CheckRecord from './-CheckRecord';
import { StatisticCard } from './-StatisticCard';

const { Title } = Typography;

export const Route = createFileRoute('/_core/dashboard/')({
  component: DashboardComponent,
});

function DashboardComponent() {
  const { message } = App.useApp();
  const {
    loading,
    data: [
      consecutiveDays,
      studyRecords = [],
      upcomingReviews = [],
      studyRecordsCount,
    ] = [],
  } = useRequest(
    () => {
      return Promise.all([
        getConsecutiveDaysApi(),
        getAllStudyRecordsApi({
          addedWithinDays: 7,
        }),
        getUpcomingReviewsApi(),
        getStudyRecordsCountApi(),
      ]);
    },
    {
      onError(e) {
        message.error(e.message);
      },
    },
  );

  return (
    <Spin spinning={loading} tip="加载中...">
      <div className="grid grid-cols-[1fr_45vw] gap-6 container mx-auto">
        <div className="bg-#fff rounded-3 p-6">
          <Title className="text-size-4.5!" level={2}>
            学习统计
          </Title>

          <div className="grid grid-cols-2 gap-4">
            <StatisticCard
              title="连续打卡"
              value={consecutiveDays?.days ?? 0}
              unit="天"
            />
            <StatisticCard
              title="总完成数量"
              value={studyRecordsCount?.count ?? 0}
              unit="个"
            />
            <StatisticCard
              title="今日待复习"
              value={
                upcomingReviews
                  .find((f) => dayjs(f.date).isSame(dayjs(), 'day'))
                  ?.courses.reduce((acc, cur) => acc + cur.reviews.length, 0) ??
                0
              }
              unit="个"
            />
            <StatisticCard
              title="待复习课程"
              value={
                upcomingReviews
                  .map((f) => f.courses.map((f) => f.reviews))
                  .flat(Infinity).length ?? 0
              }
              unit="个"
            />
          </div>
          <Divider />
          <CheckRecord
            loading={loading}
            studyRecords={studyRecords}
            upcomingReviews={upcomingReviews}
          />
        </div>
        <div className="flex flex-col gap-6">
          <div className="bg-#fff rounded-3 p-6">
            <Title className="text-size-4.5!" level={2}>
              7日待复习
            </Title>

            {upcomingReviews && upcomingReviews.length > 0 ? (
              <Tabs
                items={upcomingReviews.map((f) => {
                  return {
                    label: dayjs(f.date).isSame(dayjs(), 'day')
                      ? '今天'
                      : f.date,
                    value: f.date,
                    key: f.date,
                    children: (
                      <div className="flex flex-wrap gap-3 max-h-400px overflow-y-auto">
                        {f.courses.map((course) => {
                          return (
                            <div
                              key={course.courseId}
                              className="rounded-3 color-#fff p-5 w-80 bg-#EBE8FC"
                            >
                              <div className="text-size-4 lh-6 font-600">
                                <Badge
                                  color={course.courseColor!}
                                  text={
                                    <span className="color-#444444 text-size-4 lh-6">
                                      {course.courseName}
                                    </span>
                                  }
                                />
                              </div>
                              <div className="color-#666 text-size-3.5 lh-5.2 my-4">
                                {course.reviews.length}个复习计划
                              </div>
                              {course.reviews.map((review) => {
                                return (
                                  <div
                                    key={
                                      review.textTitle + review.expectedReviewAt
                                    }
                                    className="color-#444 text-size-3.75 lh-5.6 flex flex-justify-between"
                                  >
                                    <div>{review.textTitle}</div>
                                    <div className="text-size-3.5">
                                      {dayjs(review.expectedReviewAt).format(
                                        'HH:mm',
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    ),
                  };
                })}
              />
            ) : (
              <Empty className="my-10" description="今日暂无待复习内容" />
            )}
          </div>
          <div className="bg-#fff rounded-3 p-6">
            <Title className="text-size-4.5!" level={2}>
              最近完成
            </Title>

            {studyRecords && studyRecords.length > 0 ? (
              <Tabs
                items={studyRecords.map((f) => {
                  return {
                    label: f.date,
                    value: f.date,
                    key: f.date,
                    children: (
                      <div className="flex flex-wrap gap-3 max-h-400px overflow-y-auto">
                        {f.records.map((record) => {
                          return (
                            <div
                              key={record.id}
                              className="rounded-3 w-60 p-5"
                              style={{
                                boxShadow: `0rem 0.25rem 0.5rem 0rem rgba(0, 0, 0, 0.05), 0rem 0rem 0rem 0rem rgba(0, 0, 0, 0.00), 0rem 0rem 0rem 0rem rgba(0, 0, 0, 0.00)`,
                                border: '1px solid #F3F4F6',
                              }}
                            >
                              <div className="color-#444 text-size-4 lh-6">
                                {record.textTitle}
                              </div>
                              <Tag
                                className="color-#6B7280 text-size-4 lh-5 my-3 px-1! mx--0.5"
                                color={record.course.color!}
                              >
                                {record.course.name}
                              </Tag>
                              <div className="color-#666666 lh-5.2 text-size-3.5">
                                {dayjs(record.studiedAt).format('HH:mm')}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ),
                  };
                })}
              />
            ) : (
              <Empty className="my-10" description="最近暂无完成记录" />
            )}
          </div>
        </div>
      </div>
    </Spin>
  );
}
