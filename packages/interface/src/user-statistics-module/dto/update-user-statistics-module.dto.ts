import { PartialType } from '@nestjs/mapped-types';
import { CreateUserStatisticsModuleDto } from './create-user-statistics-module.dto';

export class UpdateUserStatisticsModuleDto extends PartialType(
  CreateUserStatisticsModuleDto,
) {}
