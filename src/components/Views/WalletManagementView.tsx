import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Building2,
  UserCheck,
  CreditCard,
  TrendingUp,
  Receipt,
  Search,
  PlusCircle,
  CheckCircle2,
  Clock,
  Printer,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  HelpCircle,
  FileSpreadsheet,
  Coins,
  PiggyBank,
  HandCoins,
  AlertCircle,
  X,
  Lock,
} from 'lucide-react';
import {
  User,
  CooperativeWalletEntry,
  CooperativeIncomeCategory,
  MemberWalletTransaction,
  UniversalPaymentType,
  PaymentMethod,
  UserRole,
} from '../../types';
import { AlertMessage } from '../AlertMessage';
import { MemberStatusBadge } from '../MemberStatusBadge';
import { apiUrl } from '../../utils/apiClient';

interface WalletManagementViewProps {
  users: User[];
  currentRole: UserRole;
  currentUser?: User;
  initialTab?: 'cooperative' | 'members' | 'single_entry';
  onRefreshData?: () => void;
}

export const WalletManagementView: React.FC<WalletManagementViewProps> = ({
  users,
  currentRole,
  currentUser,
  initialTab = 'cooperative',
  onRefreshData,
}) => {
  const [activeTab, setActiveTab] = useState<'cooperative' | 'members' | 'single_entry'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Cooperative Wallet State
  const [cooperativeData, setCooperativeData] = useState<{
    totalBalance: number;
    categoryBreakdown: Record<CooperativeIncomeCategory, number>;
    entries: CooperativeWalletEntry[];
  }>({
    totalBalance: 0,
    categoryBreakdown: {
      'Registration Fee': 0,
      'Loan Interest': 0,
      'Penalties/Fines': 0,
      'Business Profit': 0,
      'Donation': 0,
      'Service Charges': 0,
      'Other Cooperative Income': 0,
    },
    entries: [],
  });

  // Search & Filters for Cooperative Wallet
  const [coopSearch, setCoopSearch] = useState('');
  const [coopCategoryFilter, setCoopCategoryFilter] = useState<string>('all');

  // Member Wallet State
  const [memberSummaries, setMemberSummaries] = useState<any[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [selectedMemberWallet, setSelectedMemberWallet] = useState<any | null>(null);

  // Single Entry Posting Form State
  const [postingForm, setPostingForm] = useState({
    paymentType: 'Savings Deposit' as UniversalPaymentType,
    memberNo: users[0]?.memberNo || '',
    amount: 10000,
    date: new Date().toISOString().split('T')[0],
    receiptNumber: `REC-2026-${Math.floor(10000 + Math.random() * 90000)}`,
    paymentMethod: 'Bank Transfer' as PaymentMethod,
    receivedBy: currentUser?.fullName || 'Mr. Babatunde Ogunleye (Financial Secretary)',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Receipt Modal State
  const [receiptData, setReceiptData] = useState<any | null>(null);

  // Load Data
  const loadCooperativeWallet = async () => {
    try {
      const res = await fetch(apiUrl('/api/wallets/cooperative'));
      const data = await res.json();
      if (res.ok && data.success) {
        setCooperativeData({
          totalBalance: data.totalBalance,
          categoryBreakdown: data.categoryBreakdown,
          entries: data.entries,
        });
      }
    } catch (err) {
      console.error('Failed to load cooperative wallet data:', err);
    }
  };

  const loadMemberWallets = async () => {
    try {
      const res = await fetch(apiUrl('/api/wallets/members'));
      const data = await res.json();
      if (res.ok && data.success) {
        setMemberSummaries(data.members);
        if (data.members.length > 0 && !selectedMemberId) {
          setSelectedMemberId(data.members[0].memberId);
        }
      }
    } catch (err) {
      console.error('Failed to load member wallets:', err);
    }
  };

  const loadSingleMemberWallet = async (memberId: string) => {
    try {
      const res = await fetch(apiUrl(`/api/wallets/members/${memberId}`));
      const data = await res.json();
      if (res.ok && data.success) {
        setSelectedMemberWallet(data);
      }
    } catch (err) {
      console.error('Failed to load member wallet detail:', err);
    }
  };

  useEffect(() => {
    loadCooperativeWallet();
    loadMemberWallets();
  }, []);

  useEffect(() => {
    if (selectedMemberId) {
      loadSingleMemberWallet(selectedMemberId);
    }
  }, [selectedMemberId]);

  // Handle Universal Single Entry Posting
  const handlePostPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);

    if (!postingForm.receiptNumber.trim()) {
      setNotice({ type: 'error', message: 'Please provide a valid Receipt Number.' });
      return;
    }

    if (!postingForm.amount || postingForm.amount <= 0) {
      setNotice({ type: 'error', message: 'Amount must be greater than ₦0.' });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(apiUrl('/api/wallets/post-payment'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(postingForm),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setNotice({ type: 'success', message: data.message });
        if (data.receiptDetails) {
          setReceiptData(data.receiptDetails);
        }

        // Refresh stores
        await loadCooperativeWallet();
        await loadMemberWallets();
        if (selectedMemberId) {
          await loadSingleMemberWallet(selectedMemberId);
        }
        if (onRefreshData) onRefreshData();

        // Reset receipt number for next transaction
        setPostingForm((prev) => ({
          ...prev,
          receiptNumber: `REC-2026-${Math.floor(10000 + Math.random() * 90000)}`,
          notes: '',
        }));
      } else {
        setNotice({ type: 'error', message: data.error || 'Failed to post payment transaction.' });
      }
    } catch (err) {
      setNotice({ type: 'error', message: 'An unexpected network error occurred while posting payment.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered Cooperative Entries
  const filteredCoopEntries = cooperativeData.entries.filter((entry) => {
    const matchesCategory = coopCategoryFilter === 'all' || entry.category === coopCategoryFilter;
    const q = coopSearch.toLowerCase();
    const matchesQuery =
      !q ||
      entry.receiptNumber.toLowerCase().includes(q) ||
      (entry.payerName && entry.payerName.toLowerCase().includes(q)) ||
      (entry.payerMemberNo && entry.payerMemberNo.toLowerCase().includes(q)) ||
      (entry.notes && entry.notes.toLowerCase().includes(q));

    return matchesCategory && matchesQuery;
  });

  // Filtered Member List
  const filteredMembers = memberSummaries.filter((m) => {
    const q = memberSearch.toLowerCase();
    return (
      !q ||
      m.memberName.toLowerCase().includes(q) ||
      m.memberNo.toLowerCase().includes(q) ||
      m.branch.toLowerCase().includes(q)
    );
  });

  // Get Payment Destination Routing Hint
  const getDestinationHint = (type: UniversalPaymentType) => {
    switch (type) {
      case 'Registration Fee':
        return {
          wallet: 'Cooperative Main Wallet',
          badge: 'bg-[#014421] text-amber-300 border-[#DAA520]',
          desc: 'Money goes to Cooperative Income. Automatically updates member status to ACTIVE upon payment.',
        };
      case 'Savings Deposit':
        return {
          wallet: 'Member Wallet (Personal Savings)',
          badge: 'bg-blue-900 text-blue-100 border-blue-500',
          desc: 'Money credited directly to Member Personal Savings balance and recorded in Passbook history.',
        };
      case 'Loan Interest':
        return {
          wallet: 'Cooperative Main Wallet',
          badge: 'bg-[#014421] text-[#DAA520] border-[#DAA520]',
          desc: 'Interest income automatically posts to Cooperative Main Wallet as profit.',
        };
      case 'Loan Repayment (Principal)':
        return {
          wallet: 'Member Wallet (Loan Balance)',
          badge: 'bg-emerald-900 text-emerald-100 border-emerald-500',
          desc: 'Reduces member outstanding loan balance and updates loan schedule.',
        };
      case 'Fine / Penalty':
        return {
          wallet: 'Cooperative Main Wallet',
          badge: 'bg-rose-900 text-rose-100 border-rose-500',
          desc: 'Penalty fee posts automatically to Cooperative Main Wallet.',
        };
      case 'Dividend Credit':
        return {
          wallet: 'Member Wallet (Personal Wallet)',
          badge: 'bg-purple-900 text-purple-100 border-purple-500',
          desc: 'Surplus payout credited directly to member personal wallet balance.',
        };
      default:
        return {
          wallet: 'Cooperative Main Wallet',
          badge: 'bg-[#014421] text-amber-300 border-[#DAA520]',
          desc: 'Cooperative income automatically posted to the Master Vault.',
        };
    }
  };

  const currentHint = getDestinationHint(postingForm.paymentType);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#014421] via-emerald-900 to-[#014421] text-white p-6 sm:p-8 rounded-2xl shadow-xl border-b-4 border-[#DAA520] relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-6 opacity-10 pointer-events-none">
          <Wallet className="w-96 h-96 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DAA520] text-[#014421] font-black text-xs uppercase tracking-wider shadow-sm">
              <ShieldCheck className="w-4 h-4" /> Real-Time Dual Wallet Architecture
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              LCMS PRO Wallet & Financial Engine
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Separating <strong>Cooperative Master Capital & Income</strong> from <strong>Member Personal Equity, Savings & Loans</strong>.
              All Financial Secretary entries automatically post to the correct destination wallet.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('single_entry')}
              className="px-5 py-3 rounded-xl bg-[#DAA520] hover:bg-yellow-400 text-[#014421] font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Post Payment (Single Entry)
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('cooperative')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'cooperative'
              ? 'bg-[#014421] text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4 text-[#DAA520]" />
          1. Cooperative Main Wallet (Master Vault)
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
            ₦{cooperativeData.totalBalance.toLocaleString()}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'members'
              ? 'bg-[#014421] text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <UserCheck className="w-4 h-4 text-emerald-400" />
          2. Member Personal Wallets
          <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 font-bold">
            {memberSummaries.length} Enrolled
          </span>
        </button>

        <button
          onClick={() => setActiveTab('single_entry')}
          className={`px-4 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'single_entry'
              ? 'bg-[#014421] text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
          }`}
        >
          <CreditCard className="w-4 h-4 text-amber-400" />
          3. Universal Automatic Posting Engine
        </button>
      </div>

      {/* ==================== TAB 1: COOPERATIVE MAIN WALLET ==================== */}
      {activeTab === 'cooperative' && (
        <div className="space-y-6">
          {/* Master Balance Header Card */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-md grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 p-5 rounded-xl bg-gradient-to-br from-[#014421] to-emerald-950 text-white border-2 border-[#DAA520] shadow-md flex flex-col justify-between">
              <div>
                <div className="text-xs font-black text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-[#DAA520]" /> Master Vault Balance
                </div>
                <div className="text-3xl font-black text-white mt-2 tracking-tight">
                  ₦{cooperativeData.totalBalance.toLocaleString()}
                </div>
              </div>
              <p className="text-[11px] text-emerald-100/90 mt-4 leading-tight">
                Cumulative revenue stored automatically from Registration fees, Interest, Fines, Business Profits, and Charges.
              </p>
            </div>

            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="text-[11px] font-bold text-amber-800 dark:text-amber-300">Registration Fees</div>
                <div className="text-lg font-black text-black dark:text-white mt-1">
                  ₦{(cooperativeData.categoryBreakdown['Registration Fee'] || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-1">100% Cooperative Revenue</div>
              </div>

              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">Loan Interest Income</div>
                <div className="text-lg font-black text-black dark:text-white mt-1">
                  ₦{(cooperativeData.categoryBreakdown['Loan Interest'] || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1">Accrued Interest</div>
              </div>

              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 rounded-xl border border-rose-200 dark:border-rose-800">
                <div className="text-[11px] font-bold text-rose-800 dark:text-rose-300">Penalties & Fines</div>
                <div className="text-lg font-black text-black dark:text-white mt-1">
                  ₦{(cooperativeData.categoryBreakdown['Penalties/Fines'] || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-rose-700 dark:text-rose-400 mt-1">Late Charges</div>
              </div>

              <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <div className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300">Business Enterprise Profit</div>
                <div className="text-lg font-black text-black dark:text-white mt-1">
                  ₦{(cooperativeData.categoryBreakdown['Business Profit'] || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-indigo-700 dark:text-indigo-400 mt-1">Commercial Ventures</div>
              </div>

              <div className="p-3.5 bg-purple-50 dark:bg-purple-950/40 rounded-xl border border-purple-200 dark:border-purple-800">
                <div className="text-[11px] font-bold text-purple-800 dark:text-purple-300">Service Charges</div>
                <div className="text-lg font-black text-black dark:text-white mt-1">
                  ₦{(cooperativeData.categoryBreakdown['Service Charges'] || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-purple-700 dark:text-purple-400 mt-1">Admin & Passbook</div>
              </div>

              <div className="p-3.5 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800">
                <div className="text-[11px] font-bold text-sky-800 dark:text-sky-300">Donations & Grants</div>
                <div className="text-lg font-black text-black dark:text-white mt-1">
                  ₦{(cooperativeData.categoryBreakdown['Donation'] || 0).toLocaleString()}
                </div>
                <div className="text-[10px] text-sky-700 dark:text-sky-400 mt-1">Patron Endowments</div>
              </div>
            </div>
          </div>

          {/* Ledger Table Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-md p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-black dark:text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-[#014421] dark:text-emerald-400" />
                  Cooperative Income Ledger
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Automated posting audit history of all incomes credited into the Cooperative Master Wallet.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative min-w-[200px]">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search receipt, payer..."
                    value={coopSearch}
                    onChange={(e) => setCoopSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-black dark:text-white"
                  />
                </div>

                {/* Filter */}
                <select
                  value={coopCategoryFilter}
                  onChange={(e) => setCoopCategoryFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-black dark:text-white"
                >
                  <option value="all">All Income Categories</option>
                  <option value="Registration Fee">Registration Fee</option>
                  <option value="Loan Interest">Loan Interest</option>
                  <option value="Penalties/Fines">Penalties/Fines</option>
                  <option value="Business Profit">Business Profit</option>
                  <option value="Donation">Donation</option>
                  <option value="Service Charges">Service Charges</option>
                  <option value="Other Cooperative Income">Other Income</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3">Date</th>
                    <th className="p-3">Receipt No</th>
                    <th className="p-3">Income Category</th>
                    <th className="p-3">Source / Payer</th>
                    <th className="p-3">Amount (₦)</th>
                    <th className="p-3">Method</th>
                    <th className="p-3">Recorded By</th>
                    <th className="p-3 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-bold text-black dark:text-slate-200">
                  {filteredCoopEntries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        No cooperative wallet records match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredCoopEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                          {entry.date}
                        </td>
                        <td className="p-3 font-mono font-black text-[#014421] dark:text-emerald-400">
                          {entry.receiptNumber}
                        </td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-950 dark:text-emerald-200 border border-emerald-800 dark:border-emerald-700">
                            {entry.category}
                          </span>
                        </td>
                        <td className="p-3">
                          {entry.payerName ? (
                            <div>
                              <div className="font-extrabold text-black dark:text-white">{entry.payerName}</div>
                              {entry.payerMemberNo && (
                                <div className="text-[10px] font-mono text-slate-400">{entry.payerMemberNo}</div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">Cooperative Society</span>
                          )}
                        </td>
                        <td className="p-3 font-black text-emerald-700 dark:text-emerald-400 text-sm">
                          +₦{entry.amount.toLocaleString()}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{entry.paymentMethod}</td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">{entry.recordedBy}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() =>
                              setReceiptData({
                                receiptNumber: entry.receiptNumber,
                                paymentType: entry.category,
                                amount: entry.amount,
                                memberName: entry.payerName || 'Cooperative Society',
                                memberNo: entry.payerMemberNo || 'COOP-HQ-001',
                                paymentMethod: entry.paymentMethod,
                                date: entry.date,
                                receivedBy: entry.recordedBy,
                                notes: entry.notes,
                              })
                            }
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-[#014421] hover:text-white dark:hover:bg-emerald-600 transition-colors cursor-pointer"
                            title="View Printable Receipt"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 2: MEMBER PERSONAL WALLETS ==================== */}
      {activeTab === 'members' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Member Search List */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-md p-4 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-200 dark:border-slate-800">
              <h2 className="font-extrabold text-sm text-black dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#014421] dark:text-emerald-400" />
                Member Wallet Directory
              </h2>
              <span className="text-xs font-bold text-slate-400">{filteredMembers.length} Members</span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search member name or no..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-black dark:text-white"
              />
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredMembers.map((m) => {
                const isSelected = selectedMemberId === m.memberId;
                return (
                  <button
                    key={m.memberId}
                    onClick={() => setSelectedMemberId(m.memberId)}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                        alt={m.memberName}
                        className="w-10 h-10 rounded-xl object-cover border border-[#014421]"
                      />
                      <div>
                        <div className="font-extrabold text-xs text-black dark:text-white">{m.memberName}</div>
                        <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                          {m.memberNo} • {m.branch}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                        ₦{m.savingsBalance.toLocaleString()}
                      </div>
                      <MemberStatusBadge status={m.status} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Member Personal Wallet Detail Inspector */}
          <div className="lg:col-span-8 space-y-6">
            {selectedMemberWallet ? (
              <div className="space-y-6">
                {/* Member Header */}
                <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedMemberWallet.member?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                      alt={selectedMemberWallet.member?.fullName}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-[#014421] shadow-md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-black dark:text-white">
                          {selectedMemberWallet.member?.fullName}
                        </h2>
                        <MemberStatusBadge status={selectedMemberWallet.member?.status} />
                      </div>
                      <p className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                        {selectedMemberWallet.member?.memberNo} • {selectedMemberWallet.member?.branch}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Phone: {selectedMemberWallet.member?.phone} | Joined: {selectedMemberWallet.member?.dateJoined}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        alert(`Generating Digital Wallet Statement / Passbook for ${selectedMemberWallet.member?.fullName}...`)
                      }
                      className="px-4 py-2 rounded-xl bg-[#014421] text-white hover:bg-emerald-800 font-extrabold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
                    >
                      <Printer className="w-4 h-4" /> Print Passbook Statement
                    </button>
                  </div>
                </div>

                {/* Wallet Balance Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Savings Wallet */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-900 to-[#014421] text-white border-2 border-emerald-600 shadow-md">
                    <div className="flex items-center justify-between text-emerald-200 text-xs font-extrabold uppercase">
                      <span>Personal Savings</span>
                      <PiggyBank className="w-4 h-4 text-amber-300" />
                    </div>
                    <div className="text-2xl font-black text-white mt-2">
                      ₦{(selectedMemberWallet.wallet?.savingsBalance || 0).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-emerald-100 mt-2">Withdrawable / Equity collateral</div>
                  </div>

                  {/* Dividend Earned */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-700 to-amber-900 text-white border-2 border-amber-500 shadow-md">
                    <div className="flex items-center justify-between text-amber-200 text-xs font-extrabold uppercase">
                      <span>Dividend Balance</span>
                      <Coins className="w-4 h-4 text-amber-300" />
                    </div>
                    <div className="text-2xl font-black text-white mt-2">
                      ₦{(selectedMemberWallet.wallet?.dividendEarned || 0).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-amber-100 mt-2">Annual Surplus Allocation</div>
                  </div>

                  {/* Outstanding Loan Balance */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 text-white border-2 border-slate-700 shadow-md">
                    <div className="flex items-center justify-between text-slate-300 text-xs font-extrabold uppercase">
                      <span>Outstanding Loan Balance</span>
                      <HandCoins className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="text-2xl font-black text-amber-400 mt-2">
                      ₦{(selectedMemberWallet.wallet?.outstandingLoanBalance || 0).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-2">Current Principal Liability</div>
                  </div>
                </div>

                {/* Member Transaction History */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-md p-6 space-y-4">
                  <h3 className="font-extrabold text-sm text-black dark:text-white flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#014421] dark:text-emerald-400" />
                    Personal Wallet Transaction Log
                  </h3>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-700">
                          <th className="p-3">Date</th>
                          <th className="p-3">Transaction Type</th>
                          <th className="p-3">Destination Wallet</th>
                          <th className="p-3">Amount (₦)</th>
                          <th className="p-3">Receipt No</th>
                          <th className="p-3">Method</th>
                          <th className="p-3">Officer</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-bold text-black dark:text-slate-200">
                        {selectedMemberWallet.wallet?.transactions.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-6 text-center text-slate-400">
                              No transaction logs recorded yet for this member.
                            </td>
                          </tr>
                        ) : (
                          selectedMemberWallet.wallet?.transactions.map((tx: MemberWalletTransaction) => (
                            <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-3 text-slate-500 font-mono text-[11px]">{tx.date}</td>
                              <td className="p-3">{tx.txType}</td>
                              <td className="p-3 text-slate-500">{tx.targetWallet}</td>
                              <td
                                className={`p-3 font-black text-sm ${
                                  tx.flow === 'credit' ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {tx.flow === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                              </td>
                              <td className="p-3 font-mono font-bold text-[#014421] dark:text-emerald-400">{tx.receiptNumber}</td>
                              <td className="p-3 text-slate-500">{tx.paymentMethod}</td>
                              <td className="p-3 text-slate-500">{tx.recordedBy}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-center text-slate-400">
                Select a member from the directory to inspect their personal wallet details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 3: UNIVERSAL AUTOMATIC POSTING ENGINE ==================== */}
      {activeTab === 'single_entry' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border-2 border-[#014421] shadow-xl space-y-6">
            <div className="border-b-2 border-slate-200 dark:border-slate-800 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-black dark:text-white flex items-center gap-2">
                  <CreditCard className="w-6 h-6 text-[#014421] dark:text-emerald-400" />
                  Financial Secretary Single-Entry Posting Engine
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enter payment details ONCE. The system automatically updates the correct Wallet, Member History, Ledger, and Receipt.
                </p>
              </div>

              <span className="px-3 py-1 rounded-full bg-[#DAA520] text-[#014421] font-black text-xs uppercase">
                Auto-Routing Active
              </span>
            </div>

            {notice && <AlertMessage type={notice.type} message={notice.message} />}

            <form onSubmit={handlePostPayment} className="space-y-6 text-xs font-bold text-black dark:text-slate-200">
              {/* Payment Type Selection & Live Visual Hint */}
              <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border-2 border-amber-300 dark:border-amber-800 space-y-3">
                <label className="block text-sm font-black text-black dark:text-white">
                  1. Select Payment Type *
                </label>
                <select
                  value={postingForm.paymentType}
                  onChange={(e) =>
                    setPostingForm({ ...postingForm, paymentType: e.target.value as UniversalPaymentType })
                  }
                  className="w-full p-3.5 rounded-xl border-2 border-slate-800 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-black text-black dark:text-white shadow-xs"
                >
                  <option value="Savings Deposit">Savings Deposit → Member Personal Wallet</option>
                  <option value="Registration Fee">Registration Fee → Cooperative Main Wallet (Activates Member)</option>
                  <option value="Loan Interest">Loan Interest → Cooperative Main Wallet</option>
                  <option value="Loan Repayment (Principal)">Loan Repayment (Principal) → Member Loan Balance Reduction</option>
                  <option value="Fine / Penalty">Fine / Penalty → Cooperative Main Wallet</option>
                  <option value="Dividend Credit">Dividend Surplus → Member Personal Wallet</option>
                  <option value="Business Income">Business Enterprise Income → Cooperative Main Wallet</option>
                  <option value="Donation">Donation / Endowment → Cooperative Main Wallet</option>
                  <option value="Service Charge">Service Charge → Cooperative Main Wallet</option>
                  <option value="Other Income">Other Cooperative Income → Cooperative Main Wallet</option>
                </select>

                {/* Routing Preview Box */}
                <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-300 dark:border-slate-700 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-[#DAA520] shrink-0 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-bold">Automatic Destination:</span>
                      <span className={`px-2.5 py-0.5 rounded-md font-black text-xs border ${currentHint.badge}`}>
                        {currentHint.wallet}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                      {currentHint.desc}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Input Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Member Selector */}
                <div>
                  <label className="block font-black text-black dark:text-white text-xs mb-1">
                    Target Member (Required for Member Transactions) *
                  </label>
                  <select
                    value={postingForm.memberNo}
                    onChange={(e) => setPostingForm({ ...postingForm, memberNo: e.target.value })}
                    className="w-full p-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="">-- Select Member --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.memberNo}>
                        {u.fullName} ({u.memberNo}) - Status: {u.status.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block font-black text-black dark:text-white text-xs mb-1">
                    Amount Paid (₦) *
                  </label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={postingForm.amount}
                    onChange={(e) => setPostingForm({ ...postingForm, amount: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-black text-base text-[#014421] dark:text-emerald-400"
                  />
                </div>

                {/* Receipt Number */}
                <div>
                  <label className="block font-black text-black dark:text-white text-xs mb-1">
                    Receipt / Teller Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={postingForm.receiptNumber}
                    onChange={(e) => setPostingForm({ ...postingForm, receiptNumber: e.target.value })}
                    className="w-full p-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-black"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block font-black text-black dark:text-white text-xs mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={postingForm.paymentMethod}
                    onChange={(e) => setPostingForm({ ...postingForm, paymentMethod: e.target.value as PaymentMethod })}
                    className="w-full p-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash Deposit">Cash Deposit</option>
                    <option value="POS">POS</option>
                    <option value="Direct Payroll Deduction">Direct Payroll Deduction</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Mobile Transfer">Mobile Transfer</option>
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block font-black text-black dark:text-white text-xs mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={postingForm.date}
                    onChange={(e) => setPostingForm({ ...postingForm, date: e.target.value })}
                    className="w-full p-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>

                {/* Received By Officer */}
                <div>
                  <label className="block font-black text-black dark:text-white text-xs mb-1">
                    Received / Recorded By Officer *
                  </label>
                  <input
                    type="text"
                    required
                    value={postingForm.receivedBy}
                    onChange={(e) => setPostingForm({ ...postingForm, receivedBy: e.target.value })}
                    className="w-full p-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block font-black text-black dark:text-white text-xs mb-1">
                  Transaction Remarks / Voucher Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional remarks or bank reference..."
                  value={postingForm.notes}
                  onChange={(e) => setPostingForm({ ...postingForm, notes: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#014421] hover:bg-emerald-800 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Posting Transaction...' : 'Post Single Entry Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== PRINTABLE RECEIPT MODAL ==================== */}
      {receiptData && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-black rounded-2xl max-w-md w-full border-4 border-[#014421] shadow-2xl overflow-hidden my-8 p-6 space-y-4">
            <div className="text-center border-b-2 border-dashed border-slate-300 pb-4">
              <div className="w-12 h-12 rounded-xl bg-[#014421] text-[#DAA520] font-black text-xl flex items-center justify-center mx-auto mb-2">
                LC
              </div>
              <h3 className="font-black text-lg text-[#014421]">LIGHTWAY COOPERATIVE</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                Official Financial Transaction Receipt
              </p>
              <div className="text-xs font-mono font-black text-slate-800 mt-1">
                Receipt No: {receiptData.receiptNumber}
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Payer / Member:</span>
                <span className="font-extrabold text-black">{receiptData.memberName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Member No:</span>
                <span className="font-mono font-extrabold text-black">{receiptData.memberNo}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Payment Type:</span>
                <span className="font-black text-[#014421]">{receiptData.paymentType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Amount Paid:</span>
                <span className="font-black text-base text-emerald-800">₦{receiptData.amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Payment Method:</span>
                <span className="font-bold text-black">{receiptData.paymentMethod}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Date:</span>
                <span className="font-mono font-bold text-black">{receiptData.date}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Issued By:</span>
                <span className="font-bold text-black">{receiptData.receivedBy}</span>
              </div>
            </div>

            <div className="pt-2 text-center text-[10px] text-slate-400 italic">
              Thank you for contributing to Lightway Cooperative Society.
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 rounded-xl bg-[#014421] text-white font-extrabold text-xs flex items-center justify-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" /> Print
              </button>
              <button
                onClick={() => setReceiptData(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 text-black font-extrabold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
