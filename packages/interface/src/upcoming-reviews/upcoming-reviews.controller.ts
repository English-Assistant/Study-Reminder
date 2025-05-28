import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { UpcomingReviewsService } from './upcoming-reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { UpcomingReviewDto } from './dto/upcoming-review.dto';
import { GetUpcomingReviewsDto } from './dto/get-upcoming-reviews.dto';

@UseGuards(JwtAuthGuard)
@Controller('upcoming-reviews')
export class UpcomingReviewsController {
  constructor(
    private readonly upcomingReviewsService: UpcomingReviewsService,
  ) {}

  @Get()
  async getUpcomingReviews(
    @Req() req: AuthenticatedRequest,
    @Query() query: GetUpcomingReviewsDto,
  ): Promise<UpcomingReviewDto[]> {
    const userId = req.user.id;
    return this.upcomingReviewsService.getUpcomingReviews(
      userId,
      query.withinDays ?? 7,
    );
  }
}
