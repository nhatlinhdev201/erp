'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  DollarSign, Package, BarChart3, TrendingUp,
  CheckCircle, ChevronRight, ListOrdered,
  ChevronDown, Wallet, FileCheck,
  ClipboardList, ClipboardCheck, Ticket, Home, LogOut,
  Settings, Crown, PanelLeftClose,
  Database, Building2, FolderTree, Tag,
  Upload, Store, Users, Calendar
} from 'lucide-react';
import { ROUTE_MAP } from '@/utils/routeMap';
import { useLanguage } from '@/contexts/LanguageContext';

const Sidebar = ({ currentScreen, user, onLogout }: any) => {
  const router = useRouter();
  const { t } = useLanguage();
  const navigateTo = (screenId: any) => {
    const route = ROUTE_MAP[screenId];
    if (route) {
      router.push(route);
    }
  };
  const [isMasterDataOpen, setIsMasterDataOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [openGroups, setOpenGroups] = useState<any>({ planning: true, approval: true, confirmation: false });
  const [hoveredItem, setHoveredItem] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isCollapsed = !isExpanded;

  const toggleGroup = (group: any) => {
    setOpenGroups((prev: any) => ({ ...prev, [group]: !prev[group] }));
  };

  const menuGroups = useMemo(() => [
    {
      id: 'planning',
      label: t('nav.planning'),
      icon: TrendingUp,
      items: [
        { id: 'budget-management', label: t('nav.budgetManagement'), icon: Wallet },
        { id: 'planning', label: t('nav.budgetAllocation'), icon: DollarSign },
        { id: 'otb-analysis', label: t('nav.otbAnalysis'), icon: BarChart3 },
        { id: 'proposal', label: t('nav.skuProposal'), icon: Package },
      ]
    },
    {
      id: 'approval',
      label: t('nav.approvalHub'),
      icon: CheckCircle,
      items: [
        { id: 'tickets', label: t('nav.tickets'), icon: Ticket },
        { id: 'approval-config', label: t('nav.workflowConfig'), icon: Settings },
      ]
    },
    {
      id: 'confirmation',
      label: t('nav.confirmation'),
      icon: ClipboardList,
      items: [
        { id: 'order-confirmation', label: t('nav.orderConfirm'), icon: ListOrdered },
        { id: 'receipt-confirmation', label: t('nav.receiptConfirm'), icon: ClipboardCheck },
      ]
    }
  ], [t]);

  const getIconClass = (itemId: any) => {
    const isActive = currentScreen === itemId;
    if (isActive) {
      return 'text-[#6B4D30]';
    }
    return 'text-gray-600 group-hover:text-[#6B4D30]';
  };

  const getTextClass = (itemId: any) => {
    const isActive = currentScreen === itemId;
    if (isActive) {
      return 'text-[#6B4D30] font-bold';
    }
    return 'text-gray-600 font-medium group-hover:text-[#6B4D30]';
  };

  // Collapsed sidebar item with tooltip
  const CollapsedMenuItem = ({ item, showDividerAfter = false }: any) => {
    const isActive = currentScreen === item.id;
    const Icon = item.icon;

    return (
      <>
        <div className="relative">
          <button
            onClick={() => navigateTo(item.id)}
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
            className={`group relative w-full flex items-center justify-center h-8 rounded-lg transition-all duration-200
              ${isActive
                ? ''
                : 'hover:bg-[rgba(215,183,151,0.06)]'
              }`}
            style={isActive ? {
              background: 'linear-gradient(135deg, rgba(215,183,151,0.08) 0%, rgba(215,183,151,0.16) 100%)',
            } : undefined}
          >
            {/* Active indicator */}
            {isActive && (
              <div
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r-full"
                style={{ background: 'linear-gradient(180deg, #D7B797 0%, #C49A6C 100%)' }}
              />
            )}

            <Icon
              size={16}
              strokeWidth={isActive ? 2.5 : 2}
              className={`transition-all duration-200 ${
                isActive
                  ? 'text-[#6B4D30]'
                  : 'text-gray-600 group-hover:text-[#6B4D30]'
              }`}
              style={isActive ? { filter: 'drop-shadow(0 0 4px rgba(215,183,151,0.4))' } : undefined}
            />
          </button>

          {/* Tooltip */}
          {hoveredItem === item.id && (
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none">
              <div className="px-2.5 py-1 rounded-lg shadow-lg whitespace-nowrap text-[11px] font-medium font-['Montserrat'] bg-white text-gray-800 border border-gray-300">
                {item.label}
              </div>
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-white" />
            </div>
          )}
        </div>
        {showDividerAfter && (
          <div className="my-1.5 mx-2">
            <div className="h-px" style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(215,183,151,0.25) 50%, transparent 100%)',
            }} />
          </div>
        )}
      </>
    );
  };

  return (
    <div
      className={`${isCollapsed ? 'w-[56px]' : 'w-[264px]'} h-screen border-r flex flex-col sticky top-0 z-40 transition-[width] duration-200 ease-out`}
      style={{
        background: 'linear-gradient(180deg, #ffffff 0%, #fefefe 50%, #fdfbf9 100%)',
        borderColor: '#D1D5DB',
      }}
    >
      {/* Logo Header */}
      <div
        className="h-11 flex items-center justify-center"
        style={{
          borderBottom: '1px solid #D1D5DB',
          background: 'linear-gradient(135deg, #ffffff 0%, rgba(215,183,151,0.12) 100%)',
        }}
      >
        {isCollapsed ? (
          <button
            onClick={() => setIsExpanded(true)}
            className="w-full h-full flex items-center justify-center transition-all duration-200 hover:bg-[rgba(215,183,151,0.06)]"
            title={t('components.expandSidebar')}
          >
            <img src="/vietErp-logo-icon.svg" alt="L-ERP" className="h-[14px] w-auto object-contain" />
          </button>
        ) : (
          <div className="flex items-center gap-2.5 px-3 w-full h-full">
            <img src="/vietErp-logo.png" alt="L-ERP" className="h-9 w-auto object-contain flex-shrink-0 -mt-[2px]" />
            <span
              className="flex-1 text-xs font-bold tracking-widest whitespace-nowrap leading-none"
              style={{ color: '#8A6340' }}
            >
              {t('components.otbSystem')}
            </span>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-1 rounded-md flex-shrink-0 transition-all duration-200 text-gray-500 hover:text-[#6B4D30] hover:bg-[rgba(215,183,151,0.08)]"
              title={t('components.collapseSidebar')}
            >
              <PanelLeftClose size={14} strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-1 custom-scrollbar">
        {isCollapsed ? (
          /* Collapsed View */
          <div className="px-1.5 space-y-0.5">
            <CollapsedMenuItem item={{ id: 'home', label: t('nav.homeDashboard'), icon: Home }} showDividerAfter />
            {menuGroups.map((group: any, groupIndex: any) => (
              <div key={group.id}>
                {group.items.map((item: any, itemIndex: any) => (
                  <CollapsedMenuItem
                    key={item.id}
                    item={item}
                    showDividerAfter={groupIndex < menuGroups.length - 1 && itemIndex === group.items.length - 1}
                  />
                ))}
              </div>
            ))}
            <div className="my-1.5 mx-2">
              <div className="h-px" style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(215,183,151,0.25) 50%, transparent 100%)',
              }} />
            </div>
            <CollapsedMenuItem item={{ id: 'master-brands', label: t('nav.masterData'), icon: Database }} />
            <CollapsedMenuItem item={{ id: 'import-data', label: t('nav.importData') || 'Import Data', icon: Upload }} />
          </div>
        ) : (
          /* Expanded View */
          <div className="px-2.5 space-y-3">
            {/* Home */}
            <button
              onClick={() => navigateTo('home')}
              className="group w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-150 hover:bg-[rgba(215,183,151,0.04)]"
            >
              <Home
                size={14}
                strokeWidth={2.5}
                className="transition-colors duration-150"
                style={{ color: '#8A6340' }}
              />
              <span
                className="font-extrabold text-[12px] uppercase tracking-wider font-['Montserrat']"
                style={{ color: '#8A6340' }}
              >
                {t('nav.homeDashboard')}
              </span>
            </button>

            {/* Menu Groups */}
            {menuGroups.map((group: any) => (
              <div key={group.id} className="pt-0">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="group w-full px-2.5 py-1.5 flex items-center justify-between rounded-md transition-all duration-150 hover:bg-[rgba(215,183,151,0.04)]"
                >
                  <div className="flex items-center gap-1.5">
                    <group.icon
                      size={14}
                      strokeWidth={2.5}
                      className="transition-colors duration-150"
                      style={{
                        color: '#8A6340',
                      }}
                    />
                    <span
                      className="font-extrabold text-[12px] uppercase tracking-wider font-['Montserrat']"
                      style={{ color: '#8A6340' }}
                    >
                      {group.label}
                    </span>
                  </div>
                  <ChevronDown
                    size={10}
                    strokeWidth={2.5}
                    className={`text-gray-500 transition-transform duration-200 ${
                      openGroups[group.id] ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Group Items */}
                {openGroups[group.id] && (
                  <div className="space-y-1 ml-1.5 pl-2.5 mt-1 animate-expandSection" style={{
                    borderLeft: '1.5px solid rgba(215,183,151,0.45)',
                  }}>
                    {group.items.map((item: any) => {
                      const isActive = currentScreen === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => navigateTo(item.id)}
                          className="group w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-all duration-200"
                          style={isActive ? {
                            background: 'linear-gradient(135deg, rgba(215,183,151,0.06) 0%, rgba(215,183,151,0.14) 100%)',
                            boxShadow: 'inset 0 0 0 1px rgba(215,183,151,0.1)',
                          } : undefined}
                        >
                          <item.icon
                            size={14}
                            strokeWidth={2.5}
                            className={`transition-colors duration-150 ${getIconClass(item.id)}`}
                            style={isActive ? { filter: 'drop-shadow(0 0 4px rgba(215,183,151,0.4))' } : undefined}
                          />
                          <span className={`text-[12px] font-['Montserrat'] transition-colors duration-150 whitespace-nowrap ${getTextClass(item.id)}`}>
                            {item.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}

            {/* Gradient Divider */}
            <div className="py-1.5">
              <div className="h-px" style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(215,183,151,0.25) 50%, transparent 100%)',
              }} />
            </div>

            {/* Master Data - Expandable */}
            <div>
              <button
                onClick={() => setIsMasterDataOpen(!isMasterDataOpen)}
                className="group w-full px-2.5 py-1.5 flex items-center justify-between rounded-md transition-all duration-150 hover:bg-[rgba(215,183,151,0.04)]"
              >
                <div className="flex items-center gap-1.5">
                  <Database
                    size={14}
                    strokeWidth={2.5}
                    className="transition-colors duration-150"
                    style={{ color: '#8A6340' }}
                  />
                  <span
                    className="font-extrabold text-[12px] uppercase tracking-wider font-['Montserrat']"
                    style={{ color: '#8A6340' }}
                  >
                    {t('nav.masterData')}
                  </span>
                </div>
                <ChevronDown
                  size={10}
                  strokeWidth={2.5}
                  className={`text-gray-500 transition-transform duration-200 ${
                    isMasterDataOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isMasterDataOpen && (
                <div className="space-y-1 ml-1.5 pl-2.5 mt-1" style={{
                  borderLeft: '1.5px solid rgba(215,183,151,0.45)',
                }}>
                  {[
                    { id: 'master-brands', label: t('nav.brands'), icon: Building2 },
                    { id: 'master-skus', label: t('nav.skuCatalog'), icon: Package },
                    { id: 'master-categories', label: t('nav.categories'), icon: FolderTree },
                    { id: 'master-subcategories', label: t('nav.subCategories'), icon: Tag },
                    { id: 'master-stores', label: t('nav.stores'), icon: Store },
                    { id: 'master-genders', label: t('nav.genders'), icon: Users },
                    { id: 'master-season-groups', label: t('nav.seasonGroups'), icon: Calendar },
                  ].map((item: any) => {
                    const isActive = currentScreen === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigateTo(item.id)}
                        className="group w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md transition-all duration-200"
                        style={isActive ? {
                          background: 'linear-gradient(135deg, rgba(215,183,151,0.06) 0%, rgba(215,183,151,0.14) 100%)',
                          boxShadow: 'inset 0 0 0 1px rgba(215,183,151,0.1)',
                        } : undefined}
                      >
                        <item.icon
                          size={14}
                          strokeWidth={2.5}
                          className={`transition-colors duration-150 ${getIconClass(item.id)}`}
                          style={isActive ? { filter: 'drop-shadow(0 0 4px rgba(215,183,151,0.4))' } : undefined}
                        />
                        <span className={`text-[12px] font-['Montserrat'] transition-colors duration-150 whitespace-nowrap ${getTextClass(item.id)}`}>
                          {item.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Import Data */}
            <button
              onClick={() => navigateTo('import-data')}
              className="group w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-md transition-all duration-150 hover:bg-[rgba(215,183,151,0.04)]"
            >
              <Upload
                size={14}
                strokeWidth={2.5}
                className="transition-colors duration-150"
                style={{ color: '#8A6340' }}
              />
              <span
                className="font-extrabold text-[12px] uppercase tracking-wider font-['Montserrat']"
                style={{ color: '#8A6340' }}
              >
                {t('nav.importData') || 'Import Data'}
              </span>
            </button>

          </div>
        )}
      </nav>

      {/* Footer Section - User Profile */}
      <div className="p-2 relative" style={{
        borderTop: '1px solid #D1D5DB',
        background: 'linear-gradient(180deg, transparent 0%, rgba(215,183,151,0.03) 100%)',
      }}>
        {/* User Menu Popup */}
        {showUserMenu && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
            <div
              className={`absolute ${isCollapsed ? 'left-full ml-2 bottom-0' : 'left-2 right-2 bottom-full mb-2'} z-50 rounded-xl shadow-xl border overflow-hidden animate-slideDown`}
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #fdfcfa 35%, #faf8f5 100%)',
                borderColor: '#D1D5DB',
                boxShadow: '0 -8px 30px rgba(0,0,0,0.08), inset 0 1px 0 rgba(215,183,151,0.08)',
                minWidth: isCollapsed ? '200px' : 'auto',
              }}
            >
              {/* User Info Header */}
              <div className="p-3" style={{
                borderBottom: '1px solid #D1D5DB',
                background: 'linear-gradient(135deg, #F9FAFB 0%, #f5f3f0 100%)',
              }}>
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold font-['Montserrat']"
                    style={{
                      border: '2px solid #8A6340',
                      color: '#8A6340',
                      background: 'linear-gradient(135deg, rgba(215,183,151,0.08) 0%, rgba(215,183,151,0.16) 100%)',
                    }}
                  >
                    {user?.name?.split(' ').map((n: any) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold font-['Montserrat'] truncate text-gray-900">
                      {user?.name || 'User'}
                    </div>
                    <div className="text-[11px] text-gray-700">
                      {user?.email || user?.role?.name || 'User'}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#2A9E6A]" style={{ boxShadow: '0 0 4px rgba(42,158,106,0.5)' }} />
                      <span className="text-[9px] font-medium text-green-600">
                        {t('common.online')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-1.5">
                <button
                  onClick={() => { navigateTo('profile'); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1 rounded-lg transition-all duration-200 text-gray-700 hover:bg-gray-100"
                >
                  <div className="p-1 rounded-md bg-gray-100">
                    <Crown size={14} className="text-[#6B4D30]" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-xs font-medium font-['Montserrat']">{t('userMenu.myProfile')}</div>
                    <div className="text-[10px] text-gray-700">
                      {t('userMenu.viewAndEditProfile')}
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => { navigateTo('settings'); setShowUserMenu(false); }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1 rounded-lg transition-all duration-200 text-gray-700 hover:bg-gray-100"
                >
                  <div className="p-1 rounded-md bg-gray-100">
                    <Settings size={14} className="text-gray-700" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-xs font-medium font-['Montserrat']">{t('userMenu.settings')}</div>
                    <div className="text-[10px] text-gray-700">
                      {t('userMenu.appPreferences')}
                    </div>
                  </div>
                </button>

                <div className="my-1.5 mx-2 h-px" style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(215,183,151,0.2) 50%, transparent 100%)',
                }} />

                {onLogout && (
                  <button
                    onClick={() => { setShowUserMenu(false); onLogout(); }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1 rounded-lg transition-all duration-200 text-red-600 hover:bg-red-50"
                  >
                    <div className="p-1 rounded-md bg-red-100">
                      <LogOut size={14} className="text-red-500" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-xs font-medium font-['Montserrat']">{t('userMenu.logout')}</div>
                      <div className="text-[10px] text-gray-700">
                        {t('userMenu.signOutOfAccount')}
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </>
        )}

        {/* User Avatar Button */}
        {isCollapsed ? (
          <div className="flex justify-center">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="relative group"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold font-['Montserrat'] transition-all duration-200"
                style={{
                  border: '2px solid #8A6340',
                  color: '#8A6340',
                  background: showUserMenu
                    ? 'linear-gradient(135deg, rgba(215,183,151,0.10) 0%, rgba(215,183,151,0.20) 100%)'
                    : 'transparent',
                }}
              >
                {user?.name?.split(' ').map((n: any) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
              </div>
              <div
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#2A9E6A]"
                style={{
                  border: '2px solid #ffffff',
                  boxShadow: '0 0 4px rgba(42,158,106,0.5)',
                }}
              />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full rounded-lg p-2 flex items-center gap-2.5 transition-all duration-200"
            style={{
              background: showUserMenu
                ? 'linear-gradient(135deg, rgba(215,183,151,0.08) 0%, rgba(215,183,151,0.16) 100%)'
                : 'linear-gradient(135deg, #F9FAFB 0%, rgba(215,183,151,0.06) 100%)',
              border: `1px solid ${showUserMenu ? 'rgba(215,183,151,0.3)' : '#D1D5DB'}`,
            }}
          >
            <div className="relative flex-shrink-0">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold font-['Montserrat']"
                style={{
                  border: '2px solid #8A6340',
                  color: '#8A6340',
                }}
              >
                {user?.name?.split(' ').map((n: any) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
              </div>
              <div
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#2A9E6A]"
                style={{
                  border: '2px solid #F9FAFB',
                  boxShadow: '0 0 4px rgba(42,158,106,0.5)',
                }}
              />
            </div>

            <div className="flex-1 min-w-0 text-left">
              <div className="text-xs font-semibold font-['Montserrat'] truncate text-gray-900">
                {user?.name || 'User'}
              </div>
              <div className="text-[11px] text-gray-700">
                {user?.role?.name || 'User'}
              </div>
            </div>

            <ChevronRight
              size={14}
              className={`transition-transform duration-200 ${showUserMenu ? 'rotate-90' : ''} text-gray-500`}
            />
          </button>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
