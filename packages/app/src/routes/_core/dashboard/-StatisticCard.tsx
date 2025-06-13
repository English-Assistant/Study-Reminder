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
    <div className="rounded-2 bg-#F3F3FF p-4">
      <div className="color-#666 text-size-3.5 lh-5.2">{title}</div>
      <div className="color-#7D6CE2 text-size-6 lh-9 mt-2">
        {value}
        <span className="ml-1 color-#666 text-size-3.5 lh-5.2">{unit}</span>
      </div>
    </div>
  );
};
