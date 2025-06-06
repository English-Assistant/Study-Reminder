# Study Reminder - Backend API

> 后端 API 接口模块，提供完整的学习复习管理功能

## 📖 概述

本模块为 Study Reminder 应用提供 RESTful API 服务，支持用户管理、课程管理、学习打卡和智能复习计划等核心功能。

## 🏗️ 模块架构

### 🔐 认证模块 (`/auth`)

负责用户身份验证和个人设置管理

- **用户登录**：用户名+密码认证
- **用户注册**：邮箱验证码+用户信息注册
- **密码重置**：邮箱验证码+新密码重置
- **验证码发送**：支持注册和密码重置验证码
- **JWT 令牌管理**：安全的身份认证机制
- **通知偏好设置**：个性化通知配置
- **用户注销**：发送验证码以确认账户删除

### 📚 课程模块 (`/courses`)

管理用户的学习课程

- 课程创建和编辑
- 课程列表查询
- 课程删除管理

### ⚙️ 复习设置模块 (`/review-settings`)

配置个性化复习规则

- 复习周期设置
- 规则批量管理
- 个性化复习计划

### 📝 学习记录模块 (`/study-records`)

记录和管理学习打卡数据

- 学习打卡记录
- 学习统计查询
- 连续学习天数统计
- 多条件筛选查询

### 🔄 计划复习模块 (`/upcoming-reviews`)

智能复习计划管理

- 未来复习计划查询
- 复习时间计算
- 复习提醒生成

### 🔔 通知模块 (后台服务)

实时通知和提醒服务

- **邮件通知发送**：复习提醒和系统通知
- **验证码邮件**：注册和密码重置验证码
- **邮件模板**：基于 React Email 的精美模板
- **WebSocket 实时推送**：即时消息通知
- **定时任务调度**：自动化通知管理
- **发送频率控制**：防止验证码滥用（1分钟限制）

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 环境配置

```bash
cp docker/.env.example .env
# 配置数据库连接、JWT密钥、邮件服务等
```

### 启动开发服务

```bash
# 启动数据库
pnpm db:start

# 启动开发服务器
pnpm dev
```

### 数据库管理

```bash
# 数据库迁移
pnpm db:migrate

# 重置数据库
pnpm db:reset

# 查看数据库
pnpm db:studio
```

## 📋 API 认证

大部分 API 接口需要 JWT 认证，请在请求头中包含：

```
Authorization: Bearer <your_jwt_token>
```

## 🛠️ 技术栈

- **NestJS** - 企业级 Node.js 框架
- **Prisma** - 现代化数据库 ORM
- **PostgreSQL** - 关系型数据库
- **Socket.io** - 实时通信
- **Bull Queue** - 任务队列
- **JWT** - 身份认证
- **React Email** - 邮件模板
- **Nodemailer** - 邮件发送
- **TypeScript** - 类型安全

## 📚 相关文档

- [主项目文档](../../README.md)
- [前端应用](../app/README.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来完善此模块！
