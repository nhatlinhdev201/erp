import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { faker } from "@faker-js/faker/locale/vi"

const prisma = new PrismaClient()

// ═══════════════════════════════════════════════════════════════
// VIETNAMESE DATA CONSTANTS
// ═══════════════════════════════════════════════════════════════

const VIETNAMESE_FIRST_NAMES_MALE = [
  "Minh", "Hùng", "Tuấn", "Dũng", "Anh", "Hoàng", "Long", "Hải", "Nam", "Phong",
  "Quang", "Thành", "Đức", "Khoa", "Bình", "Cường", "Vinh", "Hiếu", "Trung", "Kiên",
  "Tùng", "Đạt", "Sơn", "Lâm", "Tín", "Vũ", "Toàn", "Khánh", "Nghĩa", "Phúc",
  "Thiện", "Hưng", "Thắng", "Huy", "Quân", "Tiến", "Thịnh", "Công", "Tâm", "Trọng"
]

const VIETNAMESE_FIRST_NAMES_FEMALE = [
  "Linh", "Hương", "Lan", "Mai", "Ngọc", "Thảo", "Hà", "Trang", "Yến", "Phương",
  "Thu", "Hạnh", "Huyền", "Oanh", "Trâm", "Thủy", "Vân", "Hồng", "Nhung", "Chi",
  "Trinh", "Giang", "Dung", "Diệu", "Kim", "Ly", "My", "Nhi", "Quyên", "Thơ",
  "Anh", "Bích", "Châu", "Dao", "Em", "Hoa", "Hiền", "Khánh", "Loan", "Minh"
]

const VIETNAMESE_MIDDLE_NAMES = [
  "Văn", "Thị", "Hữu", "Đình", "Ngọc", "Minh", "Quốc", "Thanh", "Hoàng", "Xuân",
  "Phúc", "Đức", "Anh", "Việt", "Thành", "Kim", "Trọng", "Quang", "Bảo", "Như"
]

const VIETNAMESE_LAST_NAMES = [
  "Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng",
  "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý", "Đinh", "Trương", "Lương", "Cao"
]

const PROVINCES = [
  "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng", "Cần Thơ", "Hải Phòng", "Bình Dương",
  "Đồng Nai", "Bà Rịa - Vũng Tàu", "Long An", "Tây Ninh", "Bình Phước", "Khánh Hòa",
  "Lâm Đồng", "Thừa Thiên Huế", "Quảng Nam", "Nghệ An", "Thanh Hóa", "Bắc Ninh"
]

const BANKS = [
  { name: "Vietcombank", code: "VCB" },
  { name: "Techcombank", code: "TCB" },
  { name: "ACB", code: "ACB" },
  { name: "BIDV", code: "BIDV" },
  { name: "Vietinbank", code: "VTB" },
  { name: "MB Bank", code: "MB" },
  { name: "VPBank", code: "VPB" },
  { name: "TPBank", code: "TPB" },
  { name: "Sacombank", code: "STB" },
  { name: "SHB", code: "SHB" }
]

// ═══════════════════════════════════════════════════════════════
// ORGANIZATION STRUCTURE
// ═══════════════════════════════════════════════════════════════

const DEPARTMENTS = [
  { code: "BGD", name: "Ban Giám đốc", sortOrder: 1 },
  { code: "HR", name: "Phòng Nhân sự", sortOrder: 2, children: [
    { code: "HR-REC", name: "Tuyển dụng", sortOrder: 1 },
    { code: "HR-C&B", name: "Lương & Phúc lợi", sortOrder: 2 },
    { code: "HR-L&D", name: "Đào tạo & Phát triển", sortOrder: 3 }
  ]},
  { code: "FIN", name: "Phòng Tài chính - Kế toán", sortOrder: 3, children: [
    { code: "FIN-ACC", name: "Kế toán", sortOrder: 1 },
    { code: "FIN-TRS", name: "Ngân quỹ", sortOrder: 2 }
  ]},
  { code: "IT", name: "Phòng Công nghệ thông tin", sortOrder: 4, children: [
    { code: "IT-DEV", name: "Phát triển phần mềm", sortOrder: 1 },
    { code: "IT-INF", name: "Hạ tầng & Vận hành", sortOrder: 2 },
    { code: "IT-SEC", name: "An ninh thông tin", sortOrder: 3 }
  ]},
  { code: "SALES", name: "Phòng Kinh doanh", sortOrder: 5, children: [
    { code: "SALES-B2B", name: "Kinh doanh B2B", sortOrder: 1 },
    { code: "SALES-B2C", name: "Kinh doanh B2C", sortOrder: 2 },
    { code: "SALES-KEY", name: "Khách hàng lớn", sortOrder: 3 }
  ]},
  { code: "MKT", name: "Phòng Marketing", sortOrder: 6, children: [
    { code: "MKT-DIG", name: "Digital Marketing", sortOrder: 1 },
    { code: "MKT-BRD", name: "Brand & Communications", sortOrder: 2 }
  ]},
  { code: "OPS", name: "Phòng Vận hành", sortOrder: 7, children: [
    { code: "OPS-LOG", name: "Logistics", sortOrder: 1 },
    { code: "OPS-QA", name: "Kiểm soát chất lượng", sortOrder: 2 }
  ]},
  { code: "ADM", name: "Phòng Hành chính", sortOrder: 8 }
]

