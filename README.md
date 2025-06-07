# Study Reminder

<div align="center">

![Study Reminder Logo](https://img.shields.io/badge/Study-Reminder-blue?style=for-the-badge)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![GitHub Issues](https://img.shields.io/github/issues/English-Assistant/Study-Reminder?style=for-the-badge)](https://github.com/English-Assistant/Study-Reminder/issues)
[![GitHub Stars](https://img.shields.io/github/stars/English-Assistant/Study-Reminder?style=for-the-badge)](https://github.com/English-Assistant/Study-Reminder/stargazers)

**一款智能学习复习提醒应用，帮助您系统化管理学习进度和复习计划**

[🚀 快速开始](#-快速开始) • [✨ 功能特性](#-功能特性) • [📖 API 文档](#-api-文档) • [🛠️ 部署指南](#️-部署指南) • [🤝 贡献指南](#-贡献指南)

</div>

## 📖 项目介绍

Study Reminder 是一款旨在帮助用户更有效地记忆和巩固所学知识的智能学习工具。我们相信，及时的复习是长期记忆的关键。本应用通过灵活的打卡记录和个性化的复习规则设置，帮助您系统地安排复习计划，确保每一个知识点都能得到充分回顾，从而深化理解，提升学习效率。

## ✨ 功能特性

### 🔐 用户管理

- **安全认证**：完善的用户注册与登录系统，支持邮箱验证码注册
- **密码管理**：安全的密码重置功能，支持邮箱验证
- **用户注销**：提供安全的、通过邮箱验证的账户注销流程
- **防护机制**：验证码发送频率限制，防止恶意攻击
- **个性化设置**：自定义通知偏好和学习设置

### 📚 课程管理

- **课程创建**：自由创建和组织您的学习课程
- **灵活管理**：编辑、删除和重新组织课程结构

### 📝 学习打卡

- **详细记录**：记录每次学习的内容、时长和笔记详情
- **数据统计**：跟踪您的连续打卡天数，激励学习动力
- **筛选查询**：按课程、日期等条件筛选学习记录

### 🔄 智能复习系统

- **自定义规则**：为每个用户设置个性化的复习周期（例如1小时后、1天后、每周等）
- **学习时间段**：允许用户设置特定的学习时间窗口，所有复习提醒将智能调整到这些时间段内，确保在合适的时间收到通知。
- **智能计划**：自动计算并展示未来需要复习的学习条目
- **提醒通知**：通过邮件和应用内通知及时获得复习提醒

### 🔔 通知系统

- **多渠道通知**：支持邮件和实时应用内通知
- **验证码邮件**：精美的邮件模板，支持注册和密码重置验证
- **灵活设置**：用户可以自定义接收通知的偏好
- **实时推送**：WebSocket 实现的实时通知推送

## 🏗️ 技术架构

### 前端技术栈

- **React** + **TypeScript** - 现代化前端框架
- **Vite** - 快速构建工具
- **TanStack Router** - 类型安全的路由管理
- **Ant Design** - 企业级 UI 组件库
- **UnoCSS** - 原子化 CSS 引擎
- **Zustand** - 轻量级状态管理
- **ahooks** - 强大的 React Hooks 库，用于数据请求等
- **Socket.io Client** - 实时通信

### 后端技术栈

- **Node.js** + **TypeScript** - 服务端运行环境
- **NestJS** - 企业级后端框架
- **Prisma** - 现代化数据库 ORM
- **PostgreSQL** - 关系型数据库
- **JWT** - 用户认证
- **Socket.io** - 实时通信
- **Bull Queue** - 任务队列（邮件发送等）
- **React Email** - 邮件模板渲染
- **Nodemailer** - 邮件服务

### 基础设施

- **Docker** + **Docker Compose** - 容器化部署
- **pnpm** - 高效的包管理器
- **GitHub Actions** - CI/CD 自动化
- **nginx** - 前端静态文件服务

## 🚀 快速开始

### 环境要求

- Node.js 22+
- pnpm 8+
- Docker & Docker Compose
- PostgreSQL 15+

### 本地开发

1. **克隆仓库**

```bash
git clone https://github.com/English-Assistant/Study-Reminder.git
cd Study-Reminder
```

2. **配置环境变量**

```bash
# 复制 .env.example 并重命名为 .env
cp .env.example .env
# 编辑 .env 文件，至少需要配置数据库连接 (DATABASE_URL)
```

3. **安装依赖**

```bash
pnpm install
```

4. **运行数据库迁移 (首次运行或 schema 变更后)**

```bash
# 此命令会比较 Prisma schema 与数据库的差异，
# 生成新的迁移文件并将其应用到数据库。
pnpm --filter @y/interface exec prisma migrate dev
```

5. **启动开发服务**

```bash
# 在一个终端中启动前端开发服务器
pnpm --filter @y/review dev

# 在另一个终端中启动后端开发服务器
pnpm --filter @y/interface dev
```

### Docker 部署

1. **使用 Docker Compose 一键部署**

```bash
# 复制并编辑环境变量
cp docker/.env.example docker/.env
# 根据需要修改配置后启动
# 该命令会拉取或构建镜像，并自动运行数据库迁移后启动服务
docker-compose -f docker/docker-compose.yml --env-file docker/.env up -d
```

服务启动后访问：

- 前端应用：http://localhost:5173
- 后端 API：http://localhost:3001
- 数据库：localhost:5432

## 📖 API 文档

详细的 API 接口文档请参考：[packages/interface/README.md](packages/interface/README.md)

### 主要模块

| 模块         | 路径                | 描述                     |
| ------------ | ------------------- | ------------------------ |
| 认证模块     | `/auth`             | 用户登录、注册和设置管理 |
| 课程模块     | `/courses`          | 课程的增删改查操作       |
| 复习设置模块 | `/review-settings`  | 复习规则的配置和管理     |
| 学习记录模块 | `/study-records`    | 学习打卡记录的管理       |
| 计划复习模块 | `/upcoming-reviews` | 查询未来的复习计划       |

## 🛠️ 部署指南

### 生产环境部署

1. **构建 Docker 镜像**

```bash
# 构建所有服务镜像
pnpm run deploy

# 构建并推送到 Docker Hub
pnpm run deploy:push
```

2. **配置生产环境变量**

```bash
# 数据库配置
POSTGRES_USER=your_db_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=study_reminder_db

# JWT 密钥
JWT_SECRET=your_jwt_secret_key

# 邮件服务配置
MAIL_HOST=smtp.your-provider.com
MAIL_PORT=587
MAIL_USER=your_email@domain.com
MAIL_PASSWORD=your_email_password
MAIL_FROM_NAME="Study Reminder"
MAIL_FROM_ADDRESS=noreply@your-domain.com
```

3. **启动生产服务**

```bash
docker-compose -f docker/docker-compose.yml up -d
```

### 自动化部署

项目配置了 GitHub Actions 自动化部署：

- **自动构建**：推送到 main 分支时自动构建 Docker 镜像
- **版本管理**：使用 release-please 自动管理版本和变更日志
- **镜像推送**：自动推送到 Docker Hub

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 提交问题

- [报告 Bug](https://github.com/English-Assistant/Study-Reminder/issues/new?template=bug_report.md)
- [功能请求](https://github.com/English-Assistant/Study-Reminder/issues/new?template=feature_request.md)

### 开发贡献

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 代码规范

- 使用 TypeScript 进行类型安全开发
- 遵循 ESLint 代码规范
- 提交信息遵循 [Conventional Commits](https://conventionalcommits.org/) 规范

## 📜 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 📧 联系我们

- **邮箱**：[yangboses@gmail.com](mailto:yangboses@gmail.com)
- **GitHub Issues**：[问题反馈](https://github.com/English-Assistant/Study-Reminder/issues)

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

---

<div align="center">

**如果这个项目对您有帮助，请给我们一个 ⭐**

Made with ❤️ by [English-Assistant](https://github.com/English-Assistant)

</div>
