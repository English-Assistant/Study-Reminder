# Study Reminder - Frontend Application

> 基于 React + TypeScript 的现代化学习复习提醒前端应用

## 📖 概述

Study Reminder 前端应用是一个功能完整的单页面应用（SPA），为用户提供直观的学习管理界面。应用采用现代化的 React 技术栈，支持学习打卡、课程管理、复习计划和数据统计等核心功能。

## ✨ 功能特性

### 🏠 仪表盘 (`/dashboard`)

- **数据概览**：连续学习天数、待复习课程统计
- **最近记录**：最近7天的学习记录展示
- **复习提醒**：未来复习计划和时间安排
- **快速操作**：一键添加复习计划

### 📝 学习记录管理 (`/study-records`)

- **打卡记录**：记录学习内容、时长和详细笔记
- **日历视图**：直观的日历形式显示学习进度
- **记录编辑**：支持修改和删除学习记录
- **课程筛选**：按课程分类查看学习记录

### 📚 课程管理 (`/courses`)

- **课程创建**：添加新的学习课程
- **课程编辑**：修改课程信息和描述
- **课程删除**：移除不需要的课程
- **课程统计**：查看每个课程的学习数据

### ⚙️ 设置页面 (`/set-up`)

- **复习规则**：自定义个性化复习周期
- **通知设置**：配置邮件和应用内通知偏好
- **账户管理**：个人信息和偏好设置

### ℹ️ 关于页面 (`/about`)

- **项目介绍**：详细的功能说明和使用指南
- **联系方式**：问题反馈和建议渠道

### 🔐 用户认证

- **用户登录** (`/login`)：用户名+密码快速登录
- **用户注册** (`/register`)：邮箱验证码+信息完善注册流程
- **密码重置** (`/forgot-password`)：邮箱验证找回密码
- **步进式体验**：清晰的多步骤表单指导
- **验证码系统**：60秒倒计时防重复发送
- **表单验证**：实时输入验证和错误提示
- **自动跳转**：认证成功后自动跳转到仪表盘

## 🏗️ 技术架构

### 核心技术栈

- **React 19** - 最新的 React 框架
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 快速的构建工具和开发服务器
- **TanStack Router** - 类型安全的文件系统路由

### UI 和样式

- **Ant Design 5** - 企业级 UI 组件库
- **UnoCSS** - 原子化 CSS 引擎
- **React Compiler** - React 19 编译器优化

### 状态管理和工具

- **Zustand** - 轻量级状态管理
- **ahooks** - 实用的 React Hooks 库
- **Axios** - HTTP 客户端
- **Socket.io Client** - 实时通信
- **Day.js** - 轻量级日期处理库

## 📁 项目结构

```
src/
├── routes/                 # 页面路由
│   ├── __root.tsx         # 根路由配置
│   ├── index.tsx          # 首页（重定向）
│   ├── login.tsx          # 登录页面
│   ├── register.tsx       # 注册页面
│   ├── forgot-password.tsx # 忘记密码页面
│   ├── _core.tsx          # 主应用布局
│   └── _core/             # 主应用页面
│       ├── dashboard/     # 仪表盘
│       ├── study-records/ # 学习记录
│       ├── courses/       # 课程管理
│       ├── set-up.tsx     # 设置页面
│       └── about.tsx      # 关于页面
├── components/            # 公共组件
│   └── VerificationCodeInput.tsx # 验证码输入组件
├── stores/                # 状态管理
├── apis/                  # API 接口
├── hooks/                 # 自定义 Hooks
├── utils/                 # 工具函数
├── types/                 # TypeScript 类型
├── assets/                # 静态资源
└── main.tsx              # 应用入口
```

## 🚀 快速开始

### 环境要求

- Node.js 22+
- pnpm 10+

### 安装依赖

```bash
pnpm install
```

### 开发服务器

```bash
# 启动开发服务器
pnpm dev

# 应用将在 http://localhost:5173 启动
```

