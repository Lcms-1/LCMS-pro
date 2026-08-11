import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  UserMinus,
  ArrowRightLeft,
  Calendar,
  History,
  CheckCircle2,
  Info,
  Search,
  Sparkles,
  Lock,
  UserPlus,
  FileText,
  Clock,
  Briefcase,
  AlertCircle,
  BadgeCheck,
} from 'lucide-react';
import { User, UserRole, RoleAssignmentRecord, AuditLog } from '../../types';
import { ROLES_CONFIG } from '../../data/mockData';

interface RoleAssignmentViewProps {
  users: User[];
  currentUser: User;
  assignmentRecords: RoleAssignmentRecord[];
  onAssignRole: (
    targetUserId: string,
    newRole: UserRole,
    effectiveDate: string,
    reason: string,
    previousUserId?: string
  ) => void;
}

export const RoleAssignmentView: React.FC<RoleAssignmentViewProps> = ({
  users,
  currentUser,
  assignmentRecords = [],
  onAssignRole,
}) => {
  const [activeTab, setActiveTab] = useState<'offices' | 'history' | 'assign_form'>('offices');
  const [selectedOfficeModal, setSelectedOfficeModal] = useState<UserRole | null>(null);
  
  // Modal state for election / transfer
  const [newCandidateId, setNewCandidateId] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string>('2026-07-30');
  const [electionReason, setElectionReason] = useState<string>('2026 Cooperative Executive Elections & Handover');
  const [successMsg, setSuccessMsg] = useState<string>('');
  
  // Quick form state
  const [formMemberId, setFormMemberId] = useState<string>('');
  const [formTargetRole, setFormTargetRole] = useState<UserRole>('member');
  const [formEffectiveDate, setFormEffectiveDate] = useState<string>('2026-07-30');
  const [formReason, setFormReason] = useState<string>('Board Executive Appointment');

  // Audit search filter
  const [historySearch, setHistorySearch] = useState<string>('');

  const isSuperAdmin = currentUser?.role === 'sys_admin';

  // Offices to manage (excluding member as an office, but member is a role)
  const executiveOffices: { roleKey: UserRole; title: string; category: string }[] = [
    { roleKey: 'sys_admin', title: 'Founder & Super Administrator', category: 'Executive Board' },
    { roleKey: 'chairman', title: 'Cooperative President / Chairman', category: 'Executive Board' },
    { roleKey: 'vice_chairman', title: 'Cooperative Vice President', category: 'Executive Board' },
    { roleKey: 'secretary', title: 'General Secretary', category: 'Secretariat' },
    { roleKey: 'financial_secretary', title: 'Financial Secretary (CFO)', category: 'Finance & Accounts' },
    { roleKey: 'treasurer', title: 'Treasurer (Custodian of Funds)', category: 'Finance & Accounts' },
    { roleKey: 'loan_officer', title: 'Credit Risk & Loan Officer', category: 'Credit Committee' },
    { roleKey: 'auditor', title: 'Internal Audit & Compliance Lead', category: 'Audit Committee' },
    { roleKey: 'business_supervisor', title: 'Commercial Ventures Manager', category: 'Business Operations' },
  ];

  const getHolderForRole = (roleKey: UserRole) => {
    return users.find((u) => u.role === roleKey);
  };

  const handleOpenTransferModal = (roleKey: UserRole) => {
    const currentHolder = getHolderForRole(roleKey);
    setSelectedOfficeModal(roleKey);
    setNewCandidateId('');
    setEffectiveDate('2026-07-30');
    setElectionReason(`Handover of ${ROLES_CONFIG[roleKey].name} Office`);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfficeModal || !newCandidateId) {
      alert('Please select a member candidate for the office.');
      return;
    }

    const currentHolder = getHolderForRole(selectedOfficeModal);
    const newCandidate = users.find((u) => u.id === newCandidateId);

    if (!newCandidate) return;

    onAssignRole(
      newCandidateId,
      selectedOfficeModal,
      effectiveDate,
      electionReason,
      currentHolder?.id
    );

    setSuccessMsg(
      `Office Transfer Complete: ${newCandidate.fullName} is now ${ROLES_CONFIG[selectedOfficeModal].name}. Effective Date: ${effectiveDate}. Financial records preserved.`
    );
    setSelectedOfficeModal(null);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleRemoveOfficer = (roleKey: UserRole) => {
    const currentHolder = getHolderForRole(roleKey);
    if (!currentHolder) return;

    if (
      !confirm(
        `Are you sure you want to remove ${currentHolder.fullName} from the office of ${ROLES_CONFIG[roleKey].name}? They will be reverted to Ordinary Member status with savings and loans intact.`
      )
    ) {
      return;
    }

    onAssignRole(
      currentHolder.id,
      'member',
      new Date().toISOString().split('T')[0],
      `Officer Relieved of Duty / Office Vacated`,
      currentHolder.id
    );

    setSuccessMsg(
      `Officer ${currentHolder.fullName} removed from ${ROLES_CONFIG[roleKey].name} and reverted to Member. All savings & loans remain intact.`
    );
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const handleQuickFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMemberId) {
      alert('Please select a member.');
      return;
    }

    const member = users.find((u) => u.id === formMemberId);
    if (!member) return;

    const previousHolder = getHolderForRole(formTargetRole);

    onAssignRole(
      formMemberId,
      formTargetRole,
      formEffectiveDate,
      formReason,
      previousHolder?.id
    );

    setSuccessMsg(
      `Role Assigned: ${member.fullName} assigned to ${ROLES_CONFIG[formTargetRole].name} effective ${formEffectiveDate}.`
    );
    setFormMemberId('');
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  const filteredHistory = assignmentRecords.filter(
    (rec) =>
      rec.officeTitle.toLowerCase().includes(historySearch.toLowerCase()) ||
      rec.newOfficerName.toLowerCase().includes(historySearch.toLowerCase()) ||
      (rec.previousOfficerName && rec.previousOfficerName.toLowerCase().includes(historySearch.toLowerCase())) ||
      rec.assignedBy.toLowerCase().includes(historySearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950 to-emerald-900 text-white shadow-xl relative overflow-hidden border border-emerald-800/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Leadership Elections & Office Handover Portal
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Role Assignment Management & Executive Elections
            </h1>
            <p className="text-xs text-emerald-100 mt-1 max-w-2xl">
              Seamlessly conduct elections, transfer executive offices, assign member positions, update permissions dynamically, and maintain immutable audit histories—without altering savings, loans, or financial balances.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isSuperAdmin && (
              <div className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                Read-Only (Super Admin Access Required)
              </div>
            )}
          </div>
        </div>

        {/* Feature guarantee pills */}
        <div className="mt-4 pt-4 border-t border-emerald-800/60 grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-emerald-200">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span><strong>Financial Integrity Guarantee:</strong> Savings & loan history remain 100% untouched.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span><strong>Single Account Identity:</strong> No duplicate accounts created during elections.</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
            <span><strong>Effective Date Tracking:</strong> Every appointment is logged with timestamp.</span>
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5 dark:bg-emerald-950/80 dark:border-emerald-800 dark:text-emerald-200 shadow-sm">
          <BadgeCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-semibold">{successMsg}</span>
        </div>
      )}

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('offices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'offices'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            Executive Offices Roster ({executiveOffices.length})
          </button>

          <button
            onClick={() => setActiveTab('assign_form')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'assign_form'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Direct Member Role Assignment
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            <History className="w-4 h-4" />
            Election & Handover Audit Log ({assignmentRecords.length})
          </button>
        </div>
      </div>

      {/* TAB 1: EXECUTIVE OFFICES ROSTER */}
      {activeTab === 'offices' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {executiveOffices.map((office) => {
              const currentHolder = getHolderForRole(office.roleKey);
              const roleConfig = ROLES_CONFIG[office.roleKey];

              return (
                <div
                  key={office.roleKey}
                  className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between dark:bg-slate-900 dark:border-slate-800"
                >
                  <div>
                    {/* Office Title & Category Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {office.category}
                        </span>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base mt-1">
                          {roleConfig.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                          {roleConfig.description}
                        </p>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border shrink-0 ${
                          currentHolder
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                        }`}
                      >
                        {currentHolder ? 'Occupied' : 'Vacant'}
                      </span>
                    </div>

                    {/* Appointed Member Info */}
                    {currentHolder ? (
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/60 dark:bg-slate-800/60 dark:border-slate-700/60 space-y-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={currentHolder.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
                            alt={currentHolder.fullName}
                            className="w-10 h-10 rounded-full object-cover border-2 border-emerald-600 shrink-0"
                          />
                          <div className="overflow-hidden">
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-xs truncate">
                              {currentHolder.fullName}
                            </h4>
                            <div className="text-[11px] font-mono font-bold text-emerald-700 dark:text-emerald-400">
                              {currentHolder.memberNo}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">{currentHolder.email}</div>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-200/50 dark:border-slate-700/50 grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <span className="text-slate-400 font-medium">Branch:</span>
                            <div className="font-bold text-slate-700 dark:text-slate-300 truncate">
                              {currentHolder.branch}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400 font-medium">Savings:</span>
                            <div className="font-bold text-emerald-600 dark:text-emerald-400">
                              ₦{(currentHolder.savingsBalance || 0).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-amber-50/50 border border-dashed border-amber-300 text-center dark:bg-amber-950/20 dark:border-amber-800">
                        <AlertCircle className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                        <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                          Office Currently Vacant
                        </div>
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                          No member currently assigned to this executive position.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions for Super Admin */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-bold">
                      {roleConfig.permissionsCount} Permissions
                    </span>

                    {isSuperAdmin && (
                      <div className="flex items-center gap-2">
                        {currentHolder && office.roleKey !== 'sys_admin' && (
                          <button
                            onClick={() => handleRemoveOfficer(office.roleKey)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-950 dark:text-rose-300 dark:hover:bg-rose-900 transition-all flex items-center gap-1 cursor-pointer"
                            title="Vacate office & revert member to ordinary status"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                            Vacate
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenTransferModal(office.roleKey)}
                          className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-800 text-white hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <ArrowRightLeft className="w-3.5 h-3.5" />
                          {currentHolder ? 'Transfer / Elect' : 'Assign Officer'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DIRECT MEMBER ROLE ASSIGNMENT FORM */}
      {activeTab === 'assign_form' && (
        <div className="max-w-3xl bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs dark:bg-slate-900 dark:border-slate-800 space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              Direct Member Role Assignment & Promotion
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Assign or change any member's office role directly. The system automatically updates their permissions matrix and logs the effective date.
            </p>
          </div>

          <form onSubmit={handleQuickFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Select Member */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  1. Select Member:
                </label>
                <select
                  required
                  value={formMemberId}
                  onChange={(e) => setFormMemberId(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  <option value="">-- Choose Member from Directory --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} ({u.memberNo}) - Currently: {ROLES_CONFIG[u.role]?.name || u.role}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Target Office / Role */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  2. Select Target Office / Role:
                </label>
                <select
                  required
                  value={formTargetRole}
                  onChange={(e) => setFormTargetRole(e.target.value as UserRole)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  {(Object.keys(ROLES_CONFIG) as UserRole[]).map((rKey) => (
                    <option key={rKey} value={rKey}>
                      {ROLES_CONFIG[rKey].name} ({ROLES_CONFIG[rKey].title})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Effective Date */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  3. Effective Date of Appointment:
                </label>
                <input
                  type="date"
                  required
                  value={formEffectiveDate}
                  onChange={(e) => setFormEffectiveDate(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>

              {/* Reason / Reference */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  4. Appointment Reason / Resolution Ref:
                </label>
                <input
                  type="text"
                  required
                  value={formReason}
                  onChange={(e) => setFormReason(e.target.value)}
                  placeholder="e.g. AGM Board Resolution #2026-04"
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 dark:bg-slate-800/60 dark:border-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Info className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Submitting this form immediately re-binds the member's security role, applies all corresponding RBAC tab permissions, and records an entry in the system audit trail.
              </span>
            </div>

            <button
              type="submit"
              disabled={!isSuperAdmin}
              className={`w-full py-3 rounded-xl text-xs font-extrabold text-white transition-all shadow-md flex items-center justify-center gap-2 ${
                isSuperAdmin
                  ? 'bg-emerald-800 hover:bg-emerald-700 cursor-pointer'
                  : 'bg-slate-400 cursor-not-allowed'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              Confirm & Execute Role Assignment
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: ELECTION & HANDOVER AUDIT LOG */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4 dark:bg-slate-900 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-600" />
                Immutable Election & Role Handover Register
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Full chronological record of all office appointments, elections, and role handovers.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Search history..."
                className="w-full pl-9 pr-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 dark:bg-slate-800/60 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold uppercase text-[10px]">
                  <th className="p-3">Office Title</th>
                  <th className="p-3">Outgoing Officer</th>
                  <th className="p-3">Newly Appointed Officer</th>
                  <th className="p-3">Effective Date</th>
                  <th className="p-3">Authorized By</th>
                  <th className="p-3">Reason / Election Notes</th>
                  <th className="p-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-400 text-xs">
                      No election or role handover records found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-3 font-extrabold text-slate-900 dark:text-white">
                        <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 font-bold dark:bg-emerald-950 dark:text-emerald-300">
                          {rec.officeTitle}
                        </span>
                      </td>
                      <td className="p-3">
                        {rec.previousOfficerName ? (
                          <span className="text-slate-600 dark:text-slate-300 font-medium">
                            {rec.previousOfficerName}
                          </span>
                        ) : (
                          <span className="text-amber-600 italic">Vacant Office</span>
                        )}
                      </td>
                      <td className="p-3 font-extrabold text-emerald-700 dark:text-emerald-400">
                        {rec.newOfficerName}
                      </td>
                      <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {rec.effectiveDate}
                      </td>
                      <td className="p-3 text-slate-500 font-medium">{rec.assignedBy}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={rec.reason}>
                        {rec.reason}
                      </td>
                      <td className="p-3 font-mono text-[10px] text-slate-400">{rec.timestamp}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ELECTION / OFFICE TRANSFER MODAL */}
      {selectedOfficeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 dark:bg-slate-900 dark:border-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider">
                  Executive Election & Handover
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Transfer Office: {ROLES_CONFIG[selectedOfficeModal].name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOfficeModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex items-center justify-center cursor-pointer dark:bg-slate-800 dark:text-slate-300"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs dark:bg-amber-950/50 dark:border-amber-800 dark:text-amber-200">
              <strong>Current Office Holder:</strong>{' '}
              {getHolderForRole(selectedOfficeModal)?.fullName || 'None (Vacant Office)'}
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1">
                Assigning a new member automatically revokes office permissions from the previous holder (converting them to Member) and grants office permissions to the new holder. Financial balances remain untouched.
              </p>
            </div>

            <form onSubmit={handleExecuteTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Select Member Candidate for Office:
                </label>
                <select
                  required
                  value={newCandidateId}
                  onChange={(e) => setNewCandidateId(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                >
                  <option value="">-- Choose Member Candidate --</option>
                  {users
                    .filter((u) => u.role !== selectedOfficeModal)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.memberNo}) - Currently: {ROLES_CONFIG[u.role]?.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Effective Date of Office Transfer:
                </label>
                <input
                  type="date"
                  required
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-1">
                  Election / Handover Reason:
                </label>
                <input
                  type="text"
                  required
                  value={electionReason}
                  onChange={(e) => setElectionReason(e.target.value)}
                  placeholder="e.g. 2026 Executive Elections"
                  className="w-full text-xs font-bold p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedOfficeModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-extrabold bg-emerald-800 hover:bg-emerald-700 text-white shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <BadgeCheck className="w-4 h-4" />
                  Confirm & Execute Office Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
