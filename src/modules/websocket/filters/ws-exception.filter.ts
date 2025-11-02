import { Catch, ArgumentsHost } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

@Catch()
export class WsExceptionFilter extends BaseWsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const client = host.switchToWs().getClient<Socket>();

    let error: { message: string; code?: string; details?: unknown };

    if (exception instanceof WsException) {
      const errorMessage = exception.getError();
      if (typeof errorMessage === 'string') {
        error = { message: errorMessage };
      } else {
        error = errorMessage as {
          message: string;
          code?: string;
          details?: unknown;
        };
      }
    } else if (exception instanceof Error) {
      error = { message: exception.message };
    } else {
      error = { message: 'Unknown error occurred' };
    }

    // Send error event to client
    client.emit('exception', {
      ...error,
      timestamp: new Date().toISOString(),
    });
  }
}
