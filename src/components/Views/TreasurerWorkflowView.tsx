import React, { useState, useEffect, useMemo } from 'react';
import {
  Vault,
  CreditCard,
  PlusCircle,
  Search,
  Filter,
  FileSpreadsheet,
  Printer,
  Download,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertCircle,
  Calendar,
  DollarSign,
  UserCheck,
  Building2,
  Edit3,
  Eye,
  FileText,
  ChevronRight,
  Send,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import {
  User,
  PaymentTransaction,
  PaymentCategory,
  PaymentTransactionStatus,
  PaymentMethod,
  PendingMemberApplication,
} from '../../types';
import { AlertMessage } from '../AlertMessage';
import { CoopLogo } from '../CoopLogo';
import { apiUrl } from '../../utils/apiClient';

interface TreasurerWorkflowViewProps {
  currentUser: User;
  users: User[];
  onRefreshData?: () => void;
  onNavigate?: (tab: string) => void;
}

export const TreasurerWorkflowView: React.FC<TreasurerWorkflowViewProps> = ({
  currentUser,
  users = [],
  onRefreshData,
  onNavigate,
}) => {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [editingTransaction, setEditingTransaction] = useState<PaymentTransaction | null>(null);

  // Filters
  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month' | 'year' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Payment Form State
  const [memberSearch, setMemberSearch] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    paymentCategory: 'Savings Deposit' as PaymentCategory,
    paymentMethod: 'Bank Transfer' as PaymentMethod,
    amount: '',
    date: new Date().toISOString().split('T')[0],
    bankReference: '',
    description: '',
    loanId: '',
  });

  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);
  const [alertError, setAlertError] = useState<string | null>(null);

  // Self Registration Pending Applications
  const [pendingRegApps, setPendingRegApps] = useState<PendingMemberApplication[]>([]);
  const [verifyingRegId, setVerifyingRegId] = useState<string | null>(null);

  const fetchPendingRegApps = async () => {
    try {
      const res = await fetch(apiUrl('/api/self-registration/applications'));
      const data = await res.json();
      if (data.success && Array.isArray(data.applications)) {
        setPendingRegApps(data.applications);
      }
    } catch (err) {
      console.error('Failed to fetch pending registration applications:', err);
    }
  };

  // Verify Self-Registration Payment Transfer
  const handleVerifyRegPayment = async (appId: string, amount: number) => {
    setVerifyingRegId(appId);
    setAlertSuccess(null);
    setAlertError(null);
    try {
      const res = await fetch(apiUrl(`/api/self-registration/applications/${appId}/verify-payment`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verifiedAmount: amount,
          actorName: currentUser.fullName,
          actorId: currentUser.id,
          role: currentUser.role,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to verify payment transfer.');
      }

      setAlertSuccess(data.message || 'Payment transfer verified successfully! Financial Secretary notified.');
      fetchPendingRegApps();
      fetchTransactions();
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      setAlertError(err.message || 'Error verifying payment transfer.');
    } finally {
      setVerifyingRegId(null);
    }
  };

  // Fetch Payment Transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl(`/api/payment-transactions?role=${currentUser.role}&memberId=${currentUser.id}`));
      const data = await res.json();
      if (data.success && data.transactions) {
        setTransactions(data.transactions);
      }
    } catch (err) {
      console.error('Failed to fetch payment transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    fetchPendingRegApps();
  }, []);

  // Filtered Members for Search Auto-complete
  const searchedMembers = useMemo(() => {
    if (!memberSearch.trim()) return [];
    const q = memberSearch.toLowerCase();
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.memberNo.toLowerCase().includes(q) ||
        u.phone.includes(q)
    ).slice(0, 6);
  }, [users, memberSearch]);

  // Date Filtering Logic
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Calculate Start of Week (Monday)
    const dayOfWeek = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek - 1));
    const weekStartStr = monday.toISOString().split('T')[0];

    // Start of Month
    const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    // Start of Year
    const yearStartStr = `${now.getFullYear()}-01-01`;

    return transactions.filter((tx) => {
      // Period filter
      if (periodFilter === 'today' && tx.date !== todayStr) return false;
      if (periodFilter === 'week' && tx.date < weekStartStr) return false;
      if (periodFilter === 'month' && tx.date < monthStartStr) return false;
      if (periodFilter === 'year' && tx.date < yearStartStr) return false;
      if (periodFilter === 'custom') {
        if (customStartDate && tx.date < customStartDate) return false;
        if (customEndDate && tx.date > customEndDate) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && tx.status !== statusFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && tx.paymentCategory !== categoryFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          tx.transactionNo.toLowerCase().includes(q) ||
          tx.memberName.toLowerCase().includes(q) ||
          tx.memberNo.toLowerCase().includes(q) ||
          tx.bankReference.toLowerCase().includes(q) ||
          tx.description.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [transactions, periodFilter, customStartDate, customEndDate, statusFilter, categoryFilter, searchQuery]);

  // Aggregate Stats (Today, Week, Month, Year)
  const stats = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const dayOfWeek = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek - 1));
    const weekStartStr = monday.toISOString().split('T')[0];

    const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const yearStartStr = `${now.getFullYear()}-01-01`;

    const getPeriodStats = (filterFn: (tx: PaymentTransaction) => boolean) => {
      const match = transactions.filter(filterFn);
      return {
        count: match.length,
        totalAmount: match.reduce((sum, t) => sum + t.amount, 0),
      };
    };

    const categories: PaymentCategory[] = [
      'Registration Fee',
      'Savings Deposit',
      'Loan Repayment',
      'Interest Payment',
      'Other Income',
    ];

    const categoryBreakdown = categories.map((cat) => ({
      category: cat,
      today: getPeriodStats((t) => t.paymentCategory === cat && t.date === todayStr),
      week: getPeriodStats((t) => t.paymentCategory === cat && t.date >= weekStartStr),
      month: getPeriodStats((t) => t.paymentCategory === cat && t.date >= monthStartStr),
      year: getPeriodStats((t) => t.paymentCategory === cat && t.date >= yearStartStr),
    }));

    return {
      today: getPeriodStats((t) => t.date === todayStr),
      week: getPeriodStats((t) => t.date >= weekStartStr),
      month: getPeriodStats((t) => t.date >= monthStartStr),
      year: getPeriodStats((t) => t.date >= yearStartStr),
      statusCounts: {
        pending: transactions.filter((t) => t.status === 'Pending Approval').length,
        pendingAmount: transactions.filter((t) => t.status === 'Pending Approval').reduce((s, t) => s + t.amount, 0),
        approved: transactions.filter((t) => t.status === 'Approved').length,
        approvedAmount: transactions.filter((t) => t.status === 'Approved').reduce((s, t) => s + t.amount, 0),
        rejected: transactions.filter((t) => t.status === 'Rejected').length,
        rejectedAmount: transactions.filter((t) => t.status === 'Rejected').reduce((s, t) => s + t.amount, 0),
        reversed: transactions.filter((t) => t.status === 'Reversed').length,
        reversedAmount: transactions.filter((t) => t.status === 'Reversed').reduce((s, t) => s + t.amount, 0),
      },
      categoryBreakdown,
    };
  }, [transactions]);

  // Reset Payment Form
  const resetForm = () => {
    setSelectedMember(null);
    setMemberSearch('');
    setFormData({
      paymentCategory: 'Savings Deposit',
      paymentMethod: 'Bank Transfer',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      bankReference: '',
      description: '',
      loanId: '',
    });
    setEditingTransaction(null);
  };

  // Submit Payment (Status: Pending Approval - No account update yet!)
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) {
      setAlertError('Please select a valid Cooperative Member by typing name or Member ID.');
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      setAlertError('Please enter a valid payment amount.');
      return;
    }
    if (!formData.bankReference.trim()) {
      setAlertError('Please enter the Bank Alert or Transaction Reference Number.');
      return;
    }

    setFormSubmitting(true);
    setAlertError(null);
    setAlertSuccess(null);

    try {
      const payload = {
        memberId: selectedMember.id,
        memberNo: selectedMember.memberNo,
        memberName: selectedMember.fullName,
        paymentCategory: formData.paymentCategory,
        paymentMethod: formData.paymentMethod,
        amount: Number(formData.amount),
        date: formData.date,
        bankReference: formData.bankReference.trim(),
        description: formData.description || `Payment assigned by Treasurer for ${formData.paymentCategory}`,
        submittedBy: currentUser.fullName,
        submittedById: currentUser.id,
        submittedByRole: currentUser.role,
        loanId: formData.loanId || undefined,
      };

      const url = editingTransaction
        ? `/api/payment-transactions/${editingTransaction.id}/edit`
        : '/api/payment-transactions';
      const method = editingTransaction ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAlertSuccess(
          `Payment ${data.transaction.transactionNo} submitted successfully! Status set to PENDING APPROVAL. Member account will be updated after Financial Secretary approval.`
        );
        setShowPaymentModal(false);
        resetForm();
        fetchTransactions();
        if (onRefreshData) onRefreshData();
      } else {
        setAlertError(data.error || 'Failed to submit payment transaction.');
      }
    } catch (err) {
      setAlertError('Network error submitting payment transaction.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Edit Modal for Rejected Transaction
  const handleOpenEdit = (tx: PaymentTransaction) => {
    setEditingTransaction(tx);
    const matched = users.find((u) => u.id === tx.memberId || u.memberNo === tx.memberNo);
    if (matched) {
      setSelectedMember(matched);
      setMemberSearch(`${matched.fullName} (${matched.memberNo})`);
    } else {
      setMemberSearch(tx.memberName);
    }

    setFormData({
      paymentCategory: tx.paymentCategory,
      paymentMethod: tx.paymentMethod,
      amount: String(tx.amount),
      date: tx.date,
      bankReference: tx.bankReference,
      description: tx.description,
      loanId: tx.loanId || '',
    });
    setShowPaymentModal(true);
  };

  // Export CSV / Excel
  const handleExportCSV = () => {
    const headers = [
      'Tx No',
      'Date',
      'Member No',
      'Member Name',
      'Category',
      'Method',
      'Amount (NGN)',
      'Bank Ref',
      'Status',
      'Submitted By',
      'Approved By',
    ];

    const rows = filteredTransactions.map((t) => [
      t.transactionNo,
      t.date,
      t.memberNo,
      `"${t.memberName}"`,
      t.paymentCategory,
      t.paymentMethod,
      t.amount,
      `"${t.bankReference}"`,
      t.status,
      `"${t.submittedBy}"`,
      `"${t.approvedBy || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Treasurer_Payment_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-900 via-amber-800 to-emerald-950 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200 text-slate-950 font-extrabold text-xs uppercase tracking-wider mb-2">
            <Vault className="w-3.5 h-3.5" />
            Treasurer Treasury & Vault Portal
          </div>
          <h1 className="text-2xl font-black text-white">Payment Receipt & Treasury Management</h1>
          <p className="text-xs text-amber-100 mt-1 max-w-2xl">
            Receive bank alerts, cash, POS & transfers. Manually assign Member IDs to incoming alerts and submit for Financial Secretary approval.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          {onNavigate && (
            <button
              onClick={() => onNavigate('bank_alert_import')}
              className="px-4 py-3 rounded-xl bg-[#DAA520] hover:bg-amber-400 text-xs font-black text-[#014421] shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-900"
            >
              <Smartphone className="w-4 h-4 text-[#014421]" />
              Bulk SMS Bank Alert Import
            </button>
          )}

          <button
            onClick={() => {
              resetForm();
              setShowPaymentModal(true);
            }}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-xs font-black text-slate-950 shadow-lg hover:shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Assign Single Bank Alert / Record Payment
          </button>
        </div>
      </div>

      {alertSuccess && (
        <AlertMessage
          type="success"
          title="Payment Submitted for Verification"
          message={alertSuccess}
          onClose={() => setAlertSuccess(null)}
        />
      )}

      {alertError && (
        <AlertMessage
          type="error"
          title="Workflow Error"
          message={alertError}
          onClose={() => setAlertError(null)}
        />
      )}

      {/* 4-Period Stat Cards (Today, Week, Month, Year) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-500">
            <span>Today's Collections</span>
            <Calendar className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            ₦{stats.today.totalAmount.toLocaleString()}
          </div>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">
            {stats.today.count} Payments Received Today
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-500">
            <span>This Week's Collections</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            ₦{stats.week.totalAmount.toLocaleString()}
          </div>
          <p className="text-[11px] text-blue-600 font-bold mt-1">
            {stats.week.count} Total Weekly Transactions
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-500">
            <span>This Month's Collections</span>
            <CreditCard className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            ₦{stats.month.totalAmount.toLocaleString()}
          </div>
          <p className="text-[11px] text-amber-600 font-bold mt-1">
            {stats.month.count} Monthly Entries Processed
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-500">
            <span>This Year's Total</span>
            <Vault className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            ₦{stats.year.totalAmount.toLocaleString()}
          </div>
          <p className="text-[11px] text-purple-600 font-bold mt-1">
            {stats.year.count} Cumulative Annual Records
          </p>
        </div>
      </div>

      {/* Self-Registration Bank Payment Verification Section */}
      {pendingRegApps.length > 0 && (
        <div className="bg-gradient-to-br from-amber-500/10 via-teal-500/5 to-slate-900/10 dark:from-amber-950/40 dark:to-slate-900/60 p-6 rounded-2xl border-2 border-amber-500/30 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Treasurer Queue
                </span>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                  {pendingRegApps.filter(a => !a.treasurerVerified).length} Awaiting Verification
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                Prospective Member Registration Bank Transfers
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl">
                Verify incoming registration payments transferred into the official Lightway Cooperative account (First Bank NGN) before Financial Secretary approval.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-amber-300 dark:border-amber-800 shrink-0 text-right">
              <span className="text-[10px] text-slate-500 font-bold uppercase block">Official Bank Account</span>
              <span className="text-xs font-mono font-black text-amber-700 dark:text-amber-300">First Bank: 2039485710</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingRegApps.map((app) => {
              const isVerified = app.treasurerVerified || app.status === 'Payment Verified';
              const isPending = !isVerified;

              return (
                <div
                  key={app.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    isVerified
                      ? 'bg-teal-50/50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800'
                      : 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700 shadow-md'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{app.fullName}</h4>
                        <span className="font-mono text-[11px] font-bold text-slate-500">{app.applicationNo}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                        isVerified
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {isVerified ? 'VERIFIED ✓' : 'AWAITING VERIFICATION'}
                      </span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Transferred Amount:</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          ₦{Number(app.paymentAmount || 10000).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Bank Reference:</span>
                        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                          {app.paymentReference || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Payment Date:</span>
                        <span className="text-slate-700 dark:text-slate-300">{app.paymentDate || app.dateSubmitted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Method:</span>
                        <span className="text-slate-700 dark:text-slate-300">{app.paymentMethod || 'Bank Transfer'}</span>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      <span>Sponsor: <strong>{app.sponsorName}</strong> ({app.sponsorMemberId})</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                    {isPending ? (
                      <button
                        disabled={verifyingRegId === app.id}
                        onClick={() => handleVerifyRegPayment(app.id, app.paymentAmount || 10000)}
                        className="w-full py-2 px-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg transition-all shadow-md shadow-amber-600/20 flex items-center justify-center gap-1.5"
                      >
                        {verifyingRegId === app.id ? (
                          <span className="animate-spin text-xs">⌛ Verifying...</span>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            Verify Payment Transfer (₦{Number(app.paymentAmount || 10000).toLocaleString()})
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="text-[11px] text-teal-700 dark:text-teal-300 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Verified by {app.treasurerVerifiedBy || 'Treasurer'} ({app.treasurerVerifiedDate || 'Recently'})
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Pending Approval</span>
          </div>
          <div className="text-xl font-black text-amber-900 dark:text-amber-100 mt-1">
            {stats.statusCounts.pending} Transactions
          </div>
          <div className="text-xs font-mono font-bold text-amber-700 dark:text-amber-400">
            ₦{stats.statusCounts.pendingAmount.toLocaleString()}
          </div>
          <p className="text-[10px] text-amber-600 mt-1">Awaiting FinSec Verification</p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Approved & Posted</span>
          </div>
          <div className="text-xl font-black text-emerald-900 dark:text-emerald-100 mt-1">
            {stats.statusCounts.approved} Transactions
          </div>
          <div className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400">
            ₦{stats.statusCounts.approvedAmount.toLocaleString()}
          </div>
          <p className="text-[10px] text-emerald-600 mt-1">Credited to Member Ledgers</p>
        </div>

        <div className="p-4 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-800 dark:text-rose-300">
            <XCircle className="w-4 h-4 text-rose-600" />
            <span>Rejected (Action Required)</span>
          </div>
          <div className="text-xl font-black text-rose-900 dark:text-rose-100 mt-1">
            {stats.statusCounts.rejected} Transactions
          </div>
          <div className="text-xs font-mono font-bold text-rose-700 dark:text-rose-400">
            ₦{stats.statusCounts.rejectedAmount.toLocaleString()}
          </div>
          <p className="text-[10px] text-rose-600 mt-1">Editable by Treasurer</p>
        </div>

        <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-800 dark:text-purple-300">
            <RotateCcw className="w-4 h-4 text-purple-600" />
            <span>Reversed Transactions</span>
          </div>
          <div className="text-xl font-black text-purple-900 dark:text-purple-100 mt-1">
            {stats.statusCounts.reversed} Transactions
          </div>
          <div className="text-xs font-mono font-bold text-purple-700 dark:text-purple-400">
            ₦{stats.statusCounts.reversedAmount.toLocaleString()}
          </div>
          <p className="text-[10px] text-purple-600 mt-1">Audited Reversals</p>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h2 className="font-extrabold text-slate-900 dark:text-white text-sm">
              Collections Breakdown by Payment Category
            </h2>
            <p className="text-xs text-slate-500">
              Registration Fees, Savings, Principal Repayments, Interest & Income
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-[11px] font-extrabold uppercase text-slate-600 dark:text-slate-300 tracking-wider">
                <th className="p-3">Payment Category</th>
                <th className="p-3 text-right">Today</th>
                <th className="p-3 text-right">This Week</th>
                <th className="p-3 text-right">This Month</th>
                <th className="p-3 text-right">This Year</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
              {stats.categoryBreakdown.map((item) => (
                <tr key={item.category} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3">
                    <span className="font-extrabold text-slate-900 dark:text-white">{item.category}</span>
                  </td>
                  <td className="p-3 text-right font-mono text-emerald-600">
                    ₦{item.today.totalAmount.toLocaleString()}
                    <span className="block text-[10px] text-slate-400 font-sans font-normal">
                      {item.today.count} txns
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono text-blue-600">
                    ₦{item.week.totalAmount.toLocaleString()}
                    <span className="block text-[10px] text-slate-400 font-sans font-normal">
                      {item.week.count} txns
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono text-amber-600">
                    ₦{item.month.totalAmount.toLocaleString()}
                    <span className="block text-[10px] text-slate-400 font-sans font-normal">
                      {item.month.count} txns
                    </span>
                  </td>
                  <td className="p-3 text-right font-mono text-purple-600">
                    ₦{item.year.totalAmount.toLocaleString()}
                    <span className="block text-[10px] text-slate-400 font-sans font-normal">
                      {item.year.count} txns
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Filterable Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-base">
                Treasurer Payment Transaction Ledger
              </h2>
              <p className="text-xs text-slate-500">
                Filter by period, status, or search member details
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Export Excel (CSV)
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-blue-600" />
                Print Ledger
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
            {/* Period Filter */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 mb-1">Time Period</label>
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value as any)}
                className="w-full text-xs font-bold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
                <option value="custom">Custom Date Range</option>
              </select>
            </div>

            {/* Custom Dates */}
            {periodFilter === 'custom' && (
              <>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold text-slate-500 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </>
            )}

            {/* Status Filter */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 mb-1">Approval Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Statuses</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Approved">Approved & Posted</option>
                <option value="Rejected">Rejected</option>
                <option value="Reversed">Reversed</option>
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 mb-1">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Categories</option>
                <option value="Registration Fee">Registration Fee</option>
                <option value="Savings Deposit">Savings Deposit</option>
                <option value="Loan Repayment">Loan Repayment</option>
                <option value="Interest Payment">Interest Payment</option>
                <option value="Other Income">Other Income</option>
              </select>
            </div>

            {/* Search Input */}
            <div>
              <label className="block text-[11px] font-extrabold text-slate-500 mb-1">Search</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tx No, Member, Ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-[11px] font-extrabold uppercase text-slate-600 dark:text-slate-300 tracking-wider">
                <th className="p-3">Tx Ref & Date</th>
                <th className="p-3">Member Details</th>
                <th className="p-3">Category & Method</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3">Bank Reference</th>
                <th className="p-3 text-center">Approval Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs text-slate-800 dark:text-slate-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No payment transactions match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3">
                      <div className="font-extrabold font-mono text-slate-900 dark:text-white">
                        {tx.transactionNo}
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans">{tx.date}</div>
                    </td>

                    <td className="p-3">
                      <div className="font-extrabold text-slate-900 dark:text-white">{tx.memberName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{tx.memberNo}</div>
                    </td>

                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-800 dark:text-slate-200">
                        {tx.paymentCategory}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">{tx.paymentMethod}</div>
                    </td>

                    <td className="p-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                      ₦{tx.amount.toLocaleString()}
                    </td>

                    <td className="p-3">
                      <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 font-bold">
                        {tx.bankReference}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">{tx.description}</div>
                    </td>

                    <td className="p-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          tx.status === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
                            : tx.status === 'Pending Approval'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300'
                            : tx.status === 'Rejected'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300'
                        }`}
                      >
                        {tx.status === 'Approved' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        {tx.status === 'Pending Approval' && <Clock className="w-3 h-3 text-amber-600" />}
                        {tx.status === 'Rejected' && <XCircle className="w-3 h-3 text-rose-600" />}
                        {tx.status === 'Reversed' && <RotateCcw className="w-3 h-3 text-purple-600" />}
                        {tx.status}
                      </span>

                      {tx.rejectionReason && (
                        <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 font-bold text-left bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded-md border border-rose-200">
                          <strong>Reason:</strong> {tx.rejectionReason}
                        </div>
                      )}
                    </td>

                    <td className="p-3 text-right">
                      {tx.status === 'Rejected' && (
                        <button
                          onClick={() => handleOpenEdit(tx)}
                          className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit & Resubmit
                        </button>
                      )}
                      {tx.status === 'Pending Approval' && (
                        <span className="text-[11px] text-slate-400 font-bold italic">
                          Awaiting FinSec
                        </span>
                      )}
                      {tx.status === 'Approved' && (
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Posted
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Entry Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-xl w-full p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Vault className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  {editingTransaction ? 'Edit & Resubmit Payment' : 'Assign Bank Alert & Record Payment'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-4">
              {/* Member Auto-complete Search */}
              <div className="relative">
                <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-200 mb-1">
                  1. Search Cooperative Member (Name or Member ID) *
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Type name e.g. 'Johnson' or 'LCMS-MEM-001'..."
                    value={memberSearch}
                    onChange={(e) => {
                      setMemberSearch(e.target.value);
                      setSelectedMember(null);
                    }}
                    className="w-full pl-9 pr-3 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>

                {/* Search Results Dropdown */}
                {!selectedMember && searchedMembers.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                    {searchedMembers.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setSelectedMember(m);
                          setMemberSearch(`${m.fullName} (${m.memberNo})`);
                        }}
                        className="w-full p-2.5 text-left hover:bg-emerald-50 dark:hover:bg-slate-700/60 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center transition-colors cursor-pointer"
                      >
                        <div>
                          <div className="font-extrabold text-xs text-slate-900 dark:text-white">{m.fullName}</div>
                          <div className="text-[10px] font-mono text-slate-500">{m.memberNo} • {m.branch}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Select
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {selectedMember && (
                  <div className="mt-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex justify-between items-center">
                    <div>
                      <div className="font-extrabold text-xs text-emerald-900 dark:text-emerald-200">
                        {selectedMember.fullName}
                      </div>
                      <div className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">
                        Code: {selectedMember.memberNo} • Savings Balance: ₦{(selectedMember.savingsBalance || 0).toLocaleString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMember(null);
                        setMemberSearch('');
                      }}
                      className="text-xs text-rose-600 font-bold hover:underline"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Category & Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-200 mb-1">
                    2. Payment Type *
                  </label>
                  <select
                    value={formData.paymentCategory}
                    onChange={(e) => setFormData({ ...formData, paymentCategory: e.target.value as any })}
                    className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="Registration Fee">Registration Fee</option>
                    <option value="Savings Deposit">Savings Deposit</option>
                    <option value="Loan Repayment">Loan Repayment</option>
                    <option value="Interest Payment">Interest Payment</option>
                    <option value="Other Income">Other Income</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-200 mb-1">
                    Payment Channel / Method *
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as any })}
                    className="w-full text-xs font-bold px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="Bank Transfer">Bank Alert / Transfer</option>
                    <option value="Cash Deposit">Cash Deposit at Vault</option>
                    <option value="POS">POS Terminal Receipt</option>
                    <option value="Mobile Transfer">Mobile Transfer</option>
                    <option value="Direct Payroll Deduction">Direct Payroll Deduction</option>
                    <option value="Cheque">Bank Cheque</option>
                  </select>
                </div>
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-200 mb-1">
                    3. Amount (₦) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-sm font-black text-slate-400">₦</span>
                    <input
                      type="number"
                      min="1"
                      placeholder="0.00"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full pl-8 pr-3 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-200 mb-1">
                    4. Payment Date *
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2.5 text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                    required
                  />
                </div>
              </div>

              {/* Bank Reference */}
              <div>
                <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-200 mb-1">
                  5. Bank Reference / Alert Session ID *
                </label>
                <input
                  type="text"
                  placeholder="e.g. FBN-ALERT-99482 or POS-REC-8812"
                  value={formData.bankReference}
                  onChange={(e) => setFormData({ ...formData, bankReference: e.target.value })}
                  className="w-full px-3 py-2.5 text-xs font-bold font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-200 mb-1">
                  Description / Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional payment notes or deposit slip serial..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              {/* Internal Control Security Notice */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-[11px] font-bold flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Internal Control Protocol:</strong> Submitting this form sets status to <strong>PENDING APPROVAL</strong>. Member account balances are <strong>NOT updated</strong> until the Financial Secretary approves and posts this transaction.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPaymentModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs shadow-lg hover:from-emerald-500 hover:to-teal-500 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {formSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit for Financial Secretary Approval
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