const POSITIONS = [
  { code: "CEO", name: "Tổng Giám đốc", level: 1 },
  { code: "CFO", name: "Giám đốc Tài chính", level: 1 },
  { code: "CTO", name: "Giám đốc Công nghệ", level: 1 },
  { code: "COO", name: "Giám đốc Vận hành", level: 1 },
  { code: "CMO", name: "Giám đốc Marketing", level: 1 },
  { code: "CHRO", name: "Giám đốc Nhân sự", level: 1 },
  { code: "CSO", name: "Giám đốc Kinh doanh", level: 1 },
  { code: "TP", name: "Trưởng phòng", level: 2 },
  { code: "PP", name: "Phó phòng", level: 3 },
  { code: "TN", name: "Trưởng nhóm", level: 4 },
  { code: "SENIOR", name: "Chuyên viên cao cấp", level: 5 },
  { code: "NV", name: "Nhân viên", level: 6 },
  { code: "FRESHER", name: "Nhân viên mới", level: 7 },
  { code: "TTS", name: "Thực tập sinh", level: 8 },
  // IT Positions
  { code: "ARCH", name: "Kiến trúc sư phần mềm", level: 4 },
  { code: "TECH_LEAD", name: "Tech Lead", level: 4 },
  { code: "SENIOR_DEV", name: "Senior Developer", level: 5 },
  { code: "DEV", name: "Developer", level: 6 },
  { code: "JUNIOR_DEV", name: "Junior Developer", level: 7 },
  { code: "QA_LEAD", name: "QA Lead", level: 4 },
  { code: "SENIOR_QA", name: "Senior QA", level: 5 },
  { code: "QA", name: "QA Engineer", level: 6 },
  { code: "DEVOPS", name: "DevOps Engineer", level: 5 },
  { code: "SYS_ADMIN", name: "System Administrator", level: 5 },
  // Finance Positions
  { code: "ACC_MANAGER", name: "Kế toán trưởng", level: 4 },
  { code: "SENIOR_ACC", name: "Kế toán viên cao cấp", level: 5 },
  { code: "ACC", name: "Kế toán viên", level: 6 },
  // HR Positions
  { code: "HR_BP", name: "HR Business Partner", level: 4 },
  { code: "REC_LEAD", name: "Trưởng nhóm Tuyển dụng", level: 4 },
  { code: "RECRUITER", name: "Chuyên viên Tuyển dụng", level: 6 },
  { code: "C&B_SPEC", name: "Chuyên viên C&B", level: 6 },
  { code: "TRAINER", name: "Chuyên viên Đào tạo", level: 6 },
  // Sales Positions
  { code: "SALES_MGR", name: "Sales Manager", level: 3 },
  { code: "KEY_ACC_MGR", name: "Key Account Manager", level: 4 },
  { code: "SALES_EXEC", name: "Sales Executive", level: 6 },
  { code: "SALES_REP", name: "Sales Representative", level: 6 },
  // Marketing Positions
  { code: "MKT_MGR", name: "Marketing Manager", level: 3 },
  { code: "CONTENT_LEAD", name: "Content Lead", level: 4 },
  { code: "DIGITAL_MKT", name: "Digital Marketing Specialist", level: 6 },
  { code: "CONTENT_WRITER", name: "Content Writer", level: 6 },
  { code: "DESIGNER", name: "Designer", level: 6 },
  // Admin Positions
  { code: "ADM_MGR", name: "Quản lý Hành chính", level: 3 },
  { code: "RECEPTIONIST", name: "Lễ tân", level: 6 },
  { code: "DRIVER", name: "Lái xe", level: 6 }
]

const BRANCHES = [
  { code: "HQ", name: "Trụ sở chính - TP.HCM", address: "123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh", isHeadquarters: true },
  { code: "HN", name: "Chi nhánh Hà Nội", address: "456 Kim Mã, Ba Đình, Hà Nội" },
  { code: "DN", name: "Chi nhánh Đà Nẵng", address: "789 Nguyễn Văn Linh, Hải Châu, Đà Nẵng" }
]

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function generateVietnameseName(gender: "MALE" | "FEMALE"): string {
  const lastName = faker.helpers.arrayElement(VIETNAMESE_LAST_NAMES)
  const middleName = gender === "MALE"
    ? faker.helpers.arrayElement(["Văn", "Hữu", "Đình", "Quốc", "Minh", "Đức"])
    : faker.helpers.arrayElement(["Thị", "Ngọc", "Như", "Kim", "Thanh", "Hoàng"])
  const firstName = gender === "MALE"
    ? faker.helpers.arrayElement(VIETNAMESE_FIRST_NAMES_MALE)
    : faker.helpers.arrayElement(VIETNAMESE_FIRST_NAMES_FEMALE)
  return `${lastName} ${middleName} ${firstName}`
}

function generatePhoneNumber(): string {
  const prefixes = ["090", "091", "092", "093", "094", "096", "097", "098", "099", "086", "088", "089"]
  const prefix = faker.helpers.arrayElement(prefixes)
  const number = faker.string.numeric(7)
  return `${prefix}${number}`
}

function generateIdNumber(): string {
  return faker.string.numeric(12)
}

function generateTaxCode(): string {
  return faker.string.numeric(10)
}

function generateBankAccount(): string {
  return faker.string.numeric({ length: { min: 10, max: 16 } })
}

function generateSocialInsuranceNumber(): string {
  return faker.string.numeric(10)
}

function randomDate(start: Date, end: Date): Date {
  return faker.date.between({ from: start, to: end })
}

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "")
}

// ═══════════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ═══════════════════════════════════════════════════════════════

