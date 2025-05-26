/**
 * JWT 常量
 * 重要提示：在生产环境中，jwtSecret 应该是一个复杂的、随机生成的字符串，
 * 并且应该通过环境变量进行管理，而不是硬编码在代码中。
 */
export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'yourSuperSecretKeyForDevelopmentAgain', // 请务必在生产中替换并使用环境变量
  expiresIn: '3600s', // Token 有效期，例如：60s, 10h, 7d. 建议设置为较短时间，并配合刷新令牌机制
};
