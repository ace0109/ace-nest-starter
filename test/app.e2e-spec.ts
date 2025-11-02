import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma';

describe('Application E2E Tests', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply the same configuration as main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    prisma = app.get<PrismaService>(PrismaService);

    await app.init();

    // Clean database before tests
    await cleanDatabase();
  });

  afterAll(async () => {
    await cleanDatabase();
    await app.close();
  });

  async function cleanDatabase() {
    // Clean tables in correct order to avoid foreign key constraints
    await prisma.oAuthConnection.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.rolePermission.deleteMany();
    await prisma.user.deleteMany();
    await prisma.role.deleteMany();
    await prisma.permission.deleteMany();
  }

  describe('Health Check', () => {
    it('/health/ping (GET)', () => {
      return request(app.getHttpServer())
        .get('/health/ping')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
        });
    });

    it('/health (GET)', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('details');
        });
    });
  });

  describe('Authentication', () => {
    const testUser = {
      email: 'test@example.com',
      username: 'testuser',
      password: 'Test123456!',
      name: 'Test User',
    };

    describe('POST /auth/register', () => {
      it('should register a new user', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser)
          .expect(201)
          .expect((res) => {
            expect(res.body).toHaveProperty('accessToken');
            expect(res.body).toHaveProperty('refreshToken');
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.email).toBe(testUser.email);

            accessToken = res.body.accessToken;
            refreshToken = res.body.refreshToken;
          });
      });

      it('should fail with duplicate email', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send(testUser)
          .expect(409);
      });

      it('should fail with invalid email', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({
            ...testUser,
            email: 'invalid-email',
          })
          .expect(400);
      });

      it('should fail with weak password', () => {
        return request(app.getHttpServer())
          .post('/auth/register')
          .send({
            ...testUser,
            email: 'another@example.com',
            password: '123456',
          })
          .expect(400);
      });
    });

    describe('POST /auth/login', () => {
      it('should login with valid credentials', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: testUser.password,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('accessToken');
            expect(res.body).toHaveProperty('refreshToken');
            expect(res.body).toHaveProperty('user');
          });
      });

      it('should fail with invalid password', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: testUser.email,
            password: 'wrongpassword',
          })
          .expect(401);
      });

      it('should fail with non-existent email', () => {
        return request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'nonexistent@example.com',
            password: testUser.password,
          })
          .expect(401);
      });
    });

    describe('POST /auth/refresh', () => {
      it('should refresh tokens with valid refresh token', () => {
        return request(app.getHttpServer())
          .post('/auth/refresh')
          .send({
            refreshToken: refreshToken,
          })
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('accessToken');
            expect(res.body).toHaveProperty('refreshToken');
          });
      });

      it('should fail with invalid refresh token', () => {
        return request(app.getHttpServer())
          .post('/auth/refresh')
          .send({
            refreshToken: 'invalid-token',
          })
          .expect(401);
      });
    });
  });

  describe('User Management', () => {
    describe('GET /users/profile', () => {
      it('should get user profile with valid token', () => {
        return request(app.getHttpServer())
          .get('/users/profile')
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body).toHaveProperty('id');
            expect(res.body).toHaveProperty('email');
            expect(res.body).not.toHaveProperty('password');
          });
      });

      it('should fail without token', () => {
        return request(app.getHttpServer())
          .get('/users/profile')
          .expect(401);
      });

      it('should fail with invalid token', () => {
        return request(app.getHttpServer())
          .get('/users/profile')
          .set('Authorization', 'Bearer invalid-token')
          .expect(401);
      });
    });

    describe('PATCH /users/profile', () => {
      it('should update user profile', () => {
        return request(app.getHttpServer())
          .patch('/users/profile')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            name: 'Updated Name',
            nickname: 'UpdatedNick',
          })
          .expect(200)
          .expect((res) => {
            expect(res.body.name).toBe('Updated Name');
            expect(res.body.nickname).toBe('UpdatedNick');
          });
      });

      it('should fail to update email to duplicate', async () => {
        // Create another user
        await request(app.getHttpServer())
          .post('/auth/register')
          .send({
            email: 'another@example.com',
            username: 'another',
            password: 'Test123456!',
            name: 'Another User',
          });

        // Try to update email to duplicate
        return request(app.getHttpServer())
          .patch('/users/profile')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            email: 'another@example.com',
          })
          .expect(409);
      });
    });
  });

  describe('Swagger Documentation', () => {
    it('/api (GET) should return swagger UI', () => {
      return request(app.getHttpServer())
        .get('/api')
        .expect(301) // Redirect to /api/
        .expect('Location', '/api/');
    });

    it('/api-json (GET) should return swagger JSON', () => {
      return request(app.getHttpServer())
        .get('/api-json')
        .expect(200)
        .expect('Content-Type', /json/)
        .expect((res) => {
          expect(res.body).toHaveProperty('openapi');
          expect(res.body).toHaveProperty('info');
          expect(res.body).toHaveProperty('paths');
        });
    });
  });

  describe('Internationalization', () => {
    it('should return error message in English', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .set('Accept-Language', 'en')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('Invalid credentials');
        });
    });

    it('should return error message in Chinese', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .set('Accept-Language', 'zh')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toContain('认证信息无效');
        });
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit excessive requests', async () => {
      const requests = [];

      // Make 10 requests rapidly
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app.getHttpServer())
            .post('/auth/login')
            .send({
              email: 'test@example.com',
              password: 'wrongpassword',
            }),
        );
      }

      const responses = await Promise.all(requests);

      // At least one should be rate limited (429)
      const rateLimited = responses.some(res => res.status === 429);
      expect(rateLimited).toBe(true);
    });
  });
});