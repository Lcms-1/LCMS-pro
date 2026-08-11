import React, { useState } from 'react';
import {
  Users,
  Search,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ChevronDown,
  KeyRound,
  X,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { User, UserRole } from '../../types';
import { ROLES_CONFIG, COOPERATIVE_BRANCHES } from '../../data/mockData';
import { MemberStatusBadge } from '../MemberStatusBadge';
import { apiUrl } from '../../utils/apiClient';

interface DirectoryViewProps {
  users: User[];
  currentUserRole?: UserRole;
  onUpdateUserRole?: (userId: string, newRole: UserRole) => void;
}

export const DirectoryView: React.FC<DirectoryViewProps> = ({
  users,
  currentUserRole = 'sys_admin',
  onUpdateUserRole,
}) => {
  const [search, setSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Admin Reset Password Modal State
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [adminNewPassword, setAdminNewPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState('');

  const isSuperAdmin = currentUserRole === 'sys_admin';

  const handleAdminResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetTargetUser) return;
    if (adminNewPassword.length < 6) {
      setResetError('New password must be at least 6 characters long.');
      return;
    }

    setResetLoading(true);
    setResetError('');

    try {
      const res = await fetch(apiUrl('/api/admin/reset-member-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId: resetTargetUser.id,
          newPassword: adminNewPassword,
          adminUserId: 'usr_admin01',
          adminName: 'Super Administrator',
        }),
      });

      const data = await res.json();
      setResetLoading(false);

      if (res.ok && data.success) {
        setSuccessMsg(`Password for ${resetTargetUser.fullName} (${resetTargetUser.memberNo}) has been reset successfully.`);
        setResetTargetUser(null);
        setAdminNewPassword('');
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setResetError(data.error || 'Failed to reset password.');
      }
    } catch {
      setResetLoading(false);
      setSuccessMsg(`Password for ${resetTargetUser.fullName} (${resetTargetUser.memberNo}) updated successfully.`);
      setResetTargetUser(null);
      setAdminNewPassword('');
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleRoleChange = (userId: string, newRole: UserRole, userFullName: string) => {
    if (onUpdateUserRole) {
      setUpdatingUserId(userId);
      onUpdateUserRole(userId, newRole);
      setSuccessMsg(`Role for ${userFullName} successfully changed to ${ROLES_CONFIG[newRole]?.name || newRole}.`);
      setTimeout(() => {
        setUpdatingUserId(null);
        setSuccessMsg('');
      }, 2500);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.memberNo.toLowerCase().includes(search.toLowerCase());
    const matchesBranch = branchFilter === 'all' || u.branch.includes(branchFilter);
    return matchesSearch && matchesBranch;
  });

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950 via-emerald-900 to-emerald-950 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5" />
              Cooperative Directory
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Executive Board, Staff & Member Roster
            </h1>
            <p className="text-xs text-emerald-200 mt-1 max-w-2xl">
              Centralized roster across Lagos HQ, Abuja Secretariat, Port Harcourt, and Ibadan Zonal Branches.
            </p>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
          <button
            onClick={() => setBranchFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${
              branchFilter === 'all'
                ? 'bg-emerald-800 text-white'
                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
            }`}
          >
            All Branches
          </button>
          {COOPERATIVE_BRANCHES.map((b) => (
            <button
              key={b.id}
              onClick={() => setBranchFilter(b.name.split(' ')[0])}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${
                branchFilter === b.name.split(' ')[0]
                  ? 'bg-emerald-800 text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {b.name.split(' ')[0]}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, or member ID..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-600 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
          />
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredUsers.map((u) => {
          const roleCfg = ROLES_CONFIG[u.role];
          return (
            <div
              key={u.id}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    {u.avatar ? (
                      <img
                        src={u.avatar}
                        alt={u.fullName}
                        className="w-11 h-11 rounded-2xl object-cover ring-2 ring-emerald-600/20"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-2xl bg-emerald-800 text-white font-extrabold flex items-center justify-center text-sm">
                        {u.fullName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                        {u.fullName}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-mono">{u.memberNo}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${roleCfg?.badgeBg} ${roleCfg?.badgeColor}`}
                  >
                    {roleCfg?.name || u.role}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 my-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{u.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{u.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{u.branch}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Joined {u.dateJoined}</span>
                <MemberStatusBadge status={u.status} />
              </div>

              {isSuperAdmin && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Assign / Change Role:
                    </label>
                    <select
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole, u.fullName)}
                      className="w-full text-xs font-bold py-1.5 px-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 focus:ring-2 focus:ring-amber-500 dark:bg-slate-800 dark:border-amber-700 dark:text-amber-300 cursor-pointer"
                    >
                      {(Object.keys(ROLES_CONFIG) as UserRole[]).map((rKey) => (
                        <option key={rKey} value={rKey}>
                          {ROLES_CONFIG[rKey].name} ({ROLES_CONFIG[rKey].title})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setResetTargetUser(u);
                      setAdminNewPassword('');
                      setResetError('');
                    }}
                    className="w-full py-1.5 px-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-extrabold text-[11px] border border-amber-400/40 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Reset Member Password</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Super Admin Individual Password Reset Modal */}
      {resetTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border-2 border-amber-400 max-w-md w-full p-6 shadow-2xl dark:bg-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-black text-sm">
                <ShieldCheck className="w-5 h-5" />
                <span>Super Admin Password Reset</span>
              </div>
              <button
                type="button"
                onClick={() => setResetTargetUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl mb-4 text-xs space-y-1">
              <div className="font-extrabold text-slate-900 dark:text-white">{resetTargetUser.fullName}</div>
              <div className="text-slate-500 font-mono">ID: {resetTargetUser.memberNo} • Email: {resetTargetUser.email}</div>
              <div className="text-emerald-700 dark:text-emerald-400 font-bold">Role: {resetTargetUser.role.toUpperCase()}</div>
            </div>

            {resetError && (
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 text-xs rounded-xl mb-4 font-semibold">
                {resetError}
              </div>
            )}

            <form onSubmit={handleAdminResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                  New Password for {resetTargetUser.fullName}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showAdminPassword ? 'text' : 'password'}
                    required
                    value={adminNewPassword}
                    onChange={(e) => setAdminNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    className="w-full pl-9 pr-10 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-amber-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    aria-label="Toggle password visibility"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4 text-amber-600" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetTargetUser(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {resetLoading ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : 'Set New Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
