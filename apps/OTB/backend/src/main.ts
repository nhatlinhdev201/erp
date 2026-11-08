import 'dotenv/config';
// Global BigInt serialization fix — BigInt không serialize được JSON mặc định
(BigInt.prototype as any).toJSON = function () { return Number(this); };

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Increase body size limit for large planning payloads
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ limit: '10mb', extended: true }));

  // Security
  app.use(helmet());

  // CORS - read allowed origins from .env
  const allowedOrigins = (process.env.CORS_ORIGINS || process.env.CORS_ORIGIN || '')
    .split(',')
    .map(o => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global exception filter for Prisma errors
  app.useGlobalFilters(new PrismaExceptionFilter());

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('L-ERP OTB Planning API')
    .setDescription('Open-To-Buy Planning Management System for Luxury Fashion')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentication & Authorization')
    .addTag('master-data', 'Brands, Stores, Collections, Categories, SKU Catalog')
    .addTag('budgets', 'Budget Management')
    .addTag('planning', 'OTB Planning & Versions')
    .addTag('proposals', 'SKU Proposals')
    .addTag('approvals', 'Approval Workflow')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);

  console.log(`
  ┌──────────────────────────────────────────────────┐
  │   L-ERP OTB Backend API                           │
  │   Running on: http://${host}:${port}                  │
  │   Swagger:    http://localhost:${port}/api/docs       │
  └──────────────────────────────────────────────────┘
  `);
}

bootstrap();
