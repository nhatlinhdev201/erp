import "dotenv/config"
import { PrismaClient, UserRole, Gender, EmployeeStatus, ContractType, ContractStatus } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding VietERP HRM database...")

  // ═══════════════ DEPARTMENTS ═══════════════
  const deptKyThuat = await prisma.department.upsert({
    where: { code: "DEPT-KT" },
    update: {},
    create: {
      name: "Kỹ Thuật",
      code: "DEPT-KT",
      description: "Phòng Kỹ Thuật - Phần mềm & Phần cứng",
    },
  })

  const deptSanXuat = await prisma.department.upsert({
    where: { code: "DEPT-SX" },
    update: {},
    create: {
      name: "Sản Xuất Product",
      code: "DEPT-SX",
      description: "Phòng Sản Xuất - Lắp ráp & Kiểm thử Product",
    },
  })

  const deptHCNS = await prisma.department.upsert({
    where: { code: "DEPT-HCNS" },
    update: {},
    create: {
      name: "Hành Chính - Nhân Sự",
      code: "DEPT-HCNS",
      description: "Phòng Hành Chính Nhân Sự",
    },
  })

  const deptKeToan = await prisma.department.upsert({
    where: { code: "DEPT-KT2" },
    update: {},
    create: {
      name: "Kế Toán",
      code: "DEPT-KT2",
      description: "Phòng Kế Toán - Tài Chính",
    },
  })

  const deptKinhDoanh = await prisma.department.upsert({
    where: { code: "DEPT-KD" },
    update: {},
    create: {
      name: "Kinh Doanh",
      code: "DEPT-KD",
      description: "Phòng Kinh Doanh & Marketing",
    },
  })

  console.log("✅ Departments created")

  // ═══════════════ POSITIONS ═══════════════
  const posKSPM = await prisma.position.upsert({
    where: { code: "POS-KSPM" },
    update: {},
    create: {
      name: "Kỹ Sư Phần Mềm",
      code: "POS-KSPM",
      departmentId: deptKyThuat.id,
      description: "Phát triển phần mềm điều khiển product",
    },
  })

  const posKSPH = await prisma.position.upsert({
    where: { code: "POS-KSPH" },
    update: {},
    create: {
      name: "Kỹ Sư Phần Cứng",
      code: "POS-KSPH",
      departmentId: deptKyThuat.id,
      description: "Thiết kế & phát triển phần cứng product",
    },
  })

  const posKSProduct = await prisma.position.upsert({
    where: { code: "POS-KSD" },
    update: {},
    create: {
      name: "Kỹ Sư Product",
      code: "POS-KSD",
      departmentId: deptSanXuat.id,
      description: "Lắp ráp, kiểm thử, bay thử product",
    },
  })

  const posCNSX = await prisma.position.upsert({
    where: { code: "POS-CNSX" },
    update: {},
    create: {
      name: "Công Nhân Sản Xuất",
      code: "POS-CNSX",
      departmentId: deptSanXuat.id,
      description: "Sản xuất, lắp ráp linh kiện product",
    },
  })

  const posHROfficer = await prisma.position.upsert({
    where: { code: "POS-HR" },
    update: {},
    create: {
      name: "HR Officer",
      code: "POS-HR",
      departmentId: deptHCNS.id,
      description: "Chuyên viên nhân sự",
    },
  })

  const posHRManager = await prisma.position.upsert({
    where: { code: "POS-HRM" },
    update: {},
    create: {
      name: "HR Manager",
      code: "POS-HRM",
      departmentId: deptHCNS.id,
      description: "Trưởng phòng Nhân sự",
    },
  })

  const posKeToan = await prisma.position.upsert({
    where: { code: "POS-KTTV" },
    update: {},
    create: {
      name: "Kế Toán Viên",
      code: "POS-KTTV",
      departmentId: deptKeToan.id,
      description: "Kế toán tổng hợp",
    },
  })

  console.log("✅ Positions created")

  // ═══════════════ USERS & EMPLOYEES ═══════════════
  // SECURITY: no hardcoded password in git — env or random (printed once).
  const seedPw = process.env.SEED_DEMO_PASSWORD ||
    Array.from(require('crypto').randomBytes(16))
      .map((b: number) => 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'[b % 56])
      .join('')
  if (seedPw.length < 8) throw new Error('SEED_DEMO_PASSWORD too short (min 8).')
  console.log(`🔐 Seeded user password (save now, shown once): ${seedPw}`)
  const hashedPassword = await bcrypt.hash(seedPw, 12)

  // 1. SUPER_ADMIN
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@rtr.vn" },
    update: {},
    create: {
      email: "admin@rtr.vn",
      password: hashedPassword,
      name: "Admin RTR",
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    },
  })

  await prisma.employee.upsert({
    where: { employeeCode: "RTR-0001" },
    update: {},
    create: {
      employeeCode: "RTR-0001",
      userId: adminUser.id,
      fullName: "Nguyễn Văn Admin",
      nameNoAccent: "NGUYEN VAN ADMIN",
      gender: Gender.MALE,
      dateOfBirth: new Date("1985-06-15"),
      phone: "0901234567",
      permanentAddress: "123 Nguyễn Huệ, Q1, TP.HCM",
      nationalId: "079085001234",
      nationalIdDate: new Date("2021-03-01"),
      nationalIdPlace: "Cục CSQLHC về TTXH",
      departmentId: deptHCNS.id,
      positionId: posHRManager.id,
      startDate: new Date("2020-01-15"),
      status: EmployeeStatus.ACTIVE,
      companyEmail: "admin@rtr.vn",
      bankAccount: "1234567890",
      bankBranch: "VCB CN HCM",
      taxCode: "8234567890",
      insuranceCode: "BH001234",
    },
  })

  // 2. HR_MANAGER
  const hrUser = await prisma.user.upsert({
    where: { email: "hr@rtr.vn" },
    update: {},
    create: {
      email: "hr@rtr.vn",
      password: hashedPassword,
      name: "Trần Thị HR",
      role: UserRole.HR_MANAGER,
      isActive: true,
    },
  })

  await prisma.employee.upsert({
    where: { employeeCode: "RTR-0002" },
    update: {},
    create: {
      employeeCode: "RTR-0002",
      userId: hrUser.id,
      fullName: "Trần Thị HR",
      nameNoAccent: "TRAN THI HR",
      gender: Gender.FEMALE,
      dateOfBirth: new Date("1990-08-20"),
      phone: "0912345678",
      permanentAddress: "456 Lê Lợi, Q1, TP.HCM",
      nationalId: "079090002345",
      nationalIdDate: new Date("2021-05-15"),
      nationalIdPlace: "Cục CSQLHC về TTXH",
      departmentId: deptHCNS.id,
      positionId: posHROfficer.id,
      startDate: new Date("2021-03-01"),
      status: EmployeeStatus.ACTIVE,
      companyEmail: "hr@rtr.vn",
      bankAccount: "9876543210",
      bankBranch: "TCB CN HCM",
      taxCode: "8345678901",
      insuranceCode: "BH002345",
    },
  })

  // 3. HR_STAFF
  const hrStaffUser = await prisma.user.upsert({
    where: { email: "hrstaff@rtr.vn" },
    update: {},
    create: {
      email: "hrstaff@rtr.vn",
      password: hashedPassword,
      name: "Lê Văn Staff",
      role: UserRole.HR_STAFF,
      isActive: true,
    },
  })

  await prisma.employee.upsert({
    where: { employeeCode: "RTR-0003" },
    update: {},
    create: {
      employeeCode: "RTR-0003",
      userId: hrStaffUser.id,
      fullName: "Lê Văn Staff",
      nameNoAccent: "LE VAN STAFF",
      gender: Gender.MALE,
      dateOfBirth: new Date("1995-03-10"),
      phone: "0923456789",
      permanentAddress: "789 Trần Hưng Đạo, Q5, TP.HCM",
      departmentId: deptHCNS.id,
      positionId: posHROfficer.id,
      startDate: new Date("2023-06-01"),
      status: EmployeeStatus.ACTIVE,
      companyEmail: "hrstaff@rtr.vn",
      bankAccount: "5555666677",
      bankBranch: "MB CN HCM",
      taxCode: "8456789012",
      insuranceCode: "BH003456",
    },
  })

  // 4. DEPT_MANAGER (Trưởng phòng Kỹ Thuật)
  const deptMgrUser = await prisma.user.upsert({
    where: { email: "kythuat.mgr@rtr.vn" },
    update: {},
    create: {
      email: "kythuat.mgr@rtr.vn",
      password: hashedPassword,
      name: "Phạm Quốc Kỹ Thuật",
      role: UserRole.DEPT_MANAGER,
      isActive: true,
    },
  })

  const empDeptMgr = await prisma.employee.upsert({
    where: { employeeCode: "RTR-0004" },
    update: {},
    create: {
      employeeCode: "RTR-0004",
      userId: deptMgrUser.id,
      fullName: "Phạm Quốc Kỹ Thuật",
      nameNoAccent: "PHAM QUOC KY THUAT",
      gender: Gender.MALE,
      dateOfBirth: new Date("1988-11-25"),
      phone: "0934567890",
      permanentAddress: "321 Võ Văn Tần, Q3, TP.HCM",
      departmentId: deptKyThuat.id,
      positionId: posKSPM.id,
      startDate: new Date("2020-06-01"),
      status: EmployeeStatus.ACTIVE,
      companyEmail: "kythuat.mgr@rtr.vn",
      bankAccount: "1111222233",
      bankBranch: "VCB CN Q3",
      taxCode: "8567890123",
      insuranceCode: "BH004567",
    },
  })

  // Set dept manager
  await prisma.department.update({
    where: { id: deptKyThuat.id },
    data: { managerId: empDeptMgr.id },
  })

  // 5. EMPLOYEE (nhân viên thường)
  const empUser = await prisma.user.upsert({
    where: { email: "nhanvien@rtr.vn" },
    update: {},
    create: {
      email: "nhanvien@rtr.vn",
      password: hashedPassword,
      name: "Hoàng Minh Nhân Viên",
      role: UserRole.EMPLOYEE,
      isActive: true,
    },
  })

  const empNV = await prisma.employee.upsert({
    where: { employeeCode: "RTR-0005" },
    update: {},
    create: {
      employeeCode: "RTR-0005",
      userId: empUser.id,
      fullName: "Hoàng Minh Nhân Viên",
      nameNoAccent: "HOANG MINH NHAN VIEN",
      gender: Gender.MALE,
      dateOfBirth: new Date("1997-04-12"),
      phone: "0945678901",
      permanentAddress: "654 Điện Biên Phủ, Bình Thạnh, TP.HCM",
      departmentId: deptKyThuat.id,
      positionId: posKSPM.id,
      teamManagerId: empDeptMgr.id,
      startDate: new Date("2024-01-15"),
      status: EmployeeStatus.ACTIVE,
      companyEmail: "nhanvien@rtr.vn",
      bankAccount: "4444555566",
      bankBranch: "TCB CN BT",
      taxCode: "8678901234",
      insuranceCode: "BH005678",
      school: "Đại học Bách Khoa TP.HCM",
      major: "Kỹ thuật Phần mềm",
    },
  })

  // 6. ACCOUNTANT
  const accountantUser = await prisma.user.upsert({
    where: { email: "ketoan@rtr.vn" },
    update: {},
    create: {
      email: "ketoan@rtr.vn",
      password: hashedPassword,
      name: "Ngô Thị Kế Toán",
      role: UserRole.ACCOUNTANT,
      isActive: true,
    },
  })

  await prisma.employee.upsert({
    where: { employeeCode: "RTR-0006" },
    update: {},
    create: {
      employeeCode: "RTR-0006",
      userId: accountantUser.id,
      fullName: "Ngô Thị Kế Toán",
      nameNoAccent: "NGO THI KE TOAN",
      gender: Gender.FEMALE,
      dateOfBirth: new Date("1992-07-30"),
      phone: "0956789012",
      permanentAddress: "987 Nguyễn Thị Minh Khai, Q3, TP.HCM",
      departmentId: deptKeToan.id,
      positionId: posKeToan.id,
      startDate: new Date("2022-09-01"),
      status: EmployeeStatus.ACTIVE,
      companyEmail: "ketoan@rtr.vn",
      bankAccount: "7777888899",
      bankBranch: "VCB CN Q3",
      taxCode: "8789012345",
      insuranceCode: "BH006789",
    },
  })

  console.log("✅ Users & Employees created (6 users, 6 employees)")

  // ═══════════════ SAMPLE CONTRACTS ═══════════════
  // Contract cho NV mới (RTR-0005) - thử việc → chính thức
  await prisma.contract.upsert({
    where: { id: "contract-tv-0005" },
    update: {},
    create: {
      id: "contract-tv-0005",
      employeeId: empNV.id,
      contractNo: "HDLD-2024-005",
      probationNo: "HDTV-2024-005",
      type: ContractType.DEFINITE_TERM,
      status: ContractStatus.ACTIVE,
      probationFrom: new Date("2024-01-15"),
      probationTo: new Date("2024-03-14"),
      officialFrom: new Date("2024-03-15"),
      officialTo: new Date("2025-03-14"),
      baseSalary: 15000000,
      mealAllowance: 730000,
      phoneAllowance: 200000,
      fuelAllowance: 500000,
    },
  })

  // ACTIVE contracts for other employees (TIP-009)
  await prisma.contract.upsert({
    where: { id: "contract-001" },
    update: {},
    create: {
      id: "contract-001",
      employeeId: (await prisma.employee.findUnique({ where: { employeeCode: "RTR-0001" } }))!.id,
      contractNo: "HDLD-2023-001",
      type: ContractType.INDEFINITE_TERM,
      status: ContractStatus.ACTIVE,
      officialFrom: new Date("2020-01-15"),
      baseSalary: 25000000,
      mealAllowance: 730000,
      phoneAllowance: 500000,
      fuelAllowance: 500000,
      perfAllowance: 2000000,
    },
  })

  await prisma.contract.upsert({
    where: { id: "contract-002" },
    update: {},
    create: {
      id: "contract-002",
      employeeId: (await prisma.employee.findUnique({ where: { employeeCode: "RTR-0002" } }))!.id,
      contractNo: "HDLD-2023-002",
      type: ContractType.DEFINITE_TERM,
      status: ContractStatus.ACTIVE,
      officialFrom: new Date("2025-03-01"),
      officialTo: new Date("2027-02-28"),
      baseSalary: 18000000,
      mealAllowance: 730000,
      phoneAllowance: 300000,
      fuelAllowance: 500000,
      perfAllowance: 1000000,
    },
  })

  await prisma.contract.upsert({
    where: { id: "contract-003" },
    update: {},
    create: {
      id: "contract-003",
      employeeId: (await prisma.employee.findUnique({ where: { employeeCode: "RTR-0003" } }))!.id,
      contractNo: "HDLD-2024-003",
      type: ContractType.DEFINITE_TERM,
      status: ContractStatus.ACTIVE,
      officialFrom: new Date("2025-06-01"),
      officialTo: new Date("2027-05-31"),
      baseSalary: 12000000,
      mealAllowance: 730000,
      phoneAllowance: 200000,
      fuelAllowance: 300000,
    },
  })

  await prisma.contract.upsert({
    where: { id: "contract-004" },
    update: {},
    create: {
      id: "contract-004",
      employeeId: empDeptMgr.id,
      contractNo: "HDLD-2023-004",
      type: ContractType.INDEFINITE_TERM,
      status: ContractStatus.ACTIVE,
      officialFrom: new Date("2020-06-01"),
      baseSalary: 22000000,
      mealAllowance: 730000,
      phoneAllowance: 500000,
      fuelAllowance: 500000,
      perfAllowance: 1500000,
    },
  })

  // Update RTR-0005 contract to current dates + ensure ACTIVE
  await prisma.contract.update({
    where: { id: "contract-tv-0005" },
    data: {
      status: ContractStatus.ACTIVE,
      officialFrom: new Date("2025-03-15"),
      officialTo: new Date("2027-03-14"),
    },
  })

  await prisma.contract.upsert({
    where: { id: "contract-006" },
    update: {},
    create: {
      id: "contract-006",
      employeeId: (await prisma.employee.findUnique({ where: { employeeCode: "RTR-0006" } }))!.id,
      contractNo: "HDLD-2023-006",
      type: ContractType.DEFINITE_TERM,
      status: ContractStatus.ACTIVE,
      officialFrom: new Date("2024-09-01"),
      officialTo: new Date("2026-08-31"),
      baseSalary: 14000000,
      mealAllowance: 730000,
      phoneAllowance: 200000,
      fuelAllowance: 300000,
    },
  })

  console.log("✅ Sample contracts created (6 ACTIVE contracts)")

  // ═══════════════ LEAVE BALANCES (TIP-009) ═══════════════
  const allEmployees = await prisma.employee.findMany({
    where: { status: { in: ["ACTIVE", "PROBATION"] } },
    select: { id: true },
  })

  for (const emp of allEmployees) {
    await prisma.leaveBalance.upsert({
      where: { employeeId_year: { employeeId: emp.id, year: 2026 } },
      update: {},
      create: {
        employeeId: emp.id,
        year: 2026,
        totalDays: 12,
        usedDays: 0,
        remainingDays: 12,
      },
    })
  }

  console.log(`✅ LeaveBalance created for ${allEmployees.length} employees (2026)`)

  // ═══════════════ SAMPLE DEPENDENT ═══════════════
  await prisma.dependent.upsert({
    where: { id: "dep-0005-1" },
    update: {},
    create: {
      id: "dep-0005-1",
      employeeId: empNV.id,
      fullName: "Hoàng Thị Con",
      relationship: "CHILD",
      dateOfBirth: new Date("2022-06-01"),
    },
  })

  console.log("✅ Sample dependents created")

  // ═══════════════ SYSTEM SETTINGS ═══════════════
  const defaultSettings = [
    { key: "companyName", value: "CÔNG TY CỔ PHẦN REAL-TIME ROBOTICS VIỆT NAM" },
    { key: "companyTaxCode", value: "0314718578" },
    { key: "companyAddress", value: "Số 40/10 Khổng Tử, Phường Tăng Nhơn Phú, TP.HCM" },
    { key: "companyEmail", value: "info@vierp.com" },
    { key: "companyRepresentative", value: "LƯƠNG VIỆT QUỐC" },
    { key: "companyBankAccount", value: "13610000031054 - BIDV CN Bình Thạnh" },
    { key: "standardWorkDays", value: "26" },
    { key: "mealAllowanceCap", value: "730000" },
    { key: "payDay", value: "05-10 tháng sau" },
    { key: "companyInsuranceCode", value: "" },
    { key: "companyTaxAgency", value: "" },
    { key: "defaultHospital", value: "" },
  ]
  for (const s of defaultSettings) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: {},
      create: { key: s.key, value: s.value },
    })
  }
  console.log("✅ System settings seeded")

  console.log("🎉 Seed completed successfully!")
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
