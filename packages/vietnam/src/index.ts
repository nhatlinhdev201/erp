/**
 * @linkk/vietnam - Vietnamese Market Features for L-ERP
 * Version 1.0.0
 *
 * Comprehensive Vietnamese compliance and market-specific functionality:
 * - Tax calculations: VAT (TT200), PIT (Mẫu 05/KK-TNCN), CIT (Mẫu 03/TNDN)
 * - E-Invoice: NĐ123/2020/NĐ-CP compliance with provider integration
 * - Insurance: BHXH, BHYT, BHTN, maternity, sick leave benefits
 * - Banking: VietQR, bank directory, transfers
 * - Utilities: VNĐ formatting, Vietnamese dates, lunar calendar
 */

// Types and Enums
export * from "./types/index.js";

// Tax Modules
export * from "./tax/index.js";

// E-Invoice Module
export * from "./einvoice/index.js";

// Insurance Module
export * from "./insurance/index.js";

// Banking Module
export * from "./banking/index.js";

// Utilities
export * from "./utils/index.js";

// Namespace imports
import * as types from "./types/index.js";
import * as tax from "./tax/index.js";
import * as einvoice from "./einvoice/index.js";
import * as insurance from "./insurance/index.js";
import * as banking from "./banking/index.js";
import * as utils from "./utils/index.js";

/**
 * Main export
 */
export default {
  version: "1.0.0",
  types,
  tax,
  einvoice,
  insurance,
  banking,
  utils,
};

/**
 * Quick reference exports for common operations
 */
export const L-ERP = {
  // Tax calculations
  tax: (tax as any).default ?? tax,

  // E-Invoicing
  einvoice: (einvoice as any).default ?? einvoice,

  // Insurance
  insurance: (insurance as any).default ?? insurance,

  // Banking
  banking: (banking as any).default ?? banking,

  // Utilities
  utils: (utils as any).default ?? utils,
};
