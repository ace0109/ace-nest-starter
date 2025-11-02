# 文件上传示例

## 单文件上传

### HTML 表单

```html
<form action="/upload" method="post" enctype="multipart/form-data">
  <input type="file" name="file" />
  <button type="submit">Upload</button>
</form>
```

### 处理上传

```typescript
@Post('upload')
@UseInterceptors(FileInterceptor('file'))
uploadFile(@UploadedFile() file: Express.Multer.File) {
  return {
    filename: file.filename,
    size: file.size,
    mimetype: file.mimetype
  };
}
```

## 多文件上传

```typescript
@Post('upload/multiple')
@UseInterceptors(FilesInterceptor('files', 10))
uploadFiles(@UploadedFiles() files: Express.Multer.File[]) {
  return files.map(file => ({
    filename: file.filename,
    size: file.size
  }));
}
```

## 图片处理

### 生成缩略图

```typescript
async generateThumbnail(file: Express.Multer.File) {
  const thumbnail = await sharp(file.buffer)
    .resize(200, 200)
    .toBuffer();

  return thumbnail;
}
```

## 云存储

上传到 S3 示例代码。
