import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { UpcomingReviewsService } from './upcoming-reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { GetUpcomingReviewsDto } from './dto/get-upcoming-reviews.dto';
import { GroupedUpcomingReviewsDto } from './dto/grouped-upcoming-reviews.dto';

/**
 * 未来待复习列表接口
 * ------------------------------------------------------------
 * 提供按天分组的待复习项，用于前端日历 / 列表展示。
 */
@UseGuards(JwtAuthGuard)
@Controller('upcoming-reviews')
export class UpcomingReviewsController {
  constructor(
    private readonly upcomingReviewsService: UpcomingReviewsService,
  ) {}

  /** 查询未来 N 天内待复习任务（默认 7 天） */
  @Get()
  async getUpcomingReviews(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetUpcomingReviewsDto,
  ): Promise<GroupedUpcomingReviewsDto[]> {
    const userId = req.user.id;
    return this.upcomingReviewsService.getUpcomingReviews(
      userId,
      query.withinDays ?? 7,
    );
  }
}
