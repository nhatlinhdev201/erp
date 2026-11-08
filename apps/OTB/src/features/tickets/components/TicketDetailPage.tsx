'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp, Package, ArrowLeft, Loader2, Check, X, Clock, Send, CheckCircle, XCircle, LayoutGrid, List, GitCompare, RotateCcw, ExternalLink, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils';
import { ProductImage, ConfirmDialog } from '@/components/ui';
import { budgetService, planningService, proposalService } from '@/services';
import { invalidateCache } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';

/* =========================
   L-ERP DESIGN SYSTEM COLORS
========================= */

// Chart colors: REX = Champagne Gold, TTP = Forest Green

/* =========================
   EMPTY FALLBACK DATA
========================= */

const EMPTY_BUDGET_DATA = {
  id: '',
  fiscalYear: '-',
  groupBrand: '-',
  brandName: '-',
  totalBudget: 0,
  budgetName: '-',
  status: 'DRAFT'};

const EMPTY_SEASON_DATA = {
  seasonGroup: '-',
  Season: '-',
  rex: 0,
  ttp: 0,
  finalVersion: 0};

/* =========================
   GROUPED BAR CHARTS
========================= */


/* =========================
   SKU CARD (with sizing)
========================= */

/* =========================
   PREMIUM SKU CARD
========================= */

