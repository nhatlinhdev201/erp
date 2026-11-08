import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ──────────────────────────────────────────────────────────
// HOW TO SEED WITH REAL USERS:
// 1. Register users via /register page or Supabase dashboard
// 2. Set SEED_ADMIN_ID env to the Supabase auth user id:
//    SEED_ADMIN_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx npx prisma db seed
// 3. Optionally set SEED_MEMBER_ID for a second user
// Without SEED_ADMIN_ID, seed will look for existing users in DB.
// ──────────────────────────────────────────────────────────

async function getOrCreateSeedUsers() {
  const adminId = process.env.SEED_ADMIN_ID
  const memberId = process.env.SEED_MEMBER_ID

  // Try to find existing users first
  const existingUsers = await prisma.user.findMany({ orderBy: { createdAt: 'asc' }, take: 2 })

  let user1 = existingUsers[0]
  let user2 = existingUsers[1]

  if (!user1 && adminId) {
    user1 = await prisma.user.create({
      data: {
        id: adminId,
        email: 'admin@your-domain.com',
        name: 'Admin L-ERP',
        role: 'ADMIN',
      },
    })
  }

  if (!user1) {
    console.error('❌ No users found in DB. Please register a user first via /register, then run seed again.')
    console.error('   Or provide SEED_ADMIN_ID=<supabase-user-id> npx prisma db seed')
    process.exit(1)
  }

  if (!user2 && memberId) {
    user2 = await prisma.user.create({
      data: {
        id: memberId,
        email: 'member@your-domain.com',
        name: 'Member L-ERP',
        role: 'MEMBER',
      },
    })
  }

  // If no second user, use first user for all data
  if (!user2) {
    user2 = user1
  }

  return { user: user1, user2 }
}

