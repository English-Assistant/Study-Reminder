import { PartialType } from '@nestjs/mapped-types';
import { CreateCoursesModuleDto } from './create-courses-module.dto';

export class UpdateCoursesModuleDto extends PartialType(
  CreateCoursesModuleDto,
) {}
