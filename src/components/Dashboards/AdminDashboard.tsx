import React from 'react';
import {
  ShieldAlert,
  Server,
  Users,
  Database,
  Activity,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Clock,
  Sparkles,
  RefreshCw,
  Cpu,
} from 'lucide-react';
import { User, AuditLog, TableSchema } from '../../types';

interface AdminDashboardProps {
  currentUser: User;
  auditLogs: AuditLog[];
  databaseSchemas: TableSchema[];
  onNavigateToSchema: () => void;
  onNavigateToPermissions: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  auditLogs,
  databaseSchemas,
  onNavigateToSchema,
  onNavigateToPermissions,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 rounded-full bg-amber-500/10 blur-2xl" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-emerald-950 font-black text-xs uppercase tracking-wider mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              System Administrator Portal
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Welcome back, {currentUser?.fullName || 'Administrator'}
            </h1>
            <p className="text-xs text-emerald-200 mt-1 max-w-xl">
              System health status operational. 10 database schemas prepared, 9 user role profiles active, immutable audit logging active.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToPermissions}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <Lock className="w-4 h-4" />
              Manage RBAC Permissions
            </button>
            <button
              onClick={onNavigateToSchema}
              className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-extrabold text-xs border border-emerald-600 shadow-md transition-all flex items-center gap-1.5"
            >
              <Database className="w-4 h-4 text-amber-300" />
              Database Schemas
            </button>
          </div>
        </div>
      </div>

      {/* Admin KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Server Health</span>
            <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300">
              <Cpu className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            99.98%
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full dark:bg-emerald-950 dark:text-emerald-300">
              Optimal
            </span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Latency 18ms • Port 3000</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Active Roles Configured</span>
            <span className="p-2 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              <Lock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">9 Roles</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">24 System Permissions Mapped</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Database Tables</span>
            <span className="p-2 rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
              <Database className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">10 Tables</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">4 Foundation • 6 Phase 2 Ready</p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Security Audit Trail</span>
            <span className="p-2 rounded-xl bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3 text-2xl font-black text-slate-900 dark:text-white">{auditLogs.length} Events</div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Immutable Log Stream</p>
        </div>
      </div>

      {/* Main Grid: Database Schema Status & Recent Audit Events */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Database Readiness Overview */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-700" />
                Database Modular Foundation Status
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pre-configured relational tables ready for immediate or Phase 2 deployment
              </p>
            </div>
            <button
              onClick={onNavigateToSchema}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1"
            >
              View Full Schema <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {databaseSchemas.map((table) => (
              <div
                key={table.tableName}
                className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 dark:bg-slate-800/40 dark:border-slate-800 flex items-center justify-between hover:bg-emerald-50/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono text-xs font-black flex items-center justify-center">
                    SQL
                  </div>
                  <div>
                    <div className="font-bold text-xs font-mono text-slate-900 dark:text-white">
                      {table.tableName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {table.moduleName} • {table.columns.length} columns
                    </div>
                  </div>
                </div>

                <div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      table.status === 'active_foundation'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {table.status === 'active_foundation' ? 'Active' : 'Phase 2 Ready'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Security & Audit Stream */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-600" />
                Live Security & Audit Stream
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Real-time</span>
            </div>

            <div className="space-y-3">
              {auditLogs.slice(0, 5).map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 dark:bg-slate-800/40 dark:border-slate-800 text-xs"
                >
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    <span className="text-emerald-700 dark:text-emerald-400">{log.action}</span>
                    <span className="text-slate-400 text-[10px]">{log.timestamp.split(' ')[1]}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1 leading-snug">
                    {log.details}
                  </p>
                  <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200/40 dark:border-slate-700/50">
                    <span>By: {log.actorName} ({log.role})</span>
                    <span>IP: {log.ipAddress}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[11px] text-slate-500 font-medium">
              System Admin Audit Policy Enforced
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
