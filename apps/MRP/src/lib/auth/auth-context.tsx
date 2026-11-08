'use client';

// =============================================================================
// L-ERP MRP - AUTH CONTEXT & HOOKS
// Authentication state management with React Context
// =============================================================================

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  type User,
  type UserSession,
  type AuthStatus,
  type AuthState,
  type LoginCredentials,
  type RegisterData,
  type Permission,
  authConfig,
  mockUsers,
  mockCredentials,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
} from './auth-types';

// =============================================================================
// CONTEXT TYPE
// =============================================================================

interface AuthContextType extends AuthState {
  // Actions
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<{ success: boolean; error?: string }>;
  refreshSession: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;

  // Permission helpers
  can: (permission: Permission) => boolean;
  canAny: (permissions: Permission[]) => boolean;
  canAll: (permissions: Permission[]) => boolean;

  // State helpers
  isAdmin: boolean;
  isManager: boolean;
  isOperator: boolean;
  isViewer: boolean;
}

// =============================================================================
// CONTEXT
// =============================================================================

const AuthContext = createContext<AuthContextType | null>(null);

// =============================================================================
// STORAGE HELPERS
// =============================================================================

function saveSession(session: UserSession | null): void {
  if (typeof window === 'undefined') return;

  if (session) {
    localStorage.setItem(authConfig.sessionKey, JSON.stringify(session));
  } else {
    localStorage.removeItem(authConfig.sessionKey);
  }
}

function loadSession(): UserSession | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(authConfig.sessionKey);
  if (!stored) return null;

  try {
    const session = JSON.parse(stored) as UserSession;
    // Check if session is expired
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem(authConfig.sessionKey);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(authConfig.sessionKey);
    return null;
  }
}

// =============================================================================
// AUTH PROVIDER
// =============================================================================

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<UserSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize session from storage
  useEffect(() => {
    const storedSession = loadSession();
    if (storedSession) {
      setSession(storedSession);
      setUser(storedSession.user);
      setStatus('authenticated');
    } else {
      setStatus('unauthenticated');
    }
  }, []);

  // Login
  const login = useCallback(async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    setStatus('loading');

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Check credentials (mock)
      const mockCred = mockCredentials[credentials.email];
      if (!mockCred || mockCred.password !== credentials.password) {
        setStatus('unauthenticated');
        const errorMsg = 'Email hoặc mật khẩu không đúng';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Find user
      const foundUser = mockUsers.find(u => u.id === mockCred.userId);
      if (!foundUser || !foundUser.isActive) {
        setStatus('unauthenticated');
        const errorMsg = 'Tài khoản không tồn tại hoặc đã bị khóa';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // Create session
      const newSession: UserSession = {
        user: { ...foundUser, lastLogin: new Date() },
        accessToken: `token-${Date.now()}-${Math.random().toString(36)}`,
        refreshToken: credentials.rememberMe ? `refresh-${Date.now()}` : undefined,
        expiresAt: new Date(Date.now() + (credentials.rememberMe ? authConfig.refreshTokenExpiry : authConfig.accessTokenExpiry)),
      };

      // Save session
      saveSession(newSession);
      setSession(newSession);
      setUser(newSession.user);
      setStatus('authenticated');

      return { success: true };
    } catch (err) {
      setStatus('unauthenticated');
      const errorMsg = 'Đã xảy ra lỗi. Vui lòng thử lại.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  // Logout
  const logout = useCallback(async (): Promise<void> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 300));

    saveSession(null);
    setSession(null);
    setUser(null);
    setStatus('unauthenticated');
    setError(null);
  }, []);

  // Register
  const register = useCallback(async (data: RegisterData): Promise<{ success: boolean; error?: string }> => {
    setError(null);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if email exists
      if (mockCredentials[data.email]) {
        const errorMsg = 'Email đã được sử dụng';
        setError(errorMsg);
        return { success: false, error: errorMsg };
      }

      // In real app, this would create the user
      // For now, just return success
      return { success: true };
    } catch {
      const errorMsg = 'Đã xảy ra lỗi. Vui lòng thử lại.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }
  }, []);

  // Refresh session
  const refreshSession = useCallback(async (): Promise<void> => {
    if (!session?.refreshToken) return;

    try {
      // Simulate refresh
      await new Promise(resolve => setTimeout(resolve, 500));

      const newSession: UserSession = {
        ...session,
        accessToken: `token-${Date.now()}-${Math.random().toString(36)}`,
        expiresAt: new Date(Date.now() + authConfig.accessTokenExpiry),
      };

      saveSession(newSession);
      setSession(newSession);
    } catch {
      // If refresh fails, logout
      await logout();
    }
  }, [session, logout]);

  // Update user
  const updateUser = useCallback(async (data: Partial<User>): Promise<void> => {
    if (!user || !session) return;

    const updatedUser = { ...user, ...data, updatedAt: new Date() };
    const updatedSession = { ...session, user: updatedUser };

    saveSession(updatedSession);
    setSession(updatedSession);
    setUser(updatedUser);
  }, [user, session]);

  // Permission helpers
  const can = useCallback((permission: Permission) => hasPermission(user, permission), [user]);
  const canAny = useCallback((permissions: Permission[]) => hasAnyPermission(user, permissions), [user]);
  const canAll = useCallback((permissions: Permission[]) => hasAllPermissions(user, permissions), [user]);

  // Role helpers
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const isOperator = user?.role === 'operator';
  const isViewer = user?.role === 'viewer';

  // Context value
  const value = useMemo<AuthContextType>(() => ({
    status,
    user,
    session,
    error,
    login,
    logout,
    register,
    refreshSession,
    updateUser,
    can,
    canAny,
    canAll,
    isAdmin,
    isManager,
    isOperator,
    isViewer,
  }), [status, user, session, error, login, logout, register, refreshSession, updateUser, can, canAny, canAll, isAdmin, isManager, isOperator, isViewer]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// =============================================================================
// HOOKS
// =============================================================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useUser(): User | null {
  const { user } = useAuth();
  return user;
}

