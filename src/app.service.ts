import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getHello(): string {
    const env = this.configService.get<string>('app.env');
    const port = this.configService.get<number>('app.port');
    return `Hello from ACE Nest Starter! Running in ${env} mode on port ${port}`;
  }
}
