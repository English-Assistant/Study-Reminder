import { Module } from '@nestjs/common';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { ReviewSettingsModule } from '../review-settings/review-settings.module';

@Module({
  imports: [ReviewSettingsModule],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
