# STAGE 1: 构建 Vite 应用
FROM node:22.14-alpine AS builder

# 设置 pnpm
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# 复制依赖相关文件
COPY pnpm-workspace.yaml pnpm-lock.yaml ./
COPY package.json ./
COPY packages/app/package.json ./packages/app/
COPY packages/interface ./packages/interface/

# 安装依赖
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --filter review... --frozen-lockfile

# 复制源代码并构建
COPY packages/app/ ./packages/app/
RUN pnpm --filter review build

# STAGE 2: 使用 Nginx 提供服务
FROM nginx:1.25-alpine

# 清理默认文件
RUN rm -rf /usr/share/nginx/html/* && \
    rm /etc/nginx/conf.d/default.conf

# 复制nginx配置模板
COPY docker/frontend/nginx.conf /etc/nginx/templates/default.conf.template

# 复制构建产物
COPY --from=builder /app/packages/app/dist /usr/share/nginx/html

EXPOSE 80