export function usePermission(permission: Permission): boolean {
  const { can } = useAuth();
  return can(permission);
}

export function usePermissions(permissions: Permission[]): boolean[] {
  const { can } = useAuth();
  return permissions.map(p => can(p));
}

// =============================================================================
// PROTECTED ROUTE COMPONENT
// =============================================================================

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback,
  redirectTo,
}: ProtectedRouteProps) {
  const { status, can, canAny, canAll } = useAuth();

  // Show loading while checking auth
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-gray-500">Đang kiểm tra quyền truy cập...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (status === 'unauthenticated') {
    if (redirectTo && typeof window !== 'undefined') {
      window.location.href = redirectTo || authConfig.loginPath;
      return null;
    }
    return fallback || null;
  }

  // Check permissions
  let hasAccess = true;
  if (permission) {
    hasAccess = can(permission);
  } else if (permissions) {
    hasAccess = requireAll ? canAll(permissions) : canAny(permissions);
  }

  if (!hasAccess) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Không có quyền truy cập
          </h2>
          <p className="text-gray-500 mb-4">
            Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.
          </p>
          <a
            href={authConfig.dashboardPath}
            className="inline-block px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
          >
            Về trang chủ
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// =============================================================================
// PERMISSION GATE COMPONENT
// =============================================================================

interface PermissionGateProps {
  children: React.ReactNode;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  children,
  permission,
  permissions,
  requireAll = false,
  fallback = null,
}: PermissionGateProps) {
  const { can, canAny, canAll } = useAuth();

  let hasAccess = true;
  if (permission) {
    hasAccess = can(permission);
  } else if (permissions) {
    hasAccess = requireAll ? canAll(permissions) : canAny(permissions);
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default AuthProvider;
