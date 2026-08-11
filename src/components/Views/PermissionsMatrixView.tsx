import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Check,
  X,
  Sparkles,
  Info,
  RefreshCw,
  Users,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { UserRole, Permission, RolePermissions, RoleConfig } from '../../types';
import { ROLES_CONFIG } from '../../data/mockData';

interface PermissionsMatrixViewProps {
  allPermissions: Permission[];
  rolePermissions: RolePermissions[];
  onTogglePermission: (roleId: UserRole, permissionKey: string, enabled: boolean) => void;
  currentUserRole?: UserRole;
}

export const PermissionsMatrixView: React.FC<PermissionsMatrixViewProps> = ({
  allPermissions,
  rolePermissions,
  onTogglePermission,
  currentUserRole = 'sys_admin',
}) => {
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<UserRole | 'all'>('all');
  const [successMsg, setSuccessMsg] = useState('');

  const isAdmin = currentUserRole === 'sys_admin';

  const roleKeys = (Object.keys(ROLES_CONFIG) as UserRole[]).filter(
    (r) => selectedRoleFilter === 'all' || r === selectedRoleFilter
  );

  const isPermissionAllowed = (roleId: UserRole, permKey: string) => {
    const rObj = rolePermissions.find((rp) => rp.roleId === roleId);
    return rObj ? rObj.allowedPermissionKeys.includes(permKey) : false;
  };

  const handleToggle = (roleId: UserRole, permKey: string, currentVal: boolean) => {
    if (!isAdmin) {
      alert('Only System Administrators can edit role permissions.');
      return;
    }
    onTogglePermission(roleId, permKey, !currentVal);
    setSuccessMsg(`Permission '${permKey}' updated for role [${ROLES_CONFIG[roleId].name}].`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Role-Based Access Control (RBAC)
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              9 User Roles & Permissions Matrix
            </h1>
            <p className="text-xs text-emerald-200 mt-1 max-w-2xl">
              Strict access control for System Admin, Chairman, Vice Chairman, Secretary, Financial Secretary, Treasurer, Auditor, Business Supervisor, and Members.
            </p>
          </div>

          {!isAdmin && (
            <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs flex items-center gap-1.5">
              <Info className="w-4 h-4" />
              <span>Read-Only View (Admin required to edit)</span>
            </div>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 dark:bg-emerald-950/60 dark:border-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Role Filter Buttons */}
      <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto dark:bg-slate-900 dark:border-slate-800">
        <button
          onClick={() => setSelectedRoleFilter('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            selectedRoleFilter === 'all'
              ? 'bg-emerald-800 text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
          }`}
        >
          All 9 Roles Matrix
        </button>
        {(Object.keys(ROLES_CONFIG) as UserRole[]).map((rKey) => {
          const r = ROLES_CONFIG[rKey];
          return (
            <button
              key={rKey}
              onClick={() => setSelectedRoleFilter(rKey)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedRoleFilter === rKey
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {r.name}
            </button>
          );
        })}
      </div>

      {/* Permissions Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs overflow-hidden dark:bg-slate-900 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold uppercase text-[10px]">
                <th className="p-3 min-w-[220px]">System Permission</th>
                <th className="p-3 min-w-[140px]">Category</th>
                {roleKeys.map((rKey) => (
                  <th key={rKey} className="p-3 text-center min-w-[100px]">
                    <div className="font-extrabold truncate max-w-[100px]" title={ROLES_CONFIG[rKey].name}>
                      {ROLES_CONFIG[rKey].name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {allPermissions.map((perm) => (
                <tr key={perm.key} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="p-3">
                    <div className="font-bold text-slate-900 dark:text-white">{perm.label}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{perm.key}</div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {perm.category}
                    </span>
                  </td>
                  {roleKeys.map((rKey) => {
                    const allowed = isPermissionAllowed(rKey, perm.key);
                    return (
                      <td key={rKey} className="p-3 text-center">
                        <button
                          disabled={!isAdmin}
                          onClick={() => handleToggle(rKey, perm.key, allowed)}
                          className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                            allowed
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:scale-110'
                              : 'bg-slate-100 text-slate-300 dark:bg-slate-800 dark:text-slate-600 hover:bg-slate-200'
                          } ${isAdmin ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                          title={`${allowed ? 'Granted' : 'Revoked'} - Click to toggle`}
                        >
                          {allowed ? <Check className="w-4 h-4 font-black" /> : <X className="w-3.5 h-3.5" />}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
