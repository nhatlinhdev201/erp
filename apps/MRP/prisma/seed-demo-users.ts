// =============================================================================
// L-ERP MRP - SEED DEMO USERS FOR ROLE TESTING
// Run: npx ts-node prisma/seed-demo-users.ts
// =============================================================================

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

const demoUsers = [
  {
    email: 'admin@demo.your-domain.com',
    name: 'Demo Admin',
    password: 'Admin@Demo2026!',
    role: 'admin',
  },
  {
    email: 'manager@demo.your-domain.com',
    name: 'Demo Manager',
    password: 'Manager@Demo2026!',
    role: 'manager',
  },
  {
    email: 'operator@demo.your-domain.com',
    name: 'Demo Operator',
    password: 'Operator@Demo2026!',
    role: 'operator',
  },
  {
    email: 'viewer@demo.your-domain.com',
    name: 'Demo Viewer',
    password: 'Viewer@Demo2026!',
    role: 'viewer',
  },
];

async function main() {
  console.log('Creating demo users for role testing...\n');

  for (const user of demoUsers) {
    const hashedPassword = await hashPassword(user.password);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        password: hashedPassword,
        role: user.role,
        status: 'active',
      },
      create: {
        email: user.email,
        name: user.name,
        password: hashedPassword,
        role: user.role,
        status: 'active',
      },
    });

    console.log(`  ${user.role.toUpperCase()}: ${user.email}`);
  }

  console.log('\nDemo users created successfully!');
  console.log('\nCredentials:');
  demoUsers.forEach(u => {
    console.log(`   ${u.role}: ${u.email} / ${u.password}`);
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
