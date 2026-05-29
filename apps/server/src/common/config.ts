import 'dotenv/config';

export const config = {
  host: process.env.HOST || '0.0.0.0',
  port: parseInt(process.env.PORT || '3001', 10),
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN ?? '10d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL!,
  },
  urls: {
    frontend: process.env.FRONTEND_URL!,
    api: process.env.API_URL!,
    cors: process.env.CORS_URLS!,
    db: process.env.DATABASE_URL!,
  },
  environment: process.env.NODE_ENV! as 'development' | 'production' | 'staging',
  s3: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    bucketName: process.env.S3_BUCKET_NAME!,
    region: process.env.S3_REGION!,
  },
  mail: {
    smtp: {
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT || '465', 10),
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASSWORD!,
      },
    },
    defaults: {
      from: process.env.SMTP_FROM!,
      fromName: process.env.SMTP_FROM_NAME ?? 'Opengig',
    },
  },
  loki: {
    host: process.env.LOKI_HOST!,
    username: process.env.LOKI_USERNAME!,
    password: process.env.LOKI_PASSWORD!,
  },
};
