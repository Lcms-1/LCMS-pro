import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  ShieldAlert,
  Search,
  Filter,
  FileSpreadsheet,
  Printer,
  AlertTriangle,
  UserCheck,
  Eye,
  Building2,
  DollarSign,
  Calendar,
  Layers,
  Sparkles,
  TrendingUp,
  FileText,
  BadgeAlert,
  Check,
  UserPlus,
  ArrowLeft,
  LayoutDashboard,
  X,
  Phone,
  Mail,
  CreditCard,
  Building,
} from 'lucide-react';
import { User, PaymentTransaction, PaymentCategory, MeansOfId } from '../../types';
import { AlertMessage } from '../AlertMessage';
import { COOPERATIVE_BRANCHES } from '../../data/mockData';
import { apiUrl } from '../../utils/apiClient';

interface FinSecApprovalViewProps {
  currentUser: User;
  onRefreshData?: () => void;
  onNavigateToDashboard?: () => void;
}

export const FinSecApprovalView: React.FC<FinSecApprovalViewProps> = ({
  currentUser,
  onRefreshData,
  onNavigateToDashboard,
}) => {
  const isFinSecOrAdmin = ['financial_secretary', 'sys_admin', 'chairman'].includes(currentUser.role);

  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [membersList, setMembersList] = useState<User[]>([]);
  const [configuredRegFee, setConfiguredRegFee] = useState<number>(2500);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'reversed' | 'all'>('pending');

  // Modals State
  const [rejectingTx, setRejectingTx] = useState<PaymentTransaction | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const [reversingTx, setReversingTx] = useState<PaymentTransaction | null>(null);
  const [reversalReason, setReversalReason] = useState<string>('');

  // Unmatched Member Decision Modal
  const [unmatchedTxForApproval, setUnmatchedTxForApproval] = useState<PaymentTransaction | null>(null);

  // Search Existing Member Modal
  const [searchingMemberTx, setSearchingMemberTx] = useState<PaymentTransaction | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState<string>('');

  // New Member Registration Modal
  const [registeringMemberFromTx, setRegisteringMemberFromTx] = useState<PaymentTransaction | null>(null);
  const [regForm, setRegForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    branch: COOPERATIVE_BRANCHES[0]?.name || 'Lagos Island Central HQ',
    dob: '1990-06-15',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    meansOfId: 'NIN' as MeansOfId,
    idNumber: '',
    residentialAddress: '',
    occupation: 'General Member',
  });
  const [regFormError, setRegFormError] = useState<string | null>(null);

  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [alertSuccess, setAlertSuccess] = useState<string | null>(null);
  const [alertError, setAlertError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'month' | 'year'>('all');

  // Fetch Data
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const [txRes, settingsRes, membersRes] = await Promise.all([
        fetch(apiUrl(`/api/payment-transactions?role=${currentUser.role}&memberId=${currentUser.id}`)),
        fetch(apiUrl('/api/settings')),
        fetch(apiUrl('/api/members')),
      ]);

      const txData = await txRes.json();
      if (txData.success && txData.transactions) {
        setTransactions(txData.transactions);
      }

      const settingsData = await settingsRes.json();
      if (settingsData.success && settingsData.settings?.registrationFee) {
        setConfiguredRegFee(settingsData.settings.registrationFee);
      }

      const membersData = await membersRes.json();
      if (membersData.members) {
        setMembersList(membersData.members);
      }
    } catch (err) {
      console.error('Failed to fetch data for FinSec approval portal:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filtered List
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const monthStartStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const yearStartStr = `${now.getFullYear()}-01-01`;

    return transactions.filter((tx) => {
      // Tab filter
      if (activeTab === 'pending' && tx.status !== 'Pending Approval') return false;
      if (activeTab === 'approved' && tx.status !== 'Approved') return false;
      if (activeTab === 'rejected' && tx.status !== 'Rejected') return false;
      if (activeTab === 'reversed' && tx.status !== 'Reversed') return false;

      // Period filter
      if (periodFilter === 'today' && tx.date !== todayStr) return false;
      if (periodFilter === 'month' && tx.date < monthStartStr) return false;
      if (periodFilter === 'year' && tx.date < yearStartStr) return false;

      // Category filter
      if (categoryFilter !== 'all' && tx.paymentCategory !== categoryFilter) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          tx.transactionNo.toLowerCase().includes(q) ||
          tx.memberName.toLowerCase().includes(q) ||
          tx.memberNo.toLowerCase().includes(q) ||
          tx.bankReference.toLowerCase().includes(q) ||
          tx.submittedBy.toLowerCase().includes(q)
        );
      }

      return true;
    });
  }, [transactions, activeTab, periodFilter, categoryFilter, searchQuery]);

  // FinSec Overview Metrics
  const metrics = useMemo(() => {
    const pending = transactions.filter((t) => t.status === 'Pending Approval');
    const approved = transactions.filter((t) => t.status === 'Approved');
    const rejected = transactions.filter((t) => t.status === 'Rejected');
    const reversed = transactions.filter((t) => t.status === 'Reversed');

    const todayStr = new Date().toISOString().split('T')[0];
    const approvedToday = approved.filter((t) => t.date === todayStr);

    return {
      pendingCount: pending.length,
      pendingAmount: pending.reduce((s, t) => s + t.amount, 0),
      approvedCount: approved.length,
      approvedAmount: approved.reduce((s, t) => s + t.amount, 0),
      approvedTodayAmount: approvedToday.reduce((s, t) => s + t.amount, 0),
      rejectedCount: rejected.length,
      reversedCount: reversed.length,
      reversedAmount: reversed.reduce((s, t) => s + t.amount, 0),
    };
  }, [transactions]);

  // Handle Approve Click
  const handleApproveClick = (tx: PaymentTransaction) => {
    if (!isFinSecOrAdmin) {
      setAlertError('Access Denied: Only Financial Secretary, Super Admin, or Chairman can approve transactions.');
      return;
    }

    // Check if member is registered
    const matchedMember = membersList.find(
      (m) =>
        (tx.memberId && m.id === tx.memberId) ||
        (tx.memberNo && m.memberNo.toLowerCase() === tx.memberNo.toLowerCase()) ||
        m.fullName.toLowerCase() === tx.memberName.toLowerCase()
    );

    if (matchedMember) {
      handleApproveDirect(tx);
    } else {
      // Show Unmatched Prompt Modal
      setUnmatchedTxForApproval(tx);
    }
  };

  // Direct Approval for existing member
  const handleApproveDirect = async (tx: PaymentTransaction) => {
    setActionLoading(true);
    setAlertSuccess(null);
    setAlertError(null);

    try {
      const res = await fetch(apiUrl(`/api/payment-transactions/${tx.id}/approve`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedBy: currentUser.fullName,
          approvedById: currentUser.id,
          approvedByRole: currentUser.role,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAlertSuccess(
          `Transaction ${tx.transactionNo} APPROVED & POSTED! ₦${tx.amount.toLocaleString()} credited. Account balances, wallets, and ledgers updated.`
        );
        fetchTransactions();
        if (onRefreshData) onRefreshData();
      } else {
        setAlertError(data.error || 'Failed to approve transaction.');
      }
    } catch (err) {
      setAlertError('Network error executing transaction approval.');
    } finally {
      setActionLoading(false);
    }
  };

  // Link Transaction to Existing Member and Approve
  const handleLinkMemberAndApprove = async (tx: PaymentTransaction, targetMember: User) => {
    setActionLoading(true);
    setAlertSuccess(null);
    setAlertError(null);

    try {
      // First update payment transaction with target member info
      const updateRes = await fetch(apiUrl(`/api/payment-transactions/${tx.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: targetMember.id,
          memberNo: targetMember.memberNo,
          memberName: targetMember.fullName,
        }),
      });

      if (!updateRes.ok) {
        throw new Error('Failed to associate transaction with selected member.');
      }

      // Approve transaction
      const approveRes = await fetch(apiUrl(`/api/payment-transactions/${tx.id}/approve`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvedBy: currentUser.fullName,
          approvedById: currentUser.id,
          approvedByRole: currentUser.role,
        }),
      });

      const approveData = await approveRes.json();
      if (approveRes.ok && approveData.success) {
        setAlertSuccess(
          `Transaction ${tx.transactionNo} associated with member '${targetMember.fullName}' (${targetMember.memberNo}) and APPROVED successfully!`
        );
        setSearchingMemberTx(null);
        fetchTransactions();
        if (onRefreshData) onRefreshData();
      } else {
        setAlertError(approveData.error || 'Failed to approve linked transaction.');
      }
    } catch (err: any) {
      setAlertError(err.message || 'Error associating member with transaction.');
    } finally {
      setActionLoading(false);
    }
  };

  // Register New Member with Payment Submission
  const handleRegisterNewMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registeringMemberFromTx) return;

    setRegFormError(null);
    if (!regForm.fullName.trim()) {
      setRegFormError('Full Name is required.');
      return;
    }
    if (!regForm.phone.trim()) {
      setRegFormError('Phone Number is required.');
      return;
    }

    if (registeringMemberFromTx.amount < configuredRegFee) {
      setRegFormError(
        `Payment of ₦${registeringMemberFromTx.amount.toLocaleString()} is below the required registration fee of ₦${configuredRegFee.toLocaleString()}. Registration cannot proceed.`
      );
      return;
    }

    setActionLoading(true);

    try {
      const payload = {
        fullName: regForm.fullName.trim(),
        phone: regForm.phone.trim(),
        email: regForm.email.trim(),
        branch: regForm.branch,
        dob: regForm.dob,
        gender: regForm.gender,
        meansOfId: regForm.meansOfId,
        idNumber: regForm.idNumber.trim(),
        residentialAddress: regForm.residentialAddress.trim(),
        occupation: regForm.occupation.trim(),
        transactionId: registeringMemberFromTx.id,
        amountPaid: registeringMemberFromTx.amount,
        datePaid: registeringMemberFromTx.date,
        bankReference: registeringMemberFromTx.bankReference,
        paymentMethod: registeringMemberFromTx.paymentMethod,
        submittedBy: registeringMemberFromTx.submittedBy,
        approvedBy: currentUser.fullName,
        approvedById: currentUser.id,
        approvedByRole: currentUser.role,
      };

      const res = await fetch(apiUrl('/api/members/register-with-payment'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAlertSuccess(
          `Member '${data.member.fullName}' (${data.member.memberNo}) registered & activated! Registration Fee: ₦${data.split.registrationFee.toLocaleString()}, First Savings Deposit: ₦${data.split.firstSavingsDeposit.toLocaleString()}. Transaction ${registeringMemberFromTx.transactionNo} APPROVED.`
        );
        setRegisteringMemberFromTx(null);
        fetchTransactions();
        if (onRefreshData) onRefreshData();
      } else {
        setRegFormError(data.error || 'Failed to register member.');
      }
    } catch (err) {
      setRegFormError('Network error registering new member from transaction.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject Transaction
  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingTx) return;
    if (!rejectionReason.trim()) {
      setAlertError('Please enter a clear rejection reason for the Treasurer.');
      return;
    }

    setActionLoading(true);
    setAlertSuccess(null);
    setAlertError(null);

    try {
      const res = await fetch(apiUrl(`/api/payment-transactions/${rejectingTx.id}/reject`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejectionReason: rejectionReason.trim(),
          rejectedBy: currentUser.fullName,
          rejectedById: currentUser.id,
          rejectedByRole: currentUser.role,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAlertSuccess(`Transaction ${rejectingTx.transactionNo} REJECTED and returned to Treasurer with specified reason.`);
        setRejectingTx(null);
        setRejectionReason('');
        fetchTransactions();
        if (onRefreshData) onRefreshData();
      } else {
        setAlertError(data.error || 'Failed to reject transaction.');
      }
    } catch (err) {
      setAlertError('Network error rejecting transaction.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reverse Transaction
  const handleReverseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reversingTx) return;
    if (!reversalReason.trim()) {
      setAlertError('A detailed reversal reason must be provided for audit compliance.');
      return;
    }

    setActionLoading(true);
    setAlertSuccess(null);
    setAlertError(null);

    try {
      const res = await fetch(apiUrl(`/api/payment-transactions/${reversingTx.id}/reverse`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reversalReason: reversalReason.trim(),
          reversedBy: currentUser.fullName,
          reversedById: currentUser.id,
          reversedByRole: currentUser.role,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAlertSuccess(
          `TRANSACTION REVERSED: ${reversingTx.transactionNo} reversed successfully. Balances, savings/loan ledgers & wallets automatically adjusted.`
        );
        setReversingTx(null);
        setReversalReason('');
        fetchTransactions();
        if (onRefreshData) onRefreshData();
      } else {
        setAlertError(data.error || 'Failed to reverse transaction.');
      }
    } catch (err) {
      setAlertError('Network error executing transaction reversal.');
    } finally {
      setActionLoading(false);
    }
  };

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
      'Rejection Reason',
      'Reversal Reason',
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
      `"${t.rejectionReason || ''}"`,
      `"${t.reversalReason || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `FinSec_Approval_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered members for Search Member modal
  const searchedMembers = useMemo(() => {
    if (!memberSearchQuery.trim()) return membersList.slice(0, 10);
    const q = memberSearchQuery.toLowerCase();
    return membersList.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.memberNo.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        m.email.toLowerCase().includes(q)
    );
  }, [membersList, memberSearchQuery]);

  return (
    <div className="space-y-6 font-poppins">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 font-extrabold text-xs uppercase tracking-wider mb-2 border border-blue-500/30">
            <FileCheck className="w-3.5 h-3.5 text-blue-400" />
            Financial Secretary Approval & Internal Audit Portal
          </div>
          <h1 className="text-2xl font-bold text-white font-poppins">Pending Treasurer Submissions & Verification</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl font-normal">
            Verify Treasurer submissions, approve account postings, auto-split registration fees into savings, register new members directly from submissions, or return entries for correction.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToDashboard && (
            <button
              onClick={onNavigateToDashboard}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400" />
              Return to Dashboard
            </button>
          )}

          <div className="px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span>Internal Control Active</span>
          </div>
        </div>
      </div>

      {alertSuccess && (
        <AlertMessage
          type="success"
          title="FinSec Execution Success"
          message={alertSuccess}
          onClose={() => setAlertSuccess(null)}
        />
      )}

      {alertError && (
        <AlertMessage
          type="error"
          title="FinSec Verification Error"
          message={alertError}
          onClose={() => setAlertError(null)}
        />
      )}

      {/* FinSec Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => setActiveTab('pending')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-amber-500/10 border-amber-500 shadow-md'
              : 'bg-white border-slate-200/80 dark:bg-slate-900 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-amber-700 dark:text-amber-400">
            <span>Pending Treasurer Inbox</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-[#1B2A41] dark:text-white mt-2">
            {metrics.pendingCount} Submissions
          </div>
          <div className="text-xs font-mono font-bold text-amber-600 mt-1">
            ₦{metrics.pendingAmount.toLocaleString()} Awaiting Approval
          </div>
        </div>

        <div
          onClick={() => setActiveTab('approved')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'approved'
              ? 'bg-emerald-500/10 border-emerald-500 shadow-md'
              : 'bg-white border-slate-200/80 dark:bg-slate-900 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-emerald-700 dark:text-emerald-400">
            <span>Total Approved & Posted</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-[#1B2A41] dark:text-white mt-2">
            ₦{metrics.approvedAmount.toLocaleString()}
          </div>
          <div className="text-xs font-semibold text-emerald-600 mt-1">
            {metrics.approvedCount} Active Financial Entries
          </div>
        </div>

        <div
          onClick={() => setActiveTab('rejected')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'rejected'
              ? 'bg-rose-500/10 border-rose-500 shadow-md'
              : 'bg-white border-slate-200/80 dark:bg-slate-900 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-rose-700 dark:text-rose-400">
            <span>Rejected Submissions</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-[#1B2A41] dark:text-white mt-2">
            {metrics.rejectedCount} Transactions
          </div>
          <div className="text-xs font-medium text-rose-600 mt-1">Returned to Treasurer</div>
        </div>

        <div
          onClick={() => setActiveTab('reversed')}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            activeTab === 'reversed'
              ? 'bg-purple-500/10 border-purple-500 shadow-md'
              : 'bg-white border-slate-200/80 dark:bg-slate-900 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-medium text-purple-700 dark:text-purple-400">
            <span>Reversed Transactions</span>
            <RotateCcw className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-[#1B2A41] dark:text-white mt-2">
            {metrics.reversedCount} Reversals
          </div>
          <div className="text-xs font-mono font-bold text-purple-600 mt-1">
            ₦{metrics.reversedAmount.toLocaleString()} Adjusted
          </div>
        </div>
      </div>

      {/* Navigation Tabs & Filter Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Pending Treasurer Submissions ({metrics.pendingCount})
            </button>

            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'approved'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Approved ({metrics.approvedCount})
            </button>

            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'rejected'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              Rejected ({metrics.rejectedCount})
            </button>

            <button
              onClick={() => setActiveTab('reversed')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'reversed'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reversed ({metrics.reversedCount})
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              All Records
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export Audit Excel (CSV)
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <label className="block text-xs font-medium text-[#495057] mb-1">Search</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tx No, Member Name, Ref..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#495057] mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs font-medium px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="all">All Categories</option>
              <option value="Registration Fee">Registration Fee</option>
              <option value="Savings Deposit">Savings Deposit</option>
              <option value="Loan Repayment">Loan Repayment</option>
              <option value="Interest Payment">Interest Payment</option>
              <option value="Other Income">Other Income</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#495057] mb-1">Time Period</label>
            <select
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value as any)}
              className="w-full text-xs font-medium px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-xs font-semibold uppercase text-slate-600 dark:text-slate-300 tracking-wider">
                <th className="p-3">Date & Time</th>
                <th className="p-3">Member Name & Contact</th>
                <th className="p-3">Member ID</th>
                <th className="p-3">Category & Method</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3">Bank Ref</th>
                <th className="p-3">Treasurer</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Verification Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs text-slate-800 dark:text-slate-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500 font-normal">
                    No pending treasurer submissions found matching the selected view filter.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const matchedUser = membersList.find(
                    (m) =>
                      (tx.memberId && m.id === tx.memberId) ||
                      (tx.memberNo && m.memberNo.toLowerCase() === tx.memberNo.toLowerCase()) ||
                      m.fullName.toLowerCase() === tx.memberName.toLowerCase()
                  );

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold font-mono text-slate-900 dark:text-white">
                          {tx.transactionNo}
                        </div>
                        <div className="text-xs text-[#495057]">{tx.date}</div>
                      </td>

                      <td className="p-3">
                        <div className="font-semibold text-[#0F5132] dark:text-emerald-400">{tx.memberName}</div>
                        <div className="text-xs text-[#495057]">{matchedUser ? matchedUser.phone : 'Not Registered'}</div>
                      </td>

                      <td className="p-3">
                        {matchedUser ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 font-mono text-xs font-semibold">
                            {matchedUser.memberNo}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 font-mono text-xs font-medium">
                            {tx.memberNo || 'Unregistered'}
                          </span>
                        )}
                      </td>

                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {tx.paymentCategory}
                        </span>
                        <div className="text-xs text-[#495057] mt-0.5">{tx.paymentMethod}</div>
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                        ₦{tx.amount.toLocaleString()}
                      </td>

                      <td className="p-3">
                        <div className="font-mono text-xs text-slate-700 dark:text-slate-300 font-semibold">
                          {tx.bankReference}
                        </div>
                        <div className="text-xs text-[#495057] truncate max-w-[120px]">{tx.description}</div>
                      </td>

                      <td className="p-3">
                        <div className="text-xs font-medium text-slate-800 dark:text-slate-200">{tx.submittedBy}</div>
                        <div className="text-xs text-[#495057]">Treasurer</div>
                      </td>

                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            tx.status === 'Approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300'
                              : tx.status === 'Pending Approval'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300'
                              : tx.status === 'Rejected'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300'
                              : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300'
                          }`}
                        >
                          {tx.status}
                        </span>

                        {tx.rejectionReason && (
                          <div className="text-xs text-rose-600 dark:text-rose-400 mt-1 font-semibold text-left bg-rose-50 dark:bg-rose-950/40 p-1.5 rounded-md border border-rose-200">
                            Rejection Note: {tx.rejectionReason}
                          </div>
                        )}
                      </td>

                      <td className="p-3 text-right">
                        {tx.status === 'Pending Approval' && isFinSecOrAdmin && (
                          <div className="flex flex-wrap items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleApproveClick(tx)}
                              disabled={actionLoading}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Approve & Post to Member Ledger"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Approve
                            </button>

                            <button
                              onClick={() => {
                                setRegisteringMemberFromTx(tx);
                                setRegForm((prev) => ({
                                  ...prev,
                                  fullName: tx.memberName,
                                  phone: matchedUser ? matchedUser.phone : '',
                                }));
                              }}
                              disabled={actionLoading}
                              className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Register as New Member & Split Fee/Savings"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              Register New
                            </button>

                            <button
                              onClick={() => {
                                setSearchingMemberTx(tx);
                                setMemberSearchQuery(tx.memberName);
                              }}
                              disabled={actionLoading}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-white font-semibold text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Search and Link Existing Member"
                            >
                              <Search className="w-3.5 h-3.5" />
                              Search
                            </button>

                            <button
                              onClick={() => {
                                setRejectingTx(tx);
                                setRejectionReason('');
                              }}
                              disabled={actionLoading}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Reject & Request Correction"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        )}

                        {tx.status === 'Approved' && isFinSecOrAdmin && (
                          <button
                            onClick={() => {
                              setReversingTx(tx);
                              setReversalReason('');
                            }}
                            disabled={actionLoading}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-purple-900 text-purple-300 border border-purple-500/40 font-semibold text-xs transition-colors flex items-center gap-1.5 ml-auto cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                            Reverse
                          </button>
                        )}

                        {tx.status === 'Rejected' && (
                          <span className="text-xs text-rose-500 font-medium italic">Returned to Treasurer</span>
                        )}

                        {tx.status === 'Reversed' && (
                          <span className="text-xs text-purple-500 font-medium italic">Reversed & Audited</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Decision Modal: Member Not Found */}
      {unmatchedTxForApproval && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 font-poppins">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-[#1B2A41] dark:text-white text-base">Member Not Found in Directory</h3>
              </div>
              <button onClick={() => setUnmatchedTxForApproval(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-2">
              <p className="font-semibold text-sm">
                Member "{unmatchedTxForApproval.memberName}" ({unmatchedTxForApproval.memberNo || 'No Member ID'}) was submitted by Treasurer {unmatchedTxForApproval.submittedBy} for payment of ₦{unmatchedTxForApproval.amount.toLocaleString()} ({unmatchedTxForApproval.paymentCategory}), but no matching registered member was found.
              </p>
              <div className="font-semibold text-amber-800 dark:text-amber-300 text-sm">
                Is this a new member?
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => {
                  setRegisteringMemberFromTx(unmatchedTxForApproval);
                  setRegForm((prev) => ({ ...prev, fullName: unmatchedTxForApproval.memberName }));
                  setUnmatchedTxForApproval(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Register New Member
              </button>

              <button
                onClick={() => {
                  setSearchingMemberTx(unmatchedTxForApproval);
                  setMemberSearchQuery(unmatchedTxForApproval.memberName);
                  setUnmatchedTxForApproval(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                Search Again
              </button>

              <button
                onClick={() => setUnmatchedTxForApproval(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs hover:bg-slate-300"
              >
                Cancel
              </button>
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3">
              <button
                onClick={() => setUnmatchedTxForApproval(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-xs flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>

              {onNavigateToDashboard && (
                <button
                  onClick={() => {
                    setUnmatchedTxForApproval(null);
                    onNavigateToDashboard();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 font-medium text-xs flex items-center gap-1"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Return to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. New Member Registration Modal */}
      {registeringMemberFromTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 font-poppins overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-6 space-y-4 my-8">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-[#1B2A41] dark:text-white text-base">
                  Register New Member from Treasurer Submission
                </h3>
              </div>
              <button onClick={() => setRegisteringMemberFromTx(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Carried Forward Information Banner */}
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 space-y-2 text-xs">
              <div className="font-bold text-[#0F5132] dark:text-emerald-300 uppercase tracking-wide">
                Carried-Forward Treasurer Submission Details
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-slate-700 dark:text-slate-300">
                <div><strong>Amount Paid:</strong> ₦{registeringMemberFromTx.amount.toLocaleString()}</div>
                <div><strong>Payment Date:</strong> {registeringMemberFromTx.date}</div>
                <div><strong>Bank Ref:</strong> {registeringMemberFromTx.bankReference}</div>
                <div><strong>Treasurer:</strong> {registeringMemberFromTx.submittedBy}</div>
                <div><strong>Method:</strong> {registeringMemberFromTx.paymentMethod}</div>
              </div>

              {/* Dynamic Fee Splitting Live Breakdown */}
              <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 mt-2 space-y-1">
                <div className="font-bold text-[#0F5132] dark:text-emerald-400 flex items-center justify-between">
                  <span>Automatic Payment Splitting Engine</span>
                  <span className="text-xs bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 rounded-full text-emerald-800 dark:text-emerald-300">
                    Configured Fee: ₦{configuredRegFee.toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-1">
                  <div className="p-2 rounded-md bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200">
                    Registration Fee Income: ₦{configuredRegFee.toLocaleString()}
                    <div className="text-[10px] font-normal text-amber-700 dark:text-amber-400">Cooperative Main Wallet (Non-Savings)</div>
                  </div>
                  <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200">
                    First Savings Deposit: ₦{Math.max(0, registeringMemberFromTx.amount - configuredRegFee).toLocaleString()}
                    <div className="text-[10px] font-normal text-emerald-700 dark:text-emerald-400">Member Passbook Ledger</div>
                  </div>
                </div>

                {registeringMemberFromTx.amount < configuredRegFee && (
                  <div className="text-xs text-rose-600 font-bold mt-1 bg-rose-50 p-2 rounded-md border border-rose-200">
                    ⚠️ Payment is below the required registration fee of ₦{configuredRegFee.toLocaleString()}. Registration cannot proceed until the minimum fee is received.
                  </div>
                )}
              </div>
            </div>

            {regFormError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
                {regFormError}
              </div>
            )}

            <form onSubmit={handleRegisterNewMemberSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-medium text-[#495057] mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={regForm.fullName}
                    onChange={(e) => setRegForm({ ...regForm, fullName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#495057] mb-1">Phone Number *</label>
                  <input
                    type="text"
                    value={regForm.phone}
                    onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                    placeholder="e.g. 08012345678"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#495057] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={regForm.email}
                    onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                    placeholder="member@example.com"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  />
                </div>

                <div>
                  <label className="block font-medium text-[#495057] mb-1">Cooperative Branch</label>
                  <select
                    value={regForm.branch}
                    onChange={(e) => setRegForm({ ...regForm, branch: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  >
                    {COOPERATIVE_BRANCHES.map((b) => (
                      <option key={b.id} value={b.name}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#495057] mb-1">Means of Identification</label>
                  <select
                    value={regForm.meansOfId}
                    onChange={(e) => setRegForm({ ...regForm, meansOfId: e.target.value as MeansOfId })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  >
                    <option value="NIN">National Identity Number (NIN)</option>
                    <option value="Voter's Card">Voter's Card</option>
                    <option value="Driver's License">Driver's License</option>
                    <option value="International Passport">International Passport</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-[#495057] mb-1">ID Number / NIN</label>
                  <input
                    type="text"
                    value={regForm.idNumber}
                    onChange={(e) => setRegForm({ ...regForm, idNumber: e.target.value })}
                    placeholder="11-digit NIN or ID No"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#495057] mb-1 text-xs">Residential Address</label>
                <input
                  type="text"
                  value={regForm.residentialAddress}
                  onChange={(e) => setRegForm({ ...regForm, residentialAddress: e.target.value })}
                  placeholder="Street Address, City, State"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium"
                />
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRegisteringMemberFromTx(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>

                  {onNavigateToDashboard && (
                    <button
                      type="button"
                      onClick={() => {
                        setRegisteringMemberFromTx(null);
                        onNavigateToDashboard();
                      }}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      Return to Dashboard
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setRegisteringMemberFromTx(null)}
                    className="px-4 py-2 rounded-xl bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || registeringMemberFromTx.amount < configuredRegFee}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer flex-1 sm:flex-initial"
                  >
                    {actionLoading ? 'Registering...' : 'Register Member & Approve Payment'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Search Existing Member Modal */}
      {searchingMemberTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 font-poppins">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-[#1B2A41] dark:text-white text-base">
                  Associate Transaction with Existing Member
                </h3>
              </div>
              <button onClick={() => setSearchingMemberTx(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-blue-50 text-blue-900 text-xs">
              Associating payment <strong>{searchingMemberTx.transactionNo}</strong> (₦{searchingMemberTx.amount.toLocaleString()}, Ref: {searchingMemberTx.bankReference}) submitted by Treasurer. Select member below:
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Name, Membership No, Phone..."
                value={memberSearchQuery}
                onChange={(e) => setMemberSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
              />
            </div>

            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
              {searchedMembers.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 font-normal">
                  No members found matching "{memberSearchQuery}".
                </div>
              ) : (
                searchedMembers.map((m) => (
                  <div key={m.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-[#0F5132] text-xs">{m.fullName}</div>
                      <div className="text-[11px] text-slate-500 font-mono">{m.memberNo} • {m.phone}</div>
                    </div>
                    <button
                      onClick={() => handleLinkMemberAndApprove(searchingMemberTx, m)}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer"
                    >
                      Select & Approve
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3">
              <button
                onClick={() => setSearchingMemberTx(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-xs flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>

              {onNavigateToDashboard && (
                <button
                  onClick={() => {
                    setSearchingMemberTx(null);
                    onNavigateToDashboard();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 font-medium text-xs flex items-center gap-1"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Return to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. Rejection Reason Modal */}
      {rejectingTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 font-poppins">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <h3 className="font-semibold text-[#1B2A41] dark:text-white text-base">Reject Payment Transaction</h3>
              </div>
              <button onClick={() => setRejectingTx(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
              <div><strong>Tx No:</strong> {rejectingTx.transactionNo}</div>
              <div><strong>Member:</strong> {rejectingTx.memberName} ({rejectingTx.memberNo})</div>
              <div><strong>Amount:</strong> ₦{rejectingTx.amount.toLocaleString()}</div>
              <div><strong>Ref:</strong> {rejectingTx.bankReference}</div>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1B2A41] dark:text-slate-200 mb-1">
                  Rejection Reason (Required for Treasurer Review) *
                </label>
                <textarea
                  rows={3}
                  placeholder="Explain why this payment is being rejected (e.g., Bank Alert reference mismatch, incorrect amount, double submission)..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRejectingTx(null)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-xs flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>

                  {onNavigateToDashboard && (
                    <button
                      type="button"
                      onClick={() => {
                        setRejectingTx(null);
                        onNavigateToDashboard();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 font-medium text-xs flex items-center gap-1"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      Return
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectingTx(null)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-200 text-slate-800 text-xs font-semibold"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Reversal Reason Modal */}
      {reversingTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 font-poppins">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-[#1B2A41] dark:text-white text-base">Execute Transaction Reversal</h3>
              </div>
              <button onClick={() => setReversingTx(null)} className="text-slate-400 font-bold">✕</button>
            </div>

            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-900 dark:text-purple-200 text-xs space-y-1">
              <div className="font-bold">⚠️ Audited Accounting Reversal Protocol</div>
              <div><strong>Tx No:</strong> {reversingTx.transactionNo}</div>
              <div><strong>Member:</strong> {reversingTx.memberName} ({reversingTx.memberNo})</div>
              <div><strong>Amount to Reverse:</strong> ₦{reversingTx.amount.toLocaleString()} ({reversingTx.paymentCategory})</div>
              <p className="text-xs text-[#495057] dark:text-slate-400 mt-1">
                This operation will automatically debit member savings/loan balance, adjust wallet ledgers, and log a critical audit entry.
              </p>
            </div>

            <form onSubmit={handleReverseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#1B2A41] dark:text-slate-200 mb-1">
                  Reversal Reason (Mandatory for Audit Compliance) *
                </label>
                <textarea
                  rows={3}
                  placeholder="Specify official audit reason e.g., 'Bank chargeback alert confirmed by bank', 'Duplicate posting correction', 'Executive reversal authorization'..."
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  className="w-full p-3 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setReversingTx(null)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-xs flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>

                  {onNavigateToDashboard && (
                    <button
                      type="button"
                      onClick={() => {
                        setReversingTx(null);
                        onNavigateToDashboard();
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 font-medium text-xs flex items-center gap-1"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5" />
                      Return
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setReversingTx(null)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-200 text-slate-800 text-xs font-semibold"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="px-4 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    {actionLoading ? 'Reversing...' : 'Execute Reversal'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
