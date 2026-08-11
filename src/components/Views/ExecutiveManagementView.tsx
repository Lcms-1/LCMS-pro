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
  Clock,
  Briefcase,
  AlertCircle,
  BadgeCheck,
  AlertTriangle,
  FileText,
  ShieldAlert,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { User, UserRole, ExecutiveAppointment, AuditLog, AppMode } from '../../types';
import { ROLES_CONFIG } from '../../data/mockData';

interface ExecutiveManagementViewProps {
  users: User[];
  currentUser: User;
  executiveAppointments?: ExecutiveAppointment[];
  appointments?: ExecutiveAppointment[];
  onAppointOfficer: (
    roleId: UserRole,
    newOfficerUserId: string,
    startDate: string,
    endDate?: string,
    notes?: string
  ) => Promise<{ success: boolean; message: string }>;
  onRemoveOfficer: (
    appointmentId: string,
    endDate: string,
    reason: string
  ) => Promise<{ success: boolean; message: string }>;
  onRefreshData?: () => void;
  appMode?: AppMode;
  isSuperAdminUser?: boolean;
}

export const ExecutiveManagementView: React.FC<ExecutiveManagementViewProps> = ({
  users,
  currentUser,
  executiveAppointments: execAppProp,
  appointments: appProp,
  onAppointOfficer,
  onRemoveOfficer,
  onRefreshData,
  appMode = 'development',
  isSuperAdminUser = true,
}) => {
  const executiveAppointments = execAppProp || appProp || [];
  const [activeTab, setActiveTab] = useState<'offices' | 'history' | 'appoint_form'>('offices');
  const [searchTerm, setSearchTerm] = useState('');
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilterStatus, setHistoryFilterStatus] = useState<'all' | 'active' | 'completed' | 'removed' | 'transferred'>('all');

  // Appointment Modal State
  const [selectedRoleForAppointment, setSelectedRoleForAppointment] = useState<UserRole | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [expectedEndDate, setExpectedEndDate] = useState<string>('');
  const [appointmentNotes, setAppointmentNotes] = useState<string>('');
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Removal / Removal Modal State
  const [selectedAppointmentForRemoval, setSelectedAppointmentForRemoval] = useState<ExecutiveAppointment | null>(null);
  const [removalEndDate, setRemovalEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [removalReason, setRemovalReason] = useState<string>('');
  const [showRemovalConfirmModal, setShowRemovalConfirmModal] = useState<boolean>(false);

  // Strict Access Guard: Only Super Administrator (Mr. Ige Ebenezer / sys_admin) can access
  const isSuperAdminAccess = currentUser?.role === 'sys_admin' && (isSuperAdminUser || currentUser?.fullName?.toLowerCase().includes('ige'));

  if (!isSuperAdminAccess) {
    return (
      <div className="max-w-4xl mx-auto p-6 my-10 bg-white dark:bg-slate-900 rounded-3xl border-2 border-rose-300 dark:border-rose-900 shadow-xl text-center space-y-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-rose-900 dark:text-rose-300">
            Access Restricted: Executive Management Module
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto">
            Only <strong className="text-slate-900 dark:text-white">Mr. Ige Ebenezer (Super Administrator)</strong> is authorized to access executive appointments, role transfers, and tenure governance.
          </p>
        </div>

        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl text-xs text-amber-900 dark:text-amber-200 text-left space-y-2 max-w-lg mx-auto">
          <div className="font-bold flex items-center gap-1.5">
            <Lock className="w-4 h-4 text-amber-600" />
            Security & Governance Protocol
          </div>
          <p>
            Your current active session or tested role (<span className="font-bold uppercase">{currentUser?.role}</span>) does not possess Super Administrator privileges to manage executive appointments.
          </p>
        </div>
      </div>
    );
  }

  // Define Executive Offices
  const executiveOffices: { roleKey: UserRole; title: string; category: string; description: string }[] = [
    { roleKey: 'chairman', title: 'Cooperative President / Chairman', category: 'Executive Board', description: 'Overall cooperative leadership, strategic direction, and board sign-offs.' },
    { roleKey: 'vice_chairman', title: 'Cooperative Vice President', category: 'Executive Board', description: 'Deputy executive leadership, committee oversight, and welfare governance.' },
    { roleKey: 'secretary', title: 'General Secretary', category: 'Secretariat', description: 'Official correspondence, member roster custodian, and meeting minutes.' },
    { roleKey: 'financial_secretary', title: 'Financial Secretary (CFO)', category: 'Finance & Accounts', description: 'Financial ledger recording, savings posting, and income ledger controller.' },
    { roleKey: 'treasurer', title: 'Treasurer (Custodian of Funds)', category: 'Finance & Accounts', description: 'Cooperative bank account custodian, vault management, and payment vouchers.' },
    { roleKey: 'loan_officer', title: 'Credit Risk & Loan Officer', category: 'Credit Committee', description: 'Loan application assessment, guarantor verification, and credit analysis.' },
    { roleKey: 'auditor', title: 'Internal Audit & Compliance Lead', category: 'Audit Committee', description: 'Independent transaction audit, compliance verification, and ledger checks.' },
    { roleKey: 'business_supervisor', title: 'Commercial Ventures Manager', category: 'Business Operations', description: 'Management of commercial investments, transport fleet, and ventures.' },
  ];

  const getActiveAppointmentForRole = (roleKey: UserRole) => {
    return executiveAppointments.find((a) => a.roleId === roleKey && a.status === 'active');
  };

  const getHolderUserForRole = (roleKey: UserRole) => {
    const activeApp = getActiveAppointmentForRole(roleKey);
    if (activeApp) {
      return users.find((u) => u.id === activeApp.officerUserId);
    }
    return users.find((u) => u.role === roleKey);
  };

  // Open Appoint / Transfer Modal
  const handleOpenAppointModal = (roleKey: UserRole) => {
    setSelectedRoleForAppointment(roleKey);
    setSelectedMemberId('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setExpectedEndDate('');
    setAppointmentNotes('');
    setShowConfirmModal(false);
    setActionFeedback(null);
  };

  // Open Removal Modal
  const handleOpenRemovalModal = (app: ExecutiveAppointment) => {
    setSelectedAppointmentForRemoval(app);
    setRemovalEndDate(new Date().toISOString().split('T')[0]);
    setRemovalReason('Tenure Completed / Board Reorganization');
    setShowRemovalConfirmModal(false);
    setActionFeedback(null);
  };

  // Execute Appointment
  const handleExecuteAppointment = async () => {
    if (!selectedRoleForAppointment || !selectedMemberId || !startDate) {
      setActionFeedback({ type: 'error', message: 'Please select a registered member and start date.' });
      return;
    }

    setIsSubmitting(true);
    setActionFeedback(null);

    try {
      const res = await onAppointOfficer(
        selectedRoleForAppointment,
        selectedMemberId,
        startDate,
        expectedEndDate || undefined,
        appointmentNotes || undefined
      );

      if (res.success) {
        setActionFeedback({ type: 'success', message: res.message });
        setShowConfirmModal(false);
        setSelectedRoleForAppointment(null);
      } else {
        setActionFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Error appointing officer.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Execute Removal
  const handleExecuteRemoval = async () => {
    if (!selectedAppointmentForRemoval) return;

    setIsSubmitting(true);
    setActionFeedback(null);

    try {
      const res = await onRemoveOfficer(
        selectedAppointmentForRemoval.id,
        removalEndDate,
        removalReason
      );

      if (res.success) {
        setActionFeedback({ type: 'success', message: res.message });
        setShowRemovalConfirmModal(false);
        setSelectedAppointmentForRemoval(null);
      } else {
        setActionFeedback({ type: 'error', message: res.message });
      }
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Error removing officer.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered History
  const filteredHistory = executiveAppointments.filter((app) => {
    const matchesSearch =
      app.officerName.toLowerCase().includes(historySearch.toLowerCase()) ||
      app.officerMemberNo.toLowerCase().includes(historySearch.toLowerCase()) ||
      app.officeTitle.toLowerCase().includes(historySearch.toLowerCase()) ||
      app.appointedBy.toLowerCase().includes(historySearch.toLowerCase());

    const matchesStatus = historyFilterStatus === 'all' || app.status === historyFilterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#014421] via-[#012d15] to-[#014421] rounded-3xl p-6 sm:p-8 text-white shadow-xl border-2 border-[#DAA520] relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 opacity-10 pointer-events-none">
          <ShieldCheck className="w-96 h-96 text-[#DAA520]" />
        </div>

        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DAA520]/20 border border-[#DAA520]/40 text-[#DAA520] text-xs font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-[#DAA520]" />
              Exclusive Super Administrator Control Module
            </div>
            <div className="text-xs font-mono text-amber-300 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-800">
              Governance Mode: <strong className="text-white">Active</strong>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-[#DAA520]" />
            Executive Management & Officers Control
          </h1>

          <p className="text-xs sm:text-sm text-emerald-100 max-w-3xl leading-relaxed">
            Appoint cooperative officers, execute seamless role transfers upon tenure completion, and manage officer removals.
            <strong className="text-amber-300"> Member savings balances, active loans, personal wallets, and transaction histories are strictly preserved and untouched during role changes.</strong>
          </p>
        </div>
      </div>

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-950 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-950 border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{actionFeedback.message}</span>
          </div>
          <button
            onClick={() => setActionFeedback(null)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-black"
          >
            ✕
          </button>
        </div>
      )}

      {/* Security Guarantee Card */}
      <div className="bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-950 dark:text-amber-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-400 text-slate-950 shrink-0 font-black">
            <Lock className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-0.5">
            <div className="font-black text-amber-900 dark:text-amber-300 uppercase tracking-wide">
              Financial & Account Security Rule
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              Changing or removing an officer automatically updates their system permissions and module access, but <strong className="text-amber-900 dark:text-amber-300">never alters or resets</strong> their savings balance, outstanding loans, or personal wallet.
            </p>
          </div>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex border-b-2 border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('offices')}
          className={`px-5 py-3 text-xs font-black transition-all flex items-center gap-2 border-b-2 -mb-[2px] cursor-pointer ${
            activeTab === 'offices'
              ? 'border-[#014421] text-[#014421] dark:border-amber-400 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Active Executive Officers ({executiveOffices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-5 py-3 text-xs font-black transition-all flex items-center gap-2 border-b-2 -mb-[2px] cursor-pointer ${
            activeTab === 'history'
              ? 'border-[#014421] text-[#014421] dark:border-amber-400 dark:text-amber-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Tenure & Past Officers History ({executiveAppointments.length})</span>
        </button>
      </div>

      {/* TAB 1: ACTIVE EXECUTIVE OFFICES GRID */}
      {activeTab === 'offices' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search executive offices or officer names..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[#014421] outline-none"
              />
            </div>

            <div className="text-xs text-slate-500 font-bold">
              Total Executive Officers: <strong className="text-[#014421] dark:text-amber-400">{executiveOffices.length}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
            {executiveOffices
              .filter(
                (o) =>
                  o.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  o.roleKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  (getHolderUserForRole(o.roleKey)?.fullName || '').toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((office) => {
                const holder = getHolderUserForRole(office.roleKey);
                const activeApp = getActiveAppointmentForRole(office.roleKey);
                const roleCfg = ROLES_CONFIG[office.roleKey];

                return (
                  <div
                    key={office.roleKey}
                    className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-600 dark:text-amber-400">
                            {office.category}
                          </span>
                          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                            {office.title}
                          </h3>
                        </div>
                        <span
                          className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase border ${roleCfg.badgeBg} ${roleCfg.badgeColor}`}
                        >
                          {roleCfg.name}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {office.description}
                      </p>

                      {/* Current Officer Details */}
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-bold">Current Appointed Officer</span>
                          <span className="font-mono text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-bold">
                            Active Status
                          </span>
                        </div>

                        {holder ? (
                          <div className="flex items-center gap-3 pt-1">
                            {holder.avatar ? (
                              <img
                                src={holder.avatar}
                                alt={holder.fullName}
                                className="w-10 h-10 rounded-full object-cover border-2 border-[#DAA520]"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[#014421] text-amber-300 font-black flex items-center justify-center text-xs">
                                {holder.fullName.slice(0, 2).toUpperCase()}
                              </div>
                            )}

                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-black text-slate-900 dark:text-white truncate">
                                {holder.fullName}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                                <span className="font-mono font-bold text-[#014421] dark:text-amber-400">{holder.memberNo}</span>
                                <span>•</span>
                                <span>{holder.branch || 'Iwo Main Branch'}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2 text-xs text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/50 rounded-lg border border-rose-200 dark:border-rose-900">
                            No officer currently appointed (Vacant Office)
                          </div>
                        )}

                        {activeApp && (
                          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-slate-300">
                            <div>
                              <span className="text-slate-400">Appointed Date:</span>{' '}
                              <strong className="text-slate-900 dark:text-white">{activeApp.startDate}</strong>
                            </div>
                            <div>
                              <span className="text-slate-400">Tenure Expiry:</span>{' '}
                              <strong className="text-slate-900 dark:text-white">{activeApp.endDate || 'Open-ended'}</strong>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                      <button
                        onClick={() => handleOpenAppointModal(office.roleKey)}
                        className="flex-1 py-2 px-3 bg-[#014421] hover:bg-[#012d15] text-amber-300 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span>{holder ? 'Change / Transfer Role' : 'Appoint Officer'}</span>
                      </button>

                      {activeApp && (
                        <button
                          onClick={() => handleOpenRemovalModal(activeApp)}
                          className="py-2 px-3 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-xl border border-rose-200 dark:border-rose-800 transition-all flex items-center gap-1 cursor-pointer"
                          title="Remove officer and revert to member role"
                        >
                          <UserMinus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Remove</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 2: TENURE & PAST OFFICERS HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-[#DAA520]" />
                Executive Tenure & Historical Officers Register
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Complete record of all current, transferred, and past appointed executive officers in LCMS PRO.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter officer history..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
                />
              </div>

              <select
                value={historyFilterStatus}
                onChange={(e) => setHistoryFilterStatus(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="completed">Tenure Completed</option>
                <option value="transferred">Transferred</option>
                <option value="removed">Removed</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3">Office Title</th>
                  <th className="p-3">Officer Name & ID</th>
                  <th className="p-3">Start Date</th>
                  <th className="p-3">End Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Appointed By</th>
                  <th className="p-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredHistory.length > 0 ? (
                  filteredHistory.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-all">
                      <td className="p-3">
                        <div className="font-bold text-slate-900 dark:text-white">{app.officeTitle}</div>
                        <div className="text-[10px] text-slate-500 font-mono">({app.roleId})</div>
                      </td>
                      <td className="p-3">
                        <div className="font-black text-slate-900 dark:text-amber-400">{app.officerName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{app.officerMemberNo}</div>
                      </td>
                      <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{app.startDate}</td>
                      <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{app.endDate || 'Ongoing'}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            app.status === 'active'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : app.status === 'transferred'
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : app.status === 'completed'
                              ? 'bg-purple-100 text-purple-900 border border-purple-300'
                              : 'bg-rose-100 text-rose-900 border border-rose-300'
                          }`}
                        >
                          {app.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-400 text-[11px]">{app.appointedBy}</td>
                      <td className="p-3 text-slate-500 dark:text-slate-400 text-[11px] max-w-xs truncate">
                        {app.notes || '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">
                      No historical appointment records found matching filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: APPOINT / TRANSFER OFFICER FORM & CONFIRMATION STEP */}
      {selectedRoleForAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-[#DAA520] max-w-xl w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-[#014421] text-amber-300 font-black">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Appoint Executive Officer
                  </h3>
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-bold">
                    Office: {ROLES_CONFIG[selectedRoleForAppointment]?.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRoleForAppointment(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-black text-lg p-1"
              >
                ✕
              </button>
            </div>

            {!showConfirmModal ? (
              /* STEP 1: SELECT MEMBER & DATES */
              <div className="space-y-4">
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-emerald-600" />
                    Automatic Role & Permission Transition
                  </div>
                  <p className="text-[11px]">
                    Selecting a registered member will update their role permission to <strong className="uppercase">{ROLES_CONFIG[selectedRoleForAppointment]?.name}</strong>. Their personal savings, outstanding loan balance, and wallet history will remain completely intact.
                  </p>
                </div>

                {/* Candidate Member Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 block">
                    Select Registered Member to Appoint *
                  </label>
                  <select
                    value={selectedMemberId}
                    onChange={(e) => setSelectedMemberId(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-[#014421]"
                  >
                    <option value="">-- Choose Member Candidate --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.memberNo}) — Current Role: {ROLES_CONFIG[u.role]?.name || u.role} | Branch: {u.branch || 'Iwo Main'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-200 block">
                      Start Date (Effective Date) *
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-700 dark:text-slate-200 block">
                      Expected Tenure End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={expectedEndDate}
                      onChange={(e) => setExpectedEndDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                    />
                  </div>
                </div>

                {/* Appointment Notes */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 block">
                    Appointment Notes / Board Resolution Reference
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Appointed following 2026 Board Executive Elections..."
                    value={appointmentNotes}
                    onChange={(e) => setAppointmentNotes(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedRoleForAppointment(null)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!selectedMemberId || !startDate}
                    onClick={() => setShowConfirmModal(true)}
                    className="px-5 py-2.5 bg-[#014421] text-amber-300 hover:bg-[#012d15] text-xs font-black rounded-xl transition-all shadow-md disabled:opacity-50 cursor-pointer"
                  >
                    Proceed to Confirmation →
                  </button>
                </div>
              </div>
            ) : (
              /* STEP 2: MANDATORY CONFIRMATION DIALOG */
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-400 rounded-2xl text-xs space-y-2 text-amber-950 dark:text-amber-200">
                  <div className="font-black text-sm text-amber-900 dark:text-amber-300 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    Confirm Executive Officer Appointment
                  </div>
                  <p className="leading-relaxed">
                    You are about to appoint <strong className="text-slate-900 dark:text-white">{users.find((u) => u.id === selectedMemberId)?.fullName}</strong> as the official <strong className="text-slate-900 dark:text-white uppercase">{ROLES_CONFIG[selectedRoleForAppointment]?.name}</strong>.
                  </p>

                  <div className="pt-2 border-t border-amber-300/80 space-y-1 font-mono text-[11px]">
                    <div>Office Role: {ROLES_CONFIG[selectedRoleForAppointment]?.name}</div>
                    <div>Effective Start Date: {startDate}</div>
                    <div>Tenure End Date: {expectedEndDate || 'Open-ended'}</div>
                    <div>Member ID: {users.find((u) => u.id === selectedMemberId)?.memberNo}</div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300">
                  <strong>Audit Logging:</strong> This appointment action will be recorded in the LCMS PRO central audit log under Executive Governance.
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowConfirmModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                  >
                    ← Back to Edit
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleExecuteAppointment}
                    className="px-6 py-2.5 bg-[#014421] text-amber-300 hover:bg-[#012d15] text-xs font-black rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <span>Processing Appointment...</span>
                    ) : (
                      <>
                        <BadgeCheck className="w-4 h-4 text-[#DAA520]" />
                        <span>Confirm & Appoint Officer</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: REMOVE OFFICER CONFIRMATION */}
      {selectedAppointmentForRemoval && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-rose-400 max-w-lg w-full p-6 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 font-black">
                  <UserMinus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Remove Executive Officer
                  </h3>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                    Office: {selectedAppointmentForRemoval.officeTitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAppointmentForRemoval(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-black text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-900 rounded-2xl text-xs space-y-2 text-rose-950 dark:text-rose-200">
                <div className="font-black text-sm text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Tenure End / Removal Confirmation
                </div>
                <p>
                  Removing <strong className="text-slate-900 dark:text-white">{selectedAppointmentForRemoval.officerName}</strong> will revert their role back to standard <strong className="uppercase">Member</strong> permissions.
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  Their savings balance, loan records, and wallet history will remain completely untouched.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-200 block">
                  Removal End Date *
                </label>
                <input
                  type="date"
                  value={removalEndDate}
                  onChange={(e) => setRemovalEndDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 dark:text-slate-200 block">
                  Reason for Removal / Handover *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tenure Expiration / Resignation / Reorganization"
                  value={removalReason}
                  onChange={(e) => setRemovalReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedAppointmentForRemoval(null)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleExecuteRemoval}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? 'Processing Removal...' : 'Confirm Officer Removal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
