import React from 'react';
import {
  LayoutDashboard,
  Database,
  ShieldCheck,
  FileText,
  Users,
  UserPlus,
  PiggyBank,
  HandCoins,
  Coins,
  BarChart3,
  UserCheck,
  Bell,
  Settings,
  ChevronRight,
  Sparkles,
  Lock,
  Layers,
  HelpCircle,
  X,
  Wallet,
  Briefcase,
  User,
  LogOut,
  Calculator,
  Vault,
  FileCheck,
  Smartphone,
} from 'lucide-react';
import { UserRole, AppMode } from '../types';
import { ROLES_CONFIG } from '../data/mockData';
import { CoopLogo } from './CoopLogo';

export type NavTab =
  | 'dashboard'
  | 'my_profile'
  | 'cooperative_settings'
  | 'treasurer_workflow'
  | 'bank_alert_import'
  | 'finsec_approval'
  | 'executive_management'
  | 'wallet_management'
  | 'member_registration'
  | 'savings_management'
  | 'naira_at_risk'
  | 'loan_management'
  | 'guarantor_exposure'
  | 'commercial_ventures'
  | 'dividend_distribution'
  | 'reports_analytics'
  | 'database_schema'
  | 'permissions_matrix'
  | 'role_assignment'
  | 'audit_logs'
  | 'directory'
  | 'notifications'
  | 'settings';

