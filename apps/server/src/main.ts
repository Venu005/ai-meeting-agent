import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { config } from './common/config';
import { BadRequestException, RawBodyRequest } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { Request, Response, json, urlencoded } from 'express';
import { Logger } from 'nestjs-pino';

const rawBodySaver = (req: RawBodyRequest<Request>, _res: Response, buffer: Buffer) => {
  const isStripeWebhook = Boolean(req.headers['stripe-signature']);
  const isRecallWebhook = Boolean(
    req.headers['webhook-id'] ||
      req.headers['webhook-signature'] ||
      req.headers['svix-id'] ||
      req.headers['svix-signature']
  );

  if (isStripeWebhook || isRecallWebhook) {
    req.rawBody = Buffer.from(buffer);
  }
};

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.enableCors({
    origin: config.urls.cors,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) => {
        return new BadRequestException({
          message: 'Something went wrong',
          data: errors,
        });
      },
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    })
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.use(json({ limit: '10mb', verify: rawBodySaver }));
  app.use(urlencoded({ extended: true, limit: '10mb', verify: rawBodySaver }));
  app.setGlobalPrefix('api');
  app.useLogger(app.get(Logger));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Project Name API')
    .setDescription('Project Name API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(config.port, config.host);
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
