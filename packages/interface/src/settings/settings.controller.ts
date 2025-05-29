import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateEmailDto } from './dto/update-email.dto';
import { UpdateReviewNotificationSettingsDto } from './dto/update-review-notification-settings.dto';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { SettingDto } from './dto/setting.dto';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async getSettings(@Req() req: AuthenticatedRequest): Promise<SettingDto> {
    return await this.settingsService.getSettings(req.user.id);
  }

  @Patch('email')
  async updateEmail(
    @Body() updateEmailDto: UpdateEmailDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    return await this.settingsService.updateEmail(req.user.id, updateEmailDto);
  }

  @Patch('review-notifications')
  async updateReviewNotificationSettings(
    @Body()
    updateReviewNotificationSettingsDto: UpdateReviewNotificationSettingsDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    return await this.settingsService.updateReviewNotificationSettings(
      req.user.id,
      updateReviewNotificationSettingsDto,
    );
  }
}
