# 测试策略

## 概述

全面的测试策略和最佳实践。

## 单元测试

```typescript
describe('UserService', () => {
  it('should create user', async () => {
    const result = await service.createUser(dto);
    expect(result).toBeDefined();
  });
});
```

## 集成测试

测试模块间的交互。

## E2E 测试

```typescript
it('/POST users', () => {
  return request(app.getHttpServer())
    .post('/users')
    .send(createUserDto)
    .expect(201);
});
```

## 测试覆盖率

目标：80%+ 代码覆盖率

## 最佳实践

1. TDD/BDD
2. Mock 外部依赖
3. 测试隔离
4. CI 集成
