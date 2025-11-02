# WebSocket 聊天室示例

## 服务端实现

### Gateway

```typescript
@WebSocketGateway()
export class ChatGateway {
  @SubscribeMessage('join')
  handleJoin(client: Socket, room: string) {
    client.join(room);
    client.to(room).emit('userJoined', client.id);
  }

  @SubscribeMessage('message')
  handleMessage(client: Socket, payload: any) {
    this.server.emit('message', payload);
  }
}
```

## 客户端实现

### 连接服务器

```javascript
const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected');
  socket.emit('join', 'general');
});

socket.on('message', (data) => {
  displayMessage(data);
});
```

### 发送消息

```javascript
function sendMessage(text) {
  socket.emit('message', {
    text,
    user: currentUser,
    timestamp: Date.now(),
  });
}
```

## 完整聊天应用

包含用户列表、私聊、群聊等功能。
