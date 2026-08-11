import React from 'react';
import {
  Briefcase,
  Store,
  Bus,
  Home,
  Sprout,
  TrendingUp,
} from 'lucide-react';
import { User } from '../../types';

interface BusinessSupervisorDashboardProps {
  currentUser: User;
}

export const BusinessSupervisorDashboard: React.FC<BusinessSupervisorDashboardProps> = ({ currentUser }) => {
  const ventures = [
    { name: 'Coop Mass Transit Fleet', icon: Bus, category: 'Transport', capital: '₦85,000,000', monthlyRev: '₦12,400,000', valuation: '₦110,000,000' },
    { name: 'Lightway Supermarket Marts', icon: Store, category: 'Retail', capital: '₦45,000,000', monthlyRev: '₦8,900,000', valuation: '₦62,000,000' },
    { name: 'Lightway Housing Estate Phase 1', icon: Home, category: 'Real Estate', capital: '₦120,000,000', monthlyRev: '₦18,500,000', valuation: '₦185,000,000' },
    { name: 'Coop Agro-Allied Cassava Farm', icon: Sprout, category: 'Agriculture', capital: '₦35,000,000', monthlyRev: '₦6,200,000', valuation: '₦48,000,000' },
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-emerald-950 text-white shadow-xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-950 font-bold text-xs uppercase tracking-wider mb-2">
          <Briefcase className="w-3.5 h-3.5 text-indigo-800" />
          Commercial Ventures Supervisor Portal
        </div>
        <h1 className="text-2xl font-extrabold">Welcome, {currentUser?.fullName || 'Business Supervisor'}</h1>
        <p className="text-xs text-indigo-100 mt-1 max-w-xl">
          Supervision of cooperative commercial investments, transport fleets, supermarket chains, real estate schemes, and cassava farms.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {ventures.map((v) => {
          const Icon = v.icon;
          return (
            <div key={v.name} className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs text-slate-500 font-bold">
                <span className="truncate">{v.category}</span>
                <Icon className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="font-extrabold text-sm text-slate-900 dark:text-white mt-2 truncate">{v.name}</div>
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                Monthly Rev: <strong className="text-emerald-600">{v.monthlyRev}</strong>
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Valuation: {v.valuation}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
