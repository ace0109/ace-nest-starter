# 第三方服务集成示例

## 支付集成

### Stripe 支付

```typescript
@Injectable()
export class PaymentService {
  private stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  async createPaymentIntent(amount: number) {
    return this.stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'usd',
    });
  }
}
```

## 短信服务

### Twilio SMS

```typescript
@Injectable()
export class SmsService {
  private twilio = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN,
  );

  async sendSms(to: string, body: string) {
    return this.twilio.messages.create({
      body,
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
    });
  }
}
```

## 云存储

### AWS S3

```typescript
async uploadToS3(file: Buffer, key: string) {
  return this.s3.upload({
    Bucket: 'my-bucket',
    Key: key,
    Body: file,
  }).promise();
}
```

## 邮件服务

SendGrid 集成示例。
