import React, { useState, useEffect, useMemo } from 'react';
import {
  HandCoins,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileCheck2,
  Building,
  CreditCard,
  Printer,
  ChevronRight,
  ShieldAlert,
  UserCheck,
  TrendingUp,
  X,
  Sparkles,
  RefreshCw,
  Eye,
  FileText,
  DollarSign,
  AlertTriangle,
  Info,
  BadgeCheck,
  Calendar,
  Layers,
  ArrowRight,
  ArrowLeft,
  User,
  Wallet,
  ShieldCheck,
} from 'lucide-react';
import {
  User as UserType,
  UserRole,
  LoanApplication,
  LoanStatus,
  LoanSummaryStats,
  PaymentMethod,
  RepaymentInstallment,
} from '../../types';
import { CoopLogo } from '../CoopLogo';
import { LoanBalanceModule } from '../LoanBalanceModule';

interface LoanManagementViewProps {
  users: UserType[];
  currentUserRole?: UserRole;
  currentUserName?: string;
  currentUserId?: string;
  loans: LoanApplication[];
  stats: LoanSummaryStats;
  initialTab?: 'applications_and_active' | 'guarantor_exposure' | 'repayment_schedules' | 'approval_audit_trail' | 'loan_balances';
  onApplyLoan: (data: any) => Promise<{ success: boolean; message: string; error?: string }>;
  onGuarantorDecision?: (id: string, decision: 'accept' | 'reject', pinOrPassword?: string, guarantorNotes?: string) => Promise<{ success: boolean; message: string; error?: string }>;
  onVerifyLoan: (id: string, action: 'verify' | 'reject', notes?: string) => Promise<{ success: boolean; message: string; error?: string }>;
  onApproveLoan: (id: string, action: 'approve' | 'reject', notes?: string) => Promise<{ success: boolean; message: string; error?: string }>;
  onDisburseLoan: (id: string, data: { disbursementMethod: string; disbursementVoucherRef: string; disbursementNotes?: string }) => Promise<{ success: boolean; message: string; error?: string }>;
  onRepayLoan: (id: string, data: { amountPaid: number; paymentDate: string; paymentMethod: string; referenceNumber: string; receivedBy: string; notes?: string }) => Promise<{ success: boolean; message: string; error?: string }>;
  onRefreshData?: () => void;
}

