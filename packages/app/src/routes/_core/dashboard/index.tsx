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
          <Title level={2}>学习统计</Title>

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
            <Title level={2}>今日待复习</Title>

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
                              className="rounded-3 color-#fff p-4 w-50"
                              style={{
                                background: `linear-gradient(146.30992deg, #9F7AEA 15%, rgba(159, 122, 234, 0.60) 85%)`,
                              }}
                            >
                              <div className="mb-4 text-size-4 lh-6 font-600">
                                <Badge
                                  color={course.courseColor!}
                                  text={
                                    <span className="color-#fff text-size-4 lh-6">
                                      {course.courseName}
                                    </span>
                                  }
                                />
                              </div>
                              <span className="color-#fff text-size-3.5 lh-5">
                                {course.reviews.length}个复习计划
                              </span>
                              {course.reviews.map((review) => {
                                return (
                                  <div
                                    key={
                                      review.textTitle + review.expectedReviewAt
                                    }
                                    className="color-[rgba(255,255,255,0.80)] text-size-3.5 lh-5 flex flex-justify-between"
                                  >
                                    <div>{review.textTitle}</div>
                                    <div>
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
            <Title level={2}>最近完成</Title>

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
                              className="rounded-3 w-50 p-3.5"
                              style={{
                                border: '1px solid #E9D8FD',
                              }}
                            >
                              <div className="color-#1F2937 text-size-4.5 lh-6">
                                {record.textTitle}
                              </div>
                              <Tag
                                className="color-#6B7280 text-size-4 lh-5 mt-3 mb-1 px-1! mx--0.5"
                                color={record.course.color!}
                              >
                                {record.course.name}
                              </Tag>
                              <div className="color-#9CA3AF lh-5 text-size-4">
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
