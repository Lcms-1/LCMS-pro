import React from 'react';
import {
  Landmark,
  Vault,
  CreditCard,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { User, LoanApplication } from '../../types';
import { LoanBalanceModule } from '../LoanBalanceModule';

interface TreasurerDashboardProps {
  currentUser: User;
  loans?: LoanApplication[];
}

export const TreasurerDashboard: React.FC<TreasurerDashboardProps> = ({ currentUser, loans = [] }) => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-800 via-amber-700 to-emerald-950 text-white shadow-xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-200 text-slate-950 font-extrabold text-xs uppercase tracking-wider mb-2">
          <Vault className="w-3.5 h-3.5" />
          Treasurer & Bank Vault Portal
        </div>
        <h1 className="text-2xl font-extrabold">Welcome, {currentUser?.fullName || 'Treasurer'}</h1>
        <p className="text-xs text-amber-100 mt-1 max-w-xl">
          Custodian of cooperative bank accounts, liquidity ratio, payment voucher authorizations, and dividend payouts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Cooperative Commercial Bank Liquidity</span>
            <Landmark className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">₦982,400,000</div>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">First Bank & Zenith Bank Accounts</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Cash-At-Hand Vault</span>
            <Vault className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">₦5,200,000</div>
          <p className="text-[11px] text-slate-400 mt-1">Branch Vault Petty Cash Limit</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Pending Payment Vouchers</span>
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">5 Vouchers</div>
          <p className="text-[11px] text-amber-600 font-bold mt-1">Awaiting Treasury Sign-Off</p>
        </div>
      </div>

      {/* Treasurer Read-Only Loan Portfolio Balances Module */}
      <LoanBalanceModule
        loans={loans}
        currentUserRole="treasurer"
        isReadOnly={true}
        title="Treasurer Treasury Vault - Loan Portfolio Balances"
        subtitle="Audited read-only view of loan principal, interest paid, outstanding balances, repayment percentage, next due date, and loan status."
        badgeLabel="Treasurer Vault View (Read-Only)"
      />
    </div>
  );
};
