import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { IntervalUnit, ReviewMode } from '@prisma/client';

// This DTO is for input, so no 'id' field
export class InputReviewRuleDto {
  @IsInt({ message: '时间数值必须是整数' })
  @Min(1, { message: '时间数值必须大于0' })
  @IsNotEmpty()
  value!: number;

  @IsEnum(IntervalUnit, { message: '无效的时间单位' })
  @IsNotEmpty()
  unit!: IntervalUnit;

  @IsOptional()
  @IsEnum(ReviewMode, { message: '无效的复习模式' })
  mode?: ReviewMode;

  @IsOptional()
  @IsString()
  note?: string;
}