const PremiumSKUCard = ({ item, block, prevItem }: { item: any; block: any; prevItem?: any }) => {
  const [flipped, setFlipped] = useState(false);
  const totalQty = (item.rex || 0) + (item.ttp || 0);
  const totalValue = totalQty * (item.srp || 0);

  // Diff helpers
  const hasDiff = (field: string) => prevItem && prevItem[field] !== undefined && prevItem[field] !== item[field];
  const diffDelta = (field: string) => {
    if (!prevItem) return null;
    const curr = Number(item[field]) || 0;
    const prev = Number(prevItem[field]) || 0;
    if (curr === prev) return null;
    const d = curr - prev;
    return <span className={`text-[9px] font-['JetBrains_Mono'] ml-0.5 ${d > 0 ? 'text-[#2A9E6A]' : 'text-[#F85149]'}`}>{d > 0 ? `+${d}` : d}</span>;
  };
  const diffBorder = (field: string) => {
    if (!prevItem) return '';
    const curr = Number(item[field]) || 0;
    const prev = Number(prevItem[field]) || 0;
    if (curr === prev) return '';
    return curr > prev ? 'ring-2 ring-[#2A9E6A]/40' : 'ring-2 ring-[#F85149]/40';
  };

  // Cost & margin calculations
  const unitCost = item.unitCost || (item.srp ? item.srp * 0.45 : 0);
  const marginPct = item.srp ? ((item.srp - unitCost) / item.srp * 100) : 0;
  const markup = unitCost > 0 ? (item.srp / unitCost) : 0;

  // Store allocation bars
  const storeAllocations = [
    { name: 'REX', qty: item.rex || 0, color: '#D7B797' },
    { name: 'TTP', qty: item.ttp || 0, color: '#127749' },
  ];
  const maxStoreQty = Math.max(...storeAllocations.map(s => s.qty), 1);

  const flipBtn = (
    <button
      onClick={(e) => { e.stopPropagation(); setFlipped(!flipped); }}
      className={`absolute top-3 left-3 z-[5] w-7 h-7 rounded-full flex items-center justify-center transition-colors duration-200 ${'bg-[rgba(160,120,75,0.1)] hover:bg-[rgba(160,120,75,0.2)] text-[#6B4D30]'}`}
      title={flipped ? 'Show front' : 'Show details'}
    >
      <RotateCcw size={13} strokeWidth={2.5} />
    </button>
  );

  return (
    <div
      className="flex-shrink-0 w-[280px] snap-start"
    >
      <div
        className="relative w-full"
      >
        {/* ===== FRONT FACE ===== */}
        <div
          className={`group/card relative w-full rounded-2xl border overflow-hidden ${'bg-white border-[rgba(160,120,75,0.2)]'}`}
          style={{ display: flipped ? 'none' : 'block' }}
        >
          {flipBtn}
          {/* New item badge */}
          {prevItem !== undefined && !prevItem && (
            <span className="absolute top-3 right-14 z-[5] px-2 py-0.5 text-[9px] font-bold rounded-full bg-[#2A9E6A] text-white">NEW</span>
          )}
          {/* Gold accent line */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#D7B797] to-transparent" />

          {/* Image area */}
          <div className={`relative h-[200px] flex items-center justify-center overflow-hidden ${'bg-[#FAFAF5]'}`}>
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                backgroundSize: '12px 12px'}}
            />
            <div className="relative z-[1]">
              <ProductImage subCategory={block.subCategory || ''} sku={item.sku || ''} size={140} rounded="rounded-xl" />
            </div>
            <span className={`absolute top-3 right-3 px-2.5 py-1 text-[10px] font-semibold rounded-full z-[2] font-['Montserrat'] tracking-wide ${'bg-[rgba(160,120,75,0.1)] text-[#6B4D30] border border-[rgba(160,120,75,0.25)]'}`}>
              {item.color || '-'}
            </span>
          </div>

          {/* Content */}
          <div className="px-5 pt-4 pb-5">
            <div className={`text-xs font-['JetBrains_Mono'] tracking-wider ${'text-[#6B4D30]'}`}>{item.sku}</div>
            <div className={`text-base font-bold font-['Montserrat'] mt-1 leading-snug ${'text-gray-800'}`}>{item.name}</div>
            <div className={`text-xs mt-0.5 ${'text-gray-400'}`}>
              {item.theme || '-'}
            </div>

            <div className={`my-3 h-px bg-gradient-to-r ${'from-transparent via-[rgba(160,120,75,0.2)] to-transparent'}`} />

            <div className={`text-[10px] uppercase tracking-wider font-semibold ${'text-gray-400'}`}>SRP</div>
            <div className={`text-xl font-bold font-['JetBrains_Mono'] mt-0.5 ${'text-gray-800'}`}>
              {formatCurrency(item.srp || 0)}
            </div>

            {/* Store pills */}
            <div className="flex gap-2 mt-3">
              <div className={`flex-1 rounded-xl px-3 py-2 text-center ${diffBorder('rex')} ${'bg-[rgba(160,120,75,0.06)] border border-[rgba(160,120,75,0.15)]'}`}>
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#D7B797]" />
                  <span className={`text-[10px] font-semibold tracking-wide ${'text-[#6B4D30]'}`}>REX</span>
                </div>
                <div className={`text-lg font-bold font-['JetBrains_Mono'] ${'text-gray-800'}`}>{item.rex || 0}{diffDelta('rex')}</div>
              </div>
              <div className={`flex-1 rounded-xl px-3 py-2 text-center ${diffBorder('ttp')} ${'bg-[rgba(18,119,73,0.04)] border border-[rgba(18,119,73,0.15)]'}`}>
                <div className="flex items-center justify-center gap-1.5 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-[#127749]" />
                  <span className="text-[10px] font-semibold tracking-wide text-[#127749]">TTP</span>
                </div>
                <div className={`text-lg font-bold font-['JetBrains_Mono'] ${'text-gray-800'}`}>{item.ttp || 0}{diffDelta('ttp')}</div>
              </div>
            </div>

            {/* Summary bar */}
            <div className={`mt-3 rounded-lg px-3 py-2 flex items-center justify-between ${diffBorder('order')} ${'bg-[rgba(160,120,75,0.04)] border border-[rgba(160,120,75,0.1)]'}`}>
              <div>
                <span className={`text-[9px] uppercase tracking-wider ${'text-gray-400'}`}>Total Qty</span>
                <div className={`text-sm font-bold font-['JetBrains_Mono'] ${'text-gray-800'}`}>{totalQty}{diffDelta('order')}</div>
              </div>
              <div className={`w-px h-6 ${'bg-gray-200'}`} />
              <div className="text-right">
                <span className={`text-[9px] uppercase tracking-wider ${'text-gray-400'}`}>Value</span>
                <div className={`text-sm font-bold font-['JetBrains_Mono'] ${'text-[#127749]'}`}>{formatCurrency(totalValue)}{diffDelta('ttlValue')}</div>
              </div>
            </div>

            {/* Footer */}
            <div className={`mt-3 space-y-1 text-[10px] ${'text-gray-400'}`}>
              {item.composition && (
                <div className="truncate"><span className="font-semibold">Fabric:</span> {item.composition}</div>
              )}
              {item.sizing?.sizes && (
                <div className="truncate"><span className="font-semibold">Sizes:</span> {item.sizing.sizes.join(' / ')}</div>
              )}
            </div>
          </div>
        </div>

        {/* ===== BACK FACE ===== */}
        <div
          className={`w-full rounded-2xl border overflow-hidden overflow-y-auto ${'bg-white border-[rgba(160,120,75,0.2)]'}`}
          style={{ display: flipped ? 'block' : 'none' }}
        >
          {/* Gold accent line */}
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#D7B797] to-transparent" />

          <div className="px-4 pt-3 pb-4">
            {/* Header with flip-back button */}
            <div className="flex items-start gap-2 mb-3">
              <button
                onClick={(e) => { e.stopPropagation(); setFlipped(false); }}
                className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${'bg-[rgba(160,120,75,0.1)] hover:bg-[rgba(160,120,75,0.2)] text-[#6B4D30]'}`}
              >
                <RotateCcw size={13} strokeWidth={2.5} />
              </button>
              <div className="min-w-0">
                <div className={`text-xs font-['JetBrains_Mono'] tracking-wider ${'text-[#6B4D30]'}`}>{item.sku}</div>
                <div className={`text-sm font-bold font-['Montserrat'] leading-snug truncate ${'text-gray-800'}`}>{item.name}</div>
              </div>
            </div>

            {/* ── COST & MARGIN ── */}
            <div className={`text-[9px] uppercase tracking-[0.15em] font-semibold mb-2 ${'text-[#6B4D30]'}`}>Cost & Margin</div>
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {[
                { label: 'Unit Cost', value: formatCurrency(unitCost) },
                { label: 'Margin', value: `${marginPct.toFixed(1)}%` },
                { label: 'Markup', value: `${markup.toFixed(2)}x` },
              ].map(({ label, value }) => (
                <div key={label} className={`rounded-lg px-2 py-1.5 text-center ${'bg-[rgba(160,120,75,0.04)] border border-[rgba(160,120,75,0.1)]'}`}>
                  <div className={`text-[8px] uppercase tracking-wider font-semibold ${'text-gray-400'}`}>{label}</div>
                  <div className={`text-xs font-bold font-['JetBrains_Mono'] mt-0.5 ${
                    label === 'Margin' ? (marginPct >= 50 ? 'text-[#2A9E6A]' :'text-gray-800') :'text-gray-800'}`}>{value}</div>
                </div>
              ))}
            </div>

            {/* ── STORE ALLOCATION ── */}
            <div className={`text-[9px] uppercase tracking-[0.15em] font-semibold mb-2 ${'text-[#6B4D30]'}`}>Store Allocation</div>
            <div className="space-y-1.5 mb-3">
              {storeAllocations.map(store => {
                const pct = totalQty > 0 ? Math.round(store.qty / totalQty * 100) : 0;
                const barWidth = Math.round(store.qty / maxStoreQty * 100);
                return (
                  <div key={store.name} className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold w-8 font-['JetBrains_Mono'] ${'text-gray-500'}`}>{store.name}</span>
                    <div className={`flex-1 h-3 rounded-full overflow-hidden ${'bg-gray-100'}`}>
                      <div
                        className="h-full rounded-full transition-all duration-200"
                        style={{ width: `${barWidth}%`, backgroundColor: store.color, opacity: 0.7 }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold font-['JetBrains_Mono'] w-6 text-right ${'text-gray-800'}`}>{store.qty}</span>
                    <span className={`text-[9px] w-8 text-right ${'text-gray-400'}`}>{pct}%</span>
                  </div>
                );
              })}
            </div>

            {/* ── SIZE BREAKDOWN ── */}
            {item.sizing?.sizes && item.sizing.sizes.length > 0 && (
              <>
                <div className={`text-[9px] uppercase tracking-[0.15em] font-semibold mb-2 ${'text-[#6B4D30]'}`}>Size Breakdown</div>
                <div className={`rounded-lg overflow-hidden mb-3 ${'border border-gray-200'}`}>
                  <table className="w-full text-[9px]">
                    <thead>
                      <tr className={'bg-gray-50'}>
                        <th className={`px-1.5 py-1 text-left font-semibold ${'text-gray-400'}`} />
                        {item.sizing.sizes.map((s: string) => (
                          <th key={s} className={`px-1 py-1 text-center font-bold font-['JetBrains_Mono'] ${'text-[#6B4D30]'}`}>{s}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {item.sizing.salesMix && (
                        <tr className={'border-t border-gray-100'}>
                          <td className={`px-1.5 py-1 font-semibold ${'text-gray-500'}`}>Mix%</td>
                          {item.sizing.salesMix.map((v: number, i: number) => (
                            <td key={i} className={`px-1 py-1 text-center font-['JetBrains_Mono'] ${'text-gray-700'}`}>{v}</td>
                          ))}
                        </tr>
                      )}
                      {item.sizing.sellThrough && (
                        <tr className={'border-t border-gray-100'}>
                          <td className={`px-1.5 py-1 font-semibold ${'text-gray-500'}`}>ST%</td>
                          {item.sizing.sellThrough.map((v: number, i: number) => (
                            <td key={i} className={`px-1 py-1 text-center font-['JetBrains_Mono'] ${
                              v >= 60 ? 'text-[#2A9E6A] font-bold' :
                              v < 40 ? ('text-red-500') :'text-gray-700'}`}>{v}</td>
                          ))}
                        </tr>
                      )}
                      {item.sizing.finalChoice && (
                        <tr className={'border-t border-gray-100'}>
                          <td className={`px-1.5 py-1 font-semibold ${'text-gray-500'}`}>Qty</td>
                          {item.sizing.finalChoice.map((v: number, i: number) => (
                            <td key={i} className={`px-1 py-1 text-center font-bold font-['JetBrains_Mono'] ${'text-gray-800'}`}>{v}</td>
                          ))}
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ── PRODUCT INFO ── */}
            <div className={`text-[9px] uppercase tracking-[0.15em] font-semibold mb-1.5 ${'text-[#6B4D30]'}`}>Product Info</div>
            <div className={`space-y-1 text-[10px] ${'text-gray-500'}`}>
              {[
                { label: 'Collection', value: item.collection || '-' },
                { label: 'Target', value: item.customerTarget || '-' },
                { label: 'Gender', value: block.gender || '-' },
                { label: 'Category', value: block.productType || '-' },
                { label: 'Composition', value: item.composition || '-' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-2">
                  <span className="font-semibold flex-shrink-0">{label}</span>
                  <span className={`truncate text-right font-['JetBrains_Mono'] ${'text-gray-700'}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* =========================
   APPROVAL STEPS & COMPONENTS
========================= */

const APPROVAL_STEPS = [
  { id: 'submitted', label: 'Submitted' },
  { id: 'brand_manager', label: 'Group Brand Manager' },
  { id: 'finance', label: 'Finance' },
  { id: 'ceo', label: 'CEO' },
];

const getApprovalStepStatus = (stepId: any, currentStep: any, approvalHistory: any) => {
  const historyItem = approvalHistory?.find((h: any) => h.stepId === stepId);
  if (historyItem?.action === 'approved') return 'approved';
  if (historyItem?.action === 'rejected') return 'rejected';
  if (historyItem?.action === 'submitted') return 'approved';
  if (stepId === currentStep) return 'current';
  const stepIndex = APPROVAL_STEPS.findIndex((s: any) => s.id === stepId);
  const currentIndex = APPROVAL_STEPS.findIndex((s: any) => s.id === currentStep);
  return stepIndex < currentIndex ? 'approved' : 'waiting';
};

const ApprovalProgressBar = ({ currentStep, approvalHistory, t }: any) => (
  <div className={`border rounded-lg px-3 md:px-4 py-2 md:py-2.5 ${'bg-white border-[rgba(215,183,151,0.2)]'}`}>
    <div className="flex items-center overflow-x-auto gap-0">
      {APPROVAL_STEPS.map((step: any, index: any) => {
        const status = getApprovalStepStatus(step.id, currentStep, approvalHistory);
        return (
          <React.Fragment key={step.id}>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                status === 'approved' ? 'bg-[#127749] text-white' :
                status === 'rejected' ? 'bg-[#F85149] text-white' :
                status === 'current' ? 'bg-[#D7B797] text-white' :'bg-gray-100 border border-gray-200 text-gray-400'}`}>
                {status === 'approved' ? <Check size={12} strokeWidth={3} /> :
                 status === 'rejected' ? <X size={12} strokeWidth={3} /> :
                 status === 'current' ? <Clock size={12} /> :
                 index + 1}
              </div>
              <div className="flex flex-col">
                <span className={`text-[11px] font-medium leading-tight ${
                  status === 'approved' ? 'text-[#2A9E6A]' :
                  status === 'rejected' ? 'text-[#FF7B72]' :
                  status === 'current' ? ('text-[#6B4D30]') :'text-gray-400'}`}>{step.label}</span>
                {status === 'approved' && <span className="text-[9px] font-semibold text-[#2A9E6A]">Approved</span>}
                {status === 'rejected' && <span className="text-[9px] font-semibold text-[#FF7B72]">Rejected</span>}
                {status === 'current' && <span className={`text-[9px] font-semibold ${'text-amber-600'}`}>In Review</span>}
              </div>
            </div>
            {index < APPROVAL_STEPS.length - 1 && (
              <div className={`flex-1 h-px mx-2 min-w-[16px] ${
                getApprovalStepStatus(APPROVAL_STEPS[index + 1].id, currentStep, approvalHistory) !== 'waiting'
                  ? 'bg-[#127749]'
                  :'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  </div>
);

const StatusTrackingPanel = ({ approvalHistory, ticket, t }: any) => (
  <div className={`border rounded-lg p-3 h-full flex flex-col ${'bg-white border-[rgba(215,183,151,0.2)]'}`}>
    <div className="flex items-center justify-between mb-2">
      <span className={`text-[10px] font-semibold uppercase tracking-wider font-['Montserrat'] ${'text-gray-400'}`}>
        {t ? t('common.status') : 'Status'}
      </span>
      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
        ['APPROVED', 'LEVEL2_APPROVED', 'FINAL'].includes(ticket?.status?.toUpperCase())
          ?'bg-emerald-50 text-emerald-700': ['REJECTED', 'LEVEL1_REJECTED', 'LEVEL2_REJECTED'].includes(ticket?.status?.toUpperCase())
          ?'bg-red-50 text-red-700': ['SUBMITTED', 'LEVEL1_APPROVED'].includes(ticket?.status?.toUpperCase())
          ?'bg-amber-50 text-amber-700':'bg-gray-100 text-gray-600'}`}>
        {ticket?.status?.replace(/_/g, ' ') || 'Draft'}
      </span>
    </div>
    <div className="space-y-0 flex-1">
      {approvalHistory?.length > 0 ? (
        approvalHistory.map((item: any, index: any) => (
          <div key={index} className="flex gap-2">
            <div className="flex flex-col items-center">
              <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${
                item.action === 'approved' ? 'bg-[#2A9E6A]' :
                item.action === 'rejected' ? 'bg-[#F85149]' :
                item.action === 'submitted' ? 'bg-[#D7B797]' :'bg-gray-300'}`} />
              {index < approvalHistory.length - 1 && (
                <div className={`w-px flex-1 min-h-[12px] ${'bg-gray-200'}`} />
              )}
            </div>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-1.5">
                <span className={`text-[10px] font-semibold ${
                  item.action === 'approved' ? 'text-[#2A9E6A]' :
                  item.action === 'rejected' ? 'text-[#FF7B72]' :'text-amber-700'}`}>
                  {item.action.charAt(0).toUpperCase() + item.action.slice(1)}
                </span>
                <span className={`text-[10px] ${'text-gray-400'}`}>
                  {item.stepLabel || item.role || '-'}
                </span>
              </div>
              {item.decidedAt && (
                <div className={`text-[9px] font-['JetBrains_Mono'] ${'text-gray-400'}`}>
                  {new Date(item.decidedAt).toLocaleString('vi-VN')}
                </div>
              )}
              {item.comment && (
                <div className={`mt-0.5 text-[10px] px-2 py-1 rounded ${
                  item.action === 'rejected'
                    ?'bg-red-50 text-red-600 border border-red-100':'bg-gray-50 text-gray-500'}`}>
                  {item.comment}
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className={`text-xs italic ${'text-gray-400'}`}>
          No history
        </div>
      )}
    </div>
  </div>
);

/* =========================
   MAIN SCREEN
========================= */

export default function TicketDetailPage({ ticket, onBack, showApprovalActions = false }: any) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { isMobile } = useIsMobile();
  const { dialogProps, confirm } = useConfirmDialog();
  const [collapsed, setCollapsed] = useState<any>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [skuData, setSkuData] = useState<any[]>([]);
  const [skuViewMode, setSkuViewMode] = useState<string>('card');
  const [highlightedRow, setHighlightedRow] = useState<string>('');

  // Diff/View Changes state
  const [showDiff, setShowDiff] = useState(false);
  const [previousSkuData, setPreviousSkuData] = useState<any[]>([]);

  // Determine the right service based on entity type
  const getEntityService = () => {
    if (ticket?.entityType === 'budget') return budgetService;
    if (ticket?.entityType === 'planning') return planningService;
    if (ticket?.entityType === 'proposal') return proposalService;
    return null;
  };

  // Check if current user can approve at the current step
  const canApprove = () => {
    if (!ticket || !user) return false;
    const status = ticket?.status?.toUpperCase();
    const roleName = (user.role?.name || user.roleName || '').toLowerCase();
    const permissions = user.role?.permissions || user.permissions || [];
    const entityType = ticket.entityType;
    const permPrefix = entityType === 'proposal' ? 'proposal' : entityType === 'planning' ? 'planning' : 'budget';

    if (status === 'SUBMITTED') {
      return permissions.includes(`${permPrefix}:approve_l1`) || permissions.includes('*') || roleName.includes('manager');
    }
    if (status === 'LEVEL1_APPROVED') {
      return permissions.includes(`${permPrefix}:approve_l2`) || permissions.includes('*') || roleName.includes('finance') || roleName.includes('director');
    }
    return false;
  };

  const handleSubmitTicket = async () => {
    const svc = getEntityService();
    if (!svc) return;
    setActionLoading(true);
    try {
      await svc.submit(ticket.id);
      invalidateCache(`/${ticket.entityType}`);
      toast.success(t('ticketDetail.submit'));
      if (onBack) onBack();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveTicket = async () => {
    const svc = getEntityService();
    if (!svc) return;
    const status = ticket?.status?.toUpperCase();
    setActionLoading(true);
    try {
      if (status === 'SUBMITTED') {
        await svc.approveL1(ticket.id, 'Approved');
      } else if (status === 'LEVEL1_APPROVED') {
        await svc.approveL2(ticket.id, 'Approved');
      }
      invalidateCache(`/${ticket.entityType}`);
      toast.success(t('ticketDetail.approve'));
      if (onBack) onBack();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('common.error'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectTicket = () => {
    confirm({
      title: t('ticketDetail.reject'),
      message: t('ticketDetail.rejectReason') || 'Enter rejection reason:',
      confirmLabel: t('ticketDetail.reject'),
      variant: 'danger',
      promptPlaceholder: t('ticketDetail.rejectReasonPlaceholder') || 'Reason...',
      onConfirm: async (reason?: string) => {
        const svc = getEntityService();
        if (!svc) return;
        const status = ticket?.status?.toUpperCase();
        setActionLoading(true);
        try {
          if (status === 'SUBMITTED') {
            await svc.rejectL1(ticket.id, reason || 'Rejected');
          } else if (status === 'LEVEL1_APPROVED') {
            await svc.rejectL2(ticket.id, reason || 'Rejected');
          }
          invalidateCache(`/${ticket.entityType}`);
          toast.success(t('ticketDetail.reject'));
          if (onBack) onBack();
        } catch (err: any) {
          toast.error(err.response?.data?.message || t('common.error'));
        } finally {
          setActionLoading(false);
        }
      }});
  };

  // Approval history — derive from ticket status
  const approvalHistory = useMemo(() => {
    const status = ticket?.status?.toUpperCase();
    if (!status || status === 'DRAFT') return [];
    const history: any[] = [];
    history.push({
      stepId: 'submitted',
      stepLabel: 'Submitted',
      action: 'submitted',
      decidedAt: ticket?.createdAt || ticket?.createdOn || null,
      comment: null
    });
    if (['LEVEL1_APPROVED', 'LEVEL2_APPROVED', 'APPROVED', 'FINAL'].includes(status)) {
      history.push({
        stepId: 'brand_manager',
        stepLabel: 'Group Brand Manager',
        action: 'approved',
        decidedAt: ticket?.l1ApprovedAt || null,
        comment: ticket?.l1Comment || 'Approved for finance review'
      });
    } else if (status === 'LEVEL1_REJECTED') {
      history.push({
        stepId: 'brand_manager',
        stepLabel: 'Group Brand Manager',
        action: 'rejected',
        decidedAt: ticket?.l1RejectedAt || null,
        comment: ticket?.l1Comment || 'Rejected'
      });
    }
    if (['LEVEL2_APPROVED', 'APPROVED', 'FINAL'].includes(status)) {
      history.push({
        stepId: 'finance',
        stepLabel: 'Finance',
        action: 'approved',
        decidedAt: ticket?.l2ApprovedAt || null,
        comment: ticket?.l2Comment || 'Finance approved'
      });
    } else if (status === 'LEVEL2_REJECTED') {
      history.push({
        stepId: 'finance',
        stepLabel: 'Finance',
        action: 'rejected',
        decidedAt: ticket?.l2RejectedAt || null,
        comment: ticket?.l2Comment || 'Rejected by Finance'
      });
    }
    if (['APPROVED', 'FINAL'].includes(status)) {
      history.push({
        stepId: 'ceo',
        stepLabel: 'CEO',
        action: 'approved',
        decidedAt: ticket?.approvedAt || null,
        comment: ticket?.ceoComment || 'Final approval granted'
      });
    }
    return history;
  }, [ticket]);

  const currentStep = useMemo(() => {
    const status = ticket?.status?.toUpperCase();
    if (!status || status === 'DRAFT') return 'submitted';
    if (status === 'SUBMITTED') return 'brand_manager';
    if (status === 'LEVEL1_APPROVED') return 'finance';
    if (status === 'LEVEL1_REJECTED') return 'brand_manager';
    if (status === 'LEVEL2_APPROVED') return 'ceo';
    if (status === 'LEVEL2_REJECTED') return 'finance';
    if (['APPROVED', 'FINAL'].includes(status)) return 'completed';
    return 'submitted';
  }, [ticket]);

  // Helper: transform proposal items/products into grouped SKU blocks
  const transformToSkuBlocks = (items: any[]) => {
    const groupedSkus: any = {};
    items.forEach((item: any) => {
      const genderName = item.gender?.name || item.gender || 'Unknown';
      const categoryName = item.category?.name || item.category || 'Unknown';
      const key = `${genderName}_${categoryName}`;
      if (!groupedSkus[key]) {
        groupedSkus[key] = {
          gender: genderName.toLowerCase(),
          productType: categoryName,
          subCategory: item.subCategory?.name || item.subCategory || categoryName,
          pctBuyPropose: 0,
          otbPropose: 0,
          items: []
        };
      }
      groupedSkus[key].items.push({
        sku: item.sku?.code || item.skuCode || item.skuId || item.sku || '-',
        name: item.sku?.name || item.productName || item.name || '-',
        theme: item.sku?.theme || item.theme || '-',
        color: item.sku?.color || item.color || '-',
        composition: item.sku?.composition || item.composition || '-',
        srp: Number(item.sku?.retailPrice || item.srp) || 0,
        unitCost: Number(item.sku?.unitCost || item.unitCost) || 0,
        collection: item.sku?.collection || item.collection || '-',
        customerTarget: item.sku?.customerTarget || item.customerTarget || '-',
        order: Number(item.quantity || item.orderQty) || 0,
        rex: Number(item.rex) || Math.floor(Number(item.quantity) / 2) || 0,
        ttp: Number(item.ttp) || Math.ceil(Number(item.quantity) / 2) || 0,
        ttlValue: Number(item.totalValue) || 0
      });
      groupedSkus[key].otbPropose += Number(item.totalValue) || 0;
    });
    return Object.values(groupedSkus) as any[];
  };

  // Fetch detailed data based on entity type
  useEffect(() => {
    if (!ticket) return;

    const fetchDetailData = async () => {
      setLoading(true);
      try {
        let data = ticket.data;

        // Fetch full entity data from API
        if (ticket.entityType === 'budget' && ticket.id) {
          const res = await budgetService.getOne(ticket.id);
          data = res.data || res;
        } else if (ticket.entityType === 'planning' && ticket.id) {
          const res = await planningService.getOne(ticket.id);
          data = res.data || res;
        } else if (ticket.entityType === 'proposal' && ticket.id) {
          const res = await proposalService.getOne(ticket.id);
          data = res.data || res;
        }

        setDetailData(data);

        // === PROPOSAL: products array (backend field name) ===
        if (ticket.entityType === 'proposal') {
          const products = data?.products || data?.items || [];
          if (products.length > 0) {
            const skuGroups = transformToSkuBlocks(products);
            setSkuData(skuGroups);
            const defaultCollapsed: any = {};
            skuGroups.forEach((block: any) => {
              defaultCollapsed[`${block.productType}_${block.gender}`] = true;
            });
            setCollapsed(defaultCollapsed);
          }
        }

        // === BUDGET: details array with store allocations ===
        if (ticket.entityType === 'budget') {
          const details = data?.details || [];
          if (details.length > 0) {
            const budgetBlocks: any[] = [];
            const storeMap: Record<string, any[]> = {};
            details.forEach((d: any) => {
              const storeName = d.store?.name || d.store?.code || 'Unknown';
              if (!storeMap[storeName]) storeMap[storeName] = [];
              storeMap[storeName].push(d);
            });
            Object.entries(storeMap).forEach(([storeName, storeDetails]) => {
              budgetBlocks.push({
                gender: storeName,
                productType: t('ticketDetail.storeAllocation') || 'Store Allocation',
                subCategory: storeName,
                pctBuyPropose: 0,
                otbPropose: storeDetails.reduce((sum: number, d: any) => sum + (Number(d.budgetAmount) || 0), 0),
                items: storeDetails.map((d: any) => ({
                  sku: d.store?.code || storeName,
                  name: storeName,
                  theme: data.seasonType || '-',
                  color: '-',
                  composition: '-',
                  srp: Number(d.budgetAmount) || 0,
                  unitCost: 0,
                  collection: data.seasonGroupId || '-',
                  customerTarget: '-',
                  order: 1,
                  rex: storeName.toUpperCase().includes('REX') ? 1 : 0,
                  ttp: storeName.toUpperCase().includes('TTP') ? 1 : 0,
                  ttlValue: Number(d.budgetAmount) || 0}))});
            });
            setSkuData(budgetBlocks);
          }
        }

        // === PLANNING: details array OR fallback to budgetDetail ===
        if (ticket.entityType === 'planning') {
          const details = data?.details || [];
          if (details.length > 0) {
            // Has dimension details — group by category
            const planningBlocks: any[] = [];
            const categoryMap: Record<string, any[]> = {};
            details.forEach((d: any) => {
              const catName = d.category?.name || d.gender?.name || 'General';
              if (!categoryMap[catName]) categoryMap[catName] = [];
              categoryMap[catName].push(d);
            });
            Object.entries(categoryMap).forEach(([catName, catDetails]) => {
              planningBlocks.push({
                gender: catName.toLowerCase(),
                productType: catName,
                subCategory: catName,
                pctBuyPropose: catDetails[0]?.userBuyPct || catDetails[0]?.buyPercentage || 0,
                otbPropose: catDetails.reduce((sum: number, d: any) => sum + (Number(d.otbValue) || 0), 0),
                items: catDetails.map((d: any) => ({
                  sku: d.subCategory?.name || d.categoryId || '-',
                  name: d.subCategory?.name || d.category?.name || catName,
                  theme: '-',
                  color: '-',
                  composition: '-',
                  srp: Number(d.otbValue) || 0,
                  unitCost: Number(d.unitCost) || 0,
                  collection: '-',
                  customerTarget: '-',
                  order: Number(d.quantity) || 0,
                  rex: Math.floor((Number(d.quantity) || 0) / 2),
                  ttp: Math.ceil((Number(d.quantity) || 0) / 2),
                  ttlValue: Number(d.otbValue) || 0}))});
            });
            setSkuData(planningBlocks);
          } else if (data?.budgetDetail) {
            // No planning details — use budgetDetail allocation info as fallback
            const bd = data.budgetDetail;
            const storeName = bd.store?.name || bd.store?.code || 'Store';
            const budget = bd.budget || {};
            const brandName = budget.groupBrand?.name || '-';
            const budgetAmt = Number(bd.budgetAmount) || 0;
            const planningBlock = {
              gender: storeName.toLowerCase(),
              productType: t('ticketDetail.planningDetails') || 'Planning Allocation',
              subCategory: storeName,
              pctBuyPropose: 0,
              otbPropose: budgetAmt,
              items: [{
                sku: data.planningCode || data.id || '-',
                name: `${brandName} — ${storeName}`,
                theme: budget.seasonType || '-',
                color: '-',
                composition: '-',
                srp: budgetAmt,
                unitCost: 0,
                collection: budget.seasonGroupId || '-',
                customerTarget: '-',
                order: 1,
                rex: storeName.toUpperCase().includes('REX') ? 1 : 0,
                ttp: storeName.toUpperCase().includes('TTP') ? 1 : 0,
                ttlValue: budgetAmt}]};
            setSkuData([planningBlock]);
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch ticket detail:', err);
        toast.error('Failed to load detail data');
        if (ticket.data) {
          setDetailData(ticket.data);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDetailData();
  }, [ticket]);

  // Fetch previous version data from API for diff comparison
  const [diffLoading, setDiffLoading] = useState(false);
  const [noPreviousVersion, setNoPreviousVersion] = useState(false);

  const fetchPreviousVersion = useCallback(async () => {
    if (!detailData || !ticket) return;
    setDiffLoading(true);
    setNoPreviousVersion(false);
    try {
      const entityType = ticket.entityType;
      let prevData: any = null;

      if (entityType === 'planning' && detailData.budgetDetailId) {
        // Find sibling planning versions with same budgetDetailId
        const allRes = await planningService.getAll({ budgetDetailId: detailData.budgetDetailId });
        const versions = (Array.isArray(allRes) ? allRes : allRes?.data || [])
          .sort((a: any, b: any) => (b.versionNumber || 0) - (a.versionNumber || 0));
        const currentVersion = detailData.versionNumber || 1;
        const prevVersion = versions.find((v: any) => (v.versionNumber || 0) < currentVersion && v.id !== ticket.id);
        if (prevVersion) {
          const res = await planningService.getOne(prevVersion.id);
          prevData = res?.data || res;
        }
      } else if (entityType === 'proposal' && (detailData.planningId || detailData.budgetDetailId)) {
        // Find sibling proposal versions
        const allRes = await proposalService.getAll();
        const versions = (Array.isArray(allRes) ? allRes : allRes?.data || [])
          .filter((p: any) => p.id !== ticket.id && (
            (detailData.planningId && p.planningId === detailData.planningId) ||
            (detailData.budgetDetailId && p.budgetDetailId === detailData.budgetDetailId)
          ))
          .sort((a: any, b: any) => (b.versionNumber || 0) - (a.versionNumber || 0));
        if (versions.length > 0) {
          const res = await proposalService.getOne(versions[0].id);
          prevData = res?.data || res;
        }
      }

      if (!prevData) {
        setNoPreviousVersion(true);
        setPreviousSkuData([]);
        return;
      }

      // Transform previous version data into same SKU block format
      if (entityType === 'proposal') {
        const products = prevData.products || prevData.items || [];
        if (products.length > 0) {
          setPreviousSkuData(transformToSkuBlocks(products));
        } else {
          setNoPreviousVersion(true);
        }
      } else if (entityType === 'planning') {
        const details = prevData.details || [];
        if (details.length > 0) {
          const planningBlocks: any[] = [];
          const categoryMap: Record<string, any[]> = {};
          details.forEach((d: any) => {
            const catName = d.category?.name || d.gender?.name || 'General';
            if (!categoryMap[catName]) categoryMap[catName] = [];
            categoryMap[catName].push(d);
          });
          Object.entries(categoryMap).forEach(([catName, catDetails]) => {
            planningBlocks.push({
              gender: catName.toLowerCase(),
              productType: catName,
              subCategory: catName,
              items: catDetails.map((d: any) => ({
                sku: d.subCategory?.name || d.categoryId || '-',
                name: d.subCategory?.name || d.category?.name || catName,
                srp: Number(d.otbValue) || 0,
                unitCost: Number(d.unitCost) || 0,
                order: Number(d.quantity) || 0,
                rex: Math.floor((Number(d.quantity) || 0) / 2),
                ttp: Math.ceil((Number(d.quantity) || 0) / 2),
                ttlValue: Number(d.otbValue) || 0}))});
          });
          setPreviousSkuData(planningBlocks);
        } else {
          setNoPreviousVersion(true);
        }
      } else {
        setNoPreviousVersion(true);
      }
    } catch (err: any) {
      console.error('Failed to fetch previous version:', err);
      setNoPreviousVersion(true);
    } finally {
      setDiffLoading(false);
    }
  }, [detailData, ticket, transformToSkuBlocks]);

  const handleToggleDiff = useCallback(() => {
    if (!showDiff && previousSkuData.length === 0 && !noPreviousVersion) {
      fetchPreviousVersion();
    }
    setShowDiff((prev) => !prev);
  }, [showDiff, previousSkuData, noPreviousVersion, fetchPreviousVersion]);

  // Helper: find previous item by SKU code
  const getPreviousItem = useCallback((sku: string) => {
    for (const block of previousSkuData) {
      const found = block.items?.find((i: any) => i.sku === sku);
      if (found) return found;
    }
    return null;
  }, [previousSkuData]);

  // Helper: check if a value changed
  const isDiffValue = useCallback((sku: string, field: string, currentValue: any) => {
    if (!showDiff) return false;
    const prev = getPreviousItem(sku);
    if (!prev) return true; // new item
    return prev[field] !== currentValue;
  }, [showDiff, getPreviousItem]);

  // Generate budget/season data from detail
  const { budgetData, budgetSeasonData } = useMemo(() => {
    if (!detailData) {
      return { budgetData: EMPTY_BUDGET_DATA, budgetSeasonData: EMPTY_SEASON_DATA };
    }

    // For budget type
    if (ticket?.entityType === 'budget') {
      const details = detailData.details || [];
      const storeMap: any = {};
      details.forEach((d: any) => {
        const storeName = d.store?.name || 'Unknown';
        if (!storeMap[storeName]) storeMap[storeName] = 0;
        storeMap[storeName] += Number(d.budgetAmount) || 0;
      });

      return {
        budgetData: {
          id: detailData.id,
          fiscalYear: detailData.fiscalYear,
          groupBrand: detailData.groupBrand?.name || '-',
          brandId: detailData.groupBrandId,
          brandName: detailData.groupBrand?.name || '-',
          totalBudget: Number(detailData.totalBudget) || 0,
          budgetName: `${detailData.groupBrand?.name || 'Budget'} - ${detailData.seasonGroupId || ''} ${detailData.seasonType || ''}`,
          status: detailData.status
        },
        budgetSeasonData: {
          seasonGroup: detailData.seasonGroupId || '-',
          Season: detailData.seasonType || '-',
          rex: Object.values(storeMap)[0] || 0,
          ttp: Object.values(storeMap)[1] || 0,
          finalVersion: 1
        }
      };
    }

    // For planning type
    if (ticket?.entityType === 'planning') {
      const details = detailData.details || [];
      const storeMap: any = { rex: 0, ttp: 0 };
      details.forEach((d: any) => {
        const otb = Number(d.otbValue) || 0;
        storeMap.rex += otb * 0.5;
        storeMap.ttp += otb * 0.5;
      });

      return {
        budgetData: {
          id: detailData.id,
          fiscalYear: detailData.budgetDetail?.budget?.fiscalYear || '-',
          groupBrand: detailData.budgetDetail?.budget?.groupBrand?.name || '-',
          brandName: detailData.budgetDetail?.budget?.groupBrand?.name || '-',
          totalBudget: Number(detailData.budgetDetail?.budgetAmount) || 0,
          budgetName: detailData.planningCode || 'Planning',
          status: detailData.status
        },
        budgetSeasonData: {
          seasonGroup: detailData.budgetDetail?.budget?.seasonGroupId || '-',
          Season: detailData.budgetDetail?.budget?.seasonType || '-',
          rex: storeMap.rex || 343000000,
          ttp: storeMap.ttp || 294000000,
          finalVersion: detailData.versionNumber || 1
        }
      };
    }

    // Default / proposal — use nested budget relation for metadata
    const proposalBudget = detailData?.budget || {};
    const proposalBrand = proposalBudget.groupBrand || {};
    return {
      budgetData: detailData ? {
        id: detailData.id,
        fiscalYear: proposalBudget.fiscalYear || ticket?.fiscalYear || '-',
        groupBrand: proposalBrand.name || ticket?.brand || '-',
        brandName: proposalBrand.name || ticket?.brand || '-',
        totalBudget: Number(detailData.totalValue || detailData.totalBudget) || 0,
        budgetName: detailData.ticketName || ticket?.name || 'Proposal',
        status: detailData.status
      } : EMPTY_BUDGET_DATA,
      budgetSeasonData: {
        seasonGroup: proposalBudget.seasonGroupId || '-',
        Season: proposalBudget.seasonType || '-',
        rex: 0,
        ttp: 0,
        finalVersion: 0}};
  }, [detailData, ticket]);

  const rexNum = Number(budgetSeasonData.rex) || 0;
  const ttpNum = Number(budgetSeasonData.ttp) || 0;
  const totalRexTtp = rexNum + ttpNum;

  // Use real SKU data or mock fallback
  const displaySkuData = skuData;

  if (loading) {
    return (
      <div className={`p-6 min-h-screen flex items-center justify-center ${''}`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={40} className={`animate-spin ${'text-[#6B4D30]'}`} />
          <span className={'text-gray-700'}>{t('ticketDetail.loadingDetail')}</span>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className={`p-6 min-h-screen flex items-center justify-center ${''}`}>
        <div className={`text-center ${'text-gray-700'}`}>
          <p>{t('common.noData')}</p>
          {onBack && (
            <button onClick={onBack} className={`mt-4 hover:underline ${'text-[#6B4D30]'}`}>
              {t('ticketDetail.backToTickets')}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-3 md:p-4 min-h-screen space-y-2 md:space-y-3 ${''}`}>
      {/* ===== COMPACT HEADER ===== */}
      {onBack && (
        <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg ${'bg-gradient-to-r from-[#127749] to-[#2A9E6A]'}`}>
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={onBack} className="p-1 rounded transition-all hover:bg-white/10 text-white shrink-0">
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold font-['Montserrat'] text-white">{t('ticketDetail.title')}</span>
                <span className={`px-1.5 py-px text-[9px] font-bold rounded ${
                  ['APPROVED', 'LEVEL2_APPROVED', 'FINAL'].includes(ticket?.status?.toUpperCase())
                    ? 'bg-white/20 text-white'
                  : ['REJECTED', 'LEVEL1_REJECTED', 'LEVEL2_REJECTED'].includes(ticket?.status?.toUpperCase())
                    ? 'bg-[#F85149]/30 text-white'
                  : 'bg-white/15 text-white/80'
                }`}>
                  {ticket?.status?.replace(/_/g, ' ') || 'DRAFT'}
                </span>
              </div>
              <p className="text-[10px] text-white/60 truncate">{ticket?.entityType?.charAt(0).toUpperCase() + ticket?.entityType?.slice(1)} • {ticket?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleToggleDiff}
              className={`flex items-center gap-1.5 px-2.5 py-1 font-medium rounded text-[11px] border transition-all ${
                showDiff ? 'bg-[#D7B797]/30 text-white border-[#D7B797]/50' : 'bg-white/10 hover:bg-white/20 text-white/80 border-white/15'
              }`}
            >
              <GitCompare size={12} />
              {t('ticketDetail.viewChanges')}
            </button>
            {ticket?.status?.toUpperCase() === 'DRAFT' && (
              <button onClick={handleSubmitTicket} disabled={actionLoading} className="flex items-center gap-1 px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white font-medium rounded text-[11px] border border-white/15 disabled:opacity-50">
                <Send size={11} /> {t('common.submit')}
              </button>
            )}
            {showApprovalActions && canApprove() && (<>
              <button onClick={handleRejectTicket} disabled={actionLoading} className="flex items-center gap-1 px-2.5 py-1 bg-[#F85149]/20 hover:bg-[#F85149]/30 text-white font-medium rounded text-[11px] border border-[#F85149]/25 disabled:opacity-50">
                <XCircle size={11} /> {t('ticketDetail.reject')}
              </button>
              <button onClick={handleApproveTicket} disabled={actionLoading} className="flex items-center gap-1 px-2.5 py-1 bg-white/25 hover:bg-white/35 text-white font-medium rounded text-[11px] border border-white/25 disabled:opacity-50">
                <CheckCircle size={11} /> {t('ticketDetail.approve')}
              </button>
            </>)}
          </div>
        </div>
      )}

      {/* ===== APPROVAL + INFO — single compact row ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-2 items-stretch">
        {/* Left: Approval progress + Budget/Season inline */}
        <div className="flex flex-col gap-2">
          <ApprovalProgressBar currentStep={currentStep} approvalHistory={approvalHistory} t={t} />

          {/* Budget + Season — compact inline grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
            <div className={`border rounded-lg p-2.5 flex flex-col ${'bg-white border-[rgba(215,183,151,0.2)]'}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] font-semibold uppercase tracking-wider font-['Montserrat'] ${'text-gray-400'}`}>{t('skuProposal.budget')}</span>
                <span className={`text-[10px] font-semibold font-['JetBrains_Mono'] ${'text-[#6B4D30]'}`}>{formatCurrency(budgetData.totalBudget)}</span>
              </div>
              <div className="grid grid-cols-3 gap-x-3 gap-y-1 flex-1 items-end">
                <div>
                  <span className={`text-[9px] ${'text-gray-400'}`}>{t('budget.fiscalYear')}</span>
                  <p className={`text-xs font-semibold font-['JetBrains_Mono'] ${'text-gray-800'}`}>{budgetData.fiscalYear}</p>
                </div>
                <div>
                  <span className={`text-[9px] ${'text-gray-400'}`}>{t('budget.brand')}</span>
                  <p className={`text-xs font-semibold ${'text-gray-800'}`}>{budgetData.brandName}</p>
                </div>
                <div>
                  <span className={`text-[9px] ${'text-gray-400'}`}>{t('budget.budgetName')}</span>
                  <p className={`text-xs font-semibold truncate ${'text-gray-800'}`}>{budgetData.budgetName}</p>
                </div>
              </div>
            </div>

            <div className={`border rounded-lg p-2.5 flex flex-col ${'bg-white border-[rgba(215,183,151,0.2)]'}`}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`text-[10px] font-semibold uppercase tracking-wider font-['Montserrat'] ${'text-gray-400'}`}>{t('skuProposal.season')}</span>
                <span className={`text-[10px] font-bold font-['JetBrains_Mono'] ${'text-[#6B4D30]'}`}>{formatCurrency(totalRexTtp)}</span>
              </div>
              <div className="grid grid-cols-3 gap-x-3 gap-y-1 flex-1 items-end">
                <div>
                  <span className={`text-[9px] ${'text-gray-400'}`}>{t('skuProposal.seasonGroup')}</span>
                  <p className={`text-xs font-semibold ${'text-gray-800'}`}>{budgetSeasonData.seasonGroup} — {budgetSeasonData.Season}</p>
                </div>
                <div>
                  <span className={`text-[9px] ${'text-gray-400'}`}>REX</span>
                  <p className={`text-xs font-semibold font-['JetBrains_Mono'] ${'text-[#6B4D30]'}`}>{formatCurrency(rexNum)}</p>
                </div>
                <div>
                  <span className={`text-[9px] ${'text-gray-400'}`}>TTP</span>
                  <p className={`text-xs font-semibold font-['JetBrains_Mono'] ${'text-[#127749]'}`}>{formatCurrency(ttpNum)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Status tracking — stretch full height */}
        <StatusTrackingPanel approvalHistory={approvalHistory} ticket={ticket} t={t} />
      </div>

      {/* SKU Proposal Details Section — always visible */}
      <div className={`border rounded-xl overflow-hidden ${'bg-white border-[rgba(215,183,151,0.3)]'}`}>
        {/* Section Header — collapsible */}
        <button
          type="button"
          onClick={() => setCollapsed((p: any) => ({ ...p, _skuSection: !p._skuSection }))}
          className={`w-full flex items-center justify-between gap-3 px-4 py-3 transition-colors ${'bg-gradient-to-r from-[rgba(160,120,75,0.08)] to-transparent hover:from-[rgba(160,120,75,0.12)]'}`}
        >
          <div className="flex items-center gap-2.5">
            <Package size={18} className={'text-[#6B4D30]'} />
            <h3 className={`text-sm font-bold font-['Montserrat'] ${'text-gray-800'}`}>
              {ticket?.entityType === 'budget'
                ? (t('ticketDetail.budgetDetails') || 'Budget Allocation Details')
                : ticket?.entityType === 'planning'
                ? (t('ticketDetail.planningDetails') || 'Planning Details')
                : (t('ticketDetail.skuProposalDetails') || 'SKU Proposal Details')
              }
            </h3>
          </div>
          <div className="flex items-center gap-3">
            {/* Summary pills */}
            <div className="hidden sm:flex items-center gap-2">
              {displaySkuData.length > 0 ? (<>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${'bg-[rgba(160,120,75,0.1)] text-[#6B4D30]'}`}>
                  <Package size={10} />
                  {displaySkuData.reduce((sum: any, b: any) => sum + b.items.length, 0)} SKUs
                </span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-['JetBrains_Mono'] ${'bg-[rgba(18,119,73,0.08)] text-[#127749]'}`}>
                  <DollarSign size={10} />
                  {formatCurrency(displaySkuData.reduce((s: any, b: any) => s + b.items.reduce((ss: any, i: any) => ss + (i.ttlValue || (i.order || 0) * (i.srp || 0)), 0), 0))}
                </span>
              </>) : (
                <span className={`text-[10px] ${'text-[#999]'}`}>
                  {t('ticketDetail.noSkuData') || 'No SKU data'}
                </span>
              )}
            </div>
            {collapsed._skuSection
              ? <ChevronDown size={16} className={'text-[#999]'} />
              : <ChevronUp size={16} className={'text-[#999]'} />
            }
          </div>
        </button>

        {/* Summary bar (visible even when collapsed on mobile) */}
        {displaySkuData.length > 0 && (
        <div className={`sm:hidden flex items-center gap-3 px-4 py-1.5 border-t ${'border-[rgba(215,183,151,0.15)] bg-[#FDFCFB]'}`}>
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${'text-[#6B4D30]'}`}>
            <Package size={10} />
            {displaySkuData.reduce((sum: any, b: any) => sum + b.items.length, 0)} SKUs
          </span>
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold font-['JetBrains_Mono'] ${'text-[#127749]'}`}>
            <DollarSign size={10} />
            {formatCurrency(displaySkuData.reduce((s: any, b: any) => s + b.items.reduce((ss: any, i: any) => ss + (i.ttlValue || (i.order || 0) * (i.srp || 0)), 0), 0))}
          </span>
        </div>
        )}

        {!collapsed._skuSection && displaySkuData.length === 0 && (
          <div className={`px-4 py-8 text-center ${'text-[#999]'}`}>
            <Package size={36} className="mx-auto mb-2.5 opacity-30" />
            <p className={`text-sm font-semibold mb-1 ${'text-gray-500'}`}>
              {t('ticketDetail.noSkuProposals') || 'No SKU proposals linked yet'}
            </p>
            <p className="text-xs opacity-70">
              {ticket?.entityType === 'budget'
                ? (t('ticketDetail.createProposalHint') || 'Create an SKU proposal from the SKU Proposal screen to link it to this budget')
                : ticket?.entityType === 'planning'
                ? (t('ticketDetail.createProposalFromPlanning') || 'SKU proposals linked to this planning will appear here')
                : (t('ticketDetail.addSkuHint') || 'Add SKUs to this proposal to see them here')
              }
            </p>
          </div>
        )}

        {!collapsed._skuSection && displaySkuData.length > 0 && (
        <div className="space-y-3 md:space-y-5 p-3 md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* View Mode Toggle (hidden on mobile - always card view) */}
          <div className={`hidden md:flex items-center gap-1 rounded-lg p-1 ${'bg-[rgba(160,120,75,0.12)] border border-[rgba(160,120,75,0.3)]'}`}>
            <button
              type="button"
              onClick={() => setSkuViewMode('card')}
              className={`p-2 rounded-md transition-all ${
                skuViewMode === 'card'
                  ?'bg-white text-[#6B4D30] shadow-sm':'text-[#999999] hover:text-[#666666]'}`}
              title="Card View"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setSkuViewMode('table')}
              className={`p-2 rounded-md transition-all ${
                skuViewMode === 'table'
                  ?'bg-white text-[#6B4D30] shadow-sm':'text-[#999999] hover:text-[#666666]'}`}
              title="Table View"
            >
              <List size={16} />
            </button>
          </div>

          {/* Link to full SKU Proposal */}
          {ticket?.entityType === 'proposal' && (
            <a
              href="/sku-proposal"
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors ${'border-[rgba(215,183,151,0.3)] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.08)]'}`}
            >
              <ExternalLink size={11} />
              {t('ticketDetail.viewFullProposal') || 'View Full Proposal'}
            </a>
          )}
        </div>
        {/* Diff Legend */}
        {showDiff && (
          <div className={`flex items-center gap-4 px-4 py-2 rounded-xl text-xs font-['Montserrat'] ${'bg-amber-50 border border-amber-200'}`}>
            {diffLoading ? (
              <span className={`flex items-center gap-2 ${'text-[#6B4D30]'}`}>
                <Loader2 size={12} className="animate-spin" />
                {t('ticketDetail.loadingChanges') || 'Loading previous version...'}
              </span>
            ) : noPreviousVersion ? (
              <span className={'text-gray-500'}>
                <GitCompare size={12} className="inline mr-1" />
                {t('ticketDetail.noPreviousVersion') || 'No previous version available for comparison'}
              </span>
            ) : (
              <>
                <span className={'text-[#6B4D30]'}>
                  <GitCompare size={12} className="inline mr-1" />
                  {t('ticketDetail.comparingVersions') || 'Comparing with previous version'}
                </span>
                <span className="flex items-center gap-1">
                  <span className={`w-3 h-3 rounded ${'bg-emerald-100 ring-1 ring-emerald-300'}`} />
                  <span className={'text-gray-600'}>{t('ticketDetail.increased') || 'Increased'}</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className={`w-3 h-3 rounded ${'bg-red-100 ring-1 ring-red-300'}`} />
                  <span className={'text-gray-600'}>{t('ticketDetail.decreased') || 'Decreased'}</span>
                </span>
              </>
            )}
          </div>
        )}

        {/* === TABLE VIEW (desktop only) — Transposed: fields as rows, SKUs as columns === */}
        {skuViewMode === 'table' && !isMobile && displaySkuData.map((block: any) => {
          const blockKey = `${block.gender}_${block.productType}`;
          const isBlockCollapsed = collapsed[blockKey];
          const hlBg ='bg-[rgba(160,120,75,0.1)]';
          const hlLabel ='bg-[#ede4d8]';
          const labelBg ='bg-white';
          const labelBorder ='!border-r-[rgba(160,120,75,0.4)]';
          const toggleHl = (rowId: string) => setHighlightedRow(prev => prev === `${blockKey}_${rowId}` ? '' : `${blockKey}_${rowId}`);
          const isHl = (rowId: string) => highlightedRow === `${blockKey}_${rowId}`;
          const trCls = (rowId: string, extra?: string) => `${isHl(rowId) ? hlBg : ''} ${extra || ''}`;
          const tdLabel = (rowId: string, extra?: string) => `px-3 py-1.5 text-xs font-semibold whitespace-nowrap sticky left-0 z-10 cursor-pointer select-none ${isHl(rowId) ? hlLabel : labelBg} ${labelBorder} border-r ${'text-[#666] hover:text-[#6B4D30]'} ${extra || ''}`;

          // Diff helpers per item
          const itemDiff = (item: any) => {
            const prev = showDiff ? getPreviousItem(item.sku) : null;
            const diffCls = (field: string) => {
              if (!showDiff || !prev) return '';
              const c = Number(item[field]) || 0;
              const p = Number(prev[field]) || 0;
              if (c === p) return '';
              return c > p
                ? ('bg-emerald-50 ring-1 ring-inset ring-emerald-300 rounded')
                : ('bg-red-50 ring-1 ring-inset ring-red-300 rounded');
            };
            const diffLabel = (field: string) => {
              if (!showDiff || !prev) return null;
              const c = Number(item[field]) || 0;
              const p = Number(prev[field]) || 0;
              if (c === p) return null;
              const d = c - p;
              return <span className={`text-[9px] ml-1 ${d > 0 ? 'text-[#2A9E6A]' : 'text-[#F85149]'}`}>{d > 0 ? `+${d}` : d}</span>;
            };
            const isNew = showDiff && !prev;
            return { diffCls, diffLabel, isNew };
          };

          return (
            <div key={blockKey} className={`border rounded-2xl shadow-sm overflow-hidden ${'bg-white border-gray-300'}`}>
              {/* Block Header */}
              <button
                type="button"
                onClick={() => setCollapsed((p: any) => ({ ...p, [blockKey]: !p[blockKey] }))}
                className={`w-full flex items-center gap-3 px-4 py-2 transition-colors ${'bg-gradient-to-r from-[#6B4D30] via-[#8B7355] to-[#6B4D30] text-white hover:from-[#7A5A3A]'}`}
              >
                <ChevronDown size={16} className={`transition-transform duration-200 shrink-0 ${isBlockCollapsed ? '-rotate-90' : ''} ${'text-[#F5E6D3]'}`} />
                <div className="text-left flex-1 min-w-0">
                  <span className="font-semibold text-sm font-['Montserrat']">{block.subCategory}</span>
                  <span className={`ml-2 text-xs ${'text-[#E8D5BE]'}`}>
                    {block.gender} • <span className="font-['JetBrains_Mono']">{block.items.length}</span> SKUs
                  </span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className={`text-xs font-['JetBrains_Mono'] font-bold ${'text-white'}`}>
                    {formatCurrency(block.items.reduce((s: any, i: any) => s + (i.ttlValue || 0), 0))}
                  </span>
                </div>
              </button>

              {/* Transposed Table */}
              {!isBlockCollapsed && (
                <div className="overflow-x-auto">
                  <table className={`w-full text-xs border-separate border-spacing-0 [&_td]:border ${'[&_td]:border-[rgba(215,183,151,0.2)]'}`}>
                    <tbody>
                      {/* Image row */}
                      <tr className={trCls('image')}>
                        <td className={tdLabel('image', 'py-2')} onClick={() => toggleHl('image')}>Image</td>
                        {block.items.map((item: any, idx: number) => {
                          const { isNew } = itemDiff(item);
                          return (
                            <td key={idx} className={`px-3 py-2 text-center min-w-[140px] ${isNew ? ('bg-emerald-50/50') : ''}`}>
                              <div className="relative inline-block">
                                <ProductImage subCategory={block.subCategory || ''} sku={item.sku || ''} size={48} rounded="rounded-lg" />
                                {isNew && <span className="absolute -top-1 -right-1 px-1 py-0.5 text-[7px] font-bold rounded bg-[#2A9E6A] text-white">NEW</span>}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                      {/* SKU row */}
                      <tr className={trCls('sku')}>
                        <td className={tdLabel('sku')} onClick={() => toggleHl('sku')}>SKU</td>
                        {block.items.map((item: any, idx: number) => (
                          <td key={idx} className={`px-3 py-1.5 text-center font-['JetBrains_Mono'] font-semibold ${'text-[#6B4D30]'}`}>{item.sku}</td>
                        ))}
                      </tr>
                      {/* Name row */}
                      <tr className={trCls('name')}>
                        <td className={tdLabel('name')} onClick={() => toggleHl('name')}>Name</td>
                        {block.items.map((item: any, idx: number) => (
                          <td key={idx} className={`px-3 py-1.5 text-center font-medium max-w-[160px] truncate ${'text-gray-800'}`} title={item.name}>{item.name}</td>
                        ))}
                      </tr>
                      {/* Theme row */}
                      <tr className={trCls('theme')}>
                        <td className={tdLabel('theme')} onClick={() => toggleHl('theme')}>Theme</td>
                        {block.items.map((item: any, idx: number) => (
                          <td key={idx} className={`px-3 py-1.5 text-center ${'text-gray-600'}`}>{item.theme || '-'}</td>
                        ))}
                      </tr>
                      {/* Color row */}
                      <tr className={trCls('color')}>
                        <td className={tdLabel('color')} onClick={() => toggleHl('color')}>Color</td>
                        {block.items.map((item: any, idx: number) => (
                          <td key={idx} className={`px-3 py-1.5 text-center ${'text-gray-600'}`}>{item.color || '-'}</td>
                        ))}
                      </tr>
                      {/* Composition row */}
                      <tr className={trCls('composition')}>
                        <td className={tdLabel('composition')} onClick={() => toggleHl('composition')}>Composition</td>
                        {block.items.map((item: any, idx: number) => (
                          <td key={idx} className={`px-3 py-1.5 text-center max-w-[160px] truncate ${'text-gray-600'}`} title={item.composition}>{item.composition || '-'}</td>
                        ))}
                      </tr>
                      {/* Unit Cost row */}
                      <tr className={trCls('unitCost')}>
                        <td className={tdLabel('unitCost')} onClick={() => toggleHl('unitCost')}>Unit Cost</td>
                        {block.items.map((item: any, idx: number) => (
                          <td key={idx} className={`px-3 py-1.5 text-center font-['JetBrains_Mono'] ${'text-gray-800'}`}>{formatCurrency(item.unitCost || 0)}</td>
                        ))}
                      </tr>
                      {/* SRP row */}
                      <tr className={trCls('srp')}>
                        <td className={tdLabel('srp')} onClick={() => toggleHl('srp')}>SRP</td>
                        {block.items.map((item: any, idx: number) => {
                          const { diffCls, diffLabel } = itemDiff(item);
                          return (
                            <td key={idx} className={`px-3 py-1.5 text-center font-['JetBrains_Mono'] font-semibold ${'text-[#127749]'} ${diffCls('srp')}`}>
                              {formatCurrency(item.srp || 0)}{diffLabel('srp')}
                            </td>
                          );
                        })}
                      </tr>
                      {/* REX row */}
                      <tr className={trCls('rex','bg-[rgba(160,120,75,0.03)]')}>
                        <td className={tdLabel('rex')} onClick={() => toggleHl('rex')}>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#D7B797]" /> REX</span>
                        </td>
                        {block.items.map((item: any, idx: number) => {
                          const { diffCls, diffLabel } = itemDiff(item);
                          return (
                            <td key={idx} className={`px-3 py-1.5 text-center font-['JetBrains_Mono'] font-bold ${'text-[#6B4D30]'} ${diffCls('rex')}`}>
                              {item.rex || 0}{diffLabel('rex')}
                            </td>
                          );
                        })}
                      </tr>
                      {/* TTP row */}
                      <tr className={trCls('ttp','bg-[rgba(18,119,73,0.02)]')}>
                        <td className={tdLabel('ttp')} onClick={() => toggleHl('ttp')}>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#127749]" /> TTP</span>
                        </td>
                        {block.items.map((item: any, idx: number) => {
                          const { diffCls, diffLabel } = itemDiff(item);
                          return (
                            <td key={idx} className={`px-3 py-1.5 text-center font-['JetBrains_Mono'] font-bold text-[#127749] ${diffCls('ttp')}`}>
                              {item.ttp || 0}{diffLabel('ttp')}
                            </td>
                          );
                        })}
                      </tr>
                      {/* Total Order row — always highlighted */}
                      <tr className={trCls('order','bg-[rgba(160,120,75,0.06)]')}>
                        <td className={tdLabel('order')} onClick={() => toggleHl('order')}>
                          <span className="font-bold">{t('proposal.totalQty') || 'Total Qty'}</span>
                        </td>
                        {block.items.map((item: any, idx: number) => {
                          const { diffCls, diffLabel } = itemDiff(item);
                          return (
                            <td key={idx} className={`px-3 py-1.5 text-center font-['JetBrains_Mono'] font-bold text-base ${'text-gray-800'} ${diffCls('order')}`}>
                              {item.order || ((item.rex || 0) + (item.ttp || 0))}{diffLabel('order')}
                            </td>
                          );
                        })}
                      </tr>
                      {/* TTL Value row — always highlighted */}
                      <tr className={trCls('ttlValue','bg-[rgba(160,120,75,0.06)]')}>
                        <td className={tdLabel('ttlValue')} onClick={() => toggleHl('ttlValue')}>
                          <span className="font-bold">{t('proposal.totalValue') || 'TTL Value'}</span>
                        </td>
                        {block.items.map((item: any, idx: number) => {
                          const { diffCls, diffLabel } = itemDiff(item);
                          return (
                            <td key={idx} className={`px-3 py-1.5 text-center font-['JetBrains_Mono'] font-bold ${'text-[#127749]'} ${diffCls('ttlValue')}`}>
                              {formatCurrency(item.ttlValue || 0)}{diffLabel('ttlValue')}
                            </td>
                          );
                        })}
                      </tr>
                      {/* Customer Target row */}
                      <tr className={trCls('customerTarget')}>
                        <td className={tdLabel('customerTarget')} onClick={() => toggleHl('customerTarget')}>Target</td>
                        {block.items.map((item: any, idx: number) => (
                          <td key={idx} className={`px-3 py-1.5 text-center ${'text-gray-600'}`}>{item.customerTarget || '-'}</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}

        {/* === CARD VIEW (always on mobile, or when card mode selected) === */}
        {(skuViewMode === 'card' || isMobile) && displaySkuData.map((block: any) => {
          const key = `${block.gender}_${block.productType}`;
          const isCollapsed = collapsed[key];
          const totalSrp = block.items.reduce((sum: any, i: any) => sum + i.srp, 0);
          return (
            <div key={key} className={`border rounded-2xl shadow-sm overflow-hidden ${'bg-white border-gray-300'}`}>
              <button
                type="button"
                onClick={() => setCollapsed((p: any) => ({ ...p, [key]: !p[key] }))}
                className={`w-full flex flex-wrap items-center gap-3 md:gap-4 px-3 md:px-5 py-0.5 md:py-1 transition-all ${'bg-gradient-to-r from-[#6B4D30] via-[#8B7355] to-[#6B4D30] text-white hover:from-[#7A5A3A] hover:via-[#9A8060] hover:to-[#7A5A3A]'}`}
              >
                <ChevronDown size={18} className={`transition-transform shrink-0 ${isCollapsed ? '-rotate-90' : ''} ${'text-[#F5E6D3]'}`} />
                <div className="text-left flex-1 min-w-0">
                  <div className="font-semibold text-sm font-['Montserrat']">{block.subCategory}</div>
                  <div className={`text-sm mt-0.5 ${'text-[#E8D5BE]'}`}>
                    {block.gender} • {block.productType} • <span className="font-['JetBrains_Mono']">{block.items.length}</span> SKUs
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-6 shrink-0">
                  <div className="text-right">
                    <div className={`text-xs uppercase tracking-wide ${'text-[#E8D5BE]'}`}>% Buy propose</div>
                    <div className={`text-sm font-bold font-['JetBrains_Mono'] ${'text-white'}`}>{block.pctBuyPropose}%</div>
                  </div>
                  <div className={`w-px h-8 ${'bg-[rgba(255,255,255,0.2)]'}`} />
                  <div className="text-right">
                    <div className={`text-xs uppercase tracking-wide ${'text-[#E8D5BE]'}`}>OTB propose</div>
                    <div className={`text-sm font-bold font-['JetBrains_Mono'] ${'text-white'}`}>{formatCurrency(block.otbPropose)}</div>
                  </div>
                  <div className={`w-px h-8 ${'bg-[rgba(255,255,255,0.2)]'}`} />
                  <div className="text-right">
                    <div className={`text-xs uppercase tracking-wide ${'text-[#E8D5BE]'}`}>Total SRP</div>
                    <div className={`text-sm font-semibold font-['JetBrains_Mono'] ${'text-white'}`}>{formatCurrency(totalSrp)}</div>
                  </div>
                </div>
              </button>

              {!isCollapsed && (
                <div
                  className="premium-card-scroll flex gap-4 overflow-x-auto snap-x snap-mandatory px-5 py-5"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor:'#C9A84C #F5F0EA'}}
                >
                  <style>{`
                    .premium-card-scroll::-webkit-scrollbar { height: 6px; }
                    .premium-card-scroll::-webkit-scrollbar-track { background: ${'#F5F0EA'}; border-radius: 3px; }
                    .premium-card-scroll::-webkit-scrollbar-thumb { background: ${'#C9A84C'}; border-radius: 3px; }
                    .premium-card-scroll::-webkit-scrollbar-thumb:hover { background: ${'#B8973C'}; }
                  `}</style>
                  {block.items.map((item: any, idx: number) => (
                    <PremiumSKUCard key={idx} item={item} block={block} prevItem={showDiff ? getPreviousItem(item.sku) : undefined} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}
      </div>
      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
