import { Module, Global } from '@nestjs/common';
import { NotificationsService } from './services/notifications.service';
import { NotificationsGateway } from './gateways/notifications.gateway';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModuleModule } from '../users-module/users-module.module';

@Global()
@Module({
  imports: [ConfigModule, JwtModule, UsersModuleModule],
  providers: [NotificationsService, NotificationsGateway],
  exports: [NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
