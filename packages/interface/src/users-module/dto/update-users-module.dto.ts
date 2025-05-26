import { PartialType } from '@nestjs/mapped-types';
import { CreateUsersModuleDto } from './create-users-module.dto';

export class UpdateUsersModuleDto extends PartialType(CreateUsersModuleDto) {}
