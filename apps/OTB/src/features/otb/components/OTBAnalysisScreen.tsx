'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  BarChart3, Filter, ChevronDown, ChevronRight, Check,
  Calendar, Tag, Layers, Users, Pencil, X,
  FileText, Clock, Split, Bookmark, Store, GitBranch,
  Save, FilePlus, Star, Sparkles, AlertTriangle, ArrowRight
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatCurrency } from '@/utils';
import { STORES, GENDERS } from '@/utils/constants';
import { budgetService, masterDataService, planningService } from '@/services';
import { invalidateCache } from '@/services/api';
import { FilterBottomSheet, useBottomSheet } from '@/components/mobile';
import { FilterSelect } from '@/components/ui';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppContext } from '@/contexts/AppContext';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useSmartScrollState } from '@/hooks/useSmartScrollState';

// (Season groups & seasons loaded from API via masterDataService.getSeasonGroups)

// Reusable editable cell component (memoized to prevent unnecessary re-renders)
const EditableCell = React.memo(({ cellKey, value, isEditing, editValue, onStartEdit, onSaveEdit, onChangeValue, onKeyDown, readOnly = false }: any) => {
  const { t } = useLanguage();
  if (isEditing && !readOnly) {
    return (
      <div className="flex items-center justify-center">
        <input
          type="number"
          value={editValue}
          onChange={(e) => onChangeValue(e.target.value)}
          onBlur={() => onSaveEdit(cellKey)}
          onKeyDown={(e) => onKeyDown(e, cellKey)}
          className={`w-20 px-2 py-0.5 text-center border-2 border-[#D7B797] rounded-lg focus:outline-none focus:ring-2 focus:ring-[rgba(215,183,151,0.5)] font-['JetBrains_Mono'] font-medium transition-all ${'bg-white text-[#1A1A1A]'}`}
          autoFocus
        />
      </div>
    );
  }

  if (readOnly) {
    return (
      <div className="flex items-center justify-center">
        <div className={`flex items-center gap-1.5 px-3 py-0.5 border rounded-lg min-w-[70px] justify-center ${'bg-[#F2F2F2] border-[#C4B5A5]'}`}>
          <span className={`font-['JetBrains_Mono'] font-medium ${'text-[#666666]'}`}>
            {typeof value === 'number' ? value.toFixed(0) : value}%
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => onStartEdit(cellKey, value)}
      className="group flex items-center justify-center gap-1 cursor-pointer"
      title={t ? t('otbAnalysis.clickToEdit') : 'Click to edit'}
    >
      <div className={`flex items-center gap-1.5 px-3 py-0.5 border rounded-lg transition-all min-w-[70px] justify-center ${'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] hover:bg-[rgba(215,183,151,0.25)] hover:border-[rgba(215,183,151,0.5)]'}`}>
        <span className={`font-['JetBrains_Mono'] font-medium ${'text-[#6B4D30]'}`}>
          {typeof value === 'number' ? value.toFixed(0) : value}%
        </span>
        <Pencil size={12} className={`opacity-40 group-hover:opacity-100 transition-opacity ${'text-[#6B4D30]'}`} />
      </div>
    </div>
  );
});

