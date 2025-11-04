import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
jest.mock('uuid', () => ({ v4: () => 'test-uuid' }));
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const configMock = {
      get: jest.fn((key: string) => {
        if (key === 'app.env') {
          return 'test';
        }
        if (key === 'app.port') {
          return 3000;
        }
        return undefined;
      }),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: configMock,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toContain('Hello from ACE Nest Starter!');
    });
  });
});
