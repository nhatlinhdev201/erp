/**
 * SEED DEMO — VietERP HRM Full Mock Data for 70-employee company
 * Run: npx tsx prisma/seed-demo.ts
 *
 * Creates: 70 employees, contracts, dependents, attendance, payroll,
 * recruitment, KPI, reviews, reports, HR events, advances, notifications, audit logs
 */
import "dotenv/config"
import {
  PrismaClient, UserRole, Gender, EmployeeStatus, ContractType, ContractStatus,
  RequisitionStatus, ApplicationStatus, InterviewResult, HREventType, HREventStatus,
  PayrollStatus, KPIStatus, ReviewCycle, ReviewStatus, RatingScale,
  ReportType, ReportStatus, AttendanceStatus, AdvanceStatus,
  NotificationType, AuditAction, OffboardingStatus,
  OnboardingTaskStatus, OffboardingTaskStatus,
  PayrollItemType
} from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// ═══════════════ HELPERS ═══════════════

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function removeAccents(str: string): string {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D")
}

function midnightUTC(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0))
}

// ═══════════════ VIETNAMESE NAME DATA ═══════════════

const lastNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Võ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"]
const middleNamesMale = ["Văn", "Quốc", "Minh", "Đức", "Hoàng", "Hữu", "Anh", "Xuân", "Thanh", "Tiến"]
const middleNamesFemale = ["Thị", "Ngọc", "Thanh", "Phương", "Hoài", "Bích", "Mai", "Kim", "Thu", "Hồng"]
const firstNamesMale = ["Hùng", "Tuấn", "Dũng", "Long", "Hải", "Tùng", "Thắng", "Đạt", "Khánh", "Phúc", "Bảo", "Trung", "Quang", "Nghĩa", "Sơn", "Tâm", "Toàn", "Trí", "Thành", "An"]
const firstNamesFemale = ["Hương", "Lan", "Trang", "Linh", "Hà", "Thảo", "Ngân", "Vy", "Trâm", "Nhi", "Yến", "Nhung", "Phượng", "Hạnh", "Trinh", "My", "Châu", "Uyên", "Diệu", "Ánh"]

const addresses = [
  "123 Nguyễn Huệ, Q1, TP.HCM", "456 Lê Lợi, Q1, TP.HCM", "789 Trần Hưng Đạo, Q5, TP.HCM",
  "321 Võ Văn Tần, Q3, TP.HCM", "654 Điện Biên Phủ, Bình Thạnh, TP.HCM", "987 Nguyễn Thị Minh Khai, Q3, TP.HCM",
  "111 Cách Mạng Tháng Tám, Q10, TP.HCM", "222 Hai Bà Trưng, Q1, TP.HCM", "333 Lý Tự Trọng, Q1, TP.HCM",
  "444 Pasteur, Q3, TP.HCM", "555 Nam Kỳ Khởi Nghĩa, Q3, TP.HCM", "666 Nguyễn Đình Chiểu, Q3, TP.HCM",
  "777 Phạm Ngũ Lão, Q1, TP.HCM", "888 Bùi Viện, Q1, TP.HCM", "999 Trương Định, Q3, TP.HCM",
  "12 Lê Duẩn, Q1, TP.HCM", "34 Nguyễn Văn Cừ, Q5, TP.HCM", "56 An Dương Vương, Q5, TP.HCM",
  "78 Phạm Văn Đồng, Thủ Đức, TP.HCM", "90 Võ Văn Ngân, Thủ Đức, TP.HCM",
  "15 Lê Văn Việt, Q9, TP.HCM", "27 Đỗ Xuân Hợp, Q9, TP.HCM",
  "39 Nguyễn Duy Trinh, Q2, TP.HCM", "51 Lương Định Của, Q2, TP.HCM",
]

const schools = [
  "Đại học Bách Khoa TP.HCM", "Đại học Khoa Học Tự Nhiên", "Đại học Công Nghệ TP.HCM",
  "Đại học Sư Phạm Kỹ Thuật", "Đại học Tôn Đức Thắng", "Đại học FPT",
  "Đại học Kinh Tế TP.HCM", "Đại học Ngoại Thương", "Đại học Quốc Tế TP.HCM",
  "Cao đẳng Kỹ Thuật Cao Thắng", "Đại học Cần Thơ", "Đại học Đà Nẵng",
]

const majors = [
  "Kỹ thuật Phần mềm", "Khoa học Máy tính", "Kỹ thuật Điện - Điện tử",
  "Kỹ thuật Cơ điện tử", "Kỹ thuật Cơ khí", "Quản trị Kinh doanh",
  "Kế toán - Tài chính", "Quản lý Nhân sự", "Marketing",
  "Tự động hoá", "Kỹ thuật Hàng không", "Vật lý Kỹ thuật",
]

const banks = ["VCB", "TCB", "MB", "BIDV", "ACB", "VPBank", "TPBank", "Sacombank"]
const bankBranches = ["CN HCM", "CN Q1", "CN Q3", "CN Bình Thạnh", "CN Thủ Đức", "CN Q7", "CN Tân Bình"]

const dependentRelations = ["CHILD", "SPOUSE", "PARENT"]
const depFirstNames = ["Minh", "An", "Bình", "Chi", "Huy", "Lan", "Mai", "Nam", "Phúc", "Quỳnh"]

// ═══════════════ EMPLOYEE DEFINITIONS (64 new + 6 existing = 70) ═══════════════

interface EmpDef {
  code: string
  gender: Gender
  dept: string // dept code
  pos: string  // position code
  status: EmployeeStatus
  startYear: number
  startMonth: number
  baseSalary: number
  hasUser?: boolean
  userRole?: UserRole
  email?: string
}

// We'll generate 64 more employees distributed across departments
const newEmployees: EmpDef[] = []

// Kỹ Thuật (DEPT-KT): 20 more → total ~22 with existing 2
for (let i = 0; i < 10; i++) {
  newEmployees.push({
    code: `RTR-${String(7 + i).padStart(4, "0")}`,
    gender: i % 3 === 0 ? Gender.FEMALE : Gender.MALE,
    dept: "DEPT-KT", pos: "POS-KSPM",
    status: i === 0 ? EmployeeStatus.PROBATION : EmployeeStatus.ACTIVE,
    startYear: randomPick([2021, 2022, 2023, 2024, 2025]),
    startMonth: randomInt(1, 12),
    baseSalary: randomInt(14, 25) * 1000000,
  })
}
for (let i = 0; i < 10; i++) {
  newEmployees.push({
    code: `RTR-${String(17 + i).padStart(4, "0")}`,
    gender: i % 4 === 0 ? Gender.FEMALE : Gender.MALE,
    dept: "DEPT-KT", pos: "POS-KSPH",
    status: i === 9 ? EmployeeStatus.PROBATION : EmployeeStatus.ACTIVE,
    startYear: randomPick([2021, 2022, 2023, 2024, 2025]),
    startMonth: randomInt(1, 12),
    baseSalary: randomInt(13, 22) * 1000000,
  })
}

// Sản Xuất Product (DEPT-SX): 18 more
for (let i = 0; i < 8; i++) {
  newEmployees.push({
    code: `RTR-${String(27 + i).padStart(4, "0")}`,
    gender: i % 5 === 0 ? Gender.FEMALE : Gender.MALE,
    dept: "DEPT-SX", pos: "POS-KSD",
    status: EmployeeStatus.ACTIVE,
    startYear: randomPick([2021, 2022, 2023, 2024]),
    startMonth: randomInt(1, 12),
    baseSalary: randomInt(12, 20) * 1000000,
  })
}
for (let i = 0; i < 10; i++) {
  newEmployees.push({
    code: `RTR-${String(35 + i).padStart(4, "0")}`,
    gender: i % 4 === 0 ? Gender.FEMALE : Gender.MALE,
    dept: "DEPT-SX", pos: "POS-CNSX",
    status: i === 9 ? EmployeeStatus.ON_LEAVE : EmployeeStatus.ACTIVE,
    startYear: randomPick([2022, 2023, 2024, 2025]),
    startMonth: randomInt(1, 12),
    baseSalary: randomInt(8, 14) * 1000000,
  })
}

