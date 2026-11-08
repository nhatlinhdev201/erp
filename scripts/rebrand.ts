#!/usr/bin/env npx ts-node
// ============================================================
// VietERP Platform — Automated Rebrand Script
// ============================================================
//
// Script tự động thay thế thương hiệu / Automated brand replacement
//
// Cách sử dụng / Usage:
//   1. Sửa packages/branding/src/config.ts với thông tin thương hiệu
//      Edit packages/branding/src/config.ts with your brand info
//   2. Chạy / Run: npx ts-node scripts/rebrand.ts
//   3. Rebuild: turbo build
//
// ============================================================

import * as fs from 'fs';
import * as path from 'path';

// ─── Brand Configuration Import ─────────────────────────────
// Load from the central config
// In production, import from '@vierp/branding/config'
// For this script, we read directly

interface BrandValues {
  platformName: string;
  platformShortName: string;
  companyName: string;
  companyLegalName: string;
  domain: string;
  supportEmail: string;
  noReplyEmail: string;
  npmScope: string;
  apiKeyPrefix: string;
  dockerRegistry: string;
  k8sNamespace: string;
  eventPrefix: string;
  dbPrefix: string;
  storagePrefix: string;
  githubOrg: string;
  s3Prefix: string;
  copyright: string;
}

// ─── Default brand values (VietERP Open-Source) ─────────────
const DEFAULT_BRAND: BrandValues = {
  platformName: 'VietERP Platform',
  platformShortName: 'VietERP',
  companyName: 'Your Company',
  companyLegalName: 'Your Company LLC',
  domain: 'your-domain.com',
  supportEmail: 'support@your-domain.com',
  noReplyEmail: 'noreply@your-domain.com',
  npmScope: '@vierp',
  apiKeyPrefix: 'vierp_live_',
  dockerRegistry: 'registry.your-domain.com',
  k8sNamespace: 'vierp-system',
  eventPrefix: 'vierp',
  dbPrefix: 'vierp',
  storagePrefix: 'vierp',
  githubOrg: 'your-org',
  s3Prefix: 'vierp-files',
  copyright: `© ${new Date().getFullYear()} Your Company. All rights reserved.`,
};

// ─── Brand patterns to replace ──────────────────────────────
// Each entry: [pattern (string or regex), replacement function]

interface ReplacementRule {
  name: string;
  description: string;
  /** File glob patterns to include */
  include: string[];
  /** File glob patterns to exclude */
  exclude: string[];
  /** Replacements: [searchPattern, replaceValue] */
  replacements: Array<[string | RegExp, string]>;
}

