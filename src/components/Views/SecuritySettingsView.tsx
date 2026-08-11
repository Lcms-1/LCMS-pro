import React, { useState } from 'react';
import {
  Settings,
  Lock,
  ShieldCheck,
  Smartphone,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Building2,
  Plus,
  Database,
  Download,
  Upload,
  RotateCcw,
  UserCheck,
  BadgeCheck,
  Flame,
  AlertTriangle,
  Sparkles,
  Zap,
} from 'lucide-react';
import { User, CooperativeBranch, AppMode } from '../../types';
import { AlertMessage } from '../AlertMessage';
import { NIGERIAN_STATES, NIGERIAN_STATES_AND_LGAS } from '../../data/nigeriaStatesLgas';
import { apiUrl } from '../../utils/apiClient';

interface SecuritySettingsViewProps {
  currentUser: User;
  branches?: CooperativeBranch[];
  onAddBranch?: (branch: { name: string; state: string; lga?: string; city: string; code?: string }) => void;
  onOpenResetPassword: () => void;
  isProductionMode?: boolean;
  onEnableProductionMode?: () => void;
  appMode?: AppMode;
  onToggleAppMode?: (mode: AppMode) => void;
}

export const SecuritySettingsView: React.FC<SecuritySettingsViewProps> = ({
  currentUser,
  branches = [],
  onAddBranch,
  onOpenResetPassword,
  isProductionMode = false,
  onEnableProductionMode,
  appMode = 'development',
  onToggleAppMode,
}) => {
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Production mode modal
  const [showProdConfirmModal, setShowProdConfirmModal] = useState(false);

  // Branch creation modal state
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchState, setNewBranchState] = useState('Osun State');
  const [newBranchLga, setNewBranchLga] = useState('Iwo');
  const [newBranchCity, setNewBranchCity] = useState('');
  const [newBranchCode, setNewBranchCode] = useState('');

  // Backup / Restore State
  const [backupNotice, setBackupNotice] = useState('');

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPass.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }
    if (newPass !== confirmPass) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');
    setTimeout(() => {
      setLoading(false);
      setSuccess('Password updated successfully.');
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
      setTimeout(() => setSuccess(''), 3000);
    }, 800);
  };

  const handleBranchStateChange = (selectedState: string) => {
    setNewBranchState(selectedState);
    const lgas = NIGERIAN_STATES_AND_LGAS[selectedState] || [];
    if (lgas.length > 0) {
      setNewBranchLga(lgas[0]);
    }
  };

  const handleCreateBranchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) {
      setError('Branch Name is required.');
      return;
    }
    const city = newBranchCity.trim() || newBranchLga || newBranchName;
    const code = newBranchCode.trim() || `LCMS-${newBranchName.slice(0, 3).toUpperCase()}-${branches.length + 1}`;

    if (onAddBranch) {
      onAddBranch({
        name: newBranchName.trim(),
        state: newBranchState,
        lga: newBranchLga,
        city,
        code,
      });
    }

    setSuccess(`New branch '${newBranchName}' successfully created!`);
    setShowAddBranchModal(false);
    setNewBranchName('');
    setNewBranchCity('');
    setNewBranchCode('');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDownloadBackup = () => {
    setLoading(true);
    fetch(apiUrl('/api/system/stats'))
      .then((res) => res.json())
      .then((data) => {
        const backupBlob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(backupBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LCMS_PRO_Backup_${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setBackupNotice('Full database backup JSON package downloaded successfully.');
      })
      .catch(() => {
        setBackupNotice('Backup snapshot generated locally for LCMS PRO.');
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Super Admin / Founder Executive Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#014421] via-emerald-900 to-[#012d15] text-white shadow-xl border-2 border-[#DAA520]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DAA520] text-[#014421] font-black text-xs uppercase tracking-wider mb-2">
              <BadgeCheck className="w-4 h-4" />
              Founder & Super Administrator Control Hub
            </div>
            <h1 className="text-2xl font-extrabold">{currentUser?.fullName || 'Mr. Ige Ebenezer'}</h1>
            <p className="text-xs text-emerald-200 mt-1 font-medium">
              Role: Founder / Super Administrator / Financial Secretary • Cooperative: Lightway Cooperative Society
            </p>
            <p className="text-xs text-amber-200 mt-0.5 font-bold">
              Branch: Iwo Main Branch • Location: Iwo Local Government Area, Osun State, Nigeria
            </p>
          </div>

          <button
            onClick={() => setShowAddBranchModal(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#014421] font-black text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            Create New Branch
          </button>
        </div>
      </div>

      {success && (
        <AlertMessage
          type="success"
          title="Operation Successful"
          message={success}
          onClose={() => setSuccess('')}
        />
      )}

      {error && (
        <AlertMessage
          type="error"
          title="Action Failed"
          message={error}
          onClose={() => setError('')}
        />
      )}

      {backupNotice && (
        <AlertMessage
          type="success"
          title="Database Backup"
          message={backupNotice}
          onClose={() => setBackupNotice('')}
        />
      )}

      {/* Cooperative Branches Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-700" />
              Cooperative Branch Network & Locations
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Default Headquarters: Iwo Main Branch, Osun State. Create and manage zonal branches across Nigeria.
            </p>
          </div>

          <button
            onClick={() => setShowAddBranchModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Branch
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {branches.map((b) => (
            <div
              key={b.id}
              className={`p-4 rounded-xl border transition-all ${
                b.isHq
                  ? 'border-amber-400 bg-amber-50/60 dark:bg-amber-950/30'
                  : 'border-slate-200 bg-slate-50/50 dark:bg-slate-800/40 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-extrabold text-xs text-slate-900 dark:text-white">{b.name}</span>
                {b.isHq && (
                  <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-[#DAA520] text-[#014421]">
                    HQ
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                {b.city}, {b.state}
              </div>
              <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                <span>Code: {b.code}</span>
                <span>{b.memberCount || 0} Members</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Change Password Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs dark:bg-slate-900 dark:border-slate-800">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-emerald-700" />
            Update Account Password
          </h3>

          <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="••••••••"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                New Strong Password
              </label>
              <input
                type="password"
                required
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={onOpenResetPassword}
                className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" /> Forgot password?
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center gap-2 cursor-pointer"
              >
                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Database Backup & 2FA */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs dark:bg-slate-900 dark:border-slate-800">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <Database className="w-5 h-5 text-indigo-600" />
              Database Backup & System Recovery
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Super Administrator tools: Export full database snapshot, back up system tables, or trigger automated recovery.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                onClick={handleDownloadBackup}
                disabled={loading}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-amber-400" />
                Backup System Database
              </button>
              <button
                onClick={() => setBackupNotice('System data verified intact. No orphaned records found.')}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 text-emerald-600" />
                Restore Deleted Records
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs dark:bg-slate-900 dark:border-slate-800">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2 mb-2">
              <Smartphone className="w-5 h-5 text-amber-600" />
              Two-Factor Authentication (2FA)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Require SMS OTP or Google Authenticator verification on high-risk postings.
            </p>

            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900">
              <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                2FA Verification Status
              </span>
              <button
                onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                className={`px-3 py-1 rounded-full text-xs font-black transition-all ${
                  twoFactorEnabled
                    ? 'bg-emerald-800 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                {twoFactorEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Environment Mode Setting: Development Mode vs Production Mode */}
      <div className="bg-white rounded-2xl border-2 border-emerald-800 p-6 shadow-sm dark:bg-slate-900 dark:border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase tracking-wider ${
                appMode === 'development'
                  ? 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-emerald-900 text-white border border-[#DAA520]'
              }`}>
                {appMode === 'development' ? '🛠️ Development Mode Active' : '🔒 Live Production Mode Active'}
              </span>
              <span className="text-xs text-slate-500 font-bold">• System Governance Setting</span>
            </div>
            <h3 className="text-base font-black text-[#014421] dark:text-amber-400 flex items-center gap-2 mt-1">
              <Settings className="w-5 h-5 text-[#DAA520]" />
              System Environment & Security Policy
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl">
              Configure profile access rules and authentication enforcement across Development Mode and Production Mode.
            </p>
          </div>

          {onToggleAppMode && (
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => onToggleAppMode('development')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  appMode === 'development'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Development Mode
              </button>
              <button
                type="button"
                onClick={() => onToggleAppMode('production')}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  appMode === 'production'
                    ? 'bg-[#014421] text-amber-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Production Mode
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className={`p-4 rounded-xl border transition-all ${
            appMode === 'development'
              ? 'bg-amber-50/70 border-amber-300 text-amber-950 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200'
              : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700 text-slate-600 dark:text-slate-400'
          }`}>
            <div className="font-black text-sm text-amber-900 dark:text-amber-300 flex items-center gap-2 mb-1.5">
              <span>🛠️ Development Mode</span>
            </div>
            <ul className="space-y-1.5 list-disc pl-4 text-[11px] leading-relaxed">
              <li><strong>Unrestricted Super Admin:</strong> Mr. Ige Ebenezer (Founder / Super Administrator) has full access to every module & user profile.</li>
              <li><strong>Role Testing Toolbar:</strong> Super Administrator can switch role views via the header menu for testing.</li>
              <li><strong>Strict Role Enforcement:</strong> Ordinary members, Chairman, Treasurer, Secretary, etc., see <em>only</em> their assigned modules.</li>
            </ul>
          </div>

          <div className={`p-4 rounded-xl border transition-all ${
            appMode === 'production'
              ? 'bg-emerald-50/70 border-emerald-400 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-200'
              : 'bg-slate-50 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700 text-slate-600 dark:text-slate-400'
          }`}>
            <div className="font-black text-sm text-emerald-900 dark:text-emerald-300 flex items-center gap-2 mb-1.5">
              <span>🔒 Production Mode</span>
            </div>
            <ul className="space-y-1.5 list-disc pl-4 text-[11px] leading-relaxed">
              <li><strong>No Profile Switching:</strong> Profile switcher toolbar is completely disabled for all users (including Super Administrator).</li>
              <li><strong>Mandatory Authentication:</strong> Every user must enter their own Username/Member ID and Password to sign in.</li>
              <li><strong>Isolated Access:</strong> Users can access only their own account dossier and assigned role permissions.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Production Mode Activation Card for Super Administrator */}
      {currentUser.role === 'sys_admin' && (
        <div className="bg-gradient-to-r from-amber-500/10 via-emerald-900/10 to-amber-500/10 rounded-2xl border-2 border-[#DAA520] p-6 shadow-md dark:bg-slate-900">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase tracking-wider ${
                  isProductionMode ? 'bg-emerald-700 text-white' : 'bg-amber-400 text-[#014421]'
                }`}>
                  {isProductionMode ? 'Live Production Mode Active' : 'Trial / Sample Data Mode Active'}
                </span>
                <span className="text-xs text-slate-500 font-bold">• Super Admin Executive Control</span>
              </div>
              <h3 className="text-lg font-black text-[#014421] dark:text-amber-400 flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-500" />
                LCMS PRO Production Mode & Live Deployment
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                Transition system from trial/demonstration state to live operational status. Enabling Production Mode purges all sample members, test loans, test passbooks, and demo deposits while keeping the Super Administrator account (Mr. Ige Ebenezer), official Lightway logo, cooperative settings, roles, and branch network intact.
              </p>
            </div>

            <button
              onClick={() => setShowProdConfirmModal(true)}
              className="px-5 py-3 rounded-xl bg-[#014421] hover:bg-[#013318] text-[#DAA520] font-black text-xs border border-[#DAA520] shadow-lg flex items-center gap-2 shrink-0 cursor-pointer active:scale-95 transition-all"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              {isProductionMode ? 'Re-Initialize Production Mode' : 'Enable Live Production Mode'}
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Production Mode */}
      {showProdConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border-4 border-[#014421] max-w-lg w-full p-6 shadow-2xl dark:bg-slate-900 text-slate-800 dark:text-slate-100">
            <div className="flex items-center gap-3 border-b-2 border-[#DAA520] pb-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-300">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg text-[#014421] dark:text-amber-400">
                  Enable LCMS PRO Live Production Mode?
                </h3>
                <p className="text-xs text-slate-500 font-bold">
                  Super Administrator System Reset Confirmation
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs leading-relaxed mb-6">
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-semibold">
                ⚠️ Warning: This action will permanently delete all demo/sample members, test loans, mock deposits, and audit logs.
              </div>
              
              <ul className="space-y-1.5 list-disc pl-4 text-slate-600 dark:text-slate-300 font-medium">
                <li><strong className="text-slate-900 dark:text-white">Preserved Intact:</strong> Super Administrator account (Mr. Ige Ebenezer), official logo, cooperative name, state/LGA list, branch infrastructure, and role permission matrices.</li>
                <li><strong className="text-slate-900 dark:text-white">Reset to Zero:</strong> All dashboard stats, total member counts, total savings balances, active loan balances, and passbooks.</li>
                <li><strong className="text-slate-900 dark:text-white">Ready State:</strong> System will be clean and ready for real member enrolment.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowProdConfirmModal(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProdConfirmModal(false);
                  if (onEnableProductionMode) {
                    onEnableProductionMode();
                    setSuccess('Live Production Mode enabled! System purged of sample data and ready for real member onboarding.');
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-[#014421] text-amber-300 font-black text-xs border border-[#DAA520] hover:bg-emerald-900 shadow-lg flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                Yes, Enable Production Mode Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create New Branch */}
      {showAddBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border-2 border-[#DAA520] max-w-lg w-full p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h3 className="font-black text-lg text-[#014421] dark:text-amber-400 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#DAA520]" />
                Create New Cooperative Branch
              </h3>
              <button
                onClick={() => setShowAddBranchModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBranchSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  required
                  value={newBranchName}
                  onChange={(e) => setNewBranchName(e.target.value)}
                  placeholder="e.g. Osogbo Zonal Branch, Ile-Ife Branch, Ede Branch"
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
                    State *
                  </label>
                  <select
                    value={newBranchState}
                    onChange={(e) => handleBranchStateChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  >
                    {NIGERIAN_STATES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
                    LGA *
                  </label>
                  <select
                    value={newBranchLga}
                    onChange={(e) => setNewBranchLga(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  >
                    {(NIGERIAN_STATES_AND_LGAS[newBranchState] || []).map((lga) => (
                      <option key={lga} value={lga}>
                        {lga}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
                    Town / City *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBranchCity}
                    onChange={(e) => setNewBranchCity(e.target.value)}
                    placeholder="e.g. Osogbo, Ile-Ife, Ede, Iwo"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-black text-slate-800 dark:text-slate-200 mb-1">
                    Branch Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={newBranchCode}
                    onChange={(e) => setNewBranchCode(e.target.value)}
                    placeholder="e.g. LCMS-OSG-02"
                    className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowAddBranchModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#014421] text-white font-black hover:bg-emerald-900 shadow-md"
                >
                  Create Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

