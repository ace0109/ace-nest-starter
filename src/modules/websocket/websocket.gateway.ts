import {
  WebSocketGateway as WSGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { WebSocketService } from './websocket.service';
import { WsExceptionFilter } from './filters/ws-exception.filter';

interface JwtPayload {
  sub: string;
  email?: string;
  username?: string;
  iat?: number;
  exp?: number;
}

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: JwtPayload;
}

@WSGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || true,
    credentials: true,
  },
  namespace: '/', // default namespace
  transports: ['websocket', 'polling'],
})
@UseFilters(new WsExceptionFilter())
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class WebSocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebSocketGateway.name);

  constructor(
    private readonly wsService: WebSocketService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Initialize gateway
   */
  afterInit(server: Server): void {
    this.wsService.setServer(server);
    this.logger.log('WebSocket Gateway initialized');
  }

  /**
   * Handle new connection
   */
  async handleConnection(socket: AuthenticatedSocket): Promise<void> {
    try {
      // Extract token from handshake
      const token = this.extractToken(socket);

      if (token) {
        try {
          // Verify JWT token
          const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
          socket.userId = payload.sub;
          socket.user = payload;

          // Register authenticated connection
          this.wsService.handleConnection(socket, payload.sub);

          // Send connection success event
          socket.emit('connected', {
            message: 'Connected successfully',
            userId: payload.sub,
            socketId: socket.id,
          });

          this.logger.log(`Authenticated connection from user ${payload.sub}`);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          this.logger.warn(`Invalid token from ${socket.id}: ${errorMessage}`);

          // Allow connection but as anonymous
          this.wsService.handleConnection(socket);

          socket.emit('connected', {
            message: 'Connected as anonymous',
            socketId: socket.id,
            anonymous: true,
          });
        }
      } else {
        // Handle anonymous connection
        this.wsService.handleConnection(socket);

        socket.emit('connected', {
          message: 'Connected as anonymous',
          socketId: socket.id,
          anonymous: true,
        });

        this.logger.log(`Anonymous connection from ${socket.id}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Connection error: ${errorMessage}`);
      socket.emit('error', { message: 'Connection failed' });
      socket.disconnect();
    }
  }

  /**
   * Handle disconnection
   */
  handleDisconnect(socket: AuthenticatedSocket): void {
    this.wsService.handleDisconnect(socket.id);
    this.logger.log(`Client disconnected: ${socket.id}`);
  }

  /**
   * Extract token from socket handshake
   */
  private extractToken(socket: Socket): string | null {
    // Try to get token from different sources

    // 1. From Authorization header
    const authHeader = socket.handshake.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // 2. From query params
    const token = socket.handshake.query.token as string;
    if (token) {
      return token;
    }

    // 3. From auth object (Socket.IO specific)
    const auth = socket.handshake.auth as { token?: string };
    if (auth && auth.token) {
      return auth.token;
    }

    return null;
  }

  /**
   * Authenticate a socket (for late authentication)
   */
  @SubscribeMessage('authenticate')
  async handleAuthenticate(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { token: string },
  ): Promise<{ success: boolean; userId?: string; error?: string }> {
    try {
      if (!data.token) {
        throw new WsException('Token is required');
      }

      const payload = await this.jwtService.verifyAsync<JwtPayload>(data.token);

      // Update socket properties
      socket.userId = payload.sub;
      socket.user = payload;

      // Re-register connection as authenticated
      this.wsService.handleDisconnect(socket.id);
      this.wsService.handleConnection(socket, payload.sub);

      this.logger.log(
        `Socket ${socket.id} authenticated as user ${payload.sub}`,
      );

      return { success: true, userId: payload.sub };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(
        `Authentication failed for socket ${socket.id}: ${errorMessage}`,
      );
      return { success: false, error: 'Invalid token' };
    }
  }

  /**
   * Join a room
   */
  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { room: string },
  ): { success: boolean; room?: string; error?: string } {
    try {
      if (!data.room) {
        throw new WsException('Room name is required');
      }

      const success = this.wsService.joinRoom(socket.id, data.room);

      if (success) {
        // Notify room members
        socket.to(data.room).emit('user-joined', {
          userId: socket.userId || 'anonymous',
          socketId: socket.id,
          room: data.room,
        });

        this.logger.log(`Socket ${socket.id} joined room ${data.room}`);
        return { success: true, room: data.room };
      }

      return { success: false, error: 'Failed to join room' };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Leave a room
   */
  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { room: string },
  ): { success: boolean; room?: string; error?: string } {
    try {
      if (!data.room) {
        throw new WsException('Room name is required');
      }

      const success = this.wsService.leaveRoom(socket.id, data.room);

      if (success) {
        // Notify room members
        socket.to(data.room).emit('user-left', {
          userId: socket.userId || 'anonymous',
          socketId: socket.id,
          room: data.room,
        });

        this.logger.log(`Socket ${socket.id} left room ${data.room}`);
        return { success: true, room: data.room };
      }

      return { success: false, error: 'Failed to leave room' };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send message to room
   */
  @SubscribeMessage('room-message')
  handleRoomMessage(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { room: string; message: string },
  ): { success: boolean; error?: string } {
    try {
      if (!data.room || !data.message) {
        throw new WsException('Room and message are required');
      }

      // Check if user is in the room
      const client = this.wsService.getClient(socket.id);
      if (!client || !client.rooms.has(data.room)) {
        throw new WsException('You are not in this room');
      }

      // Broadcast message to room
      this.wsService.sendToRoom(data.room, 'room-message', {
        userId: socket.userId || 'anonymous',
        socketId: socket.id,
        room: data.room,
        message: data.message,
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Send private message to user
   */
  @SubscribeMessage('private-message')
  handlePrivateMessage(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { targetUserId: string; message: string },
  ): { success: boolean; sent?: number; error?: string } {
    try {
      if (!data.targetUserId || !data.message) {
        throw new WsException('Target user ID and message are required');
      }

      // Send message to target user
      const sentCount = this.wsService.sendToUser(
        data.targetUserId,
        'private-message',
        {
          fromUserId: socket.userId || 'anonymous',
          fromSocketId: socket.id,
          message: data.message,
          timestamp: new Date().toISOString(),
        },
      );

      if (sentCount > 0) {
        return { success: true, sent: sentCount };
      }

      return { success: false, error: 'User is not online' };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  @SubscribeMessage('broadcast')
  handleBroadcast(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { message: string; requireAuth?: boolean },
  ): { success: boolean; error?: string } {
    try {
      // Check if user is authenticated (for restricted broadcasts)
      if (data.requireAuth && !socket.userId) {
        throw new WsException('Authentication required for this action');
      }

      // Broadcast message
      this.wsService.broadcast('broadcast-message', {
        fromUserId: socket.userId || 'anonymous',
        fromSocketId: socket.id,
        message: data.message,
        timestamp: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  /**
   * Get online users
   */
  @SubscribeMessage('get-online-users')
  handleGetOnlineUsers(): {
    count: number;
    anonymous: number;
    authenticated: number;
  } {
    const clients = this.wsService.getConnectedClients();
    const authenticated = clients.filter(
      (c) => !c.userId.startsWith('anonymous-'),
    ).length;
    const anonymous = clients.filter((c) =>
      c.userId.startsWith('anonymous-'),
    ).length;

    return {
      count: clients.length,
      authenticated,
      anonymous,
    };
  }

  /**
   * Ping-pong for connection health check
   */
  @SubscribeMessage('ping')
  handlePing(): { pong: boolean; timestamp: string } {
    return { pong: true, timestamp: new Date().toISOString() };
  }

  /**
   * Update user status
   */
  @SubscribeMessage('update-status')
  handleUpdateStatus(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { status: string; metadata?: Record<string, unknown> },
  ): { success: boolean; error?: string } {
    try {
      if (!data.status) {
        throw new WsException('Status is required');
      }

      // Update client metadata
      const updated = this.wsService.updateClientMetadata(socket.id, {
        status: data.status,
        ...data.metadata,
      });

      if (updated) {
        // Notify others about status change
        this.wsService.broadcast(
          'user-status-changed',
          {
            userId: socket.userId || 'anonymous',
            socketId: socket.id,
            status: data.status,
            timestamp: new Date().toISOString(),
          },
          { except: [socket.id] },
        );

        return { success: true };
      }

      return { success: false, error: 'Failed to update status' };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }
}
