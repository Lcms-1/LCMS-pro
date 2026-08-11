import React from 'react';
import {
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { User, AuditLog } from '../../types';

interface AuditorDashboardProps {
  currentUser: User;
  auditLogs: AuditLog[];
  onNavigateToAuditLogs: () => void;
}

export const AuditorDashboard: React.FC<AuditorDashboardProps> = ({
  currentUser,
  auditLogs,
  onNavigateToAuditLogs,
}) => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-rose-900 via-rose-800 to-emerald-950 text-white shadow-xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-950 font-bold text-xs uppercase tracking-wider mb-2">
          <FileSearch className="w-3.5 h-3.5 text-rose-800" />
          Internal Audit & Compliance Portal
        </div>
        <h1 className="text-2xl font-extrabold">Welcome, {currentUser?.fullName || 'Auditor'}</h1>
        <p className="text-xs text-rose-100 mt-1 max-w-xl">
          Independent transaction verification, ledger balance reconciliation, anomaly detection, and statutory regulatory compliance monitoring.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Audit Compliance Index</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">98.4%</div>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">Passing Statutory Audits</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Anomalies / Flags</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">0 Critical</div>
          <p className="text-[11px] text-slate-400 mt-1">Zero Double-Posting Detected</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Logs Monitored</span>
            <ShieldAlert className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{auditLogs.length} Events</div>
          <p className="text-[11px] text-slate-400 mt-1">Immutable Log Security</p>
        </div>
      </div>
    </div>
  );
};
