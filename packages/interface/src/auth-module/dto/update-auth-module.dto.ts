import { PartialType } from '@nestjs/mapped-types';
import { CreateAuthModuleDto } from './create-auth-module.dto';

export class UpdateAuthModuleDto extends PartialType(CreateAuthModuleDto) {}
