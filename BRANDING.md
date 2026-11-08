# Linkk-ERP Platform — Hướng dẫn Cá nhân hoá Thương hiệu / Branding Customization Guide

## Tổng quan / Overview

Linkk-ERP Platform là hệ thống ERP mã nguồn mở, được thiết kế để doanh nghiệp dễ dàng cá nhân hoá thương hiệu (white-label). Mọi thông tin thương hiệu được quản lý tập trung tại package `@linkk/branding`.

Linkk-ERP Platform is an open-source ERP system designed for easy white-label customization. All branding information is centrally managed in the `@linkk/branding` package.

---

## Hướng dẫn nhanh / Quick Start

### Bước 1: Sửa cấu hình thương hiệu / Step 1: Edit Brand Config

Mở file `packages/branding/src/config.ts` và thay đổi `DEFAULT_BRAND`:

```typescript
export const DEFAULT_BRAND: BrandConfig = {
  platform: {
    name: 'Tên Nền tảng của bạn / Your Platform Name',
    shortName: 'ShortName',
    tagline: {
      vi: 'Slogan tiếng Việt',
      en: 'English tagline',
    },
    // ...
  },
  company: {
    name: 'Tên Công ty',
    website: 'https://your-domain.com',
    supportEmail: 'support@your-domain.com',
    // ...
  },
  technical: {
    npmScope: '@yourscope',
    apiKeyPrefix: 'yourprefix_live_',
    k8sNamespace: 'your-system',
    eventPrefix: 'your',
    s3Prefix: 'your-files',
    // ...
  },
  // ...
};
```

### Bước 2: Chạy script tái thương hiệu / Step 2: Run Rebrand Script

```bash
# Xem trước thay đổi / Preview changes (dry run)
npx ts-node scripts/rebrand.ts --dry-run

# Thực hiện thay đổi / Apply changes
npx ts-node scripts/rebrand.ts
```

Hoặc sử dụng biến môi trường / Or use environment variables:

```bash
BRAND_NAME="MyERP Platform" \
BRAND_SHORT="MyERP" \
BRAND_DOMAIN="myerp.com" \
BRAND_COMPANY="My Company Ltd" \
BRAND_NPM_SCOPE="@myerp" \
BRAND_S3_PREFIX="myerp-files" \
BRAND_K8S_NS="myerp-system" \
npx ts-node scripts/rebrand.ts
```

### Bước 3: Rebuild / Step 3: Rebuild

```bash
turbo build
```

---

## Kiến trúc Branding / Branding Architecture

### Package `@linkk/branding`

```
packages/branding/
├── package.json          # Package metadata
├── tsconfig.json         # TypeScript config
└── src/
    ├── index.ts          # Main exports
    ├── config.ts         # BrandConfig interface + DEFAULT_BRAND
    └── i18n.ts           # UILabels bilingual Vi-En
```

### Cấu trúc BrandConfig / BrandConfig Structure

| Phần / Section    | Mô tả / Description                                        |
|-------------------|-------------------------------------------------------------|
| `platform`        | Tên, slogan, phiên bản / Name, tagline, version            |
| `company`         | Thông tin pháp lý, website, email / Legal info, contacts    |
| `visual`          | Logo, favicon, màu sắc / Logo, favicon, color palette       |
| `technical`       | NPM scope, API prefix, Docker, K8s, S3 / Technical IDs      |
| `ai`              | Tên trợ lý AI / AI assistant display name                   |
| `legal`           | Copyright, license / Legal notices                          |

### Sử dụng trong code / Usage in Code

```typescript
// Import từ package trung tâm / Import from central package
import { getBrand, getLabels, platformName } from '@linkk/branding';

// Lấy config / Get config
const brand = getBrand();
console.log(brand.platform.name);  // "Linkk-ERP Platform"

// Lấy UI labels song ngữ / Get bilingual UI labels
import { setLocale, getLabels } from '@linkk/branding';
setLocale('vi-en');  // Song ngữ / Bilingual
const labels = getLabels();
console.log(labels.nav.dashboard);  // "Tổng quan / Dashboard"

// Override brand tại runtime / Runtime brand override
import { setBrand } from '@linkk/branding';
setBrand({
  platform: { name: 'MyERP', shortName: 'MyERP' },
  company: { name: 'My Company' },
});
```

---

## Ngôn ngữ giao diện / UI Language

