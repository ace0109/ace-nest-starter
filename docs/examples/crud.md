# CRUD 操作示例

## 创建资源模块

```bash
nest g resource posts
```

## 定义数据模型

```prisma
model Post {
  id        String   @id @default(cuid())
  title     String
  content   String
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

## 实现 CRUD 操作

### Create

```typescript
@Post()
create(@Body() dto: CreatePostDto) {
  return this.postsService.create(dto);
}
```

### Read

```typescript
@Get(':id')
findOne(@Param('id') id: string) {
  return this.postsService.findOne(id);
}
```

### Update

```typescript
@Patch(':id')
update(@Param('id') id: string, @Body() dto: UpdatePostDto) {
  return this.postsService.update(id, dto);
}
```

### Delete

```typescript
@Delete(':id')
remove(@Param('id') id: string) {
  return this.postsService.remove(id);
}
```

## 完整示例代码

查看项目中的完整实现。
