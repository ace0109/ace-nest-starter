import { Injectable, Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

interface ConnectedClient {
  userId: string;
  socketId: string;
  rooms: Set<string>;
  connectedAt: Date;
  metadata?: Record<string, unknown>;
}

interface BroadcastOptions {
  except?: string[]; // Socket IDs to exclude
  rooms?: string[]; // Specific rooms to broadcast to
}

@Injectable()
export class WebSocketService {
  private readonly logger = new Logger(WebSocketService.name);
  private server: Server;
  private connectedClients = new Map<string, ConnectedClient>();
  private userSocketMap = new Map<string, Set<string>>(); // userId -> Set of socketIds

  /**
   * Set the Socket.IO server instance
   */
  setServer(server: Server): void {
    this.server = server;
    this.logger.log('WebSocket server instance set');
  }

  /**
   * Register a new client connection
   */
  handleConnection(socket: Socket, userId?: string): void {
    const client: ConnectedClient = {
      userId: userId || `anonymous-${socket.id}`,
      socketId: socket.id,
      rooms: new Set(['global']),
      connectedAt: new Date(),
    };

    this.connectedClients.set(socket.id, client);

    // Track user's sockets
    if (userId) {
      if (!this.userSocketMap.has(userId)) {
        this.userSocketMap.set(userId, new Set());
      }
      this.userSocketMap.get(userId)?.add(socket.id);
    }

    // Join default room
    void socket.join('global');

    this.logger.log(
      `Client connected: ${socket.id}, User: ${client.userId}, Total clients: ${this.connectedClients.size}`,
    );
  }

  /**
   * Handle client disconnection
   */
  handleDisconnect(socketId: string): void {
    const client = this.connectedClients.get(socketId);
    if (client) {
      // Remove from user socket map
      if (client.userId && !client.userId.startsWith('anonymous-')) {
        const userSockets = this.userSocketMap.get(client.userId);
        if (userSockets) {
          userSockets.delete(socketId);
          if (userSockets.size === 0) {
            this.userSocketMap.delete(client.userId);
          }
        }
      }

      this.connectedClients.delete(socketId);
      this.logger.log(
        `Client disconnected: ${socketId}, User: ${client.userId}, Remaining clients: ${this.connectedClients.size}`,
      );
    }
  }

  /**
   * Send message to specific client
   */
  sendToClient(socketId: string, event: string, data: unknown): boolean {
    if (!this.server) {
      this.logger.warn('Server not initialized');
      return false;
    }

    const socket = this.server.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit(event, data);
      return true;
    }
    return false;
  }

  /**
   * Send message to specific user (all their connections)
   */
  sendToUser(userId: string, event: string, data: unknown): number {
    const socketIds = this.userSocketMap.get(userId);
    if (!socketIds) return 0;

    let sentCount = 0;
    for (const socketId of socketIds) {
      if (this.sendToClient(socketId, event, data)) {
        sentCount++;
      }
    }
    return sentCount;
  }

  /**
   * Send message to multiple users
   */
  sendToUsers(userIds: string[], event: string, data: unknown): void {
    for (const userId of userIds) {
      this.sendToUser(userId, event, data);
    }
  }

  /**
   * Broadcast message to all connected clients
   */
  broadcast(event: string, data: unknown, options?: BroadcastOptions): void {
    if (!this.server) {
      this.logger.warn('Server not initialized');
      return;
    }

    // Start with the base server
    if (options?.rooms && options.rooms.length > 0) {
      // Target specific rooms
      let roomEmitter = this.server.to(options.rooms[0]);
      for (let i = 1; i < options.rooms.length; i++) {
        roomEmitter = roomEmitter.to(options.rooms[i]);
      }

      // Exclude specific sockets if provided
      if (options.except && options.except.length > 0) {
        for (const socketId of options.except) {
          roomEmitter = roomEmitter.except(socketId);
        }
      }

      roomEmitter.emit(event, data);
    } else {
      // Broadcast to all
      if (options?.except && options.except.length > 0) {
        let broadcastEmitter = this.server.except(options.except[0]);
        for (let i = 1; i < options.except.length; i++) {
          broadcastEmitter = broadcastEmitter.except(options.except[i]);
        }
        broadcastEmitter.emit(event, data);
      } else {
        this.server.emit(event, data);
      }
    }
  }

  /**
   * Join a room
   */
  joinRoom(socketId: string, room: string): boolean {
    const socket = this.server?.sockets.sockets.get(socketId);
    const client = this.connectedClients.get(socketId);

    if (socket && client) {
      void socket.join(room);
      client.rooms.add(room);
      this.logger.log(`Socket ${socketId} joined room: ${room}`);
      return true;
    }
    return false;
  }

  /**
   * Leave a room
   */
  leaveRoom(socketId: string, room: string): boolean {
    const socket = this.server?.sockets.sockets.get(socketId);
    const client = this.connectedClients.get(socketId);

    if (socket && client) {
      void socket.leave(room);
      client.rooms.delete(room);
      this.logger.log(`Socket ${socketId} left room: ${room}`);
      return true;
    }
    return false;
  }

  /**
   * Send message to a specific room
   */
  sendToRoom(room: string, event: string, data: unknown): void {
    if (!this.server) {
      this.logger.warn('Server not initialized');
      return;
    }

    this.server.to(room).emit(event, data);
  }

  /**
   * Get all connected clients
   */
  getConnectedClients(): ConnectedClient[] {
    return Array.from(this.connectedClients.values());
  }

  /**
   * Get connected client by socket ID
   */
  getClient(socketId: string): ConnectedClient | undefined {
    return this.connectedClients.get(socketId);
  }

  /**
   * Get all sockets for a user
   */
  getUserSockets(userId: string): string[] {
    const sockets = this.userSocketMap.get(userId);
    return sockets ? Array.from(sockets) : [];
  }

  /**
   * Check if user is online
   */
  isUserOnline(userId: string): boolean {
    return this.userSocketMap.has(userId);
  }

  /**
   * Get online users count
   */
  getOnlineUsersCount(): number {
    return this.userSocketMap.size;
  }

  /**
   * Get total connections count
   */
  getTotalConnections(): number {
    return this.connectedClients.size;
  }

  /**
   * Update client metadata
   */
  updateClientMetadata(
    socketId: string,
    metadata: Record<string, unknown>,
  ): boolean {
    const client = this.connectedClients.get(socketId);
    if (client) {
      client.metadata = { ...client.metadata, ...metadata };
      return true;
    }
    return false;
  }

  /**
   * Get room members
   */
  async getRoomMembers(room: string): Promise<string[]> {
    if (!this.server) return [];

    const sockets = await this.server.in(room).fetchSockets();
    return sockets.map((socket) => socket.id);
  }

  /**
   * Disconnect a specific client
   */
  disconnectClient(socketId: string, reason = 'Server disconnected'): boolean {
    const socket = this.server?.sockets.sockets.get(socketId);
    if (socket) {
      socket.disconnect();
      this.logger.log(
        `Forcefully disconnected client: ${socketId}, Reason: ${reason}`,
      );
      return true;
    }
    return false;
  }

  /**
   * Disconnect all clients of a user
   */
  disconnectUser(userId: string, reason = 'User disconnected'): number {
    const socketIds = this.userSocketMap.get(userId);
    if (!socketIds) return 0;

    let disconnectedCount = 0;
    for (const socketId of socketIds) {
      if (this.disconnectClient(socketId, reason)) {
        disconnectedCount++;
      }
    }
    return disconnectedCount;
  }
}
