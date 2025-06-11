import {
  IsInt,
  IsEnum,
  Min,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
} from 'class-validator';
import { IntervalUnit, ReviewMode } from '@prisma/client';

export class ReviewRuleDto {
  @IsOptional()
  @IsNumber({}, { message: 'ID必须是数字' })
  id?: number;

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
