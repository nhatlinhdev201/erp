# Chính sách Bảo mật / Security Policy

## Phiên bản được hỗ trợ / Supported Versions

| Phiên bản / Version | Được hỗ trợ / Supported | Kết thúc / EOL Date |
|---------|-----------|-----------|
| 2.x | Có / Yes | Hiện tại / Current |
| 1.x | Có / Yes | 2026-12-31 |
| < 1.0 | Không / No | 2026-01-01 |

**Hỗ trợ bảo mật:** Các phiên bản được hỗ trợ sẽ nhận các bản vá bảo mật.
**Security Support:** Supported versions will receive security patches.

## Báo cáo Lỗ hổng / Reporting a Vulnerability

### ⚠️ Quan trọng / Important

**Vui lòng KHÔNG báo cáo lỗ hổng bảo mật qua GitHub Issues công khai hoặc Discussions.**
**Please do NOT report security vulnerabilities through public GitHub issues or discussions.**

Công khai báo cáo lỗ hổng có thể cho phép kẻ tấn công tận dụng trước khi có bản vá.
Disclosing vulnerabilities publicly can allow attackers to exploit before patches are available.

### Báo cáo Có trách nhiệm / Responsible Disclosure

Nếu bạn phát hiện lỗ hổng bảo mật, vui lòng báo cáo:

**Email:** security@lerp.dev
**PGP Key:** (Key ID sẽ được cung cấp)

**Bao gồm trong báo cáo:**

```
1. Tiêu đề lỗ hổng (vd: "SQL Injection in Customer Filter")
2. Mô tả chi tiết
3. Tác động tiềm ẩn (severity: Critical/High/Medium/Low)
4. Các bước tái tạo (step-by-step)
5. Chứng minh khái niệm (nếu có)
6. Đề xuất sửa (nếu có)
7. Phiên bản ảnh hưởng (vd: 1.0.0, 1.1.0)
```

**Ví dụ báo cáo:**
```
Subject: SQL Injection in /api/customers?filter endpoint

Description:
The customer filter endpoint is vulnerable to SQL injection through
the 'search' parameter. It concatenates user input directly into
the SQL query without proper parameterization.

Affected Versions: 1.0.0, 1.1.0

Reproduction Steps:
1. Call GET /api/customers?search='; DROP TABLE customers; --
2. Database table is dropped

Proof of Concept:
[include code/screenshots]

Suggested Fix:
Use parameterized queries instead of string concatenation.
We already use Prisma ORM which prevents this, but this endpoint
bypasses it with custom SQL.
```

## Quy trình Xử lý / Response Process

### Timeline / Lịch trình

| Bước / Step | Thời gian / Timeline | Mô tả / Description |
|-----|---------|-----------|
| 1. Xác nhận / Acknowledgment | 24 giờ / hours | Xác nhận nhận báo cáo |
| 2. Đánh giá / Evaluation | 5 ngày / days | Xác minh lỗ hổng, đánh giá mức độ |
| 3. Sửa chữa / Remediation | Phụ thuộc / Depends | Phát triển bản vá (thời gian dựa vào mức độ) |
| 4. Thử nghiệm / Testing | 7 ngày / days | Kiểm thử bản vá |
| 5. Phát hành / Release | 10 ngày / days | Phát hành patch version |
| 6. Công bố / Disclosure | 14 ngày / days | Công bố lỗ hổng sau khi phát hành patch |

### Mức độ Nghiêm trọng / Severity Levels

| Mức độ / Level | CVSS Score | Ví dụ / Examples | Phản hồi / Response |
|-------|--------|---------|-------------|
| 🔴 Nghiêm trọng / Critical | 9.0-10.0 | Remote Code Execution, Complete data breach | 24 giờ / 24 hours |
| 🟠 Cao / High | 7.0-8.9 | Authentication bypass, Privilege escalation | 72 giờ / 72 hours |
| 🟡 Trung bình / Medium | 4.0-6.9 | XSS, CSRF, Information disclosure | 7 ngày / 7 days |
| 🟢 Thấp / Low | 0.1-3.9 | Minor issues, Best practice violations | 30 ngày / 30 days |

