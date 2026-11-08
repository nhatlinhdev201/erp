// ══════════════════════════════════════════════════════════════════════════════
//                    💰 FINANCE MODULE - TYPE DEFINITIONS
//                         File: types/finance.ts
// ══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// ENUMS
// ═══════════════════════════════════════════════════════════════════════════════

export enum AccrualStatus {
  PENDING = 'PENDING',
  CALCULATED = 'CALCULATED',
  POSTED = 'POSTED',
  REVERSED = 'REVERSED',
}

export enum DeductionStatus {
  OPEN = 'OPEN',
  MATCHED = 'MATCHED',
  DISPUTED = 'DISPUTED',
  RESOLVED = 'RESOLVED',
  WRITTEN_OFF = 'WRITTEN_OFF',
}

export enum GLStatus {
  PENDING = 'PENDING',
  POSTED = 'POSTED',
  REVERSED = 'REVERSED',
}

export enum ChequeStatus {
  ISSUED = 'ISSUED',
  CLEARED = 'CLEARED',
  BOUNCED = 'BOUNCED',
  VOIDED = 'VOIDED',
  EXPIRED = 'EXPIRED',
}

export type CalculationMethod = 'PERCENTAGE' | 'PRO_RATA';
export type DisputeResolution = 'ACCEPT' | 'REJECT' | 'PARTIAL';

// ═══════════════════════════════════════════════════════════════════════════════
// ACCRUAL TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface AccrualEntry {
  id: string;
  promotionId: string;
  promotion?: Promotion;
  period: string;
  amount: number;
  status: AccrualStatus;
  postedToGL: boolean;
  glJournalId?: string;
  glJournal?: GLJournal;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdById: string;
  createdBy?: User;
}

export interface AccrualListParams {
  period?: string;
  status?: AccrualStatus;
  promotionId?: string;
  page?: number;
  pageSize?: number;
}

export interface AccrualListResponse {
  success: boolean;
  data: AccrualEntry[];
  pagination: Pagination;
  summary: AccrualSummary;
}

export interface AccrualSummary {
  totalAmount: number;
  pendingAmount: number;
  postedAmount: number;
  currentPeriodAmount: number;
  entryCount: number;
}

export interface CalculateAccrualsRequest {
  period: string;
  method: CalculationMethod;
  promotionIds?: string[];
}

export interface CalculateAccrualsResponse {
  success: boolean;
  data: {
    calculated: number;
    totalAmount: number;
    entries: AccrualEntry[];
  };
}

export interface PostAccrualRequest {
  glAccountDebit: string;
  glAccountCredit: string;
}

export interface PostBatchRequest {
  accrualIds: string[];
  glAccountDebit: string;
  glAccountCredit: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// DEDUCTION TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Deduction {
  id: string;
  code: string;
  customerId: string;
  customer?: Customer;
  invoiceNumber: string;
  invoiceDate: Date;
  amount: number;
  reason?: string;
  status: DeductionStatus;
  matchedClaimId?: string;
  matchedClaim?: Claim;
  disputeReason?: string;
  disputedAt?: Date;
  resolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface DeductionListParams {
  status?: DeductionStatus;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface DeductionListResponse {
  success: boolean;
  data: Deduction[];
  pagination: Pagination;
  summary: DeductionSummary;
}

export interface DeductionSummary {
  totalOpen: number;
  totalMatched: number;
  totalDisputed: number;
  openAmount: number;
  matchedAmount: number;
}

export interface CreateDeductionRequest {
  customerId: string;
  invoiceNumber: string;
  invoiceDate: string;
  amount: number;
  reason?: string;
}

export interface MatchDeductionRequest {
  claimId: string;
}

export interface DisputeDeductionRequest {
  reason: string;
}

export interface ResolveDeductionRequest {
  resolution: DisputeResolution;
  amount?: number;
  notes?: string;
}

export interface MatchingSuggestion {
  claimId: string;
  claim: Claim;
  confidence: number;
  matchReasons: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// GL JOURNAL TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface GLJournal {
  id: string;
  entryNumber: string;
  entryDate: Date;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  reference?: string;
  sourceType: 'ACCRUAL' | 'CLAIM' | 'DEDUCTION' | 'MANUAL';
  sourceId?: string;
  status: GLStatus;
  postedAt?: Date;
  postedById?: string;
  reversedAt?: Date;
  reversalId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GLJournalListParams {
  status?: GLStatus;
  sourceType?: string;
  dateFrom?: string;
  dateTo?: string;
  account?: string;
  page?: number;
  pageSize?: number;
}

export interface GLJournalListResponse {
  success: boolean;
  data: GLJournal[];
  pagination: Pagination;
  totals: Record<string, number>; // Account code -> total
}

export interface CreateGLJournalRequest {
  entryDate: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  reference?: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHEQUEBOOK TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ChequebookEntry {
  id: string;
  chequeNumber: string;
  payeeId: string;
  payee?: Customer;
  amount: number;
  issueDate: Date;
  dueDate: Date;
  status: ChequeStatus;
  clearedAt?: Date;
  voidedAt?: Date;
  voidReason?: string;
  claimId?: string;
  claim?: Claim;
  bankAccount?: string;
  memo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChequeListParams {
  status?: ChequeStatus;
  payeeId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface ChequeListResponse {
  success: boolean;
  data: ChequebookEntry[];
  pagination: Pagination;
  summary: ChequeSummary;
}

export interface ChequeSummary {
  issued: number;
  cleared: number;
  outstanding: number;
  outstandingAmount: number;
  thisMonth: number;
}

export interface IssueChequeRequest {
  payeeId: string;
  amount: number;
  dueDate: string;
  claimId?: string;
  bankAccount?: string;
  memo?: string;
}

export interface VoidChequeRequest {
  reason: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SHARED TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Import from shared types
import type { Promotion, Customer, Claim, User } from '@linkk/tpm-shared';

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

export const GL_ACCOUNTS = {
  // Assets
  CASH: '1000',
  ACCOUNTS_RECEIVABLE: '1100',
  
  // Liabilities
  ACCOUNTS_PAYABLE: '2000',
  ACCRUED_LIABILITIES: '2100',
  
  // Expenses
  PROMOTION_EXPENSE: '6100',
  TRADE_SPEND: '6200',
  REBATE_EXPENSE: '6300',
} as const;

export const ACCRUAL_STATUS_LABELS: Record<AccrualStatus, string> = {
  [AccrualStatus.PENDING]: 'Pending',
  [AccrualStatus.CALCULATED]: 'Calculated',
  [AccrualStatus.POSTED]: 'Posted',
  [AccrualStatus.REVERSED]: 'Reversed',
};

export const DEDUCTION_STATUS_LABELS: Record<DeductionStatus, string> = {
  [DeductionStatus.OPEN]: 'Open',
  [DeductionStatus.MATCHED]: 'Matched',
  [DeductionStatus.DISPUTED]: 'Disputed',
  [DeductionStatus.RESOLVED]: 'Resolved',
  [DeductionStatus.WRITTEN_OFF]: 'Written Off',
};

export const CHEQUE_STATUS_LABELS: Record<ChequeStatus, string> = {
  [ChequeStatus.ISSUED]: 'Issued',
  [ChequeStatus.CLEARED]: 'Cleared',
  [ChequeStatus.BOUNCED]: 'Bounced',
  [ChequeStatus.VOIDED]: 'Voided',
  [ChequeStatus.EXPIRED]: 'Expired',
};
