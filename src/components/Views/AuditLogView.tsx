import React, { useState } from 'react';
import {
  FileText,
  Search,
  Activity,
  Shield,
  Download,
  Filter,
} from 'lucide-react';
import { AuditLog } from '../../types';

interface AuditLogViewProps {
  logs: AuditLog[];
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ logs }) => {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'warning' | 'critical'>('all');

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.actorName.toLowerCase().includes(search.toLowerCase()) ||
      l.details.toLowerCase().includes(search.toLowerCase()) ||
      l.module.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || l.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider mb-2">
              <Activity className="w-3.5 h-3.5" />
              Immutable Audit Log Stream
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Security & Action Audit Trail
            </h1>
            <p className="text-xs text-emerald-200 mt-1 max-w-2xl">
              Every login session, permission change, passbook posting, and administrative action is recorded with cryptographic timestamps and IP tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSeverityFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              severityFilter === 'all'
                ? 'bg-emerald-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            All Logs ({logs.length})
          </button>
          <button
            onClick={() => setSeverityFilter('info')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              severityFilter === 'info'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            Info
          </button>
          <button
            onClick={() => setSeverityFilter('warning')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              severityFilter === 'warning'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            Warnings
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, actor, or details..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs dark:bg-slate-900 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px]">
                <th className="p-3">Timestamp</th>
                <th className="p-3">Actor</th>
                <th className="p-3">Role</th>
                <th className="p-3">Action</th>
                <th className="p-3">Module</th>
                <th className="p-3">Context Details</th>
                <th className="p-3">Client IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-mono text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {log.timestamp}
                  </td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">
                    {log.actorName}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                      {log.role}
                    </span>
                  </td>
                  <td className="p-3 font-extrabold text-slate-800 dark:text-slate-200">
                    {log.action}
                  </td>
                  <td className="p-3 font-medium text-slate-600 dark:text-slate-300">
                    {log.module}
                  </td>
                  <td className="p-3 text-slate-600 dark:text-slate-300 max-w-xs">
                    {log.details}
                  </td>
                  <td className="p-3 font-mono text-[10px] text-slate-400">
                    {log.ipAddress}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
