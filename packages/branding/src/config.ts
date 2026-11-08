// ============================================================
// @linkk/branding — Central Branding Configuration
// ============================================================
//
// CÁC BƯỚC CÁ NHÂN HÓA CHO DOANH NGHIỆP:
// 1. Sửa file này với thông tin thương hiệu riêng
// 2. Chạy: npx ts-node scripts/rebrand.ts
// 3. Rebuild: turbo build
//
// STEPS TO CUSTOMIZE FOR YOUR BUSINESS:
// 1. Edit this file with your brand information
// 2. Run: npx ts-node scripts/rebrand.ts
// 3. Rebuild: turbo build
// ============================================================

export interface BrandConfig {
  // ─── Core Identity ─────────────────────────────────
  /** Tên nền tảng / Platform name */
  platform: {
    name: string;
    shortName: string;
    tagline: {
      vi: string;
      en: string;
    };
    description: {
      vi: string;
      en: string;
    };
    version: string;
  };

  // ─── Company Info ──────────────────────────────────
  /** Thông tin công ty / Company information */
  company: {
    name: string;
    legalName: string;
    taxCode: string;
    website: string;
    supportEmail: string;
    noReplyEmail: string;
  };

  // ─── Visual Identity ───────────────────────────────
  /** Nhận diện thương hiệu / Visual branding */
  visual: {
    logoPath: string;
    faviconPath: string;
    colors: {
      primary: string;
      secondary: string;
      accent: string;
    };
  };

  // ─── Technical ─────────────────────────────────────
  /** Cấu hình kỹ thuật / Technical configuration */
  technical: {
    /** npm scope prefix: "@yourscope/" */
    npmScope: string;
    /** API key prefix: "yourprefix_live_" */
    apiKeyPrefix: string;
    /** Docker registry */
    dockerRegistry: string;
    /** K8s namespace */
    k8sNamespace: string;
    /** Event subject prefix: "yourprefix.module.event" */
    eventPrefix: string;
    /** Domain */
    domain: string;
    /** Database name prefix */
    dbPrefix: string;
    /** Cookie/storage key prefix */
    storagePrefix: string;
    /** GitHub org/user */
    githubOrg: string;
    /** S3 bucket prefix */
    s3Prefix: string;
  };

  // ─── AI Provider ───────────────────────────────────
  /** Cấu hình AI / AI provider config */
  ai: {
    /** Tên hiển thị AI trợ lý / AI assistant display name */
    assistantName: {
      vi: string;
      en: string;
    };
    /** Provider name (for display, not code) */
    providerLabel: string;
  };

  // ─── Legal ─────────────────────────────────────────
  /** Pháp lý / Legal notices */
  legal: {
    copyright: string;
    license: string;
  };
}

// ─── Default: Linkk-ERP Platform (Open-Source) ─────────────────

export const DEFAULT_BRAND: BrandConfig = {
  platform: {
    name: 'Linkk-ERP Platform',
    shortName: 'L-ERP',
    tagline: {
      vi: 'Nền tảng Quản trị Doanh nghiệp Toàn diện',
      en: 'Comprehensive Enterprise Resource Planning Platform',
    },
    description: {
      vi: 'Hệ thống ERP mã nguồn mở, tối ưu cho doanh nghiệp Việt Nam',
      en: 'Open-source ERP system optimized for Vietnamese businesses',
    },
    version: '1.0.0',
  },

  company: {
    name: 'Linkk',
    legalName: 'Your Company LLC',
    taxCode: '0000000000',
    website: 'https://linkk-erp.com',
    supportEmail: 'support@linkk-erp.com',
    noReplyEmail: 'noreply@linkk-erp.com',
  },

  visual: {
    logoPath: '/assets/logo.svg',
    faviconPath: '/assets/favicon.ico',
    colors: {
      primary: '#2563eb',
      secondary: '#7c3aed',
      accent: '#059669',
    },
  },

  technical: {
    npmScope: '@linkk',
    apiKeyPrefix: 'lerp_live_',
    dockerRegistry: 'registry.your-domain.com',
    k8sNamespace: 'lerp-system',
    eventPrefix: 'lerp',
    domain: 'linkk-erp.com',
    dbPrefix: 'lerp',
    storagePrefix: 'lerp',
    githubOrg: 'your-org',
    s3Prefix: 'lerp-files',
  },

  ai: {
    assistantName: {
      vi: 'Trợ lý AI / AI Assistant',
      en: 'AI Assistant',
    },
    providerLabel: 'AI',
  },

  legal: {
    copyright: `© ${new Date().getFullYear()} Your Company. All rights reserved.`,
    license: 'MIT',
  },
};

// ─── Load brand (supports env override) ──────────────────────

let _brand: BrandConfig = DEFAULT_BRAND;

export function setBrand(config: Partial<BrandConfig>): void {
  _brand = deepMerge(DEFAULT_BRAND, config) as BrandConfig;
}

export function getBrand(): BrandConfig {
  return _brand;
}

// Deep merge helper
function deepMerge(target: any, source: any): any {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
