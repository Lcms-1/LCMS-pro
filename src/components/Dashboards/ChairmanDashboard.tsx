import React from 'react';
import {
  Crown,
  TrendingUp,
  Landmark,
  FileCheck2,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Sparkles,
  Award,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { User, LoanApplication } from '../../types';
import { LoanBalanceModule } from '../LoanBalanceModule';

interface ChairmanDashboardProps {
  currentUser: User;
  loans?: LoanApplication[];
  onNavigateToSchema: () => void;
}

export const ChairmanDashboard: React.FC<ChairmanDashboardProps> = ({
  currentUser,
  loans = [],
  onNavigateToSchema,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Gold Executive Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-700 via-amber-800 to-emerald-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 rounded-full bg-amber-400/20 blur-2xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider mb-2">
              <Crown className="w-3.5 h-3.5" />
              Office of the Chairman / President
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Welcome, {currentUser?.fullName || 'Chairman'}
            </h1>
            <p className="text-xs text-amber-100 mt-1 max-w-xl">
              Cooperative executive overview. Total asset valuation at ₦1.78 Billion with 68.4% liquidity ratio across 4 zonal branches.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToSchema}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-black text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              Inspect Phase 2 Modules
            </button>
          </div>
        </div>
      </div>

      {/* Chairman Executive KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Asset Portfolio</span>
            <span className="p-2 rounded-xl bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
              <Landmark className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">₦1,788,800,000</div>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">↑ 12.4% Annual Growth</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Savings Deposits</span>
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">₦1,450,800,000</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">3,380 Member Passbooks</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Pending Board Approvals</span>
            <span className="p-2 rounded-xl bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              <FileCheck2 className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">3 Major Loans</div>
          <p className="text-[11px] text-amber-600 font-bold mt-1">Awaiting Tier-2 Sign-off</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Share Capital Reserve</span>
            <span className="p-2 rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              <Award className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">₦338,000,000</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">3,380,000 Equity Shares</p>
        </div>
      </div>

      {/* Board Executive Agenda & Approvals Queue Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Pending Tier-2 Executive Approvals */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-amber-600" />
                Executive Approval Queue (Phase 2 Preview)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Major financial disbursements exceeding ₦1,000,000 requiring Chairman sign-off
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
              3 In Queue
            </span>
          </div>

          <div className="space-y-3">
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                    App #LN-2026-042: Agro Processing Machinery Loan
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-200 text-amber-900">
                    ₦8,500,000
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Applicant: Alh. Danjuma Garba (Ibadan Branch) • Vetted by FinSec & Treasurer
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => alert('Phase 2 Module: Loan Management will handle live Chairman digital approvals.')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  Approve Application
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 dark:bg-slate-800/40 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                    App #LN-2026-039: Commercial Real Estate Acquisition
                  </span>
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                    ₦15,000,000
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Applicant: Port Harcourt Business Committee • Guarantor Encumbrance 100%
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => alert('Phase 2 Module: Loan Management will handle live Chairman digital approvals.')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs"
                >
                  Approve Application
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Board Calendar & Minutes */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-emerald-700" />
            Executive Calendar & Board Sessions
          </h3>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
              <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                Quarterly Board Meeting (Q3 2026)
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                Date: August 14, 2026 • 10:00 AM WAT
              </p>
              <div className="text-[10px] text-slate-500 mt-1">
                Agenda: Audited financial statement review & dividend allocation proposal.
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
              <div className="text-xs font-bold text-slate-800 dark:text-white">
                AGM Planning Committee Session
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Date: August 28, 2026 • Lagos Island HQ
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Chairman Executive Read-Only Loan Portfolio Balance Oversight */}
      <LoanBalanceModule
        loans={loans}
        currentUserRole="chairman"
        isReadOnly={true}
        title="Executive Chairman - Loan Balance & Portfolio Oversight"
        subtitle="High-level executive oversight of total loan disbursements, principal repaid, interest earned, outstanding portfolio balances, and overdue accounts."
        badgeLabel="Office of the Chairman - Read Only Oversight"
      />
    </div>
  );
};
