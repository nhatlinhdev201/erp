import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import helmet from 'helmet';
import * as bcrypt from 'bcrypt';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { AppModule } from './app.module';

/**
 * Optional auto-migrate + seed if empty.
 * SECURITY: Only runs when AUTO_MIGRATE=true (explicit opt-in).
 * - Migration uses `prisma db push` WITHOUT --accept-data-loss
 *   (prefer `prisma migrate deploy` for production).
 * - Seed requires SEED_ADMIN_PASSWORD (>= 12 chars) from environment.
 */
async function ensureDatabase() {
  // ── Migration (opt-in) ──
  if (process.env.AUTO_MIGRATE === 'true') {
    console.log('[DB] AUTO_MIGRATE=true — running prisma db push (safe mode)...');
    try {
      execSync('npx prisma db push --skip-generate', {
        stdio: 'inherit',
        timeout: 60000,
      });
      console.log('[DB] Schema is up to date.');
    } catch (err) {
      console.error('[DB] prisma db push failed:', err);
    }
  } else {
    console.log('[DB] AUTO_MIGRATE != true — skipping auto schema push. Run migrations manually if needed.');
  }

  // ── Seed (opt-in + strong password required) ──
  const prisma = new PrismaClient();
  try {
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      console.log(`[DB] ${userCount} users exist. Skipping seed.`);
      return;
    }

    const rawPassword = process.env.SEED_ADMIN_PASSWORD;
    if (!rawPassword) {
      console.log('[DB] No users found but SEED_ADMIN_PASSWORD is not set — skipping seed (set it to create initial users).');
      return;
    }
    if (rawPassword.length < 12) {
      throw new Error('[DB] SEED_ADMIN_PASSWORD must be at least 12 characters. Refusing to seed with weak password.');
    }

    console.log('[DB] No users found. Seeding company + users...');
    const password = await bcrypt.hash(rawPassword, 10);

    // Create company
    let company = await prisma.company.findFirst({ where: { code: 'DEMO' } });
    if (!company) {
      company = await prisma.company.create({
        data: {
          code: 'DEMO',
          name: 'Demo FMCG Vietnam',
          settings: {
            currency: 'VND',
            locale: 'vi-VN',
            timezone: 'Asia/Ho_Chi_Minh',
            fiscalYearStart: 1,
          },
        },
      });
      console.log(`[DB] Created company: ${company.name}`);
    }

    // Create users
    const users = [
      { email: 'admin@your-domain.com', name: 'Nguyen Van Admin', role: 'ADMIN' as const },
      { email: 'manager@your-domain.com', name: 'Tran Thi Manager', role: 'MANAGER' as const },
      { email: 'kam1@your-domain.com', name: 'Pham Thanh Tung', role: 'KAM' as const },
      { email: 'finance@your-domain.com', name: 'Hoang Thi Thu', role: 'FINANCE' as const },
    ];

    for (const u of users) {
      await prisma.user.create({
        data: {
          email: u.email,
          name: u.name,
          password,
          role: u.role,
          isActive: true,
          companyId: company.id,
        },
      });
    }
    console.log(`[DB] Created ${users.length} users (password from SEED_ADMIN_PASSWORD env)`);
  } catch (err) {
    console.error('[DB] Seed failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

async function bootstrap() {
  // Ensure database schema and seed data before starting
  await ensureDatabase();

  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGINS')?.split(',') || [
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  // API Prefix
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Promo Master V3 API')
    .setDescription(
      `
      Trade Promotion Management System API
      
      ## Overview
      - 257 endpoints across 37 modules
      - JWT Authentication
      - Role-based access control
      
      ## Modules
      - **Core**: Auth, Budgets, Promotions, Claims, Customers, Products
      - **V3 Features**: Contracts, AI Suggestions, Live Monitoring
      - **Finance**: Settlements, Payments, Reconciliation
      - **Planning**: Planning, Targets, Execution, Operations
    `,
    )
    .setVersion('3.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication & Authorization')
    .addTag('Users', 'User Management')
    .addTag('Budgets', 'Budget Management')
    .addTag('Promotions', 'Promotion Management')
    .addTag('Claims', 'Claims Processing')
    .addTag('Contracts', 'Volume Contracts (V3)')
    .addTag('Customers', 'Customer Management')
    .addTag('Products', 'Product Catalog')
    .addTag('Analytics', 'Reports & Analytics')
    .addTag('AI', 'AI Suggestions (V3)')
    .addTag('Monitoring', 'Live Monitoring (V3)')
    .addTag('Finance', 'Settlements, Payments, Reconciliation')
    .addTag('Planning', 'Planning & Targets')
    .addTag('Operations', 'Execution & Operations')
    .addTag('Settings', 'System Settings')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  // Start server
  const port = configService.get('PORT') || 3000;
  await app.listen(port);

  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                   PROMO MASTER V3 API                         ║
╠═══════════════════════════════════════════════════════════════╣
║  🚀 Server:    http://localhost:${port}                         ║
║  📚 Swagger:   http://localhost:${port}/api/docs                ║
║  🔧 Health:    http://localhost:${port}/api/health              ║
╚═══════════════════════════════════════════════════════════════╝
  `);
}

bootstrap();
