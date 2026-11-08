// ============================================================================
// L-ERP OTB Planning — Rich Data Seed
// Populates ALL tables with realistic luxury fashion retail data
// Run: npx ts-node prisma/seed-rich.ts
// ============================================================================

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function d(n: number): Prisma.Decimal {
  return new Prisma.Decimal(n);
}

function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randDec(min: number, max: number, decimals = 2): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('');
  console.log('==========================================================');
  console.log('  L-ERP OTB — Rich Data Seeder');
  console.log('  Populating all tables with luxury fashion retail data');
  console.log('==========================================================');
  console.log('');

  // ─── 0. READ EXISTING IDS ──────────────────────────────────────────────

  console.log('📖 Reading existing records...');

  const storeREX = await prisma.store.findUniqueOrThrow({ where: { code: 'REX' } });
  const storeTTP = await prisma.store.findUniqueOrThrow({ where: { code: 'TTP' } });
  const brandFER = await prisma.groupBrand.findUniqueOrThrow({ where: { code: 'FER' } });
  const brandBUR = await prisma.groupBrand.findUniqueOrThrow({ where: { code: 'BUR' } });
  const brandGUC = await prisma.groupBrand.findUniqueOrThrow({ where: { code: 'GUC' } });
  const brandPRA = await prisma.groupBrand.findUniqueOrThrow({ where: { code: 'PRA' } });

  const collCarryOver = await prisma.seasonType.findUniqueOrThrow({ where: { name: 'Carry Over' } });
  const collSeasonal  = await prisma.seasonType.findUniqueOrThrow({ where: { name: 'Seasonal' } });
  const genderF = await prisma.gender.findUniqueOrThrow({ where: { name: 'Female' } });
  const genderM = await prisma.gender.findUniqueOrThrow({ where: { name: 'Male' } });

  const catWomenRtw    = await prisma.category.findFirstOrThrow({ where: { id: 'women_rtw' } });
  const catWomenHardAcc = await prisma.category.findFirstOrThrow({ where: { id: 'women_hard_acc' } });
  const catWomenOthers = await prisma.category.findFirstOrThrow({ where: { id: 'women_others' } });
  const catMenRtw      = await prisma.category.findFirstOrThrow({ where: { id: 'men_rtw' } });
  const catMenAcc      = await prisma.category.findFirstOrThrow({ where: { id: 'men_acc' } });

  const subW_outerwear = await prisma.subCategory.findFirstOrThrow({ where: { id: 'w_outerwear' } });
  const subW_tops      = await prisma.subCategory.findFirstOrThrow({ where: { id: 'w_tops' } });
  const subW_dresses   = await prisma.subCategory.findFirstOrThrow({ where: { id: 'w_dresses' } });
  const subW_bags      = await prisma.subCategory.findFirstOrThrow({ where: { id: 'w_bags' } });
  const subW_slg       = await prisma.subCategory.findFirstOrThrow({ where: { id: 'w_slg' } });
  const subW_shoes     = await prisma.subCategory.findFirstOrThrow({ where: { id: 'w_shoes' } });
  const subM_outerwear = await prisma.subCategory.findFirstOrThrow({ where: { id: 'm_outerwear' } });
  const subM_tops      = await prisma.subCategory.findFirstOrThrow({ where: { id: 'm_tops' } });
  const subM_bags      = await prisma.subCategory.findFirstOrThrow({ where: { id: 'm_bags' } });
  const subM_slg       = await prisma.subCategory.findFirstOrThrow({ where: { id: 'm_slg' } });

  const userMerch   = await prisma.user.findUniqueOrThrow({ where: { email: 'merch@your-domain.com' } });
  const userBuyer   = await prisma.user.findUniqueOrThrow({ where: { email: 'buyer@your-domain.com' } });
  const userManager = await prisma.user.findUniqueOrThrow({ where: { email: 'manager@your-domain.com' } });
  const userFinance = await prisma.user.findUniqueOrThrow({ where: { email: 'finance@your-domain.com' } });

  console.log('  ✅ All existing records loaded\n');

  // ─── 0b. CLEAN TABLES (idempotent) ─────────────────────

  console.log('🧹 Cleaning tables for idempotent re-run...');

  await prisma.productAllocation.deleteMany();
  await prisma.proposalProduct.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.planningDetail.deleteMany();
  await prisma.planningVersion.deleteMany();
  await prisma.budgetDetail.deleteMany();
  // Delete only budgets we will recreate (keep existing ones if any)
  await prisma.budget.deleteMany({
    where: {
      budgetCode: {
        in: [
          'BUD-FER-SS-Pre-2026', 'BUD-FER-SS-Main-2026',
          'BUD-BUR-FW-Pre-2026', 'BUD-GUC-SS-Pre-2026',
          'BUD-PRA-FW-Main-2026', 'BUD-FER-FW-Pre-2026',
        ],
      },
    },
  });

  console.log('  ✅ Cleaned\n');

  // ======================================================================
  // 1. ADDITIONAL SKU CATALOG (~35 new SKUs)
  // ======================================================================

  console.log('🏷️  Creating additional SKU catalog entries...');

  const newSkus = [
    // ── FERRAGAMO WOMEN'S RTW ──
    { skuCode: 'FER-W-OW-001', productName: 'GANCINI BELTED COAT', productType: 'W OUTERWEAR', theme: 'SEPTEMBER (09)', color: 'CAMEL', composition: '80% WOOL 20% CASHMERE', srp: 89000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    { skuCode: 'FER-W-OW-002', productName: 'DOUBLE-BREASTED TRENCH', productType: 'W OUTERWEAR', theme: 'OCTOBER (10)', color: 'HONEY', composition: '100% COTTON', srp: 75000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-W-OW-003', productName: 'CAPE PONCHO CASHMERE', productType: 'W OUTERWEAR', theme: 'NOVEMBER (11)', color: 'IVORY', composition: '80% WOOL 20% CASHMERE', srp: 95000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    { skuCode: 'FER-W-TP-001', productName: 'SILK BOW BLOUSE', productType: 'W TOPS', theme: 'AUGUST (08)', color: 'DUSTY PINK', composition: '100% SILK', srp: 32000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-W-TP-002', productName: 'GANCINI KNIT TOP', productType: 'W TOPS', theme: 'SEPTEMBER (09)', color: 'BLACK', composition: '80% WOOL 20% CASHMERE', srp: 28500000, brandId: brandFER.id, seasonGroupId: 'FW' },
    { skuCode: 'FER-W-TP-003', productName: 'PRINTED POPLIN SHIRT', productType: 'W TOPS', theme: 'OCTOBER (10)', color: 'FOREST GREEN', composition: '100% COTTON', srp: 24000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-W-DR-001', productName: 'WRAP DRESS CREPE', productType: 'W DRESSES', theme: 'SEPTEMBER (09)', color: 'WINE RED', composition: '100% SILK', srp: 52000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-W-DR-002', productName: 'MIDI DRESS PLISSE', productType: 'W DRESSES', theme: 'OCTOBER (10)', color: 'EMERALD', composition: '100% POLYAMIDE', srp: 48000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    { skuCode: 'FER-W-DR-003', productName: 'COCKTAIL DRESS SATIN', productType: 'W DRESSES', theme: 'NOVEMBER (11)', color: 'BURGUNDY', composition: '100% SILK', srp: 65000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    // ── FERRAGAMO WOMEN'S BAGS ──
    { skuCode: 'FER-W-BG-001', productName: 'VARA BOW TOTE', productType: 'W BAGS', theme: 'AUGUST (08)', color: 'BLACK', composition: '100% LEATHER', srp: 85000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-W-BG-002', productName: 'TRIFOLIO CROSSBODY', productType: 'W BAGS', theme: 'SEPTEMBER (09)', color: 'DUSTY PINK', composition: '100% LEATHER', srp: 62000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-W-BG-003', productName: 'GANCINI CLUTCH', productType: 'W BAGS', theme: 'OCTOBER (10)', color: 'WINE RED', composition: '100% LEATHER', srp: 45000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    { skuCode: 'FER-W-BG-004', productName: 'STUDIO TOP HANDLE', productType: 'W BAGS', theme: 'NOVEMBER (11)', color: 'HONEY', composition: '100% LEATHER', srp: 98000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    { skuCode: 'FER-W-BG-005', productName: 'WANDA MINI BAG', productType: 'W BAGS', theme: 'DECEMBER (12)', color: 'IVORY', composition: 'CANVAS/LEATHER', srp: 42000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    // ── FERRAGAMO WOMEN'S SLG ──
    { skuCode: 'FER-W-SL-001', productName: 'VARA BOW WALLET', productType: 'W SLG', theme: 'AUGUST (08)', color: 'BLACK', composition: '100% LEATHER', srp: 18000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-W-SL-002', productName: 'GANCINI CARD HOLDER', productType: 'W SLG', theme: 'SEPTEMBER (09)', color: 'DUSTY PINK', composition: '100% LEATHER', srp: 12000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-W-SL-003', productName: 'ZIP AROUND WALLET', productType: 'W SLG', theme: 'OCTOBER (10)', color: 'BURGUNDY', composition: '100% LEATHER', srp: 22000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    // ── FERRAGAMO WOMEN'S SHOES ──
    { skuCode: 'FER-W-SH-001', productName: 'VARA BOW PUMP', productType: 'W SHOES', theme: 'AUGUST (08)', color: 'BLACK', composition: '100% LEATHER', srp: 28000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-W-SH-002', productName: 'VARINA BALLET FLAT', productType: 'W SHOES', theme: 'SEPTEMBER (09)', color: 'HONEY', composition: '100% LEATHER', srp: 25000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-W-SH-003', productName: 'GANCINI SANDAL', productType: 'W SHOES', theme: 'OCTOBER (10)', color: 'TAN', composition: '100% LEATHER', srp: 32000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    { skuCode: 'FER-W-SH-004', productName: 'PLATFORM LOAFER', productType: 'W SHOES', theme: 'NOVEMBER (11)', color: 'WINE RED', composition: '100% LEATHER', srp: 38000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    // ── FERRAGAMO MEN'S ──
    { skuCode: 'FER-M-OW-001', productName: 'GANCINI BOMBER JACKET', productType: 'M OUTERWEAR', theme: 'SEPTEMBER (09)', color: 'NAVY', composition: '100% NYLON', srp: 55000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    { skuCode: 'FER-M-OW-002', productName: 'WOOL OVERCOAT', productType: 'M OUTERWEAR', theme: 'OCTOBER (10)', color: 'GREY', composition: '80% WOOL 20% CASHMERE', srp: 78000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    { skuCode: 'FER-M-TP-001', productName: 'GANCINI POLO', productType: 'M TOPS', theme: 'AUGUST (08)', color: 'BLACK', composition: '100% COTTON', srp: 22000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-M-TP-002', productName: 'SILK DRESS SHIRT', productType: 'M TOPS', theme: 'SEPTEMBER (09)', color: 'IVORY', composition: '100% SILK', srp: 32000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-M-BG-001', productName: 'REVIVAL BRIEFCASE', productType: 'M BAGS', theme: 'OCTOBER (10)', color: 'BLACK', composition: '100% LEATHER', srp: 72000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    { skuCode: 'FER-M-BG-002', productName: 'GANCINI BACKPACK', productType: 'M BAGS', theme: 'NOVEMBER (11)', color: 'NAVY', composition: '100% NYLON', srp: 48000000, brandId: brandFER.id, seasonGroupId: 'FW' },
    { skuCode: 'FER-M-SL-001', productName: 'GANCINI BIFOLD WALLET', productType: 'M SLG', theme: 'AUGUST (08)', color: 'BLACK', composition: '100% LEATHER', srp: 15000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    { skuCode: 'FER-M-SL-002', productName: 'CARD CASE EMBOSSED', productType: 'M SLG', theme: 'SEPTEMBER (09)', color: 'TAN', composition: '100% LEATHER', srp: 10000000, brandId: brandFER.id, seasonGroupId: 'SS' },
    // ── BURBERRY WOMEN'S ──
    { skuCode: 'BUR-W-OW-001', productName: 'CHECK QUILTED JACKET', productType: 'W OUTERWEAR', theme: 'OCTOBER (10)', color: 'CAMEL', composition: '100% POLYAMIDE', srp: 68000000, brandId: brandBUR.id, seasonGroupId: 'FW' },
    { skuCode: 'BUR-W-BG-001', productName: 'POCKET BAG MEDIUM', productType: 'W BAGS', theme: 'SEPTEMBER (09)', color: 'TAN', composition: '100% LEATHER', srp: 78000000, brandId: brandBUR.id, seasonGroupId: 'SS' },
    { skuCode: 'BUR-W-BG-002', productName: 'NOTE CROSSBODY', productType: 'W BAGS', theme: 'OCTOBER (10)', color: 'BLACK', composition: 'CANVAS/LEATHER', srp: 52000000, brandId: brandBUR.id, seasonGroupId: 'FW' },
    { skuCode: 'BUR-W-SL-001', productName: 'CHECK CONTINENTAL WALLET', productType: 'W SLG', theme: 'AUGUST (08)', color: 'TAN', composition: 'CANVAS/LEATHER', srp: 19000000, brandId: brandBUR.id, seasonGroupId: 'SS' },
    // ── BURBERRY MEN'S ──
    { skuCode: 'BUR-M-OW-001', productName: 'QUILTED THERMOREGULATED JACKET', productType: 'M OUTERWEAR', theme: 'NOVEMBER (11)', color: 'BLACK', composition: '100% POLYAMIDE', srp: 62000000, brandId: brandBUR.id, seasonGroupId: 'FW' },
    { skuCode: 'BUR-M-TP-001', productName: 'CHECK COTTON POLO', productType: 'M TOPS', theme: 'AUGUST (08)', color: 'NAVY', composition: '100% COTTON', srp: 18000000, brandId: brandBUR.id, seasonGroupId: 'SS' },
    { skuCode: 'BUR-M-BG-001', productName: 'CHECK MESSENGER BAG', productType: 'M BAGS', theme: 'OCTOBER (10)', color: 'TAN', composition: 'CANVAS/LEATHER', srp: 48000000, brandId: brandBUR.id, seasonGroupId: 'FW' },
  ];

  for (const sku of newSkus) {
    await prisma.skuCatalog.upsert({
      where: { skuCode: sku.skuCode },
      update: {},
      create: sku,
    });
  }
  console.log(`  ✅ ${newSkus.length} additional SKUs created (total ~${15 + newSkus.length})\n`);

  // Reload all SKUs for later use
  const allSkus = await prisma.skuCatalog.findMany();
  const skuMap = new Map(allSkus.map(s => [s.skuCode, s]));

  // ======================================================================
  // 2. BUDGETS (6 new)
  // ======================================================================

  console.log('💰 Creating budgets...');

  const budgetDefs = [
    { budgetCode: 'BUD-FER-SS-Pre-2026',  groupBrandId: brandFER.id, seasonGroupId: 'SS', seasonType: 'pre',  fiscalYear: 2026, totalBudget: 5_000_000_000,  status: 'APPROVED' as const },
    { budgetCode: 'BUD-FER-SS-Main-2026', groupBrandId: brandFER.id, seasonGroupId: 'SS', seasonType: 'main', fiscalYear: 2026, totalBudget: 8_500_000_000,  status: 'APPROVED' as const },
    { budgetCode: 'BUD-BUR-FW-Pre-2026',  groupBrandId: brandBUR.id, seasonGroupId: 'FW', seasonType: 'pre',  fiscalYear: 2026, totalBudget: 6_200_000_000,  status: 'APPROVED' as const },
    { budgetCode: 'BUD-GUC-SS-Pre-2026',  groupBrandId: brandGUC.id, seasonGroupId: 'SS', seasonType: 'pre',  fiscalYear: 2026, totalBudget: 12_000_000_000, status: 'LEVEL1_APPROVED' as const },
    { budgetCode: 'BUD-PRA-FW-Main-2026', groupBrandId: brandPRA.id, seasonGroupId: 'FW', seasonType: 'main', fiscalYear: 2026, totalBudget: 7_800_000_000,  status: 'SUBMITTED' as const },
    { budgetCode: 'BUD-FER-FW-Pre-2026',  groupBrandId: brandFER.id, seasonGroupId: 'FW', seasonType: 'pre',  fiscalYear: 2026, totalBudget: 4_500_000_000,  status: 'APPROVED' as const },
  ];

  const budgets: Record<string, any> = {};
  const budgetDetails: Record<string, { rex: any; ttp: any }> = {};

  for (const bd of budgetDefs) {
    const budget = await prisma.budget.create({
      data: {
        ...bd,
        totalBudget: d(bd.totalBudget),
        createdById: userMerch.id,
      },
    });
    budgets[bd.budgetCode] = budget;

    // Budget Details: REX ~60%, TTP ~40%
    const rexPct = 0.60;
    const ttpPct = 0.40;
    const rexDetail = await prisma.budgetDetail.create({
      data: {
        budgetId: budget.id,
        storeId: storeREX.id,
        budgetAmount: d(Math.round(bd.totalBudget * rexPct)),
      },
    });
    const ttpDetail = await prisma.budgetDetail.create({
      data: {
        budgetId: budget.id,
        storeId: storeTTP.id,
        budgetAmount: d(Math.round(bd.totalBudget * ttpPct)),
      },
    });
    budgetDetails[bd.budgetCode] = { rex: rexDetail, ttp: ttpDetail };
  }

  console.log(`  ✅ ${budgetDefs.length} budgets with ${budgetDefs.length * 2} budget details created\n`);

  // ======================================================================
  // 3. PLANNING VERSIONS + DETAILS
  // ======================================================================

  console.log('📊 Creating planning versions and details...');

  const approvedBudgetCodes = [
    'BUD-FER-SS-Pre-2026', 'BUD-FER-SS-Main-2026',
    'BUD-BUR-FW-Pre-2026', 'BUD-FER-FW-Pre-2026',
  ];

  const planningVersions: Record<string, any> = {};

  for (const code of approvedBudgetCodes) {
    const budget = budgets[code];
    const details = budgetDetails[code];

    for (const storeEntry of [
      { key: 'rex', detail: details.rex, storeCode: 'REX' },
      { key: 'ttp', detail: details.ttp, storeCode: 'TTP' },
    ]) {
      const planCode = `PLN-${code}-${storeEntry.storeCode}-V1`;
      const pv = await prisma.planningVersion.create({
        data: {
          planningCode: planCode,
          budgetDetailId: storeEntry.detail.id,
          versionNumber: 1,
          versionName: `${code} ${storeEntry.storeCode} Version 1`,
          status: 'APPROVED',
          isFinal: true,
          createdById: userMerch.id,
        },
      });
      planningVersions[planCode] = pv;

      const budgetAmt = parseFloat(storeEntry.detail.budgetAmount.toString());

      // ── Collection dimension ──
      const collDetails = [
        { seasonTypeId: collCarryOver.id, pct: 0.40, label: 'Carry Over' },
        { seasonTypeId: collSeasonal.id, pct: 0.60, label: 'Seasonal' },
      ];
      for (const cd of collDetails) {
        await prisma.planningDetail.create({
          data: {
            planningVersionId: pv.id,
            dimensionType: 'collection',
            seasonTypeId: cd.seasonTypeId,
            lastSeasonSales: d(Math.round(budgetAmt * cd.pct * 0.92)),
            lastSeasonPct: d(cd.pct * 100),
            systemBuyPct: d(cd.pct * 100),
            userBuyPct: d(cd.pct * 100),
            otbValue: d(Math.round(budgetAmt * cd.pct)),
            variancePct: d(0),
          },
        });
      }

      // ── Gender dimension ──
      const genderDetails = [
        { genderId: genderF.id, pct: 0.60 },
        { genderId: genderM.id, pct: 0.40 },
      ];
      for (const gd of genderDetails) {
        await prisma.planningDetail.create({
          data: {
            planningVersionId: pv.id,
            dimensionType: 'gender',
            genderId: gd.genderId,
            lastSeasonSales: d(Math.round(budgetAmt * gd.pct * 0.88)),
            lastSeasonPct: d(gd.pct * 100),
            systemBuyPct: d(gd.pct * 100),
            userBuyPct: d(gd.pct * 100),
            otbValue: d(Math.round(budgetAmt * gd.pct)),
            variancePct: d(0),
          },
        });
      }

      // ── Category dimension ──
      const catDetails = [
        { categoryId: catWomenRtw.id, pct: 0.25 },
        { categoryId: catWomenHardAcc.id, pct: 0.20 },
        { categoryId: catWomenOthers.id, pct: 0.15 },
        { categoryId: catMenRtw.id, pct: 0.22 },
        { categoryId: catMenAcc.id, pct: 0.18 },
      ];
      for (const cat of catDetails) {
        await prisma.planningDetail.create({
          data: {
            planningVersionId: pv.id,
            dimensionType: 'category',
            categoryId: cat.categoryId,
            lastSeasonSales: d(Math.round(budgetAmt * cat.pct * 0.90)),
            lastSeasonPct: d(cat.pct * 100),
            systemBuyPct: d(cat.pct * 100),
            userBuyPct: d(cat.pct * 100),
            otbValue: d(Math.round(budgetAmt * cat.pct)),
            variancePct: d(0),
          },
        });
      }

      // ── Sub-category details (for Women's RTW breakdown) ──
      const subCatDetails = [
        { subCategoryId: subW_outerwear.id, categoryId: catWomenRtw.id, pct: 0.10 },
        { subCategoryId: subW_tops.id, categoryId: catWomenRtw.id, pct: 0.08 },
        { subCategoryId: subW_dresses.id, categoryId: catWomenRtw.id, pct: 0.07 },
        { subCategoryId: subW_bags.id, categoryId: catWomenHardAcc.id, pct: 0.12 },
        { subCategoryId: subW_slg.id, categoryId: catWomenHardAcc.id, pct: 0.08 },
        { subCategoryId: subM_outerwear.id, categoryId: catMenRtw.id, pct: 0.09 },
        { subCategoryId: subM_tops.id, categoryId: catMenRtw.id, pct: 0.07 },
        { subCategoryId: subM_bags.id, categoryId: catMenAcc.id, pct: 0.10 },
        { subCategoryId: subM_slg.id, categoryId: catMenAcc.id, pct: 0.05 },
      ];
      for (const sc of subCatDetails) {
        await prisma.planningDetail.create({
          data: {
            planningVersionId: pv.id,
            dimensionType: 'category',
            categoryId: sc.categoryId,
            subCategoryId: sc.subCategoryId,
            lastSeasonSales: d(Math.round(budgetAmt * sc.pct * 0.87)),
            lastSeasonPct: d(sc.pct * 100),
            systemBuyPct: d(sc.pct * 100),
            userBuyPct: d(sc.pct * 100),
            otbValue: d(Math.round(budgetAmt * sc.pct)),
            variancePct: d(0),
          },
        });
      }
    }
  }

  const pvCount = Object.keys(planningVersions).length;
  console.log(`  ✅ ${pvCount} planning versions with detailed breakdowns created\n`);

  // ======================================================================
  // 4. PROPOSALS WITH PRODUCTS
  // ======================================================================

  console.log('📋 Creating proposals with products...');

  // Helper to build a product row
  function buildProduct(
    skuCode: string, collection: string, gender: string,
    category: string, subCategory: string,
    unitCostPct: number, orderQty: number, customerTarget: string, sortOrder: number,
  ) {
    const sku = skuMap.get(skuCode);
    if (!sku) throw new Error(`SKU not found: ${skuCode}`);
    const srp = parseFloat(sku.srp.toString());
    const unitCost = Math.round(srp * unitCostPct);
    const totalValue = unitCost * orderQty;
    return {
      skuId: sku.id,
      skuCode: sku.skuCode,
      productName: sku.productName,
      collection,
      gender,
      category,
      subCategory,
      theme: sku.theme,
      color: sku.color,
      composition: sku.composition,
      unitCost: d(unitCost),
      srp: d(srp),
      orderQty,
      totalValue: d(totalValue),
      customerTarget,
      sortOrder,
    };
  }

  // ── Proposal 1: FER SS Pre 2026 - REX Womenswear (APPROVED) ──
  const budFerSSPre = budgets['BUD-FER-SS-Pre-2026'];
  const pvFerSSPreREX = planningVersions['PLN-BUD-FER-SS-Pre-2026-REX-V1'];

  const proposal1Products = [
    buildProduct('FER-W-OW-002', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Outerwear', 0.45, 8, 'VIP', 1),
    buildProduct('FER-W-TP-001', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Tops', 0.42, 12, 'New', 2),
    buildProduct('FER-W-TP-003', 'Carry Over', 'Female', "WOMEN'S RTW", 'W Tops', 0.43, 10, 'Existing', 3),
    buildProduct('FER-W-DR-001', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Dresses', 0.44, 6, 'VIP', 4),
    buildProduct('FER-W-BG-001', 'Carry Over', 'Female', 'WOMEN HARD ACCESSORIES', 'W Bags', 0.47, 10, 'VIP', 5),
    buildProduct('FER-W-BG-002', 'Seasonal', 'Female', 'WOMEN HARD ACCESSORIES', 'W Bags', 0.45, 8, 'Existing', 6),
    buildProduct('FER-W-BG-005', 'Seasonal', 'Female', 'WOMEN HARD ACCESSORIES', 'W Bags', 0.42, 15, 'New', 7),
    buildProduct('FER-W-SL-001', 'Carry Over', 'Female', 'WOMEN HARD ACCESSORIES', 'W SLG', 0.40, 15, 'New', 8),
    buildProduct('FER-W-SL-002', 'Seasonal', 'Female', 'WOMEN HARD ACCESSORIES', 'W SLG', 0.40, 12, 'Existing', 9),
    buildProduct('FER-W-SH-001', 'Carry Over', 'Female', 'OTHERS', "Women's Shoes", 0.43, 10, 'VIP', 10),
    buildProduct('FER-W-SH-002', 'Seasonal', 'Female', 'OTHERS', "Women's Shoes", 0.44, 8, 'Existing', 11),
    buildProduct('8116500', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Outerwear', 0.46, 5, 'VIP', 12),
  ];

  const p1TotalValue = proposal1Products.reduce((s, p) => s + parseFloat(p.totalValue.toString()), 0);
  const p1TotalQty = proposal1Products.reduce((s, p) => s + p.orderQty, 0);

  const proposal1 = await prisma.proposal.create({
    data: {
      ticketName: 'FER SS Pre 2026 - REX Womenswear',
      budgetId: budFerSSPre.id,
      planningVersionId: pvFerSSPreREX.id,
      status: 'APPROVED',
      totalSkuCount: proposal1Products.length,
      totalOrderQty: p1TotalQty,
      totalValue: d(p1TotalValue),
      createdById: userBuyer.id,
    },
  });

  for (const prod of proposal1Products) {
    const pp = await prisma.proposalProduct.create({
      data: { proposalId: proposal1.id, ...prod },
    });
    // Allocations: REX 60%, TTP 40%
    const rexQty = Math.ceil(prod.orderQty * 0.6);
    const ttpQty = prod.orderQty - rexQty;
    await prisma.productAllocation.createMany({
      data: [
        { proposalProductId: pp.id, storeId: storeREX.id, quantity: rexQty },
        { proposalProductId: pp.id, storeId: storeTTP.id, quantity: ttpQty },
      ],
    });
  }

  // ── Proposal 2: FER SS Pre 2026 - TTP Full Range (SUBMITTED) ──
  const pvFerSSPreTTP = planningVersions['PLN-BUD-FER-SS-Pre-2026-TTP-V1'];

  const proposal2Products = [
    buildProduct('FER-W-OW-002', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Outerwear', 0.45, 5, 'Existing', 1),
    buildProduct('FER-W-TP-001', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Tops', 0.42, 8, 'New', 2),
    buildProduct('FER-W-BG-001', 'Carry Over', 'Female', 'WOMEN HARD ACCESSORIES', 'W Bags', 0.47, 6, 'VIP', 3),
    buildProduct('FER-W-SL-001', 'Carry Over', 'Female', 'WOMEN HARD ACCESSORIES', 'W SLG', 0.40, 10, 'New', 4),
    buildProduct('FER-W-SH-001', 'Carry Over', 'Female', 'OTHERS', "Women's Shoes", 0.43, 6, 'Existing', 5),
    buildProduct('FER-M-TP-001', 'Seasonal', 'Male', "MEN'S RTW", 'M Tops', 0.42, 10, 'New', 6),
    buildProduct('FER-M-BG-001', 'Seasonal', 'Male', 'MEN ACCESSORIES', 'M Bags', 0.46, 4, 'VIP', 7),
    buildProduct('FER-M-SL-001', 'Carry Over', 'Male', 'MEN ACCESSORIES', 'M SLG', 0.40, 12, 'Existing', 8),
    buildProduct('FER-M-SL-002', 'Seasonal', 'Male', 'MEN ACCESSORIES', 'M SLG', 0.40, 10, 'New', 9),
    buildProduct('FER-W-DR-001', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Dresses', 0.44, 4, 'VIP', 10),
  ];

  const p2TotalValue = proposal2Products.reduce((s, p) => s + parseFloat(p.totalValue.toString()), 0);
  const p2TotalQty = proposal2Products.reduce((s, p) => s + p.orderQty, 0);

  const proposal2 = await prisma.proposal.create({
    data: {
      ticketName: 'FER SS Pre 2026 - TTP Full Range',
      budgetId: budFerSSPre.id,
      planningVersionId: pvFerSSPreTTP.id,
      status: 'SUBMITTED',
      totalSkuCount: proposal2Products.length,
      totalOrderQty: p2TotalQty,
      totalValue: d(p2TotalValue),
      createdById: userBuyer.id,
    },
  });

  for (const prod of proposal2Products) {
    const pp = await prisma.proposalProduct.create({
      data: { proposalId: proposal2.id, ...prod },
    });
    const rexQty = Math.ceil(prod.orderQty * 0.55);
    const ttpQty = prod.orderQty - rexQty;
    await prisma.productAllocation.createMany({
      data: [
        { proposalProductId: pp.id, storeId: storeREX.id, quantity: rexQty },
        { proposalProductId: pp.id, storeId: storeTTP.id, quantity: ttpQty },
      ],
    });
  }

  // ── Proposal 3: BUR FW Pre 2026 - REX Collection (LEVEL1_APPROVED) ──
  const budBurFWPre = budgets['BUD-BUR-FW-Pre-2026'];
  const pvBurFWPreREX = planningVersions['PLN-BUD-BUR-FW-Pre-2026-REX-V1'];

  const proposal3Products = [
    buildProduct('BUR-W-OW-001', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Outerwear', 0.45, 6, 'VIP', 1),
    buildProduct('8116500', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Outerwear', 0.46, 4, 'VIP', 2),
    buildProduct('8116501', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Outerwear', 0.48, 3, 'VIP', 3),
    buildProduct('BUR-W-BG-001', 'Seasonal', 'Female', 'WOMEN HARD ACCESSORIES', 'W Bags', 0.46, 5, 'Existing', 4),
    buildProduct('BUR-W-BG-002', 'Carry Over', 'Female', 'WOMEN HARD ACCESSORIES', 'W Bags', 0.44, 8, 'New', 5),
    buildProduct('BUR-W-SL-001', 'Carry Over', 'Female', 'WOMEN HARD ACCESSORIES', 'W SLG', 0.40, 10, 'New', 6),
    buildProduct('BUR-M-OW-001', 'Seasonal', 'Male', "MEN'S RTW", 'M Outerwear', 0.46, 5, 'Existing', 7),
    buildProduct('BUR-M-BG-001', 'Carry Over', 'Male', 'MEN ACCESSORIES', 'M Bags', 0.44, 6, 'New', 8),
  ];

  const p3TotalValue = proposal3Products.reduce((s, p) => s + parseFloat(p.totalValue.toString()), 0);
  const p3TotalQty = proposal3Products.reduce((s, p) => s + p.orderQty, 0);

  const proposal3 = await prisma.proposal.create({
    data: {
      ticketName: 'BUR FW Pre 2026 - REX Collection',
      budgetId: budBurFWPre.id,
      planningVersionId: pvBurFWPreREX.id,
      status: 'LEVEL1_APPROVED',
      totalSkuCount: proposal3Products.length,
      totalOrderQty: p3TotalQty,
      totalValue: d(p3TotalValue),
      createdById: userBuyer.id,
    },
  });

  for (const prod of proposal3Products) {
    const pp = await prisma.proposalProduct.create({
      data: { proposalId: proposal3.id, ...prod },
    });
    const rexQty = Math.ceil(prod.orderQty * 0.65);
    const ttpQty = prod.orderQty - rexQty;
    await prisma.productAllocation.createMany({
      data: [
        { proposalProductId: pp.id, storeId: storeREX.id, quantity: rexQty },
        { proposalProductId: pp.id, storeId: storeTTP.id, quantity: ttpQty },
      ],
    });
  }

  // ── Proposal 4: FER SS Main 2026 - REX Premium (DRAFT) ──
  const budFerSSMain = budgets['BUD-FER-SS-Main-2026'];
  const pvFerSSMainREX = planningVersions['PLN-BUD-FER-SS-Main-2026-REX-V1'];

  const proposal4Products = [
    buildProduct('FER-W-OW-001', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Outerwear', 0.46, 6, 'VIP', 1),
    buildProduct('FER-W-OW-002', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Outerwear', 0.45, 8, 'VIP', 2),
    buildProduct('FER-W-OW-003', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Outerwear', 0.47, 4, 'VIP', 3),
    buildProduct('FER-W-TP-001', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Tops', 0.42, 10, 'New', 4),
    buildProduct('FER-W-TP-002', 'Carry Over', 'Female', "WOMEN'S RTW", 'W Tops', 0.43, 8, 'Existing', 5),
    buildProduct('FER-W-DR-001', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Dresses', 0.44, 6, 'VIP', 6),
    buildProduct('FER-W-DR-002', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Dresses', 0.44, 5, 'Existing', 7),
    buildProduct('FER-W-DR-003', 'Seasonal', 'Female', "WOMEN'S RTW", 'W Dresses', 0.45, 4, 'VIP', 8),
    buildProduct('FER-W-BG-001', 'Carry Over', 'Female', 'WOMEN HARD ACCESSORIES', 'W Bags', 0.47, 8, 'VIP', 9),
    buildProduct('FER-W-BG-004', 'Seasonal', 'Female', 'WOMEN HARD ACCESSORIES', 'W Bags', 0.48, 5, 'VIP', 10),
    buildProduct('FER-W-SL-003', 'Seasonal', 'Female', 'WOMEN HARD ACCESSORIES', 'W SLG', 0.40, 12, 'Existing', 11),
    buildProduct('FER-M-OW-001', 'Seasonal', 'Male', "MEN'S RTW", 'M Outerwear', 0.45, 6, 'Existing', 12),
    buildProduct('FER-M-OW-002', 'Seasonal', 'Male', "MEN'S RTW", 'M Outerwear', 0.47, 4, 'VIP', 13),
    buildProduct('FER-M-BG-001', 'Seasonal', 'Male', 'MEN ACCESSORIES', 'M Bags', 0.46, 5, 'VIP', 14),
    buildProduct('FER-M-BG-002', 'Seasonal', 'Male', 'MEN ACCESSORIES', 'M Bags', 0.44, 7, 'New', 15),
  ];

  const p4TotalValue = proposal4Products.reduce((s, p) => s + parseFloat(p.totalValue.toString()), 0);
  const p4TotalQty = proposal4Products.reduce((s, p) => s + p.orderQty, 0);

  const proposal4 = await prisma.proposal.create({
    data: {
      ticketName: 'FER SS Main 2026 - REX Premium',
      budgetId: budFerSSMain.id,
      planningVersionId: pvFerSSMainREX.id,
      status: 'DRAFT',
      totalSkuCount: proposal4Products.length,
      totalOrderQty: p4TotalQty,
      totalValue: d(p4TotalValue),
      createdById: userBuyer.id,
    },
  });

  for (const prod of proposal4Products) {
    const pp = await prisma.proposalProduct.create({
      data: { proposalId: proposal4.id, ...prod },
    });
    const rexQty = Math.ceil(prod.orderQty * 0.6);
    const ttpQty = prod.orderQty - rexQty;
    await prisma.productAllocation.createMany({
      data: [
        { proposalProductId: pp.id, storeId: storeREX.id, quantity: rexQty },
        { proposalProductId: pp.id, storeId: storeTTP.id, quantity: ttpQty },
      ],
    });
  }

  console.log(`  ✅ 4 proposals created:`);
  console.log(`     P1: ${proposal1Products.length} products, ${(p1TotalValue / 1e9).toFixed(2)}B VND (APPROVED)`);
  console.log(`     P2: ${proposal2Products.length} products, ${(p2TotalValue / 1e9).toFixed(2)}B VND (SUBMITTED)`);
  console.log(`     P3: ${proposal3Products.length} products, ${(p3TotalValue / 1e9).toFixed(2)}B VND (LEVEL1_APPROVED)`);
  console.log(`     P4: ${proposal4Products.length} products, ${(p4TotalValue / 1e9).toFixed(2)}B VND (DRAFT)\n`);

  // ======================================================================
  // 5. APPROVALS
  // ======================================================================

  console.log('✅ Creating approval records...');

  const approvalRecords: Array<{
    entityType: string;
    entityId: string;
    level: number;
    deciderId: string;
    action: 'APPROVED' | 'REJECTED';
    comment: string;
    decidedAt: Date;
  }> = [];

  // Approved budgets: L1 (manager) + L2 (finance)
  for (const code of ['BUD-FER-SS-Pre-2026', 'BUD-FER-SS-Main-2026', 'BUD-BUR-FW-Pre-2026', 'BUD-FER-FW-Pre-2026']) {
    approvalRecords.push(
      {
        entityType: 'budget', entityId: budgets[code].id, level: 1,
        deciderId: userManager.id, action: 'APPROVED',
        comment: 'Budget allocation looks appropriate for the season.',
        decidedAt: daysAgo(rand(14, 21)),
      },
      {
        entityType: 'budget', entityId: budgets[code].id, level: 2,
        deciderId: userFinance.id, action: 'APPROVED',
        comment: 'Approved — within financial guidelines.',
        decidedAt: daysAgo(rand(7, 13)),
      },
    );
  }

  // LEVEL1_APPROVED budget: only L1
  approvalRecords.push({
    entityType: 'budget', entityId: budgets['BUD-GUC-SS-Pre-2026'].id, level: 1,
    deciderId: userManager.id, action: 'APPROVED',
    comment: 'Gucci allocation approved at L1. Pending finance review.',
    decidedAt: daysAgo(5),
  });

  // Approved planning versions
  for (const pvKey of Object.keys(planningVersions)) {
    approvalRecords.push(
      {
        entityType: 'planning', entityId: planningVersions[pvKey].id, level: 1,
        deciderId: userManager.id, action: 'APPROVED',
        comment: 'Planning splits are well balanced.',
        decidedAt: daysAgo(rand(10, 18)),
      },
      {
        entityType: 'planning', entityId: planningVersions[pvKey].id, level: 2,
        deciderId: userFinance.id, action: 'APPROVED',
        comment: 'Approved.',
        decidedAt: daysAgo(rand(5, 9)),
      },
    );
  }

  // Proposal 1 approvals (APPROVED)
  approvalRecords.push(
    {
      entityType: 'proposal', entityId: proposal1.id, level: 1,
      deciderId: userManager.id, action: 'APPROVED',
      comment: 'Excellent SKU selection for REX womenswear. Good mix of carry-over and seasonal.',
      decidedAt: daysAgo(6),
    },
    {
      entityType: 'proposal', entityId: proposal1.id, level: 2,
      deciderId: userFinance.id, action: 'APPROVED',
      comment: 'Total value within budget. Approved for ordering.',
      decidedAt: daysAgo(3),
    },
  );

  // Proposal 3 approvals (LEVEL1_APPROVED)
  approvalRecords.push({
    entityType: 'proposal', entityId: proposal3.id, level: 1,
    deciderId: userManager.id, action: 'APPROVED',
    comment: 'Burberry FW collection looks strong. Good outerwear focus for the season.',
    decidedAt: daysAgo(2),
  });

  for (const ar of approvalRecords) {
    await prisma.approval.create({ data: ar });
  }

  console.log(`  ✅ ${approvalRecords.length} approval records created\n`);

  // ======================================================================
  // SUMMARY
  // ======================================================================

  console.log('==========================================================');
  console.log('  SEED COMPLETE — Summary');
  console.log('==========================================================');
  console.log(`  SKUs:               ${allSkus.length} total (${newSkus.length} new)`);
  console.log(`  Budgets:            ${budgetDefs.length} (with ${budgetDefs.length * 2} budget details)`);
  console.log(`  Planning Versions:  ${pvCount} (with ${pvCount * 16} planning details)`);
  console.log(`  Proposals:          4 (with ${proposal1Products.length + proposal2Products.length + proposal3Products.length + proposal4Products.length} products)`);
  console.log(`  Product Allocations: ${(proposal1Products.length + proposal2Products.length + proposal3Products.length + proposal4Products.length) * 2}`);
  console.log(`  Approvals:          ${approvalRecords.length}`);
  console.log('==========================================================');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Rich seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
