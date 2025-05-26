import { Module } from '@nestjs/common';
import { UsersModuleService } from './users-module.service';
import { UsersModuleController } from './users-module.controller';

@Module({
  controllers: [UsersModuleController],
  providers: [UsersModuleService],
  exports: [UsersModuleService],
})
export class UsersModuleModule {}
