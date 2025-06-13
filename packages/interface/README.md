# Study Reminder · Backend API (NestJS)

> 负责业务逻辑、数据存储、定时与消息推送的核心服务

---

## ✨ 特色

1. **Prisma + PostgreSQL**  类型安全的 ORM 与迁移
2. **BullMQ + Redis**  延时任务 / 实时通知调度
3. **Prisma Middleware**  监听打卡&规则变更，秒级刷新任务
4. **Nest Schedule**  每日 `00:10` 全量 Planner，性能友好
5. **Socket.io & Mailer**  站内 WebSocket 与邮件双通道提醒

---

## ⚙️ 技术栈

| 类别     | 依赖                     |
| -------- | ------------------------ |
| 核心框架 | NestJS 11 · TypeScript   |
| 数据库   | PostgreSQL 15 · Prisma 6 |
| 消息队列 | BullMQ 5 · Redis 7       |
| 认证     | JWT                      |
| 邮件     | Nodemailer + React Email |

---

## 🏗️ 模块

| 路径               | 说明                                             |
| ------------------ | ------------------------------------------------ |
| `auth`             | 注册 / 登录 / JWT 验签                           |
| `courses`          | 课程 CRUD                                        |
| `study-records`    | 学习打卡、统计接口                               |
| `review-settings`  | 复习规则管理                                     |
| `upcoming-reviews` | 未来 7 天待复习列表（Redis 缓存）                |
| `notifications`    | 邮件 + WebSocket 推送；BullMQ Worker             |
| `planner`          | `DailyPlanner` (00:10) + `InstantPlanner` (实时) |

---

## 🚀 快速启动

```bash
# 1. 安装依赖
pnpm install

# 2. 复制并编辑环境变量
cp docker/.env.example docker/.env
vi docker/.env   # 修改 DATABASE_URL / REDIS_URL / SMTP ...

# 3. 本地数据库迁移
pnpm exec prisma migrate dev

# 4. 开发模式
pnpm start:dev
```

> 建议使用 **Docker Compose** 一键启动（Postgres + Redis + 后端）。详见根目录 `docker/`。

---

## 🔑 关键环境变量

| 键                            | 示例值                                                   | 作用          |
| ----------------------------- | -------------------------------------------------------- | ------------- |
| `DATABASE_URL`                | `postgresql://user:pass@localhost:5432/db?schema=public` | Prisma 连接串 |
| `REDIS_URL`                   | `redis://redis:6379`                                     | BullMQ / 缓存 |
| `JWT_SECRET`                  | `...`                                                    | 令牌签名      |
| `MAIL_HOST`                   | `smtp.xxx.com`                                           | SMTP 服务器   |
| `MAIL_PORT`                   | `465`                                                    | SMTP 端口     |
| `MAIL_SECURE`                 | `true`                                                   | SSL           |
| `MAIL_USER` / `MAIL_PASSWORD` | -                                                        | SMTP 账号     |
| `MAIL_FROM_*`                 | -                                                        | 邮件显示信息  |

---

## 📜 常用脚本

| 命令                 | 说明           |
| -------------------- | -------------- |
| `pnpm prisma studio` | 在线浏览数据库 |
| `pnpm test`          | 单元测试       |
| `pnpm build`         | 编译生产包     |

---

## 📝 任务调度流程

1. **InstantPlanner** 在复习规则或学习记录变化时，秒速计算未来 26h 任务 → 写 Redis + BullMQ。
2. **DailyPlanner** 每天 00:10 全量重算下一日任务。
3. **ReviewReminderProcessor** (Worker) 消费队列，到期即邮件 + WebSocket 推送。

> 复习列表接口首先尝试读取 Redis，若缓存失效则实时计算并回填。

---

MIT © Study Reminder
