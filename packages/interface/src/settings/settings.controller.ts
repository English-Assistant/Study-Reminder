import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Req,
  Post,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateEmailDto } from './dto/update-email.dto';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { SettingDto } from './dto/setting.dto';
import { StudyTimeWindow } from '@prisma/client';
import {
  CreateStudyTimeWindowDto,
  UpdateStudyTimeWindowDto,
} from './dto/study-time-window.dto';
import { UpdateNotificationFlagsDto } from './dto/update-notification-flags.dto';
import { ReviewRuleDto } from '../review-settings/dto/review-rule.dto';
import { ParseArrayPipe } from '@nestjs/common';

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

  /**
   * 更新用户的通知设置（开关）
   */
  @Patch('notification-flags')
  async updateNotificationFlags(
    @Body() dto: UpdateNotificationFlagsDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    return await this.settingsService.updateNotificationFlags(req.user.id, dto);
  }

  /**
   * 更新用户的复习规则
   */
  @Patch('review-rules')
  async updateReviewRules(
    @Body(new ParseArrayPipe({ items: ReviewRuleDto })) rules: ReviewRuleDto[],
    @Req() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    return await this.settingsService.updateReviewRules(req.user.id, rules);
  }

  /**
   * 获取当前用户的所有学习时间段
   */
  @Get('study-time-windows')
  async getStudyTimeWindows(
    @Req() req: AuthenticatedRequest,
  ): Promise<StudyTimeWindow[]> {
    return this.settingsService.getStudyTimeWindows(req.user.id);
  }

  /**
   * 为当前用户创建新的学习时间段
   */
  @Post('study-time-windows')
  @HttpCode(HttpStatus.CREATED)
  async createStudyTimeWindow(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateStudyTimeWindowDto,
  ): Promise<StudyTimeWindow> {
    return this.settingsService.createStudyTimeWindow(req.user.id, dto);
  }

  /**
   * 更新指定的学习时间段
   */
  @Patch('study-time-windows/:id')
  async updateStudyTimeWindow(
    @Param('id') id: string,
    @Body() dto: UpdateStudyTimeWindowDto,
  ): Promise<StudyTimeWindow> {
    return this.settingsService.updateStudyTimeWindow(id, dto);
  }

  /**
   * 删除指定的学习时间段
   */
  @Delete('study-time-windows/:id')
  async deleteStudyTimeWindow(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.settingsService.deleteStudyTimeWindow(id);
  }
}
