import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Receipt,
  PiggyBank,
  ArrowUpRight,
  TrendingUp,
  FileCheck2,
  Clock,
  Bell,
  ArrowRight,
  FileCheck,
} from 'lucide-react';
import { User, LoanApplication } from '../../types';
import { LoanBalanceModule } from '../LoanBalanceModule';
import { apiUrl } from '../../utils/apiClient';

interface FinSecDashboardProps {
  currentUser: User;
  loans?: LoanApplication[];
  onNavigateToSchema?: () => void;
  onNavigateToPending?: () => void;
  onRepayLoan?: (id: string, data: any) => Promise<{ success: boolean; message: string; error?: string }>;
}

export const FinSecDashboard: React.FC<FinSecDashboardProps> = ({
  currentUser,
  loans = [],
  onNavigateToSchema,
  onNavigateToPending,
  onRepayLoan,
}) => {
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [pendingAmount, setPendingAmount] = useState<number>(0);

  useEffect(() => {
    fetch(apiUrl('/api/payment-transactions?role=financial_secretary'))
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.transactions) {
          const pending = data.transactions.filter((t: any) => t.status === 'Pending Approval');
          setPendingCount(pending.length);
          setPendingAmount(pending.reduce((s: number, t: any) => s + (t.amount || 0), 0));
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6 font-poppins">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-teal-900 via-emerald-800 to-emerald-950 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 text-teal-950 font-bold text-xs uppercase tracking-wider mb-2">
            <Receipt className="w-3.5 h-3.5 text-teal-800" />
            Financial Secretary Portal
          </div>
          <h1 className="text-2xl font-bold text-white font-poppins">Welcome, {currentUser?.fullName || 'Financial Secretary'}</h1>
          <p className="text-xs text-teal-100 mt-1 max-w-xl font-normal">
            Primary recorder of financial transactions, daily savings postings, share equity registers, and loan repayment processing.
          </p>
        </div>

        {/* Prominent Pending Badge Button */}
        {onNavigateToPending && (
          <button
            onClick={onNavigateToPending}
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center gap-2 cursor-pointer border-2 border-amber-300 animate-pulse"
          >
            <Bell className="w-4 h-4 fill-slate-950" />
            <span>Pending Treasurer Submissions ({pendingCount})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending Submissions Inbox Card */}
        <div
          onClick={onNavigateToPending}
          className="p-5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-amber-400/80 shadow-md hover:shadow-lg transition-all cursor-pointer relative overflow-hidden"
        >
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-xs text-amber-700 dark:text-amber-400 font-semibold">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              Pending Treasurer Submissions
            </span>
            <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
              Action Required
            </span>
          </div>
          <div className="text-2xl font-bold text-[#1B2A41] dark:text-white mt-2">
            {pendingCount} Pending
          </div>
          <p className="text-xs font-mono font-bold text-amber-600 mt-1">
            ₦{pendingAmount.toLocaleString()} Awaiting Verification
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Daily Postings Total (Today)</span>
            <Wallet className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-[#1B2A41] dark:text-white mt-2">₦14,850,000</div>
          <p className="text-xs text-emerald-600 font-semibold mt-1">142 Member Deposits Reconciled</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
            <span>Total Savings Under Ledger</span>
            <PiggyBank className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold text-[#1B2A41] dark:text-white mt-2">₦1,450,800,000</div>
          <p className="text-xs text-slate-500 mt-1">Ready for Passbook Posting</p>
        </div>
      </div>

      {/* Financial Secretary Active Loan Balance Module */}
      <LoanBalanceModule
        loans={loans}
        currentUserRole="financial_secretary"
        isReadOnly={false}
        title="Financial Secretary - Loan Balance & Repayments Ledger"
        subtitle="Manage active loan principal, interest paid, outstanding balances, repayment percentages, next due dates, and post repayments in real time."
        badgeLabel="FinSec Active Posting Ledger"
        onRepayLoan={onRepayLoan}
      />
    </div>
  );
};
