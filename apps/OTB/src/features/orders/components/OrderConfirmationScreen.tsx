'use client';

import React, { useState, useEffect, useMemo, useCallback, Fragment } from 'react';
import {
  ShoppingCart, CheckCircle, Clock, Loader2, Package,
  Search, ChevronDown, ChevronRight, X, AlertTriangle, FileText,
  DollarSign, Truck, XCircle, Eye, Ruler, Store, Image as ImageIcon,
  ArrowRight, RefreshCw, Filter, BarChart3, Square, CheckSquare, MinusSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import { proposalService, orderService } from '@/services';
import { invalidateCache } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatCurrency } from '@/utils';
import { useIsMobile } from '@/hooks/useIsMobile';
import { PullToRefresh } from '@/components/mobile';

/* ═══════════════════════════════════════════════
   STATUS CONFIG
═══════════════════════════════════════════════ */
const ORDER_STATUS: any = {
  PENDING: { color: '#D29922', bg: 'rgba(210,153,34,0.12)', label: 'Pending', icon: Clock },
  CONFIRMED: { color: '#2A9E6A', bg: 'rgba(42,158,106,0.12)', label: 'Confirmed', icon: CheckCircle },
  SHIPPED: { color: '#58A6FF', bg: 'rgba(88,166,255,0.12)', label: 'Shipped', icon: Truck },
  CANCELLED: { color: '#F85149', bg: 'rgba(248,81,73,0.12)', label: 'Cancelled', icon: XCircle },
  PARTIAL: { color: '#A371F7', bg: 'rgba(163,113,247,0.12)', label: 'Partial', icon: Package }};

