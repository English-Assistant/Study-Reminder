import type { BackendResponse } from '@/utils/request';

/**
 * 使用 BackendResponse 包装控制器方法的原始返回类型，
 * 如果返回类型是 Promise，则解析它。
 * 用法: request.get<GlobalApiTypes<ReturnType<ControllerType['methodName']>>>()
 */
export type GlobalApiTypes<T> = BackendResponse<Awaited<T>>;