// Hành Chính - Nhân Sự (DEPT-HCNS): 4 more → total ~7
for (let i = 0; i < 4; i++) {
  newEmployees.push({
    code: `RTR-${String(45 + i).padStart(4, "0")}`,
    gender: i % 2 === 0 ? Gender.FEMALE : Gender.MALE,
    dept: "DEPT-HCNS", pos: "POS-HR",
    status: EmployeeStatus.ACTIVE,
    startYear: randomPick([2023, 2024, 2025]),
    startMonth: randomInt(1, 12),
    baseSalary: randomInt(10, 16) * 1000000,
  })
}

// Kế Toán (DEPT-KT2): 4 more → total ~5
for (let i = 0; i < 4; i++) {
  newEmployees.push({
    code: `RTR-${String(49 + i).padStart(4, "0")}`,
    gender: i % 2 === 0 ? Gender.FEMALE : Gender.MALE,
    dept: "DEPT-KT2", pos: "POS-KTTV",
    status: EmployeeStatus.ACTIVE,
    startYear: randomPick([2022, 2023, 2024]),
    startMonth: randomInt(1, 12),
    baseSalary: randomInt(11, 17) * 1000000,
  })
}

// Kinh Doanh (DEPT-KD): 8 more
// First add new positions for KD
for (let i = 0; i < 8; i++) {
  newEmployees.push({
    code: `RTR-${String(53 + i).padStart(4, "0")}`,
    gender: i % 3 === 0 ? Gender.FEMALE : Gender.MALE,
    dept: "DEPT-KD", pos: "POS-KD",
    status: i === 7 ? EmployeeStatus.PROBATION : EmployeeStatus.ACTIVE,
    startYear: randomPick([2022, 2023, 2024, 2025]),
    startMonth: randomInt(1, 12),
    baseSalary: randomInt(10, 18) * 1000000,
  })
}

// Department managers (2 more — SX, KD)
newEmployees.push({
  code: "RTR-0061",
  gender: Gender.MALE,
  dept: "DEPT-SX", pos: "POS-KSD",
  status: EmployeeStatus.ACTIVE,
  startYear: 2020, startMonth: 3,
  baseSalary: 22000000,
  hasUser: true, userRole: UserRole.DEPT_MANAGER,
  email: "sanxuat.mgr@rtr.vn",
})
newEmployees.push({
  code: "RTR-0062",
  gender: Gender.FEMALE,
  dept: "DEPT-KD", pos: "POS-KD",
  status: EmployeeStatus.ACTIVE,
  startYear: 2021, startMonth: 6,
  baseSalary: 20000000,
  hasUser: true, userRole: UserRole.DEPT_MANAGER,
  email: "kinhdoanh.mgr@rtr.vn",
})

// A few resigned employees (for reports/turnover data)
newEmployees.push({
  code: "RTR-0063",
  gender: Gender.MALE,
  dept: "DEPT-KT", pos: "POS-KSPM",
  status: EmployeeStatus.RESIGNED,
  startYear: 2022, startMonth: 3,
  baseSalary: 16000000,
})
newEmployees.push({
  code: "RTR-0064",
  gender: Gender.FEMALE,
  dept: "DEPT-SX", pos: "POS-CNSX",
  status: EmployeeStatus.RESIGNED,
  startYear: 2023, startMonth: 1,
  baseSalary: 9000000,
})

// 64 new employees total

