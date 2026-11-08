# NextAuth v5 Migration & Monitoring Guide

> **Current Version:** next-auth@5.0.0-beta.25  
> **Status:** ⚠️ Beta  
> **Last Updated:** 2026-01-25

## 📋 Overview

Dự án L-ERP HRM sử dụng NextAuth v5 (beta) cho authentication. Tài liệu này cung cấp hướng dẫn monitoring và migration plan.

## ⚠️ Known Beta Risks

### 1. Breaking Changes Potential
NextAuth v5 vẫn đang trong giai đoạn beta, có thể có breaking changes giữa các versions.

### 2. Current Beta Issues
- Session callback type definitions không hoàn chỉnh
- Edge runtime compatibility issues với một số adapters
- Documentation gaps cho advanced use cases

## 🔒 Current Implementation

### File Structure
```
src/
├── lib/
│   ├── auth.ts              # Auth configuration export
│   └── auth-options.ts      # NextAuth options
├── app/
│   └── api/
│       └── auth/
│           └── [...nextauth]/
│               └── route.ts  # Auth API routes
└── middleware.ts            # Auth middleware
```

### Features in Use
- ✅ Credentials Provider (email/password)
- ✅ JWT Sessions
- ✅ Custom callbacks (session, jwt)
- ✅ Multi-tenant support
- ✅ Role-based access control

## 📊 Monitoring Checklist

### Weekly Tasks
- [ ] Check [NextAuth GitHub Releases](https://github.com/nextauthjs/next-auth/releases)
- [ ] Review changelog for breaking changes
- [ ] Check [NextAuth Discord](https://discord.gg/nextauth) for announcements

### Monthly Tasks
- [ ] Test authentication flow in staging
- [ ] Review security advisories
- [ ] Update dependencies nếu có patch releases

### Per Release Tasks
When a new beta version is released:
1. Read full changelog
2. Check breaking changes section
3. Test in development first
4. Run full E2E test suite
5. Deploy to staging
6. Monitor for 24 hours before production

## 🔄 Migration Plan to Stable

### Phase 1: Preparation (When RC is announced)
1. Create feature branch `feat/nextauth-stable`
2. Update package.json
3. Review migration guide
4. Update deprecated API calls

### Phase 2: Testing
1. Run unit tests
2. Run E2E authentication tests
3. Test all login flows
4. Test session management
5. Test role-based access

### Phase 3: Deployment
1. Deploy to staging
2. Smoke test all features
3. Monitor error logs
4. Deploy to production (off-peak hours)

## 🛠️ Upgrade Commands

```bash
# Check current version
npm list next-auth

# Update to latest beta
npm update next-auth@beta

# Or specific version
npm install next-auth@5.0.0-beta.26
```

## 🔐 Security Considerations

### Current Settings
```typescript
// auth-options.ts
{
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60,
  },
}
```

### Recommended After Stable
- [ ] Enable database sessions option
- [ ] Implement refresh token rotation
- [ ] Add session invalidation on password change
- [ ] Consider adding 2FA

## 📝 Version History

| Version | Date | Notes |
|---------|------|-------|
| 5.0.0-beta.25 | 2026-01-15 | Initial implementation |

## 🔗 Resources

- [NextAuth v5 Documentation](https://authjs.dev/)
- [Migration Guide v4 to v5](https://authjs.dev/getting-started/migrating-to-v5)
- [GitHub Issues](https://github.com/nextauthjs/next-auth/issues)
- [NextAuth Discord](https://discord.gg/nextauth)

## 🚨 Emergency Rollback

If critical issues occur:

```bash
# Rollback to previous version
npm install next-auth@5.0.0-beta.24

# Or if needed, rollback to v4
npm install next-auth@4.24.5
```

**Note:** Rollback from v5 to v4 requires significant code changes.

---

*Last reviewed: 2026-01-25*
