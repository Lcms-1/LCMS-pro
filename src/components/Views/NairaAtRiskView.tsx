import React, { useState, useMemo, useEffect } from 'react';
import {
  Calculator,
  Search,
  Calendar,
  Filter,
  Printer,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  PiggyBank,
  Users,
  Award,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
  ShieldAlert,
  Edit,
  Trash2,
  RefreshCw,
  Info,
  DollarSign,
  Briefcase,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import {
  User,
  UserRole,
  SavingsDeposit,
  NairaAtRiskMemberRecord,
  NairaAtRiskSummaryStats,
  MonthlyNairaAtRiskReport,
  AuditLog,
} from '../../types';
import { AlertMessage } from '../AlertMessage';
import { CoopLogo } from '../CoopLogo';
import { apiUrl } from '../../utils/apiClient';

interface NairaAtRiskViewProps {
  currentUser?: User;
  users?: User[];
  deposits?: SavingsDeposit[];
  onRefreshData?: () => void;
}

export const NairaAtRiskView: React.FC<NairaAtRiskViewProps> = ({
  currentUser,
  users = [],
  deposits = [],
  onRefreshData,
}) => {
  const userRole = currentUser?.role || 'sys_admin';
  const isPrivilegedOfficer = ['sys_admin', 'financial_secretary', 'chairman'].includes(userRole);

  // Accounting Year state
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // View sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<
    'member_roster' | 'monthly_report' | 'cooperative_summary' | 'audit_trail'
  >('member_roster');

  // API / Local calculated data states
  const [summaryStats, setSummaryStats] = useState<NairaAtRiskSummaryStats | null>(null);
  const [memberRecords, setMemberRecords] = useState<NairaAtRiskMemberRecord[]>([]);
  const [monthlyBreakdown, setMonthlyBreakdown] = useState<MonthlyNairaAtRiskReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Search, Filter & Sort states
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [branchFilter, setBranchFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'nairaAtRisk' | 'savings' | 'name' | 'percentage'>('nairaAtRisk');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modal states
  const [selectedMember, setSelectedMember] = useState<NairaAtRiskMemberRecord | null>(null);
  const [isMemberDetailModalOpen, setIsMemberDetailModalOpen] = useState<boolean>(false);
  const [isEditDepositModalOpen, setIsEditDepositModalOpen] = useState<boolean>(false);
  const [isReverseDepositModalOpen, setIsReverseDepositModalOpen] = useState<boolean>(false);
  const [targetDeposit, setTargetDeposit] = useState<any>(null);

  // Edit Deposit Form state
  const [editForm, setEditForm] = useState({
    amount: '',
    depositDate: '',
    paymentMethod: 'Bank Transfer',
    referenceNumber: '',
    notes: '',
  });

  // Reversal Form state
  const [reverseReason, setReverseReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch report data from API
  const fetchNairaAtRiskReport = async () => {
    setIsLoading(true);
    try {
      const url = currentUser?.role === 'member'
        ? `/api/naira-at-risk?year=${selectedYear}&memberNo=${encodeURIComponent(currentUser.memberNo)}`
        : `/api/naira-at-risk?year=${selectedYear}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setSummaryStats(data.summary);
        setMemberRecords(data.memberRecords || []);
        setMonthlyBreakdown(data.monthlyBreakdown || []);
        setAuditLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error('Error loading Naira At Risk data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNairaAtRiskReport();
  }, [selectedYear, currentUser?.memberNo, currentUser?.role]);

  // Format Currency Helper
  const formatNaira = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format Large Number for Naira-Days
  const formatNairaDays = (val: number) => {
    if (val >= 1_000_000_000) {
      return `₦${(val / 1_000_000_000).toFixed(2)} Billion-Days`;
    }
    if (val >= 1_000_000) {
      return `₦${(val / 1_000_000).toFixed(2)} Million-Days`;
    }
    return `₦${val.toLocaleString()} Days`;
  };

  // Filtered & Sorted Roster
  const filteredRoster = useMemo(() => {
    let list = [...memberRecords];

    if (!isPrivilegedOfficer && currentUser?.memberNo) {
      list = list.filter((r) => r.memberNo.toLowerCase() === currentUser.memberNo.toLowerCase());
    }

    if (statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter);
    }

    if (branchFilter !== 'all') {
      list = list.filter((r) => r.branch === branchFilter);
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (r) =>
          r.memberName.toLowerCase().includes(q) ||
          r.memberNo.toLowerCase().includes(q) ||
          r.branch.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (sortBy === 'nairaAtRisk') {
        valA = a.totalNairaAtRisk;
        valB = b.totalNairaAtRisk;
      } else if (sortBy === 'savings') {
        valA = a.totalSavings;
        valB = b.totalSavings;
      } else if (sortBy === 'name') {
        valA = a.memberName.toLowerCase();
        valB = b.memberName.toLowerCase();
      } else if (sortBy === 'percentage') {
        valA = a.percentageShare;
        valB = b.percentageShare;
      }

      if (typeof valA === 'string') {
        return sortOrder === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
      }
      return sortOrder === 'desc' ? valB - valA : valA - valB;
    });

    return list;
  }, [memberRecords, searchTerm, statusFilter, branchFilter, sortBy, sortOrder, isPrivilegedOfficer, currentUser]);

  // Handle Savings Deposit Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDeposit) return;

    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch(apiUrl(`/api/savings/${targetDeposit.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(editForm.amount),
          depositDate: editForm.depositDate,
          paymentMethod: editForm.paymentMethod,
          referenceNumber: editForm.referenceNumber,
          notes: editForm.notes,
          actorName: currentUser?.fullName || 'Financial Secretary',
          actorId: currentUser?.id || 'usr_finsec01',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackMessage({ type: 'success', text: data.message });
        setIsEditDepositModalOpen(false);
        setTargetDeposit(null);
        fetchNairaAtRiskReport();
        if (onRefreshData) onRefreshData();
      } else {
        setFeedbackMessage({ type: 'error', text: data.error || 'Failed to update savings deposit.' });
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Network or server error updating savings deposit.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Savings Deposit Reversal Submit
  const handleReverseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDeposit) return;

    setIsSubmitting(true);
    setFeedbackMessage(null);

    try {
      const res = await fetch(apiUrl(`/api/savings/${targetDeposit.id}`), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reverseReason,
          actorName: currentUser?.fullName || 'Financial Secretary',
          actorId: currentUser?.id || 'usr_finsec01',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFeedbackMessage({ type: 'success', text: data.message });
        setIsReverseDepositModalOpen(false);
        setTargetDeposit(null);
        setReverseReason('');
        fetchNairaAtRiskReport();
        if (onRefreshData) onRefreshData();
      } else {
        setFeedbackMessage({ type: 'error', text: data.error || 'Failed to reverse deposit.' });
      }
    } catch (err) {
      setFeedbackMessage({ type: 'error', text: 'Network or server error reversing deposit.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export to Excel (CSV format)
  const handleExportExcel = () => {
    const headers = ['Member Name', 'Membership No', 'Branch', 'Status', 'Total Savings (NGN)', 'Days Remaining Weighted Naira At Risk', 'Percentage Share (%)', 'Savings Deposits Count', 'Estimated Dividend Status'];
    const rows = filteredRoster.map((m) => [
      `"${m.memberName.replace(/"/g, '""')}"`,
      `"${m.memberNo}"`,
      `"${m.branch}"`,
      `"${m.status.toUpperCase()}"`,
      m.totalSavings,
      m.totalNairaAtRisk,
      `${m.percentageShare.toFixed(4)}%`,
      m.depositCount,
      `"${m.estimatedDividendStatus}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Lightway_Coop_Naira_At_Risk_Report_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print Report Handler
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Alert Feedback Message */}
      {feedbackMessage && (
        <AlertMessage
          type={feedbackMessage.type}
          message={feedbackMessage.text}
          onClose={() => setFeedbackMessage(null)}
        />
      )}

      {/* Module Header & Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-emerald-950 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 translate-x-10 -translate-y-10 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -translate-x-10 translate-y-10 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold uppercase tracking-wider">
              <Calculator className="w-3.5 h-3.5 text-emerald-400" />
              LCMS PRO Dividend Preparation & Weighted Savings Engine
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
              Naira At Risk Report <span className="text-amber-400 text-lg font-bold">({selectedYear} Accounting Year)</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Every savings deposit is weighted according to the exact number of days remaining in the accounting year (Jan 1 to Dec 31). This computes each member's equitable risk exposure for surplus dividend distribution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Accounting Year Selector */}
            <div className="bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-400 ml-1" />
              <span className="text-xs font-semibold text-slate-200">Accounting Year:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="bg-slate-900 text-white font-bold text-xs rounded-xl px-3 py-1.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
              >
                <option value={2026}>2026 (Current Year)</option>
                <option value={2025}>2025 (Prior Year)</option>
                <option value={2024}>2024 (Historical)</option>
              </select>
            </div>

            {/* Print & Export Buttons */}
            {isPrivilegedOfficer && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportExcel}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4" /> Export Excel
                </button>
                <button
                  onClick={handlePrintReport}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700"
                >
                  <Printer className="w-4 h-4 text-slate-300" /> Print / PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cooperative Savings */}
        <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-2 hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span>Cooperative Total Savings</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">
            {formatNaira(summaryStats?.totalCooperativeSavings || 0)}
          </div>
          <p className="text-[11px] text-gray-500 flex items-center gap-1">
            <Users className="w-3.5 h-3.5 text-emerald-600" /> {summaryStats?.membersWithSavingsCount || 0} active depositors
          </p>
        </div>

        {/* Total Cooperative Naira At Risk */}
        <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-2 hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span>Cooperative Naira At Risk</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Calculator className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-950">
            {formatNairaDays(summaryStats?.totalCooperativeNairaAtRisk || 0)}
          </div>
          <p className="text-[11px] text-indigo-700 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Days remaining weighted sum
          </p>
        </div>

        {/* Total Savings Transactions */}
        <div className="p-5 bg-white rounded-2xl border border-gray-200 shadow-xs space-y-2 hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span>Total Savings Postings</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-gray-900">
            {summaryStats?.totalTransactionsCount || 0} Deposits
          </div>
          <p className="text-[11px] text-amber-800 font-medium">
            Avg Member Risk: {formatNairaDays(summaryStats?.averageMemberNairaAtRisk || 0)}
          </p>
        </div>

        {/* Dividend Preparation Pool Status */}
        <div className="p-5 bg-emerald-900 text-white rounded-2xl border border-emerald-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-300 uppercase tracking-wider">
            <span>Estimated Dividend</span>
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-base font-black text-amber-300 flex items-center gap-1">
            Pending AGM Approval
          </div>
          <p className="text-[11px] text-emerald-200 leading-tight">
            Data prepared for Dividend Engine. Final declaration pending Annual General Meeting.
          </p>
        </div>
      </div>

      {/* Main Navigation Sub-Tabs */}
      <div className="border-b border-gray-200 bg-white rounded-t-2xl px-6 pt-4 shadow-xs">
        <div className="flex flex-wrap gap-4 -mb-px">
          <button
            onClick={() => setActiveSubTab('member_roster')}
            className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'member_roster'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            {isPrivilegedOfficer ? 'Member Naira At Risk Roster' : 'My Personal Naira At Risk'}
          </button>

          {isPrivilegedOfficer && (
            <>
              <button
                onClick={() => setActiveSubTab('monthly_report')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  activeSubTab === 'monthly_report'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Calendar className="w-4 h-4" />
                Monthly Weighting Report
              </button>

              <button
                onClick={() => setActiveSubTab('cooperative_summary')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  activeSubTab === 'cooperative_summary'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                Cooperative Summary
              </button>

              <button
                onClick={() => setActiveSubTab('audit_trail')}
                className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  activeSubTab === 'audit_trail'
                    ? 'border-emerald-600 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <FileText className="w-4 h-4" />
                Audit Trail Logs ({auditLogs.length})
              </button>
            </>
          )}
        </div>
      </div>

      {/* SUB-TAB 1: MEMBER ROSTER TABLE */}
      {activeSubTab === 'member_roster' && (
        <div className="bg-white rounded-b-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/80 p-4 rounded-xl border border-gray-200">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search member name or membership number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <Filter className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-gray-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Members</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="flex items-center gap-1.5 text-xs text-gray-600">
                <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white border border-gray-300 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="nairaAtRisk">Sort by Naira At Risk</option>
                  <option value="savings">Sort by Total Savings</option>
                  <option value="percentage">Sort by Percentage Share</option>
                  <option value="name">Sort by Member Name</option>
                </select>

                <button
                  onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                  className="px-2 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100"
                  title="Toggle Ascending/Descending"
                >
                  {sortOrder === 'desc' ? 'DESC ↓' : 'ASC ↑'}
                </button>
              </div>
            </div>
          </div>

          {/* Member Roster Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100/80 text-gray-700 uppercase font-bold text-[11px] border-b border-gray-200">
                  <th className="py-3.5 px-4">Member Name & No.</th>
                  <th className="py-3.5 px-4">Branch</th>
                  <th className="py-3.5 px-4 text-right">Total Savings</th>
                  <th className="py-3.5 px-4 text-right">Naira At Risk (Days Weighted)</th>
                  <th className="py-3.5 px-4 text-center">Percentage Share</th>
                  <th className="py-3.5 px-4 text-center">Txns</th>
                  <th className="py-3.5 px-4 text-center">Estimated Dividend</th>
                  <th className="py-3.5 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                      Computing Naira At Risk formulas across active savings deposits...
                    </td>
                  </tr>
                ) : filteredRoster.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-500">
                      No member records matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRoster.map((record) => (
                    <tr key={record.memberId} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{record.memberName}</div>
                        <div className="text-[11px] text-gray-500 font-mono">{record.memberNo}</div>
                      </td>

                      <td className="py-3.5 px-4 text-gray-600">{record.branch}</td>

                      <td className="py-3.5 px-4 text-right font-bold text-gray-900">
                        {formatNaira(record.totalSavings)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-indigo-950">
                        {record.totalSavings === 0 ? (
                          <span className="text-gray-400 font-normal">₦0</span>
                        ) : (
                          formatNairaDays(record.totalNairaAtRisk)
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-1 rounded-full font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 text-[11px]">
                          {record.percentageShare.toFixed(4)}%
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-bold text-gray-700">
                        {record.depositCount}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          Pending AGM Approval
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedMember(record);
                            setIsMemberDetailModalOpen(true);
                          }}
                          className="px-3 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold text-[11px] rounded-lg transition-all"
                        >
                          View Breakdown
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: MONTHLY BREAKDOWN REPORT */}
      {activeSubTab === 'monthly_report' && isPrivilegedOfficer && (
        <div className="bg-white rounded-b-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" /> Monthly Deposit Weighting & Risk Contribution
              </h3>
              <p className="text-xs text-gray-500">
                Breaks down savings deposits by month of origin in {selectedYear}. Deposits made early in January carry maximum weight (365 days).
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-700 uppercase font-bold text-[11px]">
                  <th className="py-3.5 px-4">Month</th>
                  <th className="py-3.5 px-4 text-center">Deposit Count</th>
                  <th className="py-3.5 px-4 text-right">Total Deposit Volume</th>
                  <th className="py-3.5 px-4 text-center">Avg Days Remaining</th>
                  <th className="py-3.5 px-4 text-right">Monthly Naira At Risk</th>
                  <th className="py-3.5 px-4 text-center">% of Annual Pool</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {monthlyBreakdown.map((mb) => (
                  <tr key={mb.monthIndex} className="hover:bg-gray-50">
                    <td className="py-3 px-4 font-bold text-gray-900">{mb.monthName}</td>
                    <td className="py-3 px-4 text-center font-bold text-gray-700">{mb.depositCount}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-700">
                      {formatNaira(mb.totalDepositAmount)}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-gray-600">
                      {mb.averageDaysRemaining} Days
                    </td>
                    <td className="py-3 px-4 text-right font-black text-indigo-950">
                      {formatNairaDays(mb.monthlyNairaAtRisk)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[100px] mx-auto overflow-hidden">
                        <div
                          className="bg-emerald-600 h-2.5 rounded-full"
                          style={{ width: `${Math.min(100, mb.percentageOfAnnualNairaAtRisk)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-gray-600 mt-1 block">
                        {mb.percentageOfAnnualNairaAtRisk}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: COOPERATIVE SUMMARY */}
      {activeSubTab === 'cooperative_summary' && isPrivilegedOfficer && (
        <div className="bg-white rounded-b-2xl border border-gray-200 p-6 space-y-6 shadow-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 space-y-3">
              <h4 className="font-bold text-emerald-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" /> Mathematical Formula Verification
              </h4>
              <p className="text-xs text-emerald-800 leading-relaxed">
                Naira At Risk represents the time-value weight of cooperative savings capital. A deposit made on January 1st generates 365 days of liquidity for the society, while a deposit on December 31st generates 1 day of liquidity.
              </p>
              <div className="p-3 bg-white/80 rounded-xl border border-emerald-200 text-xs font-mono text-emerald-950">
                Formula: Deposit Amount × Days Remaining in Accounting Year (Dec 31)
              </div>
            </div>

            <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-200 space-y-3">
              <h4 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-indigo-600" /> Dividend Distribution Readiness
              </h4>
              <p className="text-xs text-indigo-800 leading-relaxed">
                When the Executive Committee and Annual General Meeting declare surplus profits, dividend payouts will be multiplied directly against each member's Percentage Share of total Naira At Risk.
              </p>
              <div className="p-3 bg-white/80 rounded-xl border border-indigo-200 text-xs font-bold text-indigo-950">
                Status: Data Prepared • Pending AGM Dividend Declaration
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: AUDIT TRAIL LOGS */}
      {activeSubTab === 'audit_trail' && isPrivilegedOfficer && (
        <div className="bg-white rounded-b-2xl border border-gray-200 p-6 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div>
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" /> Savings & Naira At Risk Audit Logs
              </h3>
              <p className="text-xs text-gray-500">
                Mandatory audit trail recording Date, Time, User, Action, Previous Value, and New Value for all savings postings, edits, and reversals.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-100 text-gray-700 uppercase font-bold text-[11px]">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">User Officer</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Details & Audit Trail Values</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500">
                      No audit logs recorded for this module.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 whitespace-nowrap text-gray-600">{log.timestamp}</td>
                      <td className="py-3 px-4 font-bold text-gray-900">
                        {log.actorName} <span className="text-[10px] text-gray-500 font-normal">({log.role})</span>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-700">{log.action}</td>
                      <td className="py-3 px-4 text-gray-800 leading-relaxed">{log.details}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: MEMBER BREAKDOWN MODAL */}
      {isMemberDetailModalOpen && selectedMember && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-emerald-600" /> Member Deposit Weight Breakdown
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedMember.memberName} ({selectedMember.memberNo}) • {selectedMember.branch}
                </p>
              </div>
              <button
                onClick={() => setIsMemberDetailModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Member Card Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 text-xs">
              <div>
                <span className="text-gray-500 block text-[11px]">Total Savings</span>
                <span className="font-bold text-emerald-900 text-sm">{formatNaira(selectedMember.totalSavings)}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px]">Naira At Risk</span>
                <span className="font-black text-indigo-950 text-sm">{formatNairaDays(selectedMember.totalNairaAtRisk)}</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px]">Coop Percentage</span>
                <span className="font-bold text-indigo-700">{selectedMember.percentageShare.toFixed(4)}%</span>
              </div>
              <div>
                <span className="text-gray-500 block text-[11px]">Dividend Status</span>
                <span className="font-bold text-amber-800 text-[10px]">Pending AGM</span>
              </div>
            </div>

            {/* Deposits List */}
            <div className="space-y-2">
              <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
                Individual Savings Postings ({selectedMember.deposits.length})
              </h4>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700 uppercase font-bold text-[10px]">
                      <th className="py-2.5 px-3">Deposit Date</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-center">Days Remaining</th>
                      <th className="py-2.5 px-3 text-right">Weighted Risk</th>
                      {isPrivilegedOfficer && <th className="py-2.5 px-3 text-center">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedMember.deposits.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-gray-500">
                          No savings deposits recorded for this member.
                        </td>
                      </tr>
                    ) : (
                      selectedMember.deposits.map((dep) => (
                        <tr key={dep.id} className="hover:bg-gray-50">
                          <td className="py-2.5 px-3 font-semibold text-gray-900">{dep.depositDate}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-800">
                            {formatNaira(dep.amount)}
                          </td>
                          <td className="py-2.5 px-3 text-center font-semibold text-gray-600">
                            {dep.daysRemaining} Days
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-indigo-950">
                            {formatNairaDays(dep.nairaAtRisk)}
                          </td>

                          {isPrivilegedOfficer && (
                            <td className="py-2.5 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => {
                                    setTargetDeposit(dep);
                                    setEditForm({
                                      amount: String(dep.amount),
                                      depositDate: dep.depositDate,
                                      paymentMethod: 'Bank Transfer',
                                      referenceNumber: '',
                                      notes: '',
                                    });
                                    setIsEditDepositModalOpen(true);
                                  }}
                                  className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                  title="Edit Deposit"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setTargetDeposit(dep);
                                    setIsReverseDepositModalOpen(true);
                                  }}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                                  title="Reverse Deposit"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-gray-200">
              <button
                onClick={() => setIsMemberDetailModalOpen(false)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SAVINGS DEPOSIT MODAL */}
      {isEditDepositModalOpen && targetDeposit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleEditSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" /> Edit Savings Deposit Record
              </h3>
              <button
                type="button"
                onClick={() => setIsEditDepositModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Deposit Amount (NGN) *</label>
                <input
                  type="number"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Deposit Date *</label>
                <input
                  type="date"
                  value={editForm.depositDate}
                  onChange={(e) => setEditForm({ ...editForm, depositDate: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsEditDepositModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                {isSubmitting ? 'Saving...' : 'Save & Recalculate'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: REVERSE SAVINGS DEPOSIT MODAL */}
      {isReverseDepositModalOpen && targetDeposit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleReverseSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <h3 className="text-base font-bold text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" /> Reverse Savings Deposit
              </h3>
              <button
                type="button"
                onClick={() => setIsReverseDepositModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
              <span className="font-bold">Warning:</span> Reversing this deposit of <strong>{formatNaira(targetDeposit.amount)}</strong> will immediately subtract it from the member's passbook balance and trigger an automatic real-time recalculation of total Cooperative Naira At Risk.
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Reversal *</label>
              <textarea
                rows={2}
                placeholder="Enter financial justification for reversing this deposit..."
                value={reverseReason}
                onChange={(e) => setReverseReason(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setIsReverseDepositModalOpen(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 font-medium text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                {isSubmitting ? 'Reversing...' : 'Confirm Reversal'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
