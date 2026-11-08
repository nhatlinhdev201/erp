'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown, Package, Pencil, X, Plus, Trash2, Ruler, Clock, Users,
  Layers, Check, LayoutGrid, List, SlidersHorizontal, Download, Send, Tag, Star, Sparkles,
  AlertTriangle, ArrowRight, Save, FilePlus, FileText
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils';
import { budgetService, masterDataService, proposalService, planningService } from '@/services';
import { useConfirmDialog } from '@/hooks/useConfirmDialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppContext } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useSmartScrollState } from '@/hooks/useSmartScrollState';
import { FilterBottomSheet, useBottomSheet } from '@/components/mobile';
import { ProductImage, ConfirmDialog, FilterSelect } from '@/components/ui';
import CreatableSelect from '@/components/ui/CreatableSelect';
import AddSKUModal from './AddSKUModal';

// Season groups & seasons are now loaded from API (masterDataService.getSeasonGroups)

// L-ERP Design System card backgrounds - warm gold tints
const CARD_BG_CLASSES = [
  { light: 'bg-[rgba(160,120,75,0.12)] border-[rgba(215,183,151,0.3)]', dark: 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.2)]' },
  { light: 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.35)]', dark: 'bg-[rgba(215,183,151,0.1)] border-[rgba(215,183,151,0.25)]' },
  { light: 'bg-[rgba(18,119,73,0.08)] border-[rgba(18,119,73,0.2)]', dark: 'bg-[rgba(42,158,106,0.1)] border-[rgba(42,158,106,0.25)]' },
  { light: 'bg-[rgba(215,183,151,0.12)] border-[rgba(215,183,151,0.32)]', dark: 'bg-[rgba(215,183,151,0.06)] border-[rgba(215,183,151,0.18)]' },
  { light: 'bg-[rgba(18,119,73,0.06)] border-[rgba(18,119,73,0.18)]', dark: 'bg-[rgba(42,158,106,0.08)] border-[rgba(42,158,106,0.2)]' },
  { light: 'bg-[rgba(215,183,151,0.08)] border-[rgba(215,183,151,0.25)]', dark: 'bg-[rgba(215,183,151,0.05)] border-[rgba(215,183,151,0.15)]' }
];

const DEFAULT_SIZE_KEYS = ['s0002', 's0004', 's0006', 's0008'] as const;
const EMPTY_SIZE_DATA: Record<string, number> = { s0002: 0, s0004: 0, s0006: 0, s0008: 0 };

// Build block key including brandId for per-brand section support
const buildBlockKey = (block: any) =>
  `${block.brandId || 'all'}_${block.gender}_${block.category}_${block.subCategory}`;

// Extract brand ID from a proposal header (handles both Prisma & transformed formats)
const extractBrandId = (p: any): string => {
  // Primary: from allocate_header linkage
  const fromHeader = p.allocate_header?.brand_id || p.allocateHeader?.brandId || p.brandId;
  if (fromHeader) return String(fromHeader);
  // Fallback: from first SKU proposal's product brand
  const items = p.sku_proposals || p.skuProposals || p.products || [];
  const firstProduct = items[0]?.product || items[0];
  const fromProduct = firstProduct?.brand_id || firstProduct?.brand?.id || firstProduct?.brandId;
  if (fromProduct) return String(fromProduct);
  return 'all';
};

// Build SKU blocks from a single proposal header's detail response (from findOne API)
const buildBlocksFromProposal = (proposal: any, brandId: string): any[] => {
  if (!proposal) return [];
  const blocks: any[] = [];
  const items = proposal.sku_proposals || proposal.skuProposals || proposal.products || [];

  items.forEach((sp: any) => {
    const prod = sp.product || sp;
    const gender = (prod.sub_category?.category?.gender?.name || prod.gender || '').toLowerCase();
    const category = (prod.sub_category?.category?.name || prod.category || '').toLowerCase();
    const subCategory = (prod.sub_category?.name || prod.subCategory || '').toLowerCase();

    let block = blocks.find((b: any) => b.gender === gender && b.category === category && b.subCategory === subCategory);
    if (!block) {
      block = { brandId, gender, category, subCategory, items: [] };
      blocks.push(block);
    }

    // Extract store allocations into { CODE: qty } map
    const allocations = sp.sku_allocates || sp.skuAllocates || prod.allocations || [];
    const storeQty: Record<string, number> = {};
    for (const a of allocations) {
      const code = (a.store?.code || '').toUpperCase();
      if (code) storeQty[code] = Number(a.quantity) || 0;
    }

    const orderQty = Object.values(storeQty).reduce((s: number, v: any) => s + (Number(v) || 0), 0);
    const itemUnitCost = Number(sp.unit_cost ?? sp.unitCost ?? prod.unitCost) || 0;

    block.items.push({
      productId: String(prod.id || sp.product_id || sp.productId || ''),
      skuProposalId: String(sp.id || ''),
      sku: prod.sku_code || prod.skuCode || prod.sku || '',
      name: prod.product_name || prod.productName || prod.name || '',
      collectionName: prod.collectionName || prod.collection || prod.family || '',
      color: prod.color || '',
      colorCode: prod.colorCode || '',
      division: prod.division || category,
      productType: prod.productType || subCategory,
      departmentGroup: prod.departmentGroup || prod.department || '',
      fsr: prod.fsr || '',
      carryForward: prod.carryForward || 'NEW',
      composition: prod.composition || '',
      unitCost: itemUnitCost,
      importTaxPct: Number(prod.importTaxPct || prod.importTax) || 0,
      srp: Number(sp.srp ?? prod.srp) || 0,
      wholesale: Number(prod.wholesale) || 0,
      rrp: Number(prod.rrp) || 0,
      regionalRrp: Number(prod.regionalRrp) || 0,
      theme: prod.theme || '',
      size: prod.size || '',
      order: orderQty,
      storeQty,
      ttlValue: orderQty * itemUnitCost,
      customerTarget: sp.customer_target || sp.customerTarget || prod.customerTarget || 'New',
    });
  });
  return blocks;
};

