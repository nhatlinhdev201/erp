// =============================================================================
// L-ERP MRP - AUTH MODULE INDEX
// Export all authentication related functionality
// =============================================================================

// Types & Config
export * from './auth-types';

// Context & Hooks
export {
  AuthProvider,
  useAuth,
  useUser,
  usePermission,
  usePermissions,
  ProtectedRoute,
  PermissionGate,
} from './auth-context';

// Components are in /components/auth/
// Import them directly:
// import { LoginPage } from '@/components/auth/login-page';
// import { UserMenu, UserAvatar } from '@/components/auth/user-menu';
