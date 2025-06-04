# Changelog

## [1.3.0](https://github.com/English-Assistant/review/compare/v1.2.0...v1.3.0) (2025-06-04)


### Features

* **deploy-server:** 添加部署服务器功能，支持接收 Webhook 请求并执行部署脚本，包含环境变量配置和 ESLint 规则 ([4b1b36c](https://github.com/English-Assistant/review/commit/4b1b36cedb5b30100ed90de8211072e87497c541))

## [1.2.0](https://github.com/English-Assistant/review/compare/v1.1.0...v1.2.0) (2025-06-03)


### Features

* 更新镜像标签生成逻辑，确保版本号处理一致性，优化部署输出信息 ([e1130fd](https://github.com/English-Assistant/review/commit/e1130fd848c26477f8d4633b271ade2f338aa5da))

## [1.1.0](https://github.com/English-Assistant/review/compare/v1.0.0...v1.1.0) (2025-06-03)


### Features

* 更新 GitHub Actions 工作流，移除 package-name 配置，优化镜像标签生成逻辑，确保版本号处理更为严谨 ([ca1fbbb](https://github.com/English-Assistant/review/commit/ca1fbbbce7247760db1a04cf0b8e92933c4311ff))

## 1.0.0 (2025-06-03)


### Features

* 删除 AddCourseModal 组件，新增 EntryFormModal 组件以支持手动复习条目的创建和编辑，重构课程日历功能以适应新组件，优化用户体验 ([ae5f897](https://github.com/English-Assistant/review/commit/ae5f89794d76404255cb003320c0a891255707bd))
* 新增 Docker 支持，添加 Dockerfile 和 docker-compose 配置，创建 .dockerignore 文件，更新 LICENSE 和 package.json，添加部署脚本以支持全栈应用的构建和部署 ([bacb381](https://github.com/English-Assistant/review/commit/bacb381636bb180112e8574f8c6240cf8193b7a9))
* 更新 GitHub Actions 工作流，新增对 issues、repository-projects 和 actions 的写权限，以增强自动化发布功能 ([5c46f48](https://github.com/English-Assistant/review/commit/5c46f48e6536a90476ddd4f20fc7cf97812e7d97))
* 更新 GitHub Actions 工作流，简化 Docker 部署条件，新增 Docker Hub 凭据检查，支持仅构建镜像而不推送，优化部署结果输出 ([1f367a7](https://github.com/English-Assistant/review/commit/1f367a785de8e21f09f0ccf1b11a3cf01f5fc0d3))
* 更新 package.json 以添加 @y/interface 依赖，新增常量文件，重构路由以支持学习记录和课程管理功能，添加设置模块以支持用户配置更新，优化用户体验 ([f2a3c64](https://github.com/English-Assistant/review/commit/f2a3c643915fd42f833c520ab41fd538f17b2dfd))
* 更新 pnpm-lock.yaml，修改 warehouse.mdc 描述，重命名登录路由，添加课程管理和复习提醒功能，删除不再使用的学习活动和用户课程进度模块，优化复习设置模块，添加通知模块和相关服务 ([920b9a4](https://github.com/English-Assistant/review/commit/920b9a430b7c45b49040505ffc621415c1a2cf5b))
* 更新 pnpm-lock.yaml，删除不再使用的手动复习条目模块，添加学习记录和即将到来的复习模块，重构复习设置功能，优化用户体验 ([e8f5ed8](https://github.com/English-Assistant/review/commit/e8f5ed86b040621eb9f79ed96c96d8bb1143b0ba))
* 更新 pnpm-lock.yaml，添加 clsx 依赖，修改 lodash 类型定义，优化学习记录和复习项的展示，重构相关组件以提升用户体验 ([194e8b6](https://github.com/English-Assistant/review/commit/194e8b64302c94dfb1c8858d141da6df3f00cf51))
* 更新 pnpm-lock.yaml，添加 socket.io-client 依赖，新增 useSocket 钩子以支持 WebSocket 连接和通知功能，重构相关组件以提升用户体验，新增邮件发送功能以支持复习提醒 ([c0144fb](https://github.com/English-Assistant/review/commit/c0144fb7cff9acd82ce1ec7d02ad94f1c2dc9a23))
* 更新 README 文档，添加英语复习应用后端接口的详细说明和 Prisma 数据模型注释 ([c314225](https://github.com/English-Assistant/review/commit/c314225f33b0c2bf75e8136537e6e1d435af4f0c))
* 根据设计图对其静态页面 ([8c2e61d](https://github.com/English-Assistant/review/commit/8c2e61d04f7560aa205742c2206dfcf2be0105a2))
* 添加 EditorConfig 和 gitattributes 文件，更新 Vite 配置以支持 API 代理，重构登录和课程管理功能，优化用户体验 ([e142717](https://github.com/English-Assistant/review/commit/e14271725e399a739935f96fd58fff467a209d1f))
* 添加多个模块和组件，更新配置文件，包含用户、课程、学习活动等功能 ([a39d03e](https://github.com/English-Assistant/review/commit/a39d03ef8d62b773d772f77f5459c859431be00e))
* 重构仪表盘功能，删除旧的仪表盘组件，新增基于 API 的仪表盘组件，优化学习记录和复习项展示，提升用户体验 ([3362ece](https://github.com/English-Assistant/review/commit/3362ece6d69bbfe4ed39d8f2fedcbb27cf3aca99))
* 重构学习记录相关功能，新增按月份获取学习记录及复习项的接口，更新相关组件以支持新功能，优化用户体验 ([fe3ec80](https://github.com/English-Assistant/review/commit/fe3ec80062aabc26fbd4cf74b58782eeccd47243))
