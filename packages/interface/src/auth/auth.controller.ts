import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';

import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { SendVerificationCodeDto } from './dto/send-verification-code.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedRequest } from './interfaces/authenticated-request.interface';
import { Setting } from '@prisma/client';
import { UserWithoutPassword } from '../users/users.service';
import { VerificationCodeType } from '../verification-code/verification-code.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('send-verification-code')
  @HttpCode(HttpStatus.OK)
  async sendVerificationCode(
    @Body() sendVerificationCodeDto: SendVerificationCodeDto,
  ): Promise<{ message: string }> {
    return this.authService.sendVerificationCode(
      sendVerificationCodeDto.email,
      sendVerificationCodeDto.type as VerificationCodeType,
      sendVerificationCodeDto.username,
    );
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<{ access_token: string; user: UserWithoutPassword }> {
    return this.authService.register(
      registerDto.username,
      registerDto.password,
      registerDto.email,
      registerDto.verificationCode,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ access_token: string; user: UserWithoutPassword }> {
    return this.authService.login(loginDto.username, loginDto.password);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    return this.authService.resetPassword(
      forgotPasswordDto.email,
      forgotPasswordDto.newPassword,
      forgotPasswordDto.verificationCode,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('settings')
  async getUserSettings(
    @Req() req: AuthenticatedRequest,
  ): Promise<Setting | null> {
    return this.authService.getUserSettings(req.user.id);
  }
}