### 构建生产版本

```bash
# 构建生产版本
pnpm build

# 预览生产版本
pnpm preview
```

### 代码检查

```bash
# 运行 ESLint 检查
pnpm lint
```

## 🎨 设计系统

### 主题配置

- **主色调**：#7D6CE2（紫色）
- **国际化**：中文（zh-CN）
- **设计语言**：Ant Design 5.0

### 布局结构

- **顶部导航**：应用标题和用户操作
- **侧边栏**：主要功能导航
- **内容区域**：页面主体内容
- **响应式设计**：支持桌面和移动端

## 🔄 路由结构

| 路径               | 组件           | 描述         | 认证要求 |
| ------------------ | -------------- | ------------ | -------- |
| `/`                | Index          | 首页重定向   | ❌       |
| `/login`           | Login          | 用户登录     | ❌       |
| `/register`        | Register       | 用户注册     | ❌       |
| `/forgot-password` | ForgotPassword | 密码重置     | ❌       |
| `/dashboard`       | Dashboard      | 仪表盘概览   | ✅       |
| `/study-records`   | StudyRecords   | 学习记录管理 | ✅       |
| `/courses`         | Courses        | 课程管理     | ✅       |
| `/set-up`          | SetUp          | 设置页面     | ✅       |
| `/about`           | About          | 关于页面     | ✅       |

## 🔌 API 集成

### 接口模块

- **认证接口**：登录、注册、密码重置、验证码发送
- **课程接口**：课程的增删改查
- **学习记录**：打卡记录管理
- **复习计划**：智能复习安排
- **通知系统**：实时消息推送

### 状态管理

```typescript
// 用户状态管理示例
const useUserStore = create<UserStore>((set) => ({
  user: null,
  token: null,
  actions: {
    login: (userData) => set({ user: userData }),
    logout: () => set({ user: null, token: null }),
  },
}));
```

## 🎯 开发指南

### 添加新页面

1. 在 `src/routes/` 目录创建新的路由文件
2. 使用 `createFileRoute` 定义路由组件
3. TanStack Router 会自动生成路由类型

### 组件开发规范

- 使用 TypeScript 进行类型安全开发
- 遵循 React Hooks 最佳实践
- 使用 Ant Design 组件库
- 采用 UnoCSS 进行样式开发

### API 调用

```typescript
// 使用 ahooks 的 useRequest
const { data, loading, error } = useRequest(getStudyRecordsApi, {
  onError: (error) => message.error(error.message),
});
```

## 🛠️ 构建配置

### Vite 配置特性

- **路径别名**：`@/` 指向 `src/` 目录
- **SVG 支持**：SVG 文件可作为 React 组件导入
- **代码分割**：自动的路由级代码分割
- **开发服务器**：支持热更新和快速重载

### TypeScript 配置

- **严格模式**：启用所有 TypeScript 严格检查
- **路径映射**：支持绝对路径导入
- **类型检查**：构建时进行完整类型检查

## 🔧 开发工具

### 推荐 VS Code 扩展

- **TypeScript**：官方 TypeScript 支持
- **ESLint**：代码质量检查
- **Prettier**：代码格式化
- **UnoCSS**：原子化 CSS 支持

### 调试工具

- **React DevTools**：React 组件调试
- **TanStack Router DevTools**：路由状态调试
- **Redux DevTools**：状态管理调试（如果使用）

## 📚 相关文档

- [后端 API 文档](../interface/README.md)
- [主项目文档](../../README.md)
- [TanStack Router 文档](https://tanstack.com/router)
- [Ant Design 文档](https://ant.design/)

## 🤝 贡献指南

1. Fork 项目并创建功能分支
2. 遵循现有的代码风格和组件规范
3. 添加必要的类型定义和测试
4. 提交 Pull Request 并描述变更内容

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](../../LICENSE) 文件了解详情。