### 3 chế độ / 3 Modes

| Chế độ / Mode | Ví dụ / Example            | Cách dùng / Usage    |
|----------------|----------------------------|----------------------|
| `vi`           | Tổng quan                  | `setLocale('vi')`    |
| `en`           | Dashboard                  | `setLocale('en')`    |
| `vi-en`        | Tổng quan / Dashboard      | `setLocale('vi-en')` |

### Danh sách labels / Label Categories

- **nav**: Menu điều hướng / Navigation menu
- **modules**: Tên modules (HRM, CRM, Accounting...) / Module names
- **actions**: Hành động CRUD / CRUD actions
- **labels**: Nhãn chung / Common labels
- **hrm**: Nhân sự / Human Resources
- **crm**: Khách hàng / Customer Relations
- **accounting**: Kế toán / Accounting
- **ecommerce**: Thương mại điện tử / E-Commerce
- **mrp**: Sản xuất / Manufacturing
- **auth**: Xác thực / Authentication
- **messages**: Thông báo / Notifications
- **pages**: Trang / Page titles

---

## Thay đổi Logo & Màu sắc / Logo & Colors

### Logo

Thay thế các file sau / Replace these files:
- `public/assets/logo.svg` — Logo chính / Primary logo
- `public/assets/favicon.ico` — Favicon

Cập nhật đường dẫn trong config / Update paths in config:
```typescript
visual: {
  logoPath: '/assets/your-logo.svg',
  faviconPath: '/assets/your-favicon.ico',
}
```

### Màu sắc / Colors

```typescript
visual: {
  colors: {
    primary: '#2563eb',    // Màu chính / Primary
    secondary: '#7c3aed',  // Màu phụ / Secondary
    accent: '#059669',     // Màu nhấn / Accent
  },
}
```

---

## Checklist cá nhân hoá / Customization Checklist

- [ ] Sửa `packages/branding/src/config.ts` — Thông tin thương hiệu / Brand info
- [ ] Thay logo: `public/assets/logo.svg` & `favicon.ico`
- [ ] Chạy `npx ts-node scripts/rebrand.ts` — Script tự động / Auto rebrand
- [ ] Kiểm tra `packages/branding/src/i18n.ts` — Tuỳ chỉnh labels / Custom labels
- [ ] Cập nhật `.env` files — Domain, email, S3 bucket
- [ ] Cập nhật `docker-compose.yml` — Container names (nếu cần / if needed)
- [ ] Cập nhật K8s manifests — Namespace, service names
- [ ] `turbo build` — Rebuild toàn bộ / Full rebuild
- [ ] Kiểm tra UI — Xác nhận không còn dấu vết cũ / Verify no old traces

---

## Cấu hình kỹ thuật / Technical Configuration

### Danh sách biến cần thay đổi / Variables to Change

| Biến / Variable    | Mặc định / Default              | Mô tả / Description                    |
|--------------------|----------------------------------|-----------------------------------------|
| `npmScope`         | `@lerp`                        | NPM package scope                       |
| `apiKeyPrefix`     | `lerp_live_`                   | API key prefix                          |
| `dockerRegistry`   | `registry.your-domain.com`      | Docker registry URL                     |
| `k8sNamespace`     | `lerp-system`                  | Kubernetes namespace                    |
| `eventPrefix`      | `lerp`                         | NATS event subject prefix               |
| `domain`           | `your-domain.com`               | Primary domain                          |
| `dbPrefix`         | `lerp`                         | Database name prefix                    |
| `storagePrefix`    | `lerp`                         | Cookie/localStorage key prefix          |
| `githubOrg`        | `your-org`                      | GitHub organization                     |
| `s3Prefix`         | `lerp-files`                   | S3 bucket name prefix                   |

---

## Hỗ trợ / Support

Nếu gặp vấn đề khi cá nhân hoá, vui lòng:
If you encounter issues during customization:

1. Kiểm tra `rebrand-report.json` sau khi chạy script / Check the report after running the script
2. Tìm kiếm thủ công / Manual search: `grep -r "old-brand" --include="*.ts" --include="*.tsx"`
3. Mở issue trên GitHub / Open a GitHub issue

---

*Tài liệu này được tạo tự động bởi Linkk-ERP Platform Debranding Tool.*
*This document was auto-generated by the Linkk-ERP Platform Debranding Tool.*