async function main() {
  console.log("🌱 Starting comprehensive seed...")
  const startTime = Date.now()

  // ═══════════════════════════════════════════════════════════════
  // 1. CREATE TENANT
  // ═══════════════════════════════════════════════════════════════
  const tenant = await prisma.tenant.upsert({
    where: { code: "DEMO" },
    update: {},
    create: {
      name: "Công ty TNHH Công nghệ Lạc Việt",
      code: "DEMO",
      taxCode: "0312345678",
      address: "123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
      phone: "028 1234 5678",
      email: "info@your-domain.com",
      subscriptionTier: "enterprise",
      settings: {
        language: "vi",
        currency: "VND",
        dateFormat: "DD/MM/YYYY",
        timezone: "Asia/Ho_Chi_Minh"
      }
    }
  })
  console.log("✅ Created tenant:", tenant.name)

  // ═══════════════════════════════════════════════════════════════
  // 2. CREATE BRANCHES
  // ═══════════════════════════════════════════════════════════════
  const branchMap: Record<string, string> = {}
  for (const branch of BRANCHES) {
    const created = await prisma.branch.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: branch.code } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: branch.name,
        code: branch.code,
        address: branch.address,
        isHeadquarters: branch.isHeadquarters || false,
        phone: "028 " + faker.string.numeric(4) + " " + faker.string.numeric(4),
        email: `${branch.code.toLowerCase()}@your-domain.com`
      }
    })
    branchMap[branch.code] = created.id
  }
  console.log("✅ Created", BRANCHES.length, "branches")

  // ═══════════════════════════════════════════════════════════════
  // 3. CREATE POSITIONS
  // ═══════════════════════════════════════════════════════════════
  const positionMap: Record<string, string> = {}
  for (const pos of POSITIONS) {
    const created = await prisma.position.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: pos.code } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: pos.name,
        code: pos.code,
        level: pos.level
      }
    })
    positionMap[pos.code] = created.id
  }
  console.log("✅ Created", POSITIONS.length, "positions")

  // ═══════════════════════════════════════════════════════════════
  // 4. CREATE DEPARTMENTS (with hierarchy)
  // ═══════════════════════════════════════════════════════════════
  const departmentMap: Record<string, string> = {}

  for (const dept of DEPARTMENTS) {
    const created = await prisma.department.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: dept.code } },
      update: {},
      create: {
        tenantId: tenant.id,
        name: dept.name,
        code: dept.code,
        sortOrder: dept.sortOrder
      }
    })
    departmentMap[dept.code] = created.id

    // Create children departments
    if (dept.children) {
      for (const child of dept.children) {
        const childCreated = await prisma.department.upsert({
          where: { tenantId_code: { tenantId: tenant.id, code: child.code } },
          update: {},
          create: {
            tenantId: tenant.id,
            name: child.name,
            code: child.code,
            parentId: created.id,
            sortOrder: child.sortOrder
          }
        })
        departmentMap[child.code] = childCreated.id
      }
    }
  }
  console.log("✅ Created", Object.keys(departmentMap).length, "departments")

  // ═══════════════════════════════════════════════════════════════
  // 5. CREATE EMPLOYEES (500+)
  // ═══════════════════════════════════════════════════════════════
  console.log("⏳ Creating 520 employees...")

  // Department distribution for realistic org structure
  const employeeDistribution = [
    { deptCode: "BGD", count: 5, positions: ["CEO", "CFO", "CTO", "COO", "CHRO"] },
    { deptCode: "HR", count: 8, positions: ["TP", "PP", "HR_BP"] },
    { deptCode: "HR-REC", count: 15, positions: ["TN", "REC_LEAD", "RECRUITER"] },
    { deptCode: "HR-C&B", count: 12, positions: ["TN", "C&B_SPEC", "NV"] },
    { deptCode: "HR-L&D", count: 10, positions: ["TN", "TRAINER", "NV"] },
    { deptCode: "FIN", count: 5, positions: ["TP", "PP"] },
    { deptCode: "FIN-ACC", count: 25, positions: ["ACC_MANAGER", "SENIOR_ACC", "ACC", "NV"] },
    { deptCode: "FIN-TRS", count: 10, positions: ["TN", "NV"] },
    { deptCode: "IT", count: 5, positions: ["TP", "PP", "ARCH"] },
    { deptCode: "IT-DEV", count: 80, positions: ["TECH_LEAD", "SENIOR_DEV", "DEV", "JUNIOR_DEV", "TTS"] },
    { deptCode: "IT-INF", count: 25, positions: ["TN", "DEVOPS", "SYS_ADMIN", "NV"] },
    { deptCode: "IT-SEC", count: 15, positions: ["TN", "SENIOR", "NV"] },
    { deptCode: "SALES", count: 8, positions: ["TP", "PP", "CSO"] },
    { deptCode: "SALES-B2B", count: 45, positions: ["SALES_MGR", "KEY_ACC_MGR", "SALES_EXEC", "SALES_REP"] },
    { deptCode: "SALES-B2C", count: 50, positions: ["SALES_MGR", "SALES_EXEC", "SALES_REP"] },
    { deptCode: "SALES-KEY", count: 20, positions: ["KEY_ACC_MGR", "SALES_EXEC"] },
    { deptCode: "MKT", count: 5, positions: ["CMO", "TP", "PP"] },
    { deptCode: "MKT-DIG", count: 30, positions: ["MKT_MGR", "DIGITAL_MKT", "CONTENT_WRITER", "DESIGNER"] },
    { deptCode: "MKT-BRD", count: 20, positions: ["CONTENT_LEAD", "CONTENT_WRITER", "DESIGNER"] },
    { deptCode: "OPS", count: 5, positions: ["TP", "PP"] },
    { deptCode: "OPS-LOG", count: 40, positions: ["TN", "NV", "FRESHER"] },
    { deptCode: "OPS-QA", count: 35, positions: ["QA_LEAD", "SENIOR_QA", "QA", "NV"] },
    { deptCode: "ADM", count: 25, positions: ["ADM_MGR", "NV", "RECEPTIONIST", "DRIVER"] }
  ]

  const allEmployees: Array<{
    id: string
    employeeCode: string
    fullName: string
    departmentId: string
    positionId: string
    hireDate: Date
    status: "ACTIVE" | "PROBATION" | "RESIGNED"
    workEmail: string
    gender: "MALE" | "FEMALE"
  }> = []

  let employeeCounter = 1
  const salaryRanges: Record<number, { min: number; max: number }> = {
    1: { min: 80000000, max: 150000000 }, // C-Level
    2: { min: 45000000, max: 80000000 },  // Director
    3: { min: 35000000, max: 55000000 },  // Manager
    4: { min: 25000000, max: 40000000 },  // Lead
    5: { min: 18000000, max: 28000000 },  // Senior
    6: { min: 12000000, max: 20000000 },  // Staff
    7: { min: 8000000, max: 14000000 },   // Fresher
    8: { min: 4000000, max: 8000000 }     // Intern
  }

  for (const dist of employeeDistribution) {
    for (let i = 0; i < dist.count; i++) {
      const gender: "MALE" | "FEMALE" = faker.helpers.arrayElement(["MALE", "FEMALE"])
      const fullName = generateVietnameseName(gender)
      const employeeCode = `NV${String(employeeCounter).padStart(5, "0")}`
      const positionCode = faker.helpers.arrayElement(dist.positions)
      const position = POSITIONS.find(p => p.code === positionCode)!

      // Status distribution: 85% Active, 10% Probation, 5% Resigned
      const statusRand = Math.random()
      let status: "ACTIVE" | "PROBATION" | "RESIGNED" = "ACTIVE"
      if (statusRand > 0.95) status = "RESIGNED"
      else if (statusRand > 0.85) status = "PROBATION"

      // Hire date: Leaders hired earlier, juniors more recent
      const yearsAgo = position.level <= 3 ? faker.number.int({ min: 3, max: 8 }) : faker.number.int({ min: 0, max: 4 })
      const hireDate = randomDate(
        new Date(Date.now() - yearsAgo * 365 * 24 * 60 * 60 * 1000),
        new Date(Date.now() - (yearsAgo - 1) * 365 * 24 * 60 * 60 * 1000)
      )

      const nameSlug = toSlug(fullName.split(" ").pop() || "user")
      const workEmail = `${nameSlug}${employeeCounter}@your-domain.com`

      const bank = faker.helpers.arrayElement(BANKS)
      const branchCode = faker.helpers.weightedArrayElement([
        { value: "HQ", weight: 70 },
        { value: "HN", weight: 20 },
        { value: "DN", weight: 10 }
      ])

      const salaryRange = salaryRanges[position.level] || salaryRanges[6]
      const baseSalary = faker.number.int({ min: salaryRange.min, max: salaryRange.max })

      const emp = await prisma.employee.upsert({
        where: { tenantId_employeeCode: { tenantId: tenant.id, employeeCode } },
        update: {},
        create: {
          tenantId: tenant.id,
          employeeCode,
          fullName,
          gender,
          dateOfBirth: randomDate(new Date("1970-01-01"), new Date("2002-12-31")),
          idNumber: generateIdNumber(),
          idIssueDate: randomDate(new Date("2015-01-01"), new Date("2023-12-31")),
          idIssuePlace: faker.helpers.arrayElement(PROVINCES),
          taxCode: generateTaxCode(),
          socialInsuranceNumber: generateSocialInsuranceNumber(),
          socialInsuranceDate: hireDate,
          phone: generatePhoneNumber(),
          personalEmail: faker.internet.email({ firstName: nameSlug }),
          workEmail,
          permanentAddress: `${faker.location.streetAddress()}, ${faker.helpers.arrayElement(PROVINCES)}`,
          currentAddress: `${faker.location.streetAddress()}, TP. Hồ Chí Minh`,
          bankAccount: generateBankAccount(),
          bankName: bank.name,
          bankBranch: `Chi nhánh ${faker.helpers.arrayElement(["Quận 1", "Quận 3", "Quận 7", "Tân Bình", "Bình Thạnh"])}`,
          departmentId: departmentMap[dist.deptCode],
          positionId: positionMap[positionCode],
          branchId: branchMap[branchCode],
          hireDate,
          probationEndDate: status === "PROBATION" ? new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) : null,
          status,
          resignationDate: status === "RESIGNED" ? randomDate(new Date("2024-01-01"), new Date()) : null,
          resignationReason: status === "RESIGNED" ? faker.helpers.arrayElement([
            "Chuyển công ty khác",
            "Lý do cá nhân",
            "Định hướng nghề nghiệp",
            "Chuyển nơi sinh sống"
          ]) : null
        }
      })

      allEmployees.push({
        id: emp.id,
        employeeCode,
        fullName,
        departmentId: departmentMap[dist.deptCode],
        positionId: positionMap[positionCode],
        hireDate,
        status,
        workEmail,
        gender
      })

      // Create contract for employee
      const contractNumber = `HD${new Date().getFullYear()}/${String(employeeCounter).padStart(5, "0")}`
      const contractType = position.level <= 4 ? "INDEFINITE_TERM" : faker.helpers.arrayElement(["DEFINITE_TERM", "DEFINITE_TERM", "INDEFINITE_TERM"])

      await prisma.contract.upsert({
        where: { tenantId_contractNumber: { tenantId: tenant.id, contractNumber } },
        update: {},
        create: {
          tenantId: tenant.id,
          employeeId: emp.id,
          contractNumber,
          contractType: contractType as "INDEFINITE_TERM" | "DEFINITE_TERM" | "SEASONAL" | "PROBATION",
          startDate: hireDate,
          endDate: contractType === "DEFINITE_TERM" ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
          baseSalary,
          salaryType: "GROSS",
          insuranceSalary: Math.min(baseSalary, 46800000), // Cap at insurance ceiling
          status: "ACTIVE",
          allowances: [
            { name: "Phụ cấp ăn trưa", amount: 800000, taxable: false },
            { name: "Phụ cấp điện thoại", amount: 300000, taxable: true },
            ...(position.level <= 4 ? [{ name: "Phụ cấp trách nhiệm", amount: 3000000, taxable: true }] : [])
          ],
          workSchedule: "Thứ 2 - Thứ 6, 8:00 - 17:00"
        }
      })

      employeeCounter++
    }
  }
  console.log("✅ Created", allEmployees.length, "employees with contracts")

  // ═══════════════════════════════════════════════════════════════
  // 6. SET MANAGER RELATIONSHIPS
  // ═══════════════════════════════════════════════════════════════
  // Find department heads and assign as managers
  const deptHeads: Record<string, string> = {}
  for (const [deptCode, deptId] of Object.entries(departmentMap)) {
    const head = allEmployees.find(e =>
      e.departmentId === deptId &&
      (e.employeeCode === "NV00001" || // CEO
        allEmployees.filter(emp => emp.departmentId === deptId)
          .sort((a, b) => a.employeeCode.localeCompare(b.employeeCode))[0]?.id === e.id)
    )
    if (head) {
      deptHeads[deptCode] = head.id
      await prisma.department.update({
        where: { id: deptId },
        data: { managerId: head.id }
      })
    }
  }

  // Assign direct managers
  for (const emp of allEmployees) {
    const deptCode = Object.entries(departmentMap).find(([, id]) => id === emp.departmentId)?.[0]
    if (deptCode && deptHeads[deptCode] && deptHeads[deptCode] !== emp.id) {
      await prisma.employee.update({
        where: { id: emp.id },
        data: { directManagerId: deptHeads[deptCode] }
      })
    }
  }
  console.log("✅ Set manager relationships")

  // ═══════════════════════════════════════════════════════════════
  // 7. CREATE DEMO USERS
  // ═══════════════════════════════════════════════════════════════
  // SECURITY: no hardcoded demo password in git.
  const demoPw = process.env.SEED_DEMO_PASSWORD ||
    Array.from(require('crypto').randomBytes(16))
      .map((b: number) => 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'[b % 56])
      .join('')
  if (demoPw.length < 8) throw new Error('SEED_DEMO_PASSWORD too short (min 8).')
  console.log(`🔐 Demo password for all seeded users (save now, shown once): ${demoPw}`)
  const passwordHash = await bcrypt.hash(demoPw, 12)

  // Admin user - CEO
  const ceo = allEmployees.find(e => e.employeeCode === "NV00001")
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "admin@demo.com" } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "admin@demo.com",
      passwordHash,
      name: ceo?.fullName || "Admin Demo",
      role: "ADMIN",
      employeeId: ceo?.id
    }
  })

  // HR Manager
  const hrHead = allEmployees.find(e => e.departmentId === departmentMap["HR"] && e.employeeCode !== "NV00001")
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "hr@demo.com" } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "hr@demo.com",
      passwordHash,
      name: hrHead?.fullName || "HR Manager",
      role: "HR_MANAGER",
      employeeId: hrHead?.id
    }
  })

  // Department Manager (IT)
  const itHead = allEmployees.find(e => e.departmentId === departmentMap["IT"] && e.employeeCode !== "NV00001")
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "manager@demo.com" } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "manager@demo.com",
      passwordHash,
      name: itHead?.fullName || "IT Manager",
      role: "HR_STAFF",
      employeeId: itHead?.id
    }
  })

  // Regular Employee
  const regularEmp = allEmployees.find(e => e.status === "ACTIVE" && e.departmentId === departmentMap["IT-DEV"])
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: "employee@demo.com" } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "employee@demo.com",
      passwordHash,
      name: regularEmp?.fullName || "Employee Demo",
      role: "VIEWER",
      employeeId: regularEmp?.id
    }
  })

  console.log("✅ Created 4 demo users (admin@demo.com, hr@demo.com, manager@demo.com, employee@demo.com)")
  console.log("   Password for all: Demo@123")

  // ═══════════════════════════════════════════════════════════════
  // 8. CREATE SHIFTS
  // ═══════════════════════════════════════════════════════════════
  const shiftsData = [
    { name: "Ca hành chính", code: "HC", shiftType: "STANDARD" as const, startTime: "08:00", endTime: "17:00", breakStartTime: "12:00", breakEndTime: "13:00", breakMinutes: 60, workHoursPerDay: 8, color: "#3B82F6" },
    { name: "Ca sáng", code: "CS", shiftType: "MORNING" as const, startTime: "06:00", endTime: "14:00", breakStartTime: "11:00", breakEndTime: "11:30", breakMinutes: 30, workHoursPerDay: 7.5, color: "#F59E0B" },
    { name: "Ca chiều", code: "CC", shiftType: "AFTERNOON" as const, startTime: "14:00", endTime: "22:00", breakStartTime: "18:00", breakEndTime: "18:30", breakMinutes: 30, workHoursPerDay: 7.5, color: "#10B981" },
    { name: "Ca đêm", code: "CD", shiftType: "NIGHT" as const, startTime: "22:00", endTime: "06:00", breakMinutes: 30, workHoursPerDay: 7.5, isOvernight: true, nightShiftStart: "22:00", nightShiftEnd: "06:00", color: "#6366F1" }
  ]

  const shiftMap: Record<string, string> = {}
  for (const shift of shiftsData) {
    const created = await prisma.shift.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: shift.code } },
      update: {},
      create: { tenantId: tenant.id, ...shift }
    })
    shiftMap[shift.code] = created.id
  }
  console.log("✅ Created", shiftsData.length, "shifts")

  // Assign shifts to employees
  const activeEmployees = allEmployees.filter(e => e.status !== "RESIGNED")
  for (const emp of activeEmployees) {
    await prisma.shiftAssignment.upsert({
      where: { id: `${emp.id}-HC` },
      update: {},
      create: {
        tenantId: tenant.id,
        employeeId: emp.id,
        shiftId: shiftMap["HC"],
        startDate: emp.hireDate,
        daysOfWeek: [1, 2, 3, 4, 5],
        isPrimary: true
      }
    })
  }
  console.log("✅ Assigned shifts to", activeEmployees.length, "employees")

  // ═══════════════════════════════════════════════════════════════
  // 9. CREATE ATTENDANCE RECORDS (30 days)
  // ═══════════════════════════════════════════════════════════════
  console.log("⏳ Creating attendance records for last 30 days...")

  const today = new Date()
  const attendanceRecords: Array<{
    tenantId: string
    employeeId: string
    shiftId: string
    date: Date
    dayType: "NORMAL" | "WEEKEND" | "HOLIDAY"
    checkIn: Date | null
    checkOut: Date | null
    checkInSource: "WEB_CLOCK" | "FINGERPRINT" | "FACE_ID"
    checkOutSource: "WEB_CLOCK" | "FINGERPRINT" | "FACE_ID"
    status: "PRESENT" | "LATE" | "ABSENT" | "ON_LEAVE"
    workHours: number
    lateMinutes: number | null
  }> = []

  for (let dayOffset = 30; dayOffset >= 0; dayOffset--) {
    const date = new Date(today)
    date.setDate(date.getDate() - dayOffset)
    date.setHours(0, 0, 0, 0)

    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

    if (isWeekend) continue // Skip weekends

    for (const emp of activeEmployees.slice(0, 500)) { // First 500 active employees
      // Random attendance: 90% present, 5% late, 3% absent, 2% leave
      const rand = Math.random()
      let status: "PRESENT" | "LATE" | "ABSENT" | "ON_LEAVE" = "PRESENT"
      let checkIn: Date | null = null
      let checkOut: Date | null = null
      let lateMinutes: number | null = null
      let workHours = 8

      if (rand > 0.98) {
        status = "ON_LEAVE"
        workHours = 0
      } else if (rand > 0.95) {
        status = "ABSENT"
        workHours = 0
      } else if (rand > 0.90) {
        status = "LATE"
        lateMinutes = faker.number.int({ min: 5, max: 60 })
        checkIn = new Date(date)
        checkIn.setHours(8, lateMinutes, faker.number.int({ min: 0, max: 59 }))
        checkOut = new Date(date)
        checkOut.setHours(17, faker.number.int({ min: 0, max: 30 }), 0)
        workHours = 8 - lateMinutes / 60
      } else {
        checkIn = new Date(date)
        checkIn.setHours(7, 45 + faker.number.int({ min: 0, max: 15 }), faker.number.int({ min: 0, max: 59 }))
        checkOut = new Date(date)
        checkOut.setHours(17, faker.number.int({ min: 0, max: 30 }), 0)
        workHours = 8
      }

      attendanceRecords.push({
        tenantId: tenant.id,
        employeeId: emp.id,
        shiftId: shiftMap["HC"],
        date,
        dayType: "NORMAL",
        checkIn,
        checkOut,
        checkInSource: faker.helpers.arrayElement(["WEB_CLOCK", "FINGERPRINT", "FACE_ID"]),
        checkOutSource: faker.helpers.arrayElement(["WEB_CLOCK", "FINGERPRINT", "FACE_ID"]),
        status,
        workHours,
        lateMinutes
      })
    }
  }

  // Batch insert attendance
  await prisma.attendance.createMany({
    data: attendanceRecords.map(r => ({
      ...r,
      workHours: r.workHours
    })),
    skipDuplicates: true
  })
  console.log("✅ Created", attendanceRecords.length, "attendance records")

  // ═══════════════════════════════════════════════════════════════
  // 10. CREATE LEAVE POLICIES & BALANCES
  // ═══════════════════════════════════════════════════════════════
  const leavePoliciesData = [
    { name: "Nghỉ phép năm", code: "ANNUAL", leaveType: "ANNUAL" as const, daysPerYear: 12, maxCarryOver: 5, carryOverExpireMonths: 3, allowHalfDay: true, isPaid: true },
    { name: "Nghỉ ốm", code: "SICK", leaveType: "SICK" as const, daysPerYear: 30, maxCarryOver: 0, allowHalfDay: false, isPaid: true },
    { name: "Nghỉ việc riêng", code: "PERSONAL", leaveType: "PERSONAL" as const, daysPerYear: 3, maxCarryOver: 0, allowHalfDay: true, isPaid: true },
    { name: "Nghỉ cưới", code: "WEDDING", leaveType: "WEDDING" as const, daysPerYear: 3, maxCarryOver: 0, allowHalfDay: false, isPaid: true },
    { name: "Nghỉ tang", code: "BEREAVEMENT", leaveType: "BEREAVEMENT" as const, daysPerYear: 3, maxCarryOver: 0, allowHalfDay: false, isPaid: true },
    { name: "Nghỉ thai sản", code: "MATERNITY", leaveType: "MATERNITY" as const, daysPerYear: 180, maxCarryOver: 0, allowHalfDay: false, isPaid: true },
    { name: "Nghỉ không lương", code: "UNPAID", leaveType: "UNPAID" as const, daysPerYear: 0, maxCarryOver: 0, allowHalfDay: true, isPaid: false, allowNegativeBalance: true }
  ]

  const leavePolicyMap: Record<string, string> = {}
  for (const policy of leavePoliciesData) {
    const created = await prisma.leavePolicy.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: policy.code } },
      update: {},
      create: { tenantId: tenant.id, ...policy, isActive: true }
    })
    leavePolicyMap[policy.code] = created.id
  }
  console.log("✅ Created", leavePoliciesData.length, "leave policies")

  // Create leave balances for active employees
  const currentYear = today.getFullYear()
  const leaveBalances: Array<{
    tenantId: string
    employeeId: string
    policyId: string
    year: number
    entitlement: number
    carryOver: number
    adjustment: number
    used: number
    pending: number
    available: number
  }> = []

  for (const emp of activeEmployees) {
    const usedDays = faker.number.int({ min: 0, max: 8 })
    leaveBalances.push({
      tenantId: tenant.id,
      employeeId: emp.id,
      policyId: leavePolicyMap["ANNUAL"],
      year: currentYear,
      entitlement: 12,
      carryOver: faker.number.int({ min: 0, max: 3 }),
      adjustment: 0,
      used: usedDays,
      pending: faker.number.int({ min: 0, max: 2 }),
      available: 12 - usedDays
    })
  }

  await prisma.leaveBalance.createMany({
    data: leaveBalances,
    skipDuplicates: true
  })
  console.log("✅ Created", leaveBalances.length, "leave balances")

  // ═══════════════════════════════════════════════════════════════
  // 11. CREATE HOLIDAYS
  // ═══════════════════════════════════════════════════════════════
  const year = today.getFullYear()
  const holidaysData = [
    { name: "Tết Dương lịch", date: new Date(year, 0, 1), isNational: true },
    { name: "Tết Nguyên đán", date: new Date(year, 0, 29), endDate: new Date(year, 1, 3), isNational: true },
    { name: "Giỗ Tổ Hùng Vương", date: new Date(year, 3, 10), isNational: true },
    { name: "Ngày Giải phóng miền Nam", date: new Date(year, 3, 30), isNational: true },
    { name: "Ngày Quốc tế Lao động", date: new Date(year, 4, 1), isNational: true },
    { name: "Ngày Quốc khánh", date: new Date(year, 8, 2), endDate: new Date(year, 8, 3), isNational: true }
  ]

  for (const holiday of holidaysData) {
    await prisma.holiday.create({
      data: {
        tenantId: tenant.id,
        name: holiday.name,
        date: holiday.date,
        endDate: holiday.endDate,
        dayType: "HOLIDAY",
        isNational: holiday.isNational,
        isRecurring: true,
        year
      }
    }).catch(() => {}) // Skip if exists
  }
  console.log("✅ Created", holidaysData.length, "holidays")

  // ═══════════════════════════════════════════════════════════════
  // 12. CREATE PAYROLL CONFIG & COMPONENTS
  // ═══════════════════════════════════════════════════════════════
  await prisma.payrollConfig.upsert({
    where: { id: `${tenant.id}-config-2024` },
    update: {},
    create: {
      tenantId: tenant.id,
      effectiveFrom: new Date("2024-01-01"),
      bhxhEmployeeRate: 0.08,
      bhxhEmployerRate: 0.175,
      bhytEmployeeRate: 0.015,
      bhytEmployerRate: 0.03,
      bhtnEmployeeRate: 0.01,
      bhtnEmployerRate: 0.01,
      insuranceSalaryCap: 46800000,
      personalDeduction: 11000000,
      dependentDeduction: 4400000,
      pitBrackets: [
        { from: 0, to: 5000000, rate: 0.05 },
        { from: 5000000, to: 10000000, rate: 0.10 },
        { from: 10000000, to: 18000000, rate: 0.15 },
        { from: 18000000, to: 32000000, rate: 0.20 },
        { from: 32000000, to: 52000000, rate: 0.25 },
        { from: 52000000, to: 80000000, rate: 0.30 },
        { from: 80000000, to: 999999999999, rate: 0.35 }
      ],
      otWeekdayRate: 1.5,
      otWeekendRate: 2.0,
      otHolidayRate: 3.0,
      otNightBonus: 0.3,
      standardWorkDays: 22,
      standardWorkHours: 8,
      isActive: true
    }
  })

  const salaryComponentsData = [
    { code: "BASE", name: "Lương cơ bản", category: "BASE_SALARY" as const, itemType: "EARNING" as const, isTaxable: true, isInsuranceable: true, isSystem: true, sortOrder: 1 },
    { code: "ALLOWANCE_POSITION", name: "Phụ cấp chức vụ", category: "ALLOWANCE_TAXABLE" as const, itemType: "EARNING" as const, isTaxable: true, isInsuranceable: false, sortOrder: 2 },
    { code: "ALLOWANCE_RESPONSIBILITY", name: "Phụ cấp trách nhiệm", category: "ALLOWANCE_TAXABLE" as const, itemType: "EARNING" as const, isTaxable: true, isInsuranceable: false, sortOrder: 3 },
    { code: "ALLOWANCE_LUNCH", name: "Phụ cấp ăn trưa", category: "ALLOWANCE_NON_TAXABLE" as const, itemType: "EARNING" as const, isTaxable: false, isInsuranceable: false, sortOrder: 4 },
    { code: "ALLOWANCE_TRANSPORT", name: "Phụ cấp xăng xe", category: "ALLOWANCE_NON_TAXABLE" as const, itemType: "EARNING" as const, isTaxable: false, isInsuranceable: false, sortOrder: 5 },
    { code: "ALLOWANCE_PHONE", name: "Phụ cấp điện thoại", category: "ALLOWANCE_NON_TAXABLE" as const, itemType: "EARNING" as const, isTaxable: false, isInsuranceable: false, sortOrder: 6 },
    { code: "OT_WEEKDAY", name: "Tăng ca ngày thường", category: "OVERTIME" as const, itemType: "EARNING" as const, isTaxable: true, isInsuranceable: false, isSystem: true, sortOrder: 10 },
    { code: "OT_WEEKEND", name: "Tăng ca cuối tuần", category: "OVERTIME" as const, itemType: "EARNING" as const, isTaxable: true, isInsuranceable: false, isSystem: true, sortOrder: 11 },
    { code: "OT_HOLIDAY", name: "Tăng ca ngày lễ", category: "OVERTIME" as const, itemType: "EARNING" as const, isTaxable: true, isInsuranceable: false, isSystem: true, sortOrder: 12 },
    { code: "BONUS", name: "Thưởng", category: "BONUS" as const, itemType: "EARNING" as const, isTaxable: true, isInsuranceable: false, sortOrder: 20 },
    { code: "BHXH_EE", name: "BHXH (8%)", category: "INSURANCE_EMPLOYEE" as const, itemType: "DEDUCTION" as const, isTaxable: false, isInsuranceable: false, isSystem: true, sortOrder: 30 },
    { code: "BHYT_EE", name: "BHYT (1.5%)", category: "INSURANCE_EMPLOYEE" as const, itemType: "DEDUCTION" as const, isTaxable: false, isInsuranceable: false, isSystem: true, sortOrder: 31 },
    { code: "BHTN_EE", name: "BHTN (1%)", category: "INSURANCE_EMPLOYEE" as const, itemType: "DEDUCTION" as const, isTaxable: false, isInsuranceable: false, isSystem: true, sortOrder: 32 },
    { code: "PIT", name: "Thuế TNCN", category: "PIT" as const, itemType: "DEDUCTION" as const, isTaxable: false, isInsuranceable: false, isSystem: true, sortOrder: 40 },
    { code: "BHXH_ER", name: "BHXH công ty (17.5%)", category: "INSURANCE_EMPLOYER" as const, itemType: "EMPLOYER_COST" as const, isTaxable: false, isInsuranceable: false, isSystem: true, sortOrder: 60 },
    { code: "BHYT_ER", name: "BHYT công ty (3%)", category: "INSURANCE_EMPLOYER" as const, itemType: "EMPLOYER_COST" as const, isTaxable: false, isInsuranceable: false, isSystem: true, sortOrder: 61 },
    { code: "BHTN_ER", name: "BHTN công ty (1%)", category: "INSURANCE_EMPLOYER" as const, itemType: "EMPLOYER_COST" as const, isTaxable: false, isInsuranceable: false, isSystem: true, sortOrder: 62 }
  ]

  for (const comp of salaryComponentsData) {
    await prisma.salaryComponent.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: comp.code } },
      update: {},
      create: { tenantId: tenant.id, ...comp, isActive: true }
    })
  }
  console.log("✅ Created payroll config and", salaryComponentsData.length, "salary components")

  // ═══════════════════════════════════════════════════════════════
  // 13. CREATE WORKFLOW DEFINITIONS
  // ═══════════════════════════════════════════════════════════════
  const leaveWorkflow = await prisma.workflowDefinition.upsert({
    where: { tenantId_code: { tenantId: tenant.id, code: "LEAVE_APPROVAL" } },
    update: {},
    create: {
      tenantId: tenant.id,
      name: "Quy trình duyệt nghỉ phép",
      code: "LEAVE_APPROVAL",
      workflowType: "LEAVE_REQUEST",
      description: "Quy trình phê duyệt đơn xin nghỉ phép",
      isActive: true,
      version: 1
    }
  })

  const existingSteps = await prisma.workflowStep.findMany({ where: { definitionId: leaveWorkflow.id } })
  if (existingSteps.length === 0) {
    await prisma.workflowStep.createMany({
      data: [
        { definitionId: leaveWorkflow.id, stepOrder: 1, name: "Quản lý trực tiếp duyệt", approverType: "DIRECT_MANAGER" },
        { definitionId: leaveWorkflow.id, stepOrder: 2, name: "Trưởng phòng duyệt", approverType: "DEPARTMENT_HEAD", conditions: { totalDays: { operator: ">=", value: 3 } }, canSkip: true },
        { definitionId: leaveWorkflow.id, stepOrder: 3, name: "HR Manager duyệt", approverType: "HR_MANAGER", conditions: { totalDays: { operator: ">=", value: 5 } }, canSkip: true }
      ]
    })
  }
  console.log("✅ Created workflow definitions")

  // ═══════════════════════════════════════════════════════════════
  // 14. CREATE KNOWLEDGE ARTICLES
  // ═══════════════════════════════════════════════════════════════
  const adminUser = await prisma.user.findFirst({ where: { tenantId: tenant.id, email: "admin@demo.com" } })
  const knowledgeArticlesData = [
    { title: "Quy định nghỉ phép năm", category: "Nghỉ phép", keywords: ["phép năm", "annual leave"], content: "Nhân viên được nghỉ 12 ngày phép năm..." },
    { title: "Quy trình nghỉ thai sản", category: "Nghỉ phép", keywords: ["thai sản", "maternity"], content: "Chế độ nghỉ thai sản 6 tháng..." },
    { title: "Quy định chấm công", category: "Chấm công", keywords: ["chấm công", "attendance"], content: "Giờ làm việc 8:00-17:00..." },
    { title: "Chế độ tăng ca", category: "Tăng ca", keywords: ["tăng ca", "overtime"], content: "Hệ số OT: 150%, 200%, 300%..." },
    { title: "Chế độ BHXH, BHYT, BHTN", category: "Bảo hiểm", keywords: ["BHXH", "BHYT", "BHTN"], content: "Tỷ lệ đóng bảo hiểm..." },
    { title: "Cách xem phiếu lương", category: "Lương thưởng", keywords: ["phiếu lương", "payslip"], content: "Đăng nhập ESS > Phiếu lương..." },
    { title: "Quy định thuế TNCN", category: "Lương thưởng", keywords: ["thuế", "TNCN", "PIT"], content: "Biểu thuế lũy tiến từ 5% đến 35%..." },
    { title: "Quy trình xin nghỉ phép", category: "Quy định chung", keywords: ["xin nghỉ", "đơn phép"], content: "Bước 1: Đăng nhập hệ thống..." }
  ]

  for (const article of knowledgeArticlesData) {
    await prisma.knowledgeArticle.upsert({
      where: { tenantId_title: { tenantId: tenant.id, title: article.title } },
      update: {},
      create: {
        tenantId: tenant.id,
        createdBy: adminUser?.id || "",
        ...article,
        isPublished: true
      }
    })
  }
  console.log("✅ Created", knowledgeArticlesData.length, "knowledge articles")

  // ═══════════════════════════════════════════════════════════════
  // 15. CREATE EMAIL TEMPLATES
  // ═══════════════════════════════════════════════════════════════
  const emailTemplatesData = [
    { code: "WELCOME", name: "Chào mừng nhân viên mới", subject: "Chào mừng {{employeeName}} đến với {{companyName}}", bodyHtml: "<h2>Xin chào {{employeeName}}!</h2><p>Chào mừng bạn đến với công ty.</p>" },
    { code: "LEAVE_APPROVED", name: "Đơn nghỉ phép đã duyệt", subject: "Đơn nghỉ phép đã được duyệt", bodyHtml: "<h2>Thông báo</h2><p>Đơn nghỉ phép của bạn đã được duyệt.</p>" },
    { code: "LEAVE_REJECTED", name: "Đơn nghỉ phép bị từ chối", subject: "Đơn nghỉ phép bị từ chối", bodyHtml: "<h2>Thông báo</h2><p>Đơn nghỉ phép của bạn bị từ chối.</p>" },
    { code: "PAYSLIP_READY", name: "Phiếu lương đã sẵn sàng", subject: "Phiếu lương tháng {{month}}/{{year}}", bodyHtml: "<h2>Thông báo</h2><p>Phiếu lương đã được tạo.</p>" }
  ]

  for (const template of emailTemplatesData) {
    await prisma.emailTemplate.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: template.code } },
      update: {},
      create: { tenantId: tenant.id, ...template, isActive: true }
    })
  }
  console.log("✅ Created", emailTemplatesData.length, "email templates")

  // ═══════════════════════════════════════════════════════════════
  // 16. CREATE SALARY GRADES & BENEFIT PLANS (Sprint 11)
  // ═══════════════════════════════════════════════════════════════
  const salaryGrades = [
    { code: "G1", name: "Entry Level", level: 1, minSalary: 8000000, midSalary: 10000000, maxSalary: 12000000 },
    { code: "G2", name: "Junior", level: 2, minSalary: 12000000, midSalary: 15000000, maxSalary: 18000000 },
    { code: "G3", name: "Mid-Level", level: 3, minSalary: 18000000, midSalary: 23000000, maxSalary: 28000000 },
    { code: "G4", name: "Senior", level: 4, minSalary: 28000000, midSalary: 35000000, maxSalary: 42000000 },
    { code: "G5", name: "Lead/Expert", level: 5, minSalary: 42000000, midSalary: 52000000, maxSalary: 62000000 },
    { code: "G6", name: "Manager", level: 6, minSalary: 55000000, midSalary: 70000000, maxSalary: 85000000 },
    { code: "G7", name: "Director", level: 7, minSalary: 80000000, midSalary: 100000000, maxSalary: 120000000 },
    { code: "G8", name: "VP/C-Level", level: 8, minSalary: 120000000, midSalary: 150000000, maxSalary: 200000000 }
  ]

  for (const grade of salaryGrades) {
    await prisma.salaryGrade.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: grade.code } },
      update: {},
      create: { tenantId: tenant.id, ...grade }
    })
  }
  console.log("✅ Created", salaryGrades.length, "salary grades")

  const benefitPlans = [
    { code: "BHXH", name: "Bảo hiểm xã hội", type: "MANDATORY" as const, employerContribution: 17.5, employeeContribution: 8 },
    { code: "BHYT", name: "Bảo hiểm y tế", type: "MANDATORY" as const, employerContribution: 3, employeeContribution: 1.5 },
    { code: "BHTN", name: "Bảo hiểm thất nghiệp", type: "MANDATORY" as const, employerContribution: 1, employeeContribution: 1 },
    { code: "HEALTH_PREMIUM", name: "Bảo hiểm sức khỏe cao cấp", type: "OPTIONAL" as const, employerContribution: 5000000, employeeContribution: 1000000 },
    { code: "GYM", name: "Phòng tập gym", type: "PERK" as const, employerContribution: 500000 },
    { code: "LUNCH", name: "Suất ăn trưa", type: "PERK" as const, employerContribution: 1000000 }
  ]

  for (const plan of benefitPlans) {
    await prisma.benefitPlan.upsert({
      where: { tenantId_code: { tenantId: tenant.id, code: plan.code } },
      update: {},
      create: { tenantId: tenant.id, ...plan }
    })
  }
  console.log("✅ Created", benefitPlans.length, "benefit plans")

  // ═══════════════════════════════════════════════════════════════
  // 17. CREATE COMPETENCY FRAMEWORK (Sprint 9)
  // ═══════════════════════════════════════════════════════════════
  const framework = await prisma.competencyFramework.upsert({
    where: { id: "framework-default" },
    update: {},
    create: {
      id: "framework-default",
      tenantId: tenant.id,
      name: "Khung năng lực chuẩn",
      description: "Khung năng lực áp dụng cho toàn công ty",
      isActive: true
    }
  })

  const competencies = [
    { id: "comp-technical", name: "Chuyên môn kỹ thuật", category: "Technical", isCore: false },
    { id: "comp-problem-solving", name: "Giải quyết vấn đề", category: "Problem Solving", isCore: true },
    { id: "comp-communication", name: "Giao tiếp", category: "Communication", isCore: true },
    { id: "comp-teamwork", name: "Làm việc nhóm", category: "Collaboration", isCore: true },
    { id: "comp-leadership", name: "Lãnh đạo", category: "Leadership", isCore: false }
  ]

  for (let i = 0; i < competencies.length; i++) {
    await prisma.competency.upsert({
      where: { id: competencies[i].id },
      update: {},
      create: {
        ...competencies[i],
        frameworkId: framework.id,
        levels: { "1": "Cơ bản", "2": "Khá", "3": "Tốt", "4": "Giỏi", "5": "Xuất sắc" },
        order: i
      }
    })
  }
  console.log("✅ Created competency framework with", competencies.length, "competencies")

  // ═══════════════════════════════════════════════════════════════
  // 18. CREATE SKILL CATEGORIES & SKILLS (Sprint 10)
  // ═══════════════════════════════════════════════════════════════
  const skillCategories = [
    { id: "sc-technical", name: "Kỹ năng kỹ thuật", skills: ["JavaScript", "TypeScript", "React", "Node.js", "SQL", "Python"] },
    { id: "sc-soft", name: "Kỹ năng mềm", skills: ["Giao tiếp", "Làm việc nhóm", "Thuyết trình", "Quản lý thời gian"] },
    { id: "sc-leadership", name: "Kỹ năng lãnh đạo", skills: ["Ra quyết định", "Coaching", "Delegation"] }
  ]

  for (let i = 0; i < skillCategories.length; i++) {
    const cat = skillCategories[i]
    await prisma.skillCategory.upsert({
      where: { id: cat.id },
      update: {},
      create: { id: cat.id, tenantId: tenant.id, name: cat.name, order: i }
    })
    for (let j = 0; j < cat.skills.length; j++) {
      await prisma.skill.upsert({
        where: { id: `skill-${cat.id}-${j}` },
        update: {},
        create: {
          id: `skill-${cat.id}-${j}`,
          tenantId: tenant.id,
          name: cat.skills[j],
          categoryId: cat.id,
          levels: { "1": "Beginner", "2": "Elementary", "3": "Intermediate", "4": "Advanced", "5": "Expert" },
          isActive: true,
          order: j
        }
      })
    }
  }
  console.log("✅ Created skill categories and skills")

  // ═══════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════
  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)

  console.log("\n" + "═".repeat(60))
  console.log("🎉 SEED COMPLETED SUCCESSFULLY!")
  console.log("═".repeat(60))
  console.log(`⏱️  Duration: ${duration} seconds`)
  console.log(`👥 Employees: ${allEmployees.length}`)
  console.log(`🏢 Departments: ${Object.keys(departmentMap).length}`)
  console.log(`💼 Positions: ${POSITIONS.length}`)
  console.log(`🏦 Branches: ${BRANCHES.length}`)
  console.log(`📅 Attendance Records: ${attendanceRecords.length}`)
  console.log(`🌴 Leave Balances: ${leaveBalances.length}`)
  console.log("")
  console.log("🔑 Demo Accounts:")
  console.log("   admin@demo.com     - Admin (Full access)")
  console.log("   hr@demo.com        - HR Manager")
  console.log("   manager@demo.com   - Department Manager")
  console.log("   employee@demo.com  - Regular Employee")
  console.log("   Password: Demo@123")
  console.log("═".repeat(60))
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
