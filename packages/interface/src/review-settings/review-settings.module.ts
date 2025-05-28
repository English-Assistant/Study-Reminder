import { Module } from '@nestjs/common';
import { ReviewSettingsService } from './review-settings.service';
import { ReviewSettingsController } from './review-settings.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ReviewSettingsController],
  providers: [ReviewSettingsService],
  exports: [ReviewSettingsService],
})
export class ReviewSettingsModule {}
