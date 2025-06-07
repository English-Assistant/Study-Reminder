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
import { UserWithoutPassword } from '../users/users.service';
import { VerificationCodeType } from '../verification-code/verification-code.service';
import { UnregisterDto } from './dto/unregister.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * 发送验证码
   * @param sendVerificationCodeDto - 包含邮箱、类型（注册/重置密码）和可选的用户名
   */
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

  /**
   * 用户注册
   * @param registerDto - 包含用户名、密码、邮箱和验证码
   */
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

  /**
   * 用户登录
   * @param loginDto - 包含用户名和密码
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ access_token: string; user: UserWithoutPassword }> {
    return this.authService.login(loginDto.username, loginDto.password);
  }

  /**
   * 重置密码
   * @param forgotPasswordDto - 包含邮箱、新密码和验证码
   */
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

  /**
   * 发送注销验证码（需要登录）
   * @param req - 包含认证用户信息的请求对象
   */
  @UseGuards(JwtAuthGuard)
  @Post('unregister/send-code')
  @HttpCode(HttpStatus.OK)
  async sendUnregisterCode(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ message: string }> {
    return this.authService.sendUnregisterCode(req.user.id);
  }

  /**
   * 确认注销账户（需要登录）
   * @param req - 包含认证用户信息的请求对象
   * @param unregisterDto - 包含注销验证码
   */
  @UseGuards(JwtAuthGuard)
  @Post('unregister/confirm')
  @HttpCode(HttpStatus.OK)
  async unregister(
    @Req() req: AuthenticatedRequest,
    @Body() unregisterDto: UnregisterDto,
  ): Promise<{ message: string }> {
    return this.authService.unregister(
      req.user.id,
      unregisterDto.verificationCode,
    );
  }

  /**
   * 获取当前用户的设置信息（需要登录）
   * @param req - 包含认证用户信息的请求对象
   */
  @UseGuards(JwtAuthGuard)
  @Get('settings')
  async getUserSettings(@Req() req: AuthenticatedRequest) {
    return this.authService.getUserSettings(req.user.id);
  }
}
