# Deploy Server

一个基于 TypeScript 和 Koa.js 构建的 Webhook 部署服务器，用于接收部署通知并自动执行部署脚本。

## 功能介绍

这是一个轻量级的部署服务器，主要用于：

- 接收来自 CI/CD 系统（如 GitHub Actions）的 Webhook 请求
- 验证请求的身份认证
- 自动执行部署脚本，支持指定镜像标签
- **支持传递额外参数**到部署脚本（JSON 格式）
- 提供部署状态反馈和中文日志输出

## 技术栈

- **Node.js** + **TypeScript**
- **Koa.js** - Web 框架
- **tsx** - TypeScript 运行时
- **ESLint** - 代码质量检查

## 安装和启动

### 安装依赖

```bash
cd packages/deploy-server
pnpm install
```

### 启动服务器

```bash
# 设置部署令牌（可选，默认为 'your-secret-token'）
export DEPLOY_TOKEN=your-actual-secret-token

# 启动服务器
pnpm run deploy
```

服务器将在 `http://localhost:4010` 启动。

### 开发模式

```bash
# 使用 tsx 直接运行 TypeScript
pnpm run deploy
```

## 生产环境部署

### 使用 PM2 管理（推荐）

在生产服务器上，推荐使用 PM2 来管理 deploy-server 进程，PM2 提供了进程守护、自动重启、日志管理等功能。

#### 安装 PM2

```bash
# 全局安装 PM2
npm install -g pm2
```

#### 创建 PM2 配置文件

在 `packages/deploy-server` 目录下创建 `ecosystem.config.js`：

```js
module.exports = {
  apps: [
    {
      name: 'deploy-server-app',
      script: 'src/index.ts',
      interpreter: './node_modules/.bin/tsx',
      args: '--env-file=.env',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 4010,
      },
      error_file: './logs/deploy-server-error.log',
      out_file: './logs/deploy-server-out.log',
      log_file: './logs/deploy-server-combined.log',
      time: true,
    },
  ],
};
```

#### 启动和管理服务

```bash
# 启动服务
pm2 start ecosystem.config.js --env production

# 查看服务状态
pm2 status

# 查看日志
pm2 logs deploy-server-app

# 重启服务
pm2 restart deploy-server-app

# 停止服务
pm2 stop deploy-server-app

# 删除服务
pm2 delete deploy-server-app

# 保存 PM2 配置（系统重启后自动恢复）
pm2 save
pm2 startup
```

#### PM2 监控

```bash
# 实时监控
pm2 monit

# 查看详细信息
pm2 show deploy-server-app
```

## API 接口

### POST /deploy

触发部署操作的主要接口。

#### 请求头

- `Authorization`: Bearer token 认证（必需）
  - 格式：`Bearer {DEPLOY_TOKEN}`

#### 请求体

```json
{
  "tag": "v1.0.0" // 可选，Docker 镜像标签，默认为 'latest'
}
```

#### 响应

- **成功 (200)**: `"Deployment started"`
- **未找到 (404)**: `"Not Found"` - 错误的请求路径或方法
- **未授权 (401)**: `"Unauthorized"` - 认证令牌无效

#### 示例请求

```bash
curl -X POST http://localhost:4010/deploy \
  -H "Authorization: Bearer your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{
    "tag": "v1.2.3",
  }'
```

## 环境变量

| 变量名         | 描述                            | 默认值              | 必需     |
| -------------- | ------------------------------- | ------------------- | -------- |
| `DEPLOY_TOKEN` | 用于验证 Webhook 请求的安全令牌 | `your-secret-token` | 推荐设置 |

## 部署脚本要求

服务器期望在同一目录下存在一个可执行的 `deploy.sh` 脚本，该脚本应该：

1. **第一个参数**：Docker 镜像标签（如 `latest`、`v1.0.0`）
2. 执行实际的部署操作（如拉取镜像、重启容器等）
3. 具有可执行权限

### deploy.sh 示例

```bash
#!/bin/bash
# deploy.sh

TAG=${1:-latest}

echo "开始部署..."

cd /path/to/xx

docker-compose up -d

echo "部署完成"
```

## 项目结构

```
packages/deploy-server/
├── src/
│   └── index.ts          # 主服务器代码
├── package.json          # 项目配置和依赖
├── tsconfig.json         # TypeScript 配置
├── eslint.config.mjs     # ESLint 配置
├── deploy.sh             # 部署脚本（需要自行创建）
└── README.md             # 项目文档
```
