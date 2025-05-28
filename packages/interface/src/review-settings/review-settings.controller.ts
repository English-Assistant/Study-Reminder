import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReviewSettingsService } from './review-settings.service';
import { SetReviewRulesDto } from './dto/set-review-rules.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AuthenticatedRequest } from 'src/auth/interfaces/authenticated-request.interface';

@UseGuards(JwtAuthGuard)
@Controller('review-rules')
export class ReviewSettingsController {
  constructor(private readonly reviewSettingsService: ReviewSettingsService) {}

  @Get()
  async getReviewRules(@Req() req: AuthenticatedRequest) {
    return this.reviewSettingsService.getReviewRules(req.user.id);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async setReviewRules(
    @Req() req: AuthenticatedRequest,
    @Body() setReviewRulesDto: SetReviewRulesDto,
  ) {
    return this.reviewSettingsService.setReviewRules(
      req.user.id,
      setReviewRulesDto,
    );
  }
}
