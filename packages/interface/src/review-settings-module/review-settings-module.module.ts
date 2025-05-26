import { Module } from '@nestjs/common';
import { ReviewSettingsService } from './review-settings-module.service';
import { ReviewSettingsModuleController } from './review-settings-module.controller';

@Module({
  controllers: [ReviewSettingsModuleController],
  providers: [ReviewSettingsService],
  exports: [ReviewSettingsService],
})
export class ReviewSettingsModuleModule {}
