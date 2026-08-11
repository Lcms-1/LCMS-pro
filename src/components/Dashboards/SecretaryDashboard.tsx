import React from 'react';
import {
  FileText,
  Users,
  Calendar,
  Send,
  BookOpen,
  FolderKanban,
} from 'lucide-react';
import { User } from '../../types';

interface SecretaryDashboardProps {
  currentUser: User;
}

export const SecretaryDashboard: React.FC<SecretaryDashboardProps> = ({ currentUser }) => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-blue-800 to-emerald-950 text-white shadow-xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-900 font-bold text-xs uppercase tracking-wider mb-2">
          <BookOpen className="w-3.5 h-3.5" />
          General Secretariat Portal
        </div>
        <h1 className="text-2xl font-extrabold">Welcome, {currentUser?.fullName || 'Secretary'}</h1>
        <p className="text-xs text-blue-100 mt-1 max-w-xl">
          Custodian of cooperative records, membership roster, official minutes, correspondence logs, and AGM administration.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Cooperative Roster Count</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">3,380 Members</div>
          <p className="text-[11px] text-slate-400 mt-1">Across 4 State Zonal Branches</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Meeting Minutes Logged</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">28 Archives</div>
          <p className="text-[11px] text-slate-400 mt-1">Executive Board & AGM Session Records</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Official Dispatches</span>
            <Send className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">14 Circulars</div>
          <p className="text-[11px] text-slate-400 mt-1">Issued to General Membership in 2026</p>
        </div>
      </div>
    </div>
  );
};
