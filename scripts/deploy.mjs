#!/usr/bin/env zx

/**
 * 全栈应用 Docker 镜像构建和部署脚本
 *
 * 功能：
 * 1. 读取根目录 package.json 的名称和版本信息
 * 2. 同时构建前端和后端 Docker 镜像
 * 3. 支持推送到镜像仓库
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// 设置脚本输出详细信息
$.verbose = true;

// 颜色输出函数
const colors = {
  green: (text) => chalk.green(text),
  blue: (text) => chalk.blue(text),
  yellow: (text) => chalk.yellow(text),
  red: (text) => chalk.red(text),
  cyan: (text) => chalk.cyan(text),
  magenta: (text) => chalk.magenta(text),
};

// 读取根目录的 package.json
function getPackageInfo() {
  try {
    const packagePath = join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

    return {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description || '',
    };
  } catch (error) {
    console.error(
      colors.red('❌ 读取根目录 package.json 失败:'),
      error.message,
    );
    process.exit(1);
  }
}

// 生成镜像标签
function generateImageTags(serviceName, version, username = 'boses') {
  // 如果有 GITHUB_REF_NAME 环境变量（来自 GitHub Actions），使用它作为版本
  const releaseTag = process.env.GITHUB_REF_NAME || process.env.RELEASE_TAG;
  const effectiveVersion = releaseTag ? releaseTag.replace('v', '') : version;

  const baseImageName = `${username}/${serviceName}`;

  const tags = {
    latest: baseImageName + ':latest',
    version: baseImageName + ':' + effectiveVersion,
    timestamp:
      baseImageName +
      ':' +
      new Date().toISOString().slice(0, 19).replace(/:/g, '-'),
  };

  // 如果是从 release 触发的，也添加原始 tag
  if (releaseTag) {
    tags.release = baseImageName + ':' + releaseTag;
  }

  return tags;
}

// 构建单个 Docker 镜像
async function buildDockerImage(serviceName, dockerfile, tags, packageInfo) {
  console.log(colors.blue(`🐳 开始构建 ${serviceName} Docker 镜像...`));
  console.log(colors.cyan(`📦 项目名称: ${packageInfo.name}`));
  console.log(colors.cyan(`📝 版本: ${packageInfo.version}`));
  console.log(colors.cyan(`🏷️  服务: ${serviceName}`));

  const context = '.';

  // 检查 Dockerfile 是否存在
  if (!existsSync(dockerfile)) {
    console.error(colors.red(`❌ Dockerfile 不存在: ${dockerfile}`));
    process.exit(1);
  }

  // 构建镜像（使用多个标签）
  const tagArgs = Object.values(tags)
    .map((tag) => ['-t', tag])
    .flat();

  try {
    await $`docker build ${tagArgs} -f ${dockerfile} ${context}`;

    console.log(colors.green(`✅ ${serviceName} 镜像构建成功!`));
    console.log(colors.green('🏷️  镜像标签:'));
    Object.entries(tags).forEach(([key, tag]) => {
      console.log(colors.green(`   ${key}: ${tag}`));
    });

    return tags;
  } catch (error) {
    console.error(colors.red(`❌ ${serviceName} 镜像构建失败:`), error.message);
    process.exit(1);
  }
}

// 推送镜像到仓库
async function pushImages(serviceName, tags, registry = '') {
  if (!registry) {
    console.log(
      colors.yellow(`⚠️  ${serviceName}: 未指定镜像仓库，跳过推送步骤`),
    );
    return;
  }

  console.log(colors.blue(`📤 开始推送 ${serviceName} 镜像到仓库...`));

  // 如果指定了registry但不是boses，需要重新打标签
  let finalTags = tags;
  if (registry && registry !== 'boses') {
    finalTags = {};
    for (const [key, tag] of Object.entries(tags)) {
      // 替换用户名部分
      const newTag = tag.replace(/^boses\//, `${registry}/`);
      finalTags[key] = newTag;

      // 为镜像添加新的仓库标签
      await $`docker tag ${tag} ${newTag}`;
    }
  }

  try {
    // 推送所有标签
    for (const tag of Object.values(finalTags)) {
      console.log(colors.cyan(`📤 推送: ${tag}`));
      await $`docker push ${tag}`;
    }

    console.log(colors.green(`✅ ${serviceName} 镜像推送成功!`));
  } catch (error) {
    console.error(colors.red(`❌ ${serviceName} 镜像推送失败:`), error.message);
    process.exit(1);
  }
}

// 清理旧镜像
async function cleanupOldImages(serviceName, username = 'boses') {
  console.log(colors.blue(`🧹 清理旧的 ${serviceName} Docker 镜像...`));

  try {
    const imageName = `${username}/${serviceName}`;
    const images =
      await $`docker images ${imageName} --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | tail -n +2`;

    if (images.stdout.trim()) {
      console.log(colors.cyan(`📋 ${serviceName} 现有镜像:`));
      console.log(images.stdout);
    }
  } catch (error) {
    console.log(
      colors.yellow(`⚠️  清理 ${serviceName} 镜像时出现警告:`),
      error.message,
    );
  }
}

// 显示使用帮助
function showHelp() {
  console.log(`
${colors.blue('全栈应用 Docker 部署脚本')}

${colors.cyan('用法:')}
  node scripts/deploy.mjs [选项]

${colors.cyan('选项:')}
  --registry <registry>    指定 Docker 镜像仓库用户名 (默认: boses)
  --push                   构建后推送镜像到仓库
  --cleanup                构建后清理旧镜像
  --no-cache              不使用缓存构建镜像
  --frontend-only         仅构建前端镜像
  --backend-only          仅构建后端镜像
  --help                   显示帮助信息

${colors.cyan('示例:')}
  # 构建前端和后端镜像
  node scripts/deploy.mjs

  # 构建并推送到 boses 仓库
  node scripts/deploy.mjs --push

  # 构建并推送到其他仓库
  node scripts/deploy.mjs --registry your-username --push

  # 仅构建前端
  node scripts/deploy.mjs --frontend-only

  # 不使用缓存构建并清理旧镜像
  node scripts/deploy.mjs --no-cache --cleanup --push
`);
}

// 主函数
async function main() {
  console.log(colors.magenta('🚀 全栈应用 Docker 部署脚本启动...\n'));

  // 解析命令行参数
  const args = process.argv.slice(2);
  const options = {
    registry: args.includes('--registry')
      ? args[args.indexOf('--registry') + 1]
      : 'boses',
    push: args.includes('--push'),
    cleanup: args.includes('--cleanup'),
    noCache: args.includes('--no-cache'),
    frontendOnly: args.includes('--frontend-only'),
    backendOnly: args.includes('--backend-only'),
    help: args.includes('--help'),
  };

  if (options.help) {
    showHelp();
    return;
  }

  try {
    // 1. 读取包信息
    const packageInfo = getPackageInfo();

    const services = [];

    // 2. 根据选项确定要构建的服务
    if (!options.backendOnly) {
      services.push({
        name: 'study-reminder-front',
        dockerfile: 'docker/frontend/Dockerfile',
      });
    }

    if (!options.frontendOnly) {
      services.push({
        name: 'study-reminder-backend',
        dockerfile: 'docker/backend/Dockerfile',
      });
    }

    const allTags = {};

    // 3. 构建所有服务的镜像
    for (const service of services) {
      const tags = generateImageTags(
        service.name,
        packageInfo.version,
        options.registry,
      );
      allTags[service.name] = tags;

      // 添加 --no-cache 参数到构建命令
      if (options.noCache) {
        const originalBuild = $;
        $ = function (...args) {
          if (args[0] && args[0][0] && args[0][0].includes('docker build')) {
            args[0][0] = args[0][0].replace(
              'docker build',
              'docker build --no-cache',
            );
          }
          return originalBuild(...args);
        };
      }

      await buildDockerImage(
        service.name,
        service.dockerfile,
        tags,
        packageInfo,
      );
    }

    // 4. 推送镜像（如果指定了推送选项）
    if (options.push) {
      for (const service of services) {
        await pushImages(service.name, allTags[service.name], options.registry);
      }
    }

    // 5. 清理旧镜像（如果指定了清理选项）
    if (options.cleanup) {
      for (const service of services) {
        await cleanupOldImages(service.name, options.registry);
      }
    }

    console.log(colors.green('\n🎉 部署脚本执行完成!'));

    // 显示后续操作提示
    console.log(colors.cyan('\n💡 生成的镜像:'));
    for (const service of services) {
      const tags = allTags[service.name];
      console.log(colors.cyan(`📦 ${service.name}:`));
      Object.entries(tags).forEach(([key, tag]) => {
        console.log(colors.cyan(`   ${key}: ${tag}`));
      });
    }

    console.log(colors.cyan('\n💡 后续操作:'));
    if (services.find((s) => s.name === 'front-end-web')) {
      console.log(
        `   docker run -p 80:80 ${options.registry}/front-end-web:${packageInfo.version}`,
      );
    }
    if (services.find((s) => s.name === 'back-end-api')) {
      console.log(
        `   docker run -p 3001:3001 ${options.registry}/back-end-api:${packageInfo.version}`,
      );
    }
    console.log(`   cd docker && docker-compose up -d`);
  } catch (error) {
    console.error(colors.red('\n❌ 部署失败:'), error.message);
    process.exit(1);
  }
}

// 运行主函数
main().catch(console.error);
