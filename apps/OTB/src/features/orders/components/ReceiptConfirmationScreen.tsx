'use client';

import React, { useState, useEffect, useMemo, Fragment } from 'react';
import {
  Receipt, CheckCircle, Clock, Loader2, Package,
  Search, ChevronDown, ChevronRight, X, AlertTriangle, FileText,
  ClipboardCheck, XCircle, AlertCircle, BarChart3, Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/utils';
import { proposalService, orderService } from '@/services';
import { invalidateCache } from '@/services/api';
import { MobileDataCard } from '@/components/ui';
import { useIsMobile } from '@/hooks/useIsMobile';
import { PullToRefresh } from '@/components/mobile';

/* ═══════════════════════════════════════════════
   STATUS CONFIG
═══════════════════════════════════════════════ */
const RECEIPT_STATUS: any = {
  PENDING: { color: '#D29922', bg: 'rgba(210,153,34,0.12)', label: 'Pending' },
  CONFIRMED: { color: '#2A9E6A', bg: 'rgba(42,158,106,0.12)', label: 'Confirmed' },
  DISCREPANCY: { color: '#F85149', bg: 'rgba(248,81,73,0.12)', label: 'Discrepancy' },
  PARTIAL: { color: '#A371F7', bg: 'rgba(163,113,247,0.12)', label: 'Partial' }};

/* ═══════════════════════════════════════════════
   SIZING TABLE
═══════════════════════════════════════════════ */
const SizingTable = ({ item }: any) => {
  const sizes = item.sizes || {};
  const sizeKeys = Object.keys(sizes);
  if (sizeKeys.length === 0) return null;
  const totalQty = (item.rex || 0) + (item.ttp || 0);

  return (
    <div className={`rounded-xl border overflow-hidden ${'border-gray-300 bg-white'}`}>
      <div className={`px-4 py-0.5 text-xs font-semibold border-b font-['Montserrat'] ${'text-gray-600 bg-gray-50 border-gray-300'}`}>
        Sizing — {item.productType}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className={'bg-[rgba(160,120,75,0.18)] text-[#666666]'}>
              <th className="px-3 py-0.5 text-left">{item.productType}</th>
              {sizeKeys.map(s => <th key={s} className="px-3 py-0.5 text-center font-['JetBrains_Mono']">{s}</th>)}
              <th className="px-3 py-0.5 text-center">Sum</th>
            </tr>
          </thead>
          <tbody>
            <tr className={`border-t ${'border-gray-300'}`}>
              <td className={`px-3 py-0.5 ${'text-gray-700'}`}>% Sales mix</td>
              {sizeKeys.map(s => <td key={s} className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${'text-gray-600'}`}>{sizes[s].salesMix}%</td>)}
              <td className={`px-3 py-0.5 text-center font-semibold font-['JetBrains_Mono'] ${'text-gray-800'}`}>100%</td>
            </tr>
            <tr className={`border-t ${'border-gray-300'}`}>
              <td className={`px-3 py-0.5 ${'text-gray-700'}`}>% ST</td>
              {sizeKeys.map(s => <td key={s} className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${'text-gray-600'}`}>{sizes[s].st}%</td>)}
              <td className={`px-3 py-0.5 text-center ${'text-gray-600'}`}>-</td>
            </tr>
            <tr className={`border-t ${'border-gray-300 bg-[rgba(227,179,65,0.18)]'}`}>
              <td className={`px-3 py-0.5 font-semibold ${'text-[#6B4D30]'}`}>Qty</td>
              {sizeKeys.map(s => {
                const qty = Math.round(totalQty * sizes[s].salesMix / 100);
                return <td key={s} className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${'text-gray-800'}`}>{qty}</td>;
              })}
              <td className={`px-3 py-0.5 text-center font-semibold font-['JetBrains_Mono'] ${'text-gray-800'}`}>{totalQty}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   RECEIPT DETAIL PANEL (expandable)
═══════════════════════════════════════════════ */
const ReceiptDetailPanel = ({ receipt }: any) => {
  const [expandedSku, setExpandedSku] = useState<string | null>(null);
  const products = receipt.products || [];

  const border ='border-gray-300';
  const textPrimary ='text-gray-900';
  const textSecondary ='text-gray-700';
  const textMuted ='text-gray-600';

  if (products.length === 0) {
    return (
      <div className={`px-4 py-8 border-t ${border} ${'bg-gray-50/50'}`}>
        <div className="flex flex-col items-center justify-center">
          <Package size={24} className={textMuted} />
          <p className={`text-xs mt-2 font-['Montserrat'] ${textMuted}`}>No products in this receipt</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`px-4 py-0.5 border-t ${border} ${'bg-gray-50/50'}`}>
      <div className="space-y-2">
        {products.map((item: any, idx: number) => {
          const isExpanded = expandedSku === (item.sku || `sku-${idx}`);
          const totalQty = (item.rex || 0) + (item.ttp || 0);
          const ttlValue = totalQty * (item.srp || 0);
          const orderedQty = item.orderedQty || totalQty;
          const receivedQty = item.receivedQty ?? orderedQty;
          const hasDiscrepancy = receivedQty < orderedQty;

          return (
            <div key={item.sku || idx} className={`rounded-xl border overflow-hidden ${'border-gray-200 bg-white'}`}>
              {/* SKU Header */}
              <div
                className={`flex items-center gap-3 px-3 py-0.5 cursor-pointer transition-colors ${'hover:bg-gray-50'}`}
                onClick={() => setExpandedSku(isExpanded ? null : (item.sku || `sku-${idx}`))}
              >
                <ChevronRight size={14} className={`transition-transform ${isExpanded ? 'rotate-90' : ''} ${'text-[#6B4D30]'}`} />
                <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${'bg-gray-50 border-gray-200'}`}>
                  <ImageIcon size={14} className={textMuted} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold font-['Montserrat'] truncate ${textPrimary}`}>
                    <span className="font-['JetBrains_Mono']">{item.sku}</span> — {item.name}
                  </div>
                  <div className={`text-[10px] ${textMuted}`}>{item.gender} • {item.productType} • {item.color}</div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className={`text-[10px] ${textMuted}`}>Ordered / Received</div>
                    <div className={`text-xs font-semibold font-['JetBrains_Mono'] ${hasDiscrepancy ? 'text-[#F85149]' : textPrimary}`}>
                      {orderedQty} / {receivedQty}
                      {hasDiscrepancy && <AlertCircle size={10} className="inline ml-1 text-[#F85149]" />}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[10px] ${textMuted}`}>Value</div>
                    <div className={`text-xs font-semibold font-['JetBrains_Mono'] ${'text-[#6B4D30]'}`}>{formatCurrency(ttlValue)}</div>
                  </div>
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className={`px-3 pb-3 space-y-2 border-t ${border}`}>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    <div className={`rounded-lg border px-2.5 py-0.5 ${'bg-gray-50 border-gray-200'}`}>
                      <p className={`text-[10px] uppercase tracking-wide ${textMuted}`}>Composition</p>
                      <p className={`text-xs font-medium ${textPrimary}`}>{item.composition || '-'}</p>
                    </div>
                    <div className={`rounded-lg border px-2.5 py-0.5 ${'bg-gray-50 border-gray-200'}`}>
                      <p className={`text-[10px] uppercase tracking-wide ${textMuted}`}>SRP</p>
                      <p className={`text-xs font-semibold font-['JetBrains_Mono'] ${textPrimary}`}>{formatCurrency(item.srp || 0)}</p>
                    </div>
                    <div className={`rounded-lg border px-2.5 py-0.5 ${'bg-gray-50 border-gray-200'}`}>
                      <p className={`text-[10px] uppercase tracking-wide ${textMuted}`}>REX / TTP</p>
                      <p className={`text-xs font-semibold font-['JetBrains_Mono'] ${textPrimary}`}>{item.rex} / {item.ttp}</p>
                    </div>
                    <div className={`rounded-lg border px-2.5 py-0.5 ${hasDiscrepancy ? ('bg-red-50 border-red-200') : ('bg-gray-50 border-gray-200')}`}>
                      <p className={`text-[10px] uppercase tracking-wide ${textMuted}`}>Received</p>
                      <p className={`text-xs font-semibold font-['JetBrains_Mono'] ${hasDiscrepancy ? 'text-[#F85149]' : ('text-green-600')}`}>
                        {receivedQty} / {orderedQty} {hasDiscrepancy ? '(!)' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Store Allocation */}
                  <div className={`rounded-xl border overflow-hidden ${'border-gray-300'}`}>
                    <div className={`px-3 py-0.5 text-xs font-semibold border-b font-['Montserrat'] ${'text-gray-600 bg-gray-50 border-gray-300'}`}>
                      Store Allocation
                    </div>
                    <table className="w-full text-xs">
                      <thead>
                        <tr className={'bg-[rgba(160,120,75,0.12)] text-[#666666]'}>
                          <th className="px-3 py-0.5 text-left">Store</th>
                          <th className="px-3 py-0.5 text-center font-['JetBrains_Mono']">Qty</th>
                          <th className="px-3 py-0.5 text-right font-['JetBrains_Mono']">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className={`border-t ${'border-gray-200'}`}>
                          <td className={`px-3 py-0.5 ${textPrimary}`}><span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#D7B797]" />REX</span></td>
                          <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${textPrimary}`}>{item.rex || 0}</td>
                          <td className={`px-3 py-0.5 text-right font-['JetBrains_Mono'] ${textPrimary}`}>{formatCurrency((item.rex || 0) * (item.srp || 0))}</td>
                        </tr>
                        <tr className={`border-t ${'border-gray-200'}`}>
                          <td className={`px-3 py-0.5 ${textPrimary}`}><span className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#127749]" />TTP</span></td>
                          <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${textPrimary}`}>{item.ttp || 0}</td>
                          <td className={`px-3 py-0.5 text-right font-['JetBrains_Mono'] ${textPrimary}`}>{formatCurrency((item.ttp || 0) * (item.srp || 0))}</td>
                        </tr>
                        <tr className={`border-t-2 ${'border-[#D7B797]/40 bg-[rgba(160,120,75,0.08)]'}`}>
                          <td className={`px-3 py-0.5 font-semibold ${'text-[#6B4D30]'}`}>Total</td>
                          <td className={`px-3 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${textPrimary}`}>{totalQty}</td>
                          <td className={`px-3 py-0.5 text-right font-bold font-['JetBrains_Mono'] ${textPrimary}`}>{formatCurrency(ttlValue)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Sizing */}
                  <SizingTable item={item} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════
   MAIN SCREEN
═══════════════════════════════════════════════ */
const ReceiptConfirmationScreen = ({  }: any) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confirmModal, setConfirmModal] = useState<any>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [discrepancyNote, setDiscrepancyNote] = useState<string>('');
  const [editReceivedQty, setEditReceivedQty] = useState<number>(0);
  const [expandedReceiptId, setExpandedReceiptId] = useState<any>(null);

  // Remove parent scroll container padding so sticky toolbar is flush with header
  useEffect(() => {
    const el = document.getElementById('main-scroll');
    if (el) { el.style.padding = '0'; }
    return () => { if (el) el.style.padding = ''; };
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await proposalService.getAll({ status: 'APPROVED' });
      const proposals = Array.isArray(response) ? response : [];
      const mapped = proposals.map((p: any, idx: any) => ({
        id: p.id || idx + 1,
        receiptNumber: `REC-${String(idx + 1).padStart(5, '0')}`,
        poReference: p.proposalCode || `PO-${String(idx + 1).padStart(5, '0')}`,
        brandName: p.budget?.groupBrand?.name || p.brandName || '-',
        itemCount: p.products?.length || p.skuCount || 0,
        orderedQty: p.products?.reduce((sum: any, pr: any) => sum + (pr.totalQuantity || 0), 0) || p.totalQty || 0,
        receivedQty: 0,
        status: 'PENDING',
        receivedDate: null,
        createdAt: p.updatedAt || p.createdAt || new Date().toISOString(),
        products: (p.products || []).map((prod: any) => ({
          sku: prod.sku || prod.skuCode || `SKU-${String(prod.id || 0).padStart(3, '0')}`,
          name: prod.name || prod.productName || 'Product',
          productType: prod.productType || prod.subCategory?.name || prod.category?.name || '-',
          gender: prod.gender?.name || prod.genderName || '-',
          color: prod.color || '-',
          composition: prod.composition || prod.material || '-',
          srp: prod.srp || prod.retailPrice || prod.price || 0,
          rex: prod.allocations?.find((a: any) => a.store?.name?.includes('REX'))?.quantity || prod.rexQty || 4,
          ttp: prod.allocations?.find((a: any) => a.store?.name?.includes('TTP'))?.quantity || prod.ttpQty || 3,
          orderedQty: prod.totalQuantity || 7,
          receivedQty: prod.receivedQuantity || 6,
          sizes: prod.sizes || null}))}));
      setReceipts(mapped);
    } catch (err: any) {
      console.error('Failed to fetch receipts:', err);
      setError(t('receiptConfirm.failedToLoad'));
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReceipt = async (receipt: any) => {
    setProcessing(true);
    try {
      await orderService.confirmReceipt(receipt.id, { receivedQty: editReceivedQty });
      invalidateCache('/receipts');
      invalidateCache('/proposals');
      toast.success(t('receiptConfirm.receiptConfirmed'));
      fetchReceipts();
    } catch (err: any) {
      console.error('Failed to confirm receipt:', err);
      toast.error(err.response?.data?.message || t('receiptConfirm.confirmFailed'));
    } finally {
      setProcessing(false);
      setConfirmModal(null);
    }
  };

  const handleFlagDiscrepancy = async (receipt: any) => {
    setProcessing(true);
    try {
      await orderService.flagDiscrepancy(receipt.id, discrepancyNote);
      invalidateCache('/receipts');
      invalidateCache('/proposals');
      toast.success(t('receiptConfirm.discrepancyFlagged'));
      fetchReceipts();
    } catch (err: any) {
      console.error('Failed to flag discrepancy:', err);
      toast.error(err.response?.data?.message || t('receiptConfirm.flagFailed'));
    } finally {
      setProcessing(false);
      setConfirmModal(null);
      setDiscrepancyNote('');
    }
  };

  const filtered = useMemo(() => {
    return receipts.filter((receipt: any) => {
      if (statusFilter !== 'all' && receipt.status !== statusFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          (receipt.receiptNumber || '').toLowerCase().includes(term) ||
          (receipt.poReference || '').toLowerCase().includes(term) ||
          (receipt.brandName || '').toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [receipts, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const total = receipts.length;
    const pending = receipts.filter((r: any) => r.status === 'PENDING').length;
    const confirmed = receipts.filter((r: any) => r.status === 'CONFIRMED').length;
    const discrepancy = receipts.filter((r: any) => r.status === 'DISCREPANCY').length;
    const partial = receipts.filter((r: any) => r.status === 'PARTIAL').length;

    return {
      total, pending, confirmed, discrepancy, partial,
      confirmedPct: total > 0 ? Math.round((confirmed / total) * 100) : 0,
      discrepancyPct: total > 0 ? Math.round((discrepancy / total) * 100) : 0,
      statusBreakdown: [
        { label: t('receiptConfirm.statusPending'), value: pending, color: '#D29922' },
        { label: t('receiptConfirm.statusConfirmed'), value: confirmed, color: '#2A9E6A' },
        { label: t('receiptConfirm.statusDiscrepancy'), value: discrepancy, color: '#F85149' },
        { label: t('receiptConfirm.statusPartial'), value: partial, color: '#A371F7' },
      ].filter((b: any) => b.value > 0)};
  }, [receipts, t]);

  const bg ='bg-[#F8F7F4]';
  const cardBg ='bg-white';
  const border ='border-gray-300';
  const textPrimary ='text-gray-900';
  const textSecondary ='text-gray-700';
  const textMuted ='text-gray-600';

  return (
    <div className={`min-h-full ${bg}`}>
      {/* ── Sticky Toolbar — flush with header (parent padding removed via useEffect) ── */}
      <div
        className="sticky top-0 z-20 px-3 md:px-6 pb-3 pt-2"
        style={{
          background:'#F8F7F4',
          boxShadow: '0 1px 0 ' + ('rgba(0,0,0,0.06)')}}
      >
        {/* Top row: Logo + Stats + Search */}
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-3 md:gap-5">
            <div className="flex items-center gap-1.5">
              <img src="/vietErp-logo.png" alt="L-ERP" className="h-5 w-auto" />
              <span className="text-sm font-semibold font-['Cormorant_Garamond'] text-[#C4A77D] tracking-wider hidden md:inline">L-ERP</span>
            </div>
            <div className={`hidden md:block w-px h-7 ${'bg-gray-300'}`} />
            <div>
              <p className={`text-[10px] font-medium uppercase tracking-wider font-['Montserrat'] ${textMuted}`}>
                {t('receiptConfirm.totalReceipts')}
              </p>
              <p className={`text-lg md:text-xl font-bold font-['JetBrains_Mono'] leading-tight ${textPrimary}`}>
                {stats.total}
              </p>
            </div>
            <div className={`hidden md:block w-px h-7 ${'bg-gray-300'}`} />
            <div className="hidden md:flex items-center gap-4">
              <div>
                <p className={`text-[10px] font-medium uppercase tracking-wider font-['Montserrat'] ${textMuted}`}>{t('receiptConfirm.statusConfirmed')}</p>
                <p className={`text-sm font-bold font-['JetBrains_Mono'] leading-tight text-[#2A9E6A]`}>{stats.confirmed}</p>
              </div>
              <div>
                <p className={`text-[10px] font-medium uppercase tracking-wider font-['Montserrat'] ${textMuted}`}>{t('receiptConfirm.discrepancies')}</p>
                <p className={`text-sm font-bold font-['JetBrains_Mono'] leading-tight ${stats.discrepancy > 0 ? 'text-[#F85149]' : textPrimary}`}>{stats.discrepancy}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${border} ${'bg-white'} ${isMobile ? 'w-36' : 'w-52'}`}>
              <Search size={13} className={textMuted} />
              <input type="text" placeholder={t('receiptConfirm.searchPlaceholder')} value={searchTerm} onChange={(e: any) => setSearchTerm(e.target.value)} className={`bg-transparent outline-none text-xs w-full font-['Montserrat'] ${textPrimary} placeholder:${textMuted}`} />
              {searchTerm && <button onClick={() => setSearchTerm('')}><X size={12} className={textMuted} /></button>}
            </div>
            <button onClick={fetchReceipts} className={`p-1.5 rounded-lg border ${border} transition-all ${'hover:bg-gray-50 text-gray-500'}`} title={t('common.refresh')}>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/></svg>
            </button>
          </div>
        </div>

        {/* Status Pipeline */}
        <div className="flex items-stretch gap-1">
          {[
            { key: 'PENDING', label: t('receiptConfirm.statusPending'), count: stats.pending, color: '#D29922', icon: Clock },
            { key: 'CONFIRMED', label: t('receiptConfirm.statusConfirmed'), count: stats.confirmed, color: '#2A9E6A', icon: CheckCircle },
            { key: 'DISCREPANCY', label: t('receiptConfirm.statusDiscrepancy'), count: stats.discrepancy, color: '#F85149', icon: AlertCircle },
            { key: 'PARTIAL', label: t('receiptConfirm.statusPartial'), count: stats.partial, color: '#A371F7', icon: Package },
          ].map((step) => {
            const Icon = step.icon;
            const isActive = statusFilter === step.key;
            return (
              <button
                key={step.key}
                onClick={() => setStatusFilter(isActive ? 'all' : step.key)}
                className={`flex-1 relative rounded-xl border px-3 py-2.5 transition-all duration-200 ${
                  isActive
                    ?'border-[#D7B797]/60 bg-[rgba(215,183,151,0.08)]':'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${step.color}18` }}>
                    <Icon size={14} style={{ color: step.color }} />
                  </div>
                  <div className="text-left min-w-0">
                    <p className={`text-[10px] font-medium uppercase tracking-wider font-['Montserrat'] ${'text-gray-500'}`}>{step.label}</p>
                    <p className={`text-base font-bold font-['JetBrains_Mono'] leading-tight ${'text-gray-900'}`}>{step.count}</p>
                  </div>
                </div>
                {isActive && <div className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full" style={{ backgroundColor: step.color }} />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content with padding ── */}
      <div className="px-3 md:px-6 pb-3 md:pb-6">
      {/* Table */}
      <div className={`border ${border} rounded-xl overflow-hidden mt-3`} style={{
        background:'linear-gradient(135deg, #ffffff 0%, rgba(215,183,151,0.03) 35%, rgba(215,183,151,0.08) 100%)'}}>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 size={32} className={`animate-spin ${'text-[#6B4D30]'}`} />
            <p className={`text-sm mt-3 ${textSecondary}`}>{t('receiptConfirm.loadingReceipts')}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20">
            <AlertTriangle size={32} className="text-[#F85149]" />
            <p className={`text-sm mt-3 ${textSecondary}`}>{error}</p>
            <button onClick={fetchReceipts} className="mt-3 px-4 py-0.5 rounded-xl bg-[#D7B797] text-black text-sm font-medium font-['Montserrat']">{t('common.tryAgain')}</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <ClipboardCheck size={48} className={textMuted} />
            <p className={`text-base font-semibold mt-4 font-['Montserrat'] ${textPrimary}`}>{t('receiptConfirm.noReceipts')}</p>
            <p className={`text-sm mt-1 ${textSecondary}`}>{t('receiptConfirm.noReceiptsDesc')}</p>
          </div>
        ) : isMobile ? (
          <PullToRefresh onRefresh={fetchReceipts}>
          <div className="p-3 space-y-2">
            {filtered.map((receipt: any, idx: any) => {
              const sc = RECEIPT_STATUS[receipt.status] || RECEIPT_STATUS.PENDING;
              const statusColorMap: any = { CONFIRMED: 'success', DISCREPANCY: 'critical', PENDING: 'warning', PARTIAL: 'neutral' };
              const dateStr = receipt.receivedDate ? new Date(receipt.receivedDate).toLocaleDateString('vi-VN') : receipt.createdAt ? new Date(receipt.createdAt).toLocaleDateString('vi-VN') : '-';
              return (
                <div key={receipt.id || idx}>
                  <MobileDataCard
                    title={receipt.receiptNumber}
                    subtitle={`${receipt.poReference} - ${receipt.brandName}`}
                    status={sc.label}
                    statusColor={statusColorMap[receipt.status] || 'neutral'}
                    metrics={[
                      { label: t('receiptConfirm.colItems'), value: receipt.itemCount || receipt.products?.length || 0 },
                      { label: t('receiptConfirm.colDate'), value: dateStr },
                    ]}
                    actions={[
                      ...(receipt.status === 'PENDING' ? [
                        { label: t('common.confirm'), primary: true, onClick: () => { setConfirmModal({ receipt, action: 'confirm' }); setDiscrepancyNote(''); setEditReceivedQty(receipt.orderedQty); } },
                        { label: t('receiptConfirm.flag'), onClick: () => { setConfirmModal({ receipt, action: 'discrepancy' }); setDiscrepancyNote(''); } },
                      ] : []),
                      { label: expandedReceiptId === receipt.id ? 'Hide SKUs' : `View ${receipt.itemCount || receipt.products?.length || 0} SKUs`, onClick: () => setExpandedReceiptId(expandedReceiptId === receipt.id ? null : receipt.id) },
                    ]}
                  />
                  {expandedReceiptId === receipt.id && <ReceiptDetailPanel receipt={receipt} />}
                </div>
              );
            })}
          </div>
          </PullToRefresh>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`${'bg-gray-50'} border-b ${border}`}>
                  {['', t('receiptConfirm.colReceipt'), t('receiptConfirm.colPORef'), t('receiptConfirm.colBrand'), t('receiptConfirm.colItems'), t('receiptConfirm.colStatus'), t('receiptConfirm.colDate'), t('common.actions')].map((h: any, i: number) => (
                    <th key={`${h}-${i}`} className={`px-3 py-0.5 text-left text-[10px] font-semibold uppercase tracking-wider font-['Montserrat'] ${textMuted} ${i === 0 ? `w-8 sticky left-0 z-10 ${'bg-gray-50'}` : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((receipt: any, idx: any) => {
                  const sc = RECEIPT_STATUS[receipt.status] || RECEIPT_STATUS.PENDING;
                  const isExpanded = expandedReceiptId === receipt.id;
                  return (
                    <Fragment key={receipt.id || idx}>
                      <tr
                        className={`border-b ${border} transition-colors cursor-pointer ${isExpanded ? ('bg-[rgba(215,183,151,0.06)]') : ('hover:bg-gray-50')}`}
                        onClick={() => setExpandedReceiptId(isExpanded ? null : receipt.id)}
                      >
                        <td className={`px-3 py-0.5 sticky left-0 z-10 ${'bg-white'}`}>
                          <ChevronRight size={14} className={`transition-transform ${isExpanded ? 'rotate-90' : ''} ${'text-[#6B4D30]'}`} />
                        </td>
                        <td className="px-3 py-0.5"><span className={`text-sm font-semibold font-['JetBrains_Mono'] ${textPrimary}`}>{receipt.receiptNumber}</span></td>
                        <td className="px-3 py-0.5"><span className={`text-sm font-['JetBrains_Mono'] ${textSecondary}`}>{receipt.poReference}</span></td>
                        <td className="px-3 py-0.5"><span className={`text-sm font-['Montserrat'] ${textPrimary}`}>{receipt.brandName}</span></td>
                        <td className="px-3 py-0.5"><span className={`text-sm font-['JetBrains_Mono'] ${textPrimary}`}>{receipt.itemCount || receipt.products?.length || 0}</span></td>
                        <td className="px-3 py-0.5">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold font-['JetBrains_Mono']" style={{ color: sc.color, backgroundColor: sc.bg }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sc.color }} />
                            {sc.label}
                          </span>
                        </td>
                        <td className="px-3 py-0.5">
                          <span className={`text-xs font-['JetBrains_Mono'] ${textMuted}`}>
                            {receipt.receivedDate ? new Date(receipt.receivedDate).toLocaleDateString('vi-VN') : receipt.createdAt ? new Date(receipt.createdAt).toLocaleDateString('vi-VN') : '-'}
                          </span>
                        </td>
                        <td className="px-3 py-0.5" onClick={(e) => e.stopPropagation()}>
                          {receipt.status === 'PENDING' && (
                            <div className="flex items-center gap-2">
                              <button onClick={() => { setConfirmModal({ receipt, action: 'confirm' }); setDiscrepancyNote(''); setEditReceivedQty(receipt.orderedQty); }} className="flex items-center gap-1 px-3 py-0.5 rounded-lg text-xs font-semibold font-['Montserrat'] transition-all bg-[rgba(42,158,106,0.12)] text-[#2A9E6A] hover:bg-[rgba(42,158,106,0.2)]">
                                <CheckCircle size={13} /> {t('common.confirm')}
                              </button>
                              <button onClick={() => { setConfirmModal({ receipt, action: 'discrepancy' }); setDiscrepancyNote(''); }} className="flex items-center gap-1 px-3 py-0.5 rounded-lg text-xs font-semibold font-['Montserrat'] transition-all bg-[rgba(248,81,73,0.1)] text-[#F85149] hover:bg-[rgba(248,81,73,0.18)]">
                                <AlertCircle size={13} /> {t('receiptConfirm.flag')}
                              </button>
                            </div>
                          )}
                          {receipt.status === 'CONFIRMED' && <span className={`text-xs font-['Montserrat'] ${'text-green-600'}`}><CheckCircle size={14} className="inline mr-1" />{t('receiptConfirm.verified')}</span>}
                          {receipt.status === 'DISCREPANCY' && <span className={`text-xs font-['Montserrat'] ${'text-red-600'}`}><AlertCircle size={14} className="inline mr-1" />{t('receiptConfirm.underReview')}</span>}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={8} className="p-0">
                            <ReceiptDetailPanel receipt={receipt} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className={`w-full max-w-md mx-4 rounded-2xl border ${border} ${cardBg} shadow-2xl`}>
            <div className={`p-5 border-b ${border}`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-lg font-bold font-['Montserrat'] ${textPrimary}`}>
                  {confirmModal.action === 'confirm' ? t('receiptConfirm.confirmReceipt') : t('receiptConfirm.flagDiscrepancy')}
                </h3>
                <button onClick={() => setConfirmModal(null)} className={`p-1.5 rounded-lg ${'hover:bg-gray-100'}`}><X size={18} className={textMuted} /></button>
              </div>
            </div>
            <div className="p-5">
              <div className={`rounded-xl border ${border} p-4 ${'bg-gray-50'}`}>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className={`text-xs ${textMuted}`}>{t('receiptConfirm.colReceipt')}</span><span className={`text-sm font-semibold font-['JetBrains_Mono'] ${textPrimary}`}>{confirmModal.receipt.receiptNumber}</span></div>
                  <div className="flex justify-between"><span className={`text-xs ${textMuted}`}>{t('receiptConfirm.colPORef')}</span><span className={`text-sm font-['JetBrains_Mono'] ${textSecondary}`}>{confirmModal.receipt.poReference}</span></div>
                  <div className="flex justify-between"><span className={`text-xs ${textMuted}`}>{t('receiptConfirm.colBrand')}</span><span className={`text-sm font-['Montserrat'] ${textPrimary}`}>{confirmModal.receipt.brandName}</span></div>
                </div>
              </div>
              {confirmModal.action === 'confirm' && (
                <div className="mt-4">
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${textMuted}`}>{t('receiptConfirm.receivedQuantity') || 'Received Quantity'}</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      max={confirmModal.receipt.orderedQty * 2}
                      value={editReceivedQty}
                      onChange={(e: any) => setEditReceivedQty(Math.max(0, parseInt(e.target.value) || 0))}
                      className={`w-28 px-3 py-2 rounded-xl border ${border} ${'bg-gray-50'} text-sm font-semibold font-['JetBrains_Mono'] ${textPrimary} outline-none focus:border-[#D7B797] text-center`}
                    />
                    <span className={`text-xs ${textMuted}`}>/ {confirmModal.receipt.orderedQty} {t('receiptConfirm.ordered') || 'ordered'}</span>
                    {editReceivedQty !== confirmModal.receipt.orderedQty && (
                      <span className="text-xs text-[#F85149] font-medium">
                        {editReceivedQty < confirmModal.receipt.orderedQty
                          ? `(-${confirmModal.receipt.orderedQty - editReceivedQty})`
                          : `(+${editReceivedQty - confirmModal.receipt.orderedQty})`}
                      </span>
                    )}
                  </div>
                </div>
              )}
              {confirmModal.action === 'discrepancy' && (
                <div className="mt-4">
                  <label className={`block text-xs font-semibold uppercase tracking-wider mb-2 ${textMuted}`}>{t('receiptConfirm.discrepancyNote')}</label>
                  <textarea value={discrepancyNote} onChange={(e: any) => setDiscrepancyNote(e.target.value)} rows={3} className={`w-full px-3 py-0.5 rounded-xl border ${border} ${'bg-gray-50'} text-sm font-['Montserrat'] ${textPrimary} outline-none resize-none focus:border-[#D7B797]`} placeholder={t('receiptConfirm.discrepancyPlaceholder')} />
                </div>
              )}
            </div>
            <div className={`p-5 border-t ${border} flex justify-end gap-3`}>
              <button onClick={() => setConfirmModal(null)} className={`px-4 py-0.5 rounded-xl border ${border} text-sm font-medium font-['Montserrat'] ${textSecondary} transition-all ${'hover:bg-gray-100'}`}>{t('common.back')}</button>
              <button
                onClick={() => confirmModal.action === 'confirm' ? handleConfirmReceipt(confirmModal.receipt) : handleFlagDiscrepancy(confirmModal.receipt)}
                disabled={processing || (confirmModal.action === 'discrepancy' && !discrepancyNote.trim())}
                className={`px-5 py-0.5 rounded-xl text-sm font-semibold font-['Montserrat'] transition-all disabled:opacity-50 ${confirmModal.action === 'confirm' ? 'bg-[#2A9E6A] text-white hover:bg-[#238a5a]' : 'bg-[#F85149] text-white hover:bg-[#e04440]'}`}
              >
                {processing ? <Loader2 size={16} className="animate-spin mx-auto" /> : confirmModal.action === 'confirm' ? t('common.confirm') : t('receiptConfirm.submitFlag')}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>{/* close content padding wrapper */}
    </div>
  );
};

export default ReceiptConfirmationScreen;
