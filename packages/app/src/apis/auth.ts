import { request } from '@/utils/request';
import type { GlobalApiTypes } from '@/types/api';

// Backend DTOs, Controller, and Prisma types
import type { AuthController } from '@y/interface/auth/auth.controller.ts';
import type { LoginOrRegisterDto } from '@y/interface/auth/dto/login-or-register.dto.ts';
import type { UpdateSettingsDto } from '@y/interface/auth/dto/update-settings.dto.ts';

// --- API Functions ---

/**
 * 用户登录或注册
 */
export async function loginOrRegisterApi(data: LoginOrRegisterDto) {
  const response = await request.post<
    GlobalApiTypes<ReturnType<AuthController['loginOrRegister']>> // Explicitly using our defined response type
  >('/auth/login-or-register', data);
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
 * 更新当前用户的通知设置
 * @param data 包含要更新的设置的 DTO
 */
export async function updateUserSettingsApi(data: UpdateSettingsDto) {
  const response = await request.patch<
    GlobalApiTypes<ReturnType<AuthController['updateUserSettings']>>
  >('/auth/settings', data);
  return response.data.data;
}
