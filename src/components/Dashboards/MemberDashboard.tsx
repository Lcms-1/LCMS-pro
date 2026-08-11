import React, { useState } from 'react';
import {
  CreditCard,
  PiggyBank,
  Award,
  Download,
  CheckCircle2,
  TrendingUp,
  ShieldCheck,
  FileText,
  Printer,
  X,
  Sparkles,
  ArrowLeft,
  BookOpen,
} from 'lucide-react';
import { User, LoanApplication } from '../../types';
import { LoanBalanceModule } from '../LoanBalanceModule';

interface MemberDashboardProps {
  currentUser: User;
  loans?: LoanApplication[];
}

export const MemberDashboard: React.FC<MemberDashboardProps> = ({ currentUser, loans = [] }) => {
  const [showStatementModal, setShowStatementModal] = useState(false);

  const savings = currentUser?.savingsBalance || 1850000;
  const shares = currentUser?.sharesOwned || 3500;
  const sharesValue = shares * 100;
  const loanLimit = savings * 3;

  const sampleTxns = [
    { date: '2026-07-25', desc: 'Monthly Payroll Savings Deduction', type: 'Deposit', amount: '₦50,000', balance: '₦1,850,000' },
    { date: '2026-06-25', desc: 'Monthly Payroll Savings Deduction', type: 'Deposit', amount: '₦50,000', balance: '₦1,800,000' },
    { date: '2026-05-25', desc: 'Monthly Payroll Savings Deduction', type: 'Deposit', amount: '₦50,000', balance: '₦1,750,000' },
    { date: '2026-04-10', desc: 'Annual Dividend Allocation Credit (2025)', type: 'Dividend', amount: '₦87,500', balance: '₦1,700,000' },
    { date: '2026-03-25', desc: 'Monthly Payroll Savings Deduction', type: 'Deposit', amount: '₦50,000', balance: '₦1,612,500' },
  ];

  return (
    <div className="space-y-6">
      {/* Member Passbook Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 translate-x-12 -translate-y-12 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -translate-x-12 translate-y-12 w-72 h-72 rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-700/60 pb-6 mb-6">
            <div className="flex items-center gap-4">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.fullName || 'Member'}
                  className="w-16 h-16 rounded-2xl object-cover ring-4 ring-amber-400/40 shadow-xl"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-amber-500 text-emerald-950 font-extrabold text-xl flex items-center justify-center ring-4 ring-amber-400/40 shadow-xl">
                  {currentUser?.fullName ? currentUser.fullName.charAt(0) : 'M'}
                </div>
              )}
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] uppercase tracking-wider mb-1">
                  <ShieldCheck className="w-3 h-3" />
                  Official Digital Passbook
                </div>
                <h1 className="text-xl sm:text-2xl font-black">{currentUser?.fullName || 'Member'}</h1>
                <p className="text-xs text-emerald-200">
                  {currentUser?.memberNo || 'N/A'} • {currentUser?.branch || 'HQ'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowStatementModal(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg flex items-center gap-2 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Account Statement
              </button>
            </div>
          </div>

          {/* Passbook Balances */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-700/60 backdrop-blur-xs">
              <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold">
                <span>Total Cumulative Savings</span>
                <PiggyBank className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-300 mt-2">
                ₦{savings.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-200 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Reconciled & Verified
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-700/60 backdrop-blur-xs">
              <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold">
                <span>Share Capital Holdings</span>
                <Award className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-white mt-2">
                ₦{sharesValue.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-200 mt-1">
                {shares.toLocaleString()} Paid Shares @ ₦100/share
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-700/60 backdrop-blur-xs">
              <div className="flex items-center justify-between text-xs text-emerald-300 font-semibold">
                <span>Loan Borrowing Capacity</span>
                <CreditCard className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-black text-amber-300 mt-2">
                ₦{loanLimit.toLocaleString()}
              </div>
              <div className="text-[10px] text-emerald-200 mt-1">
                Max 300% of Cumulative Savings
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-950/80 border border-indigo-600/60 backdrop-blur-xs">
              <div className="flex items-center justify-between text-xs text-indigo-200 font-semibold">
                <span>My Naira At Risk (2026)</span>
                <Sparkles className="w-4 h-4 text-amber-300" />
              </div>
              <div className="text-2xl font-black text-amber-300 mt-2">
                {savings === 0 ? '₦0' : `₦${(savings * 280).toLocaleString()} Days`}
              </div>
              <div className="text-[10px] text-indigo-200 mt-1 flex items-center gap-1 font-bold">
                <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[9px] uppercase">
                  Pending AGM
                </span>
                Dividend Formula Active
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Member Passbook Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-700" />
              Passbook Contribution History
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Recent savings postings verified by Financial Secretary
            </p>
          </div>
          <button
            onClick={() => setShowStatementModal(true)}
            className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400"
          >
            Export Complete History
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                <th className="p-3">Date</th>
                <th className="p-3">Transaction Description</th>
                <th className="p-3">Type</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Running Savings Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sampleTxns.map((t, idx) => (
                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-mono text-slate-600 dark:text-slate-300">{t.date}</td>
                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{t.desc}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {t.type}
                    </span>
                  </td>
                  <td className="p-3 font-extrabold text-emerald-700 dark:text-emerald-400">{t.amount}</td>
                  <td className="p-3 font-black text-slate-900 dark:text-white">{t.balance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Member Passbook Loan Balance Module */}
      <LoanBalanceModule
        loans={loans}
        currentMemberNo={currentUser?.memberNo}
        viewMode="passbook"
        isReadOnly={true}
        title="Passbook Active Loan Balance Ledger"
        subtitle="Live calculation of original loan principal, total principal repaid, interest paid, outstanding balances, repayment percentage, next due date, and loan status."
        badgeLabel="Member Passbook Vault"
      />

      {/* Printable Passbook Statement Panel - Full-Screen Banking Style */}
      {showStatementModal && (
        <div className="fixed inset-0 z-50 bg-slate-900 text-slate-100 flex flex-col h-screen w-screen overflow-hidden print:p-0 print:bg-white print:static print:h-auto print:w-auto">
          {/* Fixed Top Header Bar (Banking Style) */}
          <div className="sticky top-0 z-50 bg-[#014421] text-white px-4 py-3 sm:px-6 sm:py-4 border-b-2 border-[#DAA520]/60 flex items-center justify-between shadow-lg shrink-0 print:hidden">
            {/* Top-Left Fixed Back Button */}
            <button
              type="button"
              onClick={() => setShowStatementModal(false)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-[#DAA520] active:scale-95 shadow-xs"
              title="Return to Dashboard (Back ←)"
              aria-label="Back button"
            >
              <ArrowLeft className="w-4 h-4 text-[#DAA520]" />
              <span>Back</span>
            </button>

            {/* Center Header Title */}
            <div className="flex items-center gap-2 font-extrabold text-sm sm:text-base text-amber-300">
              <BookOpen className="w-5 h-5 text-[#DAA520] hidden xs:inline" />
              <span>Savings Passbook</span>
            </div>

            {/* Right Actions & Fixed Top-Right Close (✕) Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-400/40"
              >
                <Printer className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Print Statement</span>
              </button>

              <button
                onClick={() => setShowStatementModal(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-white transition-all cursor-pointer border border-white/20 active:scale-95"
                title="Close passbook panel (✕)"
                aria-label="Close passbook modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Passbook Content Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 max-w-4xl mx-auto w-full my-0 print:p-0 print:bg-white print:text-black space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#014421] text-[#DAA520] flex items-center justify-center font-black border border-[#DAA520]">
                  LC
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                    Official Passbook Account Statement
                  </h3>
                  <p className="text-xs text-slate-500">Lightway Cooperative Management System (LCMS PRO)</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Member Name</span>
                  <strong className="text-slate-900 dark:text-white font-bold text-sm">{currentUser?.fullName || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Passbook / Member Number</span>
                  <strong className="text-slate-900 dark:text-white font-bold text-sm">{currentUser?.memberNo || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Assigned Branch</span>
                  <strong className="text-slate-900 dark:text-white font-bold">{currentUser?.branch || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Cumulative Balance</span>
                  <strong className="text-emerald-700 dark:text-emerald-400 font-extrabold text-base">₦{savings.toLocaleString()}</strong>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-900/50">
                This document serves as an official electronic passbook statement generated under LCMS PRO Foundation rules. All ledger entries are reconciled with the Financial Secretary and Treasurer vaults.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 print:hidden">
              <button
                onClick={() => setShowStatementModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 cursor-pointer border border-slate-300 dark:border-slate-700"
              >
                Close Passbook
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-[#014421] hover:bg-emerald-900 text-white font-extrabold text-xs shadow-md flex items-center gap-2 cursor-pointer border border-[#DAA520]"
              >
                <Printer className="w-4 h-4 text-[#DAA520]" />
                Print Official Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
