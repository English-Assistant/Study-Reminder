import { PartialType } from '@nestjs/mapped-types';
import { CreateUserCourseProgressModuleDto } from './create-user-course-progress-module.dto';

export class UpdateUserCourseProgressModuleDto extends PartialType(
  CreateUserCourseProgressModuleDto,
) {}
