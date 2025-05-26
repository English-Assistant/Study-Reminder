import { Controller } from '@nestjs/common';
import { UsersModuleService } from './users-module.service';

@Controller('users')
export class UsersModuleController {
  constructor(private readonly usersModuleService: UsersModuleService) {}
}
