import React, { useEffect, useState, useMemo } from 'react';
import {
  Users,
  PiggyBank,
  HandCoins,
  Building2,
  Wallet,
  Briefcase,
  BarChart3,
  Coins,
  ShieldAlert,
  Settings,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  CreditCard,
  FileSpreadsheet,
  BadgeCheck,
  XCircle,
  FileCheck,
  User as UserIcon,
} from 'lucide-react';
import { User, SavingsSummaryStats, LoanSummaryStats, SavingsDeposit, LoanApplication } from '../../types';
import { calculateCooperativeNairaAtRisk } from '../../utils/cooperativeRules';
import { NavTab } from '../Sidebar';
import { CoopLogo } from '../CoopLogo';
import { MemberDashboard } from './MemberDashboard';
import { ChairmanDashboard } from './ChairmanDashboard';
import { ViceChairmanDashboard } from './ViceChairmanDashboard';
import { FinSecDashboard } from './FinSecDashboard';
import { TreasurerDashboard } from './TreasurerDashboard';
import { SecretaryDashboard } from './SecretaryDashboard';
import { AuditorDashboard } from './AuditorDashboard';
import { BusinessSupervisorDashboard } from './BusinessSupervisorDashboard';
import { LoanOfficerDashboard } from './LoanOfficerDashboard';
import { apiUrl } from '../../utils/apiClient';

interface MasterDashboardProps {
  currentUser: User;
  users: User[];
  savingsStats: SavingsSummaryStats;
  loanStats: LoanSummaryStats;
  savingsDeposits: SavingsDeposit[];
  loans: LoanApplication[];
  onNavigate: (
    tab: NavTab,
    subTab?: string,
    memberFilters?: { status?: string; regFee?: string; idCard?: string }
  ) => void;
  onNavigateToSchema?: () => void;
  onNavigateToPermissions?: () => void;
  onRepayLoan?: (id: string, data: any) => Promise<{ success: boolean; message: string; error?: string }>;
}

