import { request } from '@/utils/request';
import type { GlobalApiTypes } from '@/types/api';

// Backend DTOs, Controller, and Prisma types
import type { AuthController } from '@y/interface/auth/auth.controller.ts';
import type { RegisterDto } from '@y/interface/auth/dto/register.dto.ts';
import type { LoginDto } from '@y/interface/auth/dto/login.dto.ts';
import type { ForgotPasswordDto } from '@y/interface/auth/dto/forgot-password.dto.ts';
import type { SendVerificationCodeDto } from '@y/interface/auth/dto/send-verification-code.dto.ts';
import type { UnregisterDto } from '@y/interface/auth/dto/unregister.dto.js';

// --- API Functions ---

/**
 * 发送验证码
 */
export async function sendVerificationCodeApi(data: SendVerificationCodeDto) {
  const response = await request.post<
    GlobalApiTypes<ReturnType<AuthController['sendVerificationCode']>>
  >('/auth/send-verification-code', data);
  return response.data.data;
}

/**
 * 用户注册
 */
export async function registerApi(data: RegisterDto) {
  const response = await request.post<
    GlobalApiTypes<ReturnType<AuthController['register']>>
  >('/auth/register', data);
  return response.data.data;
}

/**
 * 用户登录
 */
export async function loginApi(data: LoginDto) {
  const response = await request.post<
    GlobalApiTypes<ReturnType<AuthController['login']>>
  >('/auth/login', data);
  return response.data.data;
}

/**
 * 重置密码
 */
export async function forgotPasswordApi(data: ForgotPasswordDto) {
  const response = await request.post<
    GlobalApiTypes<ReturnType<AuthController['forgotPassword']>>
  >('/auth/forgot-password', data);
  return response.data.data;
}

/**
 * 获取当前用户的通知设置
 */
export async function getUserSettingsApi() {
  const response =
    await request.get<
      GlobalApiTypes<ReturnType<AuthController['getUserSettings']>>
    >('/auth/settings');
  return response.data.data;
}

/**
 * 发送注销验证码
 */
export async function sendUnregisterCodeApi() {
  const response = await request.post<
    GlobalApiTypes<ReturnType<AuthController['sendUnregisterCode']>>
  >('/auth/unregister/send-code');
  return response.data.data;
}

/**
 * 确认注销账户
 */
export async function confirmUnregisterApi(data: UnregisterDto) {
  const response = await request.post<
    GlobalApiTypes<ReturnType<AuthController['unregister']>>
  >('/auth/unregister/confirm', data);
  return response.data.data;
}
