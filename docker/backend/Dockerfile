# STAGE 1: 构建 NestJS 应用
FROM node:22.14-alpine AS builder

# 设置 pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# 复制依赖相关文件
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY package.json ./
COPY packages/interface/package.json ./packages/interface/

# 安装依赖
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --filter @y/interface... --frozen-lockfile

# 复制源代码
COPY packages/interface/ ./packages/interface/

# 生成 Prisma 客户端并构建应用
RUN pnpm --filter @y/interface exec prisma generate && \
    pnpm --filter @y/interface build

# STAGE 2: 生产环境
FROM node:22.14-alpine

# 设置 pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# 复制依赖文件并安装生产依赖
COPY --chown=node:node pnpm-workspace.yaml pnpm-lock.yaml ./
COPY --chown=node:node package.json ./
COPY --chown=node:node packages/interface/package.json ./packages/interface/

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --filter @y/interface... --prod --frozen-lockfile

# 复制构建产物和必要文件
COPY --chown=node:node --from=builder /app/packages/interface/dist ./packages/interface/dist
COPY --chown=node:node --from=builder /app/packages/interface/prisma ./packages/interface/prisma
COPY --chown=node:node --from=builder /app/packages/interface/emails ./packages/interface/emails

# ⚠️ 重新生成 Prisma Client
RUN pnpm --filter @y/interface exec prisma generate

# 复制 entrypoint 脚本并赋予执行权限
COPY --chown=node:node docker/backend/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# 切换到非 root 用户
USER node

# 设置工作目录到应用目录
WORKDIR /app/packages/interface

ENV NODE_ENV=production
EXPOSE 3001

# 将 entrypoint 脚本设置为容器的入口点
ENTRYPOINT ["/app/entrypoint.sh"]
