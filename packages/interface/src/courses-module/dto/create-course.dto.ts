import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateCourseDto {
  @IsString({ message: '课程标题必须是字符串' })
  @IsNotEmpty({ message: '课程标题不能为空' })
  @MaxLength(255, { message: '课程标题长度不能超过255个字符' })
  title!: string;

  @IsString({ message: '课程描述必须是字符串' })
  @IsOptional()
  @MaxLength(1000, { message: '课程描述长度不能超过1000个字符' })
  description?: string;

  @IsString({ message: '颜色值必须是字符串' })
  @IsNotEmpty({ message: '颜色不能为空' })
  @Matches(/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/, {
    message: '颜色值必须是有效的十六进制颜色代码 (例如 #RRGGBB 或 #RGB)',
  })
  @MaxLength(7, { message: '颜色值长度不能超过7个字符' })
  color!: string;
}
