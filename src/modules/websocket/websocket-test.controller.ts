import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { WebSocketService } from './websocket.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorators';

@ApiTags('websocket')
@Controller('websocket')
export class WebSocketTestController {
  constructor(private readonly wsService: WebSocketService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get WebSocket server status' })
  @ApiResponse({ status: 200, description: 'Server status retrieved' })
  getStatus() {
    const clients = this.wsService.getConnectedClients();
    const onlineUsers = this.wsService.getOnlineUsersCount();
    const totalConnections = this.wsService.getTotalConnections();

    return {
      online: true,
      totalConnections,
      onlineUsers,
      anonymousConnections: totalConnections - onlineUsers,
      clients: clients.map((c) => ({
        userId: c.userId,
        socketId: c.socketId,
        rooms: Array.from(c.rooms),
        connectedAt: c.connectedAt,
        metadata: c.metadata,
      })),
    };
  }

  @Post('broadcast')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Broadcast message to all connected clients' })
  @ApiResponse({ status: 200, description: 'Message broadcasted' })
  broadcast(
    @Body() data: { event: string; message: any },
    @CurrentUser() user: { sub: string },
  ) {
    this.wsService.broadcast(data.event, {
      ...data.message,
      sentBy: user.sub,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Message broadcasted',
      recipients: this.wsService.getTotalConnections(),
    };
  }

  @Post('send-to-user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send message to specific user' })
  @ApiResponse({ status: 200, description: 'Message sent' })
  sendToUser(
    @Param('userId') userId: string,
    @Body() data: { event: string; message: any },
    @CurrentUser() user: { sub: string },
  ) {
    const sentCount = this.wsService.sendToUser(userId, data.event, {
      ...data.message,
      sentBy: user.sub,
      timestamp: new Date().toISOString(),
    });

    return {
      success: sentCount > 0,
      message: sentCount > 0 ? 'Message sent' : 'User not online',
      sentTo: sentCount,
    };
  }

  @Post('send-to-room/:room')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send message to specific room' })
  @ApiResponse({ status: 200, description: 'Message sent to room' })
  sendToRoom(
    @Param('room') room: string,
    @Body() data: { event: string; message: any },
    @CurrentUser() user: { sub: string },
  ) {
    this.wsService.sendToRoom(room, data.event, {
      ...data.message,
      sentBy: user.sub,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Message sent to room ${room}`,
    };
  }

  @Get('room/:room/members')
  @ApiOperation({ summary: 'Get room members' })
  @ApiResponse({ status: 200, description: 'Room members retrieved' })
  async getRoomMembers(@Param('room') room: string) {
    const members = await this.wsService.getRoomMembers(room);
    return {
      room,
      memberCount: members.length,
      members,
    };
  }

  @Get('user/:userId/status')
  @ApiOperation({ summary: 'Check if user is online' })
  @ApiResponse({ status: 200, description: 'User status retrieved' })
  getUserStatus(@Param('userId') userId: string) {
    const isOnline = this.wsService.isUserOnline(userId);
    const sockets = this.wsService.getUserSockets(userId);

    return {
      userId,
      online: isOnline,
      connectionCount: sockets.length,
      sockets,
    };
  }

  @Post('disconnect-user/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disconnect all connections of a user' })
  @ApiResponse({ status: 200, description: 'User disconnected' })
  disconnectUser(
    @Param('userId') userId: string,
    @Query('reason') reason?: string,
  ) {
    const disconnectedCount = this.wsService.disconnectUser(
      userId,
      reason || 'Admin action',
    );

    return {
      success: disconnectedCount > 0,
      message: disconnectedCount > 0 ? 'User disconnected' : 'User not online',
      disconnected: disconnectedCount,
    };
  }
}
