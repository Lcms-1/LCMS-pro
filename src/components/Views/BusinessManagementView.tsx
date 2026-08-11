import React, { useState } from 'react';
import {
  Briefcase,
  Store,
  Bus,
  Home as HomeIcon,
  Sprout,
  TrendingUp,
  PlusCircle,
  CheckCircle2,
  DollarSign,
  Building2,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { User } from '../../types';
import { AlertMessage } from '../AlertMessage';
import { apiUrl } from '../../utils/apiClient';

interface BusinessManagementViewProps {
  currentUser?: User;
  onRefreshData?: () => void;
}

export const BusinessManagementView: React.FC<BusinessManagementViewProps> = ({
  currentUser,
}) => {
  const [activeTab, setActiveTab] = useState<'ventures' | 'add_entry'>('ventures');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Starts empty: real ventures are added through this screen once the
  // cooperative begins funding business ventures. No sample/demo data.
  const [ventures, setVentures] = useState<Array<{
    id: string;
    name: string;
    icon: typeof Bus;
    category: string;
    capital: number;
    monthlyRev: number;
    monthlyProfit: number;
    valuation: number;
    status: string;
    manager: string;
  }>>([]);

  // Form State for Entry
  const [selectedVentureId, setSelectedVentureId] = useState('v1');
  const [revenueAmount, setRevenueAmount] = useState('');
  const [profitAmount, setProfitAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isPosting, setIsPosting] = useState(false);

  const totalCapital = ventures.reduce((s, v) => s + v.capital, 0);
  const totalMonthlyRev = ventures.reduce((s, v) => s + v.monthlyRev, 0);
  const totalMonthlyProfit = ventures.reduce((s, v) => s + v.monthlyProfit, 0);
  const totalValuation = ventures.reduce((s, v) => s + v.valuation, 0);

  const handlePostBusinessIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(profitAmount);
    if (!amount || amount <= 0) {
      setAlert({ type: 'error', message: 'Please enter a valid profit amount.' });
      return;
    }

    setIsPosting(true);
    try {
      const selectedVenture = ventures.find((v) => v.id === selectedVentureId);
      const res = await fetch(apiUrl('/api/wallets/post-payment'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentType: 'Business Profit',
          amount: amount,
          description: description || `Monthly business profit from ${selectedVenture?.name}`,
          receivedFrom: selectedVenture?.name,
          paymentMethod: 'Bank Transfer',
          postedBy: currentUser?.fullName || 'Business Supervisor',
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAlert({
          type: 'success',
          message: `Successfully posted ₦${amount.toLocaleString()} business profit from ${selectedVenture?.name} directly into the Cooperative Main Wallet!`,
        });
        setProfitAmount('');
        setRevenueAmount('');
        setDescription('');
        setActiveTab('ventures');
      } else {
        setAlert({ type: 'error', message: data.error || 'Failed to post business income.' });
      }
    } catch (err: any) {
      setAlert({ type: 'error', message: err.message || 'Server error while posting profit.' });
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-emerald-950 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-400 text-purple-950 font-black text-xs uppercase tracking-wider mb-2">
              <Briefcase className="w-3.5 h-3.5" />
              Commercial & Business Ventures Portal
            </div>
            <h1 className="text-2xl font-black tracking-tight">
              Commercial Ventures Management
            </h1>
            <p className="text-xs text-purple-200 mt-1 max-w-xl">
              Real-time monitoring of cooperative investments, commercial transport fleets, supermarket marts, real estate housing schemes, and agro-processing plants.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('add_entry')}
              className="px-4 py-2.5 rounded-xl bg-[#DAA520] hover:bg-amber-400 text-[#014421] font-black text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Post Venture Profit to Wallet
            </button>
          </div>
        </div>
      </div>

      {alert && <AlertMessage type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase">Total Capital Invested</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">₦{totalCapital.toLocaleString()}</div>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">4 Active Venture Portfolios</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase">Monthly Revenue</div>
          <div className="text-2xl font-black text-emerald-600 mt-2">₦{totalMonthlyRev.toLocaleString()}</div>
          <p className="text-[11px] text-slate-500 mt-1">Gross Commercial Receipts</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase">Monthly Net Profit</div>
          <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">₦{totalMonthlyProfit.toLocaleString()}</div>
          <p className="text-[11px] text-indigo-600 font-bold mt-1">Automated Main Wallet Postings</p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="text-xs text-slate-500 dark:text-slate-400 font-extrabold uppercase">Total Asset Valuation</div>
          <div className="text-2xl font-black text-amber-600 mt-2">₦{totalValuation.toLocaleString()}</div>
          <p className="text-[11px] text-amber-600 font-bold mt-1">+42.1% Unrealized Asset Gain</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('ventures')}
          className={`px-4 py-2.5 font-extrabold text-xs rounded-t-xl transition-all cursor-pointer ${
            activeTab === 'ventures'
              ? 'bg-[#014421] text-white border-t-2 border-[#DAA520]'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          Active Venture Portfolios
        </button>
        <button
          onClick={() => setActiveTab('add_entry')}
          className={`px-4 py-2.5 font-extrabold text-xs rounded-t-xl transition-all cursor-pointer ${
            activeTab === 'add_entry'
              ? 'bg-[#014421] text-white border-t-2 border-[#DAA520]'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          Post Business Profit to Wallet
        </button>
      </div>

      {/* Active Tab Content */}
      {activeTab === 'ventures' && ventures.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center py-16 px-6 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <div className="p-4 rounded-2xl bg-[#014421]/10 text-[#014421] dark:bg-[#6DBE45]/10 dark:text-[#6DBE45] mb-4">
            <Briefcase className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
            No business ventures yet
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-5">
            When the cooperative begins funding commercial ventures, add the first one here to start tracking capital, revenue, and profit.
          </p>
          <button
            onClick={() => setActiveTab('add_entry')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#014421] text-white font-bold text-sm hover:bg-[#025c2c] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Post First Business Entry
          </button>
        </div>
      )}

      {activeTab === 'ventures' && ventures.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ventures.map((v) => {
            const Icon = v.icon;
            return (
              <div
                key={v.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200/90 dark:border-slate-800 p-6 shadow-sm hover:border-[#DAA520] transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-purple-100 text-purple-900 dark:bg-purple-950 dark:text-purple-300 border border-purple-200">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase text-purple-700 dark:text-purple-400 tracking-wider">
                        {v.category}
                      </span>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                        {v.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Manager: {v.manager}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[11px] font-black">
                    {v.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Initial Capital</span>
                    <div className="font-extrabold text-slate-900 dark:text-white mt-0.5">₦{v.capital.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Monthly Revenue</span>
                    <div className="font-extrabold text-emerald-600 mt-0.5">₦{v.monthlyRev.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Monthly Net Profit</span>
                    <div className="font-black text-indigo-600 dark:text-indigo-400 mt-0.5">₦{v.monthlyProfit.toLocaleString()}</div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Valuation</span>
                    <div className="font-extrabold text-amber-600 mt-0.5">₦{v.valuation.toLocaleString()}</div>
                  </div>
                </div>

                <div className="mt-4 pt-3 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedVentureId(v.id);
                      setActiveTab('add_entry');
                    }}
                    className="text-xs font-black text-[#014421] dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    Post Income Entry <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'add_entry' && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border-2 border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-[#014421] dark:text-emerald-400 font-black text-lg">
            <Building2 className="w-6 h-6 text-[#DAA520]" />
            Post Venture Profit to Main Cooperative Wallet
          </div>
          <p className="text-xs text-slate-500 mb-6">
            All commercial profits are automatically posted directly into the Cooperative Master Wallet under the <strong>"Business Profit"</strong> income category.
          </p>

          <form onSubmit={handlePostBusinessIncome} className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                Select Commercial Venture
              </label>
              <select
                value={selectedVentureId}
                onChange={(e) => setSelectedVentureId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              >
                {ventures.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.category})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                Gross Monthly Revenue (NGN)
              </label>
              <input
                type="number"
                value={revenueAmount}
                onChange={(e) => setRevenueAmount(e.target.value)}
                placeholder="e.g. 12400000"
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                Net Profit Amount to Post to Cooperative Main Wallet (NGN) *
              </label>
              <input
                type="number"
                value={profitAmount}
                onChange={(e) => setProfitAmount(e.target.value)}
                placeholder="e.g. 3800000"
                required
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-black text-emerald-600"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 dark:text-slate-300 mb-1">
                Audit Description / Notes
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Q1 Transit fleet operational net surplus distribution..."
                rows={3}
                className="w-full p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium"
              />
            </div>

            <button
              type="submit"
              disabled={isPosting}
              className="w-full py-3 rounded-xl bg-[#014421] hover:bg-emerald-800 text-[#DAA520] font-black text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isPosting ? 'Posting to Master Vault...' : 'Post Profit to Cooperative Main Wallet'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
