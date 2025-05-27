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
import {
  UsersModuleService,
  UserWithoutPassword,
} from '../../users-module/users-module.service';

interface AuthenticatedSocket extends Socket {
  user?: UserWithoutPassword;
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
    private readonly usersService: UsersModuleService,
  ) {}

  handleConnection(client: AuthenticatedSocket) {
    const token = client.handshake.auth.token || client.handshake.query.token;
    this.logger.log(
      `Attempting to connect client ${client.id} with token: ${token ? 'present' : 'absent'}`,
    );

    if (!token) {
      this.logger.warn(
        `Client ${client.id} connection rejected: No token provided.`,
      );
      client.emit('error', 'Authentication error: No token provided.');
      client.disconnect(true);
      return;
    }

    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      if (!secret) {
        this.logger.error(
          'JWT_SECRET not configured. Cannot authenticate WebSocket connections.',
        );
        throw new Error('Server configuration error for JWT.');
      }
      const payload: { sub: string; username: string } = this.jwtService.verify(
        token as string,
        { secret },
      );

      if (!payload || !payload.sub) {
        throw new UnauthorizedException('Invalid token payload.');
      }

      this.verifyUserAndSetupSocket(client, payload);
    } catch (error) {
      this.logger.warn(
        `Client ${client.id} authentication failed: ${error.message}`,
      );
      client.emit(
        'error',
        `Authentication error: ${error.message || 'Invalid token'}`,
      );
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
        `Client ${client.id} (User ${user.id} - ${user.username}) connected and joined room ${user.id}.`,
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
        `Client ${client.id} (User ${client.user.id} - ${client.user.username}) disconnected and left room ${client.user.id}.`,
      );
    } else {
      this.logger.log(
        `Client ${client.id} disconnected (was not fully authenticated).`,
      );
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
    this.logger.log(`Message from ${client.id} (User ${userId}): ${data}`);
    return `Server received: ${data}`;
  }

  sendToUser(userId: string, event: string, data: any) {
    this.logger.log(
      `Attempting to send event '${event}' to user room ${userId} with data: ${JSON.stringify(
        data,
      )}`,
    );
    this.server.to(userId).emit(event, data);
  }
}