const OTBAnalysisScreen = ({ otbContext, onOpenSkuProposal }: any) => {
  const { t } = useLanguage();
  const { isMobile } = useIsMobile();
  const router = useRouter();
  const { setAllocationData } = useAppContext();
  const { isOpen: filterOpen, open: openFilter, close: closeFilter } = useBottomSheet();
  const [mobileFilterValues, setMobileFilterValues] = useState<Record<string, string | string[]>>({});

  // API data states
  const [categoryStructure, setCategoryStructure] = useState<any[]>([]);
  const [seasonTypeSections, setSeasonTypeSections] = useState<any[]>([]);
  const [apiSeasonGroups, setApiSeasonGroups] = useState<any[]>([]);
  const [apiBrands, setApiBrands] = useState<any[]>([]);
  const [apiStores, setApiStores] = useState<any[]>([]);
  const [apiDataLoading, setApiDataLoading] = useState(true);

  // API state for fetching budgets
  const [apiBudgets, setApiBudgets] = useState<any[]>([]);
  const [loadingBudgets, setLoadingBudgets] = useState(false);

  // Version states
  const [versions, setVersions] = useState<any[]>([]);
  const [selectedVersionId, setSelectedVersionId] = useState<any>(null);
  const [loadingVersions, setLoadingVersions] = useState(false);

  // Per-brand planning versions
  const [brandPlanningVersions, setBrandPlanningVersions] = useState<Record<string, any[]>>({});
  const [brandSelectedVersion, setBrandSelectedVersion] = useState<Record<string, string | null>>({});
  const [brandLoadingVersions, setBrandLoadingVersions] = useState<Record<string, boolean>>({});

  // Version dropdown state (portal-based, like BudgetAllocateScreen)
  const [openVersionBrandId, setOpenVersionBrandId] = useState<string | null>(null);
  const [dropdownAnchorEl, setDropdownAnchorEl] = useState<HTMLElement | null>(null);

  // Per-brand planning detail data (fetched when version selection changes)
  const [brandPlanningData, setBrandPlanningData] = useState<Record<string, any>>({});
  const [brandLoadingPlanningData, setBrandLoadingPlanningData] = useState<Record<string, boolean>>({});
  const [brandSaving, setBrandSaving] = useState<Record<string, boolean>>({});

  // Historical comparison data
  const [historicalData, setHistoricalData] = useState<Record<string, Record<string, any>>>({});
  const [loadingHistorical, setLoadingHistorical] = useState(false);

  // Baseline: previous year's data (always loaded when FY+season selected, independent of comparison)
  const [baselineData, setBaselineData] = useState<Record<string, any>>({});

  // Fetch budgets from API (all statuses — OTB analysis is available for any budget)
  const fetchBudgets = useCallback(async () => {
    setLoadingBudgets(true);
    try {
      const response = await budgetService.getAll({});
      const budgetList = (Array.isArray(response) ? response : []).map((budget: any) => {
        // Extract allocate_headers for brand/allocate-header id mapping
        const rawAllocateHeaders = budget.allocate_headers || budget.allocateHeaders || [];
        const allocateHeaders = rawAllocateHeaders.map((ah: any) => ({
          id: String(ah.id),
          brandId: String(ah.brand_id || ah.brand?.id || ah.brandId || ''),
          brandName: ah.brand?.name || ah.brandName || '',
          isFinal: ah.is_final_version || ah.isFinalVersion || false,
          budgetAllocates: (ah.budget_allocates || ah.budgetAllocates || []).map((ba: any) => ({
            seasonGroupId: String(ba.season_group_id || ba.seasonGroup?.id || ba.seasonGroupId || ''),
            seasonGroupName: ba.season_group?.name || ba.seasonGroup?.name || '',
            seasonId: String(ba.season_id || ba.season?.id || ba.seasonId || ''),
            seasonName: ba.season?.name || ba.season?.name || '',
            storeId: String(ba.store_id || ba.store?.id || ba.storeId || '')}))}));
        // Use first allocate header's brand as the primary brand for this budget (for backward compat)
        const primaryAH = allocateHeaders[0];
        return {
          id: budget.id,
          // API returns snake_case: fiscal_year; fall back to camelCase if already transformed
          fiscalYear: Number(budget.fiscal_year ?? budget.fiscalYear) || undefined,
          groupBrand: typeof budget.groupBrand === 'object' ? (budget.groupBrand?.name || budget.groupBrand?.code || 'A') : (budget.groupBrand || 'A'),
          brandId: primaryAH?.brandId || budget.groupBrandId || budget.brandId,
          brandName: primaryAH?.brandName || budget.groupBrand?.name || budget.Brand?.name || budget.brandName || 'Unknown',
          // API uses 'amount' at budget level; also accept camelCase variants
          totalBudget: Number(budget.amount) || Number(budget.totalBudget) || Number(budget.totalAmount) || 0,
          // API uses 'name'; also accept budgetCode/budgetName
          budgetName: budget.name || budget.budgetCode || budget.budgetName || 'Untitled',
          seasonGroup: budget.seasonGroupId || budget.seasonGroup || '',
          seasonType: budget.seasonType || '',
          status: (budget.status || 'DRAFT').toLowerCase(),
          allocateHeaders, // per-brand allocate headers with their IDs
          details: budget.details || []
        };
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

  // Compute available fiscal years from budgets
  const availableYears = useMemo(() => {
    return [...new Set(apiBudgets.map((b: any) => b.fiscalYear))].sort((a: number, b: number) => b - a);
  }, [apiBudgets]);

  // Filter states
  const [selectedBudgetId, setSelectedBudgetId] = useState('all');
  const [selectedSeasonGroup, setSelectedSeasonGroup] = useState('all');
  const [selectedSeason, setSelectedSeason] = useState('all');
  const [budgetContext, setBudgetContext] = useState<any>(null); // Budget info from Planning Screen
  // Dropdown states
  const [openDropdown, setOpenDropdown] = useState<any>(null);

  // New filters: Year, Type (Same/Different Season), Season Count
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
  const [comparisonType, setComparisonType] = useState<'same' | 'different'>('same');
  const [seasonCount, setSeasonCount] = useState<number>(1);
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([]);
  const [brandActiveTabs, setBrandActiveTabs] = useState<Record<string, 'category' | 'seasonType' | 'gender'>>({});
  const [collapsedBrands, setCollapsedBrands] = useState<Record<string, boolean>>({});

  // Season group and season options built from API data
  const seasonGroupOptions = useMemo(() => {
    return apiSeasonGroups.map((sg: any) => ({ id: sg.name, label: sg.name }));
  }, [apiSeasonGroups]);

  const availableSeasons = useMemo(() => {
    if (selectedSeasonGroup === 'all') {
      const all: { id: string; label: string }[] = [];
      const seen = new Set<string>();
      apiSeasonGroups.forEach((sg: any) => {
        (sg.seasons || []).forEach((s: any) => {
          if (!seen.has(s.name)) {
            seen.add(s.name);
            all.push({ id: s.name, label: s.name });
          }
        });
      });
      return all;
    }
    const group = apiSeasonGroups.find((sg: any) => sg.name === selectedSeasonGroup);
    if (!group) return [];
    return (group.seasons || []).map((s: any) => ({ id: s.name, label: s.name }));
  }, [apiSeasonGroups, selectedSeasonGroup]);

  // Stores from API (fallback to hardcoded constants while loading)
  const activeStores = useMemo(() => {
    return apiStores.length > 0 ? apiStores : STORES;
  }, [apiStores]);

  // Smart Filter Bar — direct DOM toggle, zero re-render
  const { barRef, handleBarClick } = useSmartScrollState();

  // sessionStorage auto-fill removed — all filters default to 'all'

  // Fetch planning versions when budget is selected
  useEffect(() => {
    const fetchVersions = async () => {
      if (!selectedBudgetId || selectedBudgetId === 'all') {
        setVersions([]);
        setSelectedVersionId(null);
        return;
      }
      setLoadingVersions(true);
      try {
        const response = await planningService.getAll({ budgetId: selectedBudgetId });
        const list = Array.isArray(response) ? response : [];
        setVersions(list.map((v: any) => ({
          id: v.id,
          name: v.name || v.versionName || `Version ${v.versionNumber || v.id}`,
          status: v.status || 'DRAFT',
          isFinal: v.isFinal || v.status?.toLowerCase() === 'final' || false,
          versionNumber: v.versionNumber
        })));
        // Auto-select the final version if one exists
        const finalVersion = list.find((v: any) => v.isFinal || v.status?.toLowerCase() === 'final');
        if (finalVersion) {
          setSelectedVersionId(finalVersion.id);
        } else {
          setSelectedVersionId(null);
        }
      } catch (err: any) {
        console.error('Failed to fetch planning versions:', err);
        setVersions([]);
      } finally {
        setLoadingVersions(false);
      }
    };
    fetchVersions();
  }, [selectedBudgetId]);

  // Check if all required filters are selected (seasonGroup + season must be chosen)
  const filtersComplete = selectedSeasonGroup !== 'all' && selectedSeason !== 'all';

  // Compute matched AllocateHeaders from selected budget, filtered by seasonGroup + season
  const matchedAllocateHeaders = useMemo(() => {
    if (!filtersComplete || selectedBudgetId === 'all') return [];
    const budget = apiBudgets.find((b: any) => b.id === selectedBudgetId);
    if (!budget) return [];
    const result: any[] = [];
    (budget.allocateHeaders || []).forEach((ah: any) => {
      const matchesSeason = (ah.budgetAllocates || []).some((ba: any) =>
        ba.seasonGroupName === selectedSeasonGroup && ba.seasonName === selectedSeason
      );
      if (matchesSeason) {
        result.push({ ...ah, budgetId: budget.id });
      }
    });
    return result;
  }, [filtersComplete, selectedBudgetId, apiBudgets, selectedSeasonGroup, selectedSeason]);

  // Fetch full planning data for each brand when their selected version changes
  useEffect(() => {
    Object.entries(brandSelectedVersion).forEach(async ([brandId, versionId]) => {
      if (!versionId) return;
      setBrandLoadingPlanningData(prev => ({ ...prev, [brandId]: true }));
      try {
        const data = await planningService.getOne(versionId);
        setBrandPlanningData(prev => ({ ...prev, [brandId]: data }));
      } catch {
        setBrandPlanningData(prev => ({ ...prev, [brandId]: null }));
      } finally {
        setBrandLoadingPlanningData(prev => ({ ...prev, [brandId]: false }));
      }
    });
  }, [brandSelectedVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Historical comparison logic ─────────────────────────────────────────
  const canEditComparison = filtersComplete && selectedYear !== 'all' && selectedBudgetId !== 'all';

  const historicalPeriods = useMemo(() => {
    if (!canEditComparison) return [];
    const currentYear = selectedYear as number;
    const currentSG = selectedSeasonGroup;
    const currentS = selectedSeason;
    const periods: { label: string; fiscalYear: number; seasonGroup: string; season: string }[] = [];

    if (comparisonType === 'same') {
      for (let i = 1; i <= seasonCount; i++) {
        periods.push({ label: `${currentYear - i} ${currentSG} ${currentS}`, fiscalYear: currentYear - i, seasonGroup: currentSG, season: currentS });
      }
    } else {
      // "different" — reverse chronological, alternating season groups
      let year = currentYear;
      let sg = currentSG;
      for (let i = 0; i < seasonCount; i++) {
        if (sg === 'SS') { sg = 'FW'; year = year - 1; } else { sg = 'SS'; }
        periods.push({ label: `${year} ${sg} ${currentS}`, fiscalYear: year, seasonGroup: sg, season: currentS });
      }
    }
    return periods;
  }, [canEditComparison, comparisonType, seasonCount, selectedYear, selectedSeasonGroup, selectedSeason]);

  // Baseline period: always the previous year's same-season data (independent of comparison settings)
  const baselinePeriod = useMemo(() => {
    if (selectedYear === 'all' || selectedSeasonGroup === 'all' || selectedSeason === 'all') return null;
    return {
      fiscalYear: (selectedYear as number) - 1,
      seasonGroup: selectedSeasonGroup,
      season: selectedSeason,
      label: `${(selectedYear as number) - 1} ${selectedSeasonGroup} ${selectedSeason}`};
  }, [selectedYear, selectedSeasonGroup, selectedSeason]);

  // Category tab filter states
  const [genderFilter, setGenderFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [subCategoryFilter, setSubCategoryFilter] = useState('all');
  const [openCategoryDropdown, setOpenCategoryDropdown] = useState<any>(null);

  // Active tab for Category / Season Type / Gender views
  const [activeTab, setActiveTab] = useState<'category' | 'seasonType' | 'gender'>('category');

  // Collapse states for Season Type and Gender tabs
  const [expandedSeasonTypes, setExpandedSeasonTypes] = useState<Record<string, boolean>>({});
  const [expandedGenderGroups, setExpandedGenderGroups] = useState<Record<string, boolean>>({});

  // Editable cell states
  const [editingCell, setEditingCell] = useState<any>(null);
  const [editValue, setEditValue] = useState('');
  const [localData, setLocalData] = useState<Record<string, any>>({});

  // Category hierarchy collapse states (Category -> SubCategory -> Gender)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, any>>({});
  const [expandedSubCategories, setExpandedSubCategories] = useState<Record<string, any>>({});
  const [allCollapsedPerBrand, setAllCollapsedPerBrand] = useState<Record<string, boolean>>({});


  // Refs
  const dropdownRefs = useRef<Record<string, any>>({});
  const setDropdownRef = (key: any) => (el: any) => {
    dropdownRefs.current[key] = el;
  };
  // Fetch categories, season types, and planning versions from API
  useEffect(() => {
    const fetchApiData = async () => {
      setApiDataLoading(true);
      try {
        const [categoriesRes, seasonTypesRes, brandsRes, storesRes] = await Promise.all([
          masterDataService.getCategories().catch(() => []),
          masterDataService.getSeasonTypes().catch(() => []),
          masterDataService.getBrands().catch(() => []),
          masterDataService.getStores().catch(() => [])
        ]);
        // Transform categories into hierarchy
        const categories = Array.isArray(categoriesRes) ? categoriesRes : (categoriesRes?.data || []);
        if (categories.length > 0) {
          // Check if API returns gender-level hierarchy (each item has .categories[])
          const isGenderHierarchy = categories[0]?.categories && Array.isArray(categories[0].categories);
          if (isGenderHierarchy) {
            // API returns: [{ id, name: "Female", categories: [{ id, name, sub_categories: [...] }] }]
            const structure = categories.map((genderObj: any) => ({
              gender: { id: genderObj.id, name: genderObj.name },
              categories: (genderObj.categories || []).map((cat: any) => ({
                id: cat.id,
                name: cat.name,
                // API returns snake_case sub_categories; fall back to camelCase for compatibility
                subCategories: (cat.sub_categories || cat.subCategories || []).map((sub: any) => ({
                  id: sub.id || sub.subCategoryId,
                  name: sub.name || sub.subCategoryName}))}))}));
            setCategoryStructure(structure);
          } else {
            // Flat list: each item is a category with gender ref
            const genderMap: Record<string, any> = {};
            categories.forEach((cat: any) => {
              const genderId = (cat.gender?.id || cat.genderId || 'unknown').toLowerCase();
              const genderName = cat.gender?.name || cat.genderName || genderId;
              if (!genderMap[genderId]) {
                genderMap[genderId] = { gender: { id: genderId, name: genderName }, categories: [] };
              }
              const catId = cat.id || cat.categoryId;
              const catName = cat.name || cat.categoryName;
              let existingCat = genderMap[genderId].categories.find((c: any) => c.id === catId);
              if (!existingCat) {
                existingCat = { id: catId, name: catName, subCategories: [] };
                genderMap[genderId].categories.push(existingCat);
              }
              if (cat.subCategories && cat.subCategories.length > 0) {
                cat.subCategories.forEach((sub: any) => {
                  if (!existingCat.subCategories.find((s: any) => s.id === (sub.id || sub.subCategoryId))) {
                    existingCat.subCategories.push({ id: sub.id || sub.subCategoryId, name: sub.name || sub.subCategoryName });
                  }
                });
              }
            });
            setCategoryStructure(Object.values(genderMap));
          }
        }

        // Transform season types into sections
        const seasonTypes = Array.isArray(seasonTypesRes) ? seasonTypesRes : (seasonTypesRes?.data || []);
        if (seasonTypes.length > 0) {
          setSeasonTypeSections(seasonTypes.map((c: any) => ({ id: c.id || c.code, name: c.name || c.seasonTypeName })));
        } else {
          setSeasonTypeSections([
            { id: 'carryover', name: 'Carry Over/Commercial' },
            { id: 'seasonal', name: 'Seasonal' }
          ]);
        }

        // Store brands from API
        const brandsData = Array.isArray(brandsRes) ? brandsRes : (brandsRes?.data || []);
        setApiBrands(brandsData);

        // Store stores from API — normalise to { id, code, name }
        const storesData = Array.isArray(storesRes) ? storesRes : (storesRes?.data || []);
        if (storesData.length > 0) {
          const seen = new Set<string>();
          const normalized = storesData.reduce((acc: any[], s: any) => {
            const storeId = String(s.id);
            const code = s.code || s.storeCode || s.name || '';
            if (storeId && storeId !== 'undefined' && !seen.has(storeId)) {
              seen.add(storeId);
              acc.push({ id: storeId, code, name: s.name || s.storeName || code });
            }
            return acc;
          }, []);
          if (normalized.length > 0) setApiStores(normalized);
        }

      } catch (err: any) {
        console.error('Failed to fetch OTB analysis data:', err);
      } finally {
        setApiDataLoading(false);
      }
    };
    fetchApiData();
  }, [otbContext?.budgetId]);

  // Fetch season groups filtered by selected year
  useEffect(() => {
    const controller = new AbortController();
    const year = selectedYear !== 'all' ? Number(selectedYear) : undefined;
    masterDataService.getSeasonGroups(year ? { year } : undefined, { signal: controller.signal }).then(res => {
      const sgData = Array.isArray(res) ? res : [];
      setApiSeasonGroups(sgData);
    }).catch((err: any) => {
      if (err?.code === 'ERR_CANCELED' || err?.name === 'AbortError') return;
      setApiSeasonGroups([]);
    });
    return () => { controller.abort(); };
  }, [selectedYear]);

  // Initialize local data for editable cells (zeros instead of random — will be populated by API)
  useEffect(() => {
    const initialData: Record<string, any> = {};

    // Initialize Category tab data with sample demo values
    const sampleCategoryData: Record<string, { buyPct: number; salesPct: number; stPct: number; buyProposed: number; otbProposed: number; varPct: number; otbSubmitted: number; buyActual: number }> = {};
    let catIndex = 0;
    const demoValues = [
      { buyPct: 25, salesPct: 22, stPct: 88, buyProposed: 18, otbProposed: 15, otbSubmitted: 14, buyActual: 16 },
      { buyPct: 18, salesPct: 20, stPct: 91, buyProposed: 12, otbProposed: 10, otbSubmitted: 9, buyActual: 11 },
      { buyPct: 15, salesPct: 14, stPct: 85, buyProposed: 22, otbProposed: 20, otbSubmitted: 18, buyActual: 21 },
      { buyPct: 12, salesPct: 16, stPct: 92, buyProposed: 14, otbProposed: 12, otbSubmitted: 11, buyActual: 13 },
      { buyPct: 10, salesPct: 8, stPct: 78, buyProposed: 16, otbProposed: 14, otbSubmitted: 13, buyActual: 15 },
      { buyPct: 8, salesPct: 10, stPct: 82, buyProposed: 8, otbProposed: 7, otbSubmitted: 6, buyActual: 7 },
      { buyPct: 7, salesPct: 6, stPct: 75, buyProposed: 6, otbProposed: 5, otbSubmitted: 5, buyActual: 6 },
      { buyPct: 5, salesPct: 4, stPct: 80, buyProposed: 4, otbProposed: 17, otbSubmitted: 16, buyActual: 3 },
    ];
    categoryStructure.forEach((genderGroup: any) => {
      genderGroup.categories.forEach((cat: any) => {
        cat.subCategories.forEach((subCat: any) => {
          const key = `${genderGroup.gender.id}_${cat.id}_${subCat.id}`;
          const demo = demoValues[catIndex % demoValues.length];
          initialData[key] = {
            buyPct: demo.buyPct,
            salesPct: demo.salesPct,
            stPct: demo.stPct,
            buyProposed: demo.buyProposed,
            otbProposed: demo.otbProposed,
            varPct: demo.buyProposed - demo.salesPct,
            otbSubmitted: demo.otbSubmitted,
            buyActual: demo.buyActual
          };
          catIndex++;
        });
      });
    });

    // Initialize Season Type tab data (seasonType x store)
    const seasonTypeDemoValues = [
      { buyPct: 30, salesPct: 28, stPct: 93, moc: 2.1, userBuyPct: 25, otbValue: 45000, varPct: -3 },
      { buyPct: 22, salesPct: 20, stPct: 87, moc: 1.8, userBuyPct: 20, otbValue: 32000, varPct: 2 },
      { buyPct: 18, salesPct: 16, stPct: 85, moc: 1.5, userBuyPct: 15, otbValue: 28000, varPct: -1 },
      { buyPct: 15, salesPct: 14, stPct: 90, moc: 1.9, userBuyPct: 12, otbValue: 22000, varPct: 1 },
      { buyPct: 10, salesPct: 12, stPct: 82, moc: 1.3, userBuyPct: 10, otbValue: 18000, varPct: -2 },
    ];
    let colIdx = 0;
    seasonTypeSections.forEach((section: any) => {
      activeStores.forEach((store: any) => {
        const key = `seasonType_${section.id}_${store.id}`;
        const demo = seasonTypeDemoValues[colIdx % seasonTypeDemoValues.length];
        initialData[key] = { ...demo };
        colIdx++;
      });
    });

    // Initialize Gender tab data (gender x store)
    const genderDemoValues = [
      { buyPct: 55, salesPct: 52, stPct: 94, userBuyPct: 50, otbValue: 120000, varPct: -2 },
      { buyPct: 45, salesPct: 48, stPct: 91, userBuyPct: 42, otbValue: 98000, varPct: 3 },
      { buyPct: 35, salesPct: 30, stPct: 86, userBuyPct: 32, otbValue: 75000, varPct: -5 },
      { buyPct: 28, salesPct: 25, stPct: 89, userBuyPct: 26, otbValue: 62000, varPct: 1 },
      { buyPct: 20, salesPct: 18, stPct: 83, userBuyPct: 18, otbValue: 45000, varPct: -2 },
    ];
    let genIdx = 0;
    const genderList = categoryStructure.length > 0
      ? categoryStructure.map((g: any) => g.gender)
      : GENDERS;
    genderList.forEach((gender: any) => {
      activeStores.forEach((store: any) => {
        const key = `gender_${gender.id}_${store.id}`;
        const demo = genderDemoValues[genIdx % genderDemoValues.length];
        initialData[key] = { ...demo };
        genIdx++;
      });
    });

    setLocalData(initialData);
  }, [categoryStructure, seasonTypeSections, activeStores]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!otbContext) return;
    const { budgetId, budgetName, seasonGroup, season, rex, ttp, fiscalYear, brandName, groupBrand, totalBudget, status, brandId } = otbContext;

    // Try to find matching budget in loaded budgets (use String() to avoid type mismatch)
    let matchedBudget = null;
    if (budgetId) {
      matchedBudget = apiBudgets.find((b: any) => String(b.id) === String(budgetId));
      if (matchedBudget) {
        setSelectedBudgetId(matchedBudget.id);
      }
    }
    if (!matchedBudget && budgetName) {
      matchedBudget = apiBudgets.find((b: any) => b.budgetName === budgetName);
      if (matchedBudget) {
        setSelectedBudgetId(matchedBudget.id);
      }
    }

    // Store full budget context from Planning Screen (whether matched or passed directly)
    setBudgetContext({
      budgetId: budgetId || matchedBudget?.id,
      budgetName: budgetName || matchedBudget?.budgetName,
      fiscalYear: fiscalYear || matchedBudget?.fiscalYear || new Date().getFullYear(),
      brandName: brandName || matchedBudget?.brandName,
      groupBrand: groupBrand || matchedBudget?.groupBrand,
      totalBudget: totalBudget || matchedBudget?.totalBudget || 0,
      status: status || matchedBudget?.status || 'draft',
      seasonGroup: seasonGroup || 'all',
      season: season || 'all',
      rex: rex ?? 0,
      ttp: ttp ?? 0
    });

    if (fiscalYear) {
      setSelectedYear(fiscalYear);
    }
    if (seasonGroup) {
      setSelectedSeasonGroup(seasonGroup);
    }
    if (season) {
      setSelectedSeason(season);
    }
    // Pre-select brand if passed from cross-screen navigation (e.g. SKU Proposal)
    if (brandId) {
      setSelectedBrandIds([String(brandId)]);
    }
  }, [otbContext, apiBudgets]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (openDropdown) {
        const el = dropdownRefs.current[openDropdown];
        if (el && !el.contains(event.target)) {
          setOpenDropdown(null);
        }
      }
      if (openCategoryDropdown) {
        const el = dropdownRefs.current[openCategoryDropdown];
        if (el && !el.contains(event.target)) {
          setOpenCategoryDropdown(null);
        }
      }
      // Close version dropdown portal on outside click
      if (openVersionBrandId) {
        if (!(event.target as any).closest?.('.brand-version-dropdown') &&
            !(event.target as any).closest?.('.brand-version-portal')) {
          setOpenVersionBrandId(null);
          setDropdownAnchorEl(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown, openCategoryDropdown, openVersionBrandId]);

  // Edit handlers
  const handleStartEdit = (cellKey: any, currentValue: any) => {
    setEditingCell(cellKey);
    setEditValue(typeof currentValue === 'number' ? currentValue.toFixed(0) : currentValue.toString());
  };

  const handleSaveEdit = (cellKey: any) => {
    const newValue = parseFloat(editValue) || 0;
    const isSeasonTypeOrGender = cellKey.startsWith('seasonType_') || cellKey.startsWith('gender_');
    const fieldToUpdate = isSeasonTypeOrGender ? 'userBuyPct' : 'buyProposed';

    setLocalData((prev: any) => ({
      ...prev,
      [cellKey]: {
        ...prev[cellKey],
        [fieldToUpdate]: newValue
      }
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

  // Handle set version as final (per-brand)
  const handleSetFinalVersion = async (brandId: string, versionId: any, e: any) => {
    e.stopPropagation();
    try {
      await planningService.finalize(String(versionId));
      invalidateCache('/planning');
      toast.success('Đã đặt phiên bản final.');
      // Update per-brand versions — mark only the target as final
      setBrandPlanningVersions(prev => {
        const updated = { ...prev };
        if (updated[brandId]) {
          updated[brandId] = updated[brandId].map((v: any) => ({
            ...v,
            isFinal: String(v.id) === String(versionId),
            label: `V${v.version}${String(v.id) === String(versionId) ? ' ★' : ''}`}));
        }
        return updated;
      });
      setBrandSelectedVersion(prev => ({ ...prev, [brandId]: String(versionId) }));
    } catch (err: any) {
      console.error('Failed to set version as final:', err);
      toast.error('Đặt final thất bại.');
    }
  };

  // Save or create new planning version for a brand
  const handleSaveBrand = async (brand: any, isNewVersion: boolean) => {
    const brandId = String(brand.id);
    setBrandSaving(prev => ({ ...prev, [brandId]: true }));
    try {
      // Find allocate header for this brand from matched (filter-aware) headers
      const matchedAH = matchedAllocateHeaders.find((ah: any) => ah.brandId === brandId);
      const allocateHeaderId = matchedAH?.id;

      // Rebuild planningDataBySubcatId from loaded planning data
      const planningDataBySubcatId: Record<string, any> = {};
      const planData = brandPlanningData[brandId];
      if (planData) {
        (planData.planning_categories || []).forEach((pc: any) => {
          const subId = String(pc.subcategory_id || pc.subcategory?.id || '');
          if (!subId) return;
          planningDataBySubcatId[subId] = {
            buyPct: pc.actual_buy_pct || 0,
            salesPct: pc.actual_sales_pct || 0,
            stPct: pc.actual_st_pct || 0,
            buyProposed: pc.proposed_buy_pct || 0,
            otbProposed: Number(pc.otb_proposed_amount) || 0,
            varPct: pc.var_lastyear_pct || 0,
            otbSubmitted: Number(pc.otb_actual_amount) || 0,
            buyActual: pc.otb_actual_buy_pct || 0};
        });
      }
      // Build baseline lookup for this brand to override actual values with previous year data
      const saveBaselineLookup = buildBaselineLookup(brandId);

      const getRowData = (cellKey: string, subCatId?: string) => {
        let base;
        if (subCatId && planningDataBySubcatId[subCatId]) {
          const plan = planningDataBySubcatId[subCatId];
          base = { ...plan, buyProposed: localData[cellKey]?.buyProposed ?? plan.buyProposed };
        } else {
          base = localData[cellKey] || {};
        }
        // Override buyPct/salesPct/stPct with baseline (previous year) data
        if (subCatId) {
          const bl = saveBaselineLookup.bySub[subCatId];
          if (bl) base = { ...base, buyPct: bl.buyPct, salesPct: bl.salesPct, stPct: bl.stPct };
        }
        return base;
      };

      // Build categories array (one entry per subcategory, averaged across genders)
      const categories: any[] = [];
      categoryFirstStructure.forEach((catEntry: any) => {
        catEntry.subCategories.forEach((subCatEntry: any) => {
          const subCatId = String(subCatEntry.subCategory.id);
          let buyPct = 0, salesPct = 0, stPct = 0, buyProposed = 0, otbProposed = 0, varPct = 0, otbSubmitted = 0, buyActual = 0;
          const count = subCatEntry.genders.length || 1;
          subCatEntry.genders.forEach((g: any) => {
            const d = getRowData(g.dataKey, subCatId);
            buyPct += d.buyPct || 0;
            salesPct += d.salesPct || 0;
            stPct += d.stPct || 0;
            buyProposed += d.buyProposed || 0;
            otbProposed += d.otbProposed || 0;
            varPct += d.varPct || 0;
            otbSubmitted += d.otbSubmitted || 0;
            buyActual += d.buyActual || 0;
          });
          categories.push({
            subcategoryId: subCatId,
            actualBuyPct: buyPct / count,
            actualSalesPct: salesPct / count,
            actualStPct: stPct / count,
            proposedBuyPct: buyProposed / count,
            otbProposedAmount: otbProposed / count,
            varLastyearPct: varPct / count,
            otbActualAmount: otbSubmitted / count,
            otbActualBuyPct: buyActual / count});
        });
      });

      // Build seasonTypes array (override with baseline data)
      const seasonTypes: any[] = [];
      seasonTypeSections.forEach((section: any) => {
        activeStores.forEach((store: any) => {
          const cellKey = `seasonType_${section.id}_${store.id}`;
          const d = localData[cellKey] || {};
          const colBl = saveBaselineLookup.bySeasonType[cellKey] || {};
          seasonTypes.push({
            seasonTypeId: String(section.id),
            storeId: String(store.id),
            actualBuyPct: colBl.buyPct || d.buyPct || 0,
            actualSalesPct: colBl.salesPct || d.salesPct || 0,
            actualStPct: colBl.stPct || d.stPct || 0,
            actualMoc: colBl.moc || d.moc || 0,
            proposedBuyPct: d.userBuyPct || 0,
            otbProposedAmount: d.otbValue || 0,
            pctVarVsLast: d.varPct || 0});
        });
      });

      // Build genders array (override with baseline data)
      const genders: any[] = [];
      const genderList = categoryStructure.length > 0
        ? categoryStructure.map((g: any) => g.gender)
        : GENDERS;
      genderList.forEach((gender: any) => {
        activeStores.forEach((store: any) => {
          const cellKey = `gender_${gender.id}_${store.id}`;
          const d = localData[cellKey] || {};
          const genBl = saveBaselineLookup.byGender[cellKey] || {};
          genders.push({
            genderId: String(gender.id),
            storeId: String(store.id),
            actualBuyPct: genBl.buyPct || d.buyPct || 0,
            actualSalesPct: genBl.salesPct || d.salesPct || 0,
            actualStPct: genBl.stPct || d.stPct || 0,
            proposedBuyPct: d.userBuyPct || 0,
            otbProposedAmount: d.otbValue || 0,
            pctVarVsLast: d.varPct || 0});
        });
      });

      const payload = { allocateHeaderId, categories, seasonTypes, genders };
      const existingVersionId = brandSelectedVersion[brandId];

      // Helper: refresh version list for this brand after save
      const refreshVersionList = async (selectVersionId?: string) => {
        // Use allocateHeaderId for direct filter; fallback to brandId
        const filterParams: any = { pageSize: 50 };
        if (allocateHeaderId) {
          filterParams.allocateHeaderId = allocateHeaderId;
        } else {
          filterParams.brandId = brandId;
        }
        const list = await planningService.getAll(filterParams);
        const mapped = (Array.isArray(list) ? list : []).map((v: any) => ({
          id: String(v.id),
          label: `V${v.version}${v.is_final_version ? ' ★' : ''}`,
          status: v.status || 'DRAFT',
          isFinal: v.is_final_version || false,
          version: v.version}));
        setBrandPlanningVersions(prev => ({ ...prev, [brandId]: mapped }));
        if (selectVersionId) {
          setBrandSelectedVersion(prev => ({ ...prev, [brandId]: selectVersionId }));
        }
      };

      if (isNewVersion) {
        const created = await planningService.create(payload);
        toast.success('New version created successfully');
        await refreshVersionList(created?.id ? String(created.id) : undefined);
        if (created) setBrandPlanningData(prev => ({ ...prev, [brandId]: created }));
      } else {
        if (!existingVersionId) {
          const created = await planningService.create(payload);
          toast.success('Planning saved successfully');
          await refreshVersionList(created?.id ? String(created.id) : undefined);
          if (created) setBrandPlanningData(prev => ({ ...prev, [brandId]: created }));
        } else {
          const updated = await planningService.update(existingVersionId, payload);
          toast.success('Planning saved successfully');
          await refreshVersionList(existingVersionId);
          if (updated) setBrandPlanningData(prev => ({ ...prev, [brandId]: updated }));
        }
      }
      invalidateCache('/planning');
    } catch (err: any) {
      console.error('Failed to save planning:', err?.response?.data || err?.message || err);
      const msg = err?.response?.data?.message || err?.message || 'Unknown error';
      toast.error(`Failed to save: ${Array.isArray(msg) ? msg.join(', ') : msg}`);
    } finally {
      setBrandSaving(prev => ({ ...prev, [brandId]: false }));
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedBudgetId('all');
    setSelectedSeasonGroup('all');
    setSelectedSeason('all');
    setSelectedVersionId(null);
    setVersions([]);
    setBudgetContext(null);
    setSelectedYear('all');
    setComparisonType('same');
    setSeasonCount(1);
  };

  const hasActiveFilters = selectedBudgetId !== 'all' || selectedSeasonGroup !== 'all' || selectedSeason !== 'all' || selectedVersionId || selectedYear !== 'all';

  // Filter budgets by year and season
  const filteredBudgets = useMemo(() => {
    let list = apiBudgets;
    if (selectedYear !== 'all') {
      list = list.filter((b: any) => b.fiscalYear === selectedYear);
    }
    if (selectedSeasonGroup !== 'all') {
      const seasonFiltered = list.filter((b: any) => b.seasonGroup === selectedSeasonGroup);
      if (seasonFiltered.length > 0) list = seasonFiltered;
    }
    if (selectedSeason !== 'all') {
      const seasonFiltered = list.filter((b: any) => b.seasonType === selectedSeason);
      if (seasonFiltered.length > 0) list = seasonFiltered;
    }
    return list;
  }, [apiBudgets, selectedYear, selectedSeasonGroup, selectedSeason]);

  const selectedBudget = selectedBudgetId === 'all'
    ? null
    : apiBudgets.find((b: any) => b.id === selectedBudgetId);
  const selectedVersion = versions.find((v: any) => v.id === selectedVersionId);

  // Calculate grand totals
  const grandTotals = useMemo(() => {
    let totalOtbValue = 0;

    // Sum from season type data
    seasonTypeSections.forEach((section: any) => {
      activeStores.forEach((store: any) => {
        const key = `seasonType_${section.id}_${store.id}`;
        totalOtbValue += localData[key]?.otbValue || 0;
      });
    });

    return { otbValue: totalOtbValue };
  }, [localData, seasonTypeSections, activeStores]); // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle expanded state for hierarchy (Category -> SubCategory -> Gender)
  const toggleCategoryExpanded = (categoryId: any, brandId?: string) => {
    const key = brandId ? `${brandId}::${categoryId}` : categoryId;
    setExpandedCategories((prev: any) => ({ ...prev, [key]: prev[key] === false ? true : false }));
  };

  const toggleSubCategoryExpanded = (catId: any, subCatId: any, brandId?: string) => {
    const rawKey = `${catId}_${subCatId}`;
    const key = brandId ? `${brandId}::${rawKey}` : rawKey;
    setExpandedSubCategories((prev: any) => ({ ...prev, [key]: prev[key] === false ? true : false }));
  };

  const handleToggleAll = (brandId?: string) => {
    const key = brandId || '__global__';
    const isCollapsed = allCollapsedPerBrand[key] || false;
    setAllCollapsedPerBrand(prev => ({ ...prev, [key]: !isCollapsed }));
    const newCats: Record<string, boolean> = {};
    const newSubCats: Record<string, boolean> = {};
    const prefix = brandId ? `${brandId}::` : '';
    genderFirstStructure.forEach((genderEntry: any) => {
      newCats[`${prefix}${genderEntry.gender.id}`] = isCollapsed;
      genderEntry.categories.forEach((catEntry: any) => {
        newSubCats[`${prefix}${genderEntry.gender.id}_${catEntry.category.id}`] = isCollapsed;
      });
    });
    setExpandedCategories(prev => ({ ...prev, ...newCats }));
    setExpandedSubCategories(prev => ({ ...prev, ...newSubCats }));
  };

  // Generate filter options from categoryStructure
  const filterOptions = useMemo(() => {
    const genders: any[] = [{ id: 'all', name: 'All Genders' }];
    const categories: any[] = [{ id: 'all', name: 'All Categories' }];
    const subCategories: any[] = [{ id: 'all', name: 'All Sub-Categories' }];

    categoryStructure.forEach((genderGroup: any) => {
      genders.push({ id: genderGroup.gender.id, name: genderGroup.gender.name });
      genderGroup.categories.forEach((cat: any) => {
        if (!categories.find((c: any) => c.id === cat.id)) {
          categories.push({ id: cat.id, name: cat.name, genderId: genderGroup.gender.id });
        }
        cat.subCategories.forEach((subCat: any) => {
          if (!subCategories.find((sc: any) => sc.id === subCat.id)) {
            subCategories.push({ id: subCat.id, name: subCat.name, categoryId: cat.id, genderId: genderGroup.gender.id });
          }
        });
      });
    });

    return { genders, categories, subCategories };
  }, [categoryStructure]);

  // Get filtered categories based on gender selection
  const filteredCategoryOptions = useMemo(() => {
    if (genderFilter === 'all') return filterOptions.categories;
    return [
      { id: 'all', name: 'All Categories' },
      ...filterOptions.categories.filter((c: any) => c.id !== 'all' && c.genderId === genderFilter)
    ];
  }, [genderFilter, filterOptions.categories]);

  // Get filtered sub-categories based on gender and category selection
  const filteredSubCategoryOptions = useMemo(() => {
    let options = filterOptions.subCategories;
    if (genderFilter !== 'all') {
      options = options.filter((sc: any) => sc.id === 'all' || sc.genderId === genderFilter);
    }
    if (categoryFilter !== 'all') {
      options = options.filter((sc: any) => sc.id === 'all' || sc.categoryId === categoryFilter);
    }
    return [{ id: 'all', name: 'All Sub-Categories' }, ...options.filter((o: any) => o.id !== 'all')];
  }, [genderFilter, categoryFilter, filterOptions.subCategories]);

  // Reset dependent filters when parent filter changes
  const handleGenderFilterChange = (value: any) => {
    setGenderFilter(value);
    setCategoryFilter('all');
    setSubCategoryFilter('all');
    setOpenCategoryDropdown(null);
  };

  const handleCategoryFilterChange = (value: any) => {
    setCategoryFilter(value);
    setSubCategoryFilter('all');
    setOpenCategoryDropdown(null);
  };

  const handleSubCategoryFilterChange = (value: any) => {
    setSubCategoryFilter(value);
    setOpenCategoryDropdown(null);
  };

  // Brand filter options from master data
  const brandOptions = useMemo(() => {
    return apiBrands.map((b: any) => ({
      value: String(b.id),
      label: b.name || b.code || 'Unknown'}));
  }, [apiBrands]);

  // Brands to display as sections — all brands when none selected, filtered otherwise
  const displayBrands = useMemo(() => {
    if (selectedBrandIds.length === 0) return apiBrands;
    return apiBrands.filter((b: any) => selectedBrandIds.includes(String(b.id)));
  }, [apiBrands, selectedBrandIds]);

  // Fetch historical planning data when periods or brands change
  useEffect(() => {
    if (historicalPeriods.length === 0 || displayBrands.length === 0) { setHistoricalData({}); return; }
    let cancelled = false;
    const fetchAll = async () => {
      setLoadingHistorical(true);
      const result: Record<string, Record<string, any>> = {};
      const promises = historicalPeriods.flatMap(period =>
        displayBrands.map(async (brand: any) => {
          const brandId = String(brand.id);
          const data = await planningService.getHistorical({ fiscalYear: period.fiscalYear, seasonGroupName: period.seasonGroup, seasonName: period.season, brandId });
          if (!result[period.label]) result[period.label] = {};
          result[period.label][brandId] = data;
        })
      );
      await Promise.all(promises);
      if (!cancelled) { setHistoricalData(result); setLoadingHistorical(false); }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [historicalPeriods, displayBrands]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch baseline (previous year) planning data for all displayed brands
  useEffect(() => {
    if (!baselinePeriod || displayBrands.length === 0) { setBaselineData({}); return; }
    let cancelled = false;
    const fetchBaseline = async () => {
      const result: Record<string, any> = {};
      await Promise.all(displayBrands.map(async (brand: any) => {
        const brandId = String(brand.id);
        result[brandId] = await planningService.getHistorical({
          fiscalYear: baselinePeriod.fiscalYear,
          seasonGroupName: baselinePeriod.seasonGroup,
          seasonName: baselinePeriod.season,
          brandId});
      }));
      if (!cancelled) setBaselineData(result);
    };
    fetchBaseline();
    return () => { cancelled = true; };
  }, [baselinePeriod, displayBrands]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch per-brand planning versions (PlanningHeader) using allocateHeaderId filter
  // Only fetch when season filters are complete so we can match the correct allocateHeader
  useEffect(() => {
    if (displayBrands.length === 0 || !filtersComplete) {
      // Clear versions when filters are incomplete
      setBrandPlanningVersions({});
      setBrandSelectedVersion({});
      return;
    }
    displayBrands.forEach(async (brand: any) => {
      const brandId = String(brand.id);
      if (!brandId) return;
      // Find the matching allocateHeader for this brand + season filter
      const matchedAH = matchedAllocateHeaders.find((ah: any) => String(ah.brandId) === brandId);
      const filterParams: any = { brandId, pageSize: 50 };
      if (matchedAH?.id) filterParams.allocateHeaderId = matchedAH.id;
      setBrandLoadingVersions(prev => ({ ...prev, [brandId]: true }));
      try {
        const list = await planningService.getAll(filterParams);
        const mapped = (Array.isArray(list) ? list : []).map((v: any) => ({
          id: String(v.id),
          label: `V${v.version}${v.is_final_version ? ' ★' : ''}`,
          status: v.status || 'DRAFT',
          isFinal: v.is_final_version || false,
          version: v.version}));
        setBrandPlanningVersions(prev => ({ ...prev, [brandId]: mapped }));
        setBrandSelectedVersion(prev => {
          if (prev[brandId] !== undefined) return prev;
          const finalV = mapped.find((v: any) => v.isFinal);
          return { ...prev, [brandId]: finalV ? finalV.id : (mapped[0]?.id || null) };
        });
      } catch (err: any) {
        console.error(`[OTB] Failed to fetch planning versions for brand ${brandId}:`, err?.response?.data || err?.message);
        setBrandPlanningVersions(prev => ({ ...prev, [brandId]: [] }));
      } finally {
        setBrandLoadingVersions(prev => ({ ...prev, [brandId]: false }));
      }
    });
  }, [displayBrands, filtersComplete, matchedAllocateHeaders]); // eslint-disable-line react-hooks/exhaustive-deps

  // Allocate All: validate season + final planning versions, then navigate to SKU Proposal
  const handleAllocateAll = useCallback(() => {
    if (selectedSeasonGroup === 'all') {
      toast('Vui lòng chọn Season Group trước khi tiếp tục', { icon: '⚠️' });
      return;
    }
    if (selectedSeason === 'all') {
      toast('Vui lòng chọn Season trước khi tiếp tục', { icon: '⚠️' });
      return;
    }
    // Check that all displayed brands have a final planning version
    const brandsWithoutFinal = displayBrands.filter((brand: any) => {
      const brandId = String(brand.id);
      const bVersions = brandPlanningVersions[brandId] || [];
      return !bVersions.some((v: any) => v.isFinal);
    });
    if (brandsWithoutFinal.length > 0) {
      const names = brandsWithoutFinal.map((b: any) => b.name || b.code || String(b.id)).join(', ');
      toast(`Các brand sau chưa có final planning version: ${names}. Vui lòng set final version trước khi tiếp tục.`, { icon: '⚠️', duration: 5000 });
      return;
    }
    if (onOpenSkuProposal) {
      onOpenSkuProposal({
        budgetId: selectedBudgetId !== 'all' ? selectedBudgetId : budgetContext?.budgetId,
        budgetName: selectedBudget?.budgetName || budgetContext?.budgetName,
        fiscalYear: selectedBudget?.fiscalYear || budgetContext?.fiscalYear,
        brandName: selectedBudget?.brandName || budgetContext?.brandName,
        brandIds: selectedBrandIds.length > 0 ? selectedBrandIds : undefined,
        seasonGroup: selectedSeasonGroup,
        season: selectedSeason});
    }
  }, [selectedSeasonGroup, selectedSeason, displayBrands, brandPlanningVersions,
      onOpenSkuProposal, selectedBudgetId, selectedBudget, budgetContext, selectedBrandIds]);

  const handleBrandToggle = (brandId: string) => {
    setSelectedBrandIds(prev =>
      prev.includes(brandId) ? prev.filter(id => id !== brandId) : [...prev, brandId]
    );
  };

  // Common table styles - L-ERP Design System (compact)
  const headerCellClass = "px-3 py-2 text-center text-xs font-semibold tracking-wide font-['Montserrat']";
  const headerDarkCell ='bg-gray-100 text-gray-700';
  const headerGoldCell ='bg-[rgba(215,183,151,0.3)] text-[#6B4D30]';
  const headerBrownCell ='bg-[rgba(139,115,85,0.2)] text-[#5C4033]';
  const headerDarkBrownCell ='bg-[rgba(92,64,51,0.2)] text-[#5C4033]';
  const groupRowClass ="bg-gradient-to-r from-[rgba(215,183,151,0.15)] to-[rgba(215,183,151,0.08)] border-l-2 border-[#D7B797]";
  const sumRowClass ="bg-gradient-to-r from-[rgba(215,183,151,0.25)] to-[rgba(215,183,151,0.2)] text-[#5C4A32] font-semibold";

  // Transform categoryStructure (Gender->Cat->SubCat) into categoryFirstStructure (Cat->SubCat->Gender)
  const categoryFirstStructure = useMemo(() => {
    const catMap: Record<string, { category: any; subCategories: Record<string, { subCategory: any; genders: { gender: any; dataKey: string }[] }> }> = {};

    categoryStructure.forEach((genderGroup: any) => {
      genderGroup.categories.forEach((cat: any) => {
        if (!catMap[cat.id]) {
          catMap[cat.id] = { category: { id: cat.id, name: cat.name }, subCategories: {} };
        }
        cat.subCategories.forEach((subCat: any) => {
          if (!catMap[cat.id].subCategories[subCat.id]) {
            catMap[cat.id].subCategories[subCat.id] = { subCategory: { id: subCat.id, name: subCat.name }, genders: [] };
          }
          catMap[cat.id].subCategories[subCat.id].genders.push({
            gender: genderGroup.gender,
            dataKey: `${genderGroup.gender.id}_${cat.id}_${subCat.id}`});
        });
      });
    });

    return Object.values(catMap).map(entry => ({
      ...entry.category,
      subCategories: Object.values(entry.subCategories)}));
  }, [categoryStructure]);

  // Transform categoryStructure (Gender->Cat->SubCat) into genderFirstStructure (Gender->Cat->SubCat with dataKeys)
  const genderFirstStructure = useMemo(() => {
    return categoryStructure.map((genderGroup: any) => ({
      gender: genderGroup.gender,
      categories: (genderGroup.categories || []).map((cat: any) => ({
        category: { id: cat.id, name: cat.name },
        subCategories: (cat.subCategories || []).map((sub: any) => ({
          subCategory: { id: sub.id, name: sub.name },
          dataKey: `${genderGroup.gender.id}_${cat.id}_${sub.id}`,
        })),
      })),
    }));
  }, [categoryStructure]);

  // Build historical data lookups per period, keyed the same way as table data
  // Category: keyed by subcategory_id → { buyPct, salesPct, stPct }
  // Season Type: keyed by `seasonType_${seasonTypeId}_${storeId}`
  // Gender: keyed by `gender_${genderId}_${storeId}`
  const buildHistoricalLookup = useCallback((brandId: string, periodLabel: string) => {
    const plan = historicalData[periodLabel]?.[brandId];
    if (!plan) return { bySub: {} as Record<string, any>, bySeasonType: {} as Record<string, any>, byGender: {} as Record<string, any> };

    const bySub: Record<string, any> = {};
    (plan.planning_categories || []).forEach((pc: any) => {
      const subId = String(pc.subcategory_id || pc.subcategory?.id || '');
      if (subId) bySub[subId] = { buyPct: Number(pc.actual_buy_pct) || 0, salesPct: Number(pc.actual_sales_pct) || 0, stPct: Number(pc.actual_st_pct) || 0 };
    });

    const bySeasonType: Record<string, any> = {};
    (plan.planning_collections || []).forEach((pc: any) => {
      const key = `seasonType_${pc.season_type_id || pc.season_type?.id}_${pc.store_id || pc.store?.id}`;
      bySeasonType[key] = { buyPct: Number(pc.actual_buy_pct) || 0, salesPct: Number(pc.actual_sales_pct) || 0, stPct: Number(pc.actual_st_pct) || 0, moc: Number(pc.actual_moc) || 0 };
    });

    const byGender: Record<string, any> = {};
    (plan.planning_genders || []).forEach((pg: any) => {
      const key = `gender_${pg.gender_id || pg.gender?.id}_${pg.store_id || pg.store?.id}`;
      byGender[key] = { buyPct: Number(pg.actual_buy_pct) || 0, salesPct: Number(pg.actual_sales_pct) || 0, stPct: Number(pg.actual_st_pct) || 0 };
    });

    return { bySub, bySeasonType, byGender };
  }, [historicalData]);

  // Build baseline lookup for a brand (previous year's data for %Buy, %Sales, %ST columns)
  const buildBaselineLookup = useCallback((brandId: string) => {
    const plan = baselineData[brandId];
    if (!plan) return { bySub: {} as Record<string, any>, bySeasonType: {} as Record<string, any>, byGender: {} as Record<string, any> };

    const bySub: Record<string, any> = {};
    (plan.planning_categories || []).forEach((pc: any) => {
      const subId = String(pc.subcategory_id || pc.subcategory?.id || '');
      if (subId) bySub[subId] = { buyPct: Number(pc.actual_buy_pct) || 0, salesPct: Number(pc.actual_sales_pct) || 0, stPct: Number(pc.actual_st_pct) || 0 };
    });

    const bySeasonType: Record<string, any> = {};
    (plan.planning_collections || []).forEach((pc: any) => {
      const key = `seasonType_${pc.season_type_id || pc.season_type?.id}_${pc.store_id || pc.store?.id}`;
      bySeasonType[key] = { buyPct: Number(pc.actual_buy_pct) || 0, salesPct: Number(pc.actual_sales_pct) || 0, stPct: Number(pc.actual_st_pct) || 0, moc: Number(pc.actual_moc) || 0 };
    });

    const byGender: Record<string, any> = {};
    (plan.planning_genders || []).forEach((pg: any) => {
      const key = `gender_${pg.gender_id || pg.gender?.id}_${pg.store_id || pg.store?.id}`;
      byGender[key] = { buyPct: Number(pg.actual_buy_pct) || 0, salesPct: Number(pg.actual_sales_pct) || 0, stPct: Number(pg.actual_st_pct) || 0 };
    });

    return { bySub, bySeasonType, byGender };
  }, [baselineData]);

  // Render Category Tab - Hierarchical Collapsible (Gender -> Category -> SubCategory)
  const renderCategoryTab = (brand?: any) => {
    const brandId = brand ? String(brand.id) : null;
    const isLoadingPlanningData = brandId ? (brandLoadingPlanningData[brandId] || false) : false;

    // Build planning data lookup by subcategory_id from the selected planning version
    const planningDataBySubcatId: Record<string, any> = {};
    if (brandId && brandPlanningData[brandId]) {
      const planCats = (brandPlanningData[brandId].planning_categories || []) as any[];
      planCats.forEach((pc: any) => {
        const subId = String(pc.subcategory_id || pc.subcategory?.id || '');
        if (!subId) return;
        planningDataBySubcatId[subId] = {
          buyPct: pc.actual_buy_pct || 0,
          salesPct: pc.actual_sales_pct || 0,
          stPct: pc.actual_st_pct || 0,
          buyProposed: pc.proposed_buy_pct || 0,
          otbProposed: Number(pc.otb_proposed_amount) || 0,
          varPct: pc.var_lastyear_pct || 0,
          otbSubmitted: Number(pc.otb_actual_amount) || 0,
          buyActual: pc.otb_actual_buy_pct || 0};
      });
    }

    // Baseline lookup for this brand (previous year's %Buy/%Sales/%ST)
    const catBaselineLookup = brandId ? buildBaselineLookup(brandId) : null;

    // cellKey = `${genderId}_${catId}_${subCatId}`, subCatId passed explicitly for planning lookup
    const getRowData = (cellKey: string, subCatId?: string) => {
      let base;
      if (subCatId && planningDataBySubcatId[subCatId]) {
        const plan = planningDataBySubcatId[subCatId];
        base = { ...plan, buyProposed: localData[cellKey]?.buyProposed ?? plan.buyProposed };
      } else {
        base = localData[cellKey] || {};
      }
      // Override buyPct/salesPct/stPct with baseline (previous year) data
      if (catBaselineLookup && subCatId) {
        const bl = catBaselineLookup.bySub[subCatId];
        if (bl) base = { ...base, buyPct: bl.buyPct, salesPct: bl.salesPct, stPct: bl.stPct };
      }
      return base;
    };

    // Calculate gender-level totals (across all categories and subcategories for this gender)
    const calculateGenderTotals = (genderEntry: any) => {
      let totals = { buyPct: 0, salesPct: 0, stPct: 0, buyProposed: 0, otbProposed: 0, varPct: 0, otbSubmitted: 0, buyActual: 0 };
      genderEntry.categories.forEach((catEntry: any) => {
        catEntry.subCategories.forEach((subEntry: any) => {
          const data = getRowData(subEntry.dataKey, String(subEntry.subCategory.id));
          totals.buyPct += data.buyPct || 0;
          totals.salesPct += data.salesPct || 0;
          totals.buyProposed += data.buyProposed || 0;
          totals.otbProposed += data.otbProposed || 0;
          totals.otbSubmitted += data.otbSubmitted || 0;
          totals.buyActual += data.buyActual || 0;
        });
      });
      totals.stPct = totals.salesPct > 0 ? Math.round((totals.salesPct / (totals.buyPct || 1)) * 100) : 0;
      totals.varPct = totals.buyProposed - totals.salesPct;
      return totals;
    };

    // Calculate category-level totals (across all subcategories for this gender+category)
    const calculateCategoryTotals = (catEntry: any) => {
      let totals = { buyPct: 0, salesPct: 0, stPct: 0, buyProposed: 0, otbProposed: 0, varPct: 0, otbSubmitted: 0, buyActual: 0 };
      catEntry.subCategories.forEach((subEntry: any) => {
        const data = getRowData(subEntry.dataKey, String(subEntry.subCategory.id));
        totals.buyPct += data.buyPct || 0;
        totals.salesPct += data.salesPct || 0;
        totals.buyProposed += data.buyProposed || 0;
        totals.otbProposed += data.otbProposed || 0;
        totals.otbSubmitted += data.otbSubmitted || 0;
        totals.buyActual += data.buyActual || 0;
      });
      totals.stPct = totals.salesPct > 0 ? Math.round((totals.salesPct / (totals.buyPct || 1)) * 100) : 0;
      totals.varPct = totals.buyProposed - totals.salesPct;
      return totals;
    };

    // Filter: L1=gender, L2=category, L3=subCategory
    const filteredData = genderFirstStructure
      .filter((gEntry: any) => genderFilter === 'all' || gEntry.gender.id === genderFilter)
      .map((gEntry: any) => ({
        ...gEntry,
        categories: gEntry.categories
          .filter((catEntry: any) => categoryFilter === 'all' || catEntry.category.id === categoryFilter)
          .map((catEntry: any) => ({
            ...catEntry,
            subCategories: catEntry.subCategories.filter((sub: any) => subCategoryFilter === 'all' || sub.subCategory.id === subCategoryFilter)}))
          .filter((catEntry: any) => catEntry.subCategories.length > 0)}))
      .filter((gEntry: any) => gEntry.categories.length > 0);

    if (isLoadingPlanningData) {
      return (
        <div className={`p-8 text-center ${'text-[#999999]'}`}>
          <div className="text-xs font-['Montserrat']">Loading planning data...</div>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-3">
        {filteredData.length === 0 && (
          <div className={`p-8 text-center ${'text-[#999999]'}`}>
            <div className="text-xs font-['Montserrat']">No categories found in master data.</div>
          </div>
        )}
        {/* Hierarchical Content: Gender (L1) -> Category (L2) -> SubCategory rows (L3) */}
        {filteredData.map((genderEntry: any) => {
          const genderTotals = calculateGenderTotals(genderEntry);
          const expandKey = brandId ? `${brandId}::${genderEntry.gender.id}` : genderEntry.gender.id;
          const isGenderExpanded = expandedCategories[expandKey] !== false;

          return (
            <div key={genderEntry.gender.id} className={`rounded-xl border overflow-hidden ${'border-[#C4B5A5]'}`}>
              {/* Gender Header - Level 1 */}
              <div
                onClick={() => toggleCategoryExpanded(genderEntry.gender.id, brandId || undefined)}
                className={`flex flex-wrap items-center gap-2 md:gap-3 px-3 md:px-4 py-0.5 cursor-pointer transition-all ${'bg-gradient-to-r from-[rgba(215,183,151,0.15)] to-[rgba(215,183,151,0.08)] hover:from-[rgba(215,183,151,0.25)] hover:to-[rgba(215,183,151,0.15)] border-b border-[rgba(215,183,151,0.2)]'}`}
              >
                <button className={`p-1 rounded-lg transition-colors ${'bg-[rgba(138,99,64,0.1)] hover:bg-[rgba(138,99,64,0.2)]'}`}>
                  <ChevronDown
                    size={18}
                    className={`transition-transform duration-200 ${isGenderExpanded ? '' : '-rotate-90'} ${'text-[#6B4D30]'}`}
                  />
                </button>
                <Users size={18} className={'text-[#6B4D30]'} />
                <span className={`font-semibold text-xs font-['Montserrat'] uppercase tracking-wide ${'text-[#5C4A3A]'}`}>{genderEntry.gender.name}</span>
                <span className={`ml-auto text-xs md:text-sm ${'text-[#6B4D30]'}`}>
                  {genderEntry.categories.length} categories
                </span>
                <div className={`hidden md:flex items-center gap-4 ml-4 text-sm font-['JetBrains_Mono'] ${'text-[#5C4A3A]'}`}>
                  <span>Buy: <strong>{genderTotals.buyPct}%</strong></span>
                  <span>Sales: <strong>{genderTotals.salesPct}%</strong></span>
                  <span>OTB: <strong>{genderTotals.otbProposed.toLocaleString()}</strong></span>
                </div>
              </div>

              {/* Gender Content */}
              {isGenderExpanded && (
                <div className={`p-3 space-y-2 animate-expandSection ${'bg-[#F2F2F2]'}`}>
                  {genderEntry.categories.map((catEntry: any) => {
                    const rawCatKey = `${genderEntry.gender.id}_${catEntry.category.id}`;
                    const catKey = brandId ? `${brandId}::${rawCatKey}` : rawCatKey;
                    const isCatExpanded = expandedSubCategories[catKey] !== false;
                    const catTotals = calculateCategoryTotals(catEntry);

                    return (
                      <div key={catEntry.category.id} className={`rounded-xl border overflow-hidden ${'border-[#C4B5A5] bg-white'}`}>
                        {/* Category Header - Level 2 */}
                        <div
                          onClick={() => toggleSubCategoryExpanded(genderEntry.gender.id, catEntry.category.id, brandId || undefined)}
                          className={`flex flex-wrap items-center gap-2 md:gap-3 px-3 md:px-4 py-0.5 cursor-pointer transition-all ${'bg-[rgba(160,120,75,0.12)] hover:bg-[rgba(215,183,151,0.2)]'}`}
                        >
                          <button className={`p-1 rounded-lg transition-colors ${'bg-[rgba(215,183,151,0.2)] hover:bg-[rgba(215,183,151,0.3)]'}`}>
                            <ChevronDown
                              size={16}
                              className={`transition-transform duration-200 ${'text-[#6B4D30]'} ${isCatExpanded ? '' : '-rotate-90'}`}
                            />
                          </button>
                          <Tag size={16} className={'text-[#6B4D30]'} />
                          <span className={`font-semibold text-xs uppercase tracking-wide font-['Montserrat'] ${'text-[#6B4D30]'}`}>
                            {catEntry.category.name}
                          </span>
                        </div>

                        {/* SubCategory Table - Level 3 */}
                        {isCatExpanded && (
                          <div className="overflow-x-auto animate-fadeIn">
                            <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
                              <colgroup>
                                <col style={{ width: '160px' }} />{/* Sub-Category name */}
                                <col style={{ width: '70px' }} />{/* %Buy */}
                                <col style={{ width: '70px' }} />{/* %Sales */}
                                <col style={{ width: '70px' }} />{/* %ST */}
                                {historicalPeriods
                                  .filter(p => !(baselinePeriod && p.fiscalYear === baselinePeriod.fiscalYear && p.seasonGroup === baselinePeriod.seasonGroup && p.season === baselinePeriod.season))
                                  .map((period) => (
                                  <React.Fragment key={`col_hist_${period.label}`}>
                                    <col style={{ width: '60px' }} />
                                    <col style={{ width: '60px' }} />
                                    <col style={{ width: '60px' }} />
                                  </React.Fragment>
                                ))}
                                <col style={{ width: '90px' }} />{/* %Proposed */}
                                <col style={{ width: '100px' }} />{/* $OTB */}
                                <col style={{ width: '80px' }} />{/* Variance */}
                                <col style={{ width: '80px' }} />{/* Submit */}
                                <col style={{ width: '70px' }} />{/* %Actual */}
                                <col style={{ width: '50px' }} />{/* Actions */}
                              </colgroup>
                              <thead>
                                {baselinePeriod && (
                                  <tr>
                                    <th className={`${headerDarkCell}`} />
                                    <th colSpan={3} className={`px-3 py-0.5 text-center text-[9px] italic font-normal font-['Montserrat'] whitespace-nowrap ${'text-[#888] bg-[rgba(150,130,110,0.06)]'}`}>
                                      {baselinePeriod.label}
                                    </th>
                                    {historicalPeriods
                                      .filter(p => !(baselinePeriod && p.fiscalYear === baselinePeriod.fiscalYear && p.seasonGroup === baselinePeriod.seasonGroup && p.season === baselinePeriod.season))
                                      .map((period) => (
                                      <th key={`cat_grp_${period.label}`} colSpan={3} className={`px-2 py-0.5 text-center text-[9px] italic font-normal font-['Montserrat'] whitespace-nowrap border-l-2 border-[#D7B797] ${'text-[#777] bg-[rgba(150,130,110,0.08)]'}`}>
                                        {period.label}
                                      </th>
                                    ))}
                                    <th colSpan={6} className={`${headerDarkCell}`} />
                                  </tr>
                                )}
                                <tr>
                                  <th className={`px-3 py-1 text-left text-[11px] font-semibold font-['Montserrat'] ${headerDarkCell}`}>Sub-Category</th>
                                  <th className={`px-2 py-1 text-center text-[11px] font-semibold font-['Montserrat'] ${headerDarkCell}`}>{t('otbAnalysis.pctBuy')}</th>
                                  <th className={`px-2 py-1 text-center text-[11px] font-semibold font-['Montserrat'] ${headerDarkCell}`}>{t('otbAnalysis.pctSales')}</th>
                                  <th className={`px-2 py-1 text-center text-[11px] font-semibold font-['Montserrat'] ${headerDarkCell}`}>{t('otbAnalysis.pctST')}</th>
                                  {historicalPeriods
                                    .filter(p => !(baselinePeriod && p.fiscalYear === baselinePeriod.fiscalYear && p.seasonGroup === baselinePeriod.seasonGroup && p.season === baselinePeriod.season))
                                    .map((period) => (
                                    <React.Fragment key={`cat_hdr_${period.label}`}>
                                      <th className={`px-2 py-1 text-center text-[10px] font-semibold font-['Montserrat'] border-l-2 border-[#D7B797] ${'bg-[rgba(150,130,110,0.12)] text-[#777]'}`}>%Buy</th>
                                      <th className={`px-2 py-1 text-center text-[10px] font-semibold font-['Montserrat'] ${'bg-[rgba(150,130,110,0.12)] text-[#777]'}`}>%Sales</th>
                                      <th className={`px-2 py-1 text-center text-[10px] font-semibold font-['Montserrat'] ${'bg-[rgba(150,130,110,0.12)] text-[#777]'}`}>%ST</th>
                                    </React.Fragment>
                                  ))}
                                  <th className={`px-2 py-1 text-center text-[11px] font-semibold font-['Montserrat'] ${headerGoldCell}`}>{t('otbAnalysis.pctProposed')}</th>
                                  <th className={`px-2 py-1 text-center text-[11px] font-semibold font-['Montserrat'] ${headerBrownCell}`}>{t('otbAnalysis.dollarOTB')}</th>
                                  <th className={`px-2 py-1 text-center text-[11px] font-semibold font-['Montserrat'] ${headerDarkBrownCell}`}>{t('otbAnalysis.variance')}</th>
                                  <th className={`px-2 py-1 text-center text-[11px] font-semibold font-['Montserrat'] ${headerDarkCell}`}>{t('common.submit')}</th>
                                  <th className={`px-2 py-1 text-center text-[11px] font-semibold font-['Montserrat'] ${headerDarkCell}`}>% Actual</th>
                                  <th className={`px-2 py-1 text-center text-[11px] font-semibold font-['Montserrat'] ${headerDarkCell}`}>{t('common.actions')}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {catEntry.subCategories.map((subEntry: any, sIdx: number) => {
                                  const cellKey = subEntry.dataKey;
                                  const subCatId = String(subEntry.subCategory.id);
                                  const rowData = getRowData(cellKey, subCatId);
                                  const isEditing = editingCell === cellKey;

                                  return (
                                    <tr
                                      key={cellKey}
                                      className={`border-b transition-colors ${`border-[#D4C8BB] hover:bg-[rgba(160,120,75,0.08)] ${sIdx % 2 === 0 ? 'bg-white' : 'bg-[#F2F2F2]/50'}`}`}
                                    >
                                      <td className="px-4 py-0.5">
                                        <div className="flex items-center gap-2">
                                          <Layers size={12} className={'text-[#999999]'} />
                                          <span className={'text-[#1A1A1A]'}>{subEntry.subCategory.name}</span>
                                        </div>
                                      </td>
                                      <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${'text-[#666666]'}`}>{rowData.buyPct || 0}%</td>
                                      <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${'text-[#666666]'}`}>{rowData.salesPct || 0}%</td>
                                      <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${'text-[#666666]'}`}>{rowData.stPct || 0}%</td>
                                      {historicalPeriods
                                        .filter(p => !(baselinePeriod && p.fiscalYear === baselinePeriod.fiscalYear && p.seasonGroup === baselinePeriod.seasonGroup && p.season === baselinePeriod.season))
                                        .map((period) => {
                                        const hLookup = buildHistoricalLookup(brandId || '', period.label);
                                        const hData = hLookup.bySub[subCatId] || {};
                                        return (
                                          <React.Fragment key={`cat_data_${period.label}_${cellKey}`}>
                                            <td className={`border-l-2 border-[#D7B797] px-2 py-0.5 text-center font-['JetBrains_Mono'] text-[10px] ${'text-[#777] bg-[rgba(150,130,110,0.04)]'}`}>{hData.buyPct || 0}%</td>
                                            <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] text-[10px] ${'text-[#777] bg-[rgba(150,130,110,0.04)]'}`}>{hData.salesPct || 0}%</td>
                                            <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] text-[10px] ${'text-[#777] bg-[rgba(150,130,110,0.04)]'}`}>{hData.stPct || 0}%</td>
                                          </React.Fragment>
                                        );
                                      })}
                                      <td className={`px-3 py-0.5 ${'bg-[rgba(160,120,75,0.12)]'}`}>
                                        <EditableCell
                                          cellKey={cellKey}
                                          value={rowData.buyProposed || 0}
                                          isEditing={isEditing}
                                          editValue={editValue}
                                          onStartEdit={handleStartEdit}
                                          onSaveEdit={handleSaveEdit}
                                          onChangeValue={setEditValue}
                                          onKeyDown={handleKeyDown}
                                        />
                                      </td>
                                      <td className={`px-3 py-0.5 text-center font-medium font-['JetBrains_Mono'] ${'text-[#1A1A1A]'}`}>
                                        {(rowData.otbProposed || 0).toLocaleString()}
                                      </td>
                                      <td className={`px-3 py-0.5 text-center font-medium font-['JetBrains_Mono'] ${
                                        (rowData.varPct || 0) < 0 ? 'text-[#F85149]' : 'text-[#2A9E6A]'
                                      }`}>
                                        {(rowData.varPct || 0) > 0 ? '+' : ''}{rowData.varPct || 0}%
                                      </td>
                                      <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${'text-[#666666]'}`}>
                                        {(rowData.otbSubmitted || 0).toLocaleString()}
                                      </td>
                                      <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${'text-[#666666]'}`}>{rowData.buyActual || 0}%</td>
                                      <td className="px-3 py-0.5 text-center">
                                        <button
                                          onClick={() => {
                                            if (onOpenSkuProposal) {
                                              onOpenSkuProposal({
                                                budgetId: selectedBudgetId !== 'all' ? selectedBudgetId : budgetContext?.budgetId,
                                                budgetName: selectedBudget?.budgetName || budgetContext?.budgetName,
                                                fiscalYear: selectedBudget?.fiscalYear || budgetContext?.fiscalYear,
                                                brandName: selectedBudget?.brandName || budgetContext?.brandName,
                                                brandIds: brandId ? [brandId] : undefined,
                                                seasonGroup: selectedSeasonGroup !== 'all' ? selectedSeasonGroup : budgetContext?.seasonGroup,
                                                season: selectedSeason !== 'all' ? selectedSeason : budgetContext?.season,
                                                gender: genderEntry.gender,
                                                category: catEntry.category,
                                                subCategory: subEntry.subCategory,
                                                otbData: rowData
                                              });
                                            }
                                          }}
                                          className="p-1.5 border border-[#8B7355]/40 hover:border-[#D7B797]/60 bg-[#8B7355]/10 hover:bg-[#8B7355]/20 text-[#D7B797] rounded-lg transition-all"
                                          title={t('otbAnalysis.allocateSKU')}
                                        >
                                          <Split size={12} />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                                {/* Category Subtotal Row */}
                                <tr className={'bg-gradient-to-r from-[rgba(215,183,151,0.25)] to-[rgba(215,183,151,0.2)] font-medium'}>
                                  <td className={`px-4 py-0.5 font-semibold font-['Montserrat'] ${'text-[#5C4A32]'}`}>{t('otbAnalysis.subTotal')}</td>
                                  <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${'text-[#5C4A32]'}`}>{catTotals.buyPct}%</td>
                                  <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${'text-[#5C4A32]'}`}>{catTotals.salesPct}%</td>
                                  <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${'text-[#5C4A32]'}`}>{catTotals.stPct}%</td>
                                  {historicalPeriods
                                    .filter(p => !(baselinePeriod && p.fiscalYear === baselinePeriod.fiscalYear && p.seasonGroup === baselinePeriod.seasonGroup && p.season === baselinePeriod.season))
                                    .map((period) => (
                                    <React.Fragment key={`cat_sub_${period.label}`}>
                                      <td className={`border-l-2 border-[#D7B797] px-2 py-0.5 text-center font-['JetBrains_Mono'] text-[10px] ${'text-[#777]'}`}>-</td>
                                      <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] text-[10px] ${'text-[#777]'}`}>-</td>
                                      <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] text-[10px] ${'text-[#777]'}`}>-</td>
                                    </React.Fragment>
                                  ))}
                                  <td className={`px-3 py-0.5 text-center bg-[rgba(160,120,75,0.18)] font-bold font-['JetBrains_Mono'] ${'text-[#6B4D30]'}`}>{catTotals.buyProposed}%</td>
                                  <td className={`px-3 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${'text-[#5C4A32]'}`}>{catTotals.otbProposed.toLocaleString()}</td>
                                  <td className={`px-3 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${
                                    catTotals.varPct < 0 ? 'text-[#FF7B72]' :'text-[#5C4A32]'}`}>
                                    {catTotals.varPct > 0 ? '+' : ''}{catTotals.varPct}%
                                  </td>
                                  <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${'text-[#5C4A32]'}`}>{catTotals.otbSubmitted.toLocaleString()}</td>
                                  <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${'text-[#5C4A32]'}`}>{catTotals.buyActual}%</td>
                                  <td className="px-3 py-0.5"></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Gender Total */}
                  <div className={`rounded-xl p-3 border ${'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)]'}`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <span className={`font-semibold text-xs font-['Montserrat'] uppercase tracking-wide ${'text-[#6B4D30]'}`}>
                        TOTAL {genderEntry.gender.name.toUpperCase()}
                      </span>
                      <div className={`flex flex-wrap items-center gap-2 md:gap-6 text-xs md:text-sm font-['JetBrains_Mono'] ${'text-[#6B4D30]'}`}>
                        <span>% Buy: <strong>{genderTotals.buyPct}%</strong></span>
                        <span>% Sales: <strong>{genderTotals.salesPct}%</strong></span>
                        <span>% ST: <strong>{genderTotals.stPct}%</strong></span>
                        <span>% Proposed: <strong>{genderTotals.buyProposed}%</strong></span>
                        <span>$ OTB: <strong>{genderTotals.otbProposed.toLocaleString()}</strong></span>
                        <span className={genderTotals.varPct < 0 ? 'text-[#F85149]' : ''}>
                          Var: <strong>{genderTotals.varPct > 0 ? '+' : ''}{genderTotals.varPct}%</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render Season Type Tab — season type sections with store-level detail
  const renderSeasonTypeTab = (brand?: any) => {
    const colBrandId = brand ? String(brand.id) : null;
    const colBaselineLookup = colBrandId ? buildBaselineLookup(colBrandId) : null;

    const calculateSeasonTypeTotals = (sectionId: string) => {
      let totals = { buyPct: 0, salesPct: 0, stPct: 0, moc: 0, userBuyPct: 0, otbValue: 0, varPct: 0 };
      let count = 0;
      activeStores.forEach((store: any) => {
        const key = `seasonType_${sectionId}_${store.id}`;
        const bl = colBaselineLookup?.bySeasonType[key];
        const data = localData[key] || {};
        totals.buyPct += bl?.buyPct || 0;
        totals.salesPct += bl?.salesPct || 0;
        totals.moc += bl?.moc || 0;
        totals.userBuyPct += data.userBuyPct || 0;
        totals.otbValue += data.otbValue || 0;
        totals.varPct += data.varPct || 0;
        count++;
      });
      totals.stPct = totals.salesPct > 0 ? Math.round((totals.salesPct / (totals.buyPct || 1)) * 100) : 0;
      if (count > 0) totals.moc = Math.round((totals.moc / count) * 10) / 10;
      return totals;
    };

    return (
      <div className="p-4 space-y-3">
        {seasonTypeSections.map((section: any) => {
          const sectionTotals = calculateSeasonTypeTotals(section.id);
          const isExpanded = expandedSeasonTypes[section.id] !== false;

          return (
            <div key={section.id} className={`rounded-xl border overflow-hidden ${'border-[#C4B5A5]'}`}>
              {/* Season Type Header */}
              <div
                onClick={() => setExpandedSeasonTypes(prev => ({ ...prev, [section.id]: !isExpanded }))}
                className={`flex flex-wrap items-center gap-2 md:gap-3 px-3 md:px-4 py-0.5 cursor-pointer transition-all ${'bg-gradient-to-r from-[rgba(215,183,151,0.15)] to-[rgba(215,183,151,0.08)] hover:from-[rgba(215,183,151,0.25)] hover:to-[rgba(215,183,151,0.15)] border-b border-[rgba(215,183,151,0.2)]'}`}
              >
                <button className={`p-1 rounded-lg transition-colors ${'bg-[rgba(138,99,64,0.1)] hover:bg-[rgba(138,99,64,0.2)]'}`}>
                  <ChevronDown size={18} className={`transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'} ${'text-[#6B4D30]'}`} />
                </button>
                <Bookmark size={18} className={'text-[#6B4D30]'} />
                <span className={`font-semibold text-xs font-['Montserrat'] uppercase tracking-wide ${'text-[#5C4A3A]'}`}>{section.name}</span>
                <span className={`ml-auto text-xs md:text-sm ${'text-[#6B4D30]'}`}>
                  {activeStores.length} stores
                </span>
                <div className={`hidden md:flex items-center gap-4 ml-4 text-sm font-['JetBrains_Mono'] ${'text-[#5C4A3A]'}`}>
                  <span>Buy: <strong>{sectionTotals.buyPct}%</strong></span>
                  <span>Sales: <strong>{sectionTotals.salesPct}%</strong></span>
                  <span>OTB: <strong>{formatCurrency(sectionTotals.otbValue)}</strong></span>
                </div>
              </div>

              {/* Season Type Store Table */}
              {isExpanded && (
                <div className="overflow-x-auto animate-expandSection">
                  <table className="w-full text-sm">
                    <thead>
                      {baselinePeriod && (
                        <tr>
                          <th className={`${headerDarkCell}`} />
                          <th colSpan={4} className={`px-3 py-0.5 text-center text-[9px] italic font-normal font-['Montserrat'] whitespace-nowrap ${'text-[#888] bg-[rgba(150,130,110,0.06)]'}`}>
                            {baselinePeriod.label}
                          </th>
                          {historicalPeriods
                            .filter(p => !(baselinePeriod && p.fiscalYear === baselinePeriod.fiscalYear && p.seasonGroup === baselinePeriod.seasonGroup && p.season === baselinePeriod.season))
                            .map((period) => (
                            <th key={`col_grp_${period.label}`} colSpan={4} className={`px-2 py-0.5 text-center text-[9px] italic font-normal font-['Montserrat'] whitespace-nowrap border-l-2 border-[#D7B797] ${'text-[#777] bg-[rgba(150,130,110,0.08)]'}`}>
                              {period.label}
                            </th>
                          ))}
                          <th colSpan={3} className={`${headerDarkCell}`} />
                        </tr>
                      )}
                      <tr>
                        <th className={`px-4 py-2 text-left text-xs font-semibold font-['Montserrat'] ${headerDarkCell}`}>Store</th>
                        <th className={`${headerCellClass} ${headerDarkCell}`}>{t('otbAnalysis.pctBuy')}</th>
                        <th className={`${headerCellClass} ${headerDarkCell}`}>{t('otbAnalysis.pctSales')}</th>
                        <th className={`${headerCellClass} ${headerDarkCell}`}>{t('otbAnalysis.pctST')}</th>
                        <th className={`${headerCellClass} ${headerDarkCell}`}>MOC</th>
                        {historicalPeriods
                          .filter(p => !(baselinePeriod && p.fiscalYear === baselinePeriod.fiscalYear && p.seasonGroup === baselinePeriod.seasonGroup && p.season === baselinePeriod.season))
                          .map((period) => (
                          <React.Fragment key={`col_hdr_${period.label}`}>
                            <th className={`px-2 py-1 text-center text-[10px] font-semibold font-['Montserrat'] border-l-2 border-[#D7B797] ${'bg-[rgba(150,130,110,0.12)] text-[#777]'}`}>%Buy</th>
                            <th className={`px-2 py-1 text-center text-[10px] font-semibold font-['Montserrat'] ${'bg-[rgba(150,130,110,0.12)] text-[#777]'}`}>%Sales</th>
                            <th className={`px-2 py-1 text-center text-[10px] font-semibold font-['Montserrat'] ${'bg-[rgba(150,130,110,0.12)] text-[#777]'}`}>%ST</th>
                            <th className={`px-2 py-1 text-center text-[10px] font-semibold font-['Montserrat'] ${'bg-[rgba(150,130,110,0.12)] text-[#777]'}`}>MOC</th>
                          </React.Fragment>
                        ))}
                        <th className={`${headerCellClass} ${headerGoldCell}`}>{t('otbAnalysis.pctProposed')}</th>
                        <th className={`${headerCellClass} ${headerBrownCell}`}>{t('otbAnalysis.dollarOTB')}</th>
                        <th className={`${headerCellClass} ${headerDarkBrownCell}`}>{t('otbAnalysis.variance')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeStores.map((store: any, sIdx: number) => {
                        const cellKey = `seasonType_${section.id}_${store.id}`;
                        const rowData = localData[cellKey] || {};
                        const colBl = colBaselineLookup?.bySeasonType[cellKey] || {};
                        const isEditing = editingCell === cellKey;

                        return (
                          <tr
                            key={cellKey}
                            className={`border-b transition-colors ${`border-[#D4C8BB] hover:bg-[rgba(160,120,75,0.08)] ${sIdx % 2 === 0 ? 'bg-white' : 'bg-[#F2F2F2]/50'}`}`}
                          >
                            <td className="px-4 py-0.5">
                              <div className="flex items-center gap-2">
                                <Store size={12} className={'text-[#999999]'} />
                                <span className={'text-[#1A1A1A]'}>{store.name}</span>
                              </div>
                            </td>
                            <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${'text-[#666666]'}`}>{colBl.buyPct || 0}%</td>
                            <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${'text-[#666666]'}`}>{colBl.salesPct || 0}%</td>
                            <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${'text-[#666666]'}`}>{colBl.stPct || 0}%</td>
                            <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${'text-[#666666]'}`}>{colBl.moc || 0}</td>
                            {historicalPeriods
                              .filter(p => !(baselinePeriod && p.fiscalYear === baselinePeriod.fiscalYear && p.seasonGroup === baselinePeriod.seasonGroup && p.season === baselinePeriod.season))
                              .map((period) => {
                              const hLookup = buildHistoricalLookup(colBrandId || '', period.label);
                              const hData = hLookup.bySeasonType[cellKey] || {};
                              return (
                                <React.Fragment key={`col_data_${period.label}_${cellKey}`}>
                                  <td className={`border-l-2 border-[#D7B797] px-2 py-0.5 text-center font-['JetBrains_Mono'] text-[10px] ${'text-[#777] bg-[rgba(150,130,110,0.04)]'}`}>{hData.buyPct || 0}%</td>
                                  <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] text-[10px] ${'text-[#777] bg-[rgba(150,130,110,0.04)]'}`}>{hData.salesPct || 0}%</td>
                                  <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] text-[10px] ${'text-[#777] bg-[rgba(150,130,110,0.04)]'}`}>{hData.stPct || 0}%</td>
                                  <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] text-[10px] ${'text-[#777] bg-[rgba(150,130,110,0.04)]'}`}>{hData.moc || 0}</td>
                                </React.Fragment>
                              );
                            })}
                            <td className={`px-3 py-0.5 ${'bg-[rgba(160,120,75,0.12)]'}`}>
                              <EditableCell
                                cellKey={cellKey}
                                value={rowData.userBuyPct || 0}
                                isEditing={isEditing}
                                editValue={editValue}
                                onStartEdit={handleStartEdit}
                                onSaveEdit={handleSaveEdit}
                                onChangeValue={setEditValue}
                                onKeyDown={handleKeyDown}
                              />
                            </td>
                            <td className={`px-3 py-0.5 text-center font-medium font-['JetBrains_Mono'] ${'text-[#1A1A1A]'}`}>
                              {formatCurrency(rowData.otbValue || 0)}
                            </td>
                            <td className={`px-3 py-0.5 text-center font-medium font-['JetBrains_Mono'] ${
                              (rowData.varPct || 0) < 0 ? 'text-[#F85149]' : 'text-[#2A9E6A]'
                            }`}>
                              {(rowData.varPct || 0) > 0 ? '+' : ''}{rowData.varPct || 0}%
                            </td>
                          </tr>
                        );
                      })}
                      {/* Season Type Subtotal */}
                      <tr className={'bg-gradient-to-r from-[rgba(215,183,151,0.25)] to-[rgba(215,183,151,0.2)] font-medium'}>
                        <td className={`px-4 py-0.5 font-semibold font-['Montserrat'] ${'text-[#5C4A32]'}`}>{t('otbAnalysis.subTotal')}</td>
                        <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${'text-[#5C4A32]'}`}>{sectionTotals.buyPct}%</td>
                        <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${'text-[#5C4A32]'}`}>{sectionTotals.salesPct}%</td>
                        <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${'text-[#5C4A32]'}`}>{sectionTotals.stPct}%</td>
                        <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${'text-[#5C4A32]'}`}>{sectionTotals.moc}</td>
                        {historicalPeriods
                          .filter(p => !(baselinePeriod && p.fiscalYear === baselinePeriod.fiscalYear && p.seasonGroup === baselinePeriod.seasonGroup && p.season === baselinePeriod.season))
                          .map((period) => {
                          const hLookup = buildHistoricalLookup(colBrandId || '', period.label);
                          let hBuy = 0, hSales = 0, hSt = 0, hMoc = 0, hCount = 0;
                          activeStores.forEach((store: any) => {
                            const hData = hLookup.bySeasonType[`seasonType_${section.id}_${store.id}`] || {};
                            hBuy += hData.buyPct || 0; hSales += hData.salesPct || 0; hSt += hData.stPct || 0; hMoc += hData.moc || 0; hCount++;
                          });
                          return (
                            <React.Fragment key={`col_sub_${period.label}`}>
                              <td className={`border-l-2 border-[#D7B797] px-2 py-0.5 text-center font-['JetBrains_Mono'] text-[10px] ${'text-[#777]'}`}>{hBuy}%</td>
                              <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] text-[10px] ${'text-[#777]'}`}>{hSales}%</td>
                              <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] text-[10px] ${'text-[#777]'}`}>{hCount > 0 ? Math.round((hSales / (hBuy || 1)) * 100) : 0}%</td>
                              <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] text-[10px] ${'text-[#777]'}`}>{hCount > 0 ? Math.round((hMoc / hCount) * 10) / 10 : 0}</td>
                            </React.Fragment>
                          );
                        })}
                        <td className={`px-3 py-0.5 text-center bg-[rgba(160,120,75,0.18)] font-bold font-['JetBrains_Mono'] ${'text-[#6B4D30]'}`}>{sectionTotals.userBuyPct}%</td>
                        <td className={`px-3 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${'text-[#5C4A32]'}`}>{formatCurrency(sectionTotals.otbValue)}</td>
                        <td className={`px-3 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${
                          sectionTotals.varPct < 0 ? 'text-[#FF7B72]' :'text-[#5C4A32]'}`}>
                          {sectionTotals.varPct > 0 ? '+' : ''}{sectionTotals.varPct}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render Gender Tab — gender groups with store-level detail
  const renderGenderTab = (brand?: any) => {
    const genBrandId = brand ? String(brand.id) : null;
    const genBaselineLookup = genBrandId ? buildBaselineLookup(genBrandId) : null;
    const genderList = categoryStructure.length > 0
      ? categoryStructure.map((g: any) => g.gender)
      : GENDERS;

    const calculateGenderTotals = (genderId: string) => {
      let totals = { buyPct: 0, salesPct: 0, stPct: 0, userBuyPct: 0, otbValue: 0, varPct: 0 };
      activeStores.forEach((store: any) => {
        const key = `gender_${genderId}_${store.id}`;
        const bl = genBaselineLookup?.byGender[key];
        const data = localData[key] || {};
        totals.buyPct += bl?.buyPct || 0;
        totals.salesPct += bl?.salesPct || 0;
        totals.userBuyPct += data.userBuyPct || 0;
        totals.otbValue += data.otbValue || 0;
        totals.varPct += data.varPct || 0;
      });
      totals.stPct = totals.salesPct > 0 ? Math.round((totals.salesPct / (totals.buyPct || 1)) * 100) : 0;
      return totals;
    };

    return (
      <div className="p-4 space-y-3">
        {genderList.map((gender: any) => {
          const genderTotals = calculateGenderTotals(gender.id);
          const isExpanded = expandedGenderGroups[gender.id] !== false;

          return (
            <div key={gender.id} className={`rounded-xl border overflow-hidden ${'border-[#C4B5A5]'}`}>
              {/* Gender Header */}
              <div
                onClick={() => setExpandedGenderGroups(prev => ({ ...prev, [gender.id]: !isExpanded }))}
                className={`flex flex-wrap items-center gap-2 md:gap-3 px-3 md:px-4 py-0.5 cursor-pointer transition-all ${'bg-gradient-to-r from-[rgba(215,183,151,0.15)] to-[rgba(215,183,151,0.08)] hover:from-[rgba(215,183,151,0.25)] hover:to-[rgba(215,183,151,0.15)] border-b border-[rgba(215,183,151,0.2)]'}`}
              >
                <button className={`p-1 rounded-lg transition-colors ${'bg-[rgba(138,99,64,0.1)] hover:bg-[rgba(138,99,64,0.2)]'}`}>
                  <ChevronDown size={18} className={`transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'} ${'text-[#6B4D30]'}`} />
                </button>
                <Users size={18} className={'text-[#6B4D30]'} />
                <span className={`font-semibold text-xs font-['Montserrat'] uppercase tracking-wide ${'text-[#5C4A3A]'}`}>{gender.name}</span>
                <span className={`ml-auto text-xs md:text-sm ${'text-[#6B4D30]'}`}>
                  {activeStores.length} stores
                </span>
                <div className={`hidden md:flex items-center gap-4 ml-4 text-sm font-['JetBrains_Mono'] ${'text-[#5C4A3A]'}`}>
                  <span>Buy: <strong>{genderTotals.buyPct}%</strong></span>
                  <span>Sales: <strong>{genderTotals.salesPct}%</strong></span>
                  <span>OTB: <strong>{formatCurrency(genderTotals.otbValue)}</strong></span>
                </div>
              </div>

              {/* Gender Store Table */}
              {isExpanded && (
                <div className="overflow-x-auto animate-expandSection">
                  <table className="w-full text-sm">
                    <thead>
                      {baselinePeriod && (
                        <tr>
                          <th className={`${headerDarkCell}`} />
                          <th colSpan={3} className={`px-3 py-0.5 text-center text-[9px] italic font-normal font-['Montserrat'] whitespace-nowrap ${'text-[#888] bg-[rgba(150,130,110,0.06)]'}`}>
                            {baselinePeriod.label}
                          </th>
                          {historicalPeriods
                            .filter(p => !(baselinePeriod && p.fiscalYear === baselinePeriod.fiscalYear && p.seasonGroup === baselinePeriod.seasonGroup && p.season === baselinePeriod.season))
                            .map((period) => (
                            <th key={`gen_grp_${period.label}`} colSpan={3} className={`px-2 py-0.5 text-center text-[9px] italic font-normal font-['Montserrat'] whitespace-nowrap border-l-2 border-[#D7B797] ${'text-[#777] bg-[rgba(150,130,110,0.08)]'}`}>
                              {period.label}
                            </th>
                          ))}
                          <th colSpan={3} className={`${headerDarkCell}`} />
                        </tr>
                      )}
                      <tr>
                        <th className={`px-4 py-2 text-left text-xs font-semibold font-['Montserrat'] ${headerDarkCell}`}>Store</th>
                        <th className={`${headerCellClass} ${headerDarkCell}`}>{t('otbAnalysis.pctBuy')}</th>
                        <th className={`${headerCellClass} ${headerDarkCell}`}>{t('otbAnalysis.pctSales')}</th>
                        <th className={`${headerCellClass} ${headerDarkCell}`}>{t('otbAnalysis.pctST')}</th>
                        {historicalPeriods
                          .filter(p => !(baselinePeriod && p.fiscalYear === baselinePeriod.fiscalYear && p.seasonGroup === baselinePeriod.seasonGroup && p.season === baselinePeriod.season))
                          .map((period) => (
                          <React.Fragment key={`gen_hdr_${period.label}`}>
                            <th className={`px-2 py-1 text-center text-[10px] font-semibold font-['Montserrat'] border-l-2 border-[#D7B797] ${'bg-[rgba(150,130,110,0.12)] text-[#777]'}`}>%Buy</th>
                            <th className={`px-2 py-1 text-center text-[10px] font-semibold font-['Montserrat'] ${'bg-[rgba(150,130,110,0.12)] text-[#777]'}`}>%Sales</th>
                            <th className={`px-2 py-1 text-center text-[10px] font-semibold font-['Montserrat'] ${'bg-[rgba(150,130,110,0.12)] text-[#777]'}`}>%ST</th>
                          </React.Fragment>
                        ))}
                        <th className={`${headerCellClass} ${headerGoldCell}`}>{t('otbAnalysis.pctProposed')}</th>
                        <th className={`${headerCellClass} ${headerBrownCell}`}>{t('otbAnalysis.dollarOTB')}</th>
                        <th className={`${headerCellClass} ${headerDarkBrownCell}`}>{t('otbAnalysis.variance')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeStores.map((store: any, sIdx: number) => {
                        const cellKey = `gender_${gender.id}_${store.id}`;
                        const rowData = localData[cellKey] || {};
                        const genBl = genBaselineLookup?.byGender[cellKey] || {};
                        const isEditing = editingCell === cellKey;

                        return (
                          <tr
                            key={cellKey}
                            className={`border-b transition-colors ${`border-[#D4C8BB] hover:bg-[rgba(160,120,75,0.08)] ${sIdx % 2 === 0 ? 'bg-white' : 'bg-[#F2F2F2]/50'}`}`}
                          >
                            <td className="px-4 py-0.5">
                              <div className="flex items-center gap-2">
                                <Store size={12} className={'text-[#999999]'} />
                                <span className={'text-[#1A1A1A]'}>{store.name}</span>
                              </div>
                            </td>
                            <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${'text-[#666666]'}`}>{genBl.buyPct || rowData.buyPct || 0}%</td>
                            <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${'text-[#666666]'}`}>{genBl.salesPct || rowData.salesPct || 0}%</td>
                            <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] ${'text-[#666666]'}`}>{genBl.stPct || rowData.stPct || 0}%</td>
                            {historicalPeriods
                              .filter(p => !(baselinePeriod && p.fiscalYear === baselinePeriod.fiscalYear && p.seasonGroup === baselinePeriod.seasonGroup && p.season === baselinePeriod.season))
                              .map((period) => {
                              const hLookup = buildHistoricalLookup(genBrandId || '', period.label);
                              const hData = hLookup.byGender[cellKey] || {};
                              return (
                                <React.Fragment key={`gen_data_${period.label}_${cellKey}`}>
                                  <td className={`border-l-2 border-[#D7B797] px-2 py-0.5 text-center font-['JetBrains_Mono'] text-[10px] ${'text-[#777] bg-[rgba(150,130,110,0.04)]'}`}>{hData.buyPct || 0}%</td>
                                  <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] text-[10px] ${'text-[#777] bg-[rgba(150,130,110,0.04)]'}`}>{hData.salesPct || 0}%</td>
                                  <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] text-[10px] ${'text-[#777] bg-[rgba(150,130,110,0.04)]'}`}>{hData.stPct || 0}%</td>
                                </React.Fragment>
                              );
                            })}
                            <td className={`px-3 py-0.5 ${'bg-[rgba(160,120,75,0.12)]'}`}>
                              <EditableCell
                                cellKey={cellKey}
                                value={rowData.userBuyPct || 0}
                                isEditing={isEditing}
                                editValue={editValue}
                                onStartEdit={handleStartEdit}
                                onSaveEdit={handleSaveEdit}
                                onChangeValue={setEditValue}
                                onKeyDown={handleKeyDown}
                              />
                            </td>
                            <td className={`px-3 py-0.5 text-center font-medium font-['JetBrains_Mono'] ${'text-[#1A1A1A]'}`}>
                              {formatCurrency(rowData.otbValue || 0)}
                            </td>
                            <td className={`px-3 py-0.5 text-center font-medium font-['JetBrains_Mono'] ${
                              (rowData.varPct || 0) < 0 ? 'text-[#F85149]' : 'text-[#2A9E6A]'
                            }`}>
                              {(rowData.varPct || 0) > 0 ? '+' : ''}{rowData.varPct || 0}%
                            </td>
                          </tr>
                        );
                      })}
                      {/* Gender Subtotal */}
                      <tr className={'bg-gradient-to-r from-[rgba(215,183,151,0.25)] to-[rgba(215,183,151,0.2)] font-medium'}>
                        <td className={`px-4 py-0.5 font-semibold font-['Montserrat'] ${'text-[#5C4A32]'}`}>{t('otbAnalysis.subTotal')}</td>
                        <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${'text-[#5C4A32]'}`}>{genderTotals.buyPct}%</td>
                        <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${'text-[#5C4A32]'}`}>{genderTotals.salesPct}%</td>
                        <td className={`px-3 py-0.5 text-center font-['JetBrains_Mono'] ${'text-[#5C4A32]'}`}>{genderTotals.stPct}%</td>
                        {historicalPeriods
                          .filter(p => !(baselinePeriod && p.fiscalYear === baselinePeriod.fiscalYear && p.seasonGroup === baselinePeriod.seasonGroup && p.season === baselinePeriod.season))
                          .map((period) => {
                          const hLookup = buildHistoricalLookup(genBrandId || '', period.label);
                          let hBuy = 0, hSales = 0, hSt = 0, hCount = 0;
                          activeStores.forEach((store: any) => {
                            const hData = hLookup.byGender[`gender_${gender.id}_${store.id}`] || {};
                            hBuy += hData.buyPct || 0; hSales += hData.salesPct || 0; hCount++;
                          });
                          hSt = hSales > 0 ? Math.round((hSales / (hBuy || 1)) * 100) : 0;
                          return (
                            <React.Fragment key={`gen_sub_${period.label}`}>
                              <td className={`border-l-2 border-[#D7B797] px-2 py-0.5 text-center font-['JetBrains_Mono'] text-[10px] ${'text-[#777]'}`}>{hBuy}%</td>
                              <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] text-[10px] ${'text-[#777]'}`}>{hSales}%</td>
                              <td className={`px-2 py-0.5 text-center font-['JetBrains_Mono'] text-[10px] ${'text-[#777]'}`}>{hSt}%</td>
                            </React.Fragment>
                          );
                        })}
                        <td className={`px-3 py-0.5 text-center bg-[rgba(160,120,75,0.18)] font-bold font-['JetBrains_Mono'] ${'text-[#6B4D30]'}`}>{genderTotals.userBuyPct}%</td>
                        <td className={`px-3 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${'text-[#5C4A32]'}`}>{formatCurrency(genderTotals.otbValue)}</td>
                        <td className={`px-3 py-0.5 text-center font-bold font-['JetBrains_Mono'] ${
                          genderTotals.varPct < 0 ? 'text-[#FF7B72]' :'text-[#5C4A32]'}`}>
                          {genderTotals.varPct > 0 ? '+' : ''}{genderTotals.varPct}%
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Empty state: no budgets available
  if (!loadingBudgets && apiBudgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center animate-fadeIn">
        <div className="empty-state-rings mb-6">
          <span className="ring-3" />
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[rgba(215,183,151,0.15)] relative z-10">
            <BarChart3 size={32} className={'text-[#6B4D30]'} />
          </div>
        </div>
        <h3 className={`text-lg font-bold font-['Montserrat'] mb-2 ${'text-[#1A1A1A]'}`}>
          {t('otbAnalysis.noBudgets') || 'No budgets available'}
        </h3>
        <p className={`text-sm mb-6 max-w-md ${'text-[#666666]'}`}>
          {t('otbAnalysis.noBudgetsDescription') || 'Please create a budget in Budget Management first.'}
        </p>
        <button
          onClick={() => router.push('/budget-management')}
          className={`px-5 py-2.5 rounded-xl text-sm font-semibold font-['Montserrat'] transition-all ${'bg-[#6B4D30] text-white hover:bg-[#5C4028]'}`}
        >
          {t('otbAnalysis.goToBudgetManagement') || 'Go to Budget Management'}
        </button>
      </div>
    );
  }

  // Render a single brand collapsible section with per-brand tab state
  const renderBrandSection = (brand: any) => {
    const brandId = String(brand.id);
    const isCollapsed = collapsedBrands[brandId] === true;
    const activeBrandTab = brandActiveTabs[brandId] || 'category';

    return (
      <div key={brandId} className={`rounded-xl shadow-sm border overflow-hidden animate-cardEntrance ${'bg-white border-[#C4B5A5]'}`}>
        {/* Brand Section Header — collapsible */}
        <div
          onClick={() => setCollapsedBrands(prev => ({ ...prev, [brandId]: !isCollapsed }))}
          className={`flex items-center gap-3 px-4 py-3 cursor-pointer select-none transition-all ${'bg-gradient-to-r from-[rgba(215,183,151,0.14)] to-transparent hover:from-[rgba(215,183,151,0.22)]'}`}
        >
          <span className={`p-1 rounded-lg transition-colors ${'bg-[rgba(138,99,64,0.1)] hover:bg-[rgba(138,99,64,0.2)]'}`}>
            <ChevronDown size={15} className={`transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''} ${'text-[#6B4D30]'}`} />
          </span>
          <Tag size={15} className={'text-[#6B4D30]'} />
          <div className="flex flex-col min-w-0">
            {(() => {
              const groupBrandName = brand.group_brand?.name || brand.groupBrand?.name || brand.groupName || null;
              return groupBrandName ? (
                <span className={`text-[10px] font-medium font-['Montserrat'] uppercase tracking-widest ${'text-[#6B4D30]/60'}`}>
                  {groupBrandName}
                </span>
              ) : null;
            })()}
            <span className={`font-bold text-sm font-['Montserrat'] uppercase tracking-wide ${'text-[#1A1A1A]'}`}>
              {brand.name || brand.code || `Brand ${brand.id}`}
            </span>
          </div>
          <div className="ml-auto flex items-center gap-2" onClick={e => e.stopPropagation()}>
            {(() => {
              const bVersions = brandPlanningVersions[brandId] || [];
              const selectedVer = brandSelectedVersion[brandId] || '';
              const loading = brandLoadingVersions[brandId];
              const selectedHeader = bVersions.find((v: any) => String(v.id) === String(selectedVer));
              const selectedIsFinal = selectedHeader?.isFinal ?? false;
              if (loading) return <span className={`text-xs ${'text-[#AAAAAA]'}`}>Loading...</span>;
              if (bVersions.length === 0) return filtersComplete ? (
                <span className={`text-xs italic ${'text-[#AAAAAA]'}`}>No versions</span>
              ) : null;
              return (
                <div className="relative brand-version-dropdown">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (openVersionBrandId === brandId) {
                        setOpenVersionBrandId(null);
                        setDropdownAnchorEl(null);
                      } else {
                        setOpenVersionBrandId(brandId);
                        setDropdownAnchorEl(e.currentTarget);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
                      selectedHeader
                        ? selectedIsFinal
                          ?'bg-[rgba(215,183,151,0.25)] text-[#6B4D30]':'bg-[rgba(18,119,73,0.15)] text-[#127749]':'bg-[rgba(215,183,151,0.15)] text-[#666666] hover:text-[#333333]'}`}
                  >
                    <ChevronDown size={11} className={`shrink-0 transition-transform ${openVersionBrandId === brandId ? 'rotate-180' : ''}`} />
                    {selectedHeader ? (
                      <>
                        {selectedIsFinal && <Star size={11} className="shrink-0 fill-current" />}
                        <span className="whitespace-nowrap">Version {selectedHeader.version}</span>
                        {selectedIsFinal && <span className="px-1 text-[9px] font-bold rounded bg-[#D7B797] text-[#0A0A0A]">FINAL</span>}
                      </>
                    ) : (
                      <>
                        <Sparkles size={11} className="shrink-0" />
                        <span className="whitespace-nowrap">Version</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })()}
            {isCollapsed && (
              <span className={`text-xs ${'text-[#AAAAAA]'}`}>Click to expand</span>
            )}
          </div>
        </div>

        {!isCollapsed && !filtersComplete && (
          <div className={`px-4 py-6 text-center border-t animate-fadeIn ${'border-[#C4B5A5]'}`}>
            <Filter size={20} className={`mx-auto mb-2 ${'text-[#AAAAAA]'}`} />
            <p className={`text-xs font-['Montserrat'] ${'text-[#999999]'}`}>
              Please select <strong>Season Group</strong> and <strong>Season</strong> to view data.
            </p>
          </div>
        )}

        {!isCollapsed && filtersComplete && (
          <div className="animate-expandSection">
            {/* Tab Navigation: Category | Season Type | Gender */}
            <div className={`border-b ${'border-[#C4B5A5]'}`}>
              <div className="flex">
                {(['category', 'seasonType', 'gender'] as const).map((tab) => {
                  const isActive = activeBrandTab === tab;
                  const labels: Record<string, string> = { category: 'Category', seasonType: 'Season Type', gender: 'Gender' };
                  const icons: Record<string, React.ReactNode> = {
                    category: <Tag size={13} />,
                    seasonType: <Bookmark size={13} />,
                    gender: <Users size={13} />};
                  return (
                    <button
                      key={tab}
                      onClick={(e) => { e.stopPropagation(); setBrandActiveTabs(prev => ({ ...prev, [brandId]: tab })); }}
                      className={`flex items-center gap-1.5 px-4 md:px-6 py-2.5 text-xs md:text-sm font-semibold font-['Montserrat'] uppercase tracking-wide border-b-2 -mb-px transition-all ${
                        isActive
                          ?'border-[#6B4D30] text-[#6B4D30] bg-[rgba(215,183,151,0.08)]':'border-transparent text-[#999999] hover:text-[#6B4D30] hover:bg-[rgba(215,183,151,0.04)]'}`}
                    >
                      {icons[tab]}
                      {labels[tab]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category sub-filters (category tab only) */}
            {activeBrandTab === 'category' && (
              <div className={`border-b px-3 py-2 ${'border-[#C4B5A5]'}`}>
                <div className="flex items-end gap-2 flex-wrap">
                  <FilterSelect icon={Tag} label={t('common.category') || 'Category'} value={categoryFilter} options={[{ value: 'all', label: t('common.allCategories') || 'All Categories' }, ...filterOptions.categories.filter((c: any) => c.id !== 'all').map((c: any) => ({ value: c.id, label: c.name }))]} onChange={handleCategoryFilterChange} placeholder={t('common.allCategories') || 'All Categories'} />
                  <FilterSelect icon={Tag} label={t('common.subCategory') || 'Sub Category'} value={subCategoryFilter} options={[{ value: 'all', label: t('common.allSubCategories') || 'All SubCategories' }, ...filteredSubCategoryOptions.filter((c: any) => c.id !== 'all').map((c: any) => ({ value: c.id, label: c.name }))]} onChange={handleSubCategoryFilterChange} placeholder={t('common.allSubCategories') || 'All SubCategories'} />
                  <FilterSelect icon={Users} label={t('common.gender') || 'Gender'} value={genderFilter} options={[{ value: 'all', label: t('common.allGenders') || 'All Genders' }, ...filterOptions.genders.filter((c: any) => c.id !== 'all').map((c: any) => ({ value: c.id, label: c.name }))]} onChange={handleGenderFilterChange} placeholder={t('common.allGenders') || 'All Genders'} />
                  {(genderFilter !== 'all' || categoryFilter !== 'all' || subCategoryFilter !== 'all') && (
                    <button onClick={() => { setGenderFilter('all'); setCategoryFilter('all'); setSubCategoryFilter('all'); }} className={`shrink-0 p-1 rounded transition-colors ${'text-[#666666] hover:text-[#F85149] hover:bg-red-50'}`} title={t('common.clearAll')}><X size={14} /></button>
                  )}
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={() => handleToggleAll(brandId)}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border transition-colors border-[#C4B5A5] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.18)] shrink-0"
                  >
                    <ChevronDown size={12} className={`transition-transform ${allCollapsedPerBrand[brandId] ? '-rotate-90' : ''}`} />
                    {allCollapsedPerBrand[brandId] ? 'Expand' : 'Collapse'}
                  </button>
                </div>
              </div>
            )}

            {/* Tab Content */}
            <div className="overflow-y-auto">
              {activeBrandTab === 'category' && renderCategoryTab(brand)}
              {activeBrandTab === 'seasonType' && renderSeasonTypeTab(brand)}
              {activeBrandTab === 'gender' && renderGenderTab(brand)}
            </div>

            {/* Save / Save as New Version footer — or warning if no final AllocateHeader */}
            {(() => {
              const hasFinalAH = matchedAllocateHeaders.some((ah: any) => String(ah.brandId) === brandId && ah.isFinal);
              if (!hasFinalAH) {
                // Find the budget that contains this brand for navigation
                const brandBudget = apiBudgets.find((b: any) =>
                  (b.allocateHeaders || []).some((ah: any) => String(ah.brandId) === brandId)
                );
                const groupBrandId = brand.group_brand_id || brand.groupBrandId || brand.group_brand?.id || null;
                return (
                  <div className={`flex flex-col items-center gap-2 px-4 py-3 border-t ${'border-[#C4B5A5] bg-[rgba(227,179,65,0.08)]'}`}>
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={14} className={'text-[#B8860B]'} />
                      <span className={`text-xs font-['Montserrat'] font-medium ${'text-[#8B6914]'}`}>
                        This brand has not been allocated yet. Please complete Budget Allocation first.
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAllocationData({
                          id: brandBudget?.id || (selectedBudgetId !== 'all' ? selectedBudgetId : null),
                          budgetName: brandBudget?.budgetName || '',
                          year: selectedYear !== 'all' ? selectedYear : null,
                          groupBrandId: groupBrandId,
                          brandId: brandId,
                          seasonGroupId: selectedSeasonGroup !== 'all' ? selectedSeasonGroup : null,
                          seasonId: selectedSeason !== 'all' ? selectedSeason : null});
                        router.push('/planning');
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-['Montserrat'] border transition-all ${'bg-[#6B4D30] border-[#6B4D30] text-white hover:bg-[#5C4028] hover:border-[#5C4028]'}`}
                    >
                      Go to Budget Allocation
                      <ArrowRight size={13} />
                    </button>
                  </div>
                );
              }
              return (
                <div className={`flex items-center justify-end gap-2 px-4 py-2 border-t ${'border-[#C4B5A5] bg-[#F9F7F5]'}`}>
                  {brandSaving[brandId] && (
                    <span className={`text-xs font-['Montserrat'] ${'text-[#999999]'}`}>Saving...</span>
                  )}
                  <button
                    disabled={brandSaving[brandId]}
                    onClick={(e) => { e.stopPropagation(); handleSaveBrand(brand, false); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-['Montserrat'] border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${'bg-[rgba(160,120,75,0.1)] border-[rgba(160,120,75,0.35)] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.18)] hover:border-[rgba(160,120,75,0.5)]'}`}
                  >
                    <Save size={13} />
                    Save
                  </button>
                  <button
                    disabled={brandSaving[brandId]}
                    onClick={(e) => { e.stopPropagation(); handleSaveBrand(brand, true); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-['Montserrat'] border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${'bg-[#6B4D30] border-[#6B4D30] text-white hover:bg-[#5C4028] hover:border-[#5C4028]'}`}
                  >
                    <FilePlus size={13} />
                    Save as New Version
                  </button>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-2">
      {/* Filter Toolbar — hides entirely on scroll */}
      <div ref={barRef} className={`sticky -top-3 md:-top-6 z-30 -mx-3 md:-mx-6 -mt-3 md:-mt-6 mb-2 md:mb-3 border-b backdrop-blur-sm relative ${'bg-white/95 border-[rgba(215,183,151,0.3)]'}`}>

        {/* ===== FILTER CONTENT ===== */}
        <div>
        <div>
              {/* Mobile Filter Button */}
              {isMobile && (
                <div className="px-3 md:px-6 py-1.5">
                <button
                  onClick={openFilter}
                  className={`flex items-center gap-1.5 px-3 py-1 border rounded-lg text-xs font-medium ${'bg-white border-[#C4B5A5] text-[#6B4D30]'}`}
                >
                  <Filter size={12} />
                  {t('otbAnalysis.filters')}
                  {hasActiveFilters && (
                    <span className="w-2 h-2 rounded-full bg-[#D7B797]" />
                  )}
                </button>
                </div>
              )}
              {/* Desktop Filters */}
              {!isMobile && (
              <div className="flex flex-wrap items-end gap-2.5 px-3 md:px-6 py-1.5 relative z-[100]">
                {/* Year Filter */}
                <div className="relative shrink-0" ref={setDropdownRef('year')}>
                  <label className="block text-[10px] uppercase tracking-[0.06em] font-bold mb-0.5 text-[#8A6340]">FY</label>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev: any) => (prev === 'year' ? null : 'year'));
                      setOpenCategoryDropdown(null);
                    }}
                    className={`px-2 py-1 border rounded-md font-medium cursor-pointer flex items-center gap-1.5 text-xs transition-all duration-200 ${
                      openDropdown === 'year'
                        ? 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30]'
                        : selectedYear !== 'all'
                          ? 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:border-[#D7B797]'
                          : 'bg-white border-[#C4B5A5] text-[#0A0A0A] hover:border-[rgba(215,183,151,0.4)] hover:bg-[rgba(160,120,75,0.18)]'}`}
                  >
                      <Calendar size={12} className="shrink-0" />
                      <span>{selectedYear === 'all' ? (t('common.all') || 'All') : `FY ${selectedYear}`}</span>
                    <ChevronDown size={12} className={`shrink-0 transition-transform duration-200 ${openDropdown === 'year' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'year' && (
                    <div className={`absolute top-full left-0 mt-1.5 whitespace-nowrap w-max min-w-full border rounded-lg z-[9999] overflow-hidden animate-slideDown ${'bg-white border-[#D4CCC2]'}`} style={{ boxShadow:'0 8px 32px rgba(107,77,48,0.08), 0 2px 8px rgba(107,77,48,0.06)'}}>
                      <div className="h-[1.5px]" style={{ background:'linear-gradient(90deg, transparent 5%, rgba(184,153,112,0.4) 50%, transparent 95%)'}} />
                      <div className="py-1">
                      <div
                        onClick={() => { setSelectedYear('all'); setOpenDropdown(null); }}
                        className={`relative px-3 py-1.5 flex items-center justify-between cursor-pointer text-sm transition-all duration-150 ${
                          selectedYear === 'all'
                            ?'bg-[rgba(215,183,151,0.1)] text-[#6B4D30]':'hover:bg-[rgba(215,183,151,0.06)] text-[#444444] hover:text-[#1A1A1A]'}`}
                      >
                        {selectedYear === 'all' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full" style={{ background:'#8B6E4E'}} />}
                        <span className={selectedYear === 'all' ? 'font-semibold' : 'font-medium'}>{t('common.all') || 'All Years'}</span>
                        {selectedYear === 'all' && <Check size={13} strokeWidth={2.5} className={'text-[#6B4D30]'} />}
                      </div>
                      {availableYears.map((year: number) => (
                        <div
                          key={year}
                          onClick={() => { setSelectedYear(year); setOpenDropdown(null); }}
                          className={`relative px-3 py-1.5 flex items-center justify-between cursor-pointer text-sm transition-all duration-150 ${
                            selectedYear === year
                              ?'bg-[rgba(215,183,151,0.1)] text-[#6B4D30]':'hover:bg-[rgba(215,183,151,0.06)] text-[#444444] hover:text-[#1A1A1A]'}`}
                        >
                          {selectedYear === year && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full" style={{ background:'#8B6E4E'}} />}
                          <span className={selectedYear === year ? 'font-semibold' : 'font-medium'}>FY {year}</span>
                          {selectedYear === year && <Check size={13} strokeWidth={2.5} className={'text-[#6B4D30]'} />}
                        </div>
                      ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className={`self-stretch w-px hidden sm:block rounded-full ${'bg-gradient-to-b from-transparent via-[#C4B5A5]/40 to-transparent'}`} />

                {/* Budget Select — matches BudgetAllocate design */}
                <div className="relative shrink-0 min-w-[160px] max-w-[260px]" ref={setDropdownRef('budgetSeason')}>
                  <label className="block text-[10px] uppercase tracking-[0.06em] font-bold mb-0.5 text-[#8A6340]">
                    Budget
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev: any) => (prev === 'budgetSeason' ? null : 'budgetSeason'));
                      setOpenCategoryDropdown(null);
                    }}
                    className={`w-full px-2 py-1 border rounded-md font-medium cursor-pointer flex items-center justify-between text-xs transition-all ${selectedBudgetId !== 'all'
                      ? 'bg-[rgba(18,119,73,0.1)] border-[#127749] text-[#127749] hover:border-[#2A9E6A]'
                      : 'bg-white border-[#C4B5A5] text-[#0A0A0A] hover:border-[rgba(215,183,151,0.4)] hover:bg-[rgba(160,120,75,0.18)]'}`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <FileText size={12} className={selectedBudgetId !== 'all' ? 'text-[#127749]' : 'text-[#666666]'} />
                      <span className="truncate">
                        {selectedBudgetId === 'all'
                          ? (t('planning.selectBudget') || 'Select Budget')
                          : (selectedBudget?.budgetName || 'Budget')}
                      </span>
                    </div>
                    <ChevronDown size={12} className={`flex-shrink-0 transition-transform duration-200 ${openDropdown === 'budgetSeason' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'budgetSeason' && (
                    <div className="absolute top-full left-0 mt-1 border rounded-xl shadow-xl z-[9999] overflow-hidden whitespace-nowrap w-max min-w-full bg-white border-[#C4B5A5] animate-slideDown">
                      <div className="max-h-72 overflow-y-auto py-0.5">
                        {loadingBudgets && (
                          <div className="px-4 py-6 flex items-center justify-center">
                            <div className="w-5 h-5 border-2 border-[#D7B797]/30 border-t-[#D7B797] rounded-full animate-spin" />
                            <span className="ml-2 text-sm text-[#666666]">{t('common.loading')}...</span>
                          </div>
                        )}
                        {!loadingBudgets && filteredBudgets.length === 0 && (
                          <div className="px-4 py-6 text-center text-sm text-[#666666]">
                            {t('budget.noMatchingBudgets') || 'No budgets found'}
                          </div>
                        )}
                        {!loadingBudgets && filteredBudgets.length > 0 && (
                          <div
                            onClick={() => { setSelectedBudgetId('all'); setOpenDropdown(null); }}
                            className={`px-4 py-0.5 flex items-center justify-between cursor-pointer text-sm transition-colors ${selectedBudgetId === 'all'
                              ? 'bg-[rgba(18,119,73,0.1)] text-[#127749]' : 'hover:bg-[rgba(160,120,75,0.18)] text-[#666666]'}`}
                          >
                            <span className="font-medium">{t('planning.selectBudget')}</span>
                            {selectedBudgetId === 'all' && <Check size={14} className="text-[#127749]" />}
                          </div>
                        )}
                        {!loadingBudgets && filteredBudgets.map((budget: any) => {
                          const isSelected = selectedBudgetId === budget.id;
                          return (
                            <div
                              key={budget.id}
                              onClick={() => {
                                setSelectedBudgetId(budget.id);
                                if (budget.fiscalYear) setSelectedYear(budget.fiscalYear);
                                setOpenDropdown(null);
                              }}
                              className={`px-4 py-0.5 cursor-pointer transition-colors border-t border-[#D4C8BB] ${isSelected
                                ? 'bg-[rgba(18,119,73,0.1)]' : 'hover:bg-[rgba(160,120,75,0.18)]'}`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="min-w-0 flex-1">
                                  <div className={`font-semibold text-sm font-['Montserrat'] ${isSelected ? 'text-[#127749]' : 'text-[#0A0A0A]'}`}>
                                    {budget.budgetName}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs font-['JetBrains_Mono'] text-[#666666]">FY{budget.fiscalYear}</span>
                                    <span className="text-[#2E2E2E]/30">&bull;</span>
                                    <span className="text-xs font-medium font-['JetBrains_Mono'] text-[#127749]">{formatCurrency(budget.totalBudget)}</span>
                                  </div>
                                </div>
                                {isSelected && (
                                  <div className="w-5 h-5 rounded-full bg-[#127749] flex items-center justify-center flex-shrink-0 ml-2">
                                    <Check size={12} className="text-white" strokeWidth={3} />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Type Filter (Same/Different Season) — select mode for comparing previous year data */}
                <FilterSelect
                  icon={GitBranch}
                  label={t('otbAnalysis.type') || 'Type'}
                  value={comparisonType}
                  options={[
                    { value: 'same', label: t('otbAnalysis.same') || 'Same' },
                    { value: 'different', label: t('otbAnalysis.different') || 'Different' },
                  ]}
                  onChange={(val: any) => { setComparisonType(val); }}
                  disabled={!canEditComparison}
                />

                {/* Number of Seasons Dropdown */}
                <div className={`relative shrink-0 ${!canEditComparison ? 'opacity-50 pointer-events-none' : ''}`} ref={setDropdownRef('seasonCount')}>
                  <label className="block text-[10px] uppercase tracking-[0.06em] font-bold mb-0.5 text-[#8A6340]">Period</label>
                  <button
                    type="button"
                    disabled={!canEditComparison}
                    onClick={() => {
                      setOpenDropdown((prev: any) => (prev === 'seasonCount' ? null : 'seasonCount'));
                      setOpenCategoryDropdown(null);
                    }}
                    className={`px-2 py-1 border rounded-md font-medium cursor-pointer flex items-center gap-1.5 text-xs transition-all duration-200 ${
                      openDropdown === 'seasonCount'
                        ? 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30]'
                        : 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:border-[#D7B797]'}`}
                  >
                      <Calendar size={12} className="shrink-0" />
                      <span>{seasonCount}</span>
                    <ChevronDown size={12} className={`shrink-0 transition-transform duration-200 ${openDropdown === 'seasonCount' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'seasonCount' && (
                    <div className={`absolute top-full left-0 mt-1.5 whitespace-nowrap w-max min-w-full border rounded-lg z-[9999] overflow-hidden animate-slideDown ${'bg-white border-[#D4CCC2]'}`} style={{ boxShadow:'0 8px 32px rgba(107,77,48,0.08), 0 2px 8px rgba(107,77,48,0.06)'}}>
                      <div className="h-[1.5px]" style={{ background:'linear-gradient(90deg, transparent 5%, rgba(184,153,112,0.4) 50%, transparent 95%)'}} />
                      <div className="py-1">
                      {[1, 2, 3].map((n) => (
                        <div
                          key={n}
                          onClick={() => {
                            setSeasonCount(n);
                            setOpenDropdown(null);
                          }}
                          className={`relative px-3 py-1.5 flex items-center justify-between cursor-pointer text-sm transition-all duration-150 ${
                            seasonCount === n
                              ?'bg-[rgba(215,183,151,0.1)] text-[#6B4D30]':'hover:bg-[rgba(215,183,151,0.06)] text-[#444444] hover:text-[#1A1A1A]'}`}
                        >
                          {seasonCount === n && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full" style={{ background:'#8B6E4E'}} />}
                          <span className={seasonCount === n ? 'font-semibold' : 'font-medium'}>{n}</span>
                          {seasonCount === n && <Check size={13} strokeWidth={2.5} className={'text-[#6B4D30]'} />}
                        </div>
                      ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Brand Filter — multi-select brands */}
                {brandOptions.length >= 1 && (
                <>
                <div className={`self-stretch w-px hidden sm:block rounded-full ${'bg-gradient-to-b from-transparent via-[#C4B5A5]/40 to-transparent'}`} />
                <div className="relative shrink-0" ref={setDropdownRef('brand')}>
                  <label className="block text-[10px] uppercase tracking-[0.06em] font-bold mb-0.5 text-[#8A6340]">Brand</label>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev: any) => (prev === 'brand' ? null : 'brand'));
                      setOpenCategoryDropdown(null);
                    }}
                    className={`px-2 py-1 border rounded-md font-medium cursor-pointer flex items-center gap-1.5 text-xs transition-all duration-200 ${
                      openDropdown === 'brand'
                        ? 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30]'
                        : selectedBrandIds.length > 0
                          ? 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:border-[#D7B797]'
                          : 'bg-white border-[#C4B5A5] text-[#0A0A0A] hover:border-[rgba(215,183,151,0.4)] hover:bg-[rgba(160,120,75,0.18)]'}`}
                  >
                    <Tag size={12} className="shrink-0" />
                    <span className="truncate max-w-[120px]">
                      {(() => {
                        const selectedBrands = brandOptions.filter((b: any) => selectedBrandIds.includes(b.value));
                        if (selectedBrands.length === 0) return 'All Brands';
                        if (selectedBrands.length === 1) return selectedBrands[0].label;
                        return `${selectedBrands.length} brands`;
                      })()}
                    </span>
                    {selectedBrandIds.length > 1 && (
                      <span className={`px-1.5 text-[10px] leading-[16px] font-bold rounded-md ${'bg-[#6B4D30] text-white'}`}>{selectedBrandIds.length}</span>
                    )}
                    <ChevronDown size={12} className={`shrink-0 transition-transform duration-200 ${openDropdown === 'brand' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'brand' && (
                    <div
                      className={`absolute top-full left-0 mt-1.5 whitespace-nowrap w-max min-w-[220px] border rounded-lg z-[9999] overflow-hidden animate-slideDown ${'bg-white border-[#D4CCC2]'}`}
                      style={{
                        boxShadow:'0 8px 32px rgba(107,77,48,0.08), 0 2px 8px rgba(107,77,48,0.06), inset 0 1px 0 rgba(215,183,151,0.15)'}}
                    >
                      <div className="h-[1.5px]" style={{ background:'linear-gradient(90deg, transparent 5%, rgba(184,153,112,0.4) 50%, transparent 95%)'}} />
                      <div className={`px-3 py-2 border-b flex items-center justify-between ${'bg-[#FDFCFB] border-[#E8E0D8]'}`}>
                        <span className={`text-[10px] font-semibold uppercase tracking-[0.12em] font-['Montserrat'] ${'text-[#999999]'}`}>
                          Select Brands
                        </span>
                        {selectedBrandIds.length > 0 && (
                          <button
                            onClick={() => setSelectedBrandIds([])}
                            className={`text-[10px] px-2 py-0.5 rounded-md font-medium transition-colors ${'text-[#F85149] hover:bg-[rgba(248,81,73,0.08)]'}`}
                          >
                            {t('common.clearAll') || 'Clear'}
                          </button>
                        )}
                      </div>
                      <div className="filter-select-scroll max-h-60 overflow-y-auto py-1">
                        {/* All Brands option */}
                        <div
                          onClick={() => { setSelectedBrandIds([]); setOpenDropdown(null); }}
                          className={`relative px-3 py-2 cursor-pointer transition-all duration-150 ${
                            selectedBrandIds.length === 0
                              ?'bg-[rgba(215,183,151,0.1)]':'hover:bg-[rgba(215,183,151,0.06)]'}`}
                        >
                          {selectedBrandIds.length === 0 && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-full" style={{ background:'#8B6E4E'}} />}
                          <div className="flex items-center justify-between gap-3">
                            <span className={`text-sm ${selectedBrandIds.length === 0 ? ('text-[#6B4D30] font-semibold') : ('text-[#1A1A1A]')}`}>
                              All Brands
                            </span>
                            {selectedBrandIds.length === 0 && <Check size={13} strokeWidth={2.5} className={'text-[#6B4D30]'} />}
                          </div>
                        </div>
                        {brandOptions.map((brand: any) => {
                          const isSelected = selectedBrandIds.includes(brand.value);
                          return (
                            <div
                              key={brand.value}
                              onClick={() => handleBrandToggle(brand.value)}
                              className={`relative px-3 py-2 cursor-pointer transition-all duration-150 ${
                                isSelected
                                  ?'bg-[rgba(215,183,151,0.1)]':'hover:bg-[rgba(215,183,151,0.06)]'}`}
                            >
                              {isSelected && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-5 rounded-full" style={{ background:'#8B6E4E'}} />}
                              <div className="flex items-center gap-3">
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                  isSelected
                                    ? 'bg-[#D7B797] border-[#D7B797]'
                                    :'border-[#C4B5A5]'}`}>
                                  {isSelected && <Check size={10} className="text-[#1A1A1A]" strokeWidth={3} />}
                                </div>
                                <span className={`text-sm ${isSelected ? ('text-[#6B4D30] font-semibold') : ('text-[#1A1A1A]')}`}>
                                  {brand.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                </>
                )}

                {/* Season Group Filter */}
                <div className={`self-stretch w-px hidden sm:block rounded-full ${'bg-gradient-to-b from-transparent via-[#C4B5A5]/40 to-transparent'}`} />
                <div className="relative shrink-0" ref={setDropdownRef('seasonGroup')}>
                  <label className="block text-[10px] uppercase tracking-[0.06em] font-bold mb-0.5 text-[#8A6340]">Season Group</label>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev: any) => (prev === 'seasonGroup' ? null : 'seasonGroup'));
                      setOpenCategoryDropdown(null);
                    }}
                    className={`px-2 py-1 border rounded-md font-medium cursor-pointer flex items-center gap-1.5 text-xs transition-all duration-200 ${
                      openDropdown === 'seasonGroup'
                        ? 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30]'
                        : selectedSeasonGroup !== 'all'
                          ? 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:border-[#D7B797]'
                          : 'bg-white border-[#C4B5A5] text-[#0A0A0A] hover:border-[rgba(215,183,151,0.4)] hover:bg-[rgba(160,120,75,0.18)]'}`}
                  >
                      <Calendar size={12} className="shrink-0" />
                      <span className="truncate">{selectedSeasonGroup === 'all' ? (t('planning.allSeasonGroups') || 'All') : (seasonGroupOptions.find((s: any) => s.id === selectedSeasonGroup)?.label || selectedSeasonGroup)}</span>
                    <ChevronDown size={12} className={`shrink-0 transition-transform duration-200 ${openDropdown === 'seasonGroup' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'seasonGroup' && (
                    <div
                      className={`absolute top-full left-0 mt-1.5 whitespace-nowrap w-max min-w-full border rounded-lg z-[9999] overflow-hidden animate-slideDown ${'bg-white border-[#D4CCC2]'}`}
                      style={{
                        boxShadow:'0 8px 32px rgba(107,77,48,0.08), 0 2px 8px rgba(107,77,48,0.06), inset 0 1px 0 rgba(215,183,151,0.15)'}}
                    >
                      {/* Golden top accent */}
                      <div className="h-[1.5px]" style={{ background:'linear-gradient(90deg, transparent 5%, rgba(184,153,112,0.4) 50%, transparent 95%)'}} />
                      <div className="py-1">
                      <div
                        onClick={() => { setSelectedSeasonGroup('all'); setOpenDropdown(null); }}
                        className={`relative px-3 py-[6px] flex items-center justify-between gap-2.5 cursor-pointer text-sm transition-all duration-150 ${
                          selectedSeasonGroup === 'all'
                            ?'bg-[rgba(215,183,151,0.1)] text-[#6B4D30]':'hover:bg-[rgba(215,183,151,0.06)] text-[#444444] hover:text-[#1A1A1A]'}`}
                      >
                        {selectedSeasonGroup === 'all' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full" style={{ background:'#8B6E4E'}} />}
                        <span className={selectedSeasonGroup === 'all' ? 'font-semibold' : 'font-normal'}>{t('planning.allSeasonGroups') || 'All Season Groups'}</span>
                        {selectedSeasonGroup === 'all' && <Check size={13} strokeWidth={2.5} className={`shrink-0 ${'text-[#6B4D30]'}`} />}
                      </div>
                      {seasonGroupOptions.map((season: any) => (
                        <div
                          key={season.id}
                          onClick={() => { setSelectedSeasonGroup(season.id); setOpenDropdown(null); }}
                          className={`relative px-3 py-[6px] flex items-center justify-between gap-2.5 cursor-pointer text-sm transition-all duration-150 ${
                            selectedSeasonGroup === season.id
                              ?'bg-[rgba(215,183,151,0.1)] text-[#6B4D30]':'hover:bg-[rgba(215,183,151,0.06)] text-[#444444] hover:text-[#1A1A1A]'}`}
                        >
                          {selectedSeasonGroup === season.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full" style={{ background:'#8B6E4E'}} />}
                          <span className={selectedSeasonGroup === season.id ? 'font-semibold' : 'font-normal'}>{season.label}</span>
                          {selectedSeasonGroup === season.id && <Check size={13} strokeWidth={2.5} className={`shrink-0 ${'text-[#6B4D30]'}`} />}
                        </div>
                      ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Season Filter */}
                <div className="relative shrink-0" ref={setDropdownRef('season')}>
                  <label className="block text-[10px] uppercase tracking-[0.06em] font-bold mb-0.5 text-[#8A6340]">Season</label>
                  <button
                    type="button"
                    onClick={() => {
                      setOpenDropdown((prev: any) => (prev === 'season' ? null : 'season'));
                      setOpenCategoryDropdown(null);
                    }}
                    className={`px-2 py-1 border rounded-md font-medium cursor-pointer flex items-center gap-1.5 text-xs transition-all duration-200 ${
                      openDropdown === 'season'
                        ? 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30]'
                        : selectedSeason !== 'all'
                          ? 'bg-[rgba(160,120,75,0.18)] border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:border-[#D7B797]'
                          : 'bg-white border-[#C4B5A5] text-[#0A0A0A] hover:border-[rgba(215,183,151,0.4)] hover:bg-[rgba(160,120,75,0.18)]'}`}
                  >
                      <Clock size={12} className="shrink-0" />
                      <span className="whitespace-nowrap">{selectedSeason === 'all' ? (t('otbAnalysis.allSeasons') || 'All') : (availableSeasons.find((s: any) => s.id === selectedSeason)?.label || selectedSeason)}</span>
                    <ChevronDown size={12} className={`shrink-0 transition-transform duration-200 ${openDropdown === 'season' ? 'rotate-180' : ''}`} />
                  </button>
                  {openDropdown === 'season' && (
                    <div
                      className={`absolute top-full left-0 mt-1.5 whitespace-nowrap w-max min-w-full border rounded-lg z-[9999] overflow-hidden animate-slideDown ${'bg-white border-[#D4CCC2]'}`}
                      style={{
                        boxShadow:'0 8px 32px rgba(107,77,48,0.08), 0 2px 8px rgba(107,77,48,0.06), inset 0 1px 0 rgba(215,183,151,0.15)'}}
                    >
                      {/* Golden top accent */}
                      <div className="h-[1.5px]" style={{ background:'linear-gradient(90deg, transparent 5%, rgba(184,153,112,0.4) 50%, transparent 95%)'}} />
                      <div className="py-1">
                      <div
                        onClick={() => { setSelectedSeason('all'); setOpenDropdown(null); }}
                        className={`relative px-3 py-[6px] flex items-center justify-between gap-2.5 cursor-pointer text-sm transition-all duration-150 ${
                          selectedSeason === 'all'
                            ?'bg-[rgba(215,183,151,0.1)] text-[#6B4D30]':'hover:bg-[rgba(215,183,151,0.06)] text-[#444444] hover:text-[#1A1A1A]'}`}
                      >
                        {selectedSeason === 'all' && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full" style={{ background:'#8B6E4E'}} />}
                        <span className={selectedSeason === 'all' ? 'font-semibold' : 'font-normal'}>{t('otbAnalysis.allSeasons') || 'All Seasons'}</span>
                        {selectedSeason === 'all' && <Check size={13} strokeWidth={2.5} className={`shrink-0 ${'text-[#6B4D30]'}`} />}
                      </div>
                      {availableSeasons.map((season: any) => (
                        <div
                          key={season.id}
                          onClick={() => { setSelectedSeason(season.id); setOpenDropdown(null); }}
                          className={`relative px-3 py-[6px] flex items-center justify-between gap-2.5 cursor-pointer text-sm transition-all duration-150 ${
                            selectedSeason === season.id
                              ?'bg-[rgba(215,183,151,0.1)] text-[#6B4D30]':'hover:bg-[rgba(215,183,151,0.06)] text-[#444444] hover:text-[#1A1A1A]'}`}
                        >
                          {selectedSeason === season.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-full" style={{ background:'#8B6E4E'}} />}
                          <span className={selectedSeason === season.id ? 'font-semibold' : 'font-normal'}>{season.label}</span>
                          {selectedSeason === season.id && <Check size={13} strokeWidth={2.5} className={`shrink-0 ${'text-[#6B4D30]'}`} />}
                        </div>
                      ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Clear Filters Button */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className={`shrink-0 px-1.5 py-[8px] rounded-lg border transition-all duration-200 ${'text-[#999999] border-transparent hover:text-[#F85149] hover:bg-[rgba(248,81,73,0.06)] hover:border-[rgba(248,81,73,0.12)]'}`}
                    title={t('common.clearAllFilters')}
                  >
                    <X size={14} strokeWidth={2} />
                  </button>
                )}

                {/* Collapse All / Expand All — right-aligned in filter row */}
                {selectedBudget && displayBrands.length > 0 && (
                  <button
                    onClick={() => {
                      const allCollapsedNow = displayBrands.every((b: any) => collapsedBrands[String(b.id)] === true);
                      const next: Record<string, boolean> = {};
                      displayBrands.forEach((b: any) => { next[String(b.id)] = !allCollapsedNow; });
                      setCollapsedBrands(next);
                    }}
                    className={`ml-auto shrink-0 flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md border transition-colors ${'border-[rgba(215,183,151,0.4)] text-[#6B4D30] hover:bg-[rgba(160,120,75,0.12)]'}`}
                  >
                    <ChevronDown size={12} className={`transition-transform ${displayBrands.every((b: any) => collapsedBrands[String(b.id)] === true) ? '-rotate-90' : ''}`} />
                    {displayBrands.every((b: any) => collapsedBrands[String(b.id)] === true) ? 'Expand' : 'Collapse'}
                  </button>
                )}
              </div>
              )}
        </div>{/* end overflow-hidden min-h-0 */}
        </div>{/* end grid animation wrapper */}
      </div>


      {/* Empty state — no budget selected or no brands */}
      {!loadingBudgets && (!selectedBudget || displayBrands.length === 0) && (
        <div className="flex flex-col items-center justify-center py-20 px-4 animate-fadeIn">
          <div className="empty-state-rings mb-6">
            <span className="ring-3" />
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-[rgba(215,183,151,0.12)] relative z-10">
              <BarChart3 size={28} className="text-[#8A6340]" />
            </div>
          </div>
          <h3 className="text-base font-bold font-['Montserrat'] mb-1.5 text-[#4A3728]">
            {!selectedBudget
              ? (t('otbAnalysis.noBudgetSelected') || 'No budget selected')
              : (t('otbAnalysis.noBrandsFound') || 'No brands found')}
          </h3>
          <p className="text-sm text-[#999] text-center max-w-sm">
            {!selectedBudget
              ? (t('otbAnalysis.selectBudgetDesc') || 'Please select a budget, season group and season from the filters above to view OTB analysis data.')
              : (t('otbAnalysis.noBrandsDesc') || 'No brand data available for the selected filters. Try adjusting your filter criteria.')}
          </p>
        </div>
      )}

      {/* Per-Brand Sections — each brand is a collapsible section with Category/Season Type/Gender tabs */}
      {selectedBudget && displayBrands.length > 0 && (
        <div className="space-y-3">
          {displayBrands.map((brand: any) => renderBrandSection(brand))}

          {/* Allocate All Footer */}
          {filtersComplete && displayBrands.length > 0 && (
            <div className={`mt-3 rounded-xl border overflow-hidden ${'border-[rgba(215,183,151,0.3)] bg-white'}`}>
              <div className="flex items-center justify-end gap-3 px-4 py-2.5">
                <button
                  onClick={handleAllocateAll}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold font-['Montserrat'] transition-all ${'bg-[rgba(18,119,73,0.12)] border border-[#127749] text-[#127749] hover:bg-[rgba(18,119,73,0.2)]'}`}
                >
                  <ChevronRight size={14} />
                  Allocate All
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Filter Bottom Sheet */}
      <FilterBottomSheet
        isOpen={filterOpen}
        onClose={closeFilter}
        filters={[
          {
            key: 'year',
            label: t('budget.fiscalYear') || 'Fiscal Year',
            type: 'single',
            options: availableYears.map((y: number) => ({ label: `FY ${y}`, value: String(y) }))},
          {
            key: 'type',
            label: t('otbAnalysis.comparisonType') || 'Comparison Type',
            type: 'single',
            options: [
              { label: 'Same Season', value: 'same' },
              { label: 'Different Season', value: 'different' },
            ]},
          {
            key: 'seasonCount',
            label: t('otbAnalysis.numberOfSeasons') || 'Number of Seasons',
            type: 'single',
            options: [
              { label: '1', value: '1' },
              { label: '2', value: '2' },
              { label: '3', value: '3' },
            ]},
          {
            key: 'budget',
            label: t('otbAnalysis.budgetSeason') || 'Budget Season',
            type: 'single',
            options: filteredBudgets.map((b: any) => ({ label: `${b.budgetName} (${formatCurrency(b.totalBudget)})`, value: b.id }))},
          {
            key: 'seasonGroup',
            label: t('otbAnalysis.seasonGroup'),
            type: 'single',
            options: seasonGroupOptions.map((s: any) => ({ label: s.label, value: s.id }))},
          {
            key: 'season',
            label: t('otbAnalysis.season'),
            type: 'single',
            options: availableSeasons.map((s: any) => ({ label: s.label, value: s.id }))},
          {
            key: 'version',
            label: 'Version',
            type: 'single',
            options: versions.map((v: any) => ({ label: `${v.name}${v.isFinal ? ' (FINAL)' : ''}`, value: v.id }))},
        ]}
        values={mobileFilterValues}
        onChange={(key, value) => setMobileFilterValues(prev => ({ ...prev, [key]: value }))}
        onApply={() => {
          if (mobileFilterValues.year) {
            setSelectedYear(mobileFilterValues.year === 'all' ? 'all' : Number(mobileFilterValues.year));
          }
          if (mobileFilterValues.type) {
            setComparisonType(mobileFilterValues.type as 'same' | 'different');
          }
          if (mobileFilterValues.seasonCount) {
            setSeasonCount(Number(mobileFilterValues.seasonCount) || 1);
          }
          if (mobileFilterValues.budget) {
            const mobileBudget = apiBudgets.find((b: any) => b.id === mobileFilterValues.budget);
            setSelectedBudgetId(mobileFilterValues.budget as string);
            if (mobileBudget?.fiscalYear) setSelectedYear(mobileBudget.fiscalYear);
          }
          setSelectedSeasonGroup((mobileFilterValues.seasonGroup as string) || 'all');
          setSelectedSeason((mobileFilterValues.season as string) || 'all');
          setSelectedVersionId((mobileFilterValues.version as string) || null);
        }}
        onReset={() => {
          setMobileFilterValues({});
          clearFilters();
        }}
      />

      {/* Version dropdown portal — renders outside overflow containers */}
      {openVersionBrandId && dropdownAnchorEl && typeof document !== 'undefined' && (() => {
        const rect = dropdownAnchorEl.getBoundingClientRect();
        const bVersions = brandPlanningVersions[openVersionBrandId] || [];
        const selectedVer = brandSelectedVersion[openVersionBrandId] || '';
        const dropdownW = 220;
        const overflowRight = rect.right > window.innerWidth - dropdownW;
        return createPortal(
          <div
            className="brand-version-portal"
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
                <span className={`text-[10px] font-semibold uppercase tracking-wide font-['Montserrat'] ${'text-[#666666]'}`}>Planning Versions</span>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {bVersions.map((v: any) => {
                  const isFinal = v.isFinal ?? false;
                  const isSelected = String(v.id) === String(selectedVer);
                  return (
                    <div
                      key={v.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setBrandSelectedVersion(prev => ({ ...prev, [openVersionBrandId!]: String(v.id) }));
                        setOpenVersionBrandId(null);
                        setDropdownAnchorEl(null);
                      }}
                      className={`px-3 py-1 flex items-center justify-between cursor-pointer transition-colors text-xs border-t ${'border-[#E5E0DB]'} ${
                        isSelected
                          ?'bg-[rgba(18,119,73,0.1)] text-[#127749]':'hover:bg-[rgba(160,120,75,0.18)] text-[#0A0A0A]'}`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        {isFinal && <Star size={11} className={'text-[#6B4D30] fill-[#6B4D30] shrink-0'} />}
                        <span className="font-medium truncate">Version {v.version}</span>
                        <span className={`text-[9px] px-1 rounded ${
                          v.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                          v.status === 'SUBMITTED' ? 'bg-blue-500/20 text-blue-400' :
                          v.status === 'REJECTED' ? 'bg-red-500/20 text-red-400' :'bg-[#E5E0DB] text-[#666]'}`}>{v.status}</span>
                        {isFinal && <span className="px-1 py-px text-[8px] font-bold bg-[#D7B797] text-[#0A0A0A] rounded shrink-0">FINAL</span>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!isFinal && (
                          <button
                            onClick={(e) => {
                              handleSetFinalVersion(openVersionBrandId!, v.id, e);
                              setOpenVersionBrandId(null);
                              setDropdownAnchorEl(null);
                            }}
                            title="Set as final version"
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
    </div>
  );
};

export default OTBAnalysisScreen;
