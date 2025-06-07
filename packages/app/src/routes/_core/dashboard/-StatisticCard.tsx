import type { FC } from 'react';

interface StatisticCardProps {
  title: string;
  value: number;
  unit: string;
}

export const StatisticCard: FC<StatisticCardProps> = ({
  title,
  value,
  unit,
}) => {
  return (
    <div className="rounded-2 bg-#F3F3FF p-4 flex-1">
      <div className="color-#4B5563 text-size-4 lh-5">{title}</div>
      <div className="color-#553C9A text-size-6 lh-8 font-bold mt-2">
        {value}
        <span className="text-size-4 ml-1">{unit}</span>
      </div>
    </div>
  );
};
