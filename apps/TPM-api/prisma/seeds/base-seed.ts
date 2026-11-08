import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function seedBase() {
  console.log('🌱 Seeding base data...');

  // Create company
  const company = await prisma.company.upsert({
    where: { code: 'SPVN' },
    update: {},
    create: {
      code: 'SPVN',
      name: 'Suntory PepsiCo Vietnam',
    },
  });
  console.log('✅ Company created:', company.name);

  // SECURITY: require strong password from env — no hardcoded fallback
  const rawPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!rawPassword) {
    throw new Error(
      'Missing SEED_ADMIN_PASSWORD environment variable (min 12 chars). Refusing to seed admin with a default password.'
    );
  }
  if (rawPassword.length < 12) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 12 characters.');
  }
  const hashedPassword = await bcrypt.hash(rawPassword, 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@spvn.com' },
    update: {},
    create: {
      email: 'admin@spvn.com',
      name: 'System Admin',
      password: hashedPassword,
      role: 'ADMIN',
      companyId: company.id,
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create customers
  const customerData = [
    { code: 'MT001', name: 'Big C Thăng Long', channel: 'MT', address: '222 Trần Duy Hưng, Hà Nội' },
    { code: 'MT002', name: 'Vinmart Times City', channel: 'MT', address: '458 Minh Khai, Hà Nội' },
    { code: 'MT003', name: 'Lotte Mart Q7', channel: 'MT', address: '469 Nguyễn Hữu Thọ, TP.HCM' },
    { code: 'GT001', name: 'Tạp hóa Hùng Anh', channel: 'GT', address: '123 Lê Lợi, Đà Nẵng' },
    { code: 'GT002', name: 'Cửa hàng Minh Tâm', channel: 'GT', address: '456 Nguyễn Trãi, TP.HCM' },
    { code: 'HORECA001', name: 'Nhà hàng Phố Xưa', channel: 'HORECA', address: '789 Bà Triệu, Hà Nội' },
    { code: 'ECOM001', name: 'Shopee Official Store', channel: 'ECOMMERCE', address: 'Online' },
  ];

  for (const c of customerData) {
    await prisma.customer.upsert({
      where: { companyId_code: { companyId: company.id, code: c.code } },
      update: {},
      create: {
        companyId: company.id,
        code: c.code,
        name: c.name,
        channel: c.channel as any,
        address: c.address,
        isActive: true,
      },
    });
  }
  console.log(`✅ Created ${customerData.length} customers`);

  // Create products
  const productData = [
    { sku: 'PEP-330', name: 'Pepsi 330ml', category: 'CSD', brand: 'Pepsi', price: 10000 },
    { sku: 'PEP-1500', name: 'Pepsi 1.5L', category: 'CSD', brand: 'Pepsi', price: 18000 },
    { sku: '7UP-330', name: '7UP 330ml', category: 'CSD', brand: '7UP', price: 10000 },
    { sku: '7UP-1500', name: '7UP 1.5L', category: 'CSD', brand: '7UP', price: 18000 },
    { sku: 'MRD-330', name: 'Mirinda 330ml', category: 'CSD', brand: 'Mirinda', price: 10000 },
    { sku: 'TEA-500', name: 'Lipton Ice Tea 500ml', category: 'TEA', brand: 'Lipton', price: 12000 },
    { sku: 'AQUA-500', name: 'Aquafina 500ml', category: 'WATER', brand: 'Aquafina', price: 6000 },
    { sku: 'AQUA-1500', name: 'Aquafina 1.5L', category: 'WATER', brand: 'Aquafina', price: 10000 },
    { sku: 'TWISTER-330', name: 'Twister Orange 330ml', category: 'JUICE', brand: 'Twister', price: 12000 },
    { sku: 'STING-330', name: 'Sting Energy 330ml', category: 'ENERGY', brand: 'Sting', price: 12000 },
  ];

  for (const p of productData) {
    await prisma.product.upsert({
      where: { companyId_sku: { companyId: company.id, sku: p.sku } },
      update: {},
      create: {
        companyId: company.id,
        sku: p.sku,
        name: p.name,
        category: p.category,
        brand: p.brand,
        price: p.price,
        cogs: p.price * 0.6,
        isActive: true,
      },
    });
  }
  console.log(`✅ Created ${productData.length} products`);

  // Create a fund
  const fund = await prisma.fund.upsert({
    where: { id: 'fund-2026' },
    update: {},
    create: {
      id: 'fund-2026',
      companyId: company.id,
      code: 'TRADE-2026',
      name: 'Trade Budget 2026',
      type: 'FIXED',
      year: 2026,
      totalBudget: 50000000000,
      committed: 0,
      available: 50000000000,
      isActive: true,
    },
  });
  console.log('✅ Fund created:', fund.name);

  // Create sample promotions
  const customers = await prisma.customer.findMany({ where: { companyId: company.id }, take: 3 });

  for (let i = 0; i < 3; i++) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + (i * 30));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    await prisma.promotion.upsert({
      where: { id: `promo-${i + 1}` },
      update: {},
      create: {
        id: `promo-${i + 1}`,
        code: `PRO-2026-${String(i + 1).padStart(3, '0')}`,
        name: `Promotion ${['Tết', 'Q1 Volume', 'Display'][i]} 2026`,
        description: `Sample promotion ${i + 1}`,
        status: 'EXECUTING',
        startDate,
        endDate,
        budget: 5000000000 + (i * 1000000000),
        customerId: customers[i % customers.length].id,
        fundId: fund.id,
        createdById: admin.id,
      },
    });
  }
  console.log('✅ Created 3 sample promotions');

  console.log('✅ Base seed completed!');
  return company;
}

if (require.main === module) {
  seedBase()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
