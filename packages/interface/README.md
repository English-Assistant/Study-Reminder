# 英语复习应用后端接口

本项目包含英语复习应用的 NestJS 后端服务。

## 先决条件

- Node.js (推荐 v18+)
- pnpm
- Docker (用于运行 PostgreSQL)

## 安装与设置

1.  **安装依赖:**
    在 Monorepo 项目根目录下运行:

    ```bash
    pnpm install
    ```

2.  **环境变量配置:**
    在 `packages/interface` 目录下创建一个 `.env` 文件，内容示例:

    ```env
    DATABASE_URL="postgresql://your_db_user:your_db_password@localhost:5433/my_review_app_interface_db?schema=public"
    JWT_SECRET="your_strong_jwt_secret"
    JWT_EXPIRATION_TIME="3600s" # 例如：1小时
    ```

    请将 `your_db_user`, `your_db_password`, 和 `your_strong_jwt_secret` 替换为您的实际凭据和密钥。 `DATABASE_URL` 应与 `docker-compose.yml` 文件中的配置一致。

3.  **启动 PostgreSQL 数据库:**
    进入 `packages/interface` 目录并运行:

    ```bash
    docker-compose up -d
    ```

    这将启动一个 PostgreSQL 容器。数据库将在您主机的 `5433` 端口上可用。

4.  **Prisma 设置:**
    - **生成 Prisma Client:**
      ```bash
      cd packages/interface
      pnpm exec prisma generate
      ```
    - **运行数据库迁移:**
      这将根据 `prisma/schema.prisma` 文件创建数据库结构。
      ```bash
      cd packages/interface
      pnpm exec prisma migrate dev --name your_migration_name
      ```
      (请将 `your_migration_name` 替换为描述性的迁移名称)。

## 运行应用

```bash
cd packages/interface
pnpm run start:dev
```

默认情况下，应用将在 `http://localhost:3001` (或 `src/main.ts` 中指定的端口) 运行。所有 API 路由都以 `/api/v1` 为前缀。

## API 端点

后端应用 (`packages/interface`) 提供以下 API 端点。所有显示的路径都是相对于全局前缀 `/api/v1` 的。

### 根路径 (`AppController`)

- **`GET /`**
  - **功能**: API 的基本健康检查或欢迎信息。

### 认证 (`/auth` - `AuthModuleController`)

- **`POST /login-register`**
  - **功能**: 用户登录或注册。若用户不存在则创建新账户。
- **`GET /profile`**
  - **功能**: 获取当前已认证用户的个人资料 (需要认证)。

### 用户 (`/users` - `UsersModuleController`)

- **功能**: 主要处理内部用户数据管理，作为认证模块的依赖，目前未直接对外暴露 API 端点。

### 课程 (`/courses` - `CoursesModuleController`)

_(所有接口均需要认证)_

- **`POST /`**
  - **功能**: 为当前用户创建一个新课程。
- **`GET /`**
  - **功能**: 获取当前用户的所有课程。
- **`GET /:id`**
  - **功能**: 通过课程 ID 获取特定课程的详细信息。
- **`PATCH /:id`**
  - **功能**: 通过课程 ID 更新特定课程的信息。
- **`DELETE /:id`**
  - **功能**: 通过课程 ID 删除特定课程。

### 复习设置 (`/review-settings` - `ReviewSettingsModuleController`)

_(所有接口均需要认证)_

- **`GET /`**
  - **功能**: 获取当前用户的全局复习设置 (包括通知偏好和复习规则)。若首次访问，则创建并返回默认设置。
- **`POST /`**
  - **功能**: 设置或更新当前用户的全局复习设置。通知偏好可部分更新，复习规则列表则整体替换。

### 手动复习条目 (`/manual-review-entries` - `ManualReviewEntriesModuleController`)

_(所有接口均需要认证)_

- **`POST /`**
  - **功能**: 为指定课程创建新的手动复习条目。
- **`GET /`**
  - **功能**: 获取当前用户的所有手动复习条目 (可按课程ID过滤)。
- **`GET /:id`**
  - **功能**: 获取特定手动复习条目的详细信息。
- **`PATCH /:id`**
  - **功能**: 更新特定手动复习条目的信息。
- **`DELETE /:id`**
  - **功能**: 删除特定手动复习条目。

### 计划复习 (`/scheduled-reviews` - `ScheduledReviewsModuleController`)

_(所有接口均需要认证)_

- **`GET /`**
  - **功能**: 获取当前用户的计划复习列表 (可按日期范围 `from`, `to` 过滤)，包含手动条目和基于规则生成的复习项。

### WebSocket 通知 (`NotificationsGateway`)

- **功能**: 通过 WebSocket 提供实时通知，主要用于复习提醒。
- **连接**: 客户端需使用 `socket.io-client` 连接，并通过 JWT 进行认证。
- **主要事件**: `reviewReminder` (服务器 -> 客户端)，推送复习到期提醒。

## 项目结构 (主要目录)

- `prisma/`: 包含 Prisma schema (`schema.prisma`) 和数据库迁移文件。
- `src/`: 主要源代码。
  - `app.module.ts`: 根模块。
  - `main.ts`: 应用入口文件，全局配置。
  - `common/`: 通用工具、过滤器、拦截器。
  - `prisma/`: Prisma 服务和模块。
  - `auth-module/`: 认证逻辑, JWT 策略, 守卫。
  - `users-module/`: 用户管理逻辑。
  - `courses-module/`: 课程管理。
  - `review-settings-module/`: 全局复习设置管理。
  - `manual-review-entries-module/`: 手动复习条目管理。
  - `scheduled-reviews-module/`: 计划复习列表生成与获取。
  - `notifications/`: WebSocket 通知网关及相关服务。

## 代码检查与格式化

本项目使用 ESLint 和 Prettier 来保证代码质量。

- 代码检查: `pnpm run lint` (在 `packages/interface` 目录下运行)
- 代码格式化: `pnpm run format` (在 `packages/interface` 目录下运行)

## 数据模型 (Prisma Schema)

核心数据模型定义在 `prisma/schema.prisma` 文件中，包括：

- `User`: 用户账户信息及通知偏好。
- `Course`: 用户创建的课程。
- `ReviewRule`: 复习规则，关联到全局设置。
- `UserGlobalSettings`: 存储用户的全局复习配置。
- `ManualReviewEntry`: 手动添加的复习条目。

详细的字段和关系请参考 `prisma/schema.prisma` 文件。

## 未来方向

- 细化课程内部结构 (例如：单元、课件)。
- 完善通知系统。
- 增加更多用户自定义选项。