### Ví dụ Mức độ / Severity Examples

**Critical / Nghiêm trọng:**
- ❌ SQL injection cho phép truy cập tất cả dữ liệu
- ❌ RCE trên server
- ❌ Complete bypass của xác thực
- ❌ Decryption của tất cả dữ liệu ở rest

**High / Cao:**
- ❌ Vượt quyền từ USER lên ADMIN
- ❌ Truy cập dữ liệu của tenant khác
- ❌ Xoá dữ liệu của người dùng khác
- ❌ Leak của API keys hoặc passwords

**Medium / Trung bình:**
- ⚠️ Stored XSS trong comments
- ⚠️ CSRF attacks trên sensitive actions
- ⚠️ Leak của email addresses
- ⚠️ Rate limiting bypass

**Low / Thấp:**
- ℹ️ Outdated dependencies (with no known exploits)
- ℹ️ Missing HTTP headers (non-critical)
- ℹ️ Typos hoặc missing validation
- ℹ️ Code quality issues

## Biện pháp Bảo mật / Security Measures

Linkk-ERP Platform được thiết kế với các biện pháp bảo mật sau:

### Xác thực & Phân quyền / Authentication & Authorization

✅ **Keycloak SSO Integration**
- OpenID Connect / OAuth 2.0
- Multi-factor authentication support
- Session management
- Token-based authentication

✅ **Role-Based Access Control (RBAC)**
```
- ADMIN: Full access
- MANAGER: Department/module management
- USER: Standard user access
- VIEWER: Read-only access
```

✅ **Row-Level Security (RLS)**
- Multi-tenant isolation at database level
- Tenant filters on all queries
- Cannot access other tenant's data

### Cơ sở Dữ liệu / Database Security

✅ **SQL Injection Prevention**
```typescript
// ✅ SAFE: Using Prisma ORM (parameterized)
const customers = await prisma.customer.findMany({
  where: { name: { contains: userInput } }
});

// ❌ UNSAFE: Raw SQL concatenation
const query = `SELECT * FROM customers WHERE name LIKE '%${userInput}%'`;
```

✅ **Encryption at Rest**
- PostgreSQL native encryption support
- Application-level encryption for sensitive fields (PII)
- Encrypted backups

✅ **Encrypted Backups**
```bash
# Backup with encryption
pg_dump | gpg --encrypt > backup.sql.gpg

# Restore from encrypted backup
gpg --decrypt backup.sql.gpg | psql
```

### API Security / Bảo mật API

✅ **Rate Limiting**
```
- 100 requests/minute per IP
- 1000 requests/hour per authenticated user
- Configurable per endpoint
```

✅ **CORS Configuration**
```
- Only allowed origins can access API
- Credentials not shared cross-origin
- Preflight requests validated
```

✅ **Security Headers**
```
- Content-Security-Policy: Prevents XSS
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- Strict-Transport-Security: HSTS
```

✅ **Input Validation**
```typescript
// All API inputs are validated
const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[0-9\-\(\)\s]+$/),
});

const validated = schema.parse(userInput);
```

### Event & Audit Security / Bảo mật Sự kiện & Kiểm toán

✅ **Event Versioning**
- All events include version number
- Backward compatibility maintained
- Schema evolution tracked

✅ **Idempotency Keys**
- Prevent duplicate processing
- Retry-safe operations
- Transaction consistency

✅ **Audit Logging**
```
All changes logged:
- Who: User ID
- What: Entity and operation
- When: Timestamp with timezone
- Where: IP address and user agent
- Why: Event source and reason
```

✅ **Data Change Tracking**
```sql
SELECT * FROM audit_logs
WHERE entity = 'invoice'
  AND entityId = 'inv-123'
  AND action = 'UPDATE'
ORDER BY createdAt DESC;
```

### Infrastructure & Deployment / Cơ sở hạ tầng & Triển khai

✅ **Docker Security**
```dockerfile
# ✅ Non-root user
USER node:node

# ✅ Read-only root filesystem
RUN chmod -R 555 /

# ✅ No secrets in image
# Use environment variables
```

