import { IsString, Matches, IsOptional } from 'class-validator';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const timeRegexMessage = '时间格式必须为 HH:mm';

export class CreateStudyTimeWindowDto {
  @IsString()
  @Matches(timeRegex, { message: timeRegexMessage })
  startTime: string;

  @IsString()
  @Matches(timeRegex, { message: timeRegexMessage })
  endTime: string;
}

export class UpdateStudyTimeWindowDto {
  @IsString()
  @IsOptional()
  @Matches(timeRegex, { message: timeRegexMessage })
  startTime?: string;

  @IsString()
  @IsOptional()
  @Matches(timeRegex, { message: timeRegexMessage })
  endTime?: string;
}
