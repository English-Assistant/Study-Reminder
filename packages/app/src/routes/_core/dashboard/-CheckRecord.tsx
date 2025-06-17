import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { Empty, Spin } from 'antd';
import type { GroupedStudyRecordsSimpleDto } from '@y/interface/study-records/dto/study-records-by-days-response.dto.ts';
import type { DateUpcomingReviewsDto } from '@y/interface/upcoming-reviews/dto/upcoming-reviews-response.dto.ts';

dayjs.extend(isoWeek);

interface CheckRecordProps {
  loading: boolean;
  studyRecords: GroupedStudyRecordsSimpleDto[];
  upcomingReviews: DateUpcomingReviewsDto[];
}

const weekMap: { [key: number]: string } = {
  1: '周一',
  2: '周二',
  3: '周三',
  4: '周四',
  5: '周五',
  6: '周六',
  0: '周日',
};

const CheckRecord: React.FC<CheckRecordProps> = ({
  loading,
  studyRecords = [],
  upcomingReviews = [],
}) => {
  const chartData = (() => {
    // 数据预处理：将数组转为Map，方便按日期查找
    const recordsMap = new Map(
      studyRecords.map((g) => [g.date, g.records.length]),
    );
    const reviewsMap = new Map(
      upcomingReviews.map((g) => [
        g.date,
        g.courses.reduce((sum, course) => sum + course.reviews.length, 0),
      ]),
    );

    // 以今天为基准，生成本周的日期（周一到周日）
    const today = dayjs();
    const startOfWeek = today.startOf('isoWeek'); // 使用 'isoWeek' 确保周一为一周的开始
    const weekDays = Array.from({ length: 7 }, (_, i) =>
      startOfWeek.add(i, 'day'),
    );

    return weekDays.map((day) => {
      const dateStr = day.format('YYYY-MM-DD');
      const completedCount = recordsMap.get(dateStr) || 0;
      const pendingCount = reviewsMap.get(dateStr) || 0;

      return {
        date: day.format('MM-DD'),
        dayOfWeek: weekMap[day.day()],
        completed: completedCount,
        pending: pendingCount,
      };
    });
  })();

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (
        params: {
          axisValue: string;
          marker: string;
          seriesName: string;
          value: number;
        }[],
      ) => {
        if (!params || params.length === 0) {
          return '';
        }
        // 根据 "周几" (axisValue) 找到对应的数据
        const dataPoint = chartData.find(
          (d) => d.dayOfWeek === params[0].axisValue,
        );
        if (!dataPoint) {
          return '';
        }

        // 格式化 tooltip
        let tooltip = `${dataPoint.date} (${dataPoint.dayOfWeek})<br/>`;
        params.forEach((param) => {
          tooltip += `${param.marker} ${param.seriesName}: ${param.value}<br/>`;
        });
        return tooltip;
      },
    },
    legend: {
      data: ['完成数量', '待复习'],
      top: 10,
      left: 0,
      icon: 'circle',
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: chartData.map((item) => item.dayOfWeek),
      axisTick: {
        show: false,
      },
      axisLine: {
        show: false,
      },
    },
    yAxis: {
      type: 'value',
      splitLine: {
        lineStyle: {
          type: 'dashed',
        },
      },
      min: 0,
      axisLabel: {
        formatter: (value: number) => {
          if (value === 0) return '0';
          return `${value}`;
        },
      },
    },
    series: [
      {
        name: '完成数量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        data: chartData.map((item) => item.completed),
        itemStyle: {
          color: '#7D6CE2',
        },
        lineStyle: {
          color: '#7D6CE2',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(125, 108, 226, 0.4)' },
              { offset: 1, color: 'rgba(125, 108, 226, 0)' },
            ],
          },
        },
        showSymbol: true,
      },
      {
        name: '待复习',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        data: chartData.map((item) => item.pending),
        itemStyle: {
          color: '#A99BEB',
        },
        lineStyle: {
          color: '#A99BEB',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(169, 155, 235, 0.4)' },
              { offset: 1, color: 'rgba(169, 155, 235, 0)' },
            ],
          },
        },
        showSymbol: true,
      },
    ],
  };

  const hasData = chartData.some((d) => d.completed > 0 || d.pending > 0);

  return (
    <Spin spinning={loading}>
      {hasData ? (
        <ReactECharts option={option} style={{ height: 300 }} />
      ) : (
        <Empty
          description="暂无学习记录"
          style={{ height: 300, paddingTop: 100 }}
        />
      )}
    </Spin>
  );
};

export default CheckRecord;
