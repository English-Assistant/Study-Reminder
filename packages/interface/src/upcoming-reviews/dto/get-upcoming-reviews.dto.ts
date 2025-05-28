import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class GetUpcomingReviewsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'withinDays 必须是整数' })
  @Min(1, { message: 'withinDays 至少为 1' })
  @Max(365, { message: 'withinDays 不能超过 365' })
  withinDays?: number;
}
