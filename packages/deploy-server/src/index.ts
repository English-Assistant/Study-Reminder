// deploy-server.js
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import { exec } from 'child_process';

const app = new Koa();
app.use(bodyParser());

const DEPLOY_TOKEN = process.env.DEPLOY_TOKEN || 'your-secret-token';

app.use(async (ctx) => {
  if (ctx.method !== 'POST' || ctx.path !== '/deploy') {
    ctx.status = 404;
    ctx.body = 'Not Found';
    return;
  }

  const auth = ctx.headers['authorization'];
  if (!auth || auth !== `Bearer ${DEPLOY_TOKEN}`) {
    ctx.status = 401;
    ctx.body = 'Unauthorized';
    return;
  }

  const { tag = 'latest', ...other } = ctx.request.body as {
    tag?: string;
    [key: string]: unknown;
  };

  console.info(`body:`, ctx.request.body);

  ctx.body = 'Deployment started';

  // 将其他参数序列化为JSON字符串传递给脚本
  const otherParamsJson = JSON.stringify(other);

  exec(`./deploy.sh ${tag} '${otherParamsJson}'`, (err, stdout, stderr) => {
    if (err) {
      console.error(`部署错误: ${stderr}`);
    } else {
      console.log(`部署输出: ${stdout}`);
    }
  });
});

const PORT = 4010;
app.listen(PORT, () => {
  console.log(`🚀 Webhook服务器运行在 http://localhost:${PORT}/deploy`);
});
