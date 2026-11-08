// =============================================================================
// L-ERP MRP - AUTHENTICATION TYPES & CONFIG
// Type definitions and configuration for authentication system
// =============================================================================

// =============================================================================
// USER & ROLE TYPES
// =============================================================================

export type UserRole = 'admin' | 'manager' | 'operator' | 'viewer';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  department?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSession {
  user: User;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

// =============================================================================
// AUTH STATE
// =============================================================================

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: User | null;
  session: UserSession | null;
  error: string | null;
}

// =============================================================================
// AUTH ACTIONS
// =============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  department?: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// =============================================================================
// ROLE PERMISSIONS
// =============================================================================

export type Permission =
  // Dashboard
  | 'dashboard:view'

  // Orders
  | 'orders:view'
  | 'orders:create'
  | 'orders:edit'
  | 'orders:delete'
  | 'orders:approve'

  // Parts (Master Data)
  | 'parts:view'
  | 'parts:create'
  | 'parts:edit'
  | 'parts:delete'

  // Inventory
  | 'inventory:view'
  | 'inventory:adjust'
  | 'inventory:transfer'
  | 'inventory:issue'

  // Production
  | 'production:view'
  | 'production:create'
  | 'production:edit'
  | 'production:complete'

  // Quality
  | 'quality:view'
  | 'quality:create'
  | 'quality:edit'
  | 'quality:close'

  // MRP
  | 'mrp:view'
  | 'mrp:run'
  | 'mrp:approve'

  // Purchasing
  | 'purchasing:view'
  | 'purchasing:create'
  | 'purchasing:approve'

  // Reports
  | 'reports:view'
  | 'reports:create'
  | 'reports:export'

  // Settings
  | 'settings:view'
  | 'settings:edit'

  // Users
  | 'users:view'
  | 'users:create'
  | 'users:edit'
  | 'users:delete';

// Role permission mapping
export const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    // All permissions
    'dashboard:view',
    'parts:view', 'parts:create', 'parts:edit', 'parts:delete',
    'orders:view', 'orders:create', 'orders:edit', 'orders:delete', 'orders:approve',
    'inventory:view', 'inventory:adjust', 'inventory:transfer', 'inventory:issue',
    'production:view', 'production:create', 'production:edit', 'production:complete',
    'quality:view', 'quality:create', 'quality:edit', 'quality:close',
    'mrp:view', 'mrp:run', 'mrp:approve',
    'purchasing:view', 'purchasing:create', 'purchasing:approve',
    'reports:view', 'reports:create', 'reports:export',
    'settings:view', 'settings:edit',
    'users:view', 'users:create', 'users:edit', 'users:delete',
  ],

  manager: [
    'dashboard:view',
    'parts:view', 'parts:create', 'parts:edit', 'parts:delete',
    'orders:view', 'orders:create', 'orders:edit', 'orders:approve',
    'inventory:view', 'inventory:adjust', 'inventory:transfer', 'inventory:issue',
    'production:view', 'production:create', 'production:edit', 'production:complete',
    'quality:view', 'quality:create', 'quality:edit', 'quality:close',
    'mrp:view', 'mrp:run', 'mrp:approve',
    'purchasing:view', 'purchasing:create', 'purchasing:approve',
    'reports:view', 'reports:create', 'reports:export',
    'settings:view',
    'users:view',
  ],

  operator: [
    'dashboard:view',
    'parts:view', 'parts:create', 'parts:edit',
    'orders:view', 'orders:create', 'orders:edit',
    'inventory:view', 'inventory:adjust', 'inventory:issue',
    'production:view', 'production:create', 'production:edit', 'production:complete',
    'quality:view', 'quality:create', 'quality:edit',
    'mrp:view', 'mrp:run',
    'purchasing:view', 'purchasing:create',
    'reports:view', 'reports:export',
  ],

  viewer: [
    'dashboard:view',
    'parts:view',
    'orders:view',
    'inventory:view',
    'production:view',
    'quality:view',
    'mrp:view',
    'purchasing:view',
    'reports:view',
  ],
};

// =============================================================================
// ROLE LABELS
// =============================================================================

export const roleLabels: Record<UserRole, string> = {
  admin: 'Quản trị viên',
  manager: 'Quản lý',
  operator: 'Nhân viên',
  viewer: 'Xem',
};

export const roleColors: Record<UserRole, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  operator: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  viewer: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

export function hasPermission(user: User | null, permission: Permission): boolean {
  if (!user) return false;
  const permissions = rolePermissions[user.role];
  return permissions.includes(permission);
}

export function hasAnyPermission(user: User | null, permissions: Permission[]): boolean {
  if (!user) return false;
  const userPermissions = rolePermissions[user.role];
  return permissions.some(p => userPermissions.includes(p));
}

export function hasAllPermissions(user: User | null, permissions: Permission[]): boolean {
  if (!user) return false;
  const userPermissions = rolePermissions[user.role];
  return permissions.every(p => userPermissions.includes(p));
}

export function getRoleLabel(role: UserRole): string {
  return roleLabels[role];
}

export function getRoleColor(role: UserRole): string {
  return roleColors[role];
}

// =============================================================================
// MOCK USERS (for development)
// =============================================================================

export const mockUsers: User[] = [
  {
    id: 'u1',
    email: 'admin@rtr.vn',
    name: 'Nguyễn Văn Admin',
    avatar: undefined,
    role: 'admin',
    department: 'IT',
    phone: '0901234567',
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date(),
  },
  {
    id: 'u2',
    email: 'manager@rtr.vn',
    name: 'Trần Thị Quản Lý',
    role: 'manager',
    department: 'Sản xuất',
    phone: '0907654321',
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date(),
  },
  {
    id: 'u3',
    email: 'operator@rtr.vn',
    name: 'Lê Văn Nhân Viên',
    role: 'operator',
    department: 'Kho',
    isActive: true,
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date(),
  },
  {
    id: 'u4',
    email: 'viewer@rtr.vn',
    name: 'Phạm Thị Xem',
    role: 'viewer',
    department: 'Kế toán',
    isActive: true,
    createdAt: new Date('2024-04-01'),
    updatedAt: new Date(),
  },
];

// Mock credentials for testing
export const mockCredentials: Record<string, { password: string; userId: string }> = {
  'admin@rtr.vn': { password: 'admin123', userId: 'u1' },
  'manager@rtr.vn': { password: 'manager123', userId: 'u2' },
  'operator@rtr.vn': { password: 'operator123', userId: 'u3' },
  'viewer@rtr.vn': { password: 'viewer123', userId: 'u4' },
};

// =============================================================================
// AUTH CONFIG
// =============================================================================

export const authConfig = {
  // Token expiration
  accessTokenExpiry: 60 * 60 * 1000, // 1 hour
  refreshTokenExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days

  // Session storage key
  sessionKey: 'lerp-mrp-session',

  // Routes
  loginPath: '/login',
  registerPath: '/register',
  forgotPasswordPath: '/forgot-password',
  dashboardPath: '/home',

  // Password requirements
  passwordMinLength: 8,
  passwordRequireUppercase: true,
  passwordRequireNumber: true,
  passwordRequireSpecial: false,
};

export default authConfig;
