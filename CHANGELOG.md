# Changelog

## [1.12.0](https://github.com/English-Assistant/Study-Reminder/compare/v1.11.0...v1.12.0) (2025-06-12)


### Features

* 在核心布局中添加“发送邮件”和“问题/意见反馈”链接，优化用户联系渠道 ([7278f6c](https://github.com/English-Assistant/Study-Reminder/commit/7278f6c393c02c86f5701f0c9d39fa6adf7b7c1b))


### Bug Fixes

* 修正待复习项目的结束日期计算逻辑，确保获取的日期范围正确 ([dbe8620](https://github.com/English-Assistant/Study-Reminder/commit/dbe862052b4c8f8698e8580c530465e70a8146d5)), closes [#34](https://github.com/English-Assistant/Study-Reminder/issues/34)

## [1.11.0](https://github.com/English-Assistant/Study-Reminder/compare/v1.10.0...v1.11.0) (2025-06-11)


### Features

* 优化表单提交逻辑，使用async/await处理异步操作；更新复习规则设置，使用时间戳替代UUID；调整学习记录服务，简化查询逻辑 ([706d126](https://github.com/English-Assistant/Study-Reminder/commit/706d126ff53b7fa92789ed5e515aade972958027))

## [1.10.0](https://github.com/English-Assistant/Study-Reminder/compare/v1.9.0...v1.10.0) (2025-06-11)


### Features

* 添加拖拽排序功能到复习规则设置，更新相关依赖和文档 ([13db9db](https://github.com/English-Assistant/Study-Reminder/commit/13db9db59abf29facf20eeef22a31bb24f2f4a7c))
* 添加预览图片文件 ([ed13447](https://github.com/English-Assistant/Study-Reminder/commit/ed13447e197cbae43ce12602db337e9a3e6eed6a))

## [1.9.0](https://github.com/English-Assistant/Study-Reminder/compare/v1.8.0...v1.9.0) (2025-06-08)


### Features

* 更新复习提醒邮件和通知内容，包含课程名称以增强信息清晰度 ([ab9db72](https://github.com/English-Assistant/Study-Reminder/commit/ab9db7273b9a46fe70e09def8977fa1f213e7efa))

## [1.8.0](https://github.com/English-Assistant/Study-Reminder/compare/v1.7.1...v1.8.0) (2025-06-08)


### Features

* 添加uuid依赖并在AuthService中使用，更新相关文件以支持新的功能 ([9383634](https://github.com/English-Assistant/Study-Reminder/commit/938363423f9f1dd6d0cbf7c1eb32a15762b83dbf))

## [1.7.1](https://github.com/English-Assistant/Study-Reminder/compare/v1.7.0...v1.7.1) (2025-06-07)


### Bug Fixes

* 修复docker构建找不到对应依赖文件 ([5bfb945](https://github.com/English-Assistant/Study-Reminder/commit/5bfb94563b099a61ea758600f408cc4e96720941))

## [1.7.0](https://github.com/English-Assistant/Study-Reminder/compare/v1.6.0...v1.7.0) (2025-06-07)


### Features

* 添加用户注销功能，支持发送验证码确认注销，更新相关API和前端设置界面 ([5ec81c2](https://github.com/English-Assistant/Study-Reminder/commit/5ec81c252d5a30485514197745eaf9c365d1c843))

## [1.6.0](https://github.com/English-Assistant/Study-Reminder/compare/v1.5.0...v1.6.0) (2025-06-06)


### Features

* 添加学习记录和复习计划的可视化组件，更新相关依赖，优化仪表盘布局 ([b98f26f](https://github.com/English-Assistant/Study-Reminder/commit/b98f26f61b389cd935bc52a75a45937cd09b40f4))

## [1.5.0](https://github.com/English-Assistant/Study-Reminder/compare/v1.4.0...v1.5.0) (2025-06-05)


### Features

* 手动触发更新 ([cfdba53](https://github.com/English-Assistant/Study-Reminder/commit/cfdba534cc1d6a42d7682a826edcb29747b3e091))

## [1.4.0](https://github.com/English-Assistant/Study-Reminder/compare/v1.3.5...v1.4.0) (2025-06-05)


### Features

* 新增忘记密码，拆分登录/注册页面 ([2c239d4](https://github.com/English-Assistant/Study-Reminder/commit/2c239d495172bafb77d269f3730af9aef24a247a))

## [1.3.5](https://github.com/English-Assistant/Study-Reminder/compare/v1.3.4...v1.3.5) (2025-06-05)


### Bug Fixes

* 修复月份丢失数据以及拓展日历前后展示的范围 ([5899b8a](https://github.com/English-Assistant/Study-Reminder/commit/5899b8a1a7f68039cb179108d75bbd3f212d0ab6)), closes [#16](https://github.com/English-Assistant/Study-Reminder/issues/16)


### Performance Improvements

* 拆分日历组件，对展示高度、展示信息以及弹窗部分优化 ([7a1476c](https://github.com/English-Assistant/Study-Reminder/commit/7a1476c8b775db54d7fc8124dc5907f4584fbf05))

## [1.3.4](https://github.com/English-Assistant/Study-Reminder/compare/v1.3.3...v1.3.4) (2025-06-05)


### Performance Improvements

* 拆分模块和优化打包图片尺寸 ([9523fb5](https://github.com/English-Assistant/Study-Reminder/commit/9523fb53505c5abaee732b7116cacc3dde16ff3a)), closes [#10](https://github.com/English-Assistant/Study-Reminder/issues/10)

## [1.3.3](https://github.com/English-Assistant/Study-Reminder/compare/v1.3.2...v1.3.3) (2025-06-04)


### Bug Fixes

* 修复部署错误，删除冗余文件,补全相关文档 ([4e933ed](https://github.com/English-Assistant/Study-Reminder/commit/4e933ed8a7ff3be3e7c260bb8a04524b100a2131))

## [1.3.2](https://github.com/English-Assistant/Study-Reminder/compare/v1.3.1...v1.3.2) (2025-06-04)


### Bug Fixes

* 修复 pnpm 配置不匹配问题，将 onlyBuiltDependencies 移至根配置 ([5254e42](https://github.com/English-Assistant/Study-Reminder/commit/5254e423f8406113a067a781a942e3ca03832ee0))

## [1.3.1](https://github.com/English-Assistant/review/compare/v1.3.0...v1.3.1) (2025-06-04)


### Bug Fixes

* 更新 useSocket 钩子以使用 App.notification，调整样式和逻辑，优化课程记录组件，添加工具提示，更新 Docker 启动脚本 ([3f3213c](https://github.com/English-Assistant/review/commit/3f3213cbf27dc12488b3985e4071232ec4bc148d))

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
