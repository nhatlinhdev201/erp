# @linkk/vietnam

Vietnamese Market Features for L-ERP - Compliance with TT200, NĐ123, Insurance and Banking Regulations

## Overview

`@linkk/vietnam` is a comprehensive TypeScript package providing Vietnamese enterprise compliance features for the L-ERP monorepo. It implements strict requirements for Vietnamese regulatory standards including tax declarations, e-invoicing, insurance calculations, and banking integrations.

**Version:** 1.0.0

## Features

### 1. Tax Calculations (Thuế)

#### VAT - Nghị định 44/2023/NĐ-CP

```typescript
import { calculateVAT, VATRate } from '@linkk/vietnam/tax';

// Calculate VAT amount
const vat = calculateVAT(1_000_000, VATRate.STANDARD); // 100,000 ₫

// VAT rates: 0% (ZERO), 5% (REDUCED), 8% (SPECIAL), 10% (STANDARD)
```

**Features:**
- Support for 4 VAT rates per current regulations
- Category-based VAT rate lookup
- VAT exemption checking (education, healthcare, agriculture, export)
- Line item and aggregate VAT calculations
- VAT declaration form generation (Mẫu 01/GTGT)

#### PIT - Personal Income Tax (Mẫu 05/KK-TNCN)

```typescript
import { calculatePIT, calculatePITDetailed } from '@linkk/vietnam/tax';

// Calculate monthly PIT
const pit = calculatePIT(50_000_000, 2); // 2 dependents

// Detailed breakdown
const detail = calculatePITDetailed(50_000_000, 2);
// Returns: grossIncome, deductions, taxableIncome, pitTax, netIncome, taxRate
```

**Features:**
- Progressive tax brackets (5-35%)
- Personal deduction: 11,000,000 ₫/month
- Dependent deduction: 4,400,000 ₫/person/month
- Effective and marginal tax rate calculation
- Annual PIT calculation

#### CIT - Corporate Income Tax (Mẫu 03/TNDN)

```typescript
import { calculateCIT, CompanySize, PrefTaxZone } from '@linkk/vietnam/tax';

// Standard rate: 20%
const cit = calculateCIT(100_000_000);

// SME preferential rate: 10%
const smeCIT = calculateCIT(100_000_000, CompanySize.SMALL);

// Special zone rate: 5%
const zoneCIT = calculateCIT(100_000_000, CompanySize.LARGE, PrefTaxZone.TECH_PARK);
```

**Features:**
- Standard rate: 20%
- SME preferential rate: 10%
- Tech/startup rate: 5%
- Special economic zone rates (5-10%)
- Tax incentive calculations
- Deferred tax liability

### 2. E-Invoice - Nghị định 123/2020/NĐ-CP

```typescript
import { generateEInvoice, validateEInvoice } from '@linkk/vietnam/einvoice';
import { EInvoiceProvider } from '@linkk/vietnam/types';

// Create e-invoice
const invoice = {
  invoiceNumber: "KD/2024/0001",
  series: "KD",
  date: new Date(),
  seller: { name: "ABC Company", address: "Ho Chi Minh" },
  buyer: { name: "XYZ Company", address: "Ha Noi" },
  items: [{
    description: "Service",
    quantity: 1,
    unitPrice: 1_000_000,
    unit: "cái",
    vatRate: VATRate.STANDARD,
    amount: 1_000_000,
    vatAmount: 100_000,
    totalAmount: 1_100_000
  }],
  totalBeforeVAT: 1_000_000,
  totalVAT: 100_000,
  totalAfterVAT: 1_100_000,
  paymentMethod: PaymentMethod.TRANSFER,
  currencyCode: "VND",
  status: EInvoiceStatus.DRAFT
};

// Validate
const validation = validateEInvoice(invoice);

// Generate XML
const xml = generateEInvoiceXML(invoice);

// Submit via provider
const provider = new VNPTProvider(apiKey, apiSecret);
const transmission = await provider.issue(invoice);
```

**Providers:**
- VNPT (Vietnam Post and Telecommunications)
- Viettel (Viettel Telecom)
- FPT (FPT Telecom)
- BKAV (Bảo Kim)

### 3. Insurance - Bảo Hiểm Xã Hội

#### BHXH/BHYT/BHTN - Social, Health, Unemployment

```typescript
import { calculateTotalInsurance, calculateNetSalary } from '@linkk/vietnam/insurance';

// Calculate all insurance contributions
const insurance = calculateTotalInsurance(20_000_000);
// Returns: BHXH (8%), BHYT (1.5%), BHTN (1%)
// Both employee and employer portions

// Calculate net salary after deductions
const net = calculateNetSalary(20_000_000);
```

**Rates:**
- BHXH (Social): 8% employee, 17.5% employer
- BHYT (Health): 1.5% employee, 3% employer
- BHTN (Unemployment): 1% employee, 1% employer
- Salary cap: 36,000,000 ₫ (20x minimum wage)

#### Maternity & Sick Leave Benefits

```typescript
import { calculateMaternityBenefit, calculateSickLeaveBenefit } from '@linkk/vietnam/insurance';

// Maternity benefit
const maternity = calculateMaternityBenefit(20_000_000, 4); // 4 months

// Sick leave benefit (based on years of contribution)
const sickLeave = calculateSickLeaveBenefit(666_667, 5, 3); // 3 years contributed
```

