import React from 'react';
import {
  Users,
  ShieldCheck,
  CheckSquare,
  Award,
  HeartHandshake,
  Activity,
} from 'lucide-react';
import { User } from '../../types';

interface ViceChairmanDashboardProps {
  currentUser: User;
}

export const ViceChairmanDashboard: React.FC<ViceChairmanDashboardProps> = ({ currentUser }) => {
  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-900 text-white shadow-xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-bold text-xs uppercase tracking-wider mb-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          Vice Chairman Portal
        </div>
        <h1 className="text-2xl font-extrabold">Welcome, {currentUser?.fullName || 'Vice Chairman'}</h1>
        <p className="text-xs text-emerald-100 mt-1 max-w-xl">
          Delegated operations oversight, member welfare coordination, committee supervisions, and branch performance tracking.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Member Welfare Requests</span>
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">12 Active</div>
          <p className="text-[11px] text-slate-400 mt-1">Medical, Emergency & Bereavement Grants</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Standing Committees</span>
            <CheckSquare className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">4 Overseen</div>
          <p className="text-[11px] text-slate-400 mt-1">Credit, Welfare, Supervisory, Investment</p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
            <span>Zonal Branch Health</span>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">4/4 Branches</div>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">100% Operational Compliance</p>
        </div>
      </div>
    </div>
  );
};