// ═══════════════ MAIN SEED ═══════════════
async function main() {
  console.log("🌱 SEED DEMO — Starting full mock data generation...")
  console.log("⚠️  This script ADDS data on top of the base seed. Run base seed first!")

  // SECURITY: no hardcoded password in git — env or random (printed once).
  const seedPw = process.env.SEED_DEMO_PASSWORD ||
    Array.from(require('crypto').randomBytes(16))
      .map((b: number) => 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'[b % 56])
      .join('')
  if (seedPw.length < 8) throw new Error('SEED_DEMO_PASSWORD too short (min 8).')
  console.log(`🔐 Demo users password (save now, shown once): ${seedPw}`)
  const hashedPassword = await bcrypt.hash(seedPw, 12)

  // Fetch existing data
  const departments = await prisma.department.findMany()
  const positions = await prisma.position.findMany()
  const existingEmployees = await prisma.employee.findMany({ include: { user: true } })
  const existingUsers = await prisma.user.findMany()

  const deptMap = new Map(departments.map(d => [d.code, d]))
  const posMap = new Map(positions.map(p => [p.code, p]))

  // ═══════════════ ADD KD POSITION ═══════════════
  let posKD = posMap.get("POS-KD")
  if (!posKD) {
    posKD = await prisma.position.upsert({
      where: { code: "POS-KD" },
      update: {},
      create: {
        name: "Nhân Viên Kinh Doanh",
        code: "POS-KD",
        departmentId: deptMap.get("DEPT-KD")!.id,
        description: "Kinh doanh & phát triển thị trường product",
      },
    })
    posMap.set("POS-KD", posKD)
    console.log("✅ Position POS-KD created")
  }

  // Add QA position for diversity
  let posQA = posMap.get("POS-QA")
  if (!posQA) {
    posQA = await prisma.position.upsert({
      where: { code: "POS-QA" },
      update: {},
      create: {
        name: "QA Engineer",
        code: "POS-QA",
        departmentId: deptMap.get("DEPT-KT")!.id,
        description: "Kiểm thử & đảm bảo chất lượng phần mềm",
      },
    })
    posMap.set("POS-QA", posQA)
    console.log("✅ Position POS-QA created")
  }

  // ═══════════════ CREATE 64 NEW EMPLOYEES ═══════════════
  const createdEmployeeIds: string[] = existingEmployees.map(e => e.id)
  const allEmployeeData: { id: string; code: string; status: EmployeeStatus; deptId: string; baseSalary: number; startDate: Date }[] = []

  // Include existing employees in allEmployeeData
  for (const emp of existingEmployees) {
    const contract = await prisma.contract.findFirst({
      where: { employeeId: emp.id, status: "ACTIVE" },
    })
    allEmployeeData.push({
      id: emp.id,
      code: emp.employeeCode,
      status: emp.status,
      deptId: emp.departmentId || "",
      baseSalary: contract ? Number(contract.baseSalary) : 15000000,
      startDate: emp.startDate || new Date("2023-01-01"),
    })
  }

  let nameIndex = 0
  for (const empDef of newEmployees) {
    // Skip if already exists
    const existing = await prisma.employee.findUnique({ where: { employeeCode: empDef.code } })
    if (existing) {
      createdEmployeeIds.push(existing.id)
      continue
    }

    const isFemale = empDef.gender === Gender.FEMALE
    const lastName = lastNames[nameIndex % lastNames.length]
    const middleName = isFemale
      ? middleNamesFemale[nameIndex % middleNamesFemale.length]
      : middleNamesMale[nameIndex % middleNamesMale.length]
    const firstName = isFemale
      ? firstNamesFemale[nameIndex % firstNamesFemale.length]
      : firstNamesMale[nameIndex % firstNamesMale.length]
    const fullName = `${lastName} ${middleName} ${firstName}`
    const nameNoAccent = removeAccents(fullName).toUpperCase()

    const dept = deptMap.get(empDef.dept)!
    const pos = posMap.get(empDef.pos)!
    const startDate = midnightUTC(empDef.startYear, empDef.startMonth, randomInt(1, 28))
    const dob = randomDate(new Date("1985-01-01"), new Date("2000-12-31"))
    const codeNum = parseInt(empDef.code.replace("RTR-", ""))
    const nationalId = `079${String(dob.getFullYear()).slice(-2)}${String(codeNum).padStart(6, "0")}`

    let userId: string | undefined
    if (empDef.hasUser && empDef.email) {
      const user = await prisma.user.upsert({
        where: { email: empDef.email },
        update: {},
        create: {
          email: empDef.email,
          password: hashedPassword,
          name: fullName,
          role: empDef.userRole!,
          isActive: true,
        },
      })
      userId = user.id
    }

    const emp = await prisma.employee.create({
      data: {
        employeeCode: empDef.code,
        userId,
        fullName,
        nameNoAccent,
        gender: empDef.gender,
        dateOfBirth: dob,
        phone: `09${String(randomInt(10000000, 99999999))}`,
        permanentAddress: randomPick(addresses),
        currentAddress: Math.random() > 0.5 ? randomPick(addresses) : undefined,
        nationalId,
        nationalIdDate: randomDate(new Date("2020-01-01"), new Date("2024-12-31")),
        nationalIdPlace: "Cục CSQLHC về TTXH",
        departmentId: dept.id,
        positionId: pos.id,
        startDate,
        resignDate: empDef.status === EmployeeStatus.RESIGNED
          ? randomDate(new Date("2025-06-01"), new Date("2026-01-31"))
          : undefined,
        status: empDef.status,
        companyEmail: empDef.email || `${removeAccents(firstName).toLowerCase()}.${removeAccents(lastName).toLowerCase()}${codeNum}@rtr.vn`,
        personalEmail: `${removeAccents(firstName).toLowerCase()}${codeNum}@gmail.com`,
        bankAccount: String(randomInt(1000000000, 9999999999)),
        bankBranch: `${randomPick(banks)} ${randomPick(bankBranches)}`,
        taxCode: `8${String(randomInt(100000000, 999999999))}`,
        insuranceCode: `BH${String(codeNum).padStart(6, "0")}`,
        school: randomPick(schools),
        major: randomPick(majors),
        vehiclePlate: Math.random() > 0.5 ? `${randomInt(50, 99)}${String.fromCharCode(65 + randomInt(0, 25))}1-${String(randomInt(10000, 99999))}` : undefined,
      },
    })

    createdEmployeeIds.push(emp.id)
    allEmployeeData.push({
      id: emp.id, code: empDef.code, status: empDef.status,
      deptId: dept.id, baseSalary: empDef.baseSalary, startDate,
    })
    nameIndex++
  }
  console.log(`✅ ${nameIndex} new employees created (total: ${allEmployeeData.length})`)

  // Set dept managers for SX and KD
  const empSXMgr = await prisma.employee.findUnique({ where: { employeeCode: "RTR-0061" } })
  const empKDMgr = await prisma.employee.findUnique({ where: { employeeCode: "RTR-0062" } })
  if (empSXMgr) {
    await prisma.department.update({ where: { code: "DEPT-SX" }, data: { managerId: empSXMgr.id } })
  }
  if (empKDMgr) {
    await prisma.department.update({ where: { code: "DEPT-KD" }, data: { managerId: empKDMgr.id } })
  }

  // ═══════════════ CONTRACTS FOR ALL NEW EMPLOYEES ═══════════════
  for (const empData of allEmployeeData) {
    // Skip if already has active contract (existing employees)
    const existingContract = await prisma.contract.findFirst({
      where: { employeeId: empData.id, status: "ACTIVE" },
    })
    if (existingContract) continue

    const codeNum = parseInt(empData.code.replace("RTR-", ""))
    const isResigned = empData.status === EmployeeStatus.RESIGNED
    const isProbation = empData.status === EmployeeStatus.PROBATION

    const officialFrom = empData.startDate
    const officialTo = isProbation
      ? new Date(officialFrom.getTime() + 90 * 24 * 3600 * 1000)
      : (codeNum % 3 === 0
        ? undefined // indefinite
        : new Date(officialFrom.getFullYear() + 2, officialFrom.getMonth(), officialFrom.getDate()))

    await prisma.contract.create({
      data: {
        employeeId: empData.id,
        contractNo: `HDLD-${officialFrom.getFullYear()}-${String(codeNum).padStart(3, "0")}`,
        type: isProbation ? ContractType.PROBATION
          : codeNum % 3 === 0 ? ContractType.INDEFINITE_TERM
          : ContractType.DEFINITE_TERM,
        status: isResigned ? ContractStatus.TERMINATED : ContractStatus.ACTIVE,
        officialFrom,
        officialTo,
        baseSalary: empData.baseSalary,
        mealAllowance: 730000,
        phoneAllowance: randomPick([200000, 300000, 500000]),
        fuelAllowance: randomPick([300000, 500000]),
        perfAllowance: empData.baseSalary >= 18000000 ? randomPick([1000000, 1500000, 2000000]) : 0,
        kpiAmount: empData.baseSalary >= 15000000 ? randomPick([1000000, 1500000, 2000000, 3000000]) : 0,
      },
    })
  }
  console.log("✅ Contracts created for all employees")

  // ═══════════════ DEPENDENTS (30 employees get 1-2 dependents) ═══════════════
  const activeEmployees = allEmployeeData.filter(e => e.status !== EmployeeStatus.RESIGNED)
  const employeesWithDeps = activeEmployees.slice(0, 30)

  for (const empData of employeesWithDeps) {
    const existing = await prisma.dependent.findFirst({ where: { employeeId: empData.id } })
    if (existing) continue

    const depCount = randomInt(1, 2)
    for (let d = 0; d < depCount; d++) {
      const rel = randomPick(dependentRelations)
      const depName = `${randomPick(lastNames)} ${randomPick(middleNamesFemale)} ${randomPick(depFirstNames)}`
      await prisma.dependent.create({
        data: {
          employeeId: empData.id,
          fullName: depName,
          relationship: rel,
          dateOfBirth: rel === "CHILD"
            ? randomDate(new Date("2015-01-01"), new Date("2024-12-31"))
            : randomDate(new Date("1950-01-01"), new Date("1975-12-31")),
          nationalId: rel !== "CHILD" ? `079${String(randomInt(100000000, 999999999))}` : undefined,
          taxDepCode: `NPT${String(randomInt(100000, 999999))}`,
          registeredAt: randomDate(new Date("2024-01-01"), new Date("2026-01-01")),
          isActive: true,
        },
      })
    }
  }

  // Sync dependent count
  const depCounts = await prisma.dependent.groupBy({
    by: ["employeeId"],
    _count: true,
    where: { isActive: true },
  })
  console.log(`✅ Dependents created for ${employeesWithDeps.length} employees`)

  // ═══════════════ LEAVE BALANCES 2026 ═══════════════
  for (const emp of activeEmployees) {
    await prisma.leaveBalance.upsert({
      where: { employeeId_year: { employeeId: emp.id, year: 2026 } },
      update: {},
      create: {
        employeeId: emp.id,
        year: 2026,
        totalDays: 12,
        usedDays: randomInt(0, 4),
        remainingDays: 12 - randomInt(0, 4),
      },
    })
  }
  console.log("✅ Leave balances 2026 created")

  // ═══════════════ ATTENDANCE RECORDS (Jan + Feb 2026) ═══════════════
  const attendanceMonths = [
    { year: 2026, month: 1, days: 31 },
    { year: 2026, month: 2, days: 28 },
  ]

  for (const period of attendanceMonths) {
    for (const emp of activeEmployees.slice(0, 68)) { // only active employees
      for (let day = 1; day <= period.days; day++) {
        const date = midnightUTC(period.year, period.month, day)
        const dayOfWeek = date.getDay()
        if (dayOfWeek === 0 || dayOfWeek === 6) continue // skip weekends

        const existing = await prisma.attendanceRecord.findUnique({
          where: { employeeId_date: { employeeId: emp.id, date } },
        })
        if (existing) continue

        const rand = Math.random()
        let status: AttendanceStatus
        let checkInHour: number, checkInMin: number
        let checkOutHour: number, checkOutMin: number

        if (rand < 0.80) {
          // On time
          status = AttendanceStatus.PRESENT
          checkInHour = 7; checkInMin = randomInt(30, 59)
          checkOutHour = 17; checkOutMin = randomInt(30, 59)
        } else if (rand < 0.90) {
          // Late
          status = AttendanceStatus.LATE
          checkInHour = 8; checkInMin = randomInt(31, 59)
          checkOutHour = 17; checkOutMin = randomInt(30, 59)
        } else if (rand < 0.95) {
          // Half day
          status = AttendanceStatus.HALF_DAY
          checkInHour = 8; checkInMin = randomInt(0, 30)
          checkOutHour = 12; checkOutMin = randomInt(0, 30)
        } else if (rand < 0.97) {
          // Leave
          status = AttendanceStatus.LEAVE
          checkInHour = 0; checkInMin = 0
          checkOutHour = 0; checkOutMin = 0
        } else {
          // Absent
          status = AttendanceStatus.ABSENT
          checkInHour = 0; checkInMin = 0
          checkOutHour = 0; checkOutMin = 0
        }

        const hasCheckIn = status !== AttendanceStatus.LEAVE && status !== AttendanceStatus.ABSENT
        const checkInAt = hasCheckIn ? new Date(Date.UTC(period.year, period.month - 1, day, checkInHour, checkInMin)) : undefined
        const checkOutAt = hasCheckIn ? new Date(Date.UTC(period.year, period.month - 1, day, checkOutHour, checkOutMin)) : undefined

        let workHours = 0
        if (hasCheckIn && checkInAt && checkOutAt) {
          const diffMs = checkOutAt.getTime() - checkInAt.getTime()
          workHours = Math.max(0, diffMs / (1000 * 60 * 60) - 1) // minus lunch break
        }

        await prisma.attendanceRecord.create({
          data: {
            employeeId: emp.id,
            date,
            checkInAt,
            checkOutAt,
            status,
            workHours: Math.round(workHours * 100) / 100,
          },
        })
      }
    }
  }
  console.log("✅ Attendance records created (Jan-Feb 2026)")

  // ═══════════════ PAYROLL PERIODS (Dec 2025, Jan 2026, Feb 2026) ═══════════════
  const hrUser = existingUsers.find(u => u.role === "HR_MANAGER") || existingUsers[0]

  const payrollMonths = [
    { month: 12, year: 2025, status: PayrollStatus.PAID },
    { month: 1, year: 2026, status: PayrollStatus.PAID },
    { month: 2, year: 2026, status: PayrollStatus.APPROVED },
  ]

  for (const pm of payrollMonths) {
    let period = await prisma.payrollPeriod.findUnique({
      where: { month_year: { month: pm.month, year: pm.year } },
    })
    if (!period) {
      period = await prisma.payrollPeriod.create({
        data: {
          month: pm.month,
          year: pm.year,
          status: pm.status,
          createdBy: hrUser.id,
          submittedAt: new Date(),
          approvedAt: new Date(),
          paidAt: pm.status === PayrollStatus.PAID ? new Date() : undefined,
        },
      })
    }

    // Create employee payrolls
    for (const emp of activeEmployees) {
      const existing = await prisma.employeePayroll.findUnique({
        where: { periodId_employeeId: { periodId: period.id, employeeId: emp.id } },
      })
      if (existing) continue

      const baseSalary = emp.baseSalary
      const standardDays = 26
      const actualDays = randomInt(22, 26)
      const mealAllowance = 730000
      const phoneAllowance = randomPick([200000, 300000, 500000])
      const fuelAllowance = randomPick([300000, 500000])
      const perfAllowance = baseSalary >= 18000000 ? randomPick([1000000, 1500000]) : 0

      const totalContractSalary = baseSalary + mealAllowance + phoneAllowance + fuelAllowance + perfAllowance
      const totalActualSalary = Math.round(totalContractSalary * actualDays / standardDays)

      const depCount = depCounts.find(d => d.employeeId === emp.id)?._count || 0
      const personalDeduction = 11000000
      const dependentDeduction = depCount * 4400000

      const insuranceBase = Math.min(baseSalary, 36000000) // cap at 36M
      const bhxh = insuranceBase * 0.08
      const bhyt = insuranceBase * 0.015
      const bhtn = insuranceBase * 0.01
      const totalIns = bhxh + bhyt + bhtn

      const totalIncome = totalActualSalary
      const taxableIncome = Math.max(0, totalIncome - totalIns - personalDeduction - dependentDeduction)

      // Simple PIT calculation (progressive)
      let pit = 0
      if (taxableIncome > 0) {
        if (taxableIncome <= 5000000) pit = taxableIncome * 0.05
        else if (taxableIncome <= 10000000) pit = 250000 + (taxableIncome - 5000000) * 0.10
        else if (taxableIncome <= 18000000) pit = 750000 + (taxableIncome - 10000000) * 0.15
        else if (taxableIncome <= 32000000) pit = 1950000 + (taxableIncome - 18000000) * 0.20
        else pit = 4750000 + (taxableIncome - 32000000) * 0.25
      }
      pit = Math.round(pit)

      const netSalary = totalActualSalary - totalIns - pit

      // Employer contributions
      const bhxhEr = insuranceBase * 0.175
      const bhytEr = insuranceBase * 0.03
      const bhtnEr = insuranceBase * 0.01
      const bhtnldEr = insuranceBase * 0.005
      const totalErIns = bhxhEr + bhytEr + bhtnEr + bhtnldEr

      await prisma.employeePayroll.create({
        data: {
          periodId: period.id,
          employeeId: emp.id,
          actualDays,
          standardDays,
          baseSalary,
          mealAllowance,
          phoneAllowance,
          fuelAllowance,
          perfAllowance,
          totalContractSalary,
          totalActualSalary,
          personalDeduction,
          dependentCount: depCount,
          dependentDeduction,
          totalIncome,
          taxableIncome,
          insuranceBase,
          bhxhEmployee: bhxh,
          bhytEmployee: bhyt,
          bhtnEmployee: bhtn,
          totalEmployeeIns: totalIns,
          pitAmount: pit,
          advanceDeduction: 0,
          netSalary,
          bhxhEmployer: bhxhEr,
          bhytEmployer: bhytEr,
          bhtnEmployer: bhtnEr,
          bhtnldEmployer: bhtnldEr,
          totalEmployerIns: totalErIns,
          remainingLeave: randomInt(8, 12),
          bankAccount: String(randomInt(1000000000, 9999999999)),
          bankName: randomPick(banks),
        },
      })
    }
  }
  console.log("✅ Payroll periods + employee payrolls created (3 months)")

  // ═══════════════ RECRUITMENT (5 requisitions, 25 candidates, 25 applications) ═══════════════
  const adminUser = existingUsers.find(u => u.role === "SUPER_ADMIN")!

  const requisitions = [
    { title: "Kỹ Sư Phần Mềm Embedded", dept: "DEPT-KT", pos: "POS-KSPM", headcount: 3, status: RequisitionStatus.OPEN, salaryFrom: 15000000, salaryTo: 25000000 },
    { title: "Kỹ Sư Phần Cứng PCB", dept: "DEPT-KT", pos: "POS-KSPH", headcount: 2, status: RequisitionStatus.OPEN, salaryFrom: 14000000, salaryTo: 22000000 },
    { title: "Công Nhân Lắp Ráp Product", dept: "DEPT-SX", pos: "POS-CNSX", headcount: 5, status: RequisitionStatus.OPEN, salaryFrom: 8000000, salaryTo: 12000000 },
    { title: "Nhân Viên Kinh Doanh", dept: "DEPT-KD", pos: "POS-KD", headcount: 2, status: RequisitionStatus.APPROVED, salaryFrom: 10000000, salaryTo: 18000000 },
    { title: "QA Engineer", dept: "DEPT-KT", pos: "POS-QA", headcount: 1, status: RequisitionStatus.CLOSED, salaryFrom: 13000000, salaryTo: 20000000 },
    { title: "Kỹ Sư Product Thử Nghiệm", dept: "DEPT-SX", pos: "POS-KSD", headcount: 2, status: RequisitionStatus.OPEN, salaryFrom: 12000000, salaryTo: 20000000 },
  ]

  const createdReqIds: string[] = []
  for (const req of requisitions) {
    const dept = deptMap.get(req.dept)!
    const pos = posMap.get(req.pos)!
    const jr = await prisma.jobRequisition.create({
      data: {
        title: req.title,
        departmentId: dept.id,
        positionId: pos.id,
        requestedBy: adminUser.id,
        headcount: req.headcount,
        contractType: ContractType.DEFINITE_TERM,
        salaryFrom: req.salaryFrom,
        salaryTo: req.salaryTo,
        description: `Tuyển dụng ${req.title} cho công ty RTR Vietnam`,
        requirements: "Kinh nghiệm 1-3 năm, tiếng Anh giao tiếp tốt",
        status: req.status,
        approvedBy: req.status !== RequisitionStatus.DRAFT ? hrUser.id : undefined,
        approvedAt: req.status !== RequisitionStatus.DRAFT ? new Date() : undefined,
        closedAt: req.status === RequisitionStatus.CLOSED ? new Date() : undefined,
      },
    })
    createdReqIds.push(jr.id)
  }
  console.log("✅ 6 job requisitions created")

  // Candidates
  const candidateNames = [
    "Nguyễn Văn Tài", "Trần Thị Bích", "Lê Hoàng Nam", "Phạm Ngọc Anh", "Hoàng Minh Đức",
    "Vũ Thị Hồng", "Đặng Quốc Bảo", "Bùi Thanh Tâm", "Ngô Phương Linh", "Hồ Văn Thắng",
    "Dương Thị Mai", "Phan Anh Tuấn", "Lý Minh Trí", "Huỳnh Ngọc Diệu", "Võ Đình Khang",
    "Trần Hữu Phúc", "Nguyễn Thị Yến", "Lê Quốc Hùng", "Phạm Thanh Sơn", "Hoàng Bích Ngân",
    "Vũ Minh Long", "Đặng Thị Trâm", "Bùi Văn Hải", "Ngô Anh Khánh", "Hồ Thị Uyên",
  ]

  const candidateIds: string[] = []
  for (let i = 0; i < candidateNames.length; i++) {
    const name = candidateNames[i]
    const email = `${removeAccents(name).toLowerCase().replace(/\s/g, ".")}@gmail.com`

    let candidate = await prisma.candidate.findUnique({ where: { email } })
    if (!candidate) {
      candidate = await prisma.candidate.create({
        data: {
          fullName: name,
          email,
          phone: `09${String(randomInt(10000000, 99999999))}`,
          school: randomPick(schools),
          major: randomPick(majors),
          source: randomPick(["LinkedIn", "TopCV", "VietnamWorks", "Referral", "Website"]),
        },
      })
    }
    candidateIds.push(candidate.id)
  }
  console.log("✅ 25 candidates created")

  // Applications distributed across pipeline stages
  const appStatuses: ApplicationStatus[] = [
    ApplicationStatus.NEW, ApplicationStatus.NEW, ApplicationStatus.NEW,
    ApplicationStatus.SCREENING, ApplicationStatus.SCREENING,
    ApplicationStatus.INTERVIEW, ApplicationStatus.INTERVIEW, ApplicationStatus.INTERVIEW,
    ApplicationStatus.OFFERED, ApplicationStatus.OFFERED,
    ApplicationStatus.ACCEPTED,
    ApplicationStatus.REJECTED, ApplicationStatus.REJECTED,
    ApplicationStatus.WITHDRAWN,
    ApplicationStatus.NEW, ApplicationStatus.SCREENING,
    ApplicationStatus.INTERVIEW, ApplicationStatus.OFFERED,
    ApplicationStatus.NEW, ApplicationStatus.INTERVIEW,
    ApplicationStatus.SCREENING, ApplicationStatus.NEW,
    ApplicationStatus.OFFERED, ApplicationStatus.INTERVIEW,
    ApplicationStatus.REJECTED,
  ]

  for (let i = 0; i < candidateIds.length; i++) {
    const reqId = createdReqIds[i % createdReqIds.length]
    const status = appStatuses[i]

    const app = await prisma.application.create({
      data: {
        requisitionId: reqId,
        candidateId: candidateIds[i],
        status,
        expectedSalary: randomInt(10, 25) * 1000000,
        coverLetter: `Tôi rất quan tâm đến vị trí này tại RTR Vietnam. Với ${randomInt(1, 5)} năm kinh nghiệm...`,
        screeningNote: [ApplicationStatus.SCREENING, ApplicationStatus.INTERVIEW, ApplicationStatus.OFFERED, ApplicationStatus.ACCEPTED].includes(status)
          ? "Hồ sơ đạt yêu cầu, chuyển sang vòng tiếp theo" : undefined,
        offeredSalary: [ApplicationStatus.OFFERED, ApplicationStatus.ACCEPTED].includes(status) ? randomInt(12, 22) * 1000000 : undefined,
        offeredAt: [ApplicationStatus.OFFERED, ApplicationStatus.ACCEPTED].includes(status) ? new Date() : undefined,
        offerNote: status === ApplicationStatus.OFFERED ? "Offer gửi qua email, hạn phản hồi 7 ngày" : undefined,
        rejectionReason: status === ApplicationStatus.REJECTED ? randomPick(["Không đạt yêu cầu kỹ thuật", "Mong muốn lương quá cao", "Thiếu kinh nghiệm"]) : undefined,
        interviewScheduledAt: [ApplicationStatus.INTERVIEW, ApplicationStatus.OFFERED, ApplicationStatus.ACCEPTED].includes(status)
          ? randomDate(new Date("2026-02-01"), new Date("2026-03-15")) : undefined,
      },
    })

    // Add interviews for those in INTERVIEW+ stage
    if ([ApplicationStatus.INTERVIEW, ApplicationStatus.OFFERED, ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED].includes(status)) {
      await prisma.interview.create({
        data: {
          applicationId: app.id,
          round: 1,
          scheduledAt: randomDate(new Date("2026-02-01"), new Date("2026-03-10")),
          location: randomPick(["Phòng họp A", "Phòng họp B", "Online - Google Meet"]),
          interviewerIds: [adminUser.id],
          result: status === ApplicationStatus.REJECTED ? InterviewResult.FAIL
            : [ApplicationStatus.OFFERED, ApplicationStatus.ACCEPTED].includes(status) ? InterviewResult.PASS
            : InterviewResult.PENDING,
          score: status !== ApplicationStatus.INTERVIEW ? randomInt(60, 95) : undefined,
          notes: status !== ApplicationStatus.INTERVIEW ? "Ứng viên có tiềm năng tốt" : undefined,
        },
      })
    }
  }
  console.log("✅ 25 applications + interviews created")

  // ═══════════════ KPI PERIODS (Dec 2025, Jan 2026) ═══════════════
  const kpiMonths = [
    { month: 12, year: 2025, status: KPIStatus.PUBLISHED },
    { month: 1, year: 2026, status: KPIStatus.PUBLISHED },
    { month: 2, year: 2026, status: KPIStatus.DRAFT },
  ]

  for (const km of kpiMonths) {
    let kpiPeriod = await prisma.kPIPeriod.findUnique({
      where: { month_year: { month: km.month, year: km.year } },
    })
    if (!kpiPeriod) {
      kpiPeriod = await prisma.kPIPeriod.create({
        data: {
          month: km.month,
          year: km.year,
          status: km.status,
          createdBy: hrUser.id,
          publishedAt: km.status === KPIStatus.PUBLISHED ? new Date() : undefined,
        },
      })
    }

    if (km.status !== KPIStatus.DRAFT) {
      for (const emp of activeEmployees) {
        const existing = await prisma.kPIScore.findUnique({
          where: { periodId_employeeId: { periodId: kpiPeriod.id, employeeId: emp.id } },
        })
        if (existing) continue

        const score = randomPick([0.7, 0.8, 0.85, 0.9, 0.95, 1.0, 1.05, 1.1])
        const kpiAmount = emp.baseSalary >= 15000000 ? randomPick([1000000, 1500000, 2000000]) : 0

        await prisma.kPIScore.create({
          data: {
            periodId: kpiPeriod.id,
            employeeId: emp.id,
            score,
            kpiAmount: Math.round(kpiAmount * score),
            enteredBy: hrUser.id,
          },
        })
      }
    }
  }
  console.log("✅ KPI periods + scores created")

  // ═══════════════ HR EVENTS (15 events) ═══════════════
  const hrEventTypes = [
    HREventType.DEPARTMENT_TRANSFER,
    HREventType.PROMOTION,
    HREventType.SALARY_ADJUSTMENT,
    HREventType.RECOGNITION,
    HREventType.DISCIPLINARY,
  ]

  const eventEmployees = activeEmployees.slice(5, 20)
  for (let i = 0; i < 15; i++) {
    const emp = eventEmployees[i % eventEmployees.length]
    const eventType = hrEventTypes[i % hrEventTypes.length]

    let payload: Record<string, unknown> = {}
    if (eventType === HREventType.DEPARTMENT_TRANSFER) {
      payload = { fromDepartment: "Kỹ Thuật", toDepartment: "Sản Xuất Product", reason: "Điều chuyển theo nhu cầu công việc" }
    } else if (eventType === HREventType.PROMOTION) {
      payload = { fromPosition: "Nhân viên", toPosition: "Trưởng nhóm", reason: "Hoàn thành xuất sắc nhiệm vụ" }
    } else if (eventType === HREventType.SALARY_ADJUSTMENT) {
      payload = { oldSalary: emp.baseSalary, newSalary: emp.baseSalary + 2000000, reason: "Điều chỉnh lương định kỳ" }
    } else if (eventType === HREventType.RECOGNITION) {
      payload = { type: "Khen thưởng", reason: "Nhân viên xuất sắc quý 4/2025", amount: 2000000 }
    } else {
      payload = { type: "Nhắc nhở", reason: "Đi muộn nhiều lần trong tháng" }
    }

    await prisma.hREvent.create({
      data: {
        employeeId: emp.id,
        type: eventType,
        status: i < 10 ? HREventStatus.APPROVED : HREventStatus.PENDING,
        requestedBy: hrUser.id,
        approvedBy: i < 10 ? adminUser.id : undefined,
        approvedAt: i < 10 ? randomDate(new Date("2025-10-01"), new Date("2026-03-01")) : undefined,
        effectiveDate: randomDate(new Date("2025-10-01"), new Date("2026-03-15")),
        payload,
        note: `${eventType} — Quyết định số ${randomInt(100, 999)}/QĐ-RTR`,
      },
    })
  }
  console.log("✅ 15 HR events created")

  // ═══════════════ REPORTS / LEAVE / OT (40 reports) ═══════════════
  const reportTypes = [
    ReportType.LEAVE_PAID, ReportType.LEAVE_PAID, ReportType.LEAVE_PAID,
    ReportType.OVERTIME, ReportType.OVERTIME,
    ReportType.BUSINESS_TRIP, ReportType.BUSINESS_TRIP,
    ReportType.LEAVE_SICK,
    ReportType.LEAVE_UNPAID,
    ReportType.NOTE,
  ]

  const reportStatuses = [
    ReportStatus.APPROVED_FINAL, ReportStatus.APPROVED_FINAL, ReportStatus.APPROVED_FINAL,
    ReportStatus.CLOSED, ReportStatus.CLOSED,
    ReportStatus.SUBMITTED, ReportStatus.SUBMITTED,
    ReportStatus.APPROVED_L1,
    ReportStatus.DRAFT,
    ReportStatus.RETURNED_L1,
  ]

  for (let i = 0; i < 40; i++) {
    const emp = activeEmployees[i % activeEmployees.length]
    const reportType = reportTypes[i % reportTypes.length]
    const status = reportStatuses[i % reportStatuses.length]
    const startDate = randomDate(new Date("2026-01-01"), new Date("2026-03-09"))
    const endDate = new Date(startDate.getTime() + randomInt(1, 3) * 24 * 3600 * 1000)

    let payload: Record<string, unknown> = {}
    if (reportType === ReportType.OVERTIME) {
      payload = { overtimeType: "WEEKDAY", hours: randomInt(2, 4), reason: "Hoàn thành dự án gấp" }
    } else if (reportType === ReportType.BUSINESS_TRIP) {
      payload = { destination: randomPick(["Hà Nội", "Đà Nẵng", "Cần Thơ"]), purpose: "Khảo sát thị trường" }
    } else if (reportType === ReportType.LEAVE_PAID || reportType === ReportType.LEAVE_UNPAID) {
      payload = { reason: randomPick(["Việc gia đình", "Khám bệnh", "Nghỉ phép cá nhân"]) }
    }

    await prisma.report.create({
      data: {
        employeeId: emp.id,
        type: reportType,
        status,
        startDate,
        endDate,
        notes: `Đơn ${reportType} — ${randomPick(["Xin phê duyệt", "Đề nghị duyệt"])}`,
        payload,
        submittedAt: status !== ReportStatus.DRAFT ? randomDate(new Date("2026-01-01"), new Date("2026-03-09")) : undefined,
        l1ApproverId: [ReportStatus.APPROVED_L1, ReportStatus.APPROVED_FINAL, ReportStatus.CLOSED].includes(status) ? hrUser.id : undefined,
        l1ApprovedAt: [ReportStatus.APPROVED_L1, ReportStatus.APPROVED_FINAL, ReportStatus.CLOSED].includes(status) ? new Date() : undefined,
        l2ApproverId: [ReportStatus.APPROVED_FINAL, ReportStatus.CLOSED].includes(status) ? adminUser.id : undefined,
        l2ApprovedAt: [ReportStatus.APPROVED_FINAL, ReportStatus.CLOSED].includes(status) ? new Date() : undefined,
        closedAt: status === ReportStatus.CLOSED ? new Date() : undefined,
      },
    })
  }
  console.log("✅ 40 reports (leave/OT/trips) created")

  // ═══════════════ SALARY ADVANCES (8 requests) ═══════════════
  const advanceStatuses = [
    AdvanceStatus.PENDING, AdvanceStatus.PENDING,
    AdvanceStatus.APPROVED, AdvanceStatus.APPROVED, AdvanceStatus.APPROVED,
    AdvanceStatus.REJECTED,
    AdvanceStatus.DEDUCTED,
    AdvanceStatus.APPROVED,
  ]

  for (let i = 0; i < 8; i++) {
    const emp = activeEmployees[i + 10] // skip first 10
    const advStatus = advanceStatuses[i]
    const amount = randomPick([2000000, 3000000, 5000000, 7000000])

    await prisma.salaryAdvance.create({
      data: {
        employeeId: emp.id,
        amount,
        reason: randomPick([
          "Tiền nhà tháng này", "Chi phí y tế khẩn cấp",
          "Đóng tiền học con", "Chi phí sửa xe", "Đặt cọc phòng trọ"
        ]),
        status: advStatus,
        approvedBy: advStatus !== AdvanceStatus.PENDING ? hrUser.id : undefined,
        approvedAt: advStatus !== AdvanceStatus.PENDING ? new Date() : undefined,
        rejectionReason: advStatus === AdvanceStatus.REJECTED ? "Đã ứng lương tháng trước, chưa trừ xong" : undefined,
        deductMonth: advStatus === AdvanceStatus.DEDUCTED ? 2 : (advStatus === AdvanceStatus.APPROVED ? 3 : undefined),
        deductYear: [AdvanceStatus.DEDUCTED, AdvanceStatus.APPROVED].includes(advStatus) ? 2026 : undefined,
      },
    })
  }
  console.log("✅ 8 salary advance requests created")

  // ═══════════════ PERFORMANCE REVIEWS (1 period, 68 reviews) ═══════════════
  const reviewPeriod = await prisma.reviewPeriod.create({
    data: {
      name: "Đánh Giá Cuối Năm 2025",
      cycle: ReviewCycle.ANNUAL,
      startDate: new Date("2025-12-01"),
      endDate: new Date("2026-01-31"),
      year: 2025,
      createdBy: hrUser.id,
    },
  })

  const reviewStatuses = [
    ReviewStatus.COMPLETED, ReviewStatus.COMPLETED, ReviewStatus.COMPLETED,
    ReviewStatus.MANAGER_DONE, ReviewStatus.MANAGER_DONE,
    ReviewStatus.SELF_DONE, ReviewStatus.SELF_DONE,
    ReviewStatus.SELF_PENDING,
    ReviewStatus.DRAFT,
    ReviewStatus.HR_REVIEWING,
  ]

  const ratings = [RatingScale.EXCELLENT, RatingScale.GOOD, RatingScale.GOOD, RatingScale.SATISFACTORY, RatingScale.NEEDS_IMPROVEMENT]

  for (let i = 0; i < activeEmployees.length; i++) {
    const emp = activeEmployees[i]
    const status = reviewStatuses[i % reviewStatuses.length]
    const selfRating = randomPick(ratings)
    const managerRating = randomPick(ratings)
    const finalRating = randomPick(ratings)

    const competencyScores = {
      communication: randomInt(1, 5),
      teamwork: randomInt(1, 5),
      technical: randomInt(1, 5),
      leadership: randomInt(1, 5),
      problemSolving: randomInt(1, 5),
    }

    await prisma.employeeReview.create({
      data: {
        periodId: reviewPeriod.id,
        employeeId: emp.id,
        reviewerId: hrUser.id,
        status,
        selfRating: [ReviewStatus.SELF_DONE, ReviewStatus.MANAGER_DONE, ReviewStatus.HR_REVIEWING, ReviewStatus.COMPLETED].includes(status) ? selfRating : undefined,
        selfStrengths: status !== ReviewStatus.DRAFT && status !== ReviewStatus.SELF_PENDING ? "Chăm chỉ, có trách nhiệm, hoàn thành tốt nhiệm vụ được giao" : undefined,
        selfWeaknesses: status !== ReviewStatus.DRAFT && status !== ReviewStatus.SELF_PENDING ? "Cần cải thiện kỹ năng giao tiếp và quản lý thời gian" : undefined,
        selfGoals: status !== ReviewStatus.DRAFT && status !== ReviewStatus.SELF_PENDING ? "Nâng cao năng lực chuyên môn, lấy chứng chỉ AWS/GCP trong năm 2026" : undefined,
        selfSubmittedAt: status !== ReviewStatus.DRAFT && status !== ReviewStatus.SELF_PENDING ? randomDate(new Date("2025-12-15"), new Date("2026-01-15")) : undefined,
        managerRating: [ReviewStatus.MANAGER_DONE, ReviewStatus.HR_REVIEWING, ReviewStatus.COMPLETED].includes(status) ? managerRating : undefined,
        managerStrengths: [ReviewStatus.MANAGER_DONE, ReviewStatus.HR_REVIEWING, ReviewStatus.COMPLETED].includes(status) ? "Nhân viên tích cực, kết quả công việc ổn định" : undefined,
        managerWeaknesses: [ReviewStatus.MANAGER_DONE, ReviewStatus.HR_REVIEWING, ReviewStatus.COMPLETED].includes(status) ? "Cần chủ động hơn trong việc đề xuất cải tiến quy trình" : undefined,
        managerGoals: [ReviewStatus.MANAGER_DONE, ReviewStatus.HR_REVIEWING, ReviewStatus.COMPLETED].includes(status) ? "Phát triển thêm kỹ năng quản lý dự án" : undefined,
        managerSubmittedAt: [ReviewStatus.MANAGER_DONE, ReviewStatus.HR_REVIEWING, ReviewStatus.COMPLETED].includes(status) ? new Date() : undefined,
        competencyScores: [ReviewStatus.HR_REVIEWING, ReviewStatus.COMPLETED].includes(status) ? competencyScores : undefined,
        finalRating: status === ReviewStatus.COMPLETED ? finalRating : undefined,
        hrNotes: status === ReviewStatus.COMPLETED ? "Đánh giá hoàn tất. Nhân viên đạt yêu cầu." : undefined,
        completedAt: status === ReviewStatus.COMPLETED ? new Date() : undefined,
      },
    })
  }
  console.log(`✅ ${activeEmployees.length} employee reviews created`)

  // ═══════════════ ONBOARDING CHECKLISTS (for 5 recent employees) ═══════════════
  const recentEmployees = activeEmployees
    .filter(e => e.startDate >= new Date("2025-06-01"))
    .slice(0, 5)

  const onboardingTasks = [
    { key: "collect_docs", title: "Thu thập hồ sơ gốc", desc: "CMND, bằng cấp, hộ khẩu, ảnh 4x6", assignedTo: "HR" },
    { key: "create_account", title: "Tạo tài khoản email công ty", desc: "Tạo email @rtr.vn", assignedTo: "IT" },
    { key: "setup_laptop", title: "Cấp phát laptop + thiết bị", desc: "Chuẩn bị máy tính, chuột, tai nghe", assignedTo: "IT" },
    { key: "sign_contract", title: "Ký hợp đồng lao động", desc: "Ký hợp đồng chính thức", assignedTo: "HR" },
    { key: "office_tour", title: "Giới thiệu văn phòng", desc: "Tham quan các phòng ban, giới thiệu đồng nghiệp", assignedTo: "HR" },
    { key: "safety_training", title: "Đào tạo an toàn lao động", desc: "Hoàn thành khóa đào tạo ATLĐ bắt buộc", assignedTo: "SAFETY" },
    { key: "nda_sign", title: "Ký NDA", desc: "Ký cam kết bảo mật thông tin", assignedTo: "HR" },
    { key: "dept_training", title: "Đào tạo nghiệp vụ", desc: "Đào tạo nghiệp vụ theo phòng ban", assignedTo: "DEPT" },
  ]

  for (const emp of recentEmployees) {
    const existing = await prisma.onboardingChecklist.findUnique({ where: { employeeId: emp.id } })
    if (existing) continue

    const checklist = await prisma.onboardingChecklist.create({
      data: {
        employeeId: emp.id,
      },
    })

    for (let t = 0; t < onboardingTasks.length; t++) {
      const task = onboardingTasks[t]
      const isDone = t < 5 // First 5 tasks done
      await prisma.onboardingTask.create({
        data: {
          checklistId: checklist.id,
          taskKey: task.key,
          title: task.title,
          description: task.desc,
          assignedTo: task.assignedTo,
          status: isDone ? OnboardingTaskStatus.DONE : OnboardingTaskStatus.PENDING,
          doneAt: isDone ? randomDate(new Date("2025-06-01"), new Date("2026-03-01")) : undefined,
          doneBy: isDone ? hrUser.id : undefined,
          dueDate: new Date(emp.startDate.getTime() + (t + 1) * 7 * 24 * 3600 * 1000),
        },
      })
    }
  }
  console.log("✅ Onboarding checklists created for 5 recent employees")

  // ═══════════════ OFFBOARDING (2 resigned employees) ═══════════════
  const resignedEmployees = allEmployeeData.filter(e => e.status === EmployeeStatus.RESIGNED)

  for (const emp of resignedEmployees) {
    const existing = await prisma.offboardingInstance.findUnique({ where: { employeeId: emp.id } })
    if (existing) continue

    const instance = await prisma.offboardingInstance.create({
      data: {
        employeeId: emp.id,
        status: OffboardingStatus.COMPLETED,
        resignationDate: new Date("2025-12-15"),
        lastWorkingDate: new Date("2026-01-15"),
        resignReason: randomPick(["Cơ hội mới", "Lý do cá nhân", "Chuyển nơi sinh sống"]),
        initiatedBy: hrUser.id,
        managerApprovedBy: adminUser.id,
        managerApprovedAt: new Date("2025-12-20"),
        hrApprovedBy: hrUser.id,
        hrApprovedAt: new Date("2025-12-22"),
        completedAt: new Date("2026-01-15"),
      },
    })

    const offboardingTasks = [
      { key: "return_laptop", title: "Trả laptop & thiết bị", assignedRole: "IT" },
      { key: "return_badge", title: "Trả thẻ nhân viên", assignedRole: "HR" },
      { key: "handover", title: "Bàn giao công việc", assignedRole: "DEPT" },
      { key: "exit_interview", title: "Phỏng vấn nghỉ việc", assignedRole: "HR" },
      { key: "final_payment", title: "Thanh toán công nợ", assignedRole: "ACCOUNTING" },
    ]

    for (const task of offboardingTasks) {
      await prisma.offboardingTask.create({
        data: {
          instanceId: instance.id,
          taskKey: task.key,
          title: task.title,
          assignedRole: task.assignedRole,
          status: OffboardingTaskStatus.DONE,
          doneAt: new Date("2026-01-15"),
          doneBy: hrUser.id,
        },
      })
    }
  }
  console.log("✅ Offboarding instances created for resigned employees")

  // ═══════════════ NOTIFICATIONS (20 recent notifications) ═══════════════
  const notifTypes = [
    { type: NotificationType.CONTRACT_EXPIRY, title: "Hợp đồng sắp hết hạn", msg: "Hợp đồng lao động sẽ hết hạn trong 30 ngày", link: "/employees" },
    { type: NotificationType.REPORT_SUBMITTED, title: "Đơn mới cần duyệt", msg: "Có đơn nghỉ phép mới cần phê duyệt", link: "/approvals" },
    { type: NotificationType.PAYROLL, title: "Bảng lương đã duyệt", msg: "Bảng lương tháng 2/2026 đã được duyệt", link: "/payroll" },
    { type: NotificationType.HR_EVENT, title: "Biến động nhân sự", msg: "Có biến động nhân sự mới cần xử lý", link: "/hr-events" },
    { type: NotificationType.REVIEW, title: "Đánh giá cần hoàn thành", msg: "Vui lòng hoàn thành đánh giá cuối năm 2025", link: "/reviews" },
    { type: NotificationType.ONBOARDING_COMPLETE, title: "Onboarding hoàn tất", msg: "Nhân viên mới đã hoàn thành onboarding", link: "/employees" },
    { type: NotificationType.OFFBOARDING, title: "Nghỉ việc mới", msg: "Có nhân viên nộp đơn nghỉ việc", link: "/offboarding" },
    { type: NotificationType.OT_REQUEST, title: "Yêu cầu tăng ca", msg: "Có yêu cầu tăng ca mới cần duyệt", link: "/approvals" },
    { type: NotificationType.SALARY_UPDATED, title: "Cập nhật lương", msg: "Thông tin lương đã được cập nhật", link: "/profile" },
    { type: NotificationType.GENERAL, title: "Thông báo chung", msg: "Công ty tổ chức team building vào T7 tuần sau", link: null },
  ]

  // Send to all HR users
  const hrUsers = existingUsers.filter(u => ["SUPER_ADMIN", "HR_MANAGER", "HR_STAFF"].includes(u.role))
  for (const user of hrUsers) {
    for (let i = 0; i < 7; i++) {
      const notif = notifTypes[i % notifTypes.length]
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: notif.type,
          title: notif.title,
          message: notif.msg,
          link: notif.link,
          isRead: i < 3, // first 3 read
          readAt: i < 3 ? new Date() : undefined,
          createdAt: randomDate(new Date("2026-02-15"), new Date("2026-03-09")),
        },
      })
    }
  }
  console.log("✅ Notifications created for HR users")

  // ═══════════════ AUDIT LOGS (30 entries) ═══════════════
  const auditActions = [
    { action: AuditAction.CREATE, entity: "Employee", desc: "Tạo nhân viên mới" },
    { action: AuditAction.UPDATE, entity: "Employee", desc: "Cập nhật thông tin nhân viên" },
    { action: AuditAction.LOGIN, entity: "User", desc: "Đăng nhập hệ thống" },
    { action: AuditAction.APPROVE, entity: "Report", desc: "Phê duyệt đơn nghỉ phép" },
    { action: AuditAction.EXPORT, entity: "Payroll", desc: "Xuất file bảng lương Excel" },
    { action: AuditAction.KPI_PUBLISH, entity: "KPIPeriod", desc: "Công bố KPI tháng" },
    { action: AuditAction.PAYROLL_MARK_PAID, entity: "PayrollPeriod", desc: "Đánh dấu đã trả lương" },
    { action: AuditAction.CREATE, entity: "Contract", desc: "Tạo hợp đồng lao động mới" },
    { action: AuditAction.APPROVE, entity: "HREvent", desc: "Phê duyệt biến động nhân sự" },
    { action: AuditAction.CREATE, entity: "JobRequisition", desc: "Tạo yêu cầu tuyển dụng" },
  ]

  for (let i = 0; i < 30; i++) {
    const audit = auditActions[i % auditActions.length]
    const user = randomPick(hrUsers)
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: audit.action,
        entity: audit.entity,
        entityId: `mock-${i}`,
        actorName: user.name || "System",
        actorRole: user.role,
        targetName: audit.desc,
        createdAt: randomDate(new Date("2026-01-01"), new Date("2026-03-09")),
      },
    })
  }
  console.log("✅ 30 audit log entries created")

  // ═══════════════ SUMMARY ═══════════════
  const counts = {
    employees: await prisma.employee.count(),
    users: await prisma.user.count(),
    contracts: await prisma.contract.count(),
    dependents: await prisma.dependent.count(),
    attendance: await prisma.attendanceRecord.count(),
    payrollPeriods: await prisma.payrollPeriod.count(),
    employeePayrolls: await prisma.employeePayroll.count(),
    requisitions: await prisma.jobRequisition.count(),
    candidates: await prisma.candidate.count(),
    applications: await prisma.application.count(),
    interviews: await prisma.interview.count(),
    kpiPeriods: await prisma.kPIPeriod.count(),
    kpiScores: await prisma.kPIScore.count(),
    hrEvents: await prisma.hREvent.count(),
    reports: await prisma.report.count(),
    advances: await prisma.salaryAdvance.count(),
    reviewPeriods: await prisma.reviewPeriod.count(),
    reviews: await prisma.employeeReview.count(),
    onboarding: await prisma.onboardingChecklist.count(),
    offboarding: await prisma.offboardingInstance.count(),
    notifications: await prisma.notification.count(),
    auditLogs: await prisma.auditLog.count(),
    leaveBalances: await prisma.leaveBalance.count(),
  }

  console.log("\n🎉 SEED DEMO COMPLETED!")
  console.log("═══════════════════════════════════════")
  console.log(`👥 Employees:        ${counts.employees}`)
  console.log(`🔑 Users:            ${counts.users}`)
  console.log(`📄 Contracts:        ${counts.contracts}`)
  console.log(`👶 Dependents:       ${counts.dependents}`)
  console.log(`⏰ Attendance:       ${counts.attendance}`)
  console.log(`💰 Payroll Periods:  ${counts.payrollPeriods}`)
  console.log(`💳 Emp Payrolls:     ${counts.employeePayrolls}`)
  console.log(`📋 Requisitions:     ${counts.requisitions}`)
  console.log(`👤 Candidates:       ${counts.candidates}`)
  console.log(`📝 Applications:     ${counts.applications}`)
  console.log(`🎤 Interviews:       ${counts.interviews}`)
  console.log(`📊 KPI Periods:      ${counts.kpiPeriods}`)
  console.log(`📈 KPI Scores:       ${counts.kpiScores}`)
  console.log(`🔄 HR Events:        ${counts.hrEvents}`)
  console.log(`📑 Reports:          ${counts.reports}`)
  console.log(`💵 Advances:         ${counts.advances}`)
  console.log(`⭐ Review Periods:   ${counts.reviewPeriods}`)
  console.log(`📝 Reviews:          ${counts.reviews}`)
  console.log(`✅ Onboarding:       ${counts.onboarding}`)
  console.log(`🚪 Offboarding:      ${counts.offboarding}`)
  console.log(`🔔 Notifications:    ${counts.notifications}`)
  console.log(`📜 Audit Logs:       ${counts.auditLogs}`)
  console.log(`🏖️  Leave Balances:   ${counts.leaveBalances}`)
  console.log("═══════════════════════════════════════")
}

main()
  .catch((e) => {
    console.error("❌ Seed demo error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
