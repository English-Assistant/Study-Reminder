import {
  IsInt,
  IsEnum,
  Min,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsString,
} from 'class-validator';
import { ReviewRuleUnit, ReviewRuleRepetition } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewRuleDto {
  @ApiPropertyOptional({ description: '规则ID (由后端生成)', format: 'uuid' })
  @IsOptional() // id 是从数据库读取时才有，创建/设置时可能没有
  @IsUUID('4', { message: 'ID必须是有效的UUID' })
  id?: string;

  @ApiPropertyOptional({ description: '规则描述', example: '每日回顾' })
  @IsOptional()
  @IsString({ message: '描述必须是字符串' })
  description?: string;

  @IsInt({ message: '时间值必须是整数' })
  @Min(1, { message: '时间值必须大于0' })
  @IsNotEmpty({ message: '时间值不能为空' })
  value!: number;

  @IsEnum(ReviewRuleUnit, { message: '无效的时间单位' })
  @IsNotEmpty({ message: '时间单位不能为空' })
  unit!: ReviewRuleUnit;

  @IsEnum(ReviewRuleRepetition, { message: '无效的重复类型' })
  @IsNotEmpty({ message: '重复类型不能为空' })
  repetition!: ReviewRuleRepetition;
}