### 4. Banking - Ngân Hàng

#### VietQR Code Generation

```typescript
import { generateVietQR, parseVietQR } from '@linkk/vietnam/banking';
import { BankCode } from '@linkk/vietnam/types';

// Generate VietQR
const qr = generateVietQR(BankCode.VCB, "1234567890", 1_000_000, "Payment for invoice");

// Parse VietQR
const parsed = parseVietQR(qr);
```

**Supported Banks (20+):**
- VCB (Vietcombank)
- BIDV
- TCB (Techcombank)
- MB (MB Bank)
- VPB (VPBank)
- ACB, SHB, TPBank, HDBank, Sacombank, Exim Bank, Military Bank, VIB, SeABank, OCB, VRB, Nam Á, BVBANK, PGB, Bắc Á

### 5. Utilities

#### Currency Formatting

```typescript
import { formatVND, numberToWordsVN, parseVND } from '@linkk/vietnam/utils';

// Format currency
formatVND(1_234_567); // "1.234.567 ₫"

// Convert to words
numberToWordsVN(1_234_567); // "Một triệu hai trăm ba mươi bốn nghìn..."

// Parse formatted string
parseVND("1.234.567 ₫"); // 1234567
```

#### Date Utilities

```typescript
import { formatDateVN, parseVNDate, isVietnamHoliday } from '@linkk/vietnam/utils';

// Vietnamese date formatting
formatDateVN(new Date()); // "ngày 15 tháng 04 năm 2024"

// Parse Vietnamese dates
parseVNDate("ngày 15 tháng 04 năm 2024");

// Check if holiday
isVietnamHoliday(new Date()); // true/false

// Business days calculation
calculateBusinessDays(start, end); // Excludes weekends and holidays
```

## Regulatory References

### Tax Regulations
- **TT200**: Chart of Accounts for Accounting Standards (TT200/2014/TT-BCT)
- **ND44**: Decree 44/2023/NĐ-CP on VAT rates
- **PIT Brackets**: Per Luật Thuế thu nhập cá nhân
- **CIT Rates**: Per Luật Thuế thu nhập doanh nghiệp

### E-Invoice
- **NĐ123**: Decree 123/2020/NĐ-CP on e-invoice regulations
- **Tổng cục Thuế**: General Department of Taxation requirements
- **Form Codes**: 01/GTGT (VAT), 05/KK-TNCN (PIT), 03/TNDN (CIT)

### Insurance
- **Luật BHXH 2014**: Social Insurance Law 2014
- **BHXH Contribution**: Employee 8%, Employer 17.5%
- **BHYT Contribution**: Employee 1.5%, Employer 3%
- **Maternity Leave**: Per Luật Lao động

### Banking
- **VietQR**: NAPAS standard for QR payments
- **BIN Codes**: Bank Identification Numbers for VietQR
- **Transfer Standards**: Vietnamese banking protocols

## TypeScript Support

All modules are written in strict TypeScript with:
- ✅ `strict: true`
- ✅ No `any` types
- ✅ Full type safety
- ✅ Comprehensive interfaces
- ✅ Self-documenting API

## Zero Dependencies

The package contains **zero external dependencies**, using only TypeScript standard library.

## Vietnamese Text Standards

All Vietnamese text follows proper standards:
- ✅ Perfect diacritics (dấu)
- ✅ Proper tone marks (thanh dấu)
- ✅ Correct terminology (thuế, bảo hiểm, etc.)
- ✅ Regulatory naming conventions

## Example Usage

```typescript
import {
  calculateVAT,
  calculatePIT,
  calculateCIT,
  generateEInvoiceXML,
  calculateTotalInsurance,
  generateVietQR,
  formatVND,
  formatDateVN,
} from '@linkk/vietnam';

// Tax calculations
const vat = calculateVAT(10_000_000, VATRate.STANDARD);
const pit = calculatePIT(50_000_000, 1);
const cit = calculateCIT(500_000_000, CompanySize.MEDIUM);

// Insurance
const insurance = calculateTotalInsurance(25_000_000);

// Banking
const qr = generateVietQR(BankCode.VCB, "1234567890", 5_000_000);

// Formatting
console.log(formatVND(vat)); // "1.000.000 ₫"
console.log(formatDateVN(new Date())); // "ngày 15 tháng 04 năm 2024"
```

## Module Structure

```
packages/vietnam/
├── src/
│   ├── types/               # Core type definitions
│   ├── tax/                 # VAT, PIT, CIT calculations
│   ├── einvoice/            # E-invoice generation and providers
│   ├── insurance/           # BHXH, BHYT, BHTN, maternity
│   ├── banking/             # VietQR, bank directory
│   ├── utils/               # Currency and date utilities
│   └── index.ts             # Main exports
├── tsconfig.json
├── package.json
└── README.md
```

## API Documentation

See individual module documentation:
- `tax/`: Tax calculations and declarations
- `einvoice/`: E-invoice generation and validation
- `insurance/`: Insurance contributions and benefits
- `banking/`: Bank operations and VietQR
- `utils/`: Currency and date formatting

## License

Proprietary - L-ERP Project

## Support

For questions or regulatory updates, consult:
- Tổng cục Thuế (General Department of Taxation)
- Bộ Lao động, Thương binh và Xã hội (Ministry of Labor)
- VNPT/Viettel/FPT e-invoice documentation
