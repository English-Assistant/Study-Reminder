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
      pnpm exec prisma migrate dev --name initial_schema
      ```
      (如果您后续创建其他迁移，请将 `initial_schema` 替换为描述性的迁移名称)。

## 运行应用

```bash
cd packages/interface
pnpm run start:dev
```

默认情况下，应用将在 `http://localhost:3001` (或 `src/main.ts` 中指定的端口) 运行。所有 API 路由都以 `/api/v1` 为前缀。

## API 端点

后端应用 (`packages/interface`) 提供以下 API 端点。所有显示的路径都是相对于全局前缀 `/api/v1` 的。

### 根路径 (`AppController`)

- **`GET /`** (完整路径: `/api/v1/`)
  - **功能**: API 的基本健康检查或欢迎信息。
  - **成功响应示例**:
    ```json
    {
      "status": 200,
      "message": "操作成功",
      "data": "Hello World!" // 或来自 AppService 的其他字符串
    }
    ```

### 认证 (`/auth` - AuthModuleController)

- **`POST /login-register`** (完整路径: `/api/v1/auth/login-register`)

  - **功能**: 允许用户登录或注册。如果用户不存在，将创建一个新用户帐户。
  - **请求体**:
    ```json
    {
      "username": "your_username",
      "password": "your_password"
    }
    ```
  - **成功响应 (注册/登录)**:
    ```json
    {
      "status": 201, // 如果是登录则为 200
      "message": "用户创建成功并登录" / "登录成功",
      "data": {
        "user": {
          "id": "user_id",
          "username": "your_username"
          // ... 其他用户字段 (不含密码)
        },
        "access_token": "your_jwt_token"
      }
    }
    ```
  - **失败响应示例 (校验错误)**:
    ```json
    {
      "status": 400,
      "message": "用户名和密码不能为空", // 或其他校验错误信息
      "data": null // 或具体的错误详情
    }
    ```

- **`GET /profile`** (完整路径: `/api/v1/auth/profile`)
  - **功能**: 获取当前已认证用户的个人资料。
  - **认证**: 请求头中需要包含 JWT Bearer Token。
  - **成功响应**:
    ```json
    {
      "status": 200,
      "message": "操作成功",
      "data": {
        "id": "user_id",
        "username": "your_username"
        // ... 其他用户字段 (不含密码)
      }
    }
    ```
  - **失败响应 (未认证)**:
    ```json
    {
      "status": 401,
      "message": "Unauthorized", // 通常为 "未授权"
      "data": null
    }
    ```

### 用户 (`/users` - UsersModuleController)

目前, `UsersModule` 主要作为 `AuthModule` 的依赖项，处理内部用户数据管理 (例如创建用户、按用户名或ID查找用户)。它尚未在 `/api/v1/users` 路径下直接暴露任何面向外部的 API 端点。

### 课程 (`/courses` - CoursesModuleController)

`/api/v1/courses` 下的所有端点都需要 JWT Bearer Token 进行认证。

- **`POST /`** (完整路径: `/api/v1/courses`)

  - **功能**: 为已认证用户创建一个新课程。
  - **请求体**: `CreateCourseDto`
    ```json
    {
      "name": "我的新课程",
      "description": "课程描述内容。", // 可选
      "color": "#FF5733" // 可选
    }
    ```
  - **成功响应**: 创建的课程对象。
    ```json
    {
      "status": 201,
      "message": "操作成功",
      "data": {
        "id": "course_uuid",
        "name": "我的新课程",
        "description": "课程描述内容。",
        "color": "#FF5733",
        "userId": "user_uuid",
        "isDefault": false,
        "createdAt": "timestamp",
        "updatedAt": "timestamp"
      }
    }
    ```

- **`GET /`** (完整路径: `/api/v1/courses`)

  - **功能**: 获取属于已认证用户的所有课程。
  - **成功响应**: 课程对象数组。
    ```json
    {
      "status": 200,
      "message": "操作成功",
      "data": [
        {
          "id": "course_uuid_1"
          // ... 其他课程字段
        },
        {
          "id": "course_uuid_2"
          // ... 其他课程字段
        }
      ]
    }
    ```

- **`GET /:id`** (完整路径: `/api/v1/courses/:id`，其中 `:id` 是课程的 UUID)

  - **功能**: 通过 ID 获取属于已认证用户的特定课程。
  - **成功响应**: 请求的课程对象。
  - **失败响应 (未找到/禁止访问)**: 标准错误格式。

- **`PATCH /:id`** (完整路径: `/api/v1/courses/:id`，其中 `:id` 是课程的 UUID)

  - **功能**: 通过 ID 更新属于已认证用户的特定课程。
  - **请求体**: `UpdateCourseDto` (所有字段可选)
    ```json
    {
      "name": "更新后的课程名称",
      "description": "更新后的描述。"
    }
    ```
  - **成功响应**: 更新后的课程对象。

- **`DELETE /:id`** (完整路径: `/api/v1/courses/:id`，其中 `:id` 是课程的 UUID)
  - **功能**: 通过 ID 删除属于已认证用户的特定课程。
  - **成功响应** (通常为 200 或 204 No Content, 由我们的拦截器包装):
    ```json
    {
      "status": 200, // 或成功删除的状态码
      "message": "操作成功",
      "data": {
        // 可能返回被删除的课程对象
        "id": "course_uuid"
        // ... 其他字段
      }
    }
    ```

## 项目结构 (主要目录)

- `prisma/`: 包含 Prisma schema (`schema.prisma`) 和数据库迁移文件。
- `src/`: 主要源代码。
  - `app.module.ts`: 根模块。
  - `main.ts`: 应用入口文件，全局配置。
  - `common/`: 通用工具、过滤器、拦截器。
    - `filters/`: 全局异常过滤器。
    - `interceptors/`: 全局响应拦截器。
  - `prisma/`: Prisma 服务和模块。
  - `auth-module/`: 认证逻辑, JWT 策略, 守卫。
  - `users-module/`: 用户管理逻辑。
  - `*-module/`: 其他功能模块 (例如 `courses-module`)。
- `generated/`: 包含生成的 Prisma Client (如果尚未配置，请确保此目录在 `.gitignore` 中)。

## 代码检查与格式化

本项目使用 ESLint 和 Prettier 来保证代码质量。

- 代码检查: `pnpm run lint` (在 `packages/interface` 目录下运行)
- 代码格式化: `pnpm run format` (在 `packages/interface` 目录下运行)

## 后续开发

未来待开发的模块包括:

- `CoursesModule` (课程模块 - 部分已实现)
- `ReviewSettingsModule` (复习设置模块)
- `LearningActivitiesModule` (学习活动模块)
- `ScheduledReviewsModule` (计划复习模块)
- `UserCourseProgressModule` (用户课程进度模块)
- `ManualReviewEntriesModule` (手动复习条目模块)
- `UserStatisticsModule` (用户统计模块)
