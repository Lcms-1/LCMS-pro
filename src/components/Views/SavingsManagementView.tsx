import React, { useState, useMemo } from 'react';
import {
  PiggyBank,
  Plus,
  Search,
  Calendar,
  Filter,
  Printer,
  TrendingUp,
  Wallet,
  FileText,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Info,
  Coins,
  Building,
  CreditCard,
  UserCheck,
  RefreshCw,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import {
  User,
  UserRole,
  SavingsDeposit,
  DailySavingsAggregation,
  SavingsSummaryStats,
  PaymentMethod,
} from '../../types';
import { AlertMessage } from '../AlertMessage';
import { CoopLogo } from '../CoopLogo';
import { apiUrl } from '../../utils/apiClient';

interface SavingsManagementViewProps {
  users: User[];
  currentUserRole?: UserRole;
  currentUserName?: string;
  currentUserId?: string;
  deposits: SavingsDeposit[];
  stats: SavingsSummaryStats;
  dailyAggregations: DailySavingsAggregation[];
  onRecordDeposit: (depositData: Partial<SavingsDeposit>) => Promise<{ success: boolean; message: string; error?: string }>;
  onRefreshData?: () => void;
}

export const SavingsManagementView: React.FC<SavingsManagementViewProps> = ({
  users,
  currentUserRole = 'sys_admin',
  currentUserName = 'Mr. Ige Ebenezer',
  currentUserId = 'usr_admin01',
  deposits = [],
  stats,
  dailyAggregations = [],
  onRecordDeposit,
  onRefreshData,
}) => {
  // Main view tab
  const [activeTab, setActiveTab] = useState<'deposits_ledger' | 'daily_aggregations' | 'member_balances' | 'future_integrations'>('deposits_ledger');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [selectedMemberNo, setSelectedMemberNo] = useState<string>('all');

  // Modal states
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [statementMemberNo, setStatementMemberNo] = useState<string>('');
  const [statementData, setStatementData] = useState<any>(null);
  const [isLoadingStatement, setIsLoadingStatement] = useState(false);

  // New Deposit Form state
  const [depositForm, setDepositForm] = useState({
    memberNo: '',
    depositDate: new Date().toISOString().split('T')[0],
    amount: '',
    paymentMethod: 'Bank Transfer' as PaymentMethod,
    referenceNumber: '',
    receivedBy: currentUserName,
    notes: '',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Minimum Savings Transaction Rule Confirmation State
  const [minimumFeeConfirmation, setMinimumFeeConfirmation] = useState<{
    amount: number;
    fee: number;
    totalPayable: number;
    depositData: Partial<SavingsDeposit>;
  } | null>(null);

  // Expanded daily aggregation row
  const [expandedAggrKey, setExpandedAggrKey] = useState<string | null>(null);

  // Active members for selection dropdown
  const activeMembers = useMemo(() => {
    return users.filter((u) => u.status === 'active');
  }, [users]);

  // Generate reference number helper
  const handleAutoGenerateRef = () => {
    const prefixMap: Record<PaymentMethod, string> = {
      'Bank Transfer': 'TRF',
      'Cash Deposit': 'CSH',
      'POS': 'POS',
      'Direct Payroll Deduction': 'PAYROLL',
      'Cheque': 'CHQ',
      'Mobile Transfer': 'MOB',
    };
    const prefix = prefixMap[depositForm.paymentMethod] || 'SAV';
    const dateStr = depositForm.depositDate.replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    setDepositForm((prev) => ({
      ...prev,
      referenceNumber: `${prefix}-${dateStr}-${rand}`,
    }));
  };

  // Filtered deposits
  const filteredDeposits = useMemo(() => {
    return deposits.filter((dep) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        dep.memberNo.toLowerCase().includes(q) ||
        dep.memberName.toLowerCase().includes(q) ||
        dep.referenceNumber.toLowerCase().includes(q) ||
        dep.receivedBy.toLowerCase().includes(q) ||
        dep.depositDate.includes(q);

      const matchesDate = !dateFilter || dep.depositDate === dateFilter;
      const matchesMethod = paymentMethodFilter === 'all' || dep.paymentMethod === paymentMethodFilter;
      const matchesMember = selectedMemberNo === 'all' || dep.memberNo === selectedMemberNo;

      return matchesSearch && matchesDate && matchesMethod && matchesMember;
    });
  }, [deposits, searchTerm, dateFilter, paymentMethodFilter, selectedMemberNo]);

  // Same-day multiple deposit warning indicator for selected form member
  const sameDayFormCheck = useMemo(() => {
    if (!depositForm.memberNo || !depositForm.depositDate) return null;
    const existing = deposits.filter(
      (d) => d.memberNo.toLowerCase() === depositForm.memberNo.toLowerCase() && d.depositDate === depositForm.depositDate
    );
    if (existing.length > 0) {
      const totalSoFar = existing.reduce((s, e) => s + e.amount, 0);
      return {
        count: existing.length,
        totalSoFar,
      };
    }
    return null;
  }, [depositForm.memberNo, depositForm.depositDate, deposits]);

  // Helper to execute post deposit API call
  const executePostDeposit = async (payload: Partial<SavingsDeposit>) => {
    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const res = await onRecordDeposit(payload);

      if (res.success) {
        setFormSuccess(res.message);
        setMinimumFeeConfirmation(null);
        setTimeout(() => {
          setIsDepositModalOpen(false);
          setDepositForm({
            memberNo: '',
            depositDate: new Date().toISOString().split('T')[0],
            amount: '',
            paymentMethod: 'Bank Transfer',
            referenceNumber: '',
            receivedBy: currentUserName,
            notes: '',
          });
          setFormSuccess(null);
        }, 1500);
      } else {
        setFormError(res.error || res.message || 'Failed to record deposit.');
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred while saving the deposit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Form Submit
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!depositForm.memberNo) {
      setFormError('Please select or enter a valid Membership Number.');
      return;
    }

    const numAmount = parseFloat(depositForm.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Please enter a valid deposit amount greater than ₦0.');
      return;
    }

    if (!depositForm.referenceNumber.trim()) {
      setFormError('Reference Number is mandatory.');
      return;
    }

    if (!depositForm.receivedBy.trim()) {
      setFormError('Received By field is required.');
      return;
    }

    // Verify member and registration fee status
    const selectedMember = users.find((u) => u.memberNo.toLowerCase() === depositForm.memberNo.toLowerCase());
    const isUnpaidRegFee = selectedMember && selectedMember.registrationFeeStatus !== 'Paid' && selectedMember.registrationFeeStatus !== 'Waived';

    if (selectedMember && selectedMember.status !== 'active' && !isUnpaidRegFee) {
      setFormError(`Member '${selectedMember.fullName}' is ${selectedMember.status.toUpperCase()}. Deposits are strictly permitted for Active members only.`);
      return;
    }

    if (isUnpaidRegFee) {
      if (numAmount < 2500) {
        setFormError('First payment must be at least ₦2,500 to cover the registration fee.');
        return;
      }

      // First deposit for new member: Post directly to execute auto deduction of ₦2,500 registration fee
      await executePostDeposit({
        memberNo: depositForm.memberNo,
        depositDate: depositForm.depositDate,
        amount: numAmount,
        transactionFee: 0,
        paymentMethod: depositForm.paymentMethod,
        referenceNumber: depositForm.referenceNumber,
        receivedBy: depositForm.receivedBy,
        notes: depositForm.notes,
      });
      return;
    }

    // Minimum Savings Rule Enforcement:
    // If savings amount is less than ₦5,000, do not post immediately. Prompt for confirmation.
    if (numAmount < 5000) {
      const fee = 50;
      const totalPayable = numAmount + fee;
      setMinimumFeeConfirmation({
        amount: numAmount,
        fee,
        totalPayable,
        depositData: {
          memberNo: depositForm.memberNo,
          depositDate: depositForm.depositDate,
          amount: numAmount,
          transactionFee: fee,
          paymentMethod: depositForm.paymentMethod,
          referenceNumber: depositForm.referenceNumber,
          receivedBy: depositForm.receivedBy,
          notes: depositForm.notes,
        },
      });
      return;
    }

    // Amount >= 5,000: post directly
    await executePostDeposit({
      memberNo: depositForm.memberNo,
      depositDate: depositForm.depositDate,
      amount: numAmount,
      transactionFee: 0,
      paymentMethod: depositForm.paymentMethod,
      referenceNumber: depositForm.referenceNumber,
      receivedBy: depositForm.receivedBy,
      notes: depositForm.notes,
    });
  };

  // Fetch and show printable savings statement
  const handleOpenStatement = async (memberNo: string) => {
    setStatementMemberNo(memberNo);
    setIsLoadingStatement(true);
    setIsStatementModalOpen(true);
    setStatementData(null);

    try {
      const res = await fetch(apiUrl(`/api/savings/statement/${encodeURIComponent(memberNo)}`));
      const data = await res.json();
      if (res.ok && data.success && data.statement) {
        setStatementData(data.statement);
      } else {
        alert(data.error || 'Unable to load member savings statement.');
      }
    } catch (err) {
      alert('Network error while generating savings statement.');
    } finally {
      setIsLoadingStatement(false);
    }
  };

  // Print Statement Handler
  const handlePrintStatement = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <PiggyBank className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Savings Management Module
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Passbook Deposits, Daily Combined Aggregations & Naira at Risk Engine Readiness
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {onRefreshData && (
            <button
              onClick={onRefreshData}
              className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
              title="Refresh Savings Ledger"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => {
              setIsDepositModalOpen(true);
              setFormError(null);
              setFormSuccess(null);
              handleAutoGenerateRef();
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-sm rounded-xl shadow-sm hover:shadow transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Deposit</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Savings */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Total Savings Pool</span>
            <Wallet className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            ₦{(stats?.totalSavings || 0).toLocaleString()}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Across {stats?.activeDepositorsCount || 0} Active Member Passbooks</span>
          </div>
        </div>

        {/* Monthly Savings */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Current Month Savings</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            ₦{(stats?.monthlySavings || 0).toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            July 2026 Monthly Contributions
          </div>
        </div>

        {/* Yearly Savings */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Year-to-Date Savings</span>
            <Building className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            ₦{(stats?.yearlySavings || 0).toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
            2026 Total Ledger Accumulation
          </div>
        </div>

        {/* Daily Combined Aggregations (Naira at Risk) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <span>Same-Day Multi-Deposits</span>
            <Layers className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats?.sameDayAggregationsCount || 0} <span className="text-xs font-normal text-slate-500">days</span>
          </div>
          <div className="mt-2 text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Auto-combined for Naira at Risk Engine</span>
          </div>
        </div>
      </div>

      {/* Main Module Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 dark:border-slate-800 px-6 pt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTab('deposits_ledger')}
            className={`pb-3.5 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'deposits_ledger'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>Savings Deposits Ledger</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {filteredDeposits.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('daily_aggregations')}
            className={`pb-3.5 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'daily_aggregations'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Daily Combined Totals (Naira at Risk)</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-medium">
              {dailyAggregations.filter((a) => a.depositCount > 1).length} Multi-Days
            </span>
          </button>

          <button
            onClick={() => setActiveTab('member_balances')}
            className={`pb-3.5 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'member_balances'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Member Passbook Balances</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {activeMembers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('future_integrations')}
            className={`pb-3.5 px-4 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'future_integrations'
                ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Integration Hub (Loan, Dividend & Risk Engine)</span>
          </button>
        </div>

        {/* TAB 1: SAVINGS DEPOSITS LEDGER */}
        {activeTab === 'deposits_ledger' && (
          <div className="p-6 space-y-4">
            {/* Search & Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Member No, Name, Ref No..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white"
                />
              </div>

              {/* Date Filter */}
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white"
                />
              </div>

              {/* Payment Method Filter */}
              <div>
                <select
                  value={paymentMethodFilter}
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white"
                >
                  <option value="all">All Payment Methods</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash Deposit">Cash Deposit</option>
                  <option value="POS">POS</option>
                  <option value="Direct Payroll Deduction">Direct Payroll Deduction</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Mobile Transfer">Mobile Transfer</option>
                </select>
              </div>

              {/* Member Filter */}
              <div>
                <select
                  value={selectedMemberNo}
                  onChange={(e) => setSelectedMemberNo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white"
                >
                  <option value="all">All Active Members</option>
                  {activeMembers.map((m) => (
                    <option key={m.id} value={m.memberNo}>
                      {m.memberNo} - {m.fullName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || dateFilter || paymentMethodFilter !== 'all' || selectedMemberNo !== 'all') && (
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
                <span>Showing {filteredDeposits.length} filtered deposit records</span>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setDateFilter('');
                    setPaymentMethodFilter('all');
                    setSelectedMemberNo('all');
                  }}
                  className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Clear filters
                </button>
              </div>
            )}

            {/* Deposits Table */}
            <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Deposit Date</th>
                    <th className="py-3.5 px-4">Member Details</th>
                    <th className="py-3.5 px-4">Amount (₦)</th>
                    <th className="py-3.5 px-4">Payment Method</th>
                    <th className="py-3.5 px-4">Reference No</th>
                    <th className="py-3.5 px-4">Received By</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                  {filteredDeposits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400">
                        No savings deposit records matched your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredDeposits.map((dep) => {
                      // Check if there were multiple deposits on this same day for this member
                      const sameDayCount = deposits.filter(
                        (d) => d.memberNo === dep.memberNo && d.depositDate === dep.depositDate
                      ).length;

                      return (
                        <tr
                          key={dep.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                            {dep.depositDate}
                            {sameDayCount > 1 && (
                              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                                Same-day #{sameDayCount}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 dark:text-white">{dep.memberName}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">{dep.memberNo}</div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-base">
                              ₦{dep.amount.toLocaleString()}
                            </span>
                            {(dep.transactionFee || 0) > 0 || dep.amount < 5000 ? (
                              <div className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-0.5" title="₦50 transaction fee recorded separately for proper accounting">
                                <span>+₦50 Fee (Total: ₦{(dep.amount + (dep.transactionFee || 50)).toLocaleString()})</span>
                              </div>
                            ) : null}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                              <CreditCard className="w-3 h-3 text-emerald-500" />
                              {dep.paymentMethod}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-xs font-mono text-slate-600 dark:text-slate-300">
                            {dep.referenceNumber}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                            {dep.receivedBy}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => handleOpenStatement(dep.memberNo)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Passbook Statement</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: DAILY COMBINED TOTALS (NAIRA AT RISK ENGINE) */}
        {activeTab === 'daily_aggregations' && (
          <div className="p-6 space-y-4">
            <AlertMessage
              type="info"
              title="Requirement #4 Compliance: Same-Day Multiple Deposit Aggregation"
              message="When a member makes multiple savings deposits on the same calendar day, LCMS PRO automatically combines them into a single daily total log. This daily combined total serves as the core input parameter for future Naira at Risk Engine liquidity and volatility calculations."
            />

            <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Member Name & No</th>
                    <th className="py-3.5 px-4">Deposit Count</th>
                    <th className="py-3.5 px-4">Daily Combined Total (₦)</th>
                    <th className="py-3.5 px-4">Naira at Risk Weight Factor</th>
                    <th className="py-3.5 px-4">Receiving Officers</th>
                    <th className="py-3.5 px-4 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                  {dailyAggregations.map((aggr) => {
                    const aggrKey = `${aggr.memberNo}_${aggr.date}`;
                    const isExpanded = expandedAggrKey === aggrKey;
                    const memberDeposits = deposits.filter(
                      (d) => d.memberNo === aggr.memberNo && d.depositDate === aggr.date
                    );

                    return (
                      <React.Fragment key={aggrKey}>
                        <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 px-4 whitespace-nowrap text-slate-800 dark:text-slate-200 font-semibold">
                            {aggr.date}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">{aggr.memberName}</div>
                            <div className="text-xs text-slate-500 font-mono">{aggr.memberNo}</div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {aggr.depositCount > 1 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                                <Layers className="w-3 h-3" />
                                {aggr.depositCount} Deposits Combined
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                1 Deposit
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-extrabold text-slate-900 dark:text-white text-base">
                              ₦{aggr.totalAmount.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-mono text-xs font-semibold px-2 py-1 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 rounded-lg border border-purple-200 dark:border-purple-800">
                              Risk Score: {aggr.nairaAtRiskWeight.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                            {aggr.receivedByOfficers.join(', ')}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {aggr.depositCount > 1 && (
                              <button
                                onClick={() => setExpandedAggrKey(isExpanded ? null : aggrKey)}
                                className="inline-flex items-center gap-1 text-xs text-amber-700 dark:text-amber-300 font-semibold hover:underline"
                              >
                                {isExpanded ? (
                                  <>
                                    <span>Hide Breakdown</span>
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </>
                                ) : (
                                  <>
                                    <span>View Individual Deposits</span>
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>

                        {/* Expanded same-day breakdown */}
                        {isExpanded && memberDeposits.length > 0 && (
                          <tr className="bg-amber-50/50 dark:bg-amber-950/20">
                            <td colSpan={7} className="p-4 border-t border-slate-200/80 dark:border-slate-800">
                              <div className="text-xs font-bold text-amber-900 dark:text-amber-100 uppercase tracking-wider mb-2">
                                Individual Same-Day Deposits for {aggr.memberName} on {aggr.date}:
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {memberDeposits.map((subDep, idx) => (
                                  <div
                                    key={subDep.id}
                                    className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-amber-200 dark:border-amber-800/80 text-xs space-y-1 shadow-sm"
                                  >
                                    <div className="flex items-center justify-between font-semibold">
                                      <span className="text-slate-500">Deposit #{idx + 1}</span>
                                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                        ₦{subDep.amount.toLocaleString()}
                                      </span>
                                    </div>
                                    <div className="text-slate-700 dark:text-slate-300">
                                      <span className="font-medium">Method:</span> {subDep.paymentMethod}
                                    </div>
                                    <div className="text-slate-600 dark:text-slate-400 font-mono">
                                      <span className="font-medium">Ref:</span> {subDep.referenceNumber}
                                    </div>
                                    <div className="text-slate-500 text-[11px]">
                                      Received by {subDep.receivedBy} ({subDep.notes || 'N/A'})
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: MEMBER PASSBOOK BALANCES */}
        {activeTab === 'member_balances' && (
          <div className="p-6 space-y-4">
            <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Member No</th>
                    <th className="py-3.5 px-4">Full Name</th>
                    <th className="py-3.5 px-4">Branch</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Current Savings Balance (₦)</th>
                    <th className="py-3.5 px-4">Loan Eligibility (3x Limit)</th>
                    <th className="py-3.5 px-4 text-right">Statement Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                  {users.map((member) => {
                    const balance = member.savingsBalance || 0;
                    const loanLimit = balance * 3;

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {member.memberNo}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{member.fullName}</div>
                          <div className="text-xs text-slate-500">{member.phone}</div>
                        </td>
                        <td className="py-3.5 px-4 text-xs text-slate-600 dark:text-slate-300">
                          {member.branch}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {member.status === 'active' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                              <UserCheck className="w-3 h-3" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              {member.status.toUpperCase()}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-emerald-600 dark:text-emerald-400 text-base">
                          ₦{balance.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                          ₦{loanLimit.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleOpenStatement(member.memberNo)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 rounded-lg border border-emerald-200 dark:border-emerald-800"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Statement</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4: FUTURE INTEGRATION HUB */}
        {activeTab === 'future_integrations' && (
          <div className="p-6 space-y-6">
            <div className="bg-purple-50 dark:bg-purple-950/40 p-5 rounded-2xl border border-purple-200 dark:border-purple-800/60">
              <h3 className="text-base font-bold text-purple-900 dark:text-purple-100 flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Savings Module Future System Integrations
              </h3>
              <p className="text-xs sm:text-sm text-purple-800 dark:text-purple-300">
                This Savings Module is fully structured and prepared with exposed hooks, database column schema tags, and real-time calculation payloads for seamless integration with downstream LCMS PRO phase 2 modules.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 1. Loan Module Preparedness */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 w-fit">
                  <CreditCard className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Loan Module Integration</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Automatically calculates 200%–300% max borrowing capacity based on active savings balance and checks guarantor savings encumbrance limits.
                </p>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs space-y-1 font-mono">
                  <div className="text-slate-500">Max Loan Capacity Rule: 3.0x Savings</div>
                  <div className="font-semibold text-blue-600 dark:text-blue-400">
                    System Pool Borrowing Limit: ₦{((stats?.totalSavings || 0) * 3).toLocaleString()}
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Ready for Loan Module
                </div>
              </div>

              {/* 2. Dividend Module Preparedness */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 w-fit">
                  <Coins className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Dividend Module Integration</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tracks weighted average monthly savings balances per member to feed into annual surplus and dividend distribution algorithms.
                </p>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs space-y-1 font-mono">
                  <div className="text-slate-500">Qualifying Savings Pool: ₦{(stats?.totalSavings || 0).toLocaleString()}</div>
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                    Dividend Weighting Factor: Active
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Ready for Dividend Module
                </div>
              </div>

              {/* 3. Naira at Risk Engine */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3 shadow-sm">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 w-fit">
                  <Layers className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base">Naira at Risk Engine Integration</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Aggregates same-day multi-deposits into single daily totals per member, applying daily volatility weights to assess liquidity exposure.
                </p>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs space-y-1 font-mono">
                  <div className="text-slate-500">Same-Day Aggregation Logs: {dailyAggregations.length} Days</div>
                  <div className="font-semibold text-amber-600 dark:text-amber-400">
                    Risk Engine Payload: Structured & Live
                  </div>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Ready for Risk Engine
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: RECORD NEW SAVINGS DEPOSIT */}
      {isDepositModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer flex items-center gap-1 text-xs font-bold"
                  title="Return to savings list (Back ←)"
                  aria-label="Back button"
                >
                  <ArrowLeft className="w-5 h-5 text-emerald-600" />
                </button>
                <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <PiggyBank className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">Record Member Savings Deposit</h3>
                  <p className="text-xs text-slate-500">Post a new passbook contribution record</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDepositModalOpen(false)}
                className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg cursor-pointer"
                title="Close modal (✕)"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <AlertMessage
                type="error"
                title="Deposit Entry Error"
                message={formError}
                onClose={() => setFormError(null)}
              />
            )}

            {formSuccess && (
              <AlertMessage
                type="success"
                title="Deposit Success"
                message={formSuccess}
                onClose={() => setFormSuccess(null)}
              />
            )}

            {minimumFeeConfirmation ? (
              <div className="bg-amber-50 dark:bg-amber-950/60 p-5 rounded-2xl border-2 border-amber-300 dark:border-amber-700 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/80 rounded-xl text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-amber-950 dark:text-amber-200 text-sm">
                      Lightway Cooperative Minimum Savings Rule
                    </h4>
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-300 mt-1 leading-snug">
                      "Savings below ₦5,000 require an additional ₦50 transaction charge. Total amount payable is ₦{minimumFeeConfirmation.totalPayable.toLocaleString()}."
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-800 text-xs space-y-2.5 font-mono">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Target Member:</span>
                    <span className="font-semibold text-slate-900 dark:text-white font-sans">
                      {users.find((u) => u.memberNo.toLowerCase() === depositForm.memberNo.toLowerCase())?.fullName || depositForm.memberNo} ({depositForm.memberNo})
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Actual Savings Amount (Credited to Passbook & Risk Engine):</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">₦{minimumFeeConfirmation.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-amber-700 dark:text-amber-300">
                    <span>Transaction Charge (Recorded Separately for Accounting):</span>
                    <span className="font-bold">₦{minimumFeeConfirmation.fee.toLocaleString()}</span>
                  </div>
                  <div className="border-t border-slate-200 dark:border-slate-800 pt-2 flex justify-between text-sm font-extrabold text-slate-900 dark:text-white">
                    <span>Total Amount Payable:</span>
                    <span className="text-emerald-600 dark:text-emerald-400">₦{minimumFeeConfirmation.totalPayable.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setMinimumFeeConfirmation(null)}
                    className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-300 dark:border-slate-700 transition-colors"
                  >
                    Cancel Transaction
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => executePostDeposit(minimumFeeConfirmation.depositData)}
                    className="w-full sm:w-auto px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>Posting Deposit...</span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirm Total Payment (₦{minimumFeeConfirmation.totalPayable.toLocaleString()})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleDepositSubmit} className="space-y-4 text-sm">
              {/* Member Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Active Member <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={depositForm.memberNo}
                  onChange={(e) => {
                    setDepositForm((prev) => ({ ...prev, memberNo: e.target.value }));
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white"
                >
                  <option value="">-- Select Active Member --</option>
                  {activeMembers.map((m) => (
                    <option key={m.id} value={m.memberNo}>
                      {m.memberNo} - {m.fullName} ({m.branch})
                    </option>
                  ))}
                </select>
              </div>

              {/* Same day warning banner if member already has deposits today */}
              {sameDayFormCheck && (
                <AlertMessage
                  type="warning"
                  title="Same-Day Deposit Detected!"
                  message={`Member already has ${sameDayFormCheck.count} deposit(s) today totalling ₦${sameDayFormCheck.totalSoFar.toLocaleString()}. This new deposit will be automatically combined into today's daily total for the Naira at Risk Engine.`}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Deposit Date */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Deposit Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={depositForm.depositDate}
                    onChange={(e) => setDepositForm((prev) => ({ ...prev, depositDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Deposit Amount (₦) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 50000"
                    value={depositForm.amount}
                    onChange={(e) => setDepositForm((prev) => ({ ...prev, amount: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white font-semibold"
                  />
                  {parseFloat(depositForm.amount) > 0 && parseFloat(depositForm.amount) < 5000 && (
                    <p className="mt-1 text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      <span>Minimum savings rule: +₦50 charge applies (Total: ₦{(parseFloat(depositForm.amount) + 50).toLocaleString()})</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    value={depositForm.paymentMethod}
                    onChange={(e) => {
                      const pm = e.target.value as PaymentMethod;
                      setDepositForm((prev) => ({ ...prev, paymentMethod: pm }));
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash Deposit">Cash Deposit</option>
                    <option value="POS">POS</option>
                    <option value="Direct Payroll Deduction">Direct Payroll Deduction</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Mobile Transfer">Mobile Transfer</option>
                  </select>
                </div>

                {/* Reference Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Reference Number <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleAutoGenerateRef}
                      className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                    >
                      Auto Generate
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TRF-20260727-8821"
                    value={depositForm.referenceNumber}
                    onChange={(e) => setDepositForm((prev) => ({ ...prev, referenceNumber: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white font-mono text-xs"
                  />
                </div>
              </div>

              {/* Received By */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Received / Processed By <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Officer name & title"
                  value={depositForm.receivedBy}
                  onChange={(e) => setDepositForm((prev) => ({ ...prev, receivedBy: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white text-xs"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Transaction Notes / Remark
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional memo or description..."
                  value={depositForm.notes}
                  onChange={(e) => setDepositForm((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-white text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Posting Deposit...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Post Savings Deposit</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
          </div>
        </div>
      )}

      {/* MODAL 2: PRINTABLE SAVINGS STATEMENT - FULL SCREEN BANKING PANEL */}
      {isStatementModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900 text-slate-100 flex flex-col h-screen w-screen overflow-hidden print:p-0 print:bg-white print:static print:h-auto print:w-auto">
          {/* Fixed Top Header Bar (Banking App Style) */}
          <div className="sticky top-0 z-50 bg-[#014421] text-white px-4 py-3 sm:px-6 sm:py-4 border-b-2 border-[#DAA520]/60 flex items-center justify-between shadow-lg shrink-0 print:hidden">
            {/* Top-Left Fixed Back Button */}
            <button
              type="button"
              onClick={() => setIsStatementModalOpen(false)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-[#DAA520] active:scale-95 shadow-xs"
              title="Return to savings ledger (Back ←)"
              aria-label="Back button"
            >
              <ArrowLeft className="w-4 h-4 text-[#DAA520]" />
              <span>Back</span>
            </button>

            {/* Center Title Header */}
            <div className="flex items-center gap-2 font-extrabold text-sm sm:text-base text-amber-300">
              <BookOpen className="w-5 h-5 text-[#DAA520] hidden xs:inline" />
              <span>Savings Passbook</span>
            </div>

            {/* Right Action & Fixed Top-Right Close (✕) Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrintStatement}
                disabled={isLoadingStatement || !statementData}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer border border-emerald-400/40"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print Statement</span>
              </button>

              <button
                onClick={() => setIsStatementModalOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition-all cursor-pointer border border-white/20 active:scale-95"
                title="Close passbook panel (✕)"
                aria-label="Close passbook modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Passbook Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 max-w-5xl mx-auto w-full my-0 print:p-0 print:bg-white print:text-black">
            {isLoadingStatement ? (
              <div className="py-16 text-center text-slate-500 dark:text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
                <p>Generating Member Savings Statement & Passbook Ledger...</p>
              </div>
            ) : !statementData ? (
              <div className="py-12 text-center text-slate-500">
                Failed to load statement details.
              </div>
            ) : (
              <div className="space-y-6 text-slate-800 dark:text-slate-200 print:text-black">
                {/* Official Letterhead */}
                <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
                  <CoopLogo size="lg" showText variant="dark" />

                  <div className="text-right sm:text-right shrink-0">
                    <span className="inline-block px-3 py-1 bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs rounded uppercase tracking-wider print:border print:border-black print:text-black print:bg-white">
                      Official Passbook Statement
                    </span>
                    <p className="text-[11px] text-slate-400 mt-1 font-mono print:text-gray-500">
                      Generated: {statementData.generatedAt}
                    </p>
                  </div>
                </div>

                {/* Member Bio & Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs print:bg-gray-50 print:border-gray-300">
                  <div className="space-y-1.5">
                    <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      Member Profile
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900 dark:text-white print:text-black">
                        {statementData.memberInfo.fullName}
                      </span>
                    </div>
                    <div>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold print:text-black">
                        Membership No: {statementData.memberInfo.memberNo}
                      </span>
                    </div>
                    <div>Branch: {statementData.memberInfo.branch}</div>
                    <div>Phone: {statementData.memberInfo.phone}</div>
                    <div>Status: <span className="font-semibold uppercase">{statementData.memberInfo.status}</span></div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                      Savings Passbook Ledger Summary
                    </div>
                    <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 print:text-black">
                      Total Savings Balance: ₦{statementData.summary.totalSavingsBalance.toLocaleString()}
                    </div>
                    <div>Total Deposits Count: {statementData.summary.totalDepositsCount} entries</div>
                    <div>First Deposit Date: {statementData.summary.firstDepositDate}</div>
                    <div>Latest Deposit Date: {statementData.summary.lastDepositDate}</div>
                    <div>Same-Day Aggregation Multi-Days: {statementData.summary.sameDayAggregationsCount}</div>
                  </div>
                </div>

                {/* Chronological Passbook Ledger Table */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Deposit Transaction Ledger (Chronological Passbook View)
                  </h4>
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-xl print:border-gray-300">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase border-b border-slate-200 dark:border-slate-700 print:bg-gray-100">
                        <tr>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Payment Method</th>
                          <th className="py-2.5 px-3">Reference No</th>
                          <th className="py-2.5 px-3">Received By</th>
                          <th className="py-2.5 px-3 text-right">Deposit Amount (₦)</th>
                          <th className="py-2.5 px-3 text-right">Running Balance (₦)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {statementData.chronologicalLedger.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-6 text-center text-slate-500">
                              No deposit records found for this member passbook.
                            </td>
                          </tr>
                        ) : (
                          statementData.chronologicalLedger.map((d: any) => (
                            <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="py-2.5 px-3 font-medium whitespace-nowrap">{d.depositDate}</td>
                              <td className="py-2.5 px-3">{d.paymentMethod}</td>
                              <td className="py-2.5 px-3 font-mono text-[11px]">{d.referenceNumber}</td>
                              <td className="py-2.5 px-3 text-slate-600">{d.receivedBy}</td>
                              <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400 print:text-black">
                                +₦{d.amount.toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 text-right font-extrabold text-slate-900 dark:text-white print:text-black">
                                ₦{d.runningBalance.toLocaleString()}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Preparedness Status Badges */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-2 print:border-gray-300">
                  <div className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    Module Future Integration Indicators
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="text-slate-500 font-semibold text-[10px]">Loan Borrowing Capacity (3x Rule)</div>
                      <div className="font-extrabold text-blue-600 dark:text-blue-400 text-sm">
                        ₦{statementData.futureIntegrations.loanModule.maxLoanEligibleAmount.toLocaleString()}
                      </div>
                    </div>

                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="text-slate-500 font-semibold text-[10px]">Dividend Qualification Tier</div>
                      <div className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm">
                        {statementData.futureIntegrations.dividendModule.qualifyingTier}
                      </div>
                    </div>

                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="text-slate-500 font-semibold text-[10px]">Naira at Risk Engine Score</div>
                      <div className="font-extrabold text-purple-600 dark:text-purple-400 text-sm">
                        {statementData.futureIntegrations.nairaAtRiskEngine.totalNairaAtRiskScore.toLocaleString()} Score
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-8 text-xs text-center">
                  <div>
                    <div className="border-b border-slate-400 dark:border-slate-600 h-10 w-48 mx-auto"></div>
                    <p className="mt-1 font-bold text-slate-800 dark:text-slate-200">Financial Secretary</p>
                    <p className="text-[10px] text-slate-500">LCMS PRO Accounts Desk</p>
                  </div>
                  <div>
                    <div className="border-b border-slate-400 dark:border-slate-600 h-10 w-48 mx-auto"></div>
                    <p className="mt-1 font-bold text-slate-800 dark:text-slate-200">Treasurer / Auditor Seal</p>
                    <p className="text-[10px] text-slate-500">Lightway Cooperative Society</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
