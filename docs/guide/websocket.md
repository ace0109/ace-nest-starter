# WebSocket

## 概述

ACE NestJS Starter 集成 Socket.io 提供实时通信功能，支持双向通信、房间管理和事件广播。

## 核心特性

- **实时通信**: 双向数据传输
- **房间管理**: 分组广播
- **认证授权**: JWT 认证
- **断线重连**: 自动重连机制
- **消息确认**: 消息送达确认

## 基础配置

### Gateway 配置

```typescript
// src/websocket/websocket.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: any) {
    this.server.emit('message', payload);
  }
}
```

## 认证集成

### JWT 认证

```typescript
@Injectable()
export class WsJwtGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const client = context.switchToWs().getClient<Socket>();
    const token = client.handshake.auth.token;

    try {
      const payload = this.jwtService.verify(token);
      client.data.user = payload;
      return true;
    } catch (err) {
      client.disconnect();
      return false;
    }
  }
}
```

## 房间管理

```typescript
@SubscribeMessage('joinRoom')
handleJoinRoom(client: Socket, room: string) {
  client.join(room);
  client.to(room).emit('userJoined', client.data.user);
}

@SubscribeMessage('leaveRoom')
handleLeaveRoom(client: Socket, room: string) {
  client.leave(room);
  client.to(room).emit('userLeft', client.data.user);
}

@SubscribeMessage('roomMessage')
handleRoomMessage(client: Socket, payload: { room: string, message: string }) {
  this.server.to(payload.room).emit('message', {
    user: client.data.user,
    message: payload.message,
  });
}
```

## 客户端集成

### JavaScript 客户端

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000/chat', {
  auth: {
    token: localStorage.getItem('accessToken'),
  },
});

socket.on('connect', () => {
  console.log('Connected');
  socket.emit('joinRoom', 'general');
});

socket.on('message', (data) => {
  console.log('New message:', data);
});
```

## 高级功能

- 消息队列集成
- 分布式部署（Redis Adapter）
- 消息持久化
- 离线消息

## 最佳实践

1. 使用命名空间隔离功能
2. 实现心跳机制
3. 消息大小限制
4. 连接数限制
5. 错误处理

## 下一步

- [实时聊天示例](../examples/websocket-chat.md) - 聊天室实现
- [性能优化](./performance.md) - WebSocket 优化
- [监控](./monitoring.md) - 连接监控
