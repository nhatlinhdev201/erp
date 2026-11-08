import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // 1. SUPER_ADMIN
  // SECURITY: fail-fast — NO default password fallback for production seeds.
  const rawPassword = process.env.SEED_ADMIN_PASSWORD
  if (!rawPassword) {
    throw new Error(
      'Missing SEED_ADMIN_PASSWORD environment variable (min 12 chars). ' +
      'Production seed refuses to create an admin with a known/default password.'
    )
  }
  if (rawPassword.length < 12) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 12 characters.')
  }
  const adminPassword = await bcrypt.hash(rawPassword, 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@vierp.com" },
    create: {
      email: "admin@vierp.com",
      password: adminPassword,
      name: "Admin RTR",
      role: "SUPER_ADMIN",
      isActive: true,
    },
    update: {},
  })

  // 2. System Settings
  const settings = [
    { key: "standardWorkDays", value: "26" },
    { key: "mealAllowanceCap", value: "730000" },
    { key: "personalDeduction", value: "11000000" },
    { key: "dependentDeduction", value: "4400000" },
    { key: "kpiRate", value: "50000" },
    { key: "companyName", value: "CÔNG TY CỔ PHẦN REAL-TIME ROBOTICS VIỆT NAM" },
    { key: "companyTaxCode", value: "0314718578" },
    { key: "companyAddress", value: "Số 40/10 Khổng Tử, P. Tăng Nhơn Phú, TP.HCM" },
    { key: "companyEmail", value: "info@vierp.com" },
    { key: "companyRepresentative", value: "LƯƠNG VIỆT QUỐC" },
    { key: "companyInsuranceCode", value: "" },
    { key: "companyTaxAgency", value: "" },
    { key: "defaultHospital", value: "" },
  ]
  for (const s of settings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      create: { ...s, updatedBy: admin.id },
      update: {},
    })
  }

  // 3. Core Departments
  const depts = [
    { name: "Kỹ Thuật", code: "KT" },
    { name: "Sản Xuất", code: "SX" },
    { name: "Hành Chính - Nhân Sự", code: "HCNS" },
    { name: "R&D", code: "RND" },
    { name: "Kinh Doanh", code: "KD" },
    { name: "Ban Giám Đốc", code: "BGD" },
  ]
  for (const dept of depts) {
    await prisma.department.upsert({
      where: { code: dept.code },
      create: { name: dept.name, code: dept.code },
      update: {},
    })
  }

  console.log("✅ Production seed complete")
  console.log("📧 Admin user: admin@vierp.com")
  console.log("🔑 Password: set via SEED_ADMIN_PASSWORD env var or default (check seed-prod.ts)")
  console.log("⚠️  ĐỔI MẬT KHẨU NGAY SAU KHI LOGIN!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