export const MasterDashboard: React.FC<MasterDashboardProps> = ({
  currentUser,
  users = [],
  savingsStats,
  loanStats,
  savingsDeposits = [],
  loans = [],
  onNavigate,
  onNavigateToSchema,
  onNavigateToPermissions,
  onRepayLoan,
}) => {
  const [cooperativeWalletBalance, setCooperativeWalletBalance] = useState<number>(18450000);
  const [businessProfit] = useState<number>(12500000);

  // Role-Based Dashboard Routing for non-sys_admin roles
  const userRole = currentUser?.role || 'sys_admin';

  if (userRole === 'member') {
    return <MemberDashboard currentUser={currentUser} loans={loans} />;
  }
  if (userRole === 'chairman') {
    return <ChairmanDashboard currentUser={currentUser} loans={loans} onNavigateToSchema={onNavigateToSchema || (() => {})} />;
  }
  if (userRole === 'vice_chairman') {
    return <ViceChairmanDashboard currentUser={currentUser} />;
  }
  if (userRole === 'financial_secretary') {
    return <FinSecDashboard currentUser={currentUser} loans={loans} onRepayLoan={onRepayLoan} onNavigateToSchema={onNavigateToSchema || (() => {})} />;
  }
  if (userRole === 'treasurer') {
    return <TreasurerDashboard currentUser={currentUser} loans={loans} />;
  }
  if (userRole === 'secretary') {
    return <SecretaryDashboard currentUser={currentUser} />;
  }
  if (userRole === 'auditor') {
    return (
      <AuditorDashboard
        currentUser={currentUser}
        auditLogs={[]}
        onNavigateToAuditLogs={onNavigateToPermissions || (() => {})}
      />
    );
  }
  if (userRole === 'business_supervisor') {
    return <BusinessSupervisorDashboard currentUser={currentUser} />;
  }
  if (userRole === 'loan_officer') {
    return <LoanOfficerDashboard currentUser={currentUser} loanStats={loanStats} loans={loans} onNavigate={onNavigate} />;
  }

  // Fetch live cooperative wallet balance from server
  useEffect(() => {
    fetch(apiUrl('/api/wallets/cooperative'))
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.totalBalance === 'number') {
          setCooperativeWalletBalance(data.totalBalance);
        }
      })
      .catch(() => {});
  }, []);

  // Compute live statistics
  const totalMembers = users?.length || 0;
  const activeMembers = users ? users.filter((u) => u.status === 'active').length : 0;
  const pendingMembers = users ? users.filter((u) => u.status === 'pending').length : 0;
  const suspendedMembers = users ? users.filter((u) => u.status === 'suspended').length : 0;
  const unpaidRegFeeMembers = users ? users.filter((u) => u.registrationFeeStatus === 'Unpaid').length : 0;
  const pendingIdCardMembers = users ? users.filter((u) => u.idCardStatus === 'Processing' || u.idCardStatus === 'Not Issued').length : 0;

  const totalSavings = savingsStats?.totalSavings || (users ? users.reduce((s, u) => s + (u.savingsBalance || 0), 0) : 0);
  const totalLoansDisbursed = loanStats?.totalDisbursedAmount || (loans ? loans.filter((l) => ['Disbursed', 'Completed', 'Defaulted'].includes(l.status)).reduce((s, l) => s + l.loanAmount, 0) : 0);
  const totalOutstandingLoans = loanStats?.totalOutstandingBalance || (loans ? loans.filter((l) => l.status === 'Disbursed').reduce((s, l) => s + l.outstandingBalance, 0) : 0);

  const totalDividendPool = Math.round(totalSavings * 0.08) || 50000000;

  const nairaAtRiskResult = useMemo(() => {
    return calculateCooperativeNairaAtRisk(users || [], savingsDeposits || [], totalDividendPool);
  }, [users, savingsDeposits, totalDividendPool]);

  // Member Status Statistics Filter Cards
  const memberStatusCards = [
    {
      id: 'status-total-roster',
      title: 'Total Roster',
      count: totalMembers,
      subtitle: 'Enrolled Members',
      icon: Users,
      colorClass: 'bg-[#014421] text-white border-[#DAA520]',
      badgeClass: 'bg-[#DAA520] text-[#014421]',
      onClick: () => onNavigate('member_registration', undefined, { status: 'all', regFee: 'all', idCard: 'all' }),
    },
    {
      id: 'status-active',
      title: 'Active Status',
      count: activeMembers,
      subtitle: 'In Good Standing',
      icon: CheckCircle2,
      colorClass: 'bg-emerald-900 text-white border-emerald-400',
      badgeClass: 'bg-emerald-400 text-emerald-950',
      onClick: () => onNavigate('member_registration', undefined, { status: 'active', regFee: 'all', idCard: 'all' }),
    },
    {
      id: 'status-pending',
      title: 'Pending Review',
      count: pendingMembers,
      subtitle: 'Awaiting Board',
      icon: Clock,
      colorClass: 'bg-amber-800 text-white border-amber-400',
      badgeClass: 'bg-amber-400 text-amber-950',
      onClick: () => onNavigate('member_registration', undefined, { status: 'pending', regFee: 'all', idCard: 'all' }),
    },
    {
      id: 'status-reg-fee-unpaid',
      title: 'Registration Fee Unpaid',
      count: unpaidRegFeeMembers,
      subtitle: 'Fee Outstanding',
      icon: CreditCard,
      colorClass: 'bg-rose-900 text-white border-rose-400',
      badgeClass: 'bg-rose-400 text-rose-950',
      onClick: () => onNavigate('member_registration', undefined, { status: 'all', regFee: 'Unpaid', idCard: 'all' }),
    },
    {
      id: 'status-id-cards-pending',
      title: 'ID Cards Pending',
      count: pendingIdCardMembers,
      subtitle: 'Processing / Pending',
      icon: BadgeCheck,
      colorClass: 'bg-blue-900 text-white border-blue-400',
      badgeClass: 'bg-blue-400 text-blue-950',
      onClick: () => onNavigate('member_registration', undefined, { status: 'all', regFee: 'all', idCard: 'Processing' }),
    },
    {
      id: 'status-suspended',
      title: 'Suspended',
      count: suspendedMembers,
      subtitle: 'Inactive Accounts',
      icon: XCircle,
      colorClass: 'bg-slate-900 text-white border-slate-600',
      badgeClass: 'bg-slate-700 text-slate-200',
      onClick: () => onNavigate('member_registration', undefined, { status: 'suspended', regFee: 'all', idCard: 'all' }),
    },
  ];

  // Dashboard Cards Definition
  const cards = [
    {
      id: 'card-members',
      title: 'Members',
      subtitle: 'Member Registration & Dossiers',
      metric: `${totalMembers} Members`,
      subMetric: `${activeMembers} Active • ${pendingMembers} Pending`,
      icon: Users,
      badge: 'Directory',
      bgColor: 'from-emerald-900 to-emerald-950',
      accentColor: 'text-emerald-600',
      borderColor: 'hover:border-emerald-500',
      onClick: () => onNavigate('member_registration'),
    },
    {
      id: 'card-savings',
      title: 'Savings',
      subtitle: 'Savings Ledger & Passbooks',
      metric: `₦${totalSavings.toLocaleString()}`,
      subMetric: `${savingsStats?.activeDepositorsCount || activeMembers} Active Depositors`,
      icon: PiggyBank,
      badge: 'Savings Module',
      bgColor: 'from-teal-900 to-emerald-950',
      accentColor: 'text-teal-600',
      borderColor: 'hover:border-teal-500',
      onClick: () => onNavigate('savings_management'),
    },
    {
      id: 'card-loans',
      title: 'Loans',
      subtitle: 'Loan Portfolio & Workflow',
      metric: `₦${totalLoansDisbursed.toLocaleString()}`,
      subMetric: `₦${totalOutstandingLoans.toLocaleString()} Outstanding`,
      icon: HandCoins,
      badge: 'Loan Module',
      bgColor: 'from-blue-900 to-indigo-950',
      accentColor: 'text-blue-600',
      borderColor: 'hover:border-blue-500',
      onClick: () => onNavigate('loan_management'),
    },
    {
      id: 'card-coop-wallet',
      title: 'Cooperative Wallet',
      subtitle: 'Master Income & Vault Ledger',
      metric: `₦${cooperativeWalletBalance.toLocaleString()}`,
      subMetric: 'Registration, Interest, Fines & Profits',
      icon: Building2,
      badge: 'Main Vault',
      bgColor: 'from-emerald-900 to-teal-950',
      accentColor: 'text-[#DAA520]',
      borderColor: 'hover:border-[#DAA520]',
      onClick: () => onNavigate('wallet_management', 'cooperative'),
    },
    {
      id: 'card-member-wallets',
      title: 'Member Wallets',
      subtitle: 'Individual Passbooks & Dividends',
      metric: `${totalMembers} Passbooks`,
      subMetric: 'Personal Savings & Dividend Records',
      icon: Wallet,
      badge: 'Member Wallets',
      bgColor: 'from-sky-900 to-blue-950',
      accentColor: 'text-sky-600',
      borderColor: 'hover:border-sky-500',
      onClick: () => onNavigate('wallet_management', 'members'),
    },
    {
      id: 'card-business',
      title: 'Business',
      subtitle: 'Commercial Ventures & Enterprises',
      metric: `₦${businessProfit.toLocaleString()}`,
      subMetric: 'Fleet, Supermarket, Housing & Agro',
      icon: Briefcase,
      badge: 'Business Mgmt',
      bgColor: 'from-purple-900 to-indigo-950',
      accentColor: 'text-purple-600',
      borderColor: 'hover:border-purple-500',
      onClick: () => onNavigate('commercial_ventures'),
    },
    {
      id: 'card-reports',
      title: 'Reports',
      subtitle: 'Financial Statements & Audit',
      metric: 'Statutory Reports',
      subMetric: 'Trial Balance & Financial Statements',
      icon: BarChart3,
      badge: 'Reports Page',
      bgColor: 'from-slate-900 to-slate-950',
      accentColor: 'text-slate-600',
      borderColor: 'hover:border-slate-500',
      onClick: () => onNavigate('reports_analytics', 'financial_statements'),
    },
    {
      id: 'card-dividend',
      title: 'Dividend',
      subtitle: 'Surplus Distribution Engine',
      metric: `₦${totalDividendPool.toLocaleString()}`,
      subMetric: '8% Annual Surplus Payout Pool',
      icon: Coins,
      badge: 'Dividend Module',
      bgColor: 'from-amber-900 to-amber-950',
      accentColor: 'text-amber-500',
      borderColor: 'hover:border-amber-400',
      onClick: () => onNavigate('dividend_distribution'),
    },
    {
      id: 'card-naira-at-risk',
      title: 'Naira At Risk',
      subtitle: 'Guarantor Gap & Default Risk',
      metric: `₦${(nairaAtRiskResult?.cooperativeTotalNairaAtRisk || 0).toLocaleString()}`,
      subMetric: `${nairaAtRiskResult?.memberList?.length || 0} Accounts Monitored`,
      icon: ShieldAlert,
      badge: 'Naira At Risk Report',
      bgColor: 'from-rose-900 to-red-950',
      accentColor: 'text-rose-600',
      borderColor: 'hover:border-rose-500',
      onClick: () => onNavigate('reports_analytics', 'naira_at_risk_dividend'),
    },
    {
      id: 'card-finsec-approval',
      title: 'FinSec Approval Queue',
      subtitle: 'Pending Treasurer Submissions & Inbox',
      metric: 'Pending Approvals',
      subMetric: 'Verify payments, auto-split fees & member registration',
      icon: FileCheck,
      badge: 'FinSec Inbox',
      bgColor: 'from-amber-900 to-[#1B2A41]',
      accentColor: 'text-amber-500',
      borderColor: 'hover:border-amber-400',
      onClick: () => onNavigate('finsec_approval'),
    },
    {
      id: 'card-settings',
      title: 'Settings',
      subtitle: 'Administrator & System Security',
      metric: 'RBAC & Security',
      subMetric: '2FA, Credentials & System Parameters',
      icon: Settings,
      badge: 'Admin Settings',
      bgColor: 'from-gray-900 to-slate-950',
      accentColor: 'text-amber-400',
      borderColor: 'hover:border-amber-500',
      onClick: () => onNavigate('settings'),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Executive Welcome Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#014421] via-emerald-900 to-[#012d15] text-white shadow-xl relative overflow-hidden border-2 border-[#DAA520]">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-80 h-80 rounded-full bg-[#DAA520]/10 blur-3xl" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className="shrink-0 hidden sm:block">
              <CoopLogo size="lg" showText={false} />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#DAA520] text-[#014421] font-black text-xs uppercase tracking-wider mb-2 shadow-sm">
                <ShieldCheck className="w-4 h-4" />
                Lightway Cooperative Management Hub
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
                Welcome back, {currentUser?.fullName || 'Mr. Ige Ebenezer'}
              </h1>
              <div className="flex flex-wrap items-center gap-2 my-2 text-xs">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 text-amber-300 border border-amber-400/40 font-bold flex items-center gap-1">
                  <BadgeCheck className="w-3.5 h-3.5 text-amber-400" />
                  {currentUser?.role === 'sys_admin' ? 'Founder / Super Administrator / Financial Secretary' : (currentUser?.occupation || currentUser?.role)}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-100 border border-emerald-700/60 font-medium">
                  Cooperative: Lightway Cooperative Society
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-100 border border-emerald-700/60 font-medium">
                  Branch: {currentUser?.branch || 'Iwo Main Branch'}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 text-emerald-100 border border-emerald-700/60 font-medium">
                  State: {currentUser?.state || 'Osun State'}
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-1 max-w-2xl font-medium leading-relaxed">
                Live operational dashboard active. Monitor cooperative solvency, daily savings deposits, 6-step loan approvals, main cooperative wallet, member passbooks, commercial ventures, and statutory audit reports.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('my_profile')}
              className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#014421] font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <UserIcon className="w-4 h-4" />
              My Profile
            </button>
            {onNavigateToPermissions && (
              <button
                onClick={onNavigateToPermissions}
                className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs border border-emerald-600 shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Settings className="w-4 h-4" />
                Permissions
              </button>
            )}
            {onNavigateToSchema && (
              <button
                onClick={onNavigateToSchema}
                className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs border border-emerald-600 shadow-md transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-[#DAA520]" />
                System Schemas
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Member Roster & Status Statistics Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#1B2A41] dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-[#014421] dark:text-emerald-400" />
              Member Roster & Status Overview
            </h2>
            <p className="text-xs text-[#495057] dark:text-slate-300 font-normal mt-0.5">
              Click any status card below to open the complete member roster pre-filtered by status.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {memberStatusCards.map((sc) => {
            const Icon = sc.icon;
            return (
              <div
                key={sc.id}
                onClick={sc.onClick}
                tabIndex={0}
                role="button"
                aria-label={`Open member list for ${sc.title}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    sc.onClick();
                  }
                }}
                className={`p-4 rounded-2xl border-2 transition-all cursor-pointer shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] flex flex-col justify-between ${sc.colorClass}`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <Icon className="w-4 h-4 opacity-90" />
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${sc.badgeClass}`}>
                      Filter
                    </span>
                  </div>
                  <div className="text-xs font-black uppercase tracking-wider opacity-90 leading-tight">
                    {sc.title}
                  </div>
                  <div className="text-2xl font-black mt-1 tracking-tight">
                    {sc.count}
                  </div>
                </div>
                <div className="text-[11px] mt-2 font-bold opacity-80 flex items-center justify-between pt-1 border-t border-white/20">
                  <span>{sc.subtitle}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Live Statistics Section Banner */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <h2 className="text-lg font-semibold text-[#1B2A41] dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#014421] dark:text-emerald-400" />
            Live Dashboard Menu & Operational Cards
          </h2>
          <p className="text-xs text-[#495057] dark:text-slate-300 font-normal mt-0.5">
            Click any card to navigate directly to its corresponding module.
          </p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-[#0F5132] dark:text-emerald-300 rounded-full border border-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live Real-Time Data Sync
        </span>
      </div>

      {/* 10-Card Interactive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={card.onClick}
              className={`group relative bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 p-5 shadow-xs transition-all duration-200 cursor-pointer ${card.borderColor} hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] overflow-hidden flex flex-col justify-between`}
              tabIndex={0}
              role="button"
              aria-label={`Navigate to ${card.title}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  card.onClick();
                }
              }}
            >
              {/* Top Card Bar */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className={`p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#014421] dark:text-emerald-400 group-hover:bg-[#014421] group-hover:text-[#DAA520] transition-colors shadow-2xs`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[#495057] dark:text-slate-300 text-[10px] font-medium uppercase tracking-wider group-hover:bg-[#DAA520] group-hover:text-[#014421] transition-colors">
                    {card.badge}
                  </span>
                </div>

                <div className="text-xs font-semibold uppercase text-[#0F5132] dark:text-emerald-400 tracking-wider">
                  {card.title}
                </div>

                <div className="text-xl sm:text-2xl font-bold text-[#1B2A41] dark:text-white mt-1 tracking-tight stat-number">
                  {card.metric}
                </div>

                <p className="text-xs font-normal text-[#495057] dark:text-slate-300 mt-1 line-clamp-1">
                  {card.subMetric}
                </p>
              </div>

              {/* Bottom Action Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-[#0F5132] dark:text-emerald-400 group-hover:text-amber-600 transition-colors">
                <span>Open {card.title} Module</span>
                <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
