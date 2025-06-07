#!/bin/sh
# 遇到错误时终止执行
set -e

# 执行数据库迁移
echo "正在执行数据库迁移..."
npx prisma migrate deploy

# 启动应用
echo "正在启动应用..."
node dist/src/main
