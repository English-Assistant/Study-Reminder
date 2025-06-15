# Interface 服务架构总览

> 本文档仅针对 `packages/interface`（后端 API）模块，描述其内部模块划分、数据流与调度流程，方便后续 AI/新人快速理解整体运作。

---

## 1. 模块概览

| 模块               | 主要职责                                            |
| ------------------ | --------------------------------------------------- |
| `auth`             | JWT 认证、注册登录                                  |
| `courses`          | 课程 CRUD                                           |
| `study-records`    | 学习打卡记录 + 月视图复习计划计算                   |
| `review-settings`  | 复习规则维护（默认 1h~90d）                         |
| `upcoming-reviews` | 未来 N 天待复习列表（日历）                         |
| `planner`          | `InstantPlanner` & `DailyPlanner` 生成复习计划      |
| `notifications`    | 邮件 / WebSocket 推送，支持批量合并                 |
| `queue`            | BullMQ 队列常量定义                                 |
| `redis`            | Redis 客户端封装（缓存 / 计划存储）                 |
| `prisma`           | 数据访问层 + 变更监听中间件 `PrismaWatchMiddleware` |
| `mail`             | Nest Mailer + React Email 模板发送                  |
| `review-logic`     | 纯函数化复习时间计算服务                            |
| `common`           | 公共工具 & 常量                                     |

---

## 2. 核心数据流

### 2.1 学习记录创建 → 即时计划

```
POST /study-records
       │
       ▼
Prisma 创建 StudyRecord
       │
PrismaWatchMiddleware 捕获 → InstantPlanner.refreshUserPlan(userId)
```

### 2.2 InstantPlanner (增量 26h)

1. 读取用户 `studyRecords` + `reviewRules`。
2. 计算未来 26 小时内的 **学术复习时间** `reviewTime`。
3. 根据 `StudyTimeWindow` 仅调整 **发送时间** `sendTime`。
4. 写入：
   - Redis ZSET `upcoming:{userId}` → member 为 JSON，score 为 `reviewTime`。
   - BullMQ Job（按 5 分钟滑动窗口合并）→ data `{ userId, items[{ itemName, courseName, time }] }`。

### 2.3 DailyPlanner (全量日)

Cron 每日 `00:10` 重新计算次日 24h 计划，覆盖 Redis & 队列，逻辑与 InstantPlanner 类似但范围更大。

### 2.4 UpcomingReviewsService (接口实时兜底)

```
GET /upcoming-reviews?withinDays=7
          │
          ├─ 读 Redis ZSET（命中 → 反序列化返回）
          └─ 失效 → 实时计算 (ReviewLogicService) → 分天/课程分组返回
```

> 复习时间 **不** 受时间窗口影响，仅取 `reviewTime`。

### 2.5 Notifications Pipeline

```
BullMQ Worker (ReviewReminderProcessor)
       │  消费 Job
       ▼
NotificationsService.sendBulkReminder()
       │
       ├─ MailService.send*(ReactEmail 模板)
       └─ NotificationsGateway (WebSocket)
```

- 单条任务 → 单封邮件模板。
- 多条任务 → 合并邮件/通知，`ReviewItem.time` 为原始复习 HH:mm。

---

## 3. 关键数据结构

- **Redis**

  - `upcoming:{userId}` (ZSET)
    - score: `reviewTime` ms
    - member: `{ studyRecordId, textTitle, courseId, expectedReviewAt, ruleId }`

- **BullMQ Job** `REVIEW_REMINDER_QUEUE`
  ```ts
  interface ReviewItem {
    itemName: string;
    courseName: string;
    time: string;
  }
  interface Data {
    userId: string;
    items: ReviewItem[];
  }
  ```

---

## 4. 时间语义说明

| 概念         | 含义                          | 是否受 StudyTimeWindow 影响 |
| ------------ | ----------------------------- | --------------------------- |
| `reviewTime` | 学术复习时间，用于统计 & 日历 | 否                          |
| `sendTime`   | 实际通知时间（调整后）        | 是                          |

---

## 5. 主要 API

| Method | Path                                   | 描述                      |
| ------ | -------------------------------------- | ------------------------- |
| POST   | `/study-records`                       | 打卡一条学习记录          |
| GET    | `/study-records/by-month?year=&month=` | 月维度记录 + 当月复习列表 |
| GET    | `/upcoming-reviews?withinDays=`        | 未来 N 天复习日程         |

---

## 6. 事件序列示例

```
用户打卡 → PrismaWatchMiddleware → InstantPlanner → Redis + BullMQ
                          │                                │
                          │                                └─ X 分钟后 Worker 发送邮件/通知
                          └─ 前端日历读取 /upcoming-reviews → 显示今日/本周复习任务
```

---

## 7. 扩展点

- **算法**：可在 `review-logic.service` 中实现更复杂的间隔算法（如间隔递增）。
- **模板**：React Email 组件位于 `packages/interface/emails/`，支持 MDX/组件化。
- **缓存**：目前 Redis 缓存 8 天，可按需缩放。

---

MIT © Study Reminder
