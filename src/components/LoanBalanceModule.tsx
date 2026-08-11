import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Search,
  FileText,
  Printer,
  ChevronRight,
  TrendingUp,
  Percent,
  X,
  CreditCard,
  DollarSign,
  Filter,
  Eye,
  ShieldCheck,
  Building,
  ArrowUpRight,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { LoanApplication, UserRole } from '../types';
import { calculateLoanBalanceDetails, LoanBalanceDetails } from '../utils/cooperativeRules';

interface LoanBalanceModuleProps {
  loans: LoanApplication[];
  currentUserRole?: UserRole;
  currentMemberNo?: string;
  isReadOnly?: boolean;
  viewMode?: 'full' | 'passbook' | 'dashboard';
  title?: string;
  subtitle?: string;
  badgeLabel?: string;
  onRepayLoan?: (id: string, data: any) => Promise<{ success: boolean; message: string; error?: string }>;
}

export const LoanBalanceModule: React.FC<LoanBalanceModuleProps> = ({
  loans = [],
  currentUserRole = 'sys_admin',
  currentMemberNo,
  isReadOnly = false,
  viewMode = 'full',
  title = 'Cooperative Loan Balance & Portfolio Ledger',
  subtitle = 'Real-time tracking of principal repaid, interest paid, outstanding balances, repayment percentages, next due dates, and default risk statuses.',
  badgeLabel,
  onRepayLoan,
}) => {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Completed' | 'Overdue'>('all');
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState(false);

  // Repayment form state
  const [repayForm, setRepayForm] = useState({
    amountPaid: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Bank Transfer',
    referenceNumber: `REPAY-${Date.now().toString().slice(-6)}`,
    receivedBy: 'Financial Secretary',
    notes: 'Loan installment repayment',
  });
  const [isSubmittingRepay, setIsSubmittingRepay] = useState(false);
  const [repayFeedback, setRepayFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Calculate detailed balance metrics for all relevant loans
  const loanDetailsList = useMemo(() => {
    let sourceLoans = loans.filter((l) => ['Disbursed', 'Completed', 'Active', 'Defaulted'].includes(l.status));

    // If passbook view mode or currentMemberNo is set, scope down to that member
    if (viewMode === 'passbook' && currentMemberNo) {
      sourceLoans = sourceLoans.filter((l) => l.memberNo.toLowerCase() === currentMemberNo.toLowerCase());
    }

    return sourceLoans.map((loan) => calculateLoanBalanceDetails(loan));
  }, [loans, viewMode, currentMemberNo]);

  // Filtered loan details
  const filteredDetails = useMemo(() => {
    return loanDetailsList.filter((item) => {
      const matchesStatus =
        statusFilter === 'all' || item.loanStatus === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.loanNo.toLowerCase().includes(q) ||
        item.memberName.toLowerCase().includes(q) ||
        item.memberNo.toLowerCase().includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [loanDetailsList, statusFilter, searchQuery]);

  // Portfolio Totals
  const portfolioStats = useMemo(() => {
    const totalOriginal = loanDetailsList.reduce((s, i) => s + i.originalLoanAmount, 0);
    const totalInterest = loanDetailsList.reduce((s, i) => s + i.totalInterest, 0);
    const totalPayable = loanDetailsList.reduce((s, i) => s + i.totalPayable, 0);

    const totalPrincipalRepaid = loanDetailsList.reduce((s, i) => s + i.totalPrincipalRepaid, 0);
    const totalInterestPaid = loanDetailsList.reduce((s, i) => s + i.totalInterestPaid, 0);
    const totalRepaidAll = totalPrincipalRepaid + totalInterestPaid;

    const totalOutstandingPrincipal = loanDetailsList.reduce((s, i) => s + i.outstandingPrincipal, 0);
    const totalOutstandingInterest = loanDetailsList.reduce((s, i) => s + i.outstandingInterest, 0);
    const totalOutstandingBalance = totalOutstandingPrincipal + totalOutstandingInterest;

    const overallRepaymentPct = totalPayable > 0 ? Number(((totalRepaidAll / totalPayable) * 100).toFixed(1)) : 0;

    const activeCount = loanDetailsList.filter((i) => i.loanStatus === 'Active').length;
    const completedCount = loanDetailsList.filter((i) => i.loanStatus === 'Completed').length;
    const overdueCount = loanDetailsList.filter((i) => i.loanStatus === 'Overdue').length;

    return {
      totalOriginal,
      totalInterest,
      totalPayable,
      totalPrincipalRepaid,
      totalInterestPaid,
      totalRepaidAll,
      totalOutstandingPrincipal,
      totalOutstandingInterest,
      totalOutstandingBalance,
      overallRepaymentPct,
      activeCount,
      completedCount,
      overdueCount,
    };
  }, [loanDetailsList]);

  // Selected Loan Computed Details
  const selectedDetails = useMemo(() => {
    if (!selectedLoan) return null;
    return calculateLoanBalanceDetails(selectedLoan);
  }, [selectedLoan]);

  const handleOpenDetail = (loanId: string) => {
    const orig = loans.find((l) => l.id === loanId);
    if (orig) {
      setSelectedLoan(orig);
      setShowDetailModal(true);
    }
  };

  const handleOpenRepay = (loanId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const orig = loans.find((l) => l.id === loanId);
    if (orig) {
      setSelectedLoan(orig);
      const det = calculateLoanBalanceDetails(orig);
      setRepayForm({
        amountPaid: det.outstandingPrincipal > 0 ? Math.min(det.totalOutstandingBalance, Math.round(det.originalLoanAmount / orig.repaymentPeriodMonths)) : det.totalOutstandingBalance,
        paymentDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'Bank Transfer',
        referenceNumber: `REPAY-${Date.now().toString().slice(-6)}`,
        receivedBy: 'Financial Secretary',
        notes: 'Regular loan repayment installment',
      });
      setRepayFeedback(null);
      setShowRepayModal(true);
    }
  };

  const handleSubmitRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoan || !onRepayLoan) return;

    if (repayForm.amountPaid <= 0) {
      setRepayFeedback({ type: 'error', text: 'Repayment amount must be greater than ₦0.' });
      return;
    }

    setIsSubmittingRepay(true);
    setRepayFeedback(null);

    try {
      const res = await onRepayLoan(selectedLoan.id, repayForm);
      if (res.success) {
        setRepayFeedback({ type: 'success', text: res.message || 'Repayment successfully posted!' });
        setTimeout(() => {
          setShowRepayModal(false);
          setShowDetailModal(false);
        }, 1500);
      } else {
        setRepayFeedback({ type: 'error', text: res.error || 'Failed to submit repayment.' });
      }
    } catch (err: any) {
      setRepayFeedback({ type: 'error', text: err?.message || 'An error occurred during submission.' });
    } finally {
      setIsSubmittingRepay(false);
    }
  };

  // Status Badge Component
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-900 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Completed
          </span>
        );
      case 'Overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-900 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            Overdue
          </span>
        );
      case 'Active':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-900 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            Active
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-emerald-950 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 -translate-y-8 translate-x-8 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider mb-2">
              <Wallet className="w-3.5 h-3.5 text-slate-950" />
              {badgeLabel || (isReadOnly ? 'Read-Only Loan Balance Vault' : 'Live Loan Balance Engine')}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">{title}</h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">{subtitle}</p>
          </div>

          <div className="flex items-center gap-2">
            {isReadOnly && (
              <span className="px-3 py-1.5 rounded-xl bg-slate-800/80 text-amber-300 border border-amber-500/30 font-bold text-xs flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                Audited View-Only Mode
              </span>
            )}
            <span className="px-3 py-1.5 rounded-xl bg-emerald-900/80 text-emerald-300 border border-emerald-700/50 font-black text-xs">
              {loanDetailsList.length} Active Loans
            </span>
          </div>
        </div>

        {/* Portfolio Top Level KPI Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Original Loan Principal</span>
            <span className="text-sm sm:text-base font-black text-white block mt-1">
              ₦{portfolioStats.totalOriginal.toLocaleString()}
            </span>
            <span className="text-[9px] text-slate-400">Total Disbursed</span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-800/60">
            <span className="text-[10px] uppercase font-bold text-emerald-300 block">Principal Repaid</span>
            <span className="text-sm sm:text-base font-black text-emerald-400 block mt-1">
              ₦{portfolioStats.totalPrincipalRepaid.toLocaleString()}
            </span>
            <span className="text-[9px] text-emerald-300/80">Capital Recovered</span>
          </div>

          <div className="p-3 rounded-2xl bg-indigo-950/60 border border-indigo-800/60">
            <span className="text-[10px] uppercase font-bold text-indigo-300 block">Interest Paid</span>
            <span className="text-sm sm:text-base font-black text-amber-300 block mt-1">
              ₦{portfolioStats.totalInterestPaid.toLocaleString()}
            </span>
            <span className="text-[9px] text-indigo-300/80">Income Realized</span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-800/60">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">Outstanding Principal</span>
            <span className="text-sm sm:text-base font-black text-amber-400 block mt-1">
              ₦{portfolioStats.totalOutstandingPrincipal.toLocaleString()}
            </span>
            <span className="text-[9px] text-amber-200/80">Pending Capital</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Outstanding Interest</span>
            <span className="text-sm sm:text-base font-black text-slate-200 block mt-1">
              ₦{portfolioStats.totalOutstandingInterest.toLocaleString()}
            </span>
            <span className="text-[9px] text-slate-400">Future Earnings</span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-900/60 border border-amber-500/40">
            <span className="text-[10px] uppercase font-bold text-amber-300 block">Overall Repayment %</span>
            <span className="text-sm sm:text-base font-black text-amber-300 block mt-1">
              {portfolioStats.overallRepaymentPct}%
            </span>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
              <div
                className="bg-amber-400 h-1.5 rounded-full"
                style={{ width: `${Math.min(100, portfolioStats.overallRepaymentPct)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Filters & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs dark:bg-slate-900 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by member, staff no, or loan no..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            All Loans ({loanDetailsList.length})
          </button>
          <button
            onClick={() => setStatusFilter('Active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              statusFilter === 'Active'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300'
            }`}
          >
            Active ({portfolioStats.activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('Overdue')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              statusFilter === 'Overdue'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300'
            }`}
          >
            Overdue ({portfolioStats.overdueCount})
          </button>
          <button
            onClick={() => setStatusFilter('Completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              statusFilter === 'Completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300'
            }`}
          >
            Completed ({portfolioStats.completedCount})
          </button>
        </div>
      </div>

      {/* Main Loan Balance Table Ledger */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              Loan Balance Schedule & Repayment Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {filteredDetails.length} active cooperative loan records
            </p>
          </div>
        </div>

        {filteredDetails.length === 0 ? (
          <div className="p-12 text-center">
            <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">No Loans Found</h4>
            <p className="text-xs text-slate-500 mt-1">
              There are no loan records matching the current filter or search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:bg-slate-800/80 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="p-4">Member / Loan No</th>
                  <th className="p-4 text-right">Original Principal</th>
                  <th className="p-4 text-right">Principal Repaid</th>
                  <th className="p-4 text-right">Interest Paid</th>
                  <th className="p-4 text-right">Outstanding Principal</th>
                  <th className="p-4 text-right">Outstanding Interest</th>
                  <th className="p-4 text-right">Total Outstanding Balance</th>
                  <th className="p-4">Repayment %</th>
                  <th className="p-4">Next Due Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDetails.map((item) => (
                  <tr
                    key={item.loanId}
                    onClick={() => handleOpenDetail(item.loanId)}
                    className="hover:bg-amber-50/40 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  >
                    <td className="p-4">
                      <div className="font-black text-slate-900 dark:text-white text-xs">
                        {item.memberName}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {item.memberNo} • <span className="font-bold text-amber-600 dark:text-amber-400">{item.loanNo}</span>
                      </div>
                    </td>

                    <td className="p-4 text-right font-black text-slate-900 dark:text-white">
                      ₦{item.originalLoanAmount.toLocaleString()}
                    </td>

                    <td className="p-4 text-right font-bold text-emerald-700 dark:text-emerald-400">
                      ₦{item.totalPrincipalRepaid.toLocaleString()}
                    </td>

                    <td className="p-4 text-right font-bold text-indigo-700 dark:text-indigo-400">
                      ₦{item.totalInterestPaid.toLocaleString()}
                    </td>

                    <td className="p-4 text-right font-bold text-amber-700 dark:text-amber-400">
                      ₦{item.outstandingPrincipal.toLocaleString()}
                    </td>

                    <td className="p-4 text-right font-semibold text-slate-600 dark:text-slate-300">
                      ₦{item.outstandingInterest.toLocaleString()}
                    </td>

                    <td className="p-4 text-right font-black text-slate-900 dark:text-white text-sm">
                      ₦{item.totalOutstandingBalance.toLocaleString()}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200 min-w-[36px]">
                          {item.repaymentPercentage}%
                        </span>
                        <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              item.repaymentPercentage >= 100
                                ? 'bg-emerald-500'
                                : item.isOverdue
                                ? 'bg-rose-500'
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.min(100, item.repaymentPercentage)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="p-4 font-mono text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                      {item.nextDueDate}
                    </td>

                    <td className="p-4">{renderStatusBadge(item.loanStatus)}</td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDetail(item.loanId);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Statement
                        </button>

                        {!isReadOnly && item.totalOutstandingBalance > 0 && onRepayLoan && (
                          <button
                            onClick={(e) => handleOpenRepay(item.loanId, e)}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <CreditCard className="w-3.5 h-3.5" /> Repay
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Statement Modal - Full-Screen Banking Panel */}
      {showDetailModal && selectedLoan && selectedDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900 text-slate-100 flex flex-col h-screen w-screen overflow-hidden print:p-0 print:bg-white print:static print:h-auto print:w-auto">
          {/* Fixed Top Header Bar */}
          <div className="sticky top-0 z-50 bg-[#014421] text-white px-4 py-3 sm:px-6 sm:py-4 border-b-2 border-[#DAA520]/60 flex items-center justify-between shadow-lg shrink-0 print:hidden">
            {/* Top-Left Back Button */}
            <button
              type="button"
              onClick={() => setShowDetailModal(false)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-[#DAA520] active:scale-95 shadow-xs"
              title="Return to loan portfolio (Back ←)"
              aria-label="Back button"
            >
              <ArrowLeft className="w-4 h-4 text-[#DAA520]" />
              <span>Back</span>
            </button>

            {/* Center Title Header */}
            <div className="flex items-center gap-2 font-extrabold text-sm sm:text-base text-amber-300">
              <FileText className="w-5 h-5 text-[#DAA520] hidden xs:inline" />
              <span>Loan Details & Repayment Ledger</span>
            </div>

            {/* Top-Right Close Button */}
            <button
              onClick={() => setShowDetailModal(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition-all cursor-pointer border border-white/20 active:scale-95"
              title="Close loan details (✕)"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 max-w-4xl mx-auto w-full my-0 print:p-0 print:bg-white print:text-black space-y-6">
            {/* Modal Header inside content */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#014421] text-[#DAA520] border border-[#DAA520] flex items-center justify-center font-black text-lg shadow-md">
                  LC
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-lg text-slate-900 dark:text-white">
                      Loan Balance Ledger Statement
                    </h3>
                    {renderStatusBadge(selectedDetails.loanStatus)}
                  </div>
                  <p className="text-xs text-slate-500">
                    Loan No: <span className="font-mono font-bold text-amber-600">{selectedLoan.loanNo}</span> • Applicant: {selectedLoan.memberName} ({selectedLoan.memberNo})
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Balance Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-slate-800/80 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Original Loan Amount</span>
                <strong className="text-base font-black text-slate-900 dark:text-white block mt-1">
                  ₦{selectedDetails.originalLoanAmount.toLocaleString()}
                </strong>
                <span className="text-[10px] text-slate-500">Interest Rate: {selectedLoan.interestRate}% p.a.</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800">
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 block uppercase">Total Principal Repaid</span>
                <strong className="text-base font-black text-emerald-700 dark:text-emerald-400 block mt-1">
                  ₦{selectedDetails.totalPrincipalRepaid.toLocaleString()}
                </strong>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Capital Amortized</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-800">
                <span className="text-[10px] font-bold text-indigo-800 dark:text-indigo-300 block uppercase">Total Interest Paid</span>
                <strong className="text-base font-black text-indigo-700 dark:text-indigo-400 block mt-1">
                  ₦{selectedDetails.totalInterestPaid.toLocaleString()}
                </strong>
                <span className="text-[10px] text-indigo-600 dark:text-indigo-400">Total Interest: ₦{selectedDetails.totalInterest.toLocaleString()}</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800">
                <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 block uppercase">Outstanding Principal</span>
                <strong className="text-base font-black text-amber-700 dark:text-amber-400 block mt-1">
                  ₦{selectedDetails.outstandingPrincipal.toLocaleString()}
                </strong>
                <span className="text-[10px] text-amber-600 dark:text-amber-400">Remaining Capital</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 dark:bg-slate-800/80 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block uppercase">Outstanding Interest</span>
                <strong className="text-base font-black text-slate-800 dark:text-slate-200 block mt-1">
                  ₦{selectedDetails.outstandingInterest.toLocaleString()}
                </strong>
                <span className="text-[10px] text-slate-500">Unearned Profit</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950">
                <span className="text-[10px] font-bold block uppercase opacity-80">Total Outstanding Balance</span>
                <strong className="text-lg font-black block mt-1">
                  ₦{selectedDetails.totalOutstandingBalance.toLocaleString()}
                </strong>
                <span className="text-[10px] opacity-80">Next Due: {selectedDetails.nextDueDate}</span>
              </div>
            </div>

            {/* Repayment Progress Gauge */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 mb-6">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-emerald-600" /> Repayment Completion Rate
                </span>
                <span className="text-amber-600 dark:text-amber-400 text-sm font-black">
                  {selectedDetails.repaymentPercentage}%
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    selectedDetails.repaymentPercentage >= 100
                      ? 'bg-emerald-500'
                      : selectedDetails.isOverdue
                      ? 'bg-rose-500'
                      : 'bg-amber-400'
                  }`}
                  style={{ width: `${Math.min(100, selectedDetails.repaymentPercentage)}%` }}
                />
              </div>
            </div>

            {/* Repayment Schedule Installments */}
            <div className="space-y-4 mb-6">
              <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-indigo-600" />
                Amortized Repayment Schedule ({selectedLoan.repaymentSchedule?.length || 0} Installments)
              </h4>

              <div className="overflow-x-auto max-h-56 rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-300 text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">Inst #</th>
                      <th className="p-2.5">Due Date</th>
                      <th className="p-2.5 text-right">Principal</th>
                      <th className="p-2.5 text-right">Interest</th>
                      <th className="p-2.5 text-right">Total Installment</th>
                      <th className="p-2.5 text-right">Amount Paid</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {selectedLoan.repaymentSchedule?.map((inst) => (
                      <tr key={inst.installmentNo} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="p-2.5 font-bold font-mono">#{inst.installmentNo}</td>
                        <td className="p-2.5 font-mono">{inst.dueDate}</td>
                        <td className="p-2.5 text-right font-semibold">₦{inst.principalAmount.toLocaleString()}</td>
                        <td className="p-2.5 text-right font-semibold text-indigo-600 dark:text-indigo-400">₦{inst.interestAmount.toLocaleString()}</td>
                        <td className="p-2.5 text-right font-black">₦{inst.totalInstallmentAmount.toLocaleString()}</td>
                        <td className="p-2.5 text-right font-bold text-emerald-600">₦{inst.paidAmount.toLocaleString()}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[9px] font-extrabold ${
                              inst.status === 'Paid'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : inst.status === 'Partially Paid'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {inst.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Repayments History Log */}
            {selectedLoan.repayments && selectedLoan.repayments.length > 0 && (
              <div className="space-y-3 mb-6">
                <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Repayments Posting Log ({selectedLoan.repayments.length} Payments)
                </h4>

                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedLoan.repayments.map((rep) => (
                    <div
                      key={rep.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>₦{rep.amountPaid.toLocaleString()}</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono text-[9px] font-bold">
                            {rep.paymentMethod}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Ref: <span className="font-mono">{rep.referenceNumber}</span> • Recorded by: {rep.receivedBy} ({rep.paymentDate})
                        </p>
                      </div>

                      <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800">
                        Posted & Verified
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Statement
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                >
                  Close
                </button>

                {!isReadOnly && selectedDetails.totalOutstandingBalance > 0 && onRepayLoan && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleOpenRepay(selectedLoan.id);
                    }}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" /> Record Repayment
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Record Repayment Modal */}
      {showRepayModal && selectedLoan && selectedDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 sm:p-8 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                  ₦
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    Post Loan Repayment Installment
                  </h3>
                  <p className="text-xs text-slate-500">
                    Loan No: <span className="font-bold font-mono">{selectedLoan.loanNo}</span> ({selectedLoan.memberName})
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowRepayModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {repayFeedback && (
              <div
                className={`p-3 rounded-xl mb-4 text-xs font-bold ${
                  repayFeedback.type === 'success'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}
              >
                {repayFeedback.text}
              </div>
            )}

            <form onSubmit={handleSubmitRepayment} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-amber-800 dark:text-amber-300 block font-bold uppercase">Current Outstanding Balance</span>
                  <strong className="text-base font-black text-amber-900 dark:text-amber-300">
                    ₦{selectedDetails.totalOutstandingBalance.toLocaleString()}
                  </strong>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-amber-800 dark:text-amber-300 block font-bold uppercase">Principal Remaining</span>
                  <strong className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    ₦{selectedDetails.outstandingPrincipal.toLocaleString()}
                  </strong>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Repayment Amount (₦) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedDetails.totalOutstandingBalance}
                  value={repayForm.amountPaid}
                  onChange={(e) => setRepayForm({ ...repayForm, amountPaid: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-xs font-extrabold focus:ring-2 focus:ring-amber-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    value={repayForm.paymentDate}
                    onChange={(e) => setRepayForm({ ...repayForm, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-xs font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Method *
                  </label>
                  <select
                    value={repayForm.paymentMethod}
                    onChange={(e) => setRepayForm({ ...repayForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-xs font-bold"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Direct Payroll Deduction">Direct Payroll Deduction</option>
                    <option value="Cash Deposit">Cash Deposit</option>
                    <option value="POS">POS</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bank Reference / Receipt No *
                </label>
                <input
                  type="text"
                  value={repayForm.referenceNumber}
                  onChange={(e) => setRepayForm({ ...repayForm, referenceNumber: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-xs font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Description
                </label>
                <textarea
                  value={repayForm.notes}
                  onChange={(e) => setRepayForm({ ...repayForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRepayModal(false)}
                  className="px-4 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRepay}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold shadow-md flex items-center gap-1.5"
                >
                  {isSubmittingRepay ? 'Posting...' : 'Approve & Post Repayment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
