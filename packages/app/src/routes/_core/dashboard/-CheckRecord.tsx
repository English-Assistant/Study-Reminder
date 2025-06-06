import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useMemo } from 'react';
import { Empty, Spin } from 'antd';
import type { GroupedStudyRecordsDto } from '@y/interface/study-records/dto/grouped-study-records.dto.js';
import type { GroupedUpcomingReviewsDto } from '@y/interface/upcoming-reviews/dto/grouped-upcoming-reviews.dto.js';

dayjs.extend(isoWeek);

interface CheckRecordProps {
  loading: boolean;
  studyRecords: GroupedStudyRecordsDto[];
  upcomingReviews: GroupedUpcomingReviewsDto[];
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
  const chartData = useMemo(() => {
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
  }, [studyRecords, upcomingReviews]);

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
        data: chartData.map((item) => item.completed),
        itemStyle: {
          color: '#8A2BE2',
        },
        lineStyle: {
          color: '#8A2BE2',
        },
      },
      {
        name: '待复习',
        type: 'line',
        smooth: true,
        data: chartData.map((item) => item.pending),
        itemStyle: {
          color: '#5470C6',
        },
        lineStyle: {
          color: '#5470C6',
        },
      },
    ],
  };

  const hasData = useMemo(
    () => chartData.some((d) => d.completed > 0 || d.pending > 0),
    [chartData],
  );

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