export const ROLE_ALLOWED_TABS: Record<UserRole, NavTab[]> = {
  sys_admin: [
    'dashboard',
    'my_profile',
    'cooperative_settings',
    'treasurer_workflow',
    'bank_alert_import',
    'finsec_approval',
    'executive_management',
    'wallet_management',
    'member_registration',
    'savings_management',
    'naira_at_risk',
    'loan_management',
    'guarantor_exposure',
    'commercial_ventures',
    'dividend_distribution',
    'reports_analytics',
    'database_schema',
    'permissions_matrix',
    'role_assignment',
    'audit_logs',
    'directory',
    'notifications',
    'settings',
  ],
  chairman: [
    'dashboard',
    'my_profile',
    'cooperative_settings',
    'treasurer_workflow',
    'bank_alert_import',
    'finsec_approval',
    'naira_at_risk',
    'loan_management',
    'commercial_ventures',
    'dividend_distribution',
    'reports_analytics',
    'permissions_matrix',
    'role_assignment',
    'audit_logs',
    'directory',
    'notifications',
    'settings',
  ],
  vice_chairman: [
    'dashboard',
    'my_profile',
    'cooperative_settings',
    'member_registration',
    'naira_at_risk',
    'loan_management',
    'guarantor_exposure',
    'commercial_ventures',
    'reports_analytics',
    'role_assignment',
    'directory',
    'notifications',
    'settings',
  ],
  financial_secretary: [
    'dashboard',
    'my_profile',
    'finsec_approval',
    'treasurer_workflow',
    'bank_alert_import',
    'cooperative_settings',
    'wallet_management',
    'member_registration',
    'savings_management',
    'naira_at_risk',
    'loan_management',
    'guarantor_exposure',
    'reports_analytics',
    'role_assignment',
    'directory',
    'notifications',
    'settings',
  ],
  treasurer: [
    'dashboard',
    'my_profile',
    'treasurer_workflow',
    'bank_alert_import',
    'finsec_approval',
    'cooperative_settings',
    'wallet_management',
    'savings_management',
    'naira_at_risk',
    'loan_management',
    'dividend_distribution',
    'reports_analytics',
    'role_assignment',
    'directory',
    'notifications',
    'settings',
  ],
  secretary: [
    'dashboard',
    'my_profile',
    'member_registration',
    'naira_at_risk',
    'role_assignment',
    'directory',
    'notifications',
    'settings',
  ],
  loan_officer: [
    'dashboard',
    'my_profile',
    'loan_management',
    'guarantor_exposure',
    'savings_management',
    'naira_at_risk',
    'role_assignment',
    'directory',
    'notifications',
    'settings',
  ],
  auditor: [
    'dashboard',
    'my_profile',
    'naira_at_risk',
    'reports_analytics',
    'audit_logs',
    'database_schema',
    'wallet_management',
    'role_assignment',
    'directory',
    'notifications',
    'settings',
  ],
  business_supervisor: [
    'dashboard',
    'my_profile',
    'commercial_ventures',
    'naira_at_risk',
    'role_assignment',
    'directory',
    'notifications',
    'settings',
  ],
  member: [
    'dashboard',
    'my_profile',
    'savings_management',
    'naira_at_risk',
    'loan_management',
    'guarantor_exposure',
    'role_assignment',
    'notifications',
    'settings',
  ],
};

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  userRole?: UserRole;
  appMode?: AppMode;
  isSuperAdminUser?: boolean;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userRole = 'sys_admin',
  appMode = 'development',
  isSuperAdminUser = false,
  isMobileOpen,
  onCloseMobile,
  onLogout,
}) => {
  const currentRole = ROLES_CONFIG[userRole];
  const allowedTabs = ROLE_ALLOWED_TABS[userRole] || ROLE_ALLOWED_TABS.member;

  const rawNavItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Home Dashboard',
      subtitle: `${currentRole?.name || 'Role'} View`,
      icon: LayoutDashboard,
      badge: 'Role Custom',
    },
    {
      id: 'my_profile' as NavTab,
      label: 'My Profile',
      subtitle: 'Personal Details & Photo',
      icon: User,
      badge: 'Self Service',
    },
    {
      id: 'cooperative_settings' as NavTab,
      label: 'Cooperative Policy Settings',
      subtitle: 'Fees, Interest & Policies',
      icon: Settings,
      badge: 'Super Admin',
    },
    {
      id: 'treasurer_workflow' as NavTab,
      label: 'Treasurer Payment Portal',
      subtitle: 'Assign Alerts & Receipts',
      icon: Vault,
      badge: 'Treasurer',
    },
    {
      id: 'bank_alert_import' as NavTab,
      label: 'Bulk Bank Alert Import',
      subtitle: 'SMS Parser & Batch Assign',
      icon: Smartphone,
      badge: 'SMS Parser',
    },
    {
      id: 'finsec_approval' as NavTab,
      label: 'FinSec Approval Queue',
      subtitle: 'Approve & Reverse Postings',
      icon: FileCheck,
      badge: 'FinSec / Admin',
    },
    {
      id: 'executive_management' as NavTab,
      label: 'Executive Management',
      subtitle: 'Appoint Officers & Tenure',
      icon: Briefcase,
      badge: 'Super Admin',
    },
    {
      id: 'wallet_management' as NavTab,
      label: 'Wallet Architecture',
      subtitle: 'Cooperative & Member Wallets',
      icon: Wallet,
      badge: 'Dual Wallet System',
    },
    {
      id: 'member_registration' as NavTab,
      label: 'Member Registration',
      subtitle: 'Enrolment & Dossiers',
      icon: UserPlus,
      badge: 'Module Active',
    },
    {
      id: 'savings_management' as NavTab,
      label: 'Savings Management',
      subtitle: 'Deposits, Statements & Ledger',
      icon: PiggyBank,
      badge: 'Active Ledger',
    },
    {
      id: 'naira_at_risk' as NavTab,
      label: 'Naira At Risk Report',
      subtitle: 'Weighted Days & Dividend Prep',
      icon: Calculator,
      badge: 'Formula Engine',
    },
    {
      id: 'loan_management' as NavTab,
      label: 'Loan Management',
      subtitle: '6-Step Workflow & Approvals',
      icon: HandCoins,
      badge: '6-Step Process',
    },
    {
      id: 'guarantor_exposure' as NavTab,
      label: 'Guarantor Risk Exposure',
      subtitle: '3x Savings Capacity Checks',
      icon: UserCheck,
      badge: 'Risk Engine',
    },
    {
      id: 'commercial_ventures' as NavTab,
      label: 'Business Management',
      subtitle: 'Commercial & Enterprise Ventures',
      icon: Briefcase,
      badge: 'Ventures',
    },
    {
      id: 'dividend_distribution' as NavTab,
      label: 'Dividend Distribution',
      subtitle: 'Surplus Pool & Payouts',
      icon: Coins,
      badge: 'Surplus Engine',
    },
    {
      id: 'reports_analytics' as NavTab,
      label: 'Financial & Statutory Reports',
      subtitle: 'Trial Balance & Statements',
      icon: BarChart3,
      badge: 'Audit Ready',
    },
    {
      id: 'database_schema' as NavTab,
      label: 'Database Architecture',
      subtitle: '10 Core Schemas & Modules',
      icon: Database,
      badge: 'Phase 2 Ready',
    },
    {
      id: 'permissions_matrix' as NavTab,
      label: 'Roles & RBAC Matrix',
      subtitle: '9 Roles & Permissions',
      icon: ShieldCheck,
      badge: '9 Roles',
    },
    {
      id: 'role_assignment' as NavTab,
      label: 'Role & Office Elections',
      subtitle: 'Assign & Transfer Officers',
      icon: UserCheck,
      badge: 'Elections',
    },
    {
      id: 'audit_logs' as NavTab,
      label: 'Audit & Security Logs',
      subtitle: 'Immutable System Trail',
      icon: FileText,
      badge: 'Live',
    },
    {
      id: 'directory' as NavTab,
      label: 'Cooperative Directory',
      subtitle: 'Staff & Members Roster',
      icon: Users,
    },
    {
      id: 'notifications' as NavTab,
      label: 'Notifications Center',
      subtitle: 'System Communications',
      icon: Bell,
    },
    {
      id: 'settings' as NavTab,
      label: 'Security & Settings',
      subtitle: 'Credentials & 2FA',
      icon: Settings,
    },
  ];

  const mainNavItems = rawNavItems.filter((item) => allowedTabs.includes(item.id));

  const content = (
    <div className="h-full flex flex-col bg-[#014421] text-white border-r-2 border-[#DAA520] w-72 select-none shadow-xl">
      {/* Sidebar Header */}
      <div className="p-5 border-b border-emerald-800 flex items-center justify-between bg-[#013318]">
        <CoopLogo size="md" showText variant="gold" />

        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-emerald-200 hover:bg-emerald-800 bg-emerald-900 border border-emerald-700"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role Badge Indicator */}
      <div className="mx-4 my-4 p-3 rounded-xl bg-[#013318] border border-[#DAA520]">
        <div className="text-xs font-black uppercase tracking-wider text-[#DAA520] flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" /> Security Profile
        </div>
        <div className="mt-1 font-extrabold text-sm text-white truncate">
          {currentRole?.name}
        </div>
        <div className="text-xs text-emerald-100 truncate mt-0.5 font-medium">
          {currentRole?.title}
        </div>
      </div>

      {/* Main Navigation List */}
      <div className="flex-1 px-4 py-2 space-y-1.5 overflow-y-auto">
        <div className="px-2 py-1 text-xs font-black uppercase tracking-wider text-[#DAA520]">
          Operational Hub
        </div>

        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full group text-left px-3.5 py-3 rounded-xl transition-all flex items-center gap-3 ${
                isActive
                  ? 'bg-[#DAA520] text-[#014421] font-black shadow-md'
                  : 'text-white hover:bg-[#013318] font-bold'
              }`}
            >
              <div
                className={`p-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-[#014421] text-[#DAA520]'
                    : 'bg-emerald-900 text-[#DAA520] group-hover:bg-emerald-800'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-extrabold leading-snug flex items-center justify-between">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 font-black rounded-full ${
                        isActive
                          ? 'bg-[#014421] text-[#DAA520]'
                          : 'bg-emerald-950 text-[#DAA520] border border-[#DAA520]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <div
                  className={`text-xs truncate ${
                    isActive ? 'text-[#014421] font-bold' : 'text-emerald-100'
                  }`}
                >
                  {item.subtitle}
                </div>
              </div>

              {isActive && <ChevronRight className="w-4 h-4 text-[#014421]" />}
            </button>
          );
        })}

        {/* Phase 2 Modules Ready Preview Box */}
        <div className="mt-6 pt-4 border-t border-emerald-800 px-1">
          <div className="p-3.5 rounded-xl bg-[#013318] border border-[#DAA520]">
            <div className="flex items-center gap-2 text-[#DAA520] text-xs font-black">
              <Layers className="w-4 h-4" />
              Phase 2 Modules Ready
            </div>
            <p className="text-xs text-emerald-100 mt-1 leading-relaxed font-medium">
              Database structure pre-built for Savings, Loans, Guarantors, Businesses, and Dividends.
            </p>
            <button
              onClick={() => {
                onSelectTab('database_schema');
                onCloseMobile();
              }}
              className="mt-2.5 w-full py-2 px-3 rounded-lg bg-[#DAA520] hover:bg-amber-400 text-[#014421] text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Inspect Schema Tables
            </button>
          </div>
        </div>

        {/* Log Out Button */}
        {onLogout && (
          <div className="mt-4 pt-3 border-t border-emerald-800/80 px-1">
            <button
              type="button"
              onClick={() => {
                onCloseMobile();
                onLogout();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/40 font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer group"
            >
              <LogOut className="w-4 h-4 text-rose-400 group-hover:text-white" />
              <span>Sign Out of LCMS PRO</span>
            </button>
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-emerald-800 bg-[#012d15] text-[11px] text-emerald-100 font-bold space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-[#DAA520]" />
            <span>Support Desk</span>
          </div>
          <span className="font-mono text-[10px] text-[#DAA520]">v1.0.4 Cloud</span>
        </div>
        <div className="pt-1.5 border-t border-emerald-900/80 flex items-center justify-between text-[10px]">
          <span className="text-slate-300">Environment:</span>
          <span className={`px-2 py-0.5 rounded font-black uppercase ${
            appMode === 'development'
              ? 'bg-amber-400 text-slate-950'
              : 'bg-emerald-700 text-white'
          }`}>
            {appMode === 'development' ? 'Dev Mode' : 'Production'}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block h-screen sticky top-0 shrink-0">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 w-72 h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
