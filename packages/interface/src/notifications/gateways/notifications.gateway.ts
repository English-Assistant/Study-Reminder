import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService, UserWithoutPassword } from '../../users/users.service';

interface AuthenticatedSocket extends Socket {
  user: UserWithoutPassword;
}

@WebSocketGateway({
  cors: true,
  // namespace: '/notifications', // Consider using a namespace
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('NotificationsGateway');

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  handleConnection(client: AuthenticatedSocket) {
    const token = client.handshake.auth.token || client.handshake.query.token;
    this.logger.log(
      `尝试连接客户端 ${client.id}, token状态: ${token ? '存在' : '不存在'}`,
    );

    if (!token) {
      this.logger.warn(`客户端 ${client.id} 连接被拒绝: 未提供token`);
      client.emit('error', '认证错误: 未提供token');
      client.disconnect(true);
      return;
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      this.logger.log(`JWT_SECRET状态: ${secret ? '已配置' : '未配置'}`);

      if (!secret) {
        this.logger.error('未配置JWT_SECRET。无法认证WebSocket连接。');
        throw new Error('服务器JWT配置错误');
      }

      this.logger.log(`正在验证token: ${token.substring(0, 10)}...`);

      const payload: { sub: string; username: string } = this.jwtService.verify(
        token as string,
        { secret },
      );

      this.logger.log(
        `Token验证成功，用户: ${payload.username}, ID: ${payload.sub}`,
      );

      if (!payload || !payload.sub) {
        throw new UnauthorizedException('无效的token载荷');
      }

      this.verifyUserAndSetupSocket(client, payload);
    } catch (error) {
      this.logger.error(
        `客户端 ${client.id} 认证失败: ${error.message}`,
        error.stack,
      );
      client.emit('error', `认证错误: ${error.message || '无效token'}`);
      client.disconnect(true);
    }
  }

  async verifyUserAndSetupSocket(
    client: AuthenticatedSocket,
    payload: { sub: string; username: string },
  ) {
    try {
      const user = await this.usersService.findOneById(payload.sub);
      if (!user) {
        this.logger.warn(
          `用户 ID ${payload.sub} 未找到 (来自 Token 用户名: ${payload.username})。`,
        );
        throw new UnauthorizedException('用户不存在或已被禁用。');
      }
      client.user = user;
      client.join(user.id);
      this.logger.log(
        `客户端 ${client.id} (用户 ${user.id} - ${user.username}) 已连接并加入房间 ${user.id}。`,
      );
    } catch (error) {
      this.logger.warn(
        `客户端 ${client.id} 在用户验证/Socket设置时失败: ${error.message}`,
      );
      client.emit('error', `认证错误: ${error.message || '无法验证用户'}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    if (client.user && client.user.id) {
      client.leave(client.user.id);
      this.logger.log(
        `客户端 ${client.id} (用户 ${client.user.id} - ${client.user.username}) 已断开连接并离开房间 ${client.user.id}。`,
      );
    } else {
      this.logger.log(`客户端 ${client.id} 已断开连接 (未完成完整认证)。`);
    }
  }

  @SubscribeMessage('events')
  handleMessage(
    @MessageBody() data: string,
    @ConnectedSocket() client: AuthenticatedSocket,
  ): string {
    const userId = client.user
      ? `${client.user.id} - ${client.user.username}`
      : '未知用户';
    this.logger.log(`来自 ${client.id} (用户 ${userId}) 的消息: ${data}`);
    return `服务器已收到: ${data}`;
  }

  sendToUser(userId: string, event: string, data: any) {
    this.logger.log(
      `尝试发送事件 '${event}' 到用户房间 ${userId}, 数据内容: ${JSON.stringify(
        data,
      )}`,
    );
    this.server.to(userId).emit(event, data);
  }
}
