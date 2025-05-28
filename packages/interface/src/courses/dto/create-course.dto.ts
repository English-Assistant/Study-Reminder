import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsHexColor,
} from 'class-validator';

export class CreateCourseDto {
  @IsNotEmpty({ message: '课程名称不能为空' })
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsNotEmpty({ message: '课程颜色不能为空' })
  @IsHexColor({ message: '颜色必须是有效的HEX颜色代码' })
  color!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
