// import { ApiProperty } from '@nestjs/swagger'; // 移除 Swagger
import { IsInt, IsNotEmpty, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetStudyRecordsByMonthQueryDto {
  // @ApiProperty({
  //   description: '年份',
  //   example: 2024,
  // })
  @IsNotEmpty({ message: '年份不能为空' })
  @IsInt({ message: '年份必须是整数' })
  @Min(1970, { message: '年份不能早于1970' })
  @Max(2100, { message: '年份不能晚于2100' })
  @Type(() => Number)
  year: number; // 年份

  // @ApiProperty({
  //   description: '月份 (1-12)',
  //   example: 7,
  // })
  @IsNotEmpty({ message: '月份不能为空' })
  @IsInt({ message: '月份必须是整数' })
  @Min(1, { message: '月份必须在1到12之间' })
  @Max(12, { message: '月份必须在1到12之间' })
  @Type(() => Number)
  month: number; // 月份 (1-12)
}
