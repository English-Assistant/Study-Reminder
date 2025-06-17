import { createFileRoute } from '@tanstack/react-router';
import {
  Typography,
  App,
  Spin,
  Tabs,
  Divider,
  Badge,
  Tag,
  Empty,
  Tooltip,
} from 'antd';
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
import { QuestionCircleOutlined } from '@ant-design/icons';
import type { CourseSummaryDto } from '@y/interface/study-records/dto/study-records-by-month-response.dto.ts';

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
      studyRecordsResp,
      upcomingResp,
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

  const studyRecords = studyRecordsResp?.groups || [];
  const studyCourses = studyRecordsResp?.courses ?? [];

  const upcomingDates = upcomingResp?.dates ?? [];
  const upcomingCourses = upcomingResp?.courses ?? [];

  const allCourses = [...studyCourses, ...upcomingCourses];

  const coursesMap = (() => {
    const map: Record<string, CourseSummaryDto> = {};
    allCourses.forEach((c) => (map[c.id] = c));
    return map;
  })();

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
                upcomingDates
                  .find((f) => dayjs(f.date).isSame(dayjs(), 'day'))
                  ?.courses.reduce((acc, cur) => acc + cur.reviews.length, 0) ??
                0
              }
              unit="个"
            />
            <StatisticCard
              title="待复习课程"
              value={
                upcomingDates
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
            upcomingReviews={upcomingDates}
          />
        </div>
        <div className="flex flex-col gap-6">
          <div className="bg-#fff rounded-3 p-6">
            <Title className="text-size-4.5!" level={2}>
              7日待复习
            </Title>

            {upcomingDates && upcomingDates.length > 0 ? (
              <Tabs
                items={upcomingDates.map((f) => {
                  return {
                    label: dayjs(f.date).isSame(dayjs(), 'day')
                      ? '今天'
                      : f.date,
                    value: f.date,
                    key: f.date,
                    children: (
                      <div className="flex flex-wrap gap-3 max-h-400px overflow-y-auto">
                        {f.courses.map((course) => {
                          const isToday = dayjs(f.date).isSame(dayjs(), 'day');
                          const now = dayjs();
                          const windowStart = now.subtract(1, 'hour');
                          const upcoming = course.reviews.filter((r) => {
                            const t = dayjs(r.expectedReviewAt);
                            return t.isAfter(windowStart);
                          });
                          const passed = course.reviews.filter((r) => {
                            const t = dayjs(r.expectedReviewAt);
                            return (
                              t.isBefore(windowStart) || t.isSame(windowStart)
                            );
                          });

                          const renderList = (list: typeof course.reviews) =>
                            list.map((review) => (
                              <div
                                key={review.textTitle + review.expectedReviewAt}
                                className="color-#444 text-size-3.75 lh-5.6 flex flex-justify-between"
                              >
                                <div>{review.textTitle}</div>
                                <div className="text-size-3.5">
                                  {dayjs(review.expectedReviewAt).format(
                                    'HH:mm',
                                  )}
                                </div>
                              </div>
                            ));

                          return (
                            <div
                              key={course.courseId}
                              className="rounded-3 color-#fff p-5 w-80 bg-#EBE8FC"
                            >
                              <div className="text-size-4 lh-6 font-600">
                                <Badge
                                  color={
                                    coursesMap[course.courseId]?.color || '#000'
                                  }
                                  text={
                                    <span className="color-#444444 text-size-4 lh-6">
                                      {coursesMap[course.courseId]?.name}
                                    </span>
                                  }
                                />
                              </div>
                              {isToday ? (
                                <>
                                  {/* 待复习 */}
                                  {upcoming.length > 0 && (
                                    <>
                                      <div className="color-#666 text-size-3.5 lh-5.2 my-2 flex items-center gap-1">
                                        待复习（{upcoming.length}）
                                        <Tooltip title="包含当前时间前 1 小时至今日 23:59 的复习项">
                                          <QuestionCircleOutlined />
                                        </Tooltip>
                                      </div>
                                      {renderList(upcoming)}
                                    </>
                                  )}

                                  {/* 已过复习 */}
                                  {passed.length > 0 && (
                                    <>
                                      <div className="color-#666 text-size-3.5 lh-5.2 my-2">
                                        已过复习（{passed.length}）
                                      </div>
                                      {renderList(passed)}
                                    </>
                                  )}
                                </>
                              ) : (
                                <>
                                  <div className="color-#666 text-size-3.5 lh-5.2 my-4">
                                    {course.reviews.length}个复习计划
                                  </div>
                                  {renderList(course.reviews)}
                                </>
                              )}
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
                                color={
                                  coursesMap[record.courseId]?.color ||
                                  'default'
                                }
                              >
                                {coursesMap[record.courseId]?.name}
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
