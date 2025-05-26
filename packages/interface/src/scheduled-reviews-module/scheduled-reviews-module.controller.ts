import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ScheduledReviewsModuleService } from './scheduled-reviews-module.service';
import { ScheduledReviewDto } from './dto/scheduled-review.dto';
import { MarkReviewAsDoneDto } from './dto/mark-review-as-done.dto';
import { JwtAuthGuard } from '../auth-module/guards/jwt-auth.guard';
import { LearningActivity, ManualReviewEntry } from '../../generated/prisma';

interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    username: string;
  };
}

@Controller('scheduled-reviews')
@UseGuards(JwtAuthGuard)
export class ScheduledReviewsModuleController {
  constructor(
    private readonly scheduledReviewsService: ScheduledReviewsModuleService,
  ) {}

  @Get()
  async getScheduledReviews(
    @Req() req: AuthenticatedRequest,
  ): Promise<ScheduledReviewDto[]> {
    return await this.scheduledReviewsService.getScheduledReviews(
      req.user.userId,
    );
  }

  @Post('mark-done')
  async markReviewAsDone(
    @Body() markAsDoneDto: MarkReviewAsDoneDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<LearningActivity | ManualReviewEntry | null> {
    return await this.scheduledReviewsService.markReviewAsDone(
      req.user.userId,
      markAsDoneDto,
    );
  }
}