✅ **Kubernetes Security** (if using K8s)
```yaml
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  readOnlyRootFilesystem: true
  allowPrivilegeEscalation: false
```

✅ **Environment Variables**
```bash
# ✅ Never commit .env files
echo ".env" >> .gitignore

# ✅ Use .env.example for documentation
# Copy and fill in production .env manually
```

✅ **Secret Management**
```bash
# Use managed secret services:
- AWS Secrets Manager
- Google Cloud Secret Manager
- Azure Key Vault
- HashiCorp Vault
- Kubernetes Secrets

# Never commit secrets
# Never log secrets
# Rotate regularly
```

### Dependency Management / Quản lý Phụ thuộc

✅ **Regular Updates**
```bash
# Check for vulnerabilities
npm audit

# Update packages
npm update

# Check licenses
npm ls --depth=0

# Review new versions
npx npm-check-updates
```

✅ **Supply Chain Security**
```bash
# Verify package integrity
npm publish --dry-run

# Use exact versions for production
npm install --save-exact

# Lock dependency tree
npm ci (instead of npm install)
```

✅ **Dependency Scanning**
- GitHub Dependabot enabled
- Automated security updates
- Pull requests for new patches

## Best Practices cho Developers / Best Practices for Developers

### Khi Viết Code / When Writing Code

✅ **Validation & Sanitization**
```typescript
// Validate all user inputs
import { z } from 'zod';

const customerSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional(),
});

const createCustomer = async (input: unknown) => {
  const { name, email } = customerSchema.parse(input);
  // Safe to use name and email
};
```

✅ **No Sensitive Data in Logs**
```typescript
// ❌ BAD
logger.info(`Login: ${email}, ${password}`);

// ✅ GOOD
logger.info(`Login attempt for ${email}`);
logger.debug(`Hash: ${hashPassword(password)}`);
```

✅ **Error Handling**
```typescript
// ❌ BAD: Exposing internal details
throw new Error(`Database error: ${error.message}`);

// ✅ GOOD: Generic message, log details separately
logger.error('Database error', { error, query });
throw new Error('An error occurred. Please try again.');
```

✅ **Type Safety**
```typescript
// Use TypeScript strictly
"strict": true,
"noImplicitAny": true,
"noUncheckedIndexedAccess": true,

// Avoid any
// Use discriminated unions
// Exhaustive type checking
```

### Khi Deploying / When Deploying

✅ **Pre-deployment Checklist**
- [ ] All dependencies updated
- [ ] Security audit passed
- [ ] Types checked
- [ ] Tests passed
- [ ] Database migrations tested
- [ ] Secrets configured
- [ ] SSL certificates valid
- [ ] Monitoring configured
- [ ] Backups tested
- [ ] Rollback plan ready

✅ **Production Configuration**
```bash
# Use environment-specific .env
.env.production
.env.staging
.env.development

# Set NODE_ENV=production
NODE_ENV=production npm start

# Enable security headers
ENABLE_SECURITY_HEADERS=true

# Use HTTPS only
HTTPS_ONLY=true
```

✅ **Monitoring & Logging**
```bash
# Log to external service
- ELK Stack
- Datadog
- New Relic
- CloudWatch

# Monitor continuously
- Error rates
- Response times
- Database queries
- Failed authentications
```

## Hall of Fame / Vinh danh

Chúng tôi trân trọng các nhà nghiên cứu bảo mật đã báo cáo có trách nhiệm. Những người đóng góp sẽ được ghi nhận dưới đây (nếu họ muốn):

We appreciate security researchers who report responsibly. Contributors will be recognized below (if they wish):

- (Coming soon)

Nếu bạn tìm thấy lỗ hổng và báo cáo có trách nhiệm, vui lòng cho chúng tôi biết nếu bạn muốn được ghi nhận.

## Liên hệ / Contact

- **Security Email:** security@lerp.dev
- **PGP Key:** (Coming soon)
- **Discord:** [Security Channel](https://discord.gg/lerp)
- **Response:** Xác nhận trong 24 giờ / Acknowledged within 24 hours

Cảm ơn bạn đã giúp Linkk-ERP Platform an toàn hơn!
Thank you for helping make Linkk-ERP Platform more secure!