async function main() {
  // Clean data (preserve users — they're linked to Supabase auth)
  await prisma.auditLog.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.salesOrder.deleteMany()
  await prisma.quoteItem.deleteMany()
  await prisma.quote.deleteMany()
  await prisma.activity.deleteMany()
  await prisma.dealContact.deleteMany()
  await prisma.dealTag.deleteMany()
  await prisma.contactTag.deleteMany()
  await prisma.companyTag.deleteMany()
  await prisma.deal.deleteMany()
  await prisma.stage.deleteMany()
  await prisma.pipelineConfig.deleteMany()
  await prisma.contact.deleteMany()
  await prisma.company.deleteMany()
  await prisma.product.deleteMany()
  await prisma.tag.deleteMany()

  const { user, user2 } = await getOrCreateSeedUsers()

  // Tags
  const tags = await Promise.all([
    prisma.tag.create({ data: { name: 'VIP', color: '#F59E0B' } }),
    prisma.tag.create({ data: { name: 'Enterprise', color: '#8B5CF6' } }),
    prisma.tag.create({ data: { name: 'SME', color: '#3B82F6' } }),
    prisma.tag.create({ data: { name: 'Partner', color: '#10B981' } }),
    prisma.tag.create({ data: { name: 'Hot Lead', color: '#EF4444' } }),
  ])

  // Companies
  const companies = await Promise.all([
    prisma.company.create({
      data: {
        name: 'Your Company',
        domain: 'lerp.vn',
        industry: 'Thời trang cao cấp',
        size: 'LARGE',
        phone: '028-3822-5555',
        email: 'contact@your-domain.com',
        website: 'https://lerp.vn',
        city: 'Hồ Chí Minh',
        province: 'Hồ Chí Minh',
        country: 'VN',
        taxCode: '0301234567',
        ownerId: user.id,
        tags: { create: [{ tagId: tags[0].id }, { tagId: tags[1].id }] },
      },
    }),
    prisma.company.create({
      data: {
        name: 'Thành Công Group',
        domain: 'thanhcong.vn',
        industry: 'Sản xuất dệt may',
        size: 'ENTERPRISE',
        phone: '028-3811-4444',
        email: 'info@thanhcong.vn',
        city: 'Hồ Chí Minh',
        province: 'Hồ Chí Minh',
        country: 'VN',
        taxCode: '0302345678',
        ownerId: user.id,
        tags: { create: [{ tagId: tags[1].id }] },
      },
    }),
    prisma.company.create({
      data: {
        name: 'FPT Software',
        domain: 'fpt.com.vn',
        industry: 'Công nghệ thông tin',
        size: 'ENTERPRISE',
        phone: '024-7300-7300',
        email: 'contact@fpt.com.vn',
        website: 'https://fpt.com.vn',
        city: 'Hà Nội',
        province: 'Hà Nội',
        country: 'VN',
        taxCode: '0101234567',
        ownerId: user2.id,
        tags: { create: [{ tagId: tags[1].id }] },
      },
    }),
    prisma.company.create({
      data: {
        name: 'Vinamilk',
        domain: 'vinamilk.com.vn',
        industry: 'Thực phẩm & Đồ uống',
        size: 'ENTERPRISE',
        phone: '028-5415-5555',
        email: 'info@vinamilk.com.vn',
        city: 'Hồ Chí Minh',
        province: 'Hồ Chí Minh',
        country: 'VN',
        ownerId: user.id,
      },
    }),
    prisma.company.create({
      data: {
        name: 'Hòa Phát Steel',
        domain: 'hoaphat.com.vn',
        industry: 'Thép & Vật liệu',
        size: 'ENTERPRISE',
        phone: '024-6287-9999',
        email: 'info@hoaphat.com.vn',
        city: 'Hà Nội',
        province: 'Hà Nội',
        country: 'VN',
        ownerId: user2.id,
      },
    }),
  ])

  // Contacts
  const contacts = await Promise.all([
    prisma.contact.create({
      data: { firstName: 'Lan', lastName: 'Phạm', email: 'lan.pham@your-domain.com', phone: '0901234567', jobTitle: 'Giám đốc mua hàng', companyId: companies[0].id, status: 'CUSTOMER', source: 'REFERRAL', score: 85, ownerId: user.id, tags: { create: [{ tagId: tags[0].id }] } },
    }),
    prisma.contact.create({
      data: { firstName: 'Hùng', lastName: 'Nguyễn', email: 'hung.nguyen@thanhcong.vn', phone: '0912345678', jobTitle: 'Trưởng phòng kế hoạch', companyId: companies[1].id, status: 'CUSTOMER', source: 'TRADE_SHOW', score: 72, ownerId: user.id },
    }),
    prisma.contact.create({
      data: { firstName: 'Thảo', lastName: 'Trần', email: 'thao.tran@fpt.com.vn', phone: '0923456789', jobTitle: 'CTO', companyId: companies[2].id, status: 'ACTIVE', source: 'WEBSITE', score: 90, ownerId: user2.id, tags: { create: [{ tagId: tags[4].id }] } },
    }),
    prisma.contact.create({
      data: { firstName: 'Đức', lastName: 'Lê', email: 'duc.le@vinamilk.com.vn', phone: '0934567890', jobTitle: 'Supply Chain Manager', companyId: companies[3].id, status: 'LEAD', source: 'COLD_CALL', score: 45, ownerId: user.id },
    }),
    prisma.contact.create({
      data: { firstName: 'Mai', lastName: 'Võ', email: 'mai.vo@hoaphat.com.vn', phone: '0945678901', jobTitle: 'Giám đốc tài chính', companyId: companies[4].id, status: 'ACTIVE', source: 'PARTNER', score: 68, ownerId: user2.id },
    }),
    prisma.contact.create({
      data: { firstName: 'Tuấn', lastName: 'Hoàng', email: 'tuan.hoang@gmail.com', phone: '0956789012', jobTitle: 'Startup Founder', status: 'LEAD', source: 'SOCIAL_MEDIA', score: 35, ownerId: user.id },
    }),
  ])

  // Pipeline & Stages
  const pipeline = await prisma.pipelineConfig.create({
    data: {
      name: 'Default Pipeline',
      isDefault: true,
      stages: {
        create: [
          { name: 'New Lead', order: 0, probability: 10, color: '#6B7280' },
          { name: 'Qualification', order: 1, probability: 20, color: '#3B82F6' },
          { name: 'Proposal', order: 2, probability: 50, color: '#8B5CF6' },
          { name: 'Negotiation', order: 3, probability: 75, color: '#F59E0B' },
          { name: 'Closed Won', order: 4, probability: 100, color: '#10B981', isWon: true },
          { name: 'Closed Lost', order: 5, probability: 0, color: '#EF4444', isLost: true },
        ],
      },
    },
    include: { stages: { orderBy: { order: 'asc' } } },
  })

  const stages = pipeline.stages

  // Deals
  const deals = await Promise.all([
    prisma.deal.create({
      data: { title: 'Hệ thống MRP cho L-ERP', value: 2500000000, expectedCloseAt: new Date('2026-03-15'), stageId: stages[3].id, pipelineId: pipeline.id, companyId: companies[0].id, ownerId: user.id, contacts: { create: [{ contactId: contacts[0].id, role: 'DECISION_MAKER' }] } },
    }),
    prisma.deal.create({
      data: { title: 'Module OTB - Thành Công', value: 1800000000, expectedCloseAt: new Date('2026-04-01'), stageId: stages[2].id, pipelineId: pipeline.id, companyId: companies[1].id, ownerId: user.id, contacts: { create: [{ contactId: contacts[1].id, role: 'CHAMPION' }] } },
    }),
    prisma.deal.create({
      data: { title: 'Tích hợp CRM + HRM cho FPT', value: 4200000000, expectedCloseAt: new Date('2026-05-01'), stageId: stages[1].id, pipelineId: pipeline.id, companyId: companies[2].id, ownerId: user2.id, contacts: { create: [{ contactId: contacts[2].id, role: 'DECISION_MAKER' }] } },
    }),
    prisma.deal.create({
      data: { title: 'Supply Chain AI - Vinamilk', value: 3800000000, expectedCloseAt: new Date('2026-06-15'), stageId: stages[0].id, pipelineId: pipeline.id, companyId: companies[3].id, ownerId: user.id },
    }),
    prisma.deal.create({
      data: { title: 'Sheets Enterprise - Hòa Phát', value: 950000000, expectedCloseAt: new Date('2026-03-01'), stageId: stages[4].id, pipelineId: pipeline.id, companyId: companies[4].id, ownerId: user2.id, closedAt: new Date('2026-02-10') },
    }),
    prisma.deal.create({
      data: { title: 'Gói Starter - Hoàng Tuấn', value: 120000000, stageId: stages[5].id, pipelineId: pipeline.id, ownerId: user.id, lostReason: 'Ngân sách không đủ', closedAt: new Date('2026-02-05') },
    }),
  ])

  // Activities
  await Promise.all([
    prisma.activity.create({ data: { type: 'MEETING', subject: 'Demo MRP cho L-ERP', description: 'Demo toàn bộ module MRP, BOM, Quality', contactId: contacts[0].id, companyId: companies[0].id, dealId: deals[0].id, userId: user.id, completedAt: new Date('2026-02-10'), isCompleted: true, duration: 90 } }),
    prisma.activity.create({ data: { type: 'CALL', subject: 'Follow up Thành Công', description: 'Gọi xác nhận proposal', contactId: contacts[1].id, dealId: deals[1].id, userId: user.id, completedAt: new Date('2026-02-12'), isCompleted: true, duration: 30 } }),
    prisma.activity.create({ data: { type: 'EMAIL', subject: 'Gửi proposal FPT', contactId: contacts[2].id, dealId: deals[2].id, userId: user2.id, completedAt: new Date('2026-02-14'), isCompleted: true } }),
    prisma.activity.create({ data: { type: 'TASK', subject: 'Chuẩn bị báo giá Vinamilk', dueAt: new Date('2026-02-20'), dealId: deals[3].id, userId: user.id } }),
    prisma.activity.create({ data: { type: 'DEMO', subject: 'Demo CRM cho FPT lần 2', dueAt: new Date('2026-02-25'), contactId: contacts[2].id, dealId: deals[2].id, userId: user2.id } }),
    prisma.activity.create({ data: { type: 'FOLLOW_UP', subject: 'Check lại L-ERP sau negotiation', dueAt: new Date('2026-02-18'), contactId: contacts[0].id, dealId: deals[0].id, userId: user.id } }),
    prisma.activity.create({ data: { type: 'LUNCH', subject: 'Ăn trưa với Mai - Hòa Phát', contactId: contacts[4].id, userId: user2.id, completedAt: new Date('2026-02-08'), isCompleted: true, duration: 60 } }),
    prisma.activity.create({ data: { type: 'NOTE', subject: 'Ghi chú: Vinamilk quan tâm AI forecasting', description: 'Cần demo riêng module AI demand forecast', companyId: companies[3].id, userId: user.id } }),
  ])

  // Products
  const products = await Promise.all([
    prisma.product.create({ data: { name: 'L-ERP Enterprise - MRP', sku: 'L-ERP MRP-001', unitPrice: 500000000, category: 'SOFTWARE', description: 'Module quản lý sản xuất' } }),
    prisma.product.create({ data: { name: 'L-ERP Enterprise - HRM', sku: 'L-ERP HRM-001', unitPrice: 350000000, category: 'SOFTWARE', description: 'Module quản lý nhân sự' } }),
    prisma.product.create({ data: { name: 'L-ERP Enterprise - OTB', sku: 'RTR-OTB-001', unitPrice: 400000000, category: 'SOFTWARE', description: 'Module Open-to-Buy' } }),
    prisma.product.create({ data: { name: 'L-ERP Enterprise - CRM', sku: 'L-ERP CRM-001', unitPrice: 450000000, category: 'SOFTWARE', description: 'Module quản lý khách hàng' } }),
    prisma.product.create({ data: { name: 'L-ERP Sheets', sku: 'RTR-SHEETS-001', unitPrice: 200000000, category: 'SOFTWARE', description: 'Bảng tính AI' } }),
    prisma.product.create({ data: { name: 'Tùy chỉnh & Tích hợp', sku: 'RTR-CUSTOM-001', unitPrice: 100000000, unit: 'giờ', category: 'MAINTENANCE', description: 'Dịch vụ tùy chỉnh' } }),
  ])

  // Quotes
  await prisma.quote.create({
    data: {
      quoteNumber: 'QUO-2026-0001',
      status: 'SENT',
      validUntil: new Date('2026-03-15'),
      subtotal: 2500000000,
      taxPercent: 10,
      taxAmount: 250000000,
      total: 2750000000,
      contactId: contacts[0].id,
      companyId: companies[0].id,
      dealId: deals[0].id,
      createdById: user.id,
      terms: 'Thanh toán 30% khi ký hợp đồng, 70% khi go-live',
      items: {
        create: [
          { quantity: 1, unitPrice: 500000000, total: 500000000, productId: products[0].id, sortOrder: 0 },
          { quantity: 1, unitPrice: 400000000, total: 400000000, productId: products[2].id, sortOrder: 1 },
          { quantity: 1, unitPrice: 450000000, total: 450000000, productId: products[3].id, sortOrder: 2 },
          { quantity: 1, unitPrice: 350000000, total: 350000000, productId: products[1].id, sortOrder: 3 },
          { quantity: 8, unitPrice: 100000000, total: 800000000, productId: products[5].id, sortOrder: 4, description: '8 giờ tùy chỉnh' },
        ],
      },
    },
  })

  // ── Seed default exchange rates ─────────────────────────────────
  const currencies = [
    { currency: 'VND', symbol: '₫', name: 'Việt Nam Đồng', rateToBase: 1, isBase: true, isActive: true },
    { currency: 'USD', symbol: '$', name: 'US Dollar', rateToBase: 0.000039, isBase: false, isActive: true },
    { currency: 'EUR', symbol: '€', name: 'Euro', rateToBase: 0.000036, isBase: false, isActive: true },
    { currency: 'AED', symbol: 'د.إ', name: 'UAE Dirham', rateToBase: 0.000145, isBase: false, isActive: true },
    { currency: 'INR', symbol: '₹', name: 'Indian Rupee', rateToBase: 0.0033, isBase: false, isActive: true },
  ]
  for (const c of currencies) {
    await prisma.exchangeRate.upsert({
      where: { currency: c.currency },
      update: {},
      create: c,
    })
  }

  // ── Seed L-ERP Product Products ──────────────────────────────────────
  const productProducts = await Promise.all([
    prisma.product.upsert({ where: { sku: 'RTR-HERA-BASE' }, update: {}, create: { name: 'Hera Base Product', sku: 'RTR-HERA-BASE', unitPrice: 18000, currency: 'USD', category: 'DRONE', description: 'Hera multi-rotor product platform' } }),
    prisma.product.upsert({ where: { sku: 'RTR-VS-DUAL' }, update: {}, create: { name: 'VianSight Dual Cam', sku: 'RTR-VS-DUAL', unitPrice: 4500, currency: 'USD', category: 'PAYLOAD', description: 'Dual camera payload with thermal + RGB' } }),
    prisma.product.upsert({ where: { sku: 'RTR-M61-A7R4' }, update: {}, create: { name: 'M61 Sony A7R4', sku: 'RTR-M61-A7R4', unitPrice: 3800, currency: 'USD', category: 'CAMERA', description: 'High-resolution mapping camera' } }),
    prisma.product.upsert({ where: { sku: 'RTR-PH1-P3' }, update: {}, create: { name: 'Phase One P3', sku: 'RTR-PH1-P3', unitPrice: 8500, currency: 'USD', category: 'CAMERA', description: 'Medium format aerial camera (5.7lb)' } }),
    prisma.product.upsert({ where: { sku: 'RTR-LIDAR-RG' }, update: {}, create: { name: 'Lidar RIEGL', sku: 'RTR-LIDAR-RG', unitPrice: 12000, currency: 'USD', category: 'PAYLOAD', description: 'Survey-grade LiDAR sensor' } }),
    prisma.product.upsert({ where: { sku: 'RTR-SPOT-01' }, update: {}, create: { name: 'Spotlight', sku: 'RTR-SPOT-01', unitPrice: 800, currency: 'USD', category: 'ACCESSORY', description: 'High-intensity search spotlight' } }),
    prisma.product.upsert({ where: { sku: 'RTR-SAR-KIT' }, update: {}, create: { name: 'SAR Kit', sku: 'RTR-SAR-KIT', unitPrice: 1200, currency: 'USD', category: 'ACCESSORY', description: 'Search and rescue accessory kit' } }),
    prisma.product.upsert({ where: { sku: 'RTR-TRN-BAS' }, update: {}, create: { name: 'Training Basic (3d)', sku: 'RTR-TRN-BAS', unitPrice: 2500, currency: 'USD', category: 'TRAINING', description: '3-day basic pilot training' } }),
    prisma.product.upsert({ where: { sku: 'RTR-TRN-ADV' }, update: {}, create: { name: 'Training Advanced (5d)', sku: 'RTR-TRN-ADV', unitPrice: 4500, currency: 'USD', category: 'TRAINING', description: '5-day advanced operations training' } }),
    prisma.product.upsert({ where: { sku: 'RTR-TRN-MIL' }, update: {}, create: { name: 'Training Military (5d)', sku: 'RTR-TRN-MIL', unitPrice: 6000, currency: 'USD', category: 'TRAINING', description: '5-day military operations training', itar: true } }),
    prisma.product.upsert({ where: { sku: 'RTR-MNT-1Y' }, update: {}, create: { name: 'Maintenance 1yr', sku: 'RTR-MNT-1Y', unitPrice: 3000, currency: 'USD', category: 'MAINTENANCE', description: '1-year maintenance contract' } }),
    prisma.product.upsert({ where: { sku: 'RTR-MNT-3Y' }, update: {}, create: { name: 'Maintenance 3yr', sku: 'RTR-MNT-3Y', unitPrice: 7500, currency: 'USD', category: 'MAINTENANCE', description: '3-year maintenance contract' } }),
    prisma.product.upsert({ where: { sku: 'RTR-MNT-5Y' }, update: {}, create: { name: 'Maintenance 5yr', sku: 'RTR-MNT-5Y', unitPrice: 11000, currency: 'USD', category: 'MAINTENANCE', description: '5-year maintenance contract' } }),
    prisma.product.upsert({ where: { sku: 'RTR-AI-VIS' }, update: {}, create: { name: 'AI Vision Module', sku: 'RTR-AI-VIS', unitPrice: 5000, currency: 'USD', category: 'SOFTWARE', description: 'AI-powered object detection and tracking' } }),
    prisma.product.upsert({ where: { sku: 'RTR-BAT-EXT' }, update: {}, create: { name: 'Extended Battery', sku: 'RTR-BAT-EXT', unitPrice: 1500, currency: 'USD', category: 'SPARE_PART', description: 'Extended flight time battery pack' } }),
  ])

  // Index by SKU for easy reference
  const dp = Object.fromEntries(productProducts.map((p) => [p.sku!, p]))

  // ── Seed Bundles ────────────────────────────────────────────────────
  type BundleItemDef = { sku: string; qty: number; isRequired?: boolean }
  const bundleDefs: Array<{ name: string; sku: string; bundleType: 'PACKAGE' | 'KIT' | 'SERVICE_PLAN'; basePrice: number; items: BundleItemDef[] }> = [
    { name: 'Hera Law Enforcement Package', sku: 'RTR-PKG-LAW', bundleType: 'PACKAGE', basePrice: 35000, items: [
      { sku: 'RTR-HERA-BASE', qty: 1 }, { sku: 'RTR-VS-DUAL', qty: 1 }, { sku: 'RTR-SPOT-01', qty: 1 },
      { sku: 'RTR-TRN-BAS', qty: 1 }, { sku: 'RTR-MNT-1Y', qty: 1 },
    ]},
    { name: 'Hera SAR Package', sku: 'RTR-PKG-SAR', bundleType: 'PACKAGE', basePrice: 42000, items: [
      { sku: 'RTR-HERA-BASE', qty: 1 }, { sku: 'RTR-VS-DUAL', qty: 1 }, { sku: 'RTR-SPOT-01', qty: 1 },
      { sku: 'RTR-SAR-KIT', qty: 1 }, { sku: 'RTR-TRN-ADV', qty: 1 }, { sku: 'RTR-MNT-1Y', qty: 1 },
    ]},
    { name: 'Hera Survey Package', sku: 'RTR-PKG-SRV', bundleType: 'PACKAGE', basePrice: 55000, items: [
      { sku: 'RTR-HERA-BASE', qty: 1 }, { sku: 'RTR-M61-A7R4', qty: 1 }, { sku: 'RTR-LIDAR-RG', qty: 1 },
      { sku: 'RTR-BAT-EXT', qty: 1 }, { sku: 'RTR-TRN-BAS', qty: 1 },
    ]},
    { name: 'Hera Military Package', sku: 'RTR-PKG-MIL', bundleType: 'PACKAGE', basePrice: 75000, items: [
      { sku: 'RTR-HERA-BASE', qty: 1 }, { sku: 'RTR-VS-DUAL', qty: 1 }, { sku: 'RTR-AI-VIS', qty: 1 },
      { sku: 'RTR-TRN-MIL', qty: 1 }, { sku: 'RTR-MNT-3Y', qty: 1 },
    ]},
    { name: 'Annual Service Plan', sku: 'RTR-SVC-ANN', bundleType: 'SERVICE_PLAN', basePrice: 8500, items: [
      { sku: 'RTR-MNT-1Y', qty: 1, isRequired: true }, { sku: 'RTR-TRN-BAS', qty: 1, isRequired: false },
    ]},
  ]

  for (const bd of bundleDefs) {
    await prisma.productBundle.upsert({
      where: { sku: bd.sku },
      update: {},
      create: {
        name: bd.name,
        sku: bd.sku,
        bundleType: bd.bundleType,
        basePrice: bd.basePrice,
        currency: 'USD',
        items: {
          create: bd.items.map((item, idx) => ({
            productId: dp[item.sku].id,
            quantity: item.qty,
            isRequired: item.isRequired !== false,
            sortOrder: idx,
          })),
        },
      },
    })
  }

  // ── Seed Compatibility Rules ────────────────────────────────────────
  const compatRules = [
    { from: 'RTR-PH1-P3', to: 'RTR-LIDAR-RG', type: 'INCOMPATIBLE' as const, notes: 'Combined weight exceeds payload limit' },
    { from: 'RTR-LIDAR-RG', to: 'RTR-BAT-EXT', type: 'REQUIRES' as const, notes: 'Lidar requires extended battery for adequate flight time' },
    { from: 'RTR-TRN-MIL', to: 'RTR-HERA-BASE', type: 'REQUIRES' as const, notes: 'Military training requires government pricing tier' },
    { from: 'RTR-VS-DUAL', to: 'RTR-M61-A7R4', type: 'COMPATIBLE' as const, notes: 'Can mount simultaneously on different gimbal points' },
    { from: 'RTR-VS-DUAL', to: 'RTR-PH1-P3', type: 'COMPATIBLE' as const, notes: null },
    { from: 'RTR-AI-VIS', to: 'RTR-VS-DUAL', type: 'REQUIRES' as const, notes: 'AI Vision requires VianSight for input feed' },
  ]

  for (const rule of compatRules) {
    const fromId = dp[rule.from]?.id
    const toId = dp[rule.to]?.id
    if (fromId && toId) {
      await prisma.productCompatibility.upsert({
        where: { productId_relatedProductId: { productId: fromId, relatedProductId: toId } },
        update: {},
        create: { productId: fromId, relatedProductId: toId, type: rule.type, notes: rule.notes },
      })
    }
  }

  // ── Seed Pricing Tiers ──────────────────────────────────────────────
  // Products: GOV=1.0, COM=1.0, ACA=0.75, PARTNER=0.85
  for (const prod of productProducts) {
    // Military training: Government only
    const tiers = prod.sku === 'RTR-TRN-MIL'
      ? [{ tier: 'GOVERNMENT' as const, mult: 1.0 }]
      : [
          { tier: 'GOVERNMENT' as const, mult: 1.0 },
          { tier: 'COMMERCIAL' as const, mult: 1.0 },
          { tier: 'ACADEMIC' as const, mult: 0.75 },
          { tier: 'PARTNER' as const, mult: 0.85 },
        ]

    for (const t of tiers) {
      await prisma.pricingTier.upsert({
        where: { productId_tier: { productId: prod.id, tier: t.tier } },
        update: {},
        create: { productId: prod.id, tier: t.tier, priceMultiplier: t.mult },
      })
    }
  }

  // Bundles: GOV=1.0, COM=1.05, ACA=0.70, PARTNER=0.80
  const allBundles = await prisma.productBundle.findMany()
  for (const bundle of allBundles) {
    const bundleTiers = [
      { tier: 'GOVERNMENT' as const, mult: 1.0 },
      { tier: 'COMMERCIAL' as const, mult: 1.05 },
      { tier: 'ACADEMIC' as const, mult: 0.70 },
      { tier: 'PARTNER' as const, mult: 0.80 },
    ]
    for (const t of bundleTiers) {
      await prisma.pricingTier.upsert({
        where: { bundleId_tier: { bundleId: bundle.id, tier: t.tier } },
        update: {},
        create: { bundleId: bundle.id, tier: t.tier, priceMultiplier: t.mult },
      })
    }
  }

  // ── Seed default SLA configs ─────────────────────────────────────
  const slaDefaults = [
    { priority: 'URGENT', firstResponseHours: 1, resolutionHours: 4 },
    { priority: 'HIGH', firstResponseHours: 4, resolutionHours: 24 },
    { priority: 'MEDIUM', firstResponseHours: 8, resolutionHours: 48 },
    { priority: 'LOW', firstResponseHours: 24, resolutionHours: 72 },
  ]
  for (const sla of slaDefaults) {
    await prisma.slaConfig.upsert({
      where: { priority: sla.priority },
      update: {},
      create: sla,
    })
  }

  // ── Partners ────────────────────────────────────────────────
  // Create partner companies first, then partner records
  const rmusCompany = await prisma.company.findFirst({ where: { domain: 'rframemus.com' } })
    ?? await prisma.company.create({
      data: {
        name: 'RMUS (Robotic Material Unmanned Systems)',
        domain: 'rframemus.com',
        industry: 'Defense & Unmanned Systems',
        size: 'MEDIUM',
        country: 'US',
        city: 'San Diego',
        province: 'California',
        ownerId: user.id,
      },
    })

  const rjmCompany = await prisma.company.findFirst({ where: { domain: 'rjmprecision.com' } })
    ?? await prisma.company.create({
      data: {
        name: 'RJM Precision',
        domain: 'rjmprecision.com',
        industry: 'Precision Manufacturing',
        size: 'SMALL',
        country: 'US',
        city: 'Austin',
        province: 'Texas',
        ownerId: user.id,
      },
    })

  // Partner has @@unique([companyId]) so upsert works
  const rmusPartner = await prisma.partner.upsert({
    where: { companyId: rmusCompany.id },
    update: {},
    create: {
      companyId: rmusCompany.id,
      partnerType: 'RESELLER',
      certificationLevel: 'GOLD',
      territory: 'US',
      commissionRate: 15,
      contractStartDate: new Date('2024-01-01'),
      contractEndDate: new Date('2026-12-31'),
      notes: 'Primary US channel partner for Hera product platform. Gold tier with exclusive territory rights.',
    },
  })

  const rjmPartner = await prisma.partner.upsert({
    where: { companyId: rjmCompany.id },
    update: {},
    create: {
      companyId: rjmCompany.id,
      partnerType: 'INTEGRATOR',
      certificationLevel: 'SILVER',
      territory: 'US',
      commissionRate: 12,
      contractStartDate: new Date('2024-06-01'),
      contractEndDate: new Date('2025-12-31'),
      notes: 'Precision payload integration partner. Specializes in custom sensor integration for government contracts.',
    },
  })

  console.log(`  Partners: 2 (RMUS Gold 15%, RJM Silver 12%)`)

  // ── International demo companies ────────────────────────
  const intlCompanies = await Promise.all([
    prisma.company.findFirst({ where: { domain: 'ids-defence.in' } })
      ?? prisma.company.create({
        data: {
          name: 'India Defence Solutions',
          domain: 'ids-defence.in',
          industry: 'Defense & Aerospace',
          size: 'LARGE',
          country: 'IN',
          city: 'New Delhi',
          ownerId: user.id,
        },
      }),
    prisma.company.findFirst({ where: { domain: 'adaviation.ae' } })
      ?? prisma.company.create({
        data: {
          name: 'Abu Dhabi Aviation',
          domain: 'adaviation.ae',
          industry: 'Aviation',
          size: 'LARGE',
          country: 'AE',
          city: 'Abu Dhabi',
          ownerId: user2.id,
        },
      }),
    prisma.company.findFirst({ where: { domain: 'vnpt-tech.vn' } })
      ?? prisma.company.create({
        data: {
          name: 'VNPT Technology',
          domain: 'vnpt-tech.vn',
          industry: 'Công nghệ viễn thông',
          size: 'ENTERPRISE',
          country: 'VN',
          city: 'Hà Nội',
          province: 'Hà Nội',
          ownerId: user.id,
        },
      }),
  ])
  console.log(`  International companies: ${intlCompanies.length}`)

  console.log('✅ Seed data created successfully')
  console.log(`  Users: 2`)
  console.log(`  Companies: ${companies.length}`)
  console.log(`  Contacts: ${contacts.length}`)
  console.log(`  Pipeline stages: ${stages.length}`)
  console.log(`  Deals: ${deals.length}`)
  console.log(`  Products: ${products.length + productProducts.length}`)
  console.log(`  Product products: ${productProducts.length}`)
  console.log(`  Bundles: ${bundleDefs.length}`)
  console.log(`  Compatibility rules: ${compatRules.length}`)
  console.log(`  Currencies: ${currencies.length}`)
  console.log(`  SLA configs: ${slaDefaults.length}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