function buildRules(brand: BrandValues): ReplacementRule[] {
  return [
    // ─── 1. Package Names ─────────────────────────────────
    {
      name: 'package-names',
      description: 'Thay đổi package names / Replace package names',
      include: ['**/package.json', '**/package-lock.json'],
      exclude: ['**/node_modules/**'],
      replacements: [
        ['@promo-master/', `${brand.npmScope}/tpm-`],
        ['"promo-master-api"', `"${brand.npmScope.slice(1)}-tpm-api"`],
        ['"promo-master"', `"${brand.npmScope.slice(1)}-tpm"`],
        ['"lacviet-hr"', `"${brand.npmScope.slice(1)}-hrm"`],
      ],
    },

    // ─── 2. Page Titles & Metadata ────────────────────────
    {
      name: 'page-titles',
      description: 'Thay đổi tiêu đề trang / Replace page titles',
      include: ['**/*.tsx', '**/*.ts', '**/*.jsx', '**/*.js'],
      exclude: ['**/node_modules/**', '**/dist/**', 'scripts/**'],
      replacements: [
        [/\| RTR HRM/g, `| ${brand.platformShortName} HRM`],
        [/\| RTR-HRM/g, `| ${brand.platformShortName} HRM`],
        [/RTR-HRM/g, `${brand.platformShortName} HRM`],
        [/RTR HRM/g, `${brand.platformShortName} HRM`],
        [/RTR-CRM/g, `${brand.platformShortName} CRM`],
        [/RTR CRM/g, `${brand.platformShortName} CRM`],
        [/RTRobotics MRP/g, `${brand.platformShortName} MRP`],
        [/RTR MRP/g, `${brand.platformShortName} MRP`],
        [/RTR-MRP/g, `${brand.platformShortName} MRP`],
        [/RTR PM/g, `${brand.platformShortName} PM`],
        [/RTR-PM/g, `${brand.platformShortName} PM`],
        [/DAFC OTB Planning System/g, `${brand.platformShortName} OTB`],
        [/DAFC OTB Planning Management System/g, `${brand.platformShortName} OTB Planning`],
        [/DAFC OTB/g, `${brand.platformShortName} OTB`],
        [/Promo-Master/g, `${brand.platformShortName} TPM`],
        [/PromoMaster/g, `${brand.platformShortName} TPM`],
        [/promo-master/g, `${brand.storagePrefix}-tpm`],
      ],
    },

    // ─── 3. LacViet Brand ─────────────────────────────────
    {
      name: 'lacviet-brand',
      description: 'Thay thế thương hiệu LacViet / Replace LacViet brand',
      include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.json', '**/*.yaml', '**/*.yml', '**/*.env*', '**/*.md'],
      exclude: ['**/node_modules/**', '**/dist/**', 'scripts/rebrand.ts'],
      replacements: [
        [/LacViet HR/g, `${brand.platformShortName} HRM`],
        [/Lac Viet/g, brand.companyName],
        [/LacViet/g, brand.companyName],
        [/lacviet-hr-locale/g, `${brand.storagePrefix}-hr-locale`],
        [/lacviet-hr-v1/g, `${brand.storagePrefix}-hr-v1`],
        [/lacviet-hr-users/g, `${brand.storagePrefix}-hr-users`],
        [/lacviet-hr/g, `${brand.storagePrefix}-hrm`],
        [/lacviet:/g, `${brand.storagePrefix}:`],
        [/lacviet/g, brand.storagePrefix],
      ],
    },

    // ─── 4. DAFC Brand ────────────────────────────────────
    {
      name: 'dafc-brand',
      description: 'Thay thế thương hiệu DAFC / Replace DAFC brand',
      include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.css', '**/*.json', '**/*.yaml', '**/*.yml', '**/*.env*', '**/*.md'],
      exclude: ['**/node_modules/**', '**/dist/**', 'scripts/rebrand.ts'],
      replacements: [
        [/DAFC DESIGN TOKENS/g, `${brand.platformShortName.toUpperCase()} DESIGN TOKENS`],
        [/DAFC Gold/g, `${brand.platformShortName} Gold`],
        [/DAFC Primary Button/g, `${brand.platformShortName} Primary Button`],
        [/DAFC Card/g, `${brand.platformShortName} Card`],
        [/DAFC Badge/g, `${brand.platformShortName} Badge`],
        [/DAFC Input/g, `${brand.platformShortName} Input`],
        [/DAFC Vietnam/g, `${brand.companyName}`],
        [/DAFC_SKU/g, `${brand.platformShortName.toUpperCase()}_SKU`],
        [/DAFC/g, brand.platformShortName],
        [/dafc-otb-files/g, `${brand.s3Prefix}-otb`],
        [/dafc/g, brand.storagePrefix],
      ],
    },

    // ─── 5. Email Domains ─────────────────────────────────
    {
      name: 'email-domains',
      description: 'Thay thế email domains / Replace email domains',
      include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.json', '**/*.yaml', '**/*.yml', '**/*.env*', '**/*.md', '**/seed.ts', '**/*.prisma'],
      exclude: ['**/node_modules/**', '**/dist/**', 'scripts/rebrand.ts'],
      replacements: [
        [/@lacviet-test\.com/g, `@test.${brand.domain}`],
        [/@lacviet\.vn/g, `@${brand.domain}`],
        [/@lacviet\.com/g, `@${brand.domain}`],
        [/@demo\.rtr-mrp\.com/g, `@demo.${brand.domain}`],
        [/@demo\.rtr-hrm\.vn/g, `@demo.${brand.domain}`],
        [/@rtr-mrp\.com/g, `@${brand.domain}`],
        [/@rtr\.com\.vn/g, `@${brand.domain}`],
        [/@rtr\.com/g, `@${brand.domain}`],
        [/@dafc\.com/g, `@${brand.domain}`],
        [/@promomaster\.com/g, `@${brand.domain}`],
        [/@promo-master\.com/g, `@${brand.domain}`],
      ],
    },

    // ─── 6. S3 Buckets & Storage ──────────────────────────
    {
      name: 's3-storage',
      description: 'Thay thế S3 buckets và storage / Replace S3 buckets and storage',
      include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.env*', '**/*.yaml', '**/*.yml'],
      exclude: ['**/node_modules/**', '**/dist/**', 'scripts/rebrand.ts'],
      replacements: [
        [/rtr-mrp-storage/g, `${brand.s3Prefix}-mrp`],
        [/rtr-mrp-mobile/g, `${brand.storagePrefix}-mrp-mobile`],
        [/rtr-mrp-offline/g, `${brand.storagePrefix}-mrp-offline`],
        [/rtr-mrp/g, `${brand.storagePrefix}-mrp`],
        [/promo-master-files/g, `${brand.s3Prefix}-tpm`],
        [/promo-master-auth/g, `${brand.storagePrefix}-tpm-auth`],
        [/promo-master-ui/g, `${brand.storagePrefix}-tpm-ui`],
      ],
    },

    // ─── 7. Docker & K8s Names ────────────────────────────
    {
      name: 'docker-k8s',
      description: 'Thay đổi Docker/K8s names / Replace Docker/K8s names',
      include: ['**/docker-compose*.yml', '**/docker-compose*.yaml', '**/*.yaml', '**/*.yml', '**/Dockerfile*', '**/.github/**'],
      exclude: ['**/node_modules/**'],
      replacements: [
        [/erp-postgres/g, `${brand.storagePrefix}-postgres`],
        [/erp-redis/g, `${brand.storagePrefix}-redis`],
        [/erp-nats/g, `${brand.storagePrefix}-nats`],
        [/erp-keycloak/g, `${brand.storagePrefix}-keycloak`],
        [/erp-kong/g, `${brand.storagePrefix}-kong`],
        [/erp-system/g, brand.k8sNamespace],
        [/promo-master-v2/g, `${brand.storagePrefix}-tpm-web`],
        [/promo-master-api/g, `${brand.storagePrefix}-tpm-api`],
        [/promo-master-db/g, `${brand.storagePrefix}-tpm-db`],
        [/lacviet-hr-db/g, `${brand.storagePrefix}-hrm-db`],
        [/lacviet-hr/g, `${brand.storagePrefix}-hrm`],
      ],
    },

    // ─── 8. Event Prefixes ────────────────────────────────
    {
      name: 'event-prefixes',
      description: 'Thay đổi event prefixes / Replace event stream prefixes',
      include: ['**/events/**/*.ts', '**/src/**/*.ts'],
      exclude: ['**/node_modules/**', '**/dist/**', 'scripts/rebrand.ts'],
      replacements: [
        [/ERP_CUSTOMERS/g, `${brand.eventPrefix.toUpperCase()}_CUSTOMERS`],
        [/ERP_PRODUCTS/g, `${brand.eventPrefix.toUpperCase()}_PRODUCTS`],
        [/ERP_EMPLOYEES/g, `${brand.eventPrefix.toUpperCase()}_EMPLOYEES`],
        [/ERP_ORDERS/g, `${brand.eventPrefix.toUpperCase()}_ORDERS`],
        [/ERP_INVENTORY/g, `${brand.eventPrefix.toUpperCase()}_INVENTORY`],
        [/ERP_PRODUCTION/g, `${brand.eventPrefix.toUpperCase()}_PRODUCTION`],
        [/ERP_INVOICES/g, `${brand.eventPrefix.toUpperCase()}_INVOICES`],
        [/ERP_ACCOUNTING/g, `${brand.eventPrefix.toUpperCase()}_ACCOUNTING`],
        [/ERP_SUPPLIERS/g, `${brand.eventPrefix.toUpperCase()}_SUPPLIERS`],
        [/'erp\./g, `'${brand.eventPrefix}.`],
        [/"erp\./g, `"${brand.eventPrefix}.`],
      ],
    },

    // ─── 9. Copyright & Legal ─────────────────────────────
    {
      name: 'copyright',
      description: 'Thay đổi copyright / Replace copyright notices',
      include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.md', '**/*.html'],
      exclude: ['**/node_modules/**', '**/dist/**', 'scripts/rebrand.ts', '**/LICENSE*'],
      replacements: [
        [/© 2025 DAFC\. All rights reserved\./g, brand.copyright],
        [/© 2026 DAFC\. All rights reserved\./g, brand.copyright],
        [/&copy; 2025 DAFC\. All rights reserved\./g, brand.copyright.replace('©', '&copy;')],
        [/&copy; 2026 DAFC\. All rights reserved\./g, brand.copyright.replace('©', '&copy;')],
        [/DAFC Vietnam © 2025\. All rights reserved\./g, brand.copyright],
        [/DAFC Vietnam © 2025\. Bảo lưu mọi quyền\./g, brand.copyright.replace('All rights reserved', 'Bảo lưu mọi quyền')],
      ],
    },

    // ─── 10. URL/Website References ───────────────────────
    {
      name: 'urls',
      description: 'Thay đổi URLs / Replace website URLs',
      include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.env*', '**/*.md', '**/*.yaml'],
      exclude: ['**/node_modules/**', '**/dist/**', 'scripts/rebrand.ts'],
      replacements: [
        [/www\.rtr-mrp\.com/g, `www.${brand.domain}`],
        [/info@rtr-mrp\.com/g, `info@${brand.domain}`],
        [/api\.promo-master\.com/g, `api.${brand.domain}`],
        [/promo-master-api\.onrender\.com/g, `${brand.storagePrefix}-tpm-api.onrender.com`],
        [/promo-master-v2\.onrender\.com/g, `${brand.storagePrefix}-tpm.onrender.com`],
        [/lacviet-hr\.com/g, brand.domain],
      ],
    },

    // ─── 11. Render.yaml Service Names ────────────────────
    {
      name: 'render-services',
      description: 'Thay đổi Render service names / Replace Render service names',
      include: ['**/render.yaml', '**/render.yml'],
      exclude: ['**/node_modules/**'],
      replacements: [
        [/name: lacviet-hr/g, `name: ${brand.storagePrefix}-hrm`],
        [/name: promo-master-v2/g, `name: ${brand.storagePrefix}-tpm`],
        [/name: promo-master-api/g, `name: ${brand.storagePrefix}-tpm-api`],
      ],
    },
    // ─── 10. Current VietERP brand → new brand ──────────
    // Only active when rebranding AWAY from VietERP (npmScope changed).
    ...(brand.npmScope !== '@vierp'
      ? [
          {
            name: 'vierp-package-scope',
            description: 'Thay @vierp/* scope / Replace @vierp/* npm scope',
            include: ['**/package.json', '**/package-lock.json', '**/*.ts', '**/*.tsx'],
            exclude: ['**/node_modules/**', 'scripts/**', 'AUDIT_REPORT.md', 'docs/adr/**'],
            replacements: [
              ['@vierp/', `${brand.npmScope}/`],
              ['"vierp-', `"${brand.dbPrefix}-`],
              ['vierp_live_', brand.apiKeyPrefix],
            ],
          },
          {
            name: 'vierp-identity',
            description: 'Thay nhận diện VietERP / Replace VietERP identity',
            include: [
              '**/*.md', '**/*.ts', '**/*.tsx', '**/*.json', '**/*.yml', '**/*.yaml',
              '**/.env*', '**/*.example', '**/*.sh', '**/Dockerfile*', 'Makefile',
            ],
            exclude: [
              '**/node_modules/**',
              'scripts/**',
              'AUDIT_REPORT.md',
              'CHANGELOG.md',
              'docs/adr/**',
              'LICENSE',
            ],
            // Lưu ý thứ tự: pattern cụ thể TRƯỚC, 'vierp' thường SAU CÙNG
            replacements: [
              ['VietERP Platform', brand.platformName],
              ['VietERP', brand.platformShortName],
              ['@vierp/', `${brand.npmScope}/`],
              ['vierp_live_', brand.apiKeyPrefix],
              ['vierp-system', brand.k8sNamespace],
              ['vierp-files', brand.s3Prefix],
              ['ghcr.io/nclamvn/', `ghcr.io/${brand.githubOrg}/`],
              ['nclamvn', brand.githubOrg],
              ['vierp', brand.storagePrefix],
            ],
          },
        ]
      : []),
  ];
}

// ─── File System Helpers ────────────────────────────────────

function walkDir(dir: string, fileList: string[] = []): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip excluded directories
      if (['node_modules', 'dist', '.next', '.git', '.turbo', '.cache'].includes(entry.name)) {
        continue;
      }
      walkDir(fullPath, fileList);
    } else {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function matchGlob(filePath: string, pattern: string): boolean {
  // Simple glob matching for common patterns
  const regexStr = pattern
    .replace(/\./g, '\\.')
    .replace(/\*\*/g, '§DOUBLESTAR§')
    .replace(/\*/g, '[^/]*')
    .replace(/§DOUBLESTAR§/g, '.*');
  return new RegExp(regexStr).test(filePath);
}

function shouldProcess(filePath: string, include: string[], exclude: string[]): boolean {
  const matchesInclude = include.some(p => matchGlob(filePath, p));
  const matchesExclude = exclude.some(p => matchGlob(filePath, p));
  return matchesInclude && !matchesExclude;
}

// ─── Main Rebrand Logic ─────────────────────────────────────

interface RebrandResult {
  totalFiles: number;
  modifiedFiles: number;
  totalReplacements: number;
  details: Array<{
    rule: string;
    file: string;
    count: number;
  }>;
  errors: string[];
}

function runRebrand(rootDir: string, brand: BrandValues, dryRun = false): RebrandResult {
  const result: RebrandResult = {
    totalFiles: 0,
    modifiedFiles: 0,
    totalReplacements: 0,
    details: [],
    errors: [],
  };

  const rules = buildRules(brand);
  const allFiles = walkDir(rootDir);
  result.totalFiles = allFiles.length;

  const modifiedSet = new Set<string>();

  for (const rule of rules) {
    console.log(`\n📋 Rule: ${rule.name} — ${rule.description}`);

    for (const filePath of allFiles) {
      const relativePath = path.relative(rootDir, filePath);

      if (!shouldProcess(relativePath, rule.include, rule.exclude)) {
        continue;
      }

      try {
        // Skip binary files
        const ext = path.extname(filePath).toLowerCase();
        if (['.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.woff', '.woff2', '.ttf', '.eot', '.pdf'].includes(ext)) {
          continue;
        }

        let content = fs.readFileSync(filePath, 'utf-8');
        let fileReplacements = 0;
        let newContent = content;

        for (const [search, replace] of rule.replacements) {
          if (typeof search === 'string') {
            const parts = newContent.split(search);
            const count = parts.length - 1;
            if (count > 0) {
              newContent = parts.join(replace);
              fileReplacements += count;
            }
          } else {
            // Regex
            const matches = newContent.match(search);
            const count = matches ? matches.length : 0;
            if (count > 0) {
              newContent = newContent.replace(search, replace);
              fileReplacements += count;
            }
          }
        }

        if (fileReplacements > 0) {
          if (!dryRun) {
            fs.writeFileSync(filePath, newContent, 'utf-8');
          }
          modifiedSet.add(filePath);
          result.totalReplacements += fileReplacements;
          result.details.push({
            rule: rule.name,
            file: relativePath,
            count: fileReplacements,
          });
          console.log(`  ✅ ${relativePath} (${fileReplacements} replacements)`);
        }
      } catch (err: any) {
        result.errors.push(`${filePath}: ${err.message}`);
      }
    }
  }

  result.modifiedFiles = modifiedSet.size;
  return result;
}

// ─── CLI Entry Point ────────────────────────────────────────

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const rootDir = process.env.REBRAND_ROOT
    ? path.resolve(process.env.REBRAND_ROOT)
    : path.resolve(__dirname, '..');

  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║    VietERP Platform — Automated Rebrand Tool    ║');
  console.log('║    Công cụ tái thương hiệu tự động              ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log();

  if (dryRun) {
    console.log('🔍 DRY RUN MODE — Không thay đổi file / No files will be modified\n');
  }

  // Load brand values (default or from env/config)
  const brand = { ...DEFAULT_BRAND };

  // Allow env overrides
  if (process.env.BRAND_NAME) brand.platformName = process.env.BRAND_NAME;
  if (process.env.BRAND_SHORT) brand.platformShortName = process.env.BRAND_SHORT;
  if (process.env.BRAND_DOMAIN) brand.domain = process.env.BRAND_DOMAIN;
  if (process.env.BRAND_COMPANY) brand.companyName = process.env.BRAND_COMPANY;
  if (process.env.BRAND_NPM_SCOPE) brand.npmScope = process.env.BRAND_NPM_SCOPE;
  if (process.env.BRAND_S3_PREFIX) brand.s3Prefix = process.env.BRAND_S3_PREFIX;
  if (process.env.BRAND_STORAGE_PREFIX) brand.storagePrefix = process.env.BRAND_STORAGE_PREFIX;
  if (process.env.BRAND_K8S_NS) brand.k8sNamespace = process.env.BRAND_K8S_NS;
  if (process.env.BRAND_EVENT_PREFIX) brand.eventPrefix = process.env.BRAND_EVENT_PREFIX;
  if (process.env.BRAND_GITHUB_ORG) brand.githubOrg = process.env.BRAND_GITHUB_ORG;
  if (process.env.BRAND_API_KEY_PREFIX) brand.apiKeyPrefix = process.env.BRAND_API_KEY_PREFIX;
  if (process.env.BRAND_DB_PREFIX) brand.dbPrefix = process.env.BRAND_DB_PREFIX;
  if (process.env.BRAND_SUPPORT_EMAIL) brand.supportEmail = process.env.BRAND_SUPPORT_EMAIL;
  if (brand.supportEmail.includes('your-domain.com')) {
    brand.supportEmail = brand.supportEmail.replace('your-domain.com', brand.domain);
    brand.noReplyEmail = `noreply@${brand.domain}`;
  }

  console.log('📦 Brand Configuration:');
  console.log(`   Platform:  ${brand.platformName} (${brand.platformShortName})`);
  console.log(`   Company:   ${brand.companyName}`);
  console.log(`   Domain:    ${brand.domain}`);
  console.log(`   NPM Scope: ${brand.npmScope}`);
  console.log(`   S3 Prefix: ${brand.s3Prefix}`);
  console.log(`   K8s NS:    ${brand.k8sNamespace}`);
  console.log();

  const result = runRebrand(rootDir, brand, dryRun);

  // ─── Summary ──────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║                 REBRAND SUMMARY                 ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  Total files scanned:     ${String(result.totalFiles).padStart(6)}              ║`);
  console.log(`║  Files modified:          ${String(result.modifiedFiles).padStart(6)}              ║`);
  console.log(`║  Total replacements:      ${String(result.totalReplacements).padStart(6)}              ║`);
  if (result.errors.length > 0) {
    console.log(`║  Errors:                  ${String(result.errors.length).padStart(6)}              ║`);
  }
  console.log('╚══════════════════════════════════════════════════╝');

  if (result.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    for (const err of result.errors) {
      console.log(`   ${err}`);
    }
  }

  // ─── Write report ─────────────────────────────────────
  const reportPath = path.join(rootDir, 'rebrand-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2), 'utf-8');
  console.log(`\n📄 Report saved: ${reportPath}`);

  if (dryRun) {
    console.log('\n💡 Chạy lại không có --dry-run để thực hiện / Run again without --dry-run to apply changes');
  } else {
    console.log('\n✅ Rebrand hoàn tất! / Rebrand complete!');
    console.log('   Chạy "turbo build" để rebuild / Run "turbo build" to rebuild');
  }
}

main();
