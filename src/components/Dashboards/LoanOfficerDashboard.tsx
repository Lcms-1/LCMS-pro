import React from 'react';
import {
  HandCoins,
  ShieldAlert,
  UserCheck,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import { User, LoanSummaryStats, LoanApplication } from '../../types';
import { NavTab } from '../Sidebar';

interface LoanOfficerDashboardProps {
  currentUser: User;
  loanStats?: LoanSummaryStats;
  loans?: LoanApplication[];
  onNavigate: (tab: NavTab, subTab?: string) => void;
}

export const LoanOfficerDashboard: React.FC<LoanOfficerDashboardProps> = ({
  currentUser,
  loanStats,
  loans = [],
  onNavigate,
}) => {
  const pendingVerification = loans.filter((l) => l.status === 'Pending');
  const pendingApprovals = loans.filter((l) => l.status === 'Verified');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950 via-teal-900 to-emerald-950 text-white shadow-xl relative overflow-hidden border border-cyan-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider mb-2">
              <HandCoins className="w-3.5 h-3.5" />
              Credit Risk & Loan Officer Portal
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Welcome, {currentUser?.fullName || 'Loan Officer'}
            </h1>
            <p className="text-xs text-cyan-100 mt-1 max-w-xl">
              6-Step Loan Workflow Desk. Conduct credit analysis, verify 3x guarantor savings exposure, enforce repayment capacity checks, and recommend approvals.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('loan_management')}
              className="px-4 py-2 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              Open Loan Processing Desk
            </button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Pending Credit Verification</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            {pendingVerification.length} Applications
          </div>
          <p className="text-[11px] text-amber-600 font-bold mt-1">Requires Step 2 & 3 Assessment</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Guarantor Capacity Risk Engine</span>
            <UserCheck className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            3x Savings Rule
          </div>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">Automated Exposure Analysis</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Total Loan Portfolio Outstanding</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
            ₦{(loanStats?.totalOutstandingBalance || 48500000).toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500 font-bold mt-1">Active Loan Contracts</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Default Rate</span>
            <ShieldAlert className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            0.42% Low Risk
          </div>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">Well-Guaranteed Loans</p>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          onClick={() => onNavigate('loan_management')}
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer dark:bg-slate-900 dark:border-slate-800"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-cyan-100 text-cyan-900 dark:bg-cyan-950 dark:text-cyan-300">
              <HandCoins className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white">6-Step Loan Processing Queue</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review submitted applications, calculate monthly interest, and pass to board.
              </p>
            </div>
          </div>
        </div>

        <div
          onClick={() => onNavigate('guarantor_exposure')}
          className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer dark:bg-slate-900 dark:border-slate-800"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-300">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white">Guarantor Risk Exposure Engine</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Check member guarantor capacity and prevent over-collateralization.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
