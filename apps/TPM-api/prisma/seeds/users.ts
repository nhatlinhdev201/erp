import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

/**
 * SECURITY: No hardcoded passwords in git.
 * - Dev/demo: use SEED_DEMO_PASSWORD if set, otherwise generate a random one
 *   and print it once to console.
 */
function resolveSeedPassword(): string {
  if (process.env.SEED_DEMO_PASSWORD) {
    if (process.env.SEED_DEMO_PASSWORD.length < 12) {
      throw new Error('SEED_DEMO_PASSWORD must be at least 12 characters.');
    }
    return process.env.SEED_DEMO_PASSWORD;
  }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return Array.from(randomBytes(16))
    .map((b) => chars[b % chars.length])
    .join('');
}

export async function seedUsers() {
  console.log('Seeding users...');

  // Create default company first
  const company = await prisma.company.upsert({
    where: { code: 'DEMO' },
    update: {},
    create: {
      code: 'DEMO',
      name: 'Demo Company',
    },
  });

  console.log(`Company created/found: ${company.name}`);

  // Hash passwords (see resolveSeedPassword — never hardcoded)
  const seedPassword = resolveSeedPassword();
  const adminPassword = await bcrypt.hash(seedPassword + '!Adm', 10);
  const managerPassword = await bcrypt.hash(seedPassword + '!Mgr', 10);
  const userPassword = await bcrypt.hash(seedPassword + '!Usr', 10);
  console.log('🔐 Seeded user passwords (save now, shown once):');
  console.log(`   admin@your-domain.com   : ${seedPassword}!Adm`);
  console.log(`   manager@your-domain.com : ${seedPassword}!Mgr`);
  console.log(`   user@your-domain.com    : ${seedPassword}!Usr`);

  // Create users
  const users = [
    {
      email: 'admin@your-domain.com',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN' as const,
      companyId: company.id,
    },
    {
      email: 'manager@your-domain.com',
      name: 'Manager User',
      password: managerPassword,
      role: 'MANAGER' as const,
      companyId: company.id,
    },
    {
      email: 'user@your-domain.com',
      name: 'Regular User',
      password: userPassword,
      role: 'KAM' as const,
      companyId: company.id,
    },
  ];

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        password: userData.password,
        name: userData.name,
        role: userData.role,
      },
      create: userData,
    });
    console.log(`User created/updated: ${user.email} (${user.role})`);
  }

  console.log('Users seeded successfully!');
}
