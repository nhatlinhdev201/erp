// ============================================================
// @linkk/branding — LIPHOCO Brand Configuration
// ============================================================
//
// File này chứa cấu hình thương hiệu LIPHOCO
// Import vào app entry point: import './liphoco.config'
//
// Sử dụng:
//   1. Copy file này vào packages/branding/src/
//   2. Import trong app layout: import '@linkk/branding/liphoco.config'
//   3. Rebuild: turbo build
// ============================================================

import { setBrand, type BrandConfig } from './config';

const LIPHOCO_BRAND: BrandConfig = {
  platform: {
    name: 'LIPHOCO ERP',
    shortName: 'LIPHOCO',
    tagline: {
      vi: 'Hệ thống Quản trị Sản xuất & Xuất khẩu',
      en: 'Manufacturing & Export Management System',
    },
    description: {
      vi: 'ERP tối ưu cho sản xuất cơ khí chính xác — từ báo giá đến giao hàng',
      en: 'ERP optimized for precision steel fabrication — from quotation to delivery',
    },
    version: '1.0.0',
  },

  company: {
    name: 'LIPHOCO',
    legalName: 'Công ty TNHH Cơ Khí Linh Phong',
    taxCode: '1101628380', // Anh verify lại MST chính xác
    website: 'https://liphoco.com',
    supportEmail: 'support@liphoco.com',
    noReplyEmail: 'noreply@liphoco.com',
  },

  visual: {
    logoPath: '/assets/liphoco-logo.svg',
    faviconPath: '/assets/liphoco-favicon.ico',
    colors: {
      primary: '#1B4D7A',    // LIPHOCO navy blue
      secondary: '#E8763A',  // LIPHOCO accent orange
      accent: '#2A9D60',     // Success green
    },
  },

  technical: {
    npmScope: '@liphoco',
    apiKeyPrefix: 'lp_live_',
    dockerRegistry: 'registry.liphoco.com',
    k8sNamespace: 'liphoco-erp',
    eventPrefix: 'liphoco',
    domain: 'erp.liphoco.com',
    dbPrefix: 'liphoco',
    storagePrefix: 'lp',
    githubOrg: 'CQV888',
    s3Prefix: 'liphoco-erp-files',
  },

  ai: {
    assistantName: {
      vi: 'LP Copilot — Trợ lý AI LIPHOCO',
      en: 'LP Copilot — LIPHOCO AI Assistant',
    },
    providerLabel: 'Claude (Anthropic)',
  },

  legal: {
    copyright: `© ${new Date().getFullYear()} LIPHOCO — Linh Phong Mechanical Co., Ltd. All rights reserved.`,
    license: 'Proprietary',
  },
};

// ─── Auto-apply on import ────────────────────────────────────
setBrand(LIPHOCO_BRAND);

export { LIPHOCO_BRAND };
