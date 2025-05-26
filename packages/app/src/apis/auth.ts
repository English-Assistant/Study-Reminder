import { request } from '@/utils/request';
import type { GlobalApiTypes } from '@/types/api';

// 导入控制器
import type { AuthModuleController } from '@y/interface/auth-module/auth-module.controller.ts';

// 导入用作参数的 DTO
import type { LoginOrRegisterDto } from '@y/interface/auth-module/dto/login-or-register.dto.ts';

// 登录或注册
export async function loginOrRegister(data: LoginOrRegisterDto) {
  const response = await request.post<
    GlobalApiTypes<ReturnType<AuthModuleController['loginOrRegister']>>
  >('/auth/login-register', data);
  return response.data.data;
}

// 获取个人资料 (受保护路由)
export async function getProfile() {
  const response =
    await request.get<
      GlobalApiTypes<ReturnType<AuthModuleController['getProfile']>>
    >('/auth/profile');
  return response.data.data;
}