const SKUProposalScreen = ({ skuContext, onContextUsed, onSubmitTicket }: any) => {
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const router = useRouter();
  const { setAllocationData, setOtbAnalysisContext, registerSave, unregisterSave, registerSaveAsNew, unregisterSaveAsNew, registerExport, unregisterExport } = useAppContext();
  const { dialogProps, confirm } = useConfirmDialog();
  const { isOpen: filterOpen, open: openFilter, close: closeFilter } = useBottomSheet();
  const [mobileFilterValues, setMobileFilterValues] = useState<Record<string, string | string[]>>({});
  // SKU catalog and proposal data from API
  const [skuCatalog, setSkuCatalog] = useState<any[]>([]);
  const [skuDataLoading, setSkuDataLoading] = useState(true);

  // Master data for filters (genders, categories, season groups, brands) and stores
  const [masterGenders, setMasterGenders] = useState<any[]>([]);
  const [masterCategories, setMasterCategories] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [apiSeasonGroups, setApiSeasonGroups] = useState<any[]>([]);
  const [apiBrands, setApiBrandsLocal] = useState<any[]>([]);

  // Fetch master data for filters + stores
  useEffect(() => {
    const fetchMasterData = async () => {
      try {
        const [gendersRes, categoriesRes, storesRes, brandsRes] = await Promise.all([
          masterDataService.getGenders().catch(() => []),
          masterDataService.getCategories().catch(() => []),
          masterDataService.getStores().catch(() => []),
          masterDataService.getBrands().catch(() => []),
        ]);
        const genders = Array.isArray(gendersRes) ? gendersRes : (gendersRes?.data || []);
        setMasterGenders(genders.map((g: any) => (g.name || g.code || '').toLowerCase()));
        const rawCategories = Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes?.data || []);
        // Handle both gender-hierarchy format [{ name: "Female", categories: [...] }]
        // and flat-list format [{ name: "Women's RTW", subCategories: [...] }]
        const isGenderHierarchy = rawCategories.length > 0 && rawCategories[0]?.categories && Array.isArray(rawCategories[0].categories);
        if (isGenderHierarchy) {
          const flatCats = rawCategories.flatMap((g: any) => (g.categories || []).map((c: any) => ({
            ...c,
            genderName: g.name})));
          setMasterCategories(flatCats);
        } else {
          setMasterCategories(rawCategories);
        }
        const storeList = Array.isArray(storesRes) ? storesRes : (storesRes?.data || []);
        // Deduplicate by code
        const rawStores = storeList.length > 0 ? storeList : [{ code: 'REX', name: 'REX' }, { code: 'TTP', name: 'TTP' }];
        const seen = new Set<string>();
        const uniqueStores = rawStores.filter((s: any) => {
          const code = (s.code || '').toUpperCase();
          if (!code || seen.has(code)) return false;
          seen.add(code);
          return true;
        });
        setStores(uniqueStores);
        // Brands — deduplicate by name (same brand name = same visual section)
        const brandsData = Array.isArray(brandsRes) ? brandsRes : (brandsRes?.data || []);
        const seenBrandNames = new Set<string>();
        const uniqueBrands = brandsData.filter((b: any) => {
          const bName = (b.name || b.code || '').toLowerCase();
          if (seenBrandNames.has(bName)) return false;
          seenBrandNames.add(bName);
          return true;
        });
        setApiBrandsLocal(uniqueBrands);
      } catch (err: any) {
        console.error('Failed to fetch master data:', err);
      }
    };
    fetchMasterData();
  }, []);

  // Fetch SKU catalog only (at mount)
  useEffect(() => {
    const fetchCatalog = async () => {
      setSkuDataLoading(true);
      try {
        const catalogRes = await masterDataService.getSkuCatalog().catch(() => []);
        const rawCatalog = Array.isArray(catalogRes) ? catalogRes : [];
        const catalog = rawCatalog.map((s: any) => ({
          productId: String(s.id || ''),
          sku: s.skuCode || s.sku || s.code || s.id,
          name: s.productName || s.name,
          collectionName: s.collectionName || s.collection || '',
          color: s.color || '',
          colorCode: s.colorCode || '',
          division: s.division || s.category || '',
          productType: s.productType || s.category || '',
          departmentGroup: s.departmentGroup || s.department || '',
          fsr: s.fsr || '',
          carryForward: s.carryForward || s.carry || 'NEW',
          composition: s.composition || '',
          unitCost: Number(s.unitCost) || 0,
          importTaxPct: Number(s.importTaxPct || s.importTax) || 0,
          srp: Number(s.srp) || 0,
          wholesale: Number(s.wholesale) || 0,
          rrp: Number(s.rrp) || 0,
          regionalRrp: Number(s.regionalRrp) || 0,
          theme: s.theme || '',
          size: s.size || ''
        }));
        setSkuCatalog(catalog);
      } catch (err: any) {
        console.error('Failed to fetch SKU catalog:', err);
      } finally {
        setSkuDataLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  // API state for fetching budgets
  const [apiBudgets, setApiBudgets] = useState<any[]>([]);
  const [loadingBudgets, setLoadingBudgets] = useState(false);

  // Fetch budgets from API (all statuses)
  const fetchBudgets = useCallback(async () => {
    setLoadingBudgets(true);
    try {
      const response = await budgetService.getAll({});
      const budgetList = (Array.isArray(response) ? response : []).map((budget: any) => {
        // Extract allocate_headers for brand/allocate-header mapping (same pattern as OTB Analysis)
        const rawAllocateHeaders = budget.allocate_headers || budget.allocateHeaders || [];
        const allocateHeaders = rawAllocateHeaders.map((ah: any) => ({
          id: String(ah.id),
          brandId: String(ah.brand_id || ah.brand?.id || ah.brandId || ''),
          brandName: ah.brand?.name || ah.brandName || '',
          isFinal: ah.is_final_version || ah.isFinalVersion || false,
          budgetAllocates: (ah.budget_allocates || ah.budgetAllocates || []).map((ba: any) => ({
            seasonGroupName: ba.season_group?.name || ba.seasonGroup?.name || '',
            seasonName: ba.season?.name || ba.season?.name || ''}))}));
        return {
          id: budget.id,
          fiscalYear: Number(budget.fiscal_year ?? budget.fiscalYear) || undefined,
          groupBrand: typeof budget.groupBrand === 'object' ? (budget.groupBrand?.name || budget.groupBrand?.code || 'A') : (budget.groupBrand || 'A'),
          brandId: budget.brandId || budget.brand_id,
          brandName: budget.Brand?.name || budget.brandName || 'Unknown',
          totalBudget: Number(budget.amount) || Number(budget.totalBudget) || Number(budget.totalAmount) || 0,
          budgetName: budget.name || budget.budgetCode || budget.budgetName || `Budget #${budget.id}`,
          status: (budget.status || 'DRAFT').toLowerCase(),
          allocateHeaders};
      });
      setApiBudgets(budgetList);
    } catch (err: any) {
      console.error('Failed to fetch budgets:', err);
      toast.error(t('budget.failedToLoadBudgets'));
    } finally {
      setLoadingBudgets(false);
    }
  }, []);

  // Fetch budgets on mount
  useEffect(() => {
    fetchBudgets();
  }, [fetchBudgets]);

  // sessionStorage auto-fill removed — all filters default to 'all'
  const [fyFilter, setFyFilter] = useState('all');
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [isBudgetDropdownOpen, setIsBudgetDropdownOpen] = useState(false);
  const budgetDropdownRef = useRef<HTMLDivElement>(null);
  const [brandFilter, setBrandFilter] = useState('all');
  const [seasonGroupFilter, setSeasonGroupFilter] = useState('all');
  const [seasonFilter, setSeasonFilter] = useState('all');

  const [genderFilter, setGenderFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');
  const hasActiveSkuFilter = genderFilter !== 'all' || categoryFilter !== 'all' || subCategoryFilter !== 'all';

  // Fetch season groups filtered by selected budget's fiscal year
  useEffect(() => {
    const controller = new AbortController();
    const budget = apiBudgets.find((b: any) => b.id === budgetFilter);
    const year = budget?.fiscalYear ? Number(budget.fiscalYear) : undefined;
    masterDataService.getSeasonGroups(year ? { year } : undefined, { signal: controller.signal }).then(res => {
      const sgData = Array.isArray(res) ? res : [];
      setApiSeasonGroups(sgData);
    }).catch((err: any) => {
      // Don't clear data on abort/cancel — keep previous season groups
      if (err?.code === 'ERR_CANCELED' || err?.name === 'AbortError') return;
      setApiSeasonGroups([]);
    });
    return () => { controller.abort(); };
  }, [budgetFilter, apiBudgets]);

  // Allocation/Planning validation — checks if budget + season filters are selected
  const filtersComplete = budgetFilter !== 'all' && seasonGroupFilter !== 'all' && seasonFilter !== 'all';

  const matchedAllocateHeaders = useMemo(() => {
    if (!filtersComplete) return [];
    const budget = apiBudgets.find((b: any) => b.id === budgetFilter);
    if (!budget) return [];
    return (budget.allocateHeaders || []).filter((ah: any) =>
      (ah.budgetAllocates || []).some((ba: any) =>
        ba.seasonGroupName === seasonGroupFilter && ba.seasonName === seasonFilter
      )
    );
  }, [filtersComplete, budgetFilter, apiBudgets, seasonGroupFilter, seasonFilter]);

  // Gated proposal loading — only when budget + season filters are complete
  // Uses AbortController to cancel in-flight requests when filters change,
  // preventing connection pool exhaustion and "Network Error" on other requests.
  const loadProposalsRef = useRef(0);
  const loadAbortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    // Cancel any in-flight requests from previous run
    if (loadAbortRef.current) {
      loadAbortRef.current.abort();
      loadAbortRef.current = null;
    }

    if (!filtersComplete) {
      setBrandProposalHeaders({});
      setBrandSizingHeaders({});
      setSkuBlocks([]);
      return;
    }
    if (matchedAllocateHeaders.length === 0) return;

    const controller = new AbortController();
    loadAbortRef.current = controller;
    const signal = controller.signal;
    const loadId = ++loadProposalsRef.current;

    const loadFilteredProposals = async () => {
      setSkuDataLoading(true);
      try {
        const newHeadersByBrand: Record<string, any[]> = {};
        const newSizingByBrand: Record<string, any[]> = {};
        const allBlocks: any[] = [];
        const seenSizingVersions: Record<string, Set<number>> = {};

        for (const ah of matchedAllocateHeaders) {
          if (signal.aborted || loadId !== loadProposalsRef.current) return; // stale
          const brandId = String(ah.brandId);
          const proposalsList = await proposalService.getAll({ allocateHeaderId: ah.id }, { signal }).catch((e: any) => {
            if (e?.code === 'ERR_CANCELED') throw e;
            return [];
          });
          const list = Array.isArray(proposalsList) ? proposalsList : [];

          if (list.length > 0) {
            // Build per-brand proposal headers
            newHeadersByBrand[brandId] = list.map((h: any) => ({
              id: h.id,
              version: h.version,
              status: h.status,
              isFinal: h.is_final_version ?? h.isFinalVersion ?? false,
            })).sort((a: any, b: any) => b.version - a.version);

            if (signal.aborted) return;

            // Fetch details for each proposal
            const detailResults = await Promise.all(
              list.map((p: any) => proposalService.getOne(p.id, { signal }).catch((e: any) => {
                if (e?.code === 'ERR_CANCELED') throw e;
                return null;
              }))
            );
            const proposals = detailResults.map((r: any) => r?.data || r).filter(Boolean);

            // Build blocks
            proposals.forEach((p: any) => {
              const brandBlocks = buildBlocksFromProposal(p, brandId);
              allBlocks.push(...brandBlocks);
            });

            // Build sizing headers (now at proposal header level, not per-SKU)
            seenSizingVersions[brandId] = new Set();
            newSizingByBrand[brandId] = [];
            proposals.forEach((p: any) => {
              const headerSizings = p.proposal_sizing_headers || p.proposalSizingHeaders || [];
              headerSizings.forEach((sh: any) => {
                const ver = sh.version ?? 0;
                if (!seenSizingVersions[brandId].has(ver)) {
                  seenSizingVersions[brandId].add(ver);
                  newSizingByBrand[brandId].push({
                    id: sh.id,
                    version: ver,
                    isFinal: sh.is_final_version ?? sh.isFinalVersion ?? false,
                    proposalSizings: sh.proposal_sizings || sh.proposalSizings || [],
                  });
                }
              });
            });
            newSizingByBrand[brandId]?.sort((a: any, b: any) => a.version - b.version);

            // Enrich catalog with unique SKUs from proposal products
            const seenSkus = new Set(skuCatalog.map((c: any) => c.sku));
            const supplementarySkus: any[] = [];
            proposals.forEach((p: any) => {
              (p.products || []).forEach((prod: any) => {
                const sku = prod.skuCode || prod.sku;
                if (sku && !seenSkus.has(sku)) {
                  seenSkus.add(sku);
                  supplementarySkus.push({
                    sku, name: prod.productName || prod.name || '',
                    collectionName: prod.collectionName || prod.collection || '',
                    color: prod.color || '', colorCode: prod.colorCode || '',
                    division: prod.division || prod.category || '',
                    productType: prod.productType || prod.subCategory || '',
                    departmentGroup: prod.departmentGroup || prod.department || '',
                    fsr: prod.fsr || '', carryForward: prod.carryForward || 'NEW',
                    composition: prod.composition || '',
                    unitCost: Number(prod.unitCost) || 0,
                    importTaxPct: Number(prod.importTaxPct || prod.importTax) || 0,
                    srp: Number(prod.srp) || 0, wholesale: Number(prod.wholesale) || 0,
                    rrp: Number(prod.rrp) || 0, regionalRrp: Number(prod.regionalRrp) || 0,
                    theme: prod.theme || '', size: prod.size || '',
                  });
                }
              });
            });
            if (supplementarySkus.length > 0) {
              setSkuCatalog(prev => [...prev, ...supplementarySkus]);
            }
          } else {
            // No proposals found — try loading previous year template
            if (signal.aborted) return;
            const budget = apiBudgets.find((b: any) => b.id === budgetFilter);
            const currentFY = budget?.fiscalYear;
            if (currentFY) {
              const historical = await proposalService.getHistorical({
                fiscalYear: currentFY - 1,
                seasonGroupName: seasonGroupFilter,
                seasonName: seasonFilter,
                brandId,
              });
              if (historical) {
                const histBlocks = buildBlocksFromProposal(historical, brandId);
                histBlocks.forEach((b: any) => { b.isHistorical = true; });
                allBlocks.push(...histBlocks);
              }
            }
          }
        }

        if (signal.aborted || loadId !== loadProposalsRef.current) return; // stale

        setBrandProposalHeaders(newHeadersByBrand);
        setBrandSizingHeaders(newSizingByBrand);
        setSkuBlocks(allBlocks);
        // Hydrate sizing per brand from header-level sizing headers
        for (const [bId, sizHeaders] of Object.entries(newSizingByBrand)) {
          const brandBlocks = allBlocks.filter((b: any) => String(b.brandId) === bId);
          if (brandBlocks.length > 0 && sizHeaders.length > 0) {
            hydrateSizingData(brandBlocks, sizHeaders);
          }
        }

        // Auto-select final or latest version per brand
        const autoSelected: Record<string, string> = {};
        for (const [bId, headers] of Object.entries(newHeadersByBrand)) {
          const finalH = headers.find((h: any) => h.isFinal);
          autoSelected[bId] = String(finalH ? finalH.id : headers[0]?.id || '');
        }
        setBrandSkuVersion(prev => ({ ...autoSelected, ...prev }));

        // Auto-select final or latest sizing choice per brand
        const autoSizing: Record<string, string> = {};
        for (const [bId, headers] of Object.entries(newSizingByBrand)) {
          const finalH = headers.find((h: any) => h.isFinal);
          autoSizing[bId] = String(finalH ? finalH.id : headers[0]?.id || '');
        }
        setBrandSizingChoice(prev => ({ ...autoSizing, ...prev }));
      } catch (err: any) {
        // Silently ignore cancelled requests
        if (err?.code === 'ERR_CANCELED' || err?.name === 'AbortError') return;
        console.error('Failed to load proposals:', err);
      } finally {
        if (loadId === loadProposalsRef.current) setSkuDataLoading(false);
      }
    };
    loadFilteredProposals();

    return () => { controller.abort(); };
  }, [filtersComplete, matchedAllocateHeaders, budgetFilter, seasonGroupFilter, seasonFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const [brandPlanningHeaders, setBrandPlanningHeaders] = useState<Record<string, any[]>>({});
  const [brandLoadingPlanning, setBrandLoadingPlanning] = useState<Record<string, boolean>>({});

  const [collapsed, setCollapsed] = useState<Record<string, any>>({});
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [collapsedBrands, setCollapsedBrands] = useState<Record<string, boolean>>({});
  const [contextBanner, setContextBanner] = useState<any>(null);
  const [viewMode, setViewMode] = useState('table');
  const [lightbox, setLightbox] = useState<{ open: boolean; key: string; tab: 'details' | 'storeOrder' | 'sizing'; item: any; blockKey: string; idx: number; block: any } | null>(null);
  const [customerTargetOptions, setCustomerTargetOptions] = useState<string[]>(['New', 'Existing']);
  // Per-brand proposal headers (versions) & sizing headers (choices) from API
  const [brandProposalHeaders, setBrandProposalHeaders] = useState<Record<string, any[]>>({});
  const [brandSizingHeaders, setBrandSizingHeaders] = useState<Record<string, any[]>>({});
  const [brandSkuVersion, setBrandSkuVersion] = useState<Record<string, string>>({});
  const [brandSizingChoice, setBrandSizingChoice] = useState<Record<string, string>>({});
  const [brandSaving, setBrandSaving] = useState<Record<string, boolean>>({});
  // Portal dropdown state for version & choice
  const [openDropdown, setOpenDropdown] = useState<{ type: 'version' | 'choice'; brandId: string } | null>(null);
  const [dropdownAnchorEl, setDropdownAnchorEl] = useState<HTMLElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!openDropdown) return;
    const handleClick = (e: any) => {
      if (dropdownAnchorEl && dropdownAnchorEl.contains(e.target)) return;
      const portal = document.querySelector('.sku-version-portal');
      if (portal && portal.contains(e.target)) return;
      setOpenDropdown(null);
      setDropdownAnchorEl(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [openDropdown, dropdownAnchorEl]);

  // Close budget dropdown on outside click
  useEffect(() => {
    if (!isBudgetDropdownOpen) return;
    const handleClick = (e: any) => {
      if (budgetDropdownRef.current && !budgetDropdownRef.current.contains(e.target)) {
        setIsBudgetDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isBudgetDropdownOpen]);

  // Smart Filter Bar — direct DOM toggle, zero re-render
  const { barRef, handleBarClick } = useSmartScrollState();


  const handleSetFinalVersion = async (brandId: string, headerId: any, e: any) => {
    e.stopPropagation();
    try {
      await proposalService.update(String(headerId), { isFinalVersion: true });
      // Update local state — mark only this header as final within the brand
      setBrandProposalHeaders(prev => {
        const updated = { ...prev };
        if (updated[brandId]) {
          updated[brandId] = updated[brandId].map((h: any) => ({
            ...h,
            isFinal: String(h.id) === String(headerId)}));
        }
        return updated;
      });
      setBrandSkuVersion(prev => ({ ...prev, [brandId]: String(headerId) }));
    } catch (err: any) {
      console.error('Failed to set final version:', err);
    }
  };

  const handleSetFinalSizing = async (brandId: string, headerId: any, e: any) => {
    e.stopPropagation();
    try {
      await proposalService.updateSizingHeader(String(headerId), { isFinalVersion: true });
      setBrandSizingHeaders(prev => {
        const updated = { ...prev };
        if (updated[brandId]) {
          updated[brandId] = updated[brandId].map((h: any) => ({
            ...h,
            isFinal: String(h.id) === String(headerId)}));
        }
        return updated;
      });
      setBrandSizingChoice(prev => ({ ...prev, [brandId]: String(headerId) }));
    } catch (err: any) {
      console.error('Failed to set final sizing choice:', err);
    }
  };

  // Shared helper: resolve selected ID from state map, falling back to final/first header
  const getBrandSelection = (brandId: string, stateMap: Record<string, string>, headersMap: Record<string, any[]>) => {
    if (stateMap[brandId]) return stateMap[brandId];
    const headers = headersMap[brandId] || [];
    const finalH = headers.find((h: any) => h.isFinal);
    if (finalH) return String(finalH.id);
    if (headers.length > 0) return String(headers[0].id);
    return '';
  };
  const getBrandSkuVersion = (brandId: string) => getBrandSelection(brandId, brandSkuVersion, brandProposalHeaders);
  const getBrandSizingChoice = (brandId: string) => getBrandSelection(brandId, brandSizingChoice, brandSizingHeaders);

  // Hydrate sizingData state from loaded blocks + header-level sizing headers
  // Sizing headers are per proposal header; sizing rows link to specific SKU proposals via sku_proposal_id
  const hydrateSizingData = useCallback((blocks: any[], sizingHeadersForBrand?: any[]) => {
    const loaded: Record<string, any> = {};

    // Build a map: skuProposalId → { blockKey, itemIdx } for fast lookup
    const skuMap = new Map<string, { key: string }>();
    blocks.forEach((block: any) => {
      const blockKey = buildBlockKey(block);
      (block.items || []).forEach((item: any, idx: number) => {
        if (item.skuProposalId) {
          skuMap.set(String(item.skuProposalId), { key: `${blockKey}_${idx}` });
        }
      });
    });

    // Use provided sizing headers or collect from brandSizingHeaders
    const allSizingHeaders = sizingHeadersForBrand || [];
    if (allSizingHeaders.length > 0) {
      allSizingHeaders.forEach((sh: any) => {
        const choiceKey = String(sh.id);
        const rows = sh.proposalSizings || sh.proposal_sizings || [];
        rows.forEach((ps: any) => {
          const skuPropId = String(ps.sku_proposal_id || ps.skuProposalId || '');
          const mapping = skuMap.get(skuPropId);
          if (!mapping) return;

          const sizeName = ps.subcategory_size?.name || ps.subcategorySize?.name || '';
          if (!sizeName) return;
          const sizeKey = sizeName.startsWith('s') ? sizeName : `s${sizeName}`;

          if (!loaded[mapping.key]) loaded[mapping.key] = {};
          if (!loaded[mapping.key][choiceKey]) {
            const empty: Record<string, number> = {};
            DEFAULT_SIZE_KEYS.forEach(k => { empty[k] = 0; });
            loaded[mapping.key][choiceKey] = empty;
          }
          loaded[mapping.key][choiceKey][sizeKey] = Number(ps.proposal_quantity ?? ps.proposalQuantity) || 0;
        });
      });
    }

    if (Object.keys(loaded).length > 0) {
      setSizingData(prev => ({ ...prev, ...loaded }));
    }
  }, []);

  // Load a specific proposal version for a brand (called when version dropdown changes)
  const loadProposalVersion = useCallback(async (brandId: string, headerId: string) => {
    try {
      const response = await proposalService.getOne(headerId);
      const p = response?.data || response;
      if (!p) return;
      const newBrandBlocks = buildBlocksFromProposal(p, brandId);
      setSkuBlocks(prev => {
        const other = prev.filter((b: any) => String(b.brandId) !== brandId);
        return [...other, ...newBrandBlocks];
      });
      // Hydrate sizing data from header-level sizing headers
      const headerSizings = (p.proposal_sizing_headers || p.proposalSizingHeaders || []).map((sh: any) => ({
        id: sh.id, version: sh.version, isFinal: sh.is_final_version ?? false,
        proposalSizings: sh.proposal_sizings || sh.proposalSizings || [],
      }));
      hydrateSizingData(newBrandBlocks, headerSizings);
    } catch (err: any) {
      console.error('Failed to load proposal version:', err);
      toast.error('Failed to load version');
    }
  }, [hydrateSizingData]);

  // Computed labels for collapsed bar badges
  const budgetDisplayName = useMemo(() => {
    if (budgetFilter === 'all') return 'All Budgets';
    const b = apiBudgets.find((b: any) => b.id === budgetFilter || b.budgetName === budgetFilter);
    return b?.budgetName || budgetFilter;
  }, [budgetFilter, apiBudgets]);


  // Apply context from OTB Analysis when navigating here
  useEffect(() => {
    if (skuContext) {
      // Set filters based on context
      if (skuContext.budgetId) {
        setBudgetFilter(skuContext.budgetId);
      }
      // Set brand filter (single brand from brandIds array)
      if (skuContext.brandIds?.length === 1) {
        setBrandFilter(String(skuContext.brandIds[0]));
      } else if (skuContext.brandIds?.length > 1) {
        // Multiple brands selected — keep "all" but could extend to multi-select later
        setBrandFilter('all');
      }
      if (skuContext.seasonGroup) {
        setSeasonGroupFilter(skuContext.seasonGroup);
      }
      if (skuContext.season) {
        setSeasonFilter(skuContext.season);
      }
      // Use lowercase gender name to match SKU data (e.g., 'female', 'male')
      if (skuContext.gender?.name) {
        setGenderFilter(skuContext.gender.name.toLowerCase());
      }
      // Use category name to match SKU data (case-insensitive)
      if (skuContext.category?.name) {
        setCategoryFilter(skuContext.category.name.toLowerCase());
      }
      // Use subCategory name to match SKU data (case-insensitive)
      if (skuContext.subCategory?.name) {
        setSubCategoryFilter(skuContext.subCategory.name.toLowerCase());
      }

      // Set banner info
      setContextBanner({
        budgetName: skuContext.budgetName,
        fiscalYear: skuContext.fiscalYear,
        brandName: skuContext.brandName,
        seasonGroup: skuContext.seasonGroup,
        season: skuContext.season,
        gender: skuContext.gender?.name,
        category: skuContext.category?.name,
        subCategory: skuContext.subCategory?.name,
        otbData: skuContext.otbData
      });

      // Clear context after use
      if (onContextUsed) {
        onContextUsed();
      }
    }
  }, [skuContext, onContextUsed]);

  const [skuBlocks, setSkuBlocks] = useState<any[]>([]);

  // When context is provided and data loads but no proposal blocks exist,
  // build blocks from the SKU catalog matching the context's subCategory
  useEffect(() => {
    if (contextBanner?.subCategory && skuCatalog.length > 0 && skuBlocks.length === 0 && !skuDataLoading) {
      const subCat = contextBanner.subCategory;
      const matchingItems = skuCatalog.filter((item: any) => (item.productType || '').toLowerCase() === subCat.toLowerCase());
      if (matchingItems.length > 0) {
        const genderKey = (contextBanner.gender || '').toLowerCase();
        const ctxBrandId = brandFilter !== 'all' ? brandFilter : (apiBrands.length > 0 ? String(apiBrands[0].id) : 'all');
        setSkuBlocks([{
          brandId: ctxBrandId,
          gender: genderKey,
          category: contextBanner.category || '',
          subCategory: subCat,
          items: matchingItems.map((item: any) => ({
            ...item,
            order: 0,
            storeQty: {},
            ttlValue: 0,
            customerTarget: 'New'
          }))
        }]);
      }
    }
  }, [contextBanner, skuCatalog, skuBlocks.length, skuDataLoading]);
  const [editingCell, setEditingCell] = useState<any>(null);
  const [highlightedRow, setHighlightedRow] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [commentPopup, setCommentPopup] = useState<{ text: string; blockKey: string; idx: number; rect: DOMRect } | null>(null);
  const lightboxRef = useRef<HTMLDivElement>(null);

  // Add SKU Modal state
  const [addSkuModal, setAddSkuModal] = useState<{ open: boolean; blockKey: string; block: any } | null>(null);

  const [sizingData, setSizingData] = useState<Record<string, any>>({});

  // Helper: get sizing choices for a brand
  const getBrandSizingChoices = (brandId: string) => brandSizingHeaders[brandId] || [];

  const getDefaultSizing = (brandId?: string) => {
    const defaults: Record<string, any> = {};
    const choices = brandId ? getBrandSizingChoices(brandId) : [];
    choices.forEach((c: any) => {
      defaults[String(c.id)] = { ...EMPTY_SIZE_DATA };
    });
    // Fallback: always 3 choices (A, B, C) if no choices exist yet
    if (Object.keys(defaults).length === 0) {
      defaults['choiceA'] = { ...EMPTY_SIZE_DATA };
      defaults['choiceB'] = { ...EMPTY_SIZE_DATA };
      defaults['choiceC'] = { ...EMPTY_SIZE_DATA };
    }
    return defaults;
  };

  const getSizingKey = (blockKey: any, itemIdx: any) => `${blockKey}_${itemIdx}`;

  const getSizing = (blockKey: any, itemIdx: any, brandId?: string) => {
    const key = getSizingKey(blockKey, itemIdx);
    return sizingData[key] || getDefaultSizing(brandId);
  };

  const updateSizing = (blockKey: any, itemIdx: any, choiceKey: any, size: any, value: any, brandId?: string) => {
    const key = getSizingKey(blockKey, itemIdx);
    const currentSizing = sizingData[key] || getDefaultSizing(brandId);
    setSizingData((prev: any) => ({
      ...prev,
      [key]: {
        ...currentSizing,
        [choiceKey]: {
          ...currentSizing[choiceKey],
          [size]: parseInt(value) || 0
        }
      }
    }));
  };

  const calculateSum = (choiceData: any): number => {
    return Object.values(choiceData).reduce((sum: any, val: any) => sum + (parseInt(val) || 0), 0) as number;
  };

  // Check if sizing is complete for a given SKU item (any final choice has non-zero quantities)
  const isSizingComplete = (blockKey: any, itemIdx: any, brandId?: string) => {
    const sizing = getSizing(blockKey, itemIdx, brandId);
    const bId = brandId || blockKey.split('_')[0] || '';
    const choices = getBrandSizingChoices(bId);
    const finalChoice = choices.find((c: any) => c.isFinal);
    if (!finalChoice) return false;
    const choiceData = sizing[String(finalChoice.id)];
    if (!choiceData) return false;
    return Object.values(choiceData).some((v: any) => (parseInt(v) || 0) > 0);
  };

  // Count sizing completion for a block
  const getSizingCount = (blockKey: any, items: any[]) => {
    let completed = 0;
    items.forEach((_: any, idx: number) => {
      if (isSizingComplete(blockKey, idx)) completed++;
    });
    return { completed, total: items.length };
  };

  const handleOpenLightbox = (key: string, tab: 'details' | 'storeOrder' | 'sizing', item: any, blockKey: string, idx: number, block: any) => {
    setLightbox({ open: true, key, tab, item, blockKey, idx, block });
  };

  const handleCloseLightbox = () => {
    setLightbox(null);
  };

  // FY options derived from budgets
  const fyOptions = useMemo(() => {
    const years = new Set(apiBudgets.map((b: any) => b.fiscalYear).filter(Boolean));
    const options = [{ value: 'all', label: 'All FY' }];
    Array.from(years).sort((a: any, b: any) => Number(b) - Number(a)).forEach((y: any) => {
      options.push({ value: String(y), label: `FY${y}` });
    });
    return options;
  }, [apiBudgets]);

  const filteredBudgets = useMemo(() => {
    return fyFilter === 'all' ? apiBudgets : apiBudgets.filter((b: any) => String(b.fiscalYear) === fyFilter);
  }, [apiBudgets, fyFilter]);

  const selectedBudget = useMemo(() => {
    if (budgetFilter === 'all') return null;
    return apiBudgets.find((b: any) => b.id === budgetFilter) || null;
  }, [apiBudgets, budgetFilter]);

  // Brand options from API
  const brandOptions = useMemo(() => {
    const options = [{ value: 'all', label: 'All Brands' }];
    apiBrands.forEach((b: any) => {
      options.push({ value: String(b.id), label: b.name || b.code || `Brand ${b.id}` });
    });
    return options;
  }, [apiBrands]);

  // Season group options from API
  const seasonGroupOptions = useMemo(() => {
    const options = [{ value: 'all', label: 'All' }];
    apiSeasonGroups.forEach((sg: any) => {
      options.push({ value: sg.name || sg.code, label: sg.name || sg.code });
    });
    return options;
  }, [apiSeasonGroups]);

  // Season options from API (derived from selected season group's nested seasons)
  const seasonOptions = useMemo(() => {
    const options = [{ value: 'all', label: 'All' }];
    if (seasonGroupFilter === 'all') {
      // Collect all unique seasons from all season groups
      const seen = new Set<string>();
      apiSeasonGroups.forEach((sg: any) => {
        (sg.seasons || []).forEach((s: any) => {
          const name = s.name || s.code;
          if (name && !seen.has(name)) {
            seen.add(name);
            options.push({ value: name, label: name });
          }
        });
      });
    } else {
      const matchedSG = apiSeasonGroups.find((sg: any) => (sg.name || sg.code) === seasonGroupFilter);
      if (matchedSG) {
        (matchedSG.seasons || []).forEach((s: any) => {
          const name = s.name || s.code;
          if (name) options.push({ value: name, label: name });
        });
      }
    }
    return options;
  }, [seasonGroupFilter, apiSeasonGroups]);

  // Brands to display — filtered by brandFilter
  const displayBrands = useMemo(() => {
    if (brandFilter === 'all') return apiBrands;
    return apiBrands.filter((b: any) => String(b.id) === brandFilter);
  }, [apiBrands, brandFilter]);

  // Fetch planning headers per brand to check final PlanningHeader existence
  useEffect(() => {
    if (displayBrands.length === 0 || !filtersComplete) {
      setBrandPlanningHeaders({});
      return;
    }
    displayBrands.forEach(async (brand: any) => {
      const brandId = String(brand.id);
      const matchedAH = matchedAllocateHeaders.find((ah: any) => String(ah.brandId) === brandId);
      if (!matchedAH) return; // no AllocateHeader = handled by warning banner
      setBrandLoadingPlanning(prev => ({ ...prev, [brandId]: true }));
      try {
        const list = await planningService.getAll({ brandId, allocateHeaderId: matchedAH.id });
        const mapped = (Array.isArray(list) ? list : []).map((v: any) => ({
          id: String(v.id),
          version: v.version,
          status: v.status || 'DRAFT',
          isFinal: v.is_final_version || false}));
        setBrandPlanningHeaders(prev => ({ ...prev, [brandId]: mapped }));
      } catch (err: any) {
        console.error(`[SKU] Failed to fetch planning headers for brand ${brandId}:`, err?.response?.data || err?.message);
        setBrandPlanningHeaders(prev => ({ ...prev, [brandId]: [] }));
      } finally {
        setBrandLoadingPlanning(prev => ({ ...prev, [brandId]: false }));
      }
    });
  }, [displayBrands, filtersComplete, matchedAllocateHeaders]);

  // All subcategory paths from masterCategories (gender → category → subCategory)
  // API returns snake_case (sub_categories) from Prisma
  const allSubcategoryPaths = useMemo(() => {
    const paths: { gender: string; category: string; subCategory: string }[] = [];
    masterCategories.forEach((cat: any) => {
      const gender = (cat.genderName || '').toLowerCase();
      const category = (cat.name || cat.code || '').toLowerCase();
      const subCats = cat.sub_categories || cat.subCategories || [];
      subCats.forEach((sc: any) => {
        const subCategory = (sc.name || sc.code || '').toLowerCase();
        if (subCategory) {
          paths.push({ gender, category, subCategory });
        }
      });
    });
    return paths;
  }, [masterCategories]);

  const genderOptions = useMemo(() => {
    const fromBlocks = skuBlocks.map((s: any) => s.gender).filter(Boolean);
    const fromMaster = masterGenders.filter(Boolean);
    const genders = new Set([...fromBlocks, ...fromMaster]);
    return ['all', ...Array.from(genders)];
  }, [skuBlocks, masterGenders]);

  const categoryOptions = useMemo(() => {
    const fromBlocks = skuBlocks
      .filter((s: any) => genderFilter === 'all' || s.gender.toLowerCase() === genderFilter.toLowerCase())
      .map((s: any) => s.category)
      .filter(Boolean);
    const fromMaster = masterCategories.map((c: any) => (c.name || c.code || '').toLowerCase()).filter(Boolean);
    return ['all', ...Array.from(new Set([...fromBlocks, ...fromMaster]))];
  }, [genderFilter, skuBlocks, masterCategories]);

  const subCategoryOptions = useMemo(() => {
    const fromBlocks = skuBlocks
      .filter((s: any) => (genderFilter === 'all' || s.gender.toLowerCase() === genderFilter.toLowerCase())
        && (categoryFilter === 'all' || s.category.toLowerCase() === categoryFilter.toLowerCase()))
      .map((s: any) => s.subCategory)
      .filter(Boolean);
    // Also extract sub-categories from master data (API returns snake_case)
    const fromMaster = masterCategories
      .flatMap((c: any) => (c.sub_categories || c.subCategories || []).map((sc: any) => (sc.name || sc.code || '').toLowerCase()))
      .filter(Boolean);
    return ['all', ...Array.from(new Set([...fromBlocks, ...fromMaster]))];
  }, [genderFilter, categoryFilter, skuBlocks, masterCategories]);

  const filteredSkuBlocks = useMemo(() => {
    return skuBlocks.filter((block: any) => {
      if (genderFilter !== 'all' && block.gender.toLowerCase() !== genderFilter.toLowerCase()) return false;
      if (categoryFilter !== 'all' && block.category.toLowerCase() !== categoryFilter.toLowerCase()) return false;
      if (subCategoryFilter !== 'all' && block.subCategory.toLowerCase() !== subCategoryFilter.toLowerCase()) return false;
      return true;
    });
  }, [genderFilter, categoryFilter, subCategoryFilter, skuBlocks]);

  // Per-brand subcategory blocks: for each displayBrand, build subcategory rails
  // Merges masterCategories paths with existing skuBlocks per brand
  const brandSubcategoryBlocks = useMemo(() => {
    const result: Record<string, any[]> = {};
    displayBrands.forEach((brand: any) => {
      const brandId = String(brand.id);
      const blocks: any[] = [];
      // Generate all subcategory paths from masterCategories
      allSubcategoryPaths.forEach((path) => {
        // Apply gender/category/subCategory filters
        if (genderFilter !== 'all' && path.gender !== genderFilter.toLowerCase()) return;
        if (categoryFilter !== 'all' && path.category !== categoryFilter.toLowerCase()) return;
        if (subCategoryFilter !== 'all' && path.subCategory !== subCategoryFilter.toLowerCase()) return;
        // Check if an existing skuBlock matches this brand + path
        const existing = skuBlocks.find((b: any) =>
          String(b.brandId || 'all') === brandId &&
          b.gender.toLowerCase() === path.gender &&
          b.category.toLowerCase() === path.category &&
          b.subCategory.toLowerCase() === path.subCategory
        );
        if (existing) {
          blocks.push(existing);
        } else {
          // Create empty block for this subcategory path
          blocks.push({
            brandId,
            gender: path.gender,
            category: path.category,
            subCategory: path.subCategory,
            items: []});
        }
      });
      // Also include any skuBlocks for this brand that aren't covered by masterCategories
      skuBlocks.forEach((block: any) => {
        if (String(block.brandId || 'all') !== brandId) return;
        // Apply filters
        if (genderFilter !== 'all' && block.gender.toLowerCase() !== genderFilter.toLowerCase()) return;
        if (categoryFilter !== 'all' && block.category.toLowerCase() !== categoryFilter.toLowerCase()) return;
        if (subCategoryFilter !== 'all' && block.subCategory.toLowerCase() !== subCategoryFilter.toLowerCase()) return;
        const alreadyIncluded = blocks.some((b: any) =>
          b.gender.toLowerCase() === block.gender.toLowerCase() &&
          b.category.toLowerCase() === block.category.toLowerCase() &&
          b.subCategory.toLowerCase() === block.subCategory.toLowerCase()
        );
        if (!alreadyIncluded) blocks.push(block);
      });
      result[brandId] = blocks;
    });
    return result;
  }, [displayBrands, allSubcategoryPaths, skuBlocks, genderFilter, categoryFilter, subCategoryFilter]);

  // Build products payload from blocks for a brand (shared by save handlers)
  const buildProductsPayload = useCallback((brandId: string) => {
    const blocks = (brandSubcategoryBlocks[brandId] || []).filter((b: any) => b.items?.length > 0);
    return blocks.flatMap((block: any) =>
      block.items.map((item: any) => ({
        productId: item.productId || '',
        customerTarget: item.customerTarget || 'New',
        unitCost: item.unitCost || 0,
        srp: item.srp || 0,
        allocations: stores.map((store: any) => ({
          storeId: String(store.id),
          quantity: item.storeQty?.[(store.code || '').toUpperCase()] || 0,
        })).filter((a: any) => a.quantity > 0),
      }))
    ).filter((p: any) => p.productId);
  }, [brandSubcategoryBlocks, stores]);

  // Build header-level sizing payload from brandSizingHeaders + sizingData state
  const buildSizingsPayload = useCallback((brandId: string) => {
    const headers = brandSizingHeaders[brandId] || [];
    if (headers.length === 0) return undefined;

    // Build productId → skuProposalId map from blocks
    const blocks = (brandSubcategoryBlocks[brandId] || []).filter((b: any) => b.items?.length > 0);

    return headers.map((sh: any) => {
      const choiceKey = String(sh.id);
      const rows: any[] = [];

      blocks.forEach((block: any) => {
        const blockKey = buildBlockKey(block);
        (block.items || []).forEach((item: any, idx: number) => {
          const key = `${blockKey}_${idx}`;
          const itemSizing = sizingData[key]?.[choiceKey];
          if (!itemSizing) return;

          // For each size that has a quantity, create a sizing row
          DEFAULT_SIZE_KEYS.forEach(sizeKey => {
            const qty = Number(itemSizing[sizeKey]) || 0;
            if (qty > 0) {
              rows.push({
                skuProposalProductId: item.productId,
                subcategorySizeId: sizeKey,
                proposalQuantity: qty,
              });
            }
          });
        });
      });

      return {
        version: sh.version ?? 1,
        isFinal: sh.isFinal ?? false,
        rows,
      };
    });
  }, [brandSubcategoryBlocks, brandSizingHeaders, sizingData]);

  // Save a single brand's proposal data
  const handleSaveBrand = useCallback(async (brandId: string, isNewVersion: boolean) => {
    let headerId = getBrandSkuVersion(brandId);
    setBrandSaving(prev => ({ ...prev, [brandId]: true }));
    try {
      const products = buildProductsPayload(brandId);
      const sizings = buildSizingsPayload(brandId);

      // No existing version → create header then save full data (products + allocations + sizing)
      if (!headerId) {
        if (products.length === 0) {
          toast.error('Please add at least one SKU before saving');
          return;
        }
        const matchedAH = matchedAllocateHeaders.find((ah: any) => String(ah.brandId) === brandId);
        const proposals = products.map((p: any) => ({ productId: p.productId, customerTarget: p.customerTarget || 'New', unitCost: p.unitCost || 0, srp: p.srp || 0 }));
        const createPayload: any = { proposals };
        if (matchedAH) createPayload.allocateHeaderId = String(matchedAH.id);
        const created = await proposalService.create(createPayload);
        const newHeader = created?.data || created;
        if (newHeader) {
          const newId = String(newHeader.id);
          // Save full data with allocations + sizing at header level
          await proposalService.saveFullProposal(newId, { products, sizings });
          setBrandProposalHeaders(prev => ({
            ...prev,
            [brandId]: [
              { id: newId, version: newHeader.version || 1, status: 'DRAFT', isFinal: false },
              ...(prev[brandId] || []),
            ]}));
          setBrandSkuVersion(prev => ({ ...prev, [brandId]: newId }));
          // Update sizing headers from the response (now at header level)
          const detail = await proposalService.getOne(newId);
          const fullDetail = detail?.data || detail;
          if (fullDetail) {
            const sizingHeaders = (fullDetail.proposal_sizing_headers || []).map((sh: any) => ({
              id: sh.id, version: sh.version, isFinal: sh.is_final_version ?? false,
              proposalSizings: sh.proposal_sizings || [],
            }));
            sizingHeaders.sort((a: any, b: any) => a.version - b.version);
            setBrandSizingHeaders(prev => ({ ...prev, [brandId]: sizingHeaders }));
          }
          headerId = newId;
        }
        toast.success('Created new version');
        return;
      }

      // Existing version → save products + sizing at header level
      if (products.length > 0) {
        await proposalService.saveFullProposal(headerId, { products, sizings });
      }
      if (isNewVersion) {
        const result = await proposalService.copyProposal(headerId);
        const newHeader = result?.data || result;
        if (newHeader) {
          const newId = String(newHeader.id);
          setBrandProposalHeaders(prev => ({
            ...prev,
            [brandId]: [
              { id: newId, version: newHeader.version, status: 'DRAFT', isFinal: false },
              ...(prev[brandId] || []),
            ]}));
          setBrandSkuVersion(prev => ({ ...prev, [brandId]: newId }));
        }
        toast.success('Saved as new version');
      } else {
        toast.success('Saved successfully');
      }
    } catch (err: any) {
      console.error(`Failed to ${isNewVersion ? 'save as new version' : 'save'} proposal:`, err);
      toast.error(isNewVersion ? 'Failed to save as new version' : 'Failed to save');
    } finally {
      setBrandSaving(prev => ({ ...prev, [brandId]: false }));
    }
  }, [buildProductsPayload, getBrandSkuVersion, matchedAllocateHeaders]);

  // Save all brands (used by AppContext header button)
  const handleSave = useCallback(async () => {
    for (const brand of displayBrands) {
      await handleSaveBrand(String(brand.id), false);
    }
  }, [displayBrands, handleSaveBrand]);

  const handleSaveAsNew = useCallback(async () => {
    for (const brand of displayBrands) {
      await handleSaveBrand(String(brand.id), true);
    }
  }, [displayBrands, handleSaveBrand]);

  // Register save handlers with AppContext
  useEffect(() => {
    registerSave(handleSave);
    registerSaveAsNew(handleSaveAsNew);
    return () => {
      unregisterSave();
      unregisterSaveAsNew();
    };
  }, [handleSave, handleSaveAsNew, registerSave, unregisterSave, registerSaveAsNew, unregisterSaveAsNew]);

  const grandTotals = useMemo(() => {
    return filteredSkuBlocks.reduce((acc: any, block: any) => {
      block.items.forEach((item: any) => {
        acc.skuCount += 1;
        acc.order += (item.order || 0);
        acc.ttlValue += ((item.order || 0) * (item.unitCost || 0));
        acc.srp += (item.srp || 0);
        acc.unitCost += (item.unitCost || 0);
        // Aggregate per-store quantities
        const sq = item.storeQty || {};
        Object.keys(sq).forEach((code: string) => {
          acc.storeQty[code] = (acc.storeQty[code] || 0) + (sq[code] || 0);
        });
      });
      return acc;
    }, { skuCount: 0, order: 0, storeQty: {} as Record<string, number>, ttlValue: 0, srp: 0, unitCost: 0 });
  }, [filteredSkuBlocks]);

  // Card view available when there's data to show
  const canShowCardView = filteredSkuBlocks.length > 0 && filteredSkuBlocks.some((b: any) => b.items.length > 0);

  // Export filtered SKU data to CSV
  const handleExportCSV = useCallback(() => {
    const rows = filteredSkuBlocks.flatMap((block: any) =>
      block.items.map((item: any) => ({
        skuCode: item.sku || '',
        productName: item.name || '',
        gender: block.gender || '',
        category: block.category || '',
        subCategory: block.subCategory || '',
        size: item.size || '',
        color: item.color || '',
        srp: item.srp || 0,
        orderQty: item.order || 0,
        totalValue: item.ttlValue || 0}))
    );

    if (rows.length === 0) {
      toast.error(t('skuProposal.noDataToExport') || 'No data to export');
      return;
    }

    const headers = ['SKU Code', 'Product Name', 'Gender', 'Category', 'Sub-Category', 'Size', 'Color', 'SRP', 'Order Qty', 'Total Value'];

    const escapeCSV = (val: any) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any) =>
        [row.skuCode, row.productName, row.gender, row.category, row.subCategory, row.size, row.color, row.srp, row.orderQty, row.totalValue]
          .map(escapeCSV)
          .join(',')
      )
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `L_ERP_SKU_Proposal_${dateStr}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(t('skuProposal.exportSuccess') || `Exported ${rows.length} SKUs to ${filename}`);
  }, [filteredSkuBlocks, t]);

  // Register export handler with AppContext (for header Export button)
  useEffect(() => {
    registerExport(handleExportCSV);
    return () => { unregisterExport(); };
  }, [handleExportCSV, registerExport, unregisterExport]);

  const handleStartEdit = (cellKey: any, currentValue: any) => {
    setEditingCell(cellKey);
    setEditValue(currentValue?.toString() ?? '');
  };

  const handleSaveEdit = (cellKey: any) => {
    const value = Number(editValue);
    const nextValue = Number.isFinite(value) ? value : 0;
    const [blockKey, itemIdx, field] = cellKey.split('|');

    setSkuBlocks((prev: any) => prev.map((block: any) => {
      const bKey = buildBlockKey(block);
      if (bKey !== blockKey) return block;
      const items = block.items.map((item: any, idx: any) => {
        if (String(idx) !== itemIdx) return item;
        // Handle store_XXX fields → update storeQty map
        if (field.startsWith('store_')) {
          const storeCode = field.replace('store_', '');
          const newStoreQty = { ...(item.storeQty || {}), [storeCode]: nextValue };
          const newOrder = Object.values(newStoreQty).reduce((s: number, v: any) => s + (Number(v) || 0), 0);
          const newTtlValue = newOrder * (item.unitCost || 0);
          return { ...item, storeQty: newStoreQty, order: newOrder, ttlValue: newTtlValue };
        }
        return { ...item, [field]: nextValue };
      });
      return { ...block, items };
    }));
    setEditingCell(null);
    setEditValue('');
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: any, cellKey: any) => {
    if (e.key === 'Enter') {
      handleSaveEdit(cellKey);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const handleSelectChange = (blockKey: any, itemIdx: any, field: any, value: any) => {
    setSkuBlocks((prev: any) => prev.map((block: any) => {
      const key = buildBlockKey(block);
      if (key !== blockKey) return block;
      const items = block.items.map((item: any, idx: any) => {
        if (String(idx) !== String(itemIdx)) return item;
        return { ...item, [field]: value };
      });
      return { ...block, items };
    }));
  };

  const handleNumberChange = (blockKey: any, itemIdx: any, field: any, value: any) => {
    const nextValue = Number(value);
    const safeValue = Number.isFinite(nextValue) ? nextValue : 0;
    setSkuBlocks((prev: any) => prev.map((block: any) => {
      const bKey = buildBlockKey(block);
      if (bKey !== blockKey) return block;
      const items = block.items.map((item: any, idx: any) => {
        if (String(idx) !== String(itemIdx)) return item;
        // Handle store_XXX fields → update storeQty map
        if (field.startsWith('store_')) {
          const storeCode = field.replace('store_', '');
          const newStoreQty = { ...(item.storeQty || {}), [storeCode]: safeValue };
          const newOrder = Object.values(newStoreQty).reduce((s: number, v: any) => s + (Number(v) || 0), 0);
          const newTtlValue = newOrder * (item.unitCost || 0);
          return { ...item, storeQty: newStoreQty, order: newOrder, ttlValue: newTtlValue };
        }
        return { ...item, [field]: safeValue };
      });
      return { ...block, items };
    }));
  };

  const handleToggle = (key: any) => {
    setCollapsed((prev: any) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleToggleAll = () => {
    const newState = !allCollapsed;
    setAllCollapsed(newState);
    const newCollapsed: Record<string, boolean> = {};
    filteredSkuBlocks.forEach((block: any) => {
      const key = buildBlockKey(block);
      newCollapsed[key] = newState;
    });
    setCollapsed(prev => ({ ...prev, ...newCollapsed }));
  };

  const handleAddSkuRow = (blockKey: any, blockInfo?: any) => {
    const newItem = {
      sku: '',
      name: '',
      collectionName: '',
      color: '',
      colorCode: '',
      division: '',
      productType: '',
      departmentGroup: '',
      fsr: '',
      carryForward: 'NEW',
      composition: '',
      unitCost: 0,
      importTaxPct: 0,
      srp: 0,
      wholesale: 0,
      rrp: 0,
      regionalRrp: 0,
      theme: '',
      size: '',
      order: 0,
      storeQty: {},
      ttlValue: 0,
      customerTarget: 'New',
      isNew: true
    };
    setSkuBlocks((prev: any) => {
      const existingBlock = prev.find((block: any) => buildBlockKey(block) === blockKey);
      if (existingBlock) {
        return prev.map((block: any) => {
          if (buildBlockKey(block) !== blockKey) return block;
          return { ...block, items: [...block.items, { ...newItem, division: block.category || '', productType: block.subCategory || '' }] };
        });
      }
      // Block doesn't exist yet (empty subcategory) — create it
      if (blockInfo) {
        return [...prev, {
          brandId: blockInfo.brandId || 'all',
          gender: blockInfo.gender || '',
          category: blockInfo.category || '',
          subCategory: blockInfo.subCategory || '',
          items: [{ ...newItem, division: blockInfo.category || '', productType: blockInfo.subCategory || '' }]}];
      }
      return prev;
    });
  };

  const handleSkuSelect = (blockKey: any, itemIdx: any, selectedSku: any) => {
    const skuData = skuCatalog.find((s: any) => s.sku === selectedSku);
    if (!skuData) return;

    setSkuBlocks((prev: any) => prev.map((block: any) => {
      const key = buildBlockKey(block);
      if (key !== blockKey) return block;
      const items = block.items.map((item: any, idx: any) => {
        if (idx !== itemIdx) return item;
        return {
          ...item,
          productId: skuData.productId || item.productId || '',
          sku: skuData.sku,
          name: skuData.name,
          collectionName: skuData.collectionName,
          color: skuData.color,
          colorCode: skuData.colorCode,
          division: skuData.division,
          productType: skuData.productType,
          departmentGroup: skuData.departmentGroup,
          fsr: skuData.fsr,
          carryForward: skuData.carryForward,
          composition: skuData.composition,
          unitCost: skuData.unitCost,
          importTaxPct: skuData.importTaxPct,
          srp: skuData.srp,
          wholesale: skuData.wholesale,
          rrp: skuData.rrp,
          regionalRrp: skuData.regionalRrp,
          theme: skuData.theme,
          size: skuData.size,
          isNew: false
        };
      });
      return { ...block, items };
    }));
  };

  const handleAddSkusFromModal = (blockKey: any, selectedSkus: any[], blockInfo?: any) => {
    const newItems = selectedSkus.map((sku: any) => ({
      productId: sku.productId || '',
      sku: sku.sku,
      name: sku.name,
      collectionName: sku.collectionName || '',
      color: sku.color || '',
      colorCode: sku.colorCode || '',
      division: sku.division || blockInfo?.category || '',
      productType: sku.productType || blockInfo?.subCategory || '',
      departmentGroup: sku.departmentGroup || '',
      fsr: sku.fsr || '',
      carryForward: sku.carryForward || 'NEW',
      composition: sku.composition || '',
      unitCost: sku.unitCost || 0,
      importTaxPct: sku.importTaxPct || 0,
      srp: sku.srp || 0,
      wholesale: sku.wholesale || 0,
      rrp: sku.rrp || 0,
      regionalRrp: sku.regionalRrp || 0,
      theme: sku.theme || '',
      size: sku.size || '',
      order: sku.order || 0,
      storeQty: sku.storeQty || {},
      ttlValue: sku.ttlValue || 0,
      customerTarget: sku.customerTarget || 'New',
      isNew: false}));
    setSkuBlocks((prev: any) => {
      const existingBlock = prev.find((block: any) => buildBlockKey(block) === blockKey);
      if (existingBlock) {
        return prev.map((block: any) => {
          if (buildBlockKey(block) !== blockKey) return block;
          return { ...block, items: [...block.items, ...newItems] };
        });
      }
      // Block doesn't exist yet — create it
      if (blockInfo) {
        return [...prev, {
          brandId: blockInfo.brandId || 'all',
          gender: blockInfo.gender || '',
          category: blockInfo.category || '',
          subCategory: blockInfo.subCategory || '',
          items: newItems}];
      }
      return prev;
    });
  };

  const handleDeleteSkuRow = (blockKey: any, itemIdx: any) => {
    confirm({
      title: t('common.delete'),
      message: t('common.confirmDelete'),
      confirmLabel: t('common.delete'),
      variant: 'danger',
      onConfirm: () => doDeleteSkuRow(blockKey, itemIdx)});
  };
  const doDeleteSkuRow = (blockKey: any, itemIdx: any) => {
    setSkuBlocks((prev: any) => prev.map((block: any) => {
      const key = buildBlockKey(block);
      if (key !== blockKey) return block;
      const items = block.items.filter((_: any, idx: any) => idx !== itemIdx);
      return { ...block, items };
    }));
  };

  const filteredSkuItems = useMemo(() => {
    return filteredSkuBlocks.flatMap((block: any) => {
      const blockKey = buildBlockKey(block);
      return block.items.map((item: any, idx: any) => ({
        block,
        blockKey,
        item,
        idx,
        key: `${blockKey}_${item.sku || 'new'}_${idx}`
      }));
    });
  }, [filteredSkuBlocks]);

  const getCardBgClass = (index: any) => {
    const style = CARD_BG_CLASSES[index % CARD_BG_CLASSES.length];
    return style.light;
  };

  return (
    <div className="space-y-2 md:space-y-3">
      <div ref={barRef} data-filter-bar className={`sticky -top-3 md:-top-6 z-30 -mx-3 md:-mx-6 -mt-3 md:-mt-6 mb-1 md:mb-2 backdrop-blur-sm border-b relative ${'bg-white/95 border-[rgba(215,183,151,0.3)]'}`}>

        {/* ===== FILTER CONTENT ===== */}
        <div>
        <div>
        <div className="p-2 md:p-3">
        {/* Mobile Filter Button */}
        {isMobile && (
          <div className="mb-2">
            <button
              onClick={openFilter}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${'bg-[rgba(160,120,75,0.12)] border-[rgba(215,183,151,0.4)] text-[#6B4D30]'}`}
            >
              <SlidersHorizontal size={16} />
              {t('common.filters')}
            </button>
          </div>
        )}

        {!isMobile && <>
          {/* ── Group 1: Global Context Filters ── */}
          <div className="-mx-2 md:-mx-3 px-3 md:px-6 py-1.5">
            <div className="flex items-end gap-1.5">
              <FilterSelect
                label="FY"
                icon={Clock}
                value={fyFilter}
                options={fyOptions}
                onChange={(v: string) => { setFyFilter(v); setBudgetFilter('all'); }}
                placeholder="All FY"
              />
              {/* Budget Dropdown — matches BudgetAllocate design */}
              <div className="relative min-w-0" ref={budgetDropdownRef}>
                <label className="block text-[10px] uppercase tracking-[0.06em] font-bold mb-0.5 text-[#8A6340]">
                  Budget
                </label>
                <button
                  type="button"
                  onClick={() => setIsBudgetDropdownOpen(!isBudgetDropdownOpen)}
                  className={`w-full px-2 py-1 border rounded-md font-medium cursor-pointer flex items-center justify-between text-xs transition-all ${selectedBudget
                    ? 'bg-[rgba(18,119,73,0.1)] border-[#127749] text-[#127749] hover:border-[#2A9E6A]'
                    : 'bg-white border-[#C4B5A5] text-[#0A0A0A] hover:border-[rgba(215,183,151,0.4)] hover:bg-[rgba(160,120,75,0.18)]'}`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <FileText size={12} className={selectedBudget ? 'text-[#127749]' : 'text-[#666666]'} />
                    <span className="truncate">{selectedBudget?.budgetName || t('planning.selectBudget')}</span>
                  </div>
                  <ChevronDown size={12} className={`flex-shrink-0 transition-transform duration-200 ${isBudgetDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isBudgetDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 border rounded-xl shadow-xl z-[9999] overflow-hidden whitespace-nowrap w-max min-w-full animate-slideDown bg-white border-[#C4B5A5]">
                    <div className="max-h-72 overflow-y-auto py-0.5">
                      {loadingBudgets && (
                        <div className="px-4 py-6 flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-[#D7B797]/30 border-t-[#D7B797] rounded-full animate-spin" />
                          <span className="ml-2 text-sm text-[#666666]">{t('common.loading')}...</span>
                        </div>
                      )}
                      {!loadingBudgets && filteredBudgets.length === 0 && (
                        <div className="px-4 py-6 text-center text-sm text-[#666666]">
                          {t('budget.noMatchingBudgets')}
                        </div>
                      )}
                      {!loadingBudgets && filteredBudgets.length > 0 && (
                        <div
                          onClick={() => { setBudgetFilter('all'); setIsBudgetDropdownOpen(false); }}
                          className={`px-4 py-0.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${budgetFilter === 'all'
                            ? 'bg-[rgba(18,119,73,0.1)] text-[#127749]' : 'hover:bg-[rgba(160,120,75,0.18)] text-[#666666]'}`}
                        >
                          <span className="font-medium">{t('planning.selectBudget')}</span>
                          {budgetFilter === 'all' && <Check size={14} className="text-[#127749]" />}
                        </div>
                      )}
                      {!loadingBudgets && filteredBudgets.map((budget: any) => (
                        <div
                          key={budget.id}
                          onClick={() => {
                            setBudgetFilter(budget.id);
                            if (budget.fiscalYear) setFyFilter(String(budget.fiscalYear));
                            setIsBudgetDropdownOpen(false);
                          }}
                          className={`px-4 py-0.5 cursor-pointer transition-colors border-t border-[#D4C8BB] ${budgetFilter === budget.id
                            ? 'bg-[rgba(18,119,73,0.1)]' : 'hover:bg-[rgba(160,120,75,0.18)]'}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                              <div className={`font-semibold text-sm font-['Montserrat'] ${budgetFilter === budget.id ? 'text-[#127749]' : 'text-[#0A0A0A]'}`}>
                                {budget.budgetName}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-['JetBrains_Mono'] text-[#666666]">FY{budget.fiscalYear}</span>
                                <span className="text-[#2E2E2E]/30">&bull;</span>
                                <span className="text-xs font-medium font-['JetBrains_Mono'] text-[#127749]">{formatCurrency(budget.totalBudget)}</span>
                              </div>
                            </div>
                            {budgetFilter === budget.id && (
                              <div className="w-5 h-5 rounded-full bg-[#127749] flex items-center justify-center flex-shrink-0 ml-2">
                                <Check size={12} className="text-white" strokeWidth={3} />
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <FilterSelect
                label={t('budget.brand') || 'Brand'}
                icon={Tag}
                value={brandFilter}
                options={brandOptions}
                onChange={setBrandFilter}
                placeholder={t('budget.allBrands') || 'All Brands'}
              />
              <FilterSelect
                label={t('budget.seasonGroup') || 'Season Group'}
                icon={Layers}
                value={seasonGroupFilter}
                options={seasonGroupOptions}
                onChange={(v: string) => { setSeasonGroupFilter(v); setSeasonFilter('all'); }}
                placeholder={t('budget.allSeasonGroups') || 'All Season Groups'}
              />
              <FilterSelect
                label={t('budget.season') || 'Season'}
                icon={Clock}
                value={seasonFilter}
                options={seasonOptions}
                onChange={setSeasonFilter}
                placeholder={t('budget.allSeasons') || 'All Seasons'}
              />

              {/* Separator */}
              <div className="w-px self-stretch bg-[rgba(215,183,151,0.4)] shrink-0 mx-0.5" />

              {/* SKU Data Filters */}
              <FilterSelect
                icon={Users}
                label={t('common.gender') || 'Gender'}
                value={genderFilter}
                options={genderOptions}
                onChange={(v: string) => { setGenderFilter(v); setCategoryFilter('all'); setSubCategoryFilter('all'); }}
                placeholder={t('common.allGenders') || 'All Genders'}
              />
              <FilterSelect
                icon={Tag}
                label={t('common.category') || 'Category'}
                value={categoryFilter}
                options={categoryOptions}
                onChange={(v: string) => { setCategoryFilter(v); setSubCategoryFilter('all'); }}
                placeholder={t('common.allCategories') || 'All Categories'}
              />
              <FilterSelect
                icon={Tag}
                label={t('common.subCategory') || 'Sub Category'}
                value={subCategoryFilter}
                options={subCategoryOptions}
                onChange={setSubCategoryFilter}
                placeholder={t('common.allSubCategories') || 'All SubCategories'}
              />

              {hasActiveSkuFilter && (
                <button
                  type="button"
                  onClick={() => { setGenderFilter('all'); setCategoryFilter('all'); setSubCategoryFilter('all'); }}
                  className="shrink-0 p-1 rounded transition-colors text-[#666] hover:text-[#F85149] hover:bg-red-50"
                  title="Clear all SKU filters"
                >
                  <X size={14} />
                </button>
              )}

            </div>
          </div>
        </>}

        {/* ── Rail Controls + Summary ── */}
        {displayBrands.length > 0 && (
          <div className="border-t border-[rgba(215,183,151,0.25)] -mx-2 md:-mx-3 -mb-2 md:-mb-3 px-3 md:px-6 py-1.5 flex items-center gap-1.5">
            {/* Summary (left) */}
            <span className="text-xs text-[#666]">{displayBrands.length} Brands &middot; {grandTotals.skuCount} SKUs</span>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[rgba(215,183,151,0.08)] border border-[rgba(215,183,151,0.15)]">
              <span className="text-[10px] uppercase font-bold text-[#999] tracking-wide">Order</span>
              <span className="text-xs font-bold text-[#6B4D30]">{grandTotals.order}</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[rgba(18,119,73,0.06)] border border-[rgba(18,119,73,0.12)]">
              <span className="text-[10px] uppercase font-bold text-[#127749]/60 tracking-wide">Value</span>
              <span className="text-xs font-bold text-[#127749]">{formatCurrency(grandTotals.ttlValue)}</span>
            </div>

            <div className="flex-1" />

            {/* Collapse/Expand (right) */}
            <button
              type="button"
              onClick={() => {
                const allCollapsedNow = displayBrands.every((b: any) => collapsedBrands[String(b.id)] === true);
                const next: Record<string, boolean> = {};
                displayBrands.forEach((b: any) => { next[String(b.id)] = !allCollapsedNow; });
                setCollapsedBrands(next);
              }}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border border-[#C4B5A5] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.18)] transition-colors shrink-0"
            >
              <ChevronDown size={12} className={`transition-transform ${displayBrands.every((b: any) => collapsedBrands[String(b.id)] === true) ? '-rotate-90' : ''}`} />
              {displayBrands.every((b: any) => collapsedBrands[String(b.id)] === true) ? 'Expand All' : 'Collapse All'}
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-0.5 rounded-md p-0.5 bg-[rgba(160,120,75,0.10)]">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                title="Table view"
                className={`p-1 rounded transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white text-[#6B4D30] shadow-sm' : 'text-[#888] hover:text-[#6B4D30]'}`}
              >
                <List size={13} />
              </button>
              <button
                type="button"
                onClick={() => canShowCardView && setViewMode('card')}
                disabled={!canShowCardView}
                title={!canShowCardView ? 'Add SKUs to enable card view' : 'Card view'}
                className={`p-1 rounded transition-colors ${
                  viewMode === 'card'
                    ? 'bg-white text-[#6B4D30] shadow-sm' : 'text-[#888] hover:text-[#6B4D30]'} ${!canShowCardView ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <LayoutGrid size={13} />
              </button>
            </div>
          </div>
        )}
        </div>{/* end p-2 md:p-3 */}
        </div>{/* end overflow-hidden min-h-0 */}
        </div>{/* end grid animation wrapper */}
      </div>

      {!filtersComplete ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 animate-fadeIn">
          <div className="empty-state-rings mb-6">
            <span className="ring-3" />
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[rgba(215,183,151,0.12)] relative z-10">
              <Package size={28} className="text-[#8A6340]" />
            </div>
          </div>
          <h3 className="text-base font-bold font-['Montserrat'] mb-1.5 text-[#4A3728]">
            {t('skuProposal.noFilterTitle') || 'No data to display'}
          </h3>
          <p className="text-sm text-[#999] text-center max-w-sm">
            {t('skuProposal.noFilterDesc') || 'Please select a budget, season group and season from the filters above to view SKU proposal data.'}
          </p>
        </div>
      ) : !skuDataLoading && skuCatalog.length === 0 ? (
        <div className={`rounded-xl border p-10 text-center animate-fadeIn ${'bg-white border-[rgba(215,183,151,0.2)]'}`}>
          <Package size={36} className={`mx-auto mb-3 ${'text-[rgba(215,183,151,0.5)]'}`} />
          <p className={`font-medium font-['Montserrat'] ${'text-[#333333]'}`}>No SKU Catalog</p>
          <p className={`text-sm mt-1 mb-3 ${'text-[#666666]'}`}>Import SKU data first to begin creating proposals</p>
          <button
            onClick={() => router.push('/import-data')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold font-['Montserrat'] transition-colors ${'bg-[#C4A77D] text-white hover:bg-[#B8956D]'}`}
          >
            Go to Import
          </button>
        </div>
      ) : displayBrands.length === 0 ? (
        <div className={`rounded-xl border p-10 text-center animate-fadeIn ${'bg-white border-[rgba(215,183,151,0.2)]'}`}>
          <Package size={36} className={`mx-auto mb-3 ${'text-[rgba(215,183,151,0.5)]'}`} />
          <p className={`font-medium font-['Montserrat'] ${'text-[#333333]'}`}>{t('skuProposal.noSkuData')}</p>
          <p className={`text-sm mt-1 ${'text-[#666666]'}`}>Select a brand filter or add brands first</p>
        </div>
      ) : viewMode === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSkuItems.map(({ block, blockKey, item, idx, key }, cardIdx) => {
            return (
              <div key={key} className={`rounded-2xl border p-4 ${getCardBgClass(cardIdx)}`}>
                <div className="flex flex-wrap items-center gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    <ProductImage subCategory={block.subCategory} sku={item.sku} size={48} rounded="rounded-xl" />
                    <div>
                      <div className={`text-sm font-semibold ${'text-[#333333]'}`}>
                        <span className="font-['JetBrains_Mono']">{item.sku || 'New SKU'}</span> <span className={'text-[#666666]'}>•</span> {item.name || 'Select SKU'}
                      </div>
                      <div className={`text-xs ${'text-[#666666]'}`}>
                        {block.gender} • {block.category} • {block.subCategory}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenLightbox(key, 'details', item, blockKey, idx, block)}
                      className={`px-2 md:px-3 py-1 md:py-1 text-xs font-semibold rounded-full border transition-colors ${'border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.18)]'}`}
                    >
                      {t('skuProposal.showDetails')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenLightbox(key, 'storeOrder', item, blockKey, idx, block)}
                      className={`px-2 md:px-3 py-1 md:py-1 text-xs font-semibold rounded-full border transition-colors ${'border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.18)]'}`}
                    >
                      {t('skuProposal.storeOrder')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenLightbox(key, 'sizing', item, blockKey, idx, block)}
                      className={`px-2 md:px-3 py-1 md:py-1 text-xs font-semibold rounded-full border transition-colors ${'border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.18)]'}`}
                    >
                      {t('skuProposal.sizing')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSkuRow(blockKey, idx)}
                      className={`p-2 rounded-lg transition-colors ${'text-[#666666] hover:text-[#F85149] hover:bg-[rgba(248,81,73,0.1)]'}`}
                      title={t('proposal.deleteSku')}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {item.isNew && (
                  <div className="mt-3">
                    <select
                      value={item.sku}
                      onChange={(e) => handleSkuSelect(blockKey, idx, e.target.value)}
                      className={`w-full px-3 py-0.5 rounded-lg border-2 text-sm focus:outline-none focus:ring-2 font-['JetBrains_Mono'] ${'border-[#127749] bg-white text-[#333333] focus:ring-[rgba(18,119,73,0.3)]'}`}
                    >
                      <option value="">{t('proposal.selectSku')}</option>
                      {skuCatalog.map((sku: any) => (
                        <option key={sku.sku} value={sku.sku}>
                          {sku.sku} - {sku.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add SKU Card */}
          {filteredSkuBlocks.length > 0 && (
            <button
              onClick={() => {
                const firstBlock = filteredSkuBlocks[0];
                const blockKey = buildBlockKey(firstBlock);
                setAddSkuModal({ open: true, blockKey, block: firstBlock });
              }}
              className={`rounded-2xl border-2 border-dashed p-8 flex flex-col items-center justify-center gap-3 transition-colors duration-200 ${'border-[rgba(215,183,151,0.4)] hover:border-[#8A6340] hover:bg-[rgba(215,183,151,0.08)]'}`}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${'bg-[rgba(215,183,151,0.2)]'}`}>
                <Plus size={24} className={'text-[#6B4D30]'} />
              </div>
              <span className={`text-sm font-semibold font-['Montserrat'] ${'text-[#6B4D30]'}`}>
                Add New SKU
              </span>
              <span className={`text-xs ${'text-[#999999]'}`}>
                Click to add a new SKU to {filteredSkuBlocks[0]?.subCategory}
              </span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Per-Brand Sections */}
          {displayBrands.map((brand: any) => {
            const brandId = String(brand.id);
            const isBrandCollapsed = collapsedBrands[brandId] === true;
            const brandBlocks = brandSubcategoryBlocks[brandId] || [];
            const brandSkuCount = brandBlocks.reduce((s: number, b: any) => s + (b.items?.length || 0), 0);

            // Allocation/Planning validation per brand
            const hasFinalAH = matchedAllocateHeaders.some(
              (ah: any) => String(ah.brandId) === brandId && ah.isFinal
            );
            const hasFinalPlanning = (brandPlanningHeaders[brandId] || []).some(
              (v: any) => v.isFinal
            );
            const isLoadingPlanning = brandLoadingPlanning[brandId];
            const brandReady = filtersComplete && hasFinalAH && hasFinalPlanning;

            return (
              <div key={brandId} className={`rounded-xl shadow-sm border overflow-hidden ${'bg-white border-[#C4B5A5]'}`}>
                {/* Brand Section Header */}
                <div
                  onClick={() => setCollapsedBrands(prev => ({ ...prev, [brandId]: !isBrandCollapsed }))}
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-all ${'bg-gradient-to-r from-[rgba(215,183,151,0.14)] to-transparent hover:from-[rgba(215,183,151,0.22)]'}`}
                >
                  <span className={`p-1 rounded-lg transition-colors ${'bg-[rgba(138,99,64,0.1)] hover:bg-[rgba(138,99,64,0.2)]'}`}>
                    <ChevronDown size={15} className={`transition-transform duration-200 ${isBrandCollapsed ? '-rotate-90' : ''} ${'text-[#6B4D30]'}`} />
                  </span>
                  <Tag size={16} className={'text-[#6B4D30]'} />
                  <div className="flex flex-col min-w-0">
                    {brand.group_brand?.name || brand.groupBrand?.name ? (
                      <span className={`text-[10px] font-medium font-['Montserrat'] uppercase tracking-widest ${'text-[#6B4D30]/60'}`}>
                        {brand.group_brand?.name || brand.groupBrand?.name}
                      </span>
                    ) : null}
                    <span className={`font-semibold text-base font-['Montserrat'] uppercase tracking-wide ${'text-[#1A1A1A]'}`}>
                      {brand.name || brand.code || `Brand ${brand.id}`}
                    </span>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ml-1 ${'text-[#888]'}`}>
                    {brandBlocks.length} Rails &middot; {brandSkuCount} SKUs
                  </span>
                  {/* Per-brand Version & Choice dropdown buttons — only when allocation+planning validated */}
                  {brandReady && <div className="flex items-center gap-2 ml-auto" onClick={(e) => e.stopPropagation()}>
                    {/* Version dropdown button */}
                    {(() => {
                      const curVerId = getBrandSkuVersion(brandId);
                      const brandHeaders = brandProposalHeaders[brandId] || [];
                      const curVer = brandHeaders.find((h: any) => String(h.id) === String(curVerId));
                      const isFinal = curVer?.isFinal ?? false;
                      const isOpen = openDropdown?.type === 'version' && openDropdown?.brandId === brandId;
                      return (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isOpen) { setOpenDropdown(null); setDropdownAnchorEl(null); }
                            else { setOpenDropdown({ type: 'version', brandId }); setDropdownAnchorEl(e.currentTarget); }
                          }}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                            curVer
                              ? isFinal
                                ?'bg-[rgba(215,183,151,0.25)] text-[#6B4D30]':'bg-[rgba(18,119,73,0.15)] text-[#127749]':'bg-[rgba(215,183,151,0.15)] text-[#666666] hover:text-[#333333]'}`}
                        >
                          <ChevronDown size={11} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          {curVer ? (
                            <>
                              {isFinal && <Star size={11} className="shrink-0 fill-current" />}
                              <span className="whitespace-nowrap">Version {curVer.version}</span>
                              {isFinal && <span className="px-1 text-[9px] font-bold rounded bg-[#D7B797] text-[#0A0A0A]">FINAL</span>}
                            </>
                          ) : (
                            <>
                              <Sparkles size={11} className="shrink-0" />
                              <span className="whitespace-nowrap">{brandHeaders.length > 0 ? `${brandHeaders.length} Versions` : 'Version'}</span>
                            </>
                          )}
                        </button>
                      );
                    })()}
                    {/* Choice dropdown button */}
                    {(() => {
                      const curChoiceId = getBrandSizingChoice(brandId);
                      const brandChoices = getBrandSizingChoices(brandId);
                      const curChoice = brandChoices.find((c: any) => String(c.id) === String(curChoiceId));
                      const isFinal = curChoice?.isFinal ?? false;
                      const isOpen = openDropdown?.type === 'choice' && openDropdown?.brandId === brandId;
                      return (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isOpen) { setOpenDropdown(null); setDropdownAnchorEl(null); }
                            else { setOpenDropdown({ type: 'choice', brandId }); setDropdownAnchorEl(e.currentTarget); }
                          }}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                            curChoice
                              ? isFinal
                                ?'bg-[rgba(215,183,151,0.25)] text-[#6B4D30]':'bg-[rgba(18,119,73,0.15)] text-[#127749]':'bg-[rgba(215,183,151,0.15)] text-[#666666] hover:text-[#333333]'}`}
                        >
                          <ChevronDown size={11} className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          {curChoice ? (
                            <>
                              {isFinal && <Star size={11} className="shrink-0 fill-current" />}
                              <span className="whitespace-nowrap">Choice {curChoice.version}</span>
                              {isFinal && <span className="px-1 text-[9px] font-bold rounded bg-[#D7B797] text-[#0A0A0A]">FINAL</span>}
                            </>
                          ) : (
                            <>
                              <Sparkles size={11} className="shrink-0" />
                              <span className="whitespace-nowrap">{brandChoices.length > 0 ? `${brandChoices.length} Choices` : 'Choice'}</span>
                            </>
                          )}
                        </button>
                      );
                    })()}
                  </div>}
                </div>

                {/* Brand Content — conditional on allocation/planning validation */}
                {!isBrandCollapsed && (() => {
                  // Case 1: Filters not complete — show prompt
                  if (!filtersComplete) {
                    return (
                      <div className={`flex flex-col items-center gap-2 px-4 py-6 border-t ${'border-[#C4B5A5]'}`}>
                        <span className={`text-xs font-['Montserrat'] font-medium ${'text-[#999999]'}`}>
                          Please select Season Group and Season to view proposals.
                        </span>
                      </div>
                    );
                  }

                  // Case 2: No final AllocateHeader — "not allocated" warning
                  if (!hasFinalAH) {
                    return (
                      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-[#E8E0D8] bg-[#FEFCF9]">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={13} className="text-[#C9A036] shrink-0" />
                          <span className="text-[12px] font-['Montserrat'] font-medium text-[#8B7A5E]">
                            This brand has not been allocated yet.
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const matchedBudget = apiBudgets.find((b: any) => b.id === budgetFilter);
                            const groupBrandId = brand.group_brand_id || brand.groupBrandId || brand.group_brand?.id || null;
                            setAllocationData({
                              id: budgetFilter !== 'all' ? budgetFilter : null,
                              budgetName: matchedBudget?.budgetName || '',
                              year: matchedBudget?.fiscalYear || null,
                              totalBudget: matchedBudget?.totalBudget || 0,
                              groupBrandId,
                              brandId,
                              seasonGroupId: seasonGroupFilter !== 'all' ? seasonGroupFilter : null,
                              seasonId: seasonFilter !== 'all' ? seasonFilter : null});
                            router.push('/planning');
                          }}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold font-['Montserrat'] border border-[#D7B797]/50 text-[#6B4D30] hover:bg-[rgba(160,120,75,0.08)] transition-colors shrink-0"
                        >
                          Go to Budget Allocation
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    );
                  }

                  // Case 3: Loading planning data
                  if (isLoadingPlanning) {
                    return (
                      <div className={`flex items-center justify-center gap-2 px-4 py-6 border-t ${'border-[#C4B5A5]'}`}>
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" style={{ borderColor:'#6B4D30', borderTopColor: 'transparent' }} />
                        <span className={`text-xs font-['Montserrat'] ${'text-[#666666]'}`}>Loading planning data...</span>
                      </div>
                    );
                  }

                  // Case 4: No final PlanningHeader — "not planned" warning
                  if (!hasFinalPlanning) {
                    return (
                      <div className={`flex flex-col items-center gap-2 px-4 py-3 border-t ${'border-[#C4B5A5] bg-[rgba(227,179,65,0.08)]'}`}>
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={14} className={'text-[#B8860B]'} />
                          <span className={`text-xs font-['Montserrat'] font-medium ${'text-[#8B6914]'}`}>
                            OTB Analysis has not been finalized for this brand. Please complete OTB Analysis first.
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const matchedBudgetOtb = apiBudgets.find((b: any) => b.id === budgetFilter);
                            setOtbAnalysisContext({
                              budgetId: budgetFilter !== 'all' ? budgetFilter : null,
                              budgetName: matchedBudgetOtb?.budgetName || '',
                              fiscalYear: matchedBudgetOtb?.fiscalYear || null,
                              totalBudget: matchedBudgetOtb?.totalBudget || 0,
                              status: matchedBudgetOtb?.status || 'draft',
                              brandId,
                              brandName: brand.name || brand.code || '',
                              seasonGroup: seasonGroupFilter,
                              season: seasonFilter});
                            router.push('/otb-analysis');
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-['Montserrat'] border transition-all ${'bg-[#6B4D30] border-[#6B4D30] text-white hover:bg-[#5C4028] hover:border-[#5C4028]'}`}
                        >
                          Go to OTB Analysis
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    );
                  }

                  // Case 5: All conditions met — show full content
                  const hasHistorical = brandBlocks.some((b: any) => b.isHistorical);
                  return (
                  <div className="space-y-3 p-3">
                    {/* Previous Year Template Banner */}
                    {hasHistorical && (
                      <div className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border ${'bg-[rgba(107,77,48,0.06)] border-[rgba(215,183,151,0.4)]'}`}>
                        <div className="flex items-center gap-2">
                          <FileText size={14} className={'text-[#6B4D30]'} />
                          <span className={`text-xs font-semibold font-['Montserrat'] ${'text-[#6B4D30]'}`}>
                            Previous Year Template
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${'bg-[rgba(215,183,151,0.3)] text-[#6B4D30]'}`}>
                            Read-only
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            // Copy historical blocks as new draft (remove isHistorical flag)
                            setSkuBlocks(prev => prev.map((b: any) =>
                              b.brandId === brandId && b.isHistorical ? { ...b, isHistorical: false } : b
                            ));
                          }}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-['Montserrat'] transition-all ${'bg-[#6B4D30] text-white hover:bg-[#5C4028]'}`}
                        >
                          <FilePlus size={12} />
                          Use as Template
                        </button>
                      </div>
                    )}
                    {brandBlocks.length === 0 ? (
                      <div className={`p-6 text-center ${'text-[#999999]'}`}>
                        <p className="text-sm">No subcategories available for this brand</p>
                      </div>
                    ) : brandBlocks.map((block: any) => {
                      const key = buildBlockKey(block);
                      const isCollapsed = collapsed[key];
                      const isEmpty = !block.items || block.items.length === 0;
                      return (
                        <div key={key} data-rail-card className={`rounded-xl border ${'bg-white border-[rgba(215,183,151,0.2)]'}`} style={{ overflow: 'clip' }}>
                          <button
                            type="button"
                            onClick={() => !isEmpty && handleToggle(key)}
                            className={`w-full flex items-center gap-0 ${'bg-[rgba(215,183,151,0.18)] border-b border-[rgba(215,183,151,0.3)]'}`}
                          >
                            <div className={`w-1.5 self-stretch rounded-l-xl ${'bg-[#8A6340]'}`} />
                            <div className="flex items-center gap-3 px-4 py-2 flex-1">
                              {!isEmpty && <ChevronDown size={14} className={`transition-transform ${isCollapsed ? '-rotate-90' : ''} ${'text-[#6B4D30]'}`} />}
                              <div className="text-left flex-1">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[10px] font-semibold uppercase tracking-wider font-['Montserrat'] ${'text-[#8A6340]'}`}>RAIL</span>
                                  <span className={`font-semibold text-sm ${'text-[#6B4D30]'}`}>{block.subCategory}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${'bg-[rgba(160,120,75,0.12)] text-[#6B5B4D]'}`}>
                                    {block.items?.length || 0} SKUs
                                  </span>
                                  {!isEmpty && (() => {
                                    const { completed, total } = getSizingCount(key, block.items);
                                    return completed > 0 ? (
                                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                                        completed === total
                                          ? 'bg-[#127749]/15 text-[#2A9E6A]'
                                          : 'bg-[#D97706]/15 text-[#D97706]'
                                      }`}>
                                        {completed}/{total} sized
                                      </span>
                                    ) : null;
                                  })()}
                                </div>
                                <div className={`text-xs mt-0.5 ${'text-[#8A6340]'}`}>
                                  {block.gender} • {block.category}
                                </div>
                              </div>
                              {!isEmpty && (
                                <div className={`hidden md:flex items-center gap-4 text-xs font-['JetBrains_Mono'] ${'text-[#6B5B4D]'}`}>
                                  <div className="flex flex-col items-center">
                                    <span className={`text-[10px] font-['Montserrat'] ${'text-[#999999]'}`}>Order</span>
                                    <span className={`font-semibold ${'text-[#6B4D30]'}`}>{block.items.reduce((s: number, i: any) => s + (i.order || 0), 0)}</span>
                                  </div>
                                  {stores.map((st: any) => (
                                    <div key={st.code} className="flex flex-col items-center">
                                      <span className={`text-[10px] font-['Montserrat'] ${'text-[#999999]'}`}>{st.code}</span>
                                      <span className="font-semibold">{block.items.reduce((s: number, i: any) => s + ((i.storeQty || {})[st.code] || 0), 0)}</span>
                                    </div>
                                  ))}
                                  <div className={`h-6 w-px ${'bg-[rgba(215,183,151,0.4)]'}`} />
                                  <div className="flex flex-col items-center">
                                    <span className={`text-[10px] font-['Montserrat'] ${'text-[#999999]'}`}>Value</span>
                                    <span className={`font-semibold ${'text-[#127749]'}`}>{formatCurrency(block.items.reduce((s: number, i: any) => s + ((i.order || 0) * (i.unitCost || 0)), 0))}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </button>

                {/* Empty block — show row headers + Add New column */}
                {isEmpty && (
                  <div className="overflow-x-auto" style={{ overflowY: 'clip' }}>
                    {(() => {
                      const labelCls = `px-3 py-1.5 font-semibold font-['Montserrat'] whitespace-nowrap sticky left-0 z-10 ${'bg-white text-[#6B4D30] !border-r-[rgba(160,120,75,0.4)]'}`;
                      const emptyCls = `px-3 py-1.5 text-center min-w-[140px] ${'bg-white text-[#ccc]'}`;
                      const rowLabels = ['Actions', 'Image', 'SKU', 'Name', 'Product Type (L3)', 'Theme', 'Color', 'Composition', 'Unit cost', 'SRP', 'Order', 'Customer Target', 'Comment'];
                      return (
                        <table className={`w-full text-xs border-separate border-spacing-0 ${'[&_td]:border-[rgba(215,183,151,0.2)]'} [&_td]:border`}>
                          <tbody>
                            {rowLabels.map((label, ri) => (
                              <tr key={label}>
                                <td className={labelCls}>{label}</td>
                                <td className={`${emptyCls} ${label === 'Image' ? 'py-4' : ''}`}>
                                  {label === 'Image' ? <span className="text-[11px] italic opacity-50">—</span> : <span className="opacity-30">—</span>}
                                </td>
                                {ri === 0 && (
                                  <td rowSpan={999} className={`border-l-2 ${'bg-[rgba(215,183,151,0.04)] border-l-[rgba(215,183,151,0.35)]'}`} style={{ minWidth: 52, verticalAlign: 'middle' }}>
                                    <div className="flex items-center justify-center h-full" style={{ minHeight: 200 }}>
                                      <button
                                        type="button"
                                        onClick={() => setAddSkuModal({ open: true, blockKey: key, block })}
                                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg transition-colors ${'text-[#6B4D30] hover:bg-[rgba(160,120,75,0.12)]'}`}
                                        style={{ writingMode: 'vertical-lr' }}
                                      >
                                        <Plus size={14} />
                                        <span className={`text-[10px] font-semibold font-['Montserrat'] uppercase tracking-wider`}>Add new</span>
                                      </button>
                                    </div>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
                  </div>
                )}

                {/* Populated block — table + Add SKU button */}
                {!isEmpty && !isCollapsed && (<>
                  <div className="overflow-x-auto" data-table-wrapper style={{ overflowY: 'clip' }}>
                    {(() => {
                      const hlBg ='bg-[rgba(160,120,75,0.1)]';
                      const hlLabel ='bg-[#ede4d8]';
                      const normLabel ='bg-white';
                      const labelBase = `px-3 py-1.5 font-semibold font-['Montserrat'] whitespace-nowrap sticky left-0 z-10 cursor-pointer select-none transition-colors`;
                      const labelBorder ='!border-r-[rgba(160,120,75,0.4)]';
                      const labelColor ='text-[#6B4D30]';
                      const isHl = (rowId: string) => highlightedRow === `${key}_${rowId}`;
                      const toggleHl = (rowId: string) => setHighlightedRow(prev => prev === `${key}_${rowId}` ? null : `${key}_${rowId}`);
                      const trCls = (rowId: string, extra?: string) => `${isHl(rowId) ? hlBg : ''} ${extra || ''}`;
                      const tdLabel = (rowId: string, extra?: string) => `${labelBase} ${labelColor} ${isHl(rowId) ? hlLabel : normLabel} ${labelBorder} ${extra || ''}`;
                      return (
                    <table className={`w-full text-xs border-separate border-spacing-0 ${'[&_td]:border-[rgba(215,183,151,0.2)]'} [&_td]:border`}>
                      <tbody>
                        {/* Image row (with actions in top-right corner) */}
                        <tr className={trCls('image')}>
                          <td className={tdLabel('image', 'py-2')} onClick={() => toggleHl('image')}>Image</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-2 min-w-[140px] ${'bg-white'}`} style={{ position: 'relative' }}>
                              <div className="flex justify-end gap-0.5 absolute top-1 right-1">
                                <button type="button" onClick={() => handleOpenLightbox(`${key}_${String(item.sku) || 'new'}_${idx}`, 'sizing', item, key, idx, block)} className={`p-1 rounded-md transition-colors relative ${'text-[#666666] hover:text-[#6B4D30] hover:bg-[rgba(160,120,75,0.18)]'}`} title="Sizing">
                                  <Ruler size={14} />
                                  {isSizingComplete(key, idx) && (
                                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-[#2A9E6A] rounded-full flex items-center justify-center">
                                      <Check size={8} className="text-white" />
                                    </span>
                                  )}
                                </button>
                                <button type="button" onClick={() => handleDeleteSkuRow(key, idx)} className={`p-1 rounded-md transition-colors ${'text-[#666666] hover:text-[#F85149] hover:bg-[rgba(248,81,73,0.1)]'}`} title={t('proposal.deleteSku')}><Trash2 size={14} /></button>
                              </div>
                              <div className="mx-auto w-fit pt-3">
                                <ProductImage subCategory={block.subCategory} sku={item.sku} size={64} />
                              </div>
                            </td>
                          ))}
                          {/* Add New column */}
                          <td rowSpan={999} className={`border-l-2 ${'bg-[rgba(215,183,151,0.04)] border-l-[rgba(215,183,151,0.35)]'}`} style={{ minWidth: 52, verticalAlign: 'middle' }}>
                            <div className="flex items-center justify-center h-full" style={{ minHeight: 200 }}>
                              <button
                                type="button"
                                onClick={() => setAddSkuModal({ open: true, blockKey: key, block })}
                                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg transition-colors ${'text-[#6B4D30] hover:bg-[rgba(160,120,75,0.12)]'}`}
                                style={{ writingMode: 'vertical-lr' }}
                              >
                                <Plus size={14} />
                                <span className={`text-[10px] font-semibold font-['Montserrat'] uppercase tracking-wider`}>Add new</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                        {/* SKU row */}
                        <tr className={trCls('sku')}>
                          <td className={tdLabel('sku')} onClick={() => toggleHl('sku')}>SKU</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center font-semibold font-['JetBrains_Mono'] ${'text-[#333333]'}`}>
                              {item.isNew ? (
                                <select
                                  value={item.sku}
                                  onChange={(e) => handleSkuSelect(key, idx, e.target.value)}
                                  className={`w-full px-1 py-0.5 rounded border text-xs font-['JetBrains_Mono'] ${'border-[#127749] bg-white text-[#333333]'}`}
                                >
                                  <option value="">{t('proposal.selectSku')}</option>
                                  {skuCatalog.map((sku: any) => (
                                    <option key={String(sku.sku)} value={sku.sku}>{sku.sku}</option>
                                  ))}
                                </select>
                              ) : String(item.sku)}
                            </td>
                          ))}
                        </tr>
                        {/* Name row */}
                        <tr className={trCls('name')}>
                          <td className={tdLabel('name')} onClick={() => toggleHl('name')}>Name</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center ${'text-[#333333]'}`}>{item.name}</td>
                          ))}
                        </tr>
                        {/* Product Type (L3) row */}
                        <tr className={trCls('productType')}>
                          <td className={tdLabel('productType')} onClick={() => toggleHl('productType')}>Product Type (L3)</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center ${'text-[#666666]'}`}>{item.productType}</td>
                          ))}
                        </tr>
                        {/* Theme row */}
                        <tr className={trCls('theme')}>
                          <td className={tdLabel('theme')} onClick={() => toggleHl('theme')}>Theme</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center ${'text-[#666666]'}`}>{item.theme}</td>
                          ))}
                        </tr>
                        {/* Color row */}
                        <tr className={trCls('color')}>
                          <td className={tdLabel('color')} onClick={() => toggleHl('color')}>Color</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center ${'text-[#666666]'}`}>{item.color}</td>
                          ))}
                        </tr>
                        {/* Composition row */}
                        <tr className={trCls('composition')}>
                          <td className={tdLabel('composition')} onClick={() => toggleHl('composition')}>Composition</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center max-w-[160px] ${'text-[#666666]'}`} title={item.composition}>{item.composition}</td>
                          ))}
                        </tr>
                        {/* Unit cost row */}
                        <tr className={trCls('unitCost')}>
                          <td className={tdLabel('unitCost')} onClick={() => toggleHl('unitCost')}>Unit cost</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center font-['JetBrains_Mono'] ${'text-[#333333]'}`}>{formatCurrency(item.unitCost)}</td>
                          ))}
                        </tr>
                        {/* SRP row */}
                        <tr className={trCls('srp')}>
                          <td className={tdLabel('srp')} onClick={() => toggleHl('srp')}>SRP</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center font-medium font-['JetBrains_Mono'] ${'text-[#127749]'}`}>{formatCurrency(item.srp)}</td>
                          ))}
                        </tr>
                        {/* Order row - always highlighted */}
                        <tr className={trCls('order','bg-[rgba(160,120,75,0.06)]')}>
                          <td className={`${labelBase} font-bold cursor-pointer select-none transition-colors ${labelBorder} ${'text-[#c0392b]'} ${isHl('order') ? hlLabel : ('bg-[#f5efe8]')}`} onClick={() => toggleHl('order')}>Order</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center font-bold font-['JetBrains_Mono'] ${'text-[#c0392b]'}`}>{item.order}</td>
                          ))}
                        </tr>
                        {/* Dynamic store rows */}
                        {stores.map((st: any) => (
                          <tr key={st.code} className={trCls(`store_${st.code}`)}>
                            <td className={tdLabel(`store_${st.code}`)} onClick={() => toggleHl(`store_${st.code}`)}>{st.code}</td>
                            {block.items.map((item: any, idx: number) => {
                              const storeKey = `${key}|${idx}|store_${st.code}`;
                              const isEditingStore = editingCell === storeKey;
                              const storeVal = (item.storeQty || {})[st.code] || 0;
                              return (
                                <td key={idx} className="px-3 py-1.5 text-center">
                                  {isEditingStore ? (
                                    <div className="relative group inline-block">
                                      <input
                                        type="number"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={() => handleSaveEdit(storeKey)}
                                        onKeyDown={(e) => handleKeyDown(e, storeKey)}
                                        className={`w-14 pl-4 py-0.5 text-center border-2 rounded-md text-xs font-semibold font-['JetBrains_Mono'] ${'border-[#D7B797] bg-white text-[#333333]'}`}
                                        autoFocus
                                      />
                                      <Pencil size={8} className="absolute left-1 top-1/2 -translate-y-1/2 pointer-events-none text-[#8A6340]/30" />
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleStartEdit(storeKey, storeVal)}
                                      className={`px-2 py-0.5 rounded-md font-['JetBrains_Mono'] transition-colors ${'text-[#333333] hover:bg-[rgba(160,120,75,0.12)]'}`}
                                    >
                                      {storeVal}
                                    </button>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                        {/* TTL value row - always highlighted */}
                        <tr className={trCls('ttlValue','bg-[rgba(160,120,75,0.06)]')}>
                          <td className={`${labelBase} font-bold cursor-pointer select-none transition-colors ${labelBorder} ${'text-[#6B4D30]'} ${isHl('ttlValue') ? hlLabel : ('bg-[#f5efe8]')}`} onClick={() => toggleHl('ttlValue')}>TTL value</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className={`px-3 py-1.5 text-center font-bold font-['JetBrains_Mono'] ${'text-[#127749]'}`}>{formatCurrency(item.order * (item.unitCost || 0))}</td>
                          ))}
                        </tr>
                        {/* Customer Target row */}
                        <tr className={trCls('customerTarget')}>
                          <td className={tdLabel('customerTarget')} onClick={() => toggleHl('customerTarget')}>Customer Target</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className="px-3 py-1.5 text-center">
                              <CreatableSelect
                                value={item.customerTarget}
                                options={customerTargetOptions}
                                onChange={(val) => handleSelectChange(key, idx, 'customerTarget', val)}
                                onCreateOption={(val) => setCustomerTargetOptions(prev => [...prev, val])}
                                placeholder="Target..."
                              />
                            </td>
                          ))}
                        </tr>
                        {/* Comment row — last row */}
                        <tr className={trCls('comment')}>
                          <td className={tdLabel('comment')} onClick={() => toggleHl('comment')}>Comment</td>
                          {block.items.map((item: any, idx: number) => (
                            <td key={idx} className="px-3 py-1.5 text-center">
                              <div className="relative">
                                <input
                                  type="text"
                                  value={item.comment || ''}
                                  onChange={(e) => handleSelectChange(key, idx, 'comment', e.target.value)}
                                  onClick={(e) => {
                                    if (item.comment) {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setCommentPopup({ text: item.comment, blockKey: key, idx, rect });
                                    }
                                  }}
                                  placeholder="..."
                                  className={`w-full min-w-[80px] px-2 py-1 text-xs text-center border rounded-md outline-none transition-colors truncate ${'bg-transparent border-[rgba(215,183,151,0.3)] text-[#333333] placeholder-[#aaa] focus:border-[#C4A77D]'}`}
                                />
                              </div>
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                      );
                    })()}
                  </div>
                </>)}
                        </div>
                      );
                    })}
                  </div>
                  );
                })()}

                {/* Per-brand Save / Save as New Version footer */}
                {!isBrandCollapsed && brandReady && (
                  <div className={`flex items-center justify-end gap-2 px-4 py-2 border-t ${'border-[#C4B5A5] bg-[#F9F7F5]'}`}>
                    {brandSaving[brandId] && (
                      <span className={`text-xs font-['Montserrat'] ${'text-[#999999]'}`}>Saving...</span>
                    )}
                    <button
                      disabled={brandSaving[brandId]}
                      onClick={(e) => { e.stopPropagation(); handleSaveBrand(brandId, false); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-['Montserrat'] border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${'bg-[rgba(160,120,75,0.1)] border-[rgba(160,120,75,0.35)] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.18)] hover:border-[rgba(160,120,75,0.5)]'}`}
                    >
                      <Save size={13} />
                      Save
                    </button>
                    <button
                      disabled={brandSaving[brandId]}
                      onClick={(e) => { e.stopPropagation(); handleSaveBrand(brandId, true); }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-['Montserrat'] border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${'bg-[#6B4D30] border-[#6B4D30] text-white hover:bg-[#5C4028] hover:border-[#5C4028]'}`}
                    >
                      <FilePlus size={13} />
                      Save as New Version
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Sticky Grand Total Bar */}
          {grandTotals.skuCount > 0 && (
            <div className={`rounded-xl border overflow-hidden ${'bg-white border-[#D7B797]/40'}`}>
              <div className="flex items-center gap-0">
                <div className={`w-1.5 self-stretch ${'bg-[#127749]'}`} />
                <div className="flex flex-wrap items-center flex-1 px-4 py-2.5 gap-3">
                  <span className={`text-xs font-semibold font-['Montserrat'] uppercase tracking-wide ${'text-[#6B4D30]'}`}>
                    GRAND TOTAL — {displayBrands.length} Brands • {grandTotals.skuCount} SKUs
                  </span>
                  <div className="flex items-center gap-5 text-xs font-['JetBrains_Mono']">
                    <div className="flex flex-col items-center">
                      <span className={`text-[10px] font-['Montserrat'] ${'text-[#999999]'}`}>Order</span>
                      <span className={`font-bold ${'text-[#6B4D30]'}`}>{grandTotals.order}</span>
                    </div>
                    {stores.map((st: any) => (
                      <div key={st.code} className="flex flex-col items-center">
                        <span className={`text-[10px] font-['Montserrat'] ${'text-[#999999]'}`}>{st.code}</span>
                        <span className={`font-bold ${'text-[#6B4D30]'}`}>{grandTotals.storeQty[st.code] || 0}</span>
                      </div>
                    ))}
                    <div className={`h-6 w-px ${'bg-[rgba(215,183,151,0.5)]'}`} />
                    <div className="flex flex-col items-center">
                      <span className={`text-[10px] font-['Montserrat'] uppercase tracking-wider ${'text-[#999999]'}`}>Total Value</span>
                      <span className={`font-bold text-lg font-['JetBrains_Mono'] ${'text-[#C4A77D]'}`}>{formatCurrency(grandTotals.ttlValue)}</span>
                    </div>
                  </div>
                  <div className="ml-auto">
                    <button
                      onClick={() => {
                        if (onSubmitTicket) {
                          // Enrich items with sizing data for each brand's selected choice
                          const enrichedBlocks = filteredSkuBlocks.map((block: any) => ({
                            ...block,
                            items: (block.items || []).map((item: any, idx: number) => {
                              const blockKey = buildBlockKey(block);
                              const bId = block.brandId || 'all';
                              const choices = getBrandSizingChoices(bId);
                              const finalChoice = choices.find((c: any) => c.isFinal);
                              const choiceKey = finalChoice ? String(finalChoice.id) : (choices[0] ? String(choices[0].id) : 'default');
                              const sizing = getSizing(blockKey, idx, bId);
                              const choiceSizing = sizing[choiceKey] || {};
                              return { ...item, sizing: choiceSizing };
                            })}));
                          onSubmitTicket({ budgetId: budgetFilter !== 'all' ? budgetFilter : '', skuBlocks: enrichedBlocks, grandTotals, stores });
                        } else {
                          router.push(`/tickets?source=proposal&budgetId=${budgetFilter !== 'all' ? budgetFilter : ''}`);
                        }
                      }}
                      disabled={grandTotals.order === 0}
                      className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold font-['Montserrat'] transition-colors ${
                        grandTotals.order > 0
                          ?'bg-[#C4A77D] text-white hover:bg-[#B8956D]':'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                    >
                      <Send size={16} />
                      Submit Ticket
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Version / Choice Portal Dropdown */}
      {openDropdown && dropdownAnchorEl && typeof document !== 'undefined' && (() => {
        const rect = dropdownAnchorEl.getBoundingClientRect();
        const isVersion = openDropdown.type === 'version';
        const items = isVersion ? (brandProposalHeaders[openDropdown.brandId] || []) : (brandSizingHeaders[openDropdown.brandId] || []);
        const selectedId = isVersion ? getBrandSkuVersion(openDropdown.brandId) : getBrandSizingChoice(openDropdown.brandId);
        const dropdownW = 220;
        const overflowRight = rect.right > window.innerWidth - dropdownW;
        return createPortal(
          <div
            className="sku-version-portal"
            style={{
              position: 'fixed',
              top: rect.bottom + 4,
              right: overflowRight ? Math.max(8, window.innerWidth - rect.right) : undefined,
              left: overflowRight ? undefined : rect.left,
              zIndex: 99999,
              minWidth: dropdownW}}
          >
            <div className={`border rounded-lg shadow-xl overflow-hidden ${'bg-white border-[#C4B5A5]'}`}>
              <div className={`px-2 py-1 border-b ${'border-[#D4C8BB] bg-[rgba(160,120,75,0.08)]'}`}>
                <span className={`text-[10px] font-semibold uppercase tracking-wide font-['Montserrat'] ${'text-[#666666]'}`}>
                  {isVersion ? 'SKU Versions' : 'Sizing Choices'}
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {items.map((item: any) => {
                  const isFinal = item.isFinal ?? false;
                  const isSelected = String(item.id) === String(selectedId);
                  return (
                    <div
                      key={item.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isVersion) {
                          setBrandSkuVersion(prev => ({ ...prev, [openDropdown.brandId]: String(item.id) }));
                          loadProposalVersion(openDropdown.brandId, String(item.id));
                        } else {
                          setBrandSizingChoice(prev => ({ ...prev, [openDropdown.brandId]: String(item.id) }));
                        }
                        setOpenDropdown(null);
                        setDropdownAnchorEl(null);
                      }}
                      className={`px-3 py-1.5 flex items-center justify-between cursor-pointer transition-colors text-xs border-t ${'border-[#E5E0DB]'} ${
                        isSelected
                          ?'bg-[rgba(18,119,73,0.1)] text-[#127749]':'hover:bg-[rgba(160,120,75,0.18)] text-[#0A0A0A]'}`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {isFinal && <Star size={11} className={'text-[#6B4D30] fill-[#6B4D30] shrink-0'} />}
                        <span className="font-medium truncate">{isVersion ? `Version ${item.version}` : `Choice ${item.version}`}</span>
                        {isVersion && item.status && (
                          <span className={`text-[9px] px-1 rounded ${
                            item.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                            item.status === 'SUBMITTED' ? 'bg-blue-500/20 text-blue-400' :
                            item.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :'bg-[#E5E0DB] text-[#666]'}`}>{item.status}</span>
                        )}
                        {isFinal && <span className="px-1 py-px text-[8px] font-bold bg-[#D7B797] text-[#0A0A0A] rounded shrink-0">FINAL</span>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!isFinal && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (isVersion) handleSetFinalVersion(openDropdown.brandId, item.id, e);
                              else handleSetFinalSizing(openDropdown.brandId, item.id, e);
                              setOpenDropdown(null);
                              setDropdownAnchorEl(null);
                            }}
                            title={isVersion ? 'Set as final version' : 'Set as final choice'}
                            className={`p-0.5 rounded transition-colors ${'text-[#aaa] hover:text-[#6B4D30] hover:bg-[rgba(160,120,75,0.15)]'}`}
                          >
                            <Star size={10} />
                          </button>
                        )}
                        {isSelected && <Check size={11} className="text-[#127749]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        );
      })()}

      {/* SKU Lightbox Modal — Portal to body for full-screen blur */}
      {lightbox && lightbox.open && lightbox.item && createPortal(
        <div className="fixed inset-0 backdrop-blur-md flex items-center justify-center z-50" onClick={(e) => { if (e.target === e.currentTarget) handleCloseLightbox(); }}>
          <div ref={lightboxRef} className={`rounded-2xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] flex flex-col border ${'bg-white border-[rgba(215,183,151,0.3)]'}`} style={{ boxShadow: '0 25px 60px -12px rgba(0,0,0,0.4), 0 10px 30px -8px rgba(0,0,0,0.3), 0 0 0 1px rgba(0,0,0,0.05)' }}>
            {/* Header */}
            <div className={`px-6 py-4 flex items-center justify-between ${'bg-[rgba(160,120,75,0.18)] border-b border-[rgba(215,183,151,0.3)]'}`}>
              <div className="flex items-center gap-3">
                <ProductImage subCategory={lightbox.block?.subCategory || ''} sku={lightbox.item.sku} size={40} rounded="rounded-xl" />
                <div>
                  <h3 className={`text-base font-bold font-['Montserrat'] ${'text-[#6B4D30]'}`}>
                    <span className="font-['JetBrains_Mono']">{lightbox.item.sku}</span> - {lightbox.item.name}
                  </h3>
                  <p className={`text-xs ${'text-[#6B5B4D]'}`}>
                    {lightbox.block?.gender} {lightbox.block?.category && `• ${lightbox.block.category}`} {lightbox.block?.subCategory && `• ${lightbox.block.subCategory}`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCloseLightbox}
                className={`p-2 rounded-lg transition-colors ${'hover:bg-[rgba(215,183,151,0.2)]'}`}
              >
                <X size={20} className={'text-[#6B4D30]'} />
              </button>
            </div>

            {/* Tab Buttons */}
            <div className={`flex border-b ${'border-[rgba(215,183,151,0.3)]'}`}>
              {([['details', t('skuProposal.showDetails')], ['storeOrder', t('skuProposal.storeOrder')], ['sizing', t('skuProposal.sizing')]] as const).map(([tabId, label]) => (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => setLightbox(prev => prev ? { ...prev, tab: tabId as 'details' | 'storeOrder' | 'sizing' } : null)}
                  className={`flex-1 px-4 py-2.5 text-xs font-semibold font-['Montserrat'] transition-colors relative ${
                    lightbox.tab === tabId
                      ?'text-[#6B4D30]':'text-[#999999] hover:text-[#666666]'}`}
                >
                  {label}
                  {lightbox.tab === tabId && (
                    <span className={`absolute bottom-0 left-2 right-2 h-0.5 rounded-full ${'bg-[#6B4D30]'}`} />
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="overflow-y-auto flex-1 p-4 md:p-6">
              {/* Details Tab */}
              {lightbox.tab === 'details' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className={`text-xs ${'text-[#666666]'}`}>Product type</span>
                    <div className={`font-medium ${'text-[#333333]'}`}>{lightbox.item.productType}</div>
                  </div>
                  <div>
                    <span className={`text-xs ${'text-[#666666]'}`}>Theme</span>
                    <div className={`font-medium ${'text-[#333333]'}`}>{lightbox.item.theme}</div>
                  </div>
                  <div>
                    <span className={`text-xs ${'text-[#666666]'}`}>Color</span>
                    <div className={`font-medium ${'text-[#333333]'}`}>{lightbox.item.color}</div>
                  </div>
                  <div>
                    <span className={`text-xs ${'text-[#666666]'}`}>Composition</span>
                    <div className={`font-medium ${'text-[#333333]'}`}>{lightbox.item.composition}</div>
                  </div>
                  <div>
                    <span className={`text-xs ${'text-[#666666]'}`}>Unit cost</span>
                    <div className={`font-medium font-['JetBrains_Mono'] ${'text-[#333333]'}`}>{formatCurrency(lightbox.item.unitCost)}</div>
                  </div>
                  <div>
                    <span className={`text-xs ${'text-[#666666]'}`}>SRP</span>
                    <div className={`font-medium font-['JetBrains_Mono'] ${'text-[#127749]'}`}>{formatCurrency(lightbox.item.srp)}</div>
                  </div>
                  <div>
                    <CreatableSelect
                      value={lightbox.item.customerTarget}
                      options={customerTargetOptions}
                      onChange={(val) => handleSelectChange(lightbox.blockKey, lightbox.idx, 'customerTarget', val)}
                      onCreateOption={(val) => setCustomerTargetOptions(prev => [...prev, val])}
                      placeholder="Select target..."
                      label="Customer target"
                    />
                  </div>
                </div>
              )}

              {/* Store Order Tab */}
              {lightbox.tab === 'storeOrder' && (
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-220px)]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10">
                      <tr className={'bg-[rgba(160,120,75,0.12)] text-[#666666]'}>
                        <th className="px-4 py-2 text-left">Store</th>
                        <th className="px-4 py-2 text-center font-['JetBrains_Mono']">ORDER</th>
                        <th className="px-4 py-2 text-right font-['JetBrains_Mono']">TTL VALUE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stores.map((st: any, si: number) => {
                        const storeVal = (lightbox.item.storeQty || {})[st.code] || 0;
                        const colors = ['bg-[#D7B797]', 'bg-[#127749]', 'bg-[#58A6FF]', 'bg-[#A371F7]', 'bg-[#E3B341]'];
                        return (
                          <tr key={st.code} className={`border-t ${'border-gray-300'}`}>
                            <td className={`px-4 py-2 ${'text-gray-700'}`}>
                              <span className="inline-flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${colors[si % colors.length]}`} />{st.code}</span>
                            </td>
                            <td className="px-4 py-2 text-center">
                              <div className="relative group inline-block">
                                <input
                                  type="number"
                                  min="0"
                                  value={storeVal}
                                  onChange={(e) => handleNumberChange(lightbox.blockKey, lightbox.idx, `store_${st.code}`, e.target.value)}
                                  className={`w-20 pl-5 text-center font-['JetBrains_Mono'] text-sm rounded-lg border py-1 focus:outline-none focus:ring-2 focus:ring-[rgba(215,183,151,0.4)] ${'bg-white border-[rgba(215,183,151,0.4)] text-gray-800 focus:border-[#D7B797]'}`}
                                />
                                <Pencil size={8} className="absolute left-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-[#8A6340]/30" />
                              </div>
                            </td>
                            <td className={`px-4 py-2 text-right font-['JetBrains_Mono'] ${'text-gray-800'}`}>{formatCurrency(storeVal * (lightbox.item.unitCost || 0))}</td>
                          </tr>
                        );
                      })}
                      <tr className={`border-t-2 ${'border-[#D7B797]/40 bg-[rgba(160,120,75,0.12)]'}`}>
                        <td className={`px-4 py-2 font-semibold ${'text-[#6B4D30]'}`}>{t('skuProposal.total')}</td>
                        <td className={`px-4 py-2 text-center font-bold font-['JetBrains_Mono'] ${'text-gray-800'}`}>{lightbox.item.order || 0}</td>
                        <td className={`px-4 py-2 text-right font-bold font-['JetBrains_Mono'] ${'text-gray-800'}`}>{formatCurrency((lightbox.item.order || 0) * (lightbox.item.unitCost || 0))}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Sizing Tab */}
              {lightbox.tab === 'sizing' && (
                <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-220px)]">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10">
                      <tr className={'bg-[rgba(215,183,151,0.2)] text-[#6B4D30]'}>
                        <th className="px-4 py-2 text-left font-semibold font-['Montserrat']">{lightbox.item.productType}</th>
                        <th className="px-4 py-2 text-center font-semibold font-['JetBrains_Mono']">0002</th>
                        <th className="px-4 py-2 text-center font-semibold font-['JetBrains_Mono']">0004</th>
                        <th className="px-4 py-2 text-center font-semibold font-['JetBrains_Mono']">0006</th>
                        <th className="px-4 py-2 text-center font-semibold font-['JetBrains_Mono']">0008</th>
                        <th className={`px-4 py-2 text-center font-semibold font-['Montserrat'] ${'bg-[rgba(215,183,151,0.25)]'}`}>Sum</th>
                      </tr>
                    </thead>
                    <tbody className={'text-[#333333]'}>
                      <tr className={'border-b border-[rgba(215,183,151,0.2)] bg-[rgba(160,120,75,0.08)]'}>
                        <td className={`px-4 py-2 font-medium ${'text-[#333333]'}`}>% Sales mix</td>
                        <td className="px-4 py-2 text-center font-['JetBrains_Mono']">6%</td>
                        <td className="px-4 py-2 text-center font-['JetBrains_Mono']">33%</td>
                        <td className="px-4 py-2 text-center font-['JetBrains_Mono']">33%</td>
                        <td className="px-4 py-2 text-center font-['JetBrains_Mono']">28%</td>
                        <td className={`px-4 py-2 text-center font-semibold font-['JetBrains_Mono'] ${'bg-[rgba(160,120,75,0.12)]'}`}>100%</td>
                      </tr>
                      <tr className={'border-b border-[rgba(215,183,151,0.2)]'}>
                        <td className={`px-4 py-2 font-medium ${'text-[#333333]'}`}>% ST</td>
                        <td className="px-4 py-2 text-center font-['JetBrains_Mono']">50%</td>
                        <td className="px-4 py-2 text-center font-['JetBrains_Mono']">43%</td>
                        <td className="px-4 py-2 text-center font-['JetBrains_Mono']">30%</td>
                        <td className="px-4 py-2 text-center font-['JetBrains_Mono']">63%</td>
                        <td className={`px-4 py-2 text-center font-['JetBrains_Mono'] ${'text-[#999999] bg-[rgba(160,120,75,0.12)]'}`}>-</td>
                      </tr>
                      {(() => {
                        // Sizing headers are now at the proposal header level (A/B/C shared across all SKUs)
                        const lbBrandId = lightbox.blockKey.split('_')[0] || 'all';
                        const headerChoices = (brandSizingHeaders[lbBrandId] || []).map((sh: any) => ({
                          id: String(sh.id),
                          version: sh.version ?? 1,
                          isFinal: sh.isFinal ?? false,
                        })).sort((a: any, b: any) => a.version - b.version);
                        return headerChoices.length >= 3 ? headerChoices.slice(0, 3) : [
                          { id: 'choiceA', version: 1, isFinal: false },
                          { id: 'choiceB', version: 2, isFinal: false },
                          { id: 'choiceC', version: 3, isFinal: false },
                        ];
                      })().map((choice: any, ci: number) => {
                        const choiceKey = String(choice.id);
                        const lbBrandId = lightbox.blockKey.split('_')[0] || 'all';
                        const sizing = getSizing(lightbox.blockKey, lightbox.idx, lbBrandId);
                        const choiceData = sizing[choiceKey] || { ...EMPTY_SIZE_DATA };
                        const isFirst = ci === 0;
                        return (
                          <tr key={choice.id} className={isFirst
                            ? ('border-b border-[rgba(215,183,151,0.2)] bg-[rgba(160,120,75,0.12)]')
                            : ('border-b border-[rgba(215,183,151,0.2)] bg-[rgba(18,119,73,0.03)]')
                          }>
                            <td className={`px-4 py-2 font-medium ${isFirst ? ('text-[#6B4D30]') : ('text-[#127749]')}`}>
                              Choice {choice.version === 1 ? 'A' : choice.version === 2 ? 'B' : 'C'}{choice.isFinal && <span className="ml-1 text-[10px] font-bold text-[#2A9E6A]">FINAL</span>}
                            </td>
                            {['s0002', 's0004', 's0006', 's0008'].map((size: any) => (
                              <td key={size} className="px-2 py-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  value={choiceData[size] ?? 0}
                                  onChange={(e) => updateSizing(lightbox.blockKey, lightbox.idx, choiceKey, size, e.target.value, lbBrandId)}
                                  className={`w-14 text-center font-['JetBrains_Mono'] text-sm rounded border py-0.5 focus:outline-none focus:ring-2 focus:ring-[rgba(215,183,151,0.4)] ${
                                    isFirst
                                      ? ('bg-emerald-50 border-emerald-200 text-[#6B4D30]')
                                      : ('bg-emerald-50 border-emerald-200 text-[#127749]')
                                  }`}
                                />
                              </td>
                            ))}
                            <td className={`px-4 py-2 text-center font-semibold font-['JetBrains_Mono'] ${isFirst ? ('text-[#6B4D30] bg-[rgba(215,183,151,0.2)]') : ('text-[#127749] bg-[rgba(18,119,73,0.08)]')}`}>{calculateSum(choiceData)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className={`px-6 py-3 flex justify-end gap-3 border-t ${'border-[rgba(215,183,151,0.3)]'}`}>
              <button
                onClick={handleCloseLightbox}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${'text-[#666666] hover:bg-[rgba(160,120,75,0.12)] hover:text-[#6B4D30]'}`}
              >
                Close
              </button>
              <button
                onClick={handleCloseLightbox}
                className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors shadow-sm ${'bg-[#D7B797] text-[#333333] hover:bg-[#C4A584]'}`}
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Mobile Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={filterOpen}
        onClose={closeFilter}
        filters={[
          {
            key: 'fy',
            label: 'FY',
            type: 'single',
            options: fyOptions.filter((o: any) => o.value !== 'all').map((o: any) => ({ label: o.label, value: o.value }))},
          {
            key: 'budget',
            label: t('skuProposal.budget') || 'Budget',
            type: 'single',
            options: filteredBudgets.map((b: any) => ({ label: b.budgetName, value: b.id }))},
          {
            key: 'brand',
            label: 'Brand',
            type: 'single',
            options: brandOptions.filter((b: any) => b.value !== 'all').map((b: any) => ({ label: b.label, value: b.value }))},
          {
            key: 'seasonGroup',
            label: t('otbAnalysis.seasonGroup'),
            type: 'single',
            options: seasonGroupOptions.filter((s: any) => s.value !== 'all').map((s: any) => ({ label: s.label, value: s.value }))},
          {
            key: 'season',
            label: t('otbAnalysis.season') || 'Season',
            type: 'single',
            options: seasonOptions.filter((s: any) => s.value !== 'all').map((s: any) => ({ label: s.label, value: s.value }))},
        ]}
        values={mobileFilterValues}
        onChange={(key, value) => setMobileFilterValues(prev => ({ ...prev, [key]: value }))}
        onApply={() => {
          setFyFilter((mobileFilterValues.fy as string) || 'all');
          setBudgetFilter((mobileFilterValues.budget as string) || 'all');
          setBrandFilter((mobileFilterValues.brand as string) || 'all');
          setSeasonGroupFilter((mobileFilterValues.seasonGroup as string) || 'all');
          setSeasonFilter((mobileFilterValues.season as string) || 'all');
        }}
        onReset={() => {
          setMobileFilterValues({});
          setFyFilter('all');
          setBudgetFilter('all');
          setBrandFilter('all');
          setSeasonGroupFilter('all');
          setSeasonFilter('all');
        }}
      />
      <ConfirmDialog {...dialogProps} />

      {/* Add SKU Modal */}
      {addSkuModal && (
        <AddSKUModal
          isOpen={addSkuModal.open}
          onClose={() => setAddSkuModal(null)}
          skuCatalog={skuCatalog}
          blockGender={addSkuModal.block?.gender}
          blockCategory={addSkuModal.block?.category}
          blockSubCategory={addSkuModal.block?.subCategory}
          existingSkus={
            skuBlocks
              .find((b: any) => buildBlockKey(b) === addSkuModal.blockKey)
              ?.items.map((i: any) => i.sku).filter(Boolean) || []
          }
          onAddSkus={(skus) => handleAddSkusFromModal(addSkuModal.blockKey, skus, addSkuModal.block)}
          stores={stores}
          customerTargetOptions={customerTargetOptions}
          onCreateCustomerTarget={(val) => setCustomerTargetOptions(prev => [...prev, val])}
        />
      )}

      {/* Comment popup — portal */}
      {commentPopup && createPortal(
        <div
          className="fixed inset-0 z-[9999]"
          onClick={() => setCommentPopup(null)}
        >
          <div
            className={`fixed rounded-lg border px-4 py-3 max-w-xs shadow-xl animate-scalePop ${'bg-white border-[#D4CCC2] text-[#333333]'}`}
            style={{
              top: commentPopup.rect.top - 8,
              left: commentPopup.rect.left + commentPopup.rect.width / 2,
              transform: 'translate(-50%, -100%)',
              boxShadow:'0 8px 24px rgba(0,0,0,0.12)'}}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`text-[10px] uppercase tracking-wider font-semibold mb-1 font-['Montserrat'] ${'text-[#6B4D30]'}`}>Comment</div>
            <div className="text-sm whitespace-pre-wrap break-words">{commentPopup.text}</div>
            <div
              className={`absolute left-1/2 -translate-x-1/2 bottom-[-6px] w-3 h-3 rotate-45 border-r border-b ${'bg-white border-[#D4CCC2]'}`}
            />
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default SKUProposalScreen;
