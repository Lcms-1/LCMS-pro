import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Save,
  RotateCcw,
  Landmark,
  PiggyBank,
  HandCoins,
  CreditCard,
  Building2,
  Lock,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { User, CooperativeSettings } from '../../types';
import { AlertMessage } from '../AlertMessage';
import { apiUrl } from '../../utils/apiClient';

interface CooperativeSettingsViewProps {
  currentUser: User;
  onSettingsUpdated?: (newSettings: CooperativeSettings) => void;
}

export const CooperativeSettingsView: React.FC<CooperativeSettingsViewProps> = ({
  currentUser,
  onSettingsUpdated,
}) => {
  const isSuperAdmin = currentUser?.role === 'sys_admin';

  const [settings, setSettings] = useState<CooperativeSettings>({
    registrationFee: 2500,
    minimumSavingsDeposit: 1000,
    minimumTransferAmount: 500,
    belowMinBankCharge: 50,
    loanInterestRate: 12,
    loanRepaymentPeriodMonths: 12,
    maxLoanSavingsMultiplier: 3,
    guarantorMinSavingsPercentage: 100,
    cooperativeBankName: 'First Bank of Nigeria',
    cooperativeAccountNumber: '2039485712',
    currencySymbol: '₦',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch Current Settings
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/settings'));
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleChange = (field: keyof CooperativeSettings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin) {
      setErrorMessage('Access Denied: Only the Super Administrator can update policy values.');
      return;
    }

    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch(apiUrl('/api/settings'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings,
          actorName: currentUser.fullName,
          actorId: currentUser.id,
          role: currentUser.role,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSettings(data.settings);
        setSuccessMessage('Cooperative Policy Settings saved successfully! New registration fee & policy thresholds are now active across all modules.');
        if (onSettingsUpdated) onSettingsUpdated(data.settings);
      } else {
        setErrorMessage(data.error || 'Failed to update settings.');
      }
    } catch (err) {
      setErrorMessage('Network error while saving policy settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setSettings({
      registrationFee: 2500,
      minimumSavingsDeposit: 1000,
      minimumTransferAmount: 500,
      belowMinBankCharge: 50,
      loanInterestRate: 12,
      loanRepaymentPeriodMonths: 12,
      maxLoanSavingsMultiplier: 3,
      guarantorMinSavingsPercentage: 100,
      cooperativeBankName: 'First Bank of Nigeria',
      cooperativeAccountNumber: '2039485712',
      currencySymbol: '₦',
    });
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        Loading Cooperative Policy Settings...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Policy Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-extrabold text-xs uppercase tracking-wider mb-2 border border-emerald-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Executive Governance & Policy Configuration
          </div>
          <h1 className="text-2xl font-black text-white">Cooperative Policy Settings</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Configure core operational parameters such as dynamic Member Registration Fees, Minimum Savings Deposits, Loan Interest Rates, and Banking Controls. Values set here govern all financial postings.
          </p>
        </div>

        {!isSuperAdmin && (
          <div className="px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Read-Only Mode (Super Admin Access Required)</span>
          </div>
        )}
      </div>

      {successMessage && (
        <AlertMessage type="success" title="Settings Saved Successfully" message={successMessage} onClose={() => setSuccessMessage(null)} />
      )}

      {errorMessage && (
        <AlertMessage type="error" title="Access & Validation Notice" message={errorMessage} onClose={() => setErrorMessage(null)} />
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Membership & Savings Policy */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <PiggyBank className="w-5 h-5 text-emerald-600" />
              <h2 className="font-extrabold text-slate-900 dark:text-white text-base">
                Membership & Savings Deposit Policies
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-400">Section 1 of 3</span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Dynamic Registration Fee */}
            <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 dark:bg-slate-800/40 dark:border-slate-700">
              <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-200 mb-1">
                Dynamic Registration Fee (Default: ₦2,500) *
              </label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-2.5 text-sm font-black text-slate-500">₦</span>
                <input
                  type="number"
                  min="0"
                  disabled={!isSuperAdmin}
                  value={settings.registrationFee}
                  onChange={(e) => handleChange('registrationFee', Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                This amount is automatically used whenever a new member registers. Never hardcoded.
              </p>
            </div>

            {/* Enable Online Member Self-Registration Toggle */}
            <div className="p-4 rounded-xl border border-teal-200 bg-teal-50/40 dark:bg-slate-800/40 dark:border-slate-700">
              <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-200 mb-1">
                Enable Online Member Self-Registration
              </label>
              <div className="flex items-center justify-between mt-3">
                <span className={`text-xs font-bold ${settings.enableOnlineRegistration ? 'text-teal-700 dark:text-teal-400' : 'text-slate-500'}`}>
                  {settings.enableOnlineRegistration ? 'ON (Portal Active)' : 'OFF (In-Person Only)'}
                </span>
                <button
                  type="button"
                  disabled={!isSuperAdmin}
                  onClick={() => handleChange('enableOnlineRegistration', !settings.enableOnlineRegistration)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                    settings.enableOnlineRegistration ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.enableOnlineRegistration ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                When ON, prospective members can submit registration applications via the Member App. Applications appear in Financial Secretary's Pending Applications dashboard.
              </p>
            </div>

            {/* Minimum Savings Deposit */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/30 dark:bg-slate-800/40 dark:border-slate-700">
              <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-200 mb-1">
                Minimum Monthly Savings Deposit *
              </label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-2.5 text-sm font-black text-slate-500">₦</span>
                <input
                  type="number"
                  min="0"
                  disabled={!isSuperAdmin}
                  value={settings.minimumSavingsDeposit}
                  onChange={(e) => handleChange('minimumSavingsDeposit', Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Minimum required deposit threshold for active monthly savings.
              </p>
            </div>

            {/* Minimum Transfer Amount */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/30 dark:bg-slate-800/40 dark:border-slate-700">
              <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-200 mb-1">
                Minimum Transfer Amount *
              </label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-2.5 text-sm font-black text-slate-500">₦</span>
                <input
                  type="number"
                  min="0"
                  disabled={!isSuperAdmin}
                  value={settings.minimumTransferAmount}
                  onChange={(e) => handleChange('minimumTransferAmount', Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Minimum allowable transfer amount for member-to-member or wallet transfers.
              </p>
            </div>

            {/* Below Min Bank Charge */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/30 dark:bg-slate-800/40 dark:border-slate-700">
              <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-200 mb-1">
                Bank Charge for Deposits Below Minimum (₦)
              </label>
              <div className="relative mt-2">
                <span className="absolute left-3 top-2.5 text-sm font-black text-slate-500">₦</span>
                <input
                  type="number"
                  min="0"
                  disabled={!isSuperAdmin}
                  value={settings.belowMinBankCharge}
                  onChange={(e) => handleChange('belowMinBankCharge', Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 disabled:bg-slate-100"
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Processing charge applied when deposit is under the minimum savings threshold.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Credit & Loan Parameters */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <HandCoins className="w-5 h-5 text-amber-600" />
              <h2 className="font-extrabold text-slate-900 dark:text-white text-base">
                Credit & Loan Risk Parameters
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-400">Section 2 of 3</span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Loan Interest Rate */}
            <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30 dark:bg-slate-800/40 dark:border-slate-700">
              <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-200 mb-1">
                Annual Loan Interest Rate (%) *
              </label>
              <div className="relative mt-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  disabled={!isSuperAdmin}
                  value={settings.loanInterestRate}
                  onChange={(e) => handleChange('loanInterestRate', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs font-black text-slate-500">% p.a.</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Default interest rate applied to new loan applications (e.g., 12% = 1% monthly).
              </p>
            </div>

            {/* Loan Repayment Period */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/30 dark:bg-slate-800/40 dark:border-slate-700">
              <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-200 mb-1">
                Max Repayment Period (Months) *
              </label>
              <div className="relative mt-2">
                <input
                  type="number"
                  min="1"
                  max="60"
                  disabled={!isSuperAdmin}
                  value={settings.loanRepaymentPeriodMonths}
                  onChange={(e) => handleChange('loanRepaymentPeriodMonths', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100"
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs font-black text-slate-500">Months</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Maximum duration allowed for standard cooperative loans.
              </p>
            </div>

            {/* Max Loan Savings Multiplier */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/30 dark:bg-slate-800/40 dark:border-slate-700">
              <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-200 mb-1">
                Loan Eligibility Multiplier (x Savings)
              </label>
              <div className="relative mt-2">
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  disabled={!isSuperAdmin}
                  value={settings.maxLoanSavingsMultiplier}
                  onChange={(e) => handleChange('maxLoanSavingsMultiplier', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 disabled:bg-slate-100"
                />
                <span className="absolute right-3 top-2.5 text-xs font-black text-slate-500">Multiplier</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                Maximum loan eligibility cap based on member total savings (Default: 3x savings).
              </p>
            </div>
          </div>
        </div>

        {/* Section 3: Treasury Banking & Commercial Details */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden dark:bg-slate-900 dark:border-slate-800">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Landmark className="w-5 h-5 text-blue-600" />
              <h2 className="font-extrabold text-slate-900 dark:text-white text-base">
                Cooperative Treasury Bank Account Details
              </h2>
            </div>
            <span className="text-xs font-bold text-slate-400">Section 3 of 3</span>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-200 mb-1">
                Primary Bank Name *
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings.cooperativeBankName}
                onChange={(e) => handleChange('cooperativeBankName', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-900 dark:text-slate-200 mb-1">
                Primary Account Number *
              </label>
              <input
                type="text"
                disabled={!isSuperAdmin}
                value={settings.cooperativeAccountNumber}
                onChange={(e) => handleChange('cooperativeAccountNumber', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
                required
              />
            </div>
          </div>
        </div>

        {/* Action Controls */}
        {isSuperAdmin && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 text-white">
            <div className="text-xs text-slate-300 flex items-center gap-2">
              <BadgeCheck className="w-4 h-4 text-emerald-400" />
              <span>
                Last updated: {settings.updatedAt ? new Date(settings.updatedAt).toLocaleString() : 'Never'} by{' '}
                <strong className="text-white">{settings.updatedBy || 'Super Admin'}</strong>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Defaults
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-black text-white shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving Policies...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save & Apply Policy Settings
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