/* ═══════════════════════════════════════════════
   STATUS PIPELINE COMPONENT
═══════════════════════════════════════════════ */
const StatusPipeline = ({ stats, statusFilter, setStatusFilter }: any) => {
  const { t } = useLanguage();
  const steps = [
    { key: 'PENDING', label: t('orderConfirm.statusPending'), count: stats.pending, value: stats.pendingValue, color: '#D29922', icon: Clock },
    { key: 'CONFIRMED', label: t('orderConfirm.statusConfirmed'), count: stats.confirmed, value: stats.confirmedValue, color: '#2A9E6A', icon: CheckCircle },
    { key: 'SHIPPED', label: t('orderConfirm.statusShipped'), count: stats.shipped, value: 0, color: '#58A6FF', icon: Truck },
    { key: 'CANCELLED', label: t('orderConfirm.statusCancelled'), count: stats.cancelled, value: 0, color: '#F85149', icon: XCircle },
  ];

  return (
    <div className="flex items-stretch gap-1">
      {steps.map((step, idx) => {
        const Icon = step.icon;
        const isActive = statusFilter === step.key;
        const isAll = statusFilter === 'all';
        return (
          <button
            key={step.key}
            onClick={() => setStatusFilter(isActive ? 'all' : step.key)}
            className={`flex-1 relative rounded-xl border px-3 py-2.5 transition-all duration-200 group ${
              isActive
                ?'border-[#D7B797]/60 bg-[rgba(215,183,151,0.08)]':'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ backgroundColor: `${step.color}18` }}
              >
                <Icon size={14} style={{ color: step.color }} />
              </div>
              <div className="text-left min-w-0">
                <p className={`text-[10px] font-medium uppercase tracking-wider font-['Montserrat'] ${'text-gray-500'}`}>
                  {step.label}
                </p>
                <p className={`text-base font-bold font-['JetBrains_Mono'] leading-tight ${'text-gray-900'}`}>
                  {step.count}
                </p>
              </div>
            </div>
            {isActive && (
              <div className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full" style={{ backgroundColor: step.color }} />
            )}
          </button>
        );
      })}
    </div>
  );
};

/* ═══════════════════════════════════════════════
   ORDER DETAIL PANEL (expandable)
═══════════════════════════════════════════════ */
const OrderDetailPanel = ({ order }: any) => {
  const [expandedSku, setExpandedSku] = useState<string | null>(null);
  const products = order.products || [];

  const border ='border-gray-200';
  const textPrimary ='text-gray-900';
  const textMuted ='text-gray-500';

  if (products.length === 0) {
    return (
      <div className={`px-4 py-8 border-t ${border} ${'bg-[#FAFAF8]'}`}>
        <div className="flex flex-col items-center justify-center">
          <Package size={24} className={textMuted} />
          <p className={`text-xs mt-2 font-['Montserrat'] ${textMuted}`}>No products in this order</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`px-4 py-3 border-t ${border} ${'bg-[#FAFAF8]'}`}>
      <div className="space-y-1.5">
        {products.map((item: any, idx: number) => {
          const isExpanded = expandedSku === (item.sku || `sku-${idx}`);
          const totalQty = (item.rex || 0) + (item.ttp || 0);
          const ttlValue = totalQty * (item.srp || 0);

          return (
            <div key={item.sku || idx} className={`rounded-xl border overflow-hidden transition-all ${'border-gray-200 bg-white'} ${isExpanded ? 'shadow-sm' : ''}`}>
              {/* SKU Header */}
              <div
                className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors ${'hover:bg-gray-50'}`}
                onClick={() => setExpandedSku(isExpanded ? null : (item.sku || `sku-${idx}`))}
              >
                <ChevronRight size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''} ${'text-[#8B6914]'}`} />
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 ${'bg-gray-50 border-gray-200'}`}>
                  <ImageIcon size={14} className={textMuted} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-semibold font-['Montserrat'] truncate ${textPrimary}`}>
                    <span className={`font-['JetBrains_Mono'] ${'text-[#8B6914]'}`}>{item.sku}</span>
                    <span className={`mx-1.5 ${textMuted}`}>/</span>
                    {item.name}
                  </div>
                  <div className={`text-[10px] mt-0.5 flex items-center gap-1.5 ${textMuted}`}>
                    <span className="inline-flex items-center gap-1">
                      <span className={`w-1 h-1 rounded-full ${item.gender === 'Women' ? 'bg-pink-400' : 'bg-blue-400'}`} />
                      {item.gender}
                    </span>
                    <span>·</span>
                    <span>{item.productType}</span>
                    <span>·</span>
                    <span>{item.color}</span>
                  </div>
                </div>
                <div className="flex items-center gap-5 shrink-0">
                  <div className="text-right">
                    <div className={`text-[10px] ${textMuted}`}>REX / TTP</div>
                    <div className={`text-xs font-semibold font-['JetBrains_Mono'] ${textPrimary}`}>{item.rex} / {item.ttp}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-[10px] ${textMuted}`}>Total</div>
                    <div className={`text-xs font-bold font-['JetBrains_Mono'] ${'text-[#8B6914]'}`}>{formatCurrency(ttlValue)}</div>
                  </div>
                </div>
              </div>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className={`px-3.5 pb-3 space-y-2.5 border-t ${border}`}>
                  {/* Product Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5">
                    {[
                      { label: 'Composition', value: item.composition || '-' },
                      { label: 'SRP', value: formatCurrency(item.srp || 0), mono: true },
                      { label: 'Total Qty', value: totalQty, mono: true },
                      { label: 'TTL Value', value: formatCurrency(ttlValue), mono: true, accent: true },
                    ].map(d => (
                      <div key={d.label} className={`rounded-lg border px-3 py-2 ${'bg-gray-50 border-gray-200'}`}>
                        <p className={`text-[10px] uppercase tracking-wide ${textMuted}`}>{d.label}</p>
                        <p className={`text-xs font-semibold mt-0.5 ${d.mono ? "font-['JetBrains_Mono']" : ''} ${d.accent ? ('text-[#8B6914]') : textPrimary}`}>{d.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Store x Size Allocation Grid */}
                  {(() => {
                    const sizes = item.sizes || {};
                    const sizeKeys = Object.keys(sizes);
                    const storeRows = [
                      { key: 'rex', label: 'REX', color: '#D7B797', qty: item.rex || 0 },
                      { key: 'ttp', label: 'TTP', color: '#127749', qty: item.ttp || 0 },
                    ];
                    return (
                      <div className={`rounded-xl border overflow-hidden ${'border-gray-200'}`}>
                        <div className={`px-3.5 py-1.5 text-xs font-semibold border-b font-['Montserrat'] ${'text-gray-600 bg-gray-50 border-gray-200'}`}>
                          Store × Size Allocation
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className={'bg-[rgba(160,120,75,0.08)] text-[#666666]'}>
                                <th className="px-3.5 py-1.5 text-left">Store</th>
                                {sizeKeys.length > 0
                                  ? sizeKeys.map(s => <th key={s} className="px-2 py-1.5 text-center font-['JetBrains_Mono']">{s}</th>)
                                  : <th className="px-2 py-1.5 text-center font-['JetBrains_Mono']">-</th>
                                }
                                <th className="px-3 py-1.5 text-center font-['JetBrains_Mono']">TTL Qty</th>
                                <th className="px-3.5 py-1.5 text-right font-['JetBrains_Mono']">Value</th>
                              </tr>
                            </thead>
                            <tbody>
                              {storeRows.map((store) => (
                                <tr key={store.key} className={`border-t ${'border-gray-100'}`}>
                                  <td className={`px-3.5 py-1.5 ${textPrimary}`}>
                                    <span className="inline-flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: store.color }} />{store.label}
                                    </span>
                                  </td>
                                  {sizeKeys.length > 0
                                    ? sizeKeys.map(s => {
                                        const sizeQty = Math.round(store.qty * (sizes[s]?.salesMix || 0) / 100);
                                        return <td key={s} className={`px-2 py-1.5 text-center font-['JetBrains_Mono'] ${textPrimary}`}>{sizeQty}</td>;
                                      })
                                    : <td className={`px-2 py-1.5 text-center font-['JetBrains_Mono'] ${textPrimary}`}>{store.qty}</td>
                                  }
                                  <td className={`px-3 py-1.5 text-center font-semibold font-['JetBrains_Mono'] ${textPrimary}`}>{store.qty}</td>
                                  <td className={`px-3.5 py-1.5 text-right font-['JetBrains_Mono'] ${textPrimary}`}>{formatCurrency(store.qty * (item.srp || 0))}</td>
                                </tr>
                              ))}
                              <tr className={`border-t-2 ${'border-[#D7B797]/30 bg-[rgba(160,120,75,0.04)]'}`}>
                                <td className={`px-3.5 py-1.5 font-semibold ${'text-[#8B6914]'}`}>Total</td>
                                {sizeKeys.length > 0
                                  ? sizeKeys.map(s => {
                                      const totalSizeQty = storeRows.reduce((sum, st) => sum + Math.round(st.qty * (sizes[s]?.salesMix || 0) / 100), 0);
                                      return <td key={s} className={`px-2 py-1.5 text-center font-bold font-['JetBrains_Mono'] ${textPrimary}`}>{totalSizeQty}</td>;
                                    })
                                  : <td className={`px-2 py-1.5 text-center font-bold font-['JetBrains_Mono'] ${textPrimary}`}>{totalQty}</td>
                                }
                                <td className={`px-3 py-1.5 text-center font-bold font-['JetBrains_Mono'] ${textPrimary}`}>{totalQty}</td>
                                <td className={`px-3.5 py-1.5 text-right font-bold font-['JetBrains_Mono'] ${textPrimary}`}>{formatCurrency(ttlValue)}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Sizing Table */}
                  {(() => {
                    const sizes = item.sizes || {};
                    const sizeKeys = Object.keys(sizes);
                    if (sizeKeys.length === 0) return null;
                    return (
                      <div className={`rounded-xl border overflow-hidden ${'border-gray-200'}`}>
                        <div className={`px-3.5 py-1.5 text-xs font-semibold border-b font-['Montserrat'] ${'text-gray-600 bg-gray-50 border-gray-200'}`}>
                          Sizing — {item.productType}
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className={'bg-[rgba(160,120,75,0.08)] text-[#666666]'}>
                                <th className="px-3.5 py-1.5 text-left">{item.productType}</th>
                                {sizeKeys.map(s => <th key={s} className="px-3 py-1.5 text-center font-['JetBrains_Mono']">{s}</th>)}
                                <th className="px-3 py-1.5 text-center">Sum</th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className={`border-t ${'border-gray-100'}`}>
                                <td className={`px-3.5 py-1.5 ${'text-gray-700'}`}>% Sales mix</td>
                                {sizeKeys.map(s => (
                                  <td key={s} className={`px-3 py-1.5 text-center font-['JetBrains_Mono'] ${'text-gray-600'}`}>{sizes[s].salesMix}%</td>
                                ))}
                                <td className={`px-3 py-1.5 text-center font-semibold font-['JetBrains_Mono'] ${'text-gray-800'}`}>100%</td>
                              </tr>
                              <tr className={`border-t ${'border-gray-100'}`}>
                                <td className={`px-3.5 py-1.5 ${'text-gray-700'}`}>% ST</td>
                                {sizeKeys.map(s => (
                                  <td key={s} className={`px-3 py-1.5 text-center font-['JetBrains_Mono'] ${'text-gray-600'}`}>{sizes[s].st}%</td>
                                ))}
                                <td className={`px-3 py-1.5 text-center ${'text-gray-500'}`}>-</td>
                              </tr>
                              <tr className={`border-t ${'border-gray-200 bg-[rgba(160,120,75,0.06)]'}`}>
                                <td className={`px-3.5 py-1.5 font-semibold ${'text-[#8B6914]'}`}>Qty</td>
                                {sizeKeys.map(s => {
                                  const qty = Math.round(totalQty * sizes[s].salesMix / 100);
                                  return <td key={s} className={`px-3 py-1.5 text-center font-['JetBrains_Mono'] font-semibold ${'text-gray-800'}`}>{qty}</td>;
                                })}
                                <td className={`px-3 py-1.5 text-center font-bold font-['JetBrains_Mono'] ${'text-gray-800'}`}>{totalQty}</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
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
const OrderConfirmationScreen = ({  }: any) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confirmModal, setConfirmModal] = useState<any>(null);
  const [processing, setProcessing] = useState<boolean>(false);
  const [expandedOrderId, setExpandedOrderId] = useState<any>(null);
  // Track order statuses locally (confirmed/cancelled via API)
  const [orderStatuses, setOrderStatuses] = useState<Record<string, string>>({});
  // UX-25: Bulk confirm state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Remove parent scroll container padding so sticky toolbar is flush with header
  useEffect(() => {
    const el = document.getElementById('main-scroll');
    if (el) { el.style.padding = '0'; }
    return () => { if (el) el.style.padding = ''; };
  }, []);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const proposals = await proposalService.getAll({ status: 'APPROVED' });
      const data = Array.isArray(proposals) ? proposals : [];
      const mapped = data.map((p: any, idx: any) => ({
        id: p.id || idx + 1,
        poNumber: p.proposalCode ? `PO-${p.proposalCode.replace('PROP-', '')}` : `PO-${String(idx + 1).padStart(5, '0')}`,
        brandName: p.budget?.groupBrand?.name || p.brand?.name || p.brandName || '-',
        season: p.seasonGroup || p.season || '-',
        skuCount: p.products?.length || p.items?.length || p.skuCount || 0,
        totalValue: Number(p.totalValue || p.amount || 0),
        status: orderStatuses[p.id] || p.orderStatus?.toUpperCase() || 'PENDING',
        createdAt: p.updatedAt || p.createdAt || new Date().toISOString(),
        proposalId: p.id,
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
          sizes: prod.sizes || null}))}));
      setOrders(mapped);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      setError(t('orderConfirm.failedToLoad'));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrder = async (order: any) => {
    setProcessing(true);
    try {
      await orderService.confirmOrder(order.id);
      setOrderStatuses(prev => ({ ...prev, [order.id]: 'CONFIRMED' }));
      invalidateCache('/orders');
      invalidateCache('/proposals');
      toast.success(t('orderConfirm.orderConfirmed'));
      fetchOrders();
    } catch (err: any) {
      console.error('Failed to confirm order:', err);
      toast.error(err.response?.data?.message || t('orderConfirm.confirmFailed'));
    } finally {
      setProcessing(false);
      setConfirmModal(null);
    }
  };

  const handleCancelOrder = async (order: any) => {
    setProcessing(true);
    try {
      await orderService.cancelOrder(order.id);
      setOrderStatuses(prev => ({ ...prev, [order.id]: 'CANCELLED' }));
      invalidateCache('/orders');
      invalidateCache('/proposals');
      toast.success(t('orderConfirm.orderCancelled'));
      fetchOrders();
    } catch (err: any) {
      console.error('Failed to cancel order:', err);
      toast.error(err.response?.data?.message || t('orderConfirm.cancelFailed'));
    } finally {
      setProcessing(false);
      setConfirmModal(null);
    }
  };

  const filtered = useMemo(() => {
    return orders.filter((order: any) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          (order.poNumber || '').toLowerCase().includes(term) ||
          (order.brandName || '').toLowerCase().includes(term)
        );
      }
      return true;
    });
  }, [orders, statusFilter, searchTerm]);

  const stats = useMemo(() => {
    const total = orders.length;
    const pending = orders.filter((o: any) => o.status === 'PENDING').length;
    const confirmed = orders.filter((o: any) => o.status === 'CONFIRMED').length;
    const shipped = orders.filter((o: any) => o.status === 'SHIPPED').length;
    const cancelled = orders.filter((o: any) => o.status === 'CANCELLED').length;
    const totalValue = orders.reduce((sum: any, o: any) => sum + (o.totalValue || 0), 0);
    const confirmedValue = orders.filter((o: any) => o.status === 'CONFIRMED').reduce((sum: any, o: any) => sum + (o.totalValue || 0), 0);
    const pendingValue = orders.filter((o: any) => o.status === 'PENDING').reduce((sum: any, o: any) => sum + (o.totalValue || 0), 0);

    return { total, pending, confirmed, shipped, cancelled, totalValue, confirmedValue, pendingValue };
  }, [orders]);

  // UX-25: Bulk confirm helpers
  const pendingFiltered = useMemo(() => filtered.filter((o: any) => o.status === 'PENDING'), [filtered]);

  useEffect(() => { setSelectedIds(new Set()); }, [statusFilter, searchTerm, orders]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      if (prev.size === pendingFiltered.length && pendingFiltered.length > 0) return new Set();
      return new Set(pendingFiltered.map((o: any) => o.id));
    });
  }, [pendingFiltered]);

  const handleBulkConfirm = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkProcessing(true);
    let ok = 0, fail = 0;
    for (const id of selectedIds) {
      try {
        await orderService.confirmOrder(id);
        setOrderStatuses(prev => ({ ...prev, [id as string]: 'CONFIRMED' }));
        ok++;
      } catch { fail++; }
    }
    setBulkProcessing(false);
    setSelectedIds(new Set());
    invalidateCache('/orders');
    invalidateCache('/proposals');
    if (ok > 0) toast.success(`${ok} ${t('orderConfirm.itemsConfirmed')}`);
    if (fail > 0) toast.error(`${fail} ${t('orderConfirm.confirmFailed')}`);
    fetchOrders();
  }, [selectedIds, t]);

  const border ='border-gray-200';
  const textPrimary ='text-gray-900';
  const textSecondary ='text-gray-600';
  const textMuted ='text-gray-500';

  return (
    <div className={`min-h-full ${'bg-[#F8F7F4]'}`}>
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
                {t('orderConfirm.totalValue')}
              </p>
              <p className={`text-lg md:text-xl font-bold font-['JetBrains_Mono'] leading-tight ${'text-[#8B6914]'}`}>
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
            <div className={`hidden md:block w-px h-7 ${'bg-gray-300'}`} />
            <div className="hidden md:flex items-center gap-4">
              <div>
                <p className={`text-[10px] font-medium uppercase tracking-wider font-['Montserrat'] ${textMuted}`}>{t('orderConfirm.totalOrders')}</p>
                <p className={`text-sm font-bold font-['JetBrains_Mono'] leading-tight ${textPrimary}`}>{stats.total}</p>
              </div>
              <div>
                <p className={`text-[10px] font-medium uppercase tracking-wider font-['Montserrat'] ${textMuted}`}>SKUs</p>
                <p className={`text-sm font-bold font-['JetBrains_Mono'] leading-tight ${textPrimary}`}>
                  {orders.reduce((sum: any, o: any) => sum + (o.skuCount || o.products?.length || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border ${border} ${'bg-white'} ${isMobile ? 'w-36' : 'w-52'}`}>
              <Search size={13} className={textMuted} />
              <input
                type="text"
                placeholder={t('orderConfirm.searchPlaceholder')}
                value={searchTerm}
                onChange={(e: any) => setSearchTerm(e.target.value)}
                className={`bg-transparent outline-none text-xs w-full font-['Montserrat'] ${textPrimary} placeholder:${textMuted}`}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} aria-label="Clear search">
                  <X size={12} className={textMuted} />
                </button>
              )}
            </div>
            <button
              onClick={fetchOrders}
              className={`p-1.5 rounded-lg border ${border} transition-all ${'hover:bg-gray-50 text-gray-500'}`}
              title={t('common.refresh')}
              aria-label="Refresh orders"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Status Pipeline */}
        <StatusPipeline stats={stats} statusFilter={statusFilter} setStatusFilter={setStatusFilter} />
      </div>

      {/* ── Content with padding ── */}
      <div className="px-3 md:px-6 pb-3 md:pb-6">
      {/* ── Orders Table / List ── */}
      <div className={`border ${border} rounded-2xl overflow-hidden mt-3`} style={{
          background:'linear-gradient(180deg, #ffffff 0%, #FDFCFA 100%)'}}>
          {/* Table header with count */}
          <div className={`px-4 py-2.5 flex items-center justify-between border-b ${border}`}>
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className={'text-[#8B6914]'} />
              <span className={`text-xs font-semibold font-['Montserrat'] ${textPrimary}`}>
                {statusFilter === 'all' ? t('orderConfirm.allPurchaseOrders') : ORDER_STATUS[statusFilter]?.label}
              </span>
              <span className={`text-[10px] font-['JetBrains_Mono'] px-1.5 py-0.5 rounded ${'bg-gray-100 text-gray-600'}`}>
                {filtered.length}
              </span>
            </div>
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className={`text-[10px] font-medium font-['Montserrat'] px-2 py-1 rounded-md transition-colors ${'text-gray-500 hover:bg-gray-100'}`}
              >
                {t('orderConfirm.allStatuses')} ×
              </button>
            )}
          </div>

          {/* UX-25: Bulk action toolbar */}
          {selectedIds.size > 0 && (
            <div className={`px-4 py-2 flex items-center gap-2 border-b ${border} ${'bg-gray-50'}`}>
              <span className={`text-xs font-semibold font-['Montserrat'] ${textPrimary}`}>
                {selectedIds.size} {t('orderConfirm.itemsSelected')}
              </span>
              <div className="flex items-center gap-2 ml-auto">
                <button
                  disabled={bulkProcessing}
                  onClick={handleBulkConfirm}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-['Montserrat'] text-white bg-[#2A9E6A] hover:bg-[#238c5c] transition-colors disabled:opacity-50"
                >
                  {bulkProcessing ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                  {t('orderConfirm.confirmSelected')}
                </button>
                <button
                  disabled={bulkProcessing}
                  onClick={() => setSelectedIds(new Set())}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${border} text-xs font-medium font-['Montserrat'] ${'text-gray-600 hover:bg-gray-100'} disabled:opacity-50`}
                >
                  <X size={13} />
                  {t('orderConfirm.deselectAll')}
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 size={28} className={`animate-spin ${'text-[#8B6914]'}`} />
              <p className={`text-sm mt-3 font-['Montserrat'] ${textSecondary}`}>{t('orderConfirm.loadingOrders')}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 rounded-full bg-[rgba(248,81,73,0.1)] flex items-center justify-center mb-3">
                <AlertTriangle size={24} className="text-[#F85149]" />
              </div>
              <p className={`text-sm font-['Montserrat'] ${textSecondary}`}>{error}</p>
              <button onClick={fetchOrders} className="mt-4 px-5 py-2 rounded-xl bg-[#D7B797] text-[#1A1A1A] text-xs font-semibold font-['Montserrat'] hover:bg-[#C5A585] transition-colors">
                {t('common.tryAgain')}
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${'bg-gray-100'}`}>
                <Package size={32} className={textMuted} />
              </div>
              <p className={`text-sm font-semibold font-['Montserrat'] ${textPrimary}`}>{t('orderConfirm.noOrders')}</p>
              <p className={`text-xs mt-1 max-w-xs text-center ${textSecondary}`}>{t('orderConfirm.noOrdersDesc')}</p>
            </div>
          ) : isMobile ? (
            /* ── Mobile Cards ── */
            <PullToRefresh onRefresh={fetchOrders}>
            <div className="p-3 space-y-2">
              {pendingFiltered.length > 0 && (
                <button onClick={toggleSelectAll} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium font-['Montserrat'] ${'text-[#6B4D30]'}`}>
                  {selectedIds.size === pendingFiltered.length && pendingFiltered.length > 0
                    ? <CheckSquare size={16} className={'text-[#6B4D30]'} />
                    : selectedIds.size > 0
                      ? <MinusSquare size={16} className={'text-[#6B4D30]'} />
                      : <Square size={16} />}
                  {t('orderConfirm.selectAll')}
                </button>
              )}
              {filtered.map((order: any, idx: any) => {
                const sc = ORDER_STATUS[order.status] || ORDER_STATUS.PENDING;
                const StatusIcon = sc.icon;
                const isExpanded = expandedOrderId === order.id;
                return (
                  <div key={order.id || idx}>
                    <div
                      className={`rounded-xl border overflow-hidden transition-all ${border} ${
                        isExpanded
                          ?'bg-[rgba(215,183,151,0.04)]':'bg-white'}`}
                    >
                      <div
                        className="px-3.5 py-3 cursor-pointer"
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <ChevronRight size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''} ${'text-[#8B6914]'}`} />
                            <span className={`text-sm font-bold font-['JetBrains_Mono'] ${textPrimary}`}>{order.poNumber}</span>
                          </div>
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold font-['JetBrains_Mono']"
                            style={{ color: sc.color, backgroundColor: sc.bg }}
                          >
                            <StatusIcon size={10} />
                            {sc.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <div>
                            <p className={`text-[10px] ${textMuted}`}>{t('orderConfirm.colBrand')}</p>
                            <p className={`text-xs font-medium ${textPrimary}`}>{order.brandName}</p>
                          </div>
                          <div>
                            <p className={`text-[10px] ${textMuted}`}>{t('orderConfirm.colSKUs')}</p>
                            <p className={`text-xs font-semibold font-['JetBrains_Mono'] ${textPrimary}`}>{order.skuCount || order.products?.length || 0}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-[10px] ${textMuted}`}>{t('orderConfirm.colValue')}</p>
                            <p className={`text-xs font-bold font-['JetBrains_Mono'] ${'text-[#8B6914]'}`}>{formatCurrency(order.totalValue)}</p>
                          </div>
                        </div>

                        {order.status === 'PENDING' && (
                          <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setConfirmModal({ order, action: 'confirm' })}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold font-['Montserrat'] bg-[rgba(42,158,106,0.12)] text-[#2A9E6A] active:bg-[rgba(42,158,106,0.2)]"
                            >
                              <CheckCircle size={13} /> {t('common.confirm')}
                            </button>
                            <button
                              onClick={() => setConfirmModal({ order, action: 'cancel' })}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold font-['Montserrat'] bg-[rgba(248,81,73,0.1)] text-[#F85149] active:bg-[rgba(248,81,73,0.18)]"
                            >
                              <XCircle size={13} /> {t('common.cancel')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {isExpanded && <OrderDetailPanel order={order} />}
                  </div>
                );
              })}
            </div>
            </PullToRefresh>
          ) : (
            /* ── Desktop Table ── */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`${'bg-[#FAF9F6]'} border-b ${border}`}>
                    {['', t('orderConfirm.colPO'), t('orderConfirm.colBrand'), t('orderConfirm.colSeason'), t('orderConfirm.colSKUs'), t('orderConfirm.colValue'), t('orderConfirm.colStatus'), t('orderConfirm.colDate'), t('common.actions')].map((h: any, i: number) => (
                      <th key={`${h}-${i}`} className={`px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider font-['Montserrat'] ${textMuted} ${i === 0 ? `w-8 sticky left-0 z-10 ${'bg-[#FAF9F6]'}` : ''}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order: any, idx: any) => {
                    const sc = ORDER_STATUS[order.status] || ORDER_STATUS.PENDING;
                    const StatusIcon = sc.icon;
                    const isExpanded = expandedOrderId === order.id;
                    return (
                      <Fragment key={order.id || idx}>
                        <tr
                          className={`border-b ${border} transition-colors cursor-pointer ${
                            isExpanded
                              ?'bg-[rgba(215,183,151,0.04)]':'hover:bg-[#FAFAF8]'}`}
                          onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        >
                          <td className={`px-4 py-3 sticky left-0 z-10 ${'bg-white'}`}>
                            <ChevronRight size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''} ${'text-[#8B6914]'}`} />
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-bold font-['JetBrains_Mono'] ${textPrimary}`}>{order.poNumber}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-['Montserrat'] font-medium ${textPrimary}`}>{order.brandName}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-['Montserrat'] ${textSecondary}`}>{order.season}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold font-['JetBrains_Mono'] ${'bg-gray-100 text-gray-800'}`}>
                              {order.skuCount || order.products?.length || 0}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-bold font-['JetBrains_Mono'] ${'text-[#8B6914]'}`}>
                              {formatCurrency(order.totalValue)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold font-['JetBrains_Mono']"
                              style={{ color: sc.color, backgroundColor: sc.bg }}
                            >
                              <StatusIcon size={12} />
                              {sc.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs font-['JetBrains_Mono'] ${textMuted}`}>
                              {order.createdAt ? new Date(order.createdAt).toLocaleDateString('vi-VN') : '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            {order.status === 'PENDING' && (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setConfirmModal({ order, action: 'confirm' })}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-['Montserrat'] transition-all bg-[rgba(42,158,106,0.12)] text-[#2A9E6A] hover:bg-[rgba(42,158,106,0.2)]"
                                >
                                  <CheckCircle size={13} /> {t('common.confirm')}
                                </button>
                                <button
                                  onClick={() => setConfirmModal({ order, action: 'cancel' })}
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-['Montserrat'] transition-all bg-[rgba(248,81,73,0.1)] text-[#F85149] hover:bg-[rgba(248,81,73,0.18)]"
                                >
                                  <XCircle size={13} /> {t('common.cancel')}
                                </button>
                              </div>
                            )}
                            {order.status === 'CONFIRMED' && (
                              <span className={`inline-flex items-center gap-1.5 text-xs font-['Montserrat'] ${textSecondary}`}>
                                <Truck size={14} />{t('orderConfirm.readyToShip')}
                              </span>
                            )}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={9} className="p-0">
                              <OrderDetailPanel order={order} />
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

      {/* ── Confirm Modal ── */}
      {confirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setConfirmModal(null)}>
          <div
            className={`w-full max-w-md mx-4 rounded-2xl border ${border} shadow-2xl overflow-hidden ${'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header with color accent */}
            <div className={`px-5 py-4 border-b ${border}`} style={{
              background: confirmModal.action === 'confirm'
                ? 'linear-gradient(135deg, rgba(42,158,106,0.08) 0%, transparent 100%)'
                : 'linear-gradient(135deg, rgba(248,81,73,0.08) 0%, transparent 100%)'}}>
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    backgroundColor: confirmModal.action === 'confirm' ? 'rgba(42,158,106,0.12)' : 'rgba(248,81,73,0.12)'}}
                >
                  {confirmModal.action === 'confirm'
                    ? <CheckCircle size={20} className="text-[#2A9E6A]" />
                    : <XCircle size={20} className="text-[#F85149]" />
                  }
                </div>
                <div>
                  <h3 className={`text-base font-bold font-['Montserrat'] ${textPrimary}`}>
                    {confirmModal.action === 'confirm' ? t('orderConfirm.confirmOrder') : t('orderConfirm.cancelOrder')}
                  </h3>
                  <p className={`text-xs ${textMuted}`}>{confirmModal.order.poNumber}</p>
                </div>
              </div>
            </div>

            <div className="p-5">
              <div className={`rounded-xl border ${border} overflow-hidden`}>
                {[
                  { label: t('orderConfirm.colBrand'), value: confirmModal.order.brandName },
                  { label: t('orderConfirm.colSeason'), value: confirmModal.order.season },
                  { label: t('orderConfirm.colSKUs'), value: confirmModal.order.skuCount || confirmModal.order.products?.length || 0, mono: true },
                  { label: t('orderConfirm.colValue'), value: formatCurrency(confirmModal.order.totalValue), mono: true, accent: true },
                ].map((row, i) => (
                  <div key={row.label} className={`flex items-center justify-between px-4 py-2.5 ${i > 0 ? `border-t ${border}` : ''} ${'bg-gray-50'}`}>
                    <span className={`text-xs ${textMuted}`}>{row.label}</span>
                    <span className={`text-sm font-semibold ${row.mono ? "font-['JetBrains_Mono']" : "font-['Montserrat']"} ${row.accent ? ('text-[#8B6914]') : textPrimary}`}>
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              {confirmModal.action === 'cancel' && (
                <div className={`flex items-start gap-2 mt-4 p-3 rounded-xl ${'bg-red-50'}`}>
                  <AlertTriangle size={14} className="text-[#F85149] mt-0.5 shrink-0" />
                  <p className={`text-xs ${'text-red-600'}`}>
                    {t('orderConfirm.cancelWarning')}
                  </p>
                </div>
              )}
            </div>

            <div className={`px-5 py-4 border-t ${border} flex justify-end gap-3`}>
              <button
                onClick={() => setConfirmModal(null)}
                className={`px-4 py-2 rounded-xl border ${border} text-xs font-medium font-['Montserrat'] ${textSecondary} transition-all ${'hover:bg-gray-100'}`}
              >
                {t('common.back')}
              </button>
              <button
                onClick={() => confirmModal.action === 'confirm' ? handleConfirmOrder(confirmModal.order) : handleCancelOrder(confirmModal.order)}
                disabled={processing}
                className={`px-5 py-2 rounded-xl text-xs font-semibold font-['Montserrat'] transition-all disabled:opacity-50 flex items-center gap-1.5 ${
                  confirmModal.action === 'confirm'
                    ? 'bg-[#2A9E6A] text-white hover:bg-[#238a5a]'
                    : 'bg-[#F85149] text-white hover:bg-[#e04440]'
                }`}
              >
                {processing
                  ? <Loader2 size={14} className="animate-spin" />
                  : confirmModal.action === 'confirm'
                    ? <><CheckCircle size={14} /> {t('common.confirm')}</>
                    : <><XCircle size={14} /> {t('common.cancel')}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
      </div>{/* close content padding wrapper */}
    </div>
  );
};

export default OrderConfirmationScreen;
