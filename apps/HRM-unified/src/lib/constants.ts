export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'L-ERP HRM'

export const USER_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  HR_MANAGER: 'HR_MANAGER',
  HR_STAFF: 'HR_STAFF',
  VIEWER: 'VIEWER',
} as const

export const USER_ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Quản trị viên',
  HR_MANAGER: 'Trưởng phòng HR',
  HR_STAFF: 'Nhân viên HR',
  VIEWER: 'Xem',
}

export const EMPLOYEE_STATUS = {
  ACTIVE: 'ACTIVE',
  PROBATION: 'PROBATION',
  ON_LEAVE: 'ON_LEAVE',
  RESIGNED: 'RESIGNED',
  TERMINATED: 'TERMINATED',
} as const

export const EMPLOYEE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Đang làm việc',
  PROBATION: 'Thử việc',
  ON_LEAVE: 'Nghỉ phép',
  RESIGNED: 'Đã nghỉ việc',
  TERMINATED: 'Chấm dứt HĐ',
}

export const EMPLOYEE_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  PROBATION: 'bg-yellow-100 text-yellow-800',
  ON_LEAVE: 'bg-blue-100 text-blue-800',
  RESIGNED: 'bg-gray-100 text-gray-800',
  TERMINATED: 'bg-red-100 text-red-800',
}

export const GENDER = {
  MALE: 'MALE',
  FEMALE: 'FEMALE',
  OTHER: 'OTHER',
} as const

export const GENDER_LABELS: Record<string, string> = {
  MALE: 'Nam',
  FEMALE: 'Nữ',
  OTHER: 'Khác',
}

export const CONTRACT_TYPE = {
  PROBATION: 'PROBATION',
  DEFINITE_TERM: 'DEFINITE_TERM',
  INDEFINITE_TERM: 'INDEFINITE_TERM',
  SEASONAL: 'SEASONAL',
  PART_TIME: 'PART_TIME',
} as const

export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  PROBATION: 'Hợp đồng thử việc',
  DEFINITE_TERM: 'Hợp đồng có thời hạn',
  INDEFINITE_TERM: 'Hợp đồng không thời hạn',
  SEASONAL: 'Hợp đồng thời vụ',
  PART_TIME: 'Hợp đồng bán thời gian',
}

export const CONTRACT_STATUS = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  EXPIRED: 'EXPIRED',
  TERMINATED: 'TERMINATED',
} as const

export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  ACTIVE: 'Đang hiệu lực',
  EXPIRED: 'Hết hạn',
  TERMINATED: 'Đã chấm dứt',
}

export const CONTRACT_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  ACTIVE: 'bg-green-100 text-green-800',
  EXPIRED: 'bg-yellow-100 text-yellow-800',
  TERMINATED: 'bg-red-100 text-red-800',
}

export const SALARY_TYPE = {
  GROSS: 'GROSS',
  NET: 'NET',
} as const

export const SALARY_TYPE_LABELS: Record<string, string> = {
  GROSS: 'Gross',
  NET: 'Net',
}

export const RELATIONSHIP_TYPE = {
  SPOUSE: 'SPOUSE',
  CHILD: 'CHILD',
  PARENT: 'PARENT',
  OTHER: 'OTHER',
} as const

export const RELATIONSHIP_TYPE_LABELS: Record<string, string> = {
  SPOUSE: 'Vợ/Chồng',
  CHILD: 'Con',
  PARENT: 'Cha/Mẹ',
  OTHER: 'Khác',
}

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100],
}

export const VN_BANKS = [
  'Vietcombank',
  'Techcombank',
  'BIDV',
  'VietinBank',
  'Agribank',
  'MB Bank',
  'ACB',
  'VPBank',
  'Sacombank',
  'HDBank',
  'TPBank',
  'OCB',
  'VIB',
  'SHB',
  'SeABank',
  'Eximbank',
  'MSB',
  'LienVietPostBank',
  'Nam A Bank',
  'Bac A Bank',
]
