import axios, {
  type AxiosResponse,
  type InternalAxiosRequestConfig,
  type AxiosError,
} from 'axios';
import { useUserStore } from '@/stores/user.store'; // 导入用户 store
// 假设你的 Zustand store 路径如下 - 先注释掉，因为 store 还没创建
// import { useUserStore } from '@/stores/user'; // @/ 应该指向 packages/app/src

// 定义一个更具体的错误数据结构，如果后端有标准错误格式的话
interface ErrorData {
  message: string | string[];
  error?: string;
  // 其他可能的错误字段
}

export interface BackendResponse<T = unknown> {
  // 使用 unknown 代替 any
  status: number;
  message: string;
  data: T;
}

export const request = axios.create({
  baseURL: '/api/v1', // 来自 packages/interface/src/main.ts
  timeout: 10000,
});

// 添加请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useUserStore.getState().accessToken; // 从 Zustand store 获取 token
    if (token && config.headers) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
    return config;
  },
  (error: AxiosError<ErrorData>) => {
    // 使用定义的 ErrorData
    return Promise.reject(error);
  },
);

// 添加响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse<BackendResponse<unknown>>) => {
    // 使用 unknown
    const backendData = response.data || undefined;

    if (backendData && backendData.status >= 200 && backendData.status < 300) {
      return response; // 调用方通过 response.data.data 获取业务数据
    } else {
      const errorMessage =
        backendData?.message || 'Unknown server response error';
      return Promise.reject(new Error(String(errorMessage)));
    }
  },
  (error: AxiosError<BackendResponse<unknown> | ErrorData>) => {
    // 使用 unknown 和 ErrorData
    if (
      error.response &&
      error.response.data &&
      typeof error.response.data === 'object'
    ) {
      const errorData = error.response.data;
      // 检查是否是 BackendResponse 结构
      if ('status' in errorData && 'message' in errorData) {
        const backendErrorData = errorData as BackendResponse<unknown>;
        const status = backendErrorData.status;
        let message = 'An error occurred';

        if (Array.isArray(backendErrorData.message)) {
          message = backendErrorData.message.join(', ');
        } else if (typeof backendErrorData.message === 'string') {
          message = backendErrorData.message;
        }

        if (status === 401) {
          // console.error('Authentication failed:', message);
          // 后续添加: useUserStore.getState().logout();
          setTimeout(() => {
            window.location.href = '/login'; // 你的登录页路由
          }, 1500);
          return Promise.reject(
            new Error(`身份验证失败: ${message}，将跳转到登录页...`),
          );
        }
        return Promise.reject(new Error(message));
      } else if ('message' in errorData) {
        // 可能是 ErrorData 结构或其他自定义错误
        const genericErrorData = errorData as ErrorData;
        let message = 'An error occurred';
        if (Array.isArray(genericErrorData.message)) {
          message = genericErrorData.message.join(', ');
        } else if (typeof genericErrorData.message === 'string') {
          message = genericErrorData.message;
        }
        return Promise.reject(new Error(message));
      }
    }
    if (error.request) {
      return Promise.reject(new Error('网络错误，请检查您的连接。'));
    } else {
      return Promise.reject(new Error(error.message || '请求发起失败。'));
    }
  },
);
