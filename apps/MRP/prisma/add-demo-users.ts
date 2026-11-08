// =============================================================================
// L-ERP MRP - ADD DEMO & ADMIN USERS
// Run: npx ts-node prisma/add-demo-users.ts
// =============================================================================

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log('Adding Demo & Admin users for customer review...\n');

  // ============================================
  // 1. ADMIN USER (Full access)
  // ============================================
  console.log('Creating Admin user...');

  const adminPassword = await hashPassword('AdminMRP@2026!');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@your-domain.com' },
    update: {
      password: adminPassword,
      role: 'admin',
      status: 'active', // User model uses 'status' not 'isActive'
    },
    create: {
      email: 'admin@your-domain.com',
      name: 'Admin Review',
      password: adminPassword,
      role: 'admin',
      status: 'active',
    },
  });
  console.log(`   Admin user: admin@your-domain.com / AdminMRP@2026!`);

  // ============================================
  // 2. DEMO USER (Full access for testing)
  // ============================================
  console.log('Creating Demo user...');

  const demoPassword = await hashPassword('DemoMRP@2026!');

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@your-domain.com' },
    update: {
      password: demoPassword,
      role: 'admin', // Give admin role for full access
      status: 'active',
    },
    create: {
      email: 'demo@your-domain.com',
      name: 'Demo User',
      password: demoPassword,
      role: 'admin', // Give admin role for full access
      status: 'active',
    },
  });
  console.log(`   Demo user: demo@your-domain.com / DemoMRP@2026!`);

  // ============================================
  // 3. VERIFY USERS
  // ============================================
  console.log('\nVerifying users...');

  const allUsers = await prisma.user.findMany({
    where: {
      email: {
        in: ['admin@your-domain.com', 'demo@your-domain.com']
      }
    },
    select: {
      email: true,
      name: true,
      role: true,
      status: true,
    }
  });

  console.log('\nCreated users:');
  console.table(allUsers);

  console.log('\nDone! Users ready for customer review.');
  console.log('\nCredentials:');
  console.log('   Admin: admin@your-domain.com / AdminMRP@2026!');
  console.log('   Demo:  demo@your-domain.com / DemoMRP@2026!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