export const LoanManagementView: React.FC<LoanManagementViewProps> = ({
  users,
  currentUserRole = 'sys_admin',
  currentUserName = 'Mr. Ige Ebenezer',
  currentUserId = 'usr_admin01',
  loans = [],
  stats,
  initialTab = 'applications_and_active',
  onApplyLoan,
  onGuarantorDecision,
  onVerifyLoan,
  onApproveLoan,
  onDisburseLoan,
  onRepayLoan,
  onRefreshData,
}) => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<'applications_and_active' | 'guarantor_exposure' | 'repayment_schedules' | 'approval_audit_trail' | 'loan_balances'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Selected Loan for Detail View / Modals
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);

  // Modal Visibility States
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [isGuarantorModalOpen, setIsGuarantorModalOpen] = useState(false);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState(false);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);

  // Form States
  const [applyForm, setApplyForm] = useState({
    memberNo: '',
    loanAmount: 1000000,
    interestRate: 12,
    repaymentPeriodMonths: 11,
    loanPurpose: '',
    guarantorMemberNo: '',
  });

  const [guarantorForm, setGuarantorForm] = useState({
    pinOrPassword: '',
    guarantorNotes: '',
  });

  const [verifyForm, setVerifyForm] = useState({
    verificationNotes: '',
  });

  const [approveForm, setApproveForm] = useState({
    approvalNotes: '',
  });

  const [disburseForm, setDisburseForm] = useState({
    disbursementMethod: 'Bank Transfer' as PaymentMethod,
    disbursementVoucherRef: `VOUCHER-${Date.now().toString().slice(-6)}`,
    disbursementNotes: 'Disbursed via Treasury Direct Bank Transfer',
  });

  const [repayForm, setRepayForm] = useState({
    amountPaid: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer' as PaymentMethod,
    referenceNumber: `TRF-${Date.now().toString().slice(-6)}`,
    receivedBy: currentUserName,
    notes: 'Monthly loan repayment installment',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Filtered Loans
  const filteredLoans = useMemo(() => {
    return loans.filter((l) => {
      const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        l.loanNo.toLowerCase().includes(q) ||
        l.memberName.toLowerCase().includes(q) ||
        l.memberNo.toLowerCase().includes(q) ||
        l.guarantorName.toLowerCase().includes(q) ||
        l.guarantorMemberNo.toLowerCase().includes(q) ||
        l.loanPurpose.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [loans, statusFilter, searchQuery]);

  // Live Loan Application Eligibility Calculator for Form
  const liveApplicant = useMemo(() => {
    if (!applyForm.memberNo) return null;
    return users.find((u) => u.memberNo.toLowerCase() === applyForm.memberNo.toLowerCase());
  }, [users, applyForm.memberNo]);

  const liveGuarantor = useMemo(() => {
    if (!applyForm.guarantorMemberNo) return null;
    return users.find((u) => u.memberNo.toLowerCase() === applyForm.guarantorMemberNo.toLowerCase());
  }, [users, applyForm.guarantorMemberNo]);

  const liveEligibility = useMemo(() => {
    if (!liveApplicant) return null;
    const savings = liveApplicant.savingsBalance || 0;
    const maxLimit = savings * 3; // 3x Savings Rule
    const requested = Number(applyForm.loanAmount) || 0;
    const isSavingsValid = requested <= maxLimit;
    const isMemberActive = liveApplicant.status === 'active';

    let guarantorSavings = 0;
    let isGuarantorValid = false;

    if (liveGuarantor) {
      guarantorSavings = liveGuarantor.savingsBalance || 0;
      isGuarantorValid = liveGuarantor.status === 'active' && guarantorSavings >= requested;
    }

    return {
      savings,
      maxLimit,
      requested,
      isSavingsValid,
      isMemberActive,
      guarantorSavings,
      isGuarantorValid,
      qualifiesOverall: isMemberActive && isSavingsValid && isGuarantorValid,
    };
  }, [liveApplicant, liveGuarantor, applyForm.loanAmount]);

  // Format Currency
  const formatNaira = (val: number) => {
    return `₦${Number(val || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`;
  };

  // Status Badge Styling Helper
  const getStatusBadge = (status: LoanStatus) => {
    switch (status) {
      case 'Waiting for Guarantor Approval':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 w-fit"><Clock className="w-3 h-3 text-amber-700" /> Step 1: Waiting Guarantor</span>;
      case 'Pending':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-100 text-sky-900 border border-sky-300 flex items-center gap-1 w-fit"><FileCheck2 className="w-3 h-3 text-sky-700" /> Step 2: Pending FinSec Verification</span>;
      case 'Rejected by Guarantor':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1 w-fit"><AlertTriangle className="w-3 h-3 text-rose-700" /> Rejected by Guarantor</span>;
      case 'Verified':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1 w-fit"><ShieldAlert className="w-3 h-3 text-blue-700" /> Step 3: Verified (FinSec)</span>;
      case 'Approved':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1 w-fit"><BadgeCheck className="w-3 h-3 text-purple-700" /> Step 4: Approved (Chairman)</span>;
      case 'Disbursed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 w-fit"><TrendingUp className="w-3 h-3 text-emerald-700" /> Step 5: Disbursed & Active</span>;
      case 'Completed':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-300 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3 text-gray-700" /> Step 6: Fully Repaid</span>;
      case 'Rejected':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1 w-fit"><AlertTriangle className="w-3 h-3" /> Application Rejected</span>;
      case 'Defaulted':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-200 text-red-900 border border-red-300 flex items-center gap-1 w-fit"><AlertCircle className="w-3 h-3" /> Loan Defaulted</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  // Handlers
  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMessage(null);

    const res = await onApplyLoan(applyForm);
    setIsSubmitting(false);

    if (res.success) {
      setFeedbackMessage({ type: 'success', text: res.message });
      setIsApplyModalOpen(false);
      setApplyForm({
        memberNo: '',
        loanAmount: 1000000,
        interestRate: 12,
        repaymentPeriodMonths: 12,
        loanPurpose: '',
        guarantorMemberNo: '',
      });
    } else {
      setFeedbackMessage({ type: 'error', text: res.error || 'Failed to submit loan application.' });
    }
  };

  const handleGuarantorSubmit = async (decision: 'accept' | 'reject') => {
    if (!selectedLoan || !onGuarantorDecision) return;
    if (decision === 'accept' && !guarantorForm.pinOrPassword.trim()) {
      setFeedbackMessage({ type: 'error', text: 'Security Password or PIN is required to confirm your legally binding guarantor agreement.' });
      return;
    }

    setIsSubmitting(true);
    setFeedbackMessage(null);

    const res = await onGuarantorDecision(
      selectedLoan.id,
      decision,
      guarantorForm.pinOrPassword,
      guarantorForm.guarantorNotes
    );
    setIsSubmitting(false);

    if (res.success) {
      setFeedbackMessage({ type: 'success', text: res.message });
      setIsGuarantorModalOpen(false);
      setSelectedLoan(null);
      setGuarantorForm({ pinOrPassword: '', guarantorNotes: '' });
      if (onRefreshData) onRefreshData();
    } else {
      setFeedbackMessage({ type: 'error', text: res.error || 'Failed to process guarantor decision.' });
    }
  };

  const handleVerifySubmit = async (action: 'verify' | 'reject') => {
    if (!selectedLoan) return;
    setIsSubmitting(true);
    setFeedbackMessage(null);

    const res = await onVerifyLoan(selectedLoan.id, action, verifyForm.verificationNotes);
    setIsSubmitting(false);

    if (res.success) {
      setFeedbackMessage({ type: 'success', text: res.message });
      setIsVerifyModalOpen(false);
      setSelectedLoan(null);
    } else {
      setFeedbackMessage({ type: 'error', text: res.error || 'Failed to verify loan.' });
    }
  };

  const handleApproveSubmit = async (action: 'approve' | 'reject') => {
    if (!selectedLoan) return;
    setIsSubmitting(true);
    setFeedbackMessage(null);

    const res = await onApproveLoan(selectedLoan.id, action, approveForm.approvalNotes);
    setIsSubmitting(false);

    if (res.success) {
      setFeedbackMessage({ type: 'success', text: res.message });
      setIsApproveModalOpen(false);
      setSelectedLoan(null);
    } else {
      setFeedbackMessage({ type: 'error', text: res.error || 'Failed to approve loan.' });
    }
  };

  const handleDisburseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    setIsSubmitting(true);
    setFeedbackMessage(null);

    const res = await onDisburseLoan(selectedLoan.id, disburseForm);
    setIsSubmitting(false);

    if (res.success) {
      setFeedbackMessage({ type: 'success', text: res.message });
      setIsDisburseModalOpen(false);
      setSelectedLoan(null);
    } else {
      setFeedbackMessage({ type: 'error', text: res.error || 'Failed to disburse loan.' });
    }
  };

  const handleRepaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan) return;
    setIsSubmitting(true);
    setFeedbackMessage(null);

    const res = await onRepayLoan(selectedLoan.id, repayForm);
    setIsSubmitting(false);

    if (res.success) {
      setFeedbackMessage({ type: 'success', text: res.message });
      setIsRepayModalOpen(false);
      setSelectedLoan(null);
    } else {
      setFeedbackMessage({ type: 'error', text: res.error || 'Failed to record repayment.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-900 rounded-2xl p-6 text-white shadow-xl border border-emerald-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-400/20 text-amber-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider border border-amber-400/30 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Lightway Cooperative Standard Loan Engine
              </span>
              <span className="bg-emerald-700/60 text-emerald-100 text-xs font-medium px-2.5 py-1 rounded-full">
                6-Step Lifecycle Compliant
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
              <HandCoins className="w-8 h-8 text-amber-400" /> Loan Management Module
            </h1>
            <p className="text-emerald-100/90 text-sm mt-1 max-w-2xl">
              Strict 6-step workflow: Member Application &rarr; FinSec Verification &rarr; Chairman Board Approval &rarr; Treasurer Disbursement &rarr; Repayment Amortization Ledger.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onRefreshData && (
              <button
                onClick={onRefreshData}
                className="px-3.5 py-2.5 bg-emerald-800/80 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl border border-emerald-600/60 transition-all flex items-center gap-2"
                title="Refresh Loan Records"
              >
                <RefreshCw className="w-4 h-4" /> Refresh
              </button>
            )}

            <button
              onClick={() => setIsApplyModalOpen(true)}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-amber-400/20 hover:scale-[1.02] flex items-center gap-2"
            >
              <Plus className="w-5 h-5" /> Submit Loan Application
            </button>
          </div>
        </div>
      </div>

      {/* Role Context Bar */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm">
          <span className="text-gray-500 font-medium">Logged in Officer:</span>
          <span className="font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg border border-gray-200">
            {currentUserName}
          </span>
          <span className="text-gray-500 font-medium">Role:</span>
          <span className="font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 capitalize">
            {currentUserRole.replace('_', ' ')}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">
          <Info className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            {currentUserRole === 'financial_secretary' && 'Your role can VERIFY applications (Steps 2 & 3).'}
            {currentUserRole === 'chairman' && 'Your role can APPROVE verified applications (Step 4).'}
            {currentUserRole === 'treasurer' && 'Your role can DISBURSE approved loans (Step 5).'}
            {(currentUserRole === 'sys_admin' || currentUserRole === 'auditor') && 'System Administrator view has full multi-role approval override capabilities.'}
            {currentUserRole === 'member' && 'You can submit loan applications and track your repayment schedule.'}
          </span>
        </div>
      </div>

      {/* Feedback Alert */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm font-medium ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-gray-400 hover:text-gray-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Bento Grid Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Disbursed Capital */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Disbursed</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-gray-900 tracking-tight">{formatNaira(stats?.totalDisbursedAmount || 0)}</span>
            <p className="text-xs text-emerald-700 mt-1 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {stats?.activeDisbursedLoansCount || 0} Active Disbursed Loans
            </p>
          </div>
        </div>

        {/* Total Outstanding Balance */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Outstanding Balance</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-900 tracking-tight">{formatNaira(stats?.totalOutstandingBalance || 0)}</span>
            <p className="text-xs text-amber-700 mt-1 font-medium">Principal + Amortized Interest</p>
          </div>
        </div>

        {/* Total Repaid Capital */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Repaid Capital</span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <BadgeCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-blue-900 tracking-tight">{formatNaira(stats?.totalRepaidAmount || 0)}</span>
            <p className="text-xs text-blue-700 mt-1 font-medium">Settled via Payroll/Transfer</p>
          </div>
        </div>

        {/* Approval Pipeline */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-xs hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Approval Pipeline</span>
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 space-y-1 text-xs">
            <div className="flex justify-between items-center text-amber-900 font-semibold bg-amber-50 px-2 py-0.5 rounded-md">
              <span>Step 1 (Guarantor Review):</span>
              <span>{stats?.pendingGuarantorApprovalCount || 0} loans</span>
            </div>
            <div className="flex justify-between items-center text-sky-900 font-semibold bg-sky-50 px-2 py-0.5 rounded-md">
              <span>Step 2 (FinSec Verify):</span>
              <span>{stats?.pendingVerificationCount || 0} loans</span>
            </div>
            <div className="flex justify-between items-center text-purple-900 font-semibold bg-purple-50 px-2 py-0.5 rounded-md">
              <span>Step 3 (Chairman Approve):</span>
              <span>{stats?.pendingApprovalCount || 0} loans</span>
            </div>
            <div className="flex justify-between items-center text-emerald-900 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
              <span>Step 4 (Treasurer Disburse):</span>
              <span>{stats?.pendingDisbursementCount || 0} loans</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive 6-Step Workflow Visualizer */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" /> Lightway Cooperative Multi-Level Loan Approval Process
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-2 relative">
          {/* Step 1 */}
          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 relative">
            <div className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded w-fit mb-1">Step 1</div>
            <div className="text-xs font-bold text-emerald-900">Application</div>
            <p className="text-[11px] text-emerald-700 mt-0.5">Member submits application & selects guarantor</p>
          </div>

          {/* Step 2 */}
          <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-300 relative">
            <div className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded w-fit mb-1">Step 2</div>
            <div className="text-xs font-bold text-amber-900">Guarantor Review</div>
            <p className="text-[11px] text-amber-800 mt-0.5">Guarantor accepts/rejects with Password/PIN</p>
          </div>

          {/* Step 3 */}
          <div className="bg-sky-50/70 p-3 rounded-xl border border-sky-300 relative">
            <div className="text-xs font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded w-fit mb-1">Step 3</div>
            <div className="text-xs font-bold text-sky-900">FinSec Verification</div>
            <p className="text-[11px] text-sky-800 mt-0.5">Verifies 3x savings limit, active status & eligibility</p>
          </div>

          {/* Step 4 */}
          <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-200 relative">
            <div className="text-xs font-bold text-purple-800 bg-purple-100 px-2 py-0.5 rounded w-fit mb-1">Step 4</div>
            <div className="text-xs font-bold text-purple-900">Chairman Sign-off</div>
            <p className="text-[11px] text-purple-700 mt-0.5">Executive Chairman grants final board approval</p>
          </div>

          {/* Step 5 */}
          <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 relative">
            <div className="text-xs font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded w-fit mb-1">Step 5</div>
            <div className="text-xs font-bold text-blue-900">Treasurer Release</div>
            <p className="text-[11px] text-blue-700 mt-0.5">Treasurer releases funds, generates repayment schedule</p>
          </div>

          {/* Step 6 */}
          <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 relative">
            <div className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded w-fit mb-1">Step 6</div>
            <div className="text-xs font-bold text-emerald-900">Repayments</div>
            <p className="text-[11px] text-emerald-700 mt-0.5">Monthly amortization credited until balance = ₦0</p>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="border-b border-gray-200 bg-white rounded-t-2xl px-6 pt-4">
        <div className="flex flex-wrap gap-4 -mb-px">
          <button
            onClick={() => setActiveTab('applications_and_active')}
            className={`pb-4 px-2 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'applications_and_active'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <HandCoins className="w-4 h-4" /> Loan Applications & Active Loans ({filteredLoans.length})
          </button>

          <button
            onClick={() => setActiveTab('guarantor_exposure')}
            className={`pb-4 px-2 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'guarantor_exposure'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <ShieldAlert className="w-4 h-4" /> Guarantor Exposure & Savings Encumbrance
          </button>

          <button
            onClick={() => setActiveTab('repayment_schedules')}
            className={`pb-4 px-2 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'repayment_schedules'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Calendar className="w-4 h-4" /> Amortization Schedules
          </button>

          <button
            onClick={() => setActiveTab('approval_audit_trail')}
            className={`pb-4 px-2 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'approval_audit_trail'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" /> Multi-Level Approval Audit Trail
          </button>

          <button
            onClick={() => setActiveTab('loan_balances')}
            className={`pb-4 px-2 font-semibold text-sm transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'loan_balances'
                ? 'border-amber-500 text-amber-900 font-extrabold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Wallet className="w-4 h-4 text-amber-600" /> Real-Time Loan Balance Ledger
          </button>
        </div>
      </div>

      {/* TAB 1: Loan Applications & Active Loans Table */}
      {activeTab === 'applications_and_active' && (
        <div className="bg-white rounded-b-2xl border border-t-0 border-gray-200 p-6 space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search Loan No, Member Name, Member No, Guarantor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-gray-500 uppercase">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="all">All Loan Statuses</option>
                <option value="Waiting for Guarantor Approval">Step 1: Waiting Guarantor Approval</option>
                <option value="Pending">Step 2: Pending Verification (FinSec)</option>
                <option value="Verified">Step 3: Verified (FinSec)</option>
                <option value="Approved">Step 4: Approved (Chairman)</option>
                <option value="Disbursed">Step 5: Disbursed & Active</option>
                <option value="Completed">Step 6: Completed (Repaid)</option>
                <option value="Rejected by Guarantor">Rejected by Guarantor</option>
                <option value="Rejected">Application Rejected</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold text-xs uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-4">Loan No & Member</th>
                  <th className="py-3.5 px-4">Facility Amount</th>
                  <th className="py-3.5 px-4">Guarantor</th>
                  <th className="py-3.5 px-4">Status & Step</th>
                  <th className="py-3.5 px-4">Outstanding Bal</th>
                  <th className="py-3.5 px-4 text-right">Workflow Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {filteredLoans.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-500">
                      <HandCoins className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="font-semibold text-gray-700">No loan applications found</p>
                      <p className="text-xs text-gray-400">Try adjusting your search or status filter</p>
                    </td>
                  </tr>
                ) : (
                  filteredLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-emerald-50/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{loan.loanNo}</div>
                        <div className="text-xs text-emerald-800 font-semibold">{loan.memberName}</div>
                        <div className="text-[11px] text-gray-500">{loan.memberNo} | Applied: {loan.dateApplied}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{formatNaira(loan.loanAmount)}</div>
                        <div className="text-xs text-gray-500">{loan.repaymentPeriodMonths} months @ {loan.interestRate}% p.a.</div>
                        <div className="text-[11px] text-amber-700 font-medium">Interest: {formatNaira(loan.totalInterest)}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-gray-800">{loan.guarantorName}</div>
                        <div className="text-xs text-gray-500">{loan.guarantorMemberNo}</div>
                        <div className="text-[11px] text-emerald-700">Savings: {formatNaira(loan.guarantorSavingsBalance)}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        {getStatusBadge(loan.status)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-bold text-amber-900">{formatNaira(loan.outstandingBalance)}</div>
                        <div className="text-xs text-emerald-700">Repaid: {formatNaira(loan.amountRepaid)}</div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Step 1: Guarantor Review button */}
                          {loan.status === 'Waiting for Guarantor Approval' && (
                            <button
                              onClick={() => {
                                setSelectedLoan(loan);
                                setGuarantorForm({ pinOrPassword: '', guarantorNotes: '' });
                                setIsGuarantorModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center gap-1"
                            >
                              <ShieldAlert className="w-3.5 h-3.5" /> Guarantor Review
                            </button>
                          )}

                          {/* Step 2: FinSec Verification button */}
                          {loan.status === 'Pending' && (
                            <button
                              onClick={() => {
                                setSelectedLoan(loan);
                                setVerifyForm({ verificationNotes: '' });
                                setIsVerifyModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center gap-1"
                            >
                              <FileCheck2 className="w-3.5 h-3.5" /> Verify (FinSec)
                            </button>
                          )}

                          {/* Step 4: Chairman Approval button */}
                          {loan.status === 'Verified' && (
                            <button
                              onClick={() => {
                                setSelectedLoan(loan);
                                setApproveForm({ approvalNotes: '' });
                                setIsApproveModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center gap-1"
                            >
                              <BadgeCheck className="w-3.5 h-3.5" /> Approve (Chairman)
                            </button>
                          )}

                          {/* Step 5: Treasurer Disbursement button */}
                          {loan.status === 'Approved' && (
                            <button
                              onClick={() => {
                                setSelectedLoan(loan);
                                setDisburseForm({
                                  disbursementMethod: 'Bank Transfer',
                                  disbursementVoucherRef: `VOUCHER-${Date.now().toString().slice(-6)}`,
                                  disbursementNotes: 'Disbursed via Treasury Direct Bank Transfer',
                                });
                                setIsDisburseModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center gap-1"
                            >
                              <TrendingUp className="w-3.5 h-3.5" /> Disburse (Treasurer)
                            </button>
                          )}

                          {/* Step 6: Record Repayment button */}
                          {loan.status === 'Disbursed' && (
                            <button
                              onClick={() => {
                                setSelectedLoan(loan);
                                setRepayForm({
                                  amountPaid: Math.round(loan.totalPayable / loan.repaymentPeriodMonths),
                                  paymentDate: new Date().toISOString().split('T')[0],
                                  paymentMethod: 'Bank Transfer',
                                  referenceNumber: `TRF-${Date.now().toString().slice(-6)}`,
                                  receivedBy: currentUserName,
                                  notes: 'Monthly loan installment repayment',
                                });
                                setIsRepayModalOpen(true);
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center gap-1"
                            >
                              <CreditCard className="w-3.5 h-3.5" /> Repay
                            </button>
                          )}

                          {/* Printable Voucher Button */}
                          <button
                            onClick={() => {
                              setSelectedLoan(loan);
                              setIsVoucherModalOpen(true);
                            }}
                            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs rounded-lg transition-all flex items-center gap-1"
                            title="View / Print Official Loan Agreement & Voucher"
                          >
                            <Printer className="w-3.5 h-3.5" /> Agreement
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Guarantor Exposure & Encumbrance */}
      {activeTab === 'guarantor_exposure' && (
        <div className="bg-white rounded-b-2xl border border-t-0 border-gray-200 p-6 space-y-4">
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
            <div className="font-bold text-sm text-amber-950 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" /> Guarantor Risk & Savings Encumbrance Policy
            </div>
            <p>
              In Lightway Cooperative, a member who guarantees another member's loan encumbers their own savings balance up to the guaranteed loan principal. A guarantor cannot withdraw encumbered savings until the guaranteed loan is fully repaid.
            </p>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold text-xs uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Guarantor Name & Member No</th>
                  <th className="py-3 px-4">Total Savings Balance</th>
                  <th className="py-3 px-4">Guaranteed Loan No & Borrower</th>
                  <th className="py-3 px-4">Encumbered Amount</th>
                  <th className="py-3 px-4">Unencumbered Savings</th>
                  <th className="py-3 px-4">Guarantor Qualification</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {loans.map((loan) => {
                  const guarantor = users.find((u) => u.memberNo.toLowerCase() === loan.guarantorMemberNo.toLowerCase());
                  const gSavings = guarantor ? guarantor.savingsBalance || 0 : loan.guarantorSavingsBalance;
                  const encumber = loan.status === 'Completed' || loan.status === 'Rejected' ? 0 : loan.loanAmount;
                  const unencumbered = Math.max(0, gSavings - encumber);

                  return (
                    <tr key={`g_${loan.id}`} className="hover:bg-amber-50/20">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900">{loan.guarantorName}</div>
                        <div className="text-xs text-gray-500">{loan.guarantorMemberNo}</div>
                      </td>

                      <td className="py-3 px-4 font-bold text-gray-800">
                        {formatNaira(gSavings)}
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-emerald-800">{loan.loanNo}</div>
                        <div className="text-xs text-gray-600">Borrower: {loan.memberName} ({loan.memberNo})</div>
                      </td>

                      <td className="py-3 px-4 font-bold text-rose-700">
                        {formatNaira(encumber)}
                      </td>

                      <td className="py-3 px-4 font-bold text-emerald-700">
                        {formatNaira(unencumbered)}
                      </td>

                      <td className="py-3 px-4">
                        {unencumbered >= 0 && gSavings >= encumber ? (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Fully Covered
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                            Over-leveraged
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Repayment Schedules */}
      {activeTab === 'repayment_schedules' && (
        <div className="bg-white rounded-b-2xl border border-t-0 border-gray-200 p-6 space-y-6">
          <h3 className="text-base font-bold text-gray-900">Active Loan Amortization Schedules</h3>

          {loans
            .filter((l) => l.repaymentSchedule && l.repaymentSchedule.length > 0)
            .map((loan) => (
              <div key={`sched_${loan.id}`} className="border border-gray-200 rounded-xl p-5 space-y-3 bg-gray-50/50">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-200 pb-3">
                  <div>
                    <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full uppercase">
                      {loan.loanNo}
                    </span>
                    <h4 className="text-base font-bold text-gray-900 mt-1">{loan.memberName} ({loan.memberNo})</h4>
                    <p className="text-xs text-gray-500">Facility: {formatNaira(loan.loanAmount)} | Tenure: {loan.repaymentPeriodMonths} Months | Outstanding: {formatNaira(loan.outstandingBalance)}</p>
                  </div>

                  {getStatusBadge(loan.status)}
                </div>

                <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 text-gray-700 font-semibold uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Inst #</th>
                        <th className="py-2.5 px-3">Due Date</th>
                        <th className="py-2.5 px-3">Principal</th>
                        <th className="py-2.5 px-3">Interest</th>
                        <th className="py-2.5 px-3">Total Installment</th>
                        <th className="py-2.5 px-3">Amount Paid</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {loan.repaymentSchedule.map((inst) => (
                        <tr key={inst.installmentNo} className={inst.status === 'Paid' ? 'bg-emerald-50/30' : ''}>
                          <td className="py-2 px-3 font-bold text-gray-800">#{inst.installmentNo}</td>
                          <td className="py-2 px-3 font-medium text-gray-700">{inst.dueDate}</td>
                          <td className="py-2 px-3 text-gray-800">{formatNaira(inst.principalAmount)}</td>
                          <td className="py-2 px-3 text-amber-700">{formatNaira(inst.interestAmount)}</td>
                          <td className="py-2 px-3 font-bold text-gray-900">{formatNaira(inst.totalInstallmentAmount)}</td>
                          <td className="py-2 px-3 font-bold text-emerald-800">{formatNaira(inst.paidAmount)}</td>
                          <td className="py-2 px-3">
                            {inst.status === 'Paid' ? (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">Paid ({inst.paymentDate})</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* TAB 4: Approval Audit Trail */}
      {activeTab === 'approval_audit_trail' && (
        <div className="bg-white rounded-b-2xl border border-t-0 border-gray-200 p-6 space-y-6">
          <h3 className="text-base font-bold text-gray-900">Immutable Board & Executive Approval History Log</h3>

          <div className="space-y-4">
            {loans.flatMap((l) => l.approvalHistory.map((history) => ({ ...history, loanNo: l.loanNo, memberName: l.memberName }))).length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No approval history logs recorded yet.</p>
            ) : (
              loans
                .flatMap((l) => l.approvalHistory.map((history) => ({ ...history, loanNo: l.loanNo, memberName: l.memberName })))
                .reverse()
                .map((log) => (
                  <div key={log.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md">{log.loanNo}</span>
                        <span className="font-bold text-sm text-gray-900">{log.step}</span>
                        <span className="text-xs text-gray-500">({log.timestamp})</span>
                      </div>
                      <p className="text-xs text-gray-700"><strong>Action Officer:</strong> {log.actionBy} ({log.actionRole.replace('_', ' ')})</p>
                      <p className="text-xs text-gray-600 bg-white p-2 rounded-lg border border-gray-200 mt-1">{log.comments || 'No comments specified.'}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-200 text-gray-800">
                        Status: {log.statusTo}
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Live Loan Balance Ledger Module */}
      {activeTab === 'loan_balances' && (
        <div className="pt-2">
          <LoanBalanceModule
            loans={loans}
            currentUserRole={currentUserRole}
            isReadOnly={['chairman', 'treasurer', 'auditor'].includes(currentUserRole)}
            onRepayLoan={onRepayLoan}
            title="LCMS PRO Loan Balance Module"
            subtitle="Real-time breakdown of original loan amount, principal repaid, interest paid, outstanding balances, repayment percentage, next due date, and loan status."
            badgeLabel="Live Loan Amortization Engine"
          />
        </div>
      )}

      {/* MODAL 1: Submit Loan Application Modal (Step 1) */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 my-8">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="p-1.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-emerald-700 hover:text-white transition-colors cursor-pointer border border-gray-200 flex items-center gap-1 text-xs font-bold"
                  title="Return to Loan Ledger (Back ←)"
                  aria-label="Back button"
                >
                  <ArrowLeft className="w-4 h-4 text-emerald-600 group-hover:text-white" />
                  <span className="hidden sm:inline">Back</span>
                </button>
                <div>
                  <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                    <HandCoins className="w-5 h-5 text-emerald-600" /> Step 1: Member Loan Application Form
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">LCMS PRO Standard 300% Savings Ratio & Guarantor Verification Engine</p>
                </div>
              </div>
              <button onClick={() => setIsApplyModalOpen(false)} className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer" title="Close modal (✕)" aria-label="Close modal">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApplySubmit} className="mt-4 space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Applicant Member Select */}
                <div>
                  <label className="block font-semibold text-gray-700 text-xs mb-1">Applicant Member *</label>
                  <select
                    required
                    value={applyForm.memberNo}
                    onChange={(e) => setApplyForm({ ...applyForm, memberNo: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Select Applicant Member --</option>
                    {users
                      .filter((u) => u.status === 'active')
                      .map((u) => (
                        <option key={u.id} value={u.memberNo}>
                          {u.fullName} ({u.memberNo}) - Savings: {formatNaira(u.savingsBalance || 0)}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Guarantor Member Select */}
                <div>
                  <label className="block font-semibold text-gray-700 text-xs mb-1">Guarantor Member *</label>
                  <select
                    required
                    value={applyForm.guarantorMemberNo}
                    onChange={(e) => setApplyForm({ ...applyForm, guarantorMemberNo: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Select Guarantor Member --</option>
                    {users
                      .filter((u) => u.status === 'active' && u.memberNo !== applyForm.memberNo)
                      .map((u) => (
                        <option key={`g_${u.id}`} value={u.memberNo}>
                          {u.fullName} ({u.memberNo}) - Savings: {formatNaira(u.savingsBalance || 0)}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Requested Loan Amount */}
                <div>
                  <label className="block font-semibold text-gray-700 text-xs mb-1">Requested Loan Amount (₦) *</label>
                  <input
                    type="number"
                    required
                    min={50000}
                    step={50000}
                    value={applyForm.loanAmount}
                    onChange={(e) => setApplyForm({ ...applyForm, loanAmount: Number(e.target.value) })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Tenure Months */}
                <div>
                  <label className="block font-semibold text-gray-700 text-xs mb-1">Repayment Period (Months) *</label>
                  <select
                    value={applyForm.repaymentPeriodMonths}
                    onChange={(e) => setApplyForm({ ...applyForm, repaymentPeriodMonths: Number(e.target.value) })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months (1 Year)</option>
                    <option value={18}>18 Months</option>
                    <option value={24}>24 Months (2 Years)</option>
                  </select>
                </div>
              </div>

              {/* Loan Purpose */}
              <div>
                <label className="block font-semibold text-gray-700 text-xs mb-1">Loan Purpose & Project Details *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="State the purpose of this loan facility (e.g. Real Estate, Business Stocking, Agriculture)..."
                  value={applyForm.loanPurpose}
                  onChange={(e) => setApplyForm({ ...applyForm, loanPurpose: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Live Eligibility & Qualification Calculator Box */}
              {liveEligibility && (
                <div className="p-4 rounded-xl border bg-gray-50 text-xs space-y-2">
                  <div className="font-bold text-gray-900 uppercase tracking-wider flex items-center justify-between">
                    <span>Live Credit Eligibility Assessment</span>
                    {liveEligibility.qualifiesOverall ? (
                      <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">QUALIFIED</span>
                    ) : (
                      <span className="text-rose-700 bg-rose-100 px-2 py-0.5 rounded font-bold">ATTENTION REQUIRED</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-gray-700">
                    <div>
                      <span>Member Savings: </span>
                      <strong className="text-gray-900">{formatNaira(liveEligibility.savings)}</strong>
                    </div>
                    <div>
                      <span>Max Loan Eligibility (3x): </span>
                      <strong className="text-emerald-800">{formatNaira(liveEligibility.maxLimit)}</strong>
                    </div>
                    <div>
                      <span>Guarantor Savings: </span>
                      <strong className="text-gray-900">{formatNaira(liveEligibility.guarantorSavings)}</strong>
                    </div>
                    <div>
                      <span>Requested Facility: </span>
                      <strong className="text-amber-900">{formatNaira(liveEligibility.requested)}</strong>
                    </div>
                  </div>

                  {!liveEligibility.isSavingsValid && (
                    <p className="text-rose-700 font-semibold bg-rose-50 p-2 rounded border border-rose-200">
                      Warning: Requested amount exceeds 300% savings ratio limit ({formatNaira(liveEligibility.maxLimit)} max limit).
                    </p>
                  )}

                  {!liveEligibility.isGuarantorValid && applyForm.guarantorMemberNo && (
                    <p className="text-rose-700 font-semibold bg-rose-50 p-2 rounded border border-rose-200">
                      Warning: Guarantor savings balance ({formatNaira(liveEligibility.guarantorSavings)}) is lower than requested loan amount.
                    </p>
                  )}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all flex items-center gap-2 shadow-md shadow-emerald-600/20"
                >
                  {isSubmitting ? 'Submitting Application...' : 'Submit Loan Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 1b: Guarantor Review & Security Pledge Confirmation Modal */}
      {isGuarantorModalOpen && selectedLoan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-600" /> Guarantor Review & Security Pledge Confirmation
                </h3>
                <p className="text-xs text-gray-500">Review applicant loan parameters and confirm pledge with password or security PIN</p>
              </div>
              <button onClick={() => setIsGuarantorModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Applicant & Financial Summary */}
            <div className="bg-indigo-50/80 p-4 rounded-xl border border-indigo-200 space-y-3 text-xs text-indigo-950">
              <div className="flex justify-between items-center border-b border-indigo-200/60 pb-2">
                <div>
                  <span className="text-indigo-600 font-medium">Applicant Borrower:</span>
                  <div className="font-bold text-sm text-indigo-900">{selectedLoan.memberName} ({selectedLoan.memberNo})</div>
                </div>
                <div className="text-right">
                  <span className="text-indigo-600 font-medium">Loan Ref:</span>
                  <div className="font-mono font-bold text-indigo-900">{selectedLoan.loanNo}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-gray-500 block text-[11px]">Loan Facility Amount</span>
                  <span className="font-black text-sm text-indigo-950">{formatNaira(selectedLoan.loanAmount)}</span>
                </div>

                <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-gray-500 block text-[11px]">Loan Tenure / Duration</span>
                  <span className="font-black text-sm text-indigo-950">{selectedLoan.repaymentPeriodMonths} Months</span>
                </div>

                <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-gray-500 block text-[11px]">Interest Rate</span>
                  <span className="font-bold text-indigo-900">1% / month ({selectedLoan.interestRate}% APR)</span>
                </div>

                <div className="bg-white/80 p-2.5 rounded-lg border border-indigo-100">
                  <span className="text-gray-500 block text-[11px]">Monthly Amortization</span>
                  <span className="font-bold text-emerald-800">
                    {formatNaira(Math.round(selectedLoan.totalPayable / selectedLoan.repaymentPeriodMonths))} / mo
                  </span>
                </div>
              </div>

              <div className="bg-amber-100/70 p-3 rounded-lg border border-amber-300 text-amber-950 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Pledged Savings Guarantee:</span> You are guaranteeing <strong>{formatNaira(selectedLoan.loanAmount)}</strong>. Your available savings balance of <strong>{formatNaira(selectedLoan.guarantorSavingsBalance)}</strong> will serve as security backing for this loan facility.
                </div>
              </div>
            </div>

            {/* Password / PIN Confirmation Input */}
            <div className="space-y-3">
              <div>
                <label className="block font-bold text-gray-800 text-xs mb-1">
                  Guarantor Password or Security PIN *
                </label>
                <input
                  type="password"
                  placeholder="Enter your security Password or PIN to confirm..."
                  value={guarantorForm.pinOrPassword}
                  onChange={(e) => setGuarantorForm({ ...guarantorForm, pinOrPassword: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-gray-500 mt-1">Required to authenticate and record legally binding electronic signature.</p>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 text-xs mb-1">
                  Optional Guarantor Notes / Remarks
                </label>
                <textarea
                  rows={2}
                  placeholder="Add any comments regarding your guarantee decision..."
                  value={guarantorForm.guarantorNotes}
                  onChange={(e) => setGuarantorForm({ ...guarantorForm, guarantorNotes: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => handleGuarantorSubmit('reject')}
                disabled={isSubmitting}
                className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-xl transition-all"
              >
                Reject Request
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsGuarantorModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium text-xs rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={() => handleGuarantorSubmit('accept')}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {isSubmitting ? 'Confirming...' : 'Accept & Pledge Savings'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Financial Secretary Verification Modal (Step 2 & 3) */}
      {isVerifyModalOpen && selectedLoan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-amber-600" /> Steps 2 & 3: Financial Secretary Verification
                </h3>
                <p className="text-xs text-gray-500">Verify member status, 3x savings limit & guarantor encumbrance</p>
              </div>
              <button onClick={() => setIsVerifyModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-2 text-xs text-amber-900">
              <div className="font-bold text-sm text-amber-950">{selectedLoan.loanNo} - {selectedLoan.memberName}</div>
              <p>Facility Requested: <strong>{formatNaira(selectedLoan.loanAmount)}</strong> ({selectedLoan.repaymentPeriodMonths} months)</p>
              <p>Member Savings: <strong>{formatNaira(selectedLoan.memberSavingsBalance)}</strong> (Eligible up to {formatNaira(selectedLoan.maxLoanEligibility)})</p>
              <p>Guarantor: <strong>{selectedLoan.guarantorName}</strong> ({selectedLoan.guarantorMemberNo}) - Savings: <strong>{formatNaira(selectedLoan.guarantorSavingsBalance)}</strong></p>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 text-xs mb-1">Financial Verification Notes *</label>
              <textarea
                rows={3}
                placeholder="Enter verification comments (e.g. Verified active member status, savings balance 3x ratio, and guarantor encumbrance)..."
                value={verifyForm.verificationNotes}
                onChange={(e) => setVerifyForm({ verificationNotes: e.target.value })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => handleVerifySubmit('reject')}
                disabled={isSubmitting}
                className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-xl"
              >
                Reject Application
              </button>
              <button
                type="button"
                onClick={() => handleVerifySubmit('verify')}
                disabled={isSubmitting}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-500/20"
              >
                {isSubmitting ? 'Verifying...' : 'Mark VERIFIED & Send to Chairman'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Executive Chairman Approval Modal (Step 4) */}
      {isApproveModalOpen && selectedLoan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-purple-600" /> Step 4: Executive Chairman Board Approval
                </h3>
                <p className="text-xs text-gray-500">Board sign-off on verified loan applications</p>
              </div>
              <button onClick={() => setIsApproveModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 space-y-2 text-xs text-purple-900">
              <div className="font-bold text-sm text-purple-950">{selectedLoan.loanNo} - {selectedLoan.memberName}</div>
              <p>Requested Facility: <strong>{formatNaira(selectedLoan.loanAmount)}</strong></p>
              <p>Financial Secretary Stamp: <strong className="text-emerald-800">Verified by {selectedLoan.verifiedBy}</strong> on {selectedLoan.dateVerified}</p>
              <p>FinSec Notes: <em>"{selectedLoan.verificationNotes}"</em></p>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 text-xs mb-1">Executive Board Approval Notes *</label>
              <textarea
                rows={3}
                placeholder="Enter chairman sign-off remarks..."
                value={approveForm.approvalNotes}
                onChange={(e) => setApproveForm({ approvalNotes: e.target.value })}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => handleApproveSubmit('reject')}
                disabled={isSubmitting}
                className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs rounded-xl"
              >
                Reject
              </button>
              <button
                type="button"
                onClick={() => handleApproveSubmit('approve')}
                disabled={isSubmitting}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-600/20"
              >
                {isSubmitting ? 'Approving...' : 'GRANT EXECUTIVE APPROVAL'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Treasurer Disbursement Modal (Step 5) */}
      {isDisburseModalOpen && selectedLoan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" /> Step 5: Treasurer Disbursement & Treasury Voucher
                </h3>
                <p className="text-xs text-gray-500">Release approved funds and initialize repayment schedule</p>
              </div>
              <button onClick={() => setIsDisburseModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <div className="font-bold text-sm text-emerald-950">{selectedLoan.loanNo} - {selectedLoan.memberName}</div>
              <p>Disbursement Amount: <strong>{formatNaira(selectedLoan.loanAmount)}</strong></p>
              <p>Chairman Approval: <strong className="text-purple-900">{selectedLoan.approvedBy}</strong> ({selectedLoan.dateApproved})</p>
            </div>

            <form onSubmit={handleDisburseSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 text-xs mb-1">Disbursement Channel *</label>
                <select
                  value={disburseForm.disbursementMethod}
                  onChange={(e) => setDisburseForm({ ...disburseForm, disbursementMethod: e.target.value as PaymentMethod })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Bank Transfer">Bank Transfer (NIP)</option>
                  <option value="Cheque">Cooperative Bank Cheque</option>
                  <option value="Direct Payroll Deduction">Direct Credit Release</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 text-xs mb-1">Treasury Voucher Reference *</label>
                <input
                  type="text"
                  required
                  value={disburseForm.disbursementVoucherRef}
                  onChange={(e) => setDisburseForm({ ...disburseForm, disbursementVoucherRef: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 text-xs mb-1">Disbursement Notes</label>
                <input
                  type="text"
                  value={disburseForm.disbursementNotes}
                  onChange={(e) => setDisburseForm({ ...disburseForm, disbursementNotes: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsDisburseModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20"
                >
                  {isSubmitting ? 'Disbursing...' : 'DISBURSE FUNDS & GENERATE SCHEDULE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Record Repayment Modal (Step 6) */}
      {isRepayModalOpen && selectedLoan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-blue-600" /> Step 6: Record Loan Repayment
                </h3>
                <p className="text-xs text-gray-500">Post repayment to reduce outstanding balance</p>
              </div>
              <button onClick={() => setIsRepayModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-blue-50 p-3 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-1">
              <p>Borrower: <strong>{selectedLoan.memberName}</strong> ({selectedLoan.memberNo})</p>
              <p>Facility: <strong>{selectedLoan.loanNo}</strong></p>
              <p>Current Outstanding Balance: <strong className="text-amber-900 text-sm">{formatNaira(selectedLoan.outstandingBalance)}</strong></p>
            </div>

            <form onSubmit={handleRepaySubmit} className="space-y-3 text-sm">
              <div>
                <label className="block font-semibold text-gray-700 text-xs mb-1">Repayment Amount (₦) *</label>
                <input
                  type="number"
                  required
                  min={1000}
                  max={selectedLoan.outstandingBalance}
                  value={repayForm.amountPaid}
                  onChange={(e) => setRepayForm({ ...repayForm, amountPaid: Number(e.target.value) })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 text-xs mb-1">Payment Date *</label>
                <input
                  type="date"
                  required
                  value={repayForm.paymentDate}
                  onChange={(e) => setRepayForm({ ...repayForm, paymentDate: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 text-xs mb-1">Payment Method *</label>
                <select
                  value={repayForm.paymentMethod}
                  onChange={(e) => setRepayForm({ ...repayForm, paymentMethod: e.target.value as PaymentMethod })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Direct Payroll Deduction">Direct Payroll Deduction</option>
                  <option value="Bank Transfer">Bank Transfer (NIP)</option>
                  <option value="Cash Voucher">Cash Voucher</option>
                  <option value="Cheque">Bank Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 text-xs mb-1">Transaction Reference Number *</label>
                <input
                  type="text"
                  required
                  value={repayForm.referenceNumber}
                  onChange={(e) => setRepayForm({ ...repayForm, referenceNumber: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsRepayModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-600/20"
                >
                  {isSubmitting ? 'Posting...' : 'CREDIT REPAYMENT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: Printable Loan Disbursement Voucher & Agreement Modal */}
      {isVoucherModalOpen && selectedLoan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl border border-gray-200 my-8 space-y-6">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div className="flex items-center gap-3">
                <Printer className="w-6 h-6 text-emerald-700" />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Official Loan Agreement & Disbursement Voucher</h3>
                  <p className="text-xs text-gray-500">Lightway Cooperative Multipurpose Society Limited (LCMS PRO)</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <Printer className="w-4 h-4" /> Print Document
                </button>
                <button onClick={() => setIsVoucherModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            <div className="space-y-6 text-xs text-gray-800 leading-relaxed font-sans border p-6 rounded-xl bg-gray-50/30">
              {/* Header */}
              <div className="text-center border-b border-gray-300 pb-4 space-y-2 flex flex-col items-center">
                <CoopLogo size="lg" showText variant="dark" />
                <p className="text-[11px] font-semibold text-gray-600">Reg No: LS/COOP/REG/2018/0492 | Head Office: 15 Broad Street, Marina, Lagos State</p>
                <p className="text-[11px] text-emerald-800 font-bold uppercase tracking-widest mt-1">
                  LOAN DISBURSEMENT VOUCHER & BINDING CREDIT AGREEMENT
                </p>
              </div>

              {/* Loan Overview Table */}
              <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-gray-300">
                <div>
                  <p className="text-gray-500 font-medium">Loan Reference Code:</p>
                  <p className="font-extrabold text-sm text-gray-900">{selectedLoan.loanNo}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Application Date:</p>
                  <p className="font-bold text-gray-900">{selectedLoan.dateApplied}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Borrower Full Name:</p>
                  <p className="font-bold text-emerald-900 text-sm">{selectedLoan.memberName}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium">Membership Number:</p>
                  <p className="font-bold text-gray-900">{selectedLoan.memberNo}</p>
                </div>
              </div>

              {/* Financial Terms */}
              <div className="bg-emerald-50/50 p-4 rounded-lg border border-emerald-200 grid grid-cols-3 gap-3 text-center">
                <div>
                  <span className="text-gray-500 block text-[11px]">Approved Facility</span>
                  <strong className="text-base text-emerald-900 font-black">{formatNaira(selectedLoan.loanAmount)}</strong>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Interest Rate & Tenure</span>
                  <strong className="text-sm text-gray-900 font-bold">{selectedLoan.interestRate}% p.a. ({selectedLoan.repaymentPeriodMonths} Months)</strong>
                </div>
                <div>
                  <span className="text-gray-500 block text-[11px]">Total Amortized Payable</span>
                  <strong className="text-base text-amber-900 font-black">{formatNaira(selectedLoan.totalPayable)}</strong>
                </div>
              </div>

              {/* Guarantor Deed */}
              <div className="bg-white p-4 rounded-lg border border-gray-300 space-y-1">
                <p className="font-bold text-gray-900 uppercase">Guarantor Guarantee Deed</p>
                <p>
                  I, <strong>{selectedLoan.guarantorName}</strong> ({selectedLoan.guarantorMemberNo}), hereby confirm that I guarantee the loan facility of {formatNaira(selectedLoan.loanAmount)} granted to {selectedLoan.memberName}. I authorize Lightway Cooperative to encumber my personal savings balance of {formatNaira(selectedLoan.guarantorSavingsBalance)} as collateral until full settlement.
                </p>
              </div>

              {/* Workflow Stamps */}
              <div className="grid grid-cols-3 gap-3 text-[11px]">
                <div className="p-3 bg-amber-50 rounded border border-amber-200">
                  <p className="font-bold text-amber-900">1. FinSec Verification</p>
                  <p>Officer: {selectedLoan.verifiedBy || 'Mr. Babatunde Ogunleye'}</p>
                  <p>Date: {selectedLoan.dateVerified || 'Verified'}</p>
                </div>

                <div className="p-3 bg-purple-50 rounded border border-purple-200">
                  <p className="font-bold text-purple-900">2. Chairman Sign-off</p>
                  <p>Officer: {selectedLoan.approvedBy || 'Chief Olusegun Adebayo'}</p>
                  <p>Date: {selectedLoan.dateApproved || 'Approved'}</p>
                </div>

                <div className="p-3 bg-emerald-50 rounded border border-emerald-200">
                  <p className="font-bold text-emerald-900">3. Treasurer Release</p>
                  <p>Officer: {selectedLoan.disbursedBy || 'Mrs. Grace Chinenye'}</p>
                  <p>Voucher: {selectedLoan.disbursementVoucherRef || 'VOUCHER-ACTIVE'}</p>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-[10px] border-t border-gray-300">
                <div>
                  <div className="border-b border-gray-400 h-8 mb-1"></div>
                  <p className="font-bold">Borrower Signature</p>
                  <p>{selectedLoan.memberName}</p>
                </div>
                <div>
                  <div className="border-b border-gray-400 h-8 mb-1"></div>
                  <p className="font-bold">Guarantor Signature</p>
                  <p>{selectedLoan.guarantorName}</p>
                </div>
                <div>
                  <div className="border-b border-gray-400 h-8 mb-1"></div>
                  <p className="font-bold">Financial Secretary</p>
                  <p>Mr. Babatunde Ogunleye</p>
                </div>
                <div>
                  <div className="border-b border-gray-400 h-8 mb-1"></div>
                  <p className="font-bold">Executive Chairman</p>
                  <p>Chief Olusegun Adebayo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
