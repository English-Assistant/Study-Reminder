import {
  Controller,
  Get,
  Query,
  UseGuards,
  Req,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { UserStatisticsModuleService } from './user-statistics-module.service';
import { JwtAuthGuard } from '../auth-module/guards/jwt-auth.guard';
import { UserOverallStatsDto } from './dto/user-overall-stats.dto';
import { ActivityStreakDto } from './dto/activity-streak.dto';
import { DailyReviewActivityDto } from './dto/daily-review-activity.dto';
import { CourseFocusDto } from './dto/course-focus.dto';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    username: string;
  };
}

@Controller('user-statistics')
@UseGuards(JwtAuthGuard)
export class UserStatisticsModuleController {
  constructor(private readonly statsService: UserStatisticsModuleService) {}

  @Get('overall')
  async getOverallStats(
    @Req() req: AuthenticatedRequest,
  ): Promise<UserOverallStatsDto> {
    return await this.statsService.getOverallStats(req.user.userId);
  }

  @Get('streak')
  async getActivityStreak(
    @Req() req: AuthenticatedRequest,
  ): Promise<ActivityStreakDto> {
    return await this.statsService.getActivityStreak(req.user.userId);
  }

  @Get('review-activity')
  async getReviewActivity(
    @Req() req: AuthenticatedRequest,
    @Query('periodDays', new DefaultValuePipe(7), ParseIntPipe)
    periodDays: number,
  ): Promise<DailyReviewActivityDto[]> {
    return await this.statsService.getReviewActivity(
      req.user.userId,
      periodDays,
    );
  }

  @Get('course-focus')
  async getCourseFocusStats(
    @Req() req: AuthenticatedRequest,
  ): Promise<CourseFocusDto[]> {
    return await this.statsService.getCourseFocusStats(req.user.userId);
  }
}
